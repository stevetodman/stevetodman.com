import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { getChromium, startServer, watchForErrors } from './helpers/harness.mjs';

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

async function openMath(initialData = null, viewport = { width: 390, height: 844 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  if (initialData) {
    await page.addInitScript(data => {
      localStorage.setItem('mathmission.m1.v1', JSON.stringify(data));
    }, initialData);
  }
  const response = await page.goto(`${server.origin}/math/`, { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200);
  return { context, page, errors };
}

async function canvasCenterPixel(page) {
  return page.locator('#scratch-canvas').evaluate(canvas => {
    const context = canvas.getContext('2d');
    return Array.from(context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data);
  });
}

test('diagnostic answer persists, feedback renders, scratchwork works, and the session advances', async () => {
  const { context, page, errors } = await openMath();
  try {
    await page.locator('[data-profile="luke"]').click();
    await page.locator('[data-start="diagnostic"]').click();

    assert.match(await page.locator('#question-body').innerText(), /hundredths place.*6\.282/i);
    assert.match(await page.locator('#question-title').innerText(), /Question 1 of 12/i);

    const toggle = page.locator('#scratch-toggle');
    if (await page.locator('#scratch-body').getAttribute('hidden') !== null) await toggle.click();
    await page.waitForTimeout(50);
    const canvas = page.locator('#scratch-canvas');
    const box = await canvas.boundingBox();
    assert.ok(box && box.width > 0 && box.height > 0, 'scratch canvas should be visible and sized');

    const beforeStroke = await canvasCenterPixel(page);
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.35);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.65, { steps: 8 });
    await page.mouse.up();
    const afterStroke = await canvasCenterPixel(page);
    assert.notDeepEqual(afterStroke, beforeStroke, 'pointer input should visibly change the scratch canvas');

    await page.locator('#scratch-undo').click();
    assert.deepEqual(await canvasCenterPixel(page), beforeStroke, 'Undo should restore the guide beneath the latest stroke');
    await page.locator('#scratch-clear').click();
    assert.deepEqual(await canvasCenterPixel(page), beforeStroke, 'Clear should leave the underlying guide intact');

    await page.locator('.choice[data-value="8"]').click();
    await page.locator('#check-button').click();
    await page.locator('#feedback.good').waitFor();
    assert.match(await page.locator('#feedback').innerText(), /Correct\./);
    assert.match(await page.locator('#feedback').innerText(), /Skill level 40.*49/);

    const attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('mathmission.m1.v1')).luke.attempts[0]);
    assert.equal(attempt.micro, 'place_digit');
    assert.equal(attempt.correct, true);
    assert.equal(attempt.assisted, false);
    assert.ok(attempt.cloudId, 'completed answer should receive a cloud-stable id');

    await page.locator('[data-next]').click();
    assert.match(await page.locator('#question-title').innerText(), /Question 2 of 12/i);
    assert.match(await page.locator('#question-body').innerText(), /4\.731/);
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);
  } finally {
    await context.close();
  }
});

test('an adaptive-practice miss immediately schedules a guided retry of the same micro-skill', async () => {
  const seeded = {
    luke: {
      diagnostic: true,
      diagnosticVersion: 2,
      sessions: 1,
      attempts: [{
        skill: 'addsub',
        micro: 'decimal_add',
        correct: false,
        assisted: false,
        recovery: false,
        difficulty: 2,
        transfer: false,
        date: '2026-08-31',
        at: 1788137000000,
        cloudId: 'seed-decimal-add-miss'
      }]
    }
  };
  const { context, page, errors } = await openMath(seeded);
  try {
    await page.locator('[data-profile="luke"]').click();
    assert.match(await page.locator('#primary-card').innerText(), /Strengthen add decimals/i);
    assert.match(await page.locator('#primary-card').innerText(), /Starts at level 1/i);
    await page.locator('[data-start="practice"]').click();

    assert.match(await page.locator('#skill-tag').innerText(), /Add decimals/i);
    await page.locator('#answer-input').fill('999999');
    await page.locator('#check-button').click();
    await page.locator('#feedback.bad').waitFor();
    assert.match(await page.locator('#feedback').innerText(), /Not yet\./);
    assert.match(await page.locator('#feedback').innerText(), /guided problem is next/i);

    const attempts = await page.evaluate(() => JSON.parse(localStorage.getItem('mathmission.m1.v1')).luke.attempts);
    assert.equal(attempts.length, 2);
    assert.equal(attempts[1].micro, 'decimal_add');
    assert.equal(attempts[1].correct, false);
    assert.equal(attempts[1].assisted, false);

    await page.locator('[data-next]').click();
    assert.equal(await page.locator('#question-title').innerText(), 'Guided try');
    assert.match(await page.locator('#skill-tag').innerText(), /Add decimals.*Guided/i);
    assert.equal(await page.locator('#scaffold-note').isHidden(), false);
    assert.match(await page.locator('#scaffold-note').innerText(), /like place-value units/i);
    assert.doesNotMatch(await page.locator('#scaffold-note').innerText(), /line up (?:the )?decimals/i);
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);
  } finally {
    await context.close();
  }
});
