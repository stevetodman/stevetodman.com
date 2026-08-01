// Behavioural tests for the pediatric BP percentile calculator.
//
// The clinical risk here is not a crash, it is a confident wrong answer.
// These tests guard the classification boundary, input plausibility, and the
// accuracy of the spline against published AAP 2017 values.

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium, watchForErrors } from './helpers/harness.mjs';

const PAGE = '/tools/bp-percentile-calculator.html';

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

/** Fill the form and calculate. Returns everything the clinician sees. */
async function calculate({ dob, measure = '2025-08-01', sex = 'M', height, unit = 'cm', sbp, dbp }) {
  return page.evaluate(args => {
    document.getElementById('dob').value = args.dob;
    document.getElementById('measureDate').value = args.measure;
    document.getElementById('sex').value = args.sex;
    document.getElementById('height').value = String(args.height);
    document.getElementById('heightUnit').value = args.unit;
    document.getElementById('sbp').value = String(args.sbp);
    document.getElementById('dbp').value = String(args.dbp);
    calculate();
    const text = id => (document.getElementById(id)?.textContent || '').trim();
    const split = value => value.split('/').map(part => parseInt(part, 10));
    const [sbp90, dbp90] = split(text('p90'));
    const [sbp95, dbp95] = split(text('p95'));
    return {
      shown: document.getElementById('results').classList.contains('show'),
      error: text('error'),
      sbpLabel: text('sbpPct'),
      dbpLabel: text('dbpPct'),
      classification: text('classification'),
      sbp90, dbp90, sbp95, dbp95,
      warnings: (document.getElementById('warnings')?.innerText || '').trim(),
    };
  }, { dob, measure, sex, height, unit, sbp, dbp });
}

/** Date of birth for a child who is exactly `years` old on the measurement date. */
const dobFor = years => `${2025 - years}-08-01`;

describe('AAP 2017 accuracy', () => {
  // Spot-checked against the published AAP 2017 tables for a boy at the 50th
  // height percentile. The stated tolerance for this implementation is 1 mmHg.
  test('thresholds match published values for an 8-year-old boy at median height', async () => {
    const r = await calculate({ dob: dobFor(8), sex: 'M', height: 130.8, sbp: 100, dbp: 60 });
    assert.equal(r.sbp90, 110);
    assert.equal(r.dbp90, 72);
    assert.equal(r.sbp95, 114);
    assert.ok(Math.abs(r.dbp95 - 76) <= 1, `DBP 95th ${r.dbp95} should be within 1 mmHg of 76`);
  });

  test('thresholds rise with age and with height', async () => {
    const younger = await calculate({ dob: dobFor(6), sex: 'M', height: 116, sbp: 100, dbp: 60 });
    const older = await calculate({ dob: dobFor(12), sex: 'M', height: 149, sbp: 100, dbp: 60 });
    assert.ok(older.sbp95 > younger.sbp95, 'the 95th centile must increase with age and height');

    const shorter = await calculate({ dob: dobFor(10), sex: 'M', height: 128, sbp: 100, dbp: 60 });
    const taller = await calculate({ dob: dobFor(10), sex: 'M', height: 152, sbp: 100, dbp: 60 });
    assert.ok(taller.sbp95 > shorter.sbp95, 'at a fixed age, taller children have higher thresholds');
  });

  test('centimetres and inches agree', async () => {
    const cm = await calculate({ dob: dobFor(8), sex: 'M', height: 130.81, sbp: 108, dbp: 62 });
    const inches = await calculate({ dob: dobFor(8), sex: 'M', height: 51.5, unit: 'in', sbp: 108, dbp: 62 });
    assert.equal(inches.sbp95, cm.sbp95);
    assert.equal(inches.classification, cm.classification);
  });

  test('extrapolation beyond the model knots is flagged', async () => {
    const young = await calculate({ dob: dobFor(3), sex: 'M', height: 96, sbp: 95, dbp: 55 });
    assert.match(young.warnings, /below minimum knot/i);
    const old = await calculate({ dob: '2007-09-15', sex: 'M', height: 178, sbp: 118, dbp: 72 });
    assert.match(old.warnings, /above maximum knot/i);
  });
});

describe('classification', () => {
  // Regression: the category was decided from a rounded integer percentile
  // while the thresholds displayed came from the continuous spline, so the two
  // contradicted each other at the boundary. A clinician reading
  // "95th percentile: 113" for a patient at 113 was told "Elevated BP".
  test('never contradicts the thresholds it displays', async () => {
    const contradictions = [];
    for (const sex of ['M', 'F']) {
      for (const age of [6, 8, 10, 12]) {
        for (const height of [110, 130, 150]) {
          for (let sbp = 90; sbp <= 140; sbp += 1) {
            const r = await calculate({ dob: dobFor(age), sex, height, sbp, dbp: 40 });
            if (!r.shown) continue;
            const stage = /Stage/.test(r.classification);
            const elevatedOrWorse = /Stage|Elevated/.test(r.classification);
            const where = `${sex} ${age}y ${height}cm SBP ${sbp} (p90 ${r.sbp90}, p95 ${r.sbp95}) -> "${r.classification}"`;
            if (sbp >= r.sbp95 && !stage) contradictions.push(`at or above the 95th but not staged: ${where}`);
            if (sbp < r.sbp95 && stage && sbp < 130) contradictions.push(`below the 95th but staged: ${where}`);
            if (sbp >= r.sbp90 && sbp < r.sbp95 && !elevatedOrWorse) contradictions.push(`at or above the 90th but normal: ${where}`);
          }
        }
      }
    }
    assert.deepEqual(contradictions, [],
      `${contradictions.length} contradictions:\n${contradictions.slice(0, 10).join('\n')}`);
  });

  test('applies fixed adult thresholds from age 13', async () => {
    const cases = [
      { sbp: 119, dbp: 79, expected: 'Normal' },
      { sbp: 120, dbp: 70, expected: 'Elevated BP' },
      { sbp: 130, dbp: 70, expected: 'Stage 1 HTN' },
      { sbp: 110, dbp: 80, expected: 'Stage 1 HTN' },
      { sbp: 140, dbp: 70, expected: 'Stage 2 HTN' },
      { sbp: 110, dbp: 90, expected: 'Stage 2 HTN' },
    ];
    for (const { sbp, dbp, expected } of cases) {
      const r = await calculate({ dob: dobFor(15), sex: 'M', height: 170, sbp, dbp });
      assert.equal(r.classification, expected, `15-year-old at ${sbp}/${dbp}`);
    }
  });

  test('under 13, the absolute threshold applies when it is the lower one', async () => {
    // A tall 12-year-old can sit below the 95th centile yet still be >= 130/80.
    const r = await calculate({ dob: dobFor(12), sex: 'M', height: 165, sbp: 132, dbp: 70 });
    assert.ok(/Stage/.test(r.classification), `expected staging at 132 systolic, got "${r.classification}"`);
  });
});

describe('input validation', () => {
  // Regression: none of these were rejected, and each produced a confident
  // classification. Negative pressures reported "Normal".
  const rejected = [
    { label: 'diastolic above systolic', args: { sbp: 60, dbp: 90 }, match: /lower than systolic/i },
    { label: 'systolic out of range', args: { sbp: 400, dbp: 60 }, match: /between 50 and 250/i },
    { label: 'negative pressures', args: { sbp: -50, dbp: -20 }, match: /between 50 and 250/i },
    { label: 'diastolic out of range', args: { sbp: 120, dbp: 200 }, match: /between 30 and 150/i },
    { label: 'implausible height', args: { height: 500, sbp: 100, dbp: 60 }, match: /plausible range/i },
    { label: 'unit confusion (130 inches)', args: { height: 130, unit: 'in', sbp: 100, dbp: 60 }, match: /plausible range/i },
  ];
  for (const { label, args, match } of rejected) {
    test(`rejects ${label}`, async () => {
      const r = await calculate({ dob: dobFor(8), sex: 'M', height: 130, sbp: 100, dbp: 60, ...args });
      assert.equal(r.shown, false, `must not display a result for ${label}`);
      assert.match(r.error, match);
    });
  }

  test('rejects a missing or out-of-range age', async () => {
    const noDob = await calculate({ dob: '', height: 130, sbp: 100, dbp: 60 });
    assert.equal(noDob.shown, false);
    assert.match(noDob.error, /date of birth/i);

    const tooOld = await calculate({ dob: dobFor(19), height: 180, sbp: 120, dbp: 70 });
    assert.equal(tooOld.shown, false);
    assert.match(tooOld.error, /between 1 and 17/i);
  });
});

describe('result presentation', () => {
  // Regression: changing the inputs left the previous classification on screen,
  // so a "Stage 2 HTN" panel could sit beside a freshly typed 90/50.
  test('editing an input clears the previous result', async () => {
    const before = await calculate({ dob: dobFor(8), sex: 'M', height: 130.8, sbp: 126, dbp: 88 });
    assert.equal(before.shown, true);
    assert.match(before.classification, /Stage 2/);

    await page.fill('#sbp', '90');
    await page.fill('#dbp', '50');
    const stillShown = await page.evaluate(() => document.getElementById('results').classList.contains('show'));
    assert.equal(stillShown, false, 'a stale classification must not survive an input change');
  });

  // Regression: the suffix was hardcoded, producing "1th", "23th", "92th".
  test('percentile ordinals are well formed', async () => {
    const bad = [];
    for (let sbp = 85; sbp <= 145; sbp += 1) {
      const r = await calculate({ dob: dobFor(8), sex: 'M', height: 130.8, sbp, dbp: 50 });
      if (!r.shown) continue;
      const match = r.sbpLabel.match(/^(\d+)(st|nd|rd|th)/);
      if (!match) { bad.push(`unparseable: ${r.sbpLabel}`); continue; }
      const n = Number(match[1]);
      const lastTwo = n % 100, lastOne = n % 10;
      const correct = (lastTwo < 11 || lastTwo > 13) && lastOne > 0 && lastOne < 4
        ? ['st', 'nd', 'rd'][lastOne - 1] : 'th';
      if (match[2] !== correct) bad.push(`${r.sbpLabel} should be ${n}${correct}`);
    }
    assert.deepEqual([...new Set(bad)], []);
  });

  test('the form submits on Enter', async () => {
    await page.reload();
    await page.fill('#dob', dobFor(8));
    await page.fill('#height', '130.8');
    await page.fill('#sbp', '114');
    await page.fill('#dbp', '75');
    await page.press('#dbp', 'Enter');
    assert.equal(await page.evaluate(() => document.getElementById('results').classList.contains('show')), true);
  });

  test('no page errors were raised across the whole suite', () => {
    assert.deepEqual([...new Set(errors)], []);
  });
});
