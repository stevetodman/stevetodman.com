import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { repoRoot } from './helpers/harness.mjs';

const gateDir = path.join(
  repoRoot,
  'cardiohospital-unreal',
  'SourceAssets',
  'ExamRoom',
  'Gate1',
);

function runPython(script, args = []) {
  return spawnSync('python3', [script, ...args], {
    cwd: gateDir,
    encoding: 'utf8',
  });
}

function parseReport(result) {
  assert.ok(result.stdout, `expected JSON report; stderr=${result.stderr}`);
  return JSON.parse(result.stdout);
}

test('Exam Room 3 circulation gate remains green', () => {
  const result = runPython('validate_exam_room_greybox.py');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = parseReport(result);
  assert.equal(report.failed, 0);
  assert.equal(report.layout, 'v2');
});

test('hero-asset gate admits the exam table and blocks the oversized ECG candidate', () => {
  const result = runPython('validate_candidate_asset_fit.py');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = parseReport(result);

  const table = report.results.find((item) => item.id === 'CH-EXAMTABLE-001');
  const ecg = report.results.find((item) => item.id === 'CH-WALLECG-001');

  assert.ok(table, 'exam-table candidate missing from fit contract');
  assert.ok(ecg, 'wall-ECG candidate missing from fit contract');
  assert.equal(table.decision, 'integration_target');
  assert.equal(table.status, 'pass');
  assert.equal(ecg.decision, 'candidate_only');
  assert.equal(ecg.status, 'fail');
  assert.deepEqual(ecg.failed_dimensions.sort(), ['depth_from_wall', 'width']);
  assert.equal(report.integration_target_failures, 0);
  assert.equal(report.all_candidate_failures, 1);
});

test('strict candidate evaluation refuses the current Wall ECG before Unreal import', () => {
  const result = runPython('validate_candidate_asset_fit.py', ['--strict-candidates']);
  assert.equal(result.status, 1, 'strict evaluation must fail while any parked candidate is oversized');
  const report = parseReport(result);
  assert.equal(report.strict_candidates, true);
  assert.equal(report.all_candidate_failures, 1);
});
