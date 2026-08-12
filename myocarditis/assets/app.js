(function () {
  "use strict";

  var root = document;
  var storageKey = "myocarditis-academy-v1";
  var state = loadState();

  function loadState() {
    try {
      var parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return {
        visited: Array.isArray(parsed.visited) ? parsed.visited : ["start"],
        pretestComplete: !!parsed.pretestComplete,
        pretestScore: Number.isFinite(parsed.pretestScore) ? parsed.pretestScore : null,
        casesComplete: Array.isArray(parsed.casesComplete) ? parsed.casesComplete : [],
        posttestBest: Number.isFinite(parsed.posttestBest) ? parsed.posttestBest : 0,
        posttestPassed: !!parsed.posttestPassed
      };
    } catch (error) {
      return { visited: ["start"], pretestComplete: false, pretestScore: null, casesComplete: [], posttestBest: 0, posttestPassed: false };
    }
  }

  function saveState() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (error) { /* Progress remains in memory. */ }
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
    var totalUnits = tabs.length + 1 + cases.length + 1;
    var percent = Math.min(100, Math.round(completeUnits / totalUnits * 100));
    root.getElementById("progress-fill").style.width = percent + "%";
    root.getElementById("progress-percent").textContent = percent + "% complete";
    tabs.forEach(function (tab) {
      var name = tab.getAttribute("data-tab");
      var done = state.visited.includes(name);
      if (name === "cases") done = state.casesComplete.length === cases.length;
      if (name === "assessment") done = state.posttestPassed;
      tab.classList.toggle("is-done", done);
      var existing = tab.querySelector(".done");
      if (done && !existing) {
        var mark = root.createElement("span");
        mark.className = "done";
        mark.textContent = " ✓";
        tab.appendChild(mark);
      } else if (!done && existing) existing.remove();
    });
    renderBestScore();
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
        ? "<strong>Correct.</strong> Hepatomegaly, cool perfusion, hypotension, and crackles create a cardiac-failure signal. Activate cardiac/PICU assessment, obtain echo/ECG/biomarkers, and make fluid decisions in small reassessed steps.<a class='cite' href='#ref-adhf'>5</a>"
        : "<strong>Unsafe.</strong> Waiting for a laboratory result or giving a reflexive large bolus risks deterioration. This child needs immediate cardiac assessment and physiology-directed resuscitation.<a class='cite' href='#ref-adhf'>5</a>";
    });
  });

  var preQuestions = [
    {
      q: "An infant with presumed sepsis has hepatomegaly, crackles, cool extremities, and hypotension. What is the safest fluid strategy?",
      options: ["Automatic rapid 20 mL/kg bolus", "Cautious, small reassessed fluid only if preload appears inadequate while urgent cardiac evaluation proceeds", "No resuscitation until CMR"],
      correct: 1,
      explain: "Heart failure can mimic sepsis. Define congestion and perfusion, avoid reflexive large volume loading, and do not delay stabilization for advanced imaging."
    },
    {
      q: "Which statement about initial testing is correct?",
      options: ["Normal troponin excludes myocarditis", "Normal ECG excludes electrical involvement", "Normal ECG/troponin/echo can lower probability but do not rule out a high-suspicion case"],
      correct: 2,
      explain: "No single common initial test has adequate sensitivity to close a clinically compelling case."
    },
    {
      q: "What combination supports active myocardial inflammation under the updated Lake Louise CMR framework?",
      options: ["Any two of T2, T1, and LGE as three separate buckets", "At least one T2-based edema marker plus at least one T1-based nonischemic injury marker", "LGE alone is mandatory and sufficient"],
      correct: 1,
      explain: "The 2018 framework pairs a T2-based marker with a T1-based marker. LGE belongs to the T1-based group."
    },
    {
      q: "A child with suspected myocarditis has rising lactate, biventricular dysfunction, and escalating epinephrine. What is the best next systems decision?",
      options: ["Wait for biopsy before transfer", "Contact an MCS/transplant-capable center now", "Add several vasoactives before discussing transfer"],
      correct: 1,
      explain: "Transfer and advanced-support planning should occur before shock and end-organ injury become irreversible."
    },
    {
      q: "Which statement best reflects pediatric evidence for IVIG in presumed idiopathic myocarditis?",
      options: ["It is proven standard therapy for every child", "It is widely used but benefit remains uncertain and practice is center-specific", "It is contraindicated in all ventricular dysfunction"],
      correct: 1,
      explain: "Pediatric use is common, but heterogeneous observational data do not establish universal comparative benefit."
    },
    {
      q: "Which return-to-sport statement is current?",
      options: ["Every child must avoid all exercise for exactly six months", "Return is based on phenotype and recovery testing; selected preserved-function cases may be considered after 4–6 weeks", "Normal LVEF alone permits immediate return"],
      correct: 1,
      explain: "Current athlete guidance replaced a universal clock with phenotype-, inflammation-, function-, and arrhythmia-based reassessment."
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
      stage.innerHTML = "<div class='pretest-result'><p class='kicker'>Baseline complete</p><h3>" + preState.score + " of " + preQuestions.length + " correct</h3><p>This is diagnostic, not a grade. Review the rationales, then continue.</p>" + preQuestions.map(function (item, index) {
        var correct = preState.answers[index] === item.correct;
        return "<details><summary>Question " + (index + 1) + ": " + (correct ? "Correct" : "Review") + "</summary><p>" + item.explain + "</p></details>";
      }).join("") + "<div class='quiz-actions'><button class='button' type='button' data-pre-continue>Continue to recognition</button><button class='button button-secondary' type='button' data-pre-retry>Retake pretest</button></div></div>";
      stage.querySelector("[data-pre-continue]").addEventListener("click", function () { switchTab("recognize", false); });
      stage.querySelector("[data-pre-retry]").addEventListener("click", function () {
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
      title: "The bronchiolitis mimic",
      subtitle: "Infant HF recognition",
      intro: "A 5-month-old has cough, poor feeding, HR 188, RR 62, BP 68/42, hepatomegaly, crackles, and cool extremities.",
      vitals: ["5 months", "HR 188", "BP 68/42", "Liver +4 cm", "Cool perfusion"],
      steps: [
        { q: "What is the best immediate framing?", options: ["Uncomplicated bronchiolitis", "Possible acute heart failure/myocarditis within a sepsis-like presentation", "Dehydration proven by tachycardia"], correct: 1, explain: "Hepatomegaly, crackles, hypotension, and cool perfusion are not explained by uncomplicated bronchiolitis.", consequence: "Calling this bronchiolitis delays cardiac monitoring and support." },
        { q: "The sepsis order set proposes 20 mL/kg rapidly. What should you do?", options: ["Give it without reassessment", "Pause, activate cardiac/PICU assessment, obtain bedside echo, and use only cautious reassessed fluid if preload appears inadequate", "Wait for troponin while giving maintenance fluid"], correct: 1, explain: "A hypotensive child can be congested. Reassessed physiology—not the order-set label—should determine fluid.", consequence: "A large rapid bolus may worsen edema and wall stress." },
        { q: "Echo shows LVEF 18% with RV dysfunction; lactate rises. Best destination?", options: ["General ward with daily echo", "PICU locally regardless of capability", "Immediate MCS-capable-center coordination while stabilization continues"], correct: 2, explain: "Severe biventricular dysfunction and worsening perfusion justify early advanced-center transfer.", consequence: "Waiting for frank shock can make transport and recovery less likely." }
      ]
    },
    {
      title: "The chest-pain athlete",
      subtitle: "Preserved-function myocarditis",
      intro: "A 16-year-old has acute chest pain after a viral syndrome. Troponin is elevated, ECG has inferolateral ST-T changes, BP/perfusion are normal, and echo LVEF is 61%.",
      vitals: ["16 years", "Stable", "LVEF 61%", "Troponin elevated", "ST-T change"],
      steps: [
        { q: "What is the safest next step?", options: ["Discharge because LVEF is normal", "Monitored cardiology evaluation with serial ECG/troponin and CMR when feasible", "Give thrombolysis for STEMI"], correct: 1, explain: "Preserved LVEF does not remove arrhythmic or inflammatory risk. The presentation needs monitored evaluation and diagnostic clarification.", consequence: "Normal global function is not a rule-out test." },
        { q: "CMR interpretation reports T2 edema and subepicardial LGE. How does this map to Lake Louise?", options: ["T2-based + T1-based criteria are present", "Only one of three criteria is present", "LGE proves coronary infarction"], correct: 0, explain: "T2 supports edema; nonischemic LGE is a T1-based injury marker. Together they support active inflammation.", consequence: "Treating LGE as a third independent bucket misstates the criteria." },
        { q: "What treatment statement is most accurate?", options: ["Routine IVIG plus steroids is proven", "Supportive/monitored care is foundational; immunotherapy is individualized because routine benefit is uncertain", "NSAIDs are mandatory even if HF develops"], correct: 1, explain: "Do not portray center-specific immunotherapy as settled evidence. Treatment follows phenotype and cause.", consequence: "Overclaiming uncertain therapy prevents informed decision-making." }
      ]
    },
    {
      title: "The collapsing teen",
      subtitle: "Fulminant myocarditis",
      intro: "A 14-year-old with suspected myocarditis has LVEF 10%, rising lactate, oliguria, epinephrine escalation, and recurrent VT.",
      vitals: ["14 years", "LVEF 10%", "Rising lactate", "Oliguria", "Recurrent VT"],
      steps: [
        { q: "VT becomes pulseless. What is the immediate priority?", options: ["Amiodarone before electricity", "PALS cardiac arrest care with defibrillation and high-quality CPR", "Wait for electrophysiology"], correct: 1, explain: "Pulseless VT requires immediate defibrillation and CPR. Etiology-specific care must not delay resuscitation.", consequence: "Medication-first delay reduces the chance of ROSC." },
        { q: "ROSC occurs, but shock and VT recur. What strategic move is highest yield?", options: ["Keep adding catecholamines without a support plan", "Activate VA-ECMO/MCS now and discuss LV unloading", "Delay MCS until biopsy confirms myocarditis"], correct: 1, explain: "Recurrent arrest, severe pump failure, rising lactate, and electrical instability are MCS signals.", consequence: "Biopsy must not delay circulatory rescue." },
        { q: "Which statement about intubation is best?", options: ["It is absolutely forbidden", "It is high risk; if required, prepare hemodynamic rescue and an MCS contingency", "Propofol induction is always preferred"], correct: 1, explain: "A necessary airway should proceed with cardiovascular preparation; blanket prohibition is unsafe.", consequence: "Both unprepared intubation and delayed necessary airway care can be catastrophic." }
      ]
    },
    {
      title: "The incessant tachycardia",
      subtitle: "Myocarditis mimic",
      intro: "A 7-month-old has a narrow-complex long-RP tachycardia at 210 for an uncertain duration, LVEF 24%, mild troponin elevation, and no systemic inflammation.",
      vitals: ["7 months", "HR 210", "Long-RP SVT", "LVEF 24%", "CRP normal"],
      steps: [
        { q: "What diagnosis must stay prominent?", options: ["Tachycardia-induced cardiomyopathy", "Myocarditis is proven by mild troponin elevation", "Normal infant physiology"], correct: 0, explain: "An incessant arrhythmia can cause severe, reversible dysfunction and mild demand-related troponin elevation.", consequence: "Anchoring on a preceding URI can miss the primary driver." },
        { q: "What is the therapeutic-diagnostic priority?", options: ["IVIG before rhythm care", "Define and control/terminate the tachyarrhythmia with cardiology/EP support", "Observe for spontaneous EF recovery"], correct: 1, explain: "Rhythm control treats the driver; subsequent ventricular recovery supports the diagnosis.", consequence: "Untreated incessant tachycardia perpetuates myocardial dysfunction." },
        { q: "Function does not recover as expected after durable rhythm control. What next?", options: ["Close the case as viral", "Reassess for myocarditis, genetic/metabolic DCM, and other causes", "Assume permanent injury without evaluation"], correct: 1, explain: "Failure to recover weakens a pure tachycardia-induced explanation and reopens the cardiomyopathy workup.", consequence: "Diagnostic response must update the model." }
      ]
    },
    {
      title: "The return-to-play visit",
      subtitle: "Recovery and prevention",
      intro: "A 16-year-old competitive soccer player had chest-pain myocarditis with preserved LVEF and received IVIG 2 g/kg. At 6 weeks she is asymptomatic with normal biomarkers and no inflammation on repeat CMR.",
      vitals: ["16 years", "6 weeks", "LVEF preserved", "CMR resolved", "IVIG 2 g/kg"],
      steps: [
        { q: "Can she be considered for return now?", options: ["No—six months is mandatory in every case", "Possibly, after specialist confirmation that relevant arrhythmia is absent and shared decision-making", "Yes—normal symptoms alone are sufficient"], correct: 1, explain: "The 2025 athlete statement permits selected preserved-function cases to be considered at 4–6 weeks after clinical/inflammatory resolution and arrhythmia assessment.", consequence: "A universal clock is outdated; symptoms alone are also insufficient." },
        { q: "Which testing remains central to arrhythmic risk assessment?", options: ["Ambulatory monitoring and maximal-effort exercise testing as phenotype-appropriate", "Chest radiograph only", "No testing once CMR normalizes"], correct: 0, explain: "Rhythm surveillance complements function, biomarkers, and CMR in return decisions.", consequence: "Normal inflammation imaging does not directly test exercise-triggered rhythm risk." },
        { q: "Her MMR booster is due. What is the correct IVIG counseling?", options: ["Give MMR today", "Generally delay measles-/varicella-containing vaccine 11 months after 2 g/kg IVIG; LAIV is not delayed for antibody interference", "Delay every live vaccine, including LAIV, for 11 months"], correct: 1, explain: "CDC intervals are product- and dose-specific. LAIV is expressly exempt from antibody-product interference rules.", consequence: "Giving MMR too early may blunt response; delaying LAIV solely because of IVIG is also incorrect." }
      ]
    }
  ];

  var activeCase = 0;
  var caseRun = { step: 0, errors: [] };

  function renderCasePicker() {
    var picker = root.getElementById("case-picker");
    picker.innerHTML = cases.map(function (item, index) {
      var done = state.casesComplete.includes(index) ? " ✓" : "";
      return "<button class='case-button" + (index === activeCase ? " is-active" : "") + "' type='button' data-case='" + index + "'><strong>Case " + (index + 1) + done + "</strong><small>" + item.subtitle + "</small></button>";
    }).join("");
    picker.querySelectorAll("[data-case]").forEach(function (button) {
      button.addEventListener("click", function () {
        activeCase = Number(button.getAttribute("data-case"));
        caseRun = { step: 0, errors: [] };
        renderCasePicker();
        renderCase();
      });
    });
  }

  function renderCase() {
    var stage = root.getElementById("case-stage");
    var item = cases[activeCase];
    if (caseRun.step >= item.steps.length) {
      if (!state.casesComplete.includes(activeCase)) state.casesComplete.push(activeCase);
      saveState();
      renderCasePicker();
      var next = (activeCase + 1) % cases.length;
      var errorCount = caseRun.errors.filter(Boolean).length;
      stage.innerHTML = "<div class='case-complete'><p class='kicker'>Case complete</p><h3>" + item.title + "</h3><p>You reached a safe plan. Errors made before correction: <strong>" + errorCount + "</strong>.</p></div><div class='quiz-actions'><button class='button' type='button' data-next-case>" + (state.casesComplete.length === cases.length ? "Review another case" : "Next case") + "</button><button class='button button-secondary' type='button' data-case-retry>Run this case again</button></div>";
      stage.querySelector("[data-next-case]").addEventListener("click", function () {
        activeCase = next;
        caseRun = { step: 0, errors: [] };
        renderCasePicker();
        renderCase();
      });
      stage.querySelector("[data-case-retry]").addEventListener("click", function () {
        caseRun = { step: 0, errors: [] };
        renderCase();
      });
      return;
    }
    var step = item.steps[caseRun.step];
    stage.innerHTML = "<div class='case-header'><div><p class='kicker'>Case " + (activeCase + 1) + " · Decision " + (caseRun.step + 1) + " of " + item.steps.length + "</p><h3>" + item.title + "</h3><p>" + item.intro + "</p></div></div><ul class='case-vitals'>" + item.vitals.map(function (vital) { return "<li>" + vital + "</li>"; }).join("") + "</ul><h3>" + step.q + "</h3><div class='choice-list'>" + step.options.map(function (option, index) { return "<button class='choice-button' type='button' data-case-answer='" + index + "'>" + option + "</button>"; }).join("") + "</div><div id='case-feedback'></div><div class='case-log' aria-label='Decision log'>" + item.steps.map(function (_, index) { var status = caseRun.errors[index] ? " incorrect" : (index < caseRun.step ? " correct" : ""); return "<span class='" + status.trim() + "'></span>"; }).join("") + "</div>";
    stage.querySelectorAll("[data-case-answer]").forEach(function (button) {
      button.addEventListener("click", function () {
        var selected = Number(button.getAttribute("data-case-answer"));
        var feedback = stage.querySelector("#case-feedback");
        if (selected === step.correct) {
          stage.querySelectorAll("[data-case-answer]").forEach(function (choice) { choice.disabled = true; });
          button.classList.add("correct");
          feedback.className = "case-feedback correct";
          feedback.innerHTML = "<strong>Correct.</strong> " + step.explain + "<div class='quiz-actions'><button class='button' type='button' data-case-continue>Continue</button></div>";
          feedback.querySelector("[data-case-continue]").addEventListener("click", function () {
            caseRun.step += 1;
            renderCase();
          });
        } else {
          caseRun.errors[caseRun.step] = true;
          button.disabled = true;
          button.classList.add("incorrect");
          feedback.className = "case-feedback incorrect";
          feedback.innerHTML = "<strong>Not safe yet.</strong> " + step.consequence + "<p class='case-consequence'>Choose again. The case advances only after the safe action is identified.</p>";
        }
      });
    });
  }

  var postQuestions = [
    { domain: "Recognition", q: "Which finding most strongly shifts an infant with respiratory symptoms toward acute cardiac failure?", options: ["Rhinorrhea", "Hepatomegaly with cool perfusion", "Age under 1 year", "Normal oxygen saturation"], correct: 1, explain: "Hepatomegaly and impaired perfusion are high-value cardiac signals; normal SpO₂ does not assess systemic output." },
    { domain: "Recognition", q: "A teen has syncope and new complete AV block after a febrile illness. What is the safest interpretation?", options: ["Vasovagal syncope is proven", "Myocarditis must be considered and urgent monitored evaluation is required", "AV block excludes myocarditis", "Outpatient Holter in one month is sufficient"], correct: 1, explain: "High-grade AV block is a high-risk electrical presentation requiring urgent monitored care and myocarditis/mimic evaluation." },
    { domain: "Recognition", q: "Which statement about a viral prodrome is correct?", options: ["It is required for diagnosis", "It proves the detected virus infected myocardium", "It raises suspicion but is neither necessary nor sufficient", "It replaces cardiac imaging"], correct: 2, explain: "A prodrome is common but nonspecific. Peripheral viral detection does not establish myocardial causality." },
    { domain: "Diagnosis", q: "Which updated Lake Louise combination is correct?", options: ["Two of three independent buckets: T1, T2, LGE", "At least one T2-based edema marker plus at least one T1-based injury marker", "LGE alone in every case", "Echocardiographic dysfunction plus BNP"], correct: 1, explain: "The 2018 criteria combine T2-based edema and T1-based nonischemic injury; LGE is a T1-based marker." },
    { domain: "Diagnosis", q: "When is EMB most useful?", options: ["Every stable chest-pain presentation", "When identifying a treatable histologic subtype or mimic could change management", "Only after complete recovery", "To replace echocardiography"], correct: 1, explain: "EMB is selective and question-driven; it should not delay stabilization or MCS." },
    { domain: "Diagnosis", q: "Which is the best interpretation of a normal initial troponin?", options: ["Myocarditis is excluded", "Probability may fall, but a high-suspicion phenotype still requires evaluation", "CMR is contraindicated", "The child can return to sport"], correct: 1, explain: "No common initial test is sufficiently sensitive to rule out myocarditis alone." },
    { domain: "Stabilization", q: "A hypotensive child with suspected myocarditis has hepatomegaly and pulmonary edema. Best fluid statement?", options: ["Hypotension mandates 40–60 mL/kg rapidly", "Avoid reflexive large bolus; define congestion/preload and reassess any small aliquot", "Fluids never have a role", "Wait for biopsy"], correct: 1, explain: "Hypotension can coexist with congestion. Physiology and repeated assessment should guide fluid." },
    { domain: "Stabilization", q: "Which trajectory should trigger MCS-center activation?", options: ["Stable pain with normal function", "Rising lactate, end-organ injury, escalating vasoactives, and biventricular failure", "One mildly elevated troponin", "Resolved sinus tachycardia"], correct: 1, explain: "Progressive shock and organ injury require early advanced-support planning before collapse." },
    { domain: "Stabilization", q: "A child develops pulseless VT. What comes first?", options: ["Biopsy", "Defibrillation and high-quality CPR", "Steroids", "CMR"], correct: 1, explain: "Use PALS arrest care immediately; myocarditis-specific diagnosis must not delay resuscitation." },
    { domain: "Treatment", q: "Which statement about IVIG is most defensible?", options: ["Proven mandatory therapy for all pediatric myocarditis", "Widely used, but universal benefit is uncertain and practice is center-specific", "Always contraindicated after age 10", "A substitute for circulatory support"], correct: 1, explain: "Pediatric evidence is heterogeneous and largely observational; communicate uncertainty honestly." },
    { domain: "Treatment", q: "When are corticosteroids most clearly rational?", options: ["Every positive respiratory panel", "Defined immune-mediated/systemic disease or biopsy-directed inflammatory subtype", "All mild chest pain", "As a replacement for vasoactives"], correct: 1, explain: "Immunosuppression is cause- and phenotype-directed, not universal presumed-viral therapy." },
    { domain: "Treatment", q: "Which antithrombotic statement is correct?", options: ["Aspirin until LVEF >40% is a universal rule", "Therapeutic anticoagulation is indicated for documented thrombus and protocolized during MCS; prophylaxis is individualized", "All myocarditis requires no anticoagulation", "LAIV determines anticoagulant choice"], correct: 1, explain: "There is no universal aspirin/LVEF stopping rule; thrombosis and bleeding risks guide the plan." },
    { domain: "Follow-up", q: "Which athlete may be considered for return as early as 4–6 weeks under 2025 guidance?", options: ["Persistent symptoms and LGE progression", "Selected preserved-function patient with clinical/inflammatory resolution and no relevant arrhythmia", "Any athlete with normal resting heart rate", "A patient with ongoing VT"], correct: 1, explain: "Early consideration is limited to a recovered low-risk phenotype after appropriate testing and shared decision-making." },
    { domain: "Follow-up", q: "After IVIG 2 g/kg, which vaccine statement is correct?", options: ["Delay LAIV 11 months", "MMR/varicella/MMRV are generally delayed 11 months; LAIV is exempt from antibody interference timing", "Delay every vaccine 11 months", "Give MMR the next day"], correct: 1, explain: "CDC intervals depend on product and antibody-containing dose; LAIV is specifically exempt." },
    { domain: "Follow-up", q: "Which discharge statement is safest?", options: ["Normalized LVEF proves zero future arrhythmia risk", "Follow-up should integrate function, rhythm, biomarkers, symptoms, and CMR as phenotype-appropriate", "All patients follow the same imaging schedule", "No school plan is needed"], correct: 1, explain: "Recovery is multidimensional; residual scar/arrhythmia and initial severity shape individualized surveillance." }
  ];

  var attemptQuestions = [];

  function shuffle(array) {
    var copy = array.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i]; copy[i] = copy[j]; copy[j] = temp;
    }
    return copy;
  }

  function buildAttempt() {
    attemptQuestions = shuffle(postQuestions).map(function (item) {
      var indexed = item.options.map(function (option, index) { return { option: option, correct: index === item.correct }; });
      var mixed = shuffle(indexed);
      return { domain: item.domain, q: item.q, options: mixed.map(function (entry) { return entry.option; }), correct: mixed.findIndex(function (entry) { return entry.correct; }), explain: item.explain };
    });
  }

  root.getElementById("posttest-start").addEventListener("click", startPosttest);

  function startPosttest() {
    buildAttempt();
    root.getElementById("posttest-intro").hidden = true;
    root.getElementById("posttest-results").innerHTML = "";
    var form = root.getElementById("posttest-form");
    form.hidden = false;
    form.innerHTML = attemptQuestions.map(function (item, qIndex) {
      return "<fieldset class='quiz-question'><legend><span class='domain-badge'>" + item.domain + "</span> " + (qIndex + 1) + ". " + item.q + "</legend><div class='choice-list'>" + item.options.map(function (option, oIndex) {
        var id = "post-" + qIndex + "-" + oIndex;
        return "<label class='choice-button' for='" + id + "'><input id='" + id + "' type='radio' name='post-" + qIndex + "' value='" + oIndex + "'> <span>" + option + "</span></label>";
      }).join("") + "</div></fieldset>";
    }).join("") + "<div class='quiz-actions'><button class='button' type='submit'>Submit all answers</button></div>";
    form.addEventListener("submit", gradePosttest, { once: true });
    form.scrollIntoView({ block: "start" });
  }

  function gradePosttest(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var unanswered = [];
    var responses = [];
    attemptQuestions.forEach(function (item, index) {
      var selected = form.querySelector('input[name="post-' + index + '"]:checked');
      if (!selected) unanswered.push(index + 1);
      responses.push(selected ? Number(selected.value) : null);
    });
    if (unanswered.length) {
      alert("Answer every question before submitting. Missing: " + unanswered.join(", "));
      form.addEventListener("submit", gradePosttest, { once: true });
      return;
    }
    var score = 0;
    var domains = {};
    attemptQuestions.forEach(function (item, index) {
      if (!domains[item.domain]) domains[item.domain] = { correct: 0, total: 0 };
      domains[item.domain].total += 1;
      if (responses[index] === item.correct) { score += 1; domains[item.domain].correct += 1; }
    });
    var passed = score >= 12;
    state.posttestBest = Math.max(state.posttestBest, score);
    state.posttestPassed = state.posttestPassed || passed;
    saveState();
    form.hidden = true;
    var results = root.getElementById("posttest-results");
    results.innerHTML = "<div class='score-ring" + (passed ? "" : " fail") + "'>" + score + "/15</div><div class='result-title'><p class='kicker'>" + (passed ? "Mastery achieved" : "Not yet at mastery") + "</p><h3>" + Math.round(score / 15 * 100) + "% · " + (passed ? "Passed" : "12/15 required") + "</h3></div><div class='domain-results'>" + Object.keys(domains).map(function (domain) {
      return "<div><strong>" + domain + "</strong><span>" + domains[domain].correct + "/" + domains[domain].total + "</span></div>";
    }).join("") + "</div><div class='review-list'>" + attemptQuestions.map(function (item, index) {
      var correct = responses[index] === item.correct;
      return "<div class='review-item" + (correct ? "" : " missed") + "'><strong>" + (correct ? "Correct" : "Review") + ": " + item.q + "</strong><p>Correct answer: " + item.options[item.correct] + "</p><p>" + item.explain + "</p></div>";
    }).join("") + "</div><div class='quiz-actions'><button class='button' type='button' data-post-retry>Retake with shuffled order</button><button class='button button-secondary' type='button' data-open-quick>Review quick reference</button></div>";
    results.querySelector("[data-post-retry]").addEventListener("click", startPosttest);
    results.querySelector("[data-open-quick]").addEventListener("click", function () { switchTab("quick", false); });
    results.scrollIntoView({ block: "start" });
  }

  function renderBestScore() {
    var el = root.getElementById("best-score");
    if (!el) return;
    el.textContent = state.posttestBest ? "Best score: " + state.posttestBest + "/15" + (state.posttestPassed ? " · Mastery achieved" : "") : "No attempt recorded.";
  }

  root.getElementById("print-reference").addEventListener("click", function () { window.print(); });
  root.getElementById("reset-progress").addEventListener("click", function () {
    if (!window.confirm("Reset pretest, case, and posttest progress saved in this browser?")) return;
    localStorage.removeItem(storageKey);
    state = loadState();
    activeCase = 0;
    caseRun = { step: 0, errors: [] };
    renderCasePicker();
    renderCase();
    updateProgress();
    switchTab("start", false);
    window.location.reload();
  });

  renderCasePicker();
  renderCase();
  updateProgress();
}());
