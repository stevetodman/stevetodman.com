import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import { microScore, microStats, selectNextTarget } from "../math/assets/mission1-adaptive.mjs";
import { DIVISION_TARGETS, buildDivisionTestRun, generateDivisionAssessmentQuestion } from "../math/assets/mission1-division-assessment.mjs";
import { DAY_MS, isColdProof, retrievalState } from "../math/assets/mission1-evidence.mjs";
import { generate, isCorrectAnswer, scoreComponents } from "../math/assets/mission1-content.mjs";
import { diagnoseMathError, diagnosisWithHistory } from "../math/assets/mission1-error-diagnosis.mjs";

function seededRandom(seed = 0x1234abcd) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(1664525, value) + 1013904223) >>> 0; return value / 0x100000000; };
}
const answerObject = question => question.correctResponse || question.answer;

test("learning invariant 1: Test Run is neutral and measures every claimed construct validly", async () => {
  const random = seededRandom(20260905);
  for (const archetype of ["division_units", "division_decompose", "division_scale_relation", "division_reasonableness", "division_model", "division_algorithm", "division_regroup", "division_error_analysis", "division_word_one_step", "division_multistep", "division_context_result", "tape_diagram_transfer", "metric_embedded"]) {
    for (let index = 0; index < 60; index += 1) {
      const question = generateDivisionAssessmentQuestion(archetype, 3, random);
      assert.equal(question.assessmentArchetype, archetype);
      assert.equal(isCorrectAnswer(answerObject(question), question), true, archetype);
      assert.ok(question.components.length >= 1);
      if (archetype === "division_regroup") {
        const renamed = question.components.find(part => part.id === "renamedHundredths");
        assert.ok(renamed && Number(renamed.answer) >= 10, "regrouping must actually rename a nonzero remainder");
      }
      for (const component of question.components.filter(part => /quotient|amount|result|oneGroup|onePart/.test(part.id))) {
        const decimals = String(component.answer).split(".")[1]?.length || 0;
        assert.ok(decimals <= 3, `silent repeating-decimal rounding in ${archetype}: ${component.answer}`);
      }
    }
  }
  const unitQuestion = generateDivisionAssessmentQuestion("division_units", 3, () => 0);
  const correct = { ...unitQuestion.correctResponse };
  assert.equal(scoreComponents(correct, unitQuestion).outcomes.find(item => item.id === "unitsPerShare").correct, true, "a requested unit count must be graded as a count");
  const run = buildDivisionTestRun(seededRandom(12));
  assert.equal(run.length, 12);
  assert.ok(run.every(item => !item.assisted && !item.scaffoldText && item.testRun));
  assert.deepEqual(new Set(run.filter(item => item.micro === "decimal_divide").map(item => item.target)), new Set(DIVISION_TARGETS));
  assert.ok(run.some(item => item.target === "division_model" && /division-model/.test(item.prompt)));
  assert.ok(run.some(item => item.micro !== "decimal_divide"), "one mixed operation-selection item prevents a division-only cue");
  const [app, live, economy] = await Promise.all([readFile(new URL("../math/assets/mission1.js", import.meta.url), "utf8"), readFile(new URL("../math/assets/live-mission.mjs", import.meta.url), "utf8"), readFile(new URL("../math/assets/starship-economy.mjs", import.meta.url), "utf8")]);
  assert.match(app, /data\.assessmentMode|dataset\.assessmentMode/);
  assert.match(app, /Independent test/);
  assert.match(live, /assessmentMode === "true"/);
  assert.match(economy, /assessmentMode === "true"/);
});

test("learning invariant 2: assistance, repetition, recency, breadth, and earned mastery remain distinct", () => {
  const t0 = Date.UTC(2026, 8, 1, 12);
  const base = { evidenceVersion: 2, skill: "addsub", micro: "decimal_add", target: "decimal_add", correct: true, assisted: false, repairOnly: false, difficulty: 2, transferKind: "routine", familyId: "symbolic-add", fingerprint: "same", date: "2026-09-01", at: t0 };
  assert.equal(microScore({ attempts: [{ ...base, assisted: true }] }, "decimal_add"), 40, "assisted work cannot move independent score");
  assert.equal(microScore({ attempts: [base, { ...base, at: t0 + DAY_MS, questionId: "duplicate" }] }, "decimal_add"), 49, "an exact seven-day repeat counts once");
  assert.equal(isColdProof({ ...base, at: t0 + DAY_MS }, { attempts: [base] }), false, "an exact seven-day repeat cannot become cold proof");
  assert.equal(isColdProof({ ...base, instructionAt: t0 - DAY_MS + 1 }, { attempts: [] }), false);
  const first = retrievalState({ attempts: [base] }, "decimal_add", t0 + DAY_MS);
  assert.equal(first.dueAt, t0 + 3 * DAY_MS);
  const early = retrievalState({ attempts: [base, { ...base, fingerprint: "fresh", familyId: "context-add", transferKind: "context", at: t0 + DAY_MS }] }, "decimal_add", t0 + 2 * DAY_MS);
  assert.equal(early.dueAt, t0 + 3 * DAY_MS, "early extra practice cannot postpone due retrieval");
  const miss = { ...base, correct: false, fingerprint: "miss", at: t0 + 2 * DAY_MS };
  const stats = microStats({ attempts: [base, miss], masteryAwards: { decimal_add: t0 } }, "decimal_add", { now: t0 + 2 * DAY_MS });
  assert.equal(stats.mastered, true, "a later miss cannot erase earned mastery");
  assert.equal(stats.readiness, "relearning");
  const oneDayDivision = DIVISION_TARGETS.map((target, index) => ({ evidenceVersion: 2, skill: "divide", micro: "decimal_divide", target, correct: true, assisted: false, difficulty: 3, transferKind: index ? "routine" : "representation", familyId: target, fingerprint: target, coverage: ["answer"], coverageRequired: ["answer"], date: "2026-09-01", at: t0 + index }));
  assert.equal(microStats({ attempts: oneDayDivision }, "decimal_divide").mastered, false, "one Test Run cannot establish durable mastery");
});

test("learning invariant 3: misconception inference and adaptive recovery are cautious and bounded", async () => {
  const missingFactor = generate("decimal_multiply", 3, () => 0);
  assert.equal(missingFactor.audit.kind, "missingFactor");
  assert.equal(missingFactor.transferKind, "near", "changed numbers alone must remain routine; inverse structure is near transfer");
  const componentQuestion = generateDivisionAssessmentQuestion("division_units", 2, seededRandom(4));
  const manyWrong = Object.fromEntries(componentQuestion.components.map(part => [part.id, "999"]));
  assert.equal(diagnoseMathError(manyWrong, componentQuestion).confidence, "undifferentiated", "several wrong components cannot support one precise misconception");
  const question = { micro: "decimal_divide", target: "division_algorithm", familyId: "family-b", answer: "2.52", prompt: "25.2 ÷ 10", audit: { kind: "quotient" } };
  const ambiguous = diagnosisWithHistory({ attempts: [] }, diagnoseMathError("not a number", question), question);
  assert.equal(ambiguous.confidence, "undifferentiated");
  const plausible = diagnosisWithHistory({ attempts: [] }, diagnoseMathError("25.2", question), question);
  assert.equal(plausible.confidence, "plausible");
  const supported = diagnosisWithHistory({ attempts: [{ micro: "decimal_divide", target: "division_algorithm", familyId: "family-a", misconception: plausible.key, assisted: false, at: Date.now() - DAY_MS }] }, plausible, question);
  assert.equal(supported.confidence, "supported");
  assert.doesNotMatch(plausible.repair.answer, /^2\.52$/, "magnitude repair must not reveal the exact answer as an estimate");

  const fresh = { attempts: [] };
  assert.equal(selectNextTarget(fresh, { independentCount: 0 }).lane, "focus");
  assert.equal(selectNextTarget(fresh, { independentCount: 2 }).lane, "maintenance");
  assert.equal(selectNextTarget(fresh, { independentCount: 4 }).lane, "retrieval");
  const source = await readFile(new URL("../math/assets/mission1.js", import.meta.url), "utf8");
  assert.match(source, /availableAfter: state\.independentCount \+ 2/);
  assert.match(source, /sessionFailures\[target\].*< 2/);
  assert.match(source, /profile\.activeSession = sessionSnapshot\(\)/);
  assert.match(source, /state\.independentCount >= PRACTICE_TARGET/);
});

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem(key) { return values.has(key) ? values.get(key) : null; }, setItem(key, value) { values.set(key, String(value)); }, removeItem(key) { values.delete(key); } };
}
async function loadCloud(initialData = {}, initialGame = {}) {
  const source = await readFile(new URL("../math/assets/math-cloud.js", import.meta.url), "utf8");
  const localStorage = makeStorage({ "mathmission.m1.v1": JSON.stringify(initialData), "mathmission.starship.v1": JSON.stringify(initialGame) });
  const window = { addEventListener() {}, dispatchEvent() {} }, document = { hidden: false, addEventListener() {}, querySelectorAll() { return []; } };
  const context = { window, document, localStorage, location: { protocol: "file:", hostname: "", hash: "", pathname: "/math/", search: "", origin: "https://stevetodman.com" }, history: { replaceState() {} }, navigator: {}, alert() {}, prompt() {}, fetch() { throw new Error("network forbidden"); }, setInterval() { return 1; }, clearTimeout() {}, setTimeout() { return 1; }, CustomEvent: class { constructor(type) { this.type = type; } }, Promise, Set, Map, JSON, Math, Number, String, Array, Object, RegExp, btoa, atob, escape, unescape };
  vm.createContext(context); vm.runInContext(source, context);
  return { cloud: window.MathMissionCloud, localStorage };
}

test("learning invariant 4: cloud merging enriches legacy evidence and preserves durable progress", async () => {
  const attempt = { evidenceVersion: 2, sessionId: "session-1", questionId: "session-1-q1", itemVersion: 2, seed: 17, familyId: "model-a", fingerprint: "fp-a", skill: "divide", micro: "decimal_divide", target: "division_model", assessmentArchetype: "division_model", correct: true, assisted: false, recovery: false, recheck: true, difficulty: 2, transferKind: "representation", transfer: true, representation: "place_model", contextStructure: "none", scaffoldShown: false, instructionAt: 0, responseMode: "components", responseCode: "{\"total\":\"0.92\",\"oneGroup\":\"0.23\"}", coverage: ["total", "oneGroup"], coverageRequired: ["total", "oneGroup"], diagnosisCandidates: [], diagnosisConfidence: "undifferentiated", recoveryOf: null, retrieval: false, testRun: true, repairOnly: false, date: "2026-09-05", at: 1788609600000, cloudId: "evidence-one" };
  const game = { version: 1, profiles: { luke: { purchases: { "solar-wing": { at: 11 } }, equipped: { hull: "solar-wing", trail: "ion-wake", companion: "none" }, updatedAt: 11 } } };
  const source = await loadCloud({ luke: { diagnostic: true, diagnosticVersion: 3, attempts: [attempt], sessions: 8, testRuns: 2, masteryAwards: { decimal_add: 123 }, rechecks: { decimal_divide: { version: 2, status: "pending" } } } }, game);
  const payload = source.cloud.payload();
  assert.ok(Object.keys(payload["math-mission-luke"].stateStats).some(key => key.startsWith("math1m|evidence-one|")));
  const target = await loadCloud({ luke: { attempts: [{ skill: "divide", micro: "decimal_divide", assessmentArchetype: "division_model", correct: true, assisted: false, difficulty: 2, date: "2026-09-05", at: attempt.at, cloudId: "evidence-one" }], sessions: 3 } });
  target.cloud.apply(payload);
  let targetData = JSON.parse(target.localStorage.getItem("mathmission.m1.v1"));
  targetData.luke.attempts[0].reviewedAt = attempt.at + 5000;
  target.localStorage.setItem("mathmission.m1.v1", JSON.stringify(targetData));
  target.cloud.apply(payload);
  const restored = JSON.parse(target.localStorage.getItem("mathmission.m1.v1")).luke;
  assert.equal(restored.attempts.length, 1);
  assert.equal(restored.attempts[0].responseCode, attempt.responseCode);
  assert.deepEqual([...restored.attempts[0].coverage], attempt.coverage);
  assert.equal(restored.testRuns, 2);
  assert.equal(restored.sessions, 8);
  assert.equal(restored.masteryAwards.decimal_add, 123);
  assert.equal(restored.rechecks.decimal_divide.status, "pending");
  assert.equal(restored.attempts[0].reviewedAt, attempt.at + 5000, "a stale remote record cannot erase richer local review evidence");
  const restoredGame = JSON.parse(target.localStorage.getItem("mathmission.starship.v1")).profiles.luke;
  assert.ok(restoredGame.purchases["solar-wing"]);
  assert.equal(restoredGame.equipped.hull, "solar-wing");
  source.cloud.apply(target.cloud.payload());
  const mergedBack = JSON.parse(source.localStorage.getItem("mathmission.m1.v1")).luke;
  assert.equal(mergedBack.attempts.length, 1);
  assert.equal(mergedBack.attempts[0].reviewedAt, attempt.at + 5000, "merge order must not change the richer result");
});
