import { memory } from "./memory-store";
import { CASES, type ClinicalCase, type DiscloseKey } from "./cases-data";

export interface ClinicalAction {
  timestamp: string; // HH:MM
  category:
    | "navigation"
    | "history"
    | "exam"
    | "order"
    | "result"
    | "diagnosis"
    | "management"
    | "consultation"
    | "safety";
  label: string;
  meta?: Record<string, unknown>;
}

export interface CaseAttempt {
  caseId: string;
  startedAt: string;
  completedAt?: string;
  askedHistoryKeys: DiscloseKey[];
  performedExamActions: string[];
  orderedTests: string[];
  submittedDiagnosis?: string;
  submittedManagement: string[];
  reasoningNotes?: string;
  actions: ClinicalAction[];
  scores?: Record<string, number>;
  /** Whether the learner conducted a confidential adolescent interview. */
  confidentialInterviewDone?: boolean;
  /** Safety events recorded during the encounter. */
  safetyEvents?: string[];
}

export interface RotationState {
  currentDay: number;
  currentLocation: string;
  activeCaseId?: string;
  attempts: CaseAttempt[];
  completedCaseIds: string[];
  currentAttempt?: CaseAttempt;
}

const KEY = "rotation";

export function getRotation(): RotationState {
  return memory.ensure<RotationState>(KEY, () => ({
    currentDay: 1,
    currentLocation: "lobby",
    attempts: [],
    completedCaseIds: [],
  }));
}

export function setRotation(next: RotationState) {
  memory.put(KEY, next);
}

function stamp(): string {
  const state = getRotation();
  const baseMinutes = 8 * 60 + state.attempts.length * 12;
  const totalActions =
    (state.currentAttempt?.actions.length ?? 0) + state.attempts.length * 15;
  const total = baseMinutes + totalActions * 2;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function startCase(caseId: string): CaseAttempt {
  const state = getRotation();
  const attempt: CaseAttempt = {
    caseId,
    startedAt: stamp(),
    askedHistoryKeys: [],
    performedExamActions: [],
    orderedTests: [],
    submittedManagement: [],
    actions: [
      {
        timestamp: stamp(),
        category: "navigation",
        label: `Entered exam room for new patient`,
      },
    ],
  };
  setRotation({ ...state, activeCaseId: caseId, currentAttempt: attempt });
  return attempt;
}

export function logAction(action: Omit<ClinicalAction, "timestamp">) {
  const state = getRotation();
  if (!state.currentAttempt) return;
  const ca = {
    ...state.currentAttempt,
    actions: [
      ...state.currentAttempt.actions,
      { ...action, timestamp: stamp() },
    ],
  };
  setRotation({ ...state, currentAttempt: ca });
}

export function askHistory(key: DiscloseKey, questionLabel: string) {
  const state = getRotation();
  if (!state.currentAttempt) return;
  if (state.currentAttempt.askedHistoryKeys.includes(key)) return;
  const ca = {
    ...state.currentAttempt,
    askedHistoryKeys: [...state.currentAttempt.askedHistoryKeys, key],
  };
  setRotation({ ...state, currentAttempt: ca });
  logAction({ category: "history", label: `Asked: ${questionLabel}` });
}

export function markConfidentialInterview() {
  const state = getRotation();
  if (!state.currentAttempt) return;
  if (state.currentAttempt.confidentialInterviewDone) return;
  const ca = {
    ...state.currentAttempt,
    confidentialInterviewDone: true,
  };
  setRotation({ ...state, currentAttempt: ca });
  logAction({
    category: "history",
    label: "Asked parent to step out for confidential adolescent interview",
  });
}

export function performExam(action: string) {
  const state = getRotation();
  if (!state.currentAttempt) return;
  if (state.currentAttempt.performedExamActions.includes(action)) return;
  const ca = {
    ...state.currentAttempt,
    performedExamActions: [
      ...state.currentAttempt.performedExamActions,
      action,
    ],
  };
  setRotation({ ...state, currentAttempt: ca });
  logAction({ category: "exam", label: `Performed: ${action}` });
}

export function orderTest(test: string) {
  const state = getRotation();
  if (!state.currentAttempt) return;
  if (state.currentAttempt.orderedTests.includes(test)) return;
  const ca = {
    ...state.currentAttempt,
    orderedTests: [...state.currentAttempt.orderedTests, test],
  };
  setRotation({ ...state, currentAttempt: ca });
  logAction({ category: "order", label: `Ordered: ${test}` });
}

export function reviewTest(test: string) {
  logAction({ category: "result", label: `Reviewed: ${test}` });
}

export function recordSafetyEvent(description: string) {
  const state = getRotation();
  if (!state.currentAttempt) return;
  const events = state.currentAttempt.safetyEvents ?? [];
  if (events.includes(description)) return;
  const ca = {
    ...state.currentAttempt,
    safetyEvents: [...events, description],
  };
  setRotation({ ...state, currentAttempt: ca });
  logAction({ category: "safety", label: `Safety event: ${description}` });
}

export function submitDiagnosis(
  diagnosis: string,
  reasoning: string,
  management: string[]
) {
  const state = getRotation();
  if (!state.currentAttempt) return;
  const ca = {
    ...state.currentAttempt,
    submittedDiagnosis: diagnosis,
    reasoningNotes: reasoning,
    submittedManagement: management,
    completedAt: stamp(),
  };
  setRotation({ ...state, currentAttempt: ca });
  logAction({
    category: "diagnosis",
    label: `Submitted diagnosis: ${diagnosis}`,
  });
  management.forEach((m) =>
    logAction({ category: "management", label: `Plan: ${m}` })
  );
}

export function finalizeAttempt(): CaseAttempt | undefined {
  const state = getRotation();
  if (!state.currentAttempt) return;
  const c = CASES.find((c) => c.id === state.currentAttempt!.caseId);
  const scores = c ? scoreAttempt(state.currentAttempt, c) : undefined;
  const finalAttempt: CaseAttempt = { ...state.currentAttempt, scores };
  setRotation({
    ...state,
    attempts: [...state.attempts, finalAttempt],
    completedCaseIds: Array.from(
      new Set([...state.completedCaseIds, state.currentAttempt.caseId])
    ),
    currentAttempt: undefined,
    activeCaseId: undefined,
  });
  return finalAttempt;
}

function scoreAttempt(a: CaseAttempt, c: ClinicalCase): Record<string, number> {
  const redFlagAsked = c.redFlagKeys.filter((k) =>
    a.askedHistoryKeys.includes(k)
  ).length;
  const historyBase = a.askedHistoryKeys.length >= 3 ? 40 : 20;
  const history = Math.min(
    100,
    historyBase + (redFlagAsked / Math.max(1, c.redFlagKeys.length)) * 60
  );

  const coreExams = [
    "general",
    "vitals",
    "auscultation",
    "femoralPulses",
  ];
  const performedCore = coreExams.filter((e) =>
    a.performedExamActions.some((p) => p.startsWith(e))
  ).length;
  const physicalExam = (performedCore / coreExams.length) * 100;

  const appropriate = c.appropriateTests.filter((t) =>
    a.orderedTests.includes(t)
  ).length;
  const unnecessary = c.unnecessaryTests.filter((t) =>
    a.orderedTests.includes(t)
  ).length;
  const testDenom = Math.max(1, c.appropriateTests.length);
  const testSelection = Math.max(
    0,
    Math.min(
      100,
      (appropriate / testDenom) * 100 - unnecessary * 15 +
        (c.appropriateTests.length === 0 && a.orderedTests.length === 0
          ? 100
          : 0)
    )
  );

  const dxCorrect = a.submittedDiagnosis === c.correctDiagnosis;
  const clinicalReasoning = Math.min(
    100,
    (dxCorrect ? 70 : 30) +
      (redFlagAsked / Math.max(1, c.redFlagKeys.length)) * 30
  );

  const mgmtOverlap = c.correctManagement.filter((m) =>
    a.submittedManagement.includes(m)
  ).length;
  const safetyPenalty = (a.safetyEvents?.length ?? 0) * 20;
  const safety = Math.max(
    10,
    Math.min(
      100,
      50 +
        (mgmtOverlap / Math.max(1, c.correctManagement.length)) * 50 -
        safetyPenalty
    )
  );

  const efficiency = Math.max(
    30,
    Math.min(
      100,
      100 - unnecessary * 12 - Math.max(0, a.actions.length - 18) * 2
    )
  );

  const confidentialBonus = a.confidentialInterviewDone && c.allowConfidentialInterview
    ? 10
    : 0;
  const communication = Math.min(
    100,
    70 +
      (a.askedHistoryKeys.length >= 4 ? 15 : 5) +
      confidentialBonus
  );

  return {
    History: Math.round(history),
    "Physical Exam": Math.round(physicalExam),
    "Test Selection": Math.round(testSelection),
    "Clinical Reasoning": Math.round(clinicalReasoning),
    Safety: Math.round(safety),
    Efficiency: Math.round(efficiency),
    Communication: Math.round(communication),
  };
}

export function getConceptMastery(): { concept: string; mastery: number }[] {
  const state = getRotation();
  const concepts = [
    { concept: "Exertional syncope red flags", ids: ["case-hcm", "case-vasovagal"] },
    { concept: "Family sudden death history", ids: ["case-hcm", "case-longqt"] },
    { concept: "Murmur differentiation", ids: ["case-innocent-murmur"] },
    { concept: "ECG interpretation (WPW / LVH / low voltage)", ids: ["case-wpw", "case-hcm", "case-myocarditis", "case-longqt", "case-coarctation"] },
    { concept: "Postviral cardiac red flags", ids: ["case-myocarditis"] },
    { concept: "Test selection restraint", ids: ["case-innocent-murmur", "case-vasovagal"] },
    { concept: "Long QT triggers and medications", ids: ["case-longqt"] },
    { concept: "Pediatric hypertension workup", ids: ["case-coarctation"] },
    { concept: "Coarctation pulse examination", ids: ["case-coarctation"] },
  ];
  return concepts.map((c) => {
    const relevant = state.attempts.filter((a) => c.ids.includes(a.caseId));
    if (relevant.length === 0) return { concept: c.concept, mastery: 0 };
    const avg =
      relevant
        .map((r) => {
          const s = r.scores ?? {};
          const keys = [
            "History",
            "Clinical Reasoning",
            "Test Selection",
            "Safety",
          ];
          const sum = keys.reduce((acc, k) => acc + (s[k] ?? 0), 0);
          return sum / keys.length;
        })
        .reduce((a, b) => a + b, 0) / relevant.length;
    return { concept: c.concept, mastery: Math.round(avg) };
  });
}

export function masteryLabel(m: number): "Developing" | "Competent" | "Mastered" | "—" {
  if (m === 0) return "—";
  if (m < 70) return "Developing";
  if (m < 88) return "Competent";
  return "Mastered";
}

/**
 * Feature reset — wipes all rotation progress (attempts, action logs, pager
 * reads, mastery). Uses memory.clear so the caller doesn't have to know keys.
 */
export function resetRotation() {
  memory.clear();
}