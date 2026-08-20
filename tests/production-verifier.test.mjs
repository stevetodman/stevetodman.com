import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { repoRoot } from './helpers/harness.mjs';

const catalog = JSON.parse(fs.readFileSync(path.join(repoRoot, 'site/catalog.json'), 'utf8'));
const PUBLIC_HTML_PATHS = new Set(
  catalog.items.filter((item) => item.route && item.class === 'PRODUCTION').map((item) => item.route)
);
const EXCLUDED_PATHS = new Set([
  ...catalog.items.filter((item) => item.route && item.class !== 'PRODUCTION').map((item) => item.route),
  ...catalog.items.filter((item) => item.path && item.class === 'SOURCE_ONLY')
    .map((item) => `/${item.path.replace(/^\/+|\/+$/g, '')}/`),
]);
const HTML = '<!doctype html><html><head><meta name="robots" content="noindex, nofollow, noarchive"></head><body>ok</body></html>';
const HEADERS = {
  'x-robots-tag': 'noindex, nofollow, noarchive',
  'x-content-type-options': 'nosniff',
  'content-security-policy': "default-src 'self'",
};

async function startFixture({ missingMetaPath = '', missingPublicPath = '', sitemapStatus = 404, exposedPath = '' } = {}) {
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://fixture.invalid').pathname;

    if ((PUBLIC_HTML_PATHS.has(pathname) && pathname !== missingPublicPath) || pathname === exposedPath) {
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

test('production verifier rejects a cataloged production route that is missing', async (t) => {
  const missingPublicPath = [...PUBLIC_HTML_PATHS].find((route) => route !== '/');
  assert.ok(missingPublicPath, 'expected at least one cataloged production path beyond home');
  const fixture = await startFixture({ missingPublicPath });
  t.after(fixture.close);
  const result = await runVerifier(fixture.origin);
  assert.equal(result.code, 1);
  assert.match(result.stderr, new RegExp(`${missingPublicPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} returned 404`));
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

test('production verifier rejects a cataloged non-production route that becomes readable', async (t) => {
  const exposedPath = [...EXCLUDED_PATHS][0];
  assert.ok(exposedPath, 'expected at least one cataloged non-production path');
  const fixture = await startFixture({ exposedPath });
  t.after(fixture.close);
  const result = await runVerifier(fixture.origin);
  assert.equal(result.code, 1);
  assert.match(result.stderr, new RegExp(`${exposedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} should be absent from production`));
});
