import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { repoRoot } from './helpers/harness.mjs';
import { rankSearch } from '../search/search.js';

function buildIndex() {
  execFileSync(process.execPath, ['scripts/build-site.mjs'], { cwd: repoRoot, stdio: 'pipe' });
  execFileSync(process.execPath, ['scripts/build-search-index.mjs'], { cwd: repoRoot, stdio: 'pipe' });
  const file = path.join(repoRoot, 'dist', 'site', 'search-index.json');
  return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

test('search index contains only classified production pages', () => {
  const { data } = buildIndex();
  const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, 'site', 'catalog.json'), 'utf8'));
  const expected = catalog.items
    .filter(item => item.class === 'PRODUCTION' && item.route && item.id !== 'search')
    .map(item => item.route)
    .sort();
  assert.equal(data.searchPolicy, 'noindex');
  assert.deepEqual(data.items.map(item => item.route).sort(), expected);
  assert.equal(data.items.some(item => item.route.startsWith('/admin/')), false);
  assert.equal(data.items.some(item => item.route.startsWith('/steven-os/')), false);
  assert.equal(data.items.some(item => item.route.startsWith('/cardiohospital/')), false);
});

test('body-only clinical terms are discoverable, not just catalog metadata', () => {
  const { data } = buildIndex();
  const aortopathy = data.items.find(item => item.id === 'aortopathy');
  assert.ok(aortopathy);
  assert.ok(aortopathy.terms.includes('fluoroquinolones'), 'aortopathy body term should be indexed');

  const matches = rankSearch(data.items, 'fluoroquinolones').map(result => result.item.id);
  assert.ok(matches.includes('aortopathy'), 'full-content query should return aortopathy');

  const multiTerm = rankSearch(data.items, 'aortic fluoroquinolones').map(result => result.item.id);
  assert.ok(multiTerm.includes('aortopathy'), 'multi-term body search should require and find both concepts');
});

test('search index is compact enough to remain a lightweight static asset', () => {
  const { file, data } = buildIndex();
  assert.ok(data.items.every(item => Array.isArray(item.terms) && item.terms.length > 0));
  assert.ok(fs.statSync(file).size < 2_000_000, 'search index should stay below 2 MB');
});
