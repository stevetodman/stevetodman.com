'use strict';

const phsOriginalLoadCase = loadCase;
loadCase = async function loadCaseV18() {
  const caseData = await phsOriginalLoadCase();
  caseData.version = PHS_RELEASE_VERSION;
  caseData.objectives = caseData.objectives.map(objective => ({ ...objective, description: phsVisibleObjective(objective) }));
  return caseData;
};

const phsOriginalCreateState = createState;
createState = function createStateV18(caseData, variantId, mode = 'assessment') {
  const next = phsOriginalCreateState(caseData, variantId, mode);
  next.clockWallMs = null;
  next.staff = {
    nurse: { label: 'Bedside nurse', busyUntil: 0, task: null },
    intern: { label: 'Intern', busyUntil: 0, task: null },
  };
  next.delegations = [];
  for (const patient of Object.values(next.patients)) {
    patient.visibleClinicalState = null;
    patient.visibleClinicalStateAt = null;
  }
  return next;
};

advanceScenario = function advanceScenarioV18(seconds, background) {
  const deadline = shiftTiming().deadline;
  for (let index = 0; index < seconds; index += 1) {
    if (state.ended || state.flags.handoffForced || state.time >= deadline) break;
    state.time += 1;
    updatePhysiology();
    if (state.ended || state.flags.handoffForced) break;
    fireScheduledEvents();
    completeProcesses();
    if (state.time % 30 === 0) recordPhysiology();
  }
  if (!background) renderDynamic();
};

spendAttention = function spendAttentionV18(seconds, label, patientId = null) {
  if (!canInteract()) return false;
  const start = state.time;
  const pausedPractice = !state.running && state.mode === 'practice';
  let actual = 0;
  if (pausedPractice) {
    state.coachedPauseActions += 1;
  } else {
    advanceScenario(seconds, false);
    actual = Math.max(0, state.time - start);
    state.totalAttention += actual;
  }
  const interrupted = !pausedPractice && state.flags.handoffForced && actual < seconds;
  state.ledger.push({ start, end: state.time, seconds: actual, requestedSeconds: seconds, label, patientId, pausedPractice, interrupted });
  addTimeline(pausedPractice ? `${label} performed during coached practice pause.` : interrupted ? `${label} was interrupted when clinical time ended after ${fmtTime(actual)}.` : `${label} consumed ${fmtTime(actual)} of learner attention.`, patientId, 'attention');
  renderAll();
  return !state.ended && !state.flags.handoffForced;
};

realTimeTick = function realTimeTickV18() {
  if (!state?.running || state.ended || state.flags.handoffForced) {
    if (state) state.clockWallMs = null;
    return;
  }
  const now = performance.now();
  if (state.clockWallMs == null) {
    state.clockWallMs = now;
    return;
  }
  const elapsed = Math.floor((now - state.clockWallMs) / 1000);
  if (elapsed <= 0) return;
  state.clockWallMs += elapsed * 1000;
  advanceScenario(elapsed, true);
  renderDynamic();
};

const phsOriginalStartShift = startShift;
startShift = function startShiftV18(ranking, mode) {
  phsOriginalStartShift(ranking, mode);
  state.clockWallMs = performance.now();
};

const phsOriginalTogglePause = togglePause;
togglePause = function togglePauseV18() {
  phsOriginalTogglePause();
  state.clockWallMs = state.running ? performance.now() : null;
};

const phsOriginalResetSimulation = resetSimulation;
resetSimulation = function resetSimulationV18(caseData = state?.caseData, variantId = null, mode = null) {
  phsOriginalResetSimulation(caseData, variantId, mode);
  if (state) state.clockWallMs = null;
};

const phsOriginalPerformExam = performExam;
performExam = function performExamV18(examId) {
  const patientId = state.selectedId;
  const before = patientId ? state.patients[patientId].examLog.length : 0;
  phsOriginalPerformExam(examId);
  if (patientId && state.patients[patientId].examLog.length > before) {
    phsCaptureVisibleState(patientId);
    renderAll();
  }
};

const phsOriginalRepeatVitals = repeatVitals;
repeatVitals = function repeatVitalsV18() {
  const patientId = state.selectedId;
  const before = patientId ? state.patients[patientId].observedVitals.length : 0;
  phsOriginalRepeatVitals();
  if (patientId && state.patients[patientId].observedVitals.length > before) {
    phsCaptureVisibleState(patientId);
    renderAll();
  }
};

const phsOriginalRecordPhysiology = recordPhysiology;
recordPhysiology = function recordPhysiologyV18() {
  phsOriginalRecordPhysiology();
  for (const [patientId, patient] of Object.entries(state.patients)) {
    if (!patient.flags.monitoring) continue;
    const last = phsLastObservedVitals(patient);
    if (last.time === state.time) continue;
    patient.observedVitals.push({ time: state.time, source: 'Continuous monitoring', ...clone(patient.vitals) });
    phsCaptureVisibleState(patientId);
  }
};

patientStateLabel = function patientStateLabelV18(patientId) {
  return phsCurrentObservedState(patientId);
};

renderVitals = function renderVitalsV18() {
  if (!state.selectedId) return;
  const patient = state.patients[state.selectedId];
  const last = phsLastObservedVitals(patient);
  const vitalEntries = Object.entries(last).filter(([key]) => !['time', 'source'].includes(key));
  $('vitals').innerHTML = vitalEntries.map(([key, value]) => `<div class="vital"><small>${esc(key)}</small><strong>${esc(formatVital(key, value))}</strong></div>`).join('');
  const note = document.querySelector('.observation-note') || document.createElement('div');
  note.className = 'observation-note';
  note.textContent = `Last observed ${fmtTime(last.time)} · ${last.source || 'clinical observation'}`;
  $('vitals').after(note);
  const observations = patient.observedVitals.slice(-4);
  $('trendStrip').innerHTML = observations.map(observation => `<span><b>${fmtTime(observation.time)}</b> HR ${formatVital('HR', observation.HR)} · RR ${formatVital('RR', observation.RR)} · SpO2 ${formatVital('SpO2', observation.SpO2)} · BP ${esc(observation.BP)}</span>`).join(' &nbsp;→&nbsp; ');
};
