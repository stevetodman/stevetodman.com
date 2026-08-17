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

const EXAM = ["exam.general", "exam.vitals", "exam.auscultation", "exam.femoral-pulses", "exam.finish"];
const CLOSING = ["management.finish", "debrief.review", "performance.record", "next-case.begin"];

test("innocent murmur completes without diagnostic testing", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-innocent-murmur");
  run(engine, [
    ...OPENING,
    "history.generic",
    "history.activity-level",
    "history.palpitations",
    "history.family-sudden-death",
    "history.viral-illness",
    "history.finish",
    ...EXAM,
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Still's murmur (innocent)" }],
    "reasoning.finish",
    "management.reassure-family",
    "management.no-activity-restriction",
    "management.routine-follow-up",
    ...CLOSING,
  ]);
  const result = evaluate(document, engine);
  assert.equal(engine.getAcceptanceReport().acceptancePassed, true);
  assert.equal(result.overallScore, 100);
  assert.deepEqual(result.unnecessaryTests, []);
});

test("WPW completes with ECG recognition and electrophysiology referral", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-wpw");
  run(engine, [
    ...OPENING,
    "history.generic",
    "history.triggers",
    "history.palpitations",
    "history.prodrome",
    "history.family-sudden-death",
    "history.finish",
    ...EXAM,
    "order.ecg",
    "review.ecg",
    "order.echo",
    "review.echo",
    "order.holter",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Wolff-Parkinson-White syndrome" }],
    "reasoning.finish",
    "management.ep-referral",
    "management.vagal-maneuvers",
    "management.risk-stratification-ablation",
    ...CLOSING,
  ]);
  const result = evaluate(document, engine);
  assert.equal(engine.getAcceptanceReport().acceptancePassed, true);
  assert.equal(result.overallScore, 100);
  assert.deepEqual(result.safetyEvents, []);
});

test("myocarditis completes with full workup and monitored admission", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-myocarditis");
  run(engine, [
    ...OPENING,
    "history.generic",
    "history.viral-illness",
    "history.activity-level",
    "history.palpitations",
    "history.prodrome",
    "history.confidential-interview",
    "history.substance-use",
    "history.finish",
    ...EXAM,
    "order.ecg",
    "review.ecg",
    "order.echo",
    "review.echo",
    "order.troponin",
    "order.bnp",
    "order.cbc",
    "order.cmp",
    "order.cardiac-mri",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Postviral myocarditis" }],
    "reasoning.finish",
    "management.admit",
    "management.exercise-restriction",
    "management.serial-biomarkers",
    "management.cardiac-mri",
    "management.supportive-hf-care",
    ...CLOSING,
  ]);
  const result = evaluate(document, engine);
  assert.equal(engine.getAcceptanceReport().acceptancePassed, true);
  assert.equal(result.overallScore, 100);
  assert.deepEqual(result.safetyEvents, []);
});

test("over-testing and restriction are penalized in an innocent murmur", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-innocent-murmur");
  run(engine, [
    ...OPENING,
    "history.finish",
    "exam.finish",
    "order.ecg",
    "review.ecg",
    "order.echo",
    "review.echo",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Small VSD" }],
    "reasoning.finish",
    "management.restrict-sports",
    "management.finish",
  ]);
  const result = evaluate(document, engine);
  assert.deepEqual(result.unnecessaryTests, ["ECG", "Echocardiogram"]);
  assert.equal(result.safetyEvents[0].id, "innocent-murmur-unnecessary-restriction");
});

test("reassuring and discharging myocarditis triggers critical intervention", async () => {
  const document = await loadDocument();
  const engine = createCaseEngine(document, "case-myocarditis");
  run(engine, [
    ...OPENING,
    "history.finish",
    "exam.finish",
    "testing.finish",
    "navigate.return-workroom",
    ["reasoning.submit", { diagnosis: "Musculoskeletal chest pain" }],
    "reasoning.finish",
    "management.reassure",
    "management.discharge",
    "management.finish",
  ]);
  const result = evaluate(document, engine);
  assert.equal(result.safetyEvents[0].severity, "critical");
  assert.match(result.safetyEvents[0].intervention, /stops discharge/i);
});
