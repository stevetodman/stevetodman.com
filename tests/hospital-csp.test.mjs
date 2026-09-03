import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const headers = fs.readFileSync(path.join(repoRoot, '_headers'), 'utf8');

function cspLines() {
  return headers
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('Content-Security-Policy:'));
}

test('production CSP permits Rapier WebAssembly without enabling general JavaScript eval', () => {
  const policies = cspLines();
  assert.ok(policies.length > 0, 'expected at least one Content-Security-Policy rule');

  for (const policy of policies) {
    assert.match(
      policy,
      /(?:^|[;\s])script-src\s+[^;]*'wasm-unsafe-eval'(?:[;\s]|$)/,
      'every applicable CSP must allow WebAssembly compilation for the unified hospital runtime',
    );
    const scriptSrc = policy.match(/(?:^|;)\s*script-src\s+([^;]+)/)?.[1] ?? '';
    const tokens = scriptSrc.trim().split(/\s+/);
    assert.equal(
      tokens.includes("'unsafe-eval'"),
      false,
      'general JavaScript unsafe-eval must remain disabled; only wasm-unsafe-eval is required',
    );
  }
});
