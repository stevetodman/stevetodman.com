import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://stevetodman.com').replace(/\/$/, '');
const DEPLOYMENT_ORIGIN = (process.env.DEPLOYMENT_ORIGIN || '').replace(/\/$/, '');
const TARGET_SHA = process.env.TARGET_SHA || '';
const ARTIFACT_DIR = path.resolve('verification-artifacts');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

assert.match(TARGET_SHA, /^[a-f0-9]{40}$/, 'TARGET_SHA must be a full Git commit SHA');
assert.match(
  DEPLOYMENT_ORIGIN,
  /^https:\/\/[a-f0-9]+\.stevetodman-com\.pages\.dev$/,
  'Cloudflare production deployment URL is missing or invalid',
);

function digest(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function fetchText(origin, pathname) {
  const separator = pathname.includes('?') ? '&' : '?';
  const response = await fetch(`${origin}${pathname}${separator}deployment_verify=${Date.now()}`, {
    headers: {
      'cache-control': 'no-cache, no-store, max-age=0',
      pragma: 'no-cache',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, `${origin}${pathname} returned HTTP ${response.status}`);
  assert.match(response.url, /^https:\/\//, `${pathname} did not remain on HTTPS`);
  return { response, text: await response.text() };
}

const hashes = {};
for (const pathname of ['/study/pin-sprint.html', '/study/us-states.html']) {
  const expectedPath = path.join('dist', pathname.replace(/^\//, ''));
  assert.ok(fs.existsSync(expectedPath), `target build is missing ${expectedPath}`);
  const expected = fs.readFileSync(expectedPath, 'utf8');
  const production = await fetchText(SITE_ORIGIN, pathname);
  const deployment = await fetchText(DEPLOYMENT_ORIGIN, pathname);
  const expectedHash = digest(expected);

  assert.equal(
    digest(production.text),
    expectedHash,
    `${pathname} on the custom domain does not match the target SHA's dist build`,
  );
  assert.equal(
    digest(deployment.text),
    expectedHash,
    `${pathname} on the immutable Cloudflare deployment does not match the target SHA's dist build`,
  );
  assert.equal(
    digest(production.text),
    digest(deployment.text),
    `${pathname} differs between the custom domain and exact Cloudflare deployment`,
  );
  assert.ok(production.response.headers.get('cf-ray'), `${pathname} lacks a Cloudflare response marker`);
  assert.match(production.response.headers.get('content-type') || '', /text\/html/i, `${pathname} is not HTML`);
  hashes[pathname] = expectedHash;
}

function collectRuntimeFailures(page, origin) {
  const failures = [];
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') failures.push(`console: ${message.text()}`);
  });
  page.on('requestfailed', request => {
    if (request.url().startsWith(origin)) {
      failures.push(`requestfailed: ${request.url()} (${request.failure()?.errorText || 'unknown'})`);
    }
  });
  page.on('response', response => {
    if (
      response.url().startsWith(origin)
      && ['document', 'script', 'stylesheet', 'image', 'font'].includes(response.request().resourceType())
      && response.status() >= 400
    ) {
      failures.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  });
  return failures;
}

async function newProductionPage(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  // Exercise the real UI without reading or changing family cloud data.
  await context.route('https://*.supabase.co/**', async route => {
    if (route.request().url().includes('/functions/v1/studyhub-save')) {
      let body = {};
      try { body = route.request().postDataJSON() || {}; } catch {}
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body.action === 'pull' ? { found: false } : { data: body.data || {} }),
      });
    } else {
      await route.abort();
    }
  });

  const page = await context.newPage();
  return { context, page, failures: collectRuntimeFailures(page, SITE_ORIGIN) };
}

async function tapState(page, code) {
  const point = await page.evaluate(targetCode => {
    const candidates = [
      ...document.querySelectorAll(`#pinMap path.state[data-code="${targetCode}"], #pinMap path.pin-hit[data-code="${targetCode}"]`),
    ];
    for (const candidate of candidates) {
      const rect = candidate.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      for (let yi = 1; yi <= 9; yi += 1) {
        for (let xi = 1; xi <= 9; xi += 1) {
          const x = rect.left + (rect.width * xi) / 10;
          const y = rect.top + (rect.height * yi) / 10;
          const state = document.elementFromPoint(x, y)?.closest?.('#pinMap path.state, #pinMap path.pin-hit');
          if (state?.dataset.code === targetCode) return { x, y };
        }
      }
    }
    return null;
  }, code);
  assert.ok(point, `could not find a real tappable point for ${code}`);
  await page.touchscreen.tap(point.x, point.y);
}

const browser = await chromium.launch();
try {
  {
    const { context, page, failures } = await newProductionPage(browser);
    const response = await page.goto(
      `${SITE_ORIGIN}/study/pin-sprint.html?deployment_verify=${Date.now()}`,
      { waitUntil: 'domcontentloaded', timeout: 30000 },
    );
    assert.equal(response?.status(), 200, 'Pin Sprint must return HTTP 200');
    await page.waitForSelector('#startPin', { state: 'visible' });
    assert.match(await page.locator('#startPin').innerText(), /Adaptive map practice/i);
    assert.equal(await page.locator('a[href="us-states.html"]').count(), 1, 'Pin Sprint must link to Full Challenge');

    await page.locator('#startPin').click();
    await page.waitForSelector('[data-player="Luke"]', { state: 'visible' });
    await page.locator('[data-player="Luke"]').click();
    await page.waitForSelector('#pinMap path.state', { state: 'visible' });

    const before = await page.evaluate(() => window.__pinSprintState());
    assert.ok(before.roundStates.length > 0, 'Pin Sprint did not create an adaptive round');
    const target = before.roundStates[before.currentIndex];
    await tapState(page, target.code);
    await page.waitForFunction(index => window.__pinSprintState().currentIndex > index, before.currentIndex);
    const after = await page.evaluate(() => window.__pinSprintState());
    assert.equal(after.firstTryScore, 1, 'a correct real touch must score');
    assert.equal(after.currentIndex, before.currentIndex + 1, 'a correct real touch must advance');
    assert.equal(
      await page.locator(`#pinMap path.state[data-code="${target.code}"]`).evaluate(element => element.classList.contains('pin-solved')),
      true,
      'the touched state must remain visibly solved',
    );
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'pin-sprint-live.png'), fullPage: true });
    assert.deepEqual(failures, [], `Pin Sprint runtime failures:\n${failures.join('\n')}`);
    await context.close();
  }

  {
    const { context, page, failures } = await newProductionPage(browser);
    const response = await page.goto(
      `${SITE_ORIGIN}/study/us-states.html?deployment_verify=${Date.now()}`,
      { waitUntil: 'domcontentloaded', timeout: 30000 },
    );
    assert.equal(response?.status(), 200, '50 States Challenge must return HTTP 200');
    await page.waitForSelector('.profile-pick[data-name="Luke"]', { state: 'visible' });
    await page.locator('.profile-pick[data-name="Luke"]').click();
    if (await page.locator('#toMenu').count()) await page.locator('#toMenu').click();

    const quick = page.locator('.menu-card[data-mode="quick"]');
    const full = page.locator('.menu-card[data-mode="test"]');
    await quick.waitFor({ state: 'visible' });
    await full.waitFor({ state: 'visible' });
    assert.match(await quick.innerText(), /Quick Round/);
    assert.match(await full.innerText(), /Full Test/);
    assert.match(await full.innerText(), /Graded\s*[•·]\s*50 questions/i);

    await quick.click();
    await page.waitForSelector('#spellForm, #qMap', { state: 'visible' });
    assert.match(await page.locator('h1').innerText(), /Quick Round/);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'us-states-live.png'), fullPage: true });
    assert.deepEqual(failures, [], `50 States runtime failures:\n${failures.join('\n')}`);
    await context.close();
  }
} finally {
  await browser.close();
}

const result = {
  status: 'DEPLOYED AND LIVE-VERIFIED',
  targetSha: TARGET_SHA,
  productionOrigin: SITE_ORIGIN,
  deploymentOrigin: DEPLOYMENT_ORIGIN,
  hashes,
  verified: [
    'production bytes match target dist and exact Cloudflare production deployment',
    'Cloudflare HTTPS response and same-origin assets',
    'Pin Sprint adaptive start, SVG map render, and real touch response',
    '50 States menu, graded 50-question Full Test label, and Quick Round start',
    'no page errors, console errors, failed same-origin assets, or stale-cache mismatch',
  ],
};
fs.writeFileSync(path.join(ARTIFACT_DIR, 'browser-verification.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
