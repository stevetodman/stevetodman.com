// Drives the Pediatric Hospital Simulator through its own engine functions.
//
// The engine is a set of globals loaded by phs/index.html, so a "plan" is a
// string of engine calls evaluated in page context. This is deliberately the
// real engine and the real DOM — the bugs these tests guard against were all
// invisible to static analysis.

import { watchForErrors } from './harness.mjs';

export const CORRECT_RANKING = { maya: '1', eli: '2', nora: '3', jamal: '4' };

/** A complete I-PASS handoff. Field keys must match readHandoffs()/handoffCompleteness(). */
export function fullHandoffs() {
  const handoffs = {};
  for (const pid of ['maya', 'eli', 'nora', 'jamal']) {
    handoffs[pid] = {
      illness: 'Watcher — unstable overnight',
      summary: 'Full patient summary with mechanism and current trajectory documented.',
      actions: 'Actions taken during this shift are documented in full detail.',
      pending: 'Pending work is owned by the night attending and bedside nurse.',
      contingency: 'If deterioration occurs then escalate to the attending immediately.',
    };
  }
  return handoffs;
}

/**
 * Boot the simulator, commit the given ranking, run `plan`, then optionally
 * complete the shift with a full handoff.
 *
 * @returns {object} score, objectives, mastery, end state, Maya's vitals/flags,
 *                   urgent-page latencies, and any page errors.
 */
export async function runScenario(browser, origin, {
  plan = '',
  ranking = CORRECT_RANKING,
  completeShift: doComplete = true,
  mode = 'assessment',
} = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = watchForErrors(page);

  await page.goto(`${origin}/phs/`);
  // A fresh learner record each run: attempt number and assigned variant are persisted.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined' && state !== null && !!state.caseData, { timeout: 15000 });

  await page.evaluate(({ ranking, mode }) => {
    for (const [pid, rank] of Object.entries(ranking)) {
      const el = document.getElementById(`initial-rank-${pid}`);
      if (el) el.value = rank;
    }
    document.querySelector(`input[name=mode][value=${mode}]`).checked = true;
    document.getElementById('startBtn').click();
    // Freeze wall-clock ticking; scenarios advance time deterministically.
    state.running = false;
  }, { ranking, mode });

  const result = await page.evaluate(({ planSrc, doComplete, handoffs }) => {
    state.running = true;
    // eslint-disable-next-line no-eval
    eval(planSrc);

    const beforeHandoff = {
      time: state.time,
      ended: state.ended,
      endReason: state.endReason,
      handoffForced: !!state.flags.handoffForced,
      handoffWarned: !!state.flags.handoffWarned,
    };

    if (doComplete && !state.ended) {
      completeShift({ maya: 1, eli: 2, nora: 3, jamal: 4 }, handoffs);
    }

    const maya = state.patients.maya;
    const score = state.score;
    return {
      beforeHandoff,
      ended: state.ended,
      endReason: state.endReason,
      time: state.time,
      maya: {
        vitals: JSON.parse(JSON.stringify(maya.vitals)),
        flags: JSON.parse(JSON.stringify(maya.flags)),
      },
      overall: score ? score.overall : null,
      objectives: score ? score.objectiveScores : null,
      mastery: score ? score.mastery : null,
      criticalFailure: score ? score.criticalFailure : null,
      metItems: score ? score.results.filter(r => r.met).map(r => r.id) : [],
      missedItems: score ? score.results.filter(r => !r.met).map(r => r.id) : [],
      masteryBadge: document.getElementById('masteryBadge').innerText,
      urgentPages: state.pages.filter(p => p.urgent).map(p => ({
        title: p.title, createdAt: p.createdAt, responseAt: p.responseAt,
      })),
    };
  }, { planSrc: plan, doComplete, handoffs: fullHandoffs() });

  result.errors = [...new Set(errors)];
  await context.close();
  return result;
}

/** Reads the rendered vital-sign tiles as the learner sees them. */
export async function readVitalTiles(page) {
  return page.evaluate(() => {
    const out = {};
    for (const tile of document.querySelectorAll('#vitals .vital')) {
      out[tile.querySelector('small').textContent.trim()] = tile.querySelector('strong').textContent.trim();
    }
    return out;
  });
}

// ---------------------------------------------------------------------------
// Scenario plans. Each is a documented clinical pathway, not an arbitrary
// sequence, so a failure says something about the simulation rather than the test.
// ---------------------------------------------------------------------------

/** Learner never engages. Maya's duct closes. */
export const PLAN_DO_NOTHING = `
  while (state.time < 950 && !state.ended) { advanceScenario(30, true); }
`;

/** Accepts the inherited sepsis frame and fluid-loads an obstructed left heart. */
export const PLAN_NOVICE_BOLUS = `
  selectPatient('maya');
  commitReasoning({problem:'Neonatal sepsis',diagnosis:'Neonatal sepsis',alternatives:'none',plan:'fluids and antibiotics',confidence:85});
  placeOrder('bigbolus'); placeOrder('antibiotics');
  while (state.time < 950 && !state.ended) { advanceScenario(30, true); }
`;

/** Correct diagnosis and treatment, but prostaglandin started with no airway support. */
export const PLAN_PGE_NO_AIRWAY = `
  selectPatient('maya'); performExam('fourbp');
  commitReasoning({problem:'Neonatal shock',diagnosis:'Ductal-dependent systemic circulation / critical coarctation',alternatives:'Sepsis',plan:'PGE1',confidence:80});
  placeOrder('pge');
  while (state.time < 950 && !state.ended) { advanceScenario(30, true); }
`;

/** Same misstep, but the learner recognises the apnea and provides airway support. */
export const PLAN_PGE_RESCUED = `
  selectPatient('maya'); performExam('fourbp');
  commitReasoning({problem:'Neonatal shock',diagnosis:'Ductal-dependent systemic circulation / critical coarctation',alternatives:'Sepsis',plan:'PGE1',confidence:80});
  placeOrder('pge');
  for (let i = 0; i < 8 && !state.ended; i++) advanceScenario(20, true);
  placeOrder('airway');
  for (let i = 0; i < 8 && !state.ended; i++) advanceScenario(30, true);
`;

/**
 * A well-sequenced senior resident: stabilise Maya, then work the competing
 * patients, then close every loop. This is the run the mastery standard is
 * calibrated against — if it stops meeting the standard, either the engine
 * regressed or the standard drifted.
 */
export const PLAN_EXPERT = `
  selectPatient('maya');
  askHistory('feeding and urine output','parent');
  performExam('pulses'); performExam('fourbp');
  placeOrder('monitoriv'); placeOrder('glucose');
  commitReasoning({problem:'Neonatal shock with differential perfusion from ductal closure',diagnosis:'Ductal-dependent systemic circulation / critical coarctation',alternatives:'Sepsis, IEM; four-limb BP and pre/post-ductal sats sought',plan:'PGE1 with airway ready, urgent cardiology, parallel sepsis coverage',confidence:80});
  placeOrder('airway'); placeOrder('pge');
  placeOrder('culture'); placeOrder('antibiotics');
  sendTeamMessage('cardiology','Critical coarctation physiology, PGE running, airway ready, need urgent echo and CICU'); confirmReadback();
  placeOrder('echo');
  selectPatient('eli'); performExam('respiratory'); placeOrder('hfnc');
  selectPatient('nora'); performExam('appearance');
  for (const r of state.patients.nora.results) { reviewResult('nora', r.id); interpretResult('nora', r.id); }
  submitNoraJudgment('likely pathogen', 70);
  placeOrder('antibiotics'); placeOrder('lp'); placeOrder('admit');
  selectPatient('jamal'); placeOrder('family');
  selectPatient('maya'); repeatVitals(); performExam('pulses');
  sendTeamMessage('parent','Explaining the duct-dependent heart problem and the medication started'); confirmReadback();
  for (const r of state.patients.maya.results) { reviewResult('maya', r.id); interpretResult('maya', r.id); }
  for (let i = 0; i < 12 && !state.flags.handoffForced && !state.ended; i++) {
    advanceScenario(30, true);
    for (const pid of ['maya','nora','eli','jamal']) {
      const prev = state.selectedId; selectPatient(pid);
      for (const r of state.patients[pid].results) {
        if (r.reviewedAt == null) reviewResult(pid, r.id);
        if (r.reviewedAt != null && r.requiresInterpretation && r.interpretedAt == null) interpretResult(pid, r.id);
      }
      selectPatient(prev);
    }
  }
`;

/**
 * Stabilise Maya quickly, so a scenario can run to the end of the shift without
 * the attempt terminating in an arrest. Used by the shift-window tests, which
 * need the clock to actually reach the handoff deadline.
 */
export const PLAN_STABILISE_MAYA = `
  selectPatient('maya'); performExam('fourbp');
  commitReasoning({problem:'Neonatal shock',diagnosis:'Ductal-dependent systemic circulation / critical coarctation',alternatives:'Sepsis',plan:'PGE1 with airway ready',confidence:80});
  placeOrder('airway'); placeOrder('pge');
`;
