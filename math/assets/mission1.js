import { DOMAIN_MICROS, MICRO_SKILLS, SKILLS, diagnostic, generate, isCorrectAnswer } from "./mission1-content.mjs?v=20260831-weekly3";
import { DIAGNOSTIC_VERSION, PRACTICE_MAX, PRACTICE_TARGET, diagnosticIsCurrent, difficultyForScore, domainStats, microScore, microStats, nextMicro, projectedScore } from "./mission1-adaptive.mjs?v=20260831-focus1";
import { createScratchpad } from "./mission1-scratch.mjs?v=20260831-weekly3";

"use strict";
(() => {
  const KEY = "mathmission.m1.v1";
  const state = { profile: null, mode: null, queue: [], index: 0, correct: 0, results: [], selected: null, independentCount: 0, immediateScaffold: null, recoveries: [], recentMicros: [] };
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const today = () => new Date().toISOString().slice(0, 10);
  const emptyProfile = () => ({ diagnostic: false, diagnosticVersion: 0, attempts: [], sessions: 0 });
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} }
  function pdata() { const all = load(); return all[state.profile] || emptyProfile(); }
  function update(fn) { const all = load(), profile = all[state.profile] || emptyProfile(); profile.attempts = Array.isArray(profile.attempts) ? profile.attempts : []; fn(profile); all[state.profile] = profile; save(all); }
  function profileName() { return state.profile === "luke" ? "Luke" : "Samantha"; }
  function show(id) { $$(".screen").forEach(screen => screen.classList.toggle("active", screen.id === id)); scrollTo({ top: 0, behavior: "smooth" }); }

  const scratchpad = createScratchpad({ panel: $("#scratch-panel"), body: $("#scratch-body"), toggle: $("#scratch-toggle"), canvas: $("#scratch-canvas"), clear: $("#scratch-clear"), undo: $("#scratch-undo"), guide: $("#scratch-guide") });

  function picker() {
    const all = load();
    $$(".profile").forEach(button => {
      const profile = all[button.dataset.profile], status = button.querySelector(".profile-status");
      status.textContent = diagnosticIsCurrent(profile) ? `${profile.sessions || 0} mission${profile.sessions === 1 ? "" : "s"} completed` : "Start Mission 1";
    });
    show("picker");
  }

  function dashboard() {
    const profile = pdata(), name = profileName(), current = diagnosticIsCurrent(profile), card = $("#primary-card");
    $("#learner-pill").textContent = name; $("#hello").textContent = `Ready, ${name}?`;
    if (!current) card.innerHTML = `<div class="label">First assignment · about 10 minutes</div><h2>Find your starting point</h2><p>12 independently checked questions establish a broad Module 1 baseline. After that, adaptive practice prioritizes the school’s current Lessons 1–2 / 5.NBT.1–2 work.</p><button class="primary-button" data-start="diagnostic">Start diagnostic</button>`;
    else {
      const micro = nextMicro(profile), score = microScore(profile, micro);
      card.innerHTML = `<div class="label">Current focus · Lessons 1–2 · 5.NBT.1–2</div><h2>Strengthen ${MICRO_SKILLS[micro].name.toLowerCase()}</h2><p>Practice prioritizes adjacent base-ten relationships and multiplying/dividing by powers of 10. Weak review skills can surface briefly without displacing the current lesson focus.</p><button class="primary-button" data-start="practice">Start adaptive mission</button>`;
    }
    renderSkills(profile); show("dashboard");
  }

  function renderSkills(profile) {
    let mastered = 0;
    $("#skill-list").innerHTML = Object.entries(SKILLS).map(([skill, data]) => {
      const stats = domainStats(profile, skill); mastered += stats.mastered;
      const status = stats.mastered === stats.total ? "Mastered" : stats.score >= 70 ? "Building" : stats.score < 40 ? "Focus next" : "Learning";
      const cls = stats.mastered === stats.total ? "strong" : stats.score < 40 ? "focus" : "";
      return `<div class="skill-row"><div><div class="skill-name">${data.name}</div><div class="skill-meta">${data.topic} · ${data.lessons} · ${stats.mastered}/${stats.total} micro-skills · level ${stats.score}</div></div><span class="status ${cls}">${status}</span></div>`;
    }).join("");
    $("#mastery-count").textContent = `${mastered} of ${Object.keys(MICRO_SKILLS).length} mastered`;
    if (!diagnosticIsCurrent(profile)) { $("#parent-report").textContent = "Complete the new diagnostic first. It independently checks every specific Mission 1 skill."; return; }
    const ordered = Object.keys(MICRO_SKILLS).map(micro => ({ micro, stats: microStats(profile, micro) })).sort((a, b) => a.stats.score - b.stats.score);
    const strongest = [...ordered].reverse()[0], learning = ordered[0];
    $("#parent-report").innerHTML = `<strong>Strongest:</strong> ${MICRO_SKILLS[strongest.micro].name} · ${strongest.stats.score}<br><strong>Learning:</strong> ${MICRO_SKILLS[learning.micro].name} · ${learning.stats.score}<br><strong>How it adapts:</strong> recent independent work controls difficulty. Guided answers help learning but count only slightly toward mastery.`;
  }

  function start(mode) {
    Object.assign(state, { mode, queue: mode === "diagnostic" ? diagnostic() : [], index: 0, correct: 0, results: [], selected: null, independentCount: 0, immediateScaffold: null, recoveries: [], recentMicros: [] });
    if (mode === "practice") state.queue.push(nextAdaptiveQuestion());
    show("session"); renderQuestion();
  }

  function nextAdaptiveQuestion() {
    const profile = pdata();
    if (state.immediateScaffold) {
      const micro = state.immediateScaffold; state.immediateScaffold = null;
      return generate(micro, Math.max(1, difficultyForScore(microScore(profile, micro)) - 1), Math.random, { assisted: true });
    }
    const ready = state.recoveries.findIndex(item => item.delay <= 0);
    if (ready >= 0) {
      const [{ micro }] = state.recoveries.splice(ready, 1);
      return generate(micro, difficultyForScore(microScore(profile, micro)), Math.random, { recovery: true });
    }
    state.recoveries.forEach(item => { item.delay -= 1; });
    const avoid = [...state.recentMicros.slice(-2), ...state.recoveries.map(item => item.micro)];
    const micro = nextMicro(profile, { avoid });
    return generate(micro, difficultyForScore(microScore(profile, micro)));
  }

  function renderQuestion() {
    const question = state.queue[state.index]; state.selected = null; state.recentMicros.push(question.micro);
    const domain = SKILLS[question.skill], guided = question.assisted ? " · Guided" : question.recovery ? " · Recovery" : ` · Level ${question.difficulty}`;
    $("#skill-tag").textContent = `${domain.topic} · ${MICRO_SKILLS[question.micro].name}${guided}`;
    $("#question-title").textContent = state.mode === "diagnostic" ? `Question ${state.index + 1} of ${state.queue.length}` : question.assisted ? "Guided try" : `Learning question ${Math.min(state.independentCount + 1, PRACTICE_TARGET)} of ${PRACTICE_TARGET}`;
    $("#question-body").innerHTML = question.prompt;
    const scaffold = $("#scaffold-note"); scaffold.hidden = !question.scaffoldText; scaffold.textContent = question.scaffoldText;
    const area = $("#answer-area"), keyboard = question.answer.includes("+") ? "text" : "decimal";
    area.innerHTML = question.options ? `<div class="choice-grid">${question.options.map(option => `<button class="choice" type="button" data-value="${option}">${option}</button>`).join("")}</div>` : `<label class="skip" for="answer-input">Your answer</label><input id="answer-input" class="answer-input" inputmode="${keyboard}" enterkeyhint="done" autocomplete="off" placeholder="${question.placeholder}">`;
    $("#answer-form").hidden = false; $("#feedback").hidden = true; $("#feedback").className = "feedback";
    $("#session-score").textContent = `${state.correct} independent correct`; renderPips(); scratchpad.setQuestion(question);
    if (!question.options) setTimeout(() => $("#answer-input")?.focus(), 50);
  }

  function renderPips() {
    const count = state.mode === "diagnostic" ? state.queue.length : PRACTICE_TARGET;
    const completed = state.mode === "diagnostic" ? state.index : state.independentCount;
    $("#progress-pips").innerHTML = Array.from({ length: count }, (_, index) => `<span class="pip ${index < completed ? "done" : index === completed ? "current" : ""}"></span>`).join("");
  }

  function submit(event) {
    event.preventDefault();
    const question = state.queue[state.index], raw = question.options ? state.selected : $("#answer-input")?.value;
    if (!raw) { announce("Choose or enter an answer first.", "bad"); return; }
    const correct = isCorrectAnswer(raw, question), at = Date.now();
    const attempt = { skill: question.skill, micro: question.micro, correct, assisted: question.assisted, recovery: question.recovery, difficulty: question.difficulty, transfer: question.transfer, date: today(), at, cloudId: `${at.toString(36)}-${Math.random().toString(36).slice(2, 8)}` };
    const score = projectedScore(pdata(), attempt);
    update(profile => profile.attempts.push(attempt));
    state.results.push({ ...attempt, before: score.before, after: score.after });
    if (!question.assisted) { state.independentCount += 1; if (correct) state.correct += 1; }
    if (state.mode === "practice" && !correct && !question.assisted) {
      state.immediateScaffold = question.micro;
      if (!state.recoveries.some(item => item.micro === question.micro)) state.recoveries.push({ micro: question.micro, delay: 1 });
    }
    if (correct) {
      const lead = question.assisted ? "Guided try complete." : question.recovery ? "Recovered independently." : "Correct.";
      announce(`<strong>${lead}</strong><div>${question.why}</div><div class="score-shift">Skill level ${score.before} → ${score.after}</div><button class="primary-button" data-next>Next question</button>`, "good");
    } else {
      const nextText = state.mode === "practice" && !question.assisted ? "A guided problem is next, followed later by a fresh recovery." : "Review the worked explanation before continuing.";
      announce(`<strong>Not yet. The answer is ${question.answer}.</strong><div class="worked">${question.why}</div><div class="score-shift">${nextText}</div><button class="primary-button" data-next>Continue</button>`, "bad");
    }
    $("#answer-form").hidden = true;
  }

  function announce(html, kind) { const feedback = $("#feedback"); feedback.innerHTML = html; feedback.className = `feedback ${kind}`; feedback.hidden = false; }
  function shouldFinishPractice() { return state.results.length >= PRACTICE_MAX || (state.independentCount >= PRACTICE_TARGET && !state.immediateScaffold && state.recoveries.length === 0); }
  function next() {
    state.index += 1;
    if (state.mode === "diagnostic") { state.index >= state.queue.length ? finish() : renderQuestion(); return; }
    if (shouldFinishPractice()) { finish(); return; }
    if (state.index >= state.queue.length) state.queue.push(nextAdaptiveQuestion());
    renderQuestion();
  }

  function finish() {
    update(profile => { if (state.mode === "diagnostic") { profile.diagnostic = true; profile.diagnosticVersion = DIAGNOSTIC_VERSION; } profile.sessions = (profile.sessions || 0) + 1; profile.last = today(); });
    const independent = state.results.filter(result => !result.assisted), groups = {};
    independent.forEach(result => { groups[result.micro] ??= { n: 0, c: 0, after: result.after }; groups[result.micro].n += 1; groups[result.micro].c += result.correct ? 1 : 0; groups[result.micro].after = result.after; });
    $("#result-score").textContent = `${independent.filter(result => result.correct).length} of ${independent.length} correct independently.`;
    $("#result-analysis").innerHTML = Object.entries(groups).map(([micro, value]) => `<div class="result-item"><span>${MICRO_SKILLS[micro].name}</span><strong>${value.c}/${value.n} · level ${value.after}</strong></div>`).join("");
    const pending = state.recoveries.length > 0; $("#result-title").textContent = pending ? "Good work. Recovery continues next time." : independent.filter(result => result.correct).length / independent.length >= .85 ? "Strong finish." : "Now the next mission knows what to teach.";
    show("results");
  }

  document.addEventListener("click", event => {
    const profile = event.target.closest("[data-profile]"); if (profile) { state.profile = profile.dataset.profile; dashboard(); return; }
    const startButton = event.target.closest("[data-start]"); if (startButton) { start(startButton.dataset.start); return; }
    const choiceButton = event.target.closest(".choice"); if (choiceButton) { $$(".choice").forEach(button => button.classList.remove("selected")); choiceButton.classList.add("selected"); state.selected = choiceButton.dataset.value; return; }
    if (event.target.closest("[data-next]")) { next(); return; }
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "switch") picker();
    if (action === "dashboard") dashboard();
    if (action === "share-device") window.MathMissionCloud?.share();
    if (action === "quit" && confirm("Exit this mission? Completed answers are still saved.")) dashboard();
  });
  window.addEventListener("mathmission:cloud-updated", () => { if ($("#picker").classList.contains("active")) picker(); else if (state.profile && $("#dashboard").classList.contains("active")) dashboard(); });
  $("#answer-form").addEventListener("submit", submit); picker();
})();
