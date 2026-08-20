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

function routeArtifact(route) {
  if (route === '/') return 'index.html';
  return route.replace(/^\/+|\/+$/g, '');
}

function walkFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(p));
    else files.push(p);
  }
  return files;
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

test('classified build contains only production routes and shared public assets', () => {
  execFileSync(process.execPath, ['scripts/build-site.mjs'], { cwd: repoRoot, stdio: 'pipe' });
  const dist = path.join(repoRoot, 'dist');
  for (const required of [
    'index.html',
    '_headers',
    'site/catalog.json',
    'site/platform.css',
    'site/learning-progress.js',
  ]) assert.ok(fs.existsSync(path.join(dist, required)), `required deploy asset missing: ${required}`);

  const deployedCatalog = JSON.parse(fs.readFileSync(path.join(dist, 'site/catalog.json'), 'utf8'));
  assert.deepEqual(deployedCatalog.classes, ['PRODUCTION'], 'public catalog should expose only the production class');
  assert.ok(deployedCatalog.items.every((item) => item.class === 'PRODUCTION'), 'public catalog leaked non-production metadata');

  for (const item of catalog.items.filter((x) => x.route && x.class !== 'PRODUCTION')) {
    assert.equal(
      fs.existsSync(path.join(dist, routeArtifact(item.route))),
      false,
      `${item.class} route leaked into deploy artifact: ${item.route}`
    );
  }

  for (const forbidden of [
    'admin',
    'steven-os',
    'cardiohospital',
    'study/supabase',
    'cardio-hospital-3d',
    'clipboard-sanitizer',
    'tests',
  ]) assert.equal(fs.existsSync(path.join(dist, forbidden)), false, `${forbidden} leaked into deploy artifact`);

  const kawasaki = fs.readFileSync(path.join(dist, 'kawasaki', 'index.html'), 'utf8');
  assert.doesNotMatch(kawasaki, /https:\/\/unpkg\.com\//i, 'Kawasaki production artifact must not depend on unpkg');
  assert.doesNotMatch(kawasaki, /id=["']codex-visualization-(?:floating-ui-core|floating-ui-dom|lucide)["']/i,
    'optional visualization CDN loaders must be stripped from production');

  for (const file of walkFiles(dist).filter((p) => p.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    const relative = path.relative(dist, file);
    assert.match(html, /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\bnoindex\b[^>]*>/i,
      `${relative} must carry HTML noindex defense in depth`);
    assert.doesNotMatch(html, /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\bcontent=["'][^"']*\bindex\b/i,
      `${relative} must not explicitly opt into indexing`);
  }
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

test('non-production projects are not linked from public homepage', () => {
  const home = read('index.html');
  for (const item of catalog.items.filter((x) => x.class !== 'PRODUCTION')) {
    if (item.route) assert.equal(home.includes(`href="${item.route}"`), false, `homepage exposes ${item.route}`);
  }
});

test('responsible-disclosure and 404 surfaces exist', () => {
  assert.ok(fs.existsSync(path.join(repoRoot, '.well-known/security.txt')));
  assert.ok(fs.existsSync(path.join(repoRoot, '404.html')));
  assert.match(read('404.html'), /<meta\s+name=["']robots["'][^>]*noindex/i);
});
