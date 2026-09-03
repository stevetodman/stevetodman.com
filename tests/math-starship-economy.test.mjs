import test from "node:test";
import assert from "node:assert/strict";

import {
  STARTER_EQUIPMENT,
  deriveProgress,
  equipItem,
  levelForXp,
  purchaseItem,
  sanitizeGameProfile,
  sectorForSessions,
  xpForAttempt
} from "../math/assets/starship-economy-core.mjs";

test("starship XP rewards independent learning without rewarding misses or assisted work", () => {
  assert.equal(xpForAttempt({ correct: true }), 5);
  assert.equal(xpForAttempt({ correct: true, recovery: true }), 8);
  assert.equal(xpForAttempt({ correct: true, recheck: true }), 7);
  assert.equal(xpForAttempt({ correct: true, transfer: true }), 7);
  assert.equal(xpForAttempt({ correct: true, assisted: true }), 0);
  assert.equal(xpForAttempt({ correct: false, recovery: true }), 0);
});

test("progress derives from existing math history and keeps credits predictable", () => {
  const mathProfile = {
    sessions: 2,
    attempts: [
      { correct: true },
      { correct: true, recovery: true },
      { correct: true, assisted: true },
      { correct: false }
    ]
  };
  const p = deriveProgress(mathProfile, {});
  assert.equal(p.xp, 33);
  assert.equal(p.creditsEarned, 20);
  assert.equal(p.credits, 20);
  assert.equal(p.sector.name, "Moon Orbit");
  assert.equal(levelForXp(60), 2);
  assert.equal(sectorForSessions(14).name, "Deep Space");
});

test("one completed mission can buy the first visible upgrade exactly once", () => {
  const mathProfile = { sessions: 1, attempts: [] };
  const first = purchaseItem({}, mathProfile, "meteor-wake", 1234);
  assert.equal(first.ok, true);
  assert.equal(first.profile.equipped.trail, "meteor-wake");
  assert.equal(deriveProgress(mathProfile, first.profile).credits, 0);

  const duplicate = purchaseItem(first.profile, mathProfile, "meteor-wake", 5678);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.reason, "already-owned");
  assert.equal(deriveProgress(mathProfile, duplicate.profile).credits, 0);
});

test("unaffordable purchases fail without mutating learning or game progress", () => {
  const mathProfile = { sessions: 1, attempts: [{ correct: true, micro: "example" }] };
  const mathSnapshot = structuredClone(mathProfile);
  const gameProfile = sanitizeGameProfile({});
  const gameSnapshot = structuredClone(gameProfile);
  const result = purchaseItem(gameProfile, mathProfile, "nebula-runner", 999);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "not-enough-credits");
  assert.deepEqual(mathProfile, mathSnapshot);
  assert.deepEqual(gameProfile, gameSnapshot);
});

test("corrupt or unowned equipment falls back to safe starter equipment", () => {
  const repaired = sanitizeGameProfile({
    purchases: { "made-up-part": { at: 1 } },
    equipped: { hull: "made-up-hull", trail: "meteor-wake", companion: "orbit-bot" }
  });
  assert.deepEqual(repaired.purchases, {});
  assert.deepEqual(repaired.equipped, STARTER_EQUIPMENT);
});

test("owned upgrades can be re-equipped without changing their purchase cost", () => {
  const mathProfile = { sessions: 3, attempts: [] };
  const bought = purchaseItem({}, mathProfile, "meteor-wake", 100);
  const second = purchaseItem(bought.profile, mathProfile, "aurora-wake", 200);
  assert.equal(second.ok, true);
  assert.equal(second.profile.equipped.trail, "aurora-wake");

  const reequipped = equipItem(second.profile, "meteor-wake");
  assert.equal(reequipped.ok, true);
  assert.equal(reequipped.profile.equipped.trail, "meteor-wake");
  assert.equal(deriveProgress(mathProfile, reequipped.profile).credits, 4);
});
