import { buildDecisionQueue, buildExecutionQueue } from './lib/policy-engine.mjs';

const $ = (selector) => document.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>'\"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));

function stateBadge(state) {
  const safe = esc(state || 'unknown');
  return `<span class="badge badge-${safe.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()}">${safe.replaceAll('_', ' ')}</span>`;
}

function renderProjects(projects) {
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

function renderQueue(selector, items, emptyText) {
  const node = $(selector);
  node.innerHTML = items.length ? items.map((item) => `
    <article class="queue-item">
      <div class="queue-title">${esc(item.projectName)}</div>
      <div class="queue-reason">${esc(item.reason)}</div>
      ${item.command ? `<code class="command">${esc(item.command)}</code>` : ''}
    </article>
  `).join('') : `<div class="empty">${esc(emptyText)}</div>`;
}

async function start() {
  const response = await fetch('./state/projects.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Project state load failed: ${response.status}`);
  const data = await response.json();
  const projects = data.projects || [];
  const decisions = buildDecisionQueue(projects);
  const execution = buildExecutionQueue(projects);

  $('#mode').textContent = data.mode || 'unknown';
  $('#generated').textContent = new Date(data.generatedAt).toLocaleString();
  $('#decision-count').textContent = decisions.length;
  $('#execution-count').textContent = execution.length;
  $('#project-count').textContent = projects.length;
  renderQueue('#needs-you', decisions, 'No human decisions required.');
  renderQueue('#execution', execution, 'No execution work queued.');
  renderProjects(projects);
}

start().catch((error) => {
  $('#app-error').hidden = false;
  $('#app-error').textContent = error.message;
});
