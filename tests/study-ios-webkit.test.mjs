import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { webkit, devices } from 'playwright';
import { startServer, watchForErrors } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await webkit.launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

test('WebKit with an iPhone profile unlocks, fetches, decodes, and starts all battle samples', async () => {
  const { defaultBrowserType: _defaultBrowserType, ...iphone } = devices['iPhone 13'];
  const context = await browser.newContext({ ...iphone, hasTouch:true });
  const page = await context.newPage();
  const errors = watchForErrors(page);
  const sampleResponses = new Map();

  page.on('response', response => {
    const url = new URL(response.url());
    if (/\/study\/unit-1\/sfx\/[^/]+\.mp3$/.test(url.pathname)) {
      sampleResponses.set(url.pathname, response.status());
    }
  });

  await page.goto(server.origin + '/study/', { waitUntil:'networkidle' });

  const boot = await page.evaluate(() => ({
    installed: window.__wordExpeditionAudioUnlockInstalled === true,
    clipCount: window.WordExpeditionSfxBank?.clipCount,
    userAgent: navigator.userAgent,
  }));

  assert.equal(boot.installed, true, 'the audio unlock shim must be installed before interaction');
  assert.equal(boot.clipCount, 12, 'the local battle bank must expose exactly 12 clips');
  assert.match(boot.userAgent, /iPhone/i, 'the browser context must use an iPhone user agent');

  // Exercise the touch path rather than relying on navigator.maxTouchPoints,
  // which Playwright WebKit on Linux does not report consistently even when
  // touch input is enabled. This sends a real emulated touchscreen gesture to
  // the same element an iPhone user taps.
  const profile = page.locator('[data-profile="Luke"]');
  const profileBox = await profile.boundingBox();
  assert.ok(profileBox, 'the learner profile must have a tappable rendered box');
  await page.touchscreen.tap(
    profileBox.x + profileBox.width / 2,
    profileBox.y + profileBox.height / 2,
  );

  const result = await page.evaluate(async () => {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtor();
    const same = ctx === new window.webkitAudioContext();
    const bank = window.WordExpeditionSfxBank;
    const clips = [
      'blade','wand','wood','axe','bow','spear','hammer','scythe',
      'troll','wisp','golem','owl',
    ];

    bank.warm(ctx);
    const playable = new Set();
    const deadline = performance.now() + 5000;

    while (performance.now() < deadline && playable.size < clips.length) {
      for (const clip of clips) {
        if (playable.has(clip)) continue;
        const stop = bank.play(ctx, { clip, gain:0.0001 });
        if (typeof stop === 'function') {
          playable.add(clip);
          stop();
        }
      }
      if (playable.size < clips.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return {
      state: ctx.state,
      same,
      playable:[...playable],
      clipCount:bank.clipCount,
    };
  });

  assert.equal(result.state, 'running', 'the shared Web Audio context must be running after the iPhone tap');
  assert.equal(result.same, true, 'AudioContext and webkitAudioContext must resolve to the same primed context');
  assert.equal(result.clipCount, 12);
  assert.deepEqual(result.playable.sort(), [
    'axe','blade','bow','golem','hammer','owl','scythe','spear','troll','wand','wisp','wood',
  ]);

  assert.equal(sampleResponses.size, 12, 'all 12 local MP3s must be fetched in WebKit');
  for (const [pathname, status] of sampleResponses) {
    assert.equal(status, 200, `${pathname} must return HTTP 200`);
  }
  assert.deepEqual(errors, [], 'the iPhone/WebKit flow must not emit page, console, or request errors');

  await context.close();
});
