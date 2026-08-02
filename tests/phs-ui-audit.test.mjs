// Rigorous UI-only audit of the Pediatric Hospital Simulator.
//
// Unlike the scenario regression suite, these tests do not call simulator
// functions, mutate `state`, or advance the clock from page.evaluate(). Every
// clinical decision is made through the same visible controls used by a learner.

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

function seconds(text) {
  const match = String(text).trim().match(/^(\d+):(\d{2})$/);
  assert.ok(match, `expected mm:ss clock text, got ${JSON.stringify(text)}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

async function clock(page, id = 'clock') {
  return seconds(await page.locator(`#${id}`).innerText());
}

async function boot(page, mode = 'assessment') {
  await page.goto(`${server.origin}/phs/`, { waitUntil: 'domcontentloaded' });
  await page.locator('.version').waitFor({ state: 'visible' });
  await page.locator('#prebriefObjectives .objective').first().waitFor({ state: 'visible' });
  if (mode === 'practice') await page.locator('input[name="mode"][value="practice"]').check();
  for (const [id, rank] of Object.entries(RANKING)) {
    await page.locator(`#initial-rank-${id}`).selectOption(rank);
  }
  await page.locator('#startBtn').click();
  await page.locator('#prebrief').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#runState').innerText(), 'Running');
}

async function selectPatient(page, id) {
  await page.locator(`[data-patient="${id}"]`).click();
  await page.locator('#patientTitle').waitFor({ state: 'visible' });
}

async function openTab(page, id) {
  await page.locator(`[role="tab"][data-tab="${id}"]`).click();
  await page.locator(`#tab-${id}`).waitFor({ state: 'visible' });
}

async function ask(page, question, source = 'parent') {
  await openTab(page, 'history');
  await page.locator('#historySource').selectOption(source);
  await page.locator('#historyInput').fill(question);
  await page.locator('#askBtn').click();
}

async function exam(page, id) {
  await openTab(page, 'exam');
  await page.locator(`[data-exam="${id}"]`).click();
}

async function reasoning(page, diagnosis, problem = 'A sick child with a time-critical problem', plan = 'Stabilize, reassess, and escalate') {
  await openTab(page, 'reasoning');
  await page.locator('#problemInput').fill(problem);
  await page.locator('#diagnosisSelect').selectOption({ label: diagnosis });
  await page.locator('#alternativesInput').fill('Alternative diagnoses remain possible and require parallel evaluation.');
  await page.locator('#planInput').fill(plan);
  await page.locator('#confidenceInput').fill('80');
  await page.locator('#commitBtn').click();
}

async function order(page, id) {
  await openTab(page, 'orders');
  await page.locator(`[data-order="${id}"]`).click();
}

async function communicate(page, role, message, readback = true) {
  await openTab(page, 'team');
  await page.locator(`[data-role="${role}"]`).click();
  await page.locator('#teamMessage').fill(message);
  await page.locator('#sendTeamBtn').click();
  if (readback && await page.locator('#readbackBtn').isVisible()) await page.locator('#readbackBtn').click();
}

async function stabiliseMaya(page) {
  await selectPatient(page, 'maya');
  await exam(page, 'pulses');
  await reasoning(
    page,
    'Ductal-dependent systemic circulation / critical coarctation',
    'Six-day-old with shock, differential perfusion, and weak femoral pulses concerning for ductal-dependent systemic circulation.',
    'Airway readiness, prostaglandin, monitoring, glucose, cultures, antibiotics, escalation, and reassessment.'
  );
  await order(page, 'airway');
  await exam(page, 'abdomen');
  await order(page, 'pge');
  await order(page, 'monitoriv');
  await order(page, 'glucose');
  await order(page, 'culture');
  await order(page, 'antibiotics');
  await communicate(page, 'cardiology', 'Neonatal shock with differential perfusion. Urgent cardiac ICU support and transfer requested. Please read back.', true);
  await communicate(page, 'parent', 'Your baby is critically ill. We are treating a circulation problem while also covering infection and will update you as results return.', false);
  await openTab(page, 'exam');
  await page.locator('#repeatVitalsBtn').click();
}

async function fillHandoff(page) {
  for (const [id, rank] of Object.entries(RANKING)) await page.locator(`#final-rank-${id}`).selectOption(rank);
  for (const id of Object.keys(RANKING)) {
    await page.locator(`#handoff-${id}-illness`).fill(id === 'maya' ? 'Watcher after stabilization' : 'Stable or monitored');
    await page.locator(`#handoff-${id}-summary`).fill('Current clinical summary with key findings and working diagnosis.');
    await page.locator(`#handoff-${id}-actions`).fill('Actions completed and treatment response documented.');
    await page.locator(`#handoff-${id}-pending`).fill('Incoming resident owns pending results and reassessment.');
    await page.locator(`#handoff-${id}-contingency`).fill('Escalate for worsening vitals, perfusion, breathing, or neurologic status.');
  }
}

describe('real clock, attention clock, and pause semantics', () => {
  test('time advances in real seconds and action costs are added exactly once', { timeout: 90000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await boot(page);

    const start = await clock(page);
    const leftStart = await clock(page, 'clockLeft');
    assert.ok(leftStart >= 837 && leftStart <= 840, `clinical time should begin near 14:00, got ${leftStart}s`);

    await page.waitForTimeout(2600);
    const afterReal = await clock(page);
    assert.ok(afterReal - start >= 2 && afterReal - start <= 4,
      `clock should track elapsed real seconds; advanced ${afterReal - start}s in 2.6 real seconds`);

    await selectPatient(page, 'maya');
    const beforeHistory = await clock(page);
    await ask(page, 'How has she been feeding?');
    const afterHistory = await clock(page);
    assert.ok(afterHistory - beforeHistory >= 20 && afterHistory - beforeHistory <= 22,
      `recognized history should cost 20 seconds once, cost ${afterHistory - beforeHistory}s`);
    assert.match(await page.locator('#historyLog').innerText(), /less than half a bottle/i);

    const beforeUnknown = await clock(page);
    await ask(page, 'Has she had a rash or vomiting?');
    const afterUnknown = await clock(page);
    assert.ok(afterUnknown - beforeUnknown >= 5 && afterUnknown - beforeUnknown <= 7,
      `unrecognized history should cost 5 seconds, cost ${afterUnknown - beforeUnknown}s`);
    assert.match(await page.locator('#historyLog').innerText(), /not understand|available topics/i);

    const elapsed = await clock(page);
    const left = await clock(page, 'clockLeft');
    assert.ok(Math.abs((elapsed + left) - 840) <= 1,
      `scenario clock plus clinical time left should equal 840 seconds; got ${elapsed}+${left}`);

    await page.locator('#pauseBtn').click();
    assert.equal(await page.locator('#runState').innerText(), 'Paused');
    const pausedAt = await clock(page);
    await page.waitForTimeout(2200);
    assert.equal(await clock(page), pausedAt, 'assessment pause must freeze the clock');
    assert.equal(await page.locator('#historyInput').isDisabled(), true);
    assert.equal(await page.locator('#askBtn').isDisabled(), true);
    await openTab(page, 'exam');
    for (const button of await page.locator('[data-exam]').all()) assert.equal(await button.isDisabled(), true);

    await page.locator('#pauseBtn').click();
    await page.waitForTimeout(1200);
    const resumed = await clock(page);
    assert.ok(resumed - pausedAt >= 1 && resumed - pausedAt <= 2, `resume should restart one-second ticks, advanced ${resumed - pausedAt}s`);
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });

  test('practice pause permits exploration without advancing time and labels it unscored', { timeout: 90000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await boot(page, 'practice');
    await page.locator('#pauseBtn').click();
    assert.equal(await page.locator('#runState').innerText(), 'Practice pause');
    await selectPatient(page, 'maya');
    const before = await clock(page);
    await ask(page, 'How has she been feeding?');
    await exam(page, 'pulses');
    await reasoning(page, 'Ductal-dependent systemic circulation / critical coarctation');
    await order(page, 'glucose');
    assert.equal(await clock(page), before, 'coached practice actions must not consume scenario time');
    assert.match(await page.locator('#ledger').innerText(), /Practice pause.*unscored/i);
    assert.match(await page.locator('#orderLog').innerText(), /Point-of-care glucose/i);
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });
});

describe('complete visible control surface', () => {
  test('every patient history topic, examination, order, and team role is operable through the UI', { timeout: 180000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await boot(page, 'practice');
    await page.locator('#pauseBtn').click();

    const diagnoses = {
      maya: 'Ductal-dependent systemic circulation / critical coarctation',
      eli: 'Bronchiolitis with hypoxemia and evolving respiratory distress',
      nora: 'Febrile young infant with invasive bacterial infection',
      jamal: 'Likely musculoskeletal chest pain without current high-risk features',
    };

    for (const id of Object.keys(diagnoses)) {
      await selectPatient(page, id);

      await openTab(page, 'history');
      const chipPrompts = await page.locator('.topic-chip').evaluateAll(chips => chips.map(chip => chip.textContent.trim()));
      assert.ok(chipPrompts.length >= 3, `${id} should expose at least three history topics`);
      for (const label of chipPrompts) {
        await page.getByRole('button', { name: label, exact: true }).click();
        assert.ok((await page.locator('#historyInput').inputValue()).length > 5, `${id} topic ${label} should fill a usable prompt`);
        await page.locator('#askBtn').click();
      }
      assert.equal(await page.locator('#historyLog .feed-item').count(), chipPrompts.length,
        `${id} should log every suggested history question`);

      await openTab(page, 'exam');
      const examIds = await page.locator('[data-exam]').evaluateAll(buttons => buttons.map(button => button.dataset.exam));
      assert.ok(examIds.length >= 3, `${id} should expose examinations`);
      for (const examId of examIds) await page.locator(`[data-exam="${examId}"]`).click();
      assert.equal(await page.locator('#examLog .feed-item').count(), examIds.length,
        `${id} should log every examination`);

      await reasoning(page, diagnoses[id]);
      assert.equal(await page.locator('#reasoningLog .feed-item').count(), 1, `${id} reasoning should be recorded`);

      await openTab(page, 'orders');
      const orderIds = await page.locator('[data-order]').evaluateAll(buttons => buttons.map(button => button.dataset.order));
      assert.ok(orderIds.length >= 4, `${id} should expose orders and treatments`);
      for (const orderId of orderIds) await page.locator(`[data-order="${orderId}"]`).click();
      assert.equal(await page.locator('#orderLog .feed-item').count(), orderIds.length,
        `${id} should place every visible order without a dead control`);

      for (const role of ['nurse', 'intern', 'attending', 'cardiology', 'parent']) {
        await communicate(page, role, `${id}: assessment, urgency, explicit request, contingency, and confirmation.`, true);
      }
      assert.equal(await page.locator('#teamLog .feed-item').count(), 5,
        `${id} should support all five communication roles`);
    }

    assert.equal(await clock(page), 0, 'full practice-pause control audit must not consume clock time');
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });
});

describe('orders, results, reassessment, and concurrent process time', () => {
  test('placing, completing, reviewing, interpreting, and reassessing all occur in the rendered UI', { timeout: 120000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await boot(page);
    await selectPatient(page, 'maya');

    await exam(page, 'pulses');
    const initialFinding = await page.locator('#examLog .feed-item').first().innerText();
    assert.match(initialFinding, /femoral pulses are faint/i);

    await reasoning(page, 'Ductal-dependent systemic circulation / critical coarctation');
    await order(page, 'airway');
    await exam(page, 'abdomen');
    await order(page, 'pge');
    await order(page, 'monitoriv');
    await order(page, 'glucose');
    await order(page, 'culture');
    await order(page, 'antibiotics');

    await openTab(page, 'results');
    const glucose = page.locator('#resultLog .feed-item').filter({ hasText: 'Point-of-care glucose' });
    await glucose.waitFor({ state: 'visible' });
    assert.match(await glucose.innerText(), /not yet opened/i);
    await glucose.locator('[data-review]').click();
    assert.match(await glucose.innerText(), /58 mg\/dL/i);
    await glucose.locator('[data-interpret]').click();
    assert.match(await glucose.innerText(), /Interpreted/i);

    await exam(page, 'pulses');
    const reassessment = await page.locator('#examLog .feed-item').first().innerText();
    assert.match(reassessment, /now palpable|warmer|improving/i,
      `post-treatment reassessment should differ from baseline: ${reassessment}`);
    assert.notEqual(reassessment, initialFinding);

    await openTab(page, 'orders');
    assert.match(await page.locator('#orderLog').innerText(), /Point-of-care glucose[\s\S]*interpreted/i);
    assert.match(await page.locator('#orderLog').innerText(), /Prostaglandin[\s\S]*(available|reviewed|interpreted|complete)/i);
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });
});

describe('interruptions and staged uncertainty', () => {
  test('pages arrive, acknowledge, trigger a clinical response, resolve, and Nora remains uncertain until commitment', { timeout: 180000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await boot(page);
    await stabiliseMaya(page);

    const eliPage = page.locator('#pages .feed-item').filter({ hasText: 'Eli is desaturating' });
    await eliPage.waitFor({ state: 'visible' });
    await eliPage.locator('[data-ack]').click();
    assert.match(await page.locator('#patientTitle').innerText(), /Eli Ramirez/);
    await exam(page, 'respiratory');
    await order(page, 'oxygen');
    await exam(page, 'hydration');
    assert.match(await eliPage.innerText(), /Response/i);
    assert.match(await eliPage.innerText(), /Resolved/i);

    const noraPage = page.locator('#pages .feed-item').filter({ hasText: 'positive blood culture' });
    await noraPage.waitFor({ state: 'visible' });
    await noraPage.locator('[data-ack]').click();
    assert.match(await page.locator('#patientTitle').innerText(), /Nora Williams/);
    await exam(page, 'appearance');
    await reasoning(page, 'Febrile young infant with invasive bacterial infection');
    await order(page, 'reviewculture');
    await exam(page, 'fontanelle');
    await openTab(page, 'results');
    const preliminary = page.locator('#resultLog .feed-item').filter({ hasText: 'Review blood-culture collection details' });
    await preliminary.locator('[data-review]').click();
    assert.match(await preliminary.innerText(), /time to positivity 16 hours/i);
    assert.equal(await page.locator('#resultLog').getByText(/Streptococcus agalactiae/i).count(), 0,
      'speciation must not be revealed before the learner commits');
    await page.locator('#noraJudgment').selectOption('indeterminate');
    await page.locator('#noraConfidence').fill('65');
    await page.locator('#submitNoraJudgment').click();
    assert.match(await page.locator('#resultLog').innerText(), /Provisional judgment recorded/i);

    await exam(page, 'appearance');
    await exam(page, 'perfusion');
    await exam(page, 'fontanelle');
    await openTab(page, 'results');
    const speciation = page.locator('#resultLog .feed-item').filter({ hasText: 'Blood-culture speciation' });
    await speciation.waitFor({ state: 'visible' });
    await speciation.locator('[data-review]').click();
    assert.match(await speciation.innerText(), /group B Streptococcus/i);

    const jamalPage = page.locator('#pages .feed-item').filter({ hasText: 'Jamal caregiver requests an update' });
    await jamalPage.waitFor({ state: 'visible' });
    await jamalPage.locator('[data-ack]').click();
    await order(page, 'family');
    await exam(page, 'chestwall');
    assert.match(await jamalPage.innerText(), /Resolved/i);

    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });
});

describe('prostaglandin respiratory safety pathway', () => {
  async function triggerApnea(page) {
    await boot(page);
    await selectPatient(page, 'maya');
    await reasoning(page, 'Ductal-dependent systemic circulation / critical coarctation');
    await order(page, 'pge');
    await exam(page, 'pulses');
    await exam(page, 'abdomen');
    await exam(page, 'respiratory');
    const apneaPage = page.locator('#pages .feed-item').filter({ hasText: 'apnea after prostaglandin' });
    await apneaPage.waitFor({ state: 'visible' });
    return apneaPage;
  }

  test('unsupported apnea visibly deteriorates and terminates in arrest', { timeout: 120000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await triggerApnea(page);
    assert.match(await page.locator('#patientStatus').innerText(), /Critical/i);
    assert.match(await page.locator('#vitals').innerText(), /68|apnea/i);

    await selectPatient(page, 'jamal');
    for (let i = 0; i < 8 && await page.locator('#debrief').isHidden(); i++) await exam(page, 'chestwall');
    await page.locator('#debrief').waitFor({ state: 'visible' });
    assert.match(await page.locator('#debriefOutcome').innerText(), /arrested.*apnea|apnea.*arrested/i);
    assert.doesNotMatch(await page.locator('#masteryBadge').innerText(), /standard met/i);
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });

  test('airway support placed after the event completes and rescues the patient', { timeout: 120000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await triggerApnea(page);
    await order(page, 'airway');
    await openTab(page, 'exam');
    await page.locator('#repeatVitalsBtn').click();
    await exam(page, 'appearance');
    assert.equal(await page.locator('#debrief').isHidden(), true, 'rescued patient should not auto-end in apnea arrest');
    assert.doesNotMatch(await page.locator('#patientStatus').innerText(), /Arrest/i);
    const vitals = await page.locator('#vitals').innerText();
    assert.match(vitals, /92|93|94|95|96/, `oxygenation should recover after airway support: ${vitals}`);
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });
});

describe('clinical deadline, stopped handoff clock, debrief, and persistence', () => {
  test('the 14-minute clinical window forces handoff, freezes time, and produces a complete persisted debrief', { timeout: 180000 }, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await boot(page);
    await stabiliseMaya(page);

    await selectPatient(page, 'jamal');
    await openTab(page, 'exam');
    for (let i = 0; i < 40 && await page.locator('#endModal').isHidden(); i++) {
      const button = page.locator('[data-exam="chestwall"]');
      if (await button.isDisabled()) break;
      await button.click();
    }

    await page.locator('#endModal').waitFor({ state: 'visible' });
    assert.equal(await clock(page, 'clockLeft'), 0, 'clinical time remaining must reach zero');
    const handoffAt = await clock(page);
    assert.ok(handoffAt >= 840 && handoffAt <= 841, `handoff should open at 14:00, got ${handoffAt}s`);
    await page.waitForTimeout(2200);
    assert.equal(await clock(page), handoffAt, 'scenario clock must stop during forced handoff');

    await fillHandoff(page);
    await page.locator('#completeBtn').click();
    await page.locator('#debrief').waitFor({ state: 'visible' });
    assert.ok(await page.locator('#objectiveDebrief .score-card').count() >= 7, 'overall plus six objective cards should render');
    assert.match(await page.locator('#analyticsDebrief').innerText(), /Time to first disconfirming inquiry/i);
    assert.match(await page.locator('#handoffDebrief').innerText(), /100%/);
    assert.ok(await page.locator('#timelineDebrief .feed-item').count() > 10, 'timeline replay should contain the visible encounter');
    assert.match(await page.locator('#remediationDebrief').innerText(), /Assigned variant/i);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#attemptHistory .feed-item').waitFor({ state: 'visible' });
    assert.match(await page.locator('#attemptHistory').innerText(), /Attempt [ABC]/);
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });
});

describe('responsive layout and accessible control names', () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 900 }, { width: 1440, height: 1000 }]) {
    test(`renders without horizontal overflow at ${viewport.width}px`, { timeout: 60000 }, async () => {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const errors = watchForErrors(page);
      await page.goto(`${server.origin}/phs/`, { waitUntil: 'domcontentloaded' });
      await page.locator('#startBtn').waitFor({ state: 'visible' });
      const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      assert.ok(dimensions.scroll <= dimensions.width + 1,
        `horizontal overflow at ${viewport.width}px: client ${dimensions.width}, scroll ${dimensions.scroll}`);

      const unnamed = await page.evaluate(() => [...document.querySelectorAll('button,input,select,textarea')]
        .filter(el => {
          const hidden = el.type === 'hidden' || el.closest('[hidden]');
          const name = el.getAttribute('aria-label') || el.getAttribute('title') ||
            (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent.trim()) ||
            (el.tagName === 'BUTTON' ? el.textContent.trim() : '') ||
            (el.type === 'radio' ? el.closest('label')?.textContent.trim() : '');
          return !hidden && !name;
        }).map(el => `${el.tagName.toLowerCase()}#${el.id || '(no id)'}`));
      assert.deepEqual(unnamed, [], `visible controls without accessible names: ${unnamed.join(', ')}`);
      assert.deepEqual([...new Set(errors)], []);
      await context.close();
    });
  }
});
