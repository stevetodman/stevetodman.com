export const ROUTE_STOPS = Object.freeze([
  Object.freeze({ id: "launch-bay", name: "Launch Bay", sessions: 0, note: "Systems online" }),
  Object.freeze({ id: "moon-orbit", name: "Moon Orbit", sessions: 2, note: "First orbital route" }),
  Object.freeze({ id: "asteroid-belt", name: "Asteroid Belt", sessions: 5, note: "Navigation corridor" }),
  Object.freeze({ id: "nebula-gate", name: "Nebula Gate", sessions: 9, note: "Long-range passage" }),
  Object.freeze({ id: "deep-space", name: "Deep Space", sessions: 14, note: "Open exploration" })
]);

export const MISSION_PATCHES = Object.freeze([
  Object.freeze({ id: "first-launch", name: "First Launch", mark: "01", description: "Complete your first Math Mission." }),
  Object.freeze({ id: "comeback-pilot", name: "Comeback Pilot", mark: "↗", description: "Solve a problem independently after getting help on it." }),
  Object.freeze({ id: "transfer-scout", name: "Transfer Scout", mark: "◇", description: "Use what you know in a transfer problem." }),
  Object.freeze({ id: "repair-specialist", name: "Repair Specialist", mark: "✓", description: "Pass an independent recheck after a repaired item." }),
  Object.freeze({ id: "powers-navigator", name: "Powers Navigator", mark: "10", description: "Show independent success multiplying and dividing by powers of 10." }),
  Object.freeze({ id: "precision-pilot", name: "Precision Pilot", mark: "Ⅲ", description: "Solve three advanced questions independently." }),
  Object.freeze({ id: "decimal-cartographer", name: "Decimal Cartographer", mark: ".0", description: "Show independent success across four different kinds of decimal work." }),
  Object.freeze({ id: "mission-veteran", name: "Mission Veteran", mark: "10×", description: "Complete ten Math Missions." }),
  Object.freeze({ id: "deep-space-explorer", name: "Deep-Space Explorer", mark: "✦", description: "Reach Deep Space." })
]);

function attemptsOf(mathProfile = {}) {
  return Array.isArray(mathProfile?.attempts) ? mathProfile.attempts : [];
}

function independentCorrect(attempt) {
  return !!attempt?.correct && !attempt?.assisted;
}

function sessionsOf(mathProfile = {}) {
  const n = Number(mathProfile?.sessions);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function routeState(mathProfile = {}) {
  const sessions = sessionsOf(mathProfile);
  let currentIndex = 0;
  for (let index = 0; index < ROUTE_STOPS.length; index += 1) {
    if (sessions >= ROUTE_STOPS[index].sessions) currentIndex = index;
  }
  const current = ROUTE_STOPS[currentIndex];
  const next = ROUTE_STOPS[currentIndex + 1] || null;
  const legStart = current.sessions;
  const legEnd = next?.sessions ?? current.sessions;
  const legSize = Math.max(1, legEnd - legStart);
  const legProgress = next ? Math.max(0, Math.min(1, (sessions - legStart) / legSize)) : 1;
  return {
    sessions,
    currentIndex,
    current,
    next,
    legProgress,
    reached: ROUTE_STOPS.map(stop => sessions >= stop.sessions)
  };
}

export function unlockedPatchIds(mathProfile = {}) {
  const attempts = attemptsOf(mathProfile);
  const sessions = sessionsOf(mathProfile);
  const independent = attempts.filter(independentCorrect);
  const micros = new Set(independent.map(item => item?.micro).filter(Boolean));
  const advancedCorrect = independent.filter(item => Number(item?.difficulty) >= 3).length;
  const unlocked = new Set();

  if (sessions >= 1) unlocked.add("first-launch");
  if (independent.some(item => item?.recovery)) unlocked.add("comeback-pilot");
  if (independent.some(item => item?.transfer)) unlocked.add("transfer-scout");
  if (independent.some(item => item?.recheck)) unlocked.add("repair-specialist");
  if (micros.has("powers_multiply") && micros.has("powers_divide")) unlocked.add("powers-navigator");
  if (advancedCorrect >= 3) unlocked.add("precision-pilot");
  if (micros.size >= 4) unlocked.add("decimal-cartographer");
  if (sessions >= 10) unlocked.add("mission-veteran");
  if (sessions >= 14) unlocked.add("deep-space-explorer");
  return unlocked;
}

export function patchState(mathProfile = {}) {
  const unlocked = unlockedPatchIds(mathProfile);
  const patches = MISSION_PATCHES.map(patch => ({ ...patch, unlocked: unlocked.has(patch.id) }));
  return {
    unlocked,
    unlockedCount: unlocked.size,
    total: MISSION_PATCHES.length,
    patches
  };
}
