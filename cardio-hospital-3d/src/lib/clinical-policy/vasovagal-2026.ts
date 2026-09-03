export const VASOVAGAL_POLICY_VERSION = "2026-SYNCOPE-SPORTS-VALIDATION" as const;

export const VASOVAGAL_POLICY_SOURCES = [
  "Shen WK, Sheldon RS, Benditt DG, et al. 2017 ACC/AHA/HRS Guideline for the Evaluation and Management of Patients With Syncope. Circulation. 2017;136:e60-e122.",
  "Kim JH, Baggish AL, Levine BD, et al. Clinical Considerations for Competitive Sports Participation for Athletes With Cardiovascular Abnormalities: A Scientific Statement From the American Heart Association and American College of Cardiology. Circulation. 2025;151:e716-e761.",
  "Gilpin K, Goode Z. Syncope. Pediatr Rev. 2024;45(10):606-608.",
] as const;

/**
 * Evidence-reviewed teaching policy for the synthetic post-exertional vasovagal
 * syncope case. Keep this policy separate from immutable patient facts so future
 * guideline changes do not require rewriting the synthetic history/exam/ECG.
 *
 * Runtime use remains gated on physician sign-off documented in
 * docs/CLINICAL_VALIDATION.md.
 */
export const VASOVAGAL_TEACHING_POLICY = {
  version: VASOVAGAL_POLICY_VERSION,
  sources: VASOVAGAL_POLICY_SOURCES,
  runtimeStatus: "awaiting-physician-signoff",

  initialEvaluation: [
    "Detailed event history including exercise timing and prodrome",
    "Focused physical examination and family history",
    "Resting 12-lead ECG",
  ],

  // In this synthetic case, these are not routine after the provided history,
  // examination, and ECG remain reassuring. They become appropriate if new
  // concerning features or diagnostic uncertainty emerges.
  notRoutineAfterReassuringInitialEvaluation: [
    "Echocardiogram",
    "Cardiac MRI",
    "Holter",
    "Troponin",
    "BNP",
  ],

  correctManagement: [
    "Explain the likely neurally mediated/post-exertional mechanism after the reassuring initial evaluation",
    "Counsel on hydration, regular nutrition, heat exposure, and recognition of prodromal symptoms",
    "Return to competitive running is reasonable when history, physical examination, and ECG support post-exertional neurally mediated syncope without concerning findings",
    "Give clear re-evaluation precautions for syncope during exercise, absent prodrome, exertional chest pain or abrupt palpitations, abnormal examination or ECG, concerning family history, or recurrent unexplained events",
  ],

  unsafeShortcut:
    "Do not label post-exertional timing alone as proof of benign vasovagal syncope or clear an athlete before a reassuring history, physical examination, and ECG.",

  teachingPoint:
    "Post-exertional collapse with a typical prodrome and reversible triggers can support neurally mediated syncope when the history, examination, family history, and resting ECG are reassuring. Timing is important but not diagnostic by itself; syncope during exercise or other high-risk features should trigger cardiac evaluation and temporary restriction while that evaluation is completed.",
} as const;
