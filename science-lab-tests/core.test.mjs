import test from 'node:test';
import assert from 'node:assert/strict';
import { SCIENCE_LAB_CONFIG } from '../study/science-lab/config.mjs';
import { blankProfile, buildQueue, normalizeStore, skillStatus, validateCurriculum } from '../study/science-lab/core.mjs';

const NOW = Date.UTC(2026, 8, 3, 18, 0, 0);
const attempt = (skill, correct, date, extra = {}) => ({
  itemId: extra.itemId || `${skill}-${date}-${Math.random()}`,
  skill,
  unit: 'matter',
  standard: 'x',
  correct,
  provenance: extra.provenance || 'independent',
  delayedRetrieval: Boolean(extra.delayedRetrieval),
  transfer: Boolean(extra.transfer),
  date,
  at: extra.at || NOW,
  ...extra
});

function secureEvidence(skill, start = 0) {
  return [
    attempt(skill, true, '2026-09-01', { at: NOW - 3 * 86400000 + start }),
    attempt(skill, true, '2026-09-02', { delayedRetrieval: true, at: NOW - 2 * 86400000 + start }),
    attempt(skill, true, '2026-09-02', { transfer: true, at: NOW - 86400000 + start }),
    attempt(skill, true, '2026-09-03', { at: NOW - 1000 + start })
  ];
}

test('M1 evidence states require independent delayed transfer evidence', () => {
  const guidedOnly = { attempts: [
    attempt('particle-models', true, '2026-09-01', { provenance: 'guided' }),
    attempt('particle-models', true, '2026-09-02', { provenance: 'recovery' }),
    attempt('particle-models', true, '2026-09-03', { provenance: 'hinted', delayedRetrieval: true, transfer: true })
  ] };
  assert.equal(skillStatus(guidedOnly, 'particle-models').mastered, false);

  const profile = { attempts: secureEvidence('particle-models') };
  assert.equal(skillStatus(profile, 'particle-models').state, 'secure');

  profile.attempts.push(attempt('particle-models', false, '2026-09-03', { at: NOW + 1000 }));
  assert.equal(skillStatus(profile, 'particle-models').state, 'needs-repair');
  profile.attempts.push(attempt('particle-models', true, '2026-09-03', { provenance: 'recovery', at: NOW + 2000 }));
  assert.equal(skillStatus(profile, 'particle-models').state, 'repaired');
  assert.equal(skillStatus(profile, 'particle-models').mastered, false);
});

test('M1 queue allocates materially more practice to a weak Matter skill', () => {
  const profile = blankProfile();
  profile.attempts.push(
    attempt('particle-models', false, '2026-09-03', { itemId: 'pm1', at: NOW - 3000 }),
    attempt('particle-models', false, '2026-09-03', { itemId: 'pm2', at: NOW - 2000 }),
    ...secureEvidence('matter-conservation', 10),
    ...secureEvidence('material-properties', 20),
    ...secureEvidence('new-substances', 30)
  );
  profile.skills = {
    'particle-models': { dueAt: NOW - 1 },
    'matter-conservation': { dueAt: NOW + 7 * 86400000 },
    'material-properties': { dueAt: NOW + 7 * 86400000 },
    'new-substances': { dueAt: NOW + 7 * 86400000 }
  };

  const queue = buildQueue(SCIENCE_LAB_CONFIG, profile, { unitId: 'matter', now: NOW, random: () => 0.5 });
  const skills = queue.map(id => SCIENCE_LAB_CONFIG.items.find(item => item.id === id).skill);
  const weakCount = skills.filter(skill => skill === 'particle-models').length;
  const strongestOtherCount = Math.max(...['matter-conservation', 'material-properties', 'new-substances'].map(skill => skills.filter(value => value === skill).length));
  assert.ok(weakCount > strongestOtherCount, `expected weak skill to dominate queue: ${skills.join(', ')}`);
});

test('M1 avoids a sibling recent item and keeps the current unit bounded', () => {
  const luke = blankProfile();
  const samantha = blankProfile();
  samantha.attempts.push(attempt('particle-models', true, '2026-09-03', { itemId: 'pm1', at: NOW - 1000 }));
  const queue = buildQueue(SCIENCE_LAB_CONFIG, luke, { unitId: 'matter', now: NOW, random: () => 0.5, siblingProfile: samantha });
  assert.equal(queue.length, 8);
  assert.ok(queue.every(id => SCIENCE_LAB_CONFIG.items.find(item => item.id === id).unit === 'matter'));
  assert.equal(queue.includes('pm1'), false, 'recent sibling item should be skipped when equivalent forms exist');
});

test('M1 keeps twin stores separate and retains the full Louisiana science contract', () => {
  const root = normalizeStore({ version: 2, learners: { Luke: { attempts: [attempt('particle-models', true, '2026-09-03')] } } });
  assert.equal(root.learners.Luke.attempts.length, 1);
  assert.equal(root.learners.Samantha.attempts.length, 0);
  assert.equal(validateCurriculum(SCIENCE_LAB_CONFIG), true);
  assert.equal(SCIENCE_LAB_CONFIG.items.length, 48);
  assert.equal(new Set(SCIENCE_LAB_CONFIG.items.map(item => item.standard)).size, 16);
  assert.equal(SCIENCE_LAB_CONFIG.items.filter(item => item.unit === 'matter').length, 12);
});
