import assert from "node:assert/strict";
import test from "node:test";

import { isCorrectAnswer } from "../math/assets/mission1-content.mjs";
import {
  checkpointFor,
  guidedBuildFor,
  misconceptionForAttempt,
  missCueFor
} from "../math/assets/mission1-scaffolds.mjs";

const divideQuestion = {
  micro: "powers_divide",
  skill: "place",
  prompt: "36.4 ÷ 100",
  answer: "0.364",
  why: "Divide by 100.",
  options: null,
  audit: { kind: "scale", operation: "divide", a: 36.4, factor: 100 },
  workspace: { type: "place-value", operation: "divide", value: 36.4, factor: 100, shift: 2 },
  difficulty: 2,
  assisted: false,
  recovery: false,
  transfer: false,
  placeholder: "Number only",
  scratch: "place",
  scaffoldText: ""
};

test("workspace evidence separates direction, shift-count, and unresolved-result misses", () => {
  assert.equal(misconceptionForAttempt(divideQuestion, { delta: 1, expectedDelta: -2 }), "wrong_direction");
  assert.equal(misconceptionForAttempt(divideQuestion, { delta: -1, expectedDelta: -2 }), "wrong_shift_count");
  assert.equal(misconceptionForAttempt(divideQuestion, { delta: 0, expectedDelta: -2 }), "place_value_result");
});

test("wrong-direction misses get a non-scoring relationship checkpoint", () => {
  const checkpoint = checkpointFor(divideQuestion, "wrong_direction");
  assert.equal(checkpoint.nonScoring, true);
  assert.equal(checkpoint.scaffoldStage, "checkpoint");
  assert.equal(checkpoint.scaffoldReason, "wrong_direction");
  assert.deepEqual(checkpoint.options, ["new value > starting value", "new value < starting value"]);
  assert.equal(checkpoint.workspace, null);
  assert.equal(isCorrectAnswer("new value < starting value", checkpoint), true);
  assert.equal(isCorrectAnswer("new value > starting value", checkpoint), false);
  assert.match(missCueFor(divideQuestion, "wrong_direction"), /direction/i);
});

test("wrong-shift-count misses get a non-scoring place-count checkpoint", () => {
  const checkpoint = checkpointFor(divideQuestion, "wrong_shift_count");
  assert.equal(checkpoint.nonScoring, true);
  assert.equal(checkpoint.answer, "2");
  assert.deepEqual(checkpoint.options, ["1", "2", "3"]);
  assert.equal(isCorrectAnswer("2", checkpoint), true);
  assert.equal(isCorrectAnswer("1", checkpoint), false);
  assert.match(missCueFor(divideQuestion, "wrong_shift_count"), /how many places|power of 10/i);
});

test("checkpoint escalation returns to the original problem with the guided chart", () => {
  const guided = guidedBuildFor(divideQuestion);
  assert.equal(guided.assisted, true);
  assert.equal(guided.nonScoring, false);
  assert.equal(guided.scaffoldStage, "guided-build");
  assert.deepEqual(guided.workspace, divideQuestion.workspace);
  assert.equal(guided.prompt, divideQuestion.prompt);
  assert.equal(guided.answer, divideQuestion.answer);
});
