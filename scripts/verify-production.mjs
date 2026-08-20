const ORIGIN = process.env.SITE_ORIGIN || 'https://stevetodman.com';
const failures = [];

async function get(path, options = {}) {
  const response = await fetch(ORIGIN + path, { redirect: 'manual', ...options });
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

for (const path of ['/study/us-states.html', '/education/', '/contact/', '/privacy/', '/tools/']) {
  const r = await get(path);
  check(r.response.status === 200, `${path} returned ${r.response.status}`);
  check(/noindex/i.test(r.response.headers.get('x-robots-tag') || ''), `${path} is missing noindex response header`);
  checkHtmlNoindex(path, r.text);
}

// Pages is production-only. PREVIEW, INTERNAL, and SOURCE_ONLY surfaces must be absent.
for (const path of [
  '/tools/pediatric-abpm-pathway-preview.html',
  '/tools/bp-percentile-calculator-preview.html',
  '/admin/',
  '/steven-os/',
  '/cardiohospital/',
  '/cardio-hospital-3d/',
  '/clipboard-sanitizer/',
  '/study/supabase/functions/studyhub-save/index.ts',
  '/steven-os/schema.sql',
]) {
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
