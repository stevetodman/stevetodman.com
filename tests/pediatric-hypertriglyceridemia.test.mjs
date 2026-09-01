import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessNonfastingScreen,
  buildFastingPlan,
  calculateNonHDL,
  classifyFastingTG,
  TG_BANDS,
} from '../tools/pediatric-hypertriglyceridemia-core.js';

test('Table 1 fasting TG boundaries are exact', () => {
  const cases = [
    [0, 'acceptable'], [130, 'acceptable'], [131, 'mild'], [400, 'mild'],
    [401, 'moderate'], [885, 'moderate'], [886, 'severe'], [2000, 'severe'], [2001, 'very-severe'],
  ];
  for (const [value, expected] of cases) assert.equal(classifyFastingTG(value)?.id, expected, `${value} mg/dL`);
  assert.equal(classifyFastingTG(-1), null);
  assert.equal(classifyFastingTG(''), null);
});

test('non-HDL calculation validates impossible/missing values', () => {
  assert.equal(calculateNonHDL(200, 50), 150);
  assert.equal(calculateNonHDL('', 50), null);
  assert.equal(calculateNonHDL(30, 50), null);
});

test('Figure 3 nonfasting triggers and narrative HDL trigger are preserved', () => {
  const byNonHDL = assessNonfastingScreen({ triglycerides: 150, totalCholesterol: 190, hdl: 40 });
  assert.equal(byNonHDL.nonHDL, 150);
  assert.deepEqual(byNonHDL.figure3Reasons, ['non–HDL-C ≥145 mg/dL']);
  assert.equal(byNonHDL.considerFastingPanel, true);

  const byTG = assessNonfastingScreen({ triglycerides: 200, totalCholesterol: 150, hdl: 50 });
  assert.deepEqual(byTG.figure3Reasons, ['nonfasting TG ≥200 mg/dL']);

  const byHDL = assessNonfastingScreen({ triglycerides: 120, totalCholesterol: 150, hdl: 39 });
  assert.deepEqual(byHDL.narrativeReasons, ['HDL-C <40 mg/dL']);
  assert.equal(byHDL.considerFastingPanel, true);
});

test('mild plan gates statin consideration on age, non-HDL, and persistence', () => {
  const plan = buildFastingPlan({
    age: 10,
    triglycerides: 250,
    totalCholesterol: 200,
    hdl: 40,
    persistentAfterLifestyle: 'yes',
  });
  assert.equal(plan.band.id, 'mild');
  assert.equal(plan.nonHDL, 160);
  assert.equal(plan.statinState, 'met-and-persistent');
  assert.match(plan.conditional.join(' '), /statin therapy may be considered/i);
});

test('moderate plan includes specialist/lifestyle and persistent pharmacotherapy branch', () => {
  const plan = buildFastingPlan({
    age: 12,
    triglycerides: 500,
    totalCholesterol: 170,
    hdl: 45,
    persistentAfterLifestyle: 'yes',
  });
  assert.equal(plan.band.id, 'moderate');
  assert.match(plan.steps.join(' '), /20%–25%/);
  assert.match(plan.steps.join(' '), /specialist/i);
  assert.match(plan.conditional.join(' '), /fenofibrate or omega-3/i);
});

test('severe and very severe branches prioritize pancreatitis and specialist evaluation', () => {
  const severe = buildFastingPlan({ age: 14, triglycerides: 1000, pancreatitisSymptoms: true });
  assert.equal(severe.band.goal, 'Prevent pancreatitis');
  assert.ok(severe.labs.includes('TSH'));
  assert.ok(severe.labs.includes('amylase'));
  assert.ok(severe.steps.some((x) => /genetic testing/i.test(x)));

  const verySevere = buildFastingPlan({ age: 14, triglycerides: 2500 });
  assert.equal(verySevere.band.id, 'very-severe');
  assert.match(verySevere.conditional.join(' '), /does not necessarily benefit/i);
});

test('all five bands carry source-driven goal/lifestyle/pharmacotherapy fields', () => {
  assert.equal(TG_BANDS.length, 5);
  for (const band of TG_BANDS) {
    assert.ok(band.rangeLabel);
    assert.ok(band.goal);
    assert.ok(band.lifestyle.length > 0);
    assert.ok(band.pharmacotherapy.length > 0);
  }
});
