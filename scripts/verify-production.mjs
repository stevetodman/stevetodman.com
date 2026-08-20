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

const home = await get('/');
check(home.response.status === 200, `/ returned ${home.response.status}`);
const robotsHeader = home.response.headers.get('x-robots-tag') || '';
check(/noindex/i.test(robotsHeader), 'homepage is missing X-Robots-Tag: noindex');
check(/nofollow/i.test(robotsHeader), 'homepage is missing X-Robots-Tag: nofollow');
check(/nosniff/i.test(home.response.headers.get('x-content-type-options') || ''), 'homepage is missing X-Content-Type-Options: nosniff');
check(Boolean(home.response.headers.get('content-security-policy')), 'homepage is missing Content-Security-Policy');

const robots = await get('/robots.txt');
check(robots.response.status === 200, `/robots.txt returned ${robots.response.status}`);
check(/User-agent:\s*\*/i.test(robots.text) && /Disallow:\s*\//i.test(robots.text), 'robots.txt does not disallow crawling');

for (const path of ['/study/us-states.html', '/education/', '/tools/']) {
  const r = await get(path);
  check(r.response.status === 200, `${path} returned ${r.response.status}`);
  check(/noindex/i.test(r.response.headers.get('x-robots-tag') || ''), `${path} is missing noindex response header`);
}

// INTERNAL surfaces must not be anonymously readable as their real application.
for (const [path, marker] of [['/admin/', '<h1>Admin</h1>'], ['/steven-os/', '<h1>Steven OS</h1>']]) {
  const r = await get(path);
  const exposed = r.response.status === 200 && r.text.includes(marker);
  check(!exposed, `${path} is anonymously serving its internal application; Cloudflare Access/exclusion is not effective`);
}

// SOURCE_ONLY paths must not exist in the classified deploy artifact once Pages uses dist/.
for (const path of [
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
