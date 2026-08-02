// Full end-to-end UI completion audit. No simulator state access or internal calls.
import { test, before, after } from 'node:test';
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

const ranking = { maya: '1', eli: '2', nora: '3', jamal: '4' };

function seconds(text) {
  const m = String(text).match(/^(\d+):(\d{2})$/);
  assert.ok(m, `not a clock: ${text}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

async function tab(page, name) {
  await page.locator(`[data-tab="${name}"]`).click();
  await page.locator(`#tab-${name}`).waitFor({ state: 'visible' });
}

async function exam(page, id) {
  await tab(page, 'exam');
  await page.locator(`[data-exam="${id}"]`).click();
}

async function order(page, id) {
  await tab(page, 'orders');
  await page.locator(`[data-order="${id}"]`).click();
}

async function start(page) {
  await page.goto(`${server.origin}/phs/`, { waitUntil: 'domcontentloaded' });
  await page.locator('#startBtn').waitFor();
  for (const [id, rank] of Object.entries(ranking)) await page.locator(`#initial-rank-${id}`).selectOption(rank);
  await page.locator('#startBtn').click();
  await page.locator('#prebrief').waitFor({ state: 'hidden' });
}

async function stabilise(page) {
  await page.locator('[data-patient="maya"]').click();
  await exam(page, 'pulses');
  await tab(page, 'reasoning');
  await page.locator('#problemInput').fill('Neonatal shock with differential perfusion and weak femoral pulses.');
  await page.locator('#diagnosisSelect').selectOption({ label: 'Ductal-dependent systemic circulation / critical coarctation' });
  await page.locator('#alternativesInput').fill('Sepsis, metabolic disease, and myocarditis remain possible.');
  await page.locator('#planInput').fill('Airway readiness, prostaglandin, monitoring, sepsis coverage, escalation, and reassessment.');
  await page.locator('#confidenceInput').fill('85');
  await page.locator('#commitBtn').click();
  await order(page, 'airway');
  await exam(page, 'abdomen');
  for (const id of ['pge', 'monitoriv', 'glucose', 'culture', 'antibiotics', 'echo']) await order(page, id);
  await tab(page, 'team');
  await page.locator('[data-role="cardiology"]').click();
  await page.locator('#teamMessage').fill('Neonatal shock, urgent cardiac ICU transfer requested. Confirm receipt and ownership.');
  await page.locator('#sendTeamBtn').click();
  await page.locator('#readbackBtn').click();
  await tab(page, 'exam');
  await page.locator('#repeatVitalsBtn').click();
}

async function fillHandoff(page) {
  for (const [id, rank] of Object.entries(ranking)) await page.locator(`#final-rank-${id}`).selectOption(rank);
  for (const id of Object.keys(ranking)) {
    await page.locator(`#handoff-${id}-illness`).fill(id === 'maya' ? 'Watcher after stabilization' : 'Stable or monitored');
    await page.locator(`#handoff-${id}-summary`).fill('Current summary, diagnosis, and important clinical trajectory.');
    await page.locator(`#handoff-${id}-actions`).fill('Completed actions and response to treatment.');
    await page.locator(`#handoff-${id}-pending`).fill('Incoming resident owns pending results and reassessment.');
    await page.locator(`#handoff-${id}-contingency`).fill('Escalate for worsening vitals, perfusion, breathing, or neurologic status.');
  }
}

test('visible UI completes handoff, debrief, persistence, and assigned next attempt', { timeout: 180000 }, async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = watchForErrors(page);
  await start(page);
  const firstVariant = (await page.locator('#attemptState').innerText()).split('·').at(-1).trim();
  await stabilise(page);

  await page.locator('[data-patient="jamal"]').click();
  await tab(page, 'exam');
  for (let i = 0; i < 45 && await page.locator('#endModal').isHidden(); i++) {
    const button = page.locator('[data-exam="chestwall"]');
    if (await button.isDisabled()) break;
    await button.click();
  }
  await page.locator('#endModal').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#clockLeft').innerText(), 'Handoff');
  const stopped = seconds(await page.locator('#clock').innerText());
  assert.ok(stopped >= 840, `handoff began before deadline: ${stopped}`);
  await page.waitForTimeout(1500);
  assert.equal(seconds(await page.locator('#clock').innerText()), stopped, 'handoff clock continued running');

  await fillHandoff(page);
  await page.locator('#completeBtn').click();
  await page.locator('#debrief').waitFor({ state: 'visible' });
  assert.ok(await page.locator('#objectiveDebrief .score-card').count() >= 7);
  assert.match(await page.locator('#analyticsDebrief').innerText(), /Time to first disconfirming inquiry/i);
  assert.match(await page.locator('#missesDebrief').innerText(), /Specific feedback/i);
  assert.match(await page.locator('#handoffDebrief').innerText(), /100%/);
  assert.match(await page.locator('#remediationDebrief').innerText(), /Assigned variant/i);
  assert.ok(await page.locator('#timelineDebrief .feed-item').count() > 15);

  await page.locator('#nextAttemptBtn').click();
  await page.locator('#prebrief').waitFor({ state: 'visible' });
  const secondVariant = (await page.locator('#attemptState').innerText()).split('·').at(-1).trim();
  assert.notEqual(secondVariant, firstVariant, 'assigned next attempt did not change the surface variant');
  assert.match(await page.locator('#attemptHistory').innerText(), /Attempt [ABC]/);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#attemptHistory .feed-item').waitFor();
  assert.match(await page.locator('#attemptHistory').innerText(), /Attempt [ABC]/);
  assert.deepEqual([...new Set(errors)], []);
  await context.close();
});
