import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const gate = fs.readFileSync(path.join(root, 'docs/KD_MISC_M2_KIDMATCH_AUTHENTICITY_GATE.md'), 'utf8');
const clinicalSource = [
  'tools/kd-misc-experimental/index.html',
  'tools/kd-misc-experimental/app.js',
  'tools/kd-misc-experimental/evidence-registry.js',
].map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');

test('M2 records the release claim without claiming an authenticated deployable artifact', () => {
  assert.match(gate, /Status: \*\*KIDMATCH INTEGRATION BLOCKED\*\*/);
  assert.match(gate, /has now been released and is generally available/i);
  assert.match(gate, /authoritative deployable public artifact not independently located/i);
  assert.match(gate, /This is a search result, not evidence that no such artifact exists/i);
});

test('M2 preserves the chronology that makes version mapping necessary', () => {
  assert.match(gate, /2022 model-development and validation paper/i);
  assert.match(gate, /unable to share the algorithm while applying for FDA Software-as-a-Medical-Device approval/i);
  assert.match(gate, /2023 implementation report/i);
  assert.match(gate, /2024 PCORI final report/i);
  assert.match(gate, /2025 United States external KD validation/i);
  assert.match(gate, /2026 international validation lineage/i);
  assert.match(gate, /must not assume that "KIDMATCH" \(2022\).*"Kawasaki MATCH" \(2026\) are interchangeable model binaries/is);
});

test('integration requires the authentic inference and preprocessing package', () => {
  for (const required of [
    'Stage 1 model weights and architecture serialization',
    'Stage 2 model weights and architecture serialization',
    'Exact feature names and ordering',
    'Exact stage-specific classification thresholds',
    'Training-derived mean and standard-deviation constants used for normalization',
    'Exact 0.5th and 99.5th percentile clipping values',
    'KNN imputation reference/training representation',
    'Exact age-adjusted hemoglobin transformation/reference',
    'Unit contract for every laboratory input',
  ]) {
    assert.ok(gate.includes(required), `missing KIDMATCH authenticity requirement: ${required}`);
  }
});

test('integration requires conformal rejection and authoritative test-vector parity', () => {
  for (const required of [
    'Exact nonconformity/trust-set formulation',
    'Calibration/reference data or serialized calibration artifacts',
    'Exact acceptance/rejection thresholds',
    'Confirmed behavior when a sample is rejected: no forced classification',
    'Authoritative synthetic/deidentified test inputs with expected preprocessing results',
    'Expected conformal accept/reject result',
    'Mapping between the artifact and the model version evaluated in the 2022, 2025, and/or 2026 publications',
  ]) {
    assert.ok(gate.includes(required), `missing KIDMATCH parity requirement: ${required}`);
  }
});

test('the live clinical source still refuses to reproduce or emulate KIDMATCH', () => {
  assert.match(clinicalSource, /KIDMATCH:<\/strong> not reproduced here/i);
  assert.match(clinicalSource, /verified authoritative implementation, model artifacts, preprocessing, licensing, and rejection behavior/i);
  assert.doesNotMatch(clinicalSource, /KIDMATCH-like/i);
  assert.doesNotMatch(clinicalSource, /model\.predict\s*\(/i);
  assert.doesNotMatch(clinicalSource, /tensorflow|keras/i);
});
