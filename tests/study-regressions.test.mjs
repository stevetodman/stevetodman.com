import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Study Unit 1 guards the final-check grading and scheduling fixes', () => {
  const app = read('study/unit-1/app.js');
  assert.match(app, /Question 10/);
  assert.match(app, /final checkpoint/i);
});

test('Study progress schema and compatibility identifiers remain migration-safe', () => {
  const app = read('study/unit-1/app.js');
  assert.match(app, /studyhub-word-expedition-game-unit1-v1/);
  assert.match(app, /studyhub-word-expedition-round-unit1-v1-/);
});

test('Study learner cards use valid phrasing content', () => {
  const html = read('study/index.html');
  assert.doesNotMatch(html, /you is|your is/i);
});

test('Study PWA keeps the old installed-app identity but opens the current assignment', () => {
  const manifest = JSON.parse(read('study/manifest.webmanifest'));
  assert.equal(manifest.start_url, '/study/');
  assert.equal(manifest.scope, '/study/');
});

test('Study page metadata does not publish learner names', () => {
  for (const page of ['study/index.html', 'study/unit-1/index.html']) {
    const html = read(page);
    const description = html.match(/<meta name="description" content="([^"]*)">/i)?.[1] || '';
    assert.ok(description.length > 0);
    assert.doesNotMatch(description, /Luke|Samantha/i);
  }
});

test('Study releases have an explicit contract, dedicated CI gate, live canary, and stale-cache defense', () => {
  const contract = read('study/STUDY_CONTRACT.md');
  assert.match(contract, /\/study\/.*current one-tap Unit 1 assignment/);
  assert.match(contract, /Question 10 is the final checkpoint/);
  assert.match(contract, /Do not clear browser storage/);

  const workflow = read('.github/workflows/study-contract.yml');
  assert.match(workflow, /name: Study contract/);
  assert.match(workflow, /npm run test:study:unit/);
  assert.match(workflow, /npm run test:study:smoke/);

  const liveWorkflow = read('.github/workflows/study-live-canary.yml');
  assert.match(liveWorkflow, /name: Study live canary/);
  assert.match(liveWorkflow, /npm run verify:study-production/);
  assert.match(liveWorkflow, /schedule:/);
  assert.match(liveWorkflow, /workflow_dispatch:/);

  const headers = read('_headers');
  assert.match(headers, /\/study\/\*\s+Cache-Control: no-cache, max-age=0, must-revalidate/);

  const canary = read('scripts/verify-study-production.mjs');
  assert.match(canary, /context\.route\('https:\/\/\*\.supabase\.co\/\*\*'/);
  assert.match(canary, /manifest\.start_url, '\/study\/'/);
});
