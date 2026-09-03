import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium } from './helpers/harness.mjs';
import { SCIENCE_CONFIG } from '../study/science-grade5-data.mjs';
import { SOCIAL_CONFIG } from '../study/social-grade5-data.mjs';

let server;
let browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

for (const [route, config] of [
  ['/study/matter-lab.html', SCIENCE_CONFIG],
  ['/study/world-lab.html', SOCIAL_CONFIG]
]) {
  test(`${route} adapts, separates learners, and resumes exactly`, async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(server.origin + route);

    assert.equal(await page.locator('.learner-grid .menu-card').count(), 2);
    await page.locator('[data-learner="Luke"]').click();
    await page.locator('[data-action="start"]').click();

    const state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), config.storageKey);
    const first = config.items.find(item => item.id === state.active.Luke.queue[0]);
    const answers = Array.isArray(first.answer) ? first.answer : [first.answer];
    const wrong = first.choices.map((_choice, index) => index).filter(index => !answers.includes(index)).slice(0, answers.length);
    for (const index of wrong) await page.locator(`[data-choice="${index}"]`).click();
    await page.locator('[data-action="check"]').click();
    assert.equal(await page.locator('.feedback-card.repair').isVisible(), true);

    const repaired = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), config.storageKey);
    assert.equal(repaired.active.Luke.queue.length, 9);
    assert.equal(repaired.active.Luke.recoveryIds.length, 1);

    await page.locator('[data-action="next"]').click();
    const secondPrompt = await page.locator('.question-card h2').innerText();
    await page.reload();
    await page.locator('[data-learner="Luke"]').click();
    assert.equal(await page.locator('.question-card h2').innerText(), secondPrompt);

    await page.locator('[data-action="pause"]').click();
    await page.locator('[data-action="switch"]').click();
    await page.locator('[data-learner="Samantha"]').click();
    assert.equal(await page.locator('[data-action="start"]').isVisible(), true);
    const isolated = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), config.storageKey);
    assert.ok(isolated.active.Luke);
    assert.equal(isolated.active.Samantha, undefined);
    await context.close();
  });

  test(`${route} exposes the complete course and full-year review`, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(server.origin + route);
    await page.locator('[data-learner="Luke"]').click();
    await page.locator('[data-action="units"]').click();
    assert.equal(await page.locator('[data-unit]').count(), config.units.length);
    await page.locator('[data-action="dashboard"]').click();
    await page.locator('[data-action="year"]').click();
    const state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), config.storageKey);
    assert.equal(state.active.Luke.mode, 'year');
    assert.equal(state.active.Luke.queue.length, 8);
    await context.close();
  });
}
