import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { getChromium, startServer, watchForErrors } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function openMath({ viewport = { width: 390, height: 844 }, seed } = {}) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  if (seed) {
    await page.addInitScript(value => {
      localStorage.setItem('mathmission.m1.v1', JSON.stringify(value));
    }, seed);
  }
  await page.goto(`${server.origin}/math/`, { waitUntil: 'networkidle' });
  return { context, page, errors };
}

test('fresh learner can enter the diagnostic, use scratchwork, and save an independently checked answer', async () => {
  const { context, page, errors } = await openMath();

  await page.locator('[data-profile="luke"]').click();
  assert.equal(await page.locator('#dashboard.active').count(), 1);
  assert.equal(await page.locator('#hello').innerText(), 'Ready, Luke?');
  await page.locator('[data-start="diagnostic"]').click();

  assert.equal(await page.locator('#session.active').count(), 1);
  assert.equal(await page.locator('#question-title').innerText(), 'Question 1 of 12');
  assert.match(await page.locator('#question-body').innerText(), /hundredths place in 6\.282/i);

  assert.equal(await page.locator('#scratch-toggle').getAttribute('aria-expanded'), 'false');
  await page.locator('#scratch-toggle').click();
  assert.equal(await page.locator('#scratch-toggle').getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('#scratch-body').isVisible(), true);
  const canvasSize = await page.locator('#scratch-canvas').evaluate(canvas => ({ width: canvas.width, height: canvas.height }));
  assert.ok(canvasSize.width > 0 && canvasSize.height > 0, 'scratch canvas should be sized when opened');

  // Independently anchored to the diagnostic item: the hundredths digit in 6.282 is 8.
  await page.locator('.choice[data-value="8"]').click();
  await page.locator('#check-button').click();
  assert.match(await page.locator('#feedback').innerText(), /^Correct\./);
  assert.equal(await page.locator('#answer-form').isHidden(), true);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('mathmission.m1.v1')));
  assert.equal(saved.luke.attempts.length, 1);
  assert.equal(saved.luke.attempts[0].micro, 'place_digit');
  assert.equal(saved.luke.attempts[0].correct, true);
  assert.equal(saved.luke.attempts[0].assisted, false);
  assert.ok(saved.luke.attempts[0].cloudId);

  await page.locator('[data-next]').click();
  assert.equal(await page.locator('#question-title').innerText(), 'Question 2 of 12');
  assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);
  await context.close();
});

const microSkill = {
  place_digit: 'place',
  place_value: 'place',
  powers_multiply: 'place',
  powers_divide: 'place',
  metric_conversion: 'place',
  decimal_forms: 'forms',
  decimal_compare: 'forms',
  decimal_round: 'round',
  decimal_add: 'addsub',
  decimal_subtract: 'addsub',
  decimal_multiply: 'multiply',
  decimal_divide: 'divide'
};

test('an adaptive miss immediately produces a guided retry on the same micro-skill', async () => {
  let at = 1000;
  const attempts = Object.entries(microSkill)
    .filter(([micro]) => micro !== 'decimal_add')
    .map(([micro, skill]) => ({
      skill,
      micro,
      correct: true,
      assisted: false,
      recovery: false,
      difficulty: 2,
      transfer: false,
      date: '2026-08-31',
      at: at++
    }));
  const seed = {
    samantha: {
      diagnostic: true,
      diagnosticVersion: 2,
      attempts,
      sessions: 1
    }
  };
  const { context, page, errors } = await openMath({ seed, viewport: { width: 1280, height: 900 } });

  await page.locator('[data-profile="samantha"]').click();
  assert.equal(await page.locator('[data-start="practice"]').count(), 1);
  assert.match(await page.locator('#primary-card').innerText(), /Strengthen add decimals/i);
  await page.locator('[data-start="practice"]').click();

  assert.match(await page.locator('#skill-tag').innerText(), /Add decimals · Level 1/);
  assert.match(await page.locator('#question-title').innerText(), /Learning question 1 of 10/);
  assert.equal(await page.locator('#scratch-guide').innerText(), 'Vertical calculation');
  assert.equal(await page.locator('#scratch-toggle').getAttribute('aria-expanded'), 'true');

  await page.locator('#answer-input').fill('99999999');
  await page.locator('#check-button').click();
  assert.match(await page.locator('#feedback').innerText(), /A guided problem is next, followed later by a fresh recovery\./);

  const afterMiss = await page.evaluate(() => JSON.parse(localStorage.getItem('mathmission.m1.v1')).samantha);
  assert.equal(afterMiss.attempts.at(-1).micro, 'decimal_add');
  assert.equal(afterMiss.attempts.at(-1).correct, false);
  assert.equal(afterMiss.attempts.at(-1).assisted, false);

  await page.locator('[data-next]').click();
  assert.equal(await page.locator('#question-title').innerText(), 'Guided try');
  assert.match(await page.locator('#skill-tag').innerText(), /Add decimals · Guided/);
  assert.equal(await page.locator('#scaffold-note').isVisible(), true);
  assert.match(await page.locator('#scaffold-note').innerText(), /decimal points aligned/i);
  assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);

  await context.close();
});
