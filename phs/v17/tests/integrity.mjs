import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const phsRoot = path.join(repoRoot, 'phs');
const v17Root = path.join(phsRoot, 'v17');

const runtimeFiles = [
  'styles.css',
  'storage.js',
  'analytics.js',
  'engine-core.js',
  'engine-actions.js',
  'engine-assessment.js',
  'ui-core.js',
  'ui-debrief.js',
  'app.js'
];

const caseFiles = [
  'cases/manifest.json',
  'cases/patients/maya.json',
  'cases/patients/eli.json',
  'cases/patients/nora.json',
  'cases/patients/jamal.json'
];

const supportFiles = [
  'schema.json',
  'README.md',
  'RELEASE_NOTES.md',
  'EXPERT_REVIEW_PACKET.md'
];

function read(relativePath) {
  return fs.readFileSync(path.join(v17Root, relativePath), 'utf8');
}

function parseJson(relativePath) {
  const text = read(relativePath);
  assert.ok(text.trim().length > 0, `${relativePath} is empty`);
  return JSON.parse(text);
}

function unique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

for (const relativePath of [...runtimeFiles, ...caseFiles, ...supportFiles]) {
  const fullPath = path.join(v17Root, relativePath);
  assert.ok(fs.existsSync(fullPath), `Missing required file: phs/v17/${relativePath}`);
  assert.ok(fs.statSync(fullPath).size > 0, `Required file is empty: phs/v17/${relativePath}`);
}

const indexPath = path.join(phsRoot, 'index.html');
assert.ok(fs.existsSync(indexPath), 'Missing canonical entrypoint: phs/index.html');
const index = fs.readFileSync(indexPath, 'utf8');
assert.match(index, /HOSTED v1\.7/, 'Entrypoint does not identify v1.7');

const localReferences = [...index.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(match => match[1].split(/[?#]/)[0])
  .filter(reference => reference.startsWith('v17/'));

assert.ok(localReferences.length >= runtimeFiles.length, 'Entrypoint is missing v1.7 asset references');
for (const reference of localReferences) {
  assert.ok(fs.existsSync(path.join(phsRoot, reference)), `Entrypoint references missing file: phs/${reference}`);
}
for (const runtimeFile of runtimeFiles) {
  assert.ok(localReferences.includes(`v17/${runtimeFile}`), `Entrypoint does not load v17/${runtimeFile}`);
}

for (const script of runtimeFiles.filter(file => file.endsWith('.js'))) {
  assert.match(read(script), /['"]use strict['"];/, `${script} should use strict mode`);
}

const schema = parseJson('schema.json');
assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');

const manifest = parseJson('cases/manifest.json');
const patientIds = ['maya', 'eli', 'nora', 'jamal'];
const patients = Object.fromEntries(
  patientIds.map(id => [id, parseJson(`cases/patients/${id}.json`)])
);
const assembledCase = { ...manifest, patients };

for (const key of ['id', 'title', 'version', 'objectives', 'variants', 'patients', 'rubric', 'mastery']) {
  assert.ok(Object.hasOwn(assembledCase, key), `Assembled case is missing required field: ${key}`);
}
assert.equal(manifest.version, '1.7.0', 'Case version must match the v1.7 release');
assert.ok(manifest.objectives.length > 0, 'At least one learning objective is required');
assert.ok(manifest.variants.length > 1, 'At least two surface variants are required');

const objectiveIds = manifest.objectives.map(objective => objective.id);
const rubricIds = manifest.rubric.map(item => item.id);
unique(objectiveIds, 'Objective IDs');
unique(rubricIds, 'Rubric IDs');
unique(manifest.variants.map(variant => variant.id), 'Variant IDs');

for (const [patientId, patient] of Object.entries(patients)) {
  for (const key of ['name', 'age', 'room', 'correctRank', 'signout', 'initialVitals', 'correctDiagnosis', 'diagnosisChoices', 'history', 'exams', 'orders']) {
    assert.ok(Object.hasOwn(patient, key), `${patientId} is missing ${key}`);
  }
  assert.ok(Number.isFinite(patient.weightKg), `${patientId} must include a numeric weightKg`);
  unique(patient.exams.map(exam => exam.id), `${patientId} examination IDs`);
  unique(patient.orders.map(order => order.id), `${patientId} order IDs`);
}

const generatedResults = new Set(['nora:speciation']);
function assertPatient(patientId, context) {
  assert.ok(patientIds.includes(patientId), `${context} references unknown patient: ${patientId}`);
}
function assertOrder(patientId, orderId, context) {
  assertPatient(patientId, context);
  const exists = patients[patientId].orders.some(order => order.id === orderId);
  const generated = generatedResults.has(`${patientId}:${orderId}`);
  assert.ok(exists || generated, `${context} references unknown order/result: ${patientId}.${orderId}`);
}

for (const item of manifest.rubric) {
  assert.ok(objectiveIds.includes(item.objectiveId), `${item.id} references unknown objective ${item.objectiveId}`);
  assert.ok(item.points > 0, `${item.id} must have a positive point value`);
  assert.ok(item.rationale && item.consequence, `${item.id} requires a rationale and consequence`);
  const condition = item.condition || {};
  if (condition.patientId) assertPatient(condition.patientId, item.id);
  if (condition.type === 'orderCompleted' || condition.type === 'orderBeforeVariantThreshold' || condition.type === 'reassessmentAfterOrder' || condition.type === 'resultInterpreted') {
    assertOrder(condition.patientId, condition.orderId, item.id);
  }
  if (condition.type === 'bothOrdersCompleted' || condition.type === 'allResultsInterpreted') {
    for (const orderId of condition.orderIds || []) assertOrder(condition.patientId, orderId, item.id);
  }
  if (condition.type === 'orderBeforeOrWithin') {
    assertOrder(condition.patientId, condition.first, item.id);
    assertOrder(condition.patientId, condition.second, item.id);
  }
}

for (const criticalId of manifest.mastery.criticalItems || []) {
  assert.ok(rubricIds.includes(criticalId), `Mastery references unknown critical rubric item: ${criticalId}`);
}
for (const objectiveId of Object.keys(manifest.mastery.objectiveMinimums || {})) {
  assert.ok(objectiveIds.includes(objectiveId), `Mastery references unknown objective: ${objectiveId}`);
}
for (const remediation of manifest.remediation || []) {
  assert.ok(objectiveIds.includes(remediation.objectiveId), `Remediation references unknown objective: ${remediation.objectiveId}`);
}
for (const objectiveId of objectiveIds) {
  assert.ok((manifest.remediation || []).some(item => item.objectiveId === objectiveId), `No remediation is defined for ${objectiveId}`);
  assert.ok(manifest.rubric.some(item => item.objectiveId === objectiveId), `No rubric item assesses ${objectiveId}`);
}

assert.match(read('storage.js'), /phs\.v17\.learnerRecord/, 'Learner-record storage key is missing');
assert.match(read('engine-core.js'), /cases\/patients\/maya/, 'Case loader does not include the Maya patient file');
assert.match(read('engine-assessment.js'), /computeDiagnosticAnalytics/, 'Assessment engine does not invoke diagnostic analytics');
assert.match(read('ui-debrief.js'), /Objective-linked performance/, 'Structured objective-linked debrief is missing');

console.log(`PHS v1.7 integrity passed: ${runtimeFiles.length} runtime files, ${caseFiles.length} case files, ${manifest.objectives.length} objectives, ${manifest.rubric.length} rubric items, ${manifest.variants.length} variants.`);
