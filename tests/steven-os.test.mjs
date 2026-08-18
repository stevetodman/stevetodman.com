import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { buildDecisionQueue, buildExecutionQueue, classifyGate } from '../steven-os/lib/policy-engine.mjs';
import { createProviderRegistry, routeModel } from '../steven-os/lib/model-router.mjs';
import { normalizePullRequest, preserveEvidenceBoundary } from '../steven-os/lib/github-normalizer.mjs';

const statePath = new URL('../steven-os/state/projects.json', import.meta.url);
const ingestFunctionPath = new URL('../steven-os/supabase/functions/steven-os-ingest/index.ts', import.meta.url);
const briefFunctionPath = new URL('../steven-os/supabase/functions/steven-os-brief/index.ts', import.meta.url);
const supabaseConfigPath = new URL('../steven-os/supabase/config.toml', import.meta.url);

async function loadState() {
  return JSON.parse(await fs.readFile(statePath, 'utf8'));
}

test('shadow state preserves the PR 19 evidence boundary', async () => {
  const data = await loadState();
  const project = data.projects.find((p) => p.id === 'cardio-hospital');
  assert.ok(project);
  assert.equal(project.currentWork.number, 19);
  assert.equal(project.currentWork.headSha, '67ded600a65c6d29f24dabb0cdef045feb95e9de');
  assert.equal(project.currentWork.draft, true);
  assert.equal(project.production.verifiedAgainstHead, false);
  assert.ok(project.evidence.some((e) => e.id === 'ue-native-gates' && e.status === 'blocked'));
});

test('policy engine interrupts Steven only for human gates', async () => {
  const { projects } = await loadState();
  const decisions = buildDecisionQueue(projects);
  const execution = buildExecutionQueue(projects);
  assert.deepEqual(decisions.map((d) => d.gateId), ['clinical-review', 'institutional-branding']);
  assert.ok(execution.some((item) => item.gateId === 'native-unreal-validation'));
  assert.ok(execution.some((item) => item.gateId === 'next-action'));
  assert.equal(classifyGate({ type: 'money', state: 'open', owner: 'execution' }), 'needs_steven');
});

test('model router chooses by capability and policy, not provider name', () => {
  const models = [
    { id: 'vendor-a/fast', providerId: 'vendor-a', capabilities: { coding: 0.8, tool_use: 1 }, quality: 0.7, costIndex: 0.2 },
    { id: 'vendor-b/deep', providerId: 'vendor-b', capabilities: { coding: 1, tool_use: 1 }, quality: 0.95, costIndex: 0.8 },
    { id: 'local/tiny', providerId: 'local', capabilities: { coding: 0.4, tool_use: 0 }, quality: 0.3, costIndex: 0.01 }
  ];
  const task = { id: 'hard-code-review', required: { coding: 0.9, tool_use: 1 }, preferred: { coding: 2 }, qualityWeight: 2, costWeight: 0.1 };
  const routed = routeModel(models, task);
  assert.equal(routed.selected.id, 'vendor-b/deep');
});

test('provider registry accepts arbitrary provider IDs', () => {
  const registry = createProviderRegistry([{ id: 'openai' }, { id: 'anthropic' }, { id: 'google' }, { id: 'future-model-company' }]);
  assert.equal(registry.list().length, 4);
  assert.equal(registry.get('future-model-company').id, 'future-model-company');
});

test('GitHub ingestion normalizes facts without deciding project readiness', () => {
  const pr = {
    number: 19,
    url: 'https://github.com/stevetodman/stevetodman.com/pull/19',
    title: 'Add Cardio Hospital Unreal migration scaffold',
    state: 'open',
    draft: true,
    mergeable: true,
    base: 'main',
    head: 'agent/unreal-migration-scaffold',
    head_sha: '67ded600a65c6d29f24dabb0cdef045feb95e9de',
    commits: 16,
    changed_files: 103,
    updated_at: '2026-08-17T18:41:33Z'
  };
  const workflowRuns = [
    { id: 1, name: 'Tests', status: 'completed', conclusion: 'success', run_number: 157, workflow_id: 10 },
    { id: 2, name: 'Cardio Hospital Unreal', status: 'completed', conclusion: 'success', run_number: 96, workflow_id: 11 }
  ];
  const normalized = normalizePullRequest({ repositoryFullName: 'stevetodman/stevetodman.com', pr, workflowRuns, observedAt: '2026-08-18T12:30:00Z' });
  assert.equal(normalized.source.sourceSha, pr.head_sha);
  assert.equal(normalized.workItem.ownerClass, 'execution');
  assert.equal(normalized.ciEvidence.length, 2);
  assert.ok(normalized.ciEvidence.every((e) => e.status === 'pass'));
  assert.equal(normalized.event.payload.ci.success, 2);
  assert.equal(normalized.event.payload.ci.failed, 0);
});

test('green GitHub CI cannot erase an independent evidence boundary', () => {
  const normalized = normalizePullRequest({
    repositoryFullName: 'stevetodman/stevetodman.com',
    pr: { number: 19, url: 'x', title: 'x', state: 'open', draft: true, mergeable: true, base: 'main', head: 'feature', head_sha: 'abc', updated_at: '2026-08-18T00:00:00Z' },
    workflowRuns: [{ id: 1, name: 'Tests', status: 'completed', conclusion: 'success', run_number: 1, workflow_id: 1 }]
  });
  const bounded = preserveEvidenceBoundary(normalized, ['Native target-hardware validation remains unverified.']);
  assert.equal(bounded.ciEvidence[0].status, 'pass');
  assert.equal(bounded.boundaryEvidence[0].status, 'blocked');
  assert.match(bounded.boundaryEvidence[0].claim, /unverified/i);
});

test('backend functions require secret auth in code and never embed credentials', async () => {
  const [ingest, brief, config] = await Promise.all([
    fs.readFile(ingestFunctionPath, 'utf8'),
    fs.readFile(briefFunctionPath, 'utf8'),
    fs.readFile(supabaseConfigPath, 'utf8')
  ]);

  for (const source of [ingest, brief]) {
    assert.match(source, /withSupabase\(\{ auth: "secret" \}/);
    assert.match(source, /SUPABASE_DB_URL/);
    assert.doesNotMatch(source, /sb_secret_[A-Za-z0-9_-]+/);
    assert.doesNotMatch(source, /service_role[^\n]*[:=][^\n]*[A-Za-z0-9_-]{20,}/i);
  }

  assert.match(config, /\[functions\.steven-os-ingest\][\s\S]*verify_jwt\s*=\s*false/);
  assert.match(config, /\[functions\.steven-os-brief\][\s\S]*verify_jwt\s*=\s*false/);
});
