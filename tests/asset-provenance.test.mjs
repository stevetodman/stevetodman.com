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

test('StudyHub map provenance keeps its recovered attribution chain visible', () => {
  const mapFamily = provenance.families.find((x) => x.pathPrefix === 'study/us-states.html');
  assert.ok(mapFamily, '50 States map provenance family must be recorded');
  assert.match(mapFamily.license, /CC BY-SA 4\.0/i);
  assert.match(mapFamily.redistribution, /study\/ATTRIBUTIONS\.md/);

  const attributionPath = path.join(repoRoot, 'study/ATTRIBUTIONS.md');
  assert.equal(fs.existsSync(attributionPath), true, 'StudyHub attribution notice must exist');
  const attribution = fs.readFileSync(attributionPath, 'utf8');
  assert.match(attribution, /WebsiteBeaver/);
  assert.match(attribution, /Wikimedia Commons/);
  assert.match(attribution, /creativecommons\.org\/licenses\/by-sa\/4\.0\//);
  assert.match(attribution, /Ali Zifan, JCRules, Magog the Ogre, Nizolan & Spesh531/);

  const studyArchive = fs.readFileSync(path.join(repoRoot, 'study/archive/index.html'), 'utf8');
  assert.match(studyArchive, /href=["']\.\.\/ATTRIBUTIONS\.md["']/i, 'The archived map activities must link to the attribution notice');
});
