import assert from "node:assert/strict";
import test from "node:test";

import { generateCurrentWeekQuestion } from "../math/assets/mission1-current-week.mjs";
import { isCorrectAnswer } from "../math/assets/mission1-content.mjs";

function seededRandom(seed = 0x1234abcd) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

test("current-week powers-of-ten questions remain independently answerable across difficulty levels", () => {
  const random = seededRandom();
  for (const micro of ["powers_multiply", "powers_divide"]) {
    for (let difficulty = 1; difficulty <= 3; difficulty += 1) {
      for (let index = 0; index < 1000; index += 1) {
        const question = generateCurrentWeekQuestion(micro, difficulty, random);
        assert.equal(question.micro, micro);
        assert.equal(question.skill, "place");
        assert.equal(question.audit.kind, "scale");
        assert.equal(question.scratch, "place");
        assert.equal(question.workspace.type, "place-value");
        assert.equal(question.workspace.operation, question.audit.operation);
        assert.equal(question.workspace.value, question.audit.a);
        assert.equal(question.workspace.factor, question.audit.factor);
        assert.ok([1, 2, 3].includes(question.workspace.shift));
        assert.equal(isCorrectAnswer(question.answer, question), true, question.prompt);
      }
    }
  }
});

test("advanced weekly practice includes direct place-value reasoning, reverse reasoning, and error analysis", () => {
  const random = seededRandom(77);
  const questions = [];
  for (const micro of ["powers_multiply", "powers_divide"]) {
    for (let index = 0; index < 300; index += 1) questions.push(generateCurrentWeekQuestion(micro, 3, random));
  }

  assert.ok(questions.some(question => /predict how the value of each digit changes/i.test(question.prompt)), "needs direct place-value prediction questions");
  assert.ok(questions.some(question => /what was the starting number/i.test(question.prompt)), "needs reverse place-value reasoning questions");
  assert.ok(questions.some(question => /A student says|wrong direction/i.test(question.prompt)), "needs error-analysis questions");
  assert.ok(questions.some(question => /append .*zero/i.test(question.prompt)), "needs the photographed zero-appending misconception family");
  assert.ok(questions.some(question => /justify the direction/i.test(question.prompt)), "needs division-direction justification");
  assert.ok(questions.every(question => /10<sup>[123]<\/sup>/.test(question.prompt)), "weekly questions should expose powers-of-ten notation");
});

test("guided weekly questions expose the place-value scaffold while independent questions do not", () => {
  const guided = generateCurrentWeekQuestion("powers_divide", 2, seededRandom(2), { assisted: true });
  const independent = generateCurrentWeekQuestion("powers_divide", 2, seededRandom(2));
  assert.match(guided.scaffoldText, /place-value chart/i);
  assert.match(guided.scaffoldText, /digit/i);
  assert.equal(guided.workspace.type, "place-value");
  assert.equal(independent.workspace.type, "place-value");
  assert.equal(independent.scaffoldText, "");
});

test("secondary review skills still delegate to the full Module 1 generator", () => {
  const question = generateCurrentWeekQuestion("metric_conversion", 3, seededRandom(9));
  assert.equal(question.micro, "metric_conversion");
  assert.equal(isCorrectAnswer(question.answer, question), true);
});
