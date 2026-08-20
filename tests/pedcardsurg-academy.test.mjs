import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startServer, getChromium, watchForErrors, repoRoot } from './helpers/harness.mjs';

let server, browser;

before(async () => {
  server = await startServer();
  browser = await (await getChromium()).launch();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

async function openModule(viewport = { width: 1180, height: 900 }) {
  const page = await browser.newPage({ viewport });
  const errors = watchForErrors(page);
  await page.goto(server.origin + '/pedcardsurg/', { waitUntil: 'networkidle' });
  return { page, errors };
}

async function expectAtlasImage(page, pattern) {
  const image