import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const contract = JSON.parse(fs.readFileSync(path.join(here, 'data-contract.json'), 'utf8'));
const forbiddenKeys = new Set(contract.privacy.forbidden_keys.map((key) => key.toLowerCase()));

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_RE = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/;
const EXACT_DATE_RE = /\b\d{4}-\d{2}-\d{2}\b/;
const RESEARCH_ID_RE = /^KDMSC-[A-Za-z0-9_-]{4,24}$/;
const SAFE_VERSION_RE = /^[A-Za-z0-9._-]{1,32}$/;
const SHA_RE = /^[0-9a-f]{40}$/i;
const EVIDENCE_ID_RE = /^[a-z0-9-]{1,80}$/;

function fail(message) {
  throw new Error(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function scanPrivacy(value, location = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanPrivacy(item, `${location}[${index}]`));
    return;
  }

  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenKeys.has(key.toLowerCase())) fail(`${location}.${key}: forbidden identifier/free-text key`);
      scanPrivacy(child, `${location}.${key}`);
    }
    return;
  }

  if (typeof value === 'string') {
    if (EMAIL_RE.test(value)) fail(`${location}: email-like value is not allowed`);
    if (PHONE_RE.test(value)) fail(`${location}: phone-like value is not allowed`);
    if (SSN_RE.test(value)) fail(`${location}: SSN-like value is not allowed`);
    if (EXACT_DATE_RE.test(value)) fail(`${location}: exact calendar dates are not allowed`);
  }
}

function requireExactKeys(object, required, location) {
  if (!isPlainObject(object)) fail(`${location}: expected an object`);
  const allowed = new Set(required);
  for (const key of required) {
    if (!(key in object)) fail(`${location}.${key}: required field missing`);
  }
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) fail(`${location}.${key}: field is not in the de-identified contract`);
  }
}

function requireEnum(value, allowed, location) {
  if (!allowed.includes(value)) fail(`${location}: expected one of ${allowed.join(', ')}`);
}

function validateCommon(record, location) {
  if (typeof record.research_case_id !== 'string' || !RESEARCH_ID_RE.test(record.research_case_id)) {
    fail(`${location}.research_case_id: use a random KDMSC- research ID, never an EHR-derived identifier`);
  }
  if (record.schema_version !== contract.schema_version) {
    fail(`${location}.schema_version: expected ${contract.schema_version}`);
  }
}

function validateExactEnumMap(value, definition, location) {
  const keys = Object.keys(definition);
  requireExactKeys(value, keys, location);
  for (const key of keys) requireEnum(value[key], definition[key], `${location}.${key}`);
}

function validateEvidenceIdArray(value, location) {
  if (!Array.isArray(value)) fail(`${location}: expected an array`);
  const seen = new Set();
  for (const [index, id] of value.entries()) {
    if (typeof id !== 'string' || !EVIDENCE_ID_RE.test(id)) fail(`${location}[${index}]: invalid evidence ID`);
    if (seen.has(id)) fail(`${location}: duplicate evidence ID ${id}`);
    seen.add(id);
  }
}

function validateRecord(mode, record, index) {
  const location = `$[${index}]`;
  const definition = contract.modes[mode];
  requireExactKeys(record, definition.required, location);
  scanPrivacy(record, location);
  validateCommon(record, location);

  for (const [key, allowed] of Object.entries(definition.enums || {})) {
    requireEnum(record[key], allowed, `${location}.${key}`);
  }

  if (mode === 'features') {
    if (typeof record.evidence_version !== 'string' || !SAFE_VERSION_RE.test(record.evidence_version)) {
      fail(`${location}.evidence_version: invalid version token`);
    }
    validateExactEnumMap(record.applicability_inputs, definition.applicability_inputs, `${location}.applicability_inputs`);
    validateExactEnumMap(record.evidence_inputs, definition.evidence_inputs, `${location}.evidence_inputs`);
    validateExactEnumMap(record.model_input_availability, definition.model_input_availability, `${location}.model_input_availability`);
  }

  if (mode === 'reference') {
    if (typeof record.adjudication_charter_version !== 'string' || !SAFE_VERSION_RE.test(record.adjudication_charter_version)) {
      fail(`${location}.adjudication_charter_version: use a short version token, not free text`);
    }
  }

  if (mode === 'output') {
    if (typeof record.evidence_version !== 'string' || !SAFE_VERSION_RE.test(record.evidence_version)) {
      fail(`${location}.evidence_version: invalid version token`);
    }
    if (typeof record.git_commit !== 'string' || !SHA_RE.test(record.git_commit)) {
      fail(`${location}.git_commit: expected the exact 40-character Git commit SHA`);
    }
    validateEvidenceIdArray(record.misc_evidence_ids, `${location}.misc_evidence_ids`);
    validateEvidenceIdArray(record.kd_evidence_ids, `${location}.kd_evidence_ids`);
    validateEvidenceIdArray(record.context_evidence_ids, `${location}.context_evidence_ids`);
    if (record.captured_without_care_change !== true) {
      fail(`${location}.captured_without_care_change: M3 requires true`);
    }
  }
}

function validateDataset(mode, records) {
  if (!contract.modes[mode]) fail(`unknown mode: ${mode}`);
  if (!Array.isArray(records)) fail(`${mode}: top-level JSON value must be an array`);
  if (records.length === 0) fail(`${mode}: dataset must contain at least one record`);

  const ids = new Set();
  records.forEach((record, index) => {
    validateRecord(mode, record, index);
    if (ids.has(record.research_case_id)) fail(`${mode}: duplicate research_case_id ${record.research_case_id}`);
    ids.add(record.research_case_id);
  });
  return records;
}

function readDataset(mode, filename) {
  const parsed = JSON.parse(fs.readFileSync(filename, 'utf8'));
  return validateDataset(mode, parsed);
}

function assertSameIdSet(leftName, leftRecords, rightName, rightRecords) {
  const left = new Set(leftRecords.map((record) => record.research_case_id));
  const right = new Set(rightRecords.map((record) => record.research_case_id));
  if (left.size !== right.size) fail(`${leftName}/${rightName}: research-case ID sets differ`);
  for (const id of left) if (!right.has(id)) fail(`${leftName}/${rightName}: missing research case ${id}`);
}

function crosscheck(featureFile, referenceFile, outputFile) {
  const features = readDataset('features', featureFile);
  const references = readDataset('reference', referenceFile);
  const outputs = readDataset('output', outputFile);
  assertSameIdSet('features', features, 'reference', references);
  assertSameIdSet('features', features, 'output', outputs);

  const outputById = new Map(outputs.map((record) => [record.research_case_id, record]));
  for (const feature of features) {
    const output = outputById.get(feature.research_case_id);
    if (feature.evidence_version !== output.evidence_version) {
      fail(`${feature.research_case_id}: feature/output evidence versions differ`);
    }
  }

  return features.length;
}

function usage() {
  console.error('Usage:');
  console.error('  node validate.mjs features <features.json>');
  console.error('  node validate.mjs reference <reference.json>');
  console.error('  node validate.mjs output <output.json>');
  console.error('  node validate.mjs crosscheck <features.json> <reference.json> <output.json>');
}

try {
  const [mode, ...files] = process.argv.slice(2);
  if (mode === 'crosscheck') {
    if (files.length !== 3) {
      usage();
      process.exitCode = 2;
    } else {
      const count = crosscheck(files[0], files[1], files[2]);
      console.log(`Crosscheck passed for ${count} de-identified research case(s).`);
    }
  } else if (contract.modes[mode]) {
    if (files.length !== 1) {
      usage();
      process.exitCode = 2;
    } else {
      const records = readDataset(mode, files[0]);
      console.log(`Validated ${records.length} ${mode} record(s).`);
    }
  } else {
    usage();
    process.exitCode = 2;
  }
} catch (error) {
  console.error(`Validation failed: ${error.message}`);
  process.exitCode = 1;
}
