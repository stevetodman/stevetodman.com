import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

let server, browser;
const route = '/tools/kd-misc-experimental/';
const sourceDir = path.join(repoRoot, 'tools', 'kd-misc-experimental');
const readClinicalSource = () => ['index.html', 'app.js', 'evidence-registry.js', 'evidence-2026.js']
  .map(name => fs.readFileSync(path.join(sourceDir, name), 'utf8')).join('\n');

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});
after(async () => { await browser?.close(); await server?.close(); });

async function openWorkbench() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  const response = await page.goto(server.origin + route, { waitUntil: 'networkidle' });
  assert.equal(response?.status(), 200);
  return { context, page, errors, requests };
}

describe('experimental iKD vs MIS-C workbench M1B complete', () => {
  test('loads full source lock with Unknown-safe defaults', async () => {
    const { context, page, errors } = await openWorkbench();
    assert.match(await page.getByRole('note', { name: 'Experimental use warning' }).innerText(), /NOT VALIDATED FOR DIAGNOSIS OR TREATMENT/i);
    assert.match(await page.locator('.status-chip').innerText(), /M1B FULL SOURCE-LOCKED/i);
    assert.match(await page.locator('#source-lock-status').innerText(), /main article and its electronic supplemental table are source-locked/i);
    assert.equal(await page.locator('html').getAttribute('data-evidence-version'), '0.4-m1b-complete');
    const values = await page.locator('[data-evidence-input]').evaluateAll(nodes => nodes.map(node => node.value));
    assert.ok(values.length > 0 && values.every(v => v === 'unknown'));
    assert.match(await page.locator('#evidence-state').innerText(), /INSUFFICIENT DISCRIMINATING DATA/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('preserves exact 2026 categorical associations without a winner', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#target-age').selectOption('5-9');
    await page.locator('#icu-level-care').selectOption('no');
    await page.locator('#pretreatment').selectOption('yes');
    await page.locator('#abdominal-pain').selectOption('yes');
    await page.locator('#rash').selectOption('yes');
    assert.match(await page.locator('[data-evidence-id="h26-abdominal-pain"]').innerText(), /64%.*19%.*25%.*P<\.01/i);
    assert.match(await page.locator('[data-evidence-id="h26-rash"]').innerText(), /50%.*69%.*68%.*P<\.01/i);
    assert.match(await page.locator('#evidence-state').innerText(), /DISCORDANT EVIDENCE — BOTH PHENOTYPES REPRESENTED/i);
    assert.doesNotMatch(await page.locator('.results').innerText(), /diagnosis:\s*(MIS-C|Kawasaki)/i);
    await context.close();
  });

  test('preserves coronary incorporation-bias context', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#coronary-aneurysm').selectOption('yes');
    const exact = page.locator('#context-evidence [data-evidence-id="h26-coronary-context"]');
    assert.equal(await exact.count(), 1);
    assert.match(await exact.innerText(), /11%.*8%.*41%.*P<\.01/i);
    assert.match(await exact.innerText(), /incorporation bias/i);
    await context.close();
  });

  test('renders supplement extreme-value signals without numeric bedside inputs', async () => {
    const { context, page } = await openWorkbench();
    const signals = await page.locator('#study-signals').innerText();
    assert.match(signals, /2026 supplement — Highest WBC[\s\S]*12\.8.*14\.2.*19\.9.*P<\.01/i);
    assert.match(signals, /2026 supplement — Highest CRP[\s\S]*139 mg\/L.*90.*112.*P<\.01/i);
    assert.match(signals, /2026 supplement — Highest ferritin[\s\S]*331.*182.*200.*P<\.01/i);
    assert.match(signals, /2026 supplement — Peak transaminases[\s\S]*38 U\/L.*26.*35.*P<\.01[\s\S]*47 U\/L.*42.*46.*P=\.01/i);
    assert.match(signals, /2026 supplement — Lowest albumin[\s\S]*29 g\/L.*32.*29.*P<\.01/i);
    assert.match(signals, /2026 supplement — Highest creatinine[\s\S]*43\.3.*28\.3.*26\.5/i);
    assert.equal(await page.locator('input[type="number"]').count(), 0);
    await context.close();
  });

  test('retains Fan aggregate GI as context while using 2026 component symptoms separately', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#gi').selectOption('yes');
    assert.equal(await page.locator('#context-evidence [data-evidence-id="fan-gi-overlap"]').count(), 1);
    assert.match(await page.locator('#evidence-state').innerText(), /INSUFFICIENT DISCRIMINATING DATA/);
    await page.locator('#vomiting').selectOption('yes');
    assert.equal(await page.locator('#misc-evidence [data-evidence-id="h26-vomiting"]').count(), 1);
    await context.close();
  });

  test('keeps Starnes as input availability only', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#model-age').selectOption('available');
    await page.locator('#model-crp').selectOption('available');
    assert.match(await page.locator('#model-status').innerText(), /Available: age, CRP/i);
    assert.match(await page.locator('#model-status').innerText(), /No model result is calculated/i);
    await context.close();
  });

  test('blocks likelihood interpretation outside the non-severe target phenotype', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#icu-level-care').selectOption('yes');
    assert.match(await page.locator('#applicability-state').innerText(), /OUTSIDE TARGET PHENOTYPE/i);
    assert.match(await page.locator('#evidence-state').innerText(), /LIKELIHOOD NOT INTERPRETED/i);
    await context.close();
  });

  test('distinguishes assessed-absent findings from unknown data', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('[data-evidence-input]').evaluateAll(nodes => {
      for (const node of nodes) node.value = 'no';
      nodes[0].dispatchEvent(new Event('change', { bubbles: true }));
    });
    assert.match(await page.locator('#evidence-state').innerText(), /NO POSITIVE DIRECTIONAL FINDINGS/i);
    assert.match(await page.locator('#data-completeness').innerText(), /0 unknown/i);
    await context.close();
  });

  test('groups repeated studies under one patient finding', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#rash').selectOption('yes');
    assert.equal(await page.locator('#kd-evidence .evidence-group').count(), 1);
    assert.equal(await page.locator('#kd-evidence [data-evidence-id]').count(), 2);
    await context.close();
  });

  test('reset, no-interaction-network, and 390px mobile invariants hold', async () => {
    const { context, page, requests } = await openWorkbench();
    const baseline = requests.length;
    await page.locator('#abdominal-pain').selectOption('yes');
    await page.locator('#rash').selectOption('yes');
    await page.waitForTimeout(50);
    assert.equal(requests.length, baseline);
    await page.locator('#reset-all').click();
    assert.equal(await page.locator('#abdominal-pain').inputValue(), 'unknown');
    assert.equal(await page.locator('#rash').inputValue(), 'unknown');
    assert.equal(await page.locator('#target-age').inputValue(), 'unknown');
    assert.equal(await page.locator('#icu-level-care').inputValue(), 'unknown');
    const dims = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    assert.ok(dims.scroll <= dims.client + 2, `${dims.scroll}px content in ${dims.client}px viewport`);
    await context.close();
  });
});

describe('M1B-complete clinical safety invariants', () => {
  test('locks exact source status and supplement values', () => {
    const source = readClinicalSource();
    assert.match(source, /M1B_FULL_SOURCE_LOCK_COMPLETE/);
    assert.match(source, /0\.4-m1b-complete/);
    assert.match(source, /246_2026_4444_MOESM1_ESM\.docx/);
    assert.match(source, /12\.8 ×10⁹\/L.*14\.2.*19\.9.*P<\.01/i);
    assert.match(source, /139 mg\/L.*90.*112.*P<\.01/i);
    assert.match(source, /331 µg\/L.*182.*200.*P<\.01/i);
    assert.match(source, /No cutoff is inferred from a 2026 median, IQR, peak\/trough value, or omnibus P value/i);
  });

  test('contains no persistence, patient free text, synthetic probability, or management payload', () => {
    const html = fs.readFileSync(path.join(sourceDir, 'index.html'), 'utf8');
    const source = readClinicalSource();
    for (const forbidden of ['localStorage', 'sessionStorage', 'XMLHttpRequest']) assert.equal(source.includes(forbidden), false);
    assert.equal(/\bfetch\s*\(/.test(source), false);
    assert.equal(/<textarea\b/i.test(html), false);
    assert.equal(/type=["'](?:text|date|email|tel)["']/i.test(html), false);
    assert.doesNotMatch(source, /overall\s+(?:score|probability|likelihood)\s*[:=]/i);
    assert.doesNotMatch(source, /\b(?:give|administer|start)\s+(?:IVIG|steroids?|aspirin|anticoagulation)/i);
    assert.doesNotMatch(source, /\b(?:discharge|admit|transfer)\s+(?:the\s+)?patient\b/i);
    assert.doesNotMatch(source, /KIDMATCH-like/i);
  });
});
