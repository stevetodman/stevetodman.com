// Behavioural tests for the Pediatric Hospital Simulator.
//
// Each assertion is anchored to a defect that shipped and was fixed in the
// August 2026 review (see REVIEW-2026-08.md). The integrity audit passed clean
// through all of them, which is why this suite exists.

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium, watchForErrors } from './helpers/harness.mjs';
import {
  runScenario, readVitalTiles, CORRECT_RANKING,
  PLAN_DO_NOTHING, PLAN_NOVICE_BOLUS, PLAN_PGE_NO_AIRWAY, PLAN_PGE_RESCUED, PLAN_EXPERT,
  PLAN_STABILISE_MAYA,
} from './helpers/phs.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

describe('vital-sign rendering', () => {
  test('observed blood pressure renders as a fraction or sentinel, never NaN', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${server.origin}/phs/`);
    await page.waitForFunction(() => typeof state !== 'undefined' && state !== null && !!state.caseData);
    await page.evaluate(ranking => {
      for (const [pid, rank] of Object.entries(ranking)) document.getElementById(`initial-rank-${pid}`).value = rank;
      document.getElementById('startBtn').click();
      state.running = false;
      selectPatient('maya');
    }, CORRECT_RANKING);

    const initial = await readVitalTiles(page);
    assert.equal(initial.BP, '62/38', 'Maya opens at 62/38');
    assert.ok(!Object.values(initial).includes('NaN'), `no NaN tiles: ${JSON.stringify(initial)}`);

    // v1.8 intentionally renders the last learner-observed measurement rather
    // than hidden physiology. Mutate that observed record to test formatting.
    await page.evaluate(() => {
      state.patients.maya.observedVitals.at(-1).BP = 'unobtainable';
      renderVitals();
    });
    assert.equal((await readVitalTiles(page)).BP, 'unobtainable');

    await page.evaluate(() => {
      state.patients.maya.observedVitals.at(-1).HR = 168.44;
      renderVitals();
    });
    assert.equal((await readVitalTiles(page)).HR, '168.4');

    await context.close();
  });
});

describe('deterioration and safety consequences', () => {
  test('doing nothing lets Maya arrest and fails the critical item', async () => {
    const r = await runScenario(browser, server.origin, { plan: PLAN_DO_NOTHING, completeShift: false });
    assert.equal(r.ended, true);
    assert.match(r.endReason, /arrested/i);
    assert.equal(r.maya.flags.arrest, true);
    assert.equal(r.criticalFailure, true, 'R10 (prostaglandin before severe deterioration) must fail');
    assert.ok(r.overall <= 15, `expected a floor score, got ${r.overall}%`);
    assert.equal(r.mastery, false);
  });

  test('fluid-loading an obstructed left heart worsens perfusion and ends in arrest', async () => {
    const r = await runScenario(browser, server.origin, { plan: PLAN_NOVICE_BOLUS, completeShift: false });
    assert.equal(r.maya.flags.bigBolus, true);
    assert.equal(r.ended, true);
    assert.match(r.endReason, /arrested/i);
    assert.equal(r.mastery, false);
  });

  test('unsupported prostaglandin apnea deteriorates to arrest', async () => {
    const r = await runScenario(browser, server.origin, { plan: PLAN_PGE_NO_AIRWAY, completeShift: false });
    assert.equal(r.maya.flags.pgeApnea, true, 'apnea should fire without airway support');
    assert.equal(r.maya.flags.arrest, true, 'untreated apnea must have a lethal consequence');
    assert.match(r.endReason, /apnea/i);
    assert.notEqual(r.maya.flags.stabilized, true, 'an apneic patient must never be flagged stabilized');
    assert.ok(r.time < 600, `should arrest well before the shift ends, got ${r.time}s`);
  });

  test('providing airway support rescues the apnea', async () => {
    const r = await runScenario(browser, server.origin, { plan: PLAN_PGE_RESCUED });
    assert.equal(r.maya.flags.airwayReady, true);
    assert.notEqual(r.maya.flags.arrest, true, 'rescued patient must survive');
    assert.equal(r.maya.flags.stabilized, true);
    assert.ok(!/apnea/i.test(r.endReason), `unexpected apnea death: ${r.endReason}`);
  });

  test('earlier prostaglandin yields a better recovery than later', async () => {
    const early = await runScenario(browser, server.origin, {
      completeShift: false,
      plan: `
        selectPatient('maya'); performExam('fourbp');
        commitReasoning({problem:'shock',diagnosis:'Ductal-dependent systemic circulation / critical coarctation',alternatives:'sepsis',plan:'PGE',confidence:80});
        placeOrder('airway'); placeOrder('pge');
        for (let i = 0; i < 10 && !state.ended; i++) advanceScenario(30, true);
      `,
    });
    const late = await runScenario(browser, server.origin, {
      completeShift: false,
      plan: `
        selectPatient('maya');
        for (let i = 0; i < 6; i++) advanceScenario(30, true);
        performExam('fourbp');
        commitReasoning({problem:'shock',diagnosis:'Ductal-dependent systemic circulation / critical coarctation',alternatives:'sepsis',plan:'PGE',confidence:80});
        placeOrder('airway'); placeOrder('pge');
        for (let i = 0; i < 10 && !state.ended; i++) advanceScenario(30, true);
      `,
    });
    const lactate = r => Number(r.maya.vitals.Lactate);
    assert.ok(lactate(early) < lactate(late),
      `time-to-treatment must matter: early lactate ${lactate(early)} should be below late ${lactate(late)}`);
  });
});

describe('shift window and handoff', () => {
  test('clinical time ends with a warning and the handoff runs on a stopped clock', async () => {
    const r = await runScenario(browser, server.origin, {
      completeShift: false,
      plan: PLAN_STABILISE_MAYA
        + `while (state.time < 900 && !state.ended && !state.flags.handoffForced) { advanceScenario(20, true); }`,
    });
    assert.equal(r.beforeHandoff.handoffWarned, true, 'learner must be warned before clinical time ends');
    assert.equal(r.beforeHandoff.handoffForced, true, 'clinical time must hand off rather than end the attempt');
    assert.equal(r.beforeHandoff.ended, false, 'the attempt must stay open so I-PASS can be completed');
    assert.equal(r.beforeHandoff.time, 840, `handoff must open exactly at 840s, got ${r.beforeHandoff.time}s`);
  });

  test('clinical actions are blocked once the handoff window opens', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${server.origin}/phs/`);
    await page.waitForFunction(() => typeof state !== 'undefined' && state !== null && !!state.caseData);
    const blocked = await page.evaluate(ranking => {
      for (const [pid, rank] of Object.entries(ranking)) document.getElementById(`initial-rank-${pid}`).value = rank;
      document.getElementById('startBtn').click();
      state.running = true;
      selectPatient('maya'); performExam('fourbp');
      commitReasoning({problem:'Neonatal shock',diagnosis:'Ductal-dependent systemic circulation / critical coarctation',alternatives:'Sepsis',plan:'PGE1 with airway ready',confidence:80});
      placeOrder('airway'); placeOrder('pge');
      while (state.time < 900 && !state.ended && !state.flags.handoffForced) advanceScenario(20, true);
      const before = state.patients.maya.ordersPlaced.length;
      placeOrder('glucose');
      return { forced: !!state.flags.handoffForced, ordersAdded: state.patients.maya.ordersPlaced.length - before };
    }, CORRECT_RANKING);
    assert.equal(blocked.forced, true);
    assert.equal(blocked.ordersAdded, 0, 'orders must not be accepted after clinical time ends');
    await context.close();
  });

  test('a completed I-PASS earns the handoff objective', async () => {
    const r = await runScenario(browser, server.origin, { plan: PLAN_EXPERT });
    assert.ok(r.metItems.includes('R17'), 'R17 (I-PASS completeness) must be attainable');
    assert.ok(r.objectives.O6 >= 70, `O6 should clear its minimum, got ${r.objectives.O6}`);
  });
});

describe('assessment calibration', () => {
  test('a well-sequenced expert run meets the mastery standard', async () => {
    const r = await runScenario(browser, server.origin, { plan: PLAN_EXPERT });
    assert.equal(r.criticalFailure, false, `unexpected critical failure; missed ${r.missedItems.join(', ')}`);
    assert.ok(r.overall >= 80, `expert run must clear the 80% bar, got ${r.overall}% (missed ${r.missedItems.join(', ')})`);
    assert.equal(r.mastery, true, `mastery not met: objectives ${JSON.stringify(r.objectives)}`);
    assert.match(r.masteryBadge, /met/i);
  });

  test('every objective minimum is attainable in a single attempt', async () => {
    const r = await runScenario(browser, server.origin, { plan: PLAN_EXPERT });
    const minimums = await (async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(`${server.origin}/phs/v17/cases/manifest.json`);
      const manifest = JSON.parse(await page.evaluate(() => document.body.textContent));
      await context.close();
      return manifest.mastery.objectiveMinimums;
    })();
    for (const [objective, minimum] of Object.entries(minimums)) {
      assert.ok(r.objectives[objective] >= minimum,
        `${objective} scored ${r.objectives[objective]} against a ${minimum} minimum`);
    }
  });

  test('scores separate the failure modes from the expert run', async () => {
    const [nothing, apnea, expert] = await Promise.all([
      runScenario(browser, server.origin, { plan: PLAN_DO_NOTHING, completeShift: false }),
      runScenario(browser, server.origin, { plan: PLAN_PGE_NO_AIRWAY, completeShift: false }),
      runScenario(browser, server.origin, { plan: PLAN_EXPERT }),
    ]);
    assert.ok(nothing.overall < apnea.overall,
      `partial care should outscore inaction (${nothing.overall} vs ${apnea.overall})`);
    assert.ok(apnea.overall < expert.overall,
      `expert care should outscore a fatal misstep (${apnea.overall} vs ${expert.overall})`);
  });
});

describe('history taking', () => {
  async function openMaya() {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${server.origin}/phs/`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => typeof state !== 'undefined' && state !== null && !!state.caseData);
    await page.evaluate(ranking => {
      for (const [pid, rank] of Object.entries(ranking)) document.getElementById(`initial-rank-${pid}`).value = rank;
      document.getElementById('startBtn').click();
    }, CORRECT_RANKING);
    return { context, page };
  }

  test('history controls are inert and clearly disabled until a patient is chosen', async () => {
    const { context, page } = await openMaya();
    const before = await page.evaluate(() => ({
      selected: state.selectedId,
      askDisabled: document.getElementById('askBtn').disabled,
      inputDisabled: document.getElementById('historyInput').disabled,
      hint: document.getElementById('historyLog').innerText.trim(),
    }));
    assert.equal(before.selected, null);
    assert.equal(before.askDisabled, true, 'Ask must be disabled with no patient selected');
    assert.equal(before.inputDisabled, true, 'the question field must be disabled with no patient selected');
    assert.match(before.hint, /choose a patient/i, 'the panel must say what to do');

    const outcome = await page.evaluate(() => {
      const t = state.time;
      askHistory('How has she been feeding?', 'parent');
      return { cost: state.time - t, banner: document.getElementById('urgentBanner').textContent };
    });
    assert.equal(outcome.cost, 0, 'a rejected question must not cost clinical time');
    assert.match(outcome.banner, /select a patient/i);
    await context.close();
  });

  test('questions match the topic they are actually about', async () => {
    const { context, page } = await openMaya();
    await page.click('[data-patient="maya"]');
    const expectations = [
      ['Is she working hard to breathe?', 'breathing'],
      ['Is she breathing fast?', 'breathing'],
      ['Any trouble breathing?', 'breathing'],
      ['How has she been feeding?', 'feeding'],
      ['Is she urinating less than before?', 'urine'],
      ['How many wet diapers?', 'urine'],
      ['Has she looked blue or mottled?', 'color'],
      ['When did this start?', 'onset'],
      ['Any fever?', 'fever'],
      ['How was the delivery?', 'birth'],
    ];
    const matched = await page.evaluate(qs =>
      qs.map(([q]) => matchHistoryTopic(q, state.patients.maya.history)), expectations);
    for (const [i, [question, expected]] of expectations.entries()) {
      assert.equal(matched[i], expected, `"${question}" should reach the ${expected} topic, got ${matched[i]}`);
    }
    await context.close();
  });

  test('an uninterpretable question costs less and says what can be asked', async () => {
    const { context, page } = await openMaya();
    await page.click('[data-patient="maya"]');
    const result = await page.evaluate(() => {
      const before = state.time;
      askHistory('Has she had any rash or vomiting?', 'parent');
      const entry = state.patients.maya.historyLog.at(-1);
      return { cost: state.time - before, entry, banner: document.getElementById('urgentBanner').textContent };
    });
    assert.equal(result.entry.category, 'unrecognised');
    assert.ok(result.cost < 20, `a parser miss must cost less than a real question, cost ${result.cost}s`);
    assert.match(result.entry.answer, /Feeding/, 'the answer must list the available topics');
    assert.match(result.banner, /not understood/i);
    await context.close();
  });

  test('suggestion chips are offered and fill a question that matches', async () => {
    const { context, page } = await openMaya();
    await page.click('[data-patient="maya"]');
    const chips = await page.$$eval('.topic-chip', els => els.map(e => e.textContent.trim()));
    assert.ok(chips.length >= 5, `expected topic chips, got ${chips.length}`);

    const unmatched = await page.evaluate(() => {
      const bad = [];
      for (const [key, item] of Object.entries(state.patients.maya.history)) {
        const prompt = item.prompt || `Tell me about ${(item.label || key).toLowerCase()}.`;
        if (matchHistoryTopic(prompt, state.patients.maya.history) !== key) bad.push(`${key}: "${prompt}"`);
      }
      return bad;
    });
    assert.deepEqual(unmatched, [], `chip prompts must match their own topic:\n${unmatched.join('\n')}`);
    await context.close();
  });

  test('every patient exposes labelled history topics', async () => {
    const { context, page } = await openMaya();
    const missing = await page.evaluate(() => {
      const bad = [];
      for (const [pid, patient] of Object.entries(state.patients)) {
        for (const [key, item] of Object.entries(patient.history)) {
          if (!item.label) bad.push(`${pid}.${key} has no label`);
          if (!item.prompt) bad.push(`${pid}.${key} has no prompt`);
        }
      }
      return bad;
    });
    assert.deepEqual(missing, []);
    await context.close();
  });
});

describe('scheduled page timing', () => {
  test('page times hold the same offsets from Maya\'s decline in every variant', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${server.origin}/phs/`);
    await page.waitForFunction(() => typeof state !== 'undefined' && state !== null && !!state.caseData);

    const offsets = [];
    for (const variant of ['A', 'B', 'C']) {
      const r = await page.evaluate(v => {
        localStorage.clear();
        resetSimulation(state.caseData, v, 'assessment');
        for (const [pid, rank] of Object.entries({ maya: 1, eli: 2, nora: 3, jamal: 4 })) {
          document.getElementById(`initial-rank-${pid}`).value = String(rank);
        }
        document.getElementById('startBtn').click();
        state.running = false;
        while (state.time < 700 && !state.ended) advanceScenario(10, true);
        const at = key => state.pages.find(p => p.key === key)?.createdAt;
        return {
          id: state.variant.id,
          worsening: threshold('mayaWorsening'),
          severe: threshold('mayaSevere'),
          eli: at('eli-desat'), nora: at('nora-prelim'), jamal: at('jamal-family'),
        };
      }, variant);

      assert.ok(r.eli != null && r.nora != null && r.jamal != null,
        `variant ${r.id} did not fire all scheduled pages`);
      offsets.push({
        id: r.id,
        eli: r.eli - r.worsening,
        nora: r.nora - r.severe,
        jamal: r.jamal - r.severe,
      });
    }

    const [a, ...rest] = offsets;
    for (const o of rest) {
      assert.equal(o.eli, a.eli, `variant ${o.id}: Eli's page drifted relative to Maya's decline`);
      assert.equal(o.nora, a.nora, `variant ${o.id}: Nora's page drifted relative to Maya's decline`);
      assert.equal(o.jamal, a.jamal, `variant ${o.id}: Jamal's page drifted relative to Maya's decline`);
    }
    await context.close();
  });
});

describe('runtime health', () => {
  test('a full attempt raises no page errors', async () => {
    const r = await runScenario(browser, server.origin, { plan: PLAN_EXPERT });
    assert.deepEqual(r.errors, [], `page errors during a full attempt:\n${r.errors.join('\n')}`);
  });

  test('the prebrief rejects a ranking that reuses a rank', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await page.goto(`${server.origin}/phs/`);
    await page.waitForFunction(() => typeof state !== 'undefined' && state !== null && !!state.caseData);
    const outcome = await page.evaluate(() => {
      document.querySelectorAll('#initialRanking select').forEach(s => { s.value = '1'; });
      document.getElementById('startBtn').click();
      return { started: state.started, error: document.getElementById('prebriefError').textContent };
    });
    assert.equal(outcome.started, false);
    assert.match(outcome.error, /each rank/i);
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
  });
});
