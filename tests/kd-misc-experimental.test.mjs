import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

let server, browser;

const route = '/tools/kd-misc-experimental/';
const sourceDir = path.join(repoRoot, 'tools/kd-misc-experimental');

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

describe('experimental iKD vs MIS-C evidence workbench', () => {
  test('loads with the experimental safety contract before any interpretation', async () => {
    const { context, page, errors } = await openWorkbench();

    const banner = page.getByRole('note', { name: 'Experimental use warning' });
    await assert.doesNotReject(() => banner.waitFor({ state: 'visible' }));
    assert.match(await banner.innerText(), /NOT VALIDATED FOR DIAGNOSIS OR TREATMENT/i);
    assert.match(await page.locator('.lede').innerText(), /without producing a diagnosis, score, probability, treatment recommendation, or disposition recommendation/i);

    const values = await page.locator('[data-evidence-input]').evaluateAll(nodes => nodes.map(node => node.value));
    assert.ok(values.length > 0);
    assert.ok(values.every(value => value === 'unknown'), `expected every interpreted input to default to Unknown: ${values.join(', ')}`);
    assert.match(await page.locator('#evidence-state').innerText(), /INSUFFICIENT DISCRIMINATING DATA/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('surfaces source-attributed evidence and preserves discordance instead of choosing a winner', async () => {
    const { context, page, errors } = await openWorkbench();

    await page.locator('#gi').selectOption('yes');
    const giCard = page.locator('[data-evidence-id="fan-gi"]');
    assert.equal(await giCard.count(), 1);
    assert.match(await giCard.innerText(), /Fan et al\., Hospital Pediatrics 2023/i);
    assert.match(await page.locator('#evidence-state').innerText(), /ONE-SIDED PUBLISHED ASSOCIATIONS PRESENT/i);

    await page.locator('#pyuria').selectOption('yes');
    const pyuriaCard = page.locator('[data-evidence-id="fan-pyuria"]');
    assert.equal(await pyuriaCard.count(), 1);
    assert.match(await pyuriaCard.innerText(), /Pyuria was more frequent in iKD/i);
    assert.match(await page.locator('#evidence-state').innerText(), /DISCORDANT EVIDENCE — BOTH PHENOTYPES REPRESENTED/i);

    assert.doesNotMatch(await page.locator('.results').innerText(), /diagnosis:\s*(MIS-C|Kawasaki)/i);
    assert.doesNotMatch(await page.locator('.results').innerText(), /\b\d+(?:\.\d+)?%\s+(?:MIS-C|Kawasaki|KD)\b/i);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('does not convert absent findings into opposite-direction evidence', async () => {
    const { context, page } = await openWorkbench();

    await page.locator('#gi').selectOption('no');
    await page.locator('#pyuria').selectOption('no');
    assert.equal(await page.locator('#misc-evidence .evidence-card').count(), 0);
    assert.equal(await page.locator('#kd-evidence .evidence-card').count(), 0);
    assert.match(await page.locator('#evidence-state').innerText(), /INSUFFICIENT DISCRIMINATING DATA/);

    await context.close();
  });

  test('keeps surveillance components separate and never counts them into a diagnosis', async () => {
    const { context, page } = await openWorkbench();

    assert.match(await page.locator('.definition-warning').innerText(), /Surveillance definition — not diagnostic criteria/i);
    await page.locator('#hospitalized').selectOption('yes');
    await page.locator('#crp3').selectOption('yes');
    await page.locator('#sarscov2').selectOption('yes');
    await page.locator('#shock').selectOption('yes');
    await page.locator('#platelet150').selectOption('yes');
    await page.locator('#alc1000').selectOption('yes');

    const contextText = await page.locator('#context-evidence').innerText();
    assert.match(contextText, /Public-health surveillance/i);
    assert.doesNotMatch(contextText, /meets (?:the )?(?:CDC|MIS-C)/i);
    assert.match(await page.locator('#evidence-state').innerText(), /INSUFFICIENT DISCRIMINATING DATA/);

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

  test('reset and reload clear all case state', async () => {
    const { context, page } = await openWorkbench();

    await page.locator('#gi').selectOption('yes');
    await page.locator('#model-age').selectOption('available');
    await page.locator('#reset-all').click();
    assert.equal(await page.locator('#gi').inputValue(), 'unknown');
    assert.equal(await page.locator('#model-age').inputValue(), 'unknown');
    assert.equal(await page.locator('#misc-evidence .evidence-card').count(), 0);

    await page.locator('#pyuria').selectOption('yes');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#pyuria').inputValue(), 'unknown');
    assert.equal(await page.locator('#kd-evidence .evidence-card').count(), 0);

    await context.close();
  });

  test('interactions generate no network traffic after static assets load', async () => {
    const { context, page, requests } = await openWorkbench();
    const baseline = requests.length;

    await page.locator('#gi').selectOption('yes');
    await page.locator('#pyuria').selectOption('yes');
    await page.locator('#model-age').selectOption('available');
    await page.waitForTimeout(100);

    assert.equal(requests.length, baseline, `unexpected request after interaction: ${requests.slice(baseline).join(', ')}`);
    await context.close();
  });

  test('mobile layout has no horizontal document overflow', async () => {
    const { context, page } = await openWorkbench();
    const dims = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth
    }));
    assert.ok(dims.scroll <= dims.client + 2, `${dims.scroll}px content in ${dims.client}px viewport`);
    await context.close();
  });
});

describe('clinical and privacy source invariants', () => {
  test('contains no browser persistence, case API, or hidden patient text channel', () => {
    const html = fs.readFileSync(path.join(sourceDir, 'index.html'), 'utf8');
    const js = fs.readFileSync(path.join(sourceDir, 'app.js'), 'utf8');
    const source = `${html}\n${js}`;

    for (const forbidden of ['localStorage', 'sessionStorage', 'XMLHttpRequest']) {
      assert.equal(source.includes(forbidden), false, `${forbidden} must not appear in v0.1 source`);
    }
    assert.equal(/\bfetch\s*\(/.test(source), false, 'v0.1 must not make case-data network requests');
    assert.equal(/<textarea\b/i.test(html), false, 'v0.1 must not expose a free-text patient field');
    assert.equal(/type=["'](?:text|date|email|tel)["']/i.test(html), false, 'v0.1 must not expose identifier-friendly text/date/contact fields');
  });

  test('locks the known evidence limitations into the shipped clinical text', () => {
    const html = fs.readFileSync(path.join(sourceDir, 'index.html'), 'utf8');
    const js = fs.readFileSync(path.join(sourceDir, 'app.js'), 'utf8');
    const source = `${html}\n${js}`;

    assert.match(source, /Surveillance definition — not diagnostic criteria/i);
    assert.match(source, /requires external validation/i);
    assert.match(source, /No harmonized diagnostic discriminator threshold was established/i);
    assert.match(source, /does not exclude MIS-C/i);
    assert.match(source, /NT-proBNP ≥1500 ng\/L/);
    assert.match(source, /Troponin I ≥20 ng\/L/);
    assert.match(source, /numeric integration is gated on verified full-text\/supplement extraction/i);
    assert.doesNotMatch(source, /KIDMATCH-like/i);
  });

  test('contains no actionable treatment or disposition payload', () => {
    const html = fs.readFileSync(path.join(sourceDir, 'index.html'), 'utf8');
    const js = fs.readFileSync(path.join(sourceDir, 'app.js'), 'utf8');
    const source = `${html}\n${js}`;

    assert.doesNotMatch(source, /\b(?:give|administer|start)\s+(?:IVIG|steroids?|aspirin|anticoagulation)/i);
    assert.doesNotMatch(source, /\b(?:discharge|admit|transfer)\s+(?:the\s+)?patient\b/i);
  });
});
