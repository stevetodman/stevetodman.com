// Reusable authoring compiler for outpatient clinic encounters.
//
// Case authors provide clinical action configuration. This module emits the
// deterministic 13-node clinic loop consumed by both the portable simulator
// and UCardioCaseRuntimeSubsystem.

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

export interface HistoryActionAuthoring {
  key: string;
  acceptance?: boolean;
}

export interface OrderActionAuthoring {
  id: string;
  target: string;
  reviewable?: boolean;
  acceptance?: boolean;
}

export interface ManagementActionAuthoring {
  id: string;
  target: string;
  acceptance?: boolean;
}

export interface OutpatientCaseAuthoring {
  caseId: string;
  version: string;
  roomTarget: string;
  encounterTarget: string;
  history: HistoryActionAuthoring[];
  examAcceptanceTargets: string[];
  orders: OrderActionAuthoring[];
  management: ManagementActionAuthoring[];
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

const slug = (value: string): string => value.replaceAll("_", "-");
const historyActionId = (key: string): string => `history.${slug(key)}`;
const examActionId = (target: string): string => target === "femoralPulses" ? "exam.femoral-pulses" : `exam.${slug(target)}`;

function requireUnique(values: string[], label: string) {
  const duplicate = values.find((value, index) => values.indexOf(value) !== index);
  if (duplicate) throw new Error(`${label} contains duplicate ${duplicate}`);
}

function validateAuthoring(config: OutpatientCaseAuthoring) {
  if (!config.caseId.startsWith("case-")) throw new Error("caseId must start with case-");
  for (const [label, value] of [
    ["version", config.version],
    ["roomTarget", config.roomTarget],
    ["encounterTarget", config.encounterTarget],
  ]) {
    if (!value.trim()) throw new Error(`${label} must not be empty`);
  }
  if (config.history.length === 0) throw new Error("history must not be empty");
  if (config.management.length === 0) throw new Error("management must not be empty");
  requireUnique(config.history.map((entry) => entry.key), "history");
  requireUnique(config.orders.map((entry) => entry.id), "orders");
  requireUnique(config.management.map((entry) => entry.id), "management");
  requireUnique(config.safetyRules.map((entry) => entry.id), "safetyRules");
  requireUnique(config.counterfactuals.map((entry) => entry.id), "counterfactuals");
}

export function compileOutpatientCaseGraph(config: OutpatientCaseAuthoring): CaseGraphDefinition {
  validateAuthoring(config);

  const historyActions = config.history.map((entry) =>
    action(historyActionId(entry.key), "history", entry.key, "history_question"));
  const examTargets = ["general", "vitals", "auscultation", "femoralPulses"];
  const examActions = examTargets.map((target) => action(examActionId(target), "exam", target, "exam_performed"));
  const orderActions = config.orders.flatMap((entry) => {
    const orderId = `order.${entry.id}`;
    const definitions = [action(orderId, "order", entry.target, "test_ordered")];
    if (entry.reviewable) {
      definitions.push(action(`review.${entry.id}`, "review", entry.target, "test_interpreted", [`completed:${orderId}`]));
    }
    return definitions;
  });
  const managementActions = config.management.map((entry) =>
    action(`management.${entry.id}`, "management", entry.target, "management_action"));

  const actions: CaseActionDefinition[] = [
    action("system.load", "system", "application", "application_loaded"),
    action("world.enter", "navigation", "cardiology-unit", "world_entered"),
    action("navigate.workroom", "navigation", "cardiology-workroom", "location_entered"),
    action("attending.open-assignment", "conversation", "dr-patel", "attending_consulted"),
    action("assignment.accept", "conversation", config.caseId, "assignment_received", ["completed:attending.open-assignment"]),
    action("navigate.exam-room", "navigation", config.roomTarget, "location_entered"),
    action("encounter.introduce", "conversation", config.encounterTarget, "patient_encounter_started", ["completed:navigate.exam-room"]),
    ...historyActions,
    advance("history.finish", "history"),
    ...examActions,
    advance("exam.finish", "exam"),
    ...orderActions,
    advance("testing.finish", "testing"),
    action("navigate.return-workroom", "navigation", "cardiology-workroom", "location_entered"),
    action("reasoning.submit", "reasoning", "attending", "diagnosis_submitted"),
    advance("reasoning.finish", "reasoning"),
    ...managementActions,
    advance("management.finish", "management"),
    action("debrief.review", "debrief", "case-specific-feedback", "debrief_viewed"),
    action("performance.record", "debrief", "learner-attempt", "performance_recorded", ["completed:debrief.review"]),
    action("next-case.begin", "continuation", "contrastive-case", "next_case_started", ["completed:performance.record"]),
  ];

  return {
    caseId: config.caseId,
    version: config.version,
    startNodeId: "launch",
    terminalNodeIds: ["complete"],
    actions,
    nodes: [
      { id: "launch", phase: "load", availableActions: ["system.load"], acceptanceActions: ["system.load"], transitions: [transition("hospital-entry", "system.load")] },
      { id: "hospital-entry", phase: "world", availableActions: ["world.enter"], acceptanceActions: ["world.enter"], transitions: [transition("find-workroom", "world.enter")] },
      { id: "find-workroom", phase: "navigation", availableActions: ["navigate.workroom"], acceptanceActions: ["navigate.workroom"], transitions: [transition("assignment", "navigate.workroom")] },
      { id: "assignment", phase: "attending", availableActions: ["attending.open-assignment", "assignment.accept"], acceptanceActions: ["attending.open-assignment", "assignment.accept"], transitions: [transition("exam-room", "assignment.accept")] },
      { id: "exam-room", phase: "navigation", availableActions: ["navigate.exam-room", "encounter.introduce"], acceptanceActions: ["navigate.exam-room", "encounter.introduce"], transitions: [transition("history", "encounter.introduce")] },
      {
        id: "history",
        phase: "history",
        availableActions: [...config.history.map((entry) => historyActionId(entry.key)), "history.finish"],
        acceptanceActions: config.history.filter((entry) => entry.acceptance).map((entry) => historyActionId(entry.key)),
        transitions: [transition("examination", "history.finish")],
      },
      {
        id: "examination",
        phase: "exam",
        availableActions: [...examTargets.map(examActionId), "exam.finish"],
        acceptanceActions: config.examAcceptanceTargets.map(examActionId),
        transitions: [transition("testing", "exam.finish")],
      },
      {
        id: "testing",
        phase: "testing",
        availableActions: [...orderActions.map((entry) => entry.id), "testing.finish"],
        acceptanceActions: config.orders.filter((entry) => entry.acceptance).flatMap((entry) => [
          `order.${entry.id}`,
          ...(entry.reviewable ? [`review.${entry.id}`] : []),
        ]),
        transitions: [transition("attending-return", "testing.finish")],
      },
      { id: "attending-return", phase: "reasoning", availableActions: ["navigate.return-workroom", "reasoning.submit", "reasoning.finish"], acceptanceActions: ["navigate.return-workroom", "reasoning.submit"], transitions: [transition("management", "reasoning.finish")] },
      {
        id: "management",
        phase: "management",
        availableActions: [...config.management.map((entry) => `management.${entry.id}`), "management.finish"],
        acceptanceActions: config.management.filter((entry) => entry.acceptance).map((entry) => `management.${entry.id}`),
        transitions: [transition("debrief", "management.finish")],
      },
      { id: "debrief", phase: "debrief", availableActions: ["debrief.review", "performance.record"], acceptanceActions: ["debrief.review", "performance.record"], transitions: [transition("continuation", "performance.record")] },
      { id: "continuation", phase: "continuation", availableActions: ["next-case.begin"], acceptanceActions: ["next-case.begin"], transitions: [transition("complete", "next-case.begin")] },
      { id: "complete", phase: "complete", availableActions: [], acceptanceActions: [], transitions: [] },
    ],
    safetyRules: structuredClone(config.safetyRules),
    counterfactuals: structuredClone(config.counterfactuals),
  };
}
