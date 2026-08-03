// Shared harness: static file server + Chromium, for the behavioural test suites.
//
// These tests exist because structural checks cannot catch behavioural bugs.
// phs/v17/tests/integrity.mjs passed clean while blood pressure rendered as NaN,
// the mastery standard was unreachable, and untreated apnea had no consequence.
// Every assertion here is anchored to a defect that actually shipped.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/** Serve repoRoot on an ephemeral port. Returns { origin, close }. */
export async function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(repoRoot, urlPath);
    if (!filePath.startsWith(repoRoot)) { res.writeHead(403).end(); return; }
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
      if (!fs.existsSync(filePath)) { res.writeHead(404).end('not found'); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(500).end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise(resolve => server.close(resolve)),
  };
}

/**
 * Import Playwright from wherever it lives: a local node_modules (CI, after
 * `npm ci`) or the globally installed copy (dev containers). Keeping this in one
 * place means the suites never hardcode an absolute path.
 */
export async function getChromium() {
  const candidates = ['playwright', 'playwright-core', '/opt/node22/lib/node_modules/playwright/index.mjs'];
  const errors = [];
  for (const spec of candidates) {
    try {
      const mod = await import(spec);
      if (mod.chromium) return mod.chromium;
    } catch (error) {
      errors.push(`${spec}: ${error.message}`);
    }
  }
  throw new Error(`Playwright not found. Tried:\n  ${errors.join('\n  ')}`);
}

/** Every page that should be reachable and healthy. */
export const SITE_PAGES = [
  '/',
  '/tools/',
  '/tools/bp-percentile-calculator.html',
  '/tools/bp-calculator-validation.html',
  '/cooking/',
  '/cooking/ahi-tuna-timer.html',
  '/cooking/ribeye-timer.html',
  '/cooking/ribs-timer.html',
  '/study/',
  '/study/greek-vocab-quiz.html',
  '/study/fract-vocab-quiz.html',
  '/study/topic-e-quiz.html',
  '/study/math-facts.html',
  '/study/100-fact-club.html',
  '/math/',
  '/phs/',
  '/admin/',
  '/admin/clinic-resources/',
];

/** Collects console errors, page errors and failed requests for a page. */
export function watchForErrors(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('requestfailed', r => errors.push(`requestfailed: ${r.url()} (${r.failure()?.errorText})`));
  return errors;
}
