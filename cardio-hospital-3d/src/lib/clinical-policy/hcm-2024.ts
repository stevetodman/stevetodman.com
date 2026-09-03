export const HCM_POLICY_VERSION = "2024-AHA-ACC-HCM" as const;

export const HCM_POLICY_SOURCE =
  "Ommen SR, Ho CY, Asif IM, et al. 2024 AHA/ACC/AMSSM/HRS/PACES/SCMR Guideline for the Management of Hypertrophic Cardiomyopathy. J Am Coll Cardiol. 2024;83(23):2324-2405.";

/**
 * Guideline-sensitive teaching policy is intentionally separated from immutable
 * synthetic patient facts. This lets the simulator update management teaching
 * when standards evolve without rewriting the patient's history, ECG, or echo.
 */
export const HCM_TEACHING_POLICY = {
  version: HCM_POLICY_VERSION,
  source: HCM_POLICY_SOURCE,

  // Core studies needed to establish the diagnosis in this synthetic case.
  diagnosticCoreTests: ["ECG", "Echocardiogram"],

  // Important after HCM is established for pediatric SCD risk stratification.
  riskStratificationTests: ["Ambulatory ECG monitoring", "Cardiac MRI"],

  // These are not part of the intended HCM diagnostic/risk-stratification path
  // for this stable synthetic encounter and may be penalized for efficiency.
  unnecessaryTests: ["CT angiography", "Troponin", "BNP"],

  correctManagement: [
    "Hold competitive basketball pending comprehensive HCM/sports cardiology evaluation",
    "Refer to pediatric HCM/EP expertise for SCD risk stratification and shared ICD decision-making",
    "Screen first-degree relatives",
    "Genetic counseling and testing discussion",
  ],

  unsafeReturnToPlay: "Immediate unrestricted return to competitive basketball",

  teachingPoint:
    "Mid-exertional syncope without prodrome plus a family history of premature sudden death is high-risk cardiac syncope and requires urgent structural and arrhythmic evaluation. Once HCM is confirmed, pediatric SCD risk stratification should incorporate age/body-size-appropriate factors, ambulatory rhythm assessment, and CMR when it can clarify risk; ICD and future competitive-sports decisions should use expert shared decision-making rather than automatic blanket rules.",
} as const;

export type HcmManagementAction =
  (typeof HCM_TEACHING_POLICY.correctManagement)[number];
