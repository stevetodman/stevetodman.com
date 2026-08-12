(function () {
  "use strict";

  var root = document;

  function activateTab(name, focusTab) {
    var tab = root.querySelector('[data-tab="' + name + '"]');
    var panel = root.querySelector('[data-panel="' + name + '"]');
    if (!tab || !panel) return;

    root.querySelectorAll("[data-tab]").forEach(function (item) {
      var active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", active ? "true" : "false");
      item.tabIndex = active ? 0 : -1;
    });
    root.querySelectorAll("[data-panel]").forEach(function (item) {
      var active = item === panel;
      item.classList.toggle("is-active", active);
      item.hidden = !active;
    });
    if (focusTab) tab.focus();
    if (window.history && window.history.replaceState) window.history.replaceState(null, "", "#" + name);
    window.scrollTo({ top: root.querySelector(".module-nav").offsetTop, behavior: "smooth" });
  }

  root.querySelectorAll("[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () { activateTab(tab.getAttribute("data-tab"), false); });
    tab.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
      var tabs = Array.from(root.querySelectorAll("[data-tab]"));
      var index = tabs.indexOf(tab);
      if (event.key === "ArrowRight") index = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") index = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") index = 0;
      if (event.key === "End") index = tabs.length - 1;
      event.preventDefault();
      activateTab(tabs[index].getAttribute("data-tab"), true);
    });
  });
  root.querySelectorAll("[data-open-tab]").forEach(function (button) {
    button.addEventListener("click", function () { activateTab(button.getAttribute("data-open-tab"), true); });
  });

  var requestedTab = window.location.hash.replace("#", "");
  if (requestedTab && root.querySelector('[data-panel="' + requestedTab + '"]')) activateTab(requestedTab, false);

  var openingReveal = root.getElementById("opening-reveal");
  openingReveal.addEventListener("click", function () {
    var answer = root.getElementById("opening-answer");
    var showing = !answer.hidden;
    answer.hidden = showing;
    openingReveal.setAttribute("aria-expanded", showing ? "false" : "true");
    openingReveal.textContent = showing ? "Reveal the decision" : "Hide the decision";
  });

  var pathways = {
    normal: {
      level: "success",
      title: "Normal BP—or normalized repeat measurements",
      summary: "No additional evaluation is needed today. Return to routine screening.",
      steps: [
        ["Today", "Document the averaged, verified BP and correct technique."],
        ["Next step", "Continue healthy-lifestyle counseling as routine preventive care."],
        ["Follow-up", "Measure at the next annual well visit, or every encounter if a high-risk condition applies."]
      ]
    },
    elevated: {
      level: "warning",
      title: "Elevated BP",
      summary: "Lifestyle intervention begins now; persistence over 12 months triggers ABPM and diagnostic evaluation.",
      steps: [
        ["Initial", "Lifestyle counseling; repeat by auscultation in 6 months."],
        ["At 6 months", "If still elevated: right arm, left arm, and one leg BP; reinforce lifestyle; repeat in 6 months."],
        ["At 12 months", "If still elevated after 3 auscultatory measurements: ABPM, diagnostic evaluation, and consider subspecialty referral."]
      ]
    },
    stage1: {
      level: "warning",
      title: "Stage 1 HTN, asymptomatic",
      summary: "Confirm promptly, but do not diagnose chronic HTN from this single visit.",
      steps: [
        ["Initial", "Lifestyle counseling; repeat by auscultation in 1–2 weeks."],
        ["Second visit", "If still stage 1: check both arms and one leg; repeat in 3 months."],
        ["Third visit", "If stage 1 persists: ABPM, diagnostic evaluation, initiate treatment, and consider subspecialty referral."]
      ]
    },
    stage2: {
      level: "danger",
      title: "Stage 2 HTN",
      summary: "The first task is to separate an asymptomatic stage 2 value from acute severe HTN with target-organ symptoms.",
      steps: [
        ["Initial", "Check both arms and one leg; give lifestyle guidance; repeat or refer within 1 week."],
        ["If persistent", "ABPM, diagnostic evaluation, treatment, or subspecialty management."],
        ["If symptomatic/extreme", "Immediate emergency evaluation if symptomatic, >30 mm Hg above p95, or >180/120 in an adolescent."]
      ]
    }
  };

  function renderPathway(name) {
    var item = pathways[name];
    var stage = root.getElementById("pathway-stage");
    stage.className = "card pathway-stage level-" + item.level;
    stage.innerHTML = "<p class='kicker'>Selected pathway</p><h3>" + item.title + "</h3><p>" + item.summary + "</p><div class='path-timeline'>" + item.steps.map(function (step) {
      return "<div class='path-step'><strong>" + step[0] + "</strong><p>" + step[1] + "</p></div>";
    }).join("") + "</div>";
  }

  root.querySelectorAll("[data-path]").forEach(function (button) {
    button.addEventListener("click", function () {
      root.querySelectorAll("[data-path]").forEach(function (item) { item.classList.toggle("is-active", item === button); });
      renderPathway(button.getAttribute("data-path"));
    });
  });
  renderPathway("normal");

  var adultThresholds = {
    day: { s: 125, d: 75, label: "24-hour" },
    wake: { s: 130, d: 80, label: "Wake" },
    sleep: { s: 110, d: 65, label: "Sleep" }
  };
  var periods = ["day", "wake", "sleep"];

  function numericValue(id) {
    var value = Number(root.getElementById(id).value);
    return Number.isFinite(value) ? value : null;
  }

  function setValue(id, value) { root.getElementById(id).value = value; }

  root.getElementById("abpm-age").addEventListener("change", function () {
    root.getElementById("child-thresholds").hidden = this.value !== "child";
  });

  var presets = {
    wch: { age: "teen", clinic: "high", means: [122, 72, 128, 78, 106, 62] },
    masked: { age: "teen", clinic: "below", means: [124, 73, 126, 76, 113, 64] },
    under13: { age: "child", clinic: "below", p95: [130, 78, 135, 82, 115, 68], means: [124, 74, 128, 77, 111, 63] }
  };

  function loadPreset(name) {
    var preset = presets[name];
    root.getElementById("abpm-age").value = preset.age;
    root.getElementById("clinic-status").value = preset.clinic;
    root.getElementById("child-thresholds").hidden = preset.age !== "child";
    var meanIds = ["mean-day-s", "mean-day-d", "mean-wake-s", "mean-wake-d", "mean-sleep-s", "mean-sleep-d"];
    meanIds.forEach(function (id, index) { setValue(id, preset.means[index]); });
    if (preset.p95) {
      var p95Ids = ["p95-day-s", "p95-day-d", "p95-wake-s", "p95-wake-d", "p95-sleep-s", "p95-sleep-d"];
      p95Ids.forEach(function (id, index) { setValue(id, preset.p95[index]); });
    }
    interpretAbpm();
  }

  root.querySelectorAll("[data-preset]").forEach(function (button) {
    button.addEventListener("click", function () { loadPreset(button.getAttribute("data-preset")); });
  });

  function interpretAbpm(event) {
    if (event) event.preventDefault();
    var isChild = root.getElementById("abpm-age").value === "child";
    var clinicHigh = root.getElementById("clinic-status").value === "high";
    var result = root.getElementById("abpm-result");
    var thresholds = {};
    var means = {};
    var errors = [];

    periods.forEach(function (period) {
      var adult = adultThresholds[period];
      var p95s = isChild ? numericValue("p95-" + period + "-s") : adult.s;
      var p95d = isChild ? numericValue("p95-" + period + "-d") : adult.d;
      thresholds[period] = { s: Math.min(p95s, adult.s), d: Math.min(p95d, adult.d) };
      means[period] = { s: numericValue("mean-" + period + "-s"), d: numericValue("mean-" + period + "-d") };
      if ([p95s, p95d, means[period].s, means[period].d].some(function (value) { return value === null; })) errors.push("Complete every BP field.");
      if (means[period].s !== null && means[period].d !== null && means[period].s <= means[period].d) errors.push(adult.label + " mean SBP must exceed DBP.");
      if (p95s !== null && p95d !== null && p95s <= p95d) errors.push(adult.label + " p95 SBP must exceed DBP.");
    });

    if (errors.length) {
      result.className = "lab-result is-visible";
      result.innerHTML = "<h4>Check the inputs</h4><p>" + Array.from(new Set(errors)).join(" ") + "</p>";
      return;
    }

    var comparisons = [];
    periods.forEach(function (period) {
      ["s", "d"].forEach(function (component) {
        comparisons.push({
          period: period,
          component: component,
          mean: means[period][component],
          threshold: thresholds[period][component],
          abnormal: means[period][component] >= thresholds[period][component]
        });
      });
    });
    var ambulatoryHigh = comparisons.some(function (item) { return item.abnormal; });
    var phenotype = clinicHigh ? (ambulatoryHigh ? "Ambulatory hypertension" : "White coat hypertension") : (ambulatoryHigh ? "Masked hypertension" : "Normal BP phenotype");
    var drivers = comparisons.filter(function (item) { return item.abnormal; });
    var sbpDip = ((means.wake.s - means.sleep.s) / means.wake.s) * 100;
    var dbpDip = ((means.wake.d - means.sleep.d) / means.wake.d) * 100;
    var dipLabel = function (value) { return value < 0 ? "reverse dipping" : value < 10 ? "nondipping" : value <= 20 ? "usual dipping range" : ">20% dipping"; };
    var periodHtml = periods.map(function (period) {
      var abnormal = comparisons.some(function (item) { return item.period === period && item.abnormal; });
      return "<div class='" + (abnormal ? "abnormal" : "normal") + "'><strong>" + adultThresholds[period].label + "</strong><br>Mean " + means[period].s + "/" + means[period].d + " vs limit " + thresholds[period].s + "/" + thresholds[period].d + "</div>";
    }).join("");
    var driverText = drivers.length ? drivers.map(function (item) { return adultThresholds[item.period].label + " " + (item.component === "s" ? "SBP" : "DBP"); }).join(", ") : "No mean period or component reaches its threshold";

    result.className = "lab-result is-visible";
    result.innerHTML = "<p class='kicker'>Interpretation</p><h4>" + phenotype + "</h4><p><strong>Driver:</strong> " + driverText + ".</p><div class='comparison-grid'>" + periodHtml + "</div><p><strong>Dipping:</strong> SBP " + sbpDip.toFixed(1) + "% (" + dipLabel(sbpDip) + "); DBP " + dbpDip.toFixed(1) + "% (" + dipLabel(dbpDip) + ").</p><p class='note'>Phenotype uses mean BP only; BP load is intentionally ignored. Review the raw tracing, diary, study quality, medications, and clinical context before acting.</p>";
  }

  root.getElementById("abpm-form").addEventListener("submit", interpretAbpm);

  var cases = [
    {
      title: "The wrong cuff",
      intro: "A 15-year-old with obesity has an automated BP of 134/76. The cuff bladder does not encircle 80% of the arm.",
      vitals: ["Age 15", "BMI 97th percentile", "Asymptomatic", "First visit"],
      steps: [
        { q: "What is the best immediate action?", options: ["Label stage 1 HTN and order an echo", "Repeat after rest with a correctly sized cuff, average repeats, and confirm by auscultation", "Ignore the value because obesity explains it"], correct: 1, explain: "Technique precedes classification. A too-small cuff can overestimate BP, and an elevated oscillometric screen requires repeat measurement and auscultatory confirmation." },
        { q: "With correct technique, the averaged auscultatory BP is 126/74. How is it classified?", options: ["Normal", "Elevated BP", "Stage 1 HTN"], correct: 1, explain: "At age 13 or older, SBP 120–129 with DBP below 80 is elevated BP." },
        { q: "What follow-up is appropriate?", options: ["Lifestyle counseling and auscultatory recheck in 6 months", "ABPM today and medication tomorrow", "No recheck until adulthood"], correct: 0, explain: "An initial elevated BP triggers lifestyle counseling and a 6-month recheck, not an immediate chronic HTN diagnosis." }
      ]
    },
    {
      title: "Three elevated visits",
      intro: "A 10-year-old’s correctly measured BP has remained in the elevated—but below 95th-percentile—category at 0, 6, and 12 months despite counseling.",
      vitals: ["Age 10", "Three visits", "No symptoms", "Elevated category"],
      steps: [
        { q: "What should happen now?", options: ["Continue annual screening only", "Order ABPM and the initial diagnostic evaluation; consider referral", "Diagnose stage 1 HTN without ABPM"], correct: 1, explain: "Persistent elevated BP for 12 months (3 auscultatory measurements) triggers ABPM and diagnostic evaluation." },
        { q: "Which is the correct core screening set?", options: ["UA; electrolytes, BUN, creatinine; lipid profile", "Plasma metanephrines, renin, aldosterone, cortisol, and CTA for every child", "ECG alone"], correct: 0, explain: "The guideline uses a streamlined renal/metabolic screen. Additional tests follow clues from the history, examination, and initial results." },
        { q: "ABPM means are all below threshold. Clinic BP never reached the hypertensive range. What is the 2022 phenotype?", options: ["Normal BP phenotype", "White coat hypertension", "Ambulatory hypertension"], correct: 0, explain: "In the 2022 four-phenotype scheme, clinic BP below the HTN threshold plus normal ambulatory means is normal. White coat HTN requires clinic hypertension." }
      ]
    },
    {
      title: "Repaired coarctation",
      intro: "A 14-year-old after neonatal coarctation repair has normal clinic BP but reduced exercise tolerance. Arm pulses are brisk and femoral pulses are palpable.",
      vitals: ["Age 14", "Clinic BP 118/72", "Repaired coarctation", "Normal arch vessel anatomy"],
      steps: [
        { q: "Does a normal clinic BP end the evaluation?", options: ["Yes; no BP follow-up is needed", "No; ABPM is indicated to detect recurrent or masked HTN", "Only a treadmill test can assess BP"], correct: 1, explain: "Masked hypertension is common enough after coarctation repair that the AAP strongly recommends ABPM surveillance." },
        { q: "Which arm should carry the ABPM cuff?", options: ["Right arm", "Left arm", "Either leg"], correct: 0, explain: "With repaired coarctation and normal arch vessel anatomy, the 2022 AHA statement specifies the right arm." },
        { q: "ABPM: 24 h 123/71, wake 127/75, sleep 112/66. Best interpretation?", options: ["Normal because the 24-hour mean is normal", "Masked hypertension driven by sleep SBP and DBP", "Nondipping only"], correct: 1, explain: "At age 14, sleep thresholds are 110/65. Either component at or above threshold makes sleep BP abnormal; isolated nocturnal hypertension carries the same diagnostic weight as wake elevation." }
      ]
    },
    {
      title: "CKD at night",
      intro: "An 11-year-old with stage 3 CKD and proteinuria has clinic BP below the 95th percentile. ABPM shows elevated sleep BP and blunted dipping.",
      vitals: ["Age 11", "CKD stage 3", "Proteinuria", "Clinic BP <95th percentile"],
      steps: [
        { q: "What phenotype is most likely?", options: ["Masked hypertension, including nocturnal hypertension", "White coat hypertension", "Normal because the clinic BP is normal"], correct: 0, explain: "CKD is a high-risk setting for masked and nocturnal hypertension; elevated mean sleep BP establishes ambulatory abnormality." },
        { q: "Which treatment target is specific to pediatric CKD?", options: ["Clinic SBP below 140 only", "24-hour MAP below the 50th percentile by ABPM", "Eliminate dipping"], correct: 1, explain: "The AAP CKD recommendation targets 24-hour mean arterial pressure below the 50th percentile by ABPM." },
        { q: "Which class is preferred with CKD, HTN, and proteinuria?", options: ["ACE inhibitor or ARB", "Short-acting nifedipine", "Alpha blocker as first-line"], correct: 0, explain: "ACE inhibition or ARB therapy is preferred with proteinuric CKD, with renal function, potassium, and pregnancy-risk monitoring." }
      ]
    },
    {
      title: "Headache + stage 2",
      intro: "A 13-year-old has repeated BP 184/122 with severe headache, vomiting, confusion, and papilledema.",
      vitals: ["Age 13", "BP 184/122", "Confusion", "Papilledema"],
      steps: [
        { q: "Best disposition?", options: ["Lifestyle counseling and recheck in 1 week", "Immediate emergency evaluation and monitored treatment", "Outpatient ABPM before any action"], correct: 1, explain: "Extreme stage 2 BP plus neurologic target-organ symptoms is a hypertensive emergency; routine outpatient confirmation must not delay stabilization." },
        { q: "What is the safe initial reduction principle?", options: ["Normalize BP within 30 minutes", "Reduce no more than 25% of the planned reduction in the first 8 hours", "Do not lower BP for 24 hours"], correct: 1, explain: "Overly rapid reduction risks cerebral, renal, and myocardial ischemia. The AAP advises no more than 25% of the planned reduction in the first 8 hours." },
        { q: "What else belongs in the urgent plan?", options: ["Expedited secondary-cause evaluation and target-organ assessment", "No evaluation if obesity is present", "ECG as the sole target-organ test"], correct: 0, explain: "Most acute severe pediatric HTN has an underlying secondary cause. Stabilization and expedited renal, cardiac, and neurologic assessment proceed in parallel." }
      ]
    }
  ];

  var activeCase = 0;
  var caseStep = 0;
  var caseLocked = false;

  function renderCase() {
    var item = cases[activeCase];
    var stage = root.getElementById("case-stage");
    caseLocked = false;
    if (caseStep >= item.steps.length) {
      stage.innerHTML = "<p class='kicker'>" + item.title + "</p><h3>Case complete</h3><p>You reached the safe endpoint. Review the log, then choose another case or move to the board quiz.</p><button class='button' type='button' id='case-to-quiz'>Take the board quiz</button>";
      stage.querySelector("#case-to-quiz").addEventListener("click", function () { activateTab("quiz", true); });
      return;
    }
    var step = item.steps[caseStep];
    var intro = caseStep === 0 ? "<p>" + item.intro + "</p><div class='case-vitals'>" + item.vitals.map(function (vital) { return "<span>" + vital + "</span>"; }).join("") + "</div>" : "";
    stage.innerHTML = "<p class='kicker'>" + item.title + " · Decision " + (caseStep + 1) + " of " + item.steps.length + "</p>" + intro + "<h3>" + step.q + "</h3><div class='case-options'></div><div class='case-feedback' aria-live='polite'></div>";
    var options = stage.querySelector(".case-options");
    step.options.forEach(function (option, index) {
      var button = root.createElement("button");
      button.type = "button";
      button.className = "choice-button";
      button.textContent = option;
      button.addEventListener("click", function () {
        if (caseLocked) return;
        caseLocked = true;
        var correct = index === step.correct;
        options.querySelectorAll("button").forEach(function (itemButton, itemIndex) {
          itemButton.disabled = true;
          if (itemIndex === step.correct) itemButton.classList.add("correct");
          if (itemIndex === index && !correct) itemButton.classList.add("incorrect");
        });
        var feedback = stage.querySelector(".case-feedback");
        feedback.classList.add("is-visible");
        feedback.innerHTML = "<strong>" + (correct ? "Best answer." : "Not the best next step.") + "</strong> " + step.explain + " <button type='button' class='button' id='case-continue'>Continue</button>";
        var log = root.getElementById("case-log");
        var empty = log.querySelector(".empty-log");
        if (empty) empty.remove();
        var entry = root.createElement("li");
        entry.textContent = item.title + ", decision " + (caseStep + 1) + ": " + (correct ? "correct — " : "review — ") + step.explain;
        log.appendChild(entry);
        feedback.querySelector("#case-continue").addEventListener("click", function () { caseStep += 1; renderCase(); });
      });
      options.appendChild(button);
    });
  }

  root.querySelectorAll("[data-case]").forEach(function (button) {
    button.addEventListener("click", function () {
      activeCase = Number(button.getAttribute("data-case"));
      caseStep = 0;
      root.getElementById("case-log").innerHTML = "<li class='empty-log'>Complete a decision to build your log.</li>";
      root.querySelectorAll("[data-case]").forEach(function (item) { item.classList.toggle("is-active", item === button); });
      renderCase();
    });
  });
  renderCase();

  var quiz = [
    { domain: "Measurement", q: "A 9-year-old has a high initial oscillometric BP. What should happen before the visit is classified?", a: ["Use the first value because it is the most sensitive", "Repeat at least twice, average subsequent values, and confirm suspected elevation by auscultation", "Order ABPM without repeating"], c: 1, e: "Initial oscillometric readings are often high. Correct technique, repeats, averaging, and auscultatory confirmation prevent misclassification." },
    { domain: "Classification", q: "A 15-year-old has a verified BP of 128/78 mm Hg. What is the category?", a: ["Normal", "Elevated BP", "Stage 1 HTN", "Stage 2 HTN"], c: 1, e: "For age 13 or older, SBP 120–129 with DBP below 80 is elevated BP." },
    { domain: "Classification", q: "A 16-year-old has a verified BP of 130/78 mm Hg. What is the category?", a: ["Elevated BP", "Stage 1 HTN", "Stage 2 HTN", "Cannot classify without height"], c: 1, e: "At age 13 or older, either SBP 130–139 or DBP 80–89 is stage 1 HTN; height is not needed for classification." },
    { domain: "Classification", q: "For a 10-year-old, the 95th percentile is 116/76. Which threshold marks stage 2 by the percentile rule?", a: ["120/80", "128/88", "140/90", "130/80"], c: 1, e: "Stage 2 begins at the 95th percentile +12 mm Hg: 128/88, unless 140/90 is lower. Here, 128/88 is lower." },
    { domain: "Measurement", q: "Which cuff specification is correct for office BP?", a: ["Width at least 40% and length 80%–100% of arm circumference", "Width 20% and length 50%", "Any cuff that closes around the arm", "The bladder must exceed 120%"], c: 0, e: "AAP technique specifies bladder width at least 40% and length 80%–100% of the mid-arm circumference." },
    { domain: "Screening", q: "Which child age 3 or older should have BP checked at every health encounter?", a: ["Every average-risk child", "A child with obesity", "Only a child with headache", "Only a child already taking medication"], c: 1, e: "Obesity, renal disease, diabetes, aortic arch obstruction/coarctation, and BP-raising medications trigger measurement at every encounter." },
    { domain: "Office pathway", q: "An asymptomatic adolescent has stage 1 HTN at the first verified visit. Next step?", a: ["Emergency IV medication", "Lifestyle counseling and auscultatory recheck in 1–2 weeks", "Wait 12 months", "Diagnose chronic HTN now"], c: 1, e: "Asymptomatic stage 1 HTN is rechecked in 1–2 weeks; persistence then triggers four-extremity BP and a 3-month recheck." },
    { domain: "Office pathway", q: "Elevated BP persists at 0, 6, and 12 months. What now?", a: ["ABPM and diagnostic evaluation; consider referral", "Continue annual screening only", "Start two medications without confirmation", "Obtain ECG only"], c: 0, e: "Persistent elevated BP for a year across 3 auscultatory measurements triggers ABPM and the initial evaluation." },
    { domain: "Office pathway", q: "An asymptomatic child has stage 2 HTN. What is the routine timing?", a: ["Recheck in 6 months", "Repeat or refer within 1 week after four-extremity assessment", "No follow-up if obese", "Wait for 3 visits before acting"], c: 1, e: "Stage 2 HTN accelerates the pathway to repeat assessment or specialty referral within 1 week." },
    { domain: "Emergency", q: "Which outpatient finding requires immediate emergency evaluation?", a: ["Initial elevated BP without symptoms", "Stage 2 HTN with neurologic symptoms", "Normal BP after repeat", "White coat HTN on ABPM"], c: 1, e: "Stage 2 BP plus neurologic, cardiac, visual, or renal target-organ symptoms is a hypertensive emergency until proved otherwise." },
    { domain: "Evaluation", q: "Which initial screening set applies broadly in pediatric HTN evaluation?", a: ["UA; electrolytes, BUN, creatinine; lipid profile", "CTA, metanephrines, cortisol, and renin for everyone", "Troponin and BNP only", "ECG and chest radiograph only"], c: 0, e: "Basic renal testing and lipids are the core screen. Imaging and endocrine testing are guided by age, abnormalities, history, and examination." },
    { domain: "Evaluation", q: "Which patient can usually avoid an extensive secondary-cause evaluation?", a: ["A 4-year-old with HTN", "A 9-year-old with obesity, family history of HTN, and no concerning history/exam findings", "A child with an abdominal bruit", "A child with growth failure and hypokalemia"], c: 1, e: "Age 6 or older, family history, overweight/obesity, and no secondary-cause clues support a streamlined rather than extensive evaluation." },
    { domain: "Evaluation", q: "When is renal ultrasonography part of the routine initial screen?", a: ["Every adolescent with one elevated BP", "Age under 6 or abnormal urinalysis/renal function", "Only after 5 years of HTN", "Never"], c: 1, e: "Renal ultrasonography is recommended in children under 6 and in those with abnormal UA or renal function." },
    { domain: "Target organ", q: "Which test is recommended to assess LV target-organ damage when medication is being considered?", a: ["ECG", "Echocardiography", "Chest radiograph", "Exercise oximetry"], c: 1, e: "Echocardiography assesses LV mass, geometry, and function. ECG is not recommended to exclude LVH in this setting." },
    { domain: "Treatment", q: "Which list contains only recommended first-line outpatient medication classes?", a: ["ACE inhibitor, ARB, long-acting CCB, thiazide", "Clonidine, hydralazine, minoxidil, alpha blocker", "Loop diuretic, nitrate, digoxin, beta agonist", "ACE inhibitor plus ARB together"], c: 0, e: "AAP first-line classes are ACE inhibitor, ARB, long-acting calcium-channel blocker, and thiazide diuretic." },
    { domain: "Treatment", q: "A child has CKD, HTN, and proteinuria. Preferred medication class?", a: ["ACE inhibitor or ARB", "Short-acting nifedipine", "Alpha blocker", "No medication"], c: 0, e: "ACE inhibitor or ARB therapy is preferred with proteinuric CKD, with creatinine, potassium, and pregnancy-risk monitoring." },
    { domain: "Treatment", q: "What is the office BP treatment goal for a 14-year-old?", a: ["Below 140/90", "Below 130/80", "Below 120/70 for everyone", "Any reduction is sufficient"], c: 1, e: "For adolescents age 13 or older, the AAP goal is below 130/80 mm Hg." },
    { domain: "ABPM quality", q: "Which ABPM study best meets the 2022 quality framework?", a: ["12 hours, no sleep, 22 successful readings", "24 hours, sleep captured, 75% successful, 44 readings, at least one each hour", "24 hours using fixed clock sleep despite a diary", "Cuffless watch readings"], c: 1, e: "An optimal study spans 24 hours, captures sleep, obtains at least 70% successful readings (usually 40–50), and has at least one reading per hour." },
    { domain: "ABPM thresholds", q: "For age 13 or older, which set gives the 2022 abnormal mean thresholds for 24-hour, wake, and sleep BP?", a: ["130/80, 135/85, 120/70", "125/75, 130/80, 110/65", "120/70, 125/75, 105/60", "All periods use 130/80"], c: 1, e: "The static thresholds are 125/75 (24 h), 130/80 (wake), and 110/65 (sleep). Either SBP or DBP at threshold is abnormal." },
    { domain: "ABPM thresholds", q: "How are ABPM limits selected for a child under 13?", a: ["Always use 140/90", "Use the higher of pediatric p95 or adult static cutoffs", "Use the lower of the sex/height-specific p95 or adolescent static cutoff for each period/component", "Use BP load only"], c: 2, e: "The 2022 statement uses the lower of the pediatric 95th percentile or adolescent static cutoff in children under 13." },
    { domain: "ABPM phenotype", q: "Clinic BP is hypertensive, but all mean ambulatory values are normal. Phenotype?", a: ["Masked hypertension", "White coat hypertension", "Ambulatory hypertension", "Nocturnal hypertension"], c: 1, e: "Hypertensive clinic BP plus normal ambulatory means is white coat hypertension." },
    { domain: "ABPM phenotype", q: "Clinic BP is below the HTN threshold. The only abnormal ABPM value is mean sleep SBP. Phenotype?", a: ["Normal because wake BP is normal", "Masked hypertension driven by nocturnal hypertension", "White coat hypertension", "Cannot classify without BP load"], c: 1, e: "Isolated sleep hypertension is a valid ambulatory abnormality and creates masked hypertension when clinic BP is below the HTN threshold." },
    { domain: "ABPM phenotype", q: "All mean ambulatory BPs are below threshold, but systolic dipping is 6%. How should the 2022 phenotype be handled?", a: ["Masked hypertension solely because of nondipping", "Normal mean-BP phenotype with nondipping documented separately", "Ambulatory hypertension because dipping is below 10%", "Unclassifiable unless BP load is known"], c: 1, e: "Isolated nondipping with normal mean BP generally does not create masked hypertension. Report the circadian abnormality separately and interpret it in clinical context." },
    { domain: "ABPM phenotype", q: "What role does BP load play in the 2022 ABPM phenotype classification?", a: ["It defines severe ambulatory HTN", "It is no longer used", "It overrides mean sleep BP", "It is required only in adolescents"], c: 1, e: "BP load was removed because it added no predictive value over mean BP for LVH and created ambiguous categories." },
    { domain: "Office pathway", q: "What is the appropriate role of home BP monitoring in a child?", a: ["Diagnose white coat HTN", "Diagnose masked HTN", "Adjunctively follow BP after HTN is diagnosed, but not establish HTN or an office-ambulatory phenotype", "Replace ABPM in every case"], c: 2, e: "Home BP may support follow-up after diagnosis, but the AAP guideline does not use it to diagnose HTN, masked HTN, or white coat HTN." },
    { domain: "Emergency", q: "A child has acute severe HTN with encephalopathy. What reduction principle is recommended?", a: ["Normalize BP in the first hour", "Reduce no more than 25% of the planned reduction in the first 8 hours", "Avoid treatment until ABPM is complete", "Lower only the diastolic BP"], c: 1, e: "Controlled reduction avoids ischemia: no more than 25% of the planned decrease in the first 8 hours, using short-acting monitored therapy." }
  ];

  var quizIndex = 0;
  var quizScore = 0;
  var quizAnswered = false;
  var quizAnswers = [];

  function renderQuiz() {
    var item = quiz[quizIndex];
    quizAnswered = false;
    root.getElementById("quiz-counter").textContent = "Question " + (quizIndex + 1) + " of " + quiz.length;
    root.getElementById("quiz-score").textContent = "Score: " + quizScore;
    root.getElementById("quiz-progress").style.width = (((quizIndex + 1) / quiz.length) * 100).toFixed(2) + "%";
    root.getElementById("quiz-question").innerHTML = "<p class='kicker'>" + item.domain + "</p><h3>" + item.q + "</h3>";
    var options = root.getElementById("quiz-options");
    options.innerHTML = "";
    item.a.forEach(function (answer, index) {
      var button = root.createElement("button");
      button.type = "button";
      button.className = "choice-button";
      button.textContent = answer;
      button.addEventListener("click", function () {
        if (quizAnswered) return;
        quizAnswered = true;
        var correct = index === item.c;
        quizAnswers[quizIndex] = correct;
        if (correct) quizScore += 1;
        options.querySelectorAll("button").forEach(function (optionButton, optionIndex) {
          optionButton.disabled = true;
          if (optionIndex === item.c) optionButton.classList.add("correct");
          if (optionIndex === index && !correct) optionButton.classList.add("incorrect");
        });
        var explanation = root.getElementById("quiz-explanation");
        explanation.className = "quiz-explanation is-visible " + (correct ? "correct" : "incorrect");
        explanation.innerHTML = "<strong>" + (correct ? "Correct." : "Review this.") + "</strong> " + item.e;
        root.getElementById("quiz-score").textContent = "Score: " + quizScore;
        root.getElementById("quiz-next").disabled = false;
      });
      options.appendChild(button);
    });
    root.getElementById("quiz-explanation").className = "quiz-explanation";
    root.getElementById("quiz-explanation").innerHTML = "";
    root.getElementById("quiz-next").disabled = true;
    root.getElementById("quiz-next").textContent = quizIndex === quiz.length - 1 ? "See results" : "Next question";
  }

  function showQuizResults() {
    var percent = Math.round((quizScore / quiz.length) * 100);
    var domains = {};
    quiz.forEach(function (item, index) {
      if (!domains[item.domain]) domains[item.domain] = { total: 0, correct: 0 };
      domains[item.domain].total += 1;
      if (quizAnswers[index]) domains[item.domain].correct += 1;
    });
    root.getElementById("quiz-counter").textContent = "Assessment complete";
    root.getElementById("quiz-score").textContent = "Score: " + quizScore + "/" + quiz.length;
    root.getElementById("quiz-progress").style.width = "100%";
    root.getElementById("quiz-question").innerHTML = "<p class='kicker'>Final score</p><h3>" + percent + "%</h3><p>" + (percent >= 88 ? "Strong command of the office and ambulatory pathways. Review missed explanations for precision." : percent >= 75 ? "Clinically useful foundation. Target the lowest-scoring domains before retesting." : "Revisit the office timeline, ABPM thresholds, and emergency pathway, then retest.") + "</p>";
    root.getElementById("quiz-options").innerHTML = "";
    root.getElementById("quiz-explanation").className = "quiz-explanation";
    root.getElementById("quiz-next").disabled = true;
    var results = root.getElementById("domain-results");
    results.hidden = false;
    results.innerHTML = "<h3>Performance by domain</h3><div class='domain-grid'>" + Object.keys(domains).map(function (name) {
      var domain = domains[name];
      return "<div class='domain-score'><strong>" + name + "</strong><span>" + domain.correct + "/" + domain.total + " correct</span></div>";
    }).join("") + "</div>";
    results.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  root.getElementById("quiz-next").addEventListener("click", function () {
    if (!quizAnswered) return;
    if (quizIndex < quiz.length - 1) {
      quizIndex += 1;
      renderQuiz();
    } else {
      showQuizResults();
    }
  });
  root.getElementById("quiz-restart").addEventListener("click", function () {
    quizIndex = 0;
    quizScore = 0;
    quizAnswers = [];
    root.getElementById("domain-results").hidden = true;
    renderQuiz();
  });
  renderQuiz();

  root.getElementById("print-module").addEventListener("click", function () { window.print(); });
})();
