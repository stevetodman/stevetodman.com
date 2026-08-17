import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createCaseEngine } from "../Tools/case-engine.mjs";
import { evaluateAttempt } from "../Tools/education-engine.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, "..", "Content", "Data", "clinical-content.json");

const OPENING = [
  "system.load",
  "world.enter",
  "navigate.workroom",
  "attending.open-assignment",
  "assignment.accept",
  "navigate.exam-room",
  "encounter.introduce",
];
const EXAM = ["exam.general", "exam.vitals", "exam.auscultation", "exam.femoral-pulses", "exam.finish"];
const CLOSING = ["management.finish", "debrief.review", "performance.record", "next-case.begin"];

async function loadDocument() {
  return JSON.parse(await readFile(dataPath, "utf8"));
}

function run(engine, actions) {
  for (const entry of actions) engine.perform(...(Array.isArray(entry) ? entry : [entry]));
}

function evaluate(document, engine) {
  const snapshot = engine.snapshot();
  const graph = document.caseGraphs.find((item) => item.caseId === snapshot.caseId);
  const clinicalCase = document.cases.find((item) => item.id === snapshot.caseId);
  return evaluateAttempt({ snapshot, graph, clinicalCase });
}

test("Long-QT encounter completes from the already-authored truth", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-longqt");
  run(engine, [
    ...OPENING,
    "history.generic",
    "history.triggers",
    "history.prodrome",
    "history.palpitations",
    "history.family-sudden-death",
    "history.meds",
    "history.activity-level",
    "history.finish",
    ...EXAM,
    "order.ecg",
    "review.ecg",
    "order.echo",
    "review.echo",
    "order.holter",
    "order.genetics-referral",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Long QT syndrome" }],
    "reasoning.finish",
    "management.restrict-swimming",
    "management.ep-referral",
    "management.stop-azithromycin",
    "management.family-screening",
    "management.genetics",
    ...CLOSING,
  ]);

  const debrief = evaluate(document, engine);
  assert.equal(engine.getAcceptanceReport().acceptancePassed, true);
  assert.equal(debrief.overallScore, 100);
  assert.deepEqual(debrief.safetyEvents, []);
});

test("Long-QT reassurance triggers the authored safety intervention", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-longqt");
  run(engine, [
    ...OPENING,
    "history.finish",
    "exam.finish",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Vasovagal syncope" }],
    "reasoning.finish",
    "management.reassure",
    "management.finish",
  ]);
  const debrief = evaluate(document, engine);
  assert.equal(debrief.safetyEvents[0].id, "longqt-protection-and-referral");
  assert.equal(debrief.safetyEvents[0].severity, "critical");
});

test("coarctation encounter completes with four-limb and repair reasoning", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-coarctation");
  run(engine, [
    ...OPENING,
    "history.generic",
    "history.activity-level",
    "history.palpitations",
    "history.family-sudden-death",
    "history.pmh",
    "history.viral-illness",
    "history.finish",
    ...EXAM,
    "order.ecg",
    "review.ecg",
    "order.echo",
    "review.echo",
    "order.cardiac-mri",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Coarctation of the aorta" }],
    "reasoning.finish",
    "management.repair-evaluation",
    "management.antihypertensive",
    "management.restrict-static-load",
    "management.family-screening",
    ...CLOSING,
  ]);

  const debrief = evaluate(document, engine);
  assert.equal(engine.getAcceptanceReport().acceptancePassed, true);
  assert.equal(debrief.overallScore, 100);
  assert.deepEqual(debrief.safetyEvents, []);
});

test("coarctation reassurance triggers the authored safety intervention", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-coarctation");
  run(engine, [
    ...OPENING,
    "history.finish",
    "exam.finish",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Primary hypertension" }],
    "reasoning.finish",
    "management.reassure",
    "management.finish",
  ]);
  const debrief = evaluate(document, engine);
  assert.equal(debrief.safetyEvents[0].id, "coarctation-repair-and-blood-pressure");
  assert.equal(debrief.safetyEvents[0].severity, "critical");
});

test("musculoskeletal chest pain completes without testing", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-msk-chest-pain");
  run(engine, [
    ...OPENING,
    "history.generic",
    "history.activity-level",
    "history.palpitations",
    "history.viral-illness",
    "history.family-sudden-death",
    "history.substance-use",
    "history.finish",
    ...EXAM,
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Musculoskeletal chest pain" }],
    "reasoning.finish",
    "management.reassure-msk",
    "management.continue-activity",
    "management.chest-wall-care",
    ...CLOSING,
  ]);
  const debrief = evaluate(document, engine);
  assert.equal(engine.getAcceptanceReport().acceptancePassed, true);
  assert.equal(debrief.overallScore, 100);
  assert.deepEqual(debrief.unnecessaryTests, []);
  assert.deepEqual(debrief.safetyEvents, []);
});

test("restricting musculoskeletal chest pain is penalized", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-msk-chest-pain");
  run(engine, [
    ...OPENING,
    "history.finish",
    "exam.finish",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Postviral myocarditis" }],
    "reasoning.finish",
    "management.restrict-sports",
    "management.admit",
    "management.finish",
  ]);
  const debrief = evaluate(document, engine);
  assert.equal(debrief.safetyEvents[0].id, "msk-unnecessary-restriction");
});

test("adolescent hypertension completes with ABPM and no same-day medication", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-adolescent-htn");
  run(engine, [
    ...OPENING,
    "history.generic",
    "history.activity-level",
    "history.pmh",
    "history.meds",
    "history.family-sudden-death",
    "history.substance-use",
    "history.finish",
    ...EXAM,
    "order.abpm",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Primary hypertension" }],
    "reasoning.finish",
    "management.no-meds-yet",
    "management.arrange-abpm",
    "management.lifestyle",
    "management.repeat-office-bp",
    ...CLOSING,
  ]);
  const debrief = evaluate(document, engine);
  assert.equal(engine.getAcceptanceReport().acceptancePassed, true);
  assert.equal(debrief.overallScore, 100);
  assert.deepEqual(debrief.safetyEvents, []);
});

test("starting antihypertensives from one school reading is penalized", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-adolescent-htn");
  run(engine, [
    ...OPENING,
    "history.finish",
    "exam.finish",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Primary hypertension" }],
    "reasoning.finish",
    "management.start-antihypertensive",
    "management.finish",
  ]);
  const debrief = evaluate(document, engine);
  assert.equal(debrief.safetyEvents[0].id, "htn-unconfirmed-medication");
});
