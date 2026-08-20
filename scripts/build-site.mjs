import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

// Root-level static control files.
for (const file of ['index.html', '404.html', 'robots.txt', '_headers']) copy(file);
copy('.well-known');

// Public platform assets are copied explicitly; site/ also contains planning and
// governance files that do not need to ship to browsers.
for (const file of [
  'site/catalog.json',
  'site/platform.css',
  'site/learning-progress.js',
]) copy(file);

// Pages is the public production surface. Only PRODUCTION route roots belong in
// the artifact; preview, internal, source-only, and archived work stays in source.
const routeRoots = new Set();
for (const item of catalog.items) {
  if (!item.route || item.class !== 'PRODUCTION') continue;
  if (item.route === '/') continue;
  routeRoots.add(item.route.replace(/^\//, '').split('/')[0]);
}
for (const routeRoot of routeRoots) copy(routeRoot);

// Strip repository/backend content that happens to live under a production root.
for (const item of catalog.items.filter((x) => x.class === 'SOURCE_ONLY' && x.path)) {
  rm(path.join(dist, item.path));
}

// A non-production route may share a top-level directory with production content
// (for example, /tools/ previews). Remove every such route explicitly after copy.
for (const item of catalog.items.filter((x) => x.route && x.class !== 'PRODUCTION')) {
  rm(path.join(dist, routeArtifact(item.route)));
}

// Kawasaki started life as a visualization export and still carries three
// optional CDN loaders for tooltips/icons. The academy itself does not require
// them: the inline runtimes already no-op when FloatingUIDOM/lucide are absent.
// Keep source history intact, but make the production artifact self-contained.
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
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else files.push(path.relative(dist, p));
  }
}
walk(dist);

// Classification is enforced by the build itself: no cataloged non-production
// route may survive into the deployment artifact.
for (const item of catalog.items.filter((x) => x.route && x.class !== 'PRODUCTION')) {
  const artifact = routeArtifact(item.route);
  if (fs.existsSync(path.join(dist, artifact))) {
    throw new Error(`${item.class} route leaked into dist: ${item.route}`);
  }
}

// Search privacy is a deployment invariant, not merely a Cloudflare-header
// assumption. Some legacy source pages predate the direct-link-only policy and
// still carry explicit `index,follow` metadata. Normalize every deployable HTML
// document to noindex in dist/ so a missing/misapplied response header cannot
// silently opt a page into indexing. The X-Robots-Tag remains the primary
// site-wide control; this is defense in depth.
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
