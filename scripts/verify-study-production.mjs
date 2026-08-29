import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { computeStudyReleaseVersion } from './study-release.mjs';

const ORIGIN = process.env.SITE_ORIGIN || 'https://stevetodman.com';
const expectedBuild = computeStudyReleaseVersion(fileURLToPath(new URL('../study/unit-1/', import.meta.url)));
const browser = await chromium.launch();
const context = await browser.newContext();

// Production verification must never read or write the family's cloud progress.
await context.route('https://*.supabase.co/**', route => route.abort());

try {
  const page = await context.newPage();
  // Reproduce the short visual viewport that mobile browser chrome can create on iPhone.
  // Combat is a core learning/game mechanic and must compress rather than disappear.
  await page.setViewportSize({ width:390, height:520 });
  const consoleErrors = [];
  page.on('pageerror', error => consoleErrors.push(String(error)));

  const response = await page.goto(`${ORIGIN}/study/`, { waitUntil:'domcontentloaded' });
  assert.equal(response?.status(), 200, '/study/ must return HTTP 200');
  assert.equal(await page.locator('h1').innerText(), 'Word Expedition');
  assert.equal(await page.locator('[data-profile="Luke"]').count(), 1);
  assert.equal(await page.locator('[data-profile="Samantha"]').count(), 1);

  await page.locator('[data-profile="Luke"]').click();
  assert.equal(await page.locator('.question-card').count(), 1);
  assert.equal(await page.locator('.pip').count(), 10);
  assert.match(await page.locator('.question-count').innerText(), /1\s*\/\s*10/);
  assert.equal(await page.locator('.battle-stage').count(),1,'illustrated combat must be live');
  assert.equal(await page.locator('.battle-stage').isVisible(),true,'illustrated combat must remain visible on a short iPhone-like viewport');
  assert.equal(await page.locator('.mission-head').isVisible(),true,'question heading must remain visible on a short iPhone-like viewport');
  const battleBox = await page.locator('.battle-stage').boundingBox();
  assert.ok(battleBox && battleBox.height >= 60,'mobile combat must retain a usable visible stage');
  assert.equal(await page.locator('.hero-art image').first().getAttribute('width'),'1254');
  assert.equal(await page.locator('[data-domain]').count(),1);
  assert.equal(await page.locator('html').getAttribute('data-study-build'),expectedBuild,'must serve this exact release, not an older versioned build');
  const urls=await page.locator('script[src],link[rel="stylesheet"]').evaluateAll(elements=>elements.map(el=>el.src||el.href));
  assert.ok(urls.filter(url=>/unit-1\/(?:app|game-art|quality-core|sfx-bank|audio-unlock|unit1-contexts)\./.test(url)).every(url=>/[?&]v=[a-f0-9]{12}/.test(url)),'Study assets must be cache-versioned');

  const manifest = await page.evaluate(async () => {
    const href = document.querySelector('link[rel="manifest"]')?.href;
    if (!href) return null;
    const response = await fetch(href, { cache:'no-store' });
    return response.json();
  });
  assert.ok(manifest, 'Study page must expose a web manifest');
  assert.equal(manifest.id, './us-states.html');
  assert.equal(manifest.start_url, '/study/');
  assert.equal(manifest.scope, '/study/');

  const cacheHeader = response?.headers()['cache-control'] || '';
  assert.match(cacheHeader, /no-cache|no-store|max-age=0/i, 'Study HTML must revalidate instead of remaining stale');
  const direct = await page.goto(`${ORIGIN}/study/unit-1/`, { waitUntil:'domcontentloaded' });
  assert.equal(direct?.status(),200);
  assert.equal(await page.locator('html').getAttribute('data-study-build'),expectedBuild,'direct Unit 1 route must match the same release');
  assert.deepEqual(consoleErrors, [], `Study emitted page errors: ${consoleErrors.join('; ')}`);

  console.log(`Live Study browser verification passed for ${ORIGIN}/study/ and /study/unit-1/ — build ${expectedBuild}`);
} finally {
  await context.close();
  await browser.close();
}
