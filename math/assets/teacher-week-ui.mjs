import { CLASS_WEEKS, TEACHER_WEEK } from "./teacher-week.mjs?v=20260904-week4";

const note = document.querySelector(".week-note");
if (note) note.innerHTML = `<strong>Current focus: ${TEACHER_WEEK.label}.</strong> ${TEACHER_WEEK.summary}`;

const picker = document.querySelector("#picker");
if (picker && !document.querySelector("#math-course-history")) {
  const history = document.createElement("details");
  history.id = "math-course-history";
  history.className = "course-history";
  history.innerHTML = `
    <summary>See Weeks 1–4 class plan</summary>
    <div class="course-history-body">
      ${CLASS_WEEKS.map(week => `
        <section class="course-week">
          <h2>${week.label}</h2>
          <ul>${week.lessons.map(item => `<li>${item}</li>`).join("")}</ul>
          <p><strong>Assessment:</strong> ${week.assessment}</p>
          <p><strong>Standards:</strong> ${week.standards.join(" · ")}</p>
        </section>`).join("")}
      <p class="course-history-note">Exit Tickets are completed at school. Class-specific quiz and assessment access links remain in Canvas rather than on this public practice page.</p>
    </div>`;
  picker.append(history);
}
