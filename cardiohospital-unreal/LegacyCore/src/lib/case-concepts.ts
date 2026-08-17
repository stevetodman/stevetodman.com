// Educational concept map shared by persistence and adaptive sequencing.
// IDs are stable storage keys; labels may evolve without invalidating history.

export interface CaseConceptDefinition {
  id: string;
  label: string;
  caseIds: string[];
  dimensionIds: string[];
}

export const CASE_CONCEPTS: CaseConceptDefinition[] = [
  {
    id: "exertional-syncope-red-flags",
    label: "Exertional syncope red flags",
    caseIds: ["case-hcm", "case-vasovagal"],
    dimensionIds: ["history", "redFlagRecognition", "clinicalReasoning", "safety"],
  },
  {
    id: "family-sudden-death",
    label: "Family sudden death history",
    caseIds: ["case-hcm", "case-longqt"],
    dimensionIds: ["history", "redFlagRecognition", "clinicalReasoning"],
  },
  {
    id: "murmur-differentiation",
    label: "Murmur differentiation",
    caseIds: ["case-innocent-murmur", "case-coarctation"],
    dimensionIds: ["physicalExamination", "clinicalReasoning", "testSelection"],
  },
  {
    id: "ecg-interpretation",
    label: "ECG interpretation",
    caseIds: ["case-wpw", "case-hcm", "case-myocarditis", "case-longqt", "case-coarctation"],
    dimensionIds: ["testSelection", "interpretation", "clinicalReasoning"],
  },
  {
    id: "postviral-cardiac-red-flags",
    label: "Postviral cardiac red flags",
    caseIds: ["case-myocarditis"],
    dimensionIds: ["history", "redFlagRecognition", "clinicalReasoning", "safety"],
  },
  {
    id: "test-selection-restraint",
    label: "Test selection restraint",
    caseIds: ["case-innocent-murmur", "case-vasovagal", "case-msk-chest-pain"],
    dimensionIds: ["testSelection", "efficiency", "communication"],
  },
  {
    id: "long-qt-triggers",
    label: "Long QT triggers and medications",
    caseIds: ["case-longqt"],
    dimensionIds: ["history", "redFlagRecognition", "interpretation", "safety"],
  },
  {
    id: "pediatric-hypertension",
    label: "Pediatric hypertension workup",
    caseIds: ["case-coarctation", "case-adolescent-htn"],
    dimensionIds: ["physicalExamination", "testSelection", "clinicalReasoning"],
  },
  {
    id: "pediatric-chest-pain",
    label: "Pediatric chest-pain discrimination",
    caseIds: ["case-msk-chest-pain", "case-myocarditis"],
    dimensionIds: ["history", "physicalExamination", "testSelection", "clinicalReasoning"],
  },
  {
    id: "abpm-confirmation",
    label: "ABPM confirmation of hypertension",
    caseIds: ["case-adolescent-htn"],
    dimensionIds: ["testSelection", "clinicalReasoning", "safety"],
  },
];
