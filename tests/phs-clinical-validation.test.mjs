import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../phs/v17/clinical-validation.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../phs/v17/app.js', import.meta.url), 'utf8');

test('clinical validation layer is loaded after integrity remediation', () => {
  assert.match(app, /clinical-validation\.js/);
  assert.ok(app.indexOf('clinical-validation.js') > app.indexOf('integrity-assessment.js'));
});

test('PGE requires monitored vascular access', () => {
  assert.match(source, /orderId === 'pge' && !phsCompleted\('maya', 'monitoriv'\)/);
});

test('airway readiness does not prevent prostaglandin apnea', () => {
  assert.match(source, /special === 'pge-apnea-clinical'/);
  assert.match(source, /patient\.flags\.pgeApnea = true/);
  assert.doesNotMatch(source, /if \(!patient\.flags\.airwayReady\)\s*patient\.flags\.pgeApnea/);
});

test('positive-pressure ventilation is a distinct rescue action', () => {
  assert.match(source, /id: 'ventilation'/);
  assert.match(source, /order\.id === 'ventilation' && patient\.flags\.pgeApnea/);
});

test('unsafe negated interpretations are rejected', () => {
  assert.match(source, /phsDangerousNegation/);
  assert.match(source, /stop|discontinue|withhold|cancel|avoid/);
  assert.match(source, /result\.orderId === 'echo'/);
  assert.match(source, /\['speciation', 'lp'\]/);
});

test('Nora judgment and pending ownership require clinically valid content', () => {
  assert.match(source, /state\.noraJudgment\.value === 'likely pathogen'/);
  assert.match(source, /state\.noraJudgment\.value === 'indeterminate'/);
  assert.match(source, /phsHandoffFieldValid\(patientId, 'pending'/);
});

test('culture and antibiotic wording is sequence dependent', () => {
  assert.match(source, /Blood culture was collected after antibiotics had already started/);
  assert.match(source, /Parenteral antibiotics started before CSF collection/);
});

test('bronchiolitis low-value medication blocks mastery and HFNC requires reassessment', () => {
  assert.match(source, /lowValueBronchiolitisTreatment/);
  assert.match(source, /score\.mastery = false/);
  assert.match(source, /orderId === 'hfnc'/);
  assert.match(source, /documented reassessment/);
});

test('Nora includes inflammatory-marker risk stratification', () => {
  assert.match(source, /id: 'inflammatory'/);
  assert.match(source, /procalcitonin 1\.2 ng\/mL/);
});
