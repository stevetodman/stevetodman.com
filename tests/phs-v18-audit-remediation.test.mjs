// UI-only regression tests for the PHS v1.8 audit remediation.
// All learner actions use rendered controls. No simulator state is mutated and
// no internal scenario function is invoked.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium, watchForErrors } from './helpers/harness.mjs';

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

const RANKS = { maya: '1', eli: '2', nora: '3', jamal: '4' };

function seconds(text) {
  const match = String(text).trim().match(/^(\d+):(\d{2})$/);
  assert.ok(match, `expected mm:ss, got ${JSON.stringify(text)}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

async function clock(page, id = 'clock') {
  return seconds(await page.locator(`#${id}`).innerText());
}

async function load(page) {
  await page.goto(`${server.origin}/phs/`, { waitUntil: 'domcontentloaded' });
  await page.locator('#startBtn').waitFor();
}

async function boot(page, mode = 'assessment') {
  await load(page);
  if (mode === 'practice') await page.locator('input[value="practice"]').check();
  for (const [id, rank] of Object.entries(RANKS)) await page.locator(`#initial-rank-${id}`).selectOption(rank);
  await page.locator('#startBtn').click();
  await page.locator('#prebrief').waitFor({ state: 'hidden' });
}

async function select(page, id) {
  await page.locator(`[data-patient="${id}"]`).click();
  await page.locator('#patientTitle').waitFor();
}

async function tab(page, id) {
  await page.locator(`[role="tab"][data-tab="${id}"]`).click();
  await page.locator(`#tab-${id}`).waitFor({ state: 'visible' });
}

async function ask(page, question) {
  await tab(page, 'history');
  await page.locator('#historyInput').fill(question);
  await page.locator('#askBtn').click();
}

async function exam(page, id) {
  await tab(page, 'exam');
  await page.locator(`[data-exam="${id}"]`).click();
}

async function reasonMaya(page) {
  await tab(page, 'reasoning');
  await page.locator('#problemInput').fill('Neonatal shock with differential perfusion and weak femoral pulses.');
  await page.locator('#diagnosisSelect').selectOption({ label: 'Ductal-dependent systemic circulation / critical coarctation' });
  await page.locator('#alternativesInput').fill('Sepsis and metabolic disease remain possible and require parallel evaluation.');
  await page.locator('#planInput').fill('Prepare airway support, start prostaglandin, escalate to cardiology, and reassess perfusion.');
  await page.locator('#confidenceInput').fill('80');
  await page.locator('#commitBtn').click();
}

async function order(page, id, query = id) {
  await tab(page, 'orders');
  await page.locator('#orderSearch').fill(query);
  const button = page.locator(`[data-order="${id}"]`);
  await button.waitFor();
  await button.click();
}

async function stabiliseMaya(page) {
  await select(page, 'maya');
  await exam(page, 'pulses');
  await reasonMaya(page);
  await order(page, 'airway', 'airway');
  await order(page, 'pge', 'prostaglandin');
  await order(page, 'monitoriv', 'monitoring');
}

const HANDOFFS = {
  maya: {
    illness: 'Critical watcher after neonatal shock stabilization.',
    summary: 'Neonate with shock, weak femoral pulses, and ductal-dependent systemic perfusion.',
    actions: 'Prostaglandin, monitoring, cultures, antibiotics, cardiology escalation, and reassessment completed.',
    pending: 'Incoming resident owns pending echo results and repeat perfusion reassessment.',
    contingency: 'If perfusion worsens or lactate rises, call cardiology and the attending immediately.',
  },
  eli: {
    illness: 'Watcher for hypoxemic respiratory deterioration.',
    summary: 'Infant with bronchiolitis, increased work of breathing, and oxygen requirement.',
    actions: 'Respiratory exam, suction, oxygen support, and hydration reassessment completed.',
    pending: 'Incoming resident and nurse own repeat oxygen saturation and feeding assessment.',
    contingency: 'If breathing worsens or desaturation recurs, escalate respiratory support and call the attending.',
  },
  nora: {
    illness: 'Watcher with invasive bacterial infection risk.',
    summary: 'Young infant with fever and positive culture requiring bacteremia and meningitis evaluation.',
    actions: 'Culture review, antibiotics, CSF evaluation, and admission planning completed.',
    pending: 'Incoming resident owns speciation, CSF result review, and antibiotic adjustment.',
    contingency: 'If fever, perfusion, or mental status worsens, call the attending and escalate sepsis care.',
  },
  jamal: {
    illness: 'Stable low-risk chest pain patient.',
    summary: 'Adolescent with reproducible musculoskeletal chest pain and no current high-risk features.',
    actions: 'Chest-wall exam, analgesia, risk explanation, and caregiver update completed.',
    pending: 'No pending work; incoming resident confirms symptom improvement before discharge.',
    contingency: 'If exertional pain, syncope, dyspnea, or worsening symptoms occur, reassess and escalate.',
  },
};

async function finish(page, handoffs = HANDOFFS) {
  for (const [id, rank] of Object.entries(RANKS)) await page.locator(`#final-rank-${id}`).selectOption(rank);
  for (const id of Object.keys(RANKS)) {
    for (const key of ['illness', 'summary', 'actions', 'pending', 'contingency']) {
      await page.locator(`#handoff-${id}-${key}`).fill(handoffs[id][key]);
    }
  }
  await page.locator('#completeBtn').click();
  await page.locator('#debrief').waitFor({ state: 'visible' });
}

function demonstrated(text) {
  return text.split(/Demonstrated/i).at(-1);
}

describe('diagnostic cueing and observed state', () => {
  test('prebrief and empty order search do not reveal the target treatment', { timeout: 60000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await load(page);
    assert.doesNotMatch(await page.locator('#prebriefObjectives').innerText(), /ductal-dependent systemic circulation/i);
    await boot(page);
    await select(page, 'maya');
    await tab(page, 'orders');
    assert.equal(await page.locator('[data-order]').count(), 0);
    assert.doesNotMatch(await page.locator('#orderMenu').innerText(), /prostaglandin/i);
    await page.locator('#orderSearch').fill('pro');
    assert.match(await page.locator('#orderMenu').innerText(), /Prostaglandin E1/i);
    await context.close();
  });

  test('unobserved physiology remains hidden until the learner measures it', { timeout: 120000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    await select(page, 'maya');
    const initialLactate = await page.locator('#vitals .vital').filter({ hasText: 'Lactate' }).locator('strong').innerText();
    for (let index = 0; index < 10; index += 1) await ask(page, 'How has she been feeding?');
    const card = page.locator('[data-patient="maya"]');
    assert.doesNotMatch(await card.innerText(), /Deteriorating|Critical/i);
    assert.equal(await page.locator('#vitals .vital').filter({ hasText: 'Lactate' }).locator('strong').innerText(), initialLactate);
    assert.equal(await page.locator('#trendStrip span').count(), 1);
    await tab(page, 'exam');
    await page.locator('#repeatVitalsBtn').click();
    assert.notEqual(await page.locator('#vitals .vital').filter({ hasText: 'Lactate' }).locator('strong').innerText(), initialLactate);
    assert.match(await card.innerText(), /Deteriorating observed/i);
    assert.equal(await page.locator('#trendStrip span').count(), 2);
    await context.close();
  });
});

describe('hard time budget and responsive layout', () => {
  test('an action crossing the deadline is interrupted at exactly 14:00 and receives no completion', { timeout: 180000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    await stabiliseMaya(page);
    await select(page, 'jamal');
    while (await clock(page, 'clockLeft') > 24) {
      const left = await clock(page, 'clockLeft');
      if (left > 49) await exam(page, 'chestwall');
      else await ask(page, 'Has he had a rash?');
    }
    const leftBefore = await clock(page, 'clockLeft');
    assert.ok(leftBefore > 0 && leftBefore < 25, `expected less than 25 seconds, got ${leftBefore}`);
    await tab(page, 'exam');
    const card = page.locator('[data-exam="chestwall"]');
    const before = await card.innerText();
    await card.click();
    await page.locator('#endModal').waitFor({ state: 'visible' });
    assert.equal(await clock(page), 840);
    assert.equal(await page.locator('#clockLeft').innerText(), 'Handoff');
    assert.equal((await page.locator('[data-exam="chestwall"]').innerText()).match(/completed (\d+)/)?.[1], before.match(/completed (\d+)/)?.[1]);
    await context.close();
  });

  test('tablet layout does not overflow horizontally', { timeout: 60000 }, async () => {
    const context = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const page = await context.newPage();
    await load(page);
    const dimensions = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(dimensions.scroll <= dimensions.client, `horizontal overflow: ${dimensions.scroll}px > ${dimensions.client}px`);
    await context.close();
  });
});

describe('assessment integrity', () => {
  test('junk handoff and an empty urgent-page set earn no credit', { timeout: 90000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    await page.locator('#endBtn').click();
    const junk = Object.fromEntries(Object.keys(RANKS).map(id => [id, Object.fromEntries(['illness', 'summary', 'actions', 'pending', 'contingency'].map(key => [key, 'xxxxxxxx']))]));
    await finish(page, junk);
    const feedback = await page.locator('#missesDebrief').innerText();
    assert.match(feedback, /Completes patient-by-patient I-PASS fields/i);
    assert.match(feedback, /Urgent pages receive a timely clinical response/i);
    assert.doesNotMatch(demonstrated(feedback), /Completes patient-by-patient I-PASS fields|Urgent pages receive a timely clinical response/i);
    assert.doesNotMatch(await page.locator('#handoffDebrief').innerText(), /100%/);
    await context.close();
  });

  test('content-free read-back does not earn escalation credit', { timeout: 90000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    await select(page, 'maya');
    await tab(page, 'team');
    await page.locator('[data-role="cardiology"]').click();
    await page.locator('#teamMessage').fill('hello');
    await page.locator('#sendTeamBtn').click();
    await page.locator('#readbackBtn').click();
    await page.locator('#endBtn').click();
    await finish(page);
    const feedback = await page.locator('#missesDebrief').innerText();
    assert.match(feedback, /Uses closed-loop cardiac escalation/i);
    assert.doesNotMatch(demonstrated(feedback), /Uses closed-loop cardiac escalation/i);
    await context.close();
  });

  test('result interpretation requires learner-entered clinical meaning', { timeout: 150000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    await select(page, 'maya');
    await reasonMaya(page);
    await order(page, 'echo', 'echo');
    for (let index = 0; index < 4; index += 1) await exam(page, 'appearance');
    await tab(page, 'results');
    const result = page.locator('#resultLog .feed-item').filter({ hasText: 'Urgent transthoracic echocardiogram' });
    await result.waitFor();
    await result.locator('[data-review]').click();
    const submit = result.locator('[data-interpret]');
    await submit.click();
    assert.equal(await result.getByText('Interpreted', { exact: true }).count(), 0);
    const input = result.locator('[data-interpretation-input]');
    await input.fill('Critical coarctation with ductal systemic hypoperfusion; continue prostaglandin and urgent cardiac ICU transfer.');
    await submit.click();
    assert.equal(await result.getByText('Interpreted', { exact: true }).count(), 1);
    await context.close();
  });
});

describe('delegation and accessibility', () => {
  test('finite staff perform delegated work in parallel and cannot be double-booked', { timeout: 120000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    await select(page, 'maya');
    await tab(page, 'team');
    await page.locator('#delegationResource').selectOption('nurse');
    await page.locator('#delegationTask').selectOption('repeat-vitals');
    await page.locator('#delegateBtn').click();
    assert.match(await page.locator('#delegationPanel').innerText(), /Busy until/i);
    await page.locator('#delegateBtn').click();
    assert.match(await page.locator('#urgentBanner').innerText(), /already assigned/i);
    await select(page, 'jamal');
    await exam(page, 'chestwall');
    await exam(page, 'chestwall');
    await select(page, 'maya');
    assert.ok(await page.locator('#trendStrip span').count() >= 2, 'delegated vital signs should create an observed trend point');
    await tab(page, 'team');
    assert.match(await page.locator('#delegationPanel').innerText(), /Bedside nurse\s+Available/i);
    await context.close();
  });

  test('dialogs and tabs expose modal, tabpanel, control, focus, and keyboard relationships', { timeout: 60000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await load(page);
    assert.equal(await page.locator('#prebrief').getAttribute('role'), 'dialog');
    assert.equal(await page.locator('#prebrief').getAttribute('aria-modal'), 'true');
    await boot(page);
    const history = page.locator('[data-tab="history"]');
    await history.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement?.dataset?.tab), 'exam');
    assert.equal(await page.locator('[data-tab="exam"]').getAttribute('aria-controls'), 'tab-exam');
    assert.equal(await page.locator('#tab-exam').getAttribute('role'), 'tabpanel');
    assert.equal(await page.locator('#tab-exam').getAttribute('aria-labelledby'), 'tab-control-exam');
    await page.locator('#endBtn').click();
    assert.equal(await page.locator('#endModal').getAttribute('role'), 'dialog');
    assert.equal(await page.locator('#endModal').getAttribute('aria-modal'), 'true');
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });
});

describe('real-time clock', () => {
  test('wall-clock passage, pause, and resume remain coherent', { timeout: 60000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    const start = await clock(page);
    await page.waitForTimeout(2600);
    const delta = await clock(page) - start;
    assert.ok(delta >= 2 && delta <= 4, `2.6 seconds of wall time advanced ${delta} scenario seconds`);
    await page.locator('#pauseBtn').click();
    const paused = await clock(page);
    await page.waitForTimeout(2200);
    assert.equal(await clock(page), paused);
    await page.locator('#pauseBtn').click();
    await page.waitForTimeout(1300);
    assert.ok(await clock(page) >= paused + 1);
    await context.close();
  });
});
