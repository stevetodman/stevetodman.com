import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createCaseEngine } from "../Tools/case-engine.mjs";
import { evaluateAttempt } from "../Tools/education-engine.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, "..", "Content", "Data", "clinical-content.json");

async function loadDocument() {
  return JSON.parse(await readFile(dataPath, "utf8"));
}

function run(engine, actions) {
  for (const entry of actions) engine.perform(...(Array.isArray(entry) ? entry : [entry]));
}

function evaluate(document, engine) {
  const graph = document.caseGraphs.find((item) => item.caseId === engine.snapshot().caseId);
  const clinicalCase = document.cases.find((item) => item.id === engine.snapshot().caseId);
  return evaluateAttempt({ snapshot: engine.snapshot(), graph, clinicalCase });
}

const OPENING = [
  "system.load",
  "world.enter",
  "navigate.workroom",
  "attending.open-assignment",
  "assignment.accept",
  "navigate.exam-room",
  "encounter.introduce",
];

test("vasovagal contrast case completes with restraint and continued activity", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-vasovagal");
  run(engine, [
    ...OPENING,
    "history.generic",
    "history.exertional-timing",
    "history.prodrome",
    "history.triggers",
    "history.family-sudden-death",
    "history.palpitations",
    "history.confidential-interview",
    "history.substance-use",
    "history.finish",
    "exam.general",
    "exam.vitals",
    "exam.auscultation",
    "exam.femoral-pulses",
    "exam.finish",
    "order.ecg",
    "review.ecg",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Post-exertional vasovagal syncope" }],
    "reasoning.finish",
    "management.reassure",
    "management.hydration",
    "management.continue-sports",
    "management.return-precautions",
    "management.finish",
    "debrief.review",
    "performance.record",
    "next-case.begin",
  ]);

  const result = evaluate(document, engine);
  assert.equal(engine.isComplete, true);
  assert.equal(engine.getAcceptanceReport().acceptancePassed, true);
  assert.equal(result.overallScore, 100);
  assert.deepEqual(result.unnecessaryTests, []);
  assert.deepEqual(result.safetyEvents, []);
});

test("echo is appropriate for HCM but penalized in the vasovagal contrast", async () => {
  const document = await loadDocument();
  const vasovagal = createCaseEngine(document, "case-vasovagal");
  run(vasovagal, [
    ...OPENING,
    "history.finish",
    "exam.finish",
    "order.ecg",
    "review.ecg",
    "order.echo",
    "review.echo",
    "testing.finish",
  ]);
  const vasovagalDebrief = evaluate(document, vasovagal);
  assert.deepEqual(vasovagalDebrief.unnecessaryTests, ["Echocardiogram"]);
  assert.equal(vasovagalDebrief.dimensions.find((item) => item.id === "testSelection").score, 75);

  const hcm = createCaseEngine(document, "case-hcm");
  run(hcm, [
    ...OPENING,
    "history.finish",
    "exam.finish",
    "order.ecg",
    "review.ecg",
    "order.echo",
    "review.echo",
    "testing.finish",
  ]);
  const hcmDebrief = evaluate(document, hcm);
  assert.deepEqual(hcmDebrief.unnecessaryTests, []);
  assert.equal(hcmDebrief.dimensions.find((item) => item.id === "testSelection").score, 100);
});

test("unnecessary restriction in vasovagal syncope triggers a major safety correction", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-vasovagal");
  run(engine, [
    ...OPENING,
    "history.finish",
    "exam.finish",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Hypertrophic Cardiomyopathy" }],
    "reasoning.finish",
    "management.restrict-sports",
    "management.finish",
  ]);
  const result = evaluate(document, engine);
  assert.equal(result.safetyEvents[0].id, "vasovagal-unnecessary-restriction");
  assert.equal(result.safetyEvents[0].severity, "major");
  assert.equal(result.counterfactuals[0].alternateCaseId, "case-hcm");
});
