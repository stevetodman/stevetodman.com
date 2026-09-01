import assert from "node:assert/strict";
import test from "node:test";

import {
  PLACE_VALUE_COLUMNS,
  expectedPlaceValueDelta,
  placeValueTokensFor,
  shiftPlaceValueTokens
} from "../math/assets/mission1-place-value.mjs";

test("place-value tokens map digits to their actual base-ten units", () => {
  assert.deepEqual(placeValueTokensFor(74.3), [
    { digit: "7", exponent: 1 },
    { digit: "4", exponent: 0 },
    { digit: "3", exponent: -1 }
  ]);
  assert.deepEqual(placeValueTokensFor(0.205), [
    { digit: "0", exponent: 0 },
    { digit: "2", exponent: -1 },
    { digit: "0", exponent: -2 },
    { digit: "5", exponent: -3 }
  ]);
});

test("shifting changes digit place values while the decimal point remains a fixed chart boundary", () => {
  const original = placeValueTokensFor(74.3);
  const left = shiftPlaceValueTokens(original, 2);
  const right = shiftPlaceValueTokens(original, -1);

  assert.deepEqual(left, [
    { digit: "7", exponent: 3 },
    { digit: "4", exponent: 2 },
    { digit: "3", exponent: 1 }
  ]);
  assert.deepEqual(right, [
    { digit: "7", exponent: 0 },
    { digit: "4", exponent: -1 },
    { digit: "3", exponent: -2 }
  ]);
  assert.ok(PLACE_VALUE_COLUMNS.some(column => column.exponent === 0 && column.label === "Ones"));
  assert.equal(PLACE_VALUE_COLUMNS.some(column => Object.hasOwn(column, "decimal")), false, "decimal point is not a movable digit token");
});

test("powers-of-ten operations require the correct direction and number of shifts", () => {
  assert.equal(expectedPlaceValueDelta({ operation: "multiply", shift: 1 }), 1);
  assert.equal(expectedPlaceValueDelta({ operation: "multiply", shift: 3 }), 3);
  assert.equal(expectedPlaceValueDelta({ operation: "divide", shift: 1 }), -1);
  assert.equal(expectedPlaceValueDelta({ operation: "divide", shift: 3 }), -3);
});
