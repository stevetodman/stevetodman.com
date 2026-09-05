import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeStudyReleaseVersion } from './study-release.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'site/catalog.json'), 'utf8'));

const rm = (p) => fs.rmSync(p, { recursive: true, force: true });
const mkdir = (p) => fs.mkdirSync(p, { recursive: true });
const copy = (src, dest) => {
  const from = path.join(root, src);
  const to = path.join(dist, dest ?? src);
  if (!fs.existsSync(from)) throw new Error(`build source missing: ${src}`);
  mkdir(path.dirname(to));
  fs.cpSync(from, to, { recursive: true });
};
const routeArtifact = (route) => route === '/'
  ? 'index.html'
  : route.replace(/^\/+|\/+$/g, '');

rm(dist);
mkdir(dist);

for (const file of ['index.html', '404.html', 'robots.txt', '_headers', '_redirects']) copy(file);
copy('.well-known');

for (const file of [
  'site/platform.css',
  'site/learning-progress.js',
]) copy(file);

// Browser-facing catalog contains only production routes that are intentionally
// discoverable. Hidden direct-link production routes still deploy and are
// verified, but do not appear in navigation/search surfaces.
const publicCatalog = {
  ...catalog,
  classes: ['PRODUCTION'],
  items: catalog.items.filter((item) => item.class === 'PRODUCTION' && item.discoverable !== false),
};
mkdir(path.join(dist, 'site'));
fs.writeFileSync(path.join(dist, 'site/catalog.json'), `${JSON.stringify(publicCatalog, null, 2)}\n`);

const routeRoots = new Set();
for (const item of catalog.items) {
  if (!item.route || item.class !== 'PRODUCTION' || item.generated === true) continue;
  if (item.route === '/') continue;
  routeRoots.add(item.route.replace(/^\//, '').split('/')[0]);
}
for (const routeRoot of routeRoots) copy(routeRoot);

for (const item of catalog.items.filter((x) => x.class === 'SOURCE_ONLY' && x.path)) {
  rm(path.join(dist, item.path));
}

for (const item of catalog.items.filter((x) => x.route && x.class !== 'PRODUCTION')) {
  rm(path.join(dist, routeArtifact(item.route)));
}

const kawasakiHtml = path.join(dist, 'kawasaki', 'index.html');
if (fs.existsSync(kawasakiHtml)) {
  let html = fs.readFileSync(kawasakiHtml, 'utf8');
  for (const id of [
    'codex-visualization-floating-ui-core',
    'codex-visualization-floating-ui-dom',
    'codex-visualization-lucide',
  ]) {
    html = html.replace(new RegExp(`\\s*<script id=["']${id}["'][^>]*><\\/script>`, 'g'), '');
  }
  html = html.replace(
    '<i data-lucide="printer" aria-hidden="true"></i>',
    '<span aria-hidden="true">🖨</span>'
  );
  fs.writeFileSync(kawasakiHtml, html);
}

const files = [];
// Content-address Word Expedition as one release, including curriculum context,
// presentation code, and CSS background imagery. Revalidating Unit 1 then cannot
// load an older cached app/context/atlas. The Study hub is static navigation and
// is verified separately by route/content canaries.
const studyVersion = computeStudyReleaseVersion(path.join(dist, 'study', 'unit-1'));
for (const asset of ['app.css','game-art.js']) {
  const target=path.join(dist,'study/unit-1',asset);
  const content=fs.readFileSync(target,'utf8').replace(/(assets\/[a-z-]+\.webp)(?=['"])/g,`$1?v=${studyVersion}`);
  fs.writeFileSync(target,content);
}
for (const route of ['study/unit-1/index.html']) {
  const target=path.join(dist,route);
  const html=fs.readFileSync(target,'utf8').replace(/((?:app|game-art|quality-core|sfx-bank|audio-unlock|unit1-contexts|aaa-polish|aaa-collection|monster-banter)\.(?:js|css))(?=")/g,`$1?v=${studyVersion}`).replace('<html lang="en">',`<html lang="en" data-study-build="${studyVersion}">`);
  fs.writeFileSync(target,html);
}

// The legacy States page remains the stable practice engine. This small,
// canonical school-assessment layer owns the current classroom test contract:
// one blank map, all 50 states, location + spelling, with date-based score goals.
const statesHtml = path.join(dist, 'study', 'us-states.html');
if (fs.existsSync(statesHtml)) {
  const contractScript = '<script src="us-states-school-target.js?v=20260905-authentic1"></script>';
  let html = fs.readFileSync(statesHtml, 'utf8');
  if (!html.includes(contractScript)) html = html.replace('</body>', `${contractScript}\n</body>`);
  fs.writeFileSync(statesHtml, html);
}

// Engineering handoffs and prompt provenance belong in source, not the family app.
for (const file of ['QUALITY_PLAN.md','QUALITY_HANDOFF.md','GAME_PLAN.md','STUDY_CONTRACT.md','unit-1/assets/PROVENANCE.md']) {
  const target=path.join(dist,'study',file);if(fs.existsSync(target))fs.unlinkSync(target);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else files.push(path.relative(dist, p));
  }
}
walk(dist);

for (const item of catalog.items.filter((x) => x.route && x.class !== 'PRODUCTION')) {
  const artifact = routeArtifact(item.route);
  if (fs.existsSync(path.join(dist, artifact))) {
    throw new Error(`${item.class} route leaked into dist: ${item.route}`);
  }
}

const noindexMeta = '<meta name="robots" content="noindex, nofollow, noarchive">';
const robotsMeta = /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i;
for (const relative of files.filter((file) => file.endsWith('.html'))) {
  const file = path.join(dist, relative);
  let html = fs.readFileSync(file, 'utf8');
  if (robotsMeta.test(html)) {
    html = html.replace(robotsMeta, noindexMeta);
  } else {
    const withMeta = html.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}\n${noindexMeta}`);
    if (withMeta === html) throw new Error(`HTML document missing <head>; cannot enforce noindex: ${relative}`);
    html = withMeta;
  }
  fs.writeFileSync(file, html);
}

const forbidden = catalog.items.filter((x) => x.class === 'SOURCE_ONLY' && x.path).map((x) => x.path.replace(/\/$/, ''));
for (const prefix of forbidden) {
  if (files.some((f) => f === prefix || f.startsWith(prefix + '/'))) throw new Error(`SOURCE_ONLY path leaked into dist: ${prefix}`);
}

console.log(`Built ${files.length} files into dist/`);
