export const LIVE_MISSION_OBJECTIVES = Object.freeze({
  place_digit: Object.freeze({ title: "Chart the place-value lane", cue: "Locate each digit precisely." }),
  place_value: Object.freeze({ title: "Calibrate the value scanner", cue: "Track what each digit is worth." }),
  powers_multiply: Object.freeze({ title: "Power the forward drive", cue: "Use powers of 10 to move the route forward." }),
  powers_divide: Object.freeze({ title: "Stabilize the reverse drive", cue: "Use powers of 10 to scale values down." }),
  metric_conversion: Object.freeze({ title: "Translate the navigation units", cue: "Rename measurements with place value." }),
  decimal_forms: Object.freeze({ title: "Decode the decimal signal", cue: "Connect standard and expanded forms." }),
  decimal_compare: Object.freeze({ title: "Choose the safer trajectory", cue: "Compare decimals place by place." }),
  decimal_round: Object.freeze({ title: "Set the approach coordinates", cue: "Round to the requested place." }),
  decimal_add: Object.freeze({ title: "Combine the fuel readings", cue: "Align like place-value units." }),
  decimal_subtract: Object.freeze({ title: "Reconcile the fuel readings", cue: "Subtract like place-value units." }),
  decimal_multiply: Object.freeze({ title: "Scale the engine output", cue: "Multiply with place-value control." }),
  decimal_divide: Object.freeze({ title: "Distribute the engine load", cue: "Divide and verify the quotient." })
});

const DEFAULT_OBJECTIVE = Object.freeze({ title: "Navigate today’s route", cue: "Solve the current math challenge." });

export function clampProgress(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

export function objectiveForMicro(micro, flags = {}) {
  const base = LIVE_MISSION_OBJECTIVES[micro] || DEFAULT_OBJECTIVE;
  if (flags.assisted) return { ...base, status: "Guided repair" };
  if (flags.recovery) return { ...base, status: "Recovery pass" };
  if (flags.recheck) return { ...base, status: "Systems recheck" };
  return { ...base, status: "Current objective" };
}

export function reactionForAttempt(attempt = {}) {
  if (!attempt || typeof attempt !== "object") return "steady";
  if (!attempt.correct && !attempt.assisted) return "anomaly";
  if (!attempt.correct && attempt.assisted) return "guided";
  if (attempt.correct && attempt.recovery && !attempt.assisted) return "recovery";
  if (attempt.correct && attempt.recheck && !attempt.assisted) return "recheck";
  if (attempt.correct && attempt.transfer && !attempt.assisted) return "transfer";
  if (attempt.correct && attempt.assisted) return "guided";
  if (attempt.correct) return "thrust";
  return "steady";
}

export function reactionCopy(reaction) {
  return ({
    anomaly: "Navigation anomaly detected. Use the next step to get back on course.",
    recovery: "Course restored independently.",
    recheck: "Systems check passed independently.",
    transfer: "New route mapped from what you already know.",
    guided: "Guidance active. Build the idea, then fly it independently.",
    thrust: "Route advanced.",
    steady: "On course."
  })[reaction] || "On course.";
}

export function liveMissionState({ progress = 0, micro = null, attempt = null, flags = {} } = {}) {
  const reaction = reactionForAttempt(attempt);
  return {
    progress: clampProgress(progress),
    objective: objectiveForMicro(micro, flags),
    reaction,
    reactionText: reactionCopy(reaction)
  };
}
