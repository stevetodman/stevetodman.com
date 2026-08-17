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
  "history.confidential-interview",
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

test("generic history does not disclose a specific red-flag answer", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-hcm");
  const clinicalCase = document.cases.find((item) => item.id === "case-hcm");
  const suddenDeath = clinicalCase.history.find((fact) => fact.key === "family_sudden_death");
  performAll(engine, [...OPENING, "history.generic"]);

  const revealed = engine.getRevealedHistory();
  const generic = engine.snapshot().actionLog.find((event) => event.actionId === "history.generic");
  assert.deepEqual(revealed.map((fact) => fact.key), ["generic"]);
  assert.equal(generic.payload.key, "generic");
  assert.equal(generic.payload.answer, clinicalCase.history.find((fact) => fact.key === "generic").answer);
  assert.ok(!generic.payload.answer.includes(suddenDeath.answer));
  assert.ok(!revealed.some((fact) => fact.key === "family_sudden_death"));

  engine.perform("history.family-sudden-death");
  assert.ok(engine.getRevealedHistory().some((fact) => fact.key === "family_sudden_death" && fact.answer === suddenDeath.answer));
});

test("presentation hides diagnosis and teaching until debrief", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-hcm");
  const clinicalCase = document.cases.find((item) => item.id === "case-hcm");

  performAll(engine, ["system.load", "world.enter", "navigate.workroom"]);
  let view = engine.getPresentation();
  assert.equal(view.assignment, null);
  assert.deepEqual(view.diagnosisChoices, []);
  assert.equal(view.correctDiagnosis, "");
  assert.equal(view.teachingPoint, "");
  assert.ok(!JSON.stringify(view).includes(clinicalCase.correctDiagnosis));

  performAll(engine, ["attending.open-assignment", "assignment.accept"]);
  view = engine.getPresentation();
  assert.equal(view.assignment.chiefComplaint, clinicalCase.chiefComplaint);
  assert.equal(view.assignment.room, clinicalCase.room);
  assert.deepEqual(view.diagnosisChoices, []);
  assert.equal(view.correctDiagnosis, "");

  performAll(engine, [
    "navigate.exam-room",
    "encounter.introduce",
    "history.finish",
    "exam.finish",
    "testing.finish",
    "navigate.return-workroom",
  ]);
  view = engine.getPresentation();
  assert.deepEqual(view.diagnosisChoices, clinicalCase.differentials);
  assert.deepEqual(view.socratic, []);
  assert.equal(view.correctDiagnosis, "");

  engine.perform("reasoning.submit", { diagnosis: "Vasovagal syncope" });
  view = engine.getPresentation();
  assert.deepEqual(view.socratic, clinicalCase.attendingSocratic);
  assert.equal(view.teachingPoint, "");
  assert.equal(view.correctDiagnosis, "");

  performAll(engine, [
    "reasoning.finish",
    "management.finish",
    "debrief.review",
  ]);
  view = engine.getPresentation();
  assert.equal(view.correctDiagnosis, clinicalCase.correctDiagnosis);
  assert.equal(view.teachingPoint, clinicalCase.teachingPoint);
});

test("exam and test findings stay closed until the matching action", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-hcm");
  const clinicalCase = document.cases.find((item) => item.id === "case-hcm");
  performAll(engine, [...OPENING, "history.finish"]);
  assert.deepEqual(engine.getRevealedExam(), {});
  assert.deepEqual(engine.getRevealedResults(), []);

  engine.perform("exam.general");
  assert.equal(engine.getRevealedExam().general, clinicalCase.exam.general);
  assert.equal(engine.getRevealedExam().auscultation, undefined);

  performAll(engine, ["exam.finish"]);
  engine.perform("order.echo");
  assert.deepEqual(engine.getRevealedResults(), []);
  assert.ok(!JSON.stringify(engine.snapshot().actionLog.at(-1).payload).includes(clinicalCase.echo.summary));

  engine.perform("review.echo");
  const echo = engine.getRevealedResults().find((item) => item.test === "Echocardiogram");
  assert.equal(echo.findings.summary, clinicalCase.echo.summary);
  assert.ok(!engine.getRevealedResults().some((item) => item.test === "ECG"));
});

test("HCM stimulant history stays closed until the parent steps out", async () => {
  const engine = createCaseEngine(await loadDocument(), "case-hcm");
  performAll(engine, [...OPENING, "history.generic"]);
  assert.ok(engine.getAvailableActions().includes("history.confidential-interview"));
  assert.ok(!engine.getAvailableActions().includes("history.stimulant-use"));
  engine.perform("history.confidential-interview");
  assert.ok(engine.getAvailableActions().includes("history.stimulant-use"));
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
