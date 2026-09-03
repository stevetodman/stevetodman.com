export const MAX_GAME_SHARE = 0.20;
export const EDUCATION_SECONDS_PER_GAME_SECOND = 4;

function ms(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function sanitizeBudget(raw = {}) {
  return {
    cycleId: typeof raw?.cycleId === "string" ? raw.cycleId : "",
    educationMs: ms(raw?.educationMs),
    gameMs: ms(raw?.gameMs)
  };
}

export function gameAllowanceMs(budget = {}) {
  const state = sanitizeBudget(budget);
  return Math.floor(state.educationMs / EDUCATION_SECONDS_PER_GAME_SECOND);
}

export function remainingGameMs(budget = {}) {
  const state = sanitizeBudget(budget);
  return Math.max(0, gameAllowanceMs(state) - state.gameMs);
}

export function gameShare(budget = {}) {
  const state = sanitizeBudget(budget);
  const total = state.educationMs + state.gameMs;
  return total > 0 ? state.gameMs / total : 0;
}

export function addEducationMs(budget = {}, amount = 0) {
  const state = sanitizeBudget(budget);
  return { ...state, educationMs: state.educationMs + ms(amount) };
}

export function spendGameMs(budget = {}, requested = 0) {
  const state = sanitizeBudget(budget);
  const allowed = Math.min(ms(requested), remainingGameMs(state));
  const next = { ...state, gameMs: state.gameMs + allowed };
  return {
    budget: next,
    spentMs: allowed,
    blockedMs: Math.max(0, ms(requested) - allowed),
    exhausted: remainingGameMs(next) <= 0
  };
}

export function withinEducationRatio(budget = {}) {
  return gameShare(budget) <= MAX_GAME_SHARE + Number.EPSILON;
}
