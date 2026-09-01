import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(repoRoot, 'study/us-states.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
assert.equal(scripts.length, 1, 'the challenge should have one inline application script');
const source = scripts[0];

function functionBody(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing ${name}`);
  const open = source.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = open; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') { blockComment = false; i += 1; }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '/') { lineComment = true; i += 1; continue; }
    if (char === '/' && next === '*') { blockComment = true; i += 1; continue; }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
    if (char === '{') depth += 1;
    if (char === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  throw new Error(`unterminated ${name}`);
}

test('50 States source and state catalog remain valid', () => {
  new vm.Script(source, { filename: 'study/us-states.html' });
  const stateLiteral = source.match(/var STATES = (\[[\s\S]*?\]);\s*var app/);
  assert.ok(stateLiteral, 'state data should be embedded in the page');
  const states = vm.runInNewContext(stateLiteral[1]);
  assert.equal(states.length, 50);
  assert.equal(new Set(states.map(state => state.code)).size, 50);
  assert.equal(new Set(states.map(state => state.name)).size, 50);
});

test('advertised round lengths cannot grow after a miss', () => {
  assert.doesNotMatch(source, /function queueRetry\(/);
  for (const name of ['afterQueueAnswer', 'afterTestAnswer']) {
    const body = functionBody(name);
    assert.doesNotMatch(body, /queue\.(?:splice|push|unshift)\s*\(/, `${name} must not expand the active queue`);
    assert.doesNotMatch(body, /queueRetry\s*\(/);
  }
  assert.match(functionBody('getSavedRound'), /item && item\.retry/,
    'legacy snapshots containing inserted retries should be cleared');
});

test('an answer and its next position are persisted atomically', () => {
  const saved = functionBody('getSavedRound');
  assert.match(saved, /Number\.isInteger\(r\.qIndex\)/);
  assert.match(saved, /r\.qIndex < 0/);
  assert.match(saved, /r\.qIndex > r\.queue\.length/);
  assert.doesNotMatch(saved, /r\.qIndex <= 0|r\.qIndex >= r\.queue\.length/);

  const commit = functionBody('commitAnsweredQuestion');
  const doneAt = commit.indexOf('onDone(correct, item)');
  const indexAt = commit.indexOf('qIndex++');
  const saveAt = commit.indexOf('saveRound(snapshotRound())');
  assert.ok(doneAt >= 0 && doneAt < indexAt && indexAt < saveAt);

  for (const name of ['renderSpellQuestion', 'renderMapQuestion']) {
    const body = functionBody(name);
    assert.match(body, /commitAnsweredQuestion\(correct, item, onDone\)/);
    assert.ok(body.indexOf('commitAnsweredQuestion(correct, item, onDone)') < body.indexOf('makeNextButton'),
      `${name} should commit before the learner can advance or reload`);
  }
});

test('the first map question avoids a synchronous full-map raster scan', () => {
  assert.doesNotMatch(source, /getImageData\s*\(/);
  assert.doesNotMatch(source, /new Path2D\s*\(/);
  assert.match(source, /var SMALL_STATE_ORDER = \[[^\]]*"RI"\]/);
  assert.match(functionBody('ensureStateBBoxes'), /if \(!SMALL_STATE_CODES\[p\.dataset\.code\]\) return/);
});

test('late cloud responses and stale fact timers cannot interrupt a round', () => {
  const boot = source.slice(source.indexOf('(function boot()'));
  assert.match(boot, /var initialView = app\.firstElementChild/);
  assert.match(boot, /if \(found && initialViewStillOpen\(\)\) showMenu\(\)/);

  const boss = functionBody('renderBossQuestion');
  assert.match(boss, /input\.blur\(\)/);
  assert.match(boss, /scheduleAutoAdvance\(next\.go\)/);
  assert.doesNotMatch(boss, /advanceDelayFor\(lastFactShown\)/);
  assert.match(functionBody('renderSpellQuestion'), /input\.blur\(\)/);
});
