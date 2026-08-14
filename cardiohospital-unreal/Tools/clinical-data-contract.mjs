import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const SOURCE_FILES = Object.freeze([
  "cases-data.ts",
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
  requireKeys(failures, document, ["schemaVersion", "generatedAt", "sourceHashes", "cases", "metadata", "capstone", "specialtyCases"], ["schemaVersion", "generatedAt", "sourceHashes", "cases", "metadata", "capstone", "specialtyCases"], "document");
  if (!isObject(document)) return failures;

  addFailure(failures, document.schemaVersion === 1, "schemaVersion must be 1");
  addFailure(failures, document.generatedAt === "source-hash-derived", "generatedAt must remain reproducible");
  addFailure(failures, Array.isArray(document.cases) && document.cases.length === 7, "expected exactly seven outpatient cases");

  const ids = new Set();
  document.cases?.forEach((clinicalCase, index) => {
    validateCase(failures, clinicalCase, index);
    if (hasText(clinicalCase?.id)) {
      addFailure(failures, !ids.has(clinicalCase.id), `duplicate case id ${clinicalCase.id}`);
      ids.add(clinicalCase.id);
    }
  });

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
