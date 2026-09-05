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

test("adaptive scope prioritizes the imminent Lessons 13-16 assessment without ignoring real gaps", () => {
  assert.deepEqual(CURRENT_WEEK_MICROS, ["decimal_divide", "decimal_add", "decimal_subtract", "decimal_multiply", "powers_multiply", "powers_divide"]);
  assert.deepEqual(REVIEW_MICROS, ["place_digit", "place_value", "metric_conversion", "decimal_forms", "decimal_compare", "decimal_round"]);
  assert.equal(nextMicro({ attempts: [] }), "decimal_divide", "new Lessons 13-16 content should lead a fresh profile");

  const mildMaintenanceGap = [
    attempt("decimal_divide", true, { assessmentArchetype: "division_units", at: 1 }),
    attempt("decimal_add", false, { at: 2 })
  ];
  assert.equal(nextMicro({ attempts: mildMaintenanceGap }), "decimal_divide", "one maintenance miss should not crowd out an imminent under-sampled assessment");
  assert.notEqual(nextMicro({ attempts: mildMaintenanceGap }, { avoid: ["decimal_divide"] }), "decimal_divide", "recent-question spacing still applies");

  const severeMaintenanceGap = [...mildMaintenanceGap, attempt("decimal_add", false, { at: 3 })];
  assert.equal(nextMicro({ attempts: severeMaintenanceGap }), "decimal_add", "a demonstrated severe gap should still override assessment weighting");
});

test("a demonstrated Week 1-3 gap can return as spaced remediation", () => {
  const profile = { attempts: [
    attempt("decimal_round", false, { at: 1 }),
    attempt("decimal_round", false, { at: 2 })
  ] };
  assert.equal(microScore(profile, "decimal_round"), 14);
  assert.equal(nextMicro(profile), "decimal_round");
});

test("current assessment weakness remains eligible and outranks secure current skills", () => {
  const attempts = [];
  for (const micro of CURRENT_WEEK_MICROS) {
    attempts.push(attempt(micro, true, { difficulty: 3, at: attempts.length + 1 }));
  }
  attempts.push(attempt("decimal_divide", false, { difficulty: 3, assessmentArchetype: "division_algorithm", at: 100 }));
  attempts.push(attempt("decimal_divide", false, { difficulty: 3, assessmentArchetype: "division_algorithm", at: 101 }));
  assert.equal(nextMicro({ attempts }), "decimal_divide");
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

test("Week 4 diagnostic version invalidates the stale Lessons 1-2 check without erasing history", () => {
  assert.equal(DIAGNOSTIC_VERSION, 3);
  assert.equal(diagnosticIsCurrent({ diagnostic: true, diagnosticVersion: 2 }), false);
  assert.equal(diagnosticIsCurrent({ diagnostic: true, diagnosticVersion: 3 }), true);
});

test("recheck migration preserves history and schedules prior Week 4 evidence", () => {
  const profile = { recheckVersion: 1, rechecks: {}, attempts: [attempt("powers_divide", false), attempt("decimal_add", true), attempt("decimal_round", false)] };
  assert.equal(migrateAffectedRechecks(profile), true);
  assert.deepEqual(pendingRechecks(profile), ["decimal_add", "powers_divide"]);
  assert.equal(profile.attempts.length, 3, "migration must not erase earlier evidence");
  assert.equal(migrateAffectedRechecks(profile), false, "migration is one-time");
});
