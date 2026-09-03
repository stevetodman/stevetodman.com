import assert from "node:assert/strict";
import test from "node:test";
import { laterModelFor } from "../math/assets/mission1-later-models.mjs";

const assisted = (micro, audit) => ({ micro, assisted: true, audit });

test("later-skill models stay hidden for independent work and unsupported skills", () => {
  assert.equal(laterModelFor({ micro: "decimal_round", assisted: false, audit: { kind: "round", thousandths: 18376, digits: 2 } }), null);
  assert.equal(laterModelFor({ micro: "powers_divide", assisted: true, audit: { kind: "scale", operation: "divide", a: 36.4, factor: 100 } }), null);
  assert.equal(laterModelFor({ micro: "metric_conversion", assisted: true, audit: { kind: "metric", operation: "multiply", a: 3.6, factor: 100 } }), null);
});

test("rounding model places the value between its two target-place benchmarks", () => {
  const model = laterModelFor(assisted("decimal_round", { kind: "round", thousandths: 18376, digits: 2 }));
  assert.equal(model.type, "rounding");
  assert.equal(model.value, "18.376");
  assert.equal(model.lower, "18.37");
  assert.equal(model.midpoint, "18.375");
  assert.equal(model.upper, "18.38");
  assert.equal(model.nearest, "18.38");
  assert.ok(model.position > 50 && model.position < 100);
});

test("addition and subtraction models align like place-value units with placeholder zeros", () => {
  const add = laterModelFor(assisted("decimal_add", { kind: "add", aScaled: 648, bScaled: 1370, places: 2 }));
  assert.equal(add.type, "aligned");
  assert.equal(add.a, "6.48");
  assert.equal(add.b, "13.70");
  assert.deepEqual(add.columns, ["tens", "ones", "tenths", "hundredths"]);
  assert.deepEqual(add.aDigits, ["0", "6", "4", "8"]);
  assert.deepEqual(add.bDigits, ["1", "3", "7", "0"]);
  assert.equal(add.symbol, "+");

  const subtract = laterModelFor(assisted("decimal_subtract", { kind: "subtract", aScaled: 2000, bScaled: 386, places: 2 }));
  assert.equal(subtract.a, "20.00");
  assert.equal(subtract.b, "3.86");
  assert.equal(subtract.symbol, "−");
});

test("multiplication model decomposes the decimal into place-value partial products", () => {
  const model = laterModelFor(assisted("decimal_multiply", { kind: "product", aScaled: 42, aPlaces: 2, bScaled: 6, bPlaces: 0 }));
  assert.equal(model.type, "area");
  assert.equal(model.multiplicand, "0.42");
  assert.equal(model.factor, 6);
  assert.deepEqual(model.terms.map(term => [term.place, term.valueText, term.partial]), [
    ["tenths", "0.4", "2.4"],
    ["hundredths", "0.02", "0.12"]
  ]);
});

test("division model renames the dividend into one place-value unit before sharing", () => {
  const model = laterModelFor(assisted("decimal_divide", { kind: "quotient", dividendScaled: 756, dividendPlaces: 2, divisor: 6 }));
  assert.equal(model.type, "sharing");
  assert.equal(model.dividend, "7.56");
  assert.equal(model.scaled, 756);
  assert.equal(model.unitName, "hundredths");
  assert.equal(model.divisor, 6);
  assert.equal(model.quotientUnits, "126");
  assert.equal(model.quotient, "1.26");
});
