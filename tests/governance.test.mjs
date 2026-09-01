import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const load = (p) => JSON.parse(fs.readFileSync(path.join(repoRoot, p), 'utf8'));
const catalog = load('site/catalog.json');
const registry = load('clinical/content-registry.json');

function monthsSince(dateString) {
  const then = new Date(`${dateString}T00:00:00Z`);
  const now = new Date();
  return (now.getUTCFullYear() - then.getUTCFullYear()) * 12 + (now.getUTCMonth() - then.getUTCMonth());
}

test('every production clinical education surface has a governance record', () => {
  const registered = new Set(registry.modules.map((m) => m.id));
  const clinicalProduction = catalog.items.filter((item) =>
    item.class === 'PRODUCTION' && item.id !== 'education' && (
      ['education', 'simulation'].includes(item.category) || item.id === 'bp-calculator'
    )
  );
  const missing = clinicalProduction.filter((item) => !registered.has(item.id)).map((item) => item.id);
  assert.deepEqual(missing, [], `missing clinical registry entries: ${missing.join(', ')}`);
});

test('clinical governance records do not fabricate review status', () => {
  for (const module of registry.modules) {
    assert.ok(module.id && module.route && module.title && module.reviewStatus && module.sourceStatus, `incomplete registry record: ${module.id || 'unknown'}`);
    if (module.lastReviewed === null) {
      assert.notEqual(module.reviewStatus, 'documented', `${module.id} claims documented review without a date`);
      continue;
    }
    assert.match(module.lastReviewed, /^\d{4}-\d{2}-\d{2}$/, `${module.id} review date must be YYYY-MM-DD`);
    assert.equal(module.reviewStatus, 'documented', `${module.id} has a date but is not marked documented`);
  }
});

test('file-backed clinical review evidence exists', () => {
  for (const module of registry.modules.filter((item) => item.reviewEvidenceFile)) {
    const evidencePath = path.join(repoRoot, module.reviewEvidenceFile);
    assert.ok(fs.existsSync(evidencePath), `${module.id} review evidence file is missing: ${module.reviewEvidenceFile}`);
    const evidence = fs.readFileSync(evidencePath, 'utf8');
    assert.match(evidence, /Review date:/i, `${module.id} evidence file needs a review date`);
    assert.match(evidence, /Evidence boundary/i, `${module.id} evidence file needs an explicit evidence boundary`);
  }
});

test('newborn CCHD evidence review remains traceable to the reviewed production claims', () => {
  const module = registry.modules.find((item) => item.id === 'newbornscreen');
  assert.ok(module);
  assert.equal(module.lastReviewed, '2026-08-31');
  assert.equal(module.reviewStatus, 'documented');
  assert.match(module.reviewLevel, /AI-assisted evidence review/i);
  assert.match(module.reviewLevel, /no independent clinician certification/i);

  const page = fs.readFileSync(path.join(repoRoot, 'newbornscreen/index.html'), 'utf8');
  assert.match(page, /screen at 24 hours of age or later/i);
  assert.match(page, /as late as possible before discharge/i);
  assert.match(page, /weaned off supplemental oxygen/i);
  assert.match(page, /echocardiography is warranted/i);
  assert.match(page, /unless required by state law/i);
});

test('documented clinical review dates are not stale', () => {
  const limit = Number(registry.policy.reviewIntervalMonths || 12);
  const stale = registry.modules
    .filter((m) => m.lastReviewed)
    .filter((m) => monthsSince(m.lastReviewed) > limit)
    .map((m) => `${m.id} (${m.lastReviewed})`);
  assert.deepEqual(stale, [], `clinical content review due: ${stale.join(', ')}`);
});

test('content correction workflow is present', () => {
  const file = path.join(repoRoot, '.github/ISSUE_TEMPLATE/content-correction.yml');
  assert.ok(fs.existsSync(file));
  const text = fs.readFileSync(file, 'utf8');
  assert.match(text, /Do not include patient information/i);
  assert.match(text, /Safety-critical/i);
});
