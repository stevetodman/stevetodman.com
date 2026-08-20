import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { repoRoot } from './helpers/harness.mjs';

const PUBLIC_HTML_PATHS = new Set(['/', '/study/us-states.html', '/education/', '/contact/', '/privacy/', '/tools/']);
const EXCLUDED_PATHS = new Set([
  '/tools/pediatric-abpm-pathway-preview.html',
  '/tools/bp-percentile-calculator-preview.html',
  '/admin/',
  '/steven-os/',
  '/cardiohospital/',
  '/cardio-hospital-3d/',
  '/clipboard-sanitizer/',
  '/study/supabase/functions/studyhub-save/index.ts',
  '/steven-os/schema.sql',
]);
const HTML = '<!doctype html><html><head><meta name="robots" content="noindex, nofollow, noarchive"></head><body>ok</body></html>';
const HEADERS = {
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'x-content-type-options': 'nosniff',
  'content-security-policy': "default-src 'self'",
};

async function startFixture({ missingMetaPath = '', sitemapStatus = 404 } = {}) {
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://fixture.invalid').pathname;

    if (PUBLIC_HTML_PATHS.has(pathname)) {
      response.writeHead(200, { ...HEADERS, 'content-type': 'text/html; charset=utf-8' });
      response.end(pathname === missingMetaPath ? '<html><head></head><body>ok</body></html>' : HTML);
      return;
    }

    if (pathname === '/robots.txt') {
      response.writeHead(200, { ...HEADERS, 'content-type': 'text/plain; charset=utf-8' });
      response.end('User-agent: *\nDisallow:\n');
      return;
    }

    if (pathname === '/sitemap.xml') {
      response.writeHead(sitemapStatus, { 'content-type': 'application/xml; charset=utf-8' });
      response.end(sitemapStatus === 200 ? '<urlset></urlset>' : 'Page not found');
      return;
    }

    if (EXCLUDED_PATHS.has(pathname) || pathname === '/__definitely-not-a-real-route__') {
      response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      response.end('Page not found');
      return;
    }

    response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    response.end('Page not found');
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

async function runVerifier(origin) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/verify-production.mjs'], {
      cwd: repoRoot,
      env: { ...process.env, SITE_ORIGIN: origin },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('production verifier accepts the intended live deployment policy', async (t) => {
  const fixture = await startFixture();
  t.after(fixture.close);
  const result = await runVerifier(fixture.origin);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Production verification passed/);
});

test('production verifier rejects deployed HTML without robots meta defense', async (t) => {
  const fixture = await startFixture({ missingMetaPath: '/education/' });
  t.after(fixture.close);
  const result = await runVerifier(fixture.origin);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /\/education\/ is missing meta name="robots"/);
});

test('production verifier rejects a published sitemap', async (t) => {
  const fixture = await startFixture({ sitemapStatus: 200 });
  t.after(fixture.close);
  const result = await runVerifier(fixture.origin);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /\/sitemap\.xml should be absent but returned 200/);
});
