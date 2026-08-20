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

// Copy each deployable top-level route root once. SOURCE_ONLY/ARCHIVED items
// never enter the artifact. INTERNAL routes remain deployable because they are
// intended to sit behind Cloudflare Access, not disappear from the product.
const routeRoots = new Set();
for (const item of catalog.items) {
  if (!item.route || ['SOURCE_ONLY', 'ARCHIVED'].includes(item.class)) continue;
  if (item.route === '/') continue;
  routeRoots.add(item.route.replace(/^\//, '').split('/')[0]);
}
for (const routeRoot of routeRoots) copy(routeRoot);

// Strip repository/backend content that happens to live under a deployable root.
for (const item of catalog.items.filter((x) => x.class === 'SOURCE_ONLY' && x.path)) {
  rm(path.join(dist, item.path));
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

// Steven OS is an INTERNAL static control surface. Keep only the files required
// by the browser; do not publish its Edge Functions, SQL, scripts, or README.
const stevenOs = path.join(dist, 'steven-os');
if (fs.existsSync(stevenOs)) {
  for (const entry of fs.readdirSync(stevenOs)) {
    if (!['index.html', 'clinical-review.html', 'app.js', 'config.js', 'styles.css', 'lib', 'state'].includes(entry)) {
      rm(path.join(stevenOs, entry));
    }
  }
  const lib = path.join(stevenOs, 'lib');
  if (fs.existsSync(lib)) {
    for (const entry of fs.readdirSync(lib)) {
      if (entry !== 'policy-engine.mjs') rm(path.join(lib, entry));
    }
  }
}

// Never ship local overrides or examples that could be mistaken for runtime config.
rm(path.join(dist, 'steven-os/config.local.js.example'));
rm(path.join(dist, 'steven-os/config.local.js'));

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else files.push(path.relative(dist, p));
  }
}
walk(dist);

const forbidden = catalog.items.filter((x) => x.class === 'SOURCE_ONLY' && x.path).map((x) => x.path.replace(/\/$/, ''));
for (const prefix of forbidden) {
  if (files.some((f) => f === prefix || f.startsWith(prefix + '/'))) throw new Error(`SOURCE_ONLY path leaked into dist: ${prefix}`);
}

console.log(`Built ${files.length} files into dist/`);
