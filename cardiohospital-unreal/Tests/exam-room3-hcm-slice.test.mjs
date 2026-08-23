import assert from "node:assert/strict";
import test from "node:test";

import {
  loadSliceInputs,
  validateVerticalSlice,
} from "../Tools/validate-exam-room3-hcm-slice.mjs";

function clone(value) {
  return structuredClone(value);
}

test("Exam Room 3 HCM slice passes its portable acceptance contract", async () => {
  const { contract, clinical } = await loadSliceInputs();
  const report = validateVerticalSlice(contract, clinical);

  assert.equal(report.passed, true, report.failures.join("\n"));
  assert.deepEqual(report.failures, []);

  const table = report.assetReports.find((asset) => asset.id === "CH-EXAMTABLE-001");
  assert.equal(table.fits, true);

  const ecg = report.assetReports.find((asset) => asset.id === "CH-WALLECG-001");
  assert.equal(ecg.fits, false);
  assert.deepEqual(ecg.failedAxes.sort(), ["x", "y"]);
});

test("presentation layer cannot take ownership of clinical truth", async () => {
  const { contract, clinical } = await loadSliceInputs();
  const mutated = clone(contract);
  mutated.runtime.presentationMustNotMutateClinicalTruth = false;

  const report = validateVerticalSlice(mutated, clinical);
  assert.equal(report.passed, false);
  assert.ok(report.failures.some((failure) => failure.includes("mutating clinical truth")));
});

test("required HCM actions are bound to the deterministic case graph", async () => {
  const { contract, clinical } = await loadSliceInputs();
  const mutated = clone(clinical);
  const graph = mutated.caseGraphs.find((candidate) => candidate.caseId === contract.caseId);
  graph.actions = graph.actions.filter((action) => action.id !== "history.exertional-timing");

  const report = validateVerticalSlice(contract, mutated);
  assert.equal(report.passed, false);
  assert.ok(report.failures.includes("Required slice action missing from graph: history.exertional-timing"));
});

test("oversized wall ECG cannot silently advance to integration target", async () => {
  const { contract, clinical } = await loadSliceInputs();
  const mutated = clone(contract);
  const ecg = mutated.assets.find((asset) => asset.id === "CH-WALLECG-001");
  ecg.status = "integration_target";

  const report = validateVerticalSlice(mutated, clinical);
  assert.equal(report.passed, false);
  assert.ok(report.failures.some((failure) => failure.includes("CH-WALLECG-001 does not fit")));
});

test("all three benchmark cameras are mandatory", async () => {
  const { contract, clinical } = await loadSliceInputs();
  const mutated = clone(contract);
  mutated.cameras.pop();

  const report = validateVerticalSlice(mutated, clinical);
  assert.equal(report.passed, false);
  assert.ok(report.failures.some((failure) => failure.includes("exactly 3 locked cameras")));
});
