import { buildDecisionQueue, buildExecutionQueue } from './lib/policy-engine.mjs';
import {
  blockedReason,
  decisionSeverity,
  splitExecution,
  workLabel,
  workMeta
} from './lib/home-bands.mjs';

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

  if (title.includes('clinical')) {
    links.push(`<a class="review-link" href="./clinical-review.html">Read the 9 cases</a>`);
    links.push(`<a class="review-link" href="https://github.com/stevetodman/stevetodman.com/pull/24" target="_blank" rel="noreferrer">Open PR #24</a>`);
    return `<div class="review-links">${links.join('')}</div>`;
  }

  if (title.includes('branding')) {
    links.push(`<a class="review-link" href="./clinical-review.html">Context</a>`);
  }

  const repo = project?.repository_full_name;
  const number = work?.title?.match(/#(\d+)/)?.[1];
  if (repo && number) {
    links.push(`<a class="review-link" href="https://github.com/${esc(repo)}/pull/${esc(number)}" target="_blank" rel="noreferrer">Open PR #${esc(number)}</a>`);
  } else if (repo) {
    links.push(`<a class="review-link" href="https://github.com/${esc(repo)}" target="_blank" rel="noreferrer">Open repository</a>`);
  }

  if (!links.length) return '';
  return `<div class="review-links">${links.join('')}</div>`;
}

function recommendationHtml(item) {
  const rec = item.recommendation;
  if (!rec) return '';
  if (typeof rec === 'string') return `<div class="row-sub">Recommendation: ${esc(rec)}</div>`;
  const action = rec.recommended_action || rec.action || rec.text;
  if (!action) return '';
  return `<div class="row-sub">Recommendation: ${esc(action)}</div>`;
}

function projectCard(project) {
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
        <div><dt>Open work</dt><dd>${esc(project.open_work_items ?? 0)}</dd></div>
        <div><dt>Open decisions</dt><dd>${esc(project.open_decisions ?? 0)}</dd></div>
        <div><dt>Evidence</dt><dd>${esc(project.passing_evidence ?? 0)} pass · ${esc(project.failing_evidence ?? 0)} fail · ${esc(project.blocked_evidence ?? 0)} blocked</dd></div>
        <div><dt>Updated</dt><dd>${project.updated_at ? esc(new Date(project.updated_at).toLocaleString()) : '—'}</dd></div>
      </dl>
    </article>`;
}

function isQuietProject(project) {
  return Number(project.open_work_items || 0) === 0 && Number(project.open_decisions || 0) === 0;
}

function renderProjects(projects, mode) {
  if (mode !== 'live') {
    $('#projects').innerHTML = projects.map(projectCard).join('');
    return;
  }
  const active = projects.filter((project) => !isQuietProject(project));
  const quiet = projects.filter(isQuietProject);
  const quietBlock = quiet.length
    ? `<details class="quiet-projects"><summary>Quiet (${quiet.length})</summary>${quiet.map(projectCard).join('')}</details>`
    : '';
  $('#projects').innerHTML = `${active.map(projectCard).join('')}${quietBlock}`;
}

async function resolveDecision(id, action) {
  if (!API_SECRET || !RESOLVE_URL) {
    alert('Resolve API not configured');
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

function empty(text) {
  return `<div class="empty">${esc(text)}</div>`;
}

function renderNeedsYou(items, context) {
  const node = $('#needs-you');
  if (!items.length) {
    node.innerHTML = empty('Nothing needs your judgment.');
    return;
  }
  node.innerHTML = items.map((item) => `
    <article class="row" data-id="${esc(item.id)}">
      <span class="dot dot-${decisionSeverity(item)}" aria-hidden="true"></span>
      <div class="row-main">
        <div class="row-title">${esc(item.title || item.reason)}</div>
        ${item.question ? `<div class="row-sub">${esc(item.question)}</div>` : ''}
        ${recommendationHtml(item)}
        ${projectLinks(item, context.projects, context.execution)}
        <div class="row-actions">
          <button type="button" class="btn-approve" data-action="approve">Approve</button>
          <button type="button" class="btn-reject" data-action="reject">Reject</button>
        </div>
      </div>
      <div class="row-meta">${esc(item.project_name || item.projectName || '')}</div>
    </article>`).join('');

  node.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.closest('.row')?.dataset.id;
      if (id) resolveDecision(id, btn.dataset.action);
    });
  });
}

function renderWorking(items) {
  const node = $('#working');
  if (!items.length) {
    node.innerHTML = empty('No agents working.');
    return;
  }
  node.innerHTML = items.map((item) => `
    <article class="row">
      <span class="dot dot-work" aria-hidden="true"></span>
      <div class="row-main">
        <div class="row-title">${esc(workLabel(item))}</div>
        ${item.metadata?.nextAction ? `<div class="row-sub">${esc(item.metadata.nextAction)}</div>` : ''}
      </div>
      <div class="row-meta">${esc(workMeta(item))}</div>
    </article>`).join('');
}

function renderBlocked(items) {
  const node = $('#blocked');
  if (!items.length) {
    node.innerHTML = empty('Nothing blocked.');
    return;
  }
  node.innerHTML = items.map((item) => `
    <article class="row">
      <span class="dot dot-blocked" aria-hidden="true"></span>
      <div class="row-main">
        <div class="row-title">${esc(workLabel(item))}</div>
        <div class="row-sub">${esc(blockedReason(item))}</div>
      </div>
      <div class="row-meta">${esc(item.project_name || '')}</div>
    </article>`).join('');
}

function renderShipped(items) {
  const node = $('#shipped');
  if (!items.length) {
    node.innerHTML = empty('Nothing completed in the last 24 hours.');
    return;
  }
  node.innerHTML = items.map((item) => `
    <article class="row">
      <span class="dot dot-done" aria-hidden="true"></span>
      <div class="row-main">
        <div class="row-title">${esc(item.title)}</div>
      </div>
      <div class="row-meta">${esc(item.project_name || item.kind || '')}</div>
    </article>`).join('');
}

async function loadLive() {
  if (!BRIEF_URL) throw new Error('No briefUrl configured');
  if (!API_SECRET || API_SECRET.includes('REPLACE_WITH')) {
    throw new Error('apiSecret not set in config.local.js');
  }

  const res = await fetch(BRIEF_URL, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${API_SECRET}`,
      apikey: API_SECRET,
    },
    cache: 'no-store'
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Live brief failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const { working, blocked } = splitExecution(data.execution || []);
  return {
    mode: data.mode || 'live',
    generatedAt: data.generatedAt || new Date().toISOString(),
    projects: data.projects || [],
    decisions: data.decisions || [],
    execution: data.execution || [],
    working,
    blocked,
    shipped: data.shipped || [],
    live: true
  };
}

async function loadShadow() {
  const response = await fetch('./state/projects.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Project state load failed: ${response.status}`);
  const data = await response.json();
  const projects = data.projects || [];
  const execution = buildExecutionQueue(projects);
  const { working, blocked } = splitExecution(execution);
  return {
    mode: data.mode || 'shadow',
    generatedAt: data.generatedAt,
    projects,
    decisions: buildDecisionQueue(projects),
    execution,
    working,
    blocked,
    shipped: [],
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
  $('#needs-count').textContent = payload.decisions.length;
  $('#working-count').textContent = payload.working.length;
  $('#blocked-count').textContent = payload.blocked.length;
  $('#shipped-count').textContent = payload.shipped.length;
  $('#project-count').textContent = `(${payload.projects.length})`;

  const ctx = { projects: payload.projects, execution: payload.execution };
  renderNeedsYou(payload.decisions, ctx);
  renderWorking(payload.working);
  renderBlocked(payload.blocked);
  renderShipped(payload.shipped);
  renderProjects(payload.projects, payload.live ? 'live' : 'shadow');
}

start().catch((error) => {
  $('#app-error').hidden = false;
  $('#app-error').textContent = error.message;
});
