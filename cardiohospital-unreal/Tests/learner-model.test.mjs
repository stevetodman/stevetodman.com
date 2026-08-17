import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  createLearnerProfile,
  masteryLabel,
  parseLearnerProfile,
  recordAttempt,
  selectNextCase,
  serializeLearnerProfile,
} from "../Tools/learner-model.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, "..", "Content", "Data", "clinical-content.json");

async function loadDocument() {
  return JSON.parse(await readFile(dataPath, "utf8"));
}

function debrief(overrides = {}) {
  return {
    caseId: "case-hcm",
    caseVersion: "1.0",
    diagnosisCorrect: false,
    overallScore: 35,
    dimensions: [
      { id: "history", score: 25 },
      { id: "physicalExamination", score: 0 },
      { id: "redFlagRecognition", score: 0 },
      { id: "testSelection", score: 0 },
      { id: "interpretation", score: 0 },
      { id: "clinicalReasoning", score: 0 },
      { id: "management", score: 0 },
      { id: "communication", score: 75 },
      { id: "efficiency", score: 75 },
      { id: "safety", score: 0 },
    ],
    missedOpportunities: [{ key: "exertional_timing" }],
    safetyEvents: [{ id: "hcm-exercise-restriction" }],
    ...overrides,
  };
}

test("learner profile is identity-free, versioned, and round-trips", () => {
  const profile = createLearnerProfile();
  assert.deepEqual(Object.keys(profile), ["schemaVersion", "attempts", "completedCaseIds", "mastery"]);
  assert.deepEqual(parseLearnerProfile(serializeLearnerProfile(profile)), profile);
});

test("recorded attempts retain content version and update concept mastery", async () => {
  const document = await loadDocument();
  const profile = recordAttempt(createLearnerProfile(), debrief(), document.concepts, {
    attemptId: "attempt-001",
    completedAt: "2026-08-14T15:00:00Z",
  });
  assert.equal(profile.attempts[0].caseVersion, "1.0");
  assert.equal(profile.mastery["exertional-syncope-red-flags"].value, 6);
  assert.equal(masteryLabel(profile.mastery["exertional-syncope-red-flags"].value), "developing");
  assert.throws(
    () => recordAttempt(profile, debrief(), document.concepts, { attemptId: "attempt-001", completedAt: "later" }),
    /Duplicate attemptId/,
  );
});

test("HCM completion deterministically selects the vasovagal contrast case", async () => {
  const document = await loadDocument();
  const profile = recordAttempt(createLearnerProfile(), debrief(), document.concepts, {
    attemptId: "attempt-001",
    completedAt: "2026-08-14T15:00:00Z",
  });
  assert.deepEqual(selectNextCase(profile, document), {
    caseId: "case-vasovagal",
    kind: "contrast",
    reason: "Contrast mid-exertional HCM syncope with post-exertional vasovagal syncope.",
  });
});

test("attempt recording is immutable and deterministic", async () => {
  const document = await loadDocument();
  const original = createLearnerProfile();
  const options = { attemptId: "attempt-001", completedAt: "2026-08-14T15:00:00Z" };
  const first = recordAttempt(original, debrief(), document.concepts, options);
  const second = recordAttempt(original, debrief(), document.concepts, options);
  assert.deepEqual(original, createLearnerProfile());
  assert.deepEqual(first, second);
});
