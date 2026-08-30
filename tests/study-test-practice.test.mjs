import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { repoRoot } from './helpers/harness.mjs';

const read = relativePath => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const words = ['blunder','cancel','continuous','distribute','document','fragile','myth','reject','scuffle','solitary','temporary','veteran'];

test('Unit 1 exposes Mastery Quest and practice lab without replacing the adventure', () => {
  const index = read('study/unit-1/index.html');
  const html = read('study/unit-1/test-practice.html');
  assert.match(index, /Mastery Quest/);
  assert.match(index, /mastery-quest\.html/);
  assert.match(index, /Practice lab/);
  assert.match(index, /<script src="app\.js"><\/script>/);
  assert.match(html, /test-practice\.js/);
  assert.match(html, /test-practice\.css/);
  assert.match(html, /Mastery Quest/);
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

test('context library provides five rotating sentences per word and ten valid full-bank paragraphs', () => {
  const sandbox = { window:{} };
  vm.runInNewContext(read('study/unit-1/unit1-contexts.js'), sandbox);
  const contexts = sandbox.window.WordExpeditionContexts;
  assert.deepEqual(Object.keys(contexts.sentences).sort(), words.slice().sort());
  for (const word of words) {
    assert.equal(contexts.sentences[word].length, 5, `${word} should have five contexts`);
    assert.equal(new Set(contexts.sentences[word].map(item => item.id)).size, 5);
    for (const item of contexts.sentences[word]) {
      assert.equal(item.a, word);
      assert.equal((item.q.match(/__________/g) || []).length, 1);
    }
  }
  assert.equal(contexts.paragraphs.length, 10);
  assert.equal(new Set(contexts.paragraphs.map(form => form.id)).size, 10);
  assert.equal(new Set(contexts.paragraphs.map(form => Array.from(form.key).join('|'))).size, 10, 'answer order should not be learnable');
  for (const form of contexts.paragraphs) {
    assert.deepEqual(Array.from(form.key).sort(), words.slice().sort(), `${form.id} must use every bank word once`);
    assert.deepEqual(Array.from(form.text.matchAll(/\{(\d+)\}/g), match => Number(match[1])), [1,2,3,4,5,6,7,8,9,10,11,12]);
  }
  for (const word of words) {
    const positions = new Set(contexts.paragraphs.map(form => Array.from(form.key).indexOf(word)));
    assert.ok(positions.size >= 3, `${word} should move among paragraph positions`);
  }
});

test('adventure, practice, and final mock load the shared contexts before using them', () => {
  for (const page of ['study/index.html','study/unit-1/index.html','study/unit-1/test-practice.html','study/unit-1/mock-test.html']) {
    const html = read(page);
    assert.ok(html.indexOf('unit1-contexts.js') > 0, `${page} should load contexts`);
    const consumer = page.endsWith('test-practice.html') ? 'test-practice.js' : page.endsWith('mock-test.html') ? 'mock-test.js' : 'app.js';
    assert.ok(html.indexOf('unit1-contexts.js') < html.indexOf(consumer), `${page} should load contexts first`);
  }
  const adventure = read('study/unit-1/app.js');
  assert.match(adventure, /function nextContextSentence\(/);
  assert.match(adventure, /context=domain==='definition'&&nextContextSentence\(w\)/);
  assert.match(adventure, /q\.contextual=!!q\.contextId/);
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
  const contexts = read('study/unit-1/unit1-contexts.js');
  assert.match(source, /12-for-12 paragraph/);
  assert.match(source, /answers\.every\(Boolean\)/);
  assert.match(contexts, /Rainy picnic \+ dock/);
  assert.match(source, /function nextParagraph\(/);
  assert.match(source, /function nextSentenceSet\(/);
  assert.match(source, /Sentence variety/);
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

test('parent readiness dashboard routes the primary action through Mastery Quest', () => {
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
  assert.match(source, /mastery-quest\.html\?learner=/);
  assert.match(source, /Run vocabulary Final Boss/);
});

test('final mocks use approved 12-for-12 paragraphs and withhold feedback until submission', () => {
  const source = read('study/unit-1/mock-test.js');
  const contexts = read('study/unit-1/unit1-contexts.js');
  const html = read('study/unit-1/mock-test.html');
  assert.match(html, /Final verification/);
  assert.match(contexts, /The \{1\} ranger had worked the canyon alone for years/);
  assert.match(contexts, /The \{1\} pilot did not \{2\} the flight/);
  assert.match(source, /f\.id!==last/);
  assert.match(source, /Submit entire vocabulary mock/);
  assert.match(source, /Nothing above is graded until Submit/);
  assert.match(source, /none given/);
  assert.match(source, /mock-context/);
  assert.match(source, /mock-synonym/);
  assert.match(source, /mock-antonym/);
});

test('teacher-style exam mirrors all three supplied worksheet formats', () => {
  const source = read('study/unit-1/mock-test.js');
  const html = read('study/unit-1/mock-test.html');
  const index = read('study/unit-1/index.html');
  assert.match(index, /Teacher-style exam/);
  assert.match(html, /context clues, synonyms and antonyms, then connected passages/i);
  assert.match(source, /To refuse a gift is to/);
  assert.match(source, /\['reject','rejected'/);
  assert.match(source, /\['distribute','distributed'/);
  assert.match(source, /\['myth','myths'/);
  assert.match(source, /\['veteran','veterans'/);
  assert.match(source, /teacher-mock-word-form/);
  assert.match(source, /Nothing is graded until Submit/);
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

test('Mastery Quest is a one-button vocabulary control loop with mastered-word suppression', () => {
  const html = read('study/unit-1/mastery-quest.html');
  const source = read('study/unit-1/mastery-quest.js');
  const css = read('study/unit-1/mastery-quest.css');
  assert.match(html, /Monday mastery/);
  assert.match(html, /unit1-mastery\.js/);
  assert.match(html, /unit1-cloud\.js/);
  assert.match(source, /Start Mastery Quest/);
  assert.match(source, /Mastered-word suppression/);
  assert.match(source, /at most one already-ready retention check/);
  assert.match(source, /candidateTasks/);
  assert.match(source, /M\.vocabReady/);
  assert.match(source, /M\.weakness/);
  assert.match(source, /M\.vocabDomains/);
  assert.match(css, /\.quest-rune/);
  assert.match(css, /min-height:48px/);
  assert.match(css, /safe-area-inset-top/);
});

test('Mastery Quest turns misses into hidden repair plus delayed retrieval', () => {
  const source = read('study/unit-1/mastery-quest.js');
  assert.match(source, /insertDelayed\(task\)/);
  assert.match(source, /The answer is/);
  assert.match(source, /Rebuild from memory/);
  assert.match(source, /mastery-quest-repair/);
  assert.match(source, /assisted:true,independent:false/);
  assert.match(source, /mastery-quest-bank/);
});

test('Mastery Quest has 12 runes, weak-word bosses, Sunday Final Boss, and Monday confidence mode', () => {
  const source = read('study/unit-1/mastery-quest.js');
  assert.match(source, /Recover all 12 Word Runes/);
  assert.match(source, /Weak-word boss/);
  assert.match(source, /2026-08-30/);
  assert.match(source, /2026-08-31/);
  assert.match(source, /Face the Sunday Final Boss/);
  assert.match(source, /startConfidence/);
  assert.match(source, /Monday confidence check/);
  assert.match(source, /No coaching until the end/);
  assert.match(source, /Stop studying/);
});

test('vocabulary readiness is aligned to the actual word-bank test instead of requiring harder free recall', () => {
  const mastery = read('study/unit-1/unit1-mastery.js');
  assert.match(mastery, /Unit 1 vocabulary is tested with a word bank/);
  assert.match(mastery, /independentCorrects\(name,word,domain\)>=1/);
  assert.match(mastery, /Harder free recall remains useful remediation/);
  assert.doesNotMatch(mastery, /vocabReady[^\n]+independentCorrects\(name,word,'pos'\)/);
});

test('Final Boss can be launched directly from Mastery Quest and returns there after remediation', () => {
  const html = read('study/unit-1/mock-test.html');
  const entry = read('study/unit-1/mock-test-entry.js');
  assert.match(html, /mock-test-entry\.js/);
  assert.match(html, /Mastery Quest/);
  assert.match(entry, /mode!=='vocabulary'/);
  assert.match(entry, /start-vocab/);
  assert.match(entry, /mastery-quest\.html\?learner=/);
});
