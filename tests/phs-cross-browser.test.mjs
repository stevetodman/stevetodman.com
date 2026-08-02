// Cross-browser UI smoke test for Chromium, Firefox, and WebKit.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, firefox, webkit } from 'playwright';
import { startServer, watchForErrors } from './helpers/harness.mjs';

let server;
before(async () => { server = await startServer(); });
after(async () => { await server?.close(); });

const engines = { chromium, firefox, webkit };
const ranking = { maya: '1', eli: '2', nora: '3', jamal: '4' };

for (const [name, engine] of Object.entries(engines)) {
  test(`${name}: load, start, clock, select patient, history, exam, and pause`, { timeout: 90000 }, async () => {
    const browser = await engine.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const errors = watchForErrors(page);
    await page.goto(`${server.origin}/phs/`, { waitUntil: 'domcontentloaded' });
    await page.locator('#startBtn').waitFor();
    assert.match(await page.title(), /Pediatric Hospital Simulator/i);
    for (const [id, rank] of Object.entries(ranking)) await page.locator(`#initial-rank-${id}`).selectOption(rank);
    await page.locator('#startBtn').click();
    await page.locator('#prebrief').waitFor({ state: 'hidden' });
    const before = await page.locator('#clock').innerText();
    await page.waitForTimeout(1200);
    assert.notEqual(await page.locator('#clock').innerText(), before, `${name} clock did not advance`);
    await page.locator('[data-patient="maya"]').click();
    await page.locator('#historyInput').fill('How has she been feeding?');
    await page.locator('#askBtn').click();
    assert.match(await page.locator('#historyLog').innerText(), /less than half a bottle/i);
    await page.locator('[data-tab="exam"]').click();
    await page.locator('[data-exam="pulses"]').click();
    assert.match(await page.locator('#examLog').innerText(), /femoral pulses/i);
    await page.locator('#pauseBtn').click();
    const paused = await page.locator('#clock').innerText();
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('#clock').innerText(), paused, `${name} assessment pause did not freeze the clock`);
    assert.deepEqual([...new Set(errors)], []);
    await context.close();
    await browser.close();
  });
}
