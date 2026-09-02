import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseOrderItems, sequenceAnswer } from "../math/assets/mission1-low-friction.mjs";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");

test("Math Mission presents the true current classroom focus in the child view", async () => {
  const [html, focus, app] = await Promise.all([
    read("math/index.html"),
    read("math/assets/mission1-focus.mjs"),
    read("math/assets/mission1.js")
  ]);
  assert.match(html, /Module 1 · Place Value & Decimal Fractions/);
  assert.match(html, /Current focus: Module 1, Lessons 1–2/);
  assert.doesNotMatch(html, /Current packet: Module 1, Lessons 1–16/);
  assert.match(html, /Today’s Mission/);
  assert.match(focus, /lessons: "Lessons 1–2"/);
  assert.match(focus, /powers_multiply.*powers_divide/);
  assert.doesNotMatch(html, /id="skill-list"|id="mastery-count"|parent-summary/);
  assert.doesNotMatch(app, /Skill level|domainStats|microStats|parent-report/);
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

test("wrong-answer UX scaffolds a miss before revealing the answer", async () => {
  const [app, html] = await Promise.all([read("math/assets/mission1.js"), read("math/index.html")]);
  assert.match(app, /Show me with the place-value chart/);
  assert.match(app, /Show me a step/);
  assert.match(app, /scaffoldFor\(question\.micro\)/);
  assert.match(app, /Check what happens to each digit’s value/);
  assert.match(app, /state\.immediateScaffold = question/);
  assert.doesNotMatch(app, /confirm\("Exit this mission/);
  assert.match(html, /id="exit-dialog"/);
});

test("low-friction controls preserve the mathematical decision while removing transcription", async () => {
  const [html, frictionless] = await Promise.all([
    read("math/index.html"),
    read("math/assets/mission1-frictionless.mjs")
  ]);
  assert.match(html, /mission1-low-friction\.mjs/);
  assert.match(html, /mission1-frictionless\.mjs/);
  assert.match(frictionless, /Answer from your chart/);
  assert.match(frictionless, /input\.readOnly = true/);
  assert.match(frictionless, /pv-use-answer/);
  assert.deepEqual(parseOrderItems("0.57, 0.507, 0.6, 0.505"), ["0.57", "0.507", "0.6", "0.505"]);
  assert.equal(sequenceAnswer(["0.505", "0.507", "0.57", "0.6"]), "0.505, 0.507, 0.57, 0.6");
});

test("misconception evidence is captured at a more specific level than correct or incorrect", async () => {
  const frictionless = await read("math/assets/mission1-frictionless.mjs");
  assert.match(frictionless, /wrong_direction/);
  assert.match(frictionless, /wrong_shift_count/);
  assert.match(frictionless, /comparison_relation/);
  assert.match(frictionless, /rounding_rule/);
  assert.match(frictionless, /latest\.misconception = misconception/);
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
