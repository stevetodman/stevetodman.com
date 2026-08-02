// Adversarial UI audit: documents cueing and gaming paths through visible controls.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium } from './helpers/harness.mjs';

let server;
let browser;
before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch({ headless: true });
});
after(async () => {
  await browser?.close();
  await server?.close();
});

const ranks = { maya: '1', eli: '2', nora: '3', jamal: '4' };

async function load(page) {
  await page.goto(`${server.origin}/phs/`, { waitUntil: 'domcontentloaded' });
  await page.locator('#startBtn').waitFor();
}

async function boot(page) {
  await load(page);
  for (const [id, rank] of Object.entries(ranks)) await page.locator(`#initial-rank-${id}`).selectOption(rank);
  await page.locator('#startBtn').click();
  await page.locator('#prebrief').waitFor({ state: 'hidden' });
}

async function tab(page, id) {
  await page.locator(`[data-tab="${id}"]`).click();
  await page.locator(`#tab-${id}`).waitFor({ state: 'visible' });
}

async function exam(page, id) {
  await tab(page, 'exam');
  await page.locator(`[data-exam="${id}"]`).click();
}

async function fillJunkHandoff(page) {
  for (const [id, rank] of Object.entries(ranks)) await page.locator(`#final-rank-${id}`).selectOption(rank);
  for (const id of Object.keys(ranks)) {
    for (const key of ['illness', 'summary', 'actions', 'pending', 'contingency']) {
      await page.locator(`#handoff-${id}-${key}`).fill('xxxxxxxx');
    }
  }
  await page.locator('#completeBtn').click();
  await page.locator('#debrief').waitFor({ state: 'visible' });
}

describe('answer-key cueing', () => {
  test('prebrief explicitly reveals the intended ductal-dependent mechanism', { timeout: 60000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await load(page);
    assert.match(await page.locator('#prebriefObjectives').innerText(), /ductal-dependent systemic circulation/i,
      'the prebrief no longer reveals the target diagnosis; update this audit if intentionally fixed');
    await context.close();
  });

  test('Maya order tab exposes prostaglandin and all other orders before any search', { timeout: 60000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    await page.locator('[data-patient="maya"]').click();
    await tab(page, 'orders');
    assert.equal(await page.locator('#orderSearch').inputValue(), '');
    assert.ok(await page.locator('[data-order]').count() >= 10);
    assert.match(await page.locator('#orderMenu').innerText(), /Prostaglandin E1/i,
      'the order tab no longer exposes the answer before search; update this audit if intentionally fixed');
    await context.close();
  });
});

describe('unobserved-state cueing', () => {
  test('patient board exposes Maya deterioration without examining Maya', { timeout: 90000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    await page.locator('[data-patient="jamal"]').click();
    for (let i = 0; i < 8; i++) await exam(page, 'chestwall');
    const mayaCard = page.locator('[data-patient="maya"]');
    assert.match(await mayaCard.innerText(), /Deteriorating|Critical/i,
      'current UI no longer exposes hidden acuity; update this audit if intentionally fixed');
    await context.close();
  });

  test('vital tiles reveal changing physiology without repeat measurement or monitoring', { timeout: 90000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    await page.locator('[data-patient="maya"]').click();
    const initial = await page.locator('#vitals .vital').filter({ hasText: 'Lactate' }).locator('strong').innerText();
    for (let i = 0; i < 7; i++) {
      await tab(page, 'history');
      await page.locator('#historyInput').fill('How has she been feeding?');
      await page.locator('#askBtn').click();
    }
    const current = await page.locator('#vitals .vital').filter({ hasText: 'Lactate' }).locator('strong').innerText();
    assert.notEqual(current, initial,
      'current UI now preserves last-observed vitals; update this audit if intentionally fixed');
    assert.equal(await page.locator('#trendStrip span').count(), 1,
      'no repeat observation was made, so only the initial trend point should exist');
    await context.close();
  });
});

describe('assessment gaming', () => {
  test('eight-character nonsense receives 100% handoff completeness and no-page response credit', { timeout: 90000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    assert.equal(await page.locator('#pages .feed-item').count(), 0, 'this test must end before any page exists');
    await page.locator('#endBtn').click();
    await page.locator('#endModal').waitFor({ state: 'visible' });
    await fillJunkHandoff(page);
    assert.match(await page.locator('#handoffDebrief').innerText(), /100%/,
      'handoff assessment is no longer length-only; update this audit if intentionally fixed');
    const demonstrated = (await page.locator('#missesDebrief').innerText()).split(/Demonstrated/i).at(-1);
    assert.match(demonstrated, /Completes patient-by-patient I-PASS fields/i);
    assert.match(demonstrated, /Urgent pages receive a timely clinical response/i,
      'empty urgent-page set no longer earns credit; update this audit if intentionally fixed');
    await context.close();
  });

  test('a content-free cardiology message plus read-back receives closed-loop escalation credit', { timeout: 90000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    await page.locator('[data-patient="maya"]').click();
    await tab(page, 'team');
    await page.locator('[data-role="cardiology"]').click();
    await page.locator('#teamMessage').fill('hello');
    await page.locator('#sendTeamBtn').click();
    await page.locator('#readbackBtn').click();
    await page.locator('#endBtn').click();
    await fillJunkHandoff(page);
    const text = await page.locator('#missesDebrief').innerText();
    const demonstrated = text.split(/Demonstrated/i).at(-1);
    assert.match(demonstrated, /Uses closed-loop cardiac escalation/i,
      'team assessment is no longer presence-only; update this audit if intentionally fixed');
    await context.close();
  });

  test('echocardiography interpretation is credited from a button click without an interpretation response', { timeout: 120000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    await page.locator('[data-patient="maya"]').click();
    await tab(page, 'reasoning');
    await page.locator('#problemInput').fill('Neonatal shock.');
    await page.locator('#diagnosisSelect').selectOption({ label: 'Ductal-dependent systemic circulation / critical coarctation' });
    await page.locator('#planInput').fill('Evaluate and stabilize.');
    await page.locator('#commitBtn').click();
    await tab(page, 'orders');
    await page.locator('[data-order="echo"]').click();
    for (let i = 0; i < 6; i++) await exam(page, 'appearance');
    await tab(page, 'results');
    const echo = page.locator('#resultLog .feed-item').filter({ hasText: 'Urgent transthoracic echocardiogram' });
    await echo.waitFor();
    await echo.locator('[data-review]').click();
    await echo.locator('[data-interpret]').click();
    assert.equal(await echo.locator('textarea,input[type="text"]').count(), 0,
      'the learner should not be able to claim interpretation without entering or choosing an interpretation');
    await page.locator('#endBtn').click();
    await fillJunkHandoff(page);
    const demonstrated = (await page.locator('#missesDebrief').innerText()).split(/Demonstrated/i).at(-1);
    assert.match(demonstrated, /Reviews and interprets echocardiography/i);
    await context.close();
  });
});
