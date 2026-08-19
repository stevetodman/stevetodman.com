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

async function openSprint() {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();

  // Pin Sprint reuses the production 50 States engine. Keep the test local and
  // deterministic while preserving the real client-side cloud contract.
  await page.route('**/functions/v1/studyhub-save', async route => {
    let body = {};
    try { body = route.request().postDataJSON() || {}; } catch {}
    if (body.action === 'pull') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ found: false }) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: body.data || {} }) });
    }
  });

  await page.goto(server.origin + '/study/pin-sprint.html');
  await page.click('#startPin');
  await page.waitForSelector('[data-player="Luke"]');
  await page.click('[data-player="Luke"]');
  await page.waitForSelector('#pinMap path.state');
  return { context, page };
}

function currentRoundState(page) {
  return page.evaluate(() => window.__pinSprintState());
}

async function tapCode(page, code) {
  const fatTarget = page.locator(`#pinMap path.pin-hit[data-code="${code}"]`);
  if (await fatTarget.count()) await fatTarget.click();
  else await page.locator(`#pinMap path.state[data-code="${code}"]`).click();
}

describe('Pin Sprint', () => {
  test('first-try correct answer advances and updates the shared mastery data', async () => {
    const { context, page } = await openSprint();
    const beforeState = await currentRoundState(page);
    const target = beforeState.roundStates[beforeState.currentIndex];

    // Expected answer comes from the game data model, never scraped from the
    // prompt or highlighted DOM.
    await tapCode(page, target.code);
    await page.waitForFunction(index => window.__pinSprintState().currentIndex > index, beforeState.currentIndex);

    const afterState = await currentRoundState(page);
    assert.equal(afterState.firstTryScore, 1);
    assert.equal(afterState.currentIndex, beforeState.currentIndex + 1);

    const persisted = await page.evaluate(code => {
      const w = document.getElementById('engineFrame').contentWindow;
      const data = w.loadData();
      return data.profiles.Luke.stateStats[code];
    }, target.code);
    assert.equal(persisted.correct, 1);
    assert.equal(persisted.wrong, 0);

    const staysFilled = await page.locator(`#pinMap path.state[data-code="${target.code}"]`).evaluate(el => el.classList.contains('pin-solved'));
    assert.equal(staysFilled, true, 'a solved state should remain filled as the sprint progresses');

    await context.close();
  });

  test('a miss is counted once, then the learner retries until the location is found', async () => {
    const { context, page } = await openSprint();
    const beforeState = await currentRoundState(page);
    const target = beforeState.roundStates[beforeState.currentIndex];

    const wrongCode = await page.evaluate(targetCode => {
      const w = document.getElementById('engineFrame').contentWindow;
      return w.STATES.find(s => s.code !== targetCode).code;
    }, target.code);

    await tapCode(page, wrongCode);
    let state = await currentRoundState(page);
    assert.equal(state.currentIndex, beforeState.currentIndex, 'a wrong tap should not advance');
    assert.equal(state.attempts, 1);
    assert.equal(state.firstTryScore, 0);
    assert.equal(await page.locator(`#pinMap path.state[data-code="${target.code}"]`).evaluate(el => el.classList.contains('pin-hint')), false,
      'the correct state should not be revealed after only one miss');

    // A second miss is teaching-only: it should reveal the target but must not
    // record another wrong answer against the child.
    await page.evaluate(code => {
      document.querySelector(`#pinMap path.state[data-code="${code}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, wrongCode);
    state = await currentRoundState(page);
    assert.equal(state.attempts, 2);
    assert.equal(await page.locator(`#pinMap path.state[data-code="${target.code}"]`).evaluate(el => el.classList.contains('pin-hint')), true,
      'after two misses the target should be highlighted for a successful correction');

    const wrongCountBeforeCorrection = await page.evaluate(code => {
      const w = document.getElementById('engineFrame').contentWindow;
      return w.loadData().profiles.Luke.stateStats[code].wrong;
    }, target.code);
    assert.equal(wrongCountBeforeCorrection, 1, 'multiple retry taps must not multiply the mastery penalty');

    await tapCode(page, target.code);
    await page.waitForFunction(index => window.__pinSprintState().currentIndex > index, beforeState.currentIndex);
    const afterState = await currentRoundState(page);
    assert.equal(afterState.firstTryScore, 0, 'a corrected miss should not become a first-try point');

    const finalStat = await page.evaluate(code => {
      const w = document.getElementById('engineFrame').contentWindow;
      return w.loadData().profiles.Luke.stateStats[code];
    }, target.code);
    assert.equal(finalStat.wrong, 1);
    assert.equal(finalStat.correct, 0, 'correction teaches location without falsely advancing mastery');

    await context.close();
  });

  test('round completion shows first-try score, elapsed time and mastery total', async () => {
    const { context, page } = await openSprint();

    // Short-circuit only the parent page's visual transition delays; the engine
    // keeps its own timers and persistence behavior unchanged inside the iframe.
    await page.evaluate(() => { window.setTimeout = fn => { fn(); return 0; }; });

    while (true) {
      const state = await currentRoundState(page);
      if (!state.roundStates.length || state.currentIndex >= state.roundStates.length) break;
      const target = state.roundStates[state.currentIndex];
      await page.evaluate(code => {
        const hit = document.querySelector(`#pinMap path.pin-hit[data-code="${code}"]`);
        const visible = document.querySelector(`#pinMap path.state[data-code="${code}"]`);
        (hit || visible).dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }, target.code);
      if (await page.$('#again')) break;
    }

    await page.waitForSelector('#again');
    assert.match(await page.locator('.score-big').textContent(), /^\d+\/\d+$/);
    assert.match(await page.locator('.result-stats').textContent(), /⏱️/);
    assert.match(await page.locator('.result-stats').textContent(), /50 mastered/);

    await context.close();
  });
});