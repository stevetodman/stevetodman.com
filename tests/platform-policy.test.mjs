import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { repoRoot, SITE_PAGES } from './helpers/harness.mjs';

const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
const catalog = JSON.parse(read('site/catalog.json'));
const VALID_CLASSES = new Set(['PRODUCTION', 'PREVIEW', 'INTERNAL', 'SOURCE_ONLY', 'ARCHIVED']);

function routeFile(route) {
  if (route === '/') return 'index.html';
  if (route.endsWith('/')) return `${route.slice(1)}index.html`;
  return route.slice(1);
}

test('site-wide search privacy policy lets crawlers observe noindex', () => {
  const headers = read('_headers');
  const robots = read('robots.txt');
  assert.match(headers, /X-Robots-Tag:\s*noindex, nofollow, noarchive/i);
  assert.match(robots, /User-agent:\s*\*/i);
  assert.doesNotMatch(robots, /^\s*Disallow:\s*\/\s*$/im, 'public site must remain crawlable so noindex can be observed');
  assert.match(robots, /^\s*Disallow:\s*$/im, 'robots.txt should explicitly leave crawling unblocked');
  assert.equal(fs.existsSync(path.join(repoRoot, 'sitemap.xml')), false, 'sitemap must stay absent while noindex policy is active');
});

test('baseline browser security headers are version-controlled', () => {
  const headers = read('_headers');
  for (const required of [
    'Content-Security-Policy:',
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy:',
    'Permissions-Policy:',
    'X-Frame-Options:',
  ]) assert.ok(headers.includes(required), `missing ${required}`);
});

test('catalog has valid unique classifications and existing routes', () => {
  const ids = new Set();
  const routes = new Set();
  for (const item of catalog.items) {
    assert.ok(VALID_CLASSES.has(item.class), `invalid class for ${item.id}`);
    assert.ok(!ids.has(item.id), `duplicate id ${item.id}`);
    ids.add(item.id);
    if (item.route) {
      assert.ok(!routes.has(item.route), `duplicate route ${item.route}`);
      routes.add(item.route);
      assert.ok(fs.existsSync(path.join(repoRoot, routeFile(item.route))), `catalog route missing file: ${item.route}`);
    }
    if (item.path) assert.ok(fs.existsSync(path.join(repoRoot, item.path)), `catalog path missing: ${item.path}`);
  }
});

test('classified build excludes repository/backend source', () => {
  execFileSync(process.execPath, ['scripts/build-site.mjs'], { cwd: repoRoot, stdio: 'pipe' });
  const dist = path.join(repoRoot, 'dist');
  assert.ok(fs.existsSync(path.join(dist, 'index.html')));
  assert.ok(fs.existsSync(path.join(dist, '_headers')));
  assert.ok(fs.existsSync(path.join(dist, 'site/catalog.json')));
  assert.ok(fs.existsSync(path.join(dist, 'steven-os/index.html')), 'internal control surface remains deployable behind Access');
  for (const forbidden of [
    'study/supabase',
    'cardio-hospital-3d',
    'clipboard-sanitizer',
    'steven-os/supabase',
    'steven-os/scripts',
    'steven-os/schema.sql',
    'tests',
  ]) assert.equal(fs.existsSync(path.join(dist, forbidden)), false, `${forbidden} leaked into deploy artifact`);
});

test('StudyHub schema is versioned with RLS and no browser-role grants', () => {
  const migration = read('study/supabase/migrations/20260819_create_studyhub_saves.sql');
  assert.match(migration, /alter table studyhub\.saves enable row level security/i);
  assert.match(migration, /revoke all on schema studyhub from anon/i);
  assert.match(migration, /revoke all on schema studyhub from authenticated/i);
  assert.match(migration, /revoke all on table studyhub\.saves from anon/i);
  assert.match(migration, /revoke all on table studyhub\.saves from authenticated/i);
  assert.equal(/create\s+policy/i.test(migration), false, 'direct anon/auth policies must not be added to StudyHub saves');
});

test('smoke inventory exactly matches catalog PRODUCTION pages', () => {
  const expected = catalog.items
    .filter((item) => item.class === 'PRODUCTION' && item.smoke && item.route)
    .map((item) => item.route)
    .sort();
  assert.deepEqual([...SITE_PAGES].sort(), expected);
});

test('preview HTML has explicit noindex metadata as defense in depth', () => {
  for (const item of catalog.items.filter((x) => x.class === 'PREVIEW' && x.route)) {
    const file = routeFile(item.route);
    if (!fs.existsSync(path.join(repoRoot, file))) continue;
    const html = read(file);
    assert.match(html, /<meta\s+name=["']robots["'][^>]*noindex/i, `${item.route} must declare noindex in HTML`);
  }
});

test('internal/source-only projects are not linked from public homepage', () => {
  const home = read('index.html');
  for (const item of catalog.items.filter((x) => ['INTERNAL', 'SOURCE_ONLY'].includes(x.class))) {
    if (item.route) assert.equal(home.includes(`href="${item.route}"`), false, `homepage exposes ${item.route}`);
  }
});

test('responsible-disclosure and 404 surfaces exist', () => {
  assert.ok(fs.existsSync(path.join(repoRoot, '.well-known/security.txt')));
  assert.ok(fs.existsSync(path.join(repoRoot, '404.html')));
  assert.match(read('404.html'), /<meta\s+name=["']robots["'][^>]*noindex/i);
});
