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
  await page.goto(server.origin + '/hypertension/', { waitUntil: 'networkidle' });
  return { context, page, errors };
}

describe('hypertension academy', () => {
  test('26-question quiz scores the first response and explains it', async () => {
    const { context, page, errors } = await openAcademy();
    await page.click('#tab-quiz');
    assert.equal(await page.textContent('#quiz-counter'), 'Question 1 of 26');
    assert.equal(await page.textContent('#quiz-score'), 'Score: 0');

    const options = page.locator('#quiz-options .choice-button');
    assert.equal(await options.count(), 3);
    await options.nth(1).click();
    assert.match(await options.nth(1).getAttribute('class'), /correct/);
    assert.equal(await page.textContent('#quiz-score'), 'Score: 1');
    assert.equal(await page.isDisabled('#quiz-next'), false);
    assert.match(await page.textContent('#quiz-explanation'), /auscultatory confirmation/i);

    await page.click('#quiz-next');
    assert.equal(await page.textContent('#quiz-counter'), 'Question 2 of 26');
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('ABPM presets apply the 2022 phenotype rules', async () => {
    const { context, page, errors } = await openAcademy();
    await page.click('#tab-abpm');

    await page.click('[data-preset="wch"]');
    assert.equal(await page.textContent('#abpm-result h4'), 'White coat hypertension');
    assert.match(await page.textContent('#abpm-result'), /BP load is intentionally ignored/i);

    await page.click('[data-preset="masked"]');
    assert.equal(await page.textContent('#abpm-result h4'), 'Masked hypertension');
    assert.match(await page.textContent('#abpm-result'), /Sleep SBP/i);

    await page.click('[data-preset="under13"]');
    assert.equal(await page.textContent('#abpm-result h4'), 'Masked hypertension');
    assert.match(await page.textContent('#abpm-result'), /limit 110\/65/i);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('office category selector renders the guideline timing', async () => {
    const { context, page, errors } = await openAcademy();
    await page.click('#tab-office');

    await page.click('[data-path="elevated"]');
    assert.match(await page.textContent('#pathway-stage'), /At 12 months/i);
    assert.match(await page.textContent('#pathway-stage'), /ABPM/i);

    await page.click('[data-path="stage1"]');
    assert.match(await page.textContent('#pathway-stage'), /1–2 weeks/i);

    await page.click('[data-path="stage2"]');
    assert.match(await page.textContent('#pathway-stage'), />180\/120/i);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('branching cases provide immediate feedback and advance', async () => {
    const { context, page, errors } = await openAcademy();
    await page.click('#tab-cases');
    await page.click('[data-case="2"]');
    assert.match(await page.textContent('#case-stage'), /Repaired coarctation/i);

    const firstOptions = page.locator('#case-stage .choice-button');
    await firstOptions.nth(1).click();
    assert.match(await page.textContent('#case-stage .case-feedback'), /masked hypertension/i);
    assert.match(await page.textContent('#case-log'), /correct/i);
    await page.click('#case-continue');
    assert.match(await page.textContent('#case-stage'), /Decision 2 of 3/i);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('tab list is keyboard navigable', async () => {
    const { context, page, errors } = await openAcademy();
    await page.focus('#tab-core');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.getAttribute('#tab-office', 'aria-selected'), 'true');
    assert.equal(await page.isHidden('#panel-office'), false);
    assert.deepEqual(errors, []);
    await context.close();
  });
});
