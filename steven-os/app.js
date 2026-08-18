import { buildDecisionQueue, buildExecutionQueue } from './lib/policy-engine.mjs';

const config = window.STEVEN_OS_CONFIG || {};
const BRIEF_URL = config.briefUrl || '';
const API_SECRET = config.apiSecret || '';

const $ = (selector) => document.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>'\"]/g, (char) => ({
  '&': '&', '<': '<', '>': '>', "'": '&#39;', '"': '"'
}[char]));

function stateBadge(state) {
  const safe = esc(state || 'unknown');
  return `<span class="badge badge-${safe.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()}">${safe.replaceAll('_', ' ')}</span>`;
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

function renderQueue(selector, items, emptyText, live) {
  const node = $(selector);
  if (!items.length) {
    node.innerHTML = `<div class="empty">${esc(emptyText)}</div>`;
    return;
  }

  if (live && selector === '#needs-you') {
    node.innerHTML = items.map((item) => `
      <article class="queue-item">
        <div class="queue-title">${esc(item.project_name || item.projectName)}</div>
        <div class="queue-reason"><strong>${esc(item.title || item.reason)}</strong></div>
        ${item.question ? `<div class="queue-reason">${esc(item.question)}</div>` : ''}
        ${item.consequence ? `<div class="queue-reason">Consequence: ${esc(item.consequence)}</div>` : ''}
      </article>`).join('');
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

  renderQueue('#needs-you', payload.decisions, 'No human decisions required.', payload.live);
  renderQueue('#execution', payload.execution, 'No execution work queued.', payload.live);
  renderProjects(payload.projects, payload.live ? 'live' : 'shadow');
}

start().catch((error) => {
  $('#app-error').hidden = false;
  $('#app-error').textContent = error.message;
});
