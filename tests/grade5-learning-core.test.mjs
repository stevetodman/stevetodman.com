import test from "node:test";
import assert from "node:assert/strict";
import { buildQueue, normalizeStore, skillScore, skillStatus, validateCurriculum } from "../study/grade5-learning-core.mjs";

const config = {
  currentUnit: "u1",
  units: [{ id: "u1" }, { id: "u2" }],
  items: Array.from({ length: 12 }, (_, index) => ({ id: `q${index}`, unit: index < 8 ? "u1" : "u2", skill: `s${index % 4}`, standard: `x${index % 4}`, prompt: "Question", choices: ["A", "B", "C"], answer: 0, explanation: "Because." }))
};

test("normalizes corrupt storage without mixing learner records", () => {
  const root = normalizeStore({ version: 1, learners: { Luke: { attempts: [{ correct: true }] } } });
  assert.equal(root.learners.Luke.attempts.length, 1);
  assert.equal(root.learners.Samantha.attempts.length, 0);
});

test("misses outweigh a single correct answer and mastery needs multiple days", () => {
  const profile = { attempts: [
    { skill: "models", correct: true, date: "2026-09-01" },
    { skill: "models", correct: false, date: "2026-09-01" }
  ] };
  assert.equal(skillScore(profile, "models"), 34);
  assert.equal(skillStatus(profile, "models").mastered, false);
  profile.attempts.push({ skill: "models", correct: true, date: "2026-09-02" }, { skill: "models", correct: true, date: "2026-09-03" }, { skill: "models", correct: true, date: "2026-09-03" }, { skill: "models", correct: true, date: "2026-09-03" });
  assert.equal(skillStatus(profile, "models").mastered, true);
});

test("current-unit queue stays inside the selected unit", () => {
  const queue = buildQueue(config, { attempts: [], skills: {} }, { unitId: "u1", random: () => .5 });
  assert.equal(queue.length, 8);
  assert.ok(queue.every(id => config.items.find(item => item.id === id).unit === "u1"));
});

test("curriculum validation rejects incomplete or mis-keyed items", () => {
  assert.equal(validateCurriculum(config), true);
  assert.throws(() => validateCurriculum({ ...config, items: [...config.items, { ...config.items[0] }] }), /Duplicate/);
  assert.throws(() => validateCurriculum({ ...config, items: [{ ...config.items[0], answer: 9 }] }), /Invalid answer/);
});
