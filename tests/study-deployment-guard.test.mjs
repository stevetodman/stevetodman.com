import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { selectCloudflareProductionState } from '../scripts/wait-for-cloudflare-production.mjs';
import { repoRoot } from './helpers/harness.mjs';

const SHA = 'a'.repeat(40);
const PROJECT = 'stevetodman-com';

function cloudflareRun({
  id,
  status = 'completed',
  conclusion = 'success',
  startedAt,
  branchPreview = false,
  sha = SHA,
}) {
  const short = id.slice(0, 8);
  return {
    name: 'Cloudflare Pages',
    app: { slug: 'cloudflare-workers-and-pages' },
    head_sha: sha,
    external_id: id,
    details_url: `https://dash.cloudflare.com/?to=/account/pages/view/${PROJECT}/${id}`,
    status,
    conclusion,
    started_at: startedAt,
    completed_at: status === 'completed' ? startedAt : null,
    output: {
      summary: status === 'completed'
        ? `<code>${sha.slice(0, 7)}</code><a href='https://${short}.${PROJECT}.pages.dev'>deployment</a>${branchPreview ? 'Branch Preview URL:' : ''}`
        : 'Building',
    },
  };
}

test('Cloudflare resolver selects production and rejects a newer branch preview', () => {
  const productionId = '11111111-1111-4111-8111-111111111111';
  const previewId = '22222222-2222-4222-8222-222222222222';
  const runs = [
    cloudflareRun({ id: productionId, startedAt: '2026-09-04T00:00:00Z', status: 'in_progress', conclusion: null }),
    cloudflareRun({ id: productionId, startedAt: '2026-09-04T00:01:00Z' }),
    cloudflareRun({ id: previewId, startedAt: '2026-09-04T00:03:00Z', branchPreview: true }),
  ];

  const state = selectCloudflareProductionState(runs, SHA, PROJECT);
  assert.equal(state.deployment?.run.external_id, productionId);
  assert.equal(state.deployment?.url, `https://11111111.${PROJECT}.pages.dev`);
  assert.deepEqual(state.newerUnsettled, []);

  const previewOnly = selectCloudflareProductionState([runs[2]], SHA, PROJECT);
  assert.equal(previewOnly.deployment, null);
});

test('Cloudflare resolver blocks while any newer deployment for the SHA is unfinished', () => {
  const production = cloudflareRun({
    id: '11111111-1111-4111-8111-111111111111',
    startedAt: '2026-09-04T00:01:00Z',
  });
  const newer = cloudflareRun({
    id: '33333333-3333-4333-8333-333333333333',
    startedAt: '2026-09-04T00:03:00Z',
    status: 'in_progress',
    conclusion: null,
  });
  const state = selectCloudflareProductionState([production, newer], SHA, PROJECT);
  assert.equal(state.deployment?.run.external_id, production.external_id);
  assert.equal(state.newerUnsettled.length, 1);
});

test('Study live workflow cannot pass on CI or a static stale page alone', () => {
  const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/study-live-canary.yml'), 'utf8');
  const waitIndex = workflow.indexOf('node scripts/wait-for-cloudflare-production.mjs');
  const browserIndex = workflow.indexOf('node scripts/verify-study-deployment.mjs');

  assert.match(workflow, /name: Study production deployment/);
  assert.match(workflow, /push:\s*\n\s*branches: \[main\]/);
  assert.doesNotMatch(workflow, /push:\s*\n\s*branches: \[main\]\s*\n\s*paths:/, 'every main deployment must be verified');
  assert.match(workflow, /checks: read/);
  assert.ok(waitIndex >= 0 && browserIndex > waitIndex, 'exact deployment wait must precede browser verification');
  assert.match(workflow, /Refuse a stale result if main advanced/);
  assert.doesNotMatch(workflow, /sleep 30\s+.*verify:study-production/s);

  const resolver = fs.readFileSync(path.join(repoRoot, 'scripts/wait-for-cloudflare-production.mjs'), 'utf8');
  assert.match(resolver, /filter=all/);
  assert.match(resolver, /Branch Preview URL:/);
  assert.match(resolver, /assertCurrentMain/);

  const browser = fs.readFileSync(path.join(repoRoot, 'scripts/verify-study-deployment.mjs'), 'utf8');
  assert.match(browser, /path\.join\('dist'/);
  assert.match(browser, /DEPLOYMENT_ORIGIN/);
  assert.match(browser, /page\.touchscreen\.tap/);
  assert.match(browser, /page\.on\('pageerror'/);
  assert.match(browser, /message\.type\(\) === 'error'/);
  assert.match(browser, /Graded\\s\*\[•·\]\\s\*50 questions/);

  const agentPolicy = fs.readFileSync(path.join(repoRoot, 'AGENTS.md'), 'utf8');
  assert.match(agentPolicy, /committed;[\s\S]*pre-deployment CI passed;[\s\S]*Cloudflare Pages deployment succeeded;/);
  assert.match(agentPolicy, /DEPLOYED AND LIVE-VERIFIED/);
});
