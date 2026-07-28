/* Pediatric ABPM preview UI. No storage, fetch, analytics, or dynamic HTML. */
(function() {
    'use strict';

    const core = window.PediatricABPMCore;
    const form = document.getElementById('abpmForm');
    const results = document.getElementById('results');
    const algorithmUnavailable = document.getElementById('algorithmUnavailable');
    const validationSummary = document.getElementById('validationSummary');
    const reviewSummary = document.getElementById('reviewSummary');
    const statusAnnouncer = document.getElementById('statusAnnouncer');
    const copyButton = document.getElementById('copyNote');
    const runButton = document.getElementById('runComparison');
    const readinessText = document.getElementById('readinessText');
    let noteText = '';
    let stale = false;

    const ISSUE_FIELDS = {
        'age-missing': 'ageYears', 'age-out-of-scope': 'ageYears', 'future-study': 'ageYears', 'age-required-for-thresholds': 'ageYears',
        'setting-out-of-scope': 'contextState', 'not-stable-outpatient': 'contextState', 'outpatient-not-documented': 'contextState', 'acute-concern': 'contextState', 'acute-concern-not-documented': 'contextState',
        'duration-missing': 'durationHours', 'duration-under-18': 'durationHours', 'duration-over-30': 'durationHours', 'duration-18-to-20': 'durationHours',
        'attempted-missing': 'attemptedReadings', 'successful-missing': 'successfulReadings', 'successful-exceeds-attempted': 'successfulReadings', 'completion-under-70': 'successfulReadings', 'hourly-reading-shortfall': 'successfulReadings',
        'device-out-of-scope': 'deviceType', 'device-type-not-documented': 'deviceType',
        'height-missing': 'heightCm', 'height-out-of-reference-range': 'heightCm', 'reference-dataset-missing': 'referenceDataset',
        'p95-provenance-not-met': 'reportP95Provenance', 'p95-provenance-not-documented': 'reportP95Provenance',
        'thresholds-unavailable': 'ageYears', 'quality-profile-missing': 'qualityProfile', 'treatment-not-documented': 'contextState', 'treatment-indication-discordance': 'contextState'
    };

    function byId(id) { return document.getElementById(id); }
    function value(id) { const node = byId(id); return node ? node.value : ''; }
    function fieldNumber(id) { const raw = value(id).trim(); return raw === '' ? null : Number(raw); }
    function text(parent, tag, content, className) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        node.textContent = content;
        parent.appendChild(node);
        return node;
    }
    function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
    function displayPeriod(period) { return core && core.displayPeriod ? core.displayPeriod(period) : (period === 'h24' ? '24-hour' : period); }

    function getAge() { return core ? core.ageFromCompletedAge(value('ageYears'), value('ageMonths')) : null; }

    function scopeInput(age) {
        const status = value('contextState');
        let outpatientStable = 'not-documented';
        let noAcuteConcern = 'not-documented';
        let specialContext = 'none';
        let treatmentContext = '';
        if (status === 'stable-untreated') { outpatientStable = 'confirmed'; noAcuteConcern = 'confirmed'; treatmentContext = 'none'; }
        if (status === 'stable-treated') { outpatientStable = 'confirmed'; noAcuteConcern = 'confirmed'; treatmentContext = 'active'; }
        if (status === 'stable-treatment-unknown') { outpatientStable = 'confirmed'; noAcuteConcern = 'confirmed'; treatmentContext = 'unknown'; }
        if (status === 'acute') { outpatientStable = 'confirmed'; noAcuteConcern = 'not-met'; }
        if (status === 'special') { outpatientStable = 'not-met'; noAcuteConcern = 'not-documented'; specialContext = 'other'; }
        return {
            age: age,
            outpatientStable: outpatientStable,
            noAcuteConcern: noAcuteConcern,
            specialContext: specialContext,
            treatmentContext: treatmentContext,
            indication: value('indication'),
            riskContext: value('riskContext')
        };
    }

    function qualityInput() {
        const allConfirmed = value('qualityProfile') === 'all-confirmed';
        const evidence = function(id) { return allConfirmed ? 'confirmed' : value(id); };
        return {
            durationHours: fieldNumber('durationHours'),
            attemptedReadings: fieldNumber('attemptedReadings'),
            successfulReadings: fieldNumber('successfulReadings'),
            deviceType: value('deviceType'),
            deviceValidated: evidence('deviceValidated'),
            cuffAndArmVerified: evidence('cuffAndArmVerified'),
            sleepCaptured: evidence('sleepCaptured'),
            diaryReviewed: evidence('diaryReviewed'),
            oneReadingPerHour: evidence('oneReadingPerHour'),
            cadenceConfirmed: evidence('cadenceConfirmed'),
            applicationCheck: evidence('applicationCheck'),
            exclusionsReviewed: evidence('exclusionsReviewed'),
            rawDataAudited: 'not-documented'
        };
    }

    function reportMeans() {
        return {
            h24: { sbp: fieldNumber('mean-h24-sbp'), dbp: fieldNumber('mean-h24-dbp') },
            wake: { sbp: fieldNumber('mean-wake-sbp'), dbp: fieldNumber('mean-wake-dbp') },
            sleep: { sbp: fieldNumber('mean-sleep-sbp'), dbp: fieldNumber('mean-sleep-dbp') }
        };
    }

    function pediatricInput() {
        return {
            referenceDataset: value('referenceDataset'),
            heightCm: fieldNumber('heightCm'),
            reportP95Provenance: value('reportP95Provenance'),
            p95: {
                h24: { sbp: fieldNumber('p95-h24-sbp'), dbp: fieldNumber('p95-h24-dbp') },
                wake: { sbp: fieldNumber('p95-wake-sbp'), dbp: fieldNumber('p95-wake-dbp') },
                sleep: { sbp: fieldNumber('p95-sleep-sbp'), dbp: fieldNumber('p95-sleep-dbp') }
            }
        };
    }

    function officeInput() {
        return {
            confirmed: value('officeConfirmed'),
            sbp: fieldNumber('officeSbp'),
            dbp: fieldNumber('officeDbp'),
            under13Status: value('officeUnder13Status')
        };
    }

    function updateAgeUi() {
        if (!core) return;
        const age = getAge();
        const ageRoute = byId('ageRoute');
        const fixed = byId('fixedThresholds');
        const pediatric = byId('pediatricThresholds');
        const awaitingThreshold = byId('thresholdAwaitingAge');
        const adolescentOffice = byId('adolescentOffice');
        const pediatricOffice = byId('pediatricOffice');
        const awaitingOffice = byId('officeAwaitingAge');
        const complete = !!age;
        fixed.classList.toggle('hidden', !complete || !age.exact13OrOlder);
        pediatric.classList.toggle('hidden', !complete || age.exact13OrOlder);
        awaitingThreshold.classList.toggle('hidden', complete);
        adolescentOffice.classList.toggle('hidden', !complete || !age.exact13OrOlder);
        pediatricOffice.classList.toggle('hidden', !complete || age.exact13OrOlder);
        awaitingOffice.classList.toggle('hidden', complete);
        if (!complete) { ageRoute.classList.add('hidden'); updateReadiness(); return; }
        ageRoute.className = 'notice';
        ageRoute.textContent = age.exact13OrOlder
            ? 'Age ' + age.years + ' years ' + age.months + ' months: fixed age-13+ AHA thresholds are ready.'
            : 'Age ' + age.years + ' years ' + age.months + ' months: enter the report’s validated p95 values and complete the sex-specific reference-domain check.';
        ageRoute.classList.remove('hidden');
        updateReadiness();
    }

    function updateQualityProfile() {
        const individual = value('qualityProfile') === 'individual';
        byId('qualityIndividual').classList.toggle('hidden', !individual);
        updateReadiness();
    }

    function requirements() {
        const ids = ['ageYears', 'contextState', 'officeConfirmed', 'durationHours', 'attemptedReadings', 'successfulReadings', 'deviceType', 'qualityProfile', 'mean-h24-sbp', 'mean-h24-dbp', 'mean-wake-sbp', 'mean-wake-dbp', 'mean-sleep-sbp', 'mean-sleep-dbp'];
        const age = getAge();
        if (age && age.exact13OrOlder) ids.push('officeSbp', 'officeDbp');
        if (age && !age.exact13OrOlder) ids.push('officeUnder13Status', 'referenceDataset', 'heightCm', 'p95-h24-sbp', 'p95-h24-dbp', 'p95-wake-sbp', 'p95-wake-dbp', 'p95-sleep-sbp', 'p95-sleep-dbp', 'reportP95Provenance');
        return ids;
    }

    function updateReadiness() {
        if (!core) return;
        const incomplete = requirements().filter(function(id) { return value(id).trim() === ''; }).length;
        if (incomplete === 0) readinessText.textContent = 'Required report values are present. Review once.';
        else readinessText.textContent = incomplete + ' required item' + (incomplete === 1 ? '' : 's') + ' still need attention.';
    }

    function clearFieldErrors() {
        form.querySelectorAll('[aria-invalid="true"]').forEach(function(node) { node.removeAttribute('aria-invalid'); });
        form.querySelectorAll('.field-error').forEach(function(node) {
            const owner = node.parentElement;
            if (owner && owner.dataset.baseDescribedby !== undefined) {
                const base = owner.dataset.baseDescribedby;
                const control = owner.querySelector('input, select');
                if (control) {
                    if (base) control.setAttribute('aria-describedby', base);
                    else control.removeAttribute('aria-describedby');
                }
            }
            node.remove();
        });
        validationSummary.classList.add('hidden');
        clear(validationSummary);
    }

    function issueField(issue) {
        const code = issue.code || '';
        if (ISSUE_FIELDS[code]) return ISSUE_FIELDS[code];
        if (code.indexOf('device-validation') === 0) return 'deviceValidated';
        if (code.indexOf('cuff-arm') === 0) return 'cuffAndArmVerified';
        if (code.indexOf('sleep') === 0) return 'sleepCaptured';
        if (code.indexOf('diary') === 0) return 'diaryReviewed';
        if (code.indexOf('hourly-reading') === 0) return 'oneReadingPerHour';
        if (code.indexOf('application-check') === 0) return 'applicationCheck';
        if (code.indexOf('exclusions') === 0) return 'exclusionsReviewed';
        if (code.indexOf('cadence') === 0) return 'cadenceConfirmed';
        const mean = /^mean-(h24|wake|sleep)-(sbp|dbp)$/.exec(code);
        if (mean) return 'mean-' + mean[1] + '-' + mean[2];
        const p95 = /^p95-(h24|wake|sleep)-(sbp|dbp)$/.exec(code);
        if (p95) return 'p95-' + p95[1] + '-' + p95[2];
        if (/^mean-.*-pair$/.test(code)) return 'mean-' + code.split('-')[1] + '-sbp';
        if (/^p95-.*-pair$/.test(code)) return 'p95-' + code.split('-')[1] + '-sbp';
        if (/^threshold/.test(code)) return 'ageYears';
        return null;
    }

    function addFieldError(fieldId, message) {
        const control = byId(fieldId);
        if (!control) return;
        control.setAttribute('aria-invalid', 'true');
        const label = control.closest('label');
        if (!label) return;
        const errorId = fieldId + '-error';
        if (byId(errorId)) return;
        label.dataset.baseDescribedby = control.getAttribute('aria-describedby') || '';
        const base = label.dataset.baseDescribedby;
        control.setAttribute('aria-describedby', (base ? base + ' ' : '') + errorId);
        const error = document.createElement('p');
        error.id = errorId;
        error.className = 'field-error';
        error.textContent = message;
        label.appendChild(error);
    }

    function dedupeIssues(issues) {
        const seen = new Set();
        return issues.filter(function(item) {
            const key = item.code + '|' + item.message;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function renderValidation(issues) {
        const unique = dedupeIssues(issues || []);
        if (!unique.length) return;
        clear(validationSummary);
        text(validationSummary, 'h2', 'Resolve these items before an automated result', null).id = 'validationHeading';
        text(validationSummary, 'p', 'The most decisive scope or study-quality issue is shown first. Your entries remain in place.');
        const list = document.createElement('ul');
        unique.forEach(function(item) {
            const fieldId = issueField(item);
            const li = document.createElement('li');
            if (fieldId && byId(fieldId)) {
                const link = document.createElement('a');
                link.href = '#' + fieldId;
                link.textContent = item.message;
                link.addEventListener('click', function(event) { event.preventDefault(); focusField(fieldId); });
                li.appendChild(link);
                addFieldError(fieldId, item.message);
            } else {
                li.textContent = item.message;
            }
            list.appendChild(li);
        });
        validationSummary.appendChild(list);
        validationSummary.classList.remove('hidden');
        const first = issueField(unique[0]);
        if (first && byId(first)) focusField(first);
        else {
            validationSummary.focus({ preventScroll: true });
            validationSummary.scrollIntoView({ block: 'center' });
        }
        statusAnnouncer.textContent = unique.length + ' item' + (unique.length === 1 ? '' : 's') + ' need attention.';
    }

    function renderReview(issues) {
        const unique = dedupeIssues(issues || []);
        clear(reviewSummary);
        if (!unique.length) { reviewSummary.classList.add('hidden'); return; }
        text(reviewSummary, 'h2', 'Review required before automated phenotype', null).id = 'reviewHeading';
        text(reviewSummary, 'p', unique.map(function(item) { return item.message; }).join(' '));
        reviewSummary.classList.remove('hidden');
    }

    function focusField(id) {
        const node = byId(id);
        if (!node) return;
        node.focus({ preventScroll: true });
        node.scrollIntoView({ block: 'center' });
    }

    function statusTone(status) {
        if (status === 'interpretable') return 'positive';
        if (status === 'insufficient') return 'alert';
        return 'review';
    }

    function issueList(parent, label, issues) {
        if (!issues || !issues.length) return;
        const heading = text(parent, 'strong', label);
        heading.className = 'eyebrow';
        const list = document.createElement('ul');
        list.className = 'quality-list';
        issues.forEach(function(item) { text(list, 'li', typeof item === 'string' ? item : item.message); });
        parent.appendChild(list);
    }

    function renderQuality(quality) {
        const card = byId('qualityCard');
        clear(card);
        const title = { interpretable: 'Interpretable in this pathway', 'interpretable-with-review': 'Interpretable with review flags', 'review-required': 'Automated phenotype needs quality review', insufficient: 'Insufficient for automated phenotype' };
        card.className = 'status-card ' + statusTone(quality.status);
        text(card, 'div', 'Study quality', 'eyebrow');
        text(card, 'h3', title[quality.status] || 'Study quality not established');
        text(card, 'p', quality.eligibleForPhenotype ? 'The required gate items were confirmed. Review any flags alongside the complete report.' : quality.eligibleForComparison ? 'Comparison can be shown, but this page withholds automated phenotype assignment until the listed evidence is reviewed.' : 'Do not assign a normal result or office–ambulatory phenotype from this page.');
        const points = document.createElement('div');
        points.className = 'data-points';
        const rows = [
            ['Duration', fieldNumber('durationHours') === null ? '—' : fieldNumber('durationHours').toFixed(1) + ' h'],
            ['Successful / attempted', quality.completionRate === null ? '—' : value('successfulReadings') + ' / ' + value('attemptedReadings') + ' (' + (quality.completionRate * 100).toFixed(1) + '%)'],
            ['Evidence completeness', quality.completeness ? quality.completeness.confirmed + '/' + quality.completeness.required + ' confirmed (' + quality.completeness.percent + '%)' : '—']
        ];
        rows.forEach(function(row) { const item = document.createElement('div'); item.className = 'data-point'; text(item, 'span', row[0]); text(item, 'strong', row[1]); points.appendChild(item); });
        card.appendChild(points);
        issueList(card, 'Known failures', quality.blockers);
        issueList(card, 'Not documented', quality.reviewReasons);
        issueList(card, 'Review flags', quality.flags);
    }

    function renderOffice(office, age) {
        const card = byId('officeCard');
        clear(card);
        const tone = office.status === 'hypertensive' ? 'alert' : office.status === 'unavailable' ? 'review' : 'neutral';
        card.className = 'status-card ' + tone;
        text(card, 'div', 'Office-BP bridge', 'eyebrow');
        const display = office.status === 'below-hypertensive-threshold' ? 'Below hypertension threshold' : office.status === 'unavailable' ? 'Office status unavailable' : office.status.charAt(0).toUpperCase() + office.status.slice(1);
        text(card, 'h3', display);
        text(card, 'p', office.message);
        if (age && age.exact13OrOlder && office.status !== 'unavailable') {
            const details = document.createElement('div'); details.className = 'data-points';
            const row = document.createElement('div'); row.className = 'data-point'; text(row, 'span', 'Confirmed office BP'); text(row, 'strong', value('officeSbp') + '/' + value('officeDbp') + ' mm Hg'); details.appendChild(row); card.appendChild(details);
        }
    }

    function renderComparisons(evaluation, thresholdResult, quality, scope) {
        const rows = byId('comparisonRows');
        const cards = byId('comparisonCards');
        clear(rows);
        clear(cards);
        if (evaluation && evaluation.comparisons && evaluation.comparisons.length) {
            evaluation.comparisons.forEach(function(item) {
                const tr = document.createElement('tr');
                text(tr, 'th', displayPeriod(item.period) + ' · ' + item.component.toUpperCase()).setAttribute('scope', 'row');
                text(tr, 'td', item.mean.toFixed(1) + ' mm Hg');
                text(tr, 'td', item.thresholdDetail.reportP95 === null ? '—' : item.thresholdDetail.reportP95.toFixed(1) + ' mm Hg');
                text(tr, 'td', item.thresholdDetail.fixed === null ? '—' : item.thresholdDetail.fixed.toFixed(1) + ' mm Hg');
                text(tr, 'td', item.threshold.toFixed(1) + ' mm Hg');
                text(tr, 'td', item.thresholdDetail.sourceLabel);
                text(tr, 'td', item.abnormal ? 'Meets / exceeds' : 'Below', item.abnormal ? 'comparison-bad' : 'comparison-good');
                rows.appendChild(tr);

                const card = document.createElement('article');
                card.className = 'comparison-card';
                text(card, 'h3', displayPeriod(item.period) + ' · ' + item.component.toUpperCase());
                const points = document.createElement('div');
                points.className = 'data-points';
                [
                    ['Mean', item.mean.toFixed(1) + ' mm Hg'],
                    ['Applicable threshold', item.threshold.toFixed(1) + ' mm Hg'],
                    ['Threshold source', item.thresholdDetail.sourceLabel],
                    ['Comparison', item.abnormal ? 'Meets / exceeds' : 'Below']
                ].forEach(function(row) {
                    const point = document.createElement('div');
                    point.className = 'data-point';
                    text(point, 'span', row[0]);
                    text(point, 'strong', row[1], row[0] === 'Comparison' ? (item.abnormal ? 'comparison-bad' : 'comparison-good') : null);
                    points.appendChild(point);
                });
                card.appendChild(points);
                cards.appendChild(card);
            });
        } else {
            const tr = document.createElement('tr');
            const cell = text(tr, 'td', 'Complete the scope and quality gate before comparing means.');
            cell.colSpan = 7;
            rows.appendChild(tr);
            text(cards, 'p', 'Complete the scope and quality gate before comparing means.', 'descriptor');
        }
        const message = byId('comparisonMessage');
        if (!evaluation || !evaluation.status) {
            message.textContent = 'No ABPM mean status is assigned until applicable thresholds and all six report means are available.';
            return;
        }
        const source = thresholdResult.mode === 'adolescent-fixed'
            ? 'Fixed age-13+ thresholds were used.'
            : 'For this under-13 report, each applicable threshold is the lower of the report-transcribed validated p95 and the AHA fixed cutoff.';
        const status = evaluation.status === 'normal'
            ? 'All six entered means are below their applicable threshold.'
            : 'At least one entered mean meets or exceeds its threshold: ' + core.formatDrivers(evaluation.drivers) + '.';
        const gate = quality.eligibleForPhenotype && scope.eligibleForPhenotype ? ' Quality and scope permit phenotype review below.' : ' A final automated phenotype is intentionally withheld by the quality, scope, or treatment gate.';
        message.textContent = source + ' ' + status + gate;
    }

    function renderPhenotype(phenotype) {
        const card = byId('phenotypeCard');
        clear(card);
        const tone = phenotype.code === 'normotension' ? 'positive' : phenotype.code === 'masked' || phenotype.code === 'ambulatory-hypertension' ? 'alert' : 'review';
        card.className = 'status-card ' + tone;
        text(card, 'div', 'Office–ambulatory phenotype', 'eyebrow');
        text(card, 'h3', phenotype.title);
        text(card, 'p', phenotype.reason || 'Review the complete report and clinical context.');
    }

    function renderPattern(evaluation) {
        const card = byId('patternCard');
        if (!evaluation || !evaluation.status) { card.textContent = 'Affected-period pattern is available after all means are compared.'; return; }
        if (evaluation.status === 'normal') { card.textContent = 'Pattern: no elevated ABPM mean. This does not erase office-BP or risk-context follow-up.'; return; }
        card.textContent = 'Pattern: ' + evaluation.pattern.label + ' (' + evaluation.pattern.components.join(' and ') + '). This descriptor does not replace the phenotype or clinical review.';
    }

    function renderDipping(dipping) {
        const card = byId('dippingCard');
        if (!dipping) { card.textContent = 'Dipping could not be calculated because complete wake and sleep means are not available.'; return; }
        card.textContent = 'Circadian descriptor only: SBP wake-to-sleep fall ' + dipping.sbp.toFixed(1) + '% (' + dipping.sbpCategory + '); DBP fall ' + dipping.dbp.toFixed(1) + '% (' + dipping.dbpCategory + '). Dipping does not change the phenotype, and isolated nondipping with normal means is not masked hypertension in this pathway.';
    }

    function renderNextStep(next) {
        const card = byId('nextStepCard');
        clear(card);
        card.className = 'next-step ' + next.tone;
        text(card, 'div', 'Clinician review prompt', 'eyebrow');
        text(card, 'h3', next.title);
        text(card, 'p', next.text);
        const list = document.createElement('ul');
        next.actions.forEach(function(action) { text(list, 'li', action); });
        card.appendChild(list);
    }

    function formatPair(means, period) {
        const data = means[period];
        if (!data || data.sbp === null || data.dbp === null || Number.isNaN(data.sbp) || Number.isNaN(data.dbp)) return 'not entered';
        return data.sbp + '/' + data.dbp;
    }

    function formatThresholdPair(thresholdResult, period) {
        if (!thresholdResult || !thresholdResult.thresholds || !thresholdResult.thresholds[period]) return 'not available';
        const row = thresholdResult.thresholds[period];
        return row.sbp.toFixed(1) + '/' + row.dbp.toFixed(1);
    }

    function buildNote(age, quality, office, thresholdResult, evaluation, phenotype, dipping, scope) {
        const means = reportMeans();
        const timestamp = new Date().toLocaleString();
        const resultText = evaluation && evaluation.status ? evaluation.status + '; drivers: ' + core.formatDrivers(evaluation.drivers) + '.' : 'withheld; complete the listed validation items.';
        const pattern = evaluation && evaluation.pattern ? evaluation.pattern.label : 'not available';
        const sources = evaluation && evaluation.comparisons && evaluation.comparisons.length
            ? evaluation.comparisons.map(function(item) { return displayPeriod(item.period) + ' ' + item.component.toUpperCase() + ': ' + item.thresholdDetail.sourceLabel; }).join('; ')
            : 'not available';
        return [
            'Pediatric ABPM report-summary comparison — AHA 2022 (clinician review required)',
            'Identifier-free draft. Add identifiers only inside an approved clinical system.',
            'Generated locally: ' + timestamp + '.',
            'Algorithm: ' + core.VERSION + '. Ruleset: ' + core.RULESET_ID + ' SHA-256 ' + core.RULESET_SHA256 + '.',
            'Age at recording: ' + (age ? age.years + ' years ' + age.months + ' months' : 'not available') + '.',
            'Indication: ' + value('indication') + '. Risk context: ' + value('riskContext') + '. Treatment context: ' + (scope.treatmentContext ? 'active treatment' : scope.treatmentUncertain ? 'not documented' : 'none documented') + '.',
            'Study quality: ' + quality.status + '; evidence completeness ' + quality.completeness.confirmed + '/' + quality.completeness.required + '; duration ' + (fieldNumber('durationHours') === null ? 'not entered' : fieldNumber('durationHours').toFixed(1) + ' h') + '; successful/attempted ' + (quality.completionRate === null ? 'not entered' : value('successfulReadings') + '/' + value('attemptedReadings') + ' (' + (quality.completionRate * 100).toFixed(1) + '%)') + '.',
            'Quality not documented: ' + (quality.reviewReasons.length ? quality.reviewReasons.join(' | ') : 'none') + '.',
            'Office BP bridge: ' + (office.status === 'unavailable' ? 'not available for phenotype.' : office.message),
            'ABPM means (24-hour/wake/sleep): ' + formatPair(means, 'h24') + '; ' + formatPair(means, 'wake') + '; ' + formatPair(means, 'sleep') + ' mm Hg.',
            'Applicable thresholds (24-hour/wake/sleep): ' + formatThresholdPair(thresholdResult, 'h24') + '; ' + formatThresholdPair(thresholdResult, 'wake') + '; ' + formatThresholdPair(thresholdResult, 'sleep') + ' mm Hg.',
            'Threshold sources: ' + sources + '.',
            'ABPM mean comparison: ' + resultText,
            'Affected-period pattern: ' + pattern + '.',
            'Phenotype: ' + phenotype.title + '. ' + (phenotype.reason || ''),
            'Dipping: ' + (dipping ? 'SBP ' + dipping.sbp.toFixed(1) + '% (' + dipping.sbpCategory + '); DBP ' + dipping.dbp.toFixed(1) + '% (' + dipping.dbpCategory + '). Descriptive only; not used for phenotype.' : 'not available.'),
            'BP load: not used for phenotype classification under AHA 2022.',
            'Boundary: This report-summary aid does not validate the device, diagnose a patient, provide emergency triage, calculate CKD MAP targets, or select medication/dose. Review the complete report, diary, office-BP quality, treatment context, and patient-specific risks.'
        ].join('\n');
    }

    function showResults() { results.classList.remove('hidden'); results.classList.remove('stale'); stale = false; }

    function renderWorkspace(scope, quality, age, office, thresholdResult, evaluation, phenotype, dipping, next) {
        renderQuality(quality);
        renderOffice(office, age);
        renderComparisons(evaluation, thresholdResult, quality, scope);
        renderPhenotype(phenotype);
        renderPattern(evaluation);
        renderDipping(dipping);
        renderNextStep(next);
        const intro = byId('resultIntro');
        intro.textContent = 'Algorithm ' + core.VERSION + '. ' + (quality.eligibleForPhenotype && scope.eligibleForPhenotype ? 'Quality and scope permit phenotype review.' : 'Automated phenotype is intentionally withheld until the listed review is resolved.');
        const pill = byId('resultPill');
        const normal = phenotype.code === 'normotension';
        const blocked = phenotype.code === 'withheld' || phenotype.code === 'quality-review';
        pill.textContent = normal ? 'Review complete' : blocked ? 'Not classifiable' : 'Clinician review';
        pill.className = 'pill ' + (normal ? 'positive' : blocked ? 'alert' : 'review');
        showResults();
    }

    function calculate() {
        if (!core) return;
        clearFieldErrors();
        renderReview([]);
        const age = getAge();
        const scope = core.validateScope(scopeInput(age));
        const quality = core.validateStudy(qualityInput());
        const office = core.getOfficeStatus(officeInput(), age);
        const blankEvaluation = { status: null, comparisons: [], errors: [], flags: [], drivers: [], pattern: null };
        const blankThreshold = { thresholds: null, thresholdDetails: null, errors: [], issues: [], mode: null };
        const blockedScope = scope.blockers || [];
        const blockedQuality = quality.hardIssues || [];

        // The cheap, decisive safety gates win. Mean/p95 validation never
        // obscures an out-of-scope or inadequate-study conclusion.
        if (blockedScope.length || blockedQuality.length) {
            const phenotype = core.assignPhenotype(scope, quality, office, blankEvaluation);
            const next = core.nextStep(scope, quality, office, blankEvaluation, phenotype, scope.riskContext);
            renderWorkspace(scope, quality, age, office, blankThreshold, blankEvaluation, phenotype, null, next);
            renderValidation(blockedScope.length ? blockedScope : blockedQuality);
            copyButton.disabled = true;
            noteText = '';
            return;
        }

        const thresholdResult = core.buildThresholds(age, pediatricInput());
        const evaluation = thresholdResult.thresholds ? core.evaluateMeans(reportMeans(), thresholdResult.thresholds, thresholdResult.thresholdDetails) : blankEvaluation;
        const inputIssues = (thresholdResult.issues || []).concat(evaluation.issues || []);
        const phenotype = core.assignPhenotype(scope, quality, office, evaluation);
        const dipping = core.calculateDipping(reportMeans());
        const next = core.nextStep(scope, quality, office, evaluation, phenotype, scope.riskContext);
        renderWorkspace(scope, quality, age, office, thresholdResult, evaluation, phenotype, dipping, next);

        const reviewIssues = (scope.flags || []).concat(quality.reviewIssues || [], quality.flagIssues || [], evaluation.flagIssues || []);
        renderReview(reviewIssues);
        if (inputIssues.length) renderValidation(inputIssues);
        else {
            byId('resultHeading').focus({ preventScroll: true });
            byId('resultHeading').scrollIntoView({ block: 'start' });
            statusAnnouncer.textContent = phenotype.title + '. ' + (inputIssues.length ? 'Items need attention.' : 'Interpretation workspace updated.');
        }

        const copyAllowed = !inputIssues.length && scope.eligibleForPhenotype && quality.eligibleForPhenotype && !!evaluation.status && office.status !== 'unavailable';
        copyButton.disabled = !copyAllowed;
        noteText = copyAllowed ? buildNote(age, quality, office, thresholdResult, evaluation, phenotype, dipping, scope) : '';
    }

    function invalidate() {
        updateReadiness();
        if (!results.classList.contains('hidden') && !stale) {
            stale = true;
            results.classList.add('stale');
            byId('resultPill').textContent = 'Inputs changed';
            byId('resultPill').className = 'pill review';
            byId('resultIntro').textContent = 'Inputs changed — review again before using this workspace or copying a draft.';
            copyButton.disabled = true;
            noteText = '';
            statusAnnouncer.textContent = 'Inputs changed. Recalculate before using the result.';
        }
    }

    function setValue(id, next) { byId(id).value = next; }
    function clearAll() {
        if (!window.confirm('Clear all entered values from this page?')) return;
        form.reset();
        results.classList.add('hidden');
        clearFieldErrors();
        renderReview([]);
        noteText = '';
        stale = false;
        copyButton.disabled = true;
        byId('copyStatus').textContent = '';
        updateQualityProfile();
        updateAgeUi();
        byId('ageYears').focus();
    }

    function loadExample() {
        const scenario = value('exampleScenario');
        form.reset();
        const common = function(ageYears, ageMonths) {
            setValue('ageYears', ageYears); setValue('ageMonths', ageMonths);
            setValue('contextState', 'stable-untreated');
            setValue('officeConfirmed', 'confirmed');
            setValue('durationHours', '24');
            setValue('attemptedReadings', '60');
            setValue('successfulReadings', '50');
            setValue('deviceType', 'validated-cuff-abpm');
            setValue('qualityProfile', 'all-confirmed');
            setValue('indication', 'suspected hypertension');
            setValue('riskContext', 'none');
        };
        common('13', '0');
        const scenarios = {
            normal: { office: ['118', '70'], means: ['118', '70', '122', '74', '105', '60'] },
            'white-coat': { office: ['134', '82'], means: ['118', '70', '122', '74', '105', '60'] },
            'masked-nocturnal': { office: ['118', '70'], means: ['120', '70', '124', '74', '108', '65'] },
            ambulatory: { office: ['134', '82'], means: ['126', '76', '132', '82', '111', '66'] },
            'quality-review': { office: ['118', '70'], means: ['118', '70', '122', '74', '105', '60'], qualityReview: true },
            inadequate: { office: ['118', '70'], means: ['118', '70', '122', '74', '105', '60'], duration: '12', successful: '32' }
        };
        if (scenario === 'under13-clamped') {
            common('12', '11');
            setValue('officeUnder13Status', 'below');
            setValue('referenceDataset', 'female'); setValue('heightCm', '145'); setValue('reportP95Provenance', 'confirmed');
            ['127', '77', '132', '82', '112', '67'].forEach(function(next, index) {
                ['p95-h24-sbp', 'p95-h24-dbp', 'p95-wake-sbp', 'p95-wake-dbp', 'p95-sleep-sbp', 'p95-sleep-dbp'][index] && setValue(['p95-h24-sbp', 'p95-h24-dbp', 'p95-wake-sbp', 'p95-wake-dbp', 'p95-sleep-sbp', 'p95-sleep-dbp'][index], next);
            });
            ['125', '70', '124', '74', '108', '60'].forEach(function(next, index) { setValue(['mean-h24-sbp', 'mean-h24-dbp', 'mean-wake-sbp', 'mean-wake-dbp', 'mean-sleep-sbp', 'mean-sleep-dbp'][index], next); });
        } else {
            const sample = scenarios[scenario] || scenarios.normal;
            setValue('officeSbp', sample.office[0]); setValue('officeDbp', sample.office[1]);
            ['mean-h24-sbp', 'mean-h24-dbp', 'mean-wake-sbp', 'mean-wake-dbp', 'mean-sleep-sbp', 'mean-sleep-dbp'].forEach(function(id, index) { setValue(id, sample.means[index]); });
            if (sample.duration) setValue('durationHours', sample.duration);
            if (sample.successful) setValue('successfulReadings', sample.successful);
            if (sample.qualityReview) {
                setValue('qualityProfile', 'individual');
                ['deviceValidated', 'cuffAndArmVerified', 'sleepCaptured', 'oneReadingPerHour', 'applicationCheck', 'exclusionsReviewed', 'cadenceConfirmed'].forEach(function(id) { setValue(id, 'confirmed'); });
                setValue('diaryReviewed', '');
            }
        }
        updateQualityProfile();
        updateAgeUi();
        calculate();
    }

    function copyNote() {
        if (!noteText || copyButton.disabled) return;
        const status = byId('copyStatus');
        const done = function() { status.textContent = 'Copied to clipboard; paste only into an approved clinical system.'; };
        const fallback = function() {
            const area = document.createElement('textarea');
            area.value = noteText;
            area.setAttribute('readonly', '');
            area.className = 'clipboard-fallback';
            document.body.appendChild(area);
            area.select();
            try { document.execCommand('copy'); done(); } catch (error) { status.textContent = 'Copy failed — select the draft manually.'; }
            area.remove();
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(noteText).then(done).catch(fallback);
        else fallback();
    }

    function failClosed() {
        algorithmUnavailable.classList.remove('hidden');
        form.querySelectorAll('input, select, button').forEach(function(node) { node.disabled = true; });
        statusAnnouncer.textContent = 'Algorithm unavailable. Do not interpret this report.';
    }

    if (!core) { failClosed(); return; }

    byId('algorithmVersion').textContent = core.VERSION;
    byId('rulesetVersion').textContent = core.RULESET_ID + ' · ' + core.RULESET_SHA256.slice(0, 12) + '…';
    byId('ageYears').addEventListener('input', function() { updateAgeUi(); invalidate(); });
    byId('ageMonths').addEventListener('input', function() { updateAgeUi(); invalidate(); });
    byId('qualityProfile').addEventListener('change', function() { updateQualityProfile(); invalidate(); });
    form.addEventListener('input', function(event) {
        if (event.target.id !== 'ageYears' && event.target.id !== 'ageMonths') invalidate();
    });
    form.addEventListener('change', function(event) {
        if (event.target.id !== 'qualityProfile' && event.target.id !== 'ageYears' && event.target.id !== 'ageMonths') invalidate();
    });
    form.addEventListener('submit', function(event) { event.preventDefault(); calculate(); });
    byId('loadExample').addEventListener('click', loadExample);
    byId('clearForm').addEventListener('click', clearAll);
    copyButton.addEventListener('click', copyNote);
    updateQualityProfile();
    updateAgeUi();
    updateReadiness();
    window.PediatricABPMPreview = { calculate: calculate, loadExample: loadExample, getAge: getAge, isStale: function() { return stale; } };
})();
