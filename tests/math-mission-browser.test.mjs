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

async function openMath(initialData = null, viewport = { width: 390, height: 844 }, fixedRandom = null) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  if (fixedRandom !== null) await page.addInitScript(value => { Math.random = () => value; }, fixedRandom);
  if (initialData) {
    await page.addInitScript(data => {
      localStorage.setItem('mathmission.m1.v1', JSON.stringify(data));
    }, initialData);
  }
  const response = await page.goto(`${server.origin}/math/`, { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200);
  return { context, page, errors };
}

async function canvasSnapshot(page) {
  return page.locator('#scratch-canvas').evaluate(canvas => canvas.toDataURL());
}

async function drawPenStroke(page) {
  await page.locator('#scratch-canvas').evaluate(canvas => {
    const rect = canvas.getBoundingClientRect();
    const points = [
      [rect.left + rect.width * 0.25, rect.top + rect.height * 0.30],
      [rect.left + rect.width * 0.40, rect.top + rect.height * 0.42],
      [rect.left + rect.width * 0.55, rect.top + rect.height * 0.54],
      [rect.left + rect.width * 0.70, rect.top + rect.height * 0.66]
    ];
    const originalCapture = canvas.setPointerCapture;
    canvas.setPointerCapture = () => {};
    try {
      const emit = (type, [clientX, clientY]) => canvas.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 17,
        pointerType: 'pen',
        button: 0,
        buttons: type === 'pointerup' ? 0 : 1,
        clientX,
        clientY
      }));
      emit('pointerdown', points[0]);
      emit('pointermove', points[1]);
      emit('pointermove', points[2]);
      emit('pointerup', points[3]);
    } finally {
      canvas.setPointerCapture = originalCapture;
    }
  });
}

test('current starting check is six current skills, persists evidence, and keeps optional scratchwork', async () => {
  const { context, page, errors } = await openMath();
  try {
    assert.match(await page.locator('.week-note').innerText(), /Mission 1 Lessons 13–16.*decimal division.*place-value.*standard algorithm.*regrouping.*error analysis.*models.*multi-step/is);
    await page.locator('[data-profile="luke"]').click();
    const card = await page.locator('#primary-card').innerText();
    assert.match(card, /Quick starting check/i);
    assert.match(card, /6 questions.*current class material only/is);
    assert.equal(await page.locator('#dashboard').locator('#skill-list').count(), 0, 'child dashboard should not expose an adult skill matrix');
    await page.locator('[data-start="diagnostic"]').click();

    assert.match(await page.locator('#question-body').innerText(), /4\.7.*10³/i);
    assert.match(await page.locator('#question-title').innerText(), /Question 1 of 6/i);
    assert.equal(await page.locator('#progress-text').innerText(), '1 of 6');

    const toggle = page.locator('#scratch-toggle');
    if (await page.locator('#scratch-body').getAttribute('hidden') !== null) await toggle.click();
    await page.waitForTimeout(50);
    const canvas = page.locator('#scratch-canvas');
    const box = await canvas.boundingBox();
    assert.ok(box && box.width > 0 && box.height > 0, 'scratch canvas should be visible and sized');
    const beforeStroke = await canvasSnapshot(page);
    await drawPenStroke(page);
    assert.notEqual(await canvasSnapshot(page), beforeStroke, 'pointer input should change the scratch canvas');
    await page.locator('#scratch-undo').click();
    assert.equal(await canvasSnapshot(page), beforeStroke, 'Undo should restore the guide');

    await page.locator('#answer-input').fill('4700');
    await page.locator('#check-button').click();
    await page.locator('#feedback.good').waitFor();
    const attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('mathmission.m1.v1')).luke.attempts[0]);
    assert.equal(attempt.micro, 'powers_multiply');
    assert.equal(attempt.correct, true);
    assert.equal(attempt.assisted, false);
    assert.ok(attempt.cloudId);

    await page.locator('[data-next]').click();
    assert.match(await page.locator('#question-title').innerText(), /Question 2 of 6/i);
    assert.match(await page.locator('#question-body').innerText(), /36\.4.*10²/i);
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);
  } finally {
    await context.close();
  }
});

test('a severe current-skill gap still gets one-tap misconception repair without inflating mastery', async () => {
  const seeded = {
    luke: {
      diagnostic: true,
      diagnosticVersion: 3,
      recheckVersion: 2,
      rechecks: {},
      sessions: 1,
      attempts: [{
        skill: 'place',
        micro: 'powers_divide',
        correct: false,
        assisted: false,
        recovery: false,
        difficulty: 2,
        transfer: false,
        date: '2026-09-04',
        at: 1788560000000,
        cloudId: 'seed-powers-divide-miss-1'
      }, {
        skill: 'place',
        micro: 'powers_divide',
        correct: false,
        assisted: false,
        recovery: false,
        difficulty: 2,
        transfer: false,
        date: '2026-09-04',
        at: 1788560001000,
        cloudId: 'seed-powers-divide-miss-2'
      }]
    }
  };
  const { context, page, errors } = await openMath(seeded, { width: 390, height: 844 }, 0.1);
  try {
    await page.locator('[data-profile="luke"]').click();
    assert.match(await page.locator('#primary-card').innerText(), /Current focus.*Mission 1 Lessons 13–16/is);
    assert.match(await page.locator('#primary-card').innerText(), /Decimal division test readiness.*place-value.*standard algorithm/is);
    await page.locator('[data-start="practice"]').click();

    assert.match(await page.locator('#skill-tag').innerText(), /Divide by powers of 10/i);
    assert.equal(await page.locator('#session-mode').innerText(), 'Independent');
    assert.equal(await page.locator('#progress-text').innerText(), '1 of 10');

    await page.locator('#answer-input').fill('10090');
    await page.locator('#check-button').click();
    await page.locator('#feedback.bad').waitFor();
    const missFeedback = await page.locator('#feedback').innerText();
    assert.match(missFeedback, /opposite direction/i);
    assert.match(missFeedback, /one quick tap question/i);
    assert.doesNotMatch(missFeedback, /The answer is/i, 'independent miss must diagnose before revealing the answer');

    const attemptsAfterMiss = await page.evaluate(() => JSON.parse(localStorage.getItem('mathmission.m1.v1')).luke.attempts);
    assert.equal(attemptsAfterMiss.length, 3);
    assert.equal(attemptsAfterMiss[2].micro, 'powers_divide');
    assert.equal(attemptsAfterMiss[2].misconception, 'power10_direction');
    assert.equal(attemptsAfterMiss[2].assisted, false);

    await page.locator('[data-next]').click();
    assert.equal(await page.locator('#question-title').innerText(), 'Quick fix');
    assert.equal(await page.locator('#session-mode').innerText(), 'Quick misconception check');
    assert.equal(await page.locator('#progress-text').innerText(), '1 of 10 complete');
    assert.equal(await page.locator('#answer-input').count(), 0, 'repair should be tap-based rather than typed');
    await page.locator('.choice[data-value="Less"]').click();
    await page.locator('#check-button').click();
    await page.locator('#feedback.good').waitFor();
    assert.match(await page.locator('#feedback').innerText(), /^Right idea\./);

    const attemptsAfterRepair = await page.evaluate(() => JSON.parse(localStorage.getItem('mathmission.m1.v1')).luke.attempts);
    assert.equal(attemptsAfterRepair.length, 3, 'guided repair must not be written as mastery evidence');
    assert.equal(await page.locator('#progress-text').innerText(), '1 of 10 complete');

    await page.locator('[data-next]').click();
    assert.equal(await page.locator('#session-mode').innerText(), 'Independent', 'fresh proof should be delayed by another independent item');
    assert.doesNotMatch(await page.locator('#skill-tag').innerText(), /Divide by powers of 10.*Try again/i);
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);
  } finally {
    await context.close();
  }
});

test('iPad keeps scratchwork optional and avoids page-level horizontal scrolling', async () => {
  const seeded = { luke: { diagnostic: true, diagnosticVersion: 3, recheckVersion: 2, rechecks: {}, sessions: 1, attempts: [] } };
  const { context, page, errors } = await openMath(seeded, { width: 1024, height: 1366 }, 0.1);
  try {
    await page.locator('[data-profile="luke"]').click();
    await page.locator('[data-start="practice"]').click();
    assert.equal(await page.locator('#scratch-body').isHidden(), true, 'scratchwork should stay optional');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.equal(overflow, false, 'the page itself must not scroll horizontally');
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);
  } finally {
    await context.close();
  }
});