import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_CONFIG_PATH = path.join(HERE, '../config.local.js');

export const BRIEF_URL = process.env.STEVEN_OS_BRIEF_URL
  || 'https://iuklaekcwynchqfmjgbp.supabase.co/functions/v1/steven-os-brief';
export const INGEST_URL = process.env.STEVEN_OS_INGEST_URL
  || 'https://iuklaekcwynchqfmjgbp.supabase.co/functions/v1/steven-os-ingest';
export const RESOLVE_URL = process.env.STEVEN_OS_RESOLVE_URL
  || 'https://iuklaekcwynchqfmjgbp.supabase.co/functions/v1/steven-os-resolve';

export function readSecret() {
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

function authHeaders(secret) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret}`,
    apikey: secret
  };
}

export async function fetchBrief(secret = readSecret()) {
  const res = await fetch(BRIEF_URL, { headers: authHeaders(secret), cache: 'no-store' });
  const text = await res.text();
  if (!res.ok) throw new Error(`brief ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

export async function postIngest(payload, secret = readSecret()) {
  const res = await fetch(INGEST_URL, {
    method: 'POST',
    headers: authHeaders(secret),
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ingest ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

export async function postResolve(body, secret = readSecret()) {
  const res = await fetch(RESOLVE_URL, {
    method: 'POST',
    headers: authHeaders(secret),
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`resolve ${res.status}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

export function formatBriefText(data) {
  const projects = data.projects || [];
  const decisions = data.decisions || [];
  const execution = data.execution || [];
  const lines = [
    `Steven OS brief — ${data.generatedAt || new Date().toISOString()}`,
    `Mode: ${data.mode || 'unknown'}`,
    `Needs you: ${decisions.length}`,
    `Execution: ${execution.length}`,
    `Projects: ${projects.length}`,
    ''
  ];

  lines.push('NEEDS YOU');
  if (!decisions.length) {
    lines.push('  (none)');
  } else {
    for (const item of decisions) {
      lines.push(`  ${item.id}`);
      lines.push(`    ${item.project_name} · ${item.title}`);
      if (item.question) lines.push(`    ${item.question}`);
      if (item.consequence) lines.push(`    Consequence: ${item.consequence}`);
    }
  }

  lines.push('', 'EXECUTION');
  if (!execution.length) {
    lines.push('  (none)');
  } else {
    for (const item of execution) {
      const next = item.metadata?.nextAction || item.metadata?.next_action;
      lines.push(`  ${item.project_name} · ${item.kind} · ${item.title}`);
      lines.push(`    state=${item.state}${next ? ` · next: ${next}` : ''}`);
    }
  }

  lines.push('', 'PROJECTS');
  for (const project of projects) {
    const open = Number(project.open_work_items || 0);
    const dec = Number(project.open_decisions || 0);
    if (open === 0 && dec === 0) continue;
    lines.push(`  [${project.priority}] ${project.name} — ${open} open work · ${dec} decisions`);
  }

  const quiet = projects.filter((project) => Number(project.open_work_items || 0) === 0 && Number(project.open_decisions || 0) === 0);
  if (quiet.length) lines.push(`  Quiet: ${quiet.length} projects with no open human work`);

  return `${lines.join('\n')}\n`;
}
