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

    const beforeStroke = await canvasSnapshot(page);
    await drawPenStroke(page);
    const afterStroke = await canvasSnapshot(page);
    assert.notEqual(afterStroke, beforeStroke, 'pointer input should visibly change the scratch canvas');

    await page.locator('#scratch-undo').click();
    assert.equal(await canvasSnapshot(page), beforeStroke, 'Undo should restore the guide beneath the latest stroke');
    await page.locator('#scratch-clear').click();
    assert.equal(await canvasSnapshot(page), beforeStroke, 'Clear should leave the underlying guide intact');

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

test('a current-focus miss immediately schedules a guided retry of the same powers-of-ten micro-skill', async () => {
  const seeded = {
    luke: {
      diagnostic: true,
      diagnosticVersion: 2,
      sessions: 1,
      attempts: [{
        skill: 'place',
        micro: 'powers_divide',
        correct: false,
        assisted: false,
        recovery: false,
        difficulty: 2,
        transfer: false,
        date: '2026-08-31',
        at: 1788137000000,
        cloudId: 'seed-powers-divide-miss'
      }]
    }
  };
  const { context, page, errors } = await openMath(seeded);
  try {
    await page.locator('[data-profile="luke"]').click();
    assert.match(await page.locator('#primary-card').innerText(), /Current focus.*Lessons 1–2.*5\.NBT\.1–2/is);
    assert.match(await page.locator('#primary-card').innerText(), /Strengthen divide by powers of 10/i);
    await page.locator('[data-start="practice"]').click();

    assert.match(await page.locator('#skill-tag').innerText(), /Divide by powers of 10/i);
    await page.locator('#answer-input').fill('999999');
    await page.locator('#check-button').click();
    await page.locator('#feedback.bad').waitFor();
    assert.match(await page.locator('#feedback').innerText(), /Not yet\./);
    assert.match(await page.locator('#feedback').innerText(), /guided problem is next/i);

    const attempts = await page.evaluate(() => JSON.parse(localStorage.getItem('mathmission.m1.v1')).luke.attempts);
    assert.equal(attempts.length, 2);
    assert.equal(attempts[1].micro, 'powers_divide');
    assert.equal(attempts[1].correct, false);
    assert.equal(attempts[1].assisted, false);

    await page.locator('[data-next]').click();
    assert.equal(await page.locator('#question-title').innerText(), 'Guided try');
    assert.match(await page.locator('#skill-tag').innerText(), /Divide by powers of 10.*Guided/i);
    assert.equal(await page.locator('#scaffold-note').isHidden(), false);
    const scaffold = await page.locator('#scaffold-note').innerText();
    assert.match(scaffold, /place-value chart/i);
    assert.match(scaffold, /1\/10.*as large/i);
    assert.match(scaffold, /shift.*right/i);
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);
  } finally {
    await context.close();
  }
});
