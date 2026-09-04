import test from 'node:test';
import assert from 'node:assert/strict';
import { SCIENCE_LAB_CONFIG } from '../study/science-lab/config.mjs';
import { blankProfile, buildQueue, normalizeStore, remediationForSelection, skillStatus, validateCurriculum } from '../study/science-lab/core.mjs';
import { graphBuildComplete, graphBuildCorrect } from '../study/science-lab/visuals.mjs';
import { nextPhenomenon, validatePhenomena } from '../study/science-lab/phenomenon-engine.mjs';
import { scoreCer, validateCer } from '../study/science-lab/cer.mjs';

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

test('M1/M2 evidence states keep hinted repair distinct from independent mastery', () => {
  const guidedOnly = { attempts: [
    attempt('particle-models', true, '2026-09-01', { provenance: 'guided' }),
    attempt('particle-models', true, '2026-09-02', { provenance: 'recovery' }),
    attempt('particle-models', true, '2026-09-03', { provenance: 'hinted', misconceptionTag: 'dissolved-means-destroyed', delayedRetrieval: true, transfer: true })
  ] };
  assert.equal(skillStatus(guidedOnly, 'particle-models').mastered, false);

  const pm1 = SCIENCE_LAB_CONFIG.items.find(item => item.id === 'pm1');
  const destroyed = remediationForSelection(pm1, [0]);
  const energy = remediationForSelection(pm1, [2]);
  assert.equal(destroyed.tag, 'dissolved-means-destroyed');
  assert.equal(energy.tag, 'matter-becomes-energy');
  assert.notEqual(destroyed.hint, energy.hint);

  const profile = { attempts: secureEvidence('particle-models') };
  assert.equal(skillStatus(profile, 'particle-models').state, 'secure');

  profile.attempts.push(attempt('particle-models', false, '2026-09-03', { misconceptionTag: destroyed.tag, at: NOW + 1000 }));
  assert.equal(skillStatus(profile, 'particle-models').state, 'needs-repair');
  profile.attempts.push(attempt('particle-models', true, '2026-09-03', { provenance: 'hinted', misconceptionTag: destroyed.tag, repairTarget: destroyed.tag, at: NOW + 2000 }));
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

test('M1-M7 keeps curriculum, remediation, representations, phenomena, CER, Matter, and Earth/Sky coherent', () => {
  const root = normalizeStore({ version: 2, learners: { Luke: { attempts: [attempt('particle-models', true, '2026-09-03', { misconceptionTag: 'example-tag' })] } } });
  assert.equal(root.learners.Luke.attempts.length, 1);
  assert.equal(root.learners.Luke.attempts[0].misconceptionTag, 'example-tag');
  assert.equal(root.learners.Samantha.attempts.length, 0);
  assert.equal(validateCurriculum(SCIENCE_LAB_CONFIG), true);
  assert.equal(SCIENCE_LAB_CONFIG.items.length, 83);
  assert.equal(new Set(SCIENCE_LAB_CONFIG.items.map(item => item.standard)).size, 16);

  const strictUnitChecks = [
    {
      unit: 'matter',
      skills: ['particle-models', 'matter-conservation', 'material-properties', 'new-substances'],
      standards: ['5-PS1-1', '5-PS1-2', '5-PS1-3', '5-PS1-4'],
      prefix: 'matter:'
    },
    {
      unit: 'earth-sky',
      skills: ['gravity', 'star-distance', 'sky-patterns'],
      standards: ['5-PS2-1', '5-ESS1-1', '5-ESS1-2'],
      prefix: 'earth-sky:'
    }
  ];

  for (const contract of strictUnitChecks) {
    const unitItems = SCIENCE_LAB_CONFIG.items.filter(item => item.unit === contract.unit);
    assert.equal(unitItems.length, contract.skills.length * 8, `${contract.unit} should have exactly 8 contexts per skill at this milestone`);
    for (const skill of contract.skills) {
      const forms = unitItems.filter(item => item.skill === skill);
      assert.ok(forms.length >= 8, `${skill} needs at least 8 contexts`);
      assert.ok(new Set(forms.map(item => item.sourceFamily)).size >= 8, `${skill} contexts must be meaningfully distinct`);
      assert.ok(forms.some(item => item.transferLevel === 'far' && item.transfer === true), `${skill} needs a genuine far-transfer task`);
    }
    for (const item of unitItems) {
      assert.ok(item.sep, `${item.id} needs SEP metadata`);
      assert.ok(item.ccc, `${item.id} needs CCC metadata`);
      assert.ok(item.representationType, `${item.id} needs representation metadata`);
      assert.ok(item.transferLevel, `${item.id} needs transfer metadata`);
      assert.ok(item.sourceFamily?.startsWith(contract.prefix), `${item.id} needs a ${contract.unit} context family`);
      assert.equal(item.transfer, item.transferLevel === 'far', `${item.id} only far-transfer evidence should qualify for mastery transfer credit`);
      if (!Array.isArray(item.choices)) continue;
      const answers = new Set(Array.isArray(item.answer) ? item.answer : [item.answer]);
      for (let index = 0; index < item.choices.length; index += 1) {
        if (!answers.has(index)) {
          assert.ok(item.remediation?.[index]?.tag, `${item.id} distractor ${index} needs a misconception tag`);
          assert.ok(item.remediation?.[index]?.hint, `${item.id} distractor ${index} needs a hint`);
        }
      }
    }
    for (const standard of contract.standards) {
      const representations = new Set(unitItems.filter(item => item.standard === standard).map(item => item.representationType));
      assert.ok(representations.size >= 3, `${standard} needs representation diversity`);
    }
  }

  const sp2 = SCIENCE_LAB_CONFIG.items.find(item => item.id === 'sp2');
  assert.equal(sp2.responseType, 'graph-build');
  assert.equal(sp2.transfer, false, 'Earth/Sky graph practice should not receive transfer credit unless explicitly far transfer');
  assert.equal(graphBuildComplete(sp2.graphBuild, { 0: 8, 1: 6, 2: 4, 3: 6 }), true);
  assert.equal(graphBuildCorrect(sp2.graphBuild, { 0: 8, 1: 6, 2: 4, 3: 6 }), true);
  assert.equal(graphBuildCorrect(sp2.graphBuild, { 0: 6, 1: 6, 2: 4, 3: 6 }), false);

  const sp3 = SCIENCE_LAB_CONFIG.items.find(item => item.id === 'sp3');
  const g3 = SCIENCE_LAB_CONFIG.items.find(item => item.id === 'g3');
  const sd6 = SCIENCE_LAB_CONFIG.items.find(item => item.id === 'sd6');
  const sd8 = SCIENCE_LAB_CONFIG.items.find(item => item.id === 'sd8');
  const pm3 = SCIENCE_LAB_CONFIG.items.find(item => item.id === 'pm3');
  const mc3 = SCIENCE_LAB_CONFIG.items.find(item => item.id === 'mc3');
  const mc8 = SCIENCE_LAB_CONFIG.items.find(item => item.id === 'mc8');
  const cy3 = SCIENCE_LAB_CONFIG.items.find(item => item.id === 'cy3');
  assert.equal(sp3.stimulus.graph.type, 'line');
  assert.ok(g3.stimulus.systemModel.nodes.length >= 5);
  assert.equal(sd6.stimulus.graph.type, 'bar');
  assert.equal(sd6.stimulus.graph.yMin, 0, 'Earth/Sky bar graph should use a zero baseline');
  assert.equal(sd8.transferLevel, 'far');
  assert.equal(sd8.transfer, true);
  assert.equal(mc3.stimulus.graph.type, 'bar');
  assert.equal(mc3.stimulus.graph.yMin, 0, 'bar graph should use a zero baseline');
  assert.ok(pm3.stimulus.particleModel.panels.length >= 2);
  assert.ok(cy3.stimulus.systemModel.nodes.length >= 4);
  assert.equal(mc8.responseType, 'graph-build');
  assert.equal(graphBuildComplete(mc8.graphBuild, { 0: 104, 1: 104, 2: 104, 3: 104 }), true);
  assert.equal(graphBuildCorrect(mc8.graphBuild, { 0: 104, 1: 104, 2: 104, 3: 104 }), true);

  assert.equal(validatePhenomena(SCIENCE_LAB_CONFIG.phenomena), true);
  assert.equal(SCIENCE_LAB_CONFIG.phenomena.length, 2);
  for (const phenomenon of SCIENCE_LAB_CONFIG.phenomena) {
    assert.ok(Array.isArray(phenomenon.sep) && phenomenon.sep.length, `${phenomenon.id} needs SEP metadata`);
    assert.ok(Array.isArray(phenomenon.ccc) && phenomenon.ccc.length, `${phenomenon.id} needs CCC metadata`);
    assert.ok(Array.isArray(phenomenon.representationTypes) && phenomenon.representationTypes.length, `${phenomenon.id} needs representation metadata`);
    assert.ok(phenomenon.steps.some(step => step.role === 'prediction'));
    assert.ok(phenomenon.steps.some(step => step.role === 'revision'));
    assert.ok(phenomenon.steps.every(step => step.sep && step.ccc && step.representationType && step.transferLevel), `${phenomenon.id} steps need explicit reasoning metadata`);
    assert.ok(phenomenon.steps.filter(step => step.recordEvidence).length <= 2, `${phenomenon.id} must not inflate mastery with every step`);
  }

  const openSystem = SCIENCE_LAB_CONFIG.phenomena.find(phenomenon => phenomenon.id === 'open-system-mass');
  const cerStep = openSystem.steps.find(step => step.type === 'cer');
  assert.ok(cerStep, 'open-system phenomenon should end with CER construction');
  assert.equal(validateCer(cerStep.cer), true);
  const correctCer = scoreCer(cerStep.cer, { claim: 1, evidence: [0, 1], reasoning: 0 });
  assert.deepEqual(correctCer, { claimCorrect: true, evidenceCorrect: true, reasoningCorrect: true, score: 3, max: 3, correct: true });
  const partialCer = scoreCer(cerStep.cer, { claim: 0, evidence: [0, 1], reasoning: 0 });
  assert.equal(partialCer.score, 2);
  assert.equal(partialCer.claimCorrect, false);
  assert.equal(partialCer.evidenceCorrect, true);
  assert.equal(partialCer.reasoningCorrect, true);
  assert.equal(partialCer.correct, false);
  assert.ok(!cerStep.recordEvidence, 'CER reasoning analytics must not add another content-mastery attempt');

  const phenomenonProfile = blankProfile();
  assert.equal(nextPhenomenon(SCIENCE_LAB_CONFIG.phenomena, phenomenonProfile, 'matter').id, 'sugar-disappears');
  phenomenonProfile.sessions.push({ kind: 'phenomenon', phenomenonId: 'sugar-disappears' });
  assert.equal(nextPhenomenon(SCIENCE_LAB_CONFIG.phenomena, phenomenonProfile, 'matter').id, 'open-system-mass');
});
