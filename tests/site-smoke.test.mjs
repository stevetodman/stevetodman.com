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
const conventionExceptions = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'site/convention-exceptions.json'), 'utf8')
).exceptions || {};
const excepts = (pagePath, key) => Boolean(conventionExceptions[pagePath]?.[key]);

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
      // Canonical links are metadata and do not load a resource. Everything
      // else in this selector can create a runtime network dependency.
      externalSubresources: all('script[src], link[href]:not([rel~="canonical"]), img[src], iframe[src]')
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

describe('every page loads cleanly', { concurrency: 6 }, () => {
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
      if (!excepts(pagePath, 'description')) assert.ok(r.hasDescription, 'needs <meta name="description">');
      if (!excepts(pagePath, 'favicon')) assert.ok(r.hasFavicon, 'needs a favicon link');
      if (!excepts(pagePath, 'main')) assert.ok(r.hasMain, 'needs a <main> landmark');
      if (!excepts(pagePath, 'labels')) assert.deepEqual(r.unlabelled, [], `unlabelled form controls: ${r.unlabelled.join(', ')}`);
      if (!excepts(pagePath, 'semanticControls')) assert.equal(r.clickableDivs, 0, 'interactive controls must be <button> or <a>, never a click-handled <div>');
    });
  }
});

describe('no external network dependencies', () => {
  // Production pages should be self-contained. A source-only exception is
  // permitted only when it is explicitly documented and the classified-build
  // policy tests prove the deployed artifact removes that dependency.
  for (const pagePath of SITE_PAGES) {
    test(pagePath, async () => {
      const r = await inspect(pagePath);
      if (excepts(pagePath, 'externalSubresources')) {
        assert.ok(r.externalSubresources.length > 0,
          `${pagePath} documents an externalSubresources exception but no external resource was found`);
        return;
      }
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

describe('mobile layout', { concurrency: 6 }, () => {
  for (const pagePath of SITE_PAGES) {
    test(`${pagePath} does not scroll horizontally at 375px`, async () => {
      const r = await inspect(pagePath, { width: 375, height: 812 });
      assert.ok(r.scrollWidth <= r.clientWidth + 2,
        `content is ${r.scrollWidth}px wide in a ${r.clientWidth}px viewport`);
    });
  }
});

describe('study tools are keyboard operable', { concurrency: 4 }, () => {
  // Regression: mode selection used click-handled <div>s, so the entry screen of
  // every quiz had zero tabbable elements and was unusable without a mouse.
  // grade5.html is a compatibility navigation page, not a quiz mode selector.
  const tools = SITE_PAGES.filter(p => p.startsWith('/study/') && p.endsWith('.html') && p !== '/study/grade5.html');
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

      // Some tools chain a screen first (e.g. a player picker) before the real
      // mode menu, and some play a short countdown before the round begins.
      // Keep pressing Enter on whatever card is now first until every .menu-card
      // is gone, or give up after a few hops.
      let left = false;
      for (let step = 0; step < 3 && !left; step++) {
        await page.keyboard.press('Enter');
        left = await page.waitForFunction(() => document.querySelectorAll('.menu-card').length === 0, { timeout: 8000 })
          .then(() => true).catch(() => false);
        if (!left) await page.evaluate(() => document.querySelectorAll('.menu-card')[0]?.focus());
      }
      assert.ok(left, 'keyboard activation did not leave the menu');

      await context.close();
    });
  }
});

describe('Grade 5 hub integration', () => {
  test('the hub exposes every current Grade 5 activity without replacing Word Expedition', async () => {
    for (const route of ['/study/', '/study/grade5.html', '/study/unit-1/', '/study/matter-lab.html', '/study/world-lab.html', '/study/us-states.html', '/math/']) {
      assert.ok(SITE_PAGES.includes(route), `${route} must be governed as PRODUCTION`);
    }

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(server.origin + '/study/');
    assert.equal(await page.locator('h1').innerText(), 'Learning Hub');
    const hrefs = await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')));
    for (const href of ['/math/', '/study/unit-1/', '/study/matter-lab.html', '/study/world-lab.html', '/study/us-states.html']) {
      assert.ok(hrefs.includes(href), `hub must link ${href}`);
    }
    assert.equal(await page.locator('script[src*="/study/unit-1/"]').count(), 0, 'hub must route to Word Expedition rather than embedding or duplicating it');

    await page.goto(server.origin + '/study/unit-1/');
    assert.equal(await page.locator('h1').innerText(), 'Word Expedition');
    assert.equal(await page.locator('[data-profile="Luke"]').count(), 1);
    assert.equal(await page.locator('[data-profile="Samantha"]').count(), 1);

    await page.goto(server.origin + '/study/grade5.html');
    assert.equal(await page.locator('a[href="/study/"]').count(), 1, 'legacy Grade 5 route must lead to the canonical hub');
    await context.close();
  });
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
