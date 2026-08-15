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
  test('loads the complete 9/55/26/44 atlas and curriculum without runtime errors', async () => {
    const { page, errors } = await openModule();
    assert.equal(await page.locator('#atlasButtons button').count(), 9);
    assert.equal(await page.locator('#ptedLibrary .libitem').count(), 55);
    assert.equal(await page.locator('#eponymsGrid .eponym').count(), 26);
    assert.match(await page.locator('#quizApp').textContent(), /44-question mastery assessment/);
    assert.equal(await page.locator('#visual-lab, #lesions, #outcomes').count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
  });

  test('CHD Atlas uses the supplied primary images with semantic mapping and WebP delivery', async () => {
    const { page, errors } = await openModule();
    const image = page.locator('#atlasViewer img');
    assert.match(await image.getAttribute('alt'), /patent ductus arteriosus/i);
    await page.waitForFunction(() => document.querySelector('#atlasViewer img')?.currentSrc.endsWith('pda-ligation-division.webp'));

    await page.getByRole('button', { name: /Norwood stage I reconstruction/ }).click();
    assert.match(await page.locator('#atlasViewer h3').textContent(), /Norwood stage I reconstruction/);
    await page.waitForFunction(() => document.querySelector('#atlasViewer img')?.currentSrc.endsWith('norwood-stage-1-reconstruction.webp'));

    await page.getByRole('button', { name: /Complete atrioventricular canal repair/ }).click();
    await page.waitForFunction(() => document.querySelector('#atlasViewer img')?.currentSrc.endsWith('complete-av-canal-repair-clean.webp'));
    assert.doesNotMatch(await image.getAttribute('alt'), /postoperative echocardiogram/i);
    assert.match(await page.locator('#atlasViewer').textContent(), /not an isolated ASD closure/i);

    await page.getByRole('button', { name: /Classic Blalock–Taussig shunt/ }).click();
    await page.waitForFunction(() => document.querySelector('#atlasViewer img')?.currentSrc.endsWith('classic-blalock-taussig-shunt.webp'));
    assert.match(await page.locator('#atlasViewer').textContent(), /subclavian artery/i);

    const atlasDir = path.join(repoRoot, 'pedcardsurg', 'assets', 'chd-atlas');
    assert.equal(fs.readdirSync(atlasDir).filter(name => name.endsWith('.png')).length, 9);
    assert.equal(fs.readdirSync(atlasDir).filter(name => name.endsWith('.webp')).length, 9);
    assert.deepEqual(errors, []);
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
    assert.doesNotMatch(html, /Visual Surgery Lab|Key lesions by operative problem|Read STAT categories correctly/i);
    assert.match(html, /assets\/content\.js\?v=20260813-4/);
    assert.match(html, /assets\/app\.js\?v=20260813-4/);
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
