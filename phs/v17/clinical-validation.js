'use strict';

const PHS_CLINICAL_VALIDATION_VERSION = '1.9.0-rc1';

function phsCompleted(patientId, orderId) {
  return orderCompleted(patientId, orderId);
}

function phsDangerousNegation(text, concepts) {
  const value = String(text || '').toLowerCase();
  return concepts.some(concept => {
    const escaped = concept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:no|not|never|exclude(?:d)?|rule(?:d)? out|stop|discontinue|withhold|cancel|avoid)\\s+(?:\\w+\\s+){0,3}${escaped}`, 'i').test(value) ||
      new RegExp(`${escaped}\\s+(?:is|was|are|were)?\\s*(?:not|excluded|ruled out|unnecessary|contraindicated)`, 'i').test(value);
  });
}

const phsClinicalOriginalLoadCase = loadCase;
loadCase = async function loadCaseClinicalValidation() {
  const caseData = await phsClinicalOriginalLoadCase();
  caseData.version = PHS_CLINICAL_VALIDATION_VERSION;

  const maya = caseData.patients.maya;
  if (!maya.orders.some(order => order.id === 'ventilation')) {
    maya.orders.push({
      id: 'ventilation',
      name: 'Provide positive-pressure ventilation for apnea',
      attention: 10,
      process: 10,
      type: 'Emergency treatment',
      result: 'Effective positive-pressure ventilation is being provided with cardiorespiratory reassessment.',
      tone: 'good',
      effects: [{ flag: 'ventilationSupport', value: true }],
    });
  }

  const nora = caseData.patients.nora;
  if (!nora.orders.some(order => order.id === 'inflammatory')) {
    nora.orders.splice(1, 0, {
      id: 'inflammatory',
      name: 'Inflammatory markers (procalcitonin, CRP, ANC)',
      attention: 25,
      process: 90,
      type: 'Laboratory',
      result: 'Inflammatory markers are abnormal: procalcitonin 1.2 ng/mL, CRP 32 mg/L, ANC 6,400/mm³.',
      tone: 'bad',
      requiresInterpretation: true,
      effects: [{ flag: 'inflammatoryMarkersObtained', value: true }],
    });
  }

  for (const order of caseData.patients.eli.orders) {
    if (['albuterol', 'steroids'].includes(order.id)) {
      order.tone = 'bad';
      order.result = order.id === 'albuterol'
        ? 'No sustained benefit is observed. Routine bronchodilator treatment is low-value in typical bronchiolitis without a documented alternative indication.'
        : 'No clinical benefit is observed. Systemic corticosteroids are not routine therapy for uncomplicated bronchiolitis.';
      order.effects = [...(order.effects || []), { flag: 'lowValueBronchiolitisTreatment', value: true }];
    }
  }
  return caseData;
};

const phsClinicalOriginalPlaceOrder = placeOrder;
placeOrder = function placeOrderClinicalValidation(orderId) {
  const patientId = state.selectedId;
  if (patientId === 'maya' && orderId === 'pge' && !phsCompleted('maya', 'monitoriv')) {
    showUrgent('Establish monitored vascular access before starting the continuous prostaglandin infusion. Do not delay emergency stabilization: complete the monitoring/access task now.');
    return false;
  }
  if (patientId === 'maya' && orderId === 'ventilation' && !state.patients.maya.flags.pgeApnea) {
    showUrgent('Positive-pressure ventilation is reserved for current apnea or respiratory failure. Keep equipment and personnel ready.');
    return false;
  }
  if (patientId === 'eli' && orderId === 'hfnc') {
    const oxygen = orderRecord('eli', 'oxygen');
    const reassessed = oxygen?.availableAt != null && (
      state.patients.eli.observedVitals.some(item => item.time > oxygen.availableAt) ||
      state.patients.eli.examLog.some(item => item.time > oxygen.availableAt)
    );
    if (!phsCompleted('eli', 'suction') || !phsCompleted('eli', 'oxygen') || !reassessed) {
      showUrgent('High-flow support should follow suction, indicated low-flow oxygen, and documented reassessment showing inadequate response or worsening respiratory distress.');
      return false;
    }
  }
  return phsClinicalOriginalPlaceOrder(orderId);
};

const phsClinicalOriginalApplyEffects = applyEffects;
applyEffects = function applyEffectsClinicalValidation(patientId, order) {
  phsClinicalOriginalApplyEffects(patientId, order);
  const patient = state.patients[patientId];

  if (patientId === 'maya' && order.id === 'pge') {
    state.processes = state.processes.filter(process => !(process.kind === 'special' && process.special === 'pge-apnea'));
    scheduleProcess({ kind: 'special', special: 'pge-apnea-clinical', due: state.time + 45 });
  }

  if (patientId === 'maya' && order.id === 'ventilation' && patient.flags.pgeApnea) {
    patient.flags.pgeApnea = false;
    patient.flags.pgeApneaAt = null;
    patient.flags.critical = false;
    patient.flags.responding = true;
    patient.vitals.SpO2 = 94;
    patient.vitals.HR = 150;
    state.flags.pgeApneaResolved = true;
    addTimeline('Positive-pressure ventilation resolves prostaglandin-associated apnea; close cardiorespiratory reassessment continues.', 'maya', 'rescue');
    resolvePages('maya');
  }
};

const phsClinicalOriginalCompleteSpecial = completeSpecial;
completeSpecial = function completeSpecialClinicalValidation(special) {
  if (special !== 'pge-apnea-clinical') return phsClinicalOriginalCompleteSpecial(special);
  if (state.flags.pgeApneaResolved) return;
  const patient = state.patients.maya;
  patient.flags.pgeApnea = true;
  patient.flags.pgeApneaAt = state.time;
  patient.flags.critical = true;
  patient.flags.airwayReadyAtApnea = !!patient.flags.airwayReady;
  patient.vitals.SpO2 = patient.flags.airwayReady ? 78 : 68;
  patient.vitals.HR = patient.flags.airwayReady ? 108 : 88;
  addTimeline(
    patient.flags.airwayReady
      ? 'Maya develops prostaglandin-associated apnea despite airway readiness; immediate positive-pressure ventilation is required.'
      : 'Maya develops prostaglandin-associated apnea without respiratory equipment immediately ready; positive-pressure ventilation is urgently required.',
    'maya', 'critical'
  );
  addPage('maya', 'Bedside emergency: apnea after prostaglandin', 'Maya is apneic with bradycardia. Provide positive-pressure ventilation immediately.', true, 'maya-apnea');
};

const phsClinicalOriginalCompleteOrder = completeOrder;
completeOrder = function completeOrderClinicalValidation(patientId, orderId) {
  phsClinicalOriginalCompleteOrder(patientId, orderId);
  const patient = state.patients[patientId];
  const order = orderRecord(patientId, orderId);
  const result = patient.results.find(item => item.orderId === orderId);
  if (!order || !result) return;

  if (patientId === 'maya' && orderId === 'culture') {
    const antibiotics = orderRecord('maya', 'antibiotics');
    const before = !antibiotics || antibiotics.availableAt == null || order.availableAt <= antibiotics.availableAt;
    result.text = before
      ? 'Adequate-volume blood culture was collected before antibiotics; organism data are pending.'
      : 'Blood culture was collected after antibiotics had already started; yield may be reduced and the sequence is documented.';
  }
  if (patientId === 'nora' && orderId === 'antibiotics') {
    const lp = orderRecord('nora', 'lp');
    result.text = lp?.availableAt != null && lp.availableAt <= order.availableAt
      ? 'Parenteral antibiotics started after CSF collection; admission and culture ownership remain required.'
      : 'Parenteral antibiotics started before CSF collection. Do not delay treatment in an unstable infant, but document that subsequent CSF interpretation may be affected.';
  }
};

const phsClinicalOriginalInterpretationQuality = phsInterpretationQuality;
phsInterpretationQuality = function phsInterpretationQualityClinical(patientId, result, text) {
  const lower = String(text || '').toLowerCase();
  if (patientId === 'maya' && result.orderId === 'echo' && phsDangerousNegation(lower, ['coarctation', 'ductal', 'prostaglandin', 'pge', 'cardiology', 'transfer'])) return false;
  if (patientId === 'nora' && ['speciation', 'lp'].includes(result.orderId) && phsDangerousNegation(lower, ['gbs', 'group b', 'pathogen', 'bacteremia', 'meningitis', 'antibiotic', 'admission'])) return false;
  if (patientId === 'nora' && result.orderId === 'inflammatory') {
    return phsHasAny(lower, ['abnormal', 'elevated', 'high risk', 'invasive bacterial', 'ibi']) &&
      phsHasAny(lower, ['csf', 'lumbar', 'lp', 'antibiotic', 'admit', 'hospital']);
  }
  return phsClinicalOriginalInterpretationQuality(patientId, result, text);
};

const phsClinicalOriginalEvaluateCondition = evaluateCondition;
evaluateCondition = function evaluateConditionClinical(condition) {
  if (condition.type === 'flag' && condition.flag === 'noraJudgmentMade') {
    if (!state.noraJudgment) return false;
    if (state.noraJudgment.value === 'likely pathogen') return true;
    return state.noraJudgment.value === 'indeterminate' && !!orderRecord('nora', 'antibiotics') && !!orderRecord('nora', 'lp');
  }
  if (condition.type === 'pendingOwnership') {
    for (const [patientId, patient] of Object.entries(state.patients)) {
      const pending = patient.ordersPlaced.some(order => order.status === 'pending') ||
        patient.results.some(result => result.reviewedAt == null || (result.requiresInterpretation && result.interpretedAt == null)) ||
        state.pages.some(page => page.patientId === patientId && page.resolvedAt == null);
      if (pending && !phsHandoffFieldValid(patientId, 'pending', state.handoffs[patientId]?.pending || '')) return false;
    }
    return true;
  }
  return phsClinicalOriginalEvaluateCondition(condition);
};

const phsClinicalOriginalScoreAttempt = scoreAttempt;
scoreAttempt = function scoreAttemptClinicalValidation() {
  const score = phsClinicalOriginalScoreAttempt();
  const unsafeBronchiolitis = !!state.patients.eli.flags.lowValueBronchiolitisTreatment;
  if (unsafeBronchiolitis) {
    score.mastery = false;
    score.clinicalValidationBlocks = [...(score.clinicalValidationBlocks || []), 'Routine low-value bronchiolitis medication was administered.'];
  }
  return score;
};

const phsClinicalOriginalRenderDebrief = renderDebrief;
renderDebrief = function renderDebriefClinicalValidation() {
  phsClinicalOriginalRenderDebrief();
  if (!state.score?.clinicalValidationBlocks?.length) return;
  const block = document.createElement('div');
  block.className = 'debrief-block bad';
  block.innerHTML = `<h3>Clinical validation block</h3><ul>${state.score.clinicalValidationBlocks.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
  $('missesDebrief').before(block);
};

const validationBadge = document.querySelector('.version');
if (validationBadge) validationBadge.textContent = 'CLINICAL VALIDATION v1.9 RC';
document.title = 'PHS — Clinical Validation v1.9 RC';
