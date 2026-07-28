#!/usr/bin/env node
'use strict';

/* Immutable-file/static-policy release gate for the noindex preview. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const core = require('./pediatric-abpm-core.js');

const root = __dirname;
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'pediatric-abpm-release-manifest.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'pediatric-abpm-pathway-preview.html'), 'utf8');
const coreSource = fs.readFileSync(path.join(root, 'pediatric-abpm-core.js'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'pediatric-abpm-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'pediatric-abpm-pathway-preview.css'), 'utf8');
let checks = 0;
function ok(value, message) { checks += 1; assert.ok(value, message); }
function equal(value, expected, message) { checks += 1; assert.equal(value, expected, message); }
function sri(file) { return 'sha384-' + crypto.createHash('sha384').update(fs.readFileSync(path.join(root, file))).digest('base64'); }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'); }

Object.entries(manifest.assets).forEach(function(entry) {
    const file = entry[0];
    const expected = entry[1];
    equal(sri(file), expected, file + ' SRI hash must match release manifest');
    ok(html.includes('href="' + file + '" integrity="' + expected + '"') || html.includes('src="' + file + '" defer integrity="' + expected + '"'), file + ' must be integrity-pinned in HTML');
});

equal(core.VERSION, manifest.algorithm.version, 'algorithm version must match manifest');
equal(core.RULESET_ID, manifest.algorithm.rulesetId, 'ruleset ID must match manifest');
equal(core.RULESET_SHA256, manifest.algorithm.rulesetSha256, 'ruleset SHA must match manifest');
equal(sha256('pediatric-abpm-rules-v1.1.json'), manifest.algorithm.rulesetSha256, 'ruleset file SHA must match manifest');

ok(/<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">/.test(html), 'noindex meta must be present');
ok(/connect-src 'none'/.test(html) && /form-action 'none'/.test(html) && /base-uri 'none'/.test(html) && /object-src 'none'/.test(html), 'prepared CSP must block egress/form/object/base');
ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html), 'HTML may not contain inline script');
ok(!/<style[\s>]/.test(html) && !/\sstyle=/.test(html), 'HTML may not contain inline CSS/style attributes');
ok(!/input[^>]+type="date"/i.test(html) && !/id="dob"|id="studyDate"/.test(html), 'direct date identifiers must be absent');
ok(!/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(coreSource + ui), 'source must not contain storage or egress APIs');
ok(!/innerHTML|outerHTML|document\.write/.test(ui), 'UI rendering must not use dynamic HTML injection');
ok(!/\.style\./.test(ui), 'UI must not rely on dynamic inline style under strict CSP');
ok(css.includes('@media (max-width: 760px)') && css.includes('.table-wrap { display: none; }'), 'mobile result tables must have a card-mode fallback');

console.log('pediatric-abpm release gate: ' + checks + ' checks passed');
