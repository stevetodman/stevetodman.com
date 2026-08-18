import assert from "node:assert/strict";
import test from "node:test";

import { compileOutpatientCaseGraph } from "../LegacyCore/src/lib/case-graph-authoring.ts";

function minimalAuthoring(overrides = {}) {
  return {
    caseId: "case-test",
    version: "1.0",
    roomTarget: "room-test",
    encounterTarget: "synthetic-patient",
    history: [{ key: "generic", acceptance: true }],
    examAcceptanceTargets: ["general"],
    orders: [{ id: "ecg", target: "ECG", reviewable: true, acceptance: true }],
    management: [{ id: "reassure", target: "Reassurance", acceptance: true }],
    safetyRules: [],
    counterfactuals: [],
    ...overrides,
  };
}

test("compiler emits the standard deterministic clinic loop", () => {
  const graph = compileOutpatientCaseGraph(minimalAuthoring());
  assert.equal(graph.nodes.length, 13);
  assert.equal(graph.startNodeId, "launch");
  assert.deepEqual(graph.terminalNodeIds, ["complete"]);
  assert.deepEqual(graph.nodes.find((node) => node.id === "history").acceptanceActions, ["history.generic"]);
});

test("compiler gives result review a deterministic order prerequisite", () => {
  const graph = compileOutpatientCaseGraph(minimalAuthoring());
  const review = graph.actions.find((action) => action.id === "review.ecg");
  assert.deepEqual(review.requiresAll, ["completed:order.ecg"]);
});

test("compiler gates confidential history behind a parent-step-out interview", () => {
  const graph = compileOutpatientCaseGraph(minimalAuthoring({
    history: [
      { key: "generic", acceptance: true },
      { key: "substance_use", confidential: true },
    ],
  }));
  const interview = graph.actions.find((entry) => entry.id === "history.confidential-interview");
  const substance = graph.actions.find((entry) => entry.id === "history.substance-use");
  const historyNode = graph.nodes.find((node) => node.id === "history");
  assert.equal(interview.eventType, "confidential_interview_started");
  assert.deepEqual(substance.requiresAll, ["completed:history.confidential-interview"]);
  assert.ok(historyNode.availableActions.includes("history.confidential-interview"));
  assert.ok(historyNode.acceptanceActions.includes("history.confidential-interview"));
});

test("compiler rejects duplicate authoring identifiers", () => {
  const config = minimalAuthoring({
    orders: [
      { id: "ecg", target: "ECG" },
      { id: "ecg", target: "Duplicate ECG" },
    ],
  });
  assert.throws(() => compileOutpatientCaseGraph(config), /orders contains duplicate ecg/);
});
