import { MICRO_SKILLS, diagnostic, isCorrectAnswer, normalize } from "./mission1-content.mjs?v=20260905-assessment2";
import { generateCurrentWeekQuestion } from "./mission1-current-week.mjs?v=20260905-assessment2";
import { DIAGNOSTIC_VERSION, PRACTICE_MAX, PRACTICE_TARGET, RECHECK_VERSION, diagnosticIsCurrent, difficultyForScore, microScore, migrateAffectedRechecks, nextMicro, pendingRechecks, projectedScore } from "./mission1-adaptive.mjs?v=20260905-assessment2";
import { nextDivisionArchetype } from "./mission1-division-assessment.mjs?v=20260905-assessment2";
import { createScratchpad } from "./mission1-scratch.mjs?v=20260901-mastery1";
import { createPlaceValueWorkspace } from "./mission1-place-value.mjs?v=20260901-mastery1";
import { TEACHER_WEEK } from "./teacher-week.mjs?v=20260905-assessment2";
import { diagnoseMathError, makeRepairQuestion } from "./mission1-error-diagnosis.mjs?v=20260904-diagnosis1";

"use strict";
(() => {
  const KEY = "mathmission.m1.v1";
  const state = { profile: null, mode: null, queue: [], index: 0, correct: 0, results: [], selected: null, independentCount: 0, immediateScaffold: null, recoveries: [], recentMicros: [], recentArchetypes: [], answered: false };
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const today = () => new Date().toISOString().slice(0, 10);
  const emptyProfile = () => ({ diagnostic: false, diagnosticVersion: 0, attempts: [], sessions: 0, recheckVersion: RECHECK_VERSION, rechecks: {} });
  const weeklyDiagnostic = () => diagnostic().filter(question => TEACHER_WEEK.diagnosticMicros.includes(question.micro));
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} }
  function pdata() { const all = load(); return all[state.profile] || emptyProfile(); }
  function update(fn) { const all = load(), profile = all[state.profile] || emptyProfile(); profile.attempts = Array.isArray(profile.attempts) ? profile.attempts : []; fn(profile); all[state.profile] = profile; save(all); }
  function profileWithRepairs() { let profile; update(next => { migrateAffectedRechecks(next); profile = next; }); return profile; }
  function profileName() { return state.profile === "luke" ? "Luke" : "Samantha"; }
  function show(id) {
    $$(".screen").forEach(screen => screen.classList.toggle("active", screen.id === id));
    scrollTo({ top: 0, behavior: "smooth" });
    const heading = document.querySelector(`#${id} h1, #${id} h2`);
    if (heading) { heading.tabIndex = -1; requestAnimationFrame(() => heading.focus({ preventScroll: true })); }
  }
  function currentQuestion() { return state.queue[state.index]; }

  const scratchpad = createScratchpad({ panel: $("#scratch-panel"), body: $("#scratch-body"), toggle: $("#scratch-toggle"), canvas: $("#scratch-canvas"), clear: $("#scratch-clear"), undo: $("#scratch-undo"), guide: $("#scratch-guide") });
  const placeValue = createPlaceValueWorkspace({
    root: $("#place-value-workspace"),
    onGuidedReady() {
      const question = currentQuestion();
      if (!question?.assisted) return;
      const input = $("#answer-input");
      if (input) input.disabled = false;
      $("#check-button").disabled = false;
      $("#answer-form").classList.remove("guided-locked");
      setTimeout(() => input?.focus(), 0);
    }
  });

  function picker() {
    const all = load();
    $$(".profile").forEach(button => {
      const profile = all[button.dataset.profile], status = button.querySelector(".profile-status");
      status.textContent = diagnosticIsCurrent(profile) ? "Ready for today’s mission" : "Start with a quick check";
    });
    show("picker");
  }

  function dashboard() {
    const profile = profileWithRepairs(), name = profileName(), current = diagnosticIsCurrent(profile), card = $("#primary-card");
    $("#learner-pill").textContent = name;
    $("#hello").textContent = `Ready, ${name}?`;
    if (!current) {
      const checkCount = weeklyDiagnostic().length;
      card.innerHTML = `
        <div class="label">First mission · ${TEACHER_WEEK.label}</div>
        <h2>Quick starting check</h2>
        <p class="mission-meta">${checkCount} questions · current class material only</p>
        <p>This checks the ideas needed for this week so Math Mission knows what to explain and practice.</p>
        <button class="primary-button" data-start="diagnostic">Start</button>`;
    } else {
      card.innerHTML = `
        <div class="label">Current focus · ${TEACHER_WEEK.label}</div>
        <h2>${TEACHER_WEEK.title}</h2>
        <p class="mission-meta">${PRACTICE_TARGET} independent questions · about 10 minutes</p>
        <p>${TEACHER_WEEK.summary}</p>
        <button class="primary-button" data-start="practice">Start today’s mission</button>`;
    }
    show("dashboard");
  }

  function start(mode) {
    Object.assign(state, { mode, queue: mode === "diagnostic" ? weeklyDiagnostic() : [], index: 0, correct: 0, results: [], selected: null, independentCount: 0, immediateScaffold: null, recoveries: [], recentMicros: [], recentArchetypes: [], answered: false });
    if (mode === "practice") state.queue.push(nextAdaptiveQuestion());
    show("session");
    renderQuestion();
  }

  function nextAdaptiveQuestion() {
    const profile = profileWithRepairs();
    if (state.immediateScaffold) {
      const repair = state.immediateScaffold;
      state.immediateScaffold = null;
      return repair;
    }
    const ready = state.recoveries.findIndex(item => item.delay <= 0);
    if (ready >= 0) {
      const [{ micro, assessmentArchetype }] = state.recoveries.splice(ready, 1);
      return generateCurrentWeekQuestion(micro, difficultyForScore(microScore(profile, micro)), Math.random, { recovery: true, assessmentArchetype });
    }
    state.recoveries.forEach(item => { item.delay -= 1; });
    const avoid = [...state.recentMicros.slice(-2), ...state.recoveries.map(item => item.micro)];
    const micro = nextMicro(profile, { avoid });
    const recheck = pendingRechecks(profile).includes(micro);
    const flags = {};
    if (micro === "decimal_divide") {
      const avoidArchetypes = [...state.recentArchetypes.slice(-2), ...state.recoveries.map(item => item.assessmentArchetype).filter(Boolean)];
      flags.assessmentArchetype = nextDivisionArchetype(profile, { avoid: avoidArchetypes });
    }
    return { ...generateCurrentWeekQuestion(micro, difficultyForScore(microScore(profile, micro)), Math.random, flags), recheck };
  }

  function renderQuestion() {
    const question = currentQuestion();
    state.selected = null;
    state.answered = false;
    state.recentMicros.push(question.micro);
    if (question.assessmentArchetype) state.recentArchetypes.push(question.assessmentArchetype);

    const stateLabel = question.repairOnly ? " · Quick fix" : question.assisted ? " · Guided" : question.recovery ? " · Try again" : question.recheck ? " · Check again" : "";
    $("#skill-tag").textContent = `${MICRO_SKILLS[question.micro].name}${stateLabel}`;
    $("#question-title").textContent = state.mode === "diagnostic"
      ? `Question ${state.index + 1} of ${state.queue.length}`
      : question.repairOnly
        ? "Quick fix"
        : question.assisted
          ? "Guided step"
          : question.recovery
            ? "Try it again"
            : question.recheck
              ? "Check it again"
              : `Question ${Math.min(state.independentCount + 1, PRACTICE_TARGET)}`;
    $("#question-body").innerHTML = question.prompt;

    const scaffold = $("#scaffold-note");
    const workspaceOwnsScaffold = question.workspace?.type === "place-value";
    scaffold.hidden = !question.scaffoldText || workspaceOwnsScaffold;
    scaffold.textContent = question.scaffoldText;

    const area = $("#answer-area"), keyboard = question.answer.includes("+") ? "text" : "decimal";
    const guidedWorkspace = !!question.assisted && workspaceOwnsScaffold;
    area.innerHTML = question.options
      ? `<div class="choice-grid">${question.options.map(option => `<button class="choice" type="button" data-value="${option}">${option}</button>`).join("")}</div>`
      : `<label id="answer-label" class="answer-label" for="answer-input">${guidedWorkspace ? "Move the digits first, then type the answer" : "Your answer"}</label><input id="answer-input" class="answer-input" inputmode="${keyboard}" enterkeyhint="done" autocomplete="off" placeholder="${question.placeholder}" ${guidedWorkspace ? "disabled aria-describedby=\"guided-answer-help\"" : ""}>${guidedWorkspace ? '<span id="guided-answer-help" class="sr-only">Use the place-value chart. The answer box will unlock after every digit is in the correct place.</span>' : ""}`;

    $("#check-button").disabled = guidedWorkspace;
    $("#answer-form").classList.toggle("guided-locked", guidedWorkspace);
    $("#answer-form").hidden = false;
    $("#feedback").hidden = true;
    $("#feedback").className = "feedback";

    placeValue.setQuestion(question);
    scratchpad.setQuestion(question);
    renderProgress();

    if (!question.options && !guidedWorkspace) setTimeout(() => $("#answer-input")?.focus(), 50);
  }

  function renderProgress() {
    const question = currentQuestion();
    const count = state.mode === "diagnostic" ? state.queue.length : PRACTICE_TARGET;
    const completed = state.mode === "diagnostic"
      ? Math.min(state.index + (state.answered ? 1 : 0), count)
      : Math.min(state.independentCount, count);
    const display = state.mode === "diagnostic"
      ? state.answered ? `${completed} of ${count} complete` : `${Math.min(state.index + 1, count)} of ${count}`
      : question?.assisted || state.answered
        ? `${completed} of ${count} complete`
        : `${Math.min(completed + 1, count)} of ${count}`;
    $("#progress-text").textContent = display;
    $("#session-mode").textContent = state.mode === "diagnostic" ? "Starting check" : question?.repairOnly ? "Quick misconception check" : question?.assisted ? "Guided step" : question?.recovery ? "Independent retry" : question?.recheck ? "Independent recheck" : "Independent";
    $("#progress-fill").style.width = `${Math.round((completed / count) * 100)}%`;
  }

  function submit(event) {
    event.preventDefault();
    const question = currentQuestion();
    if (question.assisted && question.workspace && !placeValue.isReady()) return;
    const raw = question.options ? state.selected : $("#answer-input")?.value;
    if (!raw) { announce("Choose or enter an answer first.", "bad"); return; }

    const correct = question.repairOnly ? normalize(raw) === normalize(question.answer) : isCorrectAnswer(raw, question);
    const diagnosis = !correct && !question.repairOnly ? diagnoseMathError(raw, question) : null;
    const at = Date.now();
    const attempt = { skill: question.skill, micro: question.micro, assessmentArchetype: question.assessmentArchetype || null, correct, assisted: question.assisted, recovery: question.recovery, recheck: !!question.recheck, difficulty: question.difficulty, transfer: question.transfer, misconception: diagnosis?.key || null, repairOnly: !!question.repairOnly, date: today(), at, cloudId: `${at.toString(36)}-${Math.random().toString(36).slice(2, 8)}` };
    let score = { before: microScore(pdata(), question.micro), after: microScore(pdata(), question.micro) };

    if (!question.repairOnly) {
      score = projectedScore(pdata(), attempt);
      update(profile => {
        profile.attempts.push(attempt);
        if (attempt.recheck && !attempt.assisted) delete profile.rechecks?.[attempt.micro];
      });
    }
    state.results.push({ ...attempt, before: score.before, after: score.after });

    if (!question.assisted) {
      state.independentCount += 1;
      if (correct) state.correct += 1;
    }
    if (state.mode === "practice" && !correct && !question.assisted) {
      state.immediateScaffold = makeRepairQuestion(question, diagnosis);
      const sameRecovery = state.recoveries.some(item => item.micro === question.micro && item.assessmentArchetype === (question.assessmentArchetype || null));
      if (!sameRecovery) state.recoveries.push({ micro: question.micro, assessmentArchetype: question.assessmentArchetype || null, delay: 1 });
    }
    state.answered = true;

    if (correct) {
      const lead = question.repairOnly ? "Right idea." : question.assisted ? "Exactly." : question.recovery ? "You got it independently this time." : "Yes.";
      const explanation = question.repairOnly || question.assisted ? question.why : `You used ${MICRO_SKILLS[question.micro].name.toLowerCase()} correctly.`;
      announce(`<strong>${lead}</strong><div>${explanation}</div><button class="primary-button" data-next>Next</button>`, "good");
    } else if (state.mode === "practice" && !question.assisted) {
      const message = diagnosis?.message || "There’s one idea to fix before you try this skill again.";
      announce(`<strong>Not yet.</strong><div class="worked">${message}</div><div class="feedback-note">One quick tap question will fix the idea. You’ll prove it later on a fresh problem.</div><button class="primary-button" data-next>Fix this</button>`, "bad");
    } else if (question.repairOnly) {
      announce(`<strong>Here’s the key.</strong><div class="worked">${question.why}</div><div class="feedback-note">No need to repeat this item now. We’ll check the skill later with a fresh problem.</div><button class="primary-button" data-next>Continue</button>`, "bad");
    } else if (question.assisted && question.workspace?.type === "place-value") {
      announce(`<strong>Almost.</strong><div>Read the number you built on the chart carefully. The answer is ${question.answer}.</div><div class="worked">${question.why}</div><button class="primary-button" data-next>Continue</button>`, "bad");
    } else {
      announce(`<strong>Not yet. The answer is ${question.answer}.</strong><div class="worked">${question.why}</div><div class="feedback-note">Review the explanation, then continue.</div><button class="primary-button" data-next>Continue</button>`, "bad");
    }
    $("#answer-form").hidden = true;
    renderProgress();
  }

  function announce(html, kind) {
    const feedback = $("#feedback");
    feedback.innerHTML = html;
    feedback.className = `feedback ${kind}`;
    feedback.hidden = false;
    feedback.querySelector("[data-next]")?.focus({ preventScroll: true });
  }

  function shouldFinishPractice() {
    const independentResults = state.results.filter(result => !result.assisted).length;
    return independentResults >= PRACTICE_MAX || (state.independentCount >= PRACTICE_TARGET && !state.immediateScaffold && state.recoveries.length === 0);
  }

  function next() {
    state.index += 1;
    if (state.mode === "diagnostic") {
      state.index >= state.queue.length ? finish() : renderQuestion();
      return;
    }
    if (shouldFinishPractice()) {
      finish();
      return;
    }
    if (state.index >= state.queue.length) state.queue.push(nextAdaptiveQuestion());
    renderQuestion();
  }

  function finish() {
    update(profile => {
      if (state.mode === "diagnostic") {
        profile.diagnostic = true;
        profile.diagnosticVersion = DIAGNOSTIC_VERSION;
      }
      profile.sessions = (profile.sessions || 0) + 1;
      profile.last = today();
    });

    const independent = state.results.filter(result => !result.assisted);
    const correct = independent.filter(result => result.correct).length;
    const pending = state.recoveries.length > 0;
    $("#result-score").textContent = `You finished ${independent.length} independent question${independent.length === 1 ? "" : "s"}.`;
    $("#result-analysis").innerHTML = `<div class="result-message">${pending
      ? "We’ll bring back anything that still needs another look."
      : correct === independent.length
        ? "You handled today’s work independently."
        : "Your next mission will know what to explain and practice again."}</div>`;
    $("#result-title").textContent = pending ? "Good work." : correct === independent.length ? "Strong finish." : "Mission complete.";
    placeValue.reset();
    show("results");
  }

  document.addEventListener("click", event => {
    const profile = event.target.closest("[data-profile]");
    if (profile) { state.profile = profile.dataset.profile; dashboard(); return; }
    const startButton = event.target.closest("[data-start]");
    if (startButton) { start(startButton.dataset.start); return; }
    const choiceButton = event.target.closest(".choice");
    if (choiceButton) {
      $$(".choice").forEach(button => button.classList.remove("selected"));
      choiceButton.classList.add("selected");
      state.selected = choiceButton.dataset.value;
      return;
    }
    if (event.target.closest("[data-next]")) { next(); return; }
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "switch") picker();
    if (action === "dashboard") dashboard();
    if (action === "quit") $("#exit-dialog").showModal();
    if (action === "stay") $("#exit-dialog").close();
    if (action === "confirm-exit") { $("#exit-dialog").close(); dashboard(); }
  });

  window.addEventListener("mathmission:cloud-updated", () => {
    if ($("#picker").classList.contains("active")) picker();
    else if (state.profile && $("#dashboard").classList.contains("active")) dashboard();
  });
  $("#answer-form").addEventListener("submit", submit);
  picker();
})();