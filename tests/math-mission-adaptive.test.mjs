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
  migrateAffectedRechecks,
  nextMicro,
  pendingRechecks,
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

test("adaptive scope comes from this week's teacher material plus explicit prerequisites", () => {
  assert.deepEqual(CURRENT_WEEK_MICROS, ["powers_multiply", "powers_divide"]);
  assert.deepEqual(REVIEW_MICROS, ["place_digit", "place_value"]);
  assert.equal(nextMicro({ attempts: [] }), "powers_multiply");

  const attempts = [attempt("powers_multiply", true, { at: 1 }), attempt("powers_divide", false, { at: 2 })];
  assert.equal(nextMicro({ attempts }), "powers_divide");
  assert.notEqual(nextMicro({ attempts }, { avoid: ["powers_divide"] }), "powers_divide");
});

test("a demonstrated prerequisite gap can surface within the teacher week", () => {
  const profile = { attempts: [
    attempt("place_value", false, { at: 1 }),
    attempt("place_value", false, { at: 2 })
  ] };
  assert.equal(microScore(profile, "place_value"), 14);
  assert.equal(nextMicro(profile), "place_value");
});

test("future lesson weakness never enters the weekly adaptive queue", () => {
  const profile = { attempts: [
    attempt("metric_conversion", false, { at: 1 }),
    attempt("metric_conversion", false, { at: 2 }),
    attempt("decimal_add", false, { at: 3 }),
    attempt("decimal_add", false, { at: 4 })
  ] };
  assert.equal(microScore(profile, "metric_conversion"), 14);
  assert.equal(microScore(profile, "decimal_add"), 14);
  assert.ok(CURRENT_WEEK_MICROS.includes(nextMicro(profile)));
});

test("once current work is secure, the engine still does not advance beyond teacher scope", () => {
  const attempts = [];
  for (const micro of CURRENT_WEEK_MICROS) {
    for (let index = 0; index < 4; index += 1) attempts.push(attempt(micro, true, { difficulty: 3, date: index < 2 ? "2026-08-29" : "2026-08-30", at: attempts.length + 1 }));
  }
  attempts.push(attempt("decimal_add", false, { at: 100 }));
  attempts.push(attempt("decimal_add", false, { at: 101 }));
  const profile = { attempts };
  assert.ok(CURRENT_WEEK_MICROS.every(micro => microScore(profile, micro) >= 75));
  assert.ok(CURRENT_WEEK_MICROS.includes(nextMicro(profile)));
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

test("the repair migration preserves history and schedules only affected current-week work for an independent recheck", () => {
  const profile = { attempts: [attempt("powers_divide", false), attempt("decimal_add", true)] };
  assert.equal(migrateAffectedRechecks(profile), true);
  assert.deepEqual(pendingRechecks(profile), ["powers_divide"]);
  assert.equal(profile.attempts.length, 2, "repair migration must not erase evidence");
  assert.equal(nextMicro(profile), "powers_divide");
  assert.equal(migrateAffectedRechecks(profile), false, "migration is one-time and does not repeatedly reset progress");
});
