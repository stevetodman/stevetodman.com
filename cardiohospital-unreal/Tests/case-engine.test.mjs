import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createCaseEngine } from "../Tools/case-engine.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, "..", "Content", "Data", "clinical-content.json");

async function loadDocument() {
  return JSON.parse(await readFile(dataPath, "utf8"));
}

function performAll(engine, actions) {
  for (const entry of actions) {
    if (Array.isArray(entry)) engine.perform(entry[0], entry[1]);
    else engine.perform(entry);
  }
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

const OPTIMAL_PATH = [
  ...OPENING,
  "history.generic",
  "history.exertional-timing",
  "history.family-sudden-death",
  "history.prodrome",
  "history.finish",
  "exam.general",
  "exam.vitals",
  "exam.auscultation",
  "exam.finish",
  "order.ecg",
  "review.ecg",
  "order.echo",
  "review.echo",
  "testing.finish",
  "navigate.return-workroom",
  ["reasoning.submit", { diagnosis: "Hypertrophic Cardiomyopathy", evidence: ["mid-exertional syncope", "family sudden death"] }],
  "reasoning.finish",
  "management.restrict-sports",
  "management.finish",
  "debrief.review",
  "performance.record",
  "next-case.begin",
];

test("optimal HCM path completes the full acceptance graph", async () => {
  const engine = createCaseEngine(await loadDocument(), "case-hcm");
  performAll(engine, OPTIMAL_PATH);

  assert.equal(engine.nodeId, "complete");
  assert.equal(engine.isComplete, true);
  assert.deepEqual(engine.getAcceptanceReport().missingActions, []);
  assert.equal(engine.getAcceptanceReport().acceptancePassed, true);
  assert.equal(engine.snapshot().actionLog.at(-1).eventType, "next_case_started");
});

test("case can complete with omissions without falsely passing acceptance", async () => {
  const engine = createCaseEngine(await loadDocument(), "case-hcm");
  performAll(engine, [
    ...OPENING,
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
    "debrief.review",
    "performance.record",
    "next-case.begin",
  ]);

  const report = engine.getAcceptanceReport();
  assert.equal(report.caseCompleted, true);
  assert.equal(report.acceptancePassed, false);
  assert.ok(report.missingActions.includes("history.exertional-timing"));
  assert.ok(report.missingActions.includes("order.ecg"));
  assert.ok(report.missingActions.includes("management.restrict-sports"));
});

test("test results cannot be reviewed before their order", async () => {
  const engine = createCaseEngine(await loadDocument(), "case-hcm");
  performAll(engine, [...OPENING, "history.finish", "exam.finish"]);
  assert.ok(!engine.getAvailableActions().includes("review.ecg"));
  assert.throws(() => engine.perform("review.ecg"), /not available/);
  engine.perform("order.ecg");
  assert.ok(engine.getAvailableActions().includes("review.ecg"));
});

test("identical action sequences produce identical snapshots", async () => {
  const document = await loadDocument();
  const first = createCaseEngine(document, "case-hcm");
  const second = createCaseEngine(document, "case-hcm");
  performAll(first, OPTIMAL_PATH);
  performAll(second, OPTIMAL_PATH);
  assert.deepEqual(first.snapshot(), second.snapshot());
});
