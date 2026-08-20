import { test, before, after, describe } from 'node:test';
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

describe('resident education local progress', () => {
  test('remembers the last module chosen from the hub without an account or network event', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const unexpected = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin !== server.origin) unexpected.push(request.url());
    });

    await page.goto(server.origin + '/education/');
    assert.equal(await page.locator('#continue-learning').isHidden(), true);

    await page.locator('a[href="/hypertension/"][data-learning-route]').click();
    await page.waitForURL(server.origin + '/hypertension/');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('stevetodman-learning-recent-v1')));
    assert.deepEqual(
      { route: stored.route, title: stored.title },
      { route: '/hypertension/', title: 'Pediatric Hypertension & ABPM' }
    );
    assert.equal(typeof stored.savedAt, 'number');

    await page.goto(server.origin + '/education/');
    assert.equal(await page.locator('#continue-learning').isVisible(), true);
    assert.equal(await page.locator('[data-continue-title]').innerText(), 'Pediatric Hypertension & ABPM');
    assert.equal(await page.locator('[data-continue-link]').getAttribute('href'), '/hypertension/');
    assert.deepEqual(unexpected, []);

    await context.close();
  });

  test('rejects malformed or stale local progress instead of rendering it', async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(server.origin + '/education/');
    await page.evaluate(() => {
      localStorage.setItem('stevetodman-learning-recent-v1', JSON.stringify({
        route: 'https://example.com/',
        title: '<script>alert(1)</script>',
        savedAt: Date.now()
      }));
    });
    await page.reload();
    assert.equal(await page.locator('#continue-learning').isHidden(), true);
    await context.close();
  });
});
