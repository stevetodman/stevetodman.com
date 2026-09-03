import test from 'node:test';
import assert from 'node:assert/strict';
import { SOCIAL_CONFIG, SOCIAL_ITEMS, SOCIAL_UNITS } from '../study/social-grade5-data.mjs';
import { validateCurriculum } from '../study/grade5-learning-core.mjs';

test('social studies curriculum passes structural validation', () => {
  assert.equal(validateCurriculum(SOCIAL_CONFIG), true);
});

test('all six official content standards and eight recurring practices appear', () => {
  const covered = new Set(SOCIAL_ITEMS.flatMap(item => [item.standard, ...(item.practices || [])]));
  for (const standard of ['5.1','5.2','5.3','5.4','5.5','5.6','5.7','5.8','5.9','5.10','5.11','5.12','5.13','5.14']) {
    assert.ok(covered.has(standard), `${standard} is not represented`);
  }
});

test('every Bayou Bridges unit has substantial practice and recovery forms', () => {
  assert.equal(SOCIAL_UNITS.length, 6);
  for (const unit of SOCIAL_UNITS) {
    const unitItems = SOCIAL_ITEMS.filter(item => item.unit === unit.id);
    assert.equal(unitItems.length, 12, `${unit.id} needs 12 tasks`);
    for (const skill of unit.skills) {
      assert.equal(unitItems.filter(item => item.skill === skill.id).length, 4, `${skill.id} needs four forms`);
    }
  }
  assert.equal(SOCIAL_ITEMS.length, 72);
});

test('historical thinking includes sources, chronology, data, and multi-answer synthesis', () => {
  assert.ok(SOCIAL_ITEMS.filter(item => item.stimulus?.text).length >= 9);
  assert.ok(SOCIAL_ITEMS.filter(item => item.stimulus?.timeline).length >= 4);
  assert.ok(SOCIAL_ITEMS.filter(item => item.stimulus?.table).length >= 4);
  assert.ok(SOCIAL_ITEMS.filter(item => item.type === 'multi').length >= 6);
  assert.ok(SOCIAL_ITEMS.filter(item => item.practices?.includes('5.2')).length >= 10);
  assert.ok(SOCIAL_ITEMS.filter(item => item.practices?.includes('5.5')).length >= 10);
});
