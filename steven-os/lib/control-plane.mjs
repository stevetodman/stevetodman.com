import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { blockedReason, splitExecution, workLabel, workMeta } from './home-bands.mjs';

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
  const shipped = data.shipped || [];
  const { working, blocked } = splitExecution(execution);
  const lines = [
    'STEVEN BRIEF',
    data.generatedAt || new Date().toISOString(),
    '',
    `NEEDS YOU                         ${decisions.length}`
  ];

  if (!decisions.length) lines.push('(none)');
  for (const item of decisions) {
    lines.push(`${item.title}    ${item.project_name || ''}`);
  }

  lines.push('', `AGENTS WORKING                   ${working.length}`);
  if (!working.length) lines.push('(none)');
  for (const item of working) {
    lines.push(`${workLabel(item)}    ${workMeta(item)}`);
  }

  lines.push('', `BLOCKED                           ${blocked.length}`);
  if (!blocked.length) lines.push('(none)');
  for (const item of blocked) {
    lines.push(`${workLabel(item)}    ${blockedReason(item)}`);
  }

  lines.push('', `COMPLETED SINCE YESTERDAY         ${shipped.length}`);
  if (!shipped.length) lines.push('(none)');
  for (const item of shipped) {
    lines.push(`✓ ${item.title}    ${item.project_name || item.kind || ''}`);
  }

  const quiet = projects.filter((project) => Number(project.open_work_items || 0) === 0 && Number(project.open_decisions || 0) === 0);
  if (quiet.length) {
    lines.push('', `Quiet projects: ${quiet.length}`);
  }

  return `${lines.join('\n')}\n`;
}
