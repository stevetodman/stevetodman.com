import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium, watchForErrors } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function openAcademy() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  const response = await page.goto(server.origin + '/kawasaki/', { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200);
  await page.waitForTimeout(150);
  return { context, page, errors };
}

describe('Kawasaki academy', () => {
  test('loads without runtime errors and exposes the major learning modes', async () => {
    const { context, page, errors } = await openAcademy();
    const tabs = await page.locator('[data-tab]').allTextContents();
    assert.ok(tabs.some((x) => x.includes('Clinical core')));
    assert.ok(tabs.some((x) => x.includes('Cases')));
    assert.ok(tabs.some((x) => x.includes('Board quiz')));
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('board quiz scores a known correct first answer without reading correctness from the DOM', async () => {
    const { context, page, errors } = await openAcademy();
    await page.locator('[data-tab="quiz"]').click();
    await page.waitForFunction(() => {
      const section = document.querySelector('[data-section="quiz"]');
      return section && section.classList.contains('is-active');
    });

    assert.match(await page.locator('#kd-quiz-question').innerText(), /4 principal KD features/i);
    const choices = page.locator('#kd-quiz-options .kd-choice');
    assert.equal(await choices.count(), 4);

    // Independent fixture: question 1's correct option is index 1 ("Treat complete KD now").
    // Never infer the expected answer from classes or explanation text rendered by the app.
    await choices.nth(1).click();
    assert.equal(await page.locator('#kd-live-score').innerText(), 'Score: 1');
    assert.equal(await page.locator('#kd-quiz-next').isEnabled(), true);

    await page.locator('#kd-quiz-restart').click();
    assert.equal(await page.locator('#kd-live-score').innerText(), 'Score: 0');
    assert.match(await page.locator('#kd-quiz-counter').innerText(), /Question 1 of 18/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('mobile academy does not introduce horizontal document overflow', async () => {
    const { context, page } = await openAcademy();
    const dims = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    assert.ok(dims.scroll <= dims.client + 2, `${dims.scroll}px content in ${dims.client}px viewport`);
    await context.close();
  });
});
