import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const ORIGIN = process.env.SITE_ORIGIN || 'https://stevetodman.com';
const hash = createHash('sha256');
for (const asset of ['app.js','game-art.js','quality-core.js','app.css','assets/expedition-sprites.webp','assets/forest-clearing.webp','assets/expedition-world.webp']) {
  hash.update(fs.readFileSync(new URL('../study/unit-1/'+asset,import.meta.url)));
}
const expectedBuild = hash.digest('hex').slice(0,12);
const browser = await chromium.launch();
const context = await browser.newContext();

// Production verification must never read or write the family's cloud progress.
await context.route('https://*.supabase.co/**', route => route.abort());

try {
  const page = await context.newPage();
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
  assert.equal(await page.locator('.hero-art image').first().getAttribute('width'),'1254');
  assert.equal(await page.locator('[data-domain]').count(),1);
  assert.equal(await page.locator('html').getAttribute('data-study-build'),expectedBuild,'must serve this exact release, not an older versioned build');
  const urls=await page.locator('script[src],link[rel="stylesheet"]').evaluateAll(elements=>elements.map(el=>el.src||el.href));
  assert.ok(urls.filter(url=>/unit-1\/(?:app|game-art|quality-core)\./.test(url)).every(url=>/[?&]v=[a-f0-9]{12}/.test(url)),'Study assets must be cache-versioned');

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

  console.log(`Live Study verification passed for ${ORIGIN}/study/ and /study/unit-1/ — build ${expectedBuild}`);
} finally {
  await context.close();
  await browser.close();
}
