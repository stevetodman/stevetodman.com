#!/usr/bin/env node
'use strict';

/*
 * Release-gate adversarial fixtures for the browser-local ABPM core.
 * These are intentionally deterministic and synthetic. They cover threshold
 * equality, quality-state semantics, provenance, and false-reassurance traps.
 */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const core = require('./pediatric-abpm-core.js');

let assertions = 0;
function equal(actual, expected, message) { assertions += 1; assert.equal(actual, expected, message); }
function deepEqual(actual, expected, message) { assertions += 1; assert.deepEqual(actual, expected, message); }
function ok(actual, message) { assertions += 1; assert.ok(actual, message); }
function includes(actual, expected, message) { assertions += 1; assert.ok(actual.includes(expected), message || expected); }

function adolescentAge() { return core.ageFromCompletedAge(13, 0); }
function pediatricAge() { return core.ageFromCompletedAge(12, 11); }
function completeMeans(delta) {
    const d = delta || 0;
    return {
        h24: { sbp: 124.9 + d, dbp: 74.9 + d },
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
        deviceValidated: 'confirmed',
        cuffAndArmVerified: 'confirmed',
        sleepCaptured: 'confirmed',
        diaryReviewed: 'confirmed',
        oneReadingPerHour: 'confirmed',
        cadenceConfirmed: 'confirmed',
        applicationCheck: 'confirmed',
        exclusionsReviewed: 'confirmed',
        rawDataAudited: 'not-documented'
    }, overrides || {});
}
function scope(age, overrides) {
    return core.validateScope(Object.assign({
        age: age,
        outpatientStable: 'confirmed',
        noAcuteConcern: 'confirmed',
        specialContext: 'none',
        treatmentContext: 'none',
        riskContext: 'none',
        indication: 'suspected hypertension'
    }, overrides || {}));
}
function p95(values, rootValues) {
    return Object.assign({
        referenceDataset: 'female',
        heightCm: 145,
        reportP95Provenance: 'confirmed',
        p95: Object.assign({
            h24: { sbp: 127, dbp: 77 },
            wake: { sbp: 132, dbp: 82 },
            sleep: { sbp: 112, dbp: 67 }
        }, values || {})
    }, rootValues || {});
}
function officeBelow() { return core.getOfficeStatus({ confirmed: 'confirmed', sbp: 118, dbp: 70 }, adolescentAge()); }
function officeHigh() { return core.getOfficeStatus({ confirmed: 'confirmed', sbp: 130, dbp: 70 }, adolescentAge()); }

// Rule-set tamper detection: a release must fail if the source-locked public
// rule file drifts from the hash advertised by the algorithm.
const ruleSetHash = crypto.createHash('sha256').update(fs.readFileSync('./pediatric-abpm-rules-v1.1.json')).digest('hex');
equal(core.RULESET_SHA256, ruleSetHash, 'ruleset hash must match canonical file');
equal(core.RULESET_ID, 'pediatric-abpm-report-summary-v1.1.0');
equal(core.VERSION, 'AHA-2022-pediatric-ABPM-summary-v1.1.0');
deepEqual(core.PERIODS, ['h24', 'wake', 'sleep']);
equal(Object.prototype.hasOwnProperty.call(core.ADULT_CUTOFFS, 'day'), false, 'ambiguous “day” key must be absent');

// The legacy exact-date helper and the privacy-safe completed-age helper both
// preserve the 13th-birthday boundary.
equal(core.ageOnStudyDate('2013-07-28', '2026-07-27').exact13OrOlder, false);
equal(core.ageOnStudyDate('2013-07-28', '2026-07-28').exact13OrOlder, true);
equal(core.ageFromCompletedAge(12, 11).exact13OrOlder, false);
equal(core.ageFromCompletedAge(13, 0).exact13OrOlder, true);
equal(core.ageFromCompletedAge(12, 12), null);

const teenBuild = core.buildThresholds(adolescentAge(), {});
deepEqual(teenBuild.thresholds, {
    h24: { sbp: 125, dbp: 75 },
    wake: { sbp: 130, dbp: 80 },
    sleep: { sbp: 110, dbp: 65 }
});
equal(teenBuild.thresholdDetails.sleep.dbp.source, 'AHA-fixed');
equal(teenBuild.thresholdDetails.sleep.dbp.sourceLabel, 'AHA fixed threshold');

// Exhaust every combination of the six equality boundaries. No equality may be
// treated as normal, and only the all-below mask remains normal.
const slots = core.PERIODS.flatMap(function(period) { return core.COMPONENTS.map(function(component) { return { period: period, component: component }; }); });
for (let mask = 0; mask < (1 << slots.length); mask += 1) {
    const means = completeMeans();
    slots.forEach(function(slot, index) {
        if (mask & (1 << index)) means[slot.period][slot.component] = teenBuild.thresholds[slot.period][slot.component];
    });
    const result = core.evaluateMeans(means, teenBuild.thresholds, teenBuild.thresholdDetails);
    equal(result.status, mask === 0 ? 'normal' : 'abnormal', 'threshold equality mask ' + mask);
}

// Under-13 lower-of logic is per component, and every final value carries its
// provenance so a clamp cannot disappear in the copied note/UI.
const childBuild = core.buildThresholds(pediatricAge(), p95({
    h24: { sbp: 118, dbp: 79 },
    wake: { sbp: 140, dbp: 70 },
    sleep: { sbp: 108, dbp: 80 }
}));
equal(childBuild.errors.length, 0);
deepEqual(childBuild.thresholds, {
    h24: { sbp: 118, dbp: 75 },
    wake: { sbp: 130, dbp: 70 },
    sleep: { sbp: 108, dbp: 65 }
});
equal(childBuild.thresholdDetails.h24.sbp.source, 'report-p95');
equal(childBuild.thresholdDetails.h24.dbp.source, 'AHA-fixed-clamped');
equal(childBuild.thresholdDetails.h24.dbp.sourceLabel, 'AHA fixed — clamped from 79.0');
equal(childBuild.thresholdDetails.wake.sbp.source, 'AHA-fixed-clamped');
equal(childBuild.thresholdDetails.wake.dbp.source, 'report-p95');

// Reference-domain hard stops must be sex-specific; there is no silent
// extrapolation at a tall child or at the <120-cm lower boundary.
equal(core.buildThresholds(pediatricAge(), p95({}, { referenceDataset: 'female', heightCm: 175 })).errors.length, 0);
equal(core.buildThresholds(pediatricAge(), p95({}, { referenceDataset: 'female', heightCm: 175.1 })).thresholds, null);
equal(core.buildThresholds(pediatricAge(), p95({}, { referenceDataset: 'male', heightCm: 185 })).errors.length, 0);
equal(core.buildThresholds(pediatricAge(), p95({}, { referenceDataset: 'male', heightCm: 185.1 })).thresholds, null);
equal(core.buildThresholds(pediatricAge(), p95({}, { heightCm: 119.9 })).thresholds, null);
equal(core.buildThresholds(pediatricAge(), p95({}, { reportP95Provenance: 'not-documented' })).thresholds, null);
equal(core.buildThresholds(pediatricAge(), p95({ h24: { sbp: 75, dbp: 75 } })).thresholds, null);

// Isolated nocturnal DBP elevation remains abnormal and produces an explicit
// pattern, without inventing any BP-load logic.
const isolatedSleep = core.evaluateMeans({
    h24: { sbp: 120, dbp: 70 }, wake: { sbp: 124, dbp: 74 }, sleep: { sbp: 108, dbp: 65 }
}, teenBuild.thresholds, teenBuild.thresholdDetails);
equal(isolatedSleep.status, 'abnormal');
deepEqual(isolatedSleep.drivers.map(function(x) { return x.period + ':' + x.component; }), ['sleep:dbp']);
equal(isolatedSleep.pattern.code, 'isolated-nocturnal');

// Incomplete/physiologically implausible values never yield an ABPM status.
equal(core.evaluateMeans({ h24: { sbp: 75, dbp: 75 }, wake: { sbp: 124, dbp: 74 }, sleep: { sbp: 108, dbp: 60 } }, teenBuild.thresholds).status, null);
equal(core.evaluateMeans({ h24: { sbp: 221, dbp: 70 }, wake: { sbp: 124, dbp: 74 }, sleep: { sbp: 108, dbp: 60 } }, teenBuild.thresholds).status, null);
equal(core.evaluateMeans(completeMeans(), { h24: { sbp: 125, dbp: 75 }, wake: { sbp: 130, dbp: 80 }, sleep: { sbp: 110 } }).status, null);

// The 24-hour/wake/sleep reconciliation is intentionally a visible flag, not a
// blocker: transition readings may sit outside diary-derived subsets.
const reconciliation = core.evaluateMeans({
    h24: { sbp: 120, dbp: 70 }, wake: { sbp: 100, dbp: 60 }, sleep: { sbp: 101, dbp: 61 }
}, teenBuild.thresholds, teenBuild.thresholdDetails);
equal(reconciliation.status, 'normal');
equal(reconciliation.errors.length, 0);
equal(reconciliation.flags.length, 2);
includes(reconciliation.flags.join(' '), 'reconciliation flag');

// Quality distinguishes confirmed, not documented, and not met. It never
// equates non-documentation with a failure or an automated pass.
const goodQuality = core.validateStudy(quality());
equal(goodQuality.status, 'interpretable-with-review'); // summary-only flag
equal(goodQuality.eligibleForComparison, true);
equal(goodQuality.eligibleForPhenotype, true);
equal(goodQuality.completeness.percent, 100);
const unknownDiary = core.validateStudy(quality({ diaryReviewed: 'not-documented' }));
equal(unknownDiary.status, 'review-required');
equal(unknownDiary.eligibleForComparison, true);
equal(unknownDiary.eligibleForPhenotype, false);
includes(unknownDiary.reviewReasons.join(' '), 'not documented');
const failedDiary = core.validateStudy(quality({ diaryReviewed: 'not-met' }));
equal(failedDiary.status, 'insufficient');
equal(failedDiary.eligibleForComparison, false);
equal(failedDiary.eligibleForPhenotype, false);
const shortStudy = core.validateStudy(quality({ durationHours: 12 }));
equal(shortStudy.status, 'insufficient');
includes(shortStudy.blockers.join(' '), 'under 18 hours');
const lowCompletion = core.validateStudy(quality({ successfulReadings: 419, attemptedReadings: 599 }));
equal(lowCompletion.status, 'insufficient');
const exact70 = core.validateStudy(quality({ durationHours: 18, successfulReadings: 42, attemptedReadings: 60 }));
equal(exact70.eligibleForPhenotype, true);
includes(exact70.flags.join(' '), '18–<20 hours');
equal(core.validateStudy(quality({ applicationCheck: 'not-met' })).eligibleForComparison, false);
equal(core.validateStudy(quality({ deviceType: 'cuffless' })).eligibleForComparison, false);
equal(core.validateStudy(quality({ durationHours: 24, attemptedReadings: 1, successfulReadings: 1 })).eligibleForComparison, false);

const normalMeans = core.evaluateMeans(completeMeans(), teenBuild.thresholds, teenBuild.thresholdDetails);
const abnormalMeans = core.evaluateMeans(Object.assign(completeMeans(), { sleep: { sbp: 110, dbp: 60 } }), teenBuild.thresholds, teenBuild.thresholdDetails);
const goodScope = scope(adolescentAge());
const below = officeBelow();
const high = officeHigh();
const elevated = core.getOfficeStatus({ confirmed: 'confirmed', sbp: 125, dbp: 70 }, adolescentAge());
equal(core.getOfficeStatus({ confirmed: 'confirmed', sbp: 80, dbp: 80 }, adolescentAge()).status, 'unavailable');
equal(core.getOfficeStatus({ confirmed: 'confirmed', sbp: 221, dbp: 70 }, adolescentAge()).status, 'unavailable');
equal(core.getOfficeStatus({ confirmed: 'confirmed', sbp: 129.9, dbp: 70 }, adolescentAge()).status, 'elevated');

// All four standard untreated phenotypes, plus the important office-elevated
// non-WCH branch and all safe-withhold routes.
equal(core.assignPhenotype(goodScope, goodQuality, below, normalMeans).code, 'normotension');
equal(core.assignPhenotype(goodScope, goodQuality, high, normalMeans).code, 'white-coat');
equal(core.assignPhenotype(goodScope, goodQuality, below, abnormalMeans).code, 'masked');
equal(core.assignPhenotype(goodScope, goodQuality, high, abnormalMeans).code, 'ambulatory-hypertension');
equal(core.assignPhenotype(goodScope, goodQuality, elevated, normalMeans).code, 'office-elevated-abpm-normal');
equal(core.assignPhenotype(goodScope, unknownDiary, below, normalMeans).code, 'quality-review');
equal(core.assignPhenotype(goodScope, failedDiary, below, normalMeans).code, 'withheld');
equal(core.assignPhenotype(scope(adolescentAge(), { treatmentContext: 'active' }), goodQuality, high, abnormalMeans).code, 'treated-context');
equal(core.assignPhenotype(scope(adolescentAge(), { treatmentContext: 'unknown' }), goodQuality, high, abnormalMeans).code, 'treatment-unknown');
equal(core.assignPhenotype(scope(adolescentAge(), { treatmentContext: '' }), goodQuality, high, abnormalMeans).code, 'treatment-unknown');
equal(core.assignPhenotype(scope(adolescentAge(), { outpatientStable: 'not-documented' }), goodQuality, below, normalMeans).code, 'withheld');
equal(scope(adolescentAge(), { noAcuteConcern: 'not-met' }).eligibleForComparison, false);

// Dipping classification is descriptive and separate from phenotype logic.
const normalDip = core.calculateDipping({ h24: { sbp: 120, dbp: 70 }, wake: { sbp: 120, dbp: 80 }, sleep: { sbp: 108, dbp: 76 } });
equal(normalDip.sbpCategory, 'typical 10–20% dipping');
equal(normalDip.dbpCategory, 'non-dipping');
equal(core.calculateDipping({ wake: { sbp: 120, dbp: 80 }, sleep: { sbp: 121, dbp: 81 } }).sbpCategory, 'reverse dipping');
equal(core.assignPhenotype(goodScope, goodQuality, below, normalMeans).code, 'normotension');

// High-risk context must not modify thresholds or emit medication advice, but
// CKD must explicitly avoid a fake MAP inference.
const ckdNext = core.nextStep(goodScope, goodQuality, high, abnormalMeans, core.assignPhenotype(goodScope, goodQuality, high, abnormalMeans), 'ckd');
includes(ckdNext.text, 'KDIGO MAP target is not calculated');
ok(!/start medication|medication indicated|increase dose|decrease dose/i.test(ckdNext.text + ' ' + ckdNext.actions.join(' ')));
equal(core.nextStep(goodScope, goodQuality, elevated, normalMeans, core.assignPhenotype(goodScope, goodQuality, elevated, normalMeans), 'none').tone, 'review');

console.log('pediatric-abpm-core: ' + assertions + ' adversarial assertions passed');
