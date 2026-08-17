const DIMENSION_ORDER = Object.freeze([
  "history",
  "physicalExamination",
  "redFlagRecognition",
  "differentialDiagnosis",
  "testSelection",
  "interpretation",
  "clinicalReasoning",
  "management",
  "communication",
  "efficiency",
  "safety",
]);

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function percentage(completed, expected) {
  if (expected.length === 0) return 100;
  return clampScore((completed.filter((item) => expected.includes(item)).length / expected.length) * 100);
}

function uniqueTargets(actionLog, type) {
  return [...new Set(actionLog.filter((event) => event.eventType === type).map((event) => event.target))];
}

function completedActionIds(actionLog) {
  return new Set(actionLog.map((event) => event.actionId));
}

function submittedDiagnosis(actionLog) {
  const submission = actionLog.findLast((event) => event.eventType === "diagnosis_submitted");
  return typeof submission?.payload?.diagnosis === "string" ? submission.payload.diagnosis : "";
}

function evaluateSafety(graph, completedActions) {
  return graph.safetyRules.flatMap((rule) => {
    const missing = rule.requiredActions.filter((actionId) => !completedActions.has(actionId));
    const prohibited = rule.prohibitedActions.filter((actionId) => completedActions.has(actionId));
    if (missing.length === 0 && prohibited.length === 0) return [];
    return [{
      id: rule.id,
      severity: rule.severity,
      message: rule.message,
      intervention: rule.intervention,
      missingActions: missing,
      prohibitedActions: prohibited,
    }];
  });
}

export function evaluateAttempt({ snapshot, graph, clinicalCase }) {
  if (snapshot.caseId !== graph.caseId || graph.caseId !== clinicalCase.id) {
    throw new Error("Attempt, graph, and clinical truth must identify the same case");
  }

  const completedActions = completedActionIds(snapshot.actionLog);
  const askedHistory = uniqueTargets(snapshot.actionLog, "history_question");
  const performedExam = uniqueTargets(snapshot.actionLog, "exam_performed");
  const orderedTests = uniqueTargets(snapshot.actionLog, "test_ordered");
  const interpretedTests = uniqueTargets(snapshot.actionLog, "test_interpreted");
  const managementActions = uniqueTargets(snapshot.actionLog, "management_action");
  const unnecessaryTests = orderedTests.filter((test) => clinicalCase.unnecessaryTests.includes(test));
  const expectedOrderedTests = clinicalCase.appropriateTests.filter((test) =>
    graph.actions.some((action) => action.type === "order" && action.target === test),
  );
  const expectedInterpretedTests = expectedOrderedTests.filter((test) =>
    graph.actions.some((action) => action.type === "review" && action.target === test),
  );
  const expectedExam = ["general", "vitals", "auscultation", "femoralPulses"].filter((target) =>
    graph.actions.some((action) => action.type === "exam" && action.target === target),
  );

  const historyScore = percentage(askedHistory, clinicalCase.history.map((fact) => fact.key));
  const physicalScore = percentage(performedExam, expectedExam);
  const redFlagScore = percentage(askedHistory, clinicalCase.redFlagKeys);
  const appropriateTestScore = percentage(orderedTests, expectedOrderedTests);
  const testSelectionScore = clampScore(appropriateTestScore - unnecessaryTests.length * 25);
  const interpretationScore = percentage(interpretedTests, expectedInterpretedTests);
  const diagnosisCorrect = submittedDiagnosis(snapshot.actionLog) === clinicalCase.correctDiagnosis;
  const diagnosis = submittedDiagnosis(snapshot.actionLog);
  const diagnosisOnAuthoredDifferential = Array.isArray(clinicalCase.differentials)
    && clinicalCase.differentials.includes(diagnosis);
  const differentialScore = !diagnosis || !diagnosisOnAuthoredDifferential
    ? 0
    : clampScore((diagnosisCorrect ? 60 : 30) + redFlagScore * 0.4);
  const reasoningScore = clampScore((diagnosisCorrect ? 70 : 0) + redFlagScore * 0.3);
  const managementScore = percentage(managementActions, clinicalCase.correctManagement);
  const communicationExpected = ["attending.open-assignment", "encounter.introduce", "reasoning.submit", "debrief.review"];
  const communicationScore = percentage([...completedActions], communicationExpected);
  const duplicateCount = snapshot.actionLog.length - new Set(snapshot.actionLog.map((event) => event.actionId)).size;
  const efficiencyScore = clampScore(100 - unnecessaryTests.length * 25 - duplicateCount * 5);
  const safetyEvents = evaluateSafety(graph, completedActions);
  const safetyScore = safetyEvents.length === 0 ? 100 : safetyEvents.some((event) => event.severity === "critical") ? 0 : 50;

  const scoreById = {
    history: historyScore,
    physicalExamination: physicalScore,
    redFlagRecognition: redFlagScore,
    differentialDiagnosis: differentialScore,
    testSelection: testSelectionScore,
    interpretation: interpretationScore,
    clinicalReasoning: reasoningScore,
    management: managementScore,
    communication: communicationScore,
    efficiency: efficiencyScore,
    safety: safetyScore,
  };
  const dimensions = DIMENSION_ORDER.map((id) => ({ id, score: scoreById[id] }));
  const overallScore = clampScore(dimensions.reduce((total, dimension) => total + dimension.score, 0) / dimensions.length);

  const missedOpportunities = clinicalCase.redFlagKeys.flatMap((key) => {
    if (askedHistory.includes(key)) return [];
    return [{ key, message: clinicalCase.missedOpportunityTemplate[key] ?? `You did not assess ${key}.` }];
  });
  const counterfactuals = graph.counterfactuals
    .filter((entry) => entry.triggerMissingActions.some((actionId) => !completedActions.has(actionId)))
    .map((entry) => ({ id: entry.id, prompt: entry.prompt, alternateCaseId: entry.alternateCaseId }));

  return {
    caseId: graph.caseId,
    caseVersion: graph.version,
    diagnosisSubmitted: submittedDiagnosis(snapshot.actionLog),
    diagnosisCorrect,
    overallScore,
    dimensions,
    missedOpportunities,
    unnecessaryTests,
    safetyEvents,
    counterfactuals,
    actionLog: structuredClone(snapshot.actionLog),
  };
}
