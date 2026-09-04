import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registry = fs.readFileSync(path.join(root, 'tools/kd-misc-experimental/evidence-registry.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'tools/kd-misc-experimental/index.html'), 'utf8');
const gate = fs.readFileSync(path.join(root, 'docs/KD_MISC_M1B_ACQUISITION_GATE.md'), 'utf8');

const targetTitle = 'Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients';
const fileId = 's00246-026-04444-4';
const doiCandidate = '10.1007/s00246-026-04444-4';

test('M1B remains blocked until the exact 2026 primary source is verified', () => {
  assert.match(registry, /status:\s*'M1B_PENDING_PRIMARY_SOURCE'/);
  assert.ok(registry.includes(targetTitle));
  assert.ok(registry.includes(fileId));
  assert.match(registry, /DOI candidate 10\.1007\/s00246-026-04444-4/);
  assert.match(registry, /No numeric result, threshold, effect estimate, or model weight from that paper is encoded/);
  assert.match(html, /M1B remains blocked until the exact full text and supplement are source-locked/i);
});

test('the acquisition ledger treats the DOI as a candidate rather than a verified citation', () => {
  assert.match(gate, /BLOCKED ON VERIFIED FINAL 2026 PRIMARY SOURCE/);
  assert.ok(gate.includes(targetTitle));
  assert.ok(gate.includes(fileId));
  assert.ok(gate.includes(doiCandidate));
  assert.match(gate, /candidate, not a citation/i);
  assert.match(gate, /must not be treated as verified merely because it matches the Springer filename pattern/i);
});

test('M1B cannot source-lock without article, supplement, and page-level provenance', () => {
  for (const required of [
    'Publisher landing page or authoritative bibliographic record resolves',
    'Full article is obtained from an authorized source',
    'Every supplement / appendix relevant to cohort definitions or analyses is obtained',
    'Page/table/figure/supplement provenance is recorded',
    'Focused clinical tests are updated to lock the verified evidence contract before deployment',
  ]) {
    assert.ok(gate.includes(required), `missing acquisition requirement: ${required}`);
  }
  assert.match(gate, /exact 2026 target paper contributes \*\*zero numeric evidence\*\* to the UI/i);
});

test('the gate forbids synthetic bedside scoring while the exact study is unavailable', () => {
  assert.match(gate, /No home-grown weighted score or synthetic probability is permitted/);
  assert.match(gate, /must not manufacture a winner/);
  assert.match(gate, /No treatment or disposition recommendation is derived/);
});
