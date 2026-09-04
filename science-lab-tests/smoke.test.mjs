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

test('Science Lab phone smoke: repair, graph resume, twin separation', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(server.origin + '/study/matter-lab.html');

  assert.equal(await page.locator('.learner-grid .menu-card').count(), 2);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);

  await page.locator('[data-learner="Luke"]').click();
  await page.locator('[data-action="start"]').click();
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
  assert.equal(await page.locator('[data-action="start"]').isVisible(), true);
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

  await context.close();
});
