/*
 * Pediatric ABPM report-summary comparator
 *
 * A deliberately small, deterministic clinical-decision-support core.
 * It accepts report-level means only; it does not ingest or alter raw ABPM
 * readings, store data, call a network service, diagnose a patient, triage an
 * acute complaint, or select treatment.
 */
(function(root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.PediatricABPMCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
    'use strict';

    const VERSION = 'AHA-2022-pediatric-ABPM-summary-v1.1.0';
    const RULESET_ID = 'pediatric-abpm-report-summary-v1.1.0';
    // SHA-256 of the canonical, human-readable rule file. Verified in the
    // adversarial fixture suite so the UI cannot silently drift from it.
    const RULESET_SHA256 = '4e1a9b2802caf6ceb7676030bb73b1979004d061273fd9aaca02e5753617e116';
    const ADULT_CUTOFFS = Object.freeze({
        h24: Object.freeze({ sbp: 125, dbp: 75 }),
        wake: Object.freeze({ sbp: 130, dbp: 80 }),
        sleep: Object.freeze({ sbp: 110, dbp: 65 })
    });
    const PERIODS = Object.freeze(['h24', 'wake', 'sleep']);
    const COMPONENTS = Object.freeze(['sbp', 'dbp']);
    const REFERENCE_HEIGHT_LIMITS_CM = Object.freeze({
        female: Object.freeze({ min: 120, max: 175 }),
        male: Object.freeze({ min: 120, max: 185 })
    });

    function number(value) {
        if (typeof value === 'string' && value.trim() === '') return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function isInteger(value) {
        return Number.isInteger(value);
    }

    function issue(code, message, severity) {
        return { code: code, message: message, severity: severity || 'blocker' };
    }

    function messages(items) {
        return items.map(function(item) { return item.message; });
    }

    function periodData(source, period) {
        if (!source) return null;
        // `day` is read only for backward-compatible, non-UI callers. The
        // public contract uses `h24`, avoiding the ambiguous word “day.”
        return source[period] || (period === 'h24' ? source.day : null) || null;
    }

    function evidence(value) {
        if (value === true || value === 'confirmed' || value === 'within5') return 'confirmed';
        if (value === false || value === 'not-met' || value === 'outside5') return 'not-met';
        return 'not-documented';
    }

    function parseDate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
        const parts = value.split('-').map(Number);
        const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        if (date.getUTCFullYear() !== parts[0] || date.getUTCMonth() !== parts[1] - 1 || date.getUTCDate() !== parts[2]) return null;
        return date;
    }

    // Kept for legacy callers and exact-date fixture testing. The public UI
    // intentionally uses completed age (years + months), not DOB or study date.
    function ageOnStudyDate(dobValue, studyValue) {
        const dob = parseDate(dobValue);
        const study = parseDate(studyValue);
        if (!dob || !study || study < dob) return null;
        let years = study.getUTCFullYear() - dob.getUTCFullYear();
        const studyMonth = study.getUTCMonth();
        const dobMonth = dob.getUTCMonth();
        const studyDay = study.getUTCDate();
        const dobDay = dob.getUTCDate();
        if (studyMonth < dobMonth || (studyMonth === dobMonth && studyDay < dobDay)) years -= 1;
        let months = (studyMonth - dobMonth + 12) % 12;
        if (studyDay < dobDay) months = (months + 11) % 12;
        const now = new Date();
        const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        return { years: years, months: months, exact13OrOlder: years >= 13, futureStudy: study.getTime() > todayUtc };
    }

    function ageFromCompletedAge(yearValue, monthValue) {
        const years = number(yearValue);
        const months = monthValue === null || monthValue === undefined || monthValue === '' ? 0 : number(monthValue);
        if (!isInteger(years) || !isInteger(months) || years < 0 || months < 0 || months > 11) return null;
        return { years: years, months: months, exact13OrOlder: years >= 13, futureStudy: false };
    }

    function validateScope(input) {
        const blockers = [];
        const flags = [];
        const age = input && input.age;
        if (!age || !isInteger(age.years) || !isInteger(age.months) || age.months < 0 || age.months > 11) {
            blockers.push(issue('age-missing', 'Enter completed age in whole years and months at the start of the ABPM study. Do not enter a date of birth or study date.', 'scope'));
        } else if (age.years < 5 || age.years >= 18) {
            blockers.push(issue('age-out-of-scope', 'This report-summary pathway supports outpatient patients age 5 to <18 years only. Under-13 use also requires a height within the supported reference range.', 'scope'));
        }
        if (age && age.futureStudy) blockers.push(issue('future-study', 'The ABPM study date is in the future; enter a completed study before interpretation.', 'scope'));

        const setting = input && input.specialContext;
        if (setting !== 'none') blockers.push(issue('setting-out-of-scope', 'This pathway is limited to stable outpatient ABPM. Inpatient, acute, pregnancy, and other special settings require the local clinical process.', 'scope'));

        const stable = evidence(input && input.outpatientStable);
        if (stable !== 'confirmed') blockers.push(issue(stable === 'not-met' ? 'not-stable-outpatient' : 'outpatient-not-documented', stable === 'not-met' ? 'A stable outpatient setting was not confirmed. Do not use this report-summary pathway for a final interpretation.' : 'Stable outpatient context is not documented. Confirm the care setting before using this pathway.', 'scope'));

        const noAcuteConcern = evidence(input && input.noAcuteConcern);
        if (noAcuteConcern !== 'confirmed') blockers.push(issue(noAcuteConcern === 'not-met' ? 'acute-concern' : 'acute-concern-not-documented', noAcuteConcern === 'not-met' ? 'STOP: an acute or symptomatic concern is present or not cleared. Do not use ABPM averages for triage; use the local urgent/emergency clinical process.' : 'Whether an acute or symptomatic concern is absent is not documented. Do not use this page for triage; confirm safe scope before proceeding.', 'scope'));

        const treatmentStatus = input && input.treatmentContext;
        const treated = treatmentStatus === 'active';
        const treatmentUncertain = treatmentStatus !== 'none' && treatmentStatus !== 'active';
        if (treatmentUncertain) flags.push(issue('treatment-not-documented', 'Antihypertensive treatment status during the recording is not documented; a diagnostic phenotype will be withheld.', 'review'));
        if (input && input.indication === 'treated hypertension review' && treatmentStatus === 'none') flags.push(issue('treatment-indication-discordance', 'The selected indication is treated-hypertension review but treatment is marked absent; verify the treatment context.', 'review'));

        return {
            eligibleForComparison: blockers.length === 0,
            eligibleForPhenotype: blockers.length === 0 && treatmentStatus === 'none',
            treatmentContext: treated,
            treatmentUncertain: treatmentUncertain,
            blockers: blockers,
            reasons: messages(blockers),
            flags: flags,
            riskContext: input && input.riskContext ? input.riskContext : 'not-documented'
        };
    }

    function validateStudy(input) {
        const hardIssues = [];
        const reviewIssues = [];
        const flags = [];
        const duration = number(input && input.durationHours);
        const attempted = number(input && input.attemptedReadings);
        const successful = number(input && input.successfulReadings);

        if (duration === null || duration <= 0) hardIssues.push(issue('duration-missing', 'Enter the recording duration in hours.'));
        if (attempted === null || attempted <= 0 || !isInteger(attempted)) hardIssues.push(issue('attempted-missing', 'Enter a positive whole number of attempted readings.'));
        if (successful === null || successful < 0 || !isInteger(successful)) hardIssues.push(issue('successful-missing', 'Enter a whole number of successful readings.'));
        if (attempted !== null && successful !== null && successful > attempted) hardIssues.push(issue('successful-exceeds-attempted', 'Successful readings cannot exceed attempted readings.'));

        const completionRate = attempted && successful !== null ? successful / attempted : null;
        if (duration !== null && duration < 18) hardIssues.push(issue('duration-under-18', 'Recording duration is under 18 hours; do not assign an automated phenotype from this study.'));
        if (duration !== null && duration > 30) hardIssues.push(issue('duration-over-30', 'Recording duration is over 30 hours and outside this single-24-hour report-summary pathway.'));
        if (duration !== null && successful !== null && duration >= 18 && successful < Math.ceil(duration)) hardIssues.push(issue('hourly-reading-shortfall', 'Successful-reading count is below the minimum implied by at least one reading per recorded hour.'));
        if (completionRate !== null && completionRate < 0.70) hardIssues.push(issue('completion-under-70', 'Fewer than 70% of attempted readings were successful; do not assign an automated phenotype from this study.'));

        function requireEvidence(key, label, code) {
            const state = evidence(input && input[key]);
            if (state === 'not-met') hardIssues.push(issue(code + '-not-met', label + ' was not met. Do not assign an automated phenotype from this report-summary entry.'));
            if (state === 'not-documented') reviewIssues.push(issue(code + '-not-documented', label + ' is not documented. Review the complete report before assigning an automated phenotype.', 'review'));
            return state;
        }

        const deviceType = input && input.deviceType;
        if (deviceType === 'cuffless' || deviceType === 'home') hardIssues.push(issue('device-out-of-scope', 'Cuffless, wearable, and home devices are outside this cuff-based ABPM report-summary pathway.'));
        else if (deviceType !== 'validated-cuff-abpm') reviewIssues.push(issue('device-type-not-documented', 'A validated cuff-based ABPM device is not documented. Review the device and report before assigning an automated phenotype.', 'review'));

        requireEvidence('deviceValidated', 'Validated device model and pediatric use', 'device-validation');
        requireEvidence('cuffAndArmVerified', 'Appropriate cuff size and arm placement', 'cuff-arm');
        requireEvidence('sleepCaptured', 'Sleep capture', 'sleep');
        requireEvidence('diaryReviewed', 'Diary-derived wake and sleep periods', 'diary');
        requireEvidence('oneReadingPerHour', 'At least one reading per hour including sleep', 'hourly-reading');
        requireEvidence('applicationCheck', 'Same-arm application comparison within 5 mm Hg', 'application-check');
        requireEvidence('exclusionsReviewed', 'Review of post-application, activity-marked, and implausible readings in the source report', 'exclusions');

        const cadence = evidence(input && input.cadenceConfirmed);
        if (cadence === 'not-documented') flags.push(issue('cadence-not-documented', 'Standard ABPM programming cadence (15–20 minutes wake and 20–30 minutes sleep) was not documented; review the complete report.', 'review'));
        if (cadence === 'not-met') flags.push(issue('cadence-not-met', 'Reported programming cadence was outside the usual AHA range; review the complete report.', 'review'));

        if (duration !== null && duration >= 18 && duration < 20) flags.push(issue('duration-18-to-20', '18–<20 hours can be acceptable when sleep is captured; clinician review is still needed.', 'review'));
        if (successful !== null && successful < 40) flags.push(issue('fewer-than-40-readings', 'Fewer than 40 successful readings: below the usual 40–50 reading range; review the complete report.', 'review'));
        if (evidence(input && input.rawDataAudited) !== 'confirmed') flags.push(issue('summary-only', 'Summary-only entry: raw readings and exclusion decisions were not independently audited in this tool.', 'review'));

        const requiredStates = ['deviceValidated', 'cuffAndArmVerified', 'sleepCaptured', 'diaryReviewed', 'oneReadingPerHour', 'applicationCheck', 'exclusionsReviewed'].map(function(key) { return evidence(input && input[key]); });
        const confirmedItems = requiredStates.filter(function(state) { return state === 'confirmed'; }).length;
        let status = 'interpretable';
        if (hardIssues.length) status = 'insufficient';
        else if (reviewIssues.length) status = 'review-required';
        else if (flags.length) status = 'interpretable-with-review';

        return {
            status: status,
            eligibleForComparison: hardIssues.length === 0,
            eligibleForPhenotype: hardIssues.length === 0 && reviewIssues.length === 0,
            completionRate: completionRate,
            completeness: { confirmed: confirmedItems, required: requiredStates.length, percent: Math.round((confirmedItems / requiredStates.length) * 100) },
            hardIssues: hardIssues,
            reviewIssues: reviewIssues,
            blockers: messages(hardIssues),
            reviewReasons: messages(reviewIssues),
            flags: messages(flags),
            flagIssues: flags,
            issues: hardIssues.concat(reviewIssues, flags)
        };
    }

    function buildThresholds(age, pediatricInput) {
        const issues = [];
        const thresholds = {};
        const thresholdDetails = {};
        if (!age || !isInteger(age.years)) return { thresholds: null, thresholdDetails: null, issues: [issue('age-required-for-thresholds', 'A valid completed age is required before thresholds can be selected.')], errors: ['A valid completed age is required before thresholds can be selected.'], mode: null };

        if (age.years >= 13) {
            PERIODS.forEach(function(period) {
                thresholds[period] = {};
                thresholdDetails[period] = {};
                COMPONENTS.forEach(function(component) {
                    const fixed = ADULT_CUTOFFS[period][component];
                    thresholds[period][component] = fixed;
                    thresholdDetails[period][component] = { threshold: fixed, fixed: fixed, reportP95: null, source: 'AHA-fixed', sourceLabel: 'AHA fixed threshold' };
                });
            });
            return { thresholds: thresholds, thresholdDetails: thresholdDetails, issues: issues, errors: messages(issues), mode: 'adolescent-fixed' };
        }

        const referenceDataset = pediatricInput && pediatricInput.referenceDataset;
        const heightCm = number(pediatricInput && pediatricInput.heightCm);
        const pediatricP95 = pediatricInput && pediatricInput.p95 ? pediatricInput.p95 : pediatricInput;
        const provenance = evidence(pediatricInput && (pediatricInput.reportP95Provenance || pediatricInput.reportP95ProvenanceConfirmed));
        if (provenance !== 'confirmed') issues.push(issue(provenance === 'not-met' ? 'p95-provenance-not-met' : 'p95-provenance-not-documented', provenance === 'not-met' ? 'The under-13 thresholds were not transcribed from the ABPM report’s validated Wühl-based 95th-percentile reference.' : 'Confirm the source and provenance of the under-13 report p95 thresholds before comparing means.'));
        if (referenceDataset !== 'male' && referenceDataset !== 'female') {
            issues.push(issue('reference-dataset-missing', 'Select the male or female Wühl reference dataset identified by the validated pediatric report.'));
        } else {
            const limit = REFERENCE_HEIGHT_LIMITS_CM[referenceDataset];
            if (heightCm === null) issues.push(issue('height-missing', 'Enter the height used by the under-13 ABPM report so the reference-domain check can be performed.'));
            else if (heightCm < limit.min || heightCm > limit.max) issues.push(issue('height-out-of-reference-range', 'The entered height is outside the supported ' + referenceDataset + ' Wühl reference range of ' + limit.min + '–' + limit.max + ' cm. Do not extrapolate this pathway.'));
        }

        PERIODS.forEach(function(period) {
            thresholds[period] = {};
            thresholdDetails[period] = {};
            COMPONENTS.forEach(function(component) {
                const sourcePeriod = periodData(pediatricP95, period);
                const reportP95 = number(sourcePeriod && sourcePeriod[component]);
                const lowerBound = component === 'sbp' ? 60 : 35;
                const upperBound = component === 'sbp' ? 220 : 120;
                if (reportP95 === null || reportP95 < lowerBound || reportP95 > upperBound) {
                    issues.push(issue('p95-' + period + '-' + component, 'Enter the report’s validated pediatric 95th-percentile ' + displayPeriod(period) + ' ' + component.toUpperCase() + ' threshold.'));
                    return;
                }
                const fixed = ADULT_CUTOFFS[period][component];
                const threshold = Math.min(reportP95, fixed);
                let source = 'report-p95';
                let sourceLabel = 'Report p95';
                if (reportP95 > fixed) {
                    source = 'AHA-fixed-clamped';
                    sourceLabel = 'AHA fixed — clamped from ' + reportP95.toFixed(1);
                } else if (reportP95 === fixed) {
                    source = 'report-p95-equals-AHA-fixed';
                    sourceLabel = 'Report p95 = AHA fixed';
                }
                thresholds[period][component] = threshold;
                thresholdDetails[period][component] = { threshold: threshold, fixed: fixed, reportP95: reportP95, source: source, sourceLabel: sourceLabel };
            });
            const sourcePeriod = periodData(pediatricP95, period);
            const sbp = number(sourcePeriod && sourcePeriod.sbp);
            const dbp = number(sourcePeriod && sourcePeriod.dbp);
            if (sbp !== null && dbp !== null && sbp <= dbp) issues.push(issue('p95-' + period + '-pair', 'The report’s validated pediatric 95th-percentile ' + displayPeriod(period) + ' SBP must exceed DBP.'));
        });
        return { thresholds: issues.length ? null : thresholds, thresholdDetails: issues.length ? null : thresholdDetails, issues: issues, errors: messages(issues), mode: 'pediatric-lower-of-p95-or-fixed' };
    }

    function evaluateMeans(means, thresholds, thresholdDetails) {
        const issues = [];
        const flags = [];
        const comparisons = [];
        if (!thresholds) {
            const missing = issue('thresholds-unavailable', 'Applicable thresholds are not available.');
            return { status: null, comparisons: comparisons, issues: [missing], errors: [missing.message], flags: [], drivers: [], pattern: null };
        }

        PERIODS.forEach(function(period) {
            COMPONENTS.forEach(function(component) {
                const current = periodData(thresholds, period);
                const threshold = number(current && current[component]);
                const lowerBound = component === 'sbp' ? 60 : 35;
                const upperBound = component === 'sbp' ? 220 : 120;
                if (threshold === null || threshold < lowerBound || threshold > upperBound) issues.push(issue('threshold-' + period + '-' + component, 'A valid ' + displayPeriod(period) + ' ' + component.toUpperCase() + ' threshold is required before means can be compared.'));
            });
            const current = periodData(thresholds, period);
            const thresholdSbp = number(current && current.sbp);
            const thresholdDbp = number(current && current.dbp);
            if (thresholdSbp !== null && thresholdDbp !== null && thresholdSbp <= thresholdDbp) issues.push(issue('threshold-' + period + '-pair', 'The ' + displayPeriod(period) + ' SBP threshold must exceed the DBP threshold.'));
        });
        if (issues.length) return { status: null, comparisons: comparisons, issues: issues, errors: messages(issues), flags: [], drivers: [], pattern: null };

        PERIODS.forEach(function(period) {
            COMPONENTS.forEach(function(component) {
                const meanPeriod = periodData(means, period);
                const mean = number(meanPeriod && meanPeriod[component]);
                const lowerBound = component === 'sbp' ? 60 : 35;
                const upperBound = component === 'sbp' ? 220 : 120;
                if (mean === null || mean < lowerBound || mean > upperBound) {
                    issues.push(issue('mean-' + period + '-' + component, 'Enter a valid ' + displayPeriod(period) + ' mean ' + component.toUpperCase() + ' in mm Hg.'));
                    return;
                }
                const threshold = periodData(thresholds, period)[component];
                const detail = thresholdDetails && periodData(thresholdDetails, period) ? periodData(thresholdDetails, period)[component] : null;
                comparisons.push({
                    period: period,
                    component: component,
                    mean: mean,
                    threshold: threshold,
                    thresholdDetail: detail || { threshold: threshold, fixed: null, reportP95: null, source: 'unspecified', sourceLabel: 'Not specified' },
                    abnormal: mean >= threshold,
                    difference: mean - threshold
                });
            });
        });
        PERIODS.forEach(function(period) {
            const meanPeriod = periodData(means, period);
            const sbp = number(meanPeriod && meanPeriod.sbp);
            const dbp = number(meanPeriod && meanPeriod.dbp);
            if (sbp !== null && dbp !== null && sbp <= dbp) issues.push(issue('mean-' + period + '-pair', 'The ' + displayPeriod(period) + ' mean SBP must exceed DBP.'));
        });

        // This is intentionally a flag, not a validity criterion. A device may
        // include transition readings in the 24-hour mean but exclude them from
        // both diary-derived subsets.
        COMPONENTS.forEach(function(component) {
            const h24 = number(periodData(means, 'h24') && periodData(means, 'h24')[component]);
            const wake = number(periodData(means, 'wake') && periodData(means, 'wake')[component]);
            const sleep = number(periodData(means, 'sleep') && periodData(means, 'sleep')[component]);
            if ([h24, wake, sleep].every(function(item) { return item !== null; })) {
                const lower = Math.min(wake, sleep) - 1;
                const upper = Math.max(wake, sleep) + 1;
                if (h24 < lower || h24 > upper) flags.push(issue('h24-reconciliation-' + component, 'The 24-hour ' + component.toUpperCase() + ' mean falls outside the wake/sleep range (±1 mm Hg). This is a report reconciliation flag, not a phenotype blocker.', 'review'));
            }
        });

        const abnormal = comparisons.some(function(item) { return item.abnormal; });
        const drivers = comparisons.filter(function(item) { return item.abnormal; });
        return {
            status: issues.length ? null : (abnormal ? 'abnormal' : 'normal'),
            comparisons: comparisons,
            issues: issues,
            errors: messages(issues),
            flags: messages(flags),
            flagIssues: flags,
            drivers: drivers,
            pattern: classifyPattern(drivers)
        };
    }

    function getOfficeStatus(input, age) {
        if (!input || evidence(input.confirmed) !== 'confirmed') return { status: 'unavailable', phenotypeStatus: null, message: 'Office BP is not confirmed for phenotype assignment.' };
        if (!age || !isInteger(age.years)) return { status: 'unavailable', phenotypeStatus: null, message: 'A valid completed age is required before office status can be used.' };

        if (age.years < 13) {
            const selected = input.under13Status;
            if (selected === 'hypertensive') return { status: 'hypertensive', phenotypeStatus: true, message: 'Confirmed office BP at or above the 95th percentile.' };
            if (selected === 'elevated') return { status: 'elevated', phenotypeStatus: false, message: 'Confirmed office BP is elevated but below the 95th-percentile hypertension threshold.' };
            if (selected === 'below') return { status: 'below-hypertensive-threshold', phenotypeStatus: false, message: 'Confirmed office BP is below the 95th-percentile hypertension threshold.' };
            return { status: 'unavailable', phenotypeStatus: null, message: 'Select the confirmed under-13 office BP status.' };
        }

        const sbp = number(input.sbp);
        const dbp = number(input.dbp);
        if (sbp === null || dbp === null || sbp < 60 || sbp > 220 || dbp < 35 || dbp > 120 || sbp <= dbp) return { status: 'unavailable', phenotypeStatus: null, message: 'Enter a plausible confirmed office SBP and DBP for an adolescent; this pathway is not for acute triage.' };
        if (sbp >= 130 || dbp >= 80) return { status: 'hypertensive', phenotypeStatus: true, message: 'Confirmed office BP is in the ≥130/80 mm Hg hypertensive range.' };
        if (sbp >= 120 && sbp < 130 && dbp < 80) return { status: 'elevated', phenotypeStatus: false, message: 'Confirmed office BP is elevated but below the ≥130/80 mm Hg hypertension threshold.' };
        return { status: 'below-hypertensive-threshold', phenotypeStatus: false, message: 'Confirmed office BP is below the ≥130/80 mm Hg hypertension threshold.' };
    }

    function calculateDipping(means) {
        const wakeSbp = number(periodData(means, 'wake') && periodData(means, 'wake').sbp);
        const sleepSbp = number(periodData(means, 'sleep') && periodData(means, 'sleep').sbp);
        const wakeDbp = number(periodData(means, 'wake') && periodData(means, 'wake').dbp);
        const sleepDbp = number(periodData(means, 'sleep') && periodData(means, 'sleep').dbp);
        if ([wakeSbp, sleepSbp, wakeDbp, sleepDbp].some(function(value) { return value === null || value <= 0; })) return null;
        const sbp = ((wakeSbp - sleepSbp) / wakeSbp) * 100;
        const dbp = ((wakeDbp - sleepDbp) / wakeDbp) * 100;
        return {
            sbp: sbp,
            dbp: dbp,
            sbpCategory: dippingCategory(sbp),
            dbpCategory: dippingCategory(dbp)
        };
    }

    function dippingCategory(percent) {
        if (percent < 0) return 'reverse dipping';
        if (percent < 10) return 'non-dipping';
        if (percent <= 20) return 'typical 10–20% dipping';
        return 'greater-than-20% dipping';
    }

    function classifyPattern(drivers) {
        if (!drivers || !drivers.length) return { code: 'none', label: 'No elevated ABPM mean pattern' };
        const periods = Array.from(new Set(drivers.map(function(item) { return item.period; })));
        const components = Array.from(new Set(drivers.map(function(item) { return item.component.toUpperCase(); })));
        let code = 'mixed';
        let label = 'Mixed affected-period pattern';
        if (periods.length === 1 && periods[0] === 'sleep') { code = 'isolated-nocturnal'; label = 'Isolated nocturnal pattern'; }
        else if (periods.length === 1 && periods[0] === 'wake') { code = 'isolated-wake'; label = 'Isolated wake pattern'; }
        else if (periods.length === 1 && periods[0] === 'h24') { code = 'h24-only'; label = '24-hour-only pattern'; }
        else if (periods.indexOf('wake') >= 0 && periods.indexOf('sleep') >= 0) { code = 'wake-and-sleep'; label = 'Combined wake and sleep pattern'; }
        else if (periods.indexOf('sleep') >= 0 && periods.indexOf('h24') >= 0) { code = 'sleep-predominant'; label = 'Sleep-predominant pattern'; }
        else if (periods.indexOf('wake') >= 0 && periods.indexOf('h24') >= 0) { code = 'wake-predominant'; label = 'Wake-predominant pattern'; }
        return { code: code, label: label, periods: periods, components: components };
    }

    function assignPhenotype(scope, quality, office, meansEvaluation) {
        if (!scope || !scope.eligibleForComparison) return { code: 'withheld', title: 'Comparison withheld — out of scope', reason: messages((scope && scope.blockers) || []).join(' ') || (scope && scope.reasons || []).join(' ') };
        if (!quality || !quality.eligibleForComparison) return { code: 'withheld', title: 'Phenotype withheld — study is inadequate', reason: (quality && quality.blockers || []).join(' ') };
        if (!quality.eligibleForPhenotype) return { code: 'quality-review', title: 'Automated phenotype withheld — quality review required', reason: (quality.reviewReasons || []).join(' ') || 'The required study-quality evidence is incomplete.' };
        if (scope.treatmentContext) return { code: 'treated-context', title: 'Treated-monitoring context', reason: 'Threshold comparisons may be reviewed, but this preview does not assign a diagnostic phenotype during active antihypertensive treatment.' };
        if (scope.treatmentUncertain) return { code: 'treatment-unknown', title: 'Treatment context unconfirmed', reason: 'Threshold comparisons may be reviewed, but this preview withholds a diagnostic phenotype until treatment status during the recording is confirmed.' };
        if (!meansEvaluation || !meansEvaluation.status) return { code: 'withheld', title: 'Phenotype withheld — ABPM means are incomplete', reason: (meansEvaluation && meansEvaluation.errors || []).join(' ') };
        if (!office || typeof office.phenotypeStatus !== 'boolean') return { code: 'office-unavailable', title: 'ABPM status available; phenotype not assigned', reason: 'Verify a qualifying office BP status to distinguish normotension, white-coat, masked, and ambulatory hypertension.' };

        if (!office.phenotypeStatus && meansEvaluation.status === 'normal') {
            if (office.status === 'elevated') return { code: 'office-elevated-abpm-normal', title: 'Normal ABPM comparison; elevated office-BP context', reason: 'All ABPM means are below applicable thresholds, but the confirmed office BP remains elevated and needs its own office-BP follow-up pathway.' };
            return { code: 'normotension', title: 'Normotension phenotype', reason: 'Office BP is below the hypertension threshold and all ABPM means are below applicable thresholds.' };
        }
        if (office.phenotypeStatus && meansEvaluation.status === 'normal') return { code: 'white-coat', title: 'White-coat hypertension phenotype', reason: 'Office BP is in the hypertensive range while all ABPM means are below applicable thresholds.' };
        if (!office.phenotypeStatus && meansEvaluation.status === 'abnormal') return { code: 'masked', title: 'Masked hypertension phenotype', reason: 'Office BP is below the hypertension threshold and at least one ABPM mean meets or exceeds its threshold.' };
        return { code: 'ambulatory-hypertension', title: 'Ambulatory hypertension phenotype', reason: 'Office BP is in the hypertensive range and at least one ABPM mean meets or exceeds its threshold.' };
    }

    function riskContextText(riskContext) {
        const labels = {
            ckd: 'CKD was selected. A KDIGO MAP target is not calculated in this summary-only preview; do not infer CKD target attainment from this result.',
            transplant: 'Transplant history was selected; use patient-specific specialist review.',
            'repaired-coarctation': 'Repaired coarctation was selected; use patient-specific specialist review.',
            diabetes: 'Diabetes was selected; use patient-specific risk review.',
            'osa-obesity': 'OSA/severe obesity was selected; use patient-specific risk review.',
            'sickle-cell-lupus': 'Sickle-cell disease/lupus was selected; use patient-specific risk review.',
            other: 'A high-risk context was selected; use patient-specific specialist review.',
            unknown: 'Risk context is not documented; confirm it during clinical review.'
        };
        if (riskContext === true) return 'A high-risk context was selected; use patient-specific specialist review.';
        return labels[riskContext] || '';
    }

    function nextStep(scope, quality, office, evaluation, phenotype, riskContext) {
        const extra = riskContextText(riskContext);
        const withRisk = function(text) { return extra ? text + ' ' + extra : text; };
        if (!scope || !scope.eligibleForComparison) return {
            tone: 'caution',
            title: 'Do not use this pathway for a final interpretation',
            text: 'Use the complete clinical context and appropriate local/specialist workflow. This preview does not cover the selected setting or age.',
            actions: ['Do not assign a normal ABPM result or phenotype from this tool.', 'Use local acute, inpatient, or special-population processes as appropriate.']
        };
        if (!quality || !quality.eligibleForComparison) return {
            tone: 'caution',
            title: 'Repeat or clinician-review the ABPM study before phenotype assignment',
            text: 'The summary does not meet the minimum quality criteria for this pathway.',
            actions: ['Review the complete ABPM report, diary, device/cuff setup, and exclusions.', 'Do not document normotension, white-coat, masked, or ambulatory hypertension from this tool until the quality gate is satisfied.']
        };
        if (phenotype && phenotype.code === 'quality-review') return {
            tone: 'review',
            title: 'Complete the quality review before automated phenotype assignment',
            text: 'The summary can be compared, but one or more essential quality items are not documented.',
            actions: ['Verify the listed items in the complete ABPM report rather than assuming they were normal.', 'Document a clinician-reviewed interpretation only after the missing evidence is resolved.']
        };
        if (!phenotype || phenotype.code === 'withheld') return {
            tone: 'caution',
            title: 'Phenotype withheld — complete the blocked review',
            text: 'This page cannot produce a final office–ambulatory phenotype until the stated blocking condition is resolved.',
            actions: ['Review the stated blocking condition and the complete ABPM report.', 'Do not use this page to document a normal, white-coat, masked, or ambulatory hypertension phenotype.']
        };
        if (phenotype.code === 'treated-context') return {
            tone: 'review',
            title: 'Treated-monitoring context — pediatric hypertension review',
            text: withRisk('Threshold comparisons are shown, but a diagnostic phenotype is intentionally withheld during active antihypertensive treatment.'),
            actions: ['Review adherence, treatment timing, ABPM quality, and patient-specific risk context with the treating clinician.', 'Do not use this tool to select, start, stop, or dose medication.']
        };
        if (phenotype.code === 'treatment-unknown') return {
            tone: 'review',
            title: 'Confirm treatment context before phenotype assignment',
            text: 'Threshold comparisons are shown, but treatment status during the recording was not confirmed.',
            actions: ['Confirm whether antihypertensive medication was active or changed during the recording.', 'Do not use this page to document a diagnostic phenotype until that context is known.']
        };
        if (phenotype.code === 'office-unavailable') return {
            tone: 'review',
            title: 'Complete the office-BP bridge',
            text: withRisk('The ABPM mean comparison is available, but office BP was not sufficient to assign an office–ambulatory phenotype.'),
            actions: ['Obtain or verify a qualifying office BP assessment.', 'Interpret any elevated office BP under the office-BP workflow; do not treat an ABPM-normal comparison as an all-clear result.']
        };
        if (phenotype.code === 'office-elevated-abpm-normal') return {
            tone: 'review',
            title: 'Continue the office-BP follow-up pathway',
            text: withRisk('The ABPM comparison is normal, but the qualifying office BP is elevated rather than below the office-BP screening threshold.'),
            actions: ['Document the normal ABPM comparison and the elevated office-BP context separately.', 'Continue office-BP follow-up under the treating team/local AAP office-BP pathway; do not present this as an all-clear result.']
        };
        if (phenotype.code === 'normotension') return {
            tone: 'routine',
            title: 'Document the ABPM comparison and continue context-specific follow-up',
            text: withRisk('All applicable means are below threshold and the office BP bridge is below the hypertension threshold.'),
            actions: ['Document ABPM quality, diary use, applicable thresholds, and office context.', 'Continue office-BP and risk-factor follow-up according to the treating team/local pathway.']
        };
        if (phenotype.code === 'white-coat') return {
            tone: 'review',
            title: 'Pediatric hypertension review for white-coat phenotype',
            text: withRisk('The phenotype reflects a hypertensive-range office BP with normal ABPM means.'),
            actions: ['Document the phenotype and retain a plan for office-BP follow-up/repeat ABPM based on risk and local policy.', 'Do not use this tool to select medication or a dosing plan.']
        };
        if (phenotype.code === 'masked') return {
            tone: 'alert',
            title: 'Pediatric hypertension review for masked phenotype',
            text: withRisk('At least one ABPM mean is at or above threshold despite office BP below the hypertension threshold.'),
            actions: ['Review the complete report and clinical context with a pediatric hypertension clinician.', 'Use local evaluation and follow-up processes; this page does not prescribe a work-up or medication.']
        };
        return {
            tone: 'alert',
            title: 'Pediatric hypertension review for ambulatory hypertension phenotype',
            text: withRisk('Office BP is in the hypertensive range and at least one ABPM mean is at or above threshold.'),
            actions: ['Review the complete report, indication, and patient-specific risk factors with a pediatric hypertension clinician.', 'Use local evaluation and management processes; this page does not prescribe a work-up, medication, or dose.']
        };
    }

    function displayPeriod(period) {
        return period === 'h24' ? '24-hour' : period;
    }

    function formatDrivers(drivers) {
        if (!drivers || !drivers.length) return 'None';
        return drivers.map(function(item) {
            return displayPeriod(item.period) + ' ' + item.component.toUpperCase() + ' ' + item.mean.toFixed(1) + ' ≥ ' + item.threshold.toFixed(1);
        }).join('; ');
    }

    return {
        VERSION: VERSION,
        RULESET_ID: RULESET_ID,
        RULESET_SHA256: RULESET_SHA256,
        ADULT_CUTOFFS: ADULT_CUTOFFS,
        PERIODS: PERIODS,
        COMPONENTS: COMPONENTS,
        REFERENCE_HEIGHT_LIMITS_CM: REFERENCE_HEIGHT_LIMITS_CM,
        ageOnStudyDate: ageOnStudyDate,
        ageFromCompletedAge: ageFromCompletedAge,
        validateScope: validateScope,
        validateStudy: validateStudy,
        buildThresholds: buildThresholds,
        evaluateMeans: evaluateMeans,
        getOfficeStatus: getOfficeStatus,
        calculateDipping: calculateDipping,
        classifyPattern: classifyPattern,
        assignPhenotype: assignPhenotype,
        nextStep: nextStep,
        displayPeriod: displayPeriod,
        formatDrivers: formatDrivers
    };
});
