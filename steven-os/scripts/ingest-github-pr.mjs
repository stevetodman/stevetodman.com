import fs from 'node:fs/promises';
import process from 'node:process';
import { normalizePullRequest, preserveEvidenceBoundary } from '../lib/github-normalizer.mjs';

const API_VERSION = '2026-03-10';
const OIDC_AUDIENCE = 'steven-os-github-ingest:v1';
const INGEST_URL = 'https://iuklaekcwynchqfmjgbp.supabase.co/functions/v1/steven-os-github-ingest';
const CONFIG_URL = new URL('../config/cardio-hospital.json', import.meta.url);

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function githubJson(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': API_VERSION,
      'User-Agent': 'steven-os-ingest'
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} for ${path}: ${body.slice(0, 500)}`);
  }
  return await response.json();
}

async function eventPayload() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) return {};
  try {
    return JSON.parse(await fs.readFile(eventPath, 'utf8'));
  } catch {
    return {};
  }
}

function prNumberFrom(event, config) {
  const explicit = Number(process.env.STEVEN_OS_PR_NUMBER || '');
  if (Number.isInteger(explicit) && explicit > 0) return explicit;

  const fromWorkflowRun = Number(event?.workflow_run?.pull_requests?.[0]?.number || '');
  if (Number.isInteger(fromWorkflowRun) && fromWorkflowRun > 0) return fromWorkflowRun;

  return Number(config.pullRequest);
}

function adaptPr(raw) {
  return {
    number: raw.number,
    url: raw.html_url,
    title: raw.title,
    state: raw.state,
    draft: raw.draft,
    mergeable: raw.mergeable,
    base: raw.base?.ref,
    head: raw.head?.ref,
    head_sha: raw.head?.sha,
    commits: raw.commits,
    changed_files: raw.changed_files,
    updated_at: raw.updated_at,
    body: raw.body || ''
  };
}

function adaptRuns(rawRuns, allowedNames) {
  return (rawRuns || [])
    .filter((run) => !allowedNames?.length || allowedNames.includes(run.name))
    .map((run) => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      run_number: run.run_number,
      workflow_id: run.workflow_id
    }));
}

function reportedValidationEvidence(body) {
  const evidence = [];
  const portable = body.match(/Unreal portable suite:\s*\*\*(\d+\/\d+) passed\*\*/i);
  if (portable) {
    evidence.push({
      claim: `PR validation reports Unreal portable suite ${portable[1]} passed.`,
      status: 'pass',
      evidenceType: 'reported_validation',
      metadata: { source: 'pull_request_body', metric: 'unreal_portable_suite', result: portable[1] }
    });
  }

  const browser = body.match(/Full repository\/browser suite:\s*\*\*(\d+\/\d+) passed\*\* across (\d+) suites/i);
  if (browser) {
    evidence.push({
      claim: `PR validation reports full repository/browser suite ${browser[1]} passed across ${browser[2]} suites.`,
      status: 'pass',
      evidenceType: 'reported_validation',
      metadata: { source: 'pull_request_body', metric: 'repository_browser_suite', result: browser[1], suites: Number(browser[2]) }
    });
  }

  return evidence;
}

async function oidcToken() {
  const requestUrl = new URL(requiredEnv('ACTIONS_ID_TOKEN_REQUEST_URL'));
  requestUrl.searchParams.set('audience', OIDC_AUDIENCE);
  const response = await fetch(requestUrl, {
    headers: { Authorization: `Bearer ${requiredEnv('ACTIONS_ID_TOKEN_REQUEST_TOKEN')}` }
  });
  if (!response.ok) throw new Error(`GitHub OIDC token request failed: ${response.status}`);
  const data = await response.json();
  if (typeof data.value !== 'string' || !data.value) throw new Error('GitHub OIDC response did not contain a token');
  return data.value;
}

async function main() {
  const config = JSON.parse(await fs.readFile(CONFIG_URL, 'utf8'));
  const token = requiredEnv('GITHUB_TOKEN');
  const event = await eventPayload();
  const repository = process.env.GITHUB_REPOSITORY || config.project.repositoryFullName;
  if (repository !== config.project.repositoryFullName) throw new Error(`Unexpected repository: ${repository}`);

  const prNumber = prNumberFrom(event, config);
  if (prNumber !== Number(config.pullRequest)) {
    console.log(`Ignoring PR #${prNumber}; pilot is PR #${config.pullRequest}.`);
    return;
  }

  const rawPr = await githubJson(`/repos/${repository}/pulls/${prNumber}`, token);
  const pr = adaptPr(rawPr);
  const rawRuns = await githubJson(`/repos/${repository}/actions/runs?head_sha=${encodeURIComponent(pr.head_sha)}&per_page=100`, token);
  const workflowRuns = adaptRuns(rawRuns.workflow_runs, config.workflowEvidenceNames || []);

  let normalized = normalizePullRequest({
    repositoryFullName: repository,
    pr,
    workflowRuns,
    observedAt: new Date().toISOString()
  });
  normalized = preserveEvidenceBoundary(normalized, config.evidenceBoundaries || []);

  if (normalized.boundaryEvidence.length) normalized.workItem.state = 'blocked';
  normalized.workItem.acceptanceCriteria = config.acceptanceCriteria || [];
  normalized.workItem.metadata = {
    ...normalized.workItem.metadata,
    nextAction: config.nextAction,
    command: config.command,
    productionVerifiedAgainstHead: false
  };

  const payload = {
    project: config.project,
    ...normalized,
    evidence: reportedValidationEvidence(pr.body)
  };

  const identityToken = await oidcToken();
  const response = await fetch(INGEST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${identityToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const responseText = await response.text();
  if (!response.ok) throw new Error(`Steven OS ingest failed ${response.status}: ${responseText.slice(0, 1000)}`);

  console.log(`Steven OS synced PR #${prNumber} at ${pr.head_sha}: ${responseText}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
