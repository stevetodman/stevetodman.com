'use strict';

const phsOriginalEvaluateCondition = evaluateCondition;
evaluateCondition = function evaluateConditionV18(condition) {
  if (condition.type === 'allUrgentPagesResponded') {
    const urgent = state.pages.filter(page => page.urgent);
    if (!urgent.length) return false;
    return urgent.every(page => page.responseAt != null && page.responseAt - page.createdAt <= condition.within);
  }
  if (condition.type === 'urgentPagesRespondedFraction') {
    const urgent = state.pages.filter(page => page.urgent);
    if (!urgent.length) return false;
    const responded = urgent.filter(page => page.responseAt != null && page.responseAt - page.createdAt <= condition.within).length;
    return responded / urgent.length >= condition.minimum;
  }
  if (condition.type === 'teamReadback') {
    const patient = state.patients[condition.patientId];
    return patient.teamMessages.some(message => condition.roles.includes(message.role) && message.readback && message.qualityAdequate);
  }
  if (condition.type === 'teamMessage') {
    const patient = state.patients[condition.patientId];
    return patient.teamMessages.some(message => message.role === condition.role && message.qualityAdequate);
  }
  if (condition.type === 'resultInterpreted') {
    const patient = state.patients[condition.patientId];
    return patient.results.some(result => result.orderId === condition.orderId && result.interpretedAt != null && result.interpretationQuality);
  }
  if (condition.type === 'allResultsInterpreted') {
    const patient = state.patients[condition.patientId];
    return condition.orderIds.every(orderId => patient.results.some(result => result.orderId === orderId && result.interpretedAt != null && result.interpretationQuality));
  }
  return phsOriginalEvaluateCondition(condition);
};

handoffCompleteness = function handoffCompletenessV18() {
  const fields = ['illness', 'summary', 'actions', 'pending', 'contingency'];
  let valid = 0;
  let total = 0;
  for (const patientId of Object.keys(state.patients)) {
    const handoff = state.handoffs[patientId] || {};
    for (const field of fields) {
      total += 1;
      if (phsHandoffFieldValid(patientId, field, handoff[field])) valid += 1;
    }
  }
  return total ? valid / total : 0;
};

const phsOriginalRenderTabs = renderTabs;
renderTabs = function renderTabsV18() {
  phsOriginalRenderTabs();
  document.querySelectorAll('.tabs [role="tab"]').forEach(tab => {
    tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
  });
};

const phsOriginalRenderPrebrief = renderPrebrief;
renderPrebrief = function renderPrebriefV18() {
  phsOriginalRenderPrebrief();
  $('prebriefObjectives').innerHTML = state.caseData.objectives.map(objective => `<div class="objective"><b>${esc(objective.label)}</b><div>${esc(phsVisibleObjective(objective))}</div></div>`).join('');
  setTimeout(() => $('startBtn')?.focus(), 0);
};

const phsOriginalRenderObjectives = renderObjectives;
renderObjectives = function renderObjectivesV18() {
  phsOriginalRenderObjectives();
  $('objectiveList').innerHTML = state.caseData.objectives.map(objective => `<div class="objective"><b>${esc(objective.id)} · ${esc(objective.label)}</b><div>${esc(phsVisibleObjective(objective))}</div></div>`).join('');
};

const phsOriginalRenderEndModal = renderEndModal;
renderEndModal = function renderEndModalV18() {
  phsOriginalRenderEndModal();
  setTimeout(() => $('final-rank-' + state.patientOrder[0])?.focus(), 0);
};

const phsOriginalShowDebrief = showDebrief;
showDebrief = function showDebriefV18() {
  phsOriginalShowDebrief();
  setTimeout(() => $('nextAttemptBtn')?.focus(), 0);
};

const phsOriginalBindEvents = bindEvents;
bindEvents = function bindEventsV18() {
  phsOriginalBindEvents();
  $('resetBtn').onclick = () => {
    if (!state.started || state.ended || window.confirm('Reset this attempt? Current progress will be lost.')) resetSimulation(state.caseData, state.variant.id, state.mode);
  };
  $('clearHistoryBtn').onclick = () => {
    if (!window.confirm('Clear all completed attempt history on this device?')) return;
    learnerRecord = clearLearnerRecord();
    renderAttemptHistory();
  };
  $('cancelEndBtn').onclick = () => {
    if (state.flags.handoffForced) return;
    $('endModal').classList.add('hidden');
    state.running = true;
    state.clockWallMs = performance.now();
    renderAll();
  };
};

const phsOriginalCompleteProcesses = completeProcesses;
completeProcesses = function completeProcessesV18() {
  phsOriginalCompleteProcesses();
  phsCompleteDelegations();
};

document.title = 'PHS — Closing Window v1.8';
const phsVersionBadge = document.querySelector('.version');
if (phsVersionBadge) phsVersionBadge.textContent = 'HOSTED v1.8';
phsInstallResponsiveFixes();
phsInstallAccessibility();
