import assert from "node:assert/strict";
import test from "node:test";

import {
  SKILLS,
  diagnostic,
  generate,
  isCorrectAnswer
} from "../math/assets/mission1-content.mjs";

function expectedFromAudit(audit) {
  switch (audit.kind) {
    case "multiply": return audit.a !== undefined
      ? audit.a * audit.b
      : (audit.hundredths * audit.factor) / 100;
    case "divide": return audit.a !== undefined
      ? audit.a / audit.b
      : (audit.dividendHundredths / 100) / audit.divisor;
    case "ratio": return audit.numerator / audit.denominator;
    case "sum": return audit.values.reduce((sum, value) => sum + value, 0);
    case "expanded": return audit.expected;
    case "compare": return audit.a < audit.b ? "<" : audit.a > audit.b ? ">" : "=";
    case "round": {
      const divisor = 10 ** (3 - audit.digits);
      return Math.floor((audit.thousandths + divisor / 2) / divisor) * divisor / 1000;
    }
    case "add": return (audit.hundredthsA + audit.hundredthsB) / 100;
    case "subtract": return (audit.hundredthsA - audit.hundredthsB) / 100;
    default: throw new Error(`Unhandled audit kind: ${audit.kind}`);
  }
}

function assertQuestion(question) {
  assert.ok(SKILLS[question.skill], `unknown skill ${question.skill}`);
  assert.ok(question.prompt);
  assert.ok(question.why);
  assert.ok(question.audit);
  assert.equal(isCorrectAnswer(question.answer, question), true, `${question.prompt} rejects its own answer`);

  const expected = expectedFromAudit(question.audit);
  if (typeof expected === "number") {
    const keyedNumber = Number.parseFloat(question.answer.replaceAll(",", ""));
    assert.ok(Math.abs(keyedNumber - expected) < 1e-9 || question.audit.kind === "expanded", `${question.prompt}: ${question.answer} !== ${expected}`);
  } else {
    assert.equal(question.audit.expected, expected, question.prompt);
  }

  if (question.options) {
    assert.equal(question.options.filter(option => option === question.answer).length, 1, `${question.prompt} must have one keyed option`);
  }
}

test("diagnostic has 12 verified questions and checks all six skills", () => {
  const questions = diagnostic();
  assert.equal(questions.length, 12);
  assert.deepEqual(new Set(questions.map(question => question.skill)), new Set(Object.keys(SKILLS)));
  questions.forEach(assertQuestion);
});

test("place-value comparison uses values and has the correct 300× key", () => {
  const question = diagnostic()[1];
  assert.match(question.prompt, /the 6 has how many times the value/);
  assert.equal(question.answer, "300 times");
  assert.equal(question.audit.numerator / question.audit.denominator, 300);
});

test("equivalent numeric and expanded-form answers are accepted", () => {
  const questions = diagnostic();
  assert.equal(isCorrectAnswer("4,700.0", questions[0]), true);
  assert.equal(isCorrectAnswer(".300 + .005", questions[4]), true);
  assert.equal(isCorrectAnswer("0.005 + 0.30", questions[4]), true);
  assert.equal(isCorrectAnswer("0.304", questions[4]), false);
});

test("30,000 generated questions have independently verified keys", () => {
  let seed = 0x5eed1234;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  for (const skill of Object.keys(SKILLS)) {
    for (let index = 0; index < 5000; index += 1) assertQuestion(generate(skill, random));
  }
});
