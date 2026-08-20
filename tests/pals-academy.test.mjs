import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

let server, browser;
const source = fs.readFileSync(path.join(repoRoot, 'pals/index.html'), 'utf8');

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function openLab() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  await page.goto(server.origin + '/pals/', { waitUntil: 'networkidle' });
  return { context, page, errors };
}

describe('PALS 2025 resident mastery lab', () => {
  test('publishes a complete, discoverable 10-case assessment', async () => {
    const { context, page, errors } = await openLab();
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.getAttribute('link[rel="canonical"]', 'href'), 'https://stevetodman.com/pals/');
    assert.match(await page.getAttribute('meta[name="description"]', 'content'), /resident/i);
    assert.match(await page.textContent('body'), /10 Cases · 64 Questions/i);
    assert.match(await page.textContent('body'), /Education only/i);

    await page.click('button:has-text("Begin Assessment")');
    assert.equal(await page.locator('button.ctile').count(), 10);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('tests retrieval before revealing the algorithm and scores committed answers', async () => {
    const { context, page, errors } = await openLab();
    await page.click('button:has-text("Begin Assessment")');
    await page.locator('button.ctile').first().click();

    assert.equal(await page.getAttribute('#algo-toggle-btn', 'aria-expanded'), 'false');
    assert.equal(await page.locator('#algo-body.open').count(), 0);
    await page.click('#algo-toggle-btn');
    assert.equal(await page.getAttribute('#algo-toggle-btn', 'aria-expanded'), 'true');

    assert.equal(await page.locator('button.opt').count(), 4);
    await page.locator('button.opt').nth(1).click();
    await page.click('#submit-btn');
    assert.match(await page.textContent('#exp-box'), /Correct!/);
    assert.equal(await page.textContent('#score-pill'), '1/1');
    assert.equal(await page.getAttribute('#progressbar', 'aria-valuenow'), '1');
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('retains all questions and the corrected 2025 clinical safeguards', () => {
    assert.equal((source.match(/^\s+level:/gm) || []).length, 64);
    assert.equal((source.match(/^\s+n: \d+,/gm) || []).length, 10);
    assert.match(source, /IV sotalol may be considered/);
    assert.match(source, /no minimum dose/);
    assert.match(source, /Dopamine may be considered when epinephrine and norepinephrine are unavailable/);
    assert.match(source, /blood products when available rather than additional crystalloid/);
    assert.match(source, /Cuffed-tube preference is COR 2a/);
    assert.match(source, /usefulness of neuronal biomarkers.*not well established/is);
    assert.match(source, /31 of 43 children treated with ECPR survived to discharge/);

    assert.doesNotMatch(source, /Surviving Sepsis Campaign: International Pediatric Guidelines, 2025 Update/);
    assert.doesNotMatch(source, /pRBC:FFP:Platelets approximately 1:1:1/);
    assert.doesNotMatch(source, /vasopressin \(or terlipressin\) may be reasonable as an ADJUNCT/i);
    assert.doesNotMatch(source, /Cuffed ETTs = PREFERRED for ALL ages \(COR 1\)/);
    assert.doesNotMatch(source, /biomarkers should be used ONLY as one component/);
  });

  test('uses semantic controls and exposes a homepage entry point', async () => {
    const { context, page, errors } = await openLab();
    assert.equal(await page.locator('[onclick]:not(button):not(a)').count(), 0);
    assert.equal(await page.locator('a.skip-link').count(), 1);
    await page.goto(server.origin + '/', { waitUntil: 'networkidle' });
    assert.equal(await page.locator('a[href="/pals/"]').count(), 1);
    assert.match(await page.textContent('a[href="/pals/"]'), /PALS 2025 Mastery Lab/);
    assert.deepEqual(errors, []);
    await context.close();
  });
});
