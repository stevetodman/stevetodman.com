// Site-wide smoke tests: the conventions in CLAUDE.md, enforced.
//
// These are cheap and catch the whole class of problem that produced a broken
// /twins/ link, a CDN font dependency, missing landmarks, and quiz menus that
// no keyboard user could operate.

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, SITE_PAGES, repoRoot } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

// Each page is asserted against from several suites; load it once.
const inspectionCache = new Map();

/** Load a page and report its structure plus anything that went wrong. */
async function inspect(pagePath, viewport = { width: 1280, height: 900 }) {
  const key = `${pagePath}@${viewport.width}`;
  if (!inspectionCache.has(key)) inspectionCache.set(key, inspectPage(pagePath, viewport));
  return inspectionCache.get(key);
}

async function inspectPage(pagePath, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  const response = await page.goto(server.origin + pagePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const info = await page.evaluate(() => {
    const all = selector => Array.from(document.querySelectorAll(selector));
    const unlabelled = all('input, select, textarea').filter(el => {
      if (el.type === 'hidden') return false;
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title')) return false;
      if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return false;
      return !el.closest('label');
    }).map(el => el.id || el.name || el.type);

    return {
      title: document.title,
      h1Count: all('h1').length,
      hasDescription: !!document.querySelector('meta[name="description"]'),
      hasFavicon: !!document.querySelector('link[rel~="icon"]'),
      hasMain: !!document.querySelector('main'),
      lang: document.documentElement.lang,
      unlabelled,
      clickableDivs: all('div[onclick], span[onclick]').length,
      externalSubresources: all('script[src], link[href], img[src], iframe[src]')
        .map(el => el.getAttribute('src') || el.getAttribute('href'))
        .filter(url => url && /^(https?:)?\/\//i.test(url)),
      internalLinks: all('a[href]')
        .map(a => a.getAttribute('href'))
        .filter(href => href && !/^(#|mailto:|tel:|javascript:|data:|https?:|\/\/)/i.test(href)),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });

  await context.close();
  return { status: response?.status(), errors: [...new Set(errors)], ...info };
}

describe('every page loads cleanly', () => {
  for (const pagePath of SITE_PAGES) {
    test(pagePath, async () => {
      const r = await inspect(pagePath);
      assert.equal(r.status, 200);
      assert.deepEqual(r.errors, [], `runtime errors:\n${r.errors.join('\n')}`);
    });
  }
});

describe('page conventions', () => {
  for (const pagePath of SITE_PAGES) {
    test(pagePath, async () => {
      const r = await inspect(pagePath);
      assert.equal(r.lang, 'en', 'needs a lang attribute');
      assert.ok(r.title.length > 0, 'needs a title');
      assert.equal(r.h1Count, 1, `expected exactly one <h1>, found ${r.h1Count}`);
      assert.ok(r.hasDescription, 'needs <meta name="description">');
      assert.ok(r.hasFavicon, 'needs a favicon link');
      assert.ok(r.hasMain, 'needs a <main> landmark');
      assert.deepEqual(r.unlabelled, [], `unlabelled form controls: ${r.unlabelled.join(', ')}`);
      assert.equal(r.clickableDivs, 0, 'interactive controls must be <button> or <a>, never a click-handled <div>');
    });
  }
});

describe('no external network dependencies', () => {
  // A CLAUDE.md rule, and the practical reason the Math Lab silently lost its
  // fonts: the only cross-origin request on the site was also the only one that
  // could fail.
  for (const pagePath of SITE_PAGES) {
    test(pagePath, async () => {
      const r = await inspect(pagePath);
      assert.deepEqual(r.externalSubresources, [],
        `external subresources must be self-hosted: ${r.externalSubresources.join(', ')}`);
    });
  }
});

describe('internal links resolve', () => {
  test('no link points at a missing page', async () => {
    const broken = [];
    for (const pagePath of SITE_PAGES) {
      const { internalLinks } = await inspect(pagePath);
      const base = pagePath.endsWith('/') ? pagePath : pagePath.replace(/[^/]*$/, '');
      for (const href of internalLinks) {
        const target = (href.startsWith('/') ? href : base + href).replace(/\/\.\//g, '/').split('#')[0];
        const response = await fetch(server.origin + target);
        if (!response.ok) broken.push(`${pagePath} -> ${href} (${response.status})`);
      }
    }
    assert.deepEqual(broken, [], `broken links:\n${broken.join('\n')}`);
  });
});

describe('mobile layout', () => {
  for (const pagePath of SITE_PAGES) {
    test(`${pagePath} does not scroll horizontally at 375px`, async () => {
      const r = await inspect(pagePath, { width: 375, height: 812 });
      assert.ok(r.scrollWidth <= r.clientWidth + 2,
        `content is ${r.scrollWidth}px wide in a ${r.clientWidth}px viewport`);
    });
  }
});

describe('study tools are keyboard operable', () => {
  // Regression: mode selection used click-handled <div>s, so the entry screen of
  // every quiz had zero tabbable elements and was unusable without a mouse.
  const tools = SITE_PAGES.filter(p => p.startsWith('/study/') && p.endsWith('.html'));
  for (const tool of tools) {
    test(tool, async () => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(server.origin + tool);
      await page.waitForTimeout(300);

      const cards = await page.$$('.menu-card');
      assert.ok(cards.length > 0, 'expected mode-selection cards');

      const allButtons = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.menu-card')).every(el => el.tagName === 'BUTTON'));
      assert.ok(allButtons, 'mode-selection cards must be <button>');

      // Focus the first card and activate it with the keyboard alone.
      await page.evaluate(() => document.querySelectorAll('.menu-card')[0].focus());
      const focused = await page.evaluate(() => document.activeElement.classList.contains('menu-card'));
      assert.ok(focused, 'menu cards must be focusable');

      await page.keyboard.press('Enter');
      // Some tools play a short countdown before the round begins.
      await page.waitForFunction(() => document.querySelectorAll('.menu-card').length === 0, { timeout: 8000 })
        .catch(() => { throw new Error('keyboard activation did not leave the menu'); });

      await context.close();
    });
  }
});

describe('repository hygiene', () => {
  test('the deploy path contains no superseded simulator versions', () => {
    // v1.6 and the old root modules shipped on every visit but were never loaded.
    for (const stale of ['phs/v16', 'phs/core.js', 'phs/ui.js', 'phs/data.js', 'phs/actions.js']) {
      assert.ok(!fs.existsSync(path.join(repoRoot, stale)), `${stale} should not be in the deploy path`);
    }
  });

  test('the simulator entrypoint only references the current version', () => {
    const html = fs.readFileSync(path.join(repoRoot, 'phs/index.html'), 'utf8');
    const refs = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))[^"]*"/g)].map(m => m[1]);
    assert.ok(refs.length > 0, 'expected script and stylesheet references');
    for (const ref of refs) {
      assert.ok(ref.startsWith('v17/'), `${ref} should live under v17/`);
    }
  });
});
