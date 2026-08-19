import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { buildDecisionQueue, buildExecutionQueue, classifyGate } from '../steven-os/lib/policy-engine.mjs';
import { createProviderRegistry, routeModel } from '../steven-os/lib/model-router.mjs';
import { normalizePullRequest, preserveEvidenceBoundary } from '../steven-os/lib/github-normalizer.mjs';
import { formatBriefText } from '../steven-os/lib/control-plane.mjs';
import { isBlockedWork, splitExecution } from '../steven-os/lib/home-bands.mjs';
import {
  classifyPullRequest,
  isBotPullRequest,
  loadCatalog,
  routePullRequest,
  shouldIngestRepo,
  workItemExternalId
} from '../steven-os/lib/org-normalizer.mjs';

const statePath = new URL('../steven-os/state/projects.json', import.meta.url);
const ingestFunctionPath = new URL('../steven-os/supabase/functions/steven-os-ingest/index.ts', import.meta.url);
const briefFunctionPath = new URL('../steven-os/supabase/functions/steven-os-brief/index.ts', import.meta.url);
const githubIngestFunctionPath = new URL('../steven-os/supabase/functions/steven-os-github-ingest/index.ts', import.meta.url);
const githubIngestWorkflowPath = new URL('../.github/workflows/steven-os-ingest.yml', import.meta.url);
const githubIngestRunnerPath = new URL('../steven-os/scripts/ingest-github-pr.mjs', import.meta.url);
const morningWorkflowPath = new URL('../.github/workflows/steven-os-morning.yml', import.meta.url);
const morningRunnerPath = new URL('../steven-os/scripts/run-morning.mjs', import.meta.url);
const briefPath = new URL('../steven-os/scripts/brief.mjs', import.meta.url);
const resolveCliPath = new URL('../steven-os/scripts/resolve-decision.mjs', import.meta.url);
const registerPath = new URL('../steven-os/scripts/register-project.mjs', import.meta.url);
const createDecisionPath = new URL('../steven-os/scripts/create-decision.mjs', import.meta.url);
const resolveFunctionPath = new URL('../steven-os/supabase/functions/steven-os-resolve/index.ts', import.meta.url);
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

test('GitHub-to-Steven-OS bridge uses short-lived OIDC with narrow trust', async () => {
  const [gateway, workflow, runner, config] = await Promise.all([
    fs.readFile(githubIngestFunctionPath, 'utf8'),
    fs.readFile(githubIngestWorkflowPath, 'utf8'),
    fs.readFile(githubIngestRunnerPath, 'utf8'),
    fs.readFile(supabaseConfigPath, 'utf8')
  ]);

  assert.match(gateway, /https:\/\/token\.actions\.githubusercontent\.com/);
  assert.match(gateway, /steven-os-github-ingest:v1/);
  assert.match(gateway, /REPOSITORY_ID = "1121860459"/);
  assert.match(gateway, /stevetodman\/stevetodman\.com\/\.github\/workflows\/steven-os-ingest\.yml@refs\/heads\/main/);
  assert.match(gateway, /jwtVerify\(/);
  assert.match(gateway, /algorithms: \["RS256"\]/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /actions:\s*read/);
  assert.doesNotMatch(workflow, /SUPABASE_[A-Z_]+\s*:/);
  assert.match(runner, /ACTIONS_ID_TOKEN_REQUEST_URL/);
  assert.match(runner, /ACTIONS_ID_TOKEN_REQUEST_TOKEN/);
  assert.doesNotMatch(runner, /sb_secret_[A-Za-z0-9_-]+/);
  assert.match(config, /\[functions\.steven-os-github-ingest\][\s\S]*verify_jwt\s*=\s*false/);
});

const catalogPath = new URL('../steven-os/config/projects.json', import.meta.url);

async function loadCatalogFromDisk() {
  return loadCatalog(JSON.parse(await fs.readFile(catalogPath, 'utf8')));
}

test('Dependabot pull requests are not execution work', async () => {
  const catalog = await loadCatalogFromDisk();
  const pr = {
    number: 14,
    title: 'Bump @typescript-eslint/parser from 6.21.0 to 8.65.0',
    author: { login: 'dependabot[bot]' },
    isDraft: false,
    updatedAt: '2026-08-04T14:42:42Z'
  };
  assert.equal(isBotPullRequest(pr, catalog), true);
  const classified = classifyPullRequest(pr, catalog);
  assert.equal(classified.ownerClass, 'external');
  assert.equal(classified.ingestWorkItem, false);
});

test('idle drafts are parked and kept off the execution queue', async () => {
  const catalog = await loadCatalogFromDisk();
  const pr = {
    number: 1,
    title: 'Add AAP-guided pediatric BP next-step workflow',
    author: { login: 'stevetodman' },
    isDraft: true,
    updatedAt: '2026-07-27T22:49:20Z'
  };
  const classified = classifyPullRequest(pr, catalog, new Date('2026-08-18T15:00:00Z'));
  assert.equal(classified.ownerClass, 'external');
  assert.equal(classified.state, 'parked');
  assert.equal(classified.ingestWorkItem, true);
});

test('stevetodman.com Mac integrate PR routes to cardio-hospital', async () => {
  const catalog = await loadCatalogFromDisk();
  const pr = {
    number: 27,
    title: 'Integrate launch-set clinical core into the Mac world branch',
    headRefName: 'mac/integrate-launch-set',
    author: { login: 'stevetodman' }
  };
  assert.equal(routePullRequest('stevetodman/stevetodman.com', pr, catalog), 'cardio-hospital');
  assert.equal(workItemExternalId('stevetodman/stevetodman.com', pr, catalog), 'pr:27');
});

test('stevetodman.com ABPM PR routes to the site project', async () => {
  const catalog = await loadCatalogFromDisk();
  const pr = {
    number: 3,
    title: 'Harden pediatric ABPM test preview with safety and UX gates',
    headRefName: 'agent/pediatric-abpm-worldclass-gates',
    author: { login: 'stevetodman' }
  };
  assert.equal(routePullRequest('stevetodman/stevetodman.com', pr, catalog), 'stevetodman-com');
  assert.equal(workItemExternalId('stevetodman/stevetodman.com', pr, catalog), 'pr:stevetodman/stevetodman.com#3');
});

test('archived repos are skipped', async () => {
  const catalog = await loadCatalogFromDisk();
  assert.equal(shouldIngestRepo({ name: 'heartquest', isArchived: true }, catalog), false);
  assert.equal(shouldIngestRepo({ name: 'peds-ecg-viewer', isArchived: false }, catalog), true);
});

test('home screen splits blocked package work from open PRs', () => {
  const { working, blocked } = splitExecution([
    { title: 'PR 27', state: 'open', kind: 'pull_request' },
    { title: 'Mac package', state: 'blocked', kind: 'package', blocked_evidence: 2 }
  ]);
  assert.equal(working.length, 1);
  assert.equal(blocked.length, 1);
  assert.equal(isBlockedWork({ failing_evidence: 1, state: 'open' }), true);
});

test('brief formatter prints the four home-screen bands', () => {
  const text = formatBriefText({
    generatedAt: '2026-08-18T15:00:00.000Z',
    mode: 'server-secret',
    decisions: [],
    execution: [{
      project_name: 'Cardio Hospital',
      kind: 'pull_request',
      title: 'Integrate launch-set clinical core into the Mac world branch',
      state: 'open',
      metadata: { nextAction: 'Apply GameMode merge' }
    }, {
      project_name: 'Cardio Hospital',
      kind: 'package',
      title: 'Mac package',
      state: 'blocked'
    }],
    shipped: [{ title: 'Smoke-test decision create', project_name: 'Cardio Hospital', kind: 'decision' }],
    projects: [
      { name: 'Cardio Hospital', priority: 1, open_work_items: 7, open_decisions: 0 },
      { name: 'quiet-repo', priority: 8, open_work_items: 0, open_decisions: 0 }
    ]
  });
  assert.match(text, /STEVEN BRIEF/);
  assert.match(text, /NEEDS YOU\s+0/);
  assert.match(text, /AGENTS WORKING\s+1/);
  assert.match(text, /BLOCKED\s+1/);
  assert.match(text, /COMPLETED SINCE YESTERDAY\s+1/);
  assert.doesNotMatch(text, /sb_secret_/);
});

test('morning loop and decision CLIs do not embed credentials or service-role keys', async () => {
  const files = await Promise.all([
    fs.readFile(morningWorkflowPath, 'utf8'),
    fs.readFile(morningRunnerPath, 'utf8'),
    fs.readFile(briefPath, 'utf8'),
    fs.readFile(resolveCliPath, 'utf8'),
    fs.readFile(registerPath, 'utf8'),
    fs.readFile(createDecisionPath, 'utf8'),
    fs.readFile(resolveFunctionPath, 'utf8')
  ]);
  for (const source of files) {
    assert.doesNotMatch(source, /sb_secret_[A-Za-z0-9_-]+/);
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/);
  }
  assert.match(files[0], /run-morning\.mjs --skip-sync/);
  assert.match(files[1], /ingest-github-org\.mjs/);
  assert.match(files[6], /action === "create"/);
});
