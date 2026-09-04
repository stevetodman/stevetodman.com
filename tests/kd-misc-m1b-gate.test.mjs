import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const extension = fs.readFileSync(path.join(root, 'tools/kd-misc-experimental/evidence-2026.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'tools/kd-misc-experimental/index.html'), 'utf8');
const gate = fs.readFileSync(path.join(root, 'docs/KD_MISC_M1B_ACQUISITION_GATE.md'), 'utf8');
const extraction = fs.readFileSync(path.join(root, 'docs/KD_MISC_M1B_MAIN_EXTRACTION.md'), 'utf8');
const ledger = fs.readFileSync(path.join(root, 'docs/KD_MISC_M1_SOURCE_LOCK.md'), 'utf8');

const targetTitle = 'Incomplete Kawasaki Disease Versus Non-severe Multisystem Inflammatory Syndrome in Children: Distinguishing Features from Contemporaneous Patients';
const fileId = 's00246-026-04444-4';
const doi = '10.1007/s00246-026-04444-4';
const sha256 = '6aca331b8bc11bf5290a4d8579b5be75c0f0c8b7c5f80b09b152df489677a4cf';

test('M1B final main article is verified while the electronic supplement remains blocked', () => {
  assert.match(extension, /M1B_MAIN_ARTICLE_SOURCE_LOCKED_SUPPLEMENT_PENDING/);
  assert.ok(extension.includes(targetTitle));
  assert.ok(extension.includes(fileId));
  assert.ok(extension.includes(doi));
  assert.match(extension, /electronic supplemental table remains pending/i);
  assert.match(extension, /no supplement-only value, new continuous cutoff, model coefficient, or synthetic probability is encoded/i);
  assert.match(html, /M1B MAIN ARTICLE SOURCE-LOCKED/i);
  assert.match(html, /electronic supplemental table remains pending/i);
});

test('the acquisition ledger records the final DOI and immutable local source hash', () => {
  assert.match(gate, /MAIN ARTICLE SOURCE-LOCKED; SUPPLEMENT PENDING/);
  assert.ok(gate.includes(targetTitle));
  assert.ok(gate.includes(fileId));
  assert.ok(gate.includes(doi));
  assert.ok(gate.includes(sha256));
  assert.match(gate, /copyrighted PDF itself is \*\*not\*\* committed/i);
  assert.match(gate, /40 centers in 8 countries/i);
  assert.match(gate, /non-severe MIS-C: `n=769`/i);
  assert.match(gate, /unconfirmed incomplete KD: `n=372`/i);
  assert.match(gate, /confirmed incomplete KD: `n=146`/i);
});

test('page-table extraction locks the final article without manufacturing cutoffs or a model', () => {
  for (const required of [
    'Table 2 — clinical features',
    'Table 3 — laboratory features at presentation',
    'Table 5 — cardiac complications',
    'Creatinine unit inconsistency',
    'Coronary incorporation bias',
    'What the final paper does *not* provide',
  ]) {
    assert.ok(extraction.includes(required), `missing extraction section: ${required}`);
  }
  assert.match(extraction, /Abdominal pain \| 64% \| 19% \| 25% \| <\.01/i);
  assert.match(extraction, /CAA Z≥2\.5 \| 11% \| 8% \| 41% \| <\.01/i);
  assert.match(extraction, /does not publish:[\s\S]*multivariable diagnostic model/i);
  assert.match(extraction, /must not manufacture any of those outputs/i);
});

test('master ledger keeps bedside integration conservative', () => {
  assert.match(ledger, /M1B final main article source-locked; electronic supplement pending/i);
  assert.match(ledger, /All P values above are published three-group comparisons/i);
  assert.match(ledger, /not.*transformed into weights or patient-level probabilities/i);
  assert.match(ledger, /Aggregate GI variable — do not silently redefine/i);
  assert.match(ledger, /apparent creatinine-unit inconsistency/i);
  assert.match(ledger, /Any supplement-only peak\/trough value until the actual electronic supplement is obtained/i);
});

test('M1B continues to forbid synthetic scoring and actionable management', () => {
  const source = `${extension}\n${gate}\n${extraction}\n${ledger}`;
  assert.match(source, /No home-grown score or synthetic probability is permitted/i);
  assert.match(source, /does not manufacture a winner/i);
  assert.match(source, /No treatment or disposition recommendation is derived/i);
  assert.doesNotMatch(source, /KIDMATCH-like/i);
});
