/*
 * Pediatric ABPM report-summary comparator
 * AHA 2022 pediatric ABPM classification support.
 *
 * This deliberately accepts report-level means only. It does not ingest,
 * clean, or infer raw ABPM signals. The module is browser-local and has no
 * network, storage, or analytics behavior.
 */
(function(root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.PediatricABPMCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
    'use strict';

    const VERSION = 'AHA-2022-pediatric-ABPM-summary-v1.0';
    const ADULT_CUTOFFS = {
        day: { sbp: 125, dbp: 75 },
        wake: { sbp: 130, dbp: 80 },
        sleep: { sbp: 110, dbp: 65 }
    };
    const PERIODS = ['day', 'wake', 'sleep'];
    const COMPONENTS = ['sbp', 'dbp'];

    function number(value) {
        if (typeof value === 'string' && value.trim() === '') return null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function hasBoolean(value) {
        return value === true || value === false;
    }

    function parseDate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
        const parts = value.split('-').map(Number);
        const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
        if (date.getUTCFullYear() !== parts[0] || date.getUTCMonth() !== parts[1] - 1 || date.getUTCDate() !== parts[2]) return null;
        return date;
    }

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

    function validateScope(input) {
        const reasons = [];
        const age = input && input.age;
        if (!age || !Number.isInteger(age.years)) reasons.push('Enter a valid date of birth and ABPM study date.');
        else if (age.years < 5 || age.years >= 18) reasons.push('This v1 report comparator supports outpatient patients age 5 to <18 years only.');
        if (age && age.futureStudy) reasons.push('The ABPM study date is in the future; enter a completed study date before interpretation.');
        if (!input || input.outpatientStable !== true) reasons.push('This tool is limited to stable outpatient ABPM; inpatient, acute, and emergency contexts require local clinical care.');
        if (!input || input.noAcuteConcern !== true) reasons.push('STOP: an acute or symptomatic concern is not cleared. Do not use ABPM averages for triage; use the local urgent/emergency clinical process.');
        if (!input || input.specialContext !== 'none') reasons.push('The selected context is out of scope for this pediatric outpatient ABPM report comparator.');
        const treatmentStatus = input && input.treatmentContext;
        const treated = treatmentStatus === 'active';
        const treatmentUncertain = treatmentStatus !== 'none' && treatmentStatus !== 'active';
        return {
            eligibleForComparison: reasons.length === 0,
            eligibleForPhenotype: reasons.length === 0 && treatmentStatus === 'none',
            treatmentContext: treated,
            treatmentUncertain: treatmentUncertain,
            reasons: reasons
        };
    }

    function validateStudy(input) {
        const blockers = [];
        const flags = [];
        const duration = number(input && input.durationHours);
        const attempted = number(input && input.attemptedReadings);
        const successful = number(input && input.successfulReadings);

        if (duration === null || duration <= 0) blockers.push('Enter the recording duration in hours.');
        if (attempted === null || attempted <= 0 || !Number.isInteger(attempted)) blockers.push('Enter a positive whole number of attempted readings.');
        if (successful === null || successful < 0 || !Number.isInteger(successful)) blockers.push('Enter a whole number of successful readings.');
        if (attempted !== null && successful !== null && successful > attempted) blockers.push('Successful readings cannot exceed attempted readings.');

        const completionRate = attempted && successful !== null ? successful / attempted : null;
        if (duration !== null && duration < 18) blockers.push('Recording duration is under 18 hours; do not assign an ABPM phenotype from this study.');
        if (duration !== null && duration > 30) blockers.push('Recording duration is over 30 hours and outside this single-24-hour report-summary pathway.');
        if (duration !== null && successful !== null && duration >= 18 && successful < Math.ceil(duration)) blockers.push('Successful-reading count is below the minimum implied by at least one reading per recorded hour.');
        if (completionRate !== null && completionRate < 0.70) blockers.push('Fewer than 70% of attempted readings were successful; do not assign an ABPM phenotype from this study.');

        if (!input || input.sleepCaptured !== true) blockers.push('Sleep must be captured for this report-summary pathway.');
        if (!input || input.diaryReviewed !== true) blockers.push('Confirm diary-derived wake and sleep periods; fixed clock windows are not accepted.');
        if (!input || input.oneReadingPerHour !== true) blockers.push('Confirm at least one reading per hour, including sleep.');
        if (!input || input.deviceType !== 'validated-cuff-abpm' || input.deviceValidated !== true) blockers.push('Confirm a validated cuff-based ABPM device was used; cuffless and home devices are out of scope.');
        if (!input || input.cuffAndArmVerified !== true) blockers.push('Confirm appropriate cuff size and arm placement.');
        if (!input || input.applicationCheck !== 'within5') blockers.push('Confirm same-arm comparison with another validated clinic device using the same technique; the average of 3 values must be within 5 mm Hg before using this pathway.');
        if (!input || input.exclusionsReviewed !== true) blockers.push('Confirm that test readings, diary-marked vigorous activity, and implausible readings were reviewed in the source report.');

        if (duration !== null && duration >= 18 && duration < 20) flags.push('18–<20 hours can be acceptable when sleep is captured; clinician review is still needed.');
        if (successful !== null && successful < 40) flags.push('Fewer than 40 successful readings: below the usual 40–50 reading range; review the complete report.');
        if (!input || input.cadenceConfirmed !== true) flags.push('Standard ABPM programming cadence (15–20 minutes wake and 20–30 minutes sleep) was not confirmed; review the complete report.');
        if (input && input.rawDataAudited !== true) flags.push('Summary-only entry: raw readings and exclusions were not independently audited in this tool.');

        let status = 'insufficient';
        if (blockers.length === 0) status = flags.length ? 'interpretable-with-review' : 'interpretable';
        return {
            status: status,
            eligibleForPhenotype: blockers.length === 0,
            completionRate: completionRate,
            blockers: blockers,
            flags: flags
        };
    }

    function buildThresholds(age, pediatricInput) {
        const errors = [];
        const thresholds = {};
        if (!age || !Number.isInteger(age.years)) return { thresholds: null, errors: ['A valid age is required before thresholds can be selected.'], mode: null };

        if (age.years >= 13) {
            PERIODS.forEach(function(period) {
                thresholds[period] = { sbp: ADULT_CUTOFFS[period].sbp, dbp: ADULT_CUTOFFS[period].dbp };
            });
            return { thresholds: thresholds, errors: errors, mode: 'adolescent-fixed' };
        }

        const referenceDataset = pediatricInput && pediatricInput.referenceDataset;
        const heightCm = number(pediatricInput && pediatricInput.heightCm);
        const pediatricP95 = pediatricInput && pediatricInput.p95 ? pediatricInput.p95 : pediatricInput;
        if (!pediatricInput || pediatricInput.reportP95ProvenanceConfirmed !== true) {
            errors.push('Confirm that the under-13 limits were transcribed from this study report’s validated Wühl-based 95th-percentile reference.');
        }
        if (referenceDataset !== 'male' && referenceDataset !== 'female') {
            errors.push('Select the male or female Wühl reference dataset used for the validated pediatric report.');
        }
        if (heightCm === null || heightCm < 120 || heightCm > 230) {
            errors.push('Enter the height used for the under-13 ABPM report (at least 120 cm); this v1 does not extrapolate shorter-child reference limits.');
        }

        PERIODS.forEach(function(period) {
            thresholds[period] = {};
            COMPONENTS.forEach(function(component) {
                const value = number(pediatricP95 && pediatricP95[period] && pediatricP95[period][component]);
                const lowerBound = component === 'sbp' ? 60 : 35;
                const upperBound = component === 'sbp' ? 220 : 120;
                if (value === null || value < lowerBound || value > upperBound) {
                    errors.push('Enter the report’s validated pediatric 95th-percentile ' + period + ' ' + component.toUpperCase() + ' threshold.');
                    return;
                }
                thresholds[period][component] = Math.min(value, ADULT_CUTOFFS[period][component]);
            });
            const sbp = number(pediatricP95 && pediatricP95[period] && pediatricP95[period].sbp);
            const dbp = number(pediatricP95 && pediatricP95[period] && pediatricP95[period].dbp);
            if (sbp !== null && dbp !== null && sbp <= dbp) errors.push('The report’s validated pediatric 95th-percentile ' + period + ' SBP must exceed DBP.');
        });
        return { thresholds: errors.length ? null : thresholds, errors: errors, mode: 'pediatric-lower-of-p95-or-fixed' };
    }

    function evaluateMeans(means, thresholds) {
        const errors = [];
        const comparisons = [];
        if (!thresholds) return { status: null, comparisons: comparisons, errors: ['Applicable thresholds are not available.'] };

        PERIODS.forEach(function(period) {
            COMPONENTS.forEach(function(component) {
                const threshold = number(thresholds && thresholds[period] && thresholds[period][component]);
                const lowerBound = component === 'sbp' ? 60 : 35;
                const upperBound = component === 'sbp' ? 220 : 120;
                if (threshold === null || threshold < lowerBound || threshold > upperBound) errors.push('A valid ' + period + ' ' + component.toUpperCase() + ' threshold is required before means can be compared.');
            });
            const thresholdSbp = number(thresholds && thresholds[period] && thresholds[period].sbp);
            const thresholdDbp = number(thresholds && thresholds[period] && thresholds[period].dbp);
            if (thresholdSbp !== null && thresholdDbp !== null && thresholdSbp <= thresholdDbp) errors.push('The ' + period + ' SBP threshold must exceed the DBP threshold.');
        });
        if (errors.length) return { status: null, comparisons: comparisons, errors: errors, drivers: [] };

        PERIODS.forEach(function(period) {
            COMPONENTS.forEach(function(component) {
                const mean = number(means && means[period] && means[period][component]);
                const lowerBound = component === 'sbp' ? 60 : 35;
                const upperBound = component === 'sbp' ? 220 : 120;
                if (mean === null || mean < lowerBound || mean > upperBound) {
                    errors.push('Enter a valid ' + period + ' mean ' + component.toUpperCase() + ' in mm Hg.');
                    return;
                }
                const threshold = thresholds[period][component];
                comparisons.push({
                    period: period,
                    component: component,
                    mean: mean,
                    threshold: threshold,
                    abnormal: mean >= threshold,
                    difference: mean - threshold
                });
            });
        });
        PERIODS.forEach(function(period) {
            const sbp = number(means && means[period] && means[period].sbp);
            const dbp = number(means && means[period] && means[period].dbp);
            if (sbp !== null && dbp !== null && sbp <= dbp) errors.push('The ' + period + ' mean SBP must exceed DBP.');
        });
        COMPONENTS.forEach(function(component) {
            const day = number(means && means.day && means.day[component]);
            const wake = number(means && means.wake && means.wake[component]);
            const sleep = number(means && means.sleep && means.sleep[component]);
            const lowerBound = component === 'sbp' ? 60 : 35;
            const upperBound = component === 'sbp' ? 220 : 120;
            if ([day, wake, sleep].every(function(item) { return item !== null && item >= lowerBound && item <= upperBound; })) {
                const lower = Math.min(wake, sleep) - 1;
                const upper = Math.max(wake, sleep) + 1;
                if (day < lower || day > upper) errors.push('The 24-hour mean ' + component.toUpperCase() + ' must fall between the wake and sleep means (±1 mm Hg rounding tolerance).');
            }
        });
        const abnormal = comparisons.some(function(item) { return item.abnormal; });
        return {
            status: errors.length ? null : (abnormal ? 'abnormal' : 'normal'),
            comparisons: comparisons,
            errors: errors,
            drivers: comparisons.filter(function(item) { return item.abnormal; })
        };
    }

    function getOfficeStatus(input, age) {
        if (!input || input.confirmed !== true) return { status: 'unavailable', phenotypeStatus: null, message: 'Office BP is not confirmed for phenotype assignment.' };
        if (!age || !Number.isInteger(age.years)) return { status: 'unavailable', phenotypeStatus: null, message: 'A valid age is required before office status can be used.' };

        if (age.years < 13) {
            const selected = input.under13Status;
            if (selected === 'hypertensive') return { status: 'hypertensive', phenotypeStatus: true, message: 'Confirmed office BP at or above the 95th percentile.' };
            if (selected === 'elevated') return { status: 'elevated', phenotypeStatus: false, message: 'Confirmed office BP is elevated but below the 95th-percentile hypertension threshold.' };
            if (selected === 'below') return { status: 'below-hypertensive-threshold', phenotypeStatus: false, message: 'Confirmed office BP is below the 95th-percentile hypertension threshold.' };
            return { status: 'unavailable', phenotypeStatus: null, message: 'Select the confirmed under-13 office BP status.' };
        }

        const sbp = number(input.sbp);
        const dbp = number(input.dbp);
        if (sbp === null || dbp === null || sbp < 60 || sbp > 220 || dbp < 35 || dbp > 120 || sbp <= dbp) return { status: 'unavailable', phenotypeStatus: null, message: 'Enter a plausible confirmed office SBP and DBP for an adolescent; this ABPM pathway is not for acute triage.' };
        if (sbp >= 130 || dbp >= 80) return { status: 'hypertensive', phenotypeStatus: true, message: 'Confirmed office BP is in the ≥130/80 mm Hg hypertensive range.' };
        if (sbp >= 120 && sbp < 130 && dbp < 80) return { status: 'elevated', phenotypeStatus: false, message: 'Confirmed office BP is elevated but below the ≥130/80 mm Hg hypertension threshold.' };
        return { status: 'below-hypertensive-threshold', phenotypeStatus: false, message: 'Confirmed office BP is below the ≥130/80 mm Hg hypertension threshold.' };
    }

    function calculateDipping(means) {
        const wakeSbp = number(means && means.wake && means.wake.sbp);
        const sleepSbp = number(means && means.sleep && means.sleep.sbp);
        const wakeDbp = number(means && means.wake && means.wake.dbp);
        const sleepDbp = number(means && means.sleep && means.sleep.dbp);
        if ([wakeSbp, sleepSbp, wakeDbp, sleepDbp].some(function(value) { return value === null || value <= 0; })) return null;
        return {
            sbp: ((wakeSbp - sleepSbp) / wakeSbp) * 100,
            dbp: ((wakeDbp - sleepDbp) / wakeDbp) * 100
        };
    }

    function assignPhenotype(scope, quality, office, meansEvaluation) {
        if (!scope || !scope.eligibleForComparison) return { code: 'withheld', title: 'Comparison withheld — out of scope', reason: (scope && scope.reasons || []).join(' ') };
        if (!quality || !quality.eligibleForPhenotype) return { code: 'withheld', title: 'Phenotype withheld — study is inadequate', reason: (quality && quality.blockers || []).join(' ') };
        if (scope.treatmentContext) return { code: 'treated-context', title: 'Treated-monitoring context', reason: 'Threshold comparisons may be reviewed, but this v1 does not assign a diagnostic phenotype during active antihypertensive treatment.' };
        if (scope.treatmentUncertain) return { code: 'treatment-unknown', title: 'Treatment context unconfirmed', reason: 'Threshold comparisons may be reviewed, but this v1 withholds a diagnostic phenotype until antihypertensive treatment status during the recording is confirmed.' };
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

    function nextStep(scope, quality, office, evaluation, phenotype, highRisk) {
        const extra = highRisk ? ' The selected high-risk context strengthens the need for patient-specific clinician review.' : '';
        if (!scope || !scope.eligibleForComparison) return {
            tone: 'caution',
            title: 'Do not use this pathway for a final interpretation',
            text: 'Use the complete clinical context and appropriate local/specialist workflow. This v1 does not cover the selected setting or age.',
            actions: ['Do not assign a normal ABPM result or phenotype from this tool.', 'Use local acute/inpatient/special-population processes as appropriate.']
        };
        if (!quality || !quality.eligibleForPhenotype) return {
            tone: 'caution',
            title: 'Repeat or clinician-review the ABPM study before phenotype assignment',
            text: 'The summary does not meet this pathway’s minimum quality gate.',
            actions: ['Review the complete ABPM report, diary, device/cuff setup, and exclusions.', 'Do not document normotension, white-coat, masked, or ambulatory hypertension from this tool until the quality gate is satisfied.']
        };
        if (!phenotype || phenotype.code === 'withheld') return {
            tone: 'caution',
            title: 'Phenotype withheld — complete the blocked review',
            text: 'This page cannot produce a final office–ambulatory phenotype until the stated blocking condition is resolved.',
            actions: ['Review the reported blocking condition and the complete ABPM report.', 'Do not use this page to document a normal, white-coat, masked, or ambulatory hypertension phenotype.']
        };
        if (phenotype.code === 'treated-context') return {
            tone: 'review',
            title: 'Treated-monitoring context — pediatric hypertension review',
            text: 'Threshold comparisons are shown, but a diagnostic phenotype is intentionally withheld during active antihypertensive treatment.',
            actions: ['Review adherence, treatment timing, ABPM quality, and risk context with the treating clinician.', 'Do not use this tool to select, start, stop, or dose medication.']
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
            text: 'The ABPM mean comparison is available, but office BP was not sufficient to assign an office–ambulatory phenotype.',
            actions: ['Obtain or verify a qualifying office BP assessment.', 'Interpret any elevated office BP under the office-BP workflow; do not treat an ABPM-normal comparison as an all-clear result.']
        };
        if (phenotype.code === 'office-elevated-abpm-normal') return {
            tone: 'review',
            title: 'Continue the office-BP follow-up pathway',
            text: 'The ABPM comparison is normal, but the qualifying office BP is elevated rather than below the office-BP screening threshold.' + extra,
            actions: ['Document the normal ABPM comparison and the elevated office-BP context separately.', 'Continue office-BP follow-up under the treating team/local AAP office-BP pathway; do not present this as an all-clear result.']
        };
        if (phenotype.code === 'normotension') return {
            tone: 'routine',
            title: 'Document the ABPM comparison and continue context-specific follow-up',
            text: 'All applicable means are below threshold and the office BP bridge is below the hypertension threshold.' + extra,
            actions: ['Document ABPM quality, diary use, applicable thresholds, and office context.', 'Continue office-BP and risk-factor follow-up according to the treating team/local pathway.']
        };
        if (phenotype.code === 'white-coat') return {
            tone: 'review',
            title: 'Pediatric hypertension review for white-coat phenotype',
            text: 'The phenotype reflects a hypertensive-range office BP with normal ABPM means.' + extra,
            actions: ['Document the phenotype and retain a plan for office-BP follow-up/repeat ABPM based on risk and local policy.', 'Do not use this tool to select medication or a dosing plan.']
        };
        if (phenotype.code === 'masked') return {
            tone: 'alert',
            title: 'Pediatric hypertension review for masked phenotype',
            text: 'At least one ABPM mean is at or above threshold despite office BP below the hypertension threshold.' + extra,
            actions: ['Review the complete report and clinical context with a pediatric hypertension clinician.', 'Use local evaluation and follow-up processes; this page does not prescribe a work-up or medication.']
        };
        return {
            tone: 'alert',
            title: 'Pediatric hypertension review for ambulatory hypertension phenotype',
            text: 'Office BP is in the hypertensive range and at least one ABPM mean is at or above threshold.' + extra,
            actions: ['Review the complete report, indication, and patient-specific risk factors with a pediatric hypertension clinician.', 'Use local evaluation and management processes; this page does not prescribe a work-up, medication, or dose.']
        };
    }

    function formatDrivers(drivers) {
        if (!drivers || !drivers.length) return 'None';
        return drivers.map(function(item) {
            return item.period + ' ' + item.component.toUpperCase() + ' ' + item.mean.toFixed(1) + ' ≥ ' + item.threshold.toFixed(1);
        }).join('; ');
    }

    return {
        VERSION: VERSION,
        ADULT_CUTOFFS: ADULT_CUTOFFS,
        PERIODS: PERIODS,
        COMPONENTS: COMPONENTS,
        ageOnStudyDate: ageOnStudyDate,
        validateScope: validateScope,
        validateStudy: validateStudy,
        buildThresholds: buildThresholds,
        evaluateMeans: evaluateMeans,
        getOfficeStatus: getOfficeStatus,
        calculateDipping: calculateDipping,
        assignPhenotype: assignPhenotype,
        nextStep: nextStep,
        formatDrivers: formatDrivers
    };
});
