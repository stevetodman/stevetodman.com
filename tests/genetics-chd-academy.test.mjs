import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function openModule() {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const errors = watchForErrors(page);
  await page.goto(server.origin + '/genetics-chd/', { waitUntil: 'networkidle' });
  return { page, errors };
}

describe('genetics of CHD academy', () => {
  test('loads nine keyboard-operable sections without runtime errors', async () => {
    const { page, errors } = await openModule();
    assert.equal(await page.locator('[role="tab"]').count(), 9);
    await page.locator('#tab-core').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#panel-core').isVisible(), true);
    await page.waitForTimeout(100);
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('pretest scores and explains each decision immediately', async () => {
    const { page } = await openModule();
    await page.click('#tab-pretest');
    assert.equal(await page.locator('[data-pre-q]').count(), 24);
    await page.locator('[data-pre-q="0"][data-pre-o="0"]').click();
    assert.equal(await page.locator('#pre-feedback-0').isVisible(), true);
    assert.match(await page.locator('#pretest-score').textContent(), /1 of 6 answered/);
    assert.equal(await page.locator('[data-pre-q="0"]:disabled').count(), 4);
    await page.close();
  });

  test('five cases branch after the learner commits to a decision', async () => {
    const { page } = await openModule();
    await page.click('#tab-cases');
    assert.equal(await page.locator('.case').count(), 5);
    assert.equal(await page.locator('#case-stage-0-1').count(), 0);
    await page.locator('[data-case="0"][data-stage="0"][data-option="0"]').click();
    assert.equal(await page.locator('#case-stage-0-1').count(), 1);
    assert.equal(await page.locator('#case-feedback-0-0').isVisible(), true);
    await page.close();
  });

  test('mastery test requires every answer and provides domain feedback', async () => {
    const { page } = await openModule();
    await page.click('#tab-posttest');
    assert.equal(await page.locator('#posttest-root .question').count(), 15);
    await page.click('#submit-posttest');
    assert.match(await page.locator('#post-results').textContent(), /15 unanswered/);
    for (let qi = 0; qi < 15; qi += 1) {
      await page.locator('[data-post-q="' + qi + '"]').first().click();
    }
    await page.click('#submit-posttest');
    assert.match(await page.locator('#post-results').textContent(), /(Mastery achieved|Not yet at mastery)/);
    assert.equal(await page.locator('.domain').count(), 5);
    assert.equal(await page.locator('#posttest-root .feedback:not([hidden])').count(), 15);
    await page.close();
  });

  test('clinical guardrails replace unsafe source claims', () => {
    const html = fs.readFileSync(path.join(repoRoot, 'genetics-chd/index.html'), 'utf8');
    const js = fs.readFileSync(path.join(repoRoot, 'genetics-chd/assets/app.js'), 'utf8');
    const all = html + js;
    assert.match(all, /Clinically reviewed: August 12, 2026/);
    assert.match(all, /VUS is not a diagnosis/);
    assert.match(all, /screening result that warrants counseling and an offer of diagnostic confirmation/i);
    assert.match(all, /CIRCGEN\.126\.005794/);
    assert.match(all, /peds\.2025-072717/);
    assert.doesNotMatch(all, /near-universal association/i);
    assert.doesNotMatch(all, /nearly 100% association/i);
    assert.doesNotMatch(all, /MANDATORY/);
  });
});
