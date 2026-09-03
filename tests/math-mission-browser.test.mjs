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

async function chartValue(page) {
  return page.locator('#place-value-workspace').evaluate(root => {
    const values = new Map();
    for (const cell of root.querySelectorAll('.pv-column')) {
      const digit = [...cell.querySelectorAll('.pv-digit')].map(node => node.textContent).join('');
      if (digit) values.set(Number(cell.dataset.exponent), digit);
    }
    const exponents = [...values.keys()];
    const high = Math.max(0, ...exponents);
    const low = Math.min(0, ...exponents);
    let text = '';
    for (let exponent = high; exponent >= 0; exponent -= 1) text += values.get(exponent) || '0';
    if (low < 0) {
      text += '.';
      for (let exponent = -1; exponent >= low; exponent -= 1) text += values.get(exponent) || '0';
    }
    return String(Number(text));
  });
}

test('progressive diagnostic stays child-simple, exits after two secure probes, and keeps Apple Pencil scratchwork', async () => {
  const { context, page, errors } = await openMath();
  try {
    await page.locator('[data-profile="luke"]').click();
    const card = await page.locator('#primary-card').innerText();
    assert.match(card, /Quick starting check/i);
    assert.match(card, /2 questions to start.*up to 4 if needed/is);
    assert.equal(await page.locator('#dashboard').locator('#skill-list').count(), 0, 'child dashboard should not expose the adult skill matrix');
    await page.locator('[data-start="diagnostic"]').click();

    assert.match(await page.locator('#skill-tag').innerText(), /Multiply by powers of 10/i);
    assert.match(await page.locator('#question-body').innerText(), /4\.7.*10³/i);
    assert.match(await page.locator('#question-title').innerText(), /Question 1 of 2/i);
    assert.equal(await page.locator('#progress-text').innerText(), '1 of 2');

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

    await page.locator('#answer-input').fill('4700');
    await page.locator('#check-button').click();
    await page.locator('#feedback.good').waitFor();
    assert.match(await page.locator('#feedback').innerText(), /^Yes\./);
    assert.doesNotMatch(await page.locator('#feedback').innerText(), /Skill level|→/);

    const firstAttempt = await page.evaluate(() => JSON.parse(localStorage.getItem('mathmission.m1.v1')).luke.attempts[0]);
    assert.equal(firstAttempt.micro, 'powers_multiply');
    assert.equal(firstAttempt.correct, true);
    assert.equal(firstAttempt.assisted, false);
    assert.ok(firstAttempt.cloudId, 'completed answer should receive a cloud-stable id');

    await page.locator('[data-next]').click();
    assert.match(await page.locator('#question-title').innerText(), /Question 2 of 2/i);
    assert.equal(await page.locator('#progress-text').innerText(), '2 of 2');
    assert.match(await page.locator('#skill-tag').innerText(), /Divide by powers of 10/i);
    assert.match(await page.locator('#question-body').innerText(), /36\.4.*10²/i);

    await page.locator('#answer-input').fill('0.364');
    await page.locator('#check-button').click();
    await page.locator('#feedback.good').waitFor();
    await page.locator('[data-next]').click();

    assert.equal(await page.locator('#results').isVisible(), true);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('mathmission.m1.v1')).luke);
    assert.equal(stored.diagnostic, true);
    assert.equal(stored.diagnosticVersion, 3);
    assert.deepEqual(stored.attempts.map(attempt => attempt.micro), ['powers_multiply', 'powers_divide']);
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);
  } finally {
    await context.close();
  }
});

test('progressive diagnostic adds only prerequisite place-value probes after a current-focus miss', async () => {
  const { context, page, errors } = await openMath();
  try {
    await page.locator('[data-profile="luke"]').click();
    await page.locator('[data-start="diagnostic"]').click();

    await page.locator('#answer-input').fill('999999');
    await page.locator('#check-button').click();
    await page.locator('#feedback.bad').waitFor();
    await page.locator('[data-next]').click();

    assert.match(await page.locator('#skill-tag').innerText(), /Divide by powers of 10/i);
    await page.locator('#answer-input').fill('0.364');
    await page.locator('#check-button').click();
    await page.locator('#feedback.good').waitFor();
    await page.locator('[data-next]').click();

    assert.match(await page.locator('#question-title').innerText(), /Question 3 of 4/i);
    assert.match(await page.locator('#skill-tag').innerText(), /Identify a decimal place/i);
    assert.match(await page.locator('#question-body').innerText(), /hundredths place.*6\.282/i);
    assert.doesNotMatch(await page.locator('#skill-tag').innerText(), /round|add|subtract|multiply decimals|divide decimals|metric/i);

    await page.locator('.choice[data-value="8"]').click();
    await page.locator('#check-button').click();
    await page.locator('#feedback.good').waitFor();
    await page.locator('[data-next]').click();

    assert.match(await page.locator('#question-title').innerText(), /Question 4 of 4/i);
    assert.match(await page.locator('#skill-tag').innerText(), /Find a digit’s value/i);
    assert.match(await page.locator('#question-body').innerText(), /4\.731/);
    await page.locator('.choice[data-value="0.03"]').click();
    await page.locator('#check-button').click();
    await page.locator('#feedback.good').waitFor();
    await page.locator('[data-next]').click();

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('mathmission.m1.v1')).luke);
    assert.equal(stored.diagnosticVersion, 3);
    assert.deepEqual(stored.attempts.map(attempt => attempt.micro), ['powers_multiply', 'powers_divide', 'place_digit', 'place_value']);
    assert.equal(stored.attempts.some(attempt => ['metric_conversion', 'decimal_forms', 'decimal_compare', 'decimal_round', 'decimal_add', 'decimal_subtract', 'decimal_multiply', 'decimal_divide'].includes(attempt.micro)), false);
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);
  } finally {
    await context.close();
  }
});

test('current-focus miss becomes guided place-value action and later independent recovery without transcription', async () => {
  const seeded = {
    luke: {
      diagnostic: true,
      diagnosticVersion: 3,
      recheckVersion: 1,
      rechecks: {},
      sessions: 1,
      attempts: [{
        skill: 'place', micro: 'powers_divide', correct: false, assisted: false,
        recovery: false, difficulty: 2, transfer: false, date: '2026-08-31',
        at: 1788137000000, cloudId: 'seed-powers-divide-miss'
      }]
    }
  };
  const { context, page, errors } = await openMath(seeded, { width: 390, height: 844 }, 0.1);
  try {
    await page.locator('[data-profile="luke"]').click();
    await page.waitForTimeout(25);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'hello', 'screen changes should put focus on the new heading');
    assert.match(await page.locator('#primary-card').innerText(), /Current focus.*Module 1.*Lessons 1–2/is);
    assert.match(await page.locator('#primary-card').innerText(), /Powers of 10.*place value/i);
    assert.doesNotMatch(await page.locator('#dashboard').innerText(), /level \d|micro-skills|Parent summary/i);
    await page.locator('[data-start="practice"]').click();
    await page.waitForTimeout(25);

    assert.match(await page.locator('#skill-tag').innerText(), /Divide by powers of 10/i);
    assert.equal(await page.locator('#progress-text').innerText(), '1 of 10');
    assert.equal(await page.locator('#session-mode').innerText(), 'Independent');
    assert.equal(await page.locator('#place-value-workspace').isHidden(), false);
    assert.match(await page.locator('#place-value-workspace').innerText(), /decimal point never moves/i);
    const missedPrompt = await page.locator('#question-body').innerHTML();
    const mobileChart = await page.locator('#place-value-workspace').evaluate(root => {
      const viewport = root.querySelector('.pv-scroll').getBoundingClientRect();
      return [...root.querySelectorAll('.pv-digit')].every(digit => {
        const rect = digit.getBoundingClientRect();
        return rect.left >= viewport.left && rect.right <= viewport.right;
      });
    });
    assert.equal(mobileChart, true, 'the initial mobile chart must show every occupied digit');

    await page.locator('#answer-input').fill('999999');
    await page.locator('#check-button').click();
    await page.locator('#feedback.bad').waitFor();
    const missFeedback = await page.locator('#feedback').innerText();
    assert.match(missFeedback, /Not yet\./);
    assert.match(missFeedback, /Show me with the place-value chart/i);
    assert.doesNotMatch(missFeedback, /The answer is/i, 'independent current-focus miss must not dump the answer');
    await page.waitForTimeout(10);

    const latestAttempt = await page.evaluate(() => JSON.parse(localStorage.getItem('mathmission.m1.v1')).luke.attempts.at(-1));
    assert.equal(latestAttempt.micro, 'powers_divide');
    assert.equal(latestAttempt.correct, false);
    assert.equal(latestAttempt.assisted, false);
    assert.equal(latestAttempt.misconception, 'place_value_result');

    await page.locator('[data-next]').click();
    assert.equal(await page.locator('#question-title').innerText(), 'Guided step');
    assert.equal(await page.locator('#question-body').innerHTML(), missedPrompt, 'guided help must use the exact item the child missed');
    assert.match(await page.locator('#skill-tag').innerText(), /Divide by powers of 10.*Guided/i);
    assert.equal(await page.locator('#progress-text').innerText(), '1 of 10 complete');
    assert.equal(await page.locator('#session-mode').innerText(), 'Guided step');
    assert.equal(await page.locator('#answer-input').isDisabled(), true, 'guided answer stays locked until the mathematical action is complete');
    assert.match(await page.locator('#place-value-workspace').innerText(), /decimal point stays fixed/i);
    assert.match(await page.locator('.pv-status').innerText(), /Choose the direction by reasoning from the operation/i);

    await page.locator('[data-pv-shift="left"]').click();
    assert.match(await page.locator('.pv-status').innerText(), /Division should make the number smaller.*Check the direction/is);
    await page.locator('[data-pv-reset]').click();
    await page.locator('[data-pv-shift="right"]').click();
    assert.match(await page.locator('.pv-status').innerText(), /Exactly.*1\/10 as valuable/is);
    assert.equal(await page.locator('#answer-input').isDisabled(), false);
    assert.equal(await page.locator('#answer-input').isEditable(), false, 'the chart should own the answer instead of asking for retyping');
    assert.equal(await page.locator('#answer-input').inputValue(), await chartValue(page));
    assert.equal(await page.locator('#place-value-workspace [data-pv-use]').count(), 0, 'no redundant Use chart answer click should remain');
    await page.locator('#check-button').click();
    await page.locator('#feedback.good').waitFor();
    assert.equal(await page.evaluate(() => document.activeElement?.dataset?.next), '', 'feedback should move focus to the Next action');
    assert.match(await page.locator('#feedback').innerText(), /^Exactly\./);
    assert.equal(await page.locator('#progress-text').innerText(), '1 of 10 complete', 'guided work must not inflate independent progress');

    await page.locator('[data-next]').click();
    assert.match(await page.locator('#skill-tag').innerText(), /Multiply by powers of 10/i);
    assert.equal(await page.locator('#progress-text').innerText(), '2 of 10');
    await page.locator('[data-pv-shift="left"]').click();
    assert.equal(await page.locator('#answer-input').inputValue(), await chartValue(page));
    assert.equal(await page.locator('#answer-input').isEditable(), false);
    await page.locator('#check-button').click();
    await page.locator('#feedback.good').waitFor();
    await page.locator('[data-next]').click();

    assert.equal(await page.locator('#question-title').innerText(), 'Try it again');
    assert.match(await page.locator('#skill-tag').innerText(), /Divide by powers of 10.*Try again/i);
    assert.equal(await page.locator('#session-mode').innerText(), 'Independent retry');
    assert.equal(await page.locator('#progress-text').innerText(), '3 of 10');
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);
  } finally {
    await context.close();
  }
});

test('a future packet weakness cannot displace unsecured current classroom work', async () => {
  const seeded = { luke: { diagnostic: true, diagnosticVersion: 3, recheckVersion: 1, rechecks: {}, sessions: 1, attempts: [{
    skill: 'divide', micro: 'decimal_divide', correct: false, assisted: false, recovery: false,
    difficulty: 2, transfer: false, date: '2026-08-31', at: 1788137000100,
    cloudId: 'seed-decimal-divide-miss'
  }] } };
  const { context, page, errors } = await openMath(seeded, { width: 390, height: 844 }, 0.1);
  try {
    await page.locator('[data-profile="luke"]').click();
    await page.locator('[data-start="practice"]').click();
    assert.match(await page.locator('#skill-tag').innerText(), /powers of 10/i);
    assert.doesNotMatch(await page.locator('#skill-tag').innerText(), /Divide decimals/i);
    assert.equal(await page.locator('#place-value-workspace').isHidden(), false);
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);
  } finally {
    await context.close();
  }
});

test('iPad keeps the mathematical workspace available while scratchwork stays optional', async () => {
  const seeded = { luke: { diagnostic: true, diagnosticVersion: 3, recheckVersion: 1, rechecks: { powers_multiply: { version: 1, status: 'pending' } }, sessions: 1, attempts: [] } };
  const { context, page, errors } = await openMath(seeded, { width: 1024, height: 1366 }, 0.1);
  try {
    await page.locator('[data-profile="luke"]').click();
    await page.locator('[data-start="practice"]').click();
    assert.equal(await page.locator('#place-value-workspace').isHidden(), false);
    assert.equal(await page.locator('#scratch-body').isHidden(), true, 'scratchwork should not steal workspace width until the learner opens it');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.equal(overflow, false, 'the page itself must not scroll horizontally');
    assert.deepEqual(errors, [], `runtime errors:\n${errors.join('\n')}`);
  } finally {
    await context.close();
  }
});
