(function () {
  "use strict";

  var root = document;
  var storageKey = "aortopathy-academy-v1";
  var state = loadState();

  function loadState() {
    try {
      var parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return {
        visited: parsed.visited || ["start"],
        pretestComplete: !!parsed.pretestComplete,
        pretestScore: Number.isFinite(parsed.pretestScore) ? parsed.pretestScore : null,
        casesComplete: parsed.casesComplete || [],
        posttestBest: Number.isFinite(parsed.posttestBest) ? parsed.posttestBest : 0,
        posttestPassed: !!parsed.posttestPassed
      };
    } catch (error) {
      return { visited: ["start"], pretestComplete: false, pretestScore: null, casesComplete: [], posttestBest: 0, posttestPassed: false };
    }
  }

  function saveState() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (error) { /* progress remains in memory */ }
    updateProgress();
  }

  var tabs = Array.from(root.querySelectorAll("[data-tab]"));
  var panels = Array.from(root.querySelectorAll("[data-panel]"));

  function switchTab(name, focusTab) {
    tabs.forEach(function (tab) {
      var active = tab.getAttribute("data-tab") === name;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.setAttribute("tabindex", active ? "0" : "-1");
      if (active && focusTab) tab.focus();
    });
    panels.forEach(function (panel) { panel.hidden = panel.getAttribute("data-panel") !== name; });
    if (!state.visited.includes(name)) state.visited.push(name);
    saveState();
    if (!focusTab) root.getElementById("main-content").scrollIntoView({ block: "start" });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () { switchTab(tab.getAttribute("data-tab"), false); });
    tab.addEventListener("keydown", function (event) {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      var nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;
      switchTab(tabs[nextIndex].getAttribute("data-tab"), true);
    });
  });

  root.querySelectorAll("[data-open-tab]").forEach(function (button) {
    button.addEventListener("click", function () { switchTab(button.getAttribute("data-open-tab"), false); });
  });

  root.addEventListener("click", function (event) {
    var citation = event.target.closest('a[href^="#ref-"]');
    if (!citation) return;
    event.preventDefault();
    switchTab("quick", false);
    setTimeout(function () {
      var target = root.querySelector(citation.getAttribute("href"));
      if (target) target.scrollIntoView({ block: "center" });
    }, 20);
  });

  function updateProgress() {
    var completeUnits = state.visited.length + (state.pretestComplete ? 1 : 0) + state.casesComplete.length + (state.posttestPassed ? 1 : 0);
    var totalUnits = tabs.length + 1 + 5 + 1;
    var percent = Math.min(100, Math.round(completeUnits / totalUnits * 100));
    root.getElementById("progress-fill").style.width = percent + "%";
    root.getElementById("progress-percent").textContent = percent + "% complete";
    tabs.forEach(function (tab) {
      var name = tab.getAttribute("data-tab");
      var done = state.visited.includes(name);
      if (name === "cases") done = state.casesComplete.length === 5;
      if (name === "assessment") done = state.posttestPassed;
      tab.classList.toggle("is-done", done);
    });
    root.querySelectorAll("[data-case]").forEach(function (button) {
      var caseIndex = Number(button.getAttribute("data-case"));
      button.classList.toggle("is-complete", state.casesComplete.includes(caseIndex));
      var marker = button.querySelector(".case-done-marker");
      if (state.casesComplete.includes(caseIndex) && !marker) {
        var span = root.createElement("span");
        span.className = "case-done-marker";
        span.textContent = " ✓";
        button.appendChild(span);
      }
    });
  }

  root.querySelectorAll("[data-opening]").forEach(function (button) {
    button.addEventListener("click", function () {
      var selected = Number(button.getAttribute("data-opening"));
      var correct = 1;
      root.querySelectorAll("[data-opening]").forEach(function (choice) {
        var index = Number(choice.getAttribute("data-opening"));
        choice.disabled = true;
        choice.classList.toggle("correct", index === correct);
        choice.classList.toggle("incorrect", index === selected && index !== correct);
      });
      var feedback = root.getElementById("opening-feedback");
      feedback.className = "feedback-box";
      feedback.innerHTML = selected === correct
        ? "<strong>Correct.</strong> Normal physical findings do not exclude HTAD. The family event creates a high-risk signal: document the pedigree, image the child, and obtain genetics/aortopathy evaluation.<a class='cite' href='#ref-aha'>1</a>"
        : "<strong>That would miss the central risk.</strong> A normal examination does not exclude HTAD. Syndromic features may be age dependent, and nonsyndromic HTAD may never produce an external phenotype. Start the family, imaging, and genetics pathway now.<a class='cite' href='#ref-aha'>1</a>";
    });
  });

  var pathways = {
    suspected: {
      title: "Suspected heritable thoracic aortic disease",
      summary: "Do not make a syndrome name the admission ticket. Aortic or family phenotype is enough to start evaluation.",
      steps: [
        ["Stabilize", "Screen for acute pain, syncope, neurologic change, perfusion deficit, or pregnancy."],
        ["Phenotype", "3-generation pedigree plus cardiovascular, ocular, craniofacial, skeletal, skin, joint, and neurologic examination."],
        ["Image", "TTE now; add MRI/MRA or CTA when anatomy or suspected disease extends beyond the echo window."],
        ["Escalate", "Pediatric aortopathy and genetics referral; image/test relatives according to phenotype and results."]
      ],
      note: "A negative panel or VUS does not end phenotype-driven surveillance or family imaging."
    },
    bav: {
      title: "Bicuspid aortic valve with or without dilation",
      summary: "Separate valve disease, aortic phenotype, and inherited-disease probability.",
      steps: [
        ["Define", "TTE: valve morphology, stenosis/regurgitation, root, ascending aorta, arch/coarctation, LV response."],
        ["Trend", "Use the same measurement method; compare absolute size and Z score, growth rate, and valve function."],
        ["Family", "Recommend TTE screening of first-degree relatives for BAV and aortic dilation."],
        ["Genetics", "Refer when syndromic features, dissection/rupture history, known familial HTAD variant, or disproportionate aortopathy is present."]
      ],
      note: "Medical therapy for isolated pediatric BAV aortopathy has limited evidence; do not portray extrapolation as a proven standard."
    },
    known: {
      title: "Known genetic aortopathy at a routine visit",
      summary: "The resident closes execution gaps between specialty visits.",
      steps: [
        ["Reconcile", "Diagnosis/gene/variant, last TTE and cross-sectional study, dimensions/trend, prior procedures, and current medications."],
        ["Screen", "New pain, syncope, neurologic or perfusion symptoms; BP control; medication adverse effects; pregnancy potential."],
        ["Enable", "Activity/school plan, hydration/restroom/rest access, emergency letter, medication list, and family understanding."],
        ["Close loop", "Confirm next imaging and specialty appointment; expedite for high-risk features, rapid growth, or severe dilation."]
      ],
      note: "Do not independently convert a Z-score category into a surveillance interval or surgical decision."
    },
    acute: {
      title: "Known or suspected aortopathy with acute symptoms",
      summary: "Aortic and branch-vessel catastrophes are time-dependent and can occur without a previously large aneurysm.",
      steps: [
        ["Activate", "Emergency transport/evaluation; do not send the patient home to arrange outpatient imaging."],
        ["Communicate", "Name the diagnosis or concern, gene if known, prior surgery, tissue fragility, symptoms, and last imaging."],
        ["Image", "Rapid definitive aortic/arterial imaging appropriate to stability and the symptomatic vascular territory."],
        ["Team", "Early cardiology, aortic/vascular surgery, critical care, and genetics/syndrome expertise as appropriate."]
      ],
      note: "Normal TTE, MRA, or CTA in the past does not rule out an acute event today—especially in vEDS."
    }
  };

  function renderPathway(name) {
    var item = pathways[name];
    var stage = root.getElementById("pathway-stage");
    stage.innerHTML = "<p class='kicker'>Selected pathway</p><h3>" + item.title + "</h3><p>" + item.summary + "</p><div class='path-timeline'>" + item.steps.map(function (step) {
      return "<div class='path-step'><strong>" + step[0] + "</strong><p>" + step[1] + "</p></div>";
    }).join("") + "</div><div class='alert'><strong>Guardrail:</strong> " + item.note + "</div>";
  }

  root.querySelectorAll("[data-path]").forEach(function (button) {
    button.addEventListener("click", function () {
      root.querySelectorAll("[data-path]").forEach(function (item) { item.classList.toggle("is-active", item === button); });
      renderPathway(button.getAttribute("data-path"));
    });
  });
  renderPathway("suspected");

  root.querySelectorAll("[data-condition-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      var filter = button.getAttribute("data-condition-filter");
      root.querySelectorAll("[data-condition-filter]").forEach(function (item) { item.classList.toggle("is-active", item === button); });
      root.querySelectorAll("[data-condition]").forEach(function (card) {
        card.hidden = filter !== "all" && card.getAttribute("data-condition") !== filter;
      });
    });
  });

  var preQuestions = [
    {
      q: "An asymptomatic 8-year-old has a normal examination, but a parent had an ascending aortic dissection at age 36. What is the best next step?",
      options: ["Reassure and recheck at age 13", "TTE plus detailed pedigree and genetics/aortopathy evaluation", "Order a chest radiograph only"],
      correct: 1,
      explain: "A normal examination does not exclude HTAD. Early family imaging and genetic evaluation can change surveillance for the child and relatives."
    },
    {
      q: "A 12-year-old's report gives an aortic root Z score of +2.7 using a validated pediatric nomogram. How does the 2024 AHA statement classify this?",
      options: ["Normal", "Mild dilation", "Moderate dilation"],
      correct: 1,
      explain: "For children under 16, Z 2 to <3.5 is mild dilation; Z 3.5 to <5 is moderate."
    },
    {
      q: "Which imaging study is the usual first-line test for diagnosis and surveillance of the aortic root and ascending aorta in children?",
      options: ["Transthoracic echocardiography", "Invasive angiography", "Chest radiography"],
      correct: 0,
      explain: "TTE is primary; MRI/MRA or CTA is added when the echo window is incomplete or the disease extends beyond it."
    },
    {
      q: "A child is newly diagnosed with Loeys-Dietz syndrome. Which baseline imaging concept is most important?",
      options: ["Only the aortic root requires imaging", "Head-to-pelvis cross-sectional arterial imaging plus TTE", "No imaging until a murmur develops"],
      correct: 1,
      explain: "LDS can involve the entire arterial tree; baseline TTE and head-to-pelvis cross-sectional imaging are central, with timing individualized in young children."
    },
    {
      q: "Which statement best summarizes randomized medication evidence in pediatric Marfan syndrome?",
      options: ["Losartan eliminated the need for surveillance", "Atenolol and losartan both slowed aortic root growth without a significant difference", "Only calcium-channel blockers have trial support"],
      correct: 1,
      explain: "The Pediatric Heart Network trial found both atenolol and losartan effective for slowing aortic root growth, without significant between-group difference."
    },
    {
      q: "A teen with known HTAD develops abrupt severe back pain and left-arm weakness. What is the safest disposition?",
      options: ["Routine cardiology follow-up within one week", "Emergency evaluation for acute aortic/arterial disease", "Reassure if last year's MRI was normal"],
      correct: 1,
      explain: "Sudden pain plus neurologic deficit is time-critical. Prior normal imaging does not exclude a new dissection or branch-vessel event."
    }
  ];

  var preState = { index: 0, score: 0, answers: [] };
  root.getElementById("pretest-start").addEventListener("click", function () {
    preState = { index: 0, score: 0, answers: [] };
    root.querySelector("#pretest-card .pretest-intro").hidden = true;
    renderPretestQuestion();
  });

  function renderPretestQuestion() {
    var stage = root.getElementById("pretest-stage");
    if (preState.index >= preQuestions.length) {
      state.pretestComplete = true;
      state.pretestScore = preState.score;
      saveState();
      stage.innerHTML = "<div class='pretest-result'><p class='kicker'>Baseline complete</p><h3>" + preState.score + " of " + preQuestions.length + " correct</h3><p>This is diagnostic, not a grade. Review the rationales below, then continue to the core lesson.</p>" + preQuestions.map(function (item, index) {
        var correct = preState.answers[index] === item.correct;
        return "<details><summary>Question " + (index + 1) + ": " + (correct ? "Correct" : "Review") + "</summary><p>" + item.explain + "</p></details>";
      }).join("") + "<div class='quiz-actions'><button class='button' type='button' data-open-tab='core'>Continue to core lesson</button><button class='button button-secondary' type='button' id='pretest-retry'>Retake pretest</button></div></div>";
      stage.querySelector("[data-open-tab]").addEventListener("click", function () { switchTab("core", false); });
      stage.querySelector("#pretest-retry").addEventListener("click", function () {
        preState = { index: 0, score: 0, answers: [] };
        renderPretestQuestion();
      });
      return;
    }
    var item = preQuestions[preState.index];
    stage.innerHTML = "<div class='quiz-topline'><span>Pretest " + (preState.index + 1) + " of " + preQuestions.length + "</span><span>Baseline only</span></div><div class='quiz-progress'><div style='width:" + (preState.index / preQuestions.length * 100) + "%'></div></div><h3>" + item.q + "</h3><div class='choice-list'>" + item.options.map(function (option, index) {
      return "<button class='choice-button' type='button' data-pre-answer='" + index + "'>" + option + "</button>";
    }).join("") + "</div>";
    stage.querySelectorAll("[data-pre-answer]").forEach(function (button) {
      button.addEventListener("click", function () {
        var selected = Number(button.getAttribute("data-pre-answer"));
        preState.answers.push(selected);
        if (selected === item.correct) preState.score += 1;
        preState.index += 1;
        renderPretestQuestion();
      });
    });
  }

  var cases = [
    {
      title: "The quiet pedigree",
      intro: "A 9-year-old's mother had emergency ascending-aortic surgery at 34. The child has no murmur, marfanoid habitus, hypermobility, or skin findings.",
      vitals: ["Age 9", "Asymptomatic", "Normal examination", "First-degree dissection"],
      steps: [
        { q: "What is the best first move?", options: ["Reassure because there is no phenotype", "Construct a 3-generation pedigree, obtain TTE, and refer for HTAD genetics/aortopathy evaluation", "Wait for puberty"], correct: 1, explain: "Normal examination results do not exclude genetic aortopathy. The parent's early dissection creates a strong HTAD signal." },
        { q: "The child's HTAD panel is negative and TTE is normal. What now?", options: ["Discharge permanently", "Continue phenotype/family-driven follow-up and image at-risk relatives", "Treat the negative result as proof the mother's event was sporadic"], correct: 1, explain: "A negative panel does not exclude HTAD. The 2024 statement supports continued follow-up and family imaging based on the pedigree." },
        { q: "A maternal uncle is found to have aortic root dilation. What is the best family action?", options: ["Only the child needs follow-up", "Expand imaging to the uncle's first-degree relatives and revisit genetic evaluation", "Test relatives for the child's negative panel"], correct: 1, explain: "A newly recognized affected relative strengthens familial disease probability and expands cascade imaging. There is no negative-variant test to cascade." }
      ]
    },
    {
      title: "The Marfan athlete",
      intro: "A 15-year-old with pathogenic FBN1-related Marfan syndrome wants to continue recreational swimming and school weight training. Aortic root Z score increased from 1.8 to 2.6 over 18 months.",
      vitals: ["Age 15", "FBN1 pathogenic variant", "Root Z 2.6", "Recreational athlete"],
      steps: [
        { q: "How should the current root be described?", options: ["Normal", "Mild dilation", "Moderate dilation"], correct: 1, explain: "Under age 16, Z 2 to <3.5 is mild dilation. The change also requires measurement and growth review." },
        { q: "What is the best medical-therapy statement?", options: ["A beta-blocker or ARB should be discussed with cardiology; both have trial support in Marfan", "Only losartan is effective", "Medication has no role until severe dilation"], correct: 0, explain: "Both beta-blockers and ARBs slow aortic growth in Marfan. The pediatric Marfan consensus recommends treatment when dilation is present." },
        { q: "What is the best activity plan?", options: ["Ban all exercise", "Encourage individualized aerobic activity and modify heavy isometric/maximal lifting through shared decision-making", "Approve unrestricted maximal lifting because the Z score is below 3.5"], correct: 1, explain: "Aerobic participation and inclusion are encouraged. Aortic size, growth, sport intensity, BP load, and extracardiac risks guide modification; blanket inactivity is harmful." }
      ]
    },
    {
      title: "The LDS pain call",
      intro: "A 13-year-old with TGFBR2-related Loeys-Dietz syndrome calls after sudden severe interscapular pain, vomiting, and transient right-hand weakness. Last month's TTE showed only mild root dilation.",
      vitals: ["Age 13", "TGFBR2", "Abrupt back pain", "Focal neurologic symptom"],
      steps: [
        { q: "What is the safest disposition?", options: ["Same-day clinic", "Emergency transport/evaluation now", "Repeat outpatient TTE tomorrow"], correct: 1, explain: "Pain plus neurologic symptoms in LDS is an acute aortic/branch-vessel emergency until excluded. Mild root size does not neutralize the risk." },
        { q: "Which imaging concept should the receiving team use?", options: ["TTE alone excludes dissection", "Rapid definitive cross-sectional imaging of the aorta and symptomatic arterial territory", "No imaging is needed if strength returns"], correct: 1, explain: "LDS involves the arterial tree beyond the root. Imaging must match the suspected vascular territory and clinical stability." },
        { q: "Why is the prior mild Z score insufficient reassurance?", options: ["LDS events can involve distal arteries and may occur at smaller dimensions", "Z scores are never used in children", "TGFBR2 affects only the brain"], correct: 0, explain: "TGFBR1/2-related LDS can be aggressive, diffuse, and event-prone at relatively small vascular dimensions." }
      ]
    },
    {
      title: "The BAV family",
      intro: "A 14-year-old with BAV has ascending-aortic Z score 3.8, mild aortic regurgitation, and no syndromic features. The child's father has BAV; a paternal aunt had an unexplained type A dissection at 42.",
      vitals: ["Age 14", "BAV", "Ascending Z 3.8", "Family dissection"],
      steps: [
        { q: "How should the ascending aorta be classified?", options: ["Mild", "Moderate", "Severe"], correct: 1, explain: "Under age 16, Z 3.5 to <5 is moderate dilation." },
        { q: "Which family plan is appropriate?", options: ["TTE screening for first-degree relatives and genetics review because dissection changes the family phenotype", "No relatives require evaluation because the father already knows he has BAV", "Genetic testing of the child replaces imaging of relatives"], correct: 0, explain: "BAV and aortic dilation aggregate in families. The aunt's early dissection adds an HTAD signal that merits genetics review and family imaging." },
        { q: "How should medication be presented?", options: ["Proven to prevent dissection in pediatric BAV", "Potential specialist-directed therapy with limited pediatric BAV evidence and substantial practice variation", "Contraindicated because the valve is bicuspid"], correct: 1, explain: "Pediatric BAV drug data are limited and largely extrapolated; shared specialist decision-making is more accurate than claiming proven benefit." }
      ]
    },
    {
      title: "The vEDS abdomen",
      intro: "A 12-year-old with molecularly confirmed vEDS develops abrupt severe abdominal pain and lightheadedness after a minor collision during recess. The most recent arterial MRA was normal.",
      vitals: ["Age 12", "COL3A1", "Minor trauma", "Abrupt abdominal pain"],
      steps: [
        { q: "What is the best immediate action?", options: ["Observe at school because MRA was normal", "Emergency evaluation for arterial or organ injury", "Schedule routine genetics follow-up"], correct: 1, explain: "vEDS events can occur without a known aneurysm and after minimal trauma. Sudden abdominal pain and presyncope require emergency evaluation." },
        { q: "What must be communicated before procedures?", options: ["The patient has tissue and arterial fragility; minimize unnecessary instrumentation and involve experienced teams", "All procedures are absolutely prohibited", "vEDS affects skin only"], correct: 0, explain: "Necessary care should proceed, but tissue fragility changes access, technique, complication planning, and team composition." },
        { q: "Which statement about the prior normal MRA is correct?", options: ["It eliminates the risk of rupture until the next scheduled scan", "It describes prior anatomy but does not eliminate today's arterial or organ event", "It proves the molecular diagnosis is wrong"], correct: 1, explain: "Normal cross-sectional imaging does not rule out future vEDS events; dissection or rupture may occur without a pre-existing aneurysm." }
      ]
    }
  ];

  var caseState = { caseIndex: 0, stepIndex: 0, log: [], answered: false };

  root.querySelectorAll("[data-case]").forEach(function (button) {
    button.addEventListener("click", function () {
      root.querySelectorAll("[data-case]").forEach(function (item) { item.classList.toggle("is-active", item === button); });
      caseState = { caseIndex: Number(button.getAttribute("data-case")), stepIndex: 0, log: [], answered: false };
      renderCase();
    });
  });

  function renderCase() {
    var item = cases[caseState.caseIndex];
    var step = item.steps[caseState.stepIndex];
    var stage = root.getElementById("case-stage");
    stage.innerHTML = "<div class='case-header'><div><p class='kicker'>Case " + (caseState.caseIndex + 1) + " · Decision " + (caseState.stepIndex + 1) + " of " + item.steps.length + "</p><h3>" + item.title + "</h3></div><span class='domain-badge'>Applied reasoning</span></div><p>" + item.intro + "</p><ul class='case-vitals'>" + item.vitals.map(function (vital) { return "<li>" + vital + "</li>"; }).join("") + "</ul><h4>" + step.q + "</h4><div class='choice-list'>" + step.options.map(function (option, index) {
      return "<button class='choice-button' type='button' data-case-answer='" + index + "'>" + option + "</button>";
    }).join("") + "</div><div id='case-feedback'></div><div class='quiz-actions'><button class='button' id='case-continue' type='button' disabled>Continue</button></div>";
    stage.querySelectorAll("[data-case-answer]").forEach(function (button) {
      button.addEventListener("click", function () { answerCase(Number(button.getAttribute("data-case-answer"))); });
    });
    stage.querySelector("#case-continue").addEventListener("click", continueCase);
    renderCaseLog();
  }

  function answerCase(selected) {
    if (caseState.answered) return;
    caseState.answered = true;
    var step = cases[caseState.caseIndex].steps[caseState.stepIndex];
    var correct = selected === step.correct;
    caseState.log.push(correct);
    root.querySelectorAll("[data-case-answer]").forEach(function (button) {
      var index = Number(button.getAttribute("data-case-answer"));
      button.disabled = true;
      button.classList.toggle("correct", index === step.correct);
      button.classList.toggle("incorrect", index === selected && !correct);
    });
    var feedback = root.getElementById("case-feedback");
    feedback.className = "case-feedback " + (correct ? "correct" : "incorrect");
    feedback.innerHTML = "<strong>" + (correct ? "Correct. " : "Not the safest choice. ") + "</strong>" + step.explain;
    root.getElementById("case-continue").disabled = false;
    renderCaseLog();
  }

  function continueCase() {
    if (!caseState.answered) return;
    var item = cases[caseState.caseIndex];
    if (caseState.stepIndex < item.steps.length - 1) {
      caseState.stepIndex += 1;
      caseState.answered = false;
      renderCase();
      return;
    }
    if (!state.casesComplete.includes(caseState.caseIndex)) state.casesComplete.push(caseState.caseIndex);
    saveState();
    var correctCount = caseState.log.filter(Boolean).length;
    root.getElementById("case-stage").innerHTML = "<p class='kicker'>Case complete</p><h3>" + item.title + "</h3><div class='score-ring " + (correctCount < 3 ? "fail" : "") + "'>" + correctCount + "/3</div><p class='result-title'>" + (correctCount === 3 ? "You executed the full pathway safely." : "Review the feedback, then replay the case until the sequence is automatic.") + "</p><div class='quiz-actions'><button class='button' id='case-replay' type='button'>Replay case</button><button class='button button-secondary' type='button' data-open-tab='assessment'>Go to posttest</button></div>";
    root.getElementById("case-replay").addEventListener("click", function () {
      caseState = { caseIndex: caseState.caseIndex, stepIndex: 0, log: [], answered: false };
      renderCase();
    });
    root.querySelector("#case-stage [data-open-tab]").addEventListener("click", function () { switchTab("assessment", false); });
    renderCaseLog();
  }

  function renderCaseLog() {
    root.getElementById("case-log").innerHTML = cases[caseState.caseIndex].steps.map(function (_, index) {
      var value = caseState.log[index];
      return "<span class='" + (value === true ? "correct" : value === false ? "incorrect" : "") + "' aria-label='Decision " + (index + 1) + (value === true ? " correct" : value === false ? " incorrect" : " not answered") + "'></span>";
    }).join("");
  }
  renderCase();

  var postQuestions = [
    { domain: "Recognition", q: "A 7-year-old has no syndromic features, but the father and paternal grandmother both had thoracic aortic aneurysms. Which statement is most accurate?", options: ["The normal examination makes HTAD unlikely enough to stop", "Nonsyndromic HTAD remains possible and warrants TTE plus genetics/aortopathy evaluation", "Only adults in the family require imaging"], correct: 1, explain: "HTAD may be nonsyndromic, and physical/family findings show variable penetrance. Image the child and launch gene/family evaluation." },
    { domain: "Recognition", q: "Which family-history detail most strongly modifies risk in pediatric aortopathy?", options: ["A relative had hypertension at 70", "A relative dissected when the aorta was under 5 cm", "A cousin had a benign murmur"], correct: 1, explain: "Dissection at a relatively small diameter is a high-risk family feature that can change surveillance and operative timing." },
    { domain: "Imaging", q: "A 13-year-old's aortic root Z score is +3.7. How is this classified in the 2024 AHA pediatric scheme?", options: ["Mild", "Moderate", "Severe"], correct: 1, explain: "For age <16, Z 3.5 to <5 is moderate dilation. Severity still does not determine management without diagnosis, trend, and risk modifiers." },
    { domain: "Imaging", q: "A reported aortic root Z score falls from 3.1 to 2.2 during a growth spurt. What is the best interpretation?", options: ["The aorta definitely regressed", "Verify body data, measurement technique, images, and nomogram before interpreting the change", "Z scores cannot be used during growth"], correct: 1, explain: "Z scores can shift with body growth and technical differences. Serial interpretation requires consistent technique and nomogram plus review of absolute dimensions." },
    { domain: "Evaluation", q: "Which is the most appropriate initial cardiovascular study for a child with suspected HTAD?", options: ["TTE assessing valve, root, ascending aorta, and associated anatomy", "Routine invasive angiography", "Exercise ECG alone"], correct: 0, explain: "TTE is the primary first-line study; cross-sectional imaging is added for incomplete views or disease beyond the proximal thoracic aorta." },
    { domain: "Evaluation", q: "A child is newly diagnosed with TGFBR2-related Loeys-Dietz syndrome. Which imaging plan is conceptually correct?", options: ["TTE only because LDS is confined to the root", "TTE plus baseline head-to-pelvis cross-sectional arterial imaging, individualized to age and sedation", "No imaging if BP is normal"], correct: 1, explain: "LDS can affect the arterial tree from head to pelvis. Baseline TTE and cross-sectional imaging define disease extent." },
    { domain: "Genetics", q: "A child with convincing familial thoracic aortic disease has a negative current multigene panel. What is the best next step?", options: ["Declare the condition nonheritable", "Continue phenotype/family-based imaging and genetics follow-up", "Test relatives for every VUS on the panel"], correct: 1, explain: "Negative testing does not exclude HTAD. Gene discovery and variant classification evolve; the phenotype and pedigree still drive care." },
    { domain: "Genetics", q: "A VUS is found in an HTAD gene. Which use is appropriate?", options: ["Use it alone to diagnose the child and operate on relatives", "Have genetics interpret it in context; do not use it as a causal result for irreversible decisions", "Assume it is benign and never revisit it"], correct: 1, explain: "A VUS is neither pathogenic nor benign. It should not be treated as a causal familial variant, and reclassification may occur." },
    { domain: "Management", q: "Which statement about medical therapy in Marfan syndrome is best supported?", options: ["Atenolol and losartan both slow aortic root growth; neither was superior in the major pediatric trial", "Losartan cures the underlying connective-tissue disorder", "Medication is supported only after severe dilation"], correct: 0, explain: "Both beta-blocker and ARB therapy have randomized evidence for slowing aortic root growth, with larger benefit observed in younger patients." },
    { domain: "Management", q: "How should ARB therapy be handled in an adolescent with pregnancy potential?", options: ["No counseling is needed", "Address teratogenicity, pregnancy planning, and effective contraception before and during therapy", "Continue automatically through pregnancy"], correct: 1, explain: "ARBs are teratogenic. Pregnancy potential must be discussed, with coordinated alternatives rather than abrupt unsupervised medication changes." },
    { domain: "Management", q: "A teen with isolated BAV and moderate ascending dilation asks whether losartan is proven to prevent progression. What is the best response?", options: ["Yes, pediatric BAV RCTs prove prevention", "Evidence is limited and extrapolated; therapy is individualized by cardiology", "All antihypertensive therapy is contraindicated in BAV"], correct: 1, explain: "Pediatric BAV medication evidence is limited, observational, and practice-variable. Present uncertainty honestly." },
    { domain: "Counseling", q: "Which activity recommendation best fits modern pediatric aortopathy care?", options: ["Ban all exercise", "Encourage individualized aerobic participation while modifying heavy isometric, maximal-strain, and trauma risks", "Use adult sport restrictions unchanged in preschool children"], correct: 1, explain: "Activity supports health and development. Pediatric counseling uses shared decision-making, diagnosis/size/growth, sport physiology, and extracardiac risks rather than blanket exclusion." },
    { domain: "Emergency", q: "A 12-year-old with vEDS has sudden severe abdominal pain and presyncope; last year's MRA was normal. What should happen?", options: ["Emergency evaluation for arterial or organ injury", "Routine clinic review next month", "Reassure because imaging was normal"], correct: 0, explain: "vEDS events may occur without a pre-existing aneurysm. The prior scan describes prior anatomy, not today's safety." },
    { domain: "Genetics", q: "Which molecular result is required to establish vascular Ehlers-Danlos syndrome?", options: ["Any VUS in a collagen gene", "A pathogenic or likely pathogenic COL3A1 variant", "A normal FBN1 result"], correct: 1, explain: "A pathogenic/likely pathogenic COL3A1 variant is necessary for vEDS diagnosis; phenotype alone may be subtle and overlaps with other disorders." },
    { domain: "Emergency", q: "Why must a resident recognize PRKG1-related HTAD as high risk?", options: ["It affects only the aortic valve", "Dissection may occur in adolescence with minimal or no aortic dilation", "It always produces obvious craniofacial findings"], correct: 1, explain: "PRKG1 is a key example of why diameter alone is not a universal risk metric; gene-specific expert management is essential." }
  ];

  var postState = { index: 0, score: 0, answers: [], domain: {}, answered: false };
  root.getElementById("posttest-start").addEventListener("click", startPosttest);

  function startPosttest() {
    postState = { index: 0, score: 0, answers: [], domain: {}, answered: false };
    root.getElementById("posttest-intro").hidden = true;
    renderPostQuestion();
  }

  function renderPostQuestion() {
    var stage = root.getElementById("posttest-stage");
    if (postState.index >= postQuestions.length) { renderPostResult(); return; }
    var item = postQuestions[postState.index];
    stage.innerHTML = "<div class='quiz-topline'><span id='post-counter'>Question " + (postState.index + 1) + " of " + postQuestions.length + "</span><span id='post-score'>Score: " + postState.score + "</span></div><div class='quiz-progress'><div style='width:" + (postState.index / postQuestions.length * 100) + "%'></div></div><span class='domain-badge'>" + item.domain + "</span><h3>" + item.q + "</h3><div class='choice-list' id='post-options'>" + item.options.map(function (option, index) {
      return "<button class='choice-button' type='button' data-post-answer='" + index + "'>" + option + "</button>";
    }).join("") + "</div><div id='post-explanation'></div><div class='quiz-actions'><button class='button' id='post-next' type='button' disabled>" + (postState.index === postQuestions.length - 1 ? "See results" : "Next question") + "</button></div>";
    stage.querySelectorAll("[data-post-answer]").forEach(function (button) {
      button.addEventListener("click", function () { answerPost(Number(button.getAttribute("data-post-answer"))); });
    });
    stage.querySelector("#post-next").addEventListener("click", function () {
      if (!postState.answered) return;
      postState.index += 1;
      postState.answered = false;
      renderPostQuestion();
    });
  }

  function answerPost(selected) {
    if (postState.answered) return;
    postState.answered = true;
    var item = postQuestions[postState.index];
    var correct = selected === item.correct;
    postState.answers.push(selected);
    if (!postState.domain[item.domain]) postState.domain[item.domain] = { correct: 0, total: 0 };
    postState.domain[item.domain].total += 1;
    if (correct) {
      postState.score += 1;
      postState.domain[item.domain].correct += 1;
    }
    root.querySelectorAll("[data-post-answer]").forEach(function (button) {
      var index = Number(button.getAttribute("data-post-answer"));
      button.disabled = true;
      button.classList.toggle("correct", index === item.correct);
      button.classList.toggle("incorrect", index === selected && !correct);
    });
    root.getElementById("post-score").textContent = "Score: " + postState.score;
    var explanation = root.getElementById("post-explanation");
    explanation.className = "quiz-explanation";
    explanation.innerHTML = "<strong>" + (correct ? "Correct. " : "Review. ") + "</strong>" + item.explain;
    root.getElementById("post-next").disabled = false;
  }

  function renderPostResult() {
    var stage = root.getElementById("posttest-stage");
    var passed = postState.score >= 12;
    state.posttestBest = Math.max(state.posttestBest, postState.score);
    if (passed) state.posttestPassed = true;
    saveState();
    var domains = Object.keys(postState.domain).map(function (name) {
      var item = postState.domain[name];
      return "<div><strong>" + item.correct + "/" + item.total + "</strong><span>" + name + "</span></div>";
    }).join("");
    stage.innerHTML = "<p class='kicker'>Posttest complete</p><div class='score-ring " + (passed ? "" : "fail") + "'>" + postState.score + "/15</div><h3 class='result-title'>" + (passed ? "Mastery achieved" : "Not yet at mastery") + "</h3><p class='result-title'>" + (passed ? "You met the 80% standard. Best score in this browser: " + state.posttestBest + "/15." : "You need 12 correct. Review your weak domains and retry; attempts are unlimited.") + "</p><div class='domain-results'>" + domains + "</div><div class='quiz-actions'><button class='button' id='post-retry' type='button'>Retake posttest</button><button class='button button-secondary' type='button' data-open-tab='quick'>Open quick reference</button></div>";
    root.getElementById("post-retry").addEventListener("click", startPosttest);
    stage.querySelector("[data-open-tab]").addEventListener("click", function () { switchTab("quick", false); });
  }

  root.getElementById("print-reference").addEventListener("click", function () { window.print(); });

  updateProgress();
})();
