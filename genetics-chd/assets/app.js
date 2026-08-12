"use strict";

const byId = id => document.getElementById(id);
const shuffle = items => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

function activateTab(name, moveFocus = false) {
  const target = document.querySelector('[data-tab="' + name + '"]');
  if (!target) return;
  document.querySelectorAll('[role="tab"]').forEach(tab => {
    const active = tab === target;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
    panel.hidden = panel.id !== target.getAttribute("aria-controls");
  });
  if (moveFocus) target.focus();
  history.replaceState(null, "", "#" + name);
  window.scrollTo({ top: document.querySelector(".tabs-wrap").offsetTop, behavior: "smooth" });
}

document.querySelectorAll('[role="tab"]').forEach((tab, index, tabs) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  tab.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    activateTab(tabs[next].dataset.tab, true);
  });
});
document.querySelectorAll("[data-open-tab]").forEach(button => {
  button.addEventListener("click", () => activateTab(button.dataset.openTab, true));
});

const pretest = [
  {
    stem: "A newborn with type B interrupted aortic arch has no obvious dysmorphic features. What is the best genetics action?",
    options: [
      "No testing unless hypocalcemia develops",
      "Chromosomal microarray to evaluate for 22q11.2 deletion, with genetics involvement",
      "Single-gene TBX1 sequencing only",
      "Wait for developmental delay before testing"
    ],
    answer: 1,
    explanation: "The 2025 AAP health-supervision report states that any conotruncal defect or IAA-B should prompt chromosome microarray for 22q11.2 deletion. Dysmorphism is neither required nor reliably apparent in a neonate."
  },
  {
    stem: "Which result is least appropriate to use for predictive testing of an unaffected sibling?",
    options: ["Pathogenic variant with a fitting phenotype", "Likely pathogenic familial variant", "Variant of uncertain significance", "Known familial deletion detected by CMA"],
    answer: 2,
    explanation: "A VUS is not a diagnosis and should not be used for predictive testing or management of an unaffected relative."
  },
  {
    stem: "A child has complex CHD, renal anomalies, and developmental delay with no recognizable syndrome. Which is the most defensible contemporary strategy?",
    options: [
      "Karyotype alone",
      "CMA plus trio ES/GS, sequentially or concurrently according to phenotype, access, and assay capability",
      "A single NKX2-5 test",
      "No testing because the CHD has already been repaired"
    ],
    answer: 1,
    explanation: "ACMG supports ES/GS as first- or second-tier testing for pediatric congenital anomalies/DD/ID, while the 2025 AAP report retains CMA and ES in first-tier agnostic evaluation. The order is not universal."
  },
  {
    stem: "A report identifies a VUS in a CHD-associated gene. What should the resident say?",
    options: [
      "This confirms the diagnosis",
      "All first-degree relatives should have targeted predictive testing now",
      "The result is uncertain; care remains phenotype-driven while genetics considers segregation and reanalysis",
      "The variant is benign"
    ],
    answer: 2,
    explanation: "Uncertain means uncertain—not pathogenic and not benign. It may later be reclassified, but it should not independently drive treatment or predictive testing."
  },
  {
    stem: "What is the best counseling statement after a negative CHD gene panel in a strongly familial pedigree?",
    options: [
      "The heart disease is not genetic",
      "The recurrence risk is exactly 2%",
      "The family history still matters; assay limits and undiscovered or non-Mendelian causes remain, and clinical screening may still be indicated",
      "No relative needs an echocardiogram"
    ],
    answer: 2,
    explanation: "A negative panel is nondiagnostic, not proof of a nongenetic cause. Clinical screening can remain important."
  },
  {
    stem: "A pregnant parent has a positive cell-free DNA screen for trisomy 21 and fetal AVSD. Which statement is correct?",
    options: [
      "The screening result is diagnostic",
      "A negative postnatal physical exam would exclude trisomy 21",
      "Diagnostic confirmation with CVS or amniocentesis should be offered; screening and diagnosis are distinct",
      "Fetal echocardiography replaces chromosomal testing"
    ],
    answer: 2,
    explanation: "Cell-free DNA is screening. Positive screening should be confirmed with diagnostic testing; fetal imaging defines anatomy, not karyotype."
  }
];

let pretestState = [];

function renderPretest() {
  pretestState = Array(pretest.length).fill(null);
  byId("pretest-root").innerHTML = '<div class="quiz-intro"><span class="score-chip" id="pretest-score">0 of ' + pretest.length + ' answered</span></div>' +
    pretest.map((question, qi) => {
      const options = question.options.map((option, oi) =>
        '<button class="answer" type="button" data-pre-q="' + qi + '" data-pre-o="' + oi + '">' +
        String.fromCharCode(65 + oi) + ". " + option + "</button>"
      ).join("");
      return '<fieldset class="question"><legend>' + (qi + 1) + ". " + question.stem + '</legend><div class="answers">' +
        options + '</div><div class="feedback" id="pre-feedback-' + qi + '" hidden aria-live="polite"></div></fieldset>';
    }).join("");
  document.querySelectorAll("[data-pre-q]").forEach(button => button.addEventListener("click", answerPretest));
}

function answerPretest(event) {
  const button = event.currentTarget;
  const qi = Number(button.dataset.preQ);
  const oi = Number(button.dataset.preO);
  if (pretestState[qi] !== null) return;
  pretestState[qi] = oi;
  const question = pretest[qi];
  document.querySelectorAll('[data-pre-q="' + qi + '"]').forEach(option => {
    option.disabled = true;
    if (Number(option.dataset.preO) === question.answer) option.classList.add("correct");
  });
  if (oi !== question.answer) button.classList.add("wrong");
  const feedback = byId("pre-feedback-" + qi);
  feedback.hidden = false;
  feedback.innerHTML = "<strong>" + (oi === question.answer ? "Correct." : "Not quite.") + "</strong> " + question.explanation;
  const answered = pretestState.filter(value => value !== null).length;
  const correct = pretestState.filter((value, index) => value === pretest[index].answer).length;
  byId("pretest-score").textContent = answered === pretest.length ? correct + "/" + pretest.length + " correct" : answered + " of " + pretest.length + " answered";
}

const cases = [
  {
    title: "The quiet conotruncal clue",
    vignette: "A 2-day-old with truncus arteriosus is stable on the cardiac ICU. The face appears nonspecific. Calcium is 7.1 mg/dL. Surgery is planned.",
    stages: [
      {
        stem: "What is the best initial genetics plan?",
        options: ["Defer because no dysmorphism is evident", "CMA for 22q11.2 deletion and genetics consultation", "WES only after CMA is negative", "TBX1 Sanger sequencing only"],
        answer: 1,
        explanation: "Truncus is a conotruncal trigger. CMA detects the recurrent 22q11.2 deletion and also surveys other pathogenic CNVs; a normal face does not lower risk enough to defer."
      },
      {
        stem: "While testing is pending, which bundle is most urgent?",
        options: ["Calcium only", "Immune evaluation only", "Calcium, T-cell/immune assessment, palate/feeding and renal review, plus blood-product planning", "No extracardiac evaluation until the result returns"],
        answer: 2,
        explanation: "The suspected diagnosis creates immediate perioperative risks. Use actual immune data and local immunology/transfusion protocols; do not infer immune competence from a chest radiograph."
      }
    ]
  },
  {
    title: "The elective dental procedure",
    vignette: "A 7-year-old with repaired supravalvar aortic stenosis, systemic hypertension, and a confirmed 7q11.23 deletion is scheduled for dental rehabilitation under anesthesia.",
    stages: [
      {
        stem: "What is the most important next step?",
        options: ["Routine outpatient sedation", "Cancel all future procedures", "Multidisciplinary cardiovascular and anesthesia risk review with attention to coronary and diffuse arterial disease", "Repeat the genetic test"],
        answer: 2,
        explanation: "Williams syndrome can involve coronary ostial and diffuse arterial disease and carries recognized anesthesia-related collapse risk. Procedure planning belongs in an experienced multidisciplinary setting."
      },
      {
        stem: "Which assessment would be incomplete?",
        options: ["Four-extremity blood pressure", "Updated cardiac/arterial evaluation appropriate to known anatomy", "Renal and calcium review", "A normal resting oxygen saturation as the sole clearance criterion"],
        answer: 3,
        explanation: "Oxygen saturation does not address coronary perfusion, outflow obstruction, ventricular hypertrophy, systemic arteriopathy, or hypertension."
      }
    ]
  },
  {
    title: "The negative panel",
    vignette: "A 12-year-old with BAV and repaired coarctation has a father with BAV and an aunt with thoracic aortic dilation. A commercial CHD panel is negative.",
    stages: [
      {
        stem: "What is the best interpretation?",
        options: ["The pedigree is no longer familial", "The family history remains clinically important despite a nondiagnostic panel", "Recurrence is zero", "The aunt's aorta is unrelated by definition"],
        answer: 1,
        explanation: "The assay may not capture the cause, and the architecture may not be single-gene. Phenotype and pedigree still drive surveillance."
      },
      {
        stem: "What should happen to first-degree relatives who have never had cardiac imaging?",
        options: ["No action", "Clinical screening according to BAV/aortopathy guidance, coordinated with cardiology/genetics", "Targeted testing for every VUS on the panel", "Screen only if symptoms develop"],
        answer: 1,
        explanation: "Clinical imaging can be useful even when molecular testing is negative. Do not substitute VUS testing for phenotype-based family screening."
      }
    ]
  },
  {
    title: "The critically ill infant",
    vignette: "A neonate has complex CHD, renal dysplasia, abnormal tone, and dysmorphic features. No single syndrome is recognizable. The child may need high-risk surgery within days.",
    stages: [
      {
        stem: "Which strategy best matches contemporary guidance and acuity?",
        options: ["Serial single-gene tests", "Karyotype only", "Early genetics consultation with CMA and rapid trio ES/GS considered concurrently or in a coordinated sequence", "Wait until after discharge"],
        answer: 2,
        explanation: "Multiple congenital anomalies create a high-yield agnostic-testing scenario; acuity increases the potential value of rapid trio sequencing. Laboratory capabilities and turnaround matter."
      },
      {
        stem: "Why are parental samples useful?",
        options: ["They guarantee a diagnosis", "They help identify de novo versus inherited findings and reduce interpretation ambiguity", "They eliminate secondary findings", "They make consent unnecessary"],
        answer: 1,
        explanation: "Trio analysis can materially improve interpretation but does not guarantee a result or remove consent and incidental-finding issues."
      }
    ]
  },
  {
    title: "The VUS trap",
    vignette: "A child with ASD and mild thumb hypoplasia has a TBX5 VUS. The father has first-degree AV block but has never had an echocardiogram.",
    stages: [
      {
        stem: "What should the resident avoid?",
        options: ["Clinical evaluation of the father", "Genetics review of phenotype and segregation strategy", "Calling the VUS diagnostic and using it for predictive testing of healthy siblings", "ECG surveillance of the child"],
        answer: 2,
        explanation: "The phenotype may justify clinical surveillance and family evaluation, but the VUS itself is not diagnostic."
      },
      {
        stem: "What new information could be useful for classification?",
        options: ["Whether the variant segregates with carefully documented phenotype in informative relatives", "The family's preference that it be pathogenic", "A second commercial report with the same raw data", "The child's surgical scar"],
        answer: 0,
        explanation: "Phenotyped segregation data can contribute evidence, but testing strategy should be coordinated by genetics because segregation is not automatically decisive."
      }
    ]
  }
];

let caseState = [];

function renderCases() {
  caseState = cases.map(() => []);
  byId("cases-root").innerHTML = cases.map((item, ci) =>
    '<article class="case"><div class="case-header"><div class="case-number">' + (ci + 1) +
    '</div><div><h3>' + item.title + '</h3><p>' + item.vignette +
    '</p></div></div><div id="case-stages-' + ci + '"></div></article>'
  ).join("");
  cases.forEach((item, ci) => renderCaseStage(ci, 0));
}

function renderCaseStage(ci, si) {
  const stage = cases[ci].stages[si];
  const root = byId("case-stages-" + ci);
  const options = stage.options.map((option, oi) =>
    '<button class="case-answer" type="button" data-case="' + ci + '" data-stage="' + si + '" data-option="' + oi + '">' +
    String.fromCharCode(65 + oi) + ". " + option + "</button>"
  ).join("");
  root.insertAdjacentHTML("beforeend", '<div class="case-stage" id="case-stage-' + ci + "-" + si +
    '"><h4>Decision ' + (si + 1) + ": " + stage.stem + '</h4><div class="answers">' + options +
    '</div><div class="feedback" id="case-feedback-' + ci + "-" + si + '" hidden aria-live="polite"></div></div>');
  root.querySelectorAll('[data-case="' + ci + '"][data-stage="' + si + '"]').forEach(button => button.addEventListener("click", answerCase));
}

function answerCase(event) {
  const button = event.currentTarget;
  const ci = Number(button.dataset.case);
  const si = Number(button.dataset.stage);
  const oi = Number(button.dataset.option);
  if (caseState[ci][si] !== undefined) return;
  caseState[ci][si] = oi;
  const stage = cases[ci].stages[si];
  document.querySelectorAll('[data-case="' + ci + '"][data-stage="' + si + '"]').forEach(option => {
    option.disabled = true;
    if (Number(option.dataset.option) === stage.answer) option.classList.add("correct");
  });
  if (oi !== stage.answer) button.classList.add("wrong");
  const feedback = byId("case-feedback-" + ci + "-" + si);
  feedback.hidden = false;
  feedback.innerHTML = "<strong>" + (oi === stage.answer ? "Correct." : "Best answer shown.") + "</strong> " + stage.explanation;
  if (si + 1 < cases[ci].stages.length) renderCaseStage(ci, si + 1);
}

const posttestBank = [
  {
    id: "trigger-22q", domain: "Recognition",
    stem: "A newborn with TOF has normal calcium and no obvious dysmorphism. Which statement best reflects the 2025 AAP 22q11.2 guidance?",
    options: ["Do not test without hypocalcemia", "A conotruncal defect itself should prompt CMA evaluation for 22q11.2 deletion", "Order TBX1 sequencing instead of CMA", "Test only if developmental delay appears"],
    answer: 1,
    explanation: "The lesion is a trigger. Waiting for extracardiac manifestations misses diagnoses and perioperative risk."
  },
  {
    id: "turner", domain: "Recognition",
    stem: "A newborn girl has coarctation, hand/foot edema, and a webbed neck. Which initial test most directly addresses the suspected diagnosis and mosaicism?",
    options: ["Karyotype", "RASopathy panel", "Methylation study", "Mitochondrial genome sequencing"],
    answer: 0,
    explanation: "The phenotype suggests Turner syndrome; chromosome analysis is central and can characterize X-chromosome abnormalities and mosaicism."
  },
  {
    id: "williams", domain: "Immediate safety",
    stem: "A child with Williams syndrome and SVAS needs elective anesthesia. What makes routine sedation without specialized review unsafe?",
    options: ["Risk of isolated venous thrombosis", "Potential coronary ostial/diffuse arterial disease and cardiovascular collapse", "Universal severe immunodeficiency", "Universal prolonged QT from the deletion"],
    answer: 1,
    explanation: "Williams arteriopathy can compromise coronary and systemic perfusion, especially with hemodynamic changes under anesthesia."
  },
  {
    id: "rasopathy", domain: "Immediate safety",
    stem: "A child with Noonan syndrome and pulmonary stenosis is scheduled for surgery. Which additional preoperative issue deserves explicit assessment?",
    options: ["Bleeding history and possible hemostatic abnormality", "Avoidance of all vaccines", "Routine chelation for hypercalcemia", "Prophylactic splenectomy"],
    answer: 0,
    explanation: "Bleeding disorders are sufficiently associated with Noonan syndrome to require history and directed evaluation before procedures."
  },
  {
    id: "heterotaxy", domain: "Immediate safety",
    stem: "A neonate with heterotaxy and asplenia is approaching discharge. Which omission is most dangerous?",
    options: ["No cosmetic genetics photograph", "No infection-prevention and urgent-fever plan", "No repeat karyotype", "No universal MEK inhibitor discussion"],
    answer: 1,
    explanation: "Poor splenic function creates time-critical sepsis risk; prevention, immunization/antibiotic strategy, and fever instructions must be explicit."
  },
  {
    id: "cma-limit", domain: "Test selection",
    stem: "Which pathogenic change is a standard chromosomal microarray least reliable for detecting?",
    options: ["Typical 22q11.2 deletion", "7q11.23 deletion", "Balanced translocation", "Large pathogenic duplication"],
    answer: 2,
    explanation: "CMA detects copy-number imbalance, not most balanced rearrangements."
  },
  {
    id: "esgs", domain: "Test selection",
    stem: "A child has CHD, renal malformation, and unexplained GDD. Which statement is most accurate?",
    options: ["ES/GS is reserved until adulthood", "ACMG supports ES/GS as first- or second-tier testing; CMA and ES may be coordinated based on phenotype and test capability", "CMA always must precede ES by several years", "A normal karyotype ends the evaluation"],
    answer: 1,
    explanation: "Modern guidance moves genomic sequencing earlier while recognizing complementary CNV detection and local assay differences."
  },
  {
    id: "trio", domain: "Test selection",
    stem: "What is the principal interpretive advantage of trio ES/GS in a child with apparently de novo syndromic CHD?",
    options: ["It removes all incidental findings", "It distinguishes inherited from de novo findings and can reduce ambiguity", "It guarantees insurance coverage", "It detects every repeat expansion"],
    answer: 1,
    explanation: "Parental data can materially improve variant interpretation but do not guarantee diagnosis or complete assay coverage."
  },
  {
    id: "vus", domain: "Interpretation",
    stem: "A VUS is found in a gene plausibly related to the child's lesion. What is the correct action?",
    options: ["Treat it as pathogenic because the gene fits", "Use it for prenatal prediction immediately", "Keep management phenotype-driven and ask genetics whether segregation/reanalysis could clarify it", "Label it benign"],
    answer: 2,
    explanation: "Plausibility does not convert a VUS into a diagnosis."
  },
  {
    id: "negative", domain: "Interpretation",
    stem: "A negative exome in a strongly familial CHD pedigree means:",
    options: ["The disease is environmental", "No relative needs screening", "No reportable cause was found by that analysis; clinical risk and assay limitations remain", "Recurrence risk is zero"],
    answer: 2,
    explanation: "Negative is nondiagnostic. Noncoding/structural causes, mosaicism, incomplete knowledge, and complex inheritance remain possible."
  },
  {
    id: "reanalysis", domain: "Interpretation",
    stem: "When is reinterpretation of a nondiagnostic genomic result most justified?",
    options: ["Never", "Only if the original laboratory closes", "When phenotype/family information changes or sufficient new gene/variant knowledge accumulates, using the laboratory/genetics process", "Every week"],
    answer: 2,
    explanation: "Reanalysis should be planned and triggered by meaningful new clinical or scientific information; no single interval fits every laboratory and case."
  },
  {
    id: "cfdna", domain: "Counseling",
    stem: "A positive cell-free DNA screen for trisomy 21 should be described as:",
    options: ["A definitive fetal diagnosis", "A screening result that warrants counseling and an offer of diagnostic confirmation", "Equivalent to a fetal echocardiogram", "Proof of an AVSD"],
    answer: 1,
    explanation: "Screening estimates risk; CVS or amniocentesis provides prenatal diagnostic confirmation."
  },
  {
    id: "ad-risk", domain: "Counseling",
    stem: "A parent carries an autosomal dominant pathogenic variant that explains the child's CHD. Which statement is most precise?",
    options: ["Each pregnancy has a 50% chance of inheriting the variant, but expression may vary", "Every carrier will have identical CHD", "The recurrence risk is always 2–4%", "Only sons can inherit it"],
    answer: 0,
    explanation: "Transmission risk and phenotype severity are separate because penetrance and expression may vary."
  },
  {
    id: "down-echo", domain: "Recognition",
    stem: "A newborn has prenatally confirmed trisomy 21 and a reportedly normal fetal heart study. What is the appropriate cardiac step?",
    options: ["No postnatal evaluation", "Postnatal echocardiographic evaluation according to AAP health-supervision guidance", "ECG only at age 5", "Echo only if cyanotic"],
    answer: 1,
    explanation: "AAP Down syndrome guidance calls for postnatal cardiac evaluation; prenatal imaging does not eliminate the need."
  },
  {
    id: "familial-bav", domain: "Counseling",
    stem: "Several first-degree relatives have BAV or coarctation, but sequencing is negative. Which recommendation is best?",
    options: ["Stop family evaluation", "Use clinical echocardiographic screening of appropriate relatives and continue phenotype-based counseling", "Test unaffected relatives for all VUS", "Quote a universal 19.3% recurrence risk"],
    answer: 1,
    explanation: "Family screening can be actionable independently of a molecular result; a lesion-specific percentage from one study should not be universalized."
  }
];

let postAttempt = [];
let postSelections = {};
let postSubmitted = false;

function makeAttempt() {
  return shuffle(posttestBank).map(question => {
    const choices = shuffle(question.options.map((text, originalIndex) => ({ text, correct: originalIndex === question.answer })));
    return { ...question, choices };
  });
}

function renderPosttest() {
  postAttempt = makeAttempt();
  postSelections = {};
  postSubmitted = false;
  byId("posttest-root").innerHTML = '<div id="post-results" aria-live="polite"></div>' +
    postAttempt.map((question, qi) => {
      const options = question.choices.map((choice, oi) =>
        '<button class="answer" type="button" aria-pressed="false" data-post-q="' + qi + '" data-post-o="' + oi + '">' +
        String.fromCharCode(65 + oi) + ". " + choice.text + "</button>"
      ).join("");
      return '<fieldset class="question" id="post-question-' + qi + '"><legend>' + (qi + 1) + ". " + question.stem +
        ' <span class="small">[' + question.domain + ']</span></legend><div class="answers">' + options +
        '</div><div class="feedback" id="post-feedback-' + qi + '" hidden></div></fieldset>';
    }).join("");
  document.querySelectorAll("[data-post-q]").forEach(button => button.addEventListener("click", selectPostAnswer));
  byId("submit-posttest").disabled = false;
}

function selectPostAnswer(event) {
  if (postSubmitted) return;
  const button = event.currentTarget;
  const qi = Number(button.dataset.postQ);
  const oi = Number(button.dataset.postO);
  postSelections[qi] = oi;
  document.querySelectorAll('[data-post-q="' + qi + '"]').forEach(option => {
    const selected = Number(option.dataset.postO) === oi;
    option.classList.toggle("selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
}

function submitPosttest() {
  if (postSubmitted) return;
  if (Object.keys(postSelections).length !== postAttempt.length) {
    const missing = postAttempt.length - Object.keys(postSelections).length;
    byId("post-results").innerHTML = '<div class="results retry"><strong>Complete all questions.</strong> ' + missing + " unanswered.</div>";
    const firstMissing = postAttempt.findIndex((_, index) => postSelections[index] === undefined);
    byId("post-question-" + firstMissing).scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  postSubmitted = true;
  let correct = 0;
  const domains = {};
  postAttempt.forEach((question, qi) => {
    const selectedIndex = postSelections[qi];
    const isCorrect = question.choices[selectedIndex].correct;
    if (isCorrect) correct += 1;
    if (!domains[question.domain]) domains[question.domain] = { correct: 0, total: 0 };
    domains[question.domain].total += 1;
    if (isCorrect) domains[question.domain].correct += 1;
    document.querySelectorAll('[data-post-q="' + qi + '"]').forEach(option => {
      option.disabled = true;
      const oi = Number(option.dataset.postO);
      if (question.choices[oi].correct) option.classList.add("correct");
      if (oi === selectedIndex && !isCorrect) option.classList.add("wrong");
    });
    const feedback = byId("post-feedback-" + qi);
    feedback.hidden = false;
    feedback.innerHTML = "<strong>" + (isCorrect ? "Correct." : "Review:") + "</strong> " + question.explanation;
  });
  const percent = Math.round((correct / postAttempt.length) * 100);
  const passed = percent >= 80;
  const domainHtml = Object.entries(domains).map(([name, score]) =>
    '<div class="domain"><strong>' + score.correct + "/" + score.total + '</strong><span>' + name + "</span></div>"
  ).join("");
  byId("post-results").innerHTML = '<div class="results ' + (passed ? "pass" : "retry") + '"><h3>' +
    (passed ? "Mastery achieved" : "Not yet at mastery") + ": " + correct + "/" + postAttempt.length + " (" + percent +
    '%)</h3><p>' + (passed ? "You met the 80% standard. Review any missed explanations." : "Review the weak domains and take a new, reshuffled attempt.") +
    '</p><div class="domain-grid">' + domainHtml + "</div></div>";
  byId("submit-posttest").disabled = true;
  byId("post-results").scrollIntoView({ behavior: "smooth", block: "start" });
}

byId("reset-pretest").addEventListener("click", renderPretest);
byId("reset-cases").addEventListener("click", renderCases);
byId("submit-posttest").addEventListener("click", submitPosttest);
byId("retry-posttest").addEventListener("click", () => {
  renderPosttest();
  byId("posttest-root").scrollIntoView({ behavior: "smooth", block: "start" });
});
byId("print-quick").addEventListener("click", () => window.print());

renderPretest();
renderCases();
renderPosttest();

const initialTab = location.hash.slice(1);
if (document.querySelector('[data-tab="' + initialTab + '"]')) activateTab(initialTab);
