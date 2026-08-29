import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { computeStudyReleaseVersion } from './study-release.mjs';

const ORIGIN = (process.env.SITE_ORIGIN || 'https://stevetodman.com').replace(/\/$/, '');
const unitDirectory = fileURLToPath(new URL('../study/unit-1/', import.meta.url));
const expectedBuild = computeStudyReleaseVersion(unitDirectory);

async function get(pathname) {
  const separator = pathname.includes('?') ? '&' : '?';
  const response = await fetch(`${ORIGIN}${pathname}${separator}canary=${Date.now()}`, {
    headers: { 'cache-control': 'no-cache' },
  });
  return response;
}

function buildMarker(html) {
  return html.match(/\bdata-study-build="([a-f0-9]{12})"/)?.[1] || '';
}

for (const route of ['/study/', '/study/unit-1/']) {
  const response = await get(route);
  assert.equal(response.status, 200, `${route} must return HTTP 200`);
  const html = await response.text();
  assert.equal(buildMarker(html), expectedBuild, `${route} must serve the current Study release`);
  assert.match(html, new RegExp(`unit1-contexts\\.js\\?v=${expectedBuild}`), `${route} must cache-bust the context library`);
  assert.match(html, new RegExp(`app\\.js\\?v=${expectedBuild}`), `${route} must cache-bust the app`);
  assert.match(response.headers.get('cache-control') || '', /no-cache|no-store|max-age=0/i, `${route} HTML must revalidate`);
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

console.log(`Live Study release matches ${expectedBuild} at ${ORIGIN}`);
