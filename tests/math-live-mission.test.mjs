import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  clampProgress,
  liveMissionState,
  objectiveForMicro,
  reactionForAttempt
} from "../math/assets/live-mission-core.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");

test("live mission progress never leaves the 0-100 route", () => {
  assert.equal(clampProgress(-40), 0);
  assert.equal(clampProgress(37.5), 37.5);
  assert.equal(clampProgress(180), 100);
});

test("mission objectives are math-specific and recovery-aware", () => {
  const normal = objectiveForMicro("powers_multiply");
  const recovery = objectiveForMicro("powers_multiply", { recovery: true });
  assert.match(normal.title, /forward drive/i);
  assert.equal(normal.status, "Current objective");
  assert.equal(recovery.status, "Recovery pass");
});

test("misses create anomalies without punishment and recovery is positive", () => {
  assert.equal(reactionForAttempt({ correct: false, assisted: false }), "anomaly");
  assert.equal(reactionForAttempt({ correct: true, recovery: true, assisted: false }), "recovery");
  assert.equal(reactionForAttempt({ correct: true, assisted: false }), "thrust");
});

test("guided work is represented as repair rather than independent advancement", () => {
  const state = liveMissionState({
    progress: 40,
    micro: "place_value",
    attempt: { correct: true, assisted: true },
    flags: { assisted: true }
  });
  assert.equal(state.progress, 40);
  assert.equal(state.objective.status, "Guided repair");
  assert.equal(state.reaction, "guided");
});

test("Math Mission loads the live layer while preserving the 80/20 guard", () => {
  const html = fs.readFileSync(path.join(repo, "math/index.html"), "utf8");
  const live = fs.readFileSync(path.join(repo, "math/assets/live-mission.mjs"), "utf8");
  assert.match(html, /live-mission\.mjs/);
  assert.match(html, /education-game-budget\.mjs/);
  assert.match(live, /#progress-fill/);
  assert.match(live, /attempts\.at\(-1\)/);
  assert.doesNotMatch(live, /localStorage\.setItem\(MATH_KEY/);
});
