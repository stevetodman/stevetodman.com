const CARDIO_HOSPITAL_ID = 'cardio-hospital';
const SITE_ID = 'stevetodman-com';
const SITE_REPO = 'stevetodman/stevetodman.com';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function compilePattern(source) {
  return new RegExp(source, 'i');
}

export function loadCatalog(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('projects catalog must be an object');
  const defaults = raw.defaults || {};
  return {
    defaults: {
      owner: defaults.owner || 'stevetodman',
      skipArchived: defaults.skipArchived !== false,
      idleDraftDays: Number.isFinite(defaults.idleDraftDays) ? defaults.idleDraftDays : 14,
      botLogins: new Set((defaults.botLogins || []).map((login) => String(login).toLowerCase())),
      botTitlePatterns: (defaults.botTitlePatterns || []).map(compilePattern),
      defaultPriorityWithHumanPr: defaults.defaultPriorityWithHumanPr ?? 4,
      defaultPriorityQuiet: defaults.defaultPriorityQuiet ?? 8,
      unspecifiedObjective: defaults.unspecifiedObjective || 'Unspecified — needs an objective'
    },
    projects: asArray(raw.projects),
    byId: new Map(asArray(raw.projects).map((project) => [project.id, project]))
  };
}

export function repoSlug(fullName) {
  const name = String(fullName || '').split('/')[1] || String(fullName || '');
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function displayNameFromSlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function headBranch(pr) {
  return pr?.headRefName || pr?.head || '';
}

function prAuthor(pr) {
  const author = pr?.author;
  if (typeof author === 'string') return author;
  return author?.login || pr?.user?.login || '';
}

export function isBotPullRequest(pr, catalog) {
  const login = prAuthor(pr).toLowerCase();
  if (catalog.defaults.botLogins.has(login)) return true;
  const title = pr?.title || '';
  return catalog.defaults.botTitlePatterns.some((pattern) => pattern.test(title));
}

export function isIdleDraft(pr, catalog, now = new Date()) {
  if (!(pr?.isDraft || pr?.draft)) return false;
  const updated = new Date(pr.updatedAt || pr.updated_at || 0);
  if (Number.isNaN(updated.valueOf())) return false;
  const ageDays = (now.valueOf() - updated.valueOf()) / 86400000;
  return ageDays > catalog.defaults.idleDraftDays;
}

export function isCardioHospitalPullRequest(pr, catalog) {
  const override = catalog.byId.get(CARDIO_HOSPITAL_ID);
  const route = override?.route || {};
  const number = Number(pr?.number);
  if (asArray(route.pullRequestNumbers).includes(number)) return true;

  const branch = headBranch(pr);
  if (asArray(route.headBranchPatterns).some((source) => compilePattern(source).test(branch))) {
    return true;
  }

  const title = pr?.title || '';
  return asArray(route.titlePatterns).some((source) => compilePattern(source).test(title));
}

export function isParkedPullRequest(pr, catalog) {
  const override = catalog.byId.get(CARDIO_HOSPITAL_ID);
  return asArray(override?.route?.parkedPullRequestNumbers).includes(Number(pr?.number));
}

export function routePullRequest(repositoryFullName, pr, catalog) {
  if (repositoryFullName === SITE_REPO && isCardioHospitalPullRequest(pr, catalog)) {
    return CARDIO_HOSPITAL_ID;
  }
  if (repositoryFullName === SITE_REPO) return SITE_ID;
  return repoSlug(repositoryFullName);
}

export function classifyPullRequest(pr, catalog, now = new Date()) {
  if (isBotPullRequest(pr, catalog)) {
    return { ownerClass: 'external', state: 'ignored_bot', ingestWorkItem: false };
  }
  if (isParkedPullRequest(pr, catalog) || isIdleDraft(pr, catalog, now)) {
    return { ownerClass: 'external', state: 'parked', ingestWorkItem: true };
  }
  return { ownerClass: 'execution', state: 'open', ingestWorkItem: true };
}

export function workItemExternalId(repositoryFullName, pr, catalog) {
  const number = pr?.number;
  const projectId = routePullRequest(repositoryFullName, pr, catalog);
  const project = catalog.byId.get(projectId);
  if (project?.legacyUnnamespacedPrs && repositoryFullName === SITE_REPO) {
    return `pr:${number}`;
  }
  return `pr:${repositoryFullName}#${number}`;
}

export function shouldIngestRepo(repo, catalog) {
  if (!repo) return false;
  if (catalog.defaults.skipArchived && repo.isArchived) return false;
  return true;
}

export function projectFromRepo(repo, catalog, { hasHumanPr = false } = {}) {
  const fullName = repo.fullName || `${catalog.defaults.owner}/${repo.name}`;
  const override = catalog.projects.find((project) => (
    project.repositoryFullName === fullName && project.id !== CARDIO_HOSPITAL_ID
  ));
  if (fullName === SITE_REPO) {
    const site = catalog.byId.get(SITE_ID);
    return projectRecord(site, {
      repositoryFullName: SITE_REPO,
      hasHumanPr
    }, catalog);
  }
  if (override) {
    return projectRecord(override, { repositoryFullName: fullName, hasHumanPr }, catalog);
  }
  const id = repoSlug(fullName);
  return projectRecord({
    id,
    name: repo.name || displayNameFromSlug(id),
    objective: repo.description,
    repositoryFullName: fullName,
    productionUrl: repo.url || null
  }, { repositoryFullName: fullName, hasHumanPr }, catalog);
}

export function catalogProjectsForRepo(repo, catalog, { hasHumanPr = false, hasCardioPr = false } = {}) {
  const fullName = repo.fullName || `${catalog.defaults.owner}/${repo.name}`;
  if (fullName !== SITE_REPO) return [projectFromRepo(repo, catalog, { hasHumanPr })];

  const site = projectFromRepo(repo, catalog, { hasHumanPr });
  const cardio = projectRecord(catalog.byId.get(CARDIO_HOSPITAL_ID), {
    repositoryFullName: SITE_REPO,
    hasHumanPr: hasCardioPr
  }, catalog);
  return [cardio, site];
}

function projectRecord(base, { repositoryFullName, hasHumanPr }, catalog) {
  const unspecified = catalog.defaults.unspecifiedObjective;
  const objective = (base.objective && String(base.objective).trim()) || unspecified;
  const priority = Number.isInteger(base.priority)
    ? base.priority
    : (hasHumanPr ? catalog.defaults.defaultPriorityWithHumanPr : catalog.defaults.defaultPriorityQuiet);

  return {
    id: base.id,
    name: base.name,
    objective,
    status: base.status || 'active',
    priority,
    riskLevel: base.riskLevel || 'medium',
    repositoryFullName: base.repositoryFullName || repositoryFullName,
    productionUrl: base.productionUrl || null,
    metadata: {
      ...(base.metadata || {}),
      source: 'github_org_ingest',
      hasHumanPr: Boolean(hasHumanPr)
    }
  };
}

export function toIngestPr(pr) {
  return {
    number: pr.number,
    url: pr.url || pr.html_url,
    title: pr.title,
    state: pr.state || 'open',
    draft: Boolean(pr.isDraft ?? pr.draft),
    mergeable: pr.mergeable ?? pr.mergeableState ?? null,
    base: pr.baseRefName || pr.base,
    head: pr.headRefName || pr.head,
    head_sha: pr.headRefOid || pr.head_sha,
    commits: Array.isArray(pr.commits) ? pr.commits.length : pr.commits,
    changed_files: Array.isArray(pr.files) ? pr.files.length : pr.changed_files,
    updated_at: pr.updatedAt || pr.updated_at,
    author: prAuthor(pr)
  };
}
