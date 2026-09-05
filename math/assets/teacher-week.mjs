export const CLASS_WEEKS = Object.freeze([
  Object.freeze({
    id: "week-1-2026-08-10",
    label: "Week 1 · Aug 10–14",
    lessons: Object.freeze([
      "Monday — Welcome to Fifth Grade",
      "Tuesday — BOY Diagnostic",
      "Wednesday — Mission 1 Lesson 1",
      "Thursday — Mission 1 Lesson 2 + fluency quiz",
      "Friday — Mission 1 Lesson 3"
    ]),
    assessment: "BOY Diagnostic Tuesday",
    standards: Object.freeze(["5.NBT.A.01", "5.NBT.A.02"])
  }),
  Object.freeze({
    id: "week-2-2026-08-17",
    label: "Week 2 · Aug 17–21",
    lessons: Object.freeze([
      "Monday — Mission 1 Lesson 4",
      "Tuesday — Mission 1 Lesson 5",
      "Wednesday — Art Project",
      "Thursday — Quiz: Mission 1 Topic A (Lessons 1–4) + fluency quiz + Mission 1 Lesson 6",
      "Friday — Mission 1 Lesson 7"
    ]),
    assessment: "Mission 1 Topic A quiz (Lessons 1–4) Thursday",
    standards: Object.freeze(["5.MD.A.1", "5.NBT.A.03", "5.NBT.A.04"])
  }),
  Object.freeze({
    id: "week-3-2026-08-24",
    label: "Week 3 · Aug 24–28",
    lessons: Object.freeze([
      "Monday — Mission 1 Lesson 8",
      "Tuesday — Mission 1 Lessons 9 & 10",
      "Wednesday — Zearn, Exit Tickets, and standards review",
      "Thursday — Quiz: Mission 1 Topics B & C (Lessons 5–8) + fluency quiz + Mission 1 Lesson 11",
      "Friday — Mission 1 Lesson 12"
    ]),
    assessment: "Mission 1 Topics B & C quiz (Lessons 5–8) Thursday",
    standards: Object.freeze(["5.NBT.A.04", "5.NBT.B.07"])
  }),
  Object.freeze({
    id: "week-4-2026-08-31",
    label: "Week 4 · Aug 31–Sep 4",
    lessons: Object.freeze([
      "Monday — Mission 1 Lesson 13",
      "Tuesday — Mission 1 Lessons 14 & 15",
      "Wednesday — Zearn, Exit Tickets, and standards review",
      "Thursday — Quiz: Mission 1 Topics D & E (Lessons 9–12) + fluency quiz + Mission 1 Lesson 16",
      "Friday — Mission 2 Lesson 1"
    ]),
    assessment: "Mission 1 Topics D & E quiz (Lessons 9–12) Thursday",
    standards: Object.freeze(["5.NBT.B.07", "5.NBT.A.02"])
  })
]);

export const TEACHER_WEEK = Object.freeze({
  id: "teacher-week-2026-08-31",
  source: "Teacher-provided weekly materials",
  label: "Week 4 · Aug 31–Sep 4",
  title: "Decimal operations + powers of 10",
  summary: "Learn decimal division in Mission 1 Lessons 13–16, review decimal addition/subtraction/multiplication for the Topics D & E quiz, and keep powers-of-10 reasoning active for 5.NBT.A.2.",
  newInstructionMicros: Object.freeze(["decimal_divide"]),
  assessmentMicros: Object.freeze(["decimal_add", "decimal_subtract", "decimal_multiply"]),
  maintenanceMicros: Object.freeze(["powers_multiply", "powers_divide"]),
  currentMicros: Object.freeze(["decimal_divide", "decimal_add", "decimal_subtract", "decimal_multiply", "powers_multiply", "powers_divide"]),
  supportMicros: Object.freeze(["place_digit", "place_value", "metric_conversion", "decimal_forms", "decimal_compare", "decimal_round"]),
  diagnosticMicros: Object.freeze(["decimal_divide", "decimal_add", "decimal_subtract", "decimal_multiply", "powers_multiply", "powers_divide"]),
  standards: Object.freeze(["5.NBT.B.07", "5.NBT.A.02"]),
  nextLesson: "Mission 2 Lesson 1 is listed for Friday; its content is not added to adaptive practice until teacher materials define the skill scope."
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
    powers_divide: "Dividing by a power of 10 makes the number smaller. Each move one place right makes a digit worth one tenth as much; the decimal point itself stays fixed.",
    metric_conversion: "Name the relationship between the two metric units first, then use the matching power of 10.",
    decimal_forms: "Match each digit to its place-value amount, then combine the values.",
    decimal_compare: "Write equal decimal places with placeholder zeros, then compare from left to right.",
    decimal_round: "Mark the place you are rounding to and inspect only the digit immediately to its right.",
    decimal_add: "Line up like place-value units. Write placeholder zeros when needed, then add each place.",
    decimal_subtract: "Line up like place-value units. Rename with placeholder zeros when needed, then subtract each place.",
    decimal_multiply: "Estimate first. Multiply using place-value units, then use the estimate to check the decimal's position.",
    decimal_divide: "Divide using place-value units, rename as needed, and multiply the quotient by the divisor to check."
  })[micro] || "Review the underlying place-value idea before trying again.";
}
