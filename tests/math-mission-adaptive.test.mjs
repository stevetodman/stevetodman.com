import assert from "node:assert/strict";
import test from "node:test";

import {
  CURRENT_WEEK_MICROS,
  DIAGNOSTIC_VERSION,
  REVIEW_MICROS,
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

test("current school focus is Lessons 1-2 powers-of-ten work with a separate review layer", () => {
  assert.deepEqual(CURRENT_WEEK_MICROS, ["powers_multiply", "powers_divide"]);
  assert.deepEqual(REVIEW_MICROS, ["metric_conversion", "decimal_forms", "decimal_compare"]);
  assert.equal(nextMicro({ attempts: [] }), "powers_multiply");

  const attempts = [attempt("powers_multiply", true, { at: 1 }), attempt("powers_divide", false, { at: 2 })];
  assert.equal(nextMicro({ attempts }), "powers_divide");
  assert.notEqual(nextMicro({ attempts }, { avoid: ["powers_divide"] }), "powers_divide");
});

test("ordinary review weakness does not displace unfinished Lessons 1-2", () => {
  const profile = { attempts: [attempt("metric_conversion", false, { at: 1 })] };
  assert.equal(microScore(profile, "metric_conversion"), 27);
  assert.ok(CURRENT_WEEK_MICROS.includes(nextMicro(profile)));
});

test("a severe review gap can interrupt briefly even while current lessons are unfinished", () => {
  const profile = { attempts: [
    attempt("metric_conversion", false, { at: 1 }),
    attempt("metric_conversion", false, { at: 2 })
  ] };
  assert.equal(microScore(profile, "metric_conversion"), 14);
  assert.equal(nextMicro(profile), "metric_conversion");
});

test("once current Lessons 1-2 are secure, weak review skills surface", () => {
  const attempts = [];
  for (const micro of CURRENT_WEEK_MICROS) {
    for (let index = 0; index < 4; index += 1) attempts.push(attempt(micro, true, { difficulty: 3, date: index < 2 ? "2026-08-29" : "2026-08-30", at: attempts.length + 1 }));
  }
  const profile = { attempts };
  assert.ok(CURRENT_WEEK_MICROS.every(micro => microScore(profile, micro) >= 75));
  assert.equal(nextMicro(profile), "metric_conversion");
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
