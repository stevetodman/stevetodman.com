export const VASOVAGAL_POLICY_VERSION = "2026-SYNCOPE-SPORTS-PHYSICIAN-APPROVED-1" as const;

export const VASOVAGAL_POLICY_SOURCES = [
  "Shen WK, Sheldon RS, Benditt DG, et al. 2017 ACC/AHA/HRS Guideline for the Evaluation and Management of Patients With Syncope. Circulation. 2017;136:e60-e122.",
  "Kim JH, Baggish AL, Levine BD, et al. Clinical Considerations for Competitive Sports Participation for Athletes With Cardiovascular Abnormalities: A Scientific Statement From the American Heart Association and American College of Cardiology. Circulation. 2025;151:e716-e761.",
  "Gilpin K, Goode Z. Syncope. Pediatr Rev. 2024;45(10):606-608.",
] as const;

/**
 * Physician-reviewed teaching policy for the synthetic post-exertional syncope
 * case. Keep this policy separate from immutable patient facts so future
 * guideline changes do not require rewriting the synthetic history/exam/ECG.
 *
 * Physician sign-off is documented in docs/CLINICAL_VALIDATION.md. Runtime
 * wiring must still preserve the canonical event-driven hospital architecture.
 */
export const VASOVAGAL_TEACHING_POLICY = {
  version: VASOVAGAL_POLICY_VERSION,
  sources: VASOVAGAL_POLICY_SOURCES,
  runtimeStatus: "physician-approved",

  preferredDiagnosis: "Probable post-exertional neurally mediated syncope",
  acceptableDiagnosisLabels: [
    "Probable post-exertional neurally mediated syncope",
    "Post-exertional neurally mediated syncope",
    "Exercise-associated postural collapse",
    "Post-exertional vasovagal syncope",
  ],

  initialEvaluation: [
    "Detailed event history, including whether loss of consciousness occurred during exercise, while slowing, after crossing the finish line, after stopping, or while walking afterward",
    "Witness description of the collapse, duration of loss of consciousness, abnormal movements or injury, and recovery to baseline",
    "Prior syncope or presyncope, especially during exercise, plus exertional chest pain, abrupt or sustained palpitations, unusual dyspnea, or declining exercise tolerance",
    "Family history focused on sudden unexplained death, cardiomyopathy, channelopathy, significant arrhythmia, unexplained drowning, or other suspicious premature death",
    "Focused cardiovascular examination; orthostatic heart rate and blood pressure are reasonable when clinically appropriate",
    "Resting 12-lead ECG interpreted in the context of athletic training",
  ],

  additionalHistoryDomains: [
    "Known cardiac disease or prior myocarditis",
    "Recent illness, fever, vomiting or diarrhea, heat exposure, fasting, and hydration",
    "Energy-drink product and size if known, timing relative to exercise, other caffeine that day, nicotine exposure, prescription stimulants, decongestants, pre-workout or supplements, and recreational substances",
    "For an adolescent endurance athlete, consider menstrual history, heavy bleeding, disordered eating or low energy availability, and anemia symptoms; do not invent findings that are not supplied by the synthetic case",
  ],

  athleteEcgInterpretation:
    "The supplied sinus bradycardia is compatible with physiologic athletic adaptation in this otherwise reassuring synthetic ECG and should not be scored as a pathologic finding by itself.",

  // These tests are not routine after the supplied history, examination, and
  // ECG remain reassuring. They become appropriate when the phenotype changes
  // or meaningful diagnostic uncertainty remains.
  notRoutineAfterReassuringInitialEvaluation: [
    "Echocardiogram",
    "Ambulatory rhythm monitoring",
    "Exercise stress testing",
    "Cardiac MRI",
    "Troponin",
    "BNP",
    "Broad laboratory testing",
  ],

  conditionalTesting: {
    echocardiography: [
      "Uncertainty whether syncope actually occurred during rather than after exercise",
      "Exertional chest pain",
      "Disproportionate exertional dyspnea or exercise intolerance",
      "Abnormal cardiovascular examination",
      "Abnormal ECG",
      "Known cardiac disease",
      "Concerning inherited-disease or family history",
      "Recurrent or otherwise atypical unexplained syncope",
    ],
    ambulatoryRhythmMonitoring: [
      "Abrupt or sustained palpitations around an event",
      "Recurrent unexplained events",
      "Residual suspicion for arrhythmia",
    ],
    exerciseStressTesting: [
      "Syncope actually occurred during exercise",
      "Exercise timing remains ambiguous",
      "Residual concern for an exercise-related cardiac mechanism",
    ],
    otherTesting:
      "Troponin, BNP, cardiac MRI, and laboratory testing are indication-driven rather than categorically unnecessary.",
  },

  stimulantTeaching: {
    interpretation:
      "The supplied energy-drink and nicotine exposures are clinically relevant potential contributors and should lower confidence in a simplistic dehydration-only explanation, but they do not by themselves prove an arrhythmic mechanism or mandate cardiac imaging or ambulatory monitoring when the overall phenotype remains reassuring.",
    counseling:
      "Counsel against energy-drink use for athletic performance or hydration and address nicotine/vaping as a modifiable exposure.",
  },

  returnToPlay: {
    lowRisk:
      "Once she has recovered completely and the history, family history, examination, and ECG support post-exertional neurally mediated syncope without concerning features, prolonged cardiac restriction is not required and return to training and competition is reasonable after hydration, nutrition, heat exposure, and stimulant use are addressed.",
    highRisk:
      "If the event occurred during running, or there is abrupt or sustained palpitations, exertional chest pain, unusual dyspnea, absent prodrome, abnormal examination or ECG, concerning family history, recurrent unexplained syncope, or persistent diagnostic uncertainty, competitive exercise should stop while additional cardiac evaluation is completed.",
    prohibitedShortcut:
      "Do not teach same-day immediate continuation of competition merely because the collapse occurred after exercise.",
  },

  correctManagement: [
    "Explain that the overall phenotype most strongly supports probable post-exertional neurally mediated syncope after a reassuring initial evaluation",
    "Counsel on hydration, regular nutrition, heat exposure, recognition of prodromal symptoms, and avoidance of energy drinks for athletic performance or hydration",
    "Address nicotine/vaping and other stimulant exposures",
    "Allow return to training and competition after complete recovery and a reassuring evaluation; prolonged cardiac restriction is not required in this low-risk phenotype",
    "Give clear re-evaluation precautions for syncope during exercise, absent prodrome, exertional chest pain or abrupt/sustained palpitations, unusual dyspnea, abnormal examination or ECG, concerning family history, recurrent unexplained events, or persistent diagnostic uncertainty",
  ],

  unsafeShortcut:
    "Do not label post-exertional timing alone as proof of benign vasovagal syncope, require 'vasovagal' as the only acceptable diagnosis, describe ECG as the entire evaluation, or clear an athlete before the overall history, family history, examination, and ECG are reassuring.",

  teachingPoint:
    "Post-exertional collapse with a progressive prodrome can support probable neurally mediated syncope when the complete event history, family history, examination, and athlete-appropriate ECG are reassuring. Timing is high-value but not diagnostic by itself. Syncope during exercise, abrupt or unheralded collapse, exertional chest pain or palpitations, abnormal examination or ECG, concerning inherited-cardiac family history, recurrence, or persistent uncertainty should change the pathway and trigger additional cardiac evaluation with temporary exercise restriction while that evaluation is completed.",
} as const;
