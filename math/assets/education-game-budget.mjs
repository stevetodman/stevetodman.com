import {
  addEducationMs,
  gameShare,
  remainingGameMs,
  sanitizeBudget,
  spendGameMs,
  withinEducationRatio
} from "./education-game-budget-core.mjs?v=20260903-8020a";

const STORAGE_KEY = "mathmission.education-game-budget.v1";
const MATH_KEY = "mathmission.m1.v1";
const PROFILE_IDS = new Set(["luke", "samantha"]);
const TICK_MS = 250;
const MAX_TICK_DELTA_MS = 1000;

let activeProfile = null;
let budget = sanitizeBudget();
let lastTick = performance.now();
let dirty = false;

const $ = selector => document.querySelector(selector);

function readJson(key, fallback = {}) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

function sessionCount(profileId = activeProfile) {
  const root = readJson(MATH_KEY, {});
  const n = Number(root?.[profileId]?.sessions);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function readRoot() {
  const root = readJson(STORAGE_KEY, {});
  return root && typeof root === "object" ? root : {};
}

function loadBudget(profileId) {
  const root = readRoot();
  return sanitizeBudget(root?.profiles?.[profileId] || {});
}

function persistBudget() {
  if (!activeProfile || !dirty) return;
  const root = readRoot();
  const profiles = root?.profiles && typeof root.profiles === "object" ? root.profiles : {};
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, profiles: { ...profiles, [activeProfile]: budget } }));
    dirty = false;
  } catch {}
}

function beginMissionBudget() {
  if (!activeProfile) return;
  budget = { cycleId: `${activeProfile}:${sessionCount(activeProfile) + 1}`, educationMs: 0, gameMs: 0 };
  dirty = true;
  persistBudget();
}

function gameSurfaceOpen() {
  return !!$("#starship-hangar")?.open || !!$("#starship-chart details")?.open;
}

function learningSurfaceOpen() {
  return !!$("#session")?.classList.contains("active");
}

function closeGameSurfaces() {
  const dialog = $("#starship-hangar");
  if (dialog?.open) dialog.close();
  const chart = $("#starship-chart details");
  if (chart?.open) chart.open = false;
}

function notice(message) {
  let node = $("#education-game-budget-toast");
  if (!node) {
    node = document.createElement("div");
    node.id = "education-game-budget-toast";
    node.className = "ss-toast";
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    document.body.append(node);
  }
  node.className = "ss-toast";
  node.textContent = message;
  node.hidden = false;
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => { node.hidden = true; }, 2200);
}

function budgetAvailable() {
  return remainingGameMs(budget) > 0;
}

function explainBlocked() {
  notice("Math time comes first. Keep practicing to earn more Hangar and Star Chart time.");
}

function tick() {
  const now = performance.now();
  const delta = Math.max(0, Math.min(MAX_TICK_DELTA_MS, now - lastTick));
  lastTick = now;

  if (document.hidden || !activeProfile || delta <= 0) return;

  if (gameSurfaceOpen()) {
    const result = spendGameMs(budget, delta);
    budget = result.budget;
    dirty = true;
    if (result.blockedMs > 0 || result.exhausted) {
      closeGameSurfaces();
      explainBlocked();
    }
  } else if (learningSurfaceOpen()) {
    budget = addEducationMs(budget, delta);
    dirty = true;
  }

  if (!withinEducationRatio(budget)) {
    closeGameSurfaces();
    explainBlocked();
  }
}

function setProfile(profileId) {
  if (!PROFILE_IDS.has(profileId)) return;
  persistBudget();
  activeProfile = profileId;
  budget = loadBudget(profileId);
  lastTick = performance.now();
}

document.addEventListener("click", event => {
  const profile = event.target.closest("[data-profile]");
  if (profile) setProfile(profile.dataset.profile);

  if (event.target.closest("[data-action='switch']")) {
    persistBudget();
    activeProfile = null;
    budget = sanitizeBudget();
    return;
  }

  if (event.target.closest("[data-start]")) beginMissionBudget();

  const hangar = event.target.closest("[data-ss-open-hangar]");
  if (hangar && !budgetAvailable()) {
    event.preventDefault();
    event.stopImmediatePropagation();
    explainBlocked();
    return;
  }

  const chartSummary = event.target.closest("#starship-chart summary");
  const chart = chartSummary?.closest("details");
  if (chartSummary && !chart?.open && !budgetAvailable()) {
    event.preventDefault();
    event.stopImmediatePropagation();
    explainBlocked();
  }
}, true);

document.addEventListener("toggle", event => {
  const details = event.target;
  if (!(details instanceof HTMLDetailsElement) || !details.matches("#starship-chart details") || !details.open) return;
  if (!budgetAvailable()) {
    details.open = false;
    explainBlocked();
  }
}, true);

window.addEventListener("pagehide", persistBudget);
window.addEventListener("beforeunload", persistBudget);
window.addEventListener("storage", event => {
  if (event.key !== STORAGE_KEY || !activeProfile) return;
  budget = loadBudget(activeProfile);
});

setInterval(() => {
  tick();
  if (dirty) persistBudget();
}, TICK_MS);

window.MathMissionEducationGameBudget = Object.freeze({
  remainingGameMs: () => remainingGameMs(budget),
  gameShare: () => gameShare(budget),
  withinRatio: () => withinEducationRatio(budget)
});
