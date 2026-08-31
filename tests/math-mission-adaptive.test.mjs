import assert from "node:assert/strict";
import test from "node:test";

import {
  DIAGNOSTIC_VERSION,
  diagnosticIsCurrent,
  difficultyForScore,
  microScore,
  microStats,
  nextMicro,
  projectedScore
} from "../math/assets/mission1-adaptive.mjs";

const attempt = (micro, correct, overrides = {}) => ({ micro, correct, assisted: false, difficulty: 2, date: "2026-08-30", at: Date.now(), ...overrides });

test("independent evidence moves skill level more than guided work", () => {
  const profile = { attempts: [] };
  assert.deepEqual(projectedScore(profile, attempt("decimal_add", true)), { before: 40, after: 49 });
  assert.deepEqual(projectedScore(profile, attempt("decimal_add", false)), { before: 40, after: 27 });
  assert.deepEqual(projectedScore(profile, attempt("decimal_add", true, { assisted: true })), { before: 40, after: 42 });
});

test("difficulty responds to current skill level", () => {
  assert.equal(difficultyForScore(20), 1);
  assert.equal(difficultyForScore(44), 1);
  assert.equal(difficultyForScore(45), 2);
  assert.equal(difficultyForScore(74), 2);
  assert.equal(difficultyForScore(75), 3);
});

test("all current Lessons 1–16 compete by weakest recent evidence", () => {
  assert.equal(nextMicro({ attempts: [] }), "place_digit");
  const attempts = [attempt("place_digit", true, { at: 1 }), attempt("place_value", false, { at: 2 })];
  assert.equal(nextMicro({ attempts }), "place_value");
  assert.notEqual(nextMicro({ attempts }, { avoid: ["place_value"] }), "place_value");
});

test("mastery requires sustained independent advanced work on two days", () => {
  const attempts = [
    attempt("decimal_round", true, { difficulty: 3, date: "2026-08-29", at: 1 }),
    attempt("decimal_round", true, { difficulty: 3, date: "2026-08-29", at: 2 }),
    attempt("decimal_round", true, { difficulty: 3, date: "2026-08-30", at: 3 }),
    attempt("decimal_round", true, { difficulty: 3, date: "2026-08-30", at: 4 }),
    attempt("decimal_round", true, { difficulty: 3, date: "2026-08-30", at: 5 })
  ];
  const stats = microStats({ attempts }, "decimal_round");
  assert.equal(microScore({ attempts }, "decimal_round"), 95);
  assert.equal(stats.mastered, true);
});

test("only the independently checked diagnostic version is current", () => {
  assert.equal(DIAGNOSTIC_VERSION, 2);
  assert.equal(diagnosticIsCurrent({ diagnostic: true, diagnosticVersion: 1 }), false);
  assert.equal(diagnosticIsCurrent({ diagnostic: true, diagnosticVersion: 2 }), true);
});
