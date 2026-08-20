import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, 'site/catalog.json'), 'utf8'));
const provenance = JSON.parse(fs.readFileSync(path.join(repoRoot, 'site/asset-provenance.json'), 'utf8'));
const prefixes = provenance.families.map((x) => x.pathPrefix.replace(/\\/g, '/'));

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

test('large production images belong to a documented provenance family', () => {
  const roots = new Set(
    catalog.items
      .filter((x) => x.class === 'PRODUCTION' && x.route && x.route !== '/')
      .map((x) => x.route.replace(/^\//, '').split('/')[0])
  );
  const imageExt = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);
  const missing = [];
  for (const root of roots) {
    for (const file of walk(path.join(repoRoot, root))) {
      if (!imageExt.has(path.extname(file).toLowerCase())) continue;
      if (fs.statSync(file).size < 50 * 1024) continue;
      const relative = path.relative(repoRoot, file).split(path.sep).join('/');
      if (!prefixes.some((prefix) => relative.startsWith(prefix))) missing.push(relative);
    }
  }
  assert.deepEqual(missing, [], `large production images missing provenance family:\n${missing.join('\n')}`);
});
