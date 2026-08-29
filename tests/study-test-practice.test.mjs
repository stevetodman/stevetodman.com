import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const read = relativePath => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const words = ['blunder','cancel','continuous','distribute','document','fragile','myth','reject','scuffle','solitary','temporary','veteran'];

test('Unit 1 exposes adaptive test practice without replacing the adventure', () => {
  const index = read('study/unit-1/index.html');
  const html = read('study/unit-1/test-practice.html');
  assert.match(index, /Adaptive test practice/);
  assert.match(index, /<script src="app\.js"><\/script>/);
  assert.match(html, /test-practice\.js/);
  assert.match(html, /test-practice\.css/);
  assert.doesNotMatch(html, /us-states\.webmanifest/);
});

test('adaptive practice uses the exact 12-word Unit 1 bank and the main learner-state key', () => {
  const source = read('study/unit-1/test-practice.js');
  for (const word of words) assert.match(source, new RegExp(`['"]${word}['"]`));
  assert.match(source, /studyhub-word-expedition-unit1-v3/);
  assert.match(source, /recordEvidence\(/);
  assert.match(source, /correctDays/);
  assert.match(source, /lastPracticeType/);
  assert.match(source, /priorAdventureEvidence/);
});

test('baseline diagnostic targets practice without letting word-bank recognition masquerade as recall', () => {
  const source = read('study/unit-1/test-practice.js');
  assert.match(source, /Run baseline diagnostic/);
  assert.match(source, /function diagnostic\(/);
  assert.match(source, /diagnostic-recognition/);
  assert.match(source, /diagnostic-recognition'\}\);/);
  assert.match(source, /independent:false,type:'diagnostic-recognition'/);
  assert.match(source, /diagnostic-spelling/);
});

test('adaptive continue flow ranks weakness and preserves delayed retries before ending', () => {
  const source = read('study/unit-1/test-practice.js');
  assert.match(source, /function adaptiveSession\(/);
  assert.match(source, /chooseAdaptiveTask/);
  assert.match(source, /weakness\(/);
  assert.match(source, /due:done\+3/);
  assert.match(source, /done>=target&&!queue\.length/);
  assert.match(source, /Continue practice/);
});

test('mastery evidence distinguishes independent retrieval from assisted repair', () => {
  const source = read('study/unit-1/test-practice.js');
  assert.match(source, /independentCorrects/);
  assert.match(source, /assisted:true/);
  assert.match(source, /immediate-repair/);
  assert.match(source, /Hide answer and rebuild/);
  assert.match(source, /spellingReady/);
  assert.match(source, /vocabReady/);
});

test('practice covers full-bank elimination, dual POS, reverse retrieval, capitalization, and cancel discrimination', () => {
  const source = read('study/unit-1/test-practice.js');
  assert.match(source, /12-for-12 paragraph/);
  assert.match(source, /answers\.every\(Boolean\)/);
  assert.match(source, /Rainy picnic \+ dock/);
  assert.match(source, /POS_ITEMS/);
  assert.match(source, /blundered/);
  assert.match(source, /scuffled/);
  assert.match(source, /Reverse clues/);
  assert.match(source, /sentence-start capitalization/);
  assert.match(source, /Cancel discrimination/);
  assert.match(source, /stamping VOID on it/);
  assert.match(source, /reject/);
  assert.match(source, /document/);
  assert.match(source, /distribute/);
});

test('back-of-test practice requires two sanctioned relations and preserves none-given antonyms', () => {
  const source = read('study/unit-1/test-practice.js');
  assert.match(source, /Give <strong>two<\/strong> teacher-sheet synonyms/);
  assert.match(source, /two-synonyms/);
  assert.match(source, /two-antonyms/);
  assert.match(source, /document:\{pos:\['noun','verb'\][^}]*ant:\[\]\}/);
  assert.match(source, /scuffle:\{pos:\['verb','noun'\][^}]*ant:\[\]\}/);
  assert.match(source, /none given/);
});

test('iPhone touch targets and active paragraph blank are explicitly styled', () => {
  const css = read('study/unit-1/test-practice.css');
  assert.match(css, /\.bank-word\{[^}]*min-height:44px/);
  assert.match(css, /\.blank-token\{[^}]*min-height:44px/);
  assert.match(css, /\.blank-token\.active/);
  assert.match(css, /safe-area-inset-top/);
});

test('practice loads the shared mastery model and direct cloud bridge', () => {
  const html = read('study/unit-1/test-practice.html');
  const mastery = read('study/unit-1/unit1-mastery.js');
  const cloud = read('study/unit-1/unit1-cloud.js');
  assert.match(html, /unit1-mastery\.js/);
  assert.match(html, /unit1-cloud\.js/);
  assert.match(html, /Parent view/);
  assert.match(html, /Final mock/);
  for (const word of words) assert.match(mastery, new RegExp(`['"]${word}['"]`));
  assert.match(cloud, /studyhub-save/);
  assert.match(cloud, /wm1\|/);
  assert.match(cloud, /\['definition','synonym','antonym','spelling','pos'\]/);
  assert.match(cloud, /action:'push',data:payload\(\)/);
  assert.doesNotMatch(cloud, /equipped/);
  assert.doesNotMatch(cloud, /game:/);
});

test('cloud backend preserves unknown profile fields while merging Unit 1 stats', () => {
  const service = read('study/supabase/functions/studyhub-save/index.ts');
  assert.match(service, /unknown keys are carried through untouched/);
  assert.match(service, /const out: Record<string, unknown> = \{ \.\.\.A, \.\.\.B \}/);
  assert.match(service, /out\.stateStats = stateStats/);
  assert.match(service, /mergeFamilies\(current, incoming\)/);
});

test('parent readiness dashboard shows both learners, weak words, errors, and mock history', () => {
  const html = read('study/unit-1/parent-readiness.html');
  const source = read('study/unit-1/parent-readiness.js');
  assert.match(html, /Parent view/);
  assert.match(html, /readiness-grid/);
  assert.match(source, /learnerCard\('Luke'\)/);
  assert.match(source, /learnerCard\('Samantha'\)/);
  assert.match(source, /weakestWords/);
  assert.match(source, /recentErrors/);
  assert.match(source, /latestMock/);
  assert.match(source, /vocabulary ready/);
  assert.match(source, /spelling ready/);
});

test('final mocks use approved 12-for-12 paragraphs and withhold feedback until submission', () => {
  const source = read('study/unit-1/mock-test.js');
  const html = read('study/unit-1/mock-test.html');
  assert.match(html, /Final verification/);
  assert.match(source, /The \[1\] ranger had worked the canyon alone for years/);
  assert.match(source, /The \[1\] pilot did not \[2\] the flight/);
  assert.match(source, /Submit entire vocabulary mock/);
  assert.match(source, /Nothing above is graded until Submit/);
  assert.match(source, /none given/);
  assert.match(source, /mock-context/);
  assert.match(source, /mock-synonym/);
  assert.match(source, /mock-antonym/);
});

test('spelling final mock is audio-only and writes misses back to adaptive evidence', () => {
  const source = read('study/unit-1/mock-test.js');
  assert.match(source, /Audio only/);
  assert.match(source, /No spelling answer will be shown until all 12 are finished/);
  assert.match(source, /SpeechSynthesisUtterance/);
  assert.match(source, /autocorrect="off"/);
  assert.match(source, /mock-spelling/);
  assert.match(source, /M\.spellingError/);
  assert.match(source, /Missed words are now higher priority in adaptive practice/);
});
