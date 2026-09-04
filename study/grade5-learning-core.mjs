const VERSION = 1;
const SESSION_TARGET = 8;
const SESSION_MAX = 10;

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const unique = values => [...new Set(values)];
const shuffle = (values, random = Math.random) => values.map(value => [random(), value]).sort((a, b) => a[0] - b[0]).map(pair => pair[1]);

export function blankProfile() {
  return { skills: {}, attempts: [], sessions: [] };
}

export function normalizeStore(raw) {
  const root = raw && raw.version === VERSION ? raw : {};
  const learners = root.learners && typeof root.learners === "object" ? root.learners : {};
  return {
    version: VERSION,
    learners: {
      Luke: normalizeProfile(learners.Luke),
      Samantha: normalizeProfile(learners.Samantha)
    },
    active: root.active && typeof root.active === "object" ? root.active : {}
  };
}

function normalizeProfile(profile) {
  const base = blankProfile();
  if (!profile || typeof profile !== "object") return base;
  base.skills = profile.skills && typeof profile.skills === "object" ? profile.skills : {};
  base.attempts = Array.isArray(profile.attempts) ? profile.attempts.slice(-800) : [];
  base.sessions = Array.isArray(profile.sessions) ? profile.sessions.slice(-60) : [];
  return base;
}

export function skillScore(profile, skill) {
  let score = 40;
  (profile?.attempts || []).filter(attempt => attempt.skill === skill).slice(-10).forEach(attempt => {
    score += attempt.correct ? (attempt.recovery ? 9 : 12) : -18;
    score = Math.max(0, Math.min(100, score));
  });
  return score;
}

export function skillStatus(profile, skill) {
  const attempts = (profile?.attempts || []).filter(attempt => attempt.skill === skill);
  const correct = attempts.filter(attempt => attempt.correct);
  const days = unique(correct.map(attempt => attempt.date));
  const score = skillScore(profile, skill);
  const mastered = score >= 80 && correct.length >= 3 && days.length >= 2;
  return { score, attempts: attempts.length, correct: correct.length, days: days.length, mastered };
}

function itemPriority(profile, item, index, now) {
  const status = skillStatus(profile, item.skill);
  const skill = profile?.skills?.[item.skill] || {};
  const overdue = !skill.dueAt || Number(skill.dueAt) <= now ? -20 : 0;
  const lastSeen = (profile?.attempts || []).filter(attempt => attempt.itemId === item.id).at(-1)?.at || 0;
  return status.score + overdue + Math.min(status.attempts, 6) * 2 + (lastSeen ? 8 : 0) + index / 1000;
}

export function buildQueue(config, profile, options = {}) {
  const unitId = options.unitId || config.currentUnit;
  const fullYear = options.mode === "year";
  const pool = config.items.filter(item => fullYear || item.unit === unitId);
  const now = options.now || Date.now();
  const random = options.random || Math.random;
  const bySkill = new Map();
  pool.forEach((item, index) => {
    if (!bySkill.has(item.skill)) bySkill.set(item.skill, []);
    bySkill.get(item.skill).push({ item, index });
  });
  const skills = [...bySkill.entries()].map(([skill, entries]) => ({
    skill,
    entries,
    score: skillScore(profile, skill),
    priority: Math.min(...entries.map(entry => itemPriority(profile, entry.item, entry.index, now)))
  })).sort((a, b) => a.priority - b.priority || a.skill.localeCompare(b.skill));
  const selected = [];
  let round = 0;
  while (selected.length < SESSION_TARGET && skills.length) {
    const lane = skills[round % skills.length];
    const ranked = shuffle(lane.entries, random).sort((a, b) => itemPriority(profile, a.item, a.index, now) - itemPriority(profile, b.item, b.index, now));
    const candidate = ranked.find(entry => !selected.includes(entry.item.id));
    if (candidate) selected.push(candidate.item.id);
    round += 1;
    if (round > pool.length * 3) break;
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
  if (!stimulus) return "";
  let body = stimulus.text ? `<p>${esc(stimulus.text)}</p>` : "";
  if (stimulus.table) {
    body += `<div class="data-scroll"><table><thead><tr>${stimulus.table.headers.map(header => `<th scope="col">${esc(header)}</th>`).join("")}</tr></thead><tbody>${stimulus.table.rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  if (stimulus.flow) body += `<div class="flow-model" aria-label="${esc(stimulus.label || "Model")}">${stimulus.flow.map((node, index) => `${index ? '<span aria-hidden="true">→</span>' : ""}<strong>${esc(node)}</strong>`).join("")}</div>`;
  if (stimulus.timeline) body += `<ol class="timeline">${stimulus.timeline.map(event => `<li>${esc(event)}</li>`).join("")}</ol>`;
  return `<section class="stimulus" aria-label="${esc(stimulus.label || "Evidence")}">${stimulus.label ? `<div class="stimulus-label">${esc(stimulus.label)}</div>` : ""}${body}</section>`;
}

export function mountGrade5Learning(config) {
  validateCurriculum(config);
  const app = document.getElementById(config.mountId || "app");
  if (!app) throw new Error("Grade 5 learning mount is missing");
  let root = load();
  let learner = null;
  let screen = "picker";
  const itemById = new Map(config.items.map(item => [item.id, item]));

  function load() {
    try { return normalizeStore(JSON.parse(localStorage.getItem(config.storageKey) || "null")); }
    catch (_) { return normalizeStore(null); }
  }

  function save() {
    try { localStorage.setItem(config.storageKey, JSON.stringify(root)); return true; }
    catch (_) { return false; }
  }

  function profile() { return root.learners[learner]; }
  function active() { return root.active[learner]; }
  function focusHeading() { requestAnimationFrame(() => app.querySelector("h1,h2")?.focus()); }
  function setScreen(next) { screen = next; document.body.dataset.learningScreen = next; }

  function shell(content) {
    app.innerHTML = `<div class="course-shell"><header class="course-head"><a href="/study/" class="home-link">← Learning Hub</a><div><span>Louisiana Grade 5</span><strong>${esc(config.subject)}</strong></div></header>${content}</div>`;
    focusHeading();
  }

  function renderPicker() {
    setScreen("picker");
    shell(`<main class="learner-screen"><p class="eyebrow">${esc(config.eyebrow)}</p><h1 tabindex="-1">${esc(config.title)}</h1><p class="lede">${esc(config.intro)}</p><section class="learner-grid" aria-label="Who is practicing?"><button class="menu-card" data-learner="Luke"><span class="learner-mark luke">L</span><span><strong>Luke</strong><small>${resumeCopy("Luke")}</small></span><b>→</b></button><button class="menu-card" data-learner="Samantha"><span class="learner-mark samantha">S</span><span><strong>Samantha</strong><small>${resumeCopy("Samantha")}</small></span><b>→</b></button></section><p class="coverage-note">${config.coverageLabel || `${config.units.length} units · ${unique(config.items.map(item => item.standard)).length} standards`} · progress saved on this device</p></main>`);
  }

  function resumeCopy(name) { return root.active[name] ? "Continue your saved mission" : `Start ${currentUnit().title}`; }
  function currentUnit() { return config.units.find(unit => unit.id === config.currentUnit) || config.units[0]; }

  function renderDashboard() {
    setScreen("dashboard");
    const unit = currentUnit();
    const p = profile();
    const unitSkills = unique(config.items.filter(item => item.unit === unit.id).map(item => item.skill));
    const secure = unitSkills.filter(skill => skillStatus(p, skill).mastered).length;
    shell(`<main class="dashboard"><button class="text-button" data-action="switch">← Switch learner</button><p class="eyebrow">${esc(learner)} · recommended next</p><h1 tabindex="-1">${esc(unit.title)}</h1><p class="lede">${esc(unit.summary)}</p><section class="mission-card"><div><span class="mission-tag">Current classroom unit</span><h2>${active() ? "Continue your mission" : "Adaptive practice"}</h2><p>${active() ? `Resume at question ${active().index + 1}.` : "Eight questions chosen from the skills that need the strongest evidence."}</p><p class="mission-meta">${secure}/${unitSkills.length} skills secure</p></div><button class="primary-button" data-action="${active() ? "resume" : "start"}">${active() ? "Continue" : "Start 8 questions"}</button></section><div class="dashboard-actions"><button class="secondary-button" data-action="units">Choose a unit</button><button class="secondary-button" data-action="year">Full-year review</button></div><section class="mastery-strip" aria-label="Current unit mastery">${unitSkills.map(skill => masteryPill(skill, p)).join("")}</section></main>`);
  }

  function masteryPill(skill, p) {
    const status = skillStatus(p, skill);
    const label = config.skills[skill] || skill;
    return `<div data-level="${status.mastered ? "mastered" : status.score >= 65 ? "growing" : "learning"}"><strong>${esc(label)}</strong><span>${status.mastered ? "Secure" : status.score >= 65 ? "Growing" : "Learning"}</span></div>`;
  }

  function renderUnits() {
    setScreen("units");
    shell(`<main><button class="text-button" data-action="dashboard">← Back</button><p class="eyebrow">Full Louisiana course</p><h1 tabindex="-1">Choose a unit</h1><p class="lede">The current unit stays recommended. Other units are available for assigned work and cumulative review.</p><div class="unit-grid">${config.units.map(unit => { const skills = unique(config.items.filter(item => item.unit === unit.id).map(item => item.skill)); const secure = skills.filter(skill => skillStatus(profile(), skill).mastered).length; return `<button data-unit="${esc(unit.id)}"><span>${unit.id === config.currentUnit ? "Current" : esc(unit.label)}</span><strong>${esc(unit.title)}</strong><small>${esc(unit.summary)}</small><b>${secure}/${skills.length} skills secure</b></button>`; }).join("")}</div></main>`);
  }

  function startSession(mode = "unit", unitId = config.currentUnit) {
    const queue = buildQueue(config, profile(), { mode, unitId });
    root.active[learner] = { version: 1, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, mode, unitId, queue, index: 0, selected: [], feedback: null, results: [], recoveryIds: [] };
    save();
    renderQuestion();
  }

  function renderQuestion() {
    const session = active();
    if (!session || session.index >= session.queue.length) return finishSession();
    setScreen("question");
    const item = itemById.get(session.queue[session.index]);
    if (!item) { session.index += 1; save(); return renderQuestion(); }
    if (session.feedback) return renderFeedback(item, Boolean(session.feedback.correct));
    const selected = Array.isArray(session.selected) ? session.selected : [];
    const multi = Array.isArray(item.answer);
    const completed = session.index;
    const ready = multi ? selected.length === item.answer.length : selected.length === 1;
    shell(`<main class="practice-screen"><div class="session-head"><button class="text-button" data-action="pause">← Pause</button><div class="progress-copy"><strong>${completed + 1} of ${session.queue.length}</strong><span>${esc(item.standard)}</span></div></div><div class="progress-track" aria-label="Mission progress"><span style="width:${Math.round(completed / session.queue.length * 100)}%"></span></div><article class="question-card"><p class="skill-label">${esc(config.skills[item.skill] || item.skill)}${session.recoveryIds.includes(item.id) ? " · independent recheck" : ""}</p>${stimulusMarkup(item.stimulus)}<h2 tabindex="-1">${esc(item.prompt)}</h2><div class="choice-list${multi ? " multi" : ""}" role="group" aria-label="Answer choices">${item.choices.map((choice, index) => `<button type="button" class="choice${selected.includes(index) ? " selected" : ""}" data-choice="${index}" aria-pressed="${selected.includes(index)}">${esc(choice)}</button>`).join("")}</div>${multi ? `<p class="select-note">Select ${item.answer.length} answers.</p>` : ""}<button class="primary-button check-button" data-action="check" ${ready ? "" : "disabled"}>Check answer</button></article></main>`);
  }

  function selectChoice(index) {
    const item = itemById.get(active().queue[active().index]);
    const multi = Array.isArray(item.answer);
    if (multi) {
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
    const attempt = { itemId: item.id, unit: item.unit, skill: item.skill, standard: item.standard, correct, recovery, date: dayKey(), at: Date.now(), sessionId: session.id };
    profile().attempts.push(attempt);
    session.results.push(attempt);
    updateSkillSchedule(item.skill, correct);
    if (!correct && session.queue.length < SESSION_MAX) scheduleRecovery(item, session);
    session.feedback = { correct, selected };
    save();
    renderFeedback(item, correct);
  }

  function updateSkillSchedule(skill, correct) {
    const status = skillStatus(profile(), skill);
    const delayDays = correct ? (status.mastered ? 7 : status.score >= 65 ? 3 : 1) : 0;
    profile().skills[skill] = { dueAt: Date.now() + delayDays * 86400000, updatedAt: Date.now() };
  }

  function scheduleRecovery(item, session) {
    const alternatives = config.items.filter(candidate => candidate.unit === item.unit && candidate.skill === item.skill && candidate.id !== item.id && !session.queue.includes(candidate.id));
    const alternative = alternatives[0];
    if (!alternative) return;
    const insertAt = Math.min(session.queue.length, session.index + 3);
    session.queue.splice(insertAt, 0, alternative.id);
    session.recoveryIds.push(alternative.id);
  }

  function renderFeedback(item, correct) {
    setScreen("feedback");
    const expected = (Array.isArray(item.answer) ? item.answer : [item.answer]).map(index => item.choices[index]).join(" and ");
    shell(`<main class="practice-screen"><div class="progress-track"><span style="width:${Math.round((active().index + 1) / active().queue.length * 100)}%"></span></div><article class="feedback-card ${correct ? "correct" : "repair"}"><p class="eyebrow">${correct ? "Evidence recorded" : "Repair the idea"}</p><h2 tabindex="-1">${correct ? "Correct." : `The answer is ${esc(expected)}.`}</h2><p>${esc(item.explanation)}</p>${!correct ? `<div class="repair-note"><strong>You will see this skill again.</strong><span>The recheck uses different evidence, so remembering this answer is not enough.</span></div>` : ""}<button class="primary-button" data-action="next">Continue</button></article></main>`);
  }

  function nextQuestion() {
    const session = active();
    session.index += 1;
    session.selected = [];
    session.feedback = null;
    save();
    renderQuestion();
  }

  function finishSession() {
    const session = active();
    if (!session) return renderDashboard();
    const results = session.results || [];
    const correct = results.filter(result => result.correct).length;
    const missedSkills = unique(results.filter(result => !result.correct).map(result => result.skill));
    profile().sessions.unshift({ id: session.id, at: new Date().toISOString(), unitId: session.unitId, mode: session.mode, correct, total: results.length, missedSkills });
    delete root.active[learner];
    save();
    setScreen("summary");
    shell(`<main class="summary-card"><p class="eyebrow">Mission complete</p><h1 tabindex="-1">${correct}/${results.length} independently correct</h1><p class="lede">${missedSkills.length ? "The missed skills are now scheduled earlier in future practice." : "Clean round. The next session will use new evidence and older due skills."}</p>${missedSkills.length ? `<section class="review-list"><h2>Skills to strengthen</h2>${missedSkills.map(skill => `<div><strong>${esc(config.skills[skill] || skill)}</strong><span>${skillStatus(profile(), skill).score}/100 evidence strength</span></div>`).join("")}</section>` : ""}<div class="summary-actions"><button class="primary-button" data-action="dashboard">Done</button><button class="secondary-button" data-action="start">Practice again</button></div></main>`);
  }

  app.addEventListener("click", event => {
    const learnerButton = event.target.closest("[data-learner]");
    if (learnerButton) { learner = learnerButton.dataset.learner; active() ? renderQuestion() : renderDashboard(); return; }
    const unitButton = event.target.closest("[data-unit]");
    if (unitButton) { startSession("unit", unitButton.dataset.unit); return; }
    const choice = event.target.closest("[data-choice]");
    if (choice) { selectChoice(Number(choice.dataset.choice)); return; }
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "switch") { learner = null; renderPicker(); }
    else if (action === "dashboard" || action === "pause") renderDashboard();
    else if (action === "units") renderUnits();
    else if (action === "year") startSession("year", config.currentUnit);
    else if (action === "start") startSession("unit", config.currentUnit);
    else if (action === "resume") renderQuestion();
    else if (action === "check") checkAnswer();
    else if (action === "next") nextQuestion();
  });

  renderPicker();
  return { getState: () => root, skillStatus: skill => skillStatus(profile(), skill), render: renderPicker };
}
