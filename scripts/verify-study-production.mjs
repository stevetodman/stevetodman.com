import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const ORIGIN = process.env.SITE_ORIGIN || 'https://stevetodman.com';
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
  assert.deepEqual(consoleErrors, [], `Study emitted page errors: ${consoleErrors.join('; ')}`);

  console.log(`Live Study verification passed for ${ORIGIN}/study/`);
} finally {
  await context.close();
  await browser.close();
}
