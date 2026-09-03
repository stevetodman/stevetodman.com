import type { ClinicalCase } from "./cases-data";
import type { EncounterRuntimeState } from "./hospital-engine";

export interface EncounterScore {
  dimensions: Record<string, number>;
  overall: number;
  missedRedFlags: string[];
  unnecessaryTests: string[];
  diagnosisCorrect: boolean;
}

function clampScore(value: number, minimum = 0): number {
  return Math.max(minimum, Math.min(100, Math.round(value)));
}

function isDiagnosticTest(label: string): boolean {
  return !/referral|consult/i.test(label);
}

export function scoreCanonicalEncounter(
  encounter: EncounterRuntimeState,
  clinicalCase: ClinicalCase
): EncounterScore {
  const redFlagsAsked = clinicalCase.redFlagKeys.filter((key) =>
    encounter.askedHistoryKeys.includes(key)
  );
  const missedRedFlags = clinicalCase.redFlagKeys.filter(
    (key) => !encounter.askedHistoryKeys.includes(key)
  );
  const historyBase = encounter.askedHistoryKeys.length >= 3 ? 40 : 20;
  const history = clampScore(
    historyBase
      + (redFlagsAsked.length / Math.max(1, clinicalCase.redFlagKeys.length)) * 60
  );

  const coreExamCompleted = [
    encounter.performedExamActions.includes("general"),
    encounter.performedExamActions.includes("vitals"),
    encounter.performedExamActions.some((action) => action.startsWith("auscultation:")),
    encounter.performedExamActions.includes("femoralPulses"),
  ].filter(Boolean).length;
  const physicalExam = clampScore((coreExamCompleted / 4) * 100);

  const appropriateTests = clinicalCase.appropriateTests.filter(isDiagnosticTest);
  const appropriateOrdered = appropriateTests.filter((test) =>
    encounter.orderedTests.includes(test)
  ).length;
  const unnecessaryTests = clinicalCase.unnecessaryTests.filter((test) =>
    encounter.orderedTests.includes(test)
  );
  const testSelection = clampScore(
    (appropriateOrdered / Math.max(1, appropriateTests.length)) * 100
      - unnecessaryTests.length * 15
  );

  const diagnosisCorrect = encounter.diagnosis === clinicalCase.correctDiagnosis;
  const ecgContribution = (encounter.ecgInterpretation?.score ?? 0) * 0.3;
  const clinicalReasoning = clampScore(
    (diagnosisCorrect ? 70 : 20) + (diagnosisCorrect ? ecgContribution : ecgContribution / 3)
  );

  const correctManagementSelected = clinicalCase.correctManagement.filter((item) =>
    encounter.management.includes(item)
  ).length;
  const safety = clampScore(
    50
      + (correctManagementSelected / Math.max(1, clinicalCase.correctManagement.length)) * 50
      - encounter.safetyEvents.length * 20,
    10
  );

  const efficiency = clampScore(
    100
      - unnecessaryTests.length * 12
      - Math.max(0, encounter.orderedTests.length - appropriateTests.length) * 3,
    30
  );

  const confidentialBonus =
    encounter.confidentialInterviewDone && clinicalCase.allowConfidentialInterview ? 10 : 0;
  const communication = clampScore(
    70 + (encounter.askedHistoryKeys.length >= 4 ? 15 : 5) + confidentialBonus
  );

  const dimensions = {
    History: history,
    "Physical Exam": physicalExam,
    "Test Selection": testSelection,
    "Clinical Reasoning": clinicalReasoning,
    Safety: safety,
    Efficiency: efficiency,
    Communication: communication,
  };
  const values = Object.values(dimensions);
  const overall = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

  return {
    dimensions,
    overall,
    missedRedFlags,
    unnecessaryTests,
    diagnosisCorrect,
  };
}
