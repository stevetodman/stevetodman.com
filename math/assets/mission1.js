import { MICRO_SKILLS, diagnostic, isCorrectAnswer, normalize, scoreComponents } from "./mission1-content.mjs?v=20260905-validity1";
import { generateCurrentWeekQuestion } from "./mission1-current-week.mjs?v=20260905-validity1";
import { PRACTICE_TARGET, RECHECK_VERSION, SESSION_LANES, diagnosticIsCurrent, difficultyForScore, migrateAffectedRechecks, microScore, pendingRechecks, projectedScore, selectNextTarget, updateMasteryAwards } from "./mission1-adaptive.mjs?v=20260905-validity1";
import { buildDivisionTestRun, divisionReadiness, divisionTargetStats } from "./mission1-division-assessment.mjs?v=20260905-validity1";
import { EVIDENCE_VERSION, DAY_MS, enrichQuestion, latestInstructionAt } from "./mission1-evidence.mjs?v=20260905-validity1";
import { createScratchpad } from "./mission1-scratch.mjs?v=20260901-mastery1";
import { createPlaceValueWorkspace } from "./mission1-place-value.mjs?v=20260901-mastery1";
import { TEACHER_WEEK } from "./teacher-week.mjs?v=20260905-validity1";
import { diagnoseMathError, diagnosisWithHistory, makeRepairQuestion } from "./mission1-error-diagnosis.mjs?v=20260905-validity1";

"use strict";
(() => {
  const KEY = "mathmission.m1.v1";
  const ACTIVE_LIMIT_MS = 10 * 60 * 1000;
  const state = { profile: null, mode: null, queue: [], index: 0, correct: 0, results: [], selected: null, componentSelected: {}, independentCount: 0, repairQueue: [], recoveries: [], recentMicros: [], recentTargets: [], recentArchetypes: [], sessionFailures: {}, answered: false, sessionId: null, seedState: 0, ordinal: 0, submittedQuestionIds: [], activeMs: 0, activeStartedAt: 0, stopAfterRepair: false, transferCount: 0 };
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const stripHtml = value => String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  function localDate(at = Date.now()) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(at));
    const get = type => parts.find(part => part.type === type)?.value;
    return `${get("year")}-${get("month")}-${get("day")}`;
  }
  const emptyProfile = () => ({ diagnostic: false, diagnosticVersion: 0, attempts: [], sessions: 0, testRuns: 0, recheckVersion: RECHECK_VERSION, rechecks: {}, masteryAwards: {}, activeSession: null });
  const weeklyDiagnostic = () => diagnostic().filter(question => TEACHER_WEEK.diagnosticMicros.includes(question.micro));
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} }
  function pdata() { const all = load(); return all[state.profile] || emptyProfile(); }
  function update(fn) { const all = load(), profile = all[state.profile] || emptyProfile(); profile.attempts = Array.isArray(profile.attempts) ? profile.attempts : []; fn(profile); updateMasteryAwards(profile); all[state.profile] = profile; save(all); }
  function profileWithRepairs() { let profile; update(next => { migrateAffectedRechecks(next); profile = next; }); return profile; }
  function profileName() { return state.profile === "luke" ? "Luke" : "Samantha"; }
  function show(id) {
    $$(".screen").forEach(screen => screen.classList.toggle("active", screen.id === id));
    if (id !== "session") $("#session")?.removeAttribute("data-assessment-mode");
    scrollTo({ top: 0, behavior: "smooth" });
    const heading = document.querySelector(`#${id} h1, #${id} h2`);
    if (heading) { heading.tabIndex = -1; requestAnimationFrame(() => heading.focus({ preventScroll: true })); }
  }
  function currentQuestion() { return state.queue[state.index]; }
  function nextSeed() { state.seedState = (Math.imul(1664525, state.seedState >>> 0) + 1013904223) >>> 0; return state.seedState; }
  function seededRandom(seed) { let value = seed >>> 0; return () => { value = (Math.imul(1664525, value) + 1013904223) >>> 0; return value / 0x100000000; }; }
  function accumulateActiveTime() {
    if (!state.activeStartedAt || document.hidden || state.mode === "test") return;
    const now = Date.now();
    state.activeMs += Math.max(0, Math.min(60000, now - state.activeStartedAt));
    state.activeStartedAt = now;
  }
  function beginActiveTime() { if (!document.hidden && state.mode && state.mode !== "test") state.activeStartedAt = Date.now(); }
  function sessionSnapshot() {
    const copy = {};
    for (const key of Object.keys(state)) if (key !== "profile") copy[key] = state[key];
    return copy;
  }
  function persistSession() {
    if (!state.profile || !state.mode) return;
    accumulateActiveTime();
    update(profile => { profile.activeSession = sessionSnapshot(); });
  }
  function clearActiveSession() { update(profile => { profile.activeSession = null; }); }

  const scratchpad = createScratchpad({ panel: $("#scratch-panel"), body: $("#scratch-body"), toggle: $("#scratch-toggle"), canvas: $("#scratch-canvas"), clear: $("#scratch-clear"), undo: $("#scratch-undo"), guide: $("#scratch-guide") });
  const placeValue = createPlaceValueWorkspace({ root: $("#place-value-workspace"), onGuidedReady() { const question = currentQuestion(); if (!question?.assisted) return; const input = $("#answer-input"); if (input) input.disabled = false; $("#check-button").disabled = false; $("#answer-form").classList.remove("guided-locked"); setTimeout(() => input?.focus(), 0); } });

  function picker() {
    const all = load();
    $$(".profile").forEach(button => { const profile = all[button.dataset.profile], status = button.querySelector(".profile-status"); status.textContent = profile?.activeSession ? "Continue saved mission" : diagnosticIsCurrent(profile) ? "Ready for today’s mission" : "Start with a quick check"; });
    show("picker");
  }

  function dashboard() {
    const profile = profileWithRepairs(), name = profileName(), current = diagnosticIsCurrent(profile), card = $("#primary-card"), active = profile.activeSession;
    $("#learner-pill").textContent = name;
    $("#hello").textContent = `Ready, ${name}?`;
    if (active?.mode) {
      const label = active.mode === "test" ? "Test run" : active.mode === "diagnostic" ? "Starting check" : "Today’s mission";
      card.innerHTML = `<div class="label">Saved · ${TEACHER_WEEK.label}</div><h2>Continue ${label.toLowerCase()}</h2><p class="mission-meta">Your place and completed answers are saved.</p><button class="primary-button" data-resume>Continue</button><button class="back" data-discard-session style="margin-top:10px">Start over</button>`;
    } else if (!current) {
      const checkCount = weeklyDiagnostic().length;
      card.innerHTML = `<div class="label">First mission · ${TEACHER_WEEK.label}</div><h2>Quick starting check</h2><p class="mission-meta">${checkCount} questions · current class material only</p><p>This checks the ideas needed for this week so Math Mission knows what to explain and practice.</p><button class="primary-button" data-start="diagnostic">Start</button>`;
    } else {
      card.innerHTML = `<div class="label">Current focus · ${TEACHER_WEEK.label}</div><h2>${TEACHER_WEEK.title}</h2><p class="mission-meta">${PRACTICE_TARGET} independent questions · about 10 minutes</p><p>${TEACHER_WEEK.summary}</p><button class="primary-button" data-start="practice">Start today’s mission</button><button class="primary-button" data-start="test" style="margin-top:10px">Test run · 12 questions</button>`;
    }
    show("dashboard");
  }

  function prepareQuestion(question, seed = nextSeed()) {
    state.ordinal += 1;
    return enrichQuestion(question, { sessionId: state.sessionId, ordinal: state.ordinal, seed });
  }
  function seenRecently(question) {
    const recent = Date.now() - 7 * DAY_MS;
    return [...(pdata().attempts || []), ...state.results].some(attempt => attempt.fingerprint === question.fingerprint && Number(attempt.at) >= recent);
  }
  function generateFresh(factory) {
    let last;
    for (let tries = 0; tries < 20; tries += 1) {
      const seed = nextSeed();
      last = prepareQuestion(factory(seededRandom(seed)), seed);
      if (!seenRecently(last)) return last;
    }
    return null;
  }
  function buildFreshTest(profile) {
    for (let tries = 0; tries < 20; tries += 1) {
      const seeds = Array.from({ length: 12 }, () => nextSeed());
      const questions = buildDivisionTestRun(Math.random, { completedRuns: profile.testRuns || 0, itemRandoms: seeds.map(seed => seededRandom(seed)) }).map((question, index) => prepareQuestion(question, seeds[index]));
      const fingerprints = new Set(questions.map(question => question.fingerprint));
      if (fingerprints.size === questions.length && questions.every(question => !seenRecently(question))) return questions;
    }
    throw new Error("No fresh Test Run items are currently available.");
  }
  function newSession(mode) {
    const profile = profileWithRepairs(), now = Date.now();
    Object.assign(state, { mode, queue: [], index: 0, correct: 0, results: [], selected: null, componentSelected: {}, independentCount: 0, repairQueue: [], recoveries: [], recentMicros: [], recentTargets: [], recentArchetypes: [], sessionFailures: {}, answered: false, sessionId: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`, seedState: (now ^ Math.floor(Math.random() * 0xffffffff)) >>> 0, ordinal: 0, submittedQuestionIds: [], activeMs: 0, activeStartedAt: 0, stopAfterRepair: false, transferCount: 0 });
    if (mode === "diagnostic") state.queue = weeklyDiagnostic().map(question => prepareQuestion(question));
    else if (mode === "test") state.queue = buildFreshTest(profile);
    else { const first = nextAdaptiveQuestion(); if (first) state.queue.push(first); }
  }
  function restoreSession(saved) {
    const defaults = { queue: [], results: [], repairQueue: [], recoveries: [], recentMicros: [], recentTargets: [], recentArchetypes: [], sessionFailures: {}, submittedQuestionIds: [], componentSelected: {} };
    Object.assign(state, defaults, saved, { answered: !!saved.answered, activeStartedAt: 0 });
  }
  function enterSession() {
    if (state.mode === "test") $("#session").dataset.assessmentMode = "true";
    else $("#session").removeAttribute("data-assessment-mode");
    beginActiveTime();
    show("session");
    if (state.mode === "test") $("#session").dataset.assessmentMode = "true";
    renderQuestion();
    persistSession();
  }
  function start(mode) { newSession(mode); enterSession(); }
  function resume() {
    const saved = pdata().activeSession;
    if (!saved?.mode) return dashboard();
    restoreSession(saved);
    // A submission is committed before its feedback screen is shown. If the tab
    // closed there, resume at the next durable boundary instead of rendering a
    // disabled copy of the already-submitted question.
    if (state.answered || state.submittedQuestionIds.includes(currentQuestion()?.questionId)) {
      state.index += 1;
      state.answered = false;
      if ((state.mode === "diagnostic" || state.mode === "test") && state.index >= state.queue.length) return finish();
      if (state.mode === "practice" && shouldFinishPractice()) return finish();
      if (state.mode === "practice" && state.index >= state.queue.length) {
        const question = nextAdaptiveQuestion();
        if (!question) return finish();
        state.queue.push(question);
      }
    }
    enterSession();
  }

  function laneForMicro(micro) { return micro === "decimal_divide" ? "focus" : TEACHER_WEEK.maintenanceMicros.includes(micro) ? "maintenance" : "retrieval"; }
  function targetDifficulty(profile, choice) {
    if (choice.micro !== "decimal_divide") return difficultyForScore(microScore(profile, choice.micro));
    const stats = divisionTargetStats(profile, choice.target);
    if (!stats.attempts) return microScore(profile, "decimal_divide") >= 75 ? 2 : 1;
    return difficultyForScore(stats.score);
  }
  function nextAdaptiveQuestion() {
    const profile = profileWithRepairs();
    if (state.repairQueue.length) return state.repairQueue.shift();
    const lane = SESSION_LANES[Math.min(state.independentCount, SESSION_LANES.length - 1)];
    const recoveryIndex = state.recoveries.findIndex(recovery => recovery.availableAfter <= state.independentCount && (lane === "retrieval" || laneForMicro(recovery.micro) === lane) && Number(state.sessionFailures[recovery.target]) < 2);
    if (recoveryIndex >= 0) {
      const [recovery] = state.recoveries.splice(recoveryIndex, 1);
      const recovered = generateFresh(random => generateCurrentWeekQuestion(recovery.micro, Math.max(1, recovery.difficulty - 1), random, { recovery: true, assessmentArchetype: recovery.assessmentArchetype }));
      return recovered ? { ...recovered, recoveryOf: recovery.sourceId } : null;
    }
    const choice = selectNextTarget(profile, { independentCount: state.independentCount, recentTargets: state.recentTargets, recentMicros: state.recentMicros, sessionFailures: state.sessionFailures });
    if (!choice) return null;
    let selected = choice;
    const readiness = divisionReadiness(profile), transferBudget = readiness.ready === readiness.total ? 4 : 2;
    let question = generateFresh(random => generateCurrentWeekQuestion(selected.micro, targetDifficulty(profile, selected), random, { assessmentArchetype: selected.archetype }));
    if (question && pendingRechecks(profile).includes(selected.micro)) question.recheck = true;
    if (question && question.transferKind !== "routine" && state.transferCount >= transferBudget && selected.micro === "decimal_divide") {
      selected = { micro: "decimal_divide", target: "division_algorithm", archetype: "division_algorithm" };
      question = generateFresh(random => generateCurrentWeekQuestion(selected.micro, targetDifficulty(profile, selected), random, { assessmentArchetype: selected.archetype }));
    }
    if (question?.transferKind !== "routine") state.transferCount += 1;
    return question;
  }

  function componentMarkup(part) {
    const id = escapeHtml(part.id), label = escapeHtml(part.label);
    if (part.options) return `<fieldset class="component-field" data-component="${id}"><legend>${label}</legend><div class="choice-grid">${part.options.map(option => `<button class="choice component-choice" type="button" data-component-id="${id}" data-component-value="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("")}</div></fieldset>`;
    return `<label class="component-field"><span class="answer-label">${label}</span><input class="answer-input component-input" data-component-id="${id}" inputmode="${escapeHtml(part.inputmode || "decimal")}" autocomplete="off" placeholder="${escapeHtml(part.placeholder || "Number only")}"></label>`;
  }
  function renderQuestion() {
    const question = currentQuestion();
    if (!question) return finish();
    state.selected = null; state.componentSelected = {}; state.answered = !!state.submittedQuestionIds.includes(question.questionId);
    if (!state.answered) { state.recentMicros.push(question.micro); state.recentTargets.push(question.target || question.micro); if (question.assessmentArchetype) state.recentArchetypes.push(question.assessmentArchetype); }
    const assessment = state.mode === "test";
    const stateLabel = assessment ? "" : question.repairOnly ? " · Quick fix" : question.assisted ? " · Guided" : question.recovery ? " · Try again" : question.recheck ? " · Check again" : "";
    $("#skill-tag").textContent = assessment ? "Independent test" : `${MICRO_SKILLS[question.micro].name}${stateLabel}`;
    $("#question-title").textContent = assessment || state.mode === "diagnostic" ? `Question ${state.index + 1} of ${state.queue.length}` : question.repairOnly ? "Quick fix" : question.assisted ? "Guided example" : question.recovery ? "Try it again" : question.recheck ? "Check it again" : `Question ${Math.min(state.independentCount + 1, PRACTICE_TARGET)}`;
    $("#question-body").innerHTML = question.prompt;
    const scaffold = $("#scaffold-note"), workspaceOwnsScaffold = question.workspace?.type === "place-value";
    scaffold.hidden = assessment || !question.scaffoldText || workspaceOwnsScaffold; scaffold.textContent = assessment ? "" : question.scaffoldText;
    const area = $("#answer-area"), guidedWorkspace = !!question.assisted && workspaceOwnsScaffold;
    if (question.components?.length) area.innerHTML = `<div class="component-stack">${question.components.map(componentMarkup).join("")}</div>`;
    else if (question.options) area.innerHTML = `<div class="choice-grid">${question.options.map(option => `<button class="choice" type="button" data-value="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("")}</div>`;
    else { const keyboard = String(question.answer).includes("+") ? "text" : "decimal"; area.innerHTML = `<label id="answer-label" class="answer-label" for="answer-input">${guidedWorkspace ? "Use the model first, then type the answer" : "Your answer"}</label><input id="answer-input" class="answer-input" inputmode="${keyboard}" enterkeyhint="done" autocomplete="off" placeholder="${escapeHtml(question.placeholder)}" ${guidedWorkspace ? "disabled aria-describedby=\"guided-answer-help\"" : ""}>${guidedWorkspace ? '<span id="guided-answer-help" class="sr-only">Use the place-value chart. The answer box will unlock when the model is ready.</span>' : ""}`; }
    $("#check-button").disabled = guidedWorkspace; $("#answer-form").classList.toggle("guided-locked", guidedWorkspace); $("#answer-form").hidden = false; $("#feedback").hidden = true; $("#feedback").className = "feedback";
    placeValue.setQuestion(assessment ? { ...question, workspace: null } : question); scratchpad.setQuestion(question); renderProgress();
    if (!question.options && !question.components && !guidedWorkspace) setTimeout(() => $("#answer-input")?.focus(), 50);
    persistSession();
  }
  function renderProgress() {
    const question = currentQuestion(), fixed = state.mode === "diagnostic" || state.mode === "test", count = fixed ? state.queue.length : PRACTICE_TARGET;
    const completed = fixed ? Math.min(state.index + (state.answered ? 1 : 0), count) : Math.min(state.independentCount, count);
    $("#progress-text").textContent = fixed ? state.answered ? `${completed} of ${count} complete` : `${Math.min(state.index + 1, count)} of ${count}` : question?.assisted || state.answered ? `${completed} of ${count} complete` : `${Math.min(completed + 1, count)} of ${count}`;
    $("#session-mode").textContent = state.mode === "test" ? "Independent test" : state.mode === "diagnostic" ? "Starting check" : question?.repairOnly ? "Quick misconception check" : question?.assisted ? "Guided step" : question?.recovery ? "Independent retry" : question?.recheck ? "Independent recheck" : "Independent";
    $("#progress-fill").style.width = `${Math.round(completed / count * 100)}%`;
  }
  function collectResponse(question) {
    if (question.components?.length) {
      const response = {};
      for (const part of question.components) response[part.id] = part.options ? state.componentSelected[part.id] : $(`.component-input[data-component-id="${CSS.escape(part.id)}"]`)?.value;
      return response;
    }
    return question.options ? state.selected : $("#answer-input")?.value;
  }
  const validNumber = value => /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(String(value ?? "").trim()) && Number.isFinite(Number(value));
  function completeResponse(raw, question) {
    if (question.components?.length) return question.components.every(part => {
      const value = String(raw?.[part.id] ?? "").trim();
      return !!value && (part.options || part.inputmode !== "decimal" || validNumber(value));
    });
    const value = String(raw ?? "").trim();
    return !!value && (question.options || String(question.answer).includes("+") || validNumber(value));
  }
  function createRepairSequence(question, diagnosis) {
    const first = prepareQuestion(makeRepairQuestion(question, diagnosis));
    const second = generateFresh(random => generateCurrentWeekQuestion(question.micro, Math.max(1, Number(question.difficulty) - 1), random, { assisted: true, assessmentArchetype: question.assessmentArchetype }));
    return [first, second].filter(Boolean).map(repairQuestion => ({ ...repairQuestion, recoveryOf: question.questionId }));
  }
  function latestFourFailureStop() {
    const independent = state.results.filter(result => !result.assisted && !result.repairOnly).slice(-4);
    return independent.length === 4 && independent.filter(result => !result.correct).length >= 3;
  }

  function submit(event) {
    event.preventDefault();
    const question = currentQuestion();
    if (!question || state.answered || state.submittedQuestionIds.includes(question.questionId)) return;
    if (question.assisted && question.workspace && !placeValue.isReady()) return;
    const raw = collectResponse(question);
    if (!completeResponse(raw, question)) { announce("Choose or enter every answer first.", "bad"); return; }
    const componentScore = question.components?.length ? scoreComponents(raw, question) : null;
    const correct = question.repairOnly ? normalize(raw) === normalize(question.answer) : componentScore ? componentScore.correct : isCorrectAnswer(raw, question);
    const profileBefore = pdata();
    const diagnosis = !correct && !question.repairOnly ? diagnosisWithHistory(profileBefore, diagnoseMathError(raw, question), question) : null;
    const at = Date.now(), target = question.target || question.micro, instructionAt = question.assisted || question.repairOnly ? at : latestInstructionAt(profileBefore, target, at);
    const attempt = { evidenceVersion: EVIDENCE_VERSION, sessionId: state.sessionId, questionId: question.questionId, itemVersion: question.itemVersion || 1, seed: question.seed, familyId: question.familyId, fingerprint: question.fingerprint, skill: question.skill, micro: question.micro, target, assessmentArchetype: question.assessmentArchetype || null, correct, assisted: !!question.assisted, recovery: !!question.recovery, recheck: !!question.recheck, difficulty: Number(question.difficulty) || 1, transferKind: question.transferKind || "routine", transfer: question.transferKind !== "routine" && !question.assisted, representation: question.representation || "symbolic", contextStructure: question.contextStructure || "none", scaffoldShown: !!question.assisted || !!question.scaffoldText, instructionAt, responseMode: question.components?.length ? "components" : question.options ? "choice" : "numeric", responseCode: typeof raw === "object" ? JSON.stringify(raw) : String(raw), coverage: componentScore?.coverage || (correct ? ["answer"] : []), coverageRequired: question.coverageRequired || (question.components?.map(part => part.id) ?? ["answer"]), misconception: diagnosis?.key || null, diagnosisCandidates: diagnosis ? [diagnosis.key] : [], diagnosisConfidence: diagnosis?.confidence || "undifferentiated", recoveryOf: question.recoveryOf || null, retrieval: !!question.retrieval, testRun: state.mode === "test", repairOnly: !!question.repairOnly, date: localDate(at), at, cloudId: `${at.toString(36)}-${Math.random().toString(36).slice(2, 8)}` };
    const score = projectedScore(profileBefore, attempt);
    update(profile => { profile.attempts.push(attempt); if (attempt.recheck && correct && !attempt.assisted) delete profile.rechecks?.[attempt.micro]; });
    state.results.push({ ...attempt, before: score.before, after: score.after, answer: question.correctResponse || question.answer, why: question.why, promptText: stripHtml(question.prompt), componentOutcomes: componentScore?.outcomes || [], diagnosisMessage: diagnosis?.message || "" });
    state.submittedQuestionIds.push(question.questionId);
    if (!question.assisted && !question.repairOnly) { state.independentCount += 1; if (correct) state.correct += 1; else { state.sessionFailures[target] = (Number(state.sessionFailures[target]) || 0) + 1; } }
    accumulateActiveTime();
    if (latestFourFailureStop() || state.activeMs >= ACTIVE_LIMIT_MS) state.stopAfterRepair = true;
    if (state.mode === "practice" && !correct && !question.assisted && !question.repairOnly) {
      const repairs = createRepairSequence(question, diagnosis);
      state.repairQueue.push(...(state.independentCount >= PRACTICE_TARGET || state.stopAfterRepair ? repairs.slice(0, 1) : repairs));
      if (Number(state.sessionFailures[target]) < 2 && !state.recoveries.some(item => item.target === target)) state.recoveries.push({ micro: question.micro, target, assessmentArchetype: question.assessmentArchetype || null, difficulty: question.difficulty, sourceId: question.questionId, availableAfter: state.independentCount + 2 });
    }
    state.answered = true; persistSession();
    if (state.mode === "test") announce(`<strong>Answer recorded.</strong><div>Keep going. Results come at the end.</div><button class="primary-button" data-next>${state.index + 1 >= state.queue.length ? "See results" : "Next"}</button>`, "neutral");
    else if (correct) { const lead = question.repairOnly ? "Right idea." : question.assisted ? "Exactly." : question.recovery ? "You got it independently this time." : "Yes."; const explanation = question.repairOnly || question.assisted ? question.why : `You used ${MICRO_SKILLS[question.micro].name.toLowerCase()} correctly.`; announce(`<strong>${lead}</strong><div>${escapeHtml(explanation)}</div><button class="primary-button" data-next>Next</button>`, "good"); }
    else if (state.mode === "practice" && !question.assisted && !question.repairOnly) announce(`<strong>Not yet.</strong><div class="worked">${escapeHtml(diagnosis?.message || "The response does not identify one specific misconception yet.")}</div><div class="feedback-note">Review the idea, then prove it later on a fresh problem.</div><button class="primary-button" data-next>Review this</button>`, "bad");
    else if (question.repairOnly) announce(`<strong>Here’s the key idea.</strong><div class="worked">${escapeHtml(question.why)}</div><button class="primary-button" data-next>Continue</button>`, "bad");
    else announce(`<strong>Review this example.</strong><div class="worked">${escapeHtml(question.why)}</div><button class="primary-button" data-next>Continue</button>`, "bad");
    $("#answer-form").hidden = true; renderProgress();
  }
  function announce(html, kind) { const feedback = $("#feedback"); feedback.innerHTML = html; feedback.className = `feedback ${kind}`; feedback.hidden = false; feedback.querySelector("[data-next]")?.focus({ preventScroll: true }); }
  function shouldFinishPractice() { return (state.independentCount >= PRACTICE_TARGET || state.stopAfterRepair) && state.repairQueue.length === 0; }
  function next() {
    state.index += 1;
    if (state.mode === "diagnostic" || state.mode === "test") { state.index >= state.queue.length ? finish() : renderQuestion(); return; }
    if (shouldFinishPractice()) { finish(); return; }
    if (state.index >= state.queue.length) { const question = nextAdaptiveQuestion(); if (!question) return finish(); state.queue.push(question); }
    renderQuestion();
  }
  function formatAnswer(answer) { return typeof answer === "object" ? Object.values(answer).join(" · ") : String(answer); }
  function finish() {
    accumulateActiveTime();
    const reviewAt = Date.now(), independent = state.results.filter(result => !result.assisted && !result.repairOnly), correct = independent.filter(result => result.correct).length;
    update(profile => {
      if (state.mode === "diagnostic") { profile.diagnostic = true; profile.diagnosticVersion = 3; }
      if (state.mode === "test") {
        profile.testRuns = (profile.testRuns || 0) + 1;
        const missedIds = new Set(independent.filter(result => !result.correct).map(result => result.questionId));
        profile.attempts.forEach(attempt => { if (missedIds.has(attempt.questionId)) attempt.reviewedAt = reviewAt; });
      }
      profile.sessions = (profile.sessions || 0) + 1; profile.last = localDate(reviewAt); profile.activeSession = null;
    });
    if (state.mode === "test") {
      $("#result-score").textContent = `${correct} of ${independent.length} correct.`;
      const misses = independent.filter(result => !result.correct);
      $("#result-analysis").innerHTML = misses.length ? `<div class="result-message">Review these targets. Your next mission will bring them back for fresh independent proof.</div>${misses.map(result => { const gaps = result.componentOutcomes.filter(outcome => !outcome.correct).map(outcome => outcome.id).join(", "); const diagnosis = result.diagnosisMessage ? `<p><strong>${result.diagnosisConfidence === "undifferentiated" ? "Needs another example" : "Possible focus"}:</strong> ${escapeHtml(result.diagnosisMessage)}</p>` : ""; return `<article class="test-review"><strong>${escapeHtml(result.promptText)}</strong><div>Your answer: ${escapeHtml(result.responseCode || "No answer")}</div><div>Correct: ${escapeHtml(formatAnswer(result.answer))}</div>${gaps ? `<div>Parts to revisit: ${escapeHtml(gaps)}</div>` : ""}${diagnosis}<p>${escapeHtml(result.why)}</p></article>`; }).join("")}` : `<div class="result-message">Strong assessment run. Later missions will keep this material retrievable.</div>`;
      $("#result-title").textContent = "Test run complete.";
    } else {
      $("#result-score").textContent = `You finished ${independent.length} independent question${independent.length === 1 ? "" : "s"}.`;
      $("#result-analysis").innerHTML = `<div class="result-message">${correct === independent.length ? "You handled today’s work independently." : "Your next mission will return to anything that still needs proof."}</div>`;
      $("#result-title").textContent = correct === independent.length ? "Strong finish." : "Mission complete.";
    }
    state.mode = null; placeValue.reset(); $("#session").removeAttribute("data-assessment-mode"); show("results");
  }

  document.addEventListener("click", event => {
    const profile = event.target.closest("[data-profile]"); if (profile) { state.profile = profile.dataset.profile; dashboard(); return; }
    if (event.target.closest("[data-resume]")) { resume(); return; }
    if (event.target.closest("[data-discard-session]")) { clearActiveSession(); dashboard(); return; }
    const startButton = event.target.closest("[data-start]"); if (startButton) { start(startButton.dataset.start); return; }
    const componentChoice = event.target.closest(".component-choice");
    if (componentChoice) { const id = componentChoice.dataset.componentId; $$(`.component-choice[data-component-id="${CSS.escape(id)}"]`).forEach(button => button.classList.remove("selected")); componentChoice.classList.add("selected"); state.componentSelected[id] = componentChoice.dataset.componentValue; return; }
    const choiceButton = event.target.closest(".choice[data-value]"); if (choiceButton) { $$(".choice[data-value]").forEach(button => button.classList.remove("selected")); choiceButton.classList.add("selected"); state.selected = choiceButton.dataset.value; return; }
    if (event.target.closest("[data-next]")) { next(); return; }
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "switch") picker();
    if (action === "dashboard") dashboard();
    if (action === "quit") { persistSession(); $("#exit-dialog").showModal(); }
    if (action === "stay") { $("#exit-dialog").close(); beginActiveTime(); }
    if (action === "confirm-exit") { persistSession(); $("#exit-dialog").close(); dashboard(); }
  });
  window.addEventListener("mathmission:cloud-updated", () => { if ($("#picker").classList.contains("active")) picker(); else if (state.profile && $("#dashboard").classList.contains("active")) dashboard(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) persistSession(); else beginActiveTime(); });
  window.addEventListener("pagehide", persistSession);
  $("#answer-form").addEventListener("submit", submit);
  picker();
})();
