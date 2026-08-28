import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getChromium, repoRoot } from './helpers/harness.mjs';

let browser;

before(async () => {
  browser = await getChromium().then(engine => engine.launch());
});

after(async () => {
  await browser?.close();
});

test('iOS-style user gestures prime one shared Web Audio context before battle playback', async () => {
  const source = fs.readFileSync(path.join(repoRoot, 'study/unit-1/audio-unlock.js'), 'utf8');
  const page = await browser.newPage();
  const result = await page.evaluate(async code => {
    let constructed = 0;
    let resumeCalls = 0;
    let silentStarts = 0;

    class FakeAudioContext {
      constructor() {
        constructed += 1;
        this.state = 'suspended';
        this.destination = {};
      }
      createBuffer() { return {}; }
      createBufferSource() {
        return {
          buffer:null,
          connect() {},
          start() { silentStarts += 1; },
        };
      }
      resume() {
        resumeCalls += 1;
        return new Promise(resolve => setTimeout(() => {
          this.state = 'running';
          resolve();
        }, 15));
      }
    }

    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = undefined;
    new Function(code)();

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true }));
    const first = new window.AudioContext();
    const second = new window.webkitAudioContext();
    await new Promise(resolve => setTimeout(resolve, 30));

    return {
      same:first === second,
      state:first.state,
      constructed,
      resumeCalls,
      silentStarts,
      installed:window.__wordExpeditionAudioUnlockInstalled === true,
    };
  }, source);

  assert.equal(result.installed, true);
  assert.equal(result.constructed, 1, 'all battle audio must reuse the context primed by the user gesture');
  assert.equal(result.same, true, 'standard and webkit constructors must return the same primed context');
  assert.ok(result.resumeCalls >= 1, 'a suspended iOS-style context must be resumed');
  assert.ok(result.silentStarts >= 1, 'a silent frame must be queued while the gesture is active');
  assert.equal(result.state, 'running');
  await page.close();
});

test('both Study entry points unlock audio before app startup and strikes still trigger weapon sound', () => {
  for (const relative of ['study/index.html', 'study/unit-1/index.html']) {
    const html = fs.readFileSync(path.join(repoRoot, relative), 'utf8');
    const unlock = html.indexOf('audio-unlock.js');
    const app = html.indexOf('app.js');
    assert.ok(unlock >= 0, `${relative}: audio unlock is loaded`);
    assert.ok(app > unlock, `${relative}: audio unlock runs before app.js`);
  }

  const appSource = fs.readFileSync(path.join(repoRoot, 'study/unit-1/app.js'), 'utf8');
  assert.match(appSource, /setBattleState\(final\?'victory':kind,message,true\);\s*cancelSpeech\(\);playWeaponSound\(gameProfile\(activeName\)\.equipped\.weapon\);/,
    'every successful strike must keep visual battle state and weapon audio coupled');
});
