/**
 * Discover every active stevetodman GitHub repo and upsert Steven OS projects
 * plus filtered pull-request work items through the existing secret ingest API.
 *
 * Does not ingest PR bodies, comments, or issue text.
 *
 *   node steven-os/scripts/ingest-github-org.mjs
 *   node steven-os/scripts/ingest-github-org.mjs --dry-run
 */
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { normalizePullRequest } from '../lib/github-normalizer.mjs';
import {
  catalogProjectsForRepo,
  classifyPullRequest,
  isBotPullRequest,
  loadCatalog,
  routePullRequest,
  shouldIngestRepo,
  toIngestPr,
  workItemExternalId
} from '../lib/org-normalizer.mjs';

const execFileAsync = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(HERE, '../config/projects.json');
const LOCAL_CONFIG_PATH = path.join(HERE, '../config.local.js');
const INGEST_URL = process.env.STEVEN_OS_INGEST_URL
  || 'https://iuklaekcwynchqfmjgbp.supabase.co/functions/v1/steven-os-ingest';
const DRY_RUN = process.argv.includes('--dry-run');

function readSecret() {
  if (process.env.STEVEN_OS_SECRET) return process.env.STEVEN_OS_SECRET;
  if (!fs.existsSync(LOCAL_CONFIG_PATH)) {
    throw new Error('Missing STEVEN_OS_SECRET and steven-os/config.local.js');
  }
  const sandbox = { window: { STEVEN_OS_CONFIG: {} } };
  vm.runInNewContext(fs.readFileSync(LOCAL_CONFIG_PATH, 'utf8'), sandbox);
  const secret = sandbox.window.STEVEN_OS_CONFIG.apiSecret;
  if (!secret || String(secret).includes('REPLACE_WITH')) {
    throw new Error('apiSecret not set');
  }
  return secret;
}

async function ghJson(args) {
  const { stdout } = await execFileAsync('gh', args, { maxBuffer: 20 * 1024 * 1024 });
  return JSON.parse(stdout);
}

async function ingest(secret, payload) {
  if (DRY_RUN) return { ok: true, dryRun: true };
  const res = await fetch(INGEST_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
      apikey: secret
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ingest ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

function repoFullName(repo, owner) {
  return repo.nameWithOwner || `${owner}/${repo.name}`;
}

function repoSnapshotPayload(project, repo, observedAt, extraEvidence = []) {
  const pushedAt = repo.pushedAt || observedAt;
  return {
    project,
    source: {
      sourceSystem: 'github',
      externalId: `repo:${project.repositoryFullName}`,
      sourceUrl: repo.url || `https://github.com/${project.repositoryFullName}`,
      sourceSha: `pushed:${pushedAt}`,
      observedAt,
      metadata: {
        private: Boolean(repo.isPrivate),
        pushedAt
      }
    },
    workItem: {
      externalSystem: 'github',
      externalId: `repo:${project.id}`,
      kind: 'repository',
      title: `${project.name} repository`,
      state: 'complete',
      ownerClass: 'external',
      acceptanceCriteria: [],
      metadata: {
        repositoryFullName: project.repositoryFullName,
        ignoredBotPrs: extraEvidence.ignoredBotPrs || 0
      }
    },
    event: {
      eventType: 'github_repo_observed',
      externalEventId: `repo:${project.id}@${pushedAt}`,
      occurredAt: pushedAt,
      observedAt,
      payload: {
        private: Boolean(repo.isPrivate),
        ignoredBotPrs: extraEvidence.ignoredBotPrs || 0
      }
    },
    evidence: extraEvidence.ignoredBotPrs
      ? [{
        claim: `${extraEvidence.ignoredBotPrs} Dependabot or bot pull requests were observed and not added to the execution queue.`,
        status: 'informational',
        evidenceType: 'github_org_filter'
      }]
      : []
  };
}

function prPayload(project, repositoryFullName, pr, classification, catalog, observedAt) {
  const adapted = toIngestPr(pr);
  const normalized = normalizePullRequest({
    repositoryFullName,
    pr: adapted,
    workflowRuns: [],
    observedAt
  });
  const externalId = workItemExternalId(repositoryFullName, adapted, catalog);
  normalized.source.externalId = externalId;
  normalized.workItem.externalId = externalId;
  normalized.workItem.ownerClass = classification.ownerClass;
  normalized.workItem.state = classification.state;
  normalized.workItem.metadata = {
    ...normalized.workItem.metadata,
    author: adapted.author,
    projectId: project.id,
    classification: classification.state
  };
  normalized.event.externalEventId = `${externalId}@${adapted.head_sha || observedAt}`;

  if (project.id === 'cardio-hospital' && adapted.number === 27) {
    normalized.workItem.metadata.nextAction = 'Apply Docs/MAC_MERGE_GAME_MODE.md, then package again. Do not ask Steven.';
    normalized.workItem.metadata.command = 'edit Source/CardioHospital/Private/CardioBlockoutGameMode.cpp using Docs/MAC_MERGE_GAME_MODE.md';
    normalized.workItem.state = 'open';
  }
  if (project.id === 'cardio-hospital' && adapted.number === 19) {
    normalized.workItem.metadata.nextAction = 'Do not run the Windows first-build. Current execution is PR #27 on the M4 Max.';
    normalized.workItem.metadata.command = 'gh pr view 27';
    normalized.workItem.state = 'blocked';
  }

  return {
    project,
    source: normalized.source,
    workItem: normalized.workItem,
    event: normalized.event,
    evidence: [{
      claim: `Open pull request #${adapted.number} in ${repositoryFullName}: ${adapted.title}.`,
      status: 'informational',
      evidenceType: 'github_pr',
      metadata: { draft: adapted.draft, author: adapted.author }
    }]
  };
}

async function main() {
  const catalog = loadCatalog(JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8')));
  const secret = DRY_RUN ? 'dry-run' : readSecret();
  const observedAt = new Date().toISOString();
  const owner = catalog.defaults.owner;

  const repos = await ghJson([
    'repo', 'list', owner,
    '--limit', '100',
    '--json', 'name,description,isArchived,isPrivate,url,pushedAt,nameWithOwner'
  ]);

  const counts = { projects: 0, human: 0, parked: 0, bots: 0, skippedArchived: 0, ingested: 0 };

  for (const repo of repos) {
    if (!shouldIngestRepo(repo, catalog)) {
      counts.skippedArchived += 1;
      continue;
    }

    const fullName = repoFullName(repo, owner);
    const pulls = await ghJson([
      'pr', 'list',
      '--repo', fullName,
      '--state', 'open',
      '--limit', '50',
      '--json', 'number,title,url,isDraft,mergeable,headRefName,baseRefName,headRefOid,updatedAt,author'
    ]);

    const classified = pulls.map((pr) => ({
      pr,
      route: routePullRequest(fullName, pr, catalog),
      classification: classifyPullRequest(pr, catalog)
    }));

    const botCount = classified.filter((item) => isBotPullRequest(item.pr, catalog)).length;
    counts.bots += botCount;

    const hasHumanPr = classified.some((item) => item.classification.ownerClass === 'execution');
    const hasCardioPr = classified.some((item) => item.route === 'cardio-hospital' && item.classification.ingestWorkItem);
    const projects = catalogProjectsForRepo(
      { ...repo, fullName, name: repo.name, description: repo.description, url: repo.url },
      catalog,
      { hasHumanPr, hasCardioPr }
    );

    for (const project of projects) {
      await ingest(secret, repoSnapshotPayload(project, repo, observedAt, { ignoredBotPrs: fullName === project.repositoryFullName ? botCount : 0 }));
      counts.projects += 1;
      counts.ingested += 1;
    }

    const projectById = new Map(projects.map((project) => [project.id, project]));
    for (const item of classified) {
      if (!item.classification.ingestWorkItem) continue;
      const project = projectById.get(item.route);
      if (!project) continue;
      await ingest(secret, prPayload(project, fullName, item.pr, item.classification, catalog, observedAt));
      counts.ingested += 1;
      if (item.classification.ownerClass === 'execution') counts.human += 1;
      else counts.parked += 1;
    }
  }

  console.log(JSON.stringify({ dryRun: DRY_RUN, ...counts }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
