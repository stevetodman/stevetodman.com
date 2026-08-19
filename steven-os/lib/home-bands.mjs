/** Split live control-plane facts into the four home-screen bands. */

export function isBlockedWork(item) {
  if (!item) return false;
  const state = String(item.state || '').toLowerCase();
  if (state === 'blocked') return true;
  return Number(item.failing_evidence || 0) > 0 || Number(item.blocked_evidence || 0) > 0;
}

export function splitExecution(execution = []) {
  const working = [];
  const blocked = [];
  for (const item of execution) {
    if (isBlockedWork(item)) blocked.push(item);
    else working.push(item);
  }
  return { working, blocked };
}

export function decisionSeverity(item) {
  const text = `${item?.title || ''} ${item?.question || ''} ${item?.type || ''}`.toLowerCase();
  if (/(clinical|medical|branding|deploy|production|irreversible|delete|money|publish)/.test(text)) {
    return 'critical';
  }
  return 'attention';
}

export function workLabel(item) {
  return item?.title || item?.reason || 'Untitled work';
}

export function workMeta(item) {
  if (item?.kind === 'pull_request') return item.project_name || 'pull request';
  if (item?.kind === 'package') return 'package';
  return item?.kind || item?.project_name || '';
}

export function blockedReason(item) {
  const next = item?.metadata?.nextAction || item?.metadata?.next_action;
  if (next) return next;
  if (Number(item?.failing_evidence || 0)) return 'failing evidence';
  if (Number(item?.blocked_evidence || 0)) return 'blocked evidence';
  return item?.state || 'blocked';
}
