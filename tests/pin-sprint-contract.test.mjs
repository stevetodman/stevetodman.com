import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

test('graded 50-state test stays fixed at 50 while Quick Round can retry misses', () => {
  const source = fs.readFileSync(path.join(repoRoot, 'study/us-states.html'), 'utf8');
  const start = source.indexOf('function afterTestAnswer(correct, item) {');
  const end = source.indexOf('function renderTestResults()', start);
  assert.ok(start >= 0 && end > start, 'Full Test answer handler should exist');
  const handler = source.slice(start, end);

  assert.match(source, /<span class="badge">Graded &bull; 50 questions<\/span>/);
  assert.match(source, /var pool = shuffle\(STATES\.slice\(\)\);/);
  assert.match(handler, /if \(roundLabel === "Quick Round"\) queueRetry\(item\);/);
  assert.doesNotMatch(handler, /\n\s*queueRetry\(item\);/);
});
