import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { diagnoseMathError, makeRepairQuestion } from "../math/assets/mission1-error-diagnosis.mjs";

const question = (micro, answer, audit) => ({
  micro,
  skill: "test",
  answer: String(answer),
  audit,
  difficulty: 2,
  transfer: false,
  recovery: false,
  assisted: false,
  options: null,
  prompt: "test",
  why: "test"
});

test("decimal multiplication decimal-place errors get a magnitude repair", () => {
  const q = question("decimal_multiply", "2.52", { kind: "product", aScaled: 42, aPlaces: 2, bScaled: 6, bPlaces: 0 });
  const diagnosis = diagnoseMathError("25.2", q);
  assert.equal(diagnosis.key, "decimal_magnitude");
  assert.match(diagnosis.message, /decimal.*wrong place/i);
  assert.ok(diagnosis.repair.options.includes("2.52"));
  assert.equal(diagnosis.repair.answer, "2.52");
});

test("decimal division decimal-place errors get a magnitude repair", () => {
  const q = question("decimal_divide", "1.26", { kind: "quotient", dividendScaled: 756, dividendPlaces: 2, divisor: 6 });
  const diagnosis = diagnoseMathError("12.6", q);
  assert.equal(diagnosis.key, "decimal_magnitude");
  assert.match(diagnosis.repair.why, /magnitude/i);
});

test("power-of-ten direction reversals are identified", () => {
  const q = question("powers_divide", "0.364", { kind: "scale", operation: "divide", a: 36.4, factor: 100 });
  const diagnosis = diagnoseMathError("3640", q);
  assert.equal(diagnosis.key, "power10_direction");
  assert.equal(diagnosis.repair.answer, "Less");
});

test("rounding truncation is distinguished from a generic wrong answer", () => {
  const q = question("decimal_round", "18.38", { kind: "round", thousandths: 18376, digits: 2 });
  const diagnosis = diagnoseMathError("18.37", q);
  assert.equal(diagnosis.key, "rounding_truncated");
  assert.match(diagnosis.message, /round up/i);
});

test("digit versus digit-value confusion is identified", () => {
  const q = question("place_value", "0.03", { kind: "digitValue", numberText: "4.731", place: "hundredths" });
  const diagnosis = diagnoseMathError("3", q);
  assert.equal(diagnosis.key, "digit_vs_value");
  assert.equal(diagnosis.repair.answer, "hundredths of a whole");
});

test("two-step division detects skipped subtraction", () => {
  const q = question("decimal_divide", "1.5", { kind: "subtractDivide", totalScaled: 1200, usedScaled: 300, places: 2, divisor: 6 });
  const diagnosis = diagnoseMathError("2", q);
  assert.equal(diagnosis.key, "multistep_skipped_subtraction");
  assert.equal(diagnosis.repair.answer, "Subtract the amount used");
});

test("repair questions are one-tap assisted checks and do not reuse the original workspace", () => {
  const q = { ...question("decimal_add", "20.18", { kind: "add", aScaled: 648, bScaled: 1370, places: 2 }), workspace: { type: "place-value" } };
  const diagnosis = diagnoseMathError("19.88", q);
  const repair = makeRepairQuestion(q, diagnosis);
  assert.equal(repair.assisted, true);
  assert.equal(repair.repairOnly, true);
  assert.equal(repair.workspace, null);
  assert.ok(Array.isArray(repair.options));
  assert.ok(repair.options.length >= 2);
  assert.equal(repair.scaffoldText, diagnosis.message);
});

test("misconception labels and diagnostic version 3 are preserved by cloud format", async () => {
  const cloud = await readFile(new URL("../math/assets/math-cloud.js", import.meta.url), "utf8");
  assert.match(cloud, /VALID_MISCONCEPTIONS/);
  assert.match(cloud, /"math1d"/);
  assert.match(cloud, /misconception:parts\[9\]/);
  assert.match(cloud, /math1diagnostic3/);
  assert.match(cloud, /diagnosticVersion=Math\.max\(Number\(p\.diagnosticVersion\)\|\|0,3\)/);
});
