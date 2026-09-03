import assert from "node:assert/strict";
import test from "node:test";

import {
  DIAGNOSTIC_BASE_MICROS,
  DIAGNOSTIC_MAX,
  DIAGNOSTIC_MIN,
  DIAGNOSTIC_PREREQUISITE_MICROS,
  diagnosticExpansion,
  diagnosticSummary,
  startDiagnostic
} from "../math/assets/mission1-diagnostic.mjs";

const result = (micro, correct) => ({ micro, correct });

test("progressive diagnostic starts with current powers-of-ten work only", () => {
  const queue = startDiagnostic();
  assert.equal(queue.length, 2);
  assert.equal(DIAGNOSTIC_MIN, 2);
  assert.equal(DIAGNOSTIC_MAX, 4);
  assert.deepEqual(queue.map(question => question.micro), DIAGNOSTIC_BASE_MICROS);
  assert.deepEqual(DIAGNOSTIC_BASE_MICROS, ["powers_multiply", "powers_divide"]);
  assert.deepEqual(DIAGNOSTIC_PREREQUISITE_MICROS, ["place_digit", "place_value"]);
});

test("secure current-focus evidence ends the diagnostic after two questions", () => {
  const queue = startDiagnostic();
  const results = [result("powers_multiply", true), result("powers_divide", true)];
  assert.deepEqual(diagnosticExpansion(queue, results), []);
  assert.deepEqual(diagnosticSummary(results), {
    currentComplete: true,
    currentSecure: true,
    prerequisiteProbeNeeded: false,
    prerequisiteComplete: false
  });
});

test("one current-focus miss adds only prerequisite place-value probes", () => {
  const queue = startDiagnostic();
  const results = [result("powers_multiply", true), result("powers_divide", false)];
  const expansion = diagnosticExpansion(queue, results);
  assert.deepEqual(expansion.map(question => question.micro), DIAGNOSTIC_PREREQUISITE_MICROS);
  assert.equal(queue.length + expansion.length, DIAGNOSTIC_MAX);
  assert.equal(expansion.some(question => /decimal_(?:round|add|subtract|multiply|divide)|metric_conversion/.test(question.micro)), false);
});

test("diagnostic expansion is one-time and never grows beyond four questions", () => {
  const initial = startDiagnostic();
  const results = [result("powers_multiply", false), result("powers_divide", false)];
  const expansion = diagnosticExpansion(initial, results);
  const expanded = [...initial, ...expansion];
  assert.equal(expanded.length, 4);
  assert.deepEqual(diagnosticExpansion(expanded, results), []);
});
