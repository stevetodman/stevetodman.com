export const TEACHER_WEEK = Object.freeze({
  id: "teacher-week-2026-09-03",
  source: "Teacher-provided weekly materials",
  label: "Lessons 1–2 · 5.NBT.1–2",
  title: "Powers of 10",
  summary: "Use place value to understand what happens when numbers are multiplied or divided by 10, 100, and 1,000.",
  currentMicros: Object.freeze(["powers_multiply", "powers_divide"]),
  supportMicros: Object.freeze(["place_digit", "place_value"]),
  diagnosticMicros: Object.freeze(["place_digit", "place_value", "powers_multiply", "powers_divide"])
});

const ALLOWED = new Set([...TEACHER_WEEK.currentMicros, ...TEACHER_WEEK.supportMicros]);

export function isTeacherAllowedMicro(micro) {
  return ALLOWED.has(micro);
}

export function explanationForMicro(micro) {
  return ({
    place_digit: "Start at the decimal point. The first place to the right is tenths, then hundredths, then thousandths.",
    place_value: "A digit's value depends on its place. For example, 3 in the hundredths place means 3 hundredths, or 0.03.",
    powers_multiply: "Multiplying by a power of 10 makes the number larger. Each move one place left makes a digit worth 10 times as much; the decimal point itself stays fixed.",
    powers_divide: "Dividing by a power of 10 makes the number smaller. Each move one place right makes a digit worth one tenth as much; the decimal point itself stays fixed."
  })[micro] || "Review the underlying place-value idea before trying again.";
}
