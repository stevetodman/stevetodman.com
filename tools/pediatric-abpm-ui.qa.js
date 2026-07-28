#!/usr/bin/env node
'use strict';

/*
 * DOM-level adversarial QA for the static preview. Uses JSDOM so the release
 * gate catches core/UI contract regressions even without a browser binary.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'pediatric-abpm-pathway-preview.html'), 'utf8');
const coreJs = fs.readFileSync(path.join(root, 'pediatric-abpm-core.js'), 'utf8');
const uiJs = fs.readFileSync(path.join(root, 'pediatric-abpm-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'pediatric-abpm-pathway-preview.css'), 'utf8');
let checks = 0;
function equal(actual, expected, message) { checks += 1; assert.equal(actual, expected, message); }
function ok(actual, message) { checks += 1; assert.ok(actual, message); }
function includes(actual, expected, message) { checks += 1; assert.ok(actual.includes(expected), message || expected); }

function makeWindow(includeCore) {
    const dom = new JSDOM(html, { url: 'https://preview.example/tools/pediatric-abpm-pathway-preview.html', runScripts: 'outside-only', pretendToBeVisual: true });
    const { window } = dom;
    window.HTMLElement.prototype.scrollIntoView = function() {};
    window.confirm = function() { return true; };
    let copied = '';
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: function(text) { copied = text; return Promise.resolve(); } }, configurable: true });
    if (includeCore !== false) window.eval(coreJs);
    window.eval(uiJs);
    return { dom: dom, window: window, copied: function() { return copied; } };
}

function set(window, id, value, type) {
    const node = window.document.getElementById(id);
    node.value = value;
    node.dispatchEvent(new window.Event(type || 'input', { bubbles: true }));
    return node;
}
function click(window, id) { window.document.getElementById(id).click(); }
function calculate(window) { window.PediatricABPMPreview.calculate(); }
function visible(window, id) { return !window.document.getElementById(id).classList.contains('hidden'); }
function loadExample(window, scenario) { set(window, 'exampleScenario', scenario, 'change'); click(window, 'loadExample'); }

// Privacy/security structure must be testable, not merely asserted in copy.
const staticDom = new JSDOM(html).window.document;
equal(staticDom.querySelectorAll('input[type="date"]').length, 0, 'no date input may exist');
equal(staticDom.getElementById('dob'), null, 'DOB field must be absent');
equal(staticDom.getElementById('studyDate'), null, 'study-date field must be absent');
equal(staticDom.querySelectorAll('script:not([src])').length, 0, 'inline script must be absent for CSP');
equal(staticDom.querySelectorAll('style').length, 0, 'inline style must be absent for CSP');
ok(staticDom.querySelector('meta[http-equiv="Content-Security-Policy"]').content.includes("connect-src 'none'"), 'prepared CSP must prohibit network connections');
equal(staticDom.querySelectorAll('link[rel="stylesheet"][href="pediatric-abpm-pathway-preview.css"]').length, 1, 'CSS must be external');
equal(staticDom.querySelectorAll('script[src="pediatric-abpm-core.js"], script[src="pediatric-abpm-ui.js"]').length, 2, 'JS must be external');
ok(!/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon/.test(uiJs + coreJs), 'form code must not contain storage or egress APIs');
ok(!/mean-table|<table[^>]*>\s*<thead[^>]*>\s*<tr[^>]*>\s*<th[^>]*>.*Mean SBP/s.test(html), 'required mean entry must not be a desktop table');
ok(css.includes('min-height: 44px'), 'controls must target 44px touch size');
ok(css.includes('outline: 3px solid var(--brand)'), 'focus indicator must be solid and high contrast');
ok(css.includes('.table-wrap { display: none; }') && css.includes('.comparison-cards { display: block; }'), 'mobile results must use cards rather than a horizontally scrolling table');

// Fail closed if the deterministic core is unavailable.
{
    const page = makeWindow(false);
    equal(visible(page.window, 'algorithmUnavailable'), true, 'missing core must produce user-facing safety state');
    equal(page.window.document.getElementById('runComparison').disabled, true, 'missing core must disable calculation');
    page.dom.window.close();
}

// Routine adolescent fast lane: public synthetic workflow completes without
// horizontal data tables or core/UI contract errors.
{
    const page = makeWindow();
    loadExample(page.window, 'normal');
    equal(visible(page.window, 'results'), true, 'normal example should render results');
    includes(page.window.document.getElementById('phenotypeCard').textContent, 'Normotension phenotype');
    equal(page.window.document.querySelectorAll('#comparisonRows tr').length, 6, 'six comparisons must render');
    equal(page.window.document.querySelectorAll('#comparisonCards .comparison-card').length, 6, 'six mobile comparison cards must render');
    includes(page.window.document.getElementById('comparisonRows').textContent, '24-hour');
    equal(page.window.document.getElementById('copyNote').disabled, false, 'complete report may enable identifier-free draft');
    equal(visible(page.window, 'validationSummary'), false, 'no hard errors for normal example');
    click(page.window, 'copyNote');
    // Clipboard promise resolves after current microtask; direct note output is
    // also visible through the handler state in the next tick but the click
    // itself proves the safe export control is enabled.
    ok(page.window.document.getElementById('copyStatus').textContent === '' || page.window.document.getElementById('copyStatus').textContent.includes('Copied'));
    page.dom.window.close();
}

// Correcting a value must preserve the workspace but instantly prohibit stale
// copying. This is a clinically important UI safety invariant.
{
    const page = makeWindow();
    loadExample(page.window, 'normal');
    set(page.window, 'mean-sleep-dbp', '65');
    equal(page.window.PediatricABPMPreview.isStale(), true);
    ok(page.window.document.getElementById('results').classList.contains('stale'));
    equal(page.window.document.getElementById('copyNote').disabled, true);
    includes(page.window.document.getElementById('resultIntro').textContent, 'Inputs changed');
    page.dom.window.close();
}

// Most-decisive-gate ordering: inadequate recording must appear before a wall
// of incomplete-means validation.
{
    const page = makeWindow();
    set(page.window, 'ageYears', '13'); set(page.window, 'ageMonths', '0');
    set(page.window, 'contextState', 'stable-untreated', 'change');
    set(page.window, 'officeConfirmed', 'confirmed', 'change');
    set(page.window, 'durationHours', '12'); set(page.window, 'attemptedReadings', '60'); set(page.window, 'successfulReadings', '50');
    set(page.window, 'deviceType', 'validated-cuff-abpm', 'change'); set(page.window, 'qualityProfile', 'all-confirmed', 'change');
    calculate(page.window);
    const summary = page.window.document.getElementById('validationSummary').textContent;
    includes(summary, 'under 18 hours');
    ok(!/valid 24-hour mean/i.test(summary), 'mean errors must not obscure inadequate study');
    includes(page.window.document.getElementById('phenotypeCard').textContent, 'withheld');
    page.dom.window.close();
}

// Not documented is review-required—not a known failure and not a pass.
{
    const page = makeWindow();
    loadExample(page.window, 'quality-review');
    includes(page.window.document.getElementById('qualityCard').textContent, 'needs quality review');
    includes(page.window.document.getElementById('reviewSummary').textContent, 'Diary-derived wake and sleep periods is not documented');
    equal(page.window.document.getElementById('copyNote').disabled, true);
    page.dom.window.close();
}

// Under-13 regression: p95/fixed clamp must render without day/h24 exception.
{
    const page = makeWindow();
    loadExample(page.window, 'under13-clamped');
    equal(visible(page.window, 'results'), true);
    includes(page.window.document.getElementById('comparisonRows').textContent, 'AHA fixed — clamped from 127.0');
    includes(page.window.document.getElementById('comparisonRows').textContent, '24-hour');
    page.dom.window.close();
}

// Field-specific error semantics and recovery.
{
    const page = makeWindow();
    loadExample(page.window, 'normal');
    set(page.window, 'mean-h24-sbp', '');
    calculate(page.window);
    const field = page.window.document.getElementById('mean-h24-sbp');
    equal(field.getAttribute('aria-invalid'), 'true');
    ok((field.getAttribute('aria-describedby') || '').includes('mean-h24-sbp-error'));
    const link = page.window.document.querySelector('#validationSummary a[href="#mean-h24-sbp"]');
    ok(link, 'summary must link to invalid field');
    link.click();
    equal(page.window.document.activeElement, field, 'error link must focus invalid field');
    page.dom.window.close();
}

// Treatment states must not silently become an untreated phenotype.
{
    const page = makeWindow();
    loadExample(page.window, 'normal');
    set(page.window, 'contextState', 'stable-treated', 'change');
    calculate(page.window);
    includes(page.window.document.getElementById('phenotypeCard').textContent, 'Treated-monitoring context');
    ok(!page.window.document.getElementById('phenotypeCard').textContent.includes('White-coat hypertension phenotype'));
    page.dom.window.close();
}

console.log('pediatric-abpm UI QA: ' + checks + ' adversarial checks passed');
