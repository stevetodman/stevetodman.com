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

function opening() {
  return [
    "system.load",
    "world.enter",
    "navigate.workroom",
    "attending.open-assignment",
    "assignment.accept",
    "navigate.exam-room",
    "encounter.introduce",
  ];
}

function debrief(document, engine) {
  const graph = document.caseGraphs.find((item) => item.caseId === engine.snapshot().caseId);
  const clinicalCase = document.cases.find((item) => item.id === engine.snapshot().caseId);
  return evaluateAttempt({ snapshot: engine.snapshot(), graph, clinicalCase });
}

test("complete clinical process earns full deterministic scores", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-hcm");
  run(engine, [
    ...opening(),
    "history.generic",
    "history.exertional-timing",
    "history.family-sudden-death",
    "history.prodrome",
    "history.palpitations",
    "history.triggers",
    "history.activity-level",
    "history.stimulant-use",
    "history.finish",
    "exam.general",
    "exam.vitals",
    "exam.auscultation",
    "exam.femoral-pulses",
    "exam.finish",
    "order.ecg",
    "review.ecg",
    "order.echo",
    "review.echo",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Hypertrophic Cardiomyopathy" }],
    "reasoning.finish",
    "management.restrict-sports",
    "management.ep-referral",
    "management.family-screening",
    "management.genetics",
    "management.finish",
    "debrief.review",
    "performance.record",
    "next-case.begin",
  ]);

  const result = debrief(document, engine);
  assert.equal(result.overallScore, 100);
  assert.ok(result.dimensions.every((dimension) => dimension.score === 100));
  assert.deepEqual(result.missedOpportunities, []);
  assert.deepEqual(result.safetyEvents, []);
});

test("omissions and unsafe clearance produce case-specific debrief", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-hcm");
  run(engine, [
    ...opening(),
    "history.generic",
    "history.finish",
    "exam.finish",
    "order.ct-angiography",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Vasovagal syncope" }],
    "reasoning.finish",
    "management.clear-sports",
    "management.finish",
  ]);

  const result = debrief(document, engine);
  assert.equal(result.diagnosisCorrect, false);
  assert.ok(result.overallScore < 50);
  assert.ok(result.missedOpportunities.some((item) => item.key === "exertional_timing"));
  assert.deepEqual(result.unnecessaryTests, ["CT angiography"]);
  assert.equal(result.safetyEvents[0].severity, "critical");
  assert.match(result.safetyEvents[0].intervention, /attending stops discharge/i);
  assert.equal(result.counterfactuals[0].alternateCaseId, "case-vasovagal");
});

test("debrief scoring is deterministic and preserves the immutable action log", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-hcm");
  run(engine, [...opening(), "history.finish", "exam.finish", "testing.finish"]);
  const before = engine.snapshot();
  const first = debrief(document, engine);
  const second = debrief(document, engine);
  assert.deepEqual(first, second);
  assert.deepEqual(engine.snapshot(), before);
  assert.deepEqual(first.actionLog.map((event) => event.sequence), first.actionLog.map((_, index) => index + 1));
});
