import { normalizeStore } from './core.mjs';
import { visualStimulusMarkup } from './visuals.mjs';

const DAY_MS = 86400000;
const LEARNERS = ['Luke', 'Samantha'];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function textStimulusMarkup(stimulus) {
  if (!stimulus) return '';
  let body = stimulus.text ? `<p>${esc(stimulus.text)}</p>` : '';
  if (stimulus.table) body += `<div class="data-scroll"><table><thead><tr>${stimulus.table.headers.map(header => `<th scope="col">${esc(header)}</th>`).join('')}</tr></thead><tbody>${stimulus.table.rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  body += visualStimulusMarkup(stimulus);
  return `<section class="stimulus phenomenon-evidence">${body}</section>`;
}

export function validatePhenomena(phenomena = []) {
  const ids = new Set();
  for (const phenomenon of phenomena) {
    if (!phenomenon.id || ids.has(phenomenon.id)) throw new Error(`Duplicate or missing phenomenon id: ${phenomenon.id}`);
    ids.add(phenomenon.id);
    if (!phenomenon.title || !phenomenon.context || !Array.isArray(phenomenon.steps) || phenomenon.steps.length < 4) throw new Error(`Incomplete phenomenon: ${phenomenon.id}`);
    const stepIds = new Set();
    let evidenceSteps = 0;
    for (const step of phenomenon.steps) {
      if (!step.id || stepIds.has(step.id)) throw new Error(`Duplicate phenomenon step: ${phenomenon.id}/${step.id}`);
      stepIds.add(step.id);
      if (!['notice', 'choice'].includes(step.type)) throw new Error(`Unsupported phenomenon step type: ${phenomenon.id}/${step.id}`);
      if (!step.prompt) throw new Error(`Missing phenomenon prompt: ${phenomenon.id}/${step.id}`);
      if (step.type === 'choice' && (!Array.isArray(step.choices) || !Number.isInteger(step.answer))) throw new Error(`Invalid phenomenon choice: ${phenomenon.id}/${step.id}`);
      if (step.recordEvidence) {
        evidenceSteps += 1;
        if (!step.skill || !step.standard) throw new Error(`Evidence step missing alignment: ${phenomenon.id}/${step.id}`);
      }
      for (const evidenceId of step.evidenceIds || []) {
        if (!phenomenon.evidence?.[evidenceId]) throw new Error(`Unknown phenomenon evidence: ${phenomenon.id}/${evidenceId}`);
      }
    }
    if (evidenceSteps > 2) throw new Error(`Phenomenon over-counts mastery evidence: ${phenomenon.id}`);
    if (phenomenon.steps[0].type !== 'notice') throw new Error(`Phenomenon must begin with notice: ${phenomenon.id}`);
    if (!phenomenon.steps.some(step => step.role === 'prediction')) throw new Error(`Phenomenon needs prediction: ${phenomenon.id}`);
    if (!phenomenon.steps.some(step => step.role === 'revision')) throw new Error(`Phenomenon needs revision: ${phenomenon.id}`);
  }
  return true;
}

export function completedPhenomenonIds(profile) {
  return new Set((profile?.sessions || []).filter(session => session.kind === 'phenomenon' && session.phenomenonId).map(session => session.phenomenonId));
}

export function nextPhenomenon(phenomena, profile, unitId = 'matter') {
  const completed = completedPhenomenonIds(profile);
  return (phenomena || []).find(phenomenon => phenomenon.unit === unitId && !completed.has(phenomenon.id)) || null;
}

export function mountPhenomenonLab(config) {
  validatePhenomena(config.phenomena || []);
  const app = document.getElementById(config.mountId || 'app');
  if (!app) throw new Error('Phenomenon Lab mount is missing');
  const activityKey = `${config.storageKey}-phenomena`;
  const params = new URLSearchParams(location.search);
  let learner = LEARNERS.includes(params.get('learner')) ? params.get('learner') : null;
  let root = loadRoot();
  let activity = loadActivity();

  function loadRoot() {
    try { return normalizeStore(JSON.parse(localStorage.getItem(config.storageKey) || 'null')); }
    catch (_) { return normalizeStore(null); }
  }

  function saveRoot() {
    localStorage.setItem(config.storageKey, JSON.stringify(root));
  }

  function loadActivity() {
    try {
      const raw = JSON.parse(localStorage.getItem(activityKey) || 'null');
      return raw && raw.version === 1 && raw.active && typeof raw.active === 'object' ? raw : { version: 1, active: {} };
    } catch (_) {
      return { version: 1, active: {} };
    }
  }

  function saveActivity() {
    localStorage.setItem(activityKey, JSON.stringify(activity));
  }

  function profile() { return root.learners[learner]; }
  function active() { return activity.active[learner]; }
  function phenomenonById(id) { return config.phenomena.find(phenomenon => phenomenon.id === id); }
  function focusHeading() { requestAnimationFrame(() => app.querySelector('h1,h2')?.focus()); }

  function shell(content) {
    app.innerHTML = `<div class="course-shell phenomenon-shell"><header class="course-head"><a href="/study/matter-lab.html" class="home-link">← Science Lab</a><div><span>Louisiana Grade 5</span><strong>Deep investigation</strong></div></header>${content}</div>`;
    focusHeading();
  }

  function renderPicker() {
    shell(`<main class="learner-screen"><p class="eyebrow">Science Lab investigation</p><h1 tabindex="-1">Who is investigating?</h1><p class="lede">Each learner keeps a separate prediction, evidence trail, and science history.</p><section class="learner-grid"><button class="menu-card" data-phen-learner="Luke"><span class="learner-mark luke">L</span><span><strong>Luke</strong><small>Continue your science investigation</small></span><b>→</b></button><button class="menu-card" data-phen-learner="Samantha"><span class="learner-mark samantha">S</span><span><strong>Samantha</strong><small>Continue your science investigation</small></span><b>→</b></button></section></main>`);
  }

  function ensureSession() {
    if (active()) return active();
    const next = nextPhenomenon(config.phenomena, profile(), config.currentUnit);
    if (!next) return null;
    activity.active[learner] = {
      version: 1,
      id: `phen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      phenomenonId: next.id,
      stepIndex: 0,
      stepResponse: null,
      responses: {},
      feedback: null,
      startedAt: new Date().toISOString()
    };
    saveActivity();
    return active();
  }

  function renderHome() {
    const session = ensureSession();
    if (session) return renderStep();
    shell(`<main class="summary-card"><p class="eyebrow">Matter investigations</p><h1 tabindex="-1">Both investigations complete.</h1><p class="lede">The important ideas now return through delayed adaptive practice and transfer.</p><div class="summary-actions"><a class="primary-button link-button" href="/study/matter-lab.html">Return to adaptive practice</a></div></main>`);
  }

  function evidenceMarkup(phenomenon, step) {
    return (step.evidenceIds || []).map(id => textStimulusMarkup(phenomenon.evidence[id])).join('');
  }

  function selectedChoiceMarkup(step, selected) {
    return `<div class="choice-list phenomenon-choices" role="group" aria-label="Response choices">${step.choices.map((choice, index) => `<button type="button" class="choice${selected === index ? ' selected' : ''}" data-phen-choice="${index}" aria-pressed="${selected === index}">${esc(choice)}</button>`).join('')}</div>`;
  }

  function renderStep() {
    const session = ensureSession();
    if (!session) return renderHome();
    const phenomenon = phenomenonById(session.phenomenonId);
    const step = phenomenon.steps[session.stepIndex];
    if (!step) return finishPhenomenon();
    if (session.feedback) return renderFeedback();
    const progress = Math.round(session.stepIndex / phenomenon.steps.length * 100);
    const response = Number.isInteger(session.stepResponse) ? session.stepResponse : null;
    const evidence = evidenceMarkup(phenomenon, step);
    const controls = step.type === 'notice'
      ? `<button class="primary-button" data-phen-action="continue">Continue</button>`
      : `${selectedChoiceMarkup(step, response)}<button class="primary-button check-button" data-phen-action="${step.role === 'prediction' ? 'commit' : 'check'}" ${Number.isInteger(response) ? '' : 'disabled'}>${step.role === 'prediction' ? 'Commit prediction' : step.role === 'revision' ? 'Use this explanation' : 'Check evidence'}</button>`;
    shell(`<main class="practice-screen phenomenon-practice"><div class="session-head"><a class="text-button link-button" href="/study/matter-lab.html">← Pause</a><div class="progress-copy"><strong>${session.stepIndex + 1} of ${phenomenon.steps.length}</strong><span>${esc(phenomenon.title)}</span></div></div><div class="progress-track" aria-label="Investigation progress"><span style="width:${progress}%"></span></div><article class="question-card phenomenon-card"><p class="eyebrow">${esc(step.eyebrow || 'Investigate')}</p><div class="phenomenon-context"><strong>The phenomenon</strong><p>${esc(phenomenon.context)}</p></div>${evidence}<h2 tabindex="-1">${esc(step.prompt)}</h2>${step.note ? `<p class="phenomenon-note">${esc(step.note)}</p>` : ''}${controls}</article></main>`);
  }

  function selectChoice(index) {
    active().stepResponse = index;
    saveActivity();
    renderStep();
  }

  function commitPrediction() {
    const session = active();
    const phenomenon = phenomenonById(session.phenomenonId);
    const step = phenomenon.steps[session.stepIndex];
    if (!Number.isInteger(session.stepResponse)) return;
    session.responses[step.id] = { selected: session.stepResponse, at: new Date().toISOString(), role: 'prediction' };
    session.stepIndex += 1;
    session.stepResponse = null;
    saveActivity();
    renderStep();
  }

  function recordEvidenceAttempt(phenomenon, step, selected, correct, session) {
    if (!step.recordEvidence) return;
    const itemId = `phen:${phenomenon.id}:${step.id}`;
    if (profile().attempts.some(attempt => attempt.sessionId === session.id && attempt.itemId === itemId)) return;
    const now = Date.now();
    profile().attempts.push({
      itemId,
      unit: phenomenon.unit,
      skill: step.skill,
      standard: step.standard,
      responseType: 'phenomenon-choice',
      response: [selected],
      correct,
      provenance: 'independent',
      recovery: false,
      delayedRetrieval: false,
      transfer: false,
      misconceptionTag: null,
      repairTarget: null,
      phenomenonId: phenomenon.id,
      phenomenonStep: step.id,
      date: dayKey(),
      at: now,
      sessionId: session.id
    });
    const dueAt = correct ? now + DAY_MS : now;
    profile().skills[step.skill] = { dueAt, updatedAt: now };
    saveRoot();
  }

  function checkStep() {
    const session = active();
    const phenomenon = phenomenonById(session.phenomenonId);
    const step = phenomenon.steps[session.stepIndex];
    const selected = session.stepResponse;
    if (!Number.isInteger(selected)) return;
    const correct = selected === step.answer;
    session.responses[step.id] = { selected, correct, at: new Date().toISOString(), role: step.role || null };
    recordEvidenceAttempt(phenomenon, step, selected, correct, session);
    const prediction = session.responses[phenomenon.steps.find(candidate => candidate.role === 'prediction')?.id];
    const revision = step.role === 'revision' ? (prediction?.selected === selected ? 'confirmed' : 'revised') : null;
    session.feedback = { stepId: step.id, correct, revision };
    saveActivity();
    renderFeedback();
  }

  function renderFeedback() {
    const session = active();
    const phenomenon = phenomenonById(session.phenomenonId);
    const step = phenomenon.steps[session.stepIndex];
    const feedback = session.feedback;
    const isRevision = step.role === 'revision';
    const heading = isRevision
      ? feedback.revision === 'revised' ? 'You revised your original model.' : 'Your original model held up.'
      : feedback.correct ? 'That evidence supports your reasoning.' : 'Use the evidence to repair the idea.';
    const detail = step.explanation || (feedback.correct ? 'Evidence recorded.' : 'This will return later for another independent check.');
    shell(`<main class="practice-screen"><article class="feedback-card ${feedback.correct ? 'correct' : 'repair'}"><p class="eyebrow">${isRevision ? 'Reflect' : 'Evidence check'}</p><h2 tabindex="-1">${esc(heading)}</h2><p>${esc(detail)}</p>${isRevision ? `<div class="repair-note"><strong>Prediction → explanation</strong><span>Science gets stronger when a model can change after new evidence.</span></div>` : ''}<button class="primary-button" data-phen-action="feedback-next">Continue investigation</button></article></main>`);
  }

  function continueStep() {
    const session = active();
    const phenomenon = phenomenonById(session.phenomenonId);
    const step = phenomenon.steps[session.stepIndex];
    session.responses[step.id] = { noticed: true, at: new Date().toISOString() };
    session.stepIndex += 1;
    session.stepResponse = null;
    saveActivity();
    renderStep();
  }

  function feedbackNext() {
    const session = active();
    session.stepIndex += 1;
    session.stepResponse = null;
    session.feedback = null;
    saveActivity();
    renderStep();
  }

  function finishPhenomenon() {
    const session = active();
    if (!session) return renderHome();
    const phenomenon = phenomenonById(session.phenomenonId);
    const predictionStep = phenomenon.steps.find(step => step.role === 'prediction');
    const revisionStep = phenomenon.steps.find(step => step.role === 'revision');
    const prediction = session.responses[predictionStep?.id]?.selected;
    const revision = session.responses[revisionStep?.id]?.selected;
    const alreadyCompleted = profile().sessions.some(entry => entry.kind === 'phenomenon' && entry.phenomenonId === phenomenon.id && entry.sessionId === session.id);
    if (!alreadyCompleted) {
      profile().sessions.unshift({
        kind: 'phenomenon',
        phenomenonId: phenomenon.id,
        sessionId: session.id,
        at: new Date().toISOString(),
        unitId: phenomenon.unit,
        prediction,
        revision,
        skills: phenomenon.skills
      });
      const retrievalAt = Date.now() + Number(phenomenon.retrievalDelayDays || 1) * DAY_MS;
      for (const skill of phenomenon.skills || []) {
        const existing = Number(profile().skills?.[skill]?.dueAt || 0);
        const dueAt = existing > 0 ? Math.min(existing, retrievalAt) : retrievalAt;
        profile().skills[skill] = { dueAt, updatedAt: Date.now(), source: `phenomenon:${phenomenon.id}` };
      }
      saveRoot();
    }
    delete activity.active[learner];
    saveActivity();
    const next = nextPhenomenon(config.phenomena, profile(), config.currentUnit);
    shell(`<main class="summary-card"><p class="eyebrow">Investigation complete</p><h1 tabindex="-1">${esc(phenomenon.title)}</h1><p class="lede">You used a prediction, more than one kind of evidence, and a final explanation. These ideas are now scheduled to return later without the full investigation.</p><div class="summary-actions">${next ? `<button class="primary-button" data-phen-action="next-phenomenon">Next investigation</button>` : ''}<a class="secondary-button link-button" href="/study/matter-lab.html">Adaptive practice</a></div></main>`);
  }

  function startNextPhenomenon() {
    ensureSession();
    renderStep();
  }

  app.addEventListener('click', event => {
    const learnerButton = event.target.closest('[data-phen-learner]');
    if (learnerButton) {
      learner = learnerButton.dataset.phenLearner;
      const url = new URL(location.href);
      url.searchParams.set('learner', learner);
      history.replaceState(null, '', url);
      renderHome();
      return;
    }
    const choice = event.target.closest('[data-phen-choice]');
    if (choice) { selectChoice(Number(choice.dataset.phenChoice)); return; }
    const action = event.target.closest('[data-phen-action]')?.dataset.phenAction;
    if (action === 'continue') continueStep();
    else if (action === 'commit') commitPrediction();
    else if (action === 'check') checkStep();
    else if (action === 'feedback-next') feedbackNext();
    else if (action === 'next-phenomenon') startNextPhenomenon();
  });

  if (learner) renderHome();
  else renderPicker();

  return {
    getLearner: () => learner,
    getActivity: () => activity,
    getRoot: () => root,
    render: () => learner ? renderHome() : renderPicker()
  };
}
