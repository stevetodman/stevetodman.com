import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

test('homepage search submits a shareable query to the site search page', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  await page.goto(server.origin + '/');
  await page.locator('#home-search').fill('hypertension');
  await page.locator('.site-search button[type="submit"]').click();

  await page.waitForURL(server.origin + '/search/?q=hypertension');
  assert.equal(await page.locator('#query').inputValue(), 'hypertension');
  await page.waitForFunction(() => document.querySelector('#meta')?.textContent?.includes('for “hypertension”'));
  assert.ok(await page.locator('.result').count() > 0, 'expected at least one search result');

  await context.close();
});

test('search query string prefills the input and live edits keep the URL shareable', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(server.origin + '/search/?q=PALS');
  assert.equal(await page.locator('#query').inputValue(), 'PALS');
  await page.waitForFunction(() => document.querySelector('#meta')?.textContent?.includes('for “PALS”'));

  await page.locator('#query').fill('genetics');
  await page.waitForURL(server.origin + '/search/?q=genetics');
  assert.ok(await page.locator('.result').count() > 0, 'expected live search results after editing query');

  await context.close();
});
