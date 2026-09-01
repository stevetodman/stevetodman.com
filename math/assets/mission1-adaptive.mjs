import { DOMAIN_MICROS } from "./mission1-content.mjs";

export const DIAGNOSTIC_VERSION = 2;
export const PRACTICE_TARGET = 10;
export const PRACTICE_MAX = 12;
export const CURRENT_WEEK_MICROS = ["powers_multiply", "powers_divide"];
export const REVIEW_MICROS = ["metric_conversion", "decimal_forms", "decimal_compare"];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const relevantAttempts = (profile, micro) => (profile?.attempts || []).filter(attempt => attempt.micro === micro).sort((a, b) => (Number(a.at) || 0) - (Number(b.at) || 0)).slice(-12);

export function microScore(profile, micro) {
  let score = 40;
  for (const attempt of relevantAttempts(profile, micro)) {
    const difficulty = clamp(Number(attempt.difficulty) || 1, 1, 3);
    score += attempt.assisted ? (attempt.correct ? 2 : -3) : (attempt.correct ? 5 + difficulty * 2 : -(9 + difficulty * 2));
    score = clamp(score, 0, 100);
  }
  return Math.round(score);
}

export function difficultyForScore(score) {
  return score < 45 ? 1 : score < 75 ? 2 : 3;
}

export function microStats(profile, micro) {
  const independent = relevantAttempts(profile, micro).filter(attempt => !attempt.assisted);
  const correct = independent.filter(attempt => attempt.correct);
  const days = new Set(correct.map(attempt => attempt.date));
  const advanced = correct.filter(attempt => (Number(attempt.difficulty) || 1) >= 3).length;
  const score = microScore(profile, micro);
  return { score, attempts: independent.length, correct: correct.length, days: days.size, advanced, mastered: score >= 85 && independent.length >= 4 && advanced >= 1 && days.size >= 2 };
}

export function domainStats(profile, skill) {
  const stats = DOMAIN_MICROS[skill].map(micro => microStats(profile, micro));
  return { score: Math.round(stats.reduce((sum, item) => sum + item.score, 0) / stats.length), mastered: stats.filter(item => item.mastered).length, total: stats.length };
}

export function nextMicro(profile, options = {}) {
  const avoid = new Set(options.avoid || []);
  const currentNeedsWork = CURRENT_WEEK_MICROS.some(micro => microScore(profile, micro) < 75);
  const urgentReview = REVIEW_MICROS.filter(micro => microScore(profile, micro) < 25);
  const ordinaryReview = REVIEW_MICROS.filter(micro => microScore(profile, micro) < 55);
  const pool = currentNeedsWork
    ? [...CURRENT_WEEK_MICROS, ...urgentReview]
    : [...CURRENT_WEEK_MICROS, ...ordinaryReview];
  const uniquePool = [...new Set(pool)];
  const candidates = uniquePool.map((micro, order) => {
    const stats = microStats(profile, micro);
    const latest = relevantAttempts(profile, micro).at(-1)?.at || 0;
    const isCurrent = CURRENT_WEEK_MICROS.includes(micro);
    return { micro, score: stats.score, attempts: stats.attempts, latest, avoided: avoid.has(micro) ? 1 : 0, isCurrent: isCurrent ? 0 : 1, order };
  });
  candidates.sort((a, b) => a.avoided - b.avoided || a.score - b.score || a.isCurrent - b.isCurrent || a.attempts - b.attempts || a.latest - b.latest || a.order - b.order);
  return candidates[0].micro;
}

export function projectedScore(profile, attempt) {
  const before = microScore(profile, attempt.micro);
  const copy = { ...(profile || {}), attempts: [...(profile?.attempts || []), attempt] };
  return { before, after: microScore(copy, attempt.micro) };
}

export function diagnosticIsCurrent(profile) {
  return !!profile?.diagnostic && profile.diagnosticVersion === DIAGNOSTIC_VERSION;
}
