import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers/harness.mjs';

const read = relativePath => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const words = ['blunder','cancel','continuous','distribute','document','fragile','myth','reject','scuffle','solitary','temporary','veteran'];

test('Unit 1 exposes focused teacher-style test practice without replacing the adventure', () => {
  const index = read('study/unit-1/index.html');
  const html = read('study/unit-1/test-practice.html');
  assert.match(index, /href="\/study\/unit-1\/test-practice\.html"/);
  assert.match(index, /<script src="app\.js"><\/script>/);
  assert.match(html, /test-practice\.js/);
  assert.match(html, /test-practice\.css/);
});

test('test practice keeps the exact 12-word bank and full elimination runs', () => {
  const source = read('study/unit-1/test-practice.js');
  for (const word of words) assert.match(source, new RegExp(`['"]${word}['"]`));
  assert.match(source, /12-for-12 paragraph/);
  assert.match(source, /Fill the entire paragraph before checking/);
  assert.match(source, /answers\.every\(Boolean\)/);
  assert.match(source, /correct=answers\.reduce/);
});

test('test practice covers the known high-value gaps', () => {
  const source = read('study/unit-1/test-practice.js');
  assert.match(source, /stamping PAID across it/); // second sense of cancel
  assert.match(source, /grammar shape/);
  assert.match(source, /blank comes first/i);
  assert.match(source, /none given/);
  assert.match(source, /veterinarian/);
  assert.match(source, /continuous.*continues/s);
  assert.match(source, /Wednesday spelling sprint/);
  assert.match(source, /The weekly word is the base form: cancel/);
});

test('document and scuffle do not acquire invented antonyms', () => {
  const source = read('study/unit-1/test-practice.js');
  assert.match(source, /document:\{pos:\['noun','verb'\],syn:\[[^\]]+\],ant:\[\]\}/);
  assert.match(source, /scuffle:\{pos:\['verb','noun'\],syn:\[[^\]]+\],ant:\[\]\}/);
});
