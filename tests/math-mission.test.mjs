import assert from "node:assert/strict";
import test from "node:test";

import {
  MICRO_SKILLS,
  SKILLS,
  diagnostic,
  generate,
  isCorrectAnswer,
  validateQuestion
} from "../math/assets/mission1-content.mjs";

const placeIndex = { tenths: 0, hundredths: 1, thousandths: 2 };
const clean = value => String(value).trim().replaceAll(",", "");
const numeric = value => Number(clean(value));
const decimalPlaces = value => {
  const text = String(value);
  return text.includes(".") ? text.split(".")[1].length : 0;
};

function independentExpected(audit) {
  switch (audit.kind) {
    case "digitAtPlace": return String(Number(audit.numberText.split(".")[1].padEnd(3, "0")[placeIndex[audit.place]]));
    case "digitValue": return String(Number(audit.numberText.split(".")[1].padEnd(3, "0")[placeIndex[audit.place]]) / (10 ** (placeIndex[audit.place] + 1)));
    case "scale": return String(audit.operation === "multiply" ? audit.a * audit.factor : audit.a / audit.factor);
    case "metric": return String(audit.operation === "divide" ? audit.a / audit.factor : audit.a * audit.factor);
    case "sum": return String(audit.values.reduce((sum, value) => sum + value, 0));
    case "expanded": return String(audit.expected);
    case "compare": return `${audit.left} ${audit.aScaled < audit.bScaled ? "<" : audit.aScaled > audit.bScaled ? ">" : "="} ${audit.right}`;
    case "order": return [...audit.values].sort((a, b) => Number(a) - Number(b)).join(", ");
    case "round": { const divisor = 10 ** (3 - audit.digits); return String(Math.floor((audit.thousandths + divisor / 2) / divisor) * divisor / 1000); }
    case "roundMinimum": return String((audit.targetTenths * 10 - 5) / 100);
    case "add": return String((audit.aScaled + audit.bScaled) / (10 ** audit.places));
    case "subtract": return String((audit.aScaled - audit.bScaled) / (10 ** audit.places));
    case "product": return String((audit.aScaled * audit.bScaled) / (10 ** (audit.aPlaces + audit.bPlaces)));
    case "quotient": return String((audit.dividendScaled / (10 ** audit.dividendPlaces)) / audit.divisor);
    case "subtractDivide": return String(((audit.totalScaled - audit.usedScaled) / (10 ** audit.places)) / audit.divisor);
    default: throw new Error(`Unhandled audit kind: ${audit.kind}`);
  }
}

function assertQuestion(question) {
  assert.ok(MICRO_SKILLS[question.micro], `unknown micro-skill ${question.micro}`);
  assert.equal(question.skill, MICRO_SKILLS[question.micro].skill);
  assert.doesNotMatch(question.prompt, /times (?:as much as|the value of)/i);
  assert.equal(validateQuestion(question), true);
  assert.equal(isCorrectAnswer(question.answer, question), true, `${question.prompt} rejects its answer`);

  const independentlySolved = independentExpected(question.audit);
  if (question.audit.kind === "expanded") assert.equal(numeric(question.answer.split("+").reduce((sum, term) => sum + numeric(term), 0)), numeric(independentlySolved));
  else if (/^(?:digitAtPlace|digitValue|scale|metric|sum|round|roundMinimum|add|subtract|product|quotient|subtractDivide)$/.test(question.audit.kind)) assert.ok(Math.abs(numeric(question.answer) - numeric(independentlySolved)) < 1e-9, `${question.prompt}: ${question.answer} !== ${independentlySolved}`);
  else assert.equal(question.answer.replaceAll(" ", ""), independentlySolved.replaceAll(" ", ""));

  if (question.micro === "decimal_compare") {
    const values = question.audit.kind === "order" ? question.audit.values : [question.audit.left, question.audit.right];
    assert.ok(values.every(value => decimalPlaces(value) <= 3), `${question.prompt} exceeds thousandths`);
  }
  if (question.micro === "decimal_multiply") {
    assert.equal(question.audit.bPlaces, 0, `${question.prompt} should multiply by a whole-number factor`);
    assert.ok(Number.isInteger(question.audit.bScaled) && question.audit.bScaled >= 2 && question.audit.bScaled <= 9, `${question.prompt} needs a one-digit whole-number factor`);
  }
  if (question.micro === "metric_conversion") {
    assert.ok(["multiply", "divide"].includes(question.audit.operation));
    assert.ok(decimalPlaces(question.answer) <= 3, `${question.prompt} should stay within thousandths`);
  }

  if (question.options) {
    assert.equal(new Set(question.options).size, question.options.length, `${question.prompt} has duplicate choices`);
    assert.equal(question.options.filter(option => clean(option) === clean(question.answer)).length, 1, `${question.prompt} needs one keyed choice`);
  }
}

test("Module 1 domains use the Eureka topic sequence", () => {
  assert.deepEqual(Object.fromEntries(Object.entries(SKILLS).map(([key, value]) => [key, value.topic])), {
    place: "Topic A",
    forms: "Topic B",
    round: "Topic C",
    addsub: "Topic D",
    multiply: "Topic E",
    divide: "Topic F"
  });
});

test("the replacement 6.282 question names the actual hundredths digit", () => {
  const question = diagnostic()[0];
  assert.match(question.prompt, /hundredths place in <span class="math">6\.282<\/span>/);
  assert.equal(question.answer, "8");
  assert.equal(independentExpected(question.audit), "8");
  assert.doesNotMatch(question.prompt, /2 in the hundredths/i);
});

test("diagnostic has one independently verified question per micro-skill", () => {
  const questions = diagnostic();
  assert.equal(questions.length, 12);
  assert.deepEqual(new Set(questions.map(question => question.micro)), new Set(Object.keys(MICRO_SKILLS)));
  questions.forEach(assertQuestion);
});

test("equivalent numeric and expanded-form answers are accepted", () => {
  const questions = diagnostic();
  assert.equal(isCorrectAnswer("4,700.0", questions[2]), true);
  assert.equal(isCorrectAnswer(".300 + .005", questions[5]), true);
  assert.equal(isCorrectAnswer("0.005 + 0.30", questions[5]), true);
  assert.equal(isCorrectAnswer("0.304", questions[5]), false);
});

test("36,000 generated questions have independently verified keys and stay inside Module 1 boundaries", () => {
  let seed = 0x5eed1234;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 0x100000000; };
  for (const micro of Object.keys(MICRO_SKILLS)) for (let difficulty = 1; difficulty <= 3; difficulty += 1) for (let index = 0; index < 1000; index += 1) assertQuestion(generate(micro, difficulty, random));
});

test("Module 1 generators include Eureka-style models and both directions of measurement conversion", () => {
  const moduleMicros = Object.keys(MICRO_SKILLS);
  let seed = 123;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 0x100000000; };
  const samples = moduleMicros.flatMap(micro => Array.from({ length: 100 }, () => generate(micro, 3, random)));
  assert.ok(samples.some(question => question.scratch === "numberline"));
  assert.ok(samples.some(question => question.scratch === "tape" && /Use a tape diagram/i.test(question.prompt)));
  assert.ok(samples.some(question => /reasonable product/i.test(question.prompt)));
  assert.ok(samples.some(question => /Complete the pattern/i.test(question.prompt)));
  assert.ok(samples.some(question => /smallest possible number/i.test(question.prompt)));
  assert.ok(samples.some(question => /show both calculations/i.test(question.prompt)));
  const conversions = samples.filter(question => question.micro === "metric_conversion");
  assert.ok(conversions.some(question => question.audit.operation === "multiply"), "needs larger-to-smaller conversion practice");
  assert.ok(conversions.some(question => question.audit.operation === "divide"), "needs smaller-to-larger conversion practice");
  assert.ok(samples.filter(question => question.micro === "decimal_multiply").every(question => question.audit.bPlaces === 0));
});
