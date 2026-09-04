import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { repoRoot } from './helpers/harness.mjs';

const shadowDir = path.join(repoRoot, 'research', 'kd-misc-shadow');
const validator = path.join(shadowDir, 'validate.mjs');
const contract = JSON.parse(fs.readFileSync(path.join(shadowDir, 'data-contract.json'), 'utf8'));
const protocol = fs.readFileSync(path.join(repoRoot, 'docs', 'KD_MISC_M3_SHADOW_EVALUATION_PROTOCOL.md'), 'utf8');
const readme = fs.readFileSync(path.join(shadowDir, 'README.md'), 'utf8');
const gitignore = fs.readFileSync(path.join(shadowDir, '.gitignore'), 'utf8');

function enumMap(definition, value) {
  return Object.fromEntries(Object.keys(definition).map((key) => [key, value]));
}

function makeFeature(id = 'KDMSC-SYNTH001') {
  return {
    research_case_id: id,
    schema_version: contract.schema_version,
    evidence_version: '0.4-m1b-complete',
    applicability_inputs: enumMap(contract.modes.features.applicability_inputs, 'unknown'),
    evidence_inputs: enumMap(contract.modes.features.evidence_inputs, 'unknown'),
    model_input_availability: enumMap(contract.modes.features.model_input_availability, 'unknown'),
  };
}

function makeReference(id = 'KDMSC-SYNTH001') {
  return {
    research_case_id: id,
    schema_version: contract.schema_version,
    adjudication_status: 'final',
    adjudicated_outcome: 'indeterminate',
    adjudication_charter_version: 'synthetic-v1',
    initial_adjudication_blinded_to_workbench: 'yes',
    reviewer_disagreement: 'no',
  };
}

function makeOutput(id = 'KDMSC-SYNTH001') {
  return {
    research_case_id: id,
    schema_version: contract.schema_version,
    evidence_version: '0.4-m1b-complete',
    git_commit: 'f'.repeat(40),
    evidence_state: 'insufficient_discriminating_data',
    misc_evidence_ids: [],
    kd_evidence_ids: [],
    context_evidence_ids: [],
    starnes_status: 'not_calculated',
    kidmatch_status: 'not_integrated',
    captured_without_care_change: true,
  };
}

function writeJson(dir, name, value) {
  const filename = path.join(dir, name);
  fs.writeFileSync(filename, JSON.stringify(value, null, 2));
  return filename;
}

function runValidator(args) {
  return execFileSync(process.execPath, [validator, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function runValidatorExpectFailure(args) {
  const result = spawnSync(process.execPath, [validator, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0, `validator unexpectedly accepted: ${args.join(' ')}`);
  return `${result.stdout}\n${result.stderr}`;
}

test('M3 is prepared but not activated and makes no performance claim', () => {
  assert.match(protocol, /Status: \*\*PREPARED - NOT ACTIVATED\*\*/);
  assert.match(protocol, /No real patient data belong in this public repository/i);
  assert.match(protocol, /must not be incorporated into the reference diagnosis/i);
  assert.match(protocol, /does not issue a diagnosis/i);
  assert.match(protocol, /must not mislabel its performance as diagnostic sensitivity, specificity, or accuracy/i);
  assert.match(protocol, /M3 is complete only after the governed retrospective analysis is performed/i);
});

test('repository scaffold blocks patient data paths and documents local-only use', () => {
  assert.match(gitignore, /^data\/$/m);
  assert.match(gitignore, /^results\/$/m);
  assert.match(gitignore, /^\*\.local\.json$/m);
  assert.match(readme, /contains no patient data/i);
  assert.match(readme, /does \*\*not\*\* establish that a dataset satisfies institutional privacy/i);
  assert.match(readme, /calculate Starnes/i);
  assert.match(readme, /run or emulate KIDMATCH/i);
});

test('synthetic feature/reference/output files validate and crosscheck', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kd-misc-m3-'));
  try {
    const features = writeJson(dir, 'features.json', [makeFeature()]);
    const reference = writeJson(dir, 'reference.json', [makeReference()]);
    const output = writeJson(dir, 'output.json', [makeOutput()]);

    assert.match(runValidator(['features', features]), /Validated 1 features record/);
    assert.match(runValidator(['reference', reference]), /Validated 1 reference record/);
    assert.match(runValidator(['output', output]), /Validated 1 output record/);
    assert.match(runValidator(['crosscheck', features, reference, output]), /Crosscheck passed for 1 de-identified research case/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('schema mirrors the current v0.4 clinical and applicability inputs', () => {
  for (const key of ['abdominal-pain', 'diarrhea', 'vomiting', 'sore-throat', 'irritability']) {
    assert.ok(contract.modes.features.evidence_inputs[key], `missing current evidence input: ${key}`);
  }
  for (const key of ['target-age', 'fever-duration', 'pretreatment', 'icu-level-care']) {
    assert.ok(contract.modes.features.applicability_inputs[key], `missing applicability input: ${key}`);
  }
});

test('validator refuses identifier-like fields, exact dates, and incomplete Unknown-safe inputs', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kd-misc-m3-bad-'));
  try {
    const withMrn = makeFeature();
    withMrn.mrn = '123456789';
    const mrnFile = writeJson(dir, 'mrn.json', [withMrn]);
    assert.match(runValidatorExpectFailure(['features', mrnFile]), /not in the de-identified contract|forbidden identifier/i);

    const withDate = makeFeature();
    withDate.evidence_version = '2026-09-04';
    const dateFile = writeJson(dir, 'date.json', [withDate]);
    assert.match(runValidatorExpectFailure(['features', dateFile]), /exact calendar dates are not allowed/i);

    const missingUnknown = makeFeature();
    delete missingUnknown.evidence_inputs.platelet150;
    const missingFile = writeJson(dir, 'missing.json', [missingUnknown]);
    assert.match(runValidatorExpectFailure(['features', missingFile]), /platelet150: required field missing/i);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('crosscheck refuses case-ID or evidence-version drift', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kd-misc-m3-cross-'));
  try {
    const features = writeJson(dir, 'features.json', [makeFeature('KDMSC-SYNTH001')]);
    const reference = writeJson(dir, 'reference.json', [makeReference('KDMSC-SYNTH002')]);
    const output = makeOutput('KDMSC-SYNTH001');
    output.evidence_version = '0.3-m3';
    const outputFile = writeJson(dir, 'output.json', [output]);

    assert.match(
      runValidatorExpectFailure(['crosscheck', features, reference, outputFile]),
      /research-case ID sets differ|missing research case/i
    );

    const matchingReference = writeJson(dir, 'reference-matching.json', [makeReference('KDMSC-SYNTH001')]);
    assert.match(
      runValidatorExpectFailure(['crosscheck', features, matchingReference, outputFile]),
      /feature\/output evidence versions differ/i
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('validator contains no network or clinical inference engine', () => {
  const source = fs.readFileSync(validator, 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /XMLHttpRequest/);
  assert.doesNotMatch(source, /https?:\/\//i);
  assert.doesNotMatch(source, /model\.predict\s*\(/i);
  assert.doesNotMatch(source, /tensorflow|keras/i);
});
