import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const read = relativePath => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

test('Study Unit 1 guards the final-check grading and scheduling fixes', () => {
  const source = read('study/unit-1/app.js');

  // Mastery days must follow the learner's local calendar date, not UTC.
  assert.match(source, /function localDateKey\(date\)/);
  assert.doesNotMatch(source, /function todayKey\(\) \{ return new Date\(\)\.toISOString\(\)\.slice\(0,10\); \}/);

  // Multiple-choice relation questions accept the whole teacher-supplied relation list.
  assert.match(source, /accepted:list\.slice\(\)/);
  assert.doesNotMatch(source, /accepted:\[list\[0\]\]/);
  assert.match(source, /function safeRelationDistractors\(/);

  // Randomness is sampled once before sorting, never from inside the comparator.
  assert.match(source, /score:repeat\*75\+pairPriority\(name,word,domain\)\+Math\.random\(\)\*18/);
  assert.match(source, /\.sort\(function\(a,b\)\{return a\.score-b\.score;\}\)/);

  // There is an explicit post-spelling-test retention branch.
  assert.match(source, /if\(current<TEST_DATES\.spelling\)/);
  assert.match(source, /return \['definition','definition','synonym','synonym','antonym','antonym','spelling','spelling','spelling','spelling'\]/);

  // Retry insertion can use questions 3-9 but must never replace question 10.
  assert.match(source, /var lastRetryIndex=SESSION_LENGTH-2/);
  assert.match(source, /var target=Math\.min\(start,lastRetryIndex\)/);
});

test('Study learner cards use valid phrasing content', () => {
  const source = read('study/unit-1/app.js');
  assert.match(source, /return '<span class="trail /);
  assert.doesNotMatch(source, /return '<div class="trail /);
});

test('Study PWA keeps the old installed-app identity but opens the current assignment', () => {
  const manifest = JSON.parse(read('study/us-states.webmanifest'));
  assert.equal(manifest.id, './us-states.html');
  assert.equal(manifest.name, 'Todman Study Hub');
  assert.equal(manifest.short_name, 'Study');
  assert.equal(manifest.start_url, '/study/');
  assert.equal(manifest.scope, '/study/');

  for (const page of ['study/index.html', 'study/unit-1/index.html']) {
    const html = read(page);
    assert.match(html, /rel="manifest" href="\/study\/us-states\.webmanifest"/);
  }
});

test('Study page metadata does not publish learner names', () => {
  for (const page of ['study/index.html', 'study/unit-1/index.html']) {
    const html = read(page);
    const description = html.match(/<meta name="description" content="([^"]*)">/i)?.[1] || '';
    assert.ok(description.length > 0);
    assert.doesNotMatch(description, /Luke|Samantha/i);
  }
});
