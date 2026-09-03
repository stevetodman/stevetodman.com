import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const read = relativePath => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

test('Study Unit 1 guards the final-check grading and scheduling fixes', () => {
  const source = read('study/unit-1/app.js');

  assert.match(source, /function localDateKey\(date\)/);
  assert.doesNotMatch(source, /function todayKey\(\) \{ return new Date\(\)\.toISOString\(\)\.slice\(0,10\); \}/);
  assert.match(source, /function teacherClue\(/);
  assert.match(source, /accepted:\[w\.word\]/);
  assert.match(source, /wordBank:true/);
  assert.match(source, /choices:shuffle\(WORDS\.map/);
  assert.match(source, /score:repeat\*75\+pairPriority\(name,word,domain\)\+Math\.random\(\)\*18/);
  assert.match(source, /\.sort\(function\(a,b\)\{return a\.score-b\.score;\}\)/);
  assert.match(source, /spelling:new Date\('2026-09-09T08:00:00'\)/);
  assert.match(source, /if\(current<TEST_DATES\.spelling\)/);
  assert.match(source, /return \['definition','definition','synonym','synonym','antonym','antonym','spelling','spelling','spelling','spelling'\]/);
  assert.match(source, /var lastRetryIndex=SESSION_LENGTH-2/);
  assert.match(source, /var target=Math\.min\(start,lastRetryIndex\)/);
});

test('Study progress schema and compatibility identifiers remain migration-safe', () => {
  const source = read('study/unit-1/app.js');
  assert.match(source, /var STORAGE_KEY = 'studyhub-word-expedition-unit1-v3'/);
  assert.match(source, /var LEGACY_KEY = 'studyhub-word-mission-unit1-v2'/);
  assert.match(source, /return \{ version:3, learners:/);
  assert.match(source, /word-mission-unit1-luke/);
  assert.match(source, /word-mission-unit1-samantha/);
  assert.match(source, /var LEGACY_CLOUD_TOKEN_KEY = 'usStatesCloudToken'/);
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

test('Study releases have minimal dedicated CI, live canaries, and stale-cache defense', () => {
  const contract = read('study/STUDY_CONTRACT.md');
  assert.match(contract, /\/study\/.*Grade 5 Learning Hub/);
  assert.match(contract, /\/study\/unit-1\/.*canonical Unit 1 Word Expedition application/);
  assert.match(contract, /Question 10 is the final checkpoint/);
  assert.match(contract, /Do not clear browser storage/);

  const workflow = read('.github/workflows/study-contract.yml');
  assert.match(workflow, /name: Study contract/);
  assert.match(workflow, /npm run test:study:unit/);
  assert.match(workflow, /npm run test:study:webkit/);
  assert.doesNotMatch(workflow, /npm run test:study:smoke/);
  assert.match(workflow, /!study\/us-states\.html/);

  const liveWorkflow = read('.github/workflows/study-live-canary.yml');
  assert.match(liveWorkflow, /name: Study live canary/);
  assert.match(liveWorkflow, /npm run verify:study-production/);
  assert.match(liveWorkflow, /schedule:/);
  assert.match(liveWorkflow, /workflow_dispatch:/);

  const cloudWorkflow = read('.github/workflows/study-cloud-canary.yml');
  assert.match(cloudWorkflow, /name: Study cloud canary/);
  assert.match(cloudWorkflow, /cron: '23 \*\/6 \* \* \*'/);
  assert.match(cloudWorkflow, /mapCorrect: Math\.max\(num\(sa\.mapCorrect\), num\(sb\.mapCorrect\)\)/);
  assert.match(cloudWorkflow, /mapWrong: Math\.max\(num\(sa\.mapWrong\), num\(sb\.mapWrong\)\)/);
  assert.match(cloudWorkflow, /issues: write/);
  assert.match(cloudWorkflow, /bash scripts\/verify-study-cloud\.sh/);
  assert.match(cloudWorkflow, /Alert on cloud canary failure/);
  assert.match(cloudWorkflow, /Close recovered cloud canary alert/);
  assert.match(cloudWorkflow, /\[automation\] StudyHub cloud canary failing/);
  assert.match(cloudWorkflow, /github\.event_name != 'pull_request'/);

  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.scripts['verify:study-production'], 'node scripts/verify-study-release.mjs');
  assert.equal(packageJson.scripts['verify:study-production:browser'], 'node scripts/verify-study-production.mjs');

  const releaseManifest = read('scripts/study-release.mjs');
  assert.match(releaseManifest, /unit1-contexts\.js/);

  const build = read('scripts/build-site.mjs');
  assert.match(build, /unit1-contexts/);
  assert.match(build, /computeStudyReleaseVersion/);

  const headers = read('_headers');
  assert.match(headers, /\/study\/\*\s+Cache-Control: no-cache, max-age=0, must-revalidate/);

  const lightweightCanary = read('scripts/verify-study-release.mjs');
  assert.doesNotMatch(lightweightCanary, /playwright|chromium\.launch/);
  assert.match(lightweightCanary, /unit1-contexts/);

  const browserCanary = read('scripts/verify-study-production.mjs');
  assert.match(browserCanary, /context\.route\('https:\/\/\*\.supabase\.co\/\*\*'/);
  assert.match(browserCanary, /manifest\.start_url, '\/study\/'/);
});
