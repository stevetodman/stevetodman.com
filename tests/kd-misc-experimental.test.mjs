import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

let server, browser;

const route = '/tools/kd-misc-experimental/';
const sourceDir = path.join(repoRoot, 'tools/kd-misc-experimental');
const readClinicalSource = () => [
  'index.html',
  'app.js',
  'evidence-registry.js',
].map(name => fs.readFileSync(path.join(sourceDir, name), 'utf8')).join('\n');

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

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

describe('experimental iKD vs MIS-C evidence workbench M1A', () => {
  test('loads source-locked experimental contract before interpretation', async () => {
    const { context, page, errors } = await openWorkbench();
    const banner = page.getByRole('note', { name: 'Experimental use warning' });
    await assert.doesNotReject(() => banner.waitFor({ state: 'visible' }));
    assert.match(await banner.innerText(), /NOT VALIDATED FOR DIAGNOSIS OR TREATMENT/i);
    assert.match(await page.locator('.status-chip').innerText(), /M1A SOURCE-LOCKED/i);
    assert.match(await page.locator('#source-lock-status').innerText(), /exact 2026 full text and supplement are not source-locked/i);

    const values = await page.locator('[data-evidence-input]').evaluateAll(nodes => nodes.map(node => node.value));
    assert.ok(values.length > 0);
    assert.ok(values.every(value => value === 'unknown'));
    assert.match(await page.locator('#evidence-state').innerText(), /INSUFFICIENT DISCRIMINATING DATA/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('uses one platelet input for Fan direction and CDC surveillance context', async () => {
    const { context, page, errors } = await openWorkbench();
    assert.equal(await page.locator('#platelet150').count(), 1);
    await page.locator('#platelet150').selectOption('yes');

    const fan = page.locator('[data-evidence-id="fan-platelet150"]');
    const cdc = page.locator('[data-evidence-id="cdc-platelet"]');
    assert.equal(await fan.count(), 1);
    assert.equal(await cdc.count(), 1);
    assert.match(await fan.innerText(), /27\/68 \(40%\).*0\/28 \(0%\).*P<\.001/i);
    assert.match(await cdc.innerText(), /Surveillance context/i);
    assert.match(await page.locator('#evidence-state').innerText(), /ONE-SIDED PUBLISHED ASSOCIATIONS PRESENT/i);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('surfaces near-exact evidence on both sides without choosing a winner', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#platelet150').selectOption('yes');
    await page.locator('#pyuria10').selectOption('yes');

    assert.equal(await page.locator('[data-evidence-id="fan-platelet150"]').count(), 1);
    const pyuria = page.locator('[data-evidence-id="fan-pyuria10"]');
    assert.equal(await pyuria.count(), 1);
    assert.match(await pyuria.innerText(), /12\/60 \(20%\).*14\/23 \(61%\).*P<\.001/i);
    assert.match(await page.locator('#evidence-state').innerText(), /DISCORDANT EVIDENCE — BOTH PHENOTYPES REPRESENTED/i);
    assert.doesNotMatch(await page.locator('.results').innerText(), /diagnosis:\s*(MIS-C|Kawasaki)/i);
    assert.doesNotMatch(await page.locator('.results').innerText(), /\b\d+(?:\.\d+)?%\s+(?:probability|likelihood)\b/i);
    await context.close();
  });

  test('does not convert GI symptoms into directional evidence in the Fan cohort', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#gi').selectOption('yes');

    assert.equal(await page.locator('#misc-evidence [data-evidence-id="fan-gi-overlap"]').count(), 0);
    assert.equal(await page.locator('#kd-evidence [data-evidence-id="fan-gi-overlap"]').count(), 0);
    const overlap = page.locator('#context-evidence [data-evidence-id="fan-gi-overlap"]');
    assert.equal(await overlap.count(), 1);
    assert.match(await overlap.innerText(), /91\.2%.*78\.6%.*P=\.102/i);
    assert.match(await overlap.innerText(), /not statistically discriminating/i);
    assert.match(await page.locator('#evidence-state').innerText(), /INSUFFICIENT DISCRIMINATING DATA/);
    await context.close();
  });

  test('oral changes and rash can contribute Fan direction while remaining AHA phenotype context', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#oral').selectOption('yes');
    await page.locator('#rash').selectOption('yes');

    assert.equal(await page.locator('[data-evidence-id="fan-oral"]').count(), 1);
    assert.equal(await page.locator('[data-evidence-id="fan-rash"]').count(), 1);
    assert.equal(await page.locator('[data-evidence-id="aha-oral"]').count(), 1);
    assert.equal(await page.locator('[data-evidence-id="aha-rash"]').count(), 1);
    assert.match(await page.locator('[data-evidence-id="fan-oral"]').innerText(), /35%.*64%.*P=\.009/i);
    assert.match(await page.locator('[data-evidence-id="fan-rash"]').innerText(), /56%.*82%.*P=\.015/i);
    await context.close();
  });

  test('keeps surveillance components separate and never counts them into a diagnosis', async () => {
    const { context, page } = await openWorkbench();
    assert.match(await page.locator('.definition-warning').nth(1).innerText(), /Surveillance definition — not diagnostic criteria/i);
    await page.locator('#hospitalized').selectOption('yes');
    await page.locator('#crp3').selectOption('yes');
    await page.locator('#sarscov2').selectOption('yes');
    await page.locator('#shock').selectOption('yes');

    const contextText = await page.locator('#context-evidence').innerText();
    assert.match(contextText, /Public-health surveillance/i);
    assert.doesNotMatch(contextText, /meets (?:the )?(?:CDC|MIS-C)/i);
    assert.match(await page.locator('#evidence-state').innerText(), /INSUFFICIENT DISCRIMINATING DATA/);
    await context.close();
  });

  test('shows non-thresholded Fan signals without converting them to inputs', async () => {
    const { context, page } = await openWorkbench();
    const signals = await page.locator('#study-signals').innerText();
    assert.match(signals, /Age[\s\S]*Median 8 years.*4 years.*P<\.001/i);
    assert.match(signals, /CRP[\s\S]*12\.5.*10\.9 mg\/dL.*P=\.162/i);
    assert.match(signals, /ALT[\s\S]*P=\.306/i);
    assert.equal(await page.locator('input[type="number"]').count(), 0);
    await context.close();
  });

  test('shows published-model input availability without calculating a model result', async () => {
    const { context, page } = await openWorkbench();
    const modelDefaults = await page.locator('[data-model-input]').evaluateAll(nodes => nodes.map(node => node.value));
    assert.ok(modelDefaults.every(value => value === 'unknown'));
    await page.locator('#model-age').selectOption('available');
    await page.locator('#model-crp').selectOption('available');
    const status = await page.locator('#model-status').innerText();
    assert.match(status, /Available: age, CRP/i);
    assert.match(status, /No model result is calculated/i);
    assert.match(await page.locator('[aria-labelledby="model-heading"]').innerText(), /external validation/i);
    await context.close();
  });

  test('reset and reload clear all case state synchronously', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#platelet150').selectOption('yes');
    await page.locator('#model-age').selectOption('available');
    await page.locator('#reset-all').click();
    assert.equal(await page.locator('#platelet150').inputValue(), 'unknown');
    assert.equal(await page.locator('#model-age').inputValue(), 'unknown');
    assert.equal(await page.locator('#misc-evidence .evidence-card').count(), 0);

    await page.locator('#pyuria10').selectOption('yes');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#pyuria10').inputValue(), 'unknown');
    assert.equal(await page.locator('#kd-evidence .evidence-card').count(), 0);
    await context.close();
  });

  test('interactions generate no network traffic after static assets load', async () => {
    const { context, page, requests } = await openWorkbench();
    const baseline = requests.length;
    await page.locator('#platelet150').selectOption('yes');
    await page.locator('#pyuria10').selectOption('yes');
    await page.locator('#model-age').selectOption('available');
    await page.waitForTimeout(100);
    assert.equal(requests.length, baseline, `unexpected request after interaction: ${requests.slice(baseline).join(', ')}`);
    await context.close();
  });

  test('mobile layout has no horizontal document overflow', async () => {
    const { context, page } = await openWorkbench();
    const dims = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    assert.ok(dims.scroll <= dims.client + 2, `${dims.scroll}px content in ${dims.client}px viewport`);
    await context.close();
  });
});

describe('M1A clinical and privacy source invariants', () => {
  test('contains no browser persistence, case API, or hidden patient text channel', () => {
    const html = fs.readFileSync(path.join(sourceDir, 'index.html'), 'utf8');
    const source = readClinicalSource();
    for (const forbidden of ['localStorage', 'sessionStorage', 'XMLHttpRequest']) {
      assert.equal(source.includes(forbidden), false, `${forbidden} must not appear in source`);
    }
    assert.equal(/\bfetch\s*\(/.test(source), false, 'must not make case-data network requests');
    assert.equal(/<textarea\b/i.test(html), false, 'must not expose a free-text patient field');
    assert.equal(/type=["'](?:text|date|email|tel)["']/i.test(html), false, 'must not expose identifier-friendly text/date/contact fields');
  });

  test('locks exact Fan directional and non-directional findings', () => {
    const source = readClinicalSource();
    assert.match(source, /27\/68 \(40%\).*0\/28 \(0%\).*P<\.001/i);
    assert.match(source, /29\/68 \(43%\).*5\/28 \(18%\).*P=\.021/i);
    assert.match(source, /12\/60 \(20%\).*14\/23 \(61%\).*P<\.001/i);
    assert.match(source, /3\/68 \(4%\).*11\/28 \(39%\).*P<\.001/i);
    assert.match(source, /15\/68 \(22%\).*1\/28 \(3\.6%\).*P=\.034/i);
    assert.match(source, /24\/68 \(35%\).*18\/28 \(64%\).*P=\.009/i);
    assert.match(source, /38\/68 \(56%\).*23\/28 \(82%\).*P=\.015/i);
    assert.match(source, /62\/68 \(91\.2%\).*22\/28 \(78\.6%\).*P=\.102/i);
    assert.match(source, /CRP.*12\.5.*10\.9 mg\/dL.*P=\.162/i);
  });

  test('locks source hierarchy and evidence limitations', () => {
    const source = readClinicalSource();
    assert.match(source, /Surveillance definition — not diagnostic criteria/i);
    assert.match(source, /requires external validation/i);
    assert.match(source, /no harmonized discriminator threshold was established/i);
    assert.match(source, /does not exclude MIS-C/i);
    assert.match(source, /NT-proBNP ≥1500 ng\/L/);
    assert.match(source, /Troponin I ≥20 ng\/L/);
    assert.match(source, /exact 2026 full text and supplement are not source-locked/i);
    assert.match(source, /No numeric result, threshold, effect estimate, or model weight from that paper is encoded/i);
    assert.doesNotMatch(source, /KIDMATCH-like/i);
  });

  test('contains no home-grown synthesis or actionable treatment/disposition payload', () => {
    const source = readClinicalSource();
    assert.doesNotMatch(source, /overall\s+(?:score|probability|likelihood)\s*[:=]/i);
    assert.doesNotMatch(source, /\b(?:give|administer|start)\s+(?:IVIG|steroids?|aspirin|anticoagulation)/i);
    assert.doesNotMatch(source, /\b(?:discharge|admit|transfer)\s+(?:the\s+)?patient\b/i);
  });
});