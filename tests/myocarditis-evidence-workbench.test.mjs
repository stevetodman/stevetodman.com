import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const dir = path.join(root, 'myocarditis', 'evidence-workbench');

function read(name) {
  return fs.readFileSync(path.join(dir, name), 'utf8');
}

test('myocarditis evidence workbench ships as a noindex React PDF workspace', () => {
  const html = read('index.html');
  const app = read('app.js');
  const css = read('styles.css');

  assert.match(html, /noindex,nofollow/);
  assert.match(html, /id="root"/);
  assert.match(app, /react@18\.3\.1/);
  assert.match(app, /pdfjs-dist@4\.10\.38/);
  assert.match(app, /\.\.\/question-bank\/sources\.json/);
  assert.match(app, /indexedDB\.open/);
  assert.match(app, /sourceOverrides/);
  assert.match(app, /Export JSON/);
  assert.match(app, /Highlight/);
  assert.match(css, /\.annotation/);
});
