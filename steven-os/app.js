import { buildDecisionQueue, buildExecutionQueue } from './lib/policy-engine.mjs';

const config = window.STEVEN_OS_CONFIG || {};
const BRIEF_URL = config.briefUrl || '';
const RESOLVE_URL = (config.briefUrl || '').replace(/steven-os-brief\/?$/, 'steven-os-resolve');
const API_SECRET = config.apiSecret || '';

const $ = (selector) => document.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>'\"]/g, (char) => ({
  '&': '&',
  '<': '<',
  '>': '>',
  "'": '&#39;',
  '"': '"'
}[char]));

function stateBadge(state) {
  const safe = esc(state || 'unknown');
  return `<span class="badge badge-${safe.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()}">${safe.replaceAll('_', ' ')}</span>`;
}

function projectLinks(item, projects, execution) {
  const project = (projects || []).find((p) => p.id === item.project_id);
  const work = (execution || []).find((w) => w.project_id === item.project_id);
  const links = [];
  const title = (item.title || '').toLowerCase();

  // Clinical review: readable summary page first (not the old blocky site)
  if (title.includes('clinical')) {
    links.push(`<a class="review-link" href="./clinical-review.html">Read the 9 cases (review page)</a>`);
    links.push(`<a class="review-link" href="https://github.com/stevetodman/stevetodman.com/pull/24" target="_blank" rel="noreferrer">Open PR #24</a>`);
    links.push(`<a class="review-link" href="https://github.com/stevetodman/stevetodman.com/pull/19" target="_blank" rel="noreferrer">Open PR #19</a>`);
    return `<div class="review-links">${links.join('')}</div>`;
  }

  if (title.includes('branding')) {
    links.push(`<a class="review-link" href="./clinical-review.html">Context on review page</a>`);
    links.push(`<a class="review-link" href="https://stevetodman.com/cardiohospital/" target="_blank" rel="noreferrer">Old web build (branding check only)</a>`);
  }

  if (project?.production_url && !title.includes('clinical')) {
    links.push(`<a class="review-link" href="${esc(project.production_url)}" target="_blank" rel="noreferrer">Open live product</a>`);
  }

  const repo = project?.repository_full_name;
  if (repo && work?.kind === 'pull_request') {
    links.push(`<a class="review-link" href="https://github.com/${esc(repo)}/pull/19" target="_blank" rel="noreferrer">Open PR #19</a>`);
  } else if (repo) {
    links.push(`<a class="review-link" href="https://github.com/${esc(repo)}" target="_blank" rel="noreferrer">Open repository</a>`);
  }

  if (!links.length) return '';
  return `<div class="review-links">${links.join('')}</div>`;
}

function recommendationHtml(item) {
  const rec = item.recommendation;
  if (!rec) return '';
  if (typeof rec === 'string') {
    return `<div class="queue-reason"><em>Recommendation:</em> ${esc(rec)}</div>`;
  }
  const action = rec.recommended_action || rec.action || rec.text;
  if (!action) return '';
  return `<div class="queue-reason"><em>Recommendation:</em> ${esc(action)}</div>`;
}

function alternativesHtml(item) {
  const alts = item.alternatives;
  if (!Array.isArray(alts) || !alts.length) return '';
  const labels = alts.map((a) => (typeof a === 'string' ? a : a.label || a.id || JSON.stringify(a)));
  return `<div class="queue-reason"><em>Options:</em> ${esc(labels.join(' · '))}</div>`;
}

function renderProjects(projects, mode) {
  if (mode === 'live') {
    $('#projects').innerHTML = projects.map((project) => `
      <article class="project-card">
        <div class="project-head">
          <div>
            <div class="eyebrow">Priority ${esc(project.priority)}</div>
            <h2>${esc(project.name)}</h2>
          </div>
          ${stateBadge(project.status)}
        </div>
        <p class="objective">${esc(project.objective)}</p>
        <dl class="facts">
          <div><dt>Open work</dt><dd>${esc(project.open_work_items ?? 0)}</dd></div>
          <div><dt>Open decisions</dt><dd>${esc(project.open_decisions ?? 0)}</dd></div>
          <div><dt>Evidence</dt><dd>${esc(project.passing_evidence ?? 0)} pass · ${esc(project.failing_evidence ?? 0)} fail · ${esc(project.blocked_evidence ?? 0)} blocked</dd></div>
          <div><dt>Updated</dt><dd>${project.updated_at ? esc(new Date(project.updated_at).toLocaleString()) : '—'}</dd></div>
        </dl>
        ${project.production_url ? `<p class="objective"><a href="${esc(project.production_url)}" target="_blank" rel="noreferrer">${esc(project.production_url)}</a></p>` : ''}
      </article>`).join('');
    return;
  }

  $('#projects').innerHTML = projects.map((project) => {
    const work = project.currentWork || {};
    const blocked = (project.gates || []).filter((g) => g.state === 'blocked').length;
    return `
      <article class="project-card">
        <div class="project-head">
          <div>
            <div class="eyebrow">Priority ${esc(project.priority)}</div>
            <h2>${esc(project.name)}</h2>
          </div>
          ${stateBadge(project.status)}
        </div>
        <p class="objective">${esc(project.objective)}</p>
        <dl class="facts">
          <div><dt>Current work</dt><dd><a href="${esc(work.url)}" target="_blank" rel="noreferrer">PR #${esc(work.number)} · ${esc(work.title)}</a></dd></div>
          <div><dt>Head</dt><dd><code>${esc((work.headSha || '').slice(0, 10))}</code></dd></div>
          <div><dt>Portable CI</dt><dd>GitHub Actions passing at current head</dd></div>
          <div><dt>Unverified gates</dt><dd>${blocked} deterministic blocker${blocked === 1 ? '' : 's'}</dd></div>
        </dl>
        <div class="evidence">
          ${(project.evidence || []).map((item) => `<div class="evidence-row">${stateBadge(item.status)}<span>${esc(item.claim)}</span></div>`).join('')}
        </div>
      </article>`;
  }).join('');
}

async function resolveDecision(id, action) {
  if (!API_SECRET || !RESOLVE_URL) {
    alert('Resolve API not configured');
    return;
  }
  if (!confirm(action === 'approve' ? 'Approve this decision?' : 'Reject / supersede this decision?')) {
    return;
  }

  const res = await fetch(RESOLVE_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_SECRET}`,
      apikey: API_SECRET,
    },
    body: JSON.stringify({ id, action }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    alert(`Resolve failed: ${res.status} ${text.slice(0, 200)}`);
    return;
  }

  await start();
}

function renderQueue(selector, items, emptyText, live, context = {}) {
  const node = $(selector);
  if (!items.length) {
    node.innerHTML = `<div class="empty">${esc(emptyText)}</div>`;
    return;
  }

  if (live && selector === '#needs-you') {
    node.innerHTML = items.map((item) => `
      <article class="queue-item" data-id="${esc(item.id)}">
        <div class="queue-title">${esc(item.project_name || item.projectName)}</div>
        <div class="queue-reason"><strong>${esc(item.title || item.reason)}</strong></div>
        ${item.question ? `<div class="queue-reason">${esc(item.question)}</div>` : ''}
        ${recommendationHtml(item)}
        ${alternativesHtml(item)}
        ${item.consequence ? `<div class="queue-reason">Consequence: ${esc(item.consequence)}</div>` : ''}
        ${projectLinks(item, context.projects, context.execution)}
        <div class="decision-actions">
          <button type="button" class="btn-approve" data-action="approve">Approve</button>
          <button type="button" class="btn-reject" data-action="reject">Reject</button>
        </div>
      </article>`).join('');

    node.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.queue-item')?.dataset.id;
        if (id) resolveDecision(id, btn.dataset.action);
      });
    });
    return;
  }

  if (live && selector === '#execution') {
    node.innerHTML = items.map((item) => `
      <article class="queue-item">
        <div class="queue-title">${esc(item.project_name || item.projectName)}</div>
        <div class="queue-reason">${esc(item.kind || '')} · ${esc(item.title || item.reason)}</div>
        <div class="queue-reason">State: ${esc(item.state || '')}</div>
      </article>`).join('');
    return;
  }

  node.innerHTML = items.map((item) => `
    <article class="queue-item">
      <div class="queue-title">${esc(item.projectName)}</div>
      <div class="queue-reason">${esc(item.reason)}</div>
      ${item.command ? `<code class="command">${esc(item.command)}</code>` : ''}
    </article>
  `).join('');
}

async function loadLive() {
  if (!BRIEF_URL) throw new Error('No briefUrl configured');
  if (!API_SECRET || API_SECRET.includes('REPLACE_WITH')) {
    throw new Error('apiSecret not set in config.local.js');
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${API_SECRET}`,
    apikey: API_SECRET,
  };

  const res = await fetch(BRIEF_URL, { headers, cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Live brief failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = await res.json();

  return {
    mode: data.mode || 'live',
    generatedAt: data.generatedAt || new Date().toISOString(),
    projects: data.projects || [],
    decisions: data.decisions || [],
    execution: data.execution || [],
    live: true
  };
}

async function loadShadow() {
  const response = await fetch('./state/projects.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Project state load failed: ${response.status}`);
  const data = await response.json();
  const projects = data.projects || [];
  return {
    mode: data.mode || 'shadow',
    generatedAt: data.generatedAt,
    projects,
    decisions: buildDecisionQueue(projects),
    execution: buildExecutionQueue(projects),
    live: false
  };
}

async function start() {
  let payload;
  try {
    payload = await loadLive();
  } catch (err) {
    console.warn('Live brief unavailable, using shadow:', err.message);
    payload = await loadShadow();
  }

  $('#mode').textContent = payload.mode;
  $('#generated').textContent = new Date(payload.generatedAt).toLocaleString();
  $('#decision-count').textContent = payload.decisions.length;
  $('#execution-count').textContent = payload.execution.length;
  $('#project-count').textContent = payload.projects.length;

  const ctx = { projects: payload.projects, execution: payload.execution };
  renderQueue('#needs-you', payload.decisions, 'No human decisions required.', payload.live, ctx);
  renderQueue('#execution', payload.execution, 'No execution work queued.', payload.live, ctx);
  renderProjects(payload.projects, payload.live ? 'live' : 'shadow');
}

start().catch((error) => {
  $('#app-error').hidden = false;
  $('#app-error').textContent = error.message;
});
