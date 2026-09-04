import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

let server, browser;

const route = '/tools/kd-misc-experimental/';
const sourceDir = path.join(repoRoot, 'tools', 'kd-misc-experimental');
const readClinicalSource = () => [
  'index.html',
  'app.js',
  'evidence-registry.js',
  'evidence-2026.js',
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

describe('experimental iKD vs MIS-C evidence workbench M1B-main', () => {
  test('loads the exact 2026 main-paper lock with Unknown-safe defaults', async () => {
    const { context, page, errors } = await openWorkbench();
    assert.match(await page.getByRole('note', { name: 'Experimental use warning' }).innerText(), /NOT VALIDATED FOR DIAGNOSIS OR TREATMENT/i);
    assert.match(await page.locator('.status-chip').innerText(), /M1B MAIN ARTICLE SOURCE-LOCKED/i);
    assert.match(await page.locator('#source-lock-status').innerText(), /exact 2026 final main article is source-locked/i);
    assert.match(await page.locator('#source-lock-status').innerText(), /supplemental table remains pending/i);
    assert.equal(await page.locator('html').getAttribute('data-evidence-version'), '0.3-m1b-main');

    const values = await page.locator('[data-evidence-input]').evaluateAll(nodes => nodes.map(node => node.value));
    assert.ok(values.length > 0);
    assert.ok(values.every(value => value === 'unknown'));
    assert.match(await page.locator('#evidence-state').innerText(), /INSUFFICIENT DISCRIMINATING DATA/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('surfaces exact 2026 GI component associations without inventing a generic GI rule', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#abdominal-pain').selectOption('yes');
    await page.locator('#diarrhea').selectOption('yes');
    await page.locator('#vomiting').selectOption('yes');

    assert.match(await page.locator('[data-evidence-id="h26-abdominal-pain"]').innerText(), /64%.*19%.*25%.*P<\.01/i);
    assert.match(await page.locator('[data-evidence-id="h26-diarrhea"]').innerText(), /47%.*27%.*29%.*P<\.01/i);
    assert.match(await page.locator('[data-evidence-id="h26-vomiting"]').innerText(), /59%.*37%.*41%.*P<\.01/i);
    assert.match(await page.locator('#evidence-state').innerText(), /ONE-SIDED PUBLISHED ASSOCIATIONS PRESENT/i);

    await page.locator('#gi').selectOption('yes');
    const generic = page.locator('#context-evidence [data-evidence-id="fan-gi-overlap"]');
    assert.equal(await generic.count(), 1);
    assert.match(await generic.innerText(), /91\.2%.*78\.6%.*P=\.102/i);
    await context.close();
  });

  test('adds exact 2026 KD-phenotype associations while preserving overlap context', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#rash').selectOption('yes');
    await page.locator('#oral').selectOption('yes');
    await page.locator('#conjunctivitis').selectOption('yes');
    await page.locator('#extremity').selectOption('yes');
    await page.locator('#nodes').selectOption('yes');

    assert.match(await page.locator('[data-evidence-id="h26-rash"]').innerText(), /50%.*69%.*68%.*P<\.01/i);
    assert.match(await page.locator('[data-evidence-id="h26-oral"]').innerText(), /36%.*43%.*46%.*P=\.01/i);
    assert.match(await page.locator('[data-evidence-id="h26-conjunctivitis"]').innerText(), /58%.*62%.*71%.*P<\.01/i);
    assert.match(await page.locator('[data-evidence-id="h26-extremity"]').innerText(), /25%.*36%.*32%.*P<\.01/i);
    assert.equal(await page.locator('#context-evidence [data-evidence-id="h26-nodes"]').count(), 1);
    assert.match(await page.locator('[data-evidence-id="h26-nodes"]').innerText(), /26%.*30%.*22%.*P=\.16/i);
    assert.equal(await page.locator('[data-evidence-id="aha-rash"]').count(), 1);
    assert.equal(await page.locator('[data-evidence-id="fan-rash"]').count(), 1);
    await context.close();
  });

  test('shows coronary incorporation-bias context instead of treating the exact cohort as a simple rule', async () => {
    const { context, page } = await openWorkbench();
    await page.locator('#coronary-aneurysm').selectOption('yes');
    assert.equal(await page.locator('[data-evidence-id="lee-coronary"]').count(), 1);
    const exact = page.locator('#context-evidence [data-evidence-id="h26-coronary-context"]');
    assert.equal(await exact.count(), 1);
    assert.match(await exact.innerText(), /11%.*8%.*41%.*P<\.01/i);
    assert.match(await exact.innerText(), /incorporation bias/i);
    await context.close();
  });

  test('keeps continuous 2026 results as group signals and does not calculate Starnes', async () => {
    const { context, page } = await openWorkbench();
    const signals = await page.locator('#study-signals').innerText();
    assert.match(signals, /2026 target cohort — Age[\s\S]*7\.4 years.*2\.5.*2\.3.*P<\.01/i);
    assert.match(signals, /2026 target cohort — WBC[\s\S]*9\.0.*12\.2.*17\.4.*P<\.001/i);
    assert.match(signals, /2026 target cohort — CRP[\s\S]*103 mg\/L.*71.*83.*P<\.001/i);
    assert.match(signals, /2026 target cohort — NT-proBNP[\s\S]*776.*377.*510.*P<\.02/i);
    assert.match(signals, /Creatinine[\s\S]*unit is implausible/i);
    assert.equal(await page.locator('input[type="number"]').count(), 0);

    await page.locator('#model-age').selectOption('available');
    await page.locator('#model-crp').selectOption('available');
    const status = await page.locator('#model-status').innerText();
    assert.match(status, /Available: age, CRP/i);
    assert.match(status, /No model result is calculated/i);
    await context.close();
  });

  test('reset, privacy, no-interaction-network, and 390px mobile invariants hold', async () => {
    const { context, page, requests } = await openWorkbench();
    const baseline = requests.length;
    await page.locator('#abdominal-pain').selectOption('yes');
    await page.locator('#rash').selectOption('yes');
    await page.locator('#model-age').selectOption('available');
    await page.waitForTimeout(50);
    assert.equal(requests.length, baseline, `unexpected request after interaction: ${requests.slice(baseline).join(', ')}`);

    await page.locator('#reset-all').click();
    assert.equal(await page.locator('#abdominal-pain').inputValue(), 'unknown');
    assert.equal(await page.locator('#rash').inputValue(), 'unknown');
    assert.equal(await page.locator('#model-age').inputValue(), 'unknown');
    assert.equal(await page.locator('.evidence-card[data-evidence-id]').count(), 0);

    const dims = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    assert.ok(dims.scroll <= dims.client + 2, `${dims.scroll}px content in ${dims.client}px viewport`);
    await context.close();
  });
});

describe('M1B-main clinical source and safety invariants', () => {
  test('locks exact 2026 cohort, categorical results, and source limitations', () => {
    const source = readClinicalSource();
    assert.match(source, /769 non-severe MIS-C, 372 unconfirmed incomplete KD, and 146 confirmed incomplete KD/i);
    assert.match(source, /40 centers in 8 countries/i);
    assert.match(source, /doi:10\.1007\/s00246-026-04444-4/i);
    assert.match(source, /491\/769 \(64%\).*71\/372 \(19%\).*36\/146 \(25%\).*P<\.01/i);
    assert.match(source, /388\/769 \(50%\).*257\/372 \(69%\).*99\/146 \(68%\).*P<\.01/i);
    assert.match(source, /202\/769 \(26%\).*111\/372 \(30%\).*32\/146 \(22%\).*P=\.16/i);
    assert.match(source, /86\/769 \(11%\).*31\/372 \(8%\).*60\/146 \(41%\).*P<\.01/i);
    assert.match(source, /electronic supplemental table remains pending/i);
    assert.match(source, /No cutoff is inferred from a 2026 median, IQR, or omnibus P value/i);
  });

  test('contains no persistence, hidden patient text channel, home-grown probability, or treatment/disposition payload', () => {
    const html = fs.readFileSync(path.join(sourceDir, 'index.html'), 'utf8');
    const source = readClinicalSource();
    for (const forbidden of ['localStorage', 'sessionStorage', 'XMLHttpRequest']) {
      assert.equal(source.includes(forbidden), false, `${forbidden} must not appear in source`);
    }
    assert.equal(/\bfetch\s*\(/.test(source), false, 'must not make case-data network requests');
    assert.equal(/<textarea\b/i.test(html), false, 'must not expose a free-text patient field');
    assert.equal(/type=["'](?:text|date|email|tel)["']/i.test(html), false, 'must not expose identifier-friendly text/date/contact fields');
    assert.doesNotMatch(source, /overall\s+(?:score|probability|likelihood)\s*[:=]/i);
    assert.doesNotMatch(source, /\b(?:give|administer|start)\s+(?:IVIG|steroids?|aspirin|anticoagulation)/i);
    assert.doesNotMatch(source, /\b(?:discharge|admit|transfer)\s+(?:the\s+)?patient\b/i);
    assert.doesNotMatch(source, /KIDMATCH-like/i);
  });
});