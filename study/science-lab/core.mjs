const VERSION = 2;
const SESSION_TARGET = 8;
const SESSION_MAX = 10;
const DAY_MS = 86400000;
const SIBLING_ITEM_COOLDOWN_MS = 2 * DAY_MS;
const VALID_PROVENANCE = new Set(['independent', 'hinted', 'guided', 'recovery']);

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const unique = values => [...new Set(values)];
const shuffle = (values, random = Math.random) => values.map(value => [random(), value]).sort((a, b) => a[0] - b[0]).map(pair => pair[1]);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function provenanceOf(attempt = {}) {
  return VALID_PROVENANCE.has(attempt.provenance) ? attempt.provenance : (attempt.recovery ? 'recovery' : 'independent');
}

function normalizeAttempt(attempt) {
  if (!attempt || typeof attempt !== 'object') return null;
  const provenance = provenanceOf(attempt);
  return {
    ...attempt,
    provenance,
    recovery: provenance === 'recovery',
    delayedRetrieval: Boolean(attempt.delayedRetrieval),
    transfer: Boolean(attempt.transfer),
    misconceptionTag: attempt.misconceptionTag || null,
    repairTarget: attempt.repairTarget || null
  };
}

export function blankProfile() {
  return { skills: {}, attempts: [], sessions: [] };
}

function normalizeProfile(profile) {
  const base = blankProfile();
  if (!profile || typeof profile !== 'object') return base;
  base.skills = profile.skills && typeof profile.skills === 'object' ? profile.skills : {};
  base.attempts = Array.isArray(profile.attempts) ? profile.attempts.map(normalizeAttempt).filter(Boolean).slice(-800) : [];
  base.sessions = Array.isArray(profile.sessions) ? profile.sessions.slice(-60) : [];
  return base;
}

export function normalizeStore(raw) {
  const root = raw && Number(raw.version) === VERSION ? raw : {};
  const learners = root.learners && typeof root.learners === 'object' ? root.learners : {};
  return {
    version: VERSION,
    learners: {
      Luke: normalizeProfile(learners.Luke),
      Samantha: normalizeProfile(learners.Samantha)
    },
    active: root.active && typeof root.active === 'object' ? root.active : {}
  };
}

export function skillScore(profile, skill) {
  let score = 40;
  (profile?.attempts || []).filter(attempt => attempt.skill === skill).slice(-12).forEach(attempt => {
    if (!attempt.correct) score -= 18;
    else {
      const provenance = provenanceOf(attempt);
      const credit = provenance === 'independent' ? 12 : provenance === 'recovery' ? 7 : provenance === 'hinted' ? 6 : 4;
      const evidenceBonus = provenance === 'independent' ? (attempt.delayedRetrieval ? 3 : 0) + (attempt.transfer ? 3 : 0) : 0;
      score += credit + evidenceBonus;
    }
    score = clamp(score, 0, 100);
  });
  return score;
}

export function skillStatus(profile, skill) {
  const attempts = (profile?.attempts || []).filter(attempt => attempt.skill === skill);
  const independent = attempts.filter(attempt => provenanceOf(attempt) === 'independent');
  const independentCorrect = independent.filter(attempt => attempt.correct);
  const independentDays = unique(independentCorrect.map(attempt => attempt.date).filter(Boolean));
  const delayedCorrect = independentCorrect.filter(attempt => attempt.delayedRetrieval);
  const transferCorrect = independentCorrect.filter(attempt => attempt.transfer);
  const latestIndependent = independent.at(-1);
  const unresolvedMisconception = Boolean(latestIndependent && !latestIndependent.correct);
  const latestIndependentIndex = latestIndependent ? attempts.lastIndexOf(latestIndependent) : -1;
  const repairAfterMiss = unresolvedMisconception && attempts.slice(latestIndependentIndex + 1).some(attempt => attempt.correct && provenanceOf(attempt) !== 'independent');
  const guidedCorrect = attempts.filter(attempt => attempt.correct && provenanceOf(attempt) !== 'independent');
  const mastered = independentCorrect.length >= 4 && independentDays.length >= 2 && delayedCorrect.length >= 1 && transferCorrect.length >= 1 && !unresolvedMisconception;

  let state = 'new';
  if (mastered) state = 'secure';
  else if (unresolvedMisconception && repairAfterMiss) state = 'repaired';
  else if (unresolvedMisconception) state = 'needs-repair';
  else if (transferCorrect.length) state = 'transfer-demonstrated';
  else if (delayedCorrect.length) state = 'retained';
  else if (guidedCorrect.length) state = 'repaired';
  else if (attempts.length) state = 'learning';

  return {
    score: skillScore(profile, skill),
    state,
    mastered,
    attempts: attempts.length,
    independentCorrect: independentCorrect.length,
    independentDays: independentDays.length,
    delayedCorrect: delayedCorrect.length,
    transferCorrect: transferCorrect.length,
    unresolvedMisconception
  };
}

export function learningStateLabel(state) {
  return ({
    new: 'New',
    learning: 'Learning',
    'needs-repair': 'Needs repair',
    repaired: 'Repaired',
    retained: 'Retained',
    'transfer-demonstrated': 'Transfer demonstrated',
    secure: 'Secure'
  })[state] || 'Learning';
}

export function remediationForSelection(item, selected = []) {
  const answers = new Set(Array.isArray(item?.answer) ? item.answer : [item?.answer]);
  const wrongIndex = selected.find(index => !answers.has(index));
  if (!Number.isInteger(wrongIndex)) return null;
  const remediation = item?.remediation?.[wrongIndex];
  return remediation ? { choiceIndex: wrongIndex, ...remediation } : null;
}

function itemPriority(profile, item, index, now, siblingProfile) {
  const lastSeen = (profile?.attempts || []).filter(attempt => attempt.itemId === item.id).at(-1)?.at || 0;
  const siblingSeen = (siblingProfile?.attempts || []).filter(attempt => attempt.itemId === item.id).at(-1)?.at || 0;
  const ownPenalty = lastSeen ? (now - lastSeen < 7 * DAY_MS ? 20 : 8) : 0;
  const siblingPenalty = siblingSeen && now - siblingSeen < SIBLING_ITEM_COOLDOWN_MS ? 100 : 0;
  return ownPenalty + siblingPenalty + index / 1000;
}

function skillNeed(profile, skill, now) {
  const status = skillStatus(profile, skill);
  const dueAt = Number(profile?.skills?.[skill]?.dueAt || 0);
  let need = 100 - status.score;
  if (!status.attempts) need += 20;
  if (!dueAt || dueAt <= now) need += 30;
  if (status.state === 'needs-repair') need += 70;
  else if (status.state === 'repaired') need += 40;
  else if (status.state === 'learning') need += 20;
  else if (status.state === 'secure') need -= 35;
  return Math.max(5, need);
}

export function buildQueue(config, profile, options = {}) {
  const unitId = options.unitId || config.currentUnit;
  const fullYear = options.mode === 'year';
  const pool = config.items.filter(item => fullYear || item.unit === unitId);
  const now = options.now || Date.now();
  const random = options.random || Math.random;
  const siblingProfile = options.siblingProfile || null;
  const bySkill = new Map();

  pool.forEach((item, index) => {
    if (!bySkill.has(item.skill)) bySkill.set(item.skill, []);
    bySkill.get(item.skill).push({ item, index });
  });

  const lanes = [...bySkill.entries()].map(([skill, entries]) => ({
    skill,
    entries,
    need: skillNeed(profile, skill, now)
  }));

  const selected = [];
  const picks = new Map();
  let guard = 0;
  while (selected.length < SESSION_TARGET && guard < Math.max(1, pool.length * 5)) {
    const candidates = lanes.map(lane => {
      const available = lane.entries.filter(entry => !selected.includes(entry.item.id));
      if (!available.length) return null;
      const count = picks.get(lane.skill) || 0;
      return { lane, available, effectiveNeed: lane.need / (1 + count * 0.7) };
    }).filter(Boolean).sort((a, b) => b.effectiveNeed - a.effectiveNeed || a.lane.skill.localeCompare(b.lane.skill));

    if (!candidates.length) break;
    const chosen = candidates[0];
    const ranked = shuffle(chosen.available, random).sort((a, b) => itemPriority(profile, a.item, a.index, now, siblingProfile) - itemPriority(profile, b.item, b.index, now, siblingProfile));
    selected.push(ranked[0].item.id);
    picks.set(chosen.lane.skill, (picks.get(chosen.lane.skill) || 0) + 1);
    guard += 1;
  }
  return selected;
}

export function validateCurriculum(config) {
  const unitIds = new Set(config.units.map(unit => unit.id));
  const ids = new Set();
  config.items.forEach(item => {
    if (!item.id || ids.has(item.id)) throw new Error(`Duplicate or missing item id: ${item.id}`);
    ids.add(item.id);
    if (!unitIds.has(item.unit)) throw new Error(`Unknown unit for ${item.id}`);
    if (!item.skill || !item.standard || !item.prompt || !item.explanation) throw new Error(`Incomplete item: ${item.id}`);
    if (!Array.isArray(item.choices) || item.choices.length < 3) throw new Error(`Item needs choices: ${item.id}`);
    const answers = Array.isArray(item.answer) ? item.answer : [item.answer];
    if (!answers.length || answers.some(answer => !Number.isInteger(answer) || answer < 0 || answer >= item.choices.length)) throw new Error(`Invalid answer: ${item.id}`);
  });
  return true;
}

function stimulusMarkup(stimulus) {
  if (!stimulus) return '';
  let body = stimulus.text ? `<p>${esc(stimulus.text)}</p>` : '';
  if (stimulus.table) body += `<div class="data-scroll"><table><thead><tr>${stimulus.table.headers.map(header => `<th scope="col">${esc(header)}</th>`).join('')}</tr></thead><tbody>${stimulus.table.rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  if (stimulus.flow) body += `<div class="flow-model" aria-label="${esc(stimulus.label || 'Model')}">${stimulus.flow.map((node, index) => `${index ? '<span aria-hidden="true">→</span>' : ''}<strong>${esc(node)}</strong>`).join('')}</div>`;
  if (stimulus.timeline) body += `<ol class="timeline">${stimulus.timeline.map(event => `<li>${esc(event)}</li>`).join('')}</ol>`;
  return `<section class="stimulus" aria-label="${esc(stimulus.label || 'Evidence')}">${stimulus.label ? `<div class="stimulus-label">${esc(stimulus.label)}</div>` : ''}${body}</section>`;
}

export function mountScienceLab(config) {
  validateCurriculum(config);
  const app = document.getElementById(config.mountId || 'app');
  if (!app) throw new Error('Science Lab mount is missing');
  let root = load();
  let learner = null;
  const itemById = new Map(config.items.map(item => [item.id, item]));

  function load() {
    try { return normalizeStore(JSON.parse(localStorage.getItem(config.storageKey) || 'null')); }
    catch (_) { return normalizeStore(null); }
  }
  function save() {
    try { localStorage.setItem(config.storageKey, JSON.stringify(root)); return true; }
    catch (_) { return false; }
  }
  function profile() { return root.learners[learner]; }
  function active() { return root.active[learner]; }
  function siblingProfile() { return root.learners[learner === 'Luke' ? 'Samantha' : 'Luke']; }
  function currentUnit() { return config.units.find(unit => unit.id === config.currentUnit) || config.units[0]; }
  function focusHeading() { requestAnimationFrame(() => app.querySelector('h1,h2')?.focus()); }
  function shell(content) {
    app.innerHTML = `<div class="course-shell"><header class="course-head"><a href="/study/" class="home-link">← Learning Hub</a><div><span>Louisiana Grade 5</span><strong>${esc(config.subject)}</strong></div></header>${content}</div>`;
    focusHeading();
  }
  function resumeCopy(name) { return root.active[name] ? 'Continue your saved investigation' : `Start ${currentUnit().title}`; }

  function renderPicker() {
    shell(`<main class="learner-screen"><p class="eyebrow">${esc(config.eyebrow)}</p><h1 tabindex="-1">${esc(config.title)}</h1><p class="lede">${esc(config.intro)}</p><section class="learner-grid" aria-label="Who is practicing?"><button class="menu-card" data-learner="Luke"><span class="learner-mark luke">L</span><span><strong>Luke</strong><small>${resumeCopy('Luke')}</small></span><b>→</b></button><button class="menu-card" data-learner="Samantha"><span class="learner-mark samantha">S</span><span><strong>Samantha</strong><small>${resumeCopy('Samantha')}</small></span><b>→</b></button></section><p class="coverage-note">${esc(config.coverageLabel)} · progress saved on this device</p></main>`);
  }

  function masteryPill(skill, p) {
    const status = skillStatus(p, skill);
    const level = status.mastered ? 'mastered' : ['repaired', 'retained', 'transfer-demonstrated'].includes(status.state) ? 'growing' : 'learning';
    return `<div data-level="${level}"><strong>${esc(config.skills[skill] || skill)}</strong><span>${esc(learningStateLabel(status.state))}</span></div>`;
  }

  function renderDashboard() {
    const unit = currentUnit();
    const p = profile();
    const unitSkills = unique(config.items.filter(item => item.unit === unit.id).map(item => item.skill));
    const secure = unitSkills.filter(skill => skillStatus(p, skill).mastered).length;
    shell(`<main class="dashboard"><button class="text-button" data-action="switch">← Switch learner</button><p class="eyebrow">${esc(learner)} · recommended next</p><h1 tabindex="-1">${esc(unit.title)}</h1><p class="lede">${esc(unit.summary)}</p><section class="mission-card"><div><span class="mission-tag">Current classroom unit</span><h2>${active() ? 'Continue your investigation' : 'Adaptive science practice'}</h2><p>${active() ? `Resume at question ${active().index + 1}.` : 'Eight prompts weighted toward the ideas that need the strongest independent evidence.'}</p><p class="mission-meta">${secure}/${unitSkills.length} skills secure</p></div><button class="primary-button" data-action="${active() ? 'resume' : 'start'}">${active() ? 'Continue' : 'Start 8 prompts'}</button></section><div class="dashboard-actions"><button class="secondary-button" data-action="units">Choose a unit</button><button class="secondary-button" data-action="year">Full-year review</button></div><section class="mastery-strip" aria-label="Current unit mastery">${unitSkills.map(skill => masteryPill(skill, p)).join('')}</section></main>`);
  }

  function renderUnits() {
    shell(`<main><button class="text-button" data-action="dashboard">← Back</button><p class="eyebrow">Full Louisiana course</p><h1 tabindex="-1">Choose a unit</h1><p class="lede">The current unit stays recommended. Other units are available for assigned work and cumulative review.</p><div class="unit-grid">${config.units.map(unit => { const skills = unique(config.items.filter(item => item.unit === unit.id).map(item => item.skill)); const secure = skills.filter(skill => skillStatus(profile(), skill).mastered).length; return `<button data-unit="${esc(unit.id)}"><span>${unit.id === config.currentUnit ? 'Current' : esc(unit.label)}</span><strong>${esc(unit.title)}</strong><small>${esc(unit.summary)}</small><b>${secure}/${skills.length} skills secure</b></button>`; }).join('')}</div></main>`);
  }

  function startSession(mode = 'unit', unitId = config.currentUnit) {
    const queue = buildQueue(config, profile(), { mode, unitId, siblingProfile: siblingProfile() });
    root.active[learner] = { version: VERSION, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, mode, unitId, queue, index: 0, selected: [], feedback: null, retry: null, results: [], recoveryIds: [] };
    save();
    renderQuestion();
  }

  function renderQuestion() {
    const session = active();
    if (!session || session.index >= session.queue.length) return finishSession();
    const item = itemById.get(session.queue[session.index]);
    if (!item) { session.index += 1; save(); return renderQuestion(); }
    if (session.feedback) return renderFeedback(item);
    const selected = Array.isArray(session.selected) ? session.selected : [];
    const multi = Array.isArray(item.answer);
    const ready = multi ? selected.length === item.answer.length : selected.length === 1;
    const recovery = session.recoveryIds.includes(item.id);
    const hinted = session.retry?.itemId === item.id && session.retry?.mode === 'hinted';
    const evidenceLabel = recovery ? ' · repair recheck' : hinted ? ' · hinted retry' : '';
    const hint = hinted ? `<div class="repair-note"><strong>Hint</strong><span>${esc(session.retry.hint)}</span></div>` : '';
    shell(`<main class="practice-screen"><div class="session-head"><button class="text-button" data-action="pause">← Pause</button><div class="progress-copy"><strong>${session.index + 1} of ${session.queue.length}</strong><span>${esc(item.standard)}</span></div></div><div class="progress-track" aria-label="Investigation progress"><span style="width:${Math.round(session.index / session.queue.length * 100)}%"></span></div><article class="question-card"><p class="skill-label">${esc(config.skills[item.skill] || item.skill)}${evidenceLabel}</p>${stimulusMarkup(item.stimulus)}<h2 tabindex="-1">${esc(item.prompt)}</h2>${hint}<div class="choice-list${multi ? ' multi' : ''}" role="group" aria-label="Answer choices">${item.choices.map((choice, index) => `<button type="button" class="choice${selected.includes(index) ? ' selected' : ''}" data-choice="${index}" aria-pressed="${selected.includes(index)}">${esc(choice)}</button>`).join('')}</div>${multi ? `<p class="select-note">Select ${item.answer.length} answers.</p>` : ''}<button class="primary-button check-button" data-action="check" ${ready ? '' : 'disabled'}>Check answer</button></article></main>`);
  }

  function selectChoice(index) {
    const item = itemById.get(active().queue[active().index]);
    if (Array.isArray(item.answer)) {
      const values = new Set(active().selected || []);
      values.has(index) ? values.delete(index) : values.add(index);
      active().selected = [...values].slice(0, item.answer.length);
    } else active().selected = [index];
    save();
    renderQuestion();
  }

  function checkAnswer() {
    const session = active();
    const item = itemById.get(session.queue[session.index]);
    const expected = (Array.isArray(item.answer) ? item.answer : [item.answer]).slice().sort((a, b) => a - b);
    const selected = (session.selected || []).slice().sort((a, b) => a - b);
    if (selected.length !== expected.length) return;
    const correct = expected.every((value, index) => value === selected[index]);
    const recovery = session.recoveryIds.includes(item.id);
    const hinted = session.retry?.itemId === item.id && session.retry?.mode === 'hinted';
    const provenance = recovery ? 'recovery' : hinted ? 'hinted' : 'independent';
    const remediation = correct && hinted
      ? { tag: session.retry.misconceptionTag, hint: session.retry.hint }
      : remediationForSelection(item, selected);
    const now = Date.now();
    const today = dayKey(new Date(now));
    const priorSkill = profile().skills[item.skill] || {};
    const priorIndependent = profile().attempts.filter(attempt => attempt.skill === item.skill && provenanceOf(attempt) === 'independent').at(-1);
    const delayedRetrieval = provenance === 'independent' && Boolean(priorIndependent) && priorIndependent.date !== today && Number(priorSkill.dueAt || 0) > 0 && Number(priorSkill.dueAt) <= now;
    const attempt = {
      itemId: item.id,
      unit: item.unit,
      skill: item.skill,
      standard: item.standard,
      correct,
      provenance,
      recovery: provenance === 'recovery',
      delayedRetrieval,
      transfer: provenance === 'independent' && Boolean(item.transfer),
      misconceptionTag: remediation?.tag || (hinted ? session.retry?.misconceptionTag : null) || null,
      repairTarget: hinted ? session.retry?.misconceptionTag || null : null,
      date: today,
      at: now,
      sessionId: session.id
    };
    profile().attempts.push(attempt);
    session.results.push(attempt);
    updateSchedule(item.skill, attempt);

    if (correct) {
      session.feedback = { kind: hinted ? 'correct-repair' : 'correct', correct: true, selected, misconceptionTag: attempt.misconceptionTag };
    } else if (provenance === 'independent' && remediation) {
      scheduleRecovery(item, session);
      session.retry = { itemId: item.id, mode: 'hinted', misconceptionTag: remediation.tag, hint: remediation.hint };
      session.feedback = { kind: 'hint', correct: false, selected, misconceptionTag: remediation.tag, hint: remediation.hint };
    } else {
      if (provenance === 'independent') scheduleRecovery(item, session);
      session.feedback = { kind: 'explanation', correct: false, selected, misconceptionTag: attempt.misconceptionTag };
    }

    save();
    renderFeedback(item);
  }

  function updateSchedule(skill, attempt) {
    const status = skillStatus(profile(), skill);
    let delayDays = 0;
    if (attempt.correct) {
      if (attempt.provenance !== 'independent') delayDays = 1;
      else if (status.mastered) delayDays = 7;
      else if (attempt.delayedRetrieval || attempt.transfer) delayDays = 3;
      else delayDays = 1;
    }
    profile().skills[skill] = { dueAt: Date.now() + delayDays * DAY_MS, updatedAt: Date.now() };
  }

  function scheduleRecovery(item, session) {
    const alternatives = config.items.filter(candidate => candidate.unit === item.unit && candidate.skill === item.skill && candidate.id !== item.id);
    let alternative = alternatives.find(candidate => !session.queue.includes(candidate.id));
    if (alternative && session.queue.length < SESSION_MAX) {
      session.queue.splice(Math.min(session.queue.length, session.index + 3), 0, alternative.id);
    } else {
      alternative = alternatives.find(candidate => session.queue.indexOf(candidate.id) > session.index + 1);
      if (!alternative) return;
      const oldIndex = session.queue.indexOf(alternative.id);
      session.queue.splice(oldIndex, 1);
      session.queue.splice(Math.min(session.queue.length, session.index + 3), 0, alternative.id);
    }
    if (!session.recoveryIds.includes(alternative.id)) session.recoveryIds.push(alternative.id);
  }

  function renderFeedback(item) {
    const feedback = active().feedback || {};
    const expected = (Array.isArray(item.answer) ? item.answer : [item.answer]).map(index => item.choices[index]).join(' and ');

    if (feedback.kind === 'hint') {
      shell(`<main class="practice-screen"><div class="progress-track"><span style="width:${Math.round((active().index + 1) / active().queue.length * 100)}%"></span></div><article class="feedback-card repair"><p class="eyebrow">Repair the idea</p><h2 tabindex="-1">Use one clue, then try again.</h2><p>${esc(feedback.hint)}</p><div class="repair-note"><strong>Your first answer is saved.</strong><span>This retry is for learning, so it will not count as independent mastery evidence.</span></div><button class="primary-button" data-action="retry">Try again</button></article></main>`);
      return;
    }

    if (feedback.kind === 'correct-repair') {
      shell(`<main class="practice-screen"><div class="progress-track"><span style="width:${Math.round((active().index + 1) / active().queue.length * 100)}%"></span></div><article class="feedback-card correct"><p class="eyebrow">Repair recorded</p><h2 tabindex="-1">That works.</h2><p>${esc(item.explanation)}</p><div class="repair-note"><strong>The idea is repaired for now.</strong><span>This was a hinted retry. A later independent recheck is still required for Secure.</span></div><button class="primary-button" data-action="next">Continue</button></article></main>`);
      return;
    }

    const correct = Boolean(feedback.correct);
    shell(`<main class="practice-screen"><div class="progress-track"><span style="width:${Math.round((active().index + 1) / active().queue.length * 100)}%"></span></div><article class="feedback-card ${correct ? 'correct' : 'repair'}"><p class="eyebrow">${correct ? 'Evidence recorded' : 'Repair the idea'}</p><h2 tabindex="-1">${correct ? 'Correct.' : `The answer is ${esc(expected)}.`}</h2><p>${esc(item.explanation)}</p>${!correct ? '<div class="repair-note"><strong>You will see this idea again.</strong><span>Later independent recall is still required for Secure.</span></div>' : ''}<button class="primary-button" data-action="next">Continue</button></article></main>`);
  }

  function retryQuestion() {
    const session = active();
    session.selected = [];
    session.feedback = null;
    save();
    renderQuestion();
  }

  function nextQuestion() {
    const session = active();
    session.index += 1;
    session.selected = [];
    session.feedback = null;
    session.retry = null;
    save();
    renderQuestion();
  }

  function finishSession() {
    const session = active();
    if (!session) return renderDashboard();
    const results = session.results || [];
    const independent = results.filter(result => provenanceOf(result) === 'independent');
    const correct = independent.filter(result => result.correct).length;
    const missedSkills = unique(results.filter(result => !result.correct).map(result => result.skill));
    profile().sessions.unshift({ id: session.id, at: new Date().toISOString(), unitId: session.unitId, mode: session.mode, independentCorrect: correct, independentTotal: independent.length, missedSkills });
    delete root.active[learner];
    save();
    shell(`<main class="summary-card"><p class="eyebrow">Investigation complete</p><h1 tabindex="-1">${correct}/${independent.length} independently correct</h1><p class="lede">${missedSkills.length ? 'Missed ideas will receive earlier practice and later independent retrieval.' : 'Clean round. Future practice will include older due ideas and transfer.'}</p>${missedSkills.length ? `<section class="review-list"><h2>Ideas to strengthen</h2>${missedSkills.map(skill => `<div><strong>${esc(config.skills[skill] || skill)}</strong><span>${esc(learningStateLabel(skillStatus(profile(), skill).state))}</span></div>`).join('')}</section>` : ''}<div class="summary-actions"><button class="primary-button" data-action="dashboard">Done</button><button class="secondary-button" data-action="start">Practice again</button></div></main>`);
  }

  app.addEventListener('click', event => {
    const learnerButton = event.target.closest('[data-learner]');
    if (learnerButton) { learner = learnerButton.dataset.learner; active() ? renderQuestion() : renderDashboard(); return; }
    const unitButton = event.target.closest('[data-unit]');
    if (unitButton) { startSession('unit', unitButton.dataset.unit); return; }
    const choice = event.target.closest('[data-choice]');
    if (choice) { selectChoice(Number(choice.dataset.choice)); return; }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'switch') { learner = null; renderPicker(); }
    else if (action === 'dashboard' || action === 'pause') renderDashboard();
    else if (action === 'units') renderUnits();
    else if (action === 'year') startSession('year', config.currentUnit);
    else if (action === 'start') startSession('unit', config.currentUnit);
    else if (action === 'resume') renderQuestion();
    else if (action === 'check') checkAnswer();
    else if (action === 'retry') retryQuestion();
    else if (action === 'next') nextQuestion();
  });

  renderPicker();
  return { getState: () => root, skillStatus: skill => skillStatus(profile(), skill), render: renderPicker };
}
