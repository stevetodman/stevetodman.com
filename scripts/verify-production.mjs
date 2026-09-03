import fs from 'node:fs';

const ORIGIN = process.env.SITE_ORIGIN || 'https://stevetodman.com';
const catalog = JSON.parse(fs.readFileSync(new URL('../site/catalog.json', import.meta.url), 'utf8'));
const failures = [];
const legacyRedirects = new Map([['/phs/', '/hospital/']]);

const productionPaths = catalog.items
  .filter((item) => item.route && item.class === 'PRODUCTION')
  .map((item) => item.route);
const excludedPaths = [
  ...catalog.items.filter((item) => item.route && item.class !== 'PRODUCTION' && !legacyRedirects.has(item.route)).map((item) => item.route),
  ...catalog.items.filter((item) => item.path && item.class === 'SOURCE_ONLY')
    .map((item) => `/${item.path.replace(/^\/+|\/+$/g, '')}/`),
];

async function get(path, options = {}) {
  const response = await fetch(ORIGIN + path, { redirect: 'manual', signal:AbortSignal.timeout(20000), ...options });
  const text = options.method === 'HEAD' ? '' : await response.text();
  return { response, text };
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

function robotsMetaContent(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (!/\bname\s*=\s*["']robots["']/i.test(tag)) continue;
    return tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)?.[1] || '';
  }
  return '';
}

function checkHtmlNoindex(path, html) {
  const content = robotsMetaContent(html);
  check(Boolean(content), `${path} is missing meta name="robots"`);
  if (!content) return;
  for (const directive of ['noindex', 'nofollow', 'noarchive']) {
    check(new RegExp(`\\b${directive}\\b`, 'i').test(content), `${path} robots meta is missing ${directive}`);
  }
}

// Detect the most dangerous deployment error first: serving the repository root
// instead of the classified dist/ artifact. Internal/source routes exist in source
// by design, but must never be public. Fail immediately with one actionable error.
for (const sentinel of ['/admin/', '/steven-os/', '/cardiohospital/']) {
  const r = await get(sentinel);
  if (r.response.status === 200) {
    console.error('Production verification failed: live host appears to be serving the repository root or another unclassified artifact instead of dist/.');
    console.error(`- ${sentinel} returned 200 but is classified INTERNAL and must be absent from production.`);
    console.error('- Verify hosting settings: production branch main, build command npm run build, output directory dist.');
    process.exit(1);
  }
}

const home = await get('/');
check(home.response.status === 200, `/ returned ${home.response.status}`);
const robotsHeader = home.response.headers.get('x-robots-tag') || '';
check(/noindex/i.test(robotsHeader), 'homepage is missing X-Robots-Tag: noindex');
check(/nofollow/i.test(robotsHeader), 'homepage is missing X-Robots-Tag: nofollow');
check(/noarchive/i.test(robotsHeader), 'homepage is missing X-Robots-Tag: noarchive');
check(/nosniff/i.test(home.response.headers.get('x-content-type-options') || ''), 'homepage is missing X-Content-Type-Options: nosniff');
check(Boolean(home.response.headers.get('content-security-policy')), 'homepage is missing Content-Security-Policy');
checkHtmlNoindex('/', home.text);

const robots = await get('/robots.txt');
check(robots.response.status === 200, `/robots.txt returned ${robots.response.status}`);
check(/User-agent:\s*\*/i.test(robots.text), 'robots.txt is missing the default user-agent group');
check(!/^\s*Disallow:\s*\/\s*$/im.test(robots.text), 'robots.txt blocks crawlers from reading the noindex response');
check(/^\s*Disallow:\s*$/im.test(robots.text), 'robots.txt should explicitly leave public crawling unblocked');

const sitemap = await get('/sitemap.xml');
check(sitemap.response.status === 404, `/sitemap.xml should be absent but returned ${sitemap.response.status}`);

for (const path of productionPaths.filter((path) => path !== '/')) {
  let r = await get(path);
  // Pages canonicalizes public file URLs by removing .html. Follow exactly that
  // one same-origin hop, not arbitrary redirects (which can hide missing pages).
  // Excluded/internal paths below still require a direct 404.
  if ([301,308].includes(r.response.status) && path.endsWith('.html')) {
    const expected = new URL(ORIGIN + path.slice(0,-5));
    let target;
    try { target = new URL(r.response.headers.get('location') || '', ORIGIN + path); } catch {}
    check(target?.href === expected.href, `${path} has an unexpected canonical redirect`);
    check(/noindex/i.test(r.response.headers.get('x-robots-tag') || ''), `${path} redirect is missing noindex response header`);
    if (target?.href === expected.href) r = await get(expected.pathname);
  }
  check(r.response.status === 200, `${path} returned ${r.response.status}`);
  check(/noindex/i.test(r.response.headers.get('x-robots-tag') || ''), `${path} is missing noindex response header`);
  checkHtmlNoindex(path, r.text);
}

for (const [path, destination] of legacyRedirects) {
  const r = await get(path);
  check([301,302,307,308].includes(r.response.status), `${path} should redirect to ${destination} but returned ${r.response.status}`);
  let target;
  try { target = new URL(r.response.headers.get('location') || '', ORIGIN + path); } catch {}
  check(target?.href === new URL(ORIGIN + destination).href, `${path} redirects to an unexpected destination`);
}

for (const path of new Set(excludedPaths)) {
  const r = await get(path);
  check(r.response.status === 404, `${path} should be absent from production but returned ${r.response.status}`);
}

const missing = await get('/__definitely-not-a-real-route__');
check(missing.response.status === 404, `missing route returned ${missing.response.status}, expected 404`);
check(/Page not found/i.test(missing.text), 'custom 404 page is not being served for missing routes');

if (failures.length) {
  console.error(`Production verification failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Production verification passed for ${ORIGIN}`);
