// UI-only audit for the Pediatric Hospital Simulator.
// Clinical actions are performed through visible controls only. The suite does
// not call simulator functions, mutate simulator state, or fast-forward time.

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

const RANKING = { maya: '1', eli: '2', nora: '3', jamal: '4' };
const DIAGNOSES = {
  maya: 'Ductal-dependent systemic circulation / critical coarctation',
  eli: 'Bronchiolitis with hypoxemia and evolving respiratory distress',
  nora: 'Febrile young infant with invasive bacterial infection',
  jamal: 'Likely musculoskeletal chest pain without current high-risk features',
};

function toSeconds(text) {
  const match = String(text).trim().match(/^(\d+):(\d{2})$/);
  assert.ok(match, `expected mm:ss, got ${JSON.stringify(text)}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

async function clock(page, id = 'clock') {
  return toSeconds(await page.locator(`#${id}`).innerText());
}

async function boot(page, mode = 'assessment') {
  await page.goto(`${server.origin}/phs/`, { waitUntil: 'domcontentloaded' });
  await page.locator('#prebriefObjectives .objective').first().waitFor();
  if (mode === 'practice') await page.locator('input[value="practice"]').check();
  for (const [id, rank] of Object.entries(RANKING)) {
    await page.locator(`#initial-rank-${id}`).selectOption(rank);
  }
  await page.locator('#startBtn').click();
  await page.locator('#prebrief').waitFor({ state: 'hidden' });
}

async function selectPatient(page, id) {
  await page.locator(`[data-patient="${id}"]`).click();
  await page.locator('#patientTitle').filter({ hasText: DIAGNOSES[id] ? '' : '' }).waitFor();
}

async function tab(page, id) {
  await page.locator(`[role="tab"][data-tab="${id}"]`).click();
  await page.locator(`#tab-${id}`).waitFor({ state: 'visible' });
}

async function ask(page, question, source = 'parent') {
  await tab(page, 'history');
  await page.locator('#historySource').selectOption(source);
  await page.locator('#historyInput').fill(question);
  await page.locator('#askBtn').click();
}

async function exam(page, id) {
  await tab(page, 'exam');
  await page.locator(`[data-exam="${id}"]`).click();
}

async function reason(page, diagnosis = DIAGNOSES.maya) {
  await tab(page, 'reasoning');
  await page.locator('#problemInput').fill('A time-critical pediatric problem with discriminating findings and evolving physiology.');
  await page.locator('#diagnosisSelect').selectOption({ label: diagnosis });
  await page.locator('#alternativesInput').fill('Important alternatives remain and require parallel evaluation.');
  await page.locator('#planInput').fill('Stabilize, escalate, review results, and reassess response.');
  await page.locator('#confidenceInput').fill('80');
  await page.locator('#commitBtn').click();
}

async function order(page, id) {
  await tab(page, 'orders');
  await page.locator(`[data-order="${id}"]`).click();
}

async function message(page, role, text, readback = true) {
  await tab(page, 'team');
  await page.locator(`[data-role="${role}"]`).click();
  await page.locator('#teamMessage').fill(text);
  await page.locator('#sendTeamBtn').click();
  if (readback && await page.locator('#readbackBtn').isVisible()) {
    await page.locator('#readbackBtn').click();
  }
}

async function vitalMap(page) {
  return Object.fromEntries(await page.locator('#vitals .vital').evaluateAll(nodes =>
    nodes.map(node => [node.querySelector('small')?.textContent.trim(), node.querySelector('strong')?.textContent.trim()])));
}

async function stabiliseMaya(page) {
  await selectPatient(page, 'maya');
  await exam(page, 'pulses');
  await reason(page);
  await order(page, 'airway');
  await exam(page, 'abdomen');
  await order(page, 'pge');
  for (const id of ['monitoriv', 'glucose', 'culture', 'antibiotics']) await order(page, id);
  await message(page, 'cardiology', 'Neonatal shock with differential perfusion. Urgent cardiac ICU support and transfer requested. Confirm receipt.');
  await message(page, 'parent', 'Your baby is critically ill. We are treating circulation and infection threats in parallel.', false);
  await tab(page, 'exam');
  await page.locator('#repeatVitalsBtn').click();
}

async function completeHandoff(page) {
  for (const [id, rank] of Object.entries(RANKING)) await page.locator(`#final-rank-${id}`).selectOption(rank);
  for (const id of Object.keys(RANKING)) {
    await page.locator(`#handoff-${id}-illness`).fill(id === 'maya' ? 'Watcher after stabilization' : 'Stable or monitored');
    await page.locator(`#handoff-${id}-summary`).fill('Current clinical summary with key findings and diagnosis.');
    await page.locator(`#handoff-${id}-actions`).fill('Completed actions and treatment response.');
    await page.locator(`#handoff-${id}-pending`).fill('Incoming resident owns pending work and reassessment.');
    await page.locator(`#handoff-${id}-contingency`).fill('Escalate for worsening perfusion, breathing, vitals, or neurologic status.');
  }
  await page.locator('#completeBtn').click();
  await page.locator('#debrief').waitFor({ state: 'visible' });
}

describe('clock and pause behavior', () => {
  test('real time advances one second per second and attention is charged once', { timeout: 90000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await boot(page);

    const initial = await clock(page);
    const initialLeft = await clock(page, 'clockLeft');
    assert.ok(initialLeft >= 837 && initialLeft <= 840);
    await page.waitForTimeout(2600);
    const realDelta = await clock(page) - initial;
    assert.ok(realDelta >= 2 && realDelta <= 4, `2.6 real seconds advanced ${realDelta} scenario seconds`);

    await selectPatient(page, 'maya');
    let before = await clock(page);
    await ask(page, 'How has she been feeding?');
    let charged = await clock(page) - before;
    assert.ok(charged >= 20 && charged <= 22, `recognized question charged ${charged}s`);
    assert.match(await page.locator('#historyLog').innerText(), /less than half a bottle/i);

    before = await clock(page);
    await ask(page, 'Has she had a rash or vomiting?');
    charged = await clock(page) - before;
    assert.ok(charged >= 5 && charged <= 7, `unrecognized question charged ${charged}s`);
    assert.match(await page.locator('#historyLog').innerText(), /not understood|you can ask about/i);

    const elapsed = await clock(page);
    const remaining = await clock(page, 'clockLeft');
    assert.ok(Math.abs(elapsed + remaining - 840) <= 1, `${elapsed}+${remaining} should equal the 840s clinical window`);

    await page.locator('#pauseBtn').click();
    const pausedAt = await clock(page);
    await page.waitForTimeout(2200);
    assert.equal(await clock(page), pausedAt, 'assessment pause must freeze time');
    assert.equal(await page.locator('#historyInput').isDisabled(), true);
    await tab(page, 'exam');
    for (const button of await page.locator('[data-exam]').all()) assert.equal(await button.isDisabled(), true);

    await page.locator('#pauseBtn').click();
    await page.waitForTimeout(1200);
    const resumeDelta = await clock(page) - pausedAt;
    assert.ok(resumeDelta >= 1 && resumeDelta <= 2, `resume advanced ${resumeDelta}s`);
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });

  test('practice pause allows explicitly unscored exploration without time passage', { timeout: 90000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page, 'practice');
    await page.locator('#pauseBtn').click();
    await selectPatient(page, 'maya');
    const before = await clock(page);
    await ask(page, 'How has she been feeding?');
    await exam(page, 'pulses');
    await reason(page);
    await order(page, 'glucose');
    assert.equal(await clock(page), before);
    assert.match(await page.locator('#ledger').innerText(), /Practice pause.*unscored/i);
    await context.close();
  });
});

describe('all visible patient controls', () => {
  test('all history topics, exams, orders, and team roles work for every patient', { timeout: 180000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await boot(page, 'practice');
    await page.locator('#pauseBtn').click();

    for (const id of Object.keys(DIAGNOSES)) {
      await selectPatient(page, id);
      await tab(page, 'history');
      const topics = await page.locator('.topic-chip').allTextContents();
      assert.ok(topics.length >= 3, `${id}: missing history topics`);
      for (const topic of topics) {
        await page.getByRole('button', { name: topic.trim(), exact: true }).click();
        assert.ok((await page.locator('#historyInput').inputValue()).length > 5);
        await page.locator('#askBtn').click();
      }
      assert.equal(await page.locator('#historyLog .feed-item').count(), topics.length);

      await tab(page, 'exam');
      const examIds = await page.locator('[data-exam]').evaluateAll(nodes => nodes.map(node => node.dataset.exam));
      for (const examId of examIds) await page.locator(`[data-exam="${examId}"]`).click();
      assert.equal(await page.locator('#examLog .feed-item').count(), examIds.length);

      await reason(page, DIAGNOSES[id]);
      assert.equal(await page.locator('#reasoningLog .feed-item').count(), 1);

      await tab(page, 'orders');
      const orderIds = await page.locator('[data-order]').evaluateAll(nodes => nodes.map(node => node.dataset.order));
      for (const orderId of orderIds) await page.locator(`[data-order="${orderId}"]`).click();
      assert.equal(await page.locator('#orderLog .feed-item').count(), orderIds.length);

      for (const role of ['nurse', 'intern', 'attending', 'cardiology', 'parent']) {
        await message(page, role, `${id}: assessment, urgency, request, contingency, and confirmation.`);
      }
      assert.equal(await page.locator('#teamLog .feed-item').count(), 5);
    }

    assert.equal(await clock(page), 0);
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });
});

describe('results, serial assessment, and interruptions', () => {
  test('result workflow and post-treatment reassessment are visible and state-dependent', { timeout: 120000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await boot(page);
    await selectPatient(page, 'maya');
    await exam(page, 'pulses');
    const baseline = await page.locator('#examLog .feed-item').first().innerText();
    assert.match(baseline, /femoral pulses are faint/i);
    await stabiliseMaya(page);

    await tab(page, 'results');
    const glucose = page.locator('#resultLog .feed-item').filter({ hasText: 'Point-of-care glucose' });
    await glucose.waitFor();
    assert.match(await glucose.innerText(), /not yet opened/i);
    await glucose.locator('[data-review]').click();
    assert.match(await glucose.innerText(), /58 mg\/dL/i);
    await glucose.locator('[data-interpret]').click();
    assert.match(await glucose.innerText(), /Interpreted/i);

    await exam(page, 'pulses');
    const followup = await page.locator('#examLog .feed-item').first().innerText();
    assert.match(followup, /now palpable|warmer|improving/i);
    assert.notEqual(followup, baseline);
    await context.close();
  });

  test('Eli, Nora, and Jamal pages progress through acknowledgment, response, uncertainty, and resolution', { timeout: 180000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await boot(page);
    await stabiliseMaya(page);

    const eliPage = page.locator('#pages .feed-item').filter({ hasText: 'Eli is desaturating' });
    await eliPage.waitFor();
    await eliPage.locator('[data-ack]').click();
    await exam(page, 'respiratory');
    await order(page, 'oxygen');
    await exam(page, 'hydration');
    assert.match(await eliPage.innerText(), /Response/i);
    assert.match(await eliPage.innerText(), /Resolved/i);

    const noraPage = page.locator('#pages .feed-item').filter({ hasText: 'positive blood culture' });
    await noraPage.waitFor();
    await noraPage.locator('[data-ack]').click();
    await exam(page, 'appearance');
    await reason(page, DIAGNOSES.nora);
    await order(page, 'reviewculture');
    await exam(page, 'fontanelle');
    await tab(page, 'results');
    const preliminary = page.locator('#resultLog .feed-item').filter({ hasText: 'Review blood-culture collection details' });
    await preliminary.locator('[data-review]').click();
    assert.match(await preliminary.innerText(), /time to positivity 16 hours/i);
    assert.equal(await page.getByText(/Streptococcus agalactiae/i).count(), 0);
    await page.locator('#noraJudgment').selectOption('indeterminate');
    await page.locator('#noraConfidence').fill('65');
    await page.locator('#submitNoraJudgment').click();
    for (const id of ['appearance', 'perfusion', 'fontanelle']) await exam(page, id);
    await tab(page, 'results');
    const speciation = page.locator('#resultLog .feed-item').filter({ hasText: 'Blood-culture speciation' });
    await speciation.waitFor();
    await speciation.locator('[data-review]').click();
    assert.match(await speciation.innerText(), /group B Streptococcus/i);

    const jamalPage = page.locator('#pages .feed-item').filter({ hasText: 'Jamal caregiver requests an update' });
    await jamalPage.waitFor();
    await jamalPage.locator('[data-ack]').click();
    await order(page, 'family');
    await exam(page, 'chestwall');
    assert.match(await jamalPage.innerText(), /Resolved/i);
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });
});

describe('prostaglandin apnea safety path', () => {
  async function startPgeWithoutAirway(page) {
    await boot(page);
    await selectPatient(page, 'maya');
    await reason(page);
    await order(page, 'pge');
    for (const id of ['pulses', 'abdomen', 'respiratory']) await exam(page, id);
    await page.locator('#pages .feed-item').filter({ hasText: 'apnea after prostaglandin' }).waitFor();
  }

  test('unsupported apnea deteriorates visibly and ends in arrest', { timeout: 120000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await startPgeWithoutAirway(page);
    const vitals = await vitalMap(page);
    assert.ok(Number(vitals.SpO2) < 70, `apnea should cause severe hypoxemia, got ${vitals.SpO2}`);
    assert.match(await page.locator('#patientStatus').innerText(), /Critical/i);
    await selectPatient(page, 'jamal');
    for (let i = 0; i < 8 && await page.locator('#debrief').isHidden(); i++) await exam(page, 'chestwall');
    await page.locator('#debrief').waitFor({ state: 'visible' });
    assert.match(await page.locator('#debriefOutcome').innerText(), /apnea/i);
    assert.doesNotMatch(await page.locator('#masteryBadge').innerText(), /standard met/i);
    await context.close();
  });

  test('airway support after apnea rescues the patient', { timeout: 120000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await startPgeWithoutAirway(page);
    await order(page, 'airway');
    await tab(page, 'exam');
    await page.locator('#repeatVitalsBtn').click();
    await exam(page, 'appearance');
    assert.equal(await page.locator('#debrief').isHidden(), true);
    assert.doesNotMatch(await page.locator('#patientStatus').innerText(), /Arrest/i);
    assert.ok(Number((await vitalMap(page)).SpO2) >= 92);
    await context.close();
  });
});

describe('forced handoff, debrief, persistence, and layout', () => {
  test('clinical time stops at handoff and a completed attempt persists', { timeout: 180000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await boot(page);
    await stabiliseMaya(page);
    await selectPatient(page, 'jamal');
    await tab(page, 'exam');
    for (let i = 0; i < 40 && await page.locator('#endModal').isHidden(); i++) {
      const button = page.locator('[data-exam="chestwall"]');
      if (await button.isDisabled()) break;
      await button.click();
    }
    await page.locator('#endModal').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#clockLeft').innerText(), 'Handoff');
    const stopped = await clock(page);
    assert.ok(stopped >= 840 && stopped <= 841, `handoff opened at ${stopped}s`);
    await page.waitForTimeout(2200);
    assert.equal(await clock(page), stopped);

    await completeHandoff(page);
    assert.ok(await page.locator('#objectiveDebrief .score-card').count() >= 7);
    assert.match(await page.locator('#analyticsDebrief').innerText(), /Time to first disconfirming inquiry/i);
    assert.match(await page.locator('#handoffDebrief').innerText(), /100%/);
    assert.ok(await page.locator('#timelineDebrief .feed-item').count() > 10);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#attemptHistory .feed-item').waitFor();
    assert.match(await page.locator('#attemptHistory').innerText(), /Attempt [ABC]/);
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 900 }, { width: 1440, height: 1000 }]) {
    test(`no horizontal overflow and named controls at ${viewport.width}px`, { timeout: 60000 }, async () => {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await page.goto(`${server.origin}/phs/`, { waitUntil: 'domcontentloaded' });
      await page.locator('#startBtn').waitFor();
      const layout = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const offenders = [...document.querySelectorAll('body *')].map(el => {
          const r = el.getBoundingClientRect();
          return { tag: el.tagName.toLowerCase(), id: el.id, cls: el.className, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
        }).filter(x => x.right > width + 1 || x.left < -1).slice(0, 12);
        return { width, scroll: document.documentElement.scrollWidth, offenders };
      });
      assert.ok(layout.scroll <= layout.width + 1,
        `overflow ${layout.width}->${layout.scroll}; offenders ${JSON.stringify(layout.offenders)}`);

      const unnamed = await page.evaluate(() => [...document.querySelectorAll('button,input,select,textarea')]
        .filter(el => {
          if (el.type === 'hidden' || el.closest('[hidden]')) return false;
          const name = el.getAttribute('aria-label') || el.getAttribute('title') ||
            (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent.trim()) ||
            (el.tagName === 'BUTTON' ? el.textContent.trim() : '') ||
            (el.type === 'radio' ? el.closest('label')?.textContent.trim() : '');
          return !name;
        }).map(el => `${el.tagName.toLowerCase()}#${el.id || '(no id)'}`));
      assert.deepEqual(unnamed, []);
      await context.close();
    });
  }
});
