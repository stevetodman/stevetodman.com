import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../study/us-states.html", import.meta.url), "utf8");
const contractSource = await readFile(new URL("../study/us-states-school-target.js", import.meta.url), "utf8");

function functionSource(text, name) {
  const start = text.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} should exist`);
  let depth = 0;
  let opened = false;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === "{") { depth += 1; opened = true; }
    if (text[i] === "}") {
      depth -= 1;
      if (opened && depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract ${name}`);
}

function loadBaseHelpers() {
  const context = { Date, Math, Number, String };
  vm.createContext(context);
  vm.runInContext(`var DAY_MS = 24 * 60 * 60 * 1000;\n${functionSource(source, "quizTargetCount")}\n${functionSource(source, "retrievalPriority")}`, context);
  return context;
}

function loadSchoolTarget() {
  const context = { Date, String };
  vm.createContext(context);
  vm.runInContext(`${functionSource(contractSource, "dateKey")}\n${functionSource(contractSource, "schoolRequiredScore")}`, context);
  return context.schoolRequiredScore;
}

test("school assessment is always one blank 50-state map with 40/50 then 50/50 scoring", () => {
  const schoolRequiredScore = loadSchoolTarget();
  assert.equal(schoolRequiredScore(new Date(2026, 8, 9, 12)), 40);
  assert.equal(schoolRequiredScore(new Date(2026, 8, 15, 12)), 40);
  assert.equal(schoolRequiredScore(new Date(2026, 8, 16, 12)), 50);
  assert.match(contractSource, /window\.assessmentTestStates = function \(\) \{ return STATES\.slice\(\); \}/);
  assert.match(contractSource, /buildMapSVG\(\{ interactive: true, showTitles: false/);
  assert.match(contractSource, /canonicalName\(answer\) === canonicalName\(state\.name\)/);
  assert.match(contractSource, /No correctness feedback until you submit\./);
});

test("adaptive practice expands from a 40-state milestone to all 50 after Sep 9 without changing test length", () => {
  const { quizTargetCount } = loadBaseHelpers();
  assert.equal(quizTargetCount(new Date(2026, 8, 9, 12)), 40);
  assert.equal(quizTargetCount(new Date(2026, 8, 10, 12)), 50);
  assert.match(contractSource, /Daily adaptive practice remains separate/);
  assert.match(contractSource, /total: STATES\.length/);
});

test("retrieval readiness resurfaces stale mastered states and recent misses without decaying mastery", () => {
  const { retrievalPriority } = loadBaseHelpers();
  const now = new Date(2026, 8, 5, 12).getTime();
  const day = 24 * 60 * 60 * 1000;
  const recent = { mastered: true, correct: 8, wrong: 0, lastCorrectAt: now - day, lastSeenAt: now - day };
  const stale = { mastered: true, correct: 8, wrong: 0, lastCorrectAt: now - 10 * day, lastSeenAt: now - 10 * day };
  const missed = { mastered: true, correct: 8, wrong: 1, lastCorrectAt: now - day, lastSeenAt: now, lastMissAt: now };
  assert.ok(retrievalPriority(stale, now) > retrievalPriority(recent, now));
  assert.ok(retrievalPriority(missed, now) > retrievalPriority(recent, now));
  assert.equal(stale.mastered, true);
  assert.equal(missed.mastered, true);
});

test("existing child-facing mastery stays permanent while adaptive readiness remains hidden", () => {
  assert.match(source, /var MASTERY_STREAK = 3/);
  assert.match(source, /A mastered state also[\s\S]*stays mastered/);
  assert.match(source, /st\.lastSeenAt = now/);
  assert.match(source, /st\.lastCorrectAt = now/);
  assert.match(source, /st\.lastMissAt = now/);
  assert.match(source, /retrieval: retrievalPriority\(st, now\)/);
  assert.match(source, /Nothing about this is surfaced as a difficulty setting/);
  assert.doesNotMatch(source, />\s*(?:retrieval readiness|memory strength)\s*</i);
});
