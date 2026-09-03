import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { repoRoot } from './helpers/harness.mjs';
import { rankSearch } from '../search/search.js';

let built;

before(() => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'site-search-'));
  const file = path.join(temp, 'search-index.json');
  execFileSync(process.execPath, ['scripts/build-search-index.mjs'], {
    cwd: repoRoot,
    stdio: 'pipe',
    env: {
      ...process.env,
      SEARCH_INDEX_SOURCE_ROOT: repoRoot,
      SEARCH_INDEX_OUTPUT: file,
    },
  });
  built = { temp, file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
});

after(() => {
  if (built?.temp) fs.rmSync(built.temp, { recursive: true, force: true });
});

test('search index contains only classified production pages', () => {
  const { data } = built;
  const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, 'site', 'catalog.json'), 'utf8'));
  const expected = catalog.items
    .filter(item => item.class === 'PRODUCTION' && item.discoverable !== false && item.route && item.id !== 'search')
    .map(item => item.route)
    .sort();
  assert.equal(data.schemaVersion, 2);
  assert.equal(data.searchPolicy, 'noindex');
  assert.deepEqual(data.items.map(item => item.route).sort(), expected);
  assert.equal(data.items.some(item => item.route.startsWith('/admin/')), false);
  assert.equal(data.items.some(item => item.route.startsWith('/steven-os/')), false);
  assert.equal(data.items.some(item => item.route.startsWith('/cardiohospital/')), false);
});

test('body-only clinical terms are discoverable, not just catalog metadata', () => {
  const { data } = built;
  const aortopathy = data.items.find(item => item.id === 'aortopathy');
  assert.ok(aortopathy);
  assert.ok(aortopathy.terms.includes('fluoroquinolones'), 'aortopathy body term should be indexed');

  const matches = rankSearch(data.items, 'fluoroquinolones').map(result => result.item.id);
  assert.ok(matches.includes('aortopathy'), 'full-content query should return aortopathy');

  const multiTerm = rankSearch(data.items, 'aortic fluoroquinolones').map(result => result.item.id);
  assert.ok(multiTerm.includes('aortopathy'), 'multi-term body search should require and find both concepts');
});

test('search results carry concise page descriptions from production metadata', () => {
  const { data } = built;
  const aortopathy = data.items.find(item => item.id === 'aortopathy');
  assert.ok(aortopathy);
  assert.match(aortopathy.description, /recognizing, evaluating, counseling, and referring children with aortopathy/i);
  assert.ok(data.items.some(item => item.description.length > 0), 'expected production descriptions in the search index');
});

test('search index is compact enough to remain a lightweight static asset', () => {
  const { file, data } = built;
  assert.ok(data.items.every(item => Array.isArray(item.terms) && item.terms.length > 0));
  assert.ok(fs.statSync(file).size < 2_000_000, 'search index should stay below 2 MB');
});

test('production build runs the generated hospital build between site classification and search indexing', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const build = pkg.scripts.build;
  const site = build.indexOf('scripts/build-site.mjs');
  const hospital = build.indexOf('scripts/build-hospital.mjs');
  const search = build.indexOf('scripts/build-search-index.mjs');
  assert.ok(site >= 0 && hospital > site && search > hospital, 'production build must classify site, build hospital, then index search');
});
