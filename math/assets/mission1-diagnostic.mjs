import { diagnostic as fullDiagnostic } from "./mission1-content.mjs?v=20260902-packet1";

export const DIAGNOSTIC_BASE_MICROS = ["powers_multiply", "powers_divide"];
export const DIAGNOSTIC_PREREQUISITE_MICROS = ["place_digit", "place_value"];
export const DIAGNOSTIC_MIN = DIAGNOSTIC_BASE_MICROS.length;
export const DIAGNOSTIC_MAX = DIAGNOSTIC_MIN + DIAGNOSTIC_PREREQUISITE_MICROS.length;

const diagnosticByMicro = new Map(fullDiagnostic().map(question => [question.micro, question]));

function questionFor(micro) {
  const question = diagnosticByMicro.get(micro);
  if (!question) throw new Error(`Missing diagnostic question for ${micro}`);
  return { ...question };
}

export function startDiagnostic() {
  return DIAGNOSTIC_BASE_MICROS.map(questionFor);
}

export function diagnosticExpansion(queue, results) {
  const asked = new Set((queue || []).map(question => question.micro));
  if (DIAGNOSTIC_PREREQUISITE_MICROS.some(micro => asked.has(micro))) return [];

  const currentResults = (results || []).filter(result => DIAGNOSTIC_BASE_MICROS.includes(result.micro));
  if (currentResults.length < DIAGNOSTIC_BASE_MICROS.length) return [];
  if (currentResults.every(result => result.correct)) return [];

  return DIAGNOSTIC_PREREQUISITE_MICROS.filter(micro => !asked.has(micro)).map(questionFor);
}

export function diagnosticSummary(results) {
  const current = (results || []).filter(result => DIAGNOSTIC_BASE_MICROS.includes(result.micro));
  const prerequisites = (results || []).filter(result => DIAGNOSTIC_PREREQUISITE_MICROS.includes(result.micro));
  return {
    currentComplete: current.length === DIAGNOSTIC_BASE_MICROS.length,
    currentSecure: current.length === DIAGNOSTIC_BASE_MICROS.length && current.every(result => result.correct),
    prerequisiteProbeNeeded: current.length === DIAGNOSTIC_BASE_MICROS.length && current.some(result => !result.correct),
    prerequisiteComplete: prerequisites.length === DIAGNOSTIC_PREREQUISITE_MICROS.length
  };
}
