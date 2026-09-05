import { DOMAIN_MICROS } from "./mission1-content.mjs?v=20260905-validity1";
import { DIVISION_TARGETS, divisionReadiness, divisionTargetStats, targetForArchetype } from "./mission1-division-assessment.mjs?v=20260905-validity1";
import { DAY_MS, masteryEvidence, retrievalState, scoreEvidenceForMicro, targetForAttempt } from "./mission1-evidence.mjs?v=20260905-validity1";
import { TEACHER_WEEK } from "./teacher-week.mjs?v=20260905-validity1";

export const DIAGNOSTIC_VERSION = 3;
export const RECHECK_VERSION = 2;
export const PRACTICE_TARGET = 10;
export const PRACTICE_MAX = 10;
export const CURRENT_WEEK_MICROS = [...TEACHER_WEEK.currentMicros];
export const REVIEW_MICROS = [...TEACHER_WEEK.supportMicros];
export const SESSION_LANES = Object.freeze(["focus", "focus", "maintenance", "focus", "retrieval", "focus", "focus", "maintenance", "focus", "retrieval"]);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function microScore(profile, micro) {
  let score = 40;
  for (const attempt of scoreEvidenceForMicro(profile, micro, 12)) {
    const difficulty = clamp(Number(attempt.difficulty) || 1, 1, 3);
    score = clamp(score + (attempt.correct ? 5 + difficulty * 2 : -10), 0, 100);
  }
  return Math.round(score);
}

export function difficultyForScore(score) { return score < 45 ? 1 : score < 75 ? 2 : 3; }

function oldScore(attempts) {
  let score = 40;
  for (const attempt of attempts.slice(-12)) {
    const difficulty = clamp(Number(attempt.difficulty) || 1, 1, 3);
    score += attempt.assisted ? (attempt.correct ? 2 : -3) : (attempt.correct ? 5 + difficulty * 2 : -(9 + difficulty * 2));
    score = clamp(score, 0, 100);
  }
  return Math.round(score);
}

function legacyMastered(profile, micro) {
  const attempts = (profile?.attempts || []).filter(attempt => attempt.micro === micro && Number(attempt.evidenceVersion) < 2).sort((a, b) => (Number(a.at) || 0) - (Number(b.at) || 0));
  for (let length = 1; length <= attempts.length; length += 1) {
    const prefix = attempts.slice(0, length), independent = prefix.filter(attempt => !attempt.assisted), correct = independent.filter(attempt => attempt.correct), days = new Set(correct.map(attempt => attempt.date).filter(Boolean)), advanced = correct.filter(attempt => Number(attempt.difficulty) >= 3).length;
    if (oldScore(prefix) >= 85 && independent.length >= 4 && advanced >= 1 && days.size >= 2) return true;
  }
  return false;
}

function divisionEstablished(profile) {
  const broad = masteryEvidence(profile, "decimal_divide");
  const coverage = DIVISION_TARGETS.map(target => divisionTargetStats(profile, target));
  return broad.opportunities >= 6 && broad.latestTwoCorrect && broad.days >= 2 && broad.advanced >= 1 && broad.families >= 2 && broad.transfer && coverage.every(item => item.coverage && item.state !== "relearning");
}

export function microStats(profile, micro, options = {}) {
  const independent = (profile?.attempts || []).filter(attempt => attempt.micro === micro && !attempt.assisted && !attempt.repairOnly);
  const correct = independent.filter(attempt => attempt.correct), days = new Set(correct.map(attempt => attempt.date).filter(Boolean)), advanced = correct.filter(attempt => Number(attempt.difficulty) >= 3).length;
  const earned = !!profile?.masteryAwards?.[micro] || legacyMastered(profile, micro) || (micro === "decimal_divide" ? divisionEstablished(profile) : masteryEvidence(profile, micro).established);
  let readiness;
  if (micro === "decimal_divide") {
    const division = divisionReadiness(profile, options), states = division.skills.map(item => item.state);
    readiness = states.includes("relearning") ? "relearning" : states.includes("unknown") ? "unknown" : states.includes("refresh_due") ? "refresh_due" : "ready";
  } else readiness = retrievalState(profile, micro, Number(options.now) || Date.now()).state;
  return { score: microScore(profile, micro), attempts: independent.length, correct: correct.length, days: days.size, advanced, mastered: earned, readiness };
}

export function updateMasteryAwards(profile, now = Date.now()) {
  profile.masteryAwards = profile.masteryAwards && typeof profile.masteryAwards === "object" ? profile.masteryAwards : {};
  for (const micro of [...CURRENT_WEEK_MICROS, ...REVIEW_MICROS]) {
    if (!profile.masteryAwards[micro] && (legacyMastered(profile, micro) || (micro === "decimal_divide" ? divisionEstablished(profile) : masteryEvidence(profile, micro).established))) profile.masteryAwards[micro] = now;
  }
  return profile.masteryAwards;
}

export function domainStats(profile, skill) {
  const stats = DOMAIN_MICROS[skill].map(micro => microStats(profile, micro));
  return { score: Math.round(stats.reduce((sum, item) => sum + item.score, 0) / stats.length), mastered: stats.filter(item => item.mastered).length, total: stats.length };
}

export function migrateAffectedRechecks(profile) {
  if (!profile || Number(profile.recheckVersion) >= RECHECK_VERSION) return false;
  profile.rechecks = profile.rechecks && typeof profile.rechecks === "object" ? profile.rechecks : {};
  for (const micro of CURRENT_WEEK_MICROS) {
    const attempts = (profile.attempts || []).filter(attempt => attempt.micro === micro);
    if (attempts.length && !attempts.some(attempt => attempt.recheck && !attempt.assisted)) profile.rechecks[micro] = { version: RECHECK_VERSION, status: "pending" };
  }
  profile.recheckVersion = RECHECK_VERSION;
  return true;
}
export function pendingRechecks(profile) { return CURRENT_WEEK_MICROS.filter(micro => profile?.rechecks?.[micro]?.status === "pending"); }

function candidateFor(profile, micro, target, lane, options, order) {
  const now = Number(options.now) || Date.now();
  const targetStats = micro === "decimal_divide" ? divisionTargetStats(profile, target, { now }) : { ...retrievalState(profile, target, now), score: microScore(profile, micro), cold: masteryEvidence(profile, micro).opportunities };
  const independent = (profile?.attempts || []).filter(attempt => !attempt.assisted && !attempt.repairOnly && targetForAttempt(attempt) === target);
  const latest = independent.at(-1)?.at || 0;
  const dueFailure = targetStats.state === "relearning" && targetStats.dueAt <= now;
  const pending = pendingRechecks(profile).includes(micro);
  const klass = dueFailure ? 0 : pending || targetStats.state === "unknown" ? 1 : targetStats.state === "refresh_due" ? 2 : Number(targetStats.cold) < 2 ? 3 : 4;
  const overdueDays = targetStats.dueAt ? Math.max(0, Math.min(30, (now - targetStats.dueAt) / DAY_MS)) : 0;
  return { micro, target, lane, archetype: null, score: Number(targetStats.score) || microScore(profile, micro), cold: Number(targetStats.cold) || 0, latest, klass, overdueDays, order };
}

const TARGET_ARCHETYPE = Object.freeze({ division_unit_structure: "division_units", division_scale_relation: "division_scale_relation", division_reasonableness: "division_reasonableness", division_model: "division_model", division_algorithm: "division_algorithm", division_regroup: "division_regroup", division_error_analysis: "division_error_analysis", division_context: "division_word_one_step", division_multistep: "division_multistep", tape_diagram_transfer: "tape_diagram_transfer", metric_embedded: "metric_embedded" });

function laneCandidates(profile, lane, options) {
  const focus = DIVISION_TARGETS.map((target, index) => candidateFor(profile, "decimal_divide", target, "focus", options, index));
  focus.forEach(candidate => { candidate.archetype = TARGET_ARCHETYPE[candidate.target]; });
  const maintenance = TEACHER_WEEK.maintenanceMicros.map((micro, index) => candidateFor(profile, micro, micro, "maintenance", options, index));
  const retrieval = [...TEACHER_WEEK.maintenanceMicros, ...TEACHER_WEEK.supportMicros].map((micro, index) => candidateFor(profile, micro, micro, "retrieval", options, index)).filter(candidate => candidate.klass <= 2 || candidate.latest > 0);
  return lane === "focus" ? focus : lane === "maintenance" ? maintenance : retrieval;
}

export function selectNextTarget(profile, options = {}) {
  const slot = Math.max(0, Number(options.independentCount) || 0), intendedLane = SESSION_LANES[Math.min(slot, SESSION_LANES.length - 1)], failures = options.sessionFailures || {}, recentTargets = options.recentTargets || [], recentMicros = options.recentMicros || [];
  const lanes = [intendedLane, "retrieval", "focus", "maintenance"].filter((lane, index, array) => array.indexOf(lane) === index);
  let candidates = [];
  for (const lane of lanes) {
    candidates = laneCandidates(profile, lane, options).filter(candidate => (Number(failures[candidate.target]) || 0) < 2);
    if (candidates.length) break;
  }
  const priorTarget = recentTargets.at(-1), lastTwoMicros = recentMicros.slice(-2);
  const productive = candidates.filter(candidate => candidate.target !== priorTarget && !(lastTwoMicros.length === 2 && lastTwoMicros.every(micro => micro === candidate.micro)));
  if (productive.length) candidates = productive;
  else {
    const noSameTarget = candidates.filter(candidate => candidate.target !== priorTarget);
    if (noSameTarget.length) candidates = noSameTarget;
  }
  candidates.sort((a, b) => a.klass - b.klass || b.overdueDays - a.overdueDays || a.score - b.score || a.cold - b.cold || a.latest - b.latest || a.order - b.order);
  return candidates[0] || null;
}

export function nextMicro(profile, options = {}) { return selectNextTarget(profile, options)?.micro || CURRENT_WEEK_MICROS[0]; }
export function projectedScore(profile, attempt) {
  const before = microScore(profile, attempt.micro), copy = { ...(profile || {}), attempts: [...(profile?.attempts || []), attempt] };
  return { before, after: microScore(copy, attempt.micro) };
}
export function diagnosticIsCurrent(profile) { return !!profile?.diagnostic; }
