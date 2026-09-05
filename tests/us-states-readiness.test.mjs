import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../study/us-states.html", import.meta.url), "utf8");

function functionSource(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} should exist`);
  let depth = 0;
  let opened = false;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === "{") { depth += 1; opened = true; }
    if (source[i] === "}") {
      depth -= 1;
      if (opened && depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract ${name}`);
}

function loadHelpers() {
  const context = { Date, Math, Number, String };
  vm.createContext(context);
  vm.runInContext(`var DAY_MS = 24 * 60 * 60 * 1000;\n${functionSource("quizTargetCount")}\n${functionSource("retrievalPriority")}`, context);
  return context;
}

test("school target advances from 40 states to 50 after the September 9 quiz", () => {
  const { quizTargetCount } = loadHelpers();
  assert.equal(quizTargetCount(new Date(2026, 8, 9, 12)), 40);
  assert.equal(quizTargetCount(new Date(2026, 8, 10, 12)), 50);
  assert.equal(quizTargetCount(new Date(2026, 8, 16, 12)), 50);
});

test("retrieval readiness resurfaces stale mastered states and recent misses without decaying mastery", () => {
  const { retrievalPriority } = loadHelpers();
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

test("existing child-facing states game stays intact while readiness remains hidden", () => {
  assert.match(source, /var MASTERY_STREAK = 3/);
  assert.match(source, /A mastered state also[\s\S]*stays mastered/);
  assert.match(source, /st\.lastSeenAt = now/);
  assert.match(source, /st\.lastCorrectAt = now/);
  assert.match(source, /st\.lastMissAt = now/);
  assert.match(source, /retrieval: retrievalPriority\(st, now\)/);
  assert.match(source, /Math\.max\(Number\(sa\.lastSeenAt\) \|\| 0, Number\(sb\.lastSeenAt\) \|\| 0\)/);
  assert.match(source, /Nothing about this is surfaced as a difficulty setting/);
  assert.doesNotMatch(source, />\s*(?:40-state|40 state|retrieval readiness|memory strength)\s*</i);
});