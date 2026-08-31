import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { computeStudyReleaseVersion } from './study-release.mjs';

const ORIGIN = (process.env.SITE_ORIGIN || 'https://stevetodman.com').replace(/\/$/, '');
const unitDirectory = fileURLToPath(new URL('../study/unit-1/', import.meta.url));
const expectedBuild = computeStudyReleaseVersion(unitDirectory);

async function get(pathname) {
  const separator = pathname.includes('?') ? '&' : '?';
  return fetch(`${ORIGIN}${pathname}${separator}canary=${Date.now()}`, {
    headers: { 'cache-control': 'no-cache' },
  });
}

function buildMarker(html) {
  return html.match(/\bdata-study-build="([a-f0-9]{12})"/)?.[1] || '';
}

const hubResponse = await get('/study/');
assert.equal(hubResponse.status, 200, '/study/ must return HTTP 200');
const hubHtml = await hubResponse.text();
assert.match(hubHtml, /<title>Grade 5 Learning Hub<\/title>/, '/study/ must be the Grade 5 hub');
for (const href of ['/math/', '/study/unit-1/', '/study/matter-lab.html', '/study/world-lab.html', '/study/us-states.html']) {
  assert.ok(hubHtml.includes(`href="${href}"`), `/study/ must link ${href}`);
}
assert.match(hubResponse.headers.get('cache-control') || '', /no-cache|no-store|max-age=0/i, '/study/ HTML must revalidate');

const unitResponse = await get('/study/unit-1/');
assert.equal(unitResponse.status, 200, '/study/unit-1/ must return HTTP 200');
const unitHtml = await unitResponse.text();
assert.equal(buildMarker(unitHtml), expectedBuild, '/study/unit-1/ must serve the current Word Expedition release');
assert.match(unitHtml, new RegExp(`unit1-contexts\\.js\\?v=${expectedBuild}`), 'Unit 1 must cache-bust the context library');
assert.match(unitHtml, new RegExp(`app\\.js\\?v=${expectedBuild}`), 'Unit 1 must cache-bust the app');
assert.match(unitResponse.headers.get('cache-control') || '', /no-cache|no-store|max-age=0/i, '/study/unit-1/ HTML must revalidate');

for (const [route, title] of [
  ['/study/grade5.html', 'Grade 5 Learning Hub'],
  ['/study/matter-lab.html', 'Matter Lab'],
  ['/study/world-lab.html', 'World Lab'],
  ['/math/', 'Math Mission'],
]) {
  const response = await get(route);
  assert.equal(response.status, 200, `${route} must return HTTP 200`);
  const html = await response.text();
  assert.ok(html.includes(title), `${route} must contain ${title}`);
}

const manifestResponse = await get('/study/us-states.webmanifest');
assert.equal(manifestResponse.status, 200, 'Study manifest must return HTTP 200');
const manifest = await manifestResponse.json();
assert.equal(manifest.id, './us-states.html');
assert.equal(manifest.start_url, '/study/');
assert.equal(manifest.scope, '/study/');

for (const asset of ['app.js', 'unit1-contexts.js']) {
  const response = await get(`/study/unit-1/${asset}?v=${expectedBuild}`);
  assert.equal(response.status, 200, `${asset} must be present in the live release`);
}

console.log(`Live Grade 5 hub and Word Expedition release match ${expectedBuild} at ${ORIGIN}`);
