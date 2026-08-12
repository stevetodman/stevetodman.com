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
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  await page.goto(server.origin + '/aortopathy/', { waitUntil: 'networkidle' });
  return { context, page, errors };
}

const postCorrect = [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1];

async function runPosttest(page, correctCount) {
  await page.click('#tab-assessment');
  await page.click('#posttest-start');
  for (let i = 0; i < postCorrect.length; i += 1) {
    const answer = i < correctCount ? postCorrect[i] : (postCorrect[i] + 1) % 3;
    await page.locator('[data-post-answer]').nth(answer).click();
    assert.match(await page.textContent('#post-explanation'), i < correctCount ? /Correct/i : /Review/i);
    await page.click('#post-next');
  }
}

describe('pediatric aortopathy academy', () => {
  test('opening case corrects the normal-examination trap', async () => {
    const { context, page, errors } = await openAcademy();
    await page.click('[data-opening="0"]');
    assert.match(await page.textContent('#opening-feedback'), /does not exclude HTAD/i);
    assert.match(await page.getAttribute('[data-opening="1"]', 'class'), /correct/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('pretest scores six baseline decisions and reveals rationales at the end', async () => {
    const { context, page, errors } = await openAcademy();
    const correct = [1, 1, 0, 1, 1, 1];
    await page.click('#pretest-start');
    for (const index of correct) await page.locator('[data-pre-answer]').nth(index).click();
    assert.match(await page.textContent('#pretest-stage'), /6 of 6 correct/i);
    assert.equal(await page.locator('#pretest-stage details').count(), 6);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('action pathway changes from stable HTAD to emergency response', async () => {
    const { context, page, errors } = await openAcademy();
    await page.click('#tab-pathway');
    assert.match(await page.textContent('#pathway-stage'), /Suspected heritable thoracic aortic disease/i);
    await page.click('[data-path="acute"]');
    assert.match(await page.textContent('#pathway-stage'), /Emergency transport/i);
    assert.match(await page.textContent('#pathway-stage'), /Normal TTE, MRA, or CTA/i);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('branching case scores the first response and advances', async () => {
    const { context, page, errors } = await openAcademy();
    await page.click('#tab-cases');
    await page.click('[data-case="2"]');
    assert.match(await page.textContent('#case-stage'), /TGFBR2/i);
    await page.locator('[data-case-answer]').nth(1).click();
    assert.match(await page.textContent('#case-feedback'), /Correct/i);
    assert.match(await page.textContent('#case-feedback'), /acute aortic\/branch-vessel emergency/i);
    await page.click('#case-continue');
    assert.match(await page.textContent('#case-stage'), /Decision 2 of 3/i);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('exactly 80 percent passes the posttest', async () => {
    const { context, page, errors } = await openAcademy();
    await runPosttest(page, 12);
    assert.match(await page.textContent('#posttest-stage'), /12\/15/);
    assert.match(await page.textContent('#posttest-stage'), /Mastery achieved/i);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('below 80 percent does not pass and offers an unlimited retry', async () => {
    const { context, page, errors } = await openAcademy();
    await runPosttest(page, 11);
    assert.match(await page.textContent('#posttest-stage'), /11\/15/);
    assert.match(await page.textContent('#posttest-stage'), /Not yet at mastery/i);
    assert.equal(await page.locator('#post-retry').count(), 1);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('tab list is keyboard navigable', async () => {
    const { context, page, errors } = await openAcademy();
    await page.focus('#tab-core');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.getAttribute('#tab-pathway', 'aria-selected'), 'true');
    assert.equal(await page.isHidden('#panel-pathway'), false);
    assert.deepEqual(errors, []);
    await context.close();
  });
});
