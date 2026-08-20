import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const bankDir = path.join(repoRoot, 'myocarditis', 'question-bank');
const manifest = JSON.parse(fs.readFileSync(path.join(bankDir, 'manifest.json'), 'utf8'));
const sources = JSON.parse(fs.readFileSync(path.join(bankDir, manifest.sources_file), 'utf8'));
const stacks = manifest.stacks.map(({ file }) => JSON.parse(fs.readFileSync(path.join(bankDir, file), 'utf8')));
const questions = stacks.flatMap(stack => stack.questions);

function normalizedText(text) {
  return text.toLowerCase().replace(/\d+/g, '#').replace(/[^a-z#]+/g, ' ').trim();
}

describe('myocarditis question-bank manifest', () => {
  test('is explicitly non-production pending human review', () => {
    assert.equal(manifest.status, 'editorial-review-required');
    assert.match(manifest.version, /draft/i);
    assert.match(manifest.review.medical_review, /pending/i);
    assert.match(manifest.review.item_writer_review, /pending/i);
    assert.equal(manifest.review.psychometric_validation, 'not performed');
  });

  test('declares six 10-question core stacks and no retired padding stacks', () => {
    assert.equal(manifest.question_count, 60);
    assert.equal(manifest.stack_count, 6);
    assert.equal(manifest.stack_size, 10);
    assert.equal(manifest.stacks.length, 6);
    for (const retired of ['stack-07.json', 'stack-08.json', 'stack-09.json', 'stack-10.json']) {
      assert.equal(fs.existsSync(path.join(bankDir, retired)), false, `${retired} should be retired from the core bank`);
    }
  });
});

describe('question schema and integrity', () => {
  test('contains exactly 60 unique sequential question ids', () => {
    assert.equal(questions.length, 60);
    const ids = questions.map(q => q.id);
    assert.equal(new Set(ids).size, 60);
    assert.deepEqual(ids, Array.from({ length: 60 }, (_, i) => `MYO-${String(i + 1).padStart(3, '0')}`));
  });

  test('uses stable option ids rather than canonical answer letters', () => {
    for (const question of questions) {
      assert.equal('answer' in question, false, `${question.id} still has legacy answer field`);
      assert.ok(Array.isArray(question.options), `${question.id} options must be an array`);
      assert.equal(question.options.length, 5, `${question.id} must have five options`);
      const ids = question.options.map(option => option.id);
      assert.equal(new Set(ids).size, 5, `${question.id} option ids must be unique`);
      assert.ok(ids.includes(question.correct_option_id), `${question.id} correct_option_id must resolve`);
      assert.deepEqual(Object.keys(question.option_explanations).sort(), [...ids].sort(), `${question.id} explanations must cover every option exactly once`);
    }
  });

  test('requires substantive editorial and evidence metadata', () => {
    const required = ['status', 'age', 'age_group', 'domain', 'concept', 'learning_objective', 'cognitive_level', 'difficulty', 'stem', 'rationale', 'board_pearl', 'evidence', 'requires_sme_review', 'last_medical_review'];
    for (const question of questions) {
      for (const field of required) assert.ok(field in question, `${question.id} missing ${field}`);
      assert.equal(question.status, 'draft-medical-review', `${question.id} should remain in medical review`);
      assert.equal(question.requires_sme_review, true, `${question.id} must remain SME-gated`);
      assert.equal(question.last_medical_review, null, `${question.id} must not claim completed medical review`);
      assert.ok(question.learning_objective.length >= 30, `${question.id} learning objective is too thin`);
      assert.ok(question.rationale.length >= 100, `${question.id} rationale is too thin`);
      assert.ok(question.board_pearl.length >= 25, `${question.id} board pearl is too thin`);
      for (const option of question.options) assert.ok(option.text.length >= 12, `${question.id}/${option.id} option is too thin`);
      for (const [id, explanation] of Object.entries(question.option_explanations)) {
        assert.ok(explanation.length >= 50, `${question.id}/${id} option explanation is too thin`);
      }
    }
  });

  test('resolves every evidence claim to the source registry', () => {
    for (const question of questions) {
      assert.ok(question.evidence.length >= 1, `${question.id} has no evidence mapping`);
      for (const item of question.evidence) {
        assert.ok(item.claim && item.claim.length >= 20, `${question.id} has an underspecified evidence claim`);
        assert.ok(sources[item.source_id], `${question.id} references unknown source ${item.source_id}`);
        assert.doesNotMatch(item.source_id, /PLACEHOLDER|REVIEW_2025$/i, `${question.id} uses a placeholder-style source id ${item.source_id}`);
      }
    }
  });
});

describe('item-writing quality gates', () => {
  test('has no exact or superficial digit-only duplicate stems', () => {
    const seen = new Map();
    for (const question of questions) {
      const key = normalizedText(question.stem);
      assert.equal(seen.has(key), false, `${question.id} duplicates ${seen.get(key)}`);
      seen.set(key, question.id);
    }
  });

  test('has unique normalized learning objectives', () => {
    const seen = new Map();
    for (const question of questions) {
      const key = normalizedText(question.learning_objective);
      assert.equal(seen.has(key), false, `${question.id} repeats learning objective from ${seen.get(key)}`);
      seen.set(key, question.id);
    }
  });

  test('does not use the prior throwaway-distractor vocabulary', () => {
    const banned = /\b(EEG|bone scan|hair growth|dental examination|cerumen|colonoscopy|skin-prick allergy|weekly vision)\b/i;
    for (const question of questions) {
      for (const option of question.options) assert.doesNotMatch(option.text, banned, `${question.id}/${option.id} contains a throwaway distractor`);
    }
  });

  test('keeps advanced ECMO venting mechanics out of the core learner targets', () => {
    const coreText = questions.map(question => `${question.concept} ${question.learning_objective} ${question.stem}`).join('\n');
    assert.doesNotMatch(coreText, /left[- ]heart decompression|LV unloading|aortic valve opening on VA-ECMO/i);
  });

  test('keeps difficulty mix in the intended ABP-style range', () => {
    const counts = { 1: 0, 2: 0, 3: 0 };
    for (const question of questions) {
      assert.ok([1, 2, 3].includes(question.difficulty), `${question.id} has invalid difficulty ${question.difficulty}`);
      counts[question.difficulty] += 1;
    }
    const pct = level => counts[level] / questions.length * 100;
    assert.ok(pct(1) >= 10 && pct(1) <= 20, `Level 1 mix ${pct(1)}% outside tolerance`);
    assert.ok(pct(2) >= 55 && pct(2) <= 75, `Level 2 mix ${pct(2)}% outside tolerance`);
    assert.ok(pct(3) >= 15 && pct(3) <= 30, `Level 3 mix ${pct(3)}% outside tolerance`);
  });

  test('prevents legacy answer-position bias by construction', () => {
    for (const question of questions) {
      assert.ok(!/^[A-E]$/.test(question.correct_option_id), `${question.id} stores a display letter as the answer`);
      for (const option of question.options) assert.ok(!/^[A-E]$/.test(option.id), `${question.id} stores canonical display letters as option ids`);
    }
  });
});

describe('source registry quality', () => {
  test('tracks provenance, population, jurisdiction, evidence role, and verification state for every source', () => {
    for (const [id, source] of Object.entries(sources)) {
      assert.ok(source.title, `${id} missing title`);
      assert.ok(source.year, `${id} missing publication year`);
      assert.ok(source.source_type, `${id} missing source_type`);
      assert.ok(source.population, `${id} missing population scope`);
      assert.ok(source.jurisdiction, `${id} missing jurisdiction`);
      assert.ok(['primary', 'overlay'].includes(source.primary_or_overlay), `${id} missing primary_or_overlay classification`);
      assert.ok(source.role, `${id} missing role`);
      assert.equal(source.last_verified, '2026-08-20', `${id} verification date is stale or absent`);
    }
  });

  test('labels adult/general evidence overlays explicitly', () => {
    assert.equal(sources.ACC_MYOCARDITIS_2024.population, 'adult');
    assert.equal(sources.ACC_MYOCARDITIS_2024.primary_or_overlay, 'overlay');
    assert.equal(sources.AHA_LV_THROMBUS_2022.primary_or_overlay, 'overlay');
    assert.match(sources.AHA_LV_THROMBUS_2022.population, /adult|general/i);
  });

  test('includes current US sports and pediatric genetics anchors', () => {
    assert.equal(sources.AHA_ACC_SPORTS_2025.year, 2025);
    assert.equal(sources.AHA_ACC_SPORTS_2025.jurisdiction, 'United States');
    assert.equal(sources.PED_MYO_GENETICS_2021.population, 'pediatric biopsy-proven myocarditis');
    assert.match(sources.PED_MYO_GENETICS_2026.population, /pediatric/i);
    assert.match(sources.PED_MYO_VIRAL_PCR_2022.title, /innocent bystander/i);
  });
});
