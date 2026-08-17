import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium, watchForErrors } from './helpers/harness.mjs';

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

async function waitForVisible(page, selector) {
  await page.waitForFunction(candidate => {
    const element = document.querySelector(candidate);
    return element && !element.classList.contains('hidden');
  }, selector);
}

test('the browser vertical slice completes and persists the safe HCM pathway', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = watchForErrors(page);

  const response = await page.goto(`${server.origin}/cardiohospital/?qa`, { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200);
  await page.waitForSelector('#qaTeam');
  assert.equal(await page.getAttribute('body', 'data-qa-mode'), 'true');

  // Exercise the room-to-room handoff through the same E-key interactions used
  // by a player. QA positioning avoids depending on headless pointer-lock input.
  await page.click('#qaTeam');
  await page.waitForFunction(() => document.querySelector('#prompt')?.textContent.includes('Dr. Patel'));
  await page.keyboard.press('KeyE');
  await waitForVisible(page, '#briefingBackdrop');
  await page.click('#acceptButton');
  assert.equal(await page.textContent('#objective'), 'Walk to Clinic Room 3');

  await page.click('#qaExam');
  await page.waitForFunction(() => document.querySelector('#prompt')?.textContent.includes('Clinic Room 3'));
  await page.keyboard.press('KeyE');
  await waitForVisible(page, '#encounter');

  for (const key of ['exertional_timing', 'prodrome', 'family_sudden_death']) {
    await page.click(`[data-history="${key}"]`);
  }
  assert.equal(await page.textContent('#clinicalSignal'), 'High-risk cardiac syncope');
  assert.equal(await page.isEnabled('#toExam'), true);
  await page.click('#toExam');

  await page.click('#openStethoscope');
  await page.click('[data-site="LLSB"]');
  await page.check('#valsalvaToggle');
  assert.match(await page.textContent('#siteFinding'), /louder with Valsalva/);
  assert.equal(await page.isEnabled('#toTests'), true);
  await page.click('#toTests');

  await page.click('[data-test="ecg"]');
  await waitForVisible(page, '#ecgBackdrop');
  for (const finding of ['sinus', 'lvh', 'lateral_q', 'lateral_t']) {
    await page.check(`.finding-grid input[value="${finding}"]`);
  }
  await page.click('#submitEcg');
  assert.match(await page.textContent('#ecgFeedback'), /^Complete interpretation:/);
  await page.click('#closeEcg');
  await page.click('[data-test="echo"]');
  assert.equal(await page.isEnabled('#toAssessment'), true);
  await page.click('#toAssessment');

  await page.click('[data-diagnosis="hcm"]');
  for (const action of ['restrict', 'family', 'genetics']) {
    await page.check(`#assessmentPanel input[value="${action}"]`);
  }
  assert.equal(await page.isEnabled('#finishEncounter'), true);
  await page.click('#finishEncounter');

  assert.equal(await page.textContent('#encounterStep'), 'Debrief');
  assert.equal(await page.textContent('#clinicalSignal'), 'Overall 100%');
  assert.equal(await page.textContent('#debriefHeadline'), 'Strong clinical judgment');
  const attempts = await page.evaluate(() => JSON.parse(localStorage.getItem('cardio_hospital:v1:preview_attempts') || '[]'));
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].caseId, 'case-hcm');
  assert.equal(attempts[0].overall, 100);
  assert.deepEqual(attempts[0].plan.sort(), ['family', 'genetics', 'restrict']);
  assert.deepEqual([...new Set(errors)], [], `runtime errors:\n${errors.join('\n')}`);

  await context.close();
});

test('replay clears encounter state without deleting prior attempt evidence', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${server.origin}/cardiohospital/?qa`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#qaExam');

  await page.evaluate(() => {
    localStorage.setItem('cardio_hospital:v1:preview_attempts', JSON.stringify([
      { caseId: 'case-hcm', completedAt: '2026-08-14T00:00:00.000Z', overall: 100 },
    ]));
  });
  await page.click('#qaExam');
  await page.waitForFunction(() => document.querySelector('#prompt')?.textContent.includes('Clinic Room 3'));
  await page.keyboard.press('KeyE');
  await page.click('[data-history="generic"]');
  await page.click('[data-history="palpitations"]');
  await page.click('[data-history="activity_level"]');
  await page.click('#toExam');
  await page.click('[data-exam="pulses"]');
  await page.click('[data-exam="pmi"]');
  await page.click('#toTests');
  await page.click('[data-test="troponin"]');
  await page.click('#toAssessment');
  await page.click('[data-diagnosis="vasovagal"]');
  await page.check('#assessmentPanel input[value="reassure"]');
  await page.click('#finishEncounter');
  assert.equal(await page.textContent('#debriefHeadline'), 'Revisit the red flags');

  await page.click('#resetEncounter');
  assert.equal(await page.textContent('#encounterStep'), 'History');
  assert.equal(await page.textContent('#clinicalSignal'), 'Clinical picture incomplete');
  assert.equal(await page.isEnabled('#toExam'), false);
  assert.equal(await page.isChecked('#assessmentPanel input[value="reassure"]'), false);
  const attempts = await page.evaluate(() => JSON.parse(localStorage.getItem('cardio_hospital:v1:preview_attempts') || '[]'));
  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].overall, 100);
  assert.ok(attempts[1].overall < 70);

  await context.close();
});
