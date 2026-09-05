import assert from "node:assert/strict";
import test from "node:test";

import { generateCurrentWeekQuestion } from "../math/assets/mission1-current-week.mjs";
import { isCorrectAnswer } from "../math/assets/mission1-content.mjs";
import { CLASS_WEEKS, TEACHER_WEEK, explanationForMicro, isTeacherAllowedMicro } from "../math/assets/teacher-week.mjs";

function seededRandom(seed = 0x1234abcd) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

test("Weeks 1-4 preserve the teacher-provided lesson, quiz, and standards sequence", () => {
  assert.equal(CLASS_WEEKS.length, 4);
  assert.deepEqual(CLASS_WEEKS.map(week => week.label), [
    "Week 1 · Aug 10–14",
    "Week 2 · Aug 17–21",
    "Week 3 · Aug 24–28",
    "Week 4 · Aug 31–Sep 4"
  ]);
  assert.match(CLASS_WEEKS[1].assessment, /Topic A.*Lessons 1–4/i);
  assert.match(CLASS_WEEKS[2].assessment, /Topics B & C.*Lessons 5–8/i);
  assert.match(CLASS_WEEKS[3].assessment, /Topics D & E.*Lessons 9–12/i);
  assert.deepEqual(CLASS_WEEKS[3].standards, ["5.NBT.B.07", "5.NBT.A.02"]);
  assert.ok(CLASS_WEEKS[3].lessons.some(item => /Mission 2 Lesson 1/i.test(item)));
});

test("Week 4 scope includes new division, D/E quiz review, and powers-of-ten maintenance", () => {
  assert.deepEqual(TEACHER_WEEK.newInstructionMicros, ["decimal_divide"]);
  assert.deepEqual(TEACHER_WEEK.assessmentMicros, ["decimal_add", "decimal_subtract", "decimal_multiply"]);
  assert.deepEqual(TEACHER_WEEK.maintenanceMicros, ["powers_multiply", "powers_divide"]);
  assert.deepEqual(TEACHER_WEEK.currentMicros, ["decimal_divide", "decimal_add", "decimal_subtract", "decimal_multiply", "powers_multiply", "powers_divide"]);
  assert.deepEqual(TEACHER_WEEK.supportMicros, ["place_digit", "place_value", "metric_conversion", "decimal_forms", "decimal_compare", "decimal_round"]);
  for (const micro of [...TEACHER_WEEK.currentMicros, ...TEACHER_WEEK.supportMicros]) assert.equal(isTeacherAllowedMicro(micro), true, micro);
});

test("every current Week 4 micro-skill generates independently solvable questions", () => {
  const random = seededRandom();
  for (const micro of TEACHER_WEEK.currentMicros) {
    for (let difficulty = 1; difficulty <= 3; difficulty += 1) {
      for (let index = 0; index < 40; index += 1) {
        const question = generateCurrentWeekQuestion(micro, difficulty, random);
        assert.equal(question.micro, micro);
        assert.equal(isCorrectAnswer(question.answer, question), true, question.prompt);
      }
    }
  }
});

test("powers-of-ten maintenance retains direct reasoning, reverse reasoning, and error analysis", () => {
  const random = seededRandom(77);
  const questions = [];
  for (const micro of TEACHER_WEEK.maintenanceMicros) {
    for (let index = 0; index < 150; index += 1) questions.push(generateCurrentWeekQuestion(micro, 3, random));
  }
  assert.ok(questions.some(question => /predict how the value of each digit changes/i.test(question.prompt)));
  assert.ok(questions.some(question => /what was the starting number/i.test(question.prompt)));
  assert.ok(questions.some(question => /A student says|wrong direction/i.test(question.prompt)));
  assert.ok(questions.some(question => /append .*zero/i.test(question.prompt)));
  assert.ok(questions.some(question => /justify the direction/i.test(question.prompt)));
});

test("guided explanations exist for current operations and prior prerequisite repair", () => {
  assert.match(explanationForMicro("decimal_divide"), /multiply.*check/i);
  assert.match(explanationForMicro("decimal_add"), /place-value units/i);
  assert.match(explanationForMicro("decimal_round"), /digit immediately to its right/i);
  const prerequisite = generateCurrentWeekQuestion("decimal_round", 2, seededRandom(9));
  assert.equal(prerequisite.micro, "decimal_round");
  assert.equal(isCorrectAnswer(prerequisite.answer, prerequisite), true);
});
