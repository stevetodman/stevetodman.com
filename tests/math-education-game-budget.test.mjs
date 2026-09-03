import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  MAX_GAME_SHARE,
  addEducationMs,
  gameAllowanceMs,
  gameShare,
  remainingGameMs,
  spendGameMs,
  withinEducationRatio
} from "../math/assets/education-game-budget-core.mjs";

test("four seconds of education earns at most one second of game-only time", () => {
  const budget = addEducationMs({ cycleId: "luke:1" }, 4 * 60_000);
  assert.equal(gameAllowanceMs(budget), 60_000);
  assert.equal(remainingGameMs(budget), 60_000);
});

test("spending the full allowance lands exactly at the 20 percent game ceiling", () => {
  const learned = addEducationMs({ cycleId: "samantha:3" }, 8 * 60_000);
  const result = spendGameMs(learned, 10 * 60_000);
  assert.equal(result.spentMs, 2 * 60_000);
  assert.equal(result.blockedMs, 8 * 60_000);
  assert.equal(gameShare(result.budget), MAX_GAME_SHARE);
  assert.equal(withinEducationRatio(result.budget), true);
  assert.equal(remainingGameMs(result.budget), 0);
});

test("game-only time cannot be spent before education time is earned", () => {
  const result = spendGameMs({ cycleId: "luke:4", educationMs: 0, gameMs: 0 }, 30_000);
  assert.equal(result.spentMs, 0);
  assert.equal(result.blockedMs, 30_000);
  assert.equal(gameShare(result.budget), 0);
});

test("Math Mission loads the runtime 80/20 guard", () => {
  const html = fs.readFileSync(new URL("../math/index.html", import.meta.url), "utf8");
  assert.match(html, /education-game-budget\.mjs\?v=/);
});
