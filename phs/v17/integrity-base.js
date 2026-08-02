'use strict';

/*
 * PHS v1.8 audit remediation layer.
 *
 * This module is loaded before app initialisation and replaces the specific
 * engine/UI functions implicated by the August 2026 UI-only audit. It keeps
 * the existing v1.7 case package readable while enforcing a hard clinical
 * deadline, monotonic time, observation-bounded displays, content-dependent
 * assessment, finite staff delegation, and improved accessibility semantics.
 */

const PHS_RELEASE_VERSION = '1.8.0';
const PHS_MIN_ORDER_QUERY = 2;
const PHS_INTERPRETATION_MIN_TOKENS = 3;

function phsWords(text) {
  return String(text || '').toLowerCase().match(/[a-z0-9]+/g) || [];
}

function phsHasAny(text, terms) {
  const normal = String(text || '').toLowerCase();
  return terms.some(term => normal.includes(term));
}

function phsLexicallyMeaningful(text, minimumTokens = 3) {
  const words = phsWords(text).filter(word => word.length > 1);
  const unique = new Set(words);
  if (words.length < minimumTokens || unique.size < minimumTokens) return false;
  if (unique.size === 1) return false;
  const alpha = String(text || '').replace(/[^a-z]/gi, '');
  if (alpha.length >= 6 && /^(.)\1+$/i.test(alpha)) return false;
  if (/^(x+|test+|hello|none)$/i.test(String(text || '').trim())) return false;
  return true;
}

function phsVisibleObjective(objective) {
  if (objective.id === 'O2') {
    return 'Recognize neonatal shock despite inherited framing, seek disconfirming evidence, and revise the working diagnosis.';
  }
  if (objective.id === 'O3') {
    return 'Stabilize a critically ill neonate while maintaining parallel coverage of reversible threats.';
  }
  return objective.description;
}

function phsCurrentObservedState(patientId) {
  const patient = state.patients[patientId];
  if (!patient) return 'Unreviewed';
  const openUrgent = state.pages.some(page => page.patientId === patientId && page.urgent && page.resolvedAt == null);
  if (openUrgent) return 'Urgent page';
  if (patient.visibleClinicalState) return patient.visibleClinicalState;
  if (patient.historyLog.length || patient.examLog.length || patient.ordersPlaced.length || patient.teamMessages.length) return 'In progress';
  return 'Unreviewed';
}

function phsCaptureVisibleState(patientId) {
  const patient = state.patients[patientId];
  if (!patient) return;
  let label = 'In progress';
  if (patient.flags.arrest) label = 'Arrest';
  else if (patient.flags.critical) label = 'Critical observed';
  else if (patient.flags.deteriorating) label = 'Deteriorating observed';
  else if (patient.flags.stabilized || patient.flags.responding || patient.flags.postTreatment) label = 'Stabilizing observed';
  patient.visibleClinicalState = label;
  patient.visibleClinicalStateAt = state.time;
}

function phsLastObservedVitals(patient) {
  return patient.observedVitals?.[patient.observedVitals.length - 1] || { time: 0, ...patient.initialVitals };
}

function phsMessageQuality(patientId, role, message) {
  if (!phsLexicallyMeaningful(message, 5)) return 0;
  const text = String(message).toLowerCase();
  let score = 0;
  if (phsHasAny(text, ['urgent', 'now', 'critical', 'unstable', 'shock', 'deteriorat', 'time-sensitive'])) score += 1;
  if (phsHasAny(text, ['assessment', 'concern', 'perfusion', 'respir', 'infection', 'culture', 'pain', 'diagnos', 'finding', 'lactate', 'pulse'])) score += 1;
  if (phsHasAny(text, ['please', 'request', 'need', 'evaluate', 'come', 'accept', 'transfer', 'review', 'start', 'repeat', 'obtain', 'monitor'])) score += 1;
  if (phsHasAny(text, ['confirm', 'read back', 'repeat back', 'call me', 'notify', 'if', 'when'])) score += 1;
  if (patientId === 'maya' && ['cardiology', 'attending'].includes(role)) {
    if (phsHasAny(text, ['neonate', 'newborn', 'six-day', '6-day', 'maya'])) score += 1;
    if (phsHasAny(text, ['duct', 'coarct', 'femoral', 'differential perfusion', 'systemic perfusion', 'prostaglandin', 'pge'])) score += 1;
  }
  if (role === 'parent' && phsLexicallyMeaningful(message, 5) && phsHasAny(text, ['baby', 'child', 'heart', 'problem', 'medicine', 'treatment', 'plan', 'ill', 'update'])) return Math.max(score, 4);
  return score;
}

function phsDefaultInterpretation(patientId, result) {
  if (patientId === 'maya' && result.orderId === 'echo') return 'Critical coarctation with ductal-dependent systemic hypoperfusion; continue prostaglandin and urgent cardiac ICU transfer.';
  if (patientId === 'maya' && result.orderId === 'gas') return 'Metabolic acidosis and elevated lactate reflect shock; treat perfusion and repeat the trend after stabilization.';
  if (patientId === 'maya' && result.orderId === 'glucose') return 'Glucose is not low enough to explain the shock pattern; continue evaluation and treatment of perfusion failure.';
  if (patientId === 'nora' && result.orderId === 'speciation') return 'Group B Streptococcus is a true pathogen; continue antibiotics, obtain CSF, and admit for meningitis evaluation.';
  if (patientId === 'nora' && result.orderId === 'lp') return 'Abnormal CSF is concerning for bacterial meningitis; continue targeted antibiotics and determine treatment duration.';
  return `Result is clinically significant and must be incorporated into reassessment and management: ${result.title}.`;
}

function phsInterpretationQuality(patientId, result, text) {
  if (!phsLexicallyMeaningful(text, PHS_INTERPRETATION_MIN_TOKENS)) return false;
  const lower = String(text).toLowerCase();
  if (patientId === 'maya' && result.orderId === 'echo') {
    return phsHasAny(lower, ['coarct', 'ductal', 'systemic obstruction', 'systemic hypoperfusion', 'left-sided obstruction']) &&
      phsHasAny(lower, ['prostaglandin', 'pge', 'cardiology', 'cardiac icu', 'transfer', 'surgery']);
  }
  if (patientId === 'maya' && result.orderId === 'gas') {
    return phsHasAny(lower, ['acidosis', 'lactate', 'shock', 'hypoperfusion']) &&
      phsHasAny(lower, ['reassess', 'perfusion', 'treat', 'trend', 'repeat']);
  }
  if (patientId === 'maya' && result.orderId === 'glucose') {
    return phsHasAny(lower, ['glucose', 'hypogly', '58', 'not the cause', 'does not explain']);
  }
  if (patientId === 'nora' && result.orderId === 'speciation') {
    return phsHasAny(lower, ['gbs', 'group b', 'streptococcus agalactiae', 'pathogen', 'bacteremia']) &&
      phsHasAny(lower, ['antibiotic', 'lumbar', 'lp', 'csf', 'admit', 'meningitis']);
  }
  if (patientId === 'nora' && result.orderId === 'lp') {
    return phsHasAny(lower, ['csf', 'meningitis', 'pleocyt', 'abnormal', 'bacterial']) &&
      phsHasAny(lower, ['antibiotic', 'treat', 'duration', 'admit']);
  }
  return true;
}

function phsHandoffFieldValid(patientId, field, value) {
  const text = String(value || '').trim();
  if (!phsLexicallyMeaningful(text, 3)) return false;
  const lower = text.toLowerCase();
  const patient = state.patients[patientId];
  if (!patient) return false;

  if (field === 'illness') {
    return phsHasAny(lower, ['critical', 'unstable', 'watcher', 'stable', 'improving', 'deteriorating', 'shock', 'respiratory', 'bacteremia', 'low risk']);
  }

  if (field === 'summary') {
    const caseTerms = {
      maya: ['newborn', 'neonate', 'shock', 'perfusion', 'coarct', 'ductal', 'feeding', 'femoral'],
      eli: ['bronchiolitis', 'hypox', 'respiratory', 'oxygen', 'work of breathing', 'feeding'],
      nora: ['infant', 'fever', 'culture', 'gbs', 'bacteremia', 'meningitis', 'csf'],
      jamal: ['chest pain', 'musculoskeletal', 'reproducible', 'low risk', 'caregiver'],
    };
    return phsHasAny(lower, caseTerms[patientId] || [patient.name.toLowerCase()]) || phsHasAny(lower, ['mechanism', 'current trajectory', 'clinical summary']);
  }

  if (field === 'actions') {
    const performed = patient.ordersPlaced.map(order => order.name.toLowerCase());
    const generic = ['exam', 'reassess', 'monitor', 'oxygen', 'antibiotic', 'prostaglandin', 'pge', 'culture', 'echo', 'fluid', 'family', 'cardiology', 'admit', 'lumbar', 'lp'];
    return phsHasAny(lower, generic) || performed.some(name => name.split(/\s+/).some(word => word.length >= 5 && lower.includes(word)));
  }

  if (field === 'pending') {
    const hasPending = patient.ordersPlaced.some(order => order.status === 'pending') ||
      patient.results.some(result => result.reviewedAt == null || (result.requiresInterpretation && result.interpretedAt == null)) ||
      state.pages.some(page => page.patientId === patientId && page.resolvedAt == null);
    if (!hasPending) return phsHasAny(lower, ['none', 'no pending', 'nothing pending', 'complete']);
    const owner = phsHasAny(lower, ['incoming', 'resident', 'nurse', 'intern', 'attending', 'cardiology', 'team', 'you', 'owner', 'follow', 'review']);
    const work = phsHasAny(lower, ['result', 'culture', 'echo', 'lab', 'page', 'reassess', 'monitor', 'csf', 'speciation', 'follow-up', 'pending']);
    return owner && work;
  }

  if (field === 'contingency') {
    return phsHasAny(lower, ['if', 'when', 'should', 'for worsening', 'notify', 'escalate', 'call', 'return']) &&
      phsHasAny(lower, ['worsen', 'desatur', 'hypotens', 'perfusion', 'breathing', 'fever', 'pain', 'mental status', 'urine', 'lactate']);
  }

  return false;
}

function phsEnsureStaffState() {
  if (!state.staff) {
    state.staff = {
      nurse: { label: 'Bedside nurse', busyUntil: 0, task: null },
      intern: { label: 'Intern', busyUntil: 0, task: null },
    };
  }
  if (!state.delegations) state.delegations = [];
}

function phsDelegationTasks(patientId) {
  const patient = state.patients[patientId];
  const tasks = [
    { id: 'repeat-vitals', label: 'Repeat and document vital signs', resource: 'nurse', duration: 45 },
    { id: 'focused-reassessment', label: 'Perform focused reassessment', resource: 'intern', duration: 60 },
  ];
  if (state.pages.some(page => page.patientId === patientId && page.ackAt == null)) {
    tasks.push({ id: 'ack-page', label: 'Acknowledge and assess open page', resource: 'nurse', duration: 30 });
  }
  if (patient.results.some(result => result.reviewedAt == null)) {
    tasks.push({ id: 'review-result', label: 'Review newest available result', resource: 'intern', duration: 45 });
  }
  return tasks;
}

function phsAssignDelegation(resourceId, taskId) {
  if (!canInteract() || !state.selectedId) return;
  phsEnsureStaffState();
  const resource = state.staff[resourceId];
  const task = phsDelegationTasks(state.selectedId).find(item => item.id === taskId && item.resource === resourceId);
  if (!resource || !task) return;
  if (resource.busyUntil > state.time) {
    showUrgent(`${resource.label} is already assigned until ${fmtTime(resource.busyUntil)}.`);
    return;
  }
  const patientId = state.selectedId;
  if (!spendAttention(15, `Delegate to ${resource.label}: ${task.label}`, patientId)) return;
  const assignment = {
    id: uid('delegation'),
    patientId,
    resourceId,
    taskId,
    label: task.label,
    assignedAt: state.time,
    due: state.time + task.duration,
    completedAt: null,
  };
  resource.busyUntil = assignment.due;
  resource.task = assignment.id;
  state.delegations.push(assignment);
  addTimeline(`${resource.label} assigned: ${task.label}.`, patientId, 'delegation');
  renderAll();
}

function phsCompleteDelegations() {
  phsEnsureStaffState();
  for (const assignment of state.delegations) {
    if (assignment.completedAt != null || assignment.due > state.time) continue;
    assignment.completedAt = state.time;
    const patient = state.patients[assignment.patientId];
    const resource = state.staff[assignment.resourceId];
    if (resource?.task === assignment.id) {
      resource.task = null;
      resource.busyUntil = state.time;
    }
    if (assignment.taskId === 'repeat-vitals') {
      patient.observedVitals.push({ time: state.time, source: 'Delegated repeat vital signs', ...clone(patient.vitals) });
      phsCaptureVisibleState(assignment.patientId);
      markPageResponse(assignment.patientId);
    } else if (assignment.taskId === 'focused-reassessment') {
      const exam = patient.exams[0];
      if (exam) {
        const key = currentPatientState(assignment.patientId);
        const finding = exam.findings[key] || exam.findings.default;
        patient.examCounts[exam.id] = (patient.examCounts[exam.id] || 0) + 1;
        patient.examLog.push({ time: state.time, examId: exam.id, label: `Delegated ${exam.label}`, finding, count: patient.examCounts[exam.id], delegated: true });
      }
      phsCaptureVisibleState(assignment.patientId);
      markPageResponse(assignment.patientId);
    } else if (assignment.taskId === 'ack-page') {
      const page = state.pages.find(item => item.patientId === assignment.patientId && item.ackAt == null);
      if (page) {
        page.ackAt = state.time;
        page.responseAt = state.time;
      }
    } else if (assignment.taskId === 'review-result') {
      const result = patient.results.find(item => item.reviewedAt == null);
      if (result) {
        result.reviewedAt = state.time;
        result.reviewedBy = assignment.resourceId;
        const order = orderRecord(assignment.patientId, result.orderId);
        if (order) order.status = 'reviewed';
      }
    }
    addTimeline(`${resource?.label || assignment.resourceId} completed delegated task: ${assignment.label}.`, assignment.patientId, 'delegation-complete');
  }
}

function phsInstallAccessibility() {
  const prebrief = $('prebrief');
  const endModal = $('endModal');
  if (prebrief) {
    prebrief.setAttribute('role', 'dialog');
    prebrief.setAttribute('aria-modal', 'true');
    const heading = prebrief.querySelector('h2');
    if (heading) {
      heading.id ||= 'prebrief-title';
      prebrief.setAttribute('aria-labelledby', heading.id);
    }
  }
  if (endModal) {
    endModal.setAttribute('role', 'dialog');
    endModal.setAttribute('aria-modal', 'true');
    const heading = endModal.querySelector('h2');
    if (heading) {
      heading.id ||= 'end-modal-title';
      endModal.setAttribute('aria-labelledby', heading.id);
    }
  }
  const debrief = $('debrief');
  if (debrief) {
    debrief.setAttribute('role', 'dialog');
    debrief.setAttribute('aria-modal', 'true');
    const heading = debrief.querySelector('h2');
    if (heading) {
      heading.id ||= 'debrief-title';
      debrief.setAttribute('aria-labelledby', heading.id);
    }
  }

  const tabs = [...document.querySelectorAll('.tabs [role="tab"]')];
  for (const tab of tabs) {
    const panel = $(`tab-${tab.dataset.tab}`);
    const tabId = `tab-control-${tab.dataset.tab}`;
    tab.id = tabId;
    tab.setAttribute('aria-controls', panel.id);
    tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
  }

  document.addEventListener('keydown', event => {
    const active = document.activeElement;
    if (!active?.matches?.('.tabs [role="tab"]')) return;
    const index = tabs.indexOf(active);
    let next = null;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next == null) return;
    event.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const modal = [prebrief, endModal, debrief].find(item => item && !item.classList.contains('hidden'));
    if (!modal) return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function phsInstallResponsiveFixes() {
  const style = document.createElement('style');
  style.id = 'phs-v18-responsive-fixes';
  style.textContent = `
    @media (max-width: 900px) {
      .topbar { flex-wrap: wrap; }
      .topbar .spacer { display: none; }
      .topbar .brand { flex: 1 1 100%; }
      .topbar .metric { flex: 1 1 110px; min-width: 0; }
      .topbar .version { margin-left: auto; }
    }
    .delegation-panel { margin-top: .8rem; padding: .7rem; border: 1px solid var(--line); border-radius: 8px; background: #0b1828; }
    .delegation-grid { display: grid; grid-template-columns: minmax(120px,.6fr) minmax(180px,1.4fr) auto; gap: .5rem; align-items: end; }
    .observation-note { color: var(--muted); font-size: .78rem; margin: -.35rem 0 .55rem; }
    .interpretation-box { margin-top: .5rem; }
    @media (max-width: 640px) { .delegation-grid { grid-template-columns: 1fr; } }
  `;
  document.head.appendChild(style);
}
