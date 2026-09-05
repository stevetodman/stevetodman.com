export const EVIDENCE_VERSION = 2;
export const DAY_MS = 86400000;
export const RETRIEVAL_INTERVAL_DAYS = Object.freeze([3, 7, 14, 30]);
export const TRANSFER_KINDS = Object.freeze(["routine", "near", "representation", "context"]);

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}

export function stableHash(value) {
  const text = JSON.stringify(stable(value));
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function targetForAttempt(attempt) {
  return attempt?.target || attempt?.micro || null;
}

export function questionFingerprint(question) {
  return stableHash({ target: question.target || question.micro, familyId: question.familyId || question.assessmentArchetype || question.micro, audit: question.audit, representation: question.representation || "symbolic", contextStructure: question.contextStructure || "none" });
}

export function enrichQuestion(question, { sessionId, ordinal, seed }) {
  const target = question.target || question.micro;
  return { ...question, target, familyId: question.familyId || question.assessmentArchetype || question.micro, representation: question.representation || "symbolic", contextStructure: question.contextStructure || "none", transferKind: TRANSFER_KINDS.includes(question.transferKind) ? question.transferKind : "routine", itemVersion: Number(question.itemVersion) || 1, seed, questionId: `${sessionId}-q${ordinal}`, fingerprint: questionFingerprint(question) };
}

export function independentAttempts(profile, selector = () => true) {
  return (profile?.attempts || []).filter(attempt => !attempt.assisted && !attempt.repairOnly && selector(attempt)).sort((a, b) => (Number(a.at) || 0) - (Number(b.at) || 0));
}

export function latestInstructionAt(profile, target, before = Infinity) {
  return (profile?.attempts || []).reduce((latest, attempt) => {
    if (targetForAttempt(attempt) !== target || Number(attempt.at) >= before) return latest;
    const instruction = Math.max(Number(attempt.instructionAt) || 0, Number(attempt.reviewedAt) || 0, attempt.assisted ? Number(attempt.at) || 0 : 0);
    return Math.max(latest, instruction);
  }, 0);
}

export function isColdProof(attempt, profile) {
  if (!attempt || attempt.assisted || attempt.repairOnly || attempt.scaffoldShown || Number(attempt.evidenceVersion) < EVIDENCE_VERSION) return false;
  const at = Number(attempt.at) || 0;
  const instruction = Math.max(Number(attempt.instructionAt) || 0, latestInstructionAt(profile, targetForAttempt(attempt), at));
  const repeated = !!attempt.fingerprint && (profile?.attempts || []).some(previous => previous !== attempt && !previous.assisted && !previous.repairOnly && previous.fingerprint === attempt.fingerprint && Number(previous.at) < at && at - Number(previous.at) < 7 * DAY_MS);
  return !repeated && (!instruction || at - instruction >= DAY_MS);
}

export function scoreEvidence(profile, target, limit = 12) {
  const attempts = independentAttempts(profile, attempt => targetForAttempt(attempt) === target);
  const kept = [];
  for (const attempt of attempts) {
    if (attempt.fingerprint && kept.some(previous => previous.fingerprint === attempt.fingerprint && Number(attempt.at) - Number(previous.at) < 7 * DAY_MS)) continue;
    kept.push(attempt);
  }
  return kept.slice(-limit);
}

export function scoreEvidenceForMicro(profile, micro, limit = 12) {
  const attempts = independentAttempts(profile, attempt => attempt.micro === micro), kept = [];
  for (const attempt of attempts) {
    if (attempt.fingerprint && kept.some(previous => previous.fingerprint === attempt.fingerprint && Number(attempt.at) - Number(previous.at) < 7 * DAY_MS)) continue;
    kept.push(attempt);
  }
  return kept.slice(-limit);
}

export function retrievalState(profile, target, now = Date.now()) {
  const all = (profile?.attempts || []).filter(attempt => targetForAttempt(attempt) === target).sort((a, b) => (Number(a.at) || 0) - (Number(b.at) || 0));
  const sampled = all.some(attempt => !attempt.assisted && !attempt.repairOnly);
  let stage = -1, dueAt = 0, lastCold = null, openFailure = null;
  for (const attempt of all) {
    const at = Number(attempt.at) || 0;
    if (attempt.assisted || attempt.repairOnly) { if (openFailure) dueAt = Math.max(dueAt, at + DAY_MS); continue; }
    if (!attempt.correct) { openFailure = attempt; stage = -1; dueAt = at + DAY_MS; continue; }
    if (!isColdProof(attempt, profile) || Number(attempt.difficulty) < 2) continue;
    if (openFailure || !lastCold) { openFailure = null; stage = 0; dueAt = at + RETRIEVAL_INTERVAL_DAYS[stage] * DAY_MS; lastCold = attempt; }
    else if (at >= dueAt) { stage = Math.min(RETRIEVAL_INTERVAL_DAYS.length - 1, stage + 1); dueAt = at + RETRIEVAL_INTERVAL_DAYS[stage] * DAY_MS; lastCold = attempt; }
  }
  if (openFailure) return { state: "relearning", stage, dueAt, lastCold, openFailure };
  if (!lastCold) return { state: sampled ? "refresh_due" : "unknown", stage: -1, dueAt: 0, lastCold: null, openFailure: null };
  return { state: now >= dueAt ? "refresh_due" : "ready", stage, dueAt, lastCold, openFailure: null };
}

export function masteryEvidence(profile, micro) {
  const evidence = independentAttempts(profile, attempt => attempt.micro === micro && isColdProof(attempt, profile));
  const latest = evidence.slice(-6);
  const correct = latest.filter(attempt => attempt.correct);
  const correctAll = evidence.filter(attempt => attempt.correct);
  const families = new Set(correctAll.map(attempt => attempt.familyId).filter(Boolean));
  const days = new Set(correctAll.map(attempt => attempt.date).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)));
  const span = correctAll.length >= 2 ? Math.max(...correctAll.map(a => Number(a.at) || 0)) - Math.min(...correctAll.map(a => Number(a.at) || 0)) : 0;
  const transfer = correctAll.some(attempt => ["near", "representation", "context"].includes(attempt.transferKind));
  const advanced = correctAll.filter(attempt => Number(attempt.difficulty) >= 3).length;
  const atLeastTwoLevel2 = correctAll.filter(attempt => Number(attempt.difficulty) >= 2).length >= 2;
  const latestTwoCorrect = latest.length >= 2 && latest.slice(-2).every(attempt => attempt.correct);
  const openFailure = retrievalState(profile, micro).state === "relearning";
  return { established: latest.length === 6 && correct.length >= 5 && latestTwoCorrect && days.size >= 2 && span >= DAY_MS && atLeastTwoLevel2 && advanced >= 1 && families.size >= 2 && transfer && !openFailure, opportunities: evidence.length, correct: correctAll.length, families: families.size, days: days.size, transfer, advanced, latestTwoCorrect, openFailure };
}
