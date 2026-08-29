import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { webkit, devices } from 'playwright';
import { startServer, watchForErrors } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await webkit.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

function iphoneContext(){
  const { defaultBrowserType: _defaultBrowserType, ...iphone } = devices['iPhone 13'];
  return browser.newContext({ ...iphone, hasTouch:true });
}

test('adaptive Unit 1 practice works on an iPhone WebKit profile and writes shared learner evidence', async () => {
  const context = await iphoneContext();
  const page = await context.newPage();
  const errors = watchForErrors(page);

  await page.goto(server.origin + '/study/unit-1/test-practice.html', { waitUntil:'networkidle' });
  await page.locator('[data-learner="Luke"]').click();

  const cta = page.locator('#continue-practice');
  await cta.waitFor({ state:'visible' });
  assert.match(await cta.textContent(), /baseline diagnostic/i);

  await cta.click();
  const firstChoice = page.locator('[data-choice]').first();
  await firstChoice.waitFor({ state:'visible' });
  await firstChoice.click();

  const shared = await page.evaluate(() => JSON.parse(localStorage.getItem('studyhub-word-expedition-unit1-v3')));
  assert.equal(shared.version, 3);
  assert.ok(shared.learners.Luke);
  assert.ok(Object.keys(shared.learners.Luke.stats).length >= 1, 'diagnostic evidence must write into the same Unit 1 learner stats used by the adventure');
  assert.equal(Object.keys(shared.learners.Samantha.stats).length, 0, 'Luke evidence must not bleed into Samantha');

  await page.locator('#practice-home').click();
  await page.locator('summary').click();
  await page.locator('[data-mode="paragraph"]').click();

  const bankButtons = page.locator('.interactive-bank .bank-word');
  assert.equal(await bankButtons.count(), 12, 'paragraph practice must expose all twelve bank words');
  const bankBox = await bankButtons.first().boundingBox();
  assert.ok(bankBox && bankBox.height >= 44, 'word-bank targets must be at least 44 CSS px tall on iPhone');

  const activeBlank = page.locator('.blank-token.active');
  await activeBlank.waitFor({ state:'visible' });
  const blankBox = await activeBlank.boundingBox();
  assert.ok(blankBox && blankBox.height >= 44, 'the active paragraph blank must be a large touch target');

  await bankButtons.first().click();
  assert.equal(await page.locator('.interactive-bank .bank-word.used').count(), 1, 'using a word must visibly remove it from the remaining bank');

  assert.deepEqual(errors, [], 'adaptive test practice must not emit page, console, or request errors in iPhone WebKit');
  await context.close();
});

test('parent readiness and both final mocks work on iPhone WebKit without coaching before submission', async () => {
  const context = await iphoneContext();
  const page = await context.newPage();
  const errors = watchForErrors(page);

  await page.goto(server.origin + '/study/unit-1/parent-readiness.html', { waitUntil:'networkidle' });
  assert.equal(await page.locator('.learner-readiness').count(), 2, 'parent view must show both learners');
  assert.equal(await page.locator('[data-learner="Luke"] .meter').count(), 3);
  assert.equal(await page.locator('[data-learner="Samantha"] .meter').count(), 3);

  await page.goto(server.origin + '/study/unit-1/mock-test.html?learner=Luke', { waitUntil:'networkidle' });
  await page.locator('#start-vocab').click();
  assert.equal(await page.locator('.mock-word').count(), 12);
  assert.equal(await page.locator('.mock-blank').count(), 12);
  assert.equal(await page.locator('.mock-review').count(), 0, 'vocabulary mock must not reveal correctness during the test');

  for (let i=0;i<12;i++) await page.locator('.mock-word').nth(i).click();
  const relationInputs = page.locator('[data-syn], [data-ant]');
  assert.equal(await relationInputs.count(), 24);
  for (let i=0;i<24;i++) await relationInputs.nth(i).fill('wrong');
  await page.locator('#vocab-mock-form').evaluate(form => form.requestSubmit());
  await page.locator('.mock-summary').waitFor();
  assert.match(await page.locator('.mock-score').textContent(), /\/36/);

  await page.locator('#mock-again').click();
  await page.locator('#start-spelling').click();
  assert.equal(await page.getByText('Audio only', { exact:true }).count(), 1);
  assert.equal(await page.locator('.mock-review').count(), 0, 'spelling mock must not reveal correctness during dictation');
  for (let i=0;i<12;i++) {
    await page.locator('#spelling-answer').fill('wrong');
    await page.locator('#spelling-form').evaluate(form => form.requestSubmit());
  }
  await page.locator('.mock-summary').waitFor();
  assert.match(await page.locator('.mock-score').textContent(), /\/12/);

  const shared = await page.evaluate(() => JSON.parse(localStorage.getItem('studyhub-word-expedition-unit1-v3')));
  const spellingKeys = Object.keys(shared.learners.Luke.stats).filter(key => key.endsWith('|spelling'));
  assert.equal(spellingKeys.length, 12, 'spelling mock must write all twelve results into adaptive learner evidence');
  assert.equal(Object.keys(shared.learners.Samantha.stats).length, 0, 'mock evidence must remain learner-specific');
  assert.deepEqual(errors, [], 'parent and final mock pages must not emit page, console, or request errors in iPhone WebKit');
  await context.close();
});
