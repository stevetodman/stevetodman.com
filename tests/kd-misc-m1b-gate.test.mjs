import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const extension = fs.readFileSync(path.join(root, 'tools/kd-misc-experimental/evidence-2026.js'), 'utf8');
const gate = fs.readFileSync(path.join(root, 'docs/KD_MISC_M1B_ACQUISITION_GATE.md'), 'utf8');
const mainExtraction = fs.readFileSync(path.join(root, 'docs/KD_MISC_M1B_MAIN_EXTRACTION.md'), 'utf8');
const supplement = fs.readFileSync(path.join(root, 'docs/KD_MISC_M1B_SUPPLEMENT_EXTRACTION.md'), 'utf8');
const ledger = fs.readFileSync(path.join(root, 'docs/KD_MISC_M1_SOURCE_LOCK.md'), 'utf8');

const doi = '10.1007/s00246-026-04444-4';
const mainHash = '6aca331b8bc11bf5290a4d8579b5be75c0f0c8b7c5f80b09b152df489677a4cf';
const supplementHash = 'af255b72826b87d708cfa82f54d36d5443007083f61eb306a20d27ef5bae92b5';

test('M1B main article and electronic supplement are fully source-locked', () => {
  assert.match(extension, /M1B_FULL_SOURCE_LOCK_COMPLETE/);
  assert.match(extension, /0\.4-m1b-complete/);
  assert.ok(extension.includes(doi));
  assert.match(extension, /main article and its electronic supplemental table are source-locked/i);
  assert.match(gate, /SOURCE-LOCKED COMPLETE/);
  assert.match(gate, /\*\*M1B is complete\.\*\*/i);
});

test('source hashes and supplement provenance are immutable in the ledgers', () => {
  assert.ok(gate.includes(mainHash));
  assert.ok(gate.includes(supplementHash));
  assert.ok(supplement.includes(supplementHash));
  assert.match(supplement, /Supplemental Table\. Comparison of Laboratory Features at Most Extreme/i);
  assert.match(gate, /source DOCX itself is \*\*not\*\* committed/i);
});

test('supplement extraction locks exact extrema without manufacturing cutoffs', () => {
  assert.match(supplement, /Highest WBC.*12\.8 \(9\.4, 17\.9\).*14\.2 \(11\.1, 19\.6\).*19\.9 \(15\.7, 24\.6\).*<\.01/i);
  assert.match(supplement, /Highest CRP.*139 \(68, 199\).*90 \(32, 153\).*112 \(60, 188\).*<\.01/i);
  assert.match(supplement, /Highest ferritin.*331 \(198, 588\).*182 \(97, 385\).*200 \(122, 374\).*<\.01/i);
  assert.match(supplement, /Highest ALT.*38 \(23, 67\).*26 \(16, 58\).*35 \(17, 71\).*<\.01/i);
  assert.match(supplement, /Lowest albumin.*29 \(24, 33\).*32 \(27, 37\).*29 \(25, 35\).*<\.01/i);
  assert.match(supplement, /highest creatinine.*43\.3 \(31\.4, 54\.8\).*28\.3 \(22\.0, 39\.8\).*26\.5 \(19\.4, 37\.1\).*<\.01/i);
  assert.match(supplement, /No threshold, point value, weight, score, probability, treatment recommendation, or disposition recommendation is created/i);
});

test('master ledger preserves source-specific clinical traps', () => {
  assert.match(ledger, /M1A \+ M1B COMPLETE/i);
  assert.match(ledger, /Coronary incorporation bias/i);
  assert.match(ledger, /Aggregate GI variable/i);
  assert.match(ledger, /Creatinine unit inconsistency/i);
  assert.match(ledger, /No new threshold is created from any median, IQR, extreme value, or omnibus P value/i);
  assert.match(mainExtraction, /What the final paper does \*not\* provide/i);
});

test('M1B remains an evidence organizer, not a diagnostic engine', () => {
  const source = `${extension}\n${gate}\n${supplement}\n${ledger}`;
  assert.match(source, /No home-grown score, weighted synthesis, or synthetic probability is permitted/i);
  assert.match(source, /does not manufacture a winner/i);
  assert.match(source, /No treatment or disposition recommendation is derived/i);
  assert.doesNotMatch(source, /KIDMATCH-like/i);
});
