// Behavioural and clinical regression tests for the pediatric BP calculator.
//
// A confident wrong result is the primary risk. This suite therefore checks
// every published AAP 2017 table cell, every category boundary, the CDC growth
// lookup, form validation, and the result presentation clinicians can see.

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

const PAGE = '/tools/bp-percentile-calculator.html';
const reference = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'tests/fixtures/aap-2017-bp-tables.json'), 'utf8')
);

let server, browser, context, page, errors;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
  context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  page = await context.newPage();
  errors = watchForErrors(page);
  await page.goto(server.origin + PAGE);
});

after(async () => {
  await context?.close();
  await browser?.close();
  await server?.close();
});

/** Fill the form and return the complete rendered result. */
async function calculate({ dob, measure = '2025-08-01', sex = 'M', height, unit = 'cm', sbp, dbp }) {
  return page.evaluate(args => {
    document.getElementById('dob').value = args.dob;
    document.getElementById('measureDate').value = args.measure;
    document.getElementById('sex').value = args.sex;
    document.getElementById('height').value = String(args.height);
    document.getElementById('heightUnit').value = args.unit;
    document.getElementById('sbp').value = String(args.sbp);
    document.getElementById('dbp').value = String(args.dbp);
    window.BPCalculator.calculate();

    const text = id => (document.getElementById(id)?.textContent || '').trim();
    const split = value => value.split('/').map(part => Number.parseInt(part, 10));
    const [sbp90, dbp90] = split(text('p90'));
    const [sbp95, dbp95] = split(text('p95'));
    const invalidSvgAttributes = [...document.querySelectorAll('#sbpChart *, #dbpChart *')]
      .flatMap(node => [...node.attributes].map(attribute => attribute.value))
      .filter(value => /NaN|Infinity/.test(value));

    return {
      shown: document.getElementById('results').classList.contains('show'),
      error: text('error'),
      warnings: text('warnings'),
      sbpLabel: text('sbpPct'),
      dbpLabel: text('dbpPct'),
      classification: text('categoryValue'),
      driver: text('categoryDriver'),
      nextStep: text('nextStep'),
      details: text('calcDetails'),
      sbpScale: text('sbpScale'),
      dbpScale: text('dbpScale'),
      sbp90,
      dbp90,
      sbp95,
      dbp95,
      sbpPaths: document.querySelectorAll('#sbpChart path').length,
      dbpPaths: document.querySelectorAll('#dbpChart path').length,
      patientPoints: document.querySelectorAll('#sbpChart circle, #dbpChart circle').length,
      invalidSvgAttributes,
    };
  }, { dob, measure, sex, height, unit, sbp, dbp });
}

/** Date of birth for a child exactly `years` old on the default date. */
const dobFor = years => String(2025 - years) + '-08-01';

describe('AAP 2017 model validation', () => {
  test('matches all 1,904 published table cells within the frozen acceptance envelope', async () => {
    const result = await page.evaluate(rows => {
      const calculator = window.BPCalculator;
      let comparisons = 0;
      let exact = 0;
      let withinOne = 0;
      let maximumDifference = 0;
      const outsideEnvelope = [];

      for (const row of rows) {
        const [sexCode, age, heightPercentile, height, bpType, p50, p90, p95, p95Plus12] = row;
        const sex = sexCode === 1 ? 'M' : 'F';
        const coefficients = calculator.coefficients[bpType.toUpperCase() + '_' + sex];
        const cells = [
          { index: 49, expected: p50, offset: 0, label: 'p50' },
          { index: 89, expected: p90, offset: 0, label: 'p90' },
          { index: 94, expected: p95, offset: 0, label: 'p95' },
          { index: 94, expected: p95Plus12, offset: 12, label: 'p95+12' },
        ];

        for (const cell of cells) {
          const modeled = calculator.getBPAtPercentile(
            coefficients,
            cell.index,
            age + 0.5 / 12,
            height,
            sex
          ) + cell.offset;
          const actual = Math.round(modeled);
          const difference = Math.abs(actual - cell.expected);
          comparisons += 1;
          if (difference === 0) exact += 1;
          if (difference <= 1) withinOne += 1;
          maximumDifference = Math.max(maximumDifference, difference);
          if (difference > 2) {
            outsideEnvelope.push({ sex, age, heightPercentile, height, bpType, cell: cell.label, expected: cell.expected, actual, modeled });
          }
        }
      }
      return { comparisons, exact, withinOne, maximumDifference, outsideEnvelope };
    }, reference.rows);

    assert.equal(result.comparisons, 1904);
    assert.equal(result.exact, 1016, 'exact-match count changed; review coefficients or model age handling');
    assert.equal(result.withinOne, 1883, 'within-1-mmHg distribution changed; review the model');
    assert.equal(result.maximumDifference, 2);
    assert.deepEqual(result.outsideEnvelope, []);
  });

  test('matches a published threshold row for an 8-year-old boy at median height', async () => {
    const result = await calculate({ dob: dobFor(8), sex: 'M', height: 130.8, sbp: 100, dbp: 60 });
    assert.equal(result.sbp90, 110);
    assert.equal(result.dbp90, 72);
    assert.equal(result.sbp95, 114);
    assert.ok(Math.abs(result.dbp95 - 76) <= 1);
  });

  test('centimeters and inches produce the same result', async () => {
    const centimeters = await calculate({ dob: dobFor(8), sex: 'M', height: 130.81, sbp: 108, dbp: 62 });
    const inches = await calculate({ dob: dobFor(8), sex: 'M', height: 51.5, unit: 'in', sbp: 108, dbp: 62 });
    assert.equal(inches.sbp95, centimeters.sbp95);
    assert.equal(inches.dbp95, centimeters.dbp95);
    assert.equal(inches.classification, centimeters.classification);
  });

  test('uses official monthly CDC length and stature LMS values', async () => {
    const stats = await page.evaluate(() => ({
      infant: window.BPCalculator.calculateHeightStats(76.11837536, 1 + 0.5 / 12, 'M'),
      child: window.BPCalculator.calculateHeightStats(122, 7.5 + 0.5 / 12, 'F'),
    }));
    assert.equal(stats.infant.measure, 'Length-for-age');
    assert.equal(stats.infant.referenceAgeMonths, 12.5);
    assert.ok(Math.abs(stats.infant.z) < 1e-8);
    assert.ok(Math.abs(stats.infant.percentile - 50) < 0.001);
    assert.equal(stats.child.measure, 'Stature-for-age');
    assert.equal(stats.child.referenceAgeMonths, 90.5);
    assert.ok(Math.abs(stats.child.z - (-0.51428)) < 0.0001);
    assert.ok(Math.abs(stats.child.percentile - 30.35) < 0.02);
  });

  test('does not mislabel spline knots as validity limits', async () => {
    const young = await calculate({ dob: dobFor(1), sex: 'M', height: 76.1, sbp: 90, dbp: 50 });
    const old = await calculate({ dob: '2007-09-15', sex: 'M', height: 178, sbp: 118, dbp: 72 });
    assert.equal(young.shown, true);
    assert.equal(old.shown, true);
    assert.doesNotMatch(young.warnings, /knot|extrapolat/i);
    assert.doesNotMatch(old.warnings, /knot|extrapolat/i);
    assert.doesNotMatch(young.warnings, /verify measurement/i);
  });
});

describe('AAP category boundaries', () => {
  test('agrees with an independent boundary implementation across age, sex, and height', async () => {
    const mismatches = await page.evaluate(() => {
      const calculator = window.BPCalculator;
      const bad = [];

      function expectedComponent(age, type, value, p90, p95) {
        let elevated, stage1, stage2;
        if (age >= 13) {
          if (type === 'SBP') [elevated, stage1, stage2] = [120, 130, 140];
          else [elevated, stage1, stage2] = [null, 80, 90];
        } else if (type === 'SBP') {
          elevated = Math.min(Math.round(p90), 120);
          stage1 = Math.min(Math.round(p95), 130);
          stage2 = Math.min(Math.round(p95) + 12, 140);
        } else {
          elevated = Math.round(p90);
          stage1 = Math.min(Math.round(p95), 80);
          stage2 = Math.min(Math.round(p95) + 12, 90);
        }
        if (value >= stage2) return 3;
        if (value >= stage1) return 2;
        if (elevated !== null && value >= elevated) return 1;
        return 0;
      }

      for (const sex of ['M', 'F']) {
        for (let completedAge = 1; completedAge <= 17; completedAge += 1) {
          const age = completedAge + 0.5 / 12;
          for (const z of [-2, 0, 2]) {
            const height = calculator.heightAtZ(age, sex, z);
            const sbpCoefficients = calculator.coefficients['SBP_' + sex];
            const dbpCoefficients = calculator.coefficients['DBP_' + sex];
            const sbp90 = calculator.getBPAtPercentile(sbpCoefficients, 89, age, height, sex);
            const dbp90 = calculator.getBPAtPercentile(dbpCoefficients, 89, age, height, sex);
            const sbp95 = calculator.getBPAtPercentile(sbpCoefficients, 94, age, height, sex);
            const dbp95 = calculator.getBPAtPercentile(dbpCoefficients, 94, age, height, sex);
            const sbpCandidates = new Set([50, 119, 120, 129, 130, 139, 140, Math.round(sbp90) - 1, Math.round(sbp90), Math.round(sbp95) - 1, Math.round(sbp95), Math.round(sbp95) + 11, Math.round(sbp95) + 12]);
            const dbpCandidates = new Set([30, 79, 80, 89, 90, Math.round(dbp90) - 1, Math.round(dbp90), Math.round(dbp95) - 1, Math.round(dbp95), Math.round(dbp95) + 11, Math.round(dbp95) + 12]);

            for (const sbp of sbpCandidates) {
              for (const dbp of dbpCandidates) {
                const expectedSeverity = Math.max(
                  expectedComponent(age, 'SBP', sbp, sbp90, sbp95),
                  expectedComponent(age, 'DBP', dbp, dbp90, dbp95)
                );
                const actual = calculator.classify(age, sbp, dbp, sbp90, dbp90, sbp95, dbp95);
                if (actual.severity !== expectedSeverity) {
                  bad.push({ sex, completedAge, z, sbp, dbp, expectedSeverity, actual: actual.severity });
                }
              }
            }
          }
        }
      }
      return bad;
    });
    assert.deepEqual(mismatches, []);
  });

  test('applies fixed adolescent thresholds from age 13', async () => {
    const cases = [
      { sbp: 119, dbp: 79, expected: 'Normal range' },
      { sbp: 120, dbp: 70, expected: 'Elevated BP range' },
      { sbp: 130, dbp: 70, expected: 'Stage 1 hypertension range' },
      { sbp: 110, dbp: 80, expected: 'Stage 1 hypertension range' },
      { sbp: 140, dbp: 70, expected: 'Stage 2 hypertension range' },
      { sbp: 110, dbp: 90, expected: 'Stage 2 hypertension range' },
    ];
    for (const { sbp, dbp, expected } of cases) {
      const result = await calculate({ dob: dobFor(15), sex: 'M', height: 170, sbp, dbp });
      assert.equal(result.classification, expected, '15-year-old at ' + sbp + '/' + dbp);
    }
  });

  test('shows independent systolic and diastolic category scales and the driver', async () => {
    const result = await calculate({ dob: dobFor(13), sex: 'M', height: 170, sbp: 120, dbp: 70 });
    assert.equal(result.classification, 'Elevated BP range');
    assert.match(result.driver, /driven by systolic/i);
    assert.match(result.sbpScale, /Elevated 120–129/);
    assert.match(result.dbpScale, /Normal <80/);
    assert.doesNotMatch(result.dbpScale, /Elevated/);
  });

  test('uses the lower absolute threshold for children under 13', async () => {
    const result = await calculate({ dob: dobFor(12), sex: 'M', height: 165, sbp: 132, dbp: 70 });
    assert.match(result.classification, /Stage [12]/);
  });
});

describe('input and date validation', () => {
  const rejected = [
    { label: 'diastolic above systolic', args: { sbp: 60, dbp: 90 }, match: /lower than systolic/i },
    { label: 'systolic out of range', args: { sbp: 400, dbp: 60 }, match: /between 50 and 250/i },
    { label: 'negative pressures', args: { sbp: -50, dbp: -20 }, match: /between 50 and 250/i },
    { label: 'diastolic out of range', args: { sbp: 120, dbp: 200 }, match: /between 30 and 150/i },
    { label: 'implausible height', args: { height: 500, sbp: 100, dbp: 60 }, match: /plausible range/i },
    { label: 'unit confusion', args: { height: 130, unit: 'in', sbp: 100, dbp: 60 }, match: /plausible range/i },
  ];

  for (const { label, args, match } of rejected) {
    test('rejects ' + label, async () => {
      const result = await calculate({ dob: dobFor(8), sex: 'M', height: 130, sbp: 100, dbp: 60, ...args });
      assert.equal(result.shown, false);
      assert.match(result.error, match);
    });
  }

  test('rejects missing, future, and unsupported dates', async () => {
    const missing = await calculate({ dob: '', height: 130, sbp: 100, dbp: 60 });
    assert.equal(missing.shown, false);
    assert.match(missing.error, /date of birth/i);

    const futureMeasurement = await calculate({ dob: '2025-08-02', measure: '2025-08-01', height: 76, sbp: 90, dbp: 50 });
    assert.equal(futureMeasurement.shown, false);
    assert.match(futureMeasurement.error, /on or after/i);

    const tooOld = await calculate({ dob: dobFor(19), height: 180, sbp: 120, dbp: 70 });
    assert.equal(tooOld.shown, false);
    assert.match(tooOld.error, /between 1 and 17/i);
  });

  test('uses completed calendar months without timezone or month-end drift', async () => {
    const ages = await page.evaluate(() => ({
      monthEnd: window.BPCalculator.calculateAgeFromDOB('2017-08-31', '2025-02-28'),
      birthday: window.BPCalculator.calculateAgeFromDOB('2017-08-31', '2025-08-31'),
      dayBefore: window.BPCalculator.calculateAgeFromDOB('2017-08-31', '2025-08-30'),
    }));
    assert.deepEqual(ages.monthEnd, { years: 7, months: 5, decimal: 89 / 12, totalMonths: 89 });
    assert.deepEqual(ages.birthday, { years: 8, months: 0, decimal: 8, totalMonths: 96 });
    assert.deepEqual(ages.dayBefore, { years: 7, months: 11, decimal: 95 / 12, totalMonths: 95 });
  });

  test('converts the entered height when the unit is changed', async () => {
    await page.reload();
    await page.fill('#height', '130.8');
    await page.selectOption('#heightUnit', 'in');
    assert.ok(Math.abs(Number(await page.inputValue('#height')) - 51.5) < 0.02);
    await page.selectOption('#heightUnit', 'cm');
    assert.ok(Math.abs(Number(await page.inputValue('#height')) - 130.8) < 0.1);
  });
});

describe('result presentation and interactions', () => {
  test('editing an input clears the previous result', async () => {
    const before = await calculate({ dob: dobFor(8), sex: 'M', height: 130.8, sbp: 126, dbp: 88 });
    assert.equal(before.shown, true);
    assert.match(before.classification, /Stage 2/);
    await page.fill('#sbp', '90');
    assert.equal(await page.evaluate(() => document.getElementById('results').classList.contains('show')), false);
  });

  test('formats every percentile ordinal correctly, including extremes', async () => {
    const bad = [];
    for (let sbp = 50; sbp <= 170; sbp += 2) {
      const result = await calculate({ dob: dobFor(8), sex: 'M', height: 130.8, sbp, dbp: 40 });
      if (!result.shown) continue;
      const match = result.sbpLabel.match(/^[<>]?(\d+)(st|nd|rd|th)/);
      if (!match) {
        bad.push('unparseable: ' + result.sbpLabel);
        continue;
      }
      const number = Number(match[1]);
      const lastTwo = number % 100;
      const lastOne = number % 10;
      const expectedSuffix = (lastTwo < 11 || lastTwo > 13) && lastOne > 0 && lastOne < 4
        ? ['st', 'nd', 'rd'][lastOne - 1]
        : 'th';
      if (match[2] !== expectedSuffix) bad.push(result.sbpLabel + ' should use ' + expectedSuffix);
    }
    assert.deepEqual([...new Set(bad)], []);
  });

  test('submits on Enter and frames the output as a reading, not a diagnosis', async () => {
    await page.reload();
    await page.fill('#dob', dobFor(8));
    await page.fill('#measureDate', '2025-08-01');
    await page.fill('#height', '130.8');
    await page.fill('#sbp', '114');
    await page.fill('#dbp', '75');
    await page.press('#dbp', 'Enter');
    assert.equal(await page.evaluate(() => document.getElementById('results').classList.contains('show')), true);
    assert.match((await page.textContent('body')) || '', /single reading does not diagnose hypertension/i);
    assert.equal(await page.textContent('#classification .eyebrow'), 'Category for this reading');
  });

  test('provides category-specific next steps', async () => {
    const normal = await calculate({ dob: dobFor(15), sex: 'M', height: 170, sbp: 110, dbp: 70 });
    const elevated = await calculate({ dob: dobFor(15), sex: 'M', height: 170, sbp: 120, dbp: 70 });
    const stage1 = await calculate({ dob: dobFor(15), sex: 'M', height: 170, sbp: 130, dbp: 70 });
    const stage2 = await calculate({ dob: dobFor(15), sex: 'M', height: 170, sbp: 140, dbp: 70 });
    assert.match(normal.nextStep, /next routine well-child visit/i);
    assert.match(elevated.nextStep, /6 months/i);
    assert.match(stage1.nextStep, /1–2 weeks/i);
    assert.match(stage2.nextStep, /within 1 week/i);
  });

  test('renders finite interactive systolic and diastolic reference curves', async () => {
    const result = await calculate({ dob: dobFor(13), sex: 'F', height: 158, sbp: 120, dbp: 70 });
    assert.equal(result.sbpPaths, 4);
    assert.equal(result.dbpPaths, 4);
    assert.ok(result.patientPoints >= 2);
    assert.deepEqual(result.invalidSvgAttributes, []);

    await page.focus('#sbpChart');
    const before = Number(await page.getAttribute('#sbpChart', 'data-selected-age'));
    await page.keyboard.press('ArrowRight');
    const after = Number(await page.getAttribute('#sbpChart', 'data-selected-age'));
    assert.equal(after, before + 0.5);
    assert.equal(await page.isVisible('#sbpTooltip'), true);
    assert.match((await page.textContent('#sbpTooltip')) || '', /50th:.*90th:/s);
  });

  test('copies a privacy-conscious result and supports print', async () => {
    await calculate({ dob: dobFor(13), sex: 'M', height: 170, sbp: 120, dbp: 70 });
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async value => { window.__copiedResult = value; } },
      });
      window.__printed = false;
      window.print = () => { window.__printed = true; };
    });
    await page.click('#copyResult');
    await page.waitForFunction(() => document.getElementById('copyStatus').textContent.includes('copied'));
    const copied = await page.evaluate(() => window.__copiedResult);
    assert.match(copied, /Category for this reading: Elevated BP range/);
    assert.doesNotMatch(copied, /date of birth|2012-08-01/i);

    await page.click('#printResult');
    assert.equal(await page.evaluate(() => window.__printed), true);
  });

  test('raises no runtime, console, or request errors', () => {
    assert.deepEqual([...new Set(errors)], []);
  });
});
