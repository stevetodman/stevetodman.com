import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const SOURCE_FILES = Object.freeze([
  "cases-data.ts",
  "case-graphs.ts",
  "case-graph-authoring.ts",
  "case-concepts.ts",
  "case-metadata.ts",
  "capstone.ts",
  "cath-case.ts",
  "nicu-case.ts",
  "or-case.ts",
  "mri-case.ts",
]);

const CASE_KEYS = Object.freeze([
  "id",
  "patientName",
  "age",
  "sex",
  "chiefComplaint",
  "room",
  "vibe",
  "parentPresent",
  "allowConfidentialInterview",
  "correctDiagnosis",
  "differentials",
  "history",
  "exam",
  "ecg",
  "echo",
  "appropriateTests",
  "unnecessaryTests",
  "correctManagement",
  "redFlagKeys",
  "teachingPoint",
  "missedOpportunityTemplate",
  "attendingSocratic",
]);

const REQUIRED_CASE_KEYS = CASE_KEYS.filter((key) => key !== "allowConfidentialInterview");
const PENDING_REVIEWER = "Formal review pending";
const PENDING_REVIEW_DATE = "Not yet formally reviewed";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function addFailure(failures, condition, message) {
  if (!condition) failures.push(message);
}

function requireText(failures, value, path) {
  addFailure(failures, hasText(value), `${path} must be a non-empty string`);
}

function requireStringArray(failures, value, path, { allowEmpty = false } = {}) {
  addFailure(failures, Array.isArray(value), `${path} must be an array`);
  if (!Array.isArray(value)) return;
  addFailure(failures, allowEmpty || value.length > 0, `${path} must not be empty`);
  value.forEach((item, index) => requireText(failures, item, `${path}[${index}]`));
}

function requireKeys(failures, value, requiredKeys, allowedKeys, path) {
  addFailure(failures, isObject(value), `${path} must be an object`);
  if (!isObject(value)) return;

  for (const key of requiredKeys) {
    addFailure(failures, Object.hasOwn(value, key), `${path}.${key} is required`);
  }

  const unexpected = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  addFailure(
    failures,
    unexpected.length === 0,
    `${path} contains fields not represented by the Unreal contract: ${unexpected.join(", ")}`,
  );
}

function requireFiniteNumber(failures, value, path) {
  addFailure(failures, typeof value === "number" && Number.isFinite(value), `${path} must be a finite number`);
}

function validateVitals(failures, vitals, path) {
  requireKeys(failures, vitals, ["HR", "BP", "RR", "SpO2"], ["HR", "BP", "RR", "SpO2", "fourLimbBP"], path);
  if (!isObject(vitals)) return;
  requireFiniteNumber(failures, vitals.HR, `${path}.HR`);
  requireText(failures, vitals.BP, `${path}.BP`);
  requireFiniteNumber(failures, vitals.RR, `${path}.RR`);
  requireFiniteNumber(failures, vitals.SpO2, `${path}.SpO2`);
  addFailure(failures, vitals.SpO2 >= 0 && vitals.SpO2 <= 100, `${path}.SpO2 must be between 0 and 100`);

  if (vitals.fourLimbBP !== undefined) {
    requireKeys(failures, vitals.fourLimbBP, ["RA", "LA", "RL", "LL"], ["RA", "LA", "RL", "LL"], `${path}.fourLimbBP`);
    if (isObject(vitals.fourLimbBP)) {
      for (const key of ["RA", "LA", "RL", "LL"]) requireText(failures, vitals.fourLimbBP[key], `${path}.fourLimbBP.${key}`);
    }
  }
}

function validateCase(failures, clinicalCase, index) {
  const path = `cases[${index}]`;
  requireKeys(failures, clinicalCase, REQUIRED_CASE_KEYS, CASE_KEYS, path);
  if (!isObject(clinicalCase)) return;

  for (const key of ["id", "patientName", "sex", "chiefComplaint", "room", "vibe", "correctDiagnosis", "teachingPoint"]) {
    requireText(failures, clinicalCase[key], `${path}.${key}`);
  }
  requireFiniteNumber(failures, clinicalCase.age, `${path}.age`);
  addFailure(failures, clinicalCase.age > 0, `${path}.age must be greater than zero`);
  addFailure(failures, typeof clinicalCase.parentPresent === "boolean", `${path}.parentPresent must be boolean`);
  if (clinicalCase.allowConfidentialInterview !== undefined) {
    addFailure(
      failures,
      typeof clinicalCase.allowConfidentialInterview === "boolean",
      `${path}.allowConfidentialInterview must be boolean when present`,
    );
  }

  for (const key of ["differentials", "unnecessaryTests", "correctManagement", "attendingSocratic"]) {
    requireStringArray(failures, clinicalCase[key], `${path}.${key}`);
  }
  requireStringArray(failures, clinicalCase.appropriateTests, `${path}.appropriateTests`, { allowEmpty: true });
  requireStringArray(failures, clinicalCase.redFlagKeys, `${path}.redFlagKeys`, { allowEmpty: true });
  addFailure(
    failures,
    Array.isArray(clinicalCase.differentials) && clinicalCase.differentials.includes(clinicalCase.correctDiagnosis),
    `${path}.differentials must include the correct diagnosis`,
  );

  addFailure(failures, Array.isArray(clinicalCase.history) && clinicalCase.history.length > 0, `${path}.history must not be empty`);
  const historyKeys = new Set();
  if (Array.isArray(clinicalCase.history)) {
    clinicalCase.history.forEach((fact, factIndex) => {
      const factPath = `${path}.history[${factIndex}]`;
      requireKeys(failures, fact, ["key", "question", "answer"], ["key", "question", "answer", "redFlag", "confidential"], factPath);
      if (!isObject(fact)) return;
      for (const key of ["key", "question", "answer"]) requireText(failures, fact[key], `${factPath}.${key}`);
      addFailure(failures, !historyKeys.has(fact.key), `${path}.history contains duplicate key ${fact.key}`);
      historyKeys.add(fact.key);
      if (fact.redFlag !== undefined) addFailure(failures, typeof fact.redFlag === "boolean", `${factPath}.redFlag must be boolean`);
      if (fact.confidential !== undefined) addFailure(failures, typeof fact.confidential === "boolean", `${factPath}.confidential must be boolean`);
    });
  }

  if (Array.isArray(clinicalCase.redFlagKeys)) {
    for (const key of clinicalCase.redFlagKeys) {
      addFailure(failures, historyKeys.has(key), `${path}.redFlagKeys references missing history key ${key}`);
    }
  }

  addFailure(failures, isObject(clinicalCase.missedOpportunityTemplate), `${path}.missedOpportunityTemplate must be an object`);
  if (isObject(clinicalCase.missedOpportunityTemplate)) {
    for (const [key, message] of Object.entries(clinicalCase.missedOpportunityTemplate)) {
      addFailure(failures, historyKeys.has(key), `${path}.missedOpportunityTemplate references missing history key ${key}`);
      requireText(failures, message, `${path}.missedOpportunityTemplate.${key}`);
    }
  }

  requireKeys(failures, clinicalCase.exam, ["general", "vitals", "auscultation", "femoralPulses", "extras"], ["general", "vitals", "auscultation", "femoralPulses", "extras"], `${path}.exam`);
  if (isObject(clinicalCase.exam)) {
    requireText(failures, clinicalCase.exam.general, `${path}.exam.general`);
    requireText(failures, clinicalCase.exam.femoralPulses, `${path}.exam.femoralPulses`);
    requireStringArray(failures, clinicalCase.exam.extras, `${path}.exam.extras`, { allowEmpty: true });
    validateVitals(failures, clinicalCase.exam.vitals, `${path}.exam.vitals`);
    addFailure(failures, Array.isArray(clinicalCase.exam.auscultation) && clinicalCase.exam.auscultation.length > 0, `${path}.exam.auscultation must not be empty`);
    clinicalCase.exam.auscultation?.forEach((finding, findingIndex) => {
      const findingPath = `${path}.exam.auscultation[${findingIndex}]`;
      requireKeys(failures, finding, ["site", "description"], ["site", "description"], findingPath);
      if (isObject(finding)) {
        requireText(failures, finding.site, `${findingPath}.site`);
        requireText(failures, finding.description, `${findingPath}.description`);
      }
    });
  }

  requireKeys(failures, clinicalCase.ecg, ["rhythm", "rate", "intervals", "axis", "keyFindings", "pattern"], ["rhythm", "rate", "intervals", "axis", "keyFindings", "pattern"], `${path}.ecg`);
  if (isObject(clinicalCase.ecg)) {
    for (const key of ["rhythm", "axis", "pattern"]) requireText(failures, clinicalCase.ecg[key], `${path}.ecg.${key}`);
    requireFiniteNumber(failures, clinicalCase.ecg.rate, `${path}.ecg.rate`);
    requireStringArray(failures, clinicalCase.ecg.keyFindings, `${path}.ecg.keyFindings`, { allowEmpty: true });
    requireKeys(failures, clinicalCase.ecg.intervals, ["PR", "QRS", "QTc"], ["PR", "QRS", "QTc"], `${path}.ecg.intervals`);
    if (isObject(clinicalCase.ecg.intervals)) {
      for (const key of ["PR", "QRS", "QTc"]) requireText(failures, clinicalCase.ecg.intervals[key], `${path}.ecg.intervals.${key}`);
    }
  }

  requireKeys(failures, clinicalCase.echo, ["summary", "keyFindings", "anomaly"], ["summary", "keyFindings", "anomaly"], `${path}.echo`);
  if (isObject(clinicalCase.echo)) {
    requireText(failures, clinicalCase.echo.summary, `${path}.echo.summary`);
    requireText(failures, clinicalCase.echo.anomaly, `${path}.echo.anomaly`);
    requireStringArray(failures, clinicalCase.echo.keyFindings, `${path}.echo.keyFindings`, { allowEmpty: true });
  }
}

function validateMetadata(failures, metadata, caseIds) {
  addFailure(failures, isObject(metadata), "metadata must be an object");
  if (!isObject(metadata)) return;
  const metadataIds = Object.keys(metadata).sort();
  addFailure(failures, JSON.stringify(metadataIds) === JSON.stringify([...caseIds].sort()), "metadata keys must exactly match outpatient case ids");
  for (const [caseId, entry] of Object.entries(metadata)) {
    const path = `metadata.${caseId}`;
    requireKeys(failures, entry, ["author", "medicalReviewer", "version", "lastReviewed", "teachingObjectives", "sources"], ["author", "medicalReviewer", "version", "lastReviewed", "teachingObjectives", "sources"], path);
    if (!isObject(entry)) continue;
    for (const key of ["author", "medicalReviewer", "version", "lastReviewed"]) requireText(failures, entry[key], `${path}.${key}`);
    const reviewIsPending = entry.medicalReviewer === PENDING_REVIEWER;
    const reviewDateIsPending = entry.lastReviewed === PENDING_REVIEW_DATE;
    addFailure(
      failures,
      reviewIsPending === reviewDateIsPending,
      `${path} must mark both reviewer and review date pending, or neither`,
    );
    if (!reviewIsPending && hasText(entry.lastReviewed)) {
      addFailure(failures, /^\d{4}-(0[1-9]|1[0-2])$/.test(entry.lastReviewed), `${path}.lastReviewed must use YYYY-MM`);
    }
    requireStringArray(failures, entry.teachingObjectives, `${path}.teachingObjectives`);
    addFailure(failures, Array.isArray(entry.sources) && entry.sources.length > 0, `${path}.sources must not be empty`);
    entry.sources?.forEach((source, index) => {
      const sourcePath = `${path}.sources[${index}]`;
      requireKeys(failures, source, ["label", "citation"], ["label", "citation"], sourcePath);
      if (isObject(source)) {
        requireText(failures, source.label, `${sourcePath}.label`);
        requireText(failures, source.citation, `${sourcePath}.citation`);
      }
    });
  }
}

function validateCaseGraphs(failures, graphs, caseIds) {
  addFailure(failures, Array.isArray(graphs) && graphs.length > 0, "caseGraphs must contain at least one graph");
  if (!Array.isArray(graphs)) return;

  const graphCaseIds = new Set();
  graphs.forEach((graph, graphIndex) => {
    const path = `caseGraphs[${graphIndex}]`;
    requireKeys(
      failures,
      graph,
      ["caseId", "version", "startNodeId", "terminalNodeIds", "actions", "nodes", "safetyRules", "counterfactuals"],
      ["caseId", "version", "startNodeId", "terminalNodeIds", "actions", "nodes", "safetyRules", "counterfactuals"],
      path,
    );
    if (!isObject(graph)) return;
    requireText(failures, graph.caseId, `${path}.caseId`);
    requireText(failures, graph.version, `${path}.version`);
    requireText(failures, graph.startNodeId, `${path}.startNodeId`);
    addFailure(failures, caseIds.has(graph.caseId), `${path}.caseId references an unknown clinical case`);
    addFailure(failures, !graphCaseIds.has(graph.caseId), `${path}.caseId duplicates ${graph.caseId}`);
    graphCaseIds.add(graph.caseId);
    requireStringArray(failures, graph.terminalNodeIds, `${path}.terminalNodeIds`);

    addFailure(failures, Array.isArray(graph.actions) && graph.actions.length > 0, `${path}.actions must not be empty`);
    const actionIds = new Set();
    const knownEffects = new Set();
    graph.actions?.forEach((entry, actionIndex) => {
      const actionPath = `${path}.actions[${actionIndex}]`;
      requireKeys(failures, entry, ["id", "type", "target", "eventType", "requiresAll", "effects"], ["id", "type", "target", "eventType", "requiresAll", "effects"], actionPath);
      if (!isObject(entry)) return;
      for (const key of ["id", "type", "target", "eventType"]) requireText(failures, entry[key], `${actionPath}.${key}`);
      requireStringArray(failures, entry.requiresAll, `${actionPath}.requiresAll`, { allowEmpty: true });
      requireStringArray(failures, entry.effects, `${actionPath}.effects`);
      addFailure(failures, !actionIds.has(entry.id), `${path}.actions contains duplicate id ${entry.id}`);
      actionIds.add(entry.id);
      entry.effects?.forEach((effect) => knownEffects.add(effect));
    });
    graph.actions?.forEach((entry, actionIndex) => {
      for (const effect of entry.requiresAll ?? []) {
        addFailure(failures, knownEffects.has(effect), `${path}.actions[${actionIndex}] references unknown prerequisite effect ${effect}`);
      }
    });

    addFailure(failures, Array.isArray(graph.nodes) && graph.nodes.length > 0, `${path}.nodes must not be empty`);
    const nodeIds = new Set();
    graph.nodes?.forEach((node, nodeIndex) => {
      const nodePath = `${path}.nodes[${nodeIndex}]`;
      requireKeys(failures, node, ["id", "phase", "availableActions", "acceptanceActions", "transitions"], ["id", "phase", "availableActions", "acceptanceActions", "transitions"], nodePath);
      if (!isObject(node)) return;
      requireText(failures, node.id, `${nodePath}.id`);
      requireText(failures, node.phase, `${nodePath}.phase`);
      requireStringArray(failures, node.availableActions, `${nodePath}.availableActions`, { allowEmpty: true });
      requireStringArray(failures, node.acceptanceActions, `${nodePath}.acceptanceActions`, { allowEmpty: true });
      addFailure(failures, Array.isArray(node.transitions), `${nodePath}.transitions must be an array`);
      addFailure(failures, !nodeIds.has(node.id), `${path}.nodes contains duplicate id ${node.id}`);
      nodeIds.add(node.id);
      for (const actionId of [...(node.availableActions ?? []), ...(node.acceptanceActions ?? [])]) {
        addFailure(failures, actionIds.has(actionId), `${nodePath} references unknown action ${actionId}`);
      }
      node.transitions?.forEach((entry, transitionIndex) => {
        const transitionPath = `${nodePath}.transitions[${transitionIndex}]`;
        requireKeys(failures, entry, ["to", "allOf", "anyOf"], ["to", "allOf", "anyOf"], transitionPath);
        if (!isObject(entry)) return;
        requireText(failures, entry.to, `${transitionPath}.to`);
        requireStringArray(failures, entry.allOf, `${transitionPath}.allOf`, { allowEmpty: true });
        requireStringArray(failures, entry.anyOf, `${transitionPath}.anyOf`, { allowEmpty: true });
        for (const effect of [...(entry.allOf ?? []), ...(entry.anyOf ?? [])]) {
          addFailure(failures, knownEffects.has(effect), `${transitionPath} references unknown effect ${effect}`);
        }
      });
    });

    addFailure(failures, nodeIds.has(graph.startNodeId), `${path}.startNodeId references a missing node`);
    for (const terminalId of graph.terminalNodeIds ?? []) {
      addFailure(failures, nodeIds.has(terminalId), `${path}.terminalNodeIds references missing node ${terminalId}`);
    }
    for (const [nodeIndex, node] of (graph.nodes ?? []).entries()) {
      for (const transitionEntry of node.transitions ?? []) {
        addFailure(failures, nodeIds.has(transitionEntry.to), `${path}.nodes[${nodeIndex}] transition references missing node ${transitionEntry.to}`);
      }
      const terminal = graph.terminalNodeIds?.includes(node.id);
      addFailure(failures, terminal || node.transitions?.length > 0, `${path}.nodes[${nodeIndex}] is a non-terminal dead end`);
      addFailure(failures, !terminal || node.transitions?.length === 0, `${path}.nodes[${nodeIndex}] terminal node must not transition`);
    }

    const reachable = new Set();
    const pending = [graph.startNodeId];
    while (pending.length > 0) {
      const nodeId = pending.pop();
      if (reachable.has(nodeId)) continue;
      reachable.add(nodeId);
      const node = graph.nodes?.find((candidate) => candidate.id === nodeId);
      node?.transitions?.forEach((entry) => pending.push(entry.to));
    }
    for (const nodeId of nodeIds) addFailure(failures, reachable.has(nodeId), `${path}.nodes contains unreachable node ${nodeId}`);
    addFailure(
      failures,
      graph.terminalNodeIds?.some((terminalId) => reachable.has(terminalId)),
      `${path} cannot reach a terminal node from its start node`,
    );

    addFailure(failures, Array.isArray(graph.safetyRules), `${path}.safetyRules must be an array`);
    graph.safetyRules?.forEach((rule, ruleIndex) => {
      const rulePath = `${path}.safetyRules[${ruleIndex}]`;
      requireKeys(failures, rule, ["id", "severity", "requiredActions", "prohibitedActions", "message", "intervention"], ["id", "severity", "requiredActions", "prohibitedActions", "message", "intervention"], rulePath);
      if (!isObject(rule)) return;
      for (const key of ["id", "severity", "message", "intervention"]) requireText(failures, rule[key], `${rulePath}.${key}`);
      requireStringArray(failures, rule.requiredActions, `${rulePath}.requiredActions`, { allowEmpty: true });
      requireStringArray(failures, rule.prohibitedActions, `${rulePath}.prohibitedActions`, { allowEmpty: true });
      addFailure(failures, rule.requiredActions.length + rule.prohibitedActions.length > 0, `${rulePath} must define at least one action condition`);
      for (const actionId of [...(rule.requiredActions ?? []), ...(rule.prohibitedActions ?? [])]) {
        addFailure(failures, actionIds.has(actionId), `${rulePath} references unknown action ${actionId}`);
      }
    });

    addFailure(failures, Array.isArray(graph.counterfactuals), `${path}.counterfactuals must be an array`);
    graph.counterfactuals?.forEach((entry, entryIndex) => {
      const entryPath = `${path}.counterfactuals[${entryIndex}]`;
      requireKeys(failures, entry, ["id", "prompt", "alternateCaseId", "triggerMissingActions"], ["id", "prompt", "alternateCaseId", "triggerMissingActions"], entryPath);
      if (!isObject(entry)) return;
      for (const key of ["id", "prompt", "alternateCaseId"]) requireText(failures, entry[key], `${entryPath}.${key}`);
      requireStringArray(failures, entry.triggerMissingActions, `${entryPath}.triggerMissingActions`);
      addFailure(failures, caseIds.has(entry.alternateCaseId), `${entryPath}.alternateCaseId references an unknown clinical case`);
      for (const actionId of entry.triggerMissingActions ?? []) {
        addFailure(failures, actionIds.has(actionId), `${entryPath} references unknown action ${actionId}`);
      }
    });
  });

  addFailure(failures, graphCaseIds.has("case-hcm"), "caseGraphs must include the HCM vertical-slice case");
}

function validateSupplementalContent(failures, document) {
  requireKeys(failures, document.capstone, ["patients", "teaching"], ["patients", "teaching"], "capstone");
  if (isObject(document.capstone)) {
    requireText(failures, document.capstone.teaching, "capstone.teaching");
    addFailure(failures, Array.isArray(document.capstone.patients) && document.capstone.patients.length > 0, "capstone.patients must not be empty");
    const orders = new Set();
    document.capstone.patients?.forEach((patient, index) => {
      const path = `capstone.patients[${index}]`;
      requireKeys(failures, patient, ["id", "location", "label", "summary", "urgency", "correctOrder", "debrief"], ["id", "location", "label", "summary", "urgency", "correctFirst", "correctOrder", "debrief"], path);
      if (!isObject(patient)) return;
      for (const key of ["id", "location", "label", "summary", "urgency", "debrief"]) requireText(failures, patient[key], `${path}.${key}`);
      requireFiniteNumber(failures, patient.correctOrder, `${path}.correctOrder`);
      addFailure(failures, !orders.has(patient.correctOrder), `capstone.patients contains duplicate correctOrder ${patient.correctOrder}`);
      orders.add(patient.correctOrder);
      if (patient.correctFirst !== undefined) addFailure(failures, typeof patient.correctFirst === "boolean", `${path}.correctFirst must be boolean`);
    });
    addFailure(failures, document.capstone.patients?.filter((patient) => patient.correctFirst === true).length === 1, "capstone must have exactly one correctFirst patient");
  }

  requireKeys(failures, document.specialtyCases, ["cath", "nicu", "operatingRoom", "mri"], ["cath", "nicu", "operatingRoom", "mri"], "specialtyCases");
  if (!isObject(document.specialtyCases)) return;
  for (const key of ["cath", "nicu", "operatingRoom", "mri"]) {
    addFailure(failures, isObject(document.specialtyCases[key]), `specialtyCases.${key} must be an object`);
  }
  requireText(failures, document.specialtyCases.cath?.diagnosis, "specialtyCases.cath.diagnosis");
  addFailure(failures, Array.isArray(document.specialtyCases.cath?.pressures) && document.specialtyCases.cath.pressures.length > 0, "specialtyCases.cath.pressures must not be empty");
  addFailure(failures, Array.isArray(document.specialtyCases.nicu?.steps) && document.specialtyCases.nicu.steps.length > 0, "specialtyCases.nicu.steps must not be empty");
  requireText(failures, document.specialtyCases.nicu?.teaching, "specialtyCases.nicu.teaching");
  addFailure(failures, Array.isArray(document.specialtyCases.operatingRoom?.steps) && document.specialtyCases.operatingRoom.steps.length > 0, "specialtyCases.operatingRoom.steps must not be empty");
  addFailure(failures, Array.isArray(document.specialtyCases.mri?.slices) && document.specialtyCases.mri.slices.length > 0, "specialtyCases.mri.slices must not be empty");
  addFailure(failures, Array.isArray(document.specialtyCases.mri?.anatomyLabels) && document.specialtyCases.mri.anatomyLabels.length > 0, "specialtyCases.mri.anatomyLabels must not be empty");
}

function validateConcepts(failures, concepts, caseIds) {
  addFailure(failures, Array.isArray(concepts) && concepts.length > 0, "concepts must not be empty");
  if (!Array.isArray(concepts)) return;
  const ids = new Set();
  const validDimensions = new Set([
    "history",
    "physicalExamination",
    "redFlagRecognition",
    "testSelection",
    "interpretation",
    "clinicalReasoning",
    "management",
    "communication",
    "efficiency",
    "safety",
  ]);
  concepts.forEach((concept, index) => {
    const path = `concepts[${index}]`;
    requireKeys(failures, concept, ["id", "label", "caseIds", "dimensionIds"], ["id", "label", "caseIds", "dimensionIds"], path);
    if (!isObject(concept)) return;
    requireText(failures, concept.id, `${path}.id`);
    requireText(failures, concept.label, `${path}.label`);
    requireStringArray(failures, concept.caseIds, `${path}.caseIds`);
    requireStringArray(failures, concept.dimensionIds, `${path}.dimensionIds`);
    addFailure(failures, !ids.has(concept.id), `${path}.id duplicates ${concept.id}`);
    ids.add(concept.id);
    for (const caseId of concept.caseIds ?? []) addFailure(failures, caseIds.has(caseId), `${path}.caseIds references unknown case ${caseId}`);
    for (const dimensionId of concept.dimensionIds ?? []) addFailure(failures, validDimensions.has(dimensionId), `${path}.dimensionIds references unknown dimension ${dimensionId}`);
  });
}

export function normalizeSourceText(source) {
  return source.replace(/\r\n?/g, "\n");
}

export function sha256Text(source) {
  return createHash("sha256").update(normalizeSourceText(source), "utf8").digest("hex");
}

export async function computeSourceHashes(legacyRoot) {
  return Object.fromEntries(
    await Promise.all(
      SOURCE_FILES.map(async (name) => {
        const source = await readFile(resolve(legacyRoot, name), "utf8");
        return [name, sha256Text(source)];
      }),
    ),
  );
}

export function validateClinicalDocument(document, { expectedSourceHashes } = {}) {
  const failures = [];
  requireKeys(failures, document, ["schemaVersion", "generatedAt", "sourceHashes", "cases", "caseGraphs", "concepts", "metadata", "capstone", "specialtyCases"], ["schemaVersion", "generatedAt", "sourceHashes", "cases", "caseGraphs", "concepts", "metadata", "capstone", "specialtyCases"], "document");
  if (!isObject(document)) return failures;

  addFailure(failures, document.schemaVersion === 3, "schemaVersion must be 3");
  addFailure(failures, document.generatedAt === "source-hash-derived", "generatedAt must remain reproducible");
  addFailure(failures, Array.isArray(document.cases) && document.cases.length === 9, "expected exactly nine outpatient cases");

  const ids = new Set();
  document.cases?.forEach((clinicalCase, index) => {
    validateCase(failures, clinicalCase, index);
    if (hasText(clinicalCase?.id)) {
      addFailure(failures, !ids.has(clinicalCase.id), `duplicate case id ${clinicalCase.id}`);
      ids.add(clinicalCase.id);
    }
  });

  validateCaseGraphs(failures, document.caseGraphs, ids);
  validateConcepts(failures, document.concepts, ids);

  validateMetadata(failures, document.metadata, ids);
  validateSupplementalContent(failures, document);

  const hcm = document.cases?.find((item) => item.id === "case-hcm");
  addFailure(failures, hcm?.correctDiagnosis === "Hypertrophic Cardiomyopathy", "HCM immutable diagnosis changed");
  for (const key of ["exertional_timing", "family_sudden_death", "prodrome"]) {
    addFailure(failures, hcm?.redFlagKeys?.includes(key), `HCM immutable red flag ${key} is missing`);
  }

  addFailure(failures, isObject(document.sourceHashes), "sourceHashes must be an object");
  if (isObject(document.sourceHashes)) {
    const names = Object.keys(document.sourceHashes).sort();
    addFailure(failures, JSON.stringify(names) === JSON.stringify([...SOURCE_FILES].sort()), "sourceHashes keys must exactly match the exported source set");
    for (const name of SOURCE_FILES) {
      addFailure(failures, /^[a-f0-9]{64}$/.test(document.sourceHashes[name] ?? ""), `sourceHashes.${name} must be a SHA-256 digest`);
      if (expectedSourceHashes) {
        addFailure(failures, document.sourceHashes[name] === expectedSourceHashes[name], `sourceHashes.${name} does not match normalized source content`);
      }
    }
  }

  return failures;
}
