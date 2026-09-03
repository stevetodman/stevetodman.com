import assert from "node:assert/strict";
import test from "node:test";
import { sectorForSessions } from "../math/assets/starship-economy-core.mjs";
import { ROUTE_STOPS, patchState, routeState, unlockedPatchIds } from "../math/assets/starship-progression-core.mjs";

test("star chart advances only at completed-mission route boundaries", () => {
  assert.equal(routeState({ sessions: 0 }).current.id, "launch-bay");
  assert.equal(routeState({ sessions: 1 }).current.id, "launch-bay");
  assert.equal(routeState({ sessions: 2 }).current.id, "moon-orbit");
  assert.equal(routeState({ sessions: 5 }).current.id, "asteroid-belt");
  assert.equal(routeState({ sessions: 9 }).current.id, "nebula-gate");
  assert.equal(routeState({ sessions: 14 }).current.id, "deep-space");
});

test("star chart landmarks stay aligned with the economy sector model", () => {
  for (const stop of ROUTE_STOPS) {
    const sector = sectorForSessions(stop.sessions);
    assert.equal(sector.id, stop.id);
    assert.equal(sector.name, stop.name);
  }
});

test("patches reward independent evidence and ignore assisted or missed work", () => {
  const ids = unlockedPatchIds({
    sessions: 1,
    attempts: [
      { micro: "powers_multiply", correct: true, assisted: false },
      { micro: "powers_divide", correct: true, assisted: true },
      { micro: "decimal_add", correct: false, assisted: false, transfer: true },
      { micro: "decimal_subtract", correct: true, assisted: false, recovery: true }
    ]
  });
  assert.equal(ids.has("first-launch"), true);
  assert.equal(ids.has("comeback-pilot"), true);
  assert.equal(ids.has("powers-navigator"), false);
  assert.equal(ids.has("transfer-scout"), false);
});

test("decimal cartographer requires four distinct decimal micro-skills", () => {
  const nonDecimal = unlockedPatchIds({
    attempts: [
      { micro: "place_digit", correct: true, assisted: false },
      { micro: "place_value", correct: true, assisted: false },
      { micro: "powers_multiply", correct: true, assisted: false },
      { micro: "metric_conversion", correct: true, assisted: false }
    ]
  });
  assert.equal(nonDecimal.has("decimal-cartographer"), false);

  const decimal = unlockedPatchIds({
    attempts: [
      { micro: "decimal_forms", correct: true, assisted: false },
      { micro: "decimal_compare", correct: true, assisted: false },
      { micro: "decimal_round", correct: true, assisted: false },
      { micro: "decimal_add", correct: true, assisted: false }
    ]
  });
  assert.equal(decimal.has("decimal-cartographer"), true);
});

test("patch state is derived from learning history and stores no parallel mastery state", () => {
  const state = patchState({
    sessions: 10,
    attempts: [
      { micro: "powers_multiply", correct: true, assisted: false, difficulty: 3, transfer: true },
      { micro: "powers_divide", correct: true, assisted: false, difficulty: 3 },
      { micro: "decimal_add", correct: true, assisted: false, difficulty: 3, recheck: true }
    ]
  });
  assert.equal(state.unlockedCount > 0, true);
  assert.equal(state.total, state.patches.length);
  assert.equal(Object.hasOwn(state, "mastery"), false);
});
