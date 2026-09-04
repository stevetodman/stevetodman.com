import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium } from '../tests/helpers/harness.mjs';
import { SCIENCE_LAB_CONFIG } from '../study/science-lab/config.mjs';

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

test('Science Lab phone smoke: repair, graph, phenomenon, CER, twin separation', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(server.origin + '/study/matter-lab.html');

  assert.equal(await page.locator('.learner-grid .menu-card').count(), 2);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);

  await page.locator('[data-learner="Luke"]').click();
  assert.equal(await page.locator('.science-investigation-link').isVisible(), true, 'unfinished phenomenon should be the recommended action');
  assert.equal(await page.locator('[data-adaptive-practice]').isVisible(), true, 'short adaptive practice remains available');
  await page.locator('[data-adaptive-practice]').click();
  const initial = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SCIENCE_LAB_CONFIG.storageKey);
  assert.equal(initial.active.Luke.queue.length, 8);

  const first = SCIENCE_LAB_CONFIG.items.find(item => item.id === initial.active.Luke.queue[0]);
  const answers = Array.isArray(first.answer) ? first.answer : [first.answer];
  const wrong = first.choices.map((_choice, index) => index).filter(index => !answers.includes(index)).slice(0, answers.length);
  for (const index of wrong) await page.locator(`[data-choice="${index}"]`).click();
  await page.locator('[data-action="check"]').click();

  assert.equal(await page.locator('.feedback-card.repair').isVisible(), true);
  assert.equal(await page.locator('[data-action="retry"]').isVisible(), true);
  assert.equal((await page.locator('.feedback-card h2').innerText()).toLowerCase().includes('answer is'), false, 'first miss should give a clue before revealing the answer');

  const afterMiss = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SCIENCE_LAB_CONFIG.storageKey);
  assert.equal(afterMiss.learners.Luke.attempts.length, 1);
  assert.equal(afterMiss.learners.Luke.attempts[0].provenance, 'independent');
  assert.ok(afterMiss.learners.Luke.attempts[0].misconceptionTag);
  assert.equal(afterMiss.active.Luke.feedback.kind, 'hint');
  assert.equal(afterMiss.active.Luke.recoveryIds.length, 1);
  const repairTarget = afterMiss.learners.Luke.attempts[0].misconceptionTag;

  await page.reload();
  await page.locator('[data-learner="Luke"]').click();
  assert.equal(await page.locator('[data-action="retry"]').isVisible(), true);
  const resumed = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SCIENCE_LAB_CONFIG.storageKey);
  assert.equal(resumed.learners.Luke.attempts.length, 1, 'reload must not duplicate evidence');
  assert.equal(resumed.learners.Luke.attempts[0].misconceptionTag, repairTarget, 'misconception evidence must survive reload');

  await page.locator('[data-action="retry"]').click();
  assert.equal(await page.locator('.question-card .repair-note').isVisible(), true);
  for (const index of answers) await page.locator(`[data-choice="${index}"]`).click();
  await page.locator('[data-action="check"]').click();
  assert.equal(await page.locator('.feedback-card.correct').isVisible(), true);

  const afterRepair = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SCIENCE_LAB_CONFIG.storageKey);
  assert.equal(afterRepair.learners.Luke.attempts.length, 2);
  assert.equal(afterRepair.learners.Luke.attempts[1].provenance, 'hinted');
  assert.equal(afterRepair.learners.Luke.attempts[1].repairTarget, repairTarget);
  assert.equal(afterRepair.learners.Luke.attempts[1].misconceptionTag, repairTarget);

  await page.locator('[data-action="next"]').click();
  await page.locator('[data-action="pause"]').click();
  await page.locator('[data-action="switch"]').click();
  await page.locator('[data-learner="Samantha"]').click();
  assert.equal(await page.locator('.science-investigation-link').isVisible(), true);
  const isolated = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SCIENCE_LAB_CONFIG.storageKey);
  assert.ok(isolated.active.Luke);
  assert.equal(isolated.active.Samantha, undefined);

  await page.evaluate(({ key }) => {
    const state = JSON.parse(localStorage.getItem(key));
    state.active.Samantha = {
      version: 2,
      id: 'm3-graph-smoke',
      mode: 'unit',
      unitId: 'earth-sky',
      queue: ['sp2'],
      index: 0,
      selected: [],
      response: {},
      feedback: null,
      retry: null,
      results: [],
      recoveryIds: []
    };
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: SCIENCE_LAB_CONFIG.storageKey });

  await page.reload();
  await page.locator('[data-learner="Samantha"]').click();
  assert.equal(await page.locator('.graph-builder').isVisible(), true);
  assert.equal(await page.locator('.science-graph').isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'graph task must not overflow 390px');

  await page.locator('[data-plot-x="0"][data-plot-y="8"]').click();
  await page.locator('[data-plot-x="1"][data-plot-y="6"]').click();
  const partialGraph = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SCIENCE_LAB_CONFIG.storageKey);
  assert.deepEqual(partialGraph.active.Samantha.response, { 0: 8, 1: 6 });

  await page.reload();
  await page.locator('[data-learner="Samantha"]').click();
  assert.equal(await page.locator('[data-plot-x="0"][data-plot-y="8"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[data-plot-x="1"][data-plot-y="6"]').getAttribute('aria-pressed'), 'true');
  await page.locator('[data-plot-x="2"][data-plot-y="4"]').click();
  await page.locator('[data-plot-x="3"][data-plot-y="6"]').click();
  await page.locator('[data-action="check"]').click();
  assert.equal(await page.locator('.feedback-card.correct').isVisible(), true);

  const graphEvidence = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SCIENCE_LAB_CONFIG.storageKey);
  assert.equal(graphEvidence.learners.Samantha.attempts.at(-1).responseType, 'graph-build');
  assert.deepEqual(graphEvidence.learners.Samantha.attempts.at(-1).response, { 0: 8, 1: 6, 2: 4, 3: 6 });
  assert.equal(graphEvidence.learners.Samantha.attempts.at(-1).provenance, 'independent');

  const phenomenonUrl = server.origin + '/study/science-lab/investigate.html?learner=Samantha';
  await page.goto(phenomenonUrl);
  assert.equal(await page.locator('.phenomenon-card').isVisible(), true);
  assert.match(await page.locator('.progress-copy span').innerText(), /Where did the sugar go/i);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'phenomenon must not overflow 390px');

  await page.locator('[data-phen-action="continue"]').click();
  await page.locator('[data-phen-choice="0"]').click();
  await page.locator('[data-phen-action="commit"]').click();
  assert.equal(await page.locator('.particle-model').isVisible(), true, 'prediction should be committed before particle evidence appears');

  const activityKey = `${SCIENCE_LAB_CONFIG.storageKey}-phenomena`;
  const beforePhenReload = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), activityKey);
  assert.equal(beforePhenReload.active.Samantha.stepIndex, 2);
  assert.equal(beforePhenReload.active.Samantha.responses.predict.selected, 0);

  await page.reload();
  assert.equal(await page.locator('.particle-model').isVisible(), true, 'reload should resume the exact evidence step');
  const afterPhenReload = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), activityKey);
  assert.equal(afterPhenReload.active.Samantha.responses.predict.selected, 0, 'prediction must survive reload before later evidence');

  await page.locator('[data-phen-choice="0"]').click();
  await page.locator('[data-phen-action="check"]').click();
  assert.equal(await page.locator('.feedback-card.correct').isVisible(), true);
  await page.locator('[data-phen-action="feedback-next"]').click();
  assert.equal(await page.locator('.science-graph').isVisible(), true);
  await page.locator('[data-phen-choice="0"]').click();
  await page.locator('[data-phen-action="check"]').click();
  await page.locator('[data-phen-action="feedback-next"]').click();

  await page.locator('[data-phen-choice="1"]').click();
  await page.locator('[data-phen-action="check"]').click();
  assert.match(await page.locator('.feedback-card h2').innerText(), /revised your original model/i);
  await page.locator('[data-phen-action="feedback-next"]').click();
  assert.match(await page.locator('.summary-card h1').innerText(), /Where did the sugar go/i);

  const phenomenonEvidence = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SCIENCE_LAB_CONFIG.storageKey);
  const sugarAttempts = phenomenonEvidence.learners.Samantha.attempts.filter(attempt => attempt.phenomenonId === 'sugar-disappears');
  assert.equal(sugarAttempts.length, 2, 'prediction/revision must not inflate mastery evidence');
  assert.ok(sugarAttempts.every(attempt => attempt.provenance === 'independent'));
  assert.ok(phenomenonEvidence.learners.Samantha.sessions.some(session => session.kind === 'phenomenon' && session.phenomenonId === 'sugar-disappears'));
  assert.ok(Number(phenomenonEvidence.learners.Samantha.skills['particle-models'].dueAt) > 0);
  assert.ok(Number(phenomenonEvidence.learners.Samantha.skills['matter-conservation'].dueAt) > 0);
  const completedActivity = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), activityKey);
  assert.equal(completedActivity.active.Samantha, undefined);

  const openSystem = SCIENCE_LAB_CONFIG.phenomena.find(phenomenon => phenomenon.id === 'open-system-mass');
  const cerIndex = openSystem.steps.findIndex(step => step.type === 'cer');
  assert.ok(cerIndex > 0);
  const beforeCerRoot = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SCIENCE_LAB_CONFIG.storageKey);
  const openAttemptsBefore = beforeCerRoot.learners.Samantha.attempts.filter(attempt => attempt.phenomenonId === 'open-system-mass').length;

  await page.evaluate(({ activityKey, cerIndex }) => {
    const activity = JSON.parse(localStorage.getItem(activityKey) || '{"version":1,"active":{}}');
    activity.active.Samantha = {
      version: 1,
      id: 'm5-cer-smoke',
      phenomenonId: 'open-system-mass',
      stepIndex: cerIndex,
      stepResponse: null,
      cerResponse: {},
      cerRetry: false,
      responses: {
        predict: { selected: 0, role: 'prediction', at: new Date().toISOString() },
        revise: { selected: 1, correct: true, role: 'revision', at: new Date().toISOString() }
      },
      feedback: null,
      startedAt: new Date().toISOString()
    };
    localStorage.setItem(activityKey, JSON.stringify(activity));
  }, { activityKey, cerIndex });

  await page.goto(phenomenonUrl);
  assert.equal(await page.locator('.cer-builder').isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'CER must not overflow 390px');
  await page.locator('[data-cer-claim="0"]').click();
  await page.locator('[data-cer-evidence="0"]').click();

  await page.reload();
  assert.equal(await page.locator('[data-cer-claim="0"]').getAttribute('aria-pressed'), 'true', 'partial claim should survive reload');
  assert.equal(await page.locator('[data-cer-evidence="0"]').getAttribute('aria-pressed'), 'true', 'partial evidence should survive reload');
  await page.locator('[data-cer-evidence="1"]').click();
  await page.locator('[data-cer-reasoning="0"]').click();
  await page.locator('[data-phen-action="cer-check"]').click();
  assert.equal(await page.locator('.feedback-card.repair').isVisible(), true);
  assert.match(await page.locator('.cer-rubric-summary').innerText(), /Claim needs repair/i);
  assert.match(await page.locator('.cer-rubric-summary').innerText(), /Evidence ✓/i);
  assert.match(await page.locator('.cer-rubric-summary').innerText(), /Reasoning ✓/i);

  const firstCer = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), activityKey);
  assert.equal(firstCer.active.Samantha.responses.cer.first.provenance, 'independent');
  assert.equal(firstCer.active.Samantha.responses.cer.first.rubric.score, 2);
  assert.equal(firstCer.active.Samantha.responses.cer.first.rubric.correct, false);

  await page.locator('[data-phen-action="cer-retry"]').click();
  assert.equal(await page.locator('.cer-component-feedback.repair').count(), 1, 'only the weak CER component should be marked for repair');
  await page.locator('[data-cer-claim="1"]').click();
  await page.locator('[data-cer-evidence="0"]').click();
  await page.locator('[data-cer-evidence="1"]').click();
  await page.locator('[data-cer-reasoning="0"]').click();
  await page.locator('[data-phen-action="cer-check"]').click();
  assert.equal(await page.locator('.feedback-card.correct').isVisible(), true);
  assert.match(await page.locator('.feedback-card .repair-note').innerText(), /Guided revision/i);

  const revisedCer = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), activityKey);
  assert.equal(revisedCer.active.Samantha.responses.cer.revised.provenance, 'guided');
  assert.equal(revisedCer.active.Samantha.responses.cer.revised.rubric.score, 3);
  assert.equal(revisedCer.active.Samantha.responses.cer.revised.rubric.correct, true);

  await page.locator('[data-phen-action="feedback-next"]').click();
  assert.match(await page.locator('.summary-card h1').innerText(), /Why did the measured mass drop/i);
  const afterCerRoot = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SCIENCE_LAB_CONFIG.storageKey);
  const openAttemptsAfter = afterCerRoot.learners.Samantha.attempts.filter(attempt => attempt.phenomenonId === 'open-system-mass').length;
  assert.equal(openAttemptsAfter, openAttemptsBefore, 'CER must not add content-mastery attempts');
  const openSession = afterCerRoot.learners.Samantha.sessions.find(session => session.kind === 'phenomenon' && session.phenomenonId === 'open-system-mass');
  assert.equal(openSession.cer.first.provenance, 'independent');
  assert.equal(openSession.cer.first.rubric.score, 2);
  assert.equal(openSession.cer.revised.provenance, 'guided');
  assert.equal(openSession.cer.revised.rubric.score, 3);

  await context.close();
});
