import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");

test("Math Mission keeps the verified weekly focus while removing adult analytics from the child path", async () => {
  const [html, app, weekly, plan] = await Promise.all([
    read("math/index.html"),
    read("math/assets/mission1.js"),
    read("math/CURRENT_WEEK.md"),
    read("math/WORLD_CLASS_CHILD_UX_PLAN.md")
  ]);
  assert.match(html, /Module 1 · Place Value & Decimal Fractions/);
  assert.match(html, /Current focus: Lessons 1–2 \/ 5\.NBT\.1–2/);
  assert.match(html, /Today’s Mission/);
  assert.doesNotMatch(html, /id="skill-list"|id="mastery-count"|parent-summary/);
  assert.doesNotMatch(app, /Skill level|domainStats|microStats|parent-report/);
  assert.match(app, /Current focus · Lessons 1–2 · 5\.NBT\.1–2/);
  assert.doesNotMatch(app, /This week · Lessons 1–16/);
  assert.match(weekly, /Adaptive practice should prioritize Lessons 1–2 \/ 5\.NBT\.1–2 first/);
  assert.match(weekly, /Do not describe all Lessons 1–16 as "this week\."/);
  assert.match(plan, /Status: \*\*LOCKED IMPLEMENTATION PLAN\*\*/);
  assert.match(plan, /Parent mode or parent dashboard redesign/);
  assert.match(plan, /If a proposed change does not improve the current child learning loop, it does not belong/);
});

test("the learning screen has explicit independent progress and an interactive fixed-decimal place-value workspace", async () => {
  const [html, app, css, workspace] = await Promise.all([
    read("math/index.html"),
    read("math/assets/mission1.js"),
    read("math/assets/mission1.css"),
    read("math/assets/mission1-place-value.mjs")
  ]);
  assert.match(html, /id="progress-text"/);
  assert.match(html, /id="progress-fill"/);
  assert.match(html, /id="place-value-workspace"/);
  assert.doesNotMatch(html, /id="progress-pips"/);
  assert.match(app, /Guided step/);
  assert.match(app, /does not.*Skill level|You used/);
  assert.match(workspace, /Fixed decimal point/);
  assert.match(workspace, /data-pv-shift="left"/);
  assert.match(workspace, /data-pv-shift="right"/);
  assert.match(workspace, /decimal point stays fixed/i);
  assert.match(workspace, /visiblePlaceValueColumns/);
  assert.match(workspace, /Swipe the chart/);
  assert.match(css, /\.progress-track/);
  assert.match(css, /\.place-value-workspace/);
  assert.match(css, /position:sticky/);
  assert.match(css, /grid-template-columns:var\(--pv-columns\)/);
});

test("wrong-answer UX does not immediately reveal the answer for current powers-of-ten practice", async () => {
  const [app, html] = await Promise.all([read("math/assets/mission1.js"), read("math/index.html")]);
  assert.match(app, /Show me with the place-value chart/);
  assert.match(app, /Check what happens to each digit’s value/);
  assert.match(app, /question\.workspace\?\.type === "place-value"/);
  assert.match(app, /state\.immediateScaffold = question/);
  assert.doesNotMatch(app, /confirm\("Exit this mission/);
  assert.match(html, /id="exit-dialog"/);
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
  assert.match(css, /@media\(max-width:899px\)/);
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
