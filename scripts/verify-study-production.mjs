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
  await page.setViewportSize({ width:390, height:520 });
  const consoleErrors = [];
  page.on('pageerror', error => consoleErrors.push(String(error)));

  const hubResponse = await page.goto(`${ORIGIN}/study/`, { waitUntil:'domcontentloaded' });
  assert.equal(hubResponse?.status(), 200, '/study/ must return HTTP 200');
  assert.equal(await page.locator('h1').innerText(), 'Learning Hub');
  for (const href of ['/math/', '/study/unit-1/', '/study/matter-lab.html', '/study/world-lab.html', '/study/us-states.html']) {
    assert.equal(await page.locator(`a[href="${href}"]`).count(), 1, `hub must link ${href}`);
  }
  const hubWidth = await page.evaluate(() => ({ scroll:document.documentElement.scrollWidth, client:document.documentElement.clientWidth }));
  assert.ok(hubWidth.scroll <= hubWidth.client + 2, 'Grade 5 hub must not horizontally overflow on iPhone-sized screens');
  const cacheHeader = hubResponse?.headers()['cache-control'] || '';
  assert.match(cacheHeader, /no-cache|no-store|max-age=0/i, 'Study hub HTML must revalidate instead of remaining stale');

  const unitResponse = await page.goto(`${ORIGIN}/study/unit-1/`, { waitUntil:'domcontentloaded' });
  assert.equal(unitResponse?.status(),200);
  assert.equal(await page.locator('h1').innerText(), 'Word Expedition');
  assert.equal(await page.locator('[data-profile="Luke"]').count(), 1);
  assert.equal(await page.locator('[data-profile="Samantha"]').count(), 1);
  assert.equal(await page.locator('html').getAttribute('data-study-build'),expectedBuild,'direct Unit 1 route must match the exact Word Expedition release');
  const urls=await page.locator('script[src],link[rel="stylesheet"]').evaluateAll(elements=>elements.map(el=>el.src||el.href));
  assert.ok(urls.filter(url=>/unit-1\/(?:app|game-art|quality-core|sfx-bank|audio-unlock|unit1-contexts)\./.test(url)).every(url=>/[?&]v=[a-f0-9]{12}/.test(url)),'Word Expedition assets must be cache-versioned');

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

  for (const [route, title] of [
    ['/study/matter-lab.html', 'Matter Lab'],
    ['/study/world-lab.html', 'World Lab'],
  ]) {
    const response = await page.goto(`${ORIGIN}${route}`, { waitUntil:'domcontentloaded' });
    assert.equal(response?.status(), 200, `${route} must return HTTP 200`);
    assert.equal(await page.title(), title);
    assert.ok(await page.locator('.menu-card').count() > 0, `${route} must expose its practice menu`);
  }

  const mathResponse = await page.goto(`${ORIGIN}/math/`, { waitUntil:'domcontentloaded' });
  assert.equal(mathResponse?.status(), 200, '/math/ must return HTTP 200');
  assert.equal(await page.locator('h1').innerText(), 'Who’s practicing?');
  assert.equal(await page.locator('[data-profile="luke"]').count(), 1);
  assert.equal(await page.locator('[data-profile="samantha"]').count(), 1);

  const manifest = await page.evaluate(async () => {
    const response = await fetch('/study/us-states.webmanifest', { cache:'no-store' });
    return response.json();
  });
  assert.equal(manifest.id, './us-states.html');
  assert.equal(manifest.start_url, '/study/');
  assert.equal(manifest.scope, '/study/');

  assert.deepEqual(consoleErrors, [], `Grade 5 production pages emitted page errors: ${consoleErrors.join('; ')}`);
  console.log(`Live Grade 5 hub, practice pages, and Word Expedition release passed at ${ORIGIN} — build ${expectedBuild}`);
} finally {
  await context.close();
  await browser.close();
}
