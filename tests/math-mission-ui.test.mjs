import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");

test("Math Mission separates the broad Module 1 baseline from the verified current weekly focus", async () => {
  const [html, app, weekly] = await Promise.all([read("math/index.html"), read("math/assets/mission1.js"), read("math/CURRENT_WEEK.md")]);
  assert.match(html, /Module 1 · Place Value & Decimal Fractions/);
  assert.match(html, /Current focus: Lessons 1–2 \/ 5\.NBT\.1–2/);
  assert.doesNotMatch(html, /Focused on Module 1 Lessons 1–16/);
  assert.match(app, /broad Module 1 baseline/);
  assert.match(app, /Current focus · Lessons 1–2 · 5\.NBT\.1–2/);
  assert.doesNotMatch(app, /This week · Lessons 1–16/);
  assert.match(weekly, /Adaptive practice should prioritize Lessons 1–2 \/ 5\.NBT\.1–2 first/);
  assert.match(weekly, /Do not describe all Lessons 1–16 as "this week"/);
});

test("scratchwork supports pointer input, Apple Pencil semantics, undo, clear, and responsive guides", async () => {
  const [html, css, scratch] = await Promise.all([read("math/index.html"), read("math/assets/mission1.css"), read("math/assets/mission1-scratch.mjs")]);
  assert.match(html, /id="scratch-canvas"/);
  assert.match(html, /finger, mouse, or Apple Pencil/);
  assert.match(html, /id="scratch-undo"/);
  assert.match(html, /id="scratch-clear"/);
  assert.match(scratch, /pointerdown/);
  assert.match(scratch, /pointermove/);
  assert.match(scratch, /pointerType === "mouse"/);
  assert.match(scratch, /strokes\.pop\(\)/);
  assert.match(scratch, /guideType === "tape"/);
  assert.match(css, /touch-action:none/);
  assert.match(css, /@media\(max-width:799px\)/);
});

test("cloud format preserves adaptive evidence and diagnostic version", async () => {
  const cloud = await read("math/assets/math-cloud.js");
  assert.match(cloud, /"math1b"/);
  assert.match(cloud, /a\.micro/);
  assert.match(cloud, /a\.assisted/);
  assert.match(cloud, /a\.recovery/);
  assert.match(cloud, /a\.difficulty/);
  assert.match(cloud, /math1diagnostic2/);
  assert.match(cloud, /diagnosticVersion=2/);
});
