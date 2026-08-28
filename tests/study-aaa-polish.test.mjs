import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const read = relativePath => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const js = read('study/unit-1/aaa-polish.js');
const css = read('study/unit-1/aaa-polish.css');
const app = read('study/unit-1/app.js');
const html = read('study/unit-1/index.html');

test('AAA polish loads after the core learning application as an additive presentation layer', () => {
  assert.match(html, /<link rel="stylesheet" href="aaa-polish\.css">/);
  assert.match(html, /<script src="aaa-polish\.js"><\/script>/);
  assert.ok(html.indexOf('app.js') < html.indexOf('aaa-polish.js'));
  assert.ok(html.indexOf('app.css') < html.indexOf('aaa-polish.css'));

  for (const forbidden of [
    'submitAnswer(', 'recordResult(', 'scheduleRetry(', 'nextQuestion(',
    'saveState(', 'saveGameState(', 'ROUND_KEY', 'SESSION_LENGTH', 'session.'
  ]) assert.equal(js.includes(forbidden), false, `polish layer must not own ${forbidden}`);

  assert.doesNotMatch(js, /https?:\/\//, 'polish must not add runtime third-party requests');
  assert.doesNotMatch(css, /url\s*\(/i, 'polish CSS must not add external visual assets');
});

test('four new trail creatures are deterministic rather than rare or random encounters', () => {
  assert.match(js, /var TRAIL_VARIANTS=\{4:'mushroom',5:'ink',6:'beetle',7:'drake',8:'mushroom',9:'ink',10:'beetle',11:'drake'\}/);
  assert.doesNotMatch(js, /Math\.random/);

  for (const [id, name] of [
    ['mushroom','Mushroom Knight'],
    ['ink','Ink Slime'],
    ['beetle','Clockwork Beetle'],
    ['drake','Crystal Drake'],
  ]) {
    assert.ok(js.includes(`${id}:{name:'${name}'`), `${name} encounter metadata must exist`);
    assert.ok(js.includes(`monster-${id}`), `${name} must have its own vector silhouette`);
    assert.ok(css.includes(`monster-${id}`), `${name} must have creature-specific art styling`);
    assert.ok(css.includes(`aaa-${id}-hit`), `${name} must have a distinct hit reaction`);
    assert.ok(css.includes(`aaa-${id}-counter`), `${name} must have a distinct counterattack`);
  }
});

test('each new creature has authored contextual copy for every Unit 1 word', () => {
  const words = ['blunder','cancel','continuous','distribute','document','fragile','myth','reject','scuffle','solitary','temporary','veteran'];
  const blocks = [...js.matchAll(/(?:mushroom|ink|beetle|drake):\{name:[\s\S]*?lines:\{([\s\S]*?)\n\s*\}\}/g)].map(match => match[1]);
  assert.equal(blocks.length, 4);
  for (const block of blocks) {
    for (const word of words) assert.match(block, new RegExp(`\\b${word}:'`), `missing ${word} contextual line`);
  }
});

test('AAA presentation adds environments, progressive damage, contact accents, boss framing and accessibility fallbacks', () => {
  for (const environment of ['forest','ruins','crystal','castle']) assert.ok(css.includes(`data-environment="${environment}"`));
  assert.match(css, /data-wear="1"[\s\S]*damage-1/);
  assert.match(css, /data-wear="2"[\s\S]*damage-2/);
  assert.match(css, /data-wear="3"[\s\S]*damage-mark/);
  assert.match(css, /var\(--contact\)/);
  assert.match(css, /data-boss-intro="true"/);
  assert.match(css, /aaa-boss-victory-stage/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /forced-colors:active/);
});

test('new audio texture is optional, low-gain, contact-synchronized, and cannot double-fire on wear updates', () => {
  assert.match(js, /localStorage\.getItem\('studyhub-weapon-sounds'\)==='off'/);
  assert.match(js, /getComputedStyle\(stage\)\.getPropertyValue\('--contact'\)/);
  assert.match(js, /mutation\.attributeName==='data-state'\)playLayer/);
  assert.match(js, /attributeFilter:\['data-state','data-wear'\]/);
  assert.match(js, /\.018/);
  assert.doesNotMatch(js, /\.resume\s*\(/, 'polish audio must not independently unlock or resume audio');
});

test('core learning cadence and successful-strike coupling remain unchanged', () => {
  assert.match(app, /var SESSION_LENGTH = 10/);
  assert.equal((app.match(/advanceTimer=setTimeout\(nextQuestion,480\)/g)||[]).length, 2);
  assert.match(app, /setBattleState\(final\?'victory':kind,message,true\);\s*cancelSpeech\(\);playWeaponSound\(gameProfile\(activeName\)\.equipped\.weapon\);/);
  assert.doesNotMatch(app, /aaa-polish|TRAIL_VARIANTS|Mushroom Knight|Ink Slime|Clockwork Beetle|Crystal Drake/);
});
