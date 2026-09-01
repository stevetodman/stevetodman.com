import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, getChromium } from './helpers/harness.mjs';

let server;
let browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

const emptyProfile = () => ({
  stateStats: {}, masteredOrder: [], weekKey: '', weekMastered: 0,
  bossesDefeated: 0, avatar: '🚀', round: null, recent: [],
  bestStreak: 0, bestRound: null,
});

async function openChallenge({ cloudToken = false, breakCanvas = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.addInitScript(({ profile, cloudToken, breakCanvas }) => {
    localStorage.setItem('usStatesRoadTrip', JSON.stringify({
      activeProfile: 'Luke',
      profiles: { Luke: profile, Samantha: { ...profile, avatar: '🦄' } },
    }));
    if (cloudToken) localStorage.setItem('usStatesCloudToken', '0123456789abcdef0123456789abcdef');
    if (breakCanvas) {
      HTMLCanvasElement.prototype.getContext = function getContext() {
        throw new Error('50-state map must not rasterize through canvas');
      };
    }
  }, { profile: emptyProfile(), cloudToken, breakCanvas });
  return { context, page };
}

test('a missed Full Test question stays 1 of exactly 50 and resumes at question 2', async () => {
  const { context, page } = await openChallenge();
  await page.goto(`${server.origin}/study/us-states.html`);
  await page.click('[data-mode="test"]');

  const first = await page.evaluate(() => ({ type: queue[0].type, code: queue[0].code }));
  if (first.type === 'spell') {
    await page.fill('#spellInput', 'definitely wrong');
    await page.click('#spellForm button[type="submit"]');
  } else {
    const wrongCode = await page.evaluate(code => STATES.find(state => state.code !== code).code, first.code);
    await page.evaluate(code => {
      document.querySelector(`#qMap path.state[data-code="${code}"]`)
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, wrongCode);
  }

  const committed = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('usStatesRoadTrip')).profiles.Luke.round;
    return { liveLength: queue.length, liveIndex: qIndex, savedLength: saved.queue.length, savedIndex: saved.qIndex };
  });
  assert.deepEqual(committed, { liveLength: 50, liveIndex: 1, savedLength: 50, savedIndex: 1 });

  // Simulate closing and reopening the challenge. A fresh navigation avoids
  // browser reload/BFCache behavior while preserving the origin's storage.
  await page.goto('about:blank');
  await page.goto(`${server.origin}/study/us-states.html`);
  await page.click('[data-mode="resume"]');
  await page.waitForSelector('.score-line');
  assert.match(await page.locator('.score-line').innerText(), /Question 2 of 50/);
  await context.close();
});

test('Map Practice renders even when canvas pixel reads are unavailable', async () => {
  const { context, page } = await openChallenge({ breakCanvas: true });
  await page.goto(`${server.origin}/study/us-states.html`);
  await page.click('[data-mode="map"]');
  await page.waitForSelector('#qMap path.state');
  assert.equal(await page.locator('#qMap path.state').count(), 50);
  assert.equal(await page.locator('h1').innerText(), '📍 Map Practice');
  await context.close();
});

test('a delayed cloud pull cannot send an active round back to the menu', async () => {
  const { context, page } = await openChallenge({ cloudToken: true });
  let releasePull;
  let sawPull;
  const pullSeen = new Promise(resolve => { sawPull = resolve; });
  await page.route('**/functions/v1/studyhub-save', async route => {
    const body = route.request().postDataJSON();
    if (body.action === 'pull') {
      sawPull();
      await new Promise(resolve => { releasePull = resolve; });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ found: true, data: {} }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: body.data || {} }) });
  });

  await page.goto(`${server.origin}/study/us-states.html`);
  await pullSeen;
  await page.click('[data-mode="quick"]');
  await page.waitForSelector('.score-line');
  const questionBeforePull = await page.locator('.score-line').innerText();
  releasePull();
  await page.waitForTimeout(100);

  assert.equal(await page.locator('.score-line').innerText(), questionBeforePull);
  assert.equal(await page.locator('[data-mode="quick"]').count(), 0);
  await context.close();
});
