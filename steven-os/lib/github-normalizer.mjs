function required(value, name) {
  if (value === undefined || value === null || value === '') throw new Error(`Missing ${name}`);
  return value;
}

export function normalizePullRequest({ repositoryFullName, pr, workflowRuns = [], observedAt = new Date().toISOString() }) {
  required(repositoryFullName, 'repositoryFullName');
  required(pr?.number, 'pr.number');
  required(pr?.head_sha, 'pr.head_sha');

  const successfulRuns = workflowRuns.filter((run) => run.status === 'completed' && run.conclusion === 'success');
  const failedRuns = workflowRuns.filter((run) => run.status === 'completed' && run.conclusion && run.conclusion !== 'success');
  const pendingRuns = workflowRuns.filter((run) => run.status !== 'completed');

  const source = {
    sourceSystem: 'github',
    externalId: `pr:${pr.number}`,
    sourceUrl: pr.url,
    sourceSha: pr.head_sha,
    observedAt,
    metadata: {
      repositoryFullName,
      title: pr.title,
      state: pr.state,
      draft: Boolean(pr.draft),
      mergeable: pr.mergeable,
      commits: pr.commits,
      changedFiles: pr.changed_files,
      updatedAt: pr.updated_at
    }
  };

  const workItem = {
    externalSystem: 'github',
    externalId: `pr:${pr.number}`,
    kind: 'pull_request',
    title: pr.title,
    state: failedRuns.length ? 'blocked' : pendingRuns.length ? 'running' : 'open',
    ownerClass: 'execution',
    metadata: {
      repositoryFullName,
      headBranch: pr.head,
      headSha: pr.head_sha,
      baseBranch: pr.base,
      draft: Boolean(pr.draft),
      mergeable: pr.mergeable
    }
  };

  const ciEvidence = [
    ...successfulRuns.map((run) => ({
      claim: `GitHub Actions ${run.name} run #${run.run_number} completed successfully at ${pr.head_sha}.`,
      status: 'pass',
      evidenceType: 'github_actions',
      metadata: { runId: run.id, runNumber: run.run_number, workflowId: run.workflow_id }
    })),
    ...failedRuns.map((run) => ({
      claim: `GitHub Actions ${run.name} run #${run.run_number} failed at ${pr.head_sha}.`,
      status: 'fail',
      evidenceType: 'github_actions',
      metadata: { runId: run.id, runNumber: run.run_number, workflowId: run.workflow_id, conclusion: run.conclusion }
    })),
    ...pendingRuns.map((run) => ({
      claim: `GitHub Actions ${run.name} run #${run.run_number} is ${run.status} at ${pr.head_sha}.`,
      status: 'unknown',
      evidenceType: 'github_actions',
      metadata: { runId: run.id, runNumber: run.run_number, workflowId: run.workflow_id, status: run.status }
    }))
  ];

  return {
    source,
    workItem,
    ciEvidence,
    event: {
      eventType: 'github_pr_observed',
      externalEventId: `pr:${pr.number}@${pr.head_sha}`,
      occurredAt: pr.updated_at || observedAt,
      observedAt,
      payload: {
        state: pr.state,
        draft: Boolean(pr.draft),
        mergeable: pr.mergeable,
        headSha: pr.head_sha,
        ci: {
          success: successfulRuns.length,
          failed: failedRuns.length,
          pending: pendingRuns.length
        }
      }
    }
  };
}

export function preserveEvidenceBoundary(normalized, boundaryClaims = []) {
  return {
    ...normalized,
    boundaryEvidence: boundaryClaims.map((claim) => ({
      claim,
      status: 'blocked',
      evidenceType: 'evidence_boundary',
      metadata: { critical: true }
    }))
  };
}
