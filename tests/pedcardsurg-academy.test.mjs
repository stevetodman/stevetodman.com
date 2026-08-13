import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function openModule(viewport = { width: 1180, height: 900 }) {
  const page = await browser.newPage({ viewport });
  const errors = watchForErrors(page);
  await page.goto(server.origin + '/pedcardsurg/', { waitUntil: 'networkidle' });
  return { page, errors };
}

describe('PedCardSurg congenital surgery academy', () => {
  test('loads the complete 12/55/26/44 curriculum without runtime errors', async () => {
    const { page, errors } = await openModule();
    assert.equal(await page.locator('#procedureButtons button').count(), 12);
    assert.equal(await page.locator('#ptedLibrary .libitem').count(), 55);
    assert.equal(await page.locator('#eponymsGrid .eponym').count(), 26);
    assert.match(await page.locator('#quizApp').textContent(), /44-question mastery assessment/);
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('visualizer changes the before/after operative transformation', async () => {
    const { page } = await openModule();
    assert.match(await page.locator('#vizContent h3').textContent(), /VSD Closure/);
    await page.getByRole('button', { name: /Arterial Switch Operation/ }).click();
    assert.match(await page.locator('#vizContent h3').textContent(), /Arterial Switch Operation/);
    assert.match(await page.locator('#vizContent').textContent(), /CORONARY|coronary/i);
    assert.equal(await page.locator('#vizContent svg').count(), 2);
    await page.close();
  });

  test('PTED library is searchable and retains external visual links', async () => {
    const { page } = await openModule();
    await page.locator('#ptedSearch').fill('Fontan');
    const rows = page.locator('#ptedLibrary .libitem');
    assert.ok(await rows.count() >= 1);
    assert.match(await page.locator('#ptedCount').textContent(), /of 55/);
    const href = await rows.first().locator('a').getAttribute('href');
    assert.match(href, /^https:\/\/www\.pted\.org\//);
    await page.locator('#ptedType').selectOption('Cath');
    assert.equal(await page.locator('#ptedLibrary .libitem').count(), 0);
    await page.locator('#ptedSearch').fill('');
    assert.equal(await page.locator('#ptedLibrary .libitem').count(), 4);
    await page.close();
  });

  test('mastery assessment gives immediate explanation and uses the 80% threshold', async () => {
    const { page } = await openModule();
    await page.locator('#startQuiz').click();
    assert.match(await page.locator('#quizApp').textContent(), /Question 1 \/ 44/);
    assert.equal(await page.locator('.answer').count(), 4);
    await page.locator('.answer').first().click();
    assert.equal(await page.locator('#feedback .explanation').isVisible(), true);
    assert.equal(await page.locator('.answer:disabled').count(), 4);
    assert.match(await page.locator('#feedback').textContent(), /(Correct|Not quite)/);
    await page.close();
  });

  test('resident-facing clinical guardrails are explicit and corrected concepts remain present', () => {
    const html = fs.readFileSync(path.join(repoRoot, 'pedcardsurg/index.html'), 'utf8');
    const content = fs.readFileSync(path.join(repoRoot, 'pedcardsurg/assets/content.js'), 'utf8');
    const all = html + content;
    assert.match(all, /PTED.*visual.*not.*source of truth|Use PTED visually, not prescriptively/is);
    assert.match(all, /transatrial exposure through the tricuspid valve/i);
    assert.match(all, /bicuspid aortic valve/i);
    assert.match(all, /Warden/i);
    assert.match(all, /Yasui/i);
    assert.match(all, /Damus.Kaye.Stansel/i);
    assert.match(all, /procedure category is not identical to an individual patient's predicted risk/i);
    assert.match(all, /80%/);
    assert.match(all, /August 12, 2026/);
  });

  test('mobile layout does not create page-level horizontal overflow', async () => {
    const { page, errors } = await openModule({ width: 390, height: 844 });
    const dimensions = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.ok(dimensions.scrollWidth <= dimensions.innerWidth + 1,
      `horizontal overflow: ${dimensions.scrollWidth}px > ${dimensions.innerWidth}px`);
    assert.deepEqual(errors, []);
    await page.close();
  });
});
