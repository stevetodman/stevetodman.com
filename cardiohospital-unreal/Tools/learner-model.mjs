export const LEARNER_PROFILE_SCHEMA_VERSION = 1;

function clone(value) {
  return structuredClone(value);
}

function average(values) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

export function createLearnerProfile() {
  return {
    schemaVersion: LEARNER_PROFILE_SCHEMA_VERSION,
    attempts: [],
    completedCaseIds: [],
    mastery: {},
  };
}

export function recordAttempt(profile, debrief, concepts, { attemptId, completedAt }) {
  if (profile.schemaVersion !== LEARNER_PROFILE_SCHEMA_VERSION) throw new Error("Unsupported learner profile schema");
  if (typeof attemptId !== "string" || attemptId.length === 0) throw new Error("attemptId is required");
  if (typeof completedAt !== "string" || completedAt.length === 0) throw new Error("completedAt is required");
  if (profile.attempts.some((attempt) => attempt.attemptId === attemptId)) throw new Error(`Duplicate attemptId ${attemptId}`);

  const next = clone(profile);
  const storedAttempt = {
    attemptId,
    caseId: debrief.caseId,
    caseVersion: debrief.caseVersion,
    completedAt,
    diagnosisCorrect: debrief.diagnosisCorrect,
    overallScore: debrief.overallScore,
    dimensions: clone(debrief.dimensions),
    missedOpportunityKeys: debrief.missedOpportunities.map((item) => item.key),
    safetyEventIds: debrief.safetyEvents.map((item) => item.id),
  };
  next.attempts.push(storedAttempt);
  if (!next.completedCaseIds.includes(debrief.caseId)) next.completedCaseIds.push(debrief.caseId);

  const dimensionScores = new Map(debrief.dimensions.map((dimension) => [dimension.id, dimension.score]));
  for (const concept of concepts.filter((entry) => entry.caseIds.includes(debrief.caseId))) {
    const attemptScore = average(concept.dimensionIds.map((id) => dimensionScores.get(id) ?? 0));
    const previous = next.mastery[concept.id] ?? { value: 0, attemptCount: 0, lastAttemptId: "" };
    const attemptCount = previous.attemptCount + 1;
    next.mastery[concept.id] = {
      value: Math.round((previous.value * previous.attemptCount + attemptScore) / attemptCount),
      attemptCount,
      lastAttemptId: attemptId,
    };
  }

  return next;
}

export function masteryLabel(value) {
  if (value <= 0) return "unassessed";
  if (value < 70) return "developing";
  if (value < 88) return "competent";
  return "mastered";
}

export function selectNextCase(profile, document) {
  if (profile.attempts.length === 0) {
    return { caseId: "case-hcm", kind: "first", reason: "The vertical-slice case exercises the complete clinical loop." };
  }

  const last = profile.attempts.at(-1);
  if (last.caseId === "case-hcm" && !profile.completedCaseIds.includes("case-vasovagal")) {
    return { caseId: "case-vasovagal", kind: "contrast", reason: "Contrast mid-exertional HCM syncope with post-exertional vasovagal syncope." };
  }

  const remaining = document.cases.filter((clinicalCase) => !profile.completedCaseIds.includes(clinicalCase.id));
  if (remaining.length > 0) {
    const ranked = remaining.map((clinicalCase, index) => {
      const relevant = document.concepts.filter((concept) => concept.caseIds.includes(clinicalCase.id));
      const assessed = relevant
        .map((concept) => ({ concept, mastery: profile.mastery[concept.id]?.value }))
        .filter((entry) => entry.mastery !== undefined)
        .sort((a, b) => a.mastery - b.mastery || a.concept.id.localeCompare(b.concept.id));
      return { clinicalCase, index, weakest: assessed[0] };
    });
    ranked.sort((a, b) => {
      if (!a.weakest && !b.weakest) return a.index - b.index;
      if (!a.weakest) return 1;
      if (!b.weakest) return -1;
      return a.weakest.mastery - b.weakest.mastery || a.index - b.index;
    });
    const pick = ranked[0];
    if (pick.weakest) {
      return {
        caseId: pick.clinicalCase.id,
        kind: "weakness",
        reason: `Reinforce ${pick.weakest.concept.label} (${masteryLabel(pick.weakest.mastery)}).`,
      };
    }
    return { caseId: pick.clinicalCase.id, kind: "rotation", reason: "Continue the uncompleted clinic rotation." };
  }

  const assessed = document.concepts
    .map((concept) => ({ concept, mastery: profile.mastery[concept.id]?.value ?? 0 }))
    .sort((a, b) => a.mastery - b.mastery || a.concept.id.localeCompare(b.concept.id))[0];
  return {
    caseId: assessed.concept.caseIds[0],
    kind: "spaced-repetition",
    reason: `Revisit ${assessed.concept.label} (${masteryLabel(assessed.mastery)}).`,
  };
}

export function serializeLearnerProfile(profile) {
  if (profile.schemaVersion !== LEARNER_PROFILE_SCHEMA_VERSION) throw new Error("Unsupported learner profile schema");
  return `${JSON.stringify(profile, null, 2)}\n`;
}

export function parseLearnerProfile(serialized) {
  const profile = JSON.parse(serialized);
  if (profile.schemaVersion !== LEARNER_PROFILE_SCHEMA_VERSION) throw new Error("Unsupported learner profile schema");
  if (!Array.isArray(profile.attempts) || !Array.isArray(profile.completedCaseIds) || typeof profile.mastery !== "object") {
    throw new Error("Invalid learner profile");
  }
  return profile;
}
