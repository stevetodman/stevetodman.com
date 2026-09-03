import test from 'node:test';
import assert from 'node:assert/strict';
import { SCIENCE_CONFIG, SCIENCE_ITEMS } from '../study/science-grade5-data.mjs';
import { validateCurriculum } from '../study/grade5-learning-core.mjs';

const REQUIRED = [
  '5-PS1-1', '5-PS1-2', '5-PS1-3', '5-PS1-4', '5-PS2-1', '5-PS3-1',
  '5-LS1-1', '5-LS2-1', '5-ESS1-1', '5-ESS1-2', '5-ESS2-1', '5-ESS2-2',
  '5-ESS3-1', '3-5-ETS1-1', '3-5-ETS1-2', '3-5-ETS1-3'
];

test('science curriculum passes structural validation', () => {
  assert.equal(validateCurriculum(SCIENCE_CONFIG), true);
});

test('all Louisiana Grade 5 science expectations have three alternate forms', () => {
  for (const standard of REQUIRED) {
    const matching = SCIENCE_ITEMS.filter(item => item.standard === standard);
    assert.ok(matching.length >= 3, `${standard} only has ${matching.length} tasks`);
  }
  assert.equal(SCIENCE_ITEMS.length, 48);
});

test('each skill can schedule a different recovery task', () => {
  const groups = SCIENCE_ITEMS.reduce((map, item) => {
    map.set(item.skill, [...(map.get(item.skill) || []), item]);
    return map;
  }, new Map());
  for (const [skill, matching] of groups) {
    assert.ok(matching.length >= 3, `${skill} lacks alternate task forms`);
    assert.equal(new Set(matching.map(item => item.prompt)).size, matching.length);
  }
});

test('science tasks include models, data, and multi-select reasoning', () => {
  assert.ok(SCIENCE_ITEMS.filter(item => item.stimulus?.table).length >= 7);
  assert.ok(SCIENCE_ITEMS.filter(item => item.stimulus?.flow).length >= 3);
  assert.ok(SCIENCE_ITEMS.filter(item => item.type === 'multi').length >= 7);
});

test('the current matter unit is complete', () => {
  const skillIds = SCIENCE_CONFIG.units.find(unit => unit.id === 'matter').skills.map(skill => skill.id);
  const matter = SCIENCE_ITEMS.filter(item => skillIds.includes(item.skill));
  assert.equal(matter.length, 12);
  for (const skill of skillIds) assert.equal(matter.filter(item => item.skill === skill).length, 3);
});
