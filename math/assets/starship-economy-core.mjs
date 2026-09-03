export const GAME_VERSION = 1;
export const GAME_KEY = "mathmission.starship.v1";

export const STARTER_EQUIPMENT = Object.freeze({
  hull: "comet-scout",
  trail: "ion-wake",
  companion: "none"
});

export const CATALOG = Object.freeze({
  "comet-scout": Object.freeze({ id: "comet-scout", slot: "hull", name: "Comet Scout", price: 0, starter: true, description: "Your quick, dependable starter ship." }),
  "solar-wing": Object.freeze({ id: "solar-wing", slot: "hull", name: "Solar Wing", price: 20, description: "Wide solar fins and a bright command canopy." }),
  "nebula-runner": Object.freeze({ id: "nebula-runner", slot: "hull", name: "Nebula Runner", price: 30, description: "A deep-space hull built for long exploration arcs." }),
  "ion-wake": Object.freeze({ id: "ion-wake", slot: "trail", name: "Ion Wake", price: 0, starter: true, description: "A clean blue engine wake." }),
  "meteor-wake": Object.freeze({ id: "meteor-wake", slot: "trail", name: "Meteor Wake", price: 10, description: "A bright, fast-burning trail." }),
  "aurora-wake": Object.freeze({ id: "aurora-wake", slot: "trail", name: "Aurora Wake", price: 16, description: "A shimmering twin-band engine trail." }),
  "none": Object.freeze({ id: "none", slot: "companion", name: "No companion", price: 0, starter: true, description: "Fly solo with a clean outer orbit." }),
  "orbit-bot": Object.freeze({ id: "orbit-bot", slot: "companion", name: "Orbit Bot", price: 12, description: "A small navigation bot that circles your ship." }),
  "beacon-drone": Object.freeze({ id: "beacon-drone", slot: "companion", name: "Beacon Drone", price: 18, description: "A long-range survey drone for the next sector." })
});

const LEVEL_THRESHOLDS = Object.freeze([0, 60, 150, 270, 420, 600, 820, 1080, 1380, 1720]);
const CREDIT_PER_SESSION = 10;
const SESSION_XP = 10;

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function starterOwned() {
  return new Set(Object.values(STARTER_EQUIPMENT));
}

export function xpForAttempt(attempt = {}) {
  if (!attempt.correct || attempt.assisted) return 0;
  return 5 + (attempt.recovery ? 3 : 0) + (attempt.recheck ? 2 : 0) + (attempt.transfer ? 2 : 0);
}

export function lifetimeXp(mathProfile = {}) {
  const attempts = Array.isArray(mathProfile.attempts) ? mathProfile.attempts : [];
  const attemptXp = attempts.reduce((sum, attempt) => sum + xpForAttempt(attempt), 0);
  return attemptXp + nonNegativeInteger(mathProfile.sessions) * SESSION_XP;
}

export function levelForXp(rawXp) {
  const xp = Math.max(0, nonNegativeInteger(rawXp));
  let level = 1;
  for (let index = 1; index < LEVEL_THRESHOLDS.length; index += 1) {
    if (xp < LEVEL_THRESHOLDS[index]) break;
    level = index + 1;
  }
  if (level === LEVEL_THRESHOLDS.length && xp >= LEVEL_THRESHOLDS.at(-1)) {
    level += Math.floor((xp - LEVEL_THRESHOLDS.at(-1)) / 380);
  }
  return level;
}

export function levelProgress(rawXp) {
  const xp = Math.max(0, nonNegativeInteger(rawXp));
  const level = levelForXp(xp);
  if (level < LEVEL_THRESHOLDS.length) {
    const start = LEVEL_THRESHOLDS[level - 1];
    const end = LEVEL_THRESHOLDS[level];
    return { level, current: xp - start, needed: end - start, percent: Math.round(((xp - start) / (end - start)) * 100) };
  }
  const start = LEVEL_THRESHOLDS.at(-1) + (level - LEVEL_THRESHOLDS.length) * 380;
  return { level, current: xp - start, needed: 380, percent: Math.round(((xp - start) / 380) * 100) };
}

export function sectorForSessions(rawSessions) {
  const sessions = nonNegativeInteger(rawSessions);
  if (sessions < 2) return { id: "launch-bay", name: "Launch Bay", nextAt: 2 };
  if (sessions < 5) return { id: "moon-orbit", name: "Moon Orbit", nextAt: 5 };
  if (sessions < 9) return { id: "asteroid-belt", name: "Asteroid Belt", nextAt: 9 };
  if (sessions < 14) return { id: "nebula-gate", name: "Nebula Gate", nextAt: 14 };
  return { id: "deep-space", name: "Deep Space", nextAt: null };
}

export function sanitizeGameProfile(raw = {}) {
  const purchases = {};
  const incomingPurchases = raw && typeof raw.purchases === "object" ? raw.purchases : {};
  for (const [id, record] of Object.entries(incomingPurchases || {})) {
    const item = CATALOG[id];
    if (!item || item.starter) continue;
    const at = Number(record?.at);
    purchases[id] = { at: Number.isFinite(at) && at > 0 ? Math.floor(at) : 0 };
  }

  const owned = starterOwned();
  Object.keys(purchases).forEach(id => owned.add(id));
  const incomingEquipped = raw && typeof raw.equipped === "object" ? raw.equipped : {};
  const equipped = { ...STARTER_EQUIPMENT };
  for (const slot of Object.keys(STARTER_EQUIPMENT)) {
    const id = incomingEquipped?.[slot];
    if (owned.has(id) && CATALOG[id]?.slot === slot) equipped[slot] = id;
  }

  return { version: GAME_VERSION, purchases, equipped };
}

export function spentCredits(gameProfile = {}) {
  const profile = sanitizeGameProfile(gameProfile);
  return Object.keys(profile.purchases).reduce((sum, id) => sum + (CATALOG[id]?.price || 0), 0);
}

export function earnedCredits(mathProfile = {}) {
  return nonNegativeInteger(mathProfile.sessions) * CREDIT_PER_SESSION;
}

export function deriveProgress(mathProfile = {}, gameProfile = {}) {
  const profile = sanitizeGameProfile(gameProfile);
  const xp = lifetimeXp(mathProfile);
  const sessions = nonNegativeInteger(mathProfile.sessions);
  const earned = earnedCredits(mathProfile);
  const spent = spentCredits(profile);
  return {
    xp,
    level: levelForXp(xp),
    levelProgress: levelProgress(xp),
    sessions,
    sector: sectorForSessions(sessions),
    creditsEarned: earned,
    creditsSpent: spent,
    credits: Math.max(0, earned - spent),
    equipped: { ...profile.equipped },
    purchases: { ...profile.purchases }
  };
}

export function purchaseItem(gameProfile = {}, mathProfile = {}, itemId, at = Date.now()) {
  const profile = sanitizeGameProfile(gameProfile);
  const item = CATALOG[itemId];
  if (!item || item.starter) return { ok: false, reason: "unavailable", profile };
  if (profile.purchases[itemId]) return { ok: false, reason: "already-owned", profile };
  const progress = deriveProgress(mathProfile, profile);
  if (progress.credits < item.price) return { ok: false, reason: "not-enough-credits", profile };

  const next = sanitizeGameProfile({
    ...profile,
    purchases: { ...profile.purchases, [itemId]: { at: Number.isFinite(Number(at)) ? Number(at) : Date.now() } },
    equipped: { ...profile.equipped, [item.slot]: itemId }
  });
  return { ok: true, reason: "purchased", item, profile: next };
}

export function equipItem(gameProfile = {}, itemId) {
  const profile = sanitizeGameProfile(gameProfile);
  const item = CATALOG[itemId];
  if (!item) return { ok: false, reason: "unavailable", profile };
  const owned = starterOwned();
  Object.keys(profile.purchases).forEach(id => owned.add(id));
  if (!owned.has(itemId)) return { ok: false, reason: "not-owned", profile };
  if (profile.equipped[item.slot] === itemId) return { ok: true, reason: "already-equipped", item, profile };
  return {
    ok: true,
    reason: "equipped",
    item,
    profile: sanitizeGameProfile({ ...profile, equipped: { ...profile.equipped, [item.slot]: itemId } })
  };
}
