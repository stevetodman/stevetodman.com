import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium } from './helpers/harness.mjs';

let server, browser, axeSource;
const PAGES = ['/', '/education/', '/about/', '/search/', '/tools/', '/study/'];

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
  const axeModule = await import('axe-core');
  const axe = axeModule.default || axeModule;
  axeSource = axe.source;
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function scan(path) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(server.origin + path, { waitUntil: 'networkidle' });
  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async () => window.axe.run(document, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
    }
  }));
  await context.close();
  return results.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
}

describe('shared platform accessibility', () => {
  for (const path of PAGES) {
    test(`${path} has no serious/critical axe violations`, async () => {
      const violations = await scan(path);
      const summary = violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
      assert.deepEqual(summary, [], `axe violations:\n${summary.join('\n')}`);
    });
  }
});
