import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { repoRoot } from './helpers/harness.mjs';

const read = relativePath => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

function loadArt() {
  const context = { window:{} };
  vm.runInNewContext(read('study/unit-1/game-art.js'), context);
  return context.window.WordExpeditionArt;
}

test('game art catalog is bounded, unique, and renders every equipment layer', () => {
  const art = loadArt();
  assert.equal(art.catalog.length, 24);
  assert.equal(new Set(art.catalog.map(item=>item.sound+":"+item.tone)).size,24);
  assert.equal(new Set(art.catalog.map(item => item.id)).size, art.catalog.length);
  assert.ok(art.catalog.every(item => ['weapon','armor'].includes(item.type)));
  assert.ok(art.catalog.every(item => Number.isInteger(item.price) && item.price > 0));

  for (const learner of ['Luke','Samantha']) {
    for (const item of art.catalog) {
      const equipped = {
        weapon:item.type === 'weapon' ? item.id : 'starter-sword',
        armor:item.type === 'armor' ? item.id : 'starter-cloak',
      };
      const svg = art.hero(learner, equipped, 'ready');
      assert.match(svg, /^<svg/);
      assert.match(svg, /viewBox="0 0 120 120"/);
      assert.doesNotMatch(svg, /undefined|null/);
    }
  }
});

test('route art has twelve travel nodes independent of word mastery', () => {
  const art = loadArt();
  for (const step of [-10, 0, 6, 12, 99]) {
    const svg = art.routeMap(step, Array(12).fill('new'));
    assert.equal((svg.match(/class="route-node/g) || []).length, 12);
    assert.equal((svg.match(/class="route-marker/g) || []).length, 1);
    assert.doesNotMatch(svg, /translate\([^)]*(?:NaN|undefined)/);
  }
  assert.equal(art.routeMap(3,Array(12).fill('mastered')),art.routeMap(3,Array(12).fill('new')));
  assert.equal((art.routeMap(3).match(/route-node reached/g)||[]).length,3);
});

test('game state is isolated from the version-three learning schema', () => {
  const source = read('study/unit-1/app.js');
  assert.match(source, /studyhub-word-expedition-unit1-v3/);
  assert.match(source, /studyhub-word-expedition-game-unit1-v1/);
  assert.match(source, /function blankGameProfile\(\)/);
  assert.match(source, /ART\.validItems\.indexOf\(id\)>=0/);
  assert.match(source, /if\(!gp\.rewards\[session\.id\]\)/);
  assert.match(source, /coinsEarned\(name\)-coinsSpent\(name\)/);
  assert.match(source, /function levelFloorXp\(level\)/);
  assert.match(source, /game:gameCloudProfile\(learner\.name\)/);
  assert.match(source, /readyForBoss&&!gameProfile\(name\)\.bossDefeatedAt/);
  assert.match(source, /if\(bossWon&&!gp\.bossDefeatedAt\)gp\.bossDefeatedAt=/);
});

test('question-as-combat preserves the fixed ten-question learning loop', () => {
  const source = read('study/unit-1/app.js');
  assert.match(source, /var SESSION_LENGTH = 10/);
  assert.match(source, /battleDamage:0/);
  assert.match(source, /session\.battleDamage=Math\.min\(SESSION_LENGTH,session\.battleDamage\+1\)/);
  assert.match(source, /if\(!session\|\|session\.index>=SESSION_LENGTH\)\{finishSession\(\);return;\}/);
  assert.match(source, /gear changes looks, not questions/i);
  assert.doesNotMatch(source, /equipment.*SESSION_LENGTH|equipped.*buildPlan/i);
});

test('both Study entry points load deterministic art before the game', () => {
  for (const page of ['study/index.html','study/unit-1/index.html']) {
    const html = read(page);
    assert.ok(html.indexOf('game-art.js') >= 0);
    assert.ok(html.indexOf('game-art.js') < html.indexOf('app.js'));
  }
});

test('game presentation contains reduced-motion and forced-color fallbacks', () => {
  const css = read('study/unit-1/app.css');
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /forced-colors:active/);
  assert.match(css, /\.shop-action:disabled/);
  assert.match(css, /min-height:50px/);
});

test('cloud merge unions session rewards and purchases instead of using last-write-wins', () => {
  const source = read('study/supabase/functions/studyhub-save/index.ts');
  assert.match(source, /function mergeGame\(/);
  assert.match(source, /new Set\(\[\s*\.\.\.Object\.keys\(isObj\(A\.rewards\)/);
  assert.doesNotMatch(source, /rewardIds[\s\S]*?slice\(-160\)/);
  assert.match(source, /purchases\[id\]/);
  assert.match(source, /out\.game = mergeGame\(A\.game, B\.game\)/);
  assert.match(source, /bossDefeatedAt:/);
});
