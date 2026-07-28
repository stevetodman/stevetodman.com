#!/usr/bin/env node
'use strict';

/* Adversarial fixture tests for the browser-local ABPM comparison core. */
const assert = require('node:assert/strict');
const core = require('./pediatric-abpm-core.js');

function adolescentAge() { return core.ageOnStudyDate('2013-07-27', '2026-07-27'); }
function pediatricAge() { return core.ageOnStudyDate('2014-07-28', '2026-07-27'); }
function completeMeans(delta) {
    const d = delta || 0;
    return {
        day: { sbp: 124.9 + d, dbp: 74.9 + d },
        wake: { sbp: 129.9 + d, dbp: 79.9 + d },
        sleep: { sbp: 109.9 + d, dbp: 64.9 + d }
    };
}
function quality(overrides) {
    return Object.assign({
        durationHours: 24,
        attemptedReadings: 60,
        successfulReadings: 50,
        deviceType: 'validated-cuff-abpm',
        deviceValidated: true,
        cuffAndArmVerified: true,
        sleepCaptured: true,
        diaryReviewed: true,
        oneReadingPerHour: true,
        cadenceConfirmed: true,
        applicationCheck: 'within5',
        exclusionsReviewed: true,
        rawDataAudited: false
    }, overrides || {});
}
function scope(age, overrides) {
    return core.validateScope(Object.assign({
        age: age,
        outpatientStable: true,
        noAcuteConcern: true,
        specialContext: 'none',
        treatmentContext: 'none'
    }, overrides || {}));
}
function p95(values, rootValues) {
    return Object.assign({
        referenceDataset: 'female',
        heightCm: 145,
        reportP95ProvenanceConfirmed: true,
        p95: Object.assign({
            day: { sbp: 127, dbp: 77 },
            wake: { sbp: 132, dbp: 82 },
            sleep: { sbp: 112, dbp: 67 }
        }, values || {})
    }, rootValues || {});
}

// Exact chronological-age boundary: no rounding to 13.
assert.equal(core.ageOnStudyDate('2013-07-28', '2026-07-27').exact13OrOlder, false);
assert.equal(core.ageOnStudyDate('2013-07-28', '2026-07-28').exact13OrOlder, true);

const teenThresholds = core.buildThresholds(adolescentAge(), {}).thresholds;
assert.deepEqual(teenThresholds, {
    day: { sbp: 125, dbp: 75 },
    wake: { sbp: 130, dbp: 80 },
    sleep: { sbp: 110, dbp: 65 }
});

// All six just below a threshold remains normal; equality is abnormal.
assert.equal(core.evaluateMeans(completeMeans(), teenThresholds).status, 'normal');
core.PERIODS.forEach(function(period) {
    core.COMPONENTS.forEach(function(component) {
        const means = completeMeans();
        means[period][component] = teenThresholds[period][component];
        const result = core.evaluateMeans(means, teenThresholds);
        assert.equal(result.status, 'abnormal', period + ' ' + component + ' equality must be abnormal');
        assert.equal(result.drivers.length, 1);
        assert.equal(result.drivers[0].period, period);
        assert.equal(result.drivers[0].component, component);
    });
});

// Under-13 uses the lower—not higher—of p95 and adolescent cutoff per component.
const childThresholds = core.buildThresholds(pediatricAge(), p95({
    day: { sbp: 118, dbp: 79 },
    wake: { sbp: 140, dbp: 70 },
    sleep: { sbp: 108, dbp: 80 }
}));
assert.equal(childThresholds.errors.length, 0);
assert.deepEqual(childThresholds.thresholds, {
    day: { sbp: 118, dbp: 75 },
    wake: { sbp: 130, dbp: 70 },
    sleep: { sbp: 108, dbp: 65 }
});
assert.equal(core.buildThresholds(pediatricAge(), p95({}, { heightCm: 119.9 })).thresholds, null);
assert.equal(core.buildThresholds(pediatricAge(), p95({}, { referenceDataset: '' })).thresholds, null);
assert.equal(core.buildThresholds(pediatricAge(), p95({}, { reportP95ProvenanceConfirmed: false })).thresholds, null);
assert.equal(core.buildThresholds({ years: 12, exact13OrOlder: true }, p95()).mode, 'pediatric-lower-of-p95-or-fixed');

// Isolated sleep DBP elevation must be abnormal.
const isolatedSleep = core.evaluateMeans({
    day: { sbp: 120, dbp: 70 }, wake: { sbp: 124, dbp: 74 }, sleep: { sbp: 108, dbp: 65 }
}, teenThresholds);
assert.equal(isolatedSleep.status, 'abnormal');
assert.deepEqual(isolatedSleep.drivers.map(function(x) { return x.period + ':' + x.component; }), ['sleep:dbp']);
const invalidPair = core.evaluateMeans({ day: { sbp: 75, dbp: 75 }, wake: { sbp: 124, dbp: 74 }, sleep: { sbp: 108, dbp: 60 } }, teenThresholds);
assert.equal(invalidPair.status, null);
assert.equal(invalidPair.errors.filter(function(message) { return /SBP must exceed DBP/.test(message); }).length, 1);
assert.equal(core.evaluateMeans({ day: { sbp: 221, dbp: 70 }, wake: { sbp: 124, dbp: 74 }, sleep: { sbp: 108, dbp: 60 } }, teenThresholds).status, null);
assert.equal(core.evaluateMeans(completeMeans(), { day: { sbp: 125, dbp: 75 }, wake: { sbp: 130, dbp: 80 }, sleep: { sbp: 110 } }).status, null);
assert.equal(core.evaluateMeans({ day: { sbp: 124, dbp: 74 }, wake: { sbp: 100, dbp: 60 }, sleep: { sbp: 101, dbp: 61 } }, teenThresholds).status, null);

// Quality boundaries and no false reassurance from an inadequate study.
assert.equal(core.validateStudy(quality({ durationHours: 18, successfulReadings: 42, attemptedReadings: 60 })).eligibleForPhenotype, true);
assert.equal(core.validateStudy(quality({ durationHours: 17.99 })).eligibleForPhenotype, false);
assert.equal(core.validateStudy(quality({ successfulReadings: 42, attemptedReadings: 60 })).eligibleForPhenotype, true);
assert.equal(core.validateStudy(quality({ successfulReadings: 419, attemptedReadings: 599 })).eligibleForPhenotype, false);
assert.equal(core.validateStudy(quality({ applicationCheck: 'outside5' })).eligibleForPhenotype, false);
assert.equal(core.validateStudy(quality({ deviceType: 'cuffless' })).eligibleForPhenotype, false);
assert.equal(core.validateStudy(quality({ diaryReviewed: false })).eligibleForPhenotype, false);
assert.equal(core.validateStudy(quality({ durationHours: 1000 })).eligibleForPhenotype, false);
assert.equal(core.validateStudy(quality({ durationHours: 24, attemptedReadings: 1, successfulReadings: 1 })).eligibleForPhenotype, false);
assert.match(core.validateStudy(quality({ cadenceConfirmed: false })).flags.join(' '), /cadence/);

const normalMeans = core.evaluateMeans(completeMeans(), teenThresholds);
const abnormalMeans = core.evaluateMeans(Object.assign(completeMeans(), { sleep: { sbp: 110, dbp: 60 } }), teenThresholds);
const goodScope = scope(adolescentAge());
const goodQuality = core.validateStudy(quality());
const officeBelow = core.getOfficeStatus({ confirmed: true, sbp: 118, dbp: 70 }, adolescentAge());
const officeHigh = core.getOfficeStatus({ confirmed: true, sbp: 130, dbp: 70 }, adolescentAge());
const officeElevated = core.getOfficeStatus({ confirmed: true, sbp: 125, dbp: 70 }, adolescentAge());
assert.equal(core.getOfficeStatus({ confirmed: true, sbp: 80, dbp: 80 }, adolescentAge()).status, 'unavailable');
assert.equal(core.getOfficeStatus({ confirmed: true, sbp: 221, dbp: 70 }, adolescentAge()).status, 'unavailable');
assert.equal(core.getOfficeStatus({ confirmed: true, sbp: 129.9, dbp: 70 }, adolescentAge()).status, 'elevated');

// All four phenotype rows plus office elevated-but-not-hypertensive handling.
assert.equal(core.assignPhenotype(goodScope, goodQuality, officeBelow, normalMeans).code, 'normotension');
assert.equal(core.assignPhenotype(goodScope, goodQuality, officeHigh, normalMeans).code, 'white-coat');
assert.equal(core.assignPhenotype(goodScope, goodQuality, officeBelow, abnormalMeans).code, 'masked');
assert.equal(core.assignPhenotype(goodScope, goodQuality, officeHigh, abnormalMeans).code, 'ambulatory-hypertension');
assert.equal(officeElevated.phenotypeStatus, false);
const elevatedOfficeNormalAbpm = core.assignPhenotype(goodScope, goodQuality, officeElevated, normalMeans);
assert.equal(elevatedOfficeNormalAbpm.code, 'office-elevated-abpm-normal');
assert.equal(core.nextStep(goodScope, goodQuality, officeElevated, normalMeans, elevatedOfficeNormalAbpm, false).tone, 'review');

// Missing office, treatment context, bad quality, and out-of-scope input must withhold a phenotype.
assert.equal(core.assignPhenotype(goodScope, goodQuality, core.getOfficeStatus({ confirmed: false }, adolescentAge()), normalMeans).code, 'office-unavailable');
assert.equal(core.assignPhenotype(goodScope, goodQuality, { status: 'unavailable' }, normalMeans).code, 'office-unavailable');
assert.equal(core.assignPhenotype(scope(adolescentAge(), { treatmentContext: 'active' }), goodQuality, officeHigh, abnormalMeans).code, 'treated-context');
assert.equal(core.assignPhenotype(scope(adolescentAge(), { treatmentContext: 'unknown' }), goodQuality, officeHigh, abnormalMeans).code, 'treatment-unknown');
assert.equal(core.assignPhenotype(scope(adolescentAge(), { treatmentContext: '' }), goodQuality, officeHigh, abnormalMeans).code, 'treatment-unknown');
assert.equal(core.assignPhenotype(goodScope, core.validateStudy(quality({ sleepCaptured: false })), officeBelow, normalMeans).code, 'withheld');
assert.equal(core.assignPhenotype(scope(adolescentAge(), { outpatientStable: false }), goodQuality, officeBelow, normalMeans).code, 'withheld');
assert.equal(scope(adolescentAge(), { noAcuteConcern: false }).eligibleForComparison, false);
assert.equal(scope(core.ageOnStudyDate('2013-07-27', '2100-07-27')).eligibleForComparison, false);
assert.equal(core.nextStep(goodScope, goodQuality, officeBelow, normalMeans, { code: 'withheld' }, false).tone, 'caution');

// Dipping is numeric/descriptive and does not participate in phenotype assignment.
const dipping = core.calculateDipping({ day: { sbp: 120, dbp: 70 }, wake: { sbp: 120, dbp: 80 }, sleep: { sbp: 120, dbp: 80 } });
assert.equal(dipping.sbp, 0);
assert.equal(dipping.dbp, 0);
assert.equal(core.assignPhenotype(goodScope, goodQuality, officeBelow, normalMeans).code, 'normotension');

console.log('pediatric-abpm-core: all adversarial fixtures passed');
