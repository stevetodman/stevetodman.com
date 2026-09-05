/* Canonical school-assessment contract for the current 50 States assignment.
   The classroom assessment is a blank map of all 50 states. The learner must
   put the correctly spelled state name in the correct location. The interim
   requirement is 40/50 by Sep 9; the final requirement is 50/50 by Sep 16.
   Daily adaptive practice remains separate and can still pace 40 first, then 50. */
(function () {
  "use strict";

  var SCHOOL_DRAFT_KEY = "usStatesSchoolMapTest.v1";
  var activeAnswers = null;
  var selectedCode = null;
  var schoolTestActive = false;

  function dateKey(now) {
    var d = now instanceof Date ? now : new Date(now || Date.now());
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function schoolRequiredScore(now) {
    return dateKey(now) < "2026-09-16" ? 40 : 50;
  }

  function canonicalName(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function activeProfileName() {
    var data = loadData();
    return data && data.activeProfile ? data.activeProfile : null;
  }

  function readDrafts() {
    try {
      var parsed = JSON.parse(localStorage.getItem(SCHOOL_DRAFT_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function draftFor(profileName) {
    if (!profileName) return null;
    var drafts = readDrafts();
    var draft = drafts[profileName];
    if (!draft || !draft.answers || typeof draft.answers !== "object") return null;
    return draft;
  }

  function writeDraft(profileName, answers) {
    if (!profileName) return;
    var drafts = readDrafts();
    drafts[profileName] = { answers: Object.assign({}, answers), updatedAt: Date.now() };
    try { localStorage.setItem(SCHOOL_DRAFT_KEY, JSON.stringify(drafts)); } catch (_) {}
  }

  function clearDraft(profileName) {
    if (!profileName) return;
    var drafts = readDrafts();
    delete drafts[profileName];
    try { localStorage.setItem(SCHOOL_DRAFT_KEY, JSON.stringify(drafts)); } catch (_) {}
  }

  function answeredCount(answers) {
    return STATES.reduce(function (count, state) {
      return count + (canonicalName(answers && answers[state.code]) ? 1 : 0);
    }, 0);
  }

  function installStyles() {
    if (document.getElementById("school-test-contract-style")) return;
    var style = document.createElement("style");
    style.id = "school-test-contract-style";
    style.textContent = [
      "#schoolTestMap path.state.school-filled{fill:#b8c8e8}",
      "#schoolTestMap path.state.school-selected{fill:#667eea}",
      ".school-test-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}",
      ".school-test-head .btn-home{padding:9px 14px}",
      ".school-test-status{background:#fff;border-radius:14px;padding:13px 16px;box-shadow:0 2px 12px rgba(0,0,0,.07);margin-bottom:12px;display:flex;justify-content:space-between;gap:12px;font-size:.9rem;color:#4a5568}",
      ".school-test-status strong{color:#1a365d}",
      ".school-test-editor{background:#fff;border:2px solid #667eea;border-radius:16px;padding:16px;margin:12px 0;box-shadow:0 8px 24px rgba(45,55,72,.14)}",
      ".school-test-editor .spell-form{margin-top:8px}",
      ".school-test-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px}",
      ".school-test-actions button{padding:12px 22px;font-size:1rem;font-weight:600;border:0;border-radius:10px;cursor:pointer}",
      ".school-test-submit{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}",
      ".school-test-map-note{text-align:center;color:#5a6678;font-size:.86rem;margin:8px 0 14px}",
      "@media(max-width:620px){.school-test-editor{position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:30;margin:0}.school-test-head{align-items:flex-start}.school-test-status{font-size:.82rem}}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function mapClassMap(answers) {
    var classes = {};
    STATES.forEach(function (state) {
      if (canonicalName(answers[state.code])) classes[state.code] = "school-filled";
    });
    return classes;
  }

  function updateProgress() {
    var count = answeredCount(activeAnswers || {});
    var status = document.getElementById("schoolTestCount");
    var submit = document.getElementById("schoolTestSubmit");
    if (status) status.textContent = count + " of 50 filled";
    if (submit) submit.textContent = "Submit test · " + count + "/50";
  }

  function paintState(code) {
    var statePath = document.querySelector('#schoolTestMap path.state[data-code="' + code + '"]');
    if (!statePath) return;
    statePath.classList.toggle("school-filled", !!canonicalName(activeAnswers && activeAnswers[code]));
  }

  function selectBlank(code) {
    selectedCode = code;
    document.querySelectorAll("#schoolTestMap path.state").forEach(function (path) {
      path.classList.toggle("school-selected", path.dataset.code === code);
    });
    var editor = document.getElementById("schoolTestEditor");
    var input = document.getElementById("schoolTestInput");
    if (!editor || !input) return;
    editor.hidden = false;
    input.value = activeAnswers[code] || "";
    requestAnimationFrame(function () { input.focus({ preventScroll: true }); });
  }

  function closeEditor() {
    selectedCode = null;
    document.querySelectorAll("#schoolTestMap path.state").forEach(function (path) {
      path.classList.remove("school-selected");
    });
    var editor = document.getElementById("schoolTestEditor");
    if (editor) editor.hidden = true;
  }

  function saveCurrentTyping() {
    if (!selectedCode || !activeAnswers) return;
    var input = document.getElementById("schoolTestInput");
    if (!input) return;
    activeAnswers[selectedCode] = input.value;
    writeDraft(activeProfileName(), activeAnswers);
    paintState(selectedCode);
    updateProgress();
  }

  function wireBlankMap() {
    wireTouchFeedback("schoolTestMap");
    document.querySelectorAll("#schoolTestMap path.state, #schoolTestMap path.state-hit").forEach(function (path) {
      path.addEventListener("click", function () { selectBlank(path.dataset.code); });
    });
  }

  function renderSchoolTest(answers) {
    installStyles();
    schoolTestActive = true;
    selectedCode = null;
    activeAnswers = Object.assign({}, answers || {});
    var required = schoolRequiredScore(new Date());
    var map = buildMapSVG({ interactive: true, showTitles: false, classMap: mapClassMap(activeAnswers) });

    app.innerHTML =
      '<div class="school-test-head"><div><h1>🎯 School Test Run</h1><p class="subtitle">Blank-map practice — match the real classroom test.</p></div><button type="button" class="btn-home" id="schoolTestExit">Save &amp; exit</button></div>' +
      '<div class="school-test-status"><span><strong id="schoolTestCount">' + answeredCount(activeAnswers) + ' of 50 filled</strong></span><span>Current goal: ' + required + '/50</span></div>' +
      '<p class="school-test-map-note">Tap a state, type its name, then move to another state. No hints or correctness feedback appear until you submit.</p>' +
      mapWrapHTML(map, "schoolTestMap") +
      '<section class="school-test-editor" id="schoolTestEditor" hidden>' +
        '<div class="prompt-label">Selected blank</div>' +
        '<form class="spell-form" id="schoolTestForm" autocomplete="off">' +
          '<input type="text" id="schoolTestInput" aria-label="Type the state name for the selected blank" autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false" placeholder="Type the state name">' +
          '<button type="submit">Save</button>' +
        '</form>' +
        '<div class="prompt-hint">No correctness feedback until you submit.</div>' +
      '</section>' +
      '<div class="school-test-actions"><button type="button" class="school-test-submit" id="schoolTestSubmit">Submit test · ' + answeredCount(activeAnswers) + '/50</button></div>';

    wireBlankMap();
    document.getElementById("schoolTestInput").addEventListener("input", saveCurrentTyping);
    document.getElementById("schoolTestForm").addEventListener("submit", function (event) {
      event.preventDefault();
      saveCurrentTyping();
      closeEditor();
    });
    document.getElementById("schoolTestExit").addEventListener("click", function () {
      saveCurrentTyping();
      schoolTestActive = false;
      showMenu();
    });
    document.getElementById("schoolTestSubmit").addEventListener("click", submitSchoolTest);
  }

  function recordSchoolEvidence(results) {
    var data = loadData();
    if (!data.activeProfile) return;
    var profile = data.profiles[data.activeProfile];
    var recentBefore = (profile.recent || []).slice();
    results.forEach(function (result) { recordAnswer(result.code, result.correct); });
    data = loadData();
    if (data.activeProfile && data.profiles[data.activeProfile]) {
      data.profiles[data.activeProfile].recent = recentBefore;
      saveData(data);
      if (typeof schedulePush === "function") schedulePush();
    }
  }

  function submitSchoolTest() {
    saveCurrentTyping();
    var filled = answeredCount(activeAnswers || {});
    if (filled < STATES.length && !window.confirm("You still have " + (STATES.length - filled) + " blank state" + (STATES.length - filled === 1 ? "" : "s") + ". Submit anyway?")) return;

    var results = STATES.map(function (state) {
      var answer = (activeAnswers && activeAnswers[state.code]) || "";
      return { code: state.code, name: state.name, answer: answer, correct: canonicalName(answer) === canonicalName(state.name) };
    });
    var correct = results.filter(function (result) { return result.correct; }).length;
    var missed = results.filter(function (result) { return !result.correct; });
    recordSchoolEvidence(results);
    clearDraft(activeProfileName());
    schoolTestActive = false;
    activeAnswers = null;
    selectedCode = null;
    renderSchoolResults(correct, missed);
  }

  function renderSchoolResults(correct, missed) {
    var required = schoolRequiredScore(new Date());
    var met = correct >= required;
    var missedHtml = missed.length ?
      '<div class="missed-list"><h3>Review these ' + missed.length + '</h3>' + missed.map(function (item) {
        return '<div class="missed-item"><span class="mi-name">' + item.name + '</span><span class="mi-type">Map + spelling</span></div>';
      }).join("") + '</div>' : "";

    app.innerHTML =
      '<h1>Test Run Results</h1>' +
      '<div class="prompt-card results">' +
        '<div class="score-big">' + correct + '/50</div>' +
        '<div class="grade" style="color:' + (met ? '#38a169' : '#dd6b20') + '">' +
          (met ? 'Current school target met' : 'Current school target: ' + required + '/50') +
        '</div>' +
        '<div class="message">' + (correct === 50 ? 'All 50 locations and names are correct.' : 'Your next adaptive rounds will prioritize the states that need another pass.') + '</div>' +
      '</div>' +
      missedHtml +
      '<div class="btn-row">' +
        (missed.length ? '<button class="btn-retry-missed" id="schoolPracticeMissed">Practice missed states</button>' : '') +
        '<button class="btn-restart" id="schoolTestAgain">Try Again</button>' +
        '<button class="btn-home" id="schoolTestHome">Back to Menu</button>' +
      '</div>';

    if (missed.length) document.getElementById("schoolPracticeMissed").addEventListener("click", function () { startQuickRound(Math.min(10, Math.max(5, missed.length))); });
    document.getElementById("schoolTestAgain").addEventListener("click", function () { renderSchoolTest({}); });
    document.getElementById("schoolTestHome").addEventListener("click", showMenu);
  }

  function startSchoolTest() {
    var profileName = activeProfileName();
    var draft = draftFor(profileName);
    if (draft && answeredCount(draft.answers) > 0) {
      var replace = window.confirm("Start a new blank-map test? Your saved Test Run draft will be replaced.");
      if (!replace) return;
    }
    clearDraft(profileName);
    writeDraft(profileName, {});
    renderSchoolTest({});
  }

  window.usStatesSchoolRequiredScore = schoolRequiredScore;
  window.assessmentTestStates = function () { return STATES.slice(); };

  var baseShowMenu = window.showMenu;
  window.showMenu = function () {
    schoolTestActive = false;
    selectedCode = null;
    baseShowMenu();

    var required = schoolRequiredScore(new Date());
    var card = document.querySelector('.menu-card[data-mode="test"]');
    if (card) {
      var badge = card.querySelector(".badge");
      var description = card.querySelector("p");
      if (badge) badge.textContent = "Graded • 50 questions";
      if (description) description.textContent = required === 50
        ? "Blank 50-state map. Fill every state name in the correct place. Goal: 50/50."
        : "Blank 50-state map. Fill each state name in the correct place. Goal: 40/50 now; final goal 50/50 by Sep 16.";
    }

    var profileName = activeProfileName();
    var draft = draftFor(profileName);
    var count = draft ? answeredCount(draft.answers) : 0;
    if (count > 0 && card && !document.querySelector('[data-mode="school-resume"]')) {
      var resume = document.createElement("button");
      resume.type = "button";
      resume.className = "menu-card";
      resume.dataset.mode = "school-resume";
      resume.innerHTML = '<div class="card-icon">⏭️</div><span class="badge badge-resume">' + count + '/50 filled</span><h2>Resume Test Run</h2><p>Continue the blank-map test exactly where you stopped.</p>';
      card.parentNode.insertBefore(resume, card);
      resume.addEventListener("click", function () { renderSchoolTest(draft.answers); });
    }
  };

  window.startTest = startSchoolTest;
  window.__schoolTestState = function () {
    return {
      active: schoolTestActive,
      selectedCode: selectedCode,
      answered: answeredCount(activeAnswers || {}),
      total: STATES.length,
      required: schoolRequiredScore(new Date())
    };
  };

  installStyles();
  window.showMenu();
})();
