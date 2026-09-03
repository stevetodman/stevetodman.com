import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, 'site/catalog.json'), 'utf8'));
const { budgets } = JSON.parse(fs.readFileSync(path.join(repoRoot, 'site/performance-budgets.json'), 'utf8'));

function routeFile(route) {
  if (route === '/') return 'index.html';
  if (route.endsWith('/')) return `${route.slice(1)}index.html`;
  return route.slice(1);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

test('source-backed production HTML stays within the per-page budget', () => {
  const tooLarge = [];
  for (const item of catalog.items.filter((x) => x.class === 'PRODUCTION' && x.route && x.generated !== true)) {
    const file = path.join(repoRoot, routeFile(item.route));
    const bytes = fs.statSync(file).size;
    if (bytes > budgets.htmlBytes) tooLarge.push(`${item.route}: ${bytes}`);
  }
  assert.deepEqual(tooLarge, [], `HTML budget exceeded:\n${tooLarge.join('\n')}`);
});

test('deployable source JS, CSS, and images stay within per-file budgets', () => {
  const roots = new Set(
    catalog.items
      .filter((x) => x.route && x.generated !== true && !['SOURCE_ONLY', 'ARCHIVED'].includes(x.class) && x.route !== '/')
      .map((x) => x.route.replace(/^\//, '').split('/')[0])
  );
  const files = [...roots].flatMap((root) => walk(path.join(repoRoot, root)));
  const sourceOnly = catalog.items.filter((x) => x.class === 'SOURCE_ONLY' && x.path).map((x) => path.join(repoRoot, x.path));
  const violations = [];
  for (const file of files) {
    if (sourceOnly.some((prefix) => file === prefix || file.startsWith(prefix + path.sep))) continue;
    const ext = path.extname(file).toLowerCase();
    const bytes = fs.statSync(file).size;
    const relative = path.relative(repoRoot, file);
    if (['.js', '.mjs'].includes(ext) && bytes > budgets.javascriptBytes) violations.push(`${relative}: JS ${bytes}`);
    if (ext === '.css' && bytes > budgets.cssBytes) violations.push(`${relative}: CSS ${bytes}`);
    if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext) && bytes > budgets.imageBytes) violations.push(`${relative}: image ${bytes}`);
  }
  assert.deepEqual(violations, [], `performance budget exceeded:\n${violations.join('\n')}`);
});
