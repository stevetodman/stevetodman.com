// Drives the Pediatric Hospital Simulator through its own engine functions.
//
// The engine is a set of globals loaded by phs/index.html, so a "plan" is a
// string of engine calls evaluated in page context. This is deliberately the
// real engine and the real DOM — the bugs these tests guard against were all
// invisible to static analysis.

import { watchForErrors } from './harness.mjs';

export const CORRECT_RANKING = { maya: '1', eli: '2', nora: '3', jamal: '4' };

/** A clinically meaningful I-PASS handoff that satisfies the content checks. */
export function fullHandoffs() {
  return {
    maya: {
      illness: 'Critical watcher after neonatal shock stabilization.',
      summary: 'Neonate with shock, weak femoral pulses, and ductal-dependent systemic perfusion.',
      actions: 'Prostaglandin, monitoring, cultures, antibiotics, cardiology escalation, ventilation rescue, and reassessment completed.',
      pending: 'Incoming resident owns pending echo results and repeat perfusion reassessment.',
      contingency: 'If perfusion worsens, apnea recurs, or lactate rises, provide ventilatory support and call cardiology and the attending immediately.',
    },
    eli: {
      illness: 'Watcher for hypoxemic respiratory deterioration.',
      summary: 'Infant with bronchiolitis, increased work of breathing, and oxygen requirement.',
      actions: 'Respiratory exam, suction, low-flow oxygen, hydration assessment, and respiratory reassessment completed.',
      pending: 'Incoming resident and nurse own repeat oxygen saturation and feeding assessment.',
      contingency: 'If breathing worsens or desaturation recurs despite supportive care, reassess and escalate respiratory support.',
    },
    nora: {
      illness: 'Watcher with invasive bacterial infection risk.',
      summary: 'Young infant with fever, abnormal inflammatory markers, and positive culture requiring bacteremia and meningitis evaluation.',
      actions: 'Culture review, inflammatory markers, antibiotics, CSF evaluation, and admission planning completed.',
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
}

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
    state.running = false;
  }, { ranking, mode });

  const result = await page.evaluate(({ planSrc, doComplete, handoffs }) => {
    state.running = true;
    eval(planSrc);

    const beforeHandoff = {
      time: state.time,
      ended: state.ended,
      endReason: state.endReason,
      handoffForced: !!state.flags.handoffForced,
      handoffWarned: !!state.flags.handoffWarned,
    };

    if (doComplete && !state.ended) completeShift({ maya: 1, eli: 2, nora: 3, jamal: 4 }, handoffs);

    const maya = state.patients.maya;
    const score = state.score;
    return {
      beforeHandoff,
      ended: state.ended,
      endReason: state.endReason,
      time: state.time,
      maya: { vitals: JSON.parse(JSON.stringify(maya.vitals)), flags: JSON.parse(JSON.stringify(maya.flags)) },
      overall: score ? score.overall : null,
      objectives: score ? score.objectiveScores : null,
      mastery: score ? score.mastery : null,
      criticalFailure: score ? score.criticalFailure : null,
      metItems: score ? score.results.filter(r => r.met).map(r => r.id) : [],
      missedItems: score ? score.results.filter(r => !r.met).map(r => r.id) : [],
      masteryBadge: document.getElementById('masteryBadge').innerText,
      urgentPages: state.pages.filter(p => p.urgent).map(p => ({ title: p.title, createdAt: p.createdAt, responseAt: p.responseAt })),
    };
  }, { planSrc: plan, doComplete, handoffs: fullHandoffs() });

  result.errors = [...new Set(errors)];
  await context.close();
  return result;
}

export async function readVitalTiles(page) {
  return page.evaluate(() => {
    const out = {};
    for (const tile of document.querySelectorAll('#vitals .vital')) {
      out[tile.querySelector('small').textContent.trim()] = tile.querySelector('strong').textContent.trim();
    }
    return out;
  });
}

export const PLAN_DO_NOTHING = `while (state.time < 950 && !state.ended) advanceScenario(30, true);`;

export const PLAN_NOVICE_BOLUS = `
  selectPatient('maya');
  commitReasoning({problem:'Neonatal sepsis',diagnosis:'Neonatal sepsis',alternatives:'none',plan:'fluids and antibiotics',confidence:85});
  placeOrder('bigbolus'); placeOrder('antibiotics');
  while (state.time < 950 && !state.ended) advanceScenario(30, true);
`;

export const PLAN_PGE_NO_AIRWAY = `
  selectPatient('maya'); performExam('fourbp'); placeOrder('monitoriv'); advanceScenario(60, true);
  commitReasoning({problem:'Neonatal shock',diagnosis:'Ductal-dependent systemic circulation / critical coarctation',alternatives:'Sepsis',plan:'PGE1',confidence:80});
  placeOrder('pge');
  while (state.time < 950 && !state.ended) advanceScenario(30, true);
`;

export const PLAN_PGE_RESCUED = `
  selectPatient('maya'); performExam('fourbp'); placeOrder('monitoriv'); advanceScenario(60, true);
  commitReasoning({problem:'Neonatal shock',diagnosis:'Ductal-dependent systemic circulation / critical coarctation',alternatives:'Sepsis',plan:'PGE1 with airway ready and PPV if apnea',confidence:80});
  placeOrder('airway'); advanceScenario(30, true); placeOrder('pge');
  while (!state.patients.maya.flags.pgeApnea && !state.ended) advanceScenario(5, true);
  placeOrder('ventilation'); advanceScenario(10, true);
  for (let i = 0; i < 8 && !state.ended; i++) advanceScenario(30, true);
`;

export const PLAN_EXPERT = `
  selectPatient('maya'); askHistory('feeding and urine output','parent'); performExam('pulses'); performExam('fourbp');
  placeOrder('monitoriv'); placeOrder('glucose'); advanceScenario(60, true);
  commitReasoning({problem:'Neonatal shock with differential perfusion from ductal closure',diagnosis:'Ductal-dependent systemic circulation / critical coarctation',alternatives:'Sepsis and metabolic disease; four-limb BP and pre/post-ductal sats sought',plan:'PGE1 with airway ready, PPV for apnea, urgent cardiology, parallel sepsis coverage',confidence:80});
  placeOrder('airway'); advanceScenario(30, true); placeOrder('pge'); placeOrder('culture'); placeOrder('antibiotics');
  sendTeamMessage('cardiology','Urgent unstable neonate with shock and ductal-dependent coarctation physiology. PGE is running with airway equipment ready. Please evaluate now for echo and CICU transfer; call me with deterioration.'); confirmReadback();
  placeOrder('echo');
  while (!state.patients.maya.flags.pgeApnea && !state.ended) advanceScenario(5, true);
  if (state.patients.maya.flags.pgeApnea) { placeOrder('ventilation'); advanceScenario(10, true); }
  selectPatient('eli'); performExam('respiratory'); placeOrder('suction'); placeOrder('oxygen'); advanceScenario(20, true); performExam('respiratory');
  selectPatient('nora'); performExam('appearance'); placeOrder('reviewculture'); placeOrder('inflammatory'); advanceScenario(100, true);
  for (const r of state.patients.nora.results) { if (r.reviewedAt == null) reviewResult('nora', r.id); }
  if (state.flags.noraJudgmentPrompt) submitNoraJudgment('likely pathogen', 80);
  commitReasoning({problem:'Febrile young infant with likely invasive bacterial infection',diagnosis:'Febrile young infant with invasive bacterial infection',alternatives:'Contaminant less likely given time to positivity and organism',plan:'Parenteral antibiotics, CSF studies, admission, and culture ownership',confidence:85});
  placeOrder('antibiotics'); placeOrder('lp'); placeOrder('admit');
  selectPatient('jamal'); performExam('chestwall'); placeOrder('analgesia'); placeOrder('family');
  selectPatient('maya'); repeatVitals(); performExam('pulses');
  sendTeamMessage('parent','Your baby is critically ill from a heart circulation problem. We started medicine to keep blood flowing, are supporting breathing, and the cardiac team is coming now.');
  for (let i = 0; i < 16 && !state.flags.handoffForced && !state.ended; i++) {
    advanceScenario(30, true);
    for (const pid of ['maya','nora','eli','jamal']) {
      const prev = state.selectedId; selectPatient(pid);
      for (const r of state.patients[pid].results) {
        if (r.reviewedAt == null) reviewResult(pid, r.id);
        if (r.reviewedAt != null && r.requiresInterpretation && r.interpretedAt == null) interpretResult(pid, r.id, phsDefaultInterpretation(pid, r));
      }
      selectPatient(prev);
    }
  }
`;

export const PLAN_STABILISE_MAYA = `
  selectPatient('maya'); performExam('fourbp'); placeOrder('monitoriv'); advanceScenario(60, true);
  commitReasoning({problem:'Neonatal shock',diagnosis:'Ductal-dependent systemic circulation / critical coarctation',alternatives:'Sepsis',plan:'PGE1 with airway ready and PPV for apnea',confidence:80});
  placeOrder('airway'); advanceScenario(30, true); placeOrder('pge');
  while (!state.patients.maya.flags.pgeApnea && !state.ended) advanceScenario(5, true);
  if (state.patients.maya.flags.pgeApnea) { placeOrder('ventilation'); advanceScenario(10, true); }
`;
