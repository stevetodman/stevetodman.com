export interface CaseSource {
  label: string;
  citation: string;
}

export interface CaseMetadata {
  author: string;
  medicalReviewer: string;
  version: string;
  lastReviewed: string;
  teachingObjectives: string[];
  sources: CaseSource[];
}

export const CASE_METADATA: Record<string, CaseMetadata> = {
  "case-hcm": {
    author: "S. Todman, MD",
    medicalReviewer: "R. Patel, MD (Peds Cardiology)",
    version: "1.4",
    lastReviewed: "2026-08",
    teachingObjectives: [
      "Recognize exertional syncope as a red flag for structural heart disease",
      "Elicit family history of premature sudden death",
      "Restrict competitive sports BEFORE completing diagnostic workup",
      "Understand indications for family screening and genetics referral",
    ],
    sources: [
      { label: "AHA/ACC Guideline on HCM", citation: "Ommen SR et al. 2020 AHA/ACC HCM Guideline." },
      { label: "Eligibility & Disqualification (Task Force 3)", citation: "Maron BJ et al. Circulation. 2015;132(22)." },
    ],
  },
  "case-vasovagal": {
    author: "S. Todman, MD",
    medicalReviewer: "R. Patel, MD (Peds Cardiology)",
    version: "1.2",
    lastReviewed: "2026-08",
    teachingObjectives: [
      "Distinguish post-exertional from mid-exertional syncope",
      "Recognize prodrome as a discriminating feature",
      "Practice test-selection restraint",
      "Counsel families appropriately after benign syncope",
    ],
    sources: [
      { label: "Pediatric Syncope Evaluation", citation: "Anderson JB, Willis M, et al. Pediatrics. 2012;130(4)." },
    ],
  },
  "case-innocent-murmur": {
    author: "S. Todman, MD",
    medicalReviewer: "R. Patel, MD (Peds Cardiology)",
    version: "1.1",
    lastReviewed: "2026-08",
    teachingObjectives: [
      "Identify features of an innocent Still's murmur",
      "Avoid unnecessary imaging in an asymptomatic thriving child",
      "Communicate reassurance effectively",
    ],
    sources: [
      { label: "Pediatric Heart Murmurs", citation: "Frank JE, Jacobe KM. Am Fam Physician. 2011;84(7)." },
    ],
  },
  "case-wpw": {
    author: "S. Todman, MD",
    medicalReviewer: "R. Patel, MD (Peds Cardiology)",
    version: "1.0",
    lastReviewed: "2026-08",
    teachingObjectives: [
      "Recognize abrupt-on/abrupt-off palpitations as paroxysmal SVT",
      "Identify short PR + delta wave as pre-excitation / WPW",
      "Understand indications for EP referral and ablation",
    ],
    sources: [
      { label: "PACES/HRS Expert Consensus on WPW", citation: "Cohen MI et al. Heart Rhythm. 2012;9(6)." },
    ],
  },
  "case-myocarditis": {
    author: "S. Todman, MD",
    medicalReviewer: "M. Mhanna, MD (Peds Cardiology)",
    version: "1.3",
    lastReviewed: "2026-08",
    teachingObjectives: [
      "Connect recent viral illness to new cardiac symptoms",
      "Recognize low-voltage ECG and sinus tachycardia as red flags",
      "Escalate to admission rather than reassurance",
      "Order troponin, BNP, echo appropriately",
    ],
    sources: [
      { label: "AHA Scientific Statement on Pediatric Myocarditis", citation: "Law YM et al. Circulation. 2021;144(6):e123–e135." },
    ],
  },
  "case-longqt": {
    author: "S. Todman, MD",
    medicalReviewer: "R. Patel, MD (Peds Cardiology)",
    version: "1.0",
    lastReviewed: "2026-08",
    teachingObjectives: [
      "Recognize swimming/startle-triggered syncope as classic for LQT1/LQT2",
      "Elicit family history of unexplained drowning or premature sudden death",
      "Review medication list for QT-prolonging agents",
      "Restrict startle-trigger activities pending EP evaluation",
    ],
    sources: [
      { label: "HRS/EHRA/APHRS Expert Consensus on Inherited Arrhythmia Syndromes", citation: "Priori SG et al. Heart Rhythm. 2013;10(12)." },
      { label: "CredibleMeds — QT drug list", citation: "CredibleMeds.org (last accessed 2026-08)." },
    ],
  },
  "case-coarctation": {
    author: "S. Todman, MD",
    medicalReviewer: "R. Patel, MD (Peds Cardiology)",
    version: "1.0",
    lastReviewed: "2026-08",
    teachingObjectives: [
      "Obtain four-limb blood pressures in every hypertensive adolescent",
      "Perform femoral pulse examination and recognize radial-femoral delay",
      "Recognize coarctation triad: LVH + upper/lower BP discrepancy + murmur radiating to back",
      "Understand association with bicuspid aortic valve and family screening implications",
    ],
    sources: [
      { label: "AHA Guideline: Congenital Heart Disease in Adults", citation: "Stout KK et al. Circulation. 2019;139(14)." },
      { label: "AAP Hypertension Guideline", citation: "Flynn JT et al. Pediatrics. 2017;140(3):e20171904." },
    ],
  },
};

export function getCaseMetadata(caseId: string): CaseMetadata | undefined {
  return CASE_METADATA[caseId];
}
