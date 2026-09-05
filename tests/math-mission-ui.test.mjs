import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseOrderItems, sequenceAnswer } from "../math/assets/mission1-low-friction.mjs";
import { diagnoseMathError, makeRepairQuestion } from "../math/assets/mission1-error-diagnosis.mjs";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");
const diagnosisQuestion = (micro, answer, audit, extras = {}) => ({
  micro,
  skill: "place",
  answer: String(answer),
  audit,
  difficulty: 2,
  transfer: false,
  recovery: false,
  assisted: false,
  options: null,
  prompt: "test",
  why: "test",
  ...extras
});

test("Math Mission takes weekly focus from the teacher scope while removing adult analytics from the child path", async () => {
  const [html, app, teacherWeek, teacherUi, weekly, plan] = await Promise.all([
    read("math/index.html"),
    read("math/assets/mission1.js"),
    read("math/assets/teacher-week.mjs"),
    read("math/assets/teacher-week-ui.mjs"),
    read("math/CURRENT_WEEK.md"),
    read("math/WORLD_CLASS_CHILD_UX_PLAN.md")
  ]);
  assert.match(html, /Current classroom math/);
  assert.match(html, /teacher-week-ui\.mjs/);
  assert.match(html, /Today’s Mission/);
  assert.doesNotMatch(html, /id="skill-list"|id="mastery-count"|parent-summary/);
  assert.doesNotMatch(app, /Skill level|domainStats|microStats|parent-report/);
  assert.match(app, /TEACHER_WEEK\.label/);
  assert.match(app, /TEACHER_WEEK\.title/);
  assert.match(app, /TEACHER_WEEK\.diagnosticMicros/);
  assert.match(teacherWeek, /source: "Parent-provided classroom planner and Eureka Math Grade 5 Mission 1 Lessons 13–16 problem sets"/);
  assert.match(teacherWeek, /label: "Current focus · Mission 1 Lessons 13–16"/);
  assert.match(teacherWeek, /newInstructionMicros: Object\.freeze\(\["decimal_divide"\]\)/);
  assert.match(teacherWeek, /assessmentMicros: Object\.freeze\(\["decimal_divide"\]\)/);
  assert.match(teacherWeek, /maintenanceMicros: Object\.freeze\(\["decimal_add", "decimal_subtract", "decimal_multiply", "powers_multiply", "powers_divide"\]\)/);
  assert.match(teacherUi, /CLASS_WEEKS/);
  assert.match(teacherUi, /TEACHER_WEEK\.label/);
  assert.match(teacherUi, /TEACHER_WEEK\.summary/);
  assert.match(weekly, /decimal division/i);
  assert.match(weekly, /explanation, representation, error-analysis, and multi-step questions/i);
  assert.match(weekly, /Maintenance:.*decimal addition, subtraction, multiplication, powers-of-10 reasoning/i);
  assert.match(weekly, /UI\/UX freeze/i);
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
  assert.match(app, /You used/);
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

test("wrong-answer UX diagnoses the submitted answer, gives one-tap repair, and delays independent proof", async () => {
  const [app, diagnosis, html] = await Promise.all([
    read("math/assets/mission1.js"),
    read("math/assets/mission1-error-diagnosis.mjs"),
    read("math/index.html")
  ]);
  assert.match(app, /diagnoseMathError\(raw, question\)/);
  assert.match(app, /misconception: diagnosis\?\.key/);
  assert.match(app, /One quick tap question will fix the idea/);
  assert.match(app, /state\.immediateScaffold = makeRepairQuestion\(question, diagnosis\)/);
  assert.match(app, /sameRecovery = state\.recoveries\.some\(item => item\.micro === question\.micro && item\.assessmentArchetype === \(question\.assessmentArchetype \|\| null\)\)/);
  assert.match(app, /state\.recoveries\.push\(\{ micro: question\.micro, assessmentArchetype: question\.assessmentArchetype \|\| null, delay: 1 \}\)/);
  assert.match(app, /repairOnly/);
  assert.match(app, /if \(!question\.repairOnly\)/);
  assert.doesNotMatch(app, /Not yet\. The answer is \$\{question\.answer\}.*Fix this/s);
  assert.match(diagnosis, /power10_direction/);
  assert.match(diagnosis, /rounding_truncated/);
  assert.match(diagnosis, /decimal_magnitude/);
  assert.match(diagnosis, /multistep_skipped_subtraction/);
  assert.match(diagnosis, /options: fix\.options/);
  assert.match(html, /id="exit-dialog"/);
});

test("answer-aware diagnosis distinguishes high-value misconception patterns", () => {
  const shifted = diagnoseMathError("25.2", diagnosisQuestion("decimal_multiply", "2.52", { kind: "product" }));
  assert.equal(shifted.key, "decimal_magnitude");
  assert.equal(shifted.repair.answer, "2.52");

  const reversed = diagnoseMathError("3640", diagnosisQuestion("powers_divide", "0.364", { kind: "scale", operation: "divide", a: 36.4, factor: 100 }));
  assert.equal(reversed.key, "power10_direction");
  assert.equal(reversed.repair.answer, "Less");

  const truncated = diagnoseMathError("18.37", diagnosisQuestion("decimal_round", "18.38", { kind: "round", thousandths: 18376, digits: 2 }));
  assert.equal(truncated.key, "rounding_truncated");

  const skipped = diagnoseMathError("2", diagnosisQuestion("decimal_divide", "1.5", { kind: "subtractDivide", totalScaled: 1200, usedScaled: 300, places: 2, divisor: 6 }));
  assert.equal(skipped.key, "multistep_skipped_subtraction");
});

test("repair questions require one tap and remain assisted rather than mastery evidence", () => {
  const original = diagnosisQuestion("decimal_add", "20.18", { kind: "add" }, { workspace: { type: "place-value" } });
  const repair = makeRepairQuestion(original, diagnoseMathError("19.88", original));
  assert.equal(repair.assisted, true);
  assert.equal(repair.repairOnly, true);
  assert.equal(repair.workspace, null);
  assert.ok(Array.isArray(repair.options));
  assert.ok(repair.options.length >= 2);
});

test("low-friction controls preserve the learner's mathematical decision while removing transcription", async () => {
  const html = await read("math/index.html");
  assert.match(html, /mission1-low-friction\.mjs/);
  assert.deepEqual(parseOrderItems("0.57, 0.507, 0.6, 0.505"), ["0.57", "0.507", "0.6", "0.505"]);
  assert.equal(sequenceAnswer(["0.505", "0.507", "0.57", "0.6"]), "0.505, 0.507, 0.57, 0.6");
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
  assert.match(css, /@media\(min-width:900px\)\{html\{font-size:112\.5%\}/, "Chromebooks should use the larger desktop type scale");
  assert.match(css, /\.question-body\{font-size:1\.22rem\}/, "question text should be prominent on Chromebook");
});

test("cloud format preserves misconception evidence and current diagnostic version", async () => {
  const cloud = await read("math/assets/math-cloud.js");
  assert.match(cloud, /VALID_MISCONCEPTIONS/);
  assert.match(cloud, /VALID_ARCHETYPES/);
  assert.match(cloud, /"math1d"/);
  assert.match(cloud, /"math1e"/);
  assert.match(cloud, /misconception:parts\[9\]/);
  assert.match(cloud, /assessmentArchetype:parts\[3\]/);
  assert.match(cloud, /math1diagnostic3/);
});