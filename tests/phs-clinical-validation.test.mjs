import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium, watchForErrors } from './helpers/harness.mjs';
import { CORRECT_RANKING, fullHandoffs } from './helpers/phs.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function openAttempt() {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = watchForErrors(page);
  await page.goto(`${server.origin}/phs/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => state?.caseData?.version === '1.9.0-rc2');
  await page.evaluate(ranking => {
    for (const [patientId, rank] of Object.entries(ranking)) document.getElementById(`initial-rank-${patientId}`).value = rank;
    document.getElementById('startBtn').click();
    state.running = false;
  }, CORRECT_RANKING);
  return { context, page, errors };
}

test('PGE is blocked until monitored vascular access is complete', async () => {
  const { context, page, errors } = await openAttempt();
  const result = await page.evaluate(() => {
    state.running = true; selectPatient('maya');
    commitReasoning({ problem: 'Neonatal shock', diagnosis: 'Ductal-dependent systemic circulation / critical coarctation', alternatives: 'Sepsis', plan: 'PGE', confidence: 80 });
    placeOrder('pge');
    return { placed: !!orderRecord('maya', 'pge'), banner: document.getElementById('urgentBanner').textContent };
  });
  assert.equal(result.placed, false);
  assert.match(result.banner, /monitored vascular access/i);
  assert.deepEqual(errors, []);
  await context.close();
});

test('airway readiness does not prevent apnea and PPV is required for rescue', async () => {
  const { context, page, errors } = await openAttempt();
  const result = await page.evaluate(() => {
    state.running = true; selectPatient('maya'); performExam('fourbp'); placeOrder('monitoriv'); advanceScenario(60, true);
    commitReasoning({ problem: 'Neonatal shock', diagnosis: 'Ductal-dependent systemic circulation / critical coarctation', alternatives: 'Sepsis', plan: 'PGE with airway and PPV if apnea', confidence: 80 });
    placeOrder('airway'); advanceScenario(30, true); placeOrder('pge');
    while (!state.patients.maya.flags.pgeApnea && !state.ended) advanceScenario(5, true);
    const occurredDespiteReadiness = state.patients.maya.flags.pgeApnea && state.patients.maya.flags.airwayReady;
    placeOrder('airway'); advanceScenario(30, true);
    const equipmentAloneResolved = !state.patients.maya.flags.pgeApnea;
    placeOrder('ventilation'); advanceScenario(10, true);
    return { occurredDespiteReadiness, equipmentAloneResolved, resolvedByPpv: !state.patients.maya.flags.pgeApnea && state.flags.pgeApneaResolved };
  });
  assert.equal(result.occurredDespiteReadiness, true);
  assert.equal(result.equipmentAloneResolved, false);
  assert.equal(result.resolvedByPpv, true);
  assert.deepEqual(errors, []);
  await context.close();
});

test('contradictory critical-result interpretations are rejected', async () => {
  const { context, page } = await openAttempt();
  const result = await page.evaluate(() => {
    const echo = { orderId: 'echo' };
    const gbs = { orderId: 'speciation' };
    return {
      unsafeEcho: phsInterpretationQuality('maya', echo, 'Coarctation is excluded; stop prostaglandin and cancel cardiology transfer.'),
      safeEcho: phsInterpretationQuality('maya', echo, 'Critical coarctation with ductal systemic hypoperfusion; continue prostaglandin and urgent cardiac transfer.'),
      unsafeGbs: phsInterpretationQuality('nora', gbs, 'GBS is not a pathogen; stop antibiotics and avoid admission.'),
    };
  });
  assert.equal(result.unsafeEcho, false);
  assert.equal(result.safeEcho, true);
  assert.equal(result.unsafeGbs, false);
  await context.close();
});

test('low-value bronchiolitis medication blocks mastery', async () => {
  const { context, page } = await openAttempt();
  const result = await page.evaluate(handoffs => {
    state.running = true; selectPatient('eli'); placeOrder('albuterol'); advanceScenario(15, true);
    state.finalRanking = { maya: 1, eli: 2, nora: 3, jamal: 4 };
    state.handoffs = handoffs;
    const score = scoreAttempt();
    return { mastery: score.mastery, blocks: score.clinicalValidationBlocks || [] };
  }, fullHandoffs());
  assert.equal(result.mastery, false);
  assert.ok(result.blocks.some(item => /bronchiolitis/i.test(item)));
  await context.close();
});

test('Nora judgment requires culture review and ownerless handoff fails', async () => {
  const { context, page } = await openAttempt();
  const result = await page.evaluate(() => {
    state.running = true; selectPatient('nora');
    submitNoraJudgment('likely pathogen', 90);
    const premature = state.noraJudgment;
    state.flags.noraJudgmentPrompt = true;
    state.patients.nora.results.push({ orderId: 'reviewculture', reviewedAt: state.time, requiresInterpretation: false });
    submitNoraJudgment('likely pathogen', 90);
    state.patients.nora.ordersPlaced.push({ id: 'lp', status: 'pending' });
    state.handoffs.nora = { pending: 'Pending result.' };
    return {
      premature,
      acceptedAfterReview: state.noraJudgment?.value,
      ownerlessPasses: evaluateCondition({ type: 'pendingOwnership' }),
    };
  });
  assert.equal(result.premature, null);
  assert.equal(result.acceptedAfterReview, 'likely pathogen');
  assert.equal(result.ownerlessPasses, false);
  await context.close();
});
