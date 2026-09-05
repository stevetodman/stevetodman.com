import { MICRO_SKILLS } from "./mission1-content.mjs?v=20260831-weekly3";
import { GAME_KEY, STARTER_EQUIPMENT, sanitizeGameProfile, sectorForSessions } from "./starship-economy-core.mjs?v=20260903-starship2";
import { liveMissionState } from "./live-mission-core.mjs?v=20260903-live1";

const MATH_KEY = "mathmission.m1.v1";
const PROFILE_IDS = new Set(["luke", "samantha"]);
const MICRO_BY_NAME = new Map(Object.entries(MICRO_SKILLS).map(([id, meta]) => [meta.name, id]));

let activeProfile = null;
let lastAttemptCount = 0;
let reactionTimer = null;
let observer = null;

const $ = selector => document.querySelector(selector);

function readJson(key, fallback = {}) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

function mathProfile(profileId = activeProfile) {
  if (!PROFILE_IDS.has(profileId)) return {};
  return readJson(MATH_KEY, {})?.[profileId] || {};
}

function gameProfile(profileId = activeProfile) {
  if (!PROFILE_IDS.has(profileId)) return sanitizeGameProfile();
  const root = readJson(GAME_KEY, {});
  return sanitizeGameProfile(root?.profiles?.[profileId] || {});
}

function equipped() {
  return { ...STARTER_EQUIPMENT, ...gameProfile().equipped };
}

function currentProgress() {
  const raw = $("#progress-fill")?.style.width || "0";
  return Number.parseFloat(raw) || 0;
}

function currentMicro() {
  const text = $("#skill-tag")?.textContent || "";
  for (const [name, micro] of MICRO_BY_NAME.entries()) {
    if (text.startsWith(name)) return micro;
  }
  return null;
}

function currentFlags() {
  const mode = $("#session-mode")?.textContent || "";
  return {
    assisted: mode.includes("Guided"),
    recovery: mode.includes("retry"),
    recheck: mode.includes("recheck")
  };
}

function destinationCopy() {
  const sessions = Number(mathProfile()?.sessions) || 0;
  const sector = sectorForSessions(sessions);
  return sector.nextAt ? `Route: ${sector.name}` : "Route: Deep Space";
}

function shipMarkup() {
  const gear = equipped();
  return `<div class="lm-ship ss-hull-${gear.hull} ss-trail-${gear.trail} ss-companion-${gear.companion}" aria-hidden="true">
    <span class="lm-trail"></span>
    <span class="lm-wing lm-wing-left"></span><span class="lm-wing lm-wing-right"></span>
    <span class="lm-hull"><span class="lm-canopy"></span><span class="lm-engine"></span></span>
    <span class="lm-companion"></span>
  </div>`;
}

function ensureLiveMission() {
  const sessionHead = $("#session .session-head");
  if (!sessionHead) return null;
  let root = $("#live-mission");
  if (!root) {
    root = document.createElement("section");
    root.id = "live-mission";
    root.className = "lm-strip";
    root.setAttribute("aria-label", "Live mission route");
    sessionHead.insertAdjacentElement("afterend", root);
  }
  return root;
}

function render(attempt = null) {
  if (!activeProfile || !$("#session")?.classList.contains("active")) return;
  const root = ensureLiveMission();
  if (!root) return;
  if ($("#session")?.dataset.assessmentMode === "true") {
    root.hidden = true;
    root.replaceChildren();
    return;
  }
  root.hidden = false;

  const state = liveMissionState({
    progress: currentProgress(),
    micro: currentMicro(),
    attempt,
    flags: currentFlags()
  });

  root.dataset.reaction = state.reaction;
  root.innerHTML = `<div class="lm-copy">
      <span class="lm-status">${state.objective.status}</span>
      <strong>${state.objective.title}</strong>
      <small>${state.objective.cue}</small>
    </div>
    <div class="lm-route" aria-label="${Math.round(state.progress)} percent of mission route complete">
      <div class="lm-stars" aria-hidden="true"></div>
      <div class="lm-route-line" aria-hidden="true"><span style="width:${state.progress}%"></span></div>
      <div class="lm-ship-position" style="left:${state.progress}%">${shipMarkup()}</div>
      <span class="lm-origin" aria-hidden="true"></span><span class="lm-destination" aria-hidden="true"></span>
    </div>
    <div class="lm-meta"><span>${destinationCopy()}</span><span class="lm-reaction" role="status" aria-live="polite">${attempt ? state.reactionText : "On course."}</span></div>`;

  if (attempt) {
    clearTimeout(reactionTimer);
    reactionTimer = setTimeout(() => {
      const node = $("#live-mission");
      if (!node) return;
      node.dataset.reaction = "steady";
      const copy = node.querySelector(".lm-reaction");
      if (copy) copy.textContent = "On course.";
    }, 1250);
  }
}

function arrivalPulse() {
  if (!$("#results")?.classList.contains("active")) return;
  const card = $("#starship-result");
  if (!card) return;
  card.classList.remove("lm-arrival");
  requestAnimationFrame(() => card.classList.add("lm-arrival"));
  setTimeout(() => card.classList.remove("lm-arrival"), 900);
}

function hide() {
  const root = $("#live-mission");
  if (root) root.hidden = true;
}

function showAndRender() {
  const root = ensureLiveMission();
  if (root) root.hidden = false;
  render();
}

function setProfile(profileId) {
  if (!PROFILE_IDS.has(profileId)) return;
  activeProfile = profileId;
  lastAttemptCount = Array.isArray(mathProfile().attempts) ? mathProfile().attempts.length : 0;
}

function renderLatestAttempt() {
  if (!activeProfile) return;
  if ($("#session")?.dataset.assessmentMode === "true") return;
  const attempts = Array.isArray(mathProfile().attempts) ? mathProfile().attempts : [];
  if (attempts.length <= lastAttemptCount) return;
  lastAttemptCount = attempts.length;
  render(attempts.at(-1));
}

function observeLearningUi() {
  if (observer) observer.disconnect();
  const targets = [$("#progress-fill"), $("#skill-tag"), $("#session-mode")].filter(Boolean);
  if (!targets.length) return;
  observer = new MutationObserver(() => queueMicrotask(render));
  targets.forEach(node => observer.observe(node, { attributes: true, childList: true, subtree: true, characterData: true }));
}

document.addEventListener("click", event => {
  const profile = event.target.closest("[data-profile]");
  if (profile) {
    setProfile(profile.dataset.profile);
    return;
  }

  const start = event.target.closest("[data-start], [data-resume]");
  if (start && activeProfile) {
    lastAttemptCount = Array.isArray(mathProfile().attempts) ? mathProfile().attempts.length : 0;
    setTimeout(showAndRender, 0);
    return;
  }

  if (event.target.closest("[data-next]")) setTimeout(() => {
    render();
    arrivalPulse();
  }, 0);

  if (event.target.closest("[data-action='switch'], [data-action='confirm-exit']")) {
    hide();
    if (event.target.closest("[data-action='switch']")) activeProfile = null;
  }
});

$("#answer-form")?.addEventListener("submit", () => setTimeout(renderLatestAttempt, 0));
window.addEventListener("storage", event => {
  if ((event.key === MATH_KEY || event.key === GAME_KEY) && activeProfile) render();
});
window.addEventListener("mathmission:cloud-updated", () => render());

observeLearningUi();
