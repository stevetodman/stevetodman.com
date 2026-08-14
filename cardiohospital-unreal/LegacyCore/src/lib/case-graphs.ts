// Deterministic encounter structure for the Unreal migration.
//
// Graphs describe progression and action availability only. Clinical findings,
// diagnoses, and results remain in cases-data.ts so presentation code and AI
// cannot silently invent or override patient truth.

export type CaseActionType =
  | "system"
  | "navigation"
  | "conversation"
  | "history"
  | "exam"
  | "order"
  | "review"
  | "reasoning"
  | "management"
  | "debrief"
  | "continuation";

export interface CaseActionDefinition {
  id: string;
  type: CaseActionType;
  target: string;
  eventType: string;
  requiresAll: string[];
  effects: string[];
}

export interface CaseTransitionDefinition {
  to: string;
  allOf: string[];
  anyOf: string[];
}

export interface CaseNodeDefinition {
  id: string;
  phase: string;
  availableActions: string[];
  acceptanceActions: string[];
  transitions: CaseTransitionDefinition[];
}

export interface SafetyRuleDefinition {
  id: string;
  severity: "critical" | "major";
  requiredActions: string[];
  prohibitedActions: string[];
  message: string;
  intervention: string;
}

export interface CounterfactualDefinition {
  id: string;
  prompt: string;
  alternateCaseId: string;
  triggerMissingActions: string[];
}

export interface CaseGraphDefinition {
  caseId: string;
  version: string;
  startNodeId: string;
  terminalNodeIds: string[];
  actions: CaseActionDefinition[];
  nodes: CaseNodeDefinition[];
  safetyRules: SafetyRuleDefinition[];
  counterfactuals: CounterfactualDefinition[];
}

const action = (
  id: string,
  type: CaseActionType,
  target: string,
  eventType: string,
  requiresAll: string[] = [],
): CaseActionDefinition => ({ id, type, target, eventType, requiresAll, effects: [`completed:${id}`] });

const advance = (id: string, target: string): CaseActionDefinition =>
  action(id, "system", target, "case_progressed");

const transition = (to: string, actionId: string): CaseTransitionDefinition => ({
  to,
  allOf: [`completed:${actionId}`],
  anyOf: [],
});

export const HCM_CASE_GRAPH: CaseGraphDefinition = {
  caseId: "case-hcm",
  version: "1.0",
  startNodeId: "launch",
  terminalNodeIds: ["complete"],
  actions: [
    action("system.load", "system", "application", "application_loaded"),
    action("world.enter", "navigation", "cardiology-unit", "world_entered"),
    action("navigate.workroom", "navigation", "cardiology-workroom", "location_entered"),
    action("attending.open-assignment", "conversation", "dr-patel", "attending_consulted"),
    action("assignment.accept", "conversation", "case-hcm", "assignment_received", ["completed:attending.open-assignment"]),
    action("navigate.exam-room", "navigation", "room-3", "location_entered"),
    action("encounter.introduce", "conversation", "marcus-and-parent", "patient_encounter_started", ["completed:navigate.exam-room"]),
    action("history.generic", "history", "generic", "history_question"),
    action("history.exertional-timing", "history", "exertional_timing", "history_question"),
    action("history.family-sudden-death", "history", "family_sudden_death", "history_question"),
    action("history.prodrome", "history", "prodrome", "history_question"),
    action("history.palpitations", "history", "palpitations", "history_question"),
    action("history.triggers", "history", "triggers", "history_question"),
    action("history.activity-level", "history", "activity_level", "history_question"),
    action("history.stimulant-use", "history", "stimulant_use", "history_question"),
    advance("history.finish", "history"),
    action("exam.general", "exam", "general", "exam_performed"),
    action("exam.vitals", "exam", "vitals", "exam_performed"),
    action("exam.auscultation", "exam", "auscultation", "exam_performed"),
    action("exam.femoral-pulses", "exam", "femoralPulses", "exam_performed"),
    advance("exam.finish", "exam"),
    action("order.ecg", "order", "ECG", "test_ordered"),
    action("review.ecg", "review", "ECG", "test_interpreted", ["completed:order.ecg"]),
    action("order.echo", "order", "Echocardiogram", "test_ordered"),
    action("review.echo", "review", "Echocardiogram", "test_interpreted", ["completed:order.echo"]),
    action("order.ct-angiography", "order", "CT angiography", "test_ordered"),
    action("order.troponin", "order", "Troponin", "test_ordered"),
    advance("testing.finish", "testing"),
    action("navigate.return-workroom", "navigation", "cardiology-workroom", "location_entered"),
    action("reasoning.submit", "reasoning", "attending", "diagnosis_submitted"),
    advance("reasoning.finish", "reasoning"),
    action("management.restrict-sports", "management", "Restrict from competitive sports immediately", "management_action"),
    action("management.ep-referral", "management", "Refer for electrophysiology / ICD evaluation", "management_action"),
    action("management.family-screening", "management", "Family screening (first-degree relatives)", "management_action"),
    action("management.genetics", "management", "Genetics consultation", "management_action"),
    action("management.clear-sports", "management", "Clear for competitive sports", "management_action"),
    action("management.reassure", "management", "Reassurance only", "management_action"),
    advance("management.finish", "management"),
    action("debrief.review", "debrief", "case-specific-feedback", "debrief_viewed"),
    action("performance.record", "debrief", "learner-attempt", "performance_recorded", ["completed:debrief.review"]),
    action("next-case.begin", "continuation", "contrastive-case", "next_case_started", ["completed:performance.record"]),
  ],
  nodes: [
    {
      id: "launch",
      phase: "load",
      availableActions: ["system.load"],
      acceptanceActions: ["system.load"],
      transitions: [transition("hospital-entry", "system.load")],
    },
    {
      id: "hospital-entry",
      phase: "world",
      availableActions: ["world.enter"],
      acceptanceActions: ["world.enter"],
      transitions: [transition("find-workroom", "world.enter")],
    },
    {
      id: "find-workroom",
      phase: "navigation",
      availableActions: ["navigate.workroom"],
      acceptanceActions: ["navigate.workroom"],
      transitions: [transition("assignment", "navigate.workroom")],
    },
    {
      id: "assignment",
      phase: "attending",
      availableActions: ["attending.open-assignment", "assignment.accept"],
      acceptanceActions: ["attending.open-assignment", "assignment.accept"],
      transitions: [transition("exam-room", "assignment.accept")],
    },
    {
      id: "exam-room",
      phase: "navigation",
      availableActions: ["navigate.exam-room", "encounter.introduce"],
      acceptanceActions: ["navigate.exam-room", "encounter.introduce"],
      transitions: [transition("history", "encounter.introduce")],
    },
    {
      id: "history",
      phase: "history",
      availableActions: [
        "history.generic",
        "history.exertional-timing",
        "history.family-sudden-death",
        "history.prodrome",
        "history.palpitations",
        "history.triggers",
        "history.activity-level",
        "history.stimulant-use",
        "history.finish",
      ],
      acceptanceActions: [
        "history.generic",
        "history.exertional-timing",
        "history.family-sudden-death",
        "history.prodrome",
      ],
      transitions: [transition("examination", "history.finish")],
    },
    {
      id: "examination",
      phase: "exam",
      availableActions: [
        "exam.general",
        "exam.vitals",
        "exam.auscultation",
        "exam.femoral-pulses",
        "exam.finish",
      ],
      acceptanceActions: ["exam.general", "exam.vitals", "exam.auscultation"],
      transitions: [transition("testing", "exam.finish")],
    },
    {
      id: "testing",
      phase: "testing",
      availableActions: [
        "order.ecg",
        "review.ecg",
        "order.echo",
        "review.echo",
        "order.ct-angiography",
        "order.troponin",
        "testing.finish",
      ],
      acceptanceActions: ["order.ecg", "review.ecg", "order.echo", "review.echo"],
      transitions: [transition("attending-return", "testing.finish")],
    },
    {
      id: "attending-return",
      phase: "reasoning",
      availableActions: ["navigate.return-workroom", "reasoning.submit", "reasoning.finish"],
      acceptanceActions: ["navigate.return-workroom", "reasoning.submit"],
      transitions: [transition("management", "reasoning.finish")],
    },
    {
      id: "management",
      phase: "management",
      availableActions: [
        "management.restrict-sports",
        "management.ep-referral",
        "management.family-screening",
        "management.genetics",
        "management.clear-sports",
        "management.reassure",
        "management.finish",
      ],
      acceptanceActions: ["management.restrict-sports"],
      transitions: [transition("debrief", "management.finish")],
    },
    {
      id: "debrief",
      phase: "debrief",
      availableActions: ["debrief.review", "performance.record"],
      acceptanceActions: ["debrief.review", "performance.record"],
      transitions: [transition("continuation", "performance.record")],
    },
    {
      id: "continuation",
      phase: "continuation",
      availableActions: ["next-case.begin"],
      acceptanceActions: ["next-case.begin"],
      transitions: [transition("complete", "next-case.begin")],
    },
    {
      id: "complete",
      phase: "complete",
      availableActions: [],
      acceptanceActions: [],
      transitions: [],
    },
  ],
  safetyRules: [
    {
      id: "hcm-exercise-restriction",
      severity: "critical",
      requiredActions: ["management.restrict-sports"],
      prohibitedActions: ["management.clear-sports"],
      message: "Exercise restriction was not established for a patient with exertional syncope and abnormal cardiac testing.",
      intervention: "The attending stops discharge and restricts competitive sports before the patient leaves.",
    },
  ],
  counterfactuals: [
    {
      id: "during-versus-after-exercise",
      prompt: "What if the episode had occurred after exercise with warmth, nausea, and tunnel vision instead of during a sprint without prodrome?",
      alternateCaseId: "case-vasovagal",
      triggerMissingActions: ["history.exertional-timing", "history.prodrome"],
    },
  ],
};

export const CASE_GRAPHS: CaseGraphDefinition[] = [HCM_CASE_GRAPH];
