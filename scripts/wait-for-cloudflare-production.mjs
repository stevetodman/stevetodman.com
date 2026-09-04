import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const CLOUDFLARE_APP = 'cloudflare-workers-and-pages';
const CLOUDFLARE_CHECK = 'Cloudflare Pages';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function timestamp(run) {
  return Date.parse(run.completed_at || run.started_at || 0) || 0;
}

function isRelevant(run, targetSha, project) {
  return run?.name === CLOUDFLARE_CHECK
    && run?.app?.slug === CLOUDFLARE_APP
    && run?.head_sha === targetSha
    && String(run?.details_url || '').includes(`/pages/view/${project}/`);
}

function isBranchPreview(run) {
  return /Branch Preview URL:/i.test(run?.output?.summary || '');
}

function deploymentUrl(run, project) {
  const hostname = `${escapeRegExp(project)}\\.pages\\.dev`;
  return (run?.output?.summary || '').match(new RegExp(`https://[a-f0-9]+\\.${hostname}`, 'i'))?.[0] || '';
}

export function selectCloudflareProductionState(checkRuns, targetSha, project) {
  assert.match(targetSha, /^[a-f0-9]{40}$/, 'target SHA must be a full lowercase Git SHA');
  assert.match(project, /^[a-z0-9-]+$/, 'Cloudflare Pages project is invalid');

  const relevant = checkRuns.filter(run => isRelevant(run, targetSha, project));
  const completedIds = new Set(
    relevant.filter(run => run.status === 'completed').map(run => run.external_id).filter(Boolean),
  );
  const unsettled = relevant.filter(run => run.status !== 'completed' && !completedIds.has(run.external_id));
  const successes = relevant
    .filter(run => run.status === 'completed' && run.conclusion === 'success' && !isBranchPreview(run))
    .map(run => ({ run, url: deploymentUrl(run, project) }))
    .filter(({ run, url }) => {
      const id = String(run.external_id || '');
      return Boolean(url)
        && id.length >= 8
        && new URL(url).hostname.startsWith(`${id.slice(0, 8).toLowerCase()}.`)
        && (run.output?.summary || '').includes(`<code>${targetSha.slice(0, 7)}</code>`);
    })
    .sort((a, b) => timestamp(b.run) - timestamp(a.run));

  const deployment = successes[0] || null;
  const newerUnsettled = deployment
    ? unsettled.filter(run => timestamp(run) >= timestamp(deployment.run))
    : unsettled;

  return {
    deployment,
    newerUnsettled,
    terminalFailures: relevant.filter(run => run.status === 'completed' && run.conclusion !== 'success'),
  };
}

async function githubGet(repository, pathname, token) {
  const response = await fetch(`https://api.github.com/repos/${repository}${pathname}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      'user-agent': 'stevetodman-production-verifier',
    },
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, `GitHub API ${pathname} returned HTTP ${response.status}`);
  return response.json();
}

async function assertCurrentMain(repository, targetSha, token) {
  const branch = await githubGet(repository, '/branches/main', token);
  assert.equal(
    branch?.commit?.sha,
    targetSha,
    `main advanced: expected ${targetSha}, found ${branch?.commit?.sha || 'unknown'}`,
  );
}

function appendEnvironment(name, value) {
  if (process.env.GITHUB_ENV) fs.appendFileSync(process.env.GITHUB_ENV, `${name}=${value}\n`);
}

function appendOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY || '';
  const targetSha = process.env.TARGET_SHA || process.env.GITHUB_SHA || '';
  const project = process.env.CLOUDFLARE_PROJECT || 'stevetodman-com';
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  const timeoutMs = Number(process.env.CLOUDFLARE_WAIT_SECONDS || 900) * 1000;
  const intervalMs = Number(process.env.CLOUDFLARE_POLL_SECONDS || 15) * 1000;

  assert.match(repository, /^[^/]+\/[^/]+$/, 'GITHUB_REPOSITORY is missing or invalid');
  assert.ok(token, 'GITHUB_TOKEN or GH_TOKEN is required');
  assert.ok(timeoutMs >= 1000 && intervalMs >= 1000, 'Cloudflare polling intervals are invalid');
  await assertCurrentMain(repository, targetSha, token);

  const deadline = Date.now() + timeoutMs;
  let lastState = null;
  while (Date.now() < deadline) {
    const payload = await githubGet(
      repository,
      `/commits/${targetSha}/check-runs?filter=all&per_page=100`,
      token,
    );
    lastState = selectCloudflareProductionState(payload.check_runs || [], targetSha, project);

    if (lastState.deployment && lastState.newerUnsettled.length === 0) {
      await assertCurrentMain(repository, targetSha, token);
      const { run, url } = lastState.deployment;
      const result = {
        targetSha,
        project,
        deploymentId: run.external_id,
        deploymentUrl: url,
        completedAt: run.completed_at,
        detailsUrl: run.details_url,
        production: true,
      };
      fs.mkdirSync('verification-artifacts', { recursive: true });
      fs.writeFileSync('verification-artifacts/cloudflare-production.json', `${JSON.stringify(result, null, 2)}\n`);
      appendEnvironment('DEPLOYMENT_ORIGIN', url);
      appendOutput('deployment_origin', url);
      appendOutput('deployment_id', run.external_id);
      console.log(`Exact Cloudflare production deployment succeeded for ${targetSha}: ${url}`);
      return;
    }

    const status = lastState.newerUnsettled.length
      ? `${lastState.newerUnsettled.length} deployment check(s) still running`
      : 'production deployment success not present yet';
    console.log(`Cloudflare Pages for ${targetSha}: ${status}`);
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  const failures = lastState?.terminalFailures || [];
  if (failures.length) {
    for (const failure of failures) {
      console.error(`Cloudflare check concluded ${failure.conclusion}: ${failure.details_url || failure.html_url}`);
    }
  }
  throw new Error(`Timed out without a successful exact production deployment for ${targetSha}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
