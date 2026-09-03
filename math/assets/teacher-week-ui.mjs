import { TEACHER_WEEK } from "./teacher-week.mjs?v=20260903-teacher1";

const note = document.querySelector(".week-note");
if (note) note.innerHTML = `<strong>Current focus: ${TEACHER_WEEK.label}.</strong> ${TEACHER_WEEK.title} and prerequisite place value.`;
