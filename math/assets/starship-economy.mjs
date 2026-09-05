import {
  CATALOG,
  GAME_KEY,
  GAME_VERSION,
  deriveProgress,
  equipItem,
  purchaseItem,
  sanitizeGameProfile,
  xpForAttempt
} from "./starship-economy-core.mjs?v=20260905-economy3";

const MATH_KEY = "mathmission.m1.v1";
const PROFILE_IDS = new Set(["luke", "samantha"]);
let activeProfile = null;
let sessionSnapshot = null;
let lastAttemptCount = 0;
let lastRenderedSession = -1;
let toastTimer = null;

const $ = selector => document.querySelector(selector);

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

function mathProfile(profileId = activeProfile) {
  if (!PROFILE_IDS.has(profileId)) return {};
  const all = readJson(MATH_KEY, {});
  return all?.[profileId] || {};
}

function readGameRoot() {
  const raw = readJson(GAME_KEY, {});
  return raw && typeof raw === "object" ? raw : {};
}

function gameProfile(profileId = activeProfile) {
  const root = readGameRoot();
  return sanitizeGameProfile(root?.profiles?.[profileId] || {});
}

function saveGameProfile(profileId, profile) {
  if (!PROFILE_IDS.has(profileId)) return;
  const root = readGameRoot();
  const profiles = root?.profiles && typeof root.profiles === "object" ? root.profiles : {};
  const next = { version: GAME_VERSION, profiles: { ...profiles, [profileId]: sanitizeGameProfile(profile) } };
  try { localStorage.setItem(GAME_KEY, JSON.stringify(next)); } catch {}
}

function progress(profileId = activeProfile) {
  return deriveProgress(mathProfile(profileId), gameProfile(profileId));
}

function shipMarkup(equipped, compact = false) {
  const hull = CATALOG[equipped?.hull] ? equipped.hull : "comet-scout";
  const trail = CATALOG[equipped?.trail] ? equipped.trail : "ion-wake";
  const companion = CATALOG[equipped?.companion] ? equipped.companion : "none";
  return `<div class="ss-ship ${compact ? "ss-ship-compact" : ""} ss-hull-${hull} ss-trail-${trail} ss-companion-${companion}" aria-hidden="true">
    <span class="ss-engine-trail"></span>
    <span class="ss-wing ss-wing-left"></span><span class="ss-wing ss-wing-right"></span>
    <span class="ss-hull"><span class="ss-canopy"></span><span class="ss-engine"></span></span>
    <span class="ss-companion"></span>
  </div>`;
}

function sectorCopy(sector, sessions) {
  if (!sector.nextAt) return "Deep-space route open";
  const remaining = Math.max(0, sector.nextAt - sessions);
  return remaining === 1 ? "1 mission to the next sector" : `${remaining} missions to the next sector`;
}

function ensureDock() {
  const card = $("#primary-card");
  if (!card) return null;
  let dock = $("#starship-dock");
  if (!dock) {
    dock = document.createElement("section");
    dock.id = "starship-dock";
    dock.className = "ss-dock";
    dock.setAttribute("aria-label", "Starship progress");
    card.insertAdjacentElement("afterend", dock);
  }
  return dock;
}

function renderDashboard() {
  if (!activeProfile || !$("#dashboard")?.classList.contains("active")) return;
  const p = progress();
  const dock = ensureDock();
  if (!dock) return;
  const lp = p.levelProgress;
  dock.innerHTML = `<div class="ss-dock-visual">${shipMarkup(p.equipped)}</div>
    <div class="ss-dock-copy">
      <div class="ss-kicker">Starship route · ${p.sector.name}</div>
      <div class="ss-dock-title"><strong>Level ${p.level}</strong><span>${p.credits} Star Credits</span></div>
      <div class="ss-level-track" aria-label="${lp.current} of ${lp.needed} XP toward the next level"><span style="width:${Math.max(0, Math.min(100, lp.percent))}%"></span></div>
      <div class="ss-dock-meta"><span>${lp.current}/${lp.needed} Navigation XP</span><span>${sectorCopy(p.sector, p.sessions)}</span></div>
      <button class="ss-secondary" type="button" data-ss-open-hangar>Open hangar</button>
    </div>`;
}

function ensureResultCard() {
  const analysis = $("#result-analysis");
  if (!analysis) return null;
  let card = $("#starship-result");
  if (!card) {
    card = document.createElement("section");
    card.id = "starship-result";
    card.className = "ss-result";
    card.setAttribute("aria-label", "Starship rewards");
    analysis.insertAdjacentElement("afterend", card);
  }
  return card;
}

function renderResults() {
  if (!activeProfile || !$("#results")?.classList.contains("active")) return;
  const p = progress();
  const card = ensureResultCard();
  if (!card) return;
  const snapshot = sessionSnapshot;
  const earnedXp = snapshot ? Math.max(0, p.xp - snapshot.xp) : 0;
  const earnedCredits = snapshot ? Math.max(0, p.creditsEarned - snapshot.creditsEarned) : 0;
  const levelUp = snapshot && p.level > snapshot.level;
  card.innerHTML = `<div class="ss-result-ship">${shipMarkup(p.equipped, true)}</div>
    <div class="ss-result-copy">
      <div class="ss-kicker">Flight log · ${p.sector.name}</div>
      <strong>${levelUp ? `Level ${p.level} reached` : "Route advanced"}</strong>
      <div class="ss-reward-row"><span>+${earnedXp} Navigation XP</span><span>+${earnedCredits} Star Credits</span></div>
      <p>${earnedCredits ? "Credits are ready for ship upgrades in the hangar." : "Your starship progress stays separate from your math mastery."}</p>
      <button class="ss-secondary" type="button" data-ss-open-hangar>Visit hangar</button>
    </div>`;
  lastRenderedSession = p.sessions;
}

function itemState(item, p) {
  if (item.starter) return { owned: true, equipped: p.equipped[item.slot] === item.id };
  return { owned: !!p.purchases[item.id], equipped: p.equipped[item.slot] === item.id };
}

function hangarItem(item, p) {
  const state = itemState(item, p);
  let action;
  if (state.equipped) action = `<button type="button" class="ss-store-action" disabled>Equipped</button>`;
  else if (state.owned) action = `<button type="button" class="ss-store-action" data-ss-equip="${item.id}">Equip</button>`;
  else action = `<button type="button" class="ss-store-action" data-ss-buy="${item.id}" ${p.credits < item.price ? "disabled" : ""}>${item.price} credits</button>`;
  return `<article class="ss-store-item ${state.equipped ? "is-equipped" : ""}">
    <div class="ss-store-preview ss-preview-${item.slot} ss-preview-${item.id}" aria-hidden="true"></div>
    <div><strong>${item.name}</strong><p>${item.description}</p></div>
    ${action}
  </article>`;
}

function ensureHangar() {
  let dialog = $("#starship-hangar");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.id = "starship-hangar";
  dialog.className = "ss-hangar";
  dialog.setAttribute("aria-labelledby", "starship-hangar-title");
  document.body.append(dialog);
  return dialog;
}

function renderHangar() {
  if (!activeProfile) return;
  const p = progress();
  const dialog = ensureHangar();
  const groups = ["hull", "trail", "companion"];
  const labels = { hull: "Ships", trail: "Engine wakes", companion: "Companions" };
  dialog.innerHTML = `<div class="ss-hangar-head">
      <div><div class="ss-kicker">Starship hangar</div><h2 id="starship-hangar-title">Build your ship</h2></div>
      <button type="button" class="ss-close" data-ss-close aria-label="Close hangar">×</button>
    </div>
    <div class="ss-hangar-balance"><strong>${p.credits}</strong><span>Star Credits</span></div>
    <div class="ss-hangar-hero">${shipMarkup(p.equipped)}<div><strong>Level ${p.level}</strong><span>${p.sector.name}</span></div></div>
    ${groups.map(slot => `<section class="ss-store-group"><h3>${labels[slot]}</h3><div class="ss-store-grid">${Object.values(CATALOG).filter(item => item.slot === slot).map(item => hangarItem(item, p)).join("")}</div></section>`).join("")}
    <p class="ss-hangar-note">Upgrades are cosmetic only. They never change questions, difficulty, scoring, or mastery.</p>
    <div class="ss-hangar-actions"><button type="button" class="primary-button" data-ss-close>Done</button></div>`;
}

function openHangar() {
  if (!activeProfile) return;
  renderHangar();
  const dialog = ensureHangar();
  if (!dialog.open) dialog.showModal();
}

function closeHangar() {
  const dialog = $("#starship-hangar");
  if (dialog?.open) dialog.close();
}

function toast(message, kind = "good") {
  let node = $("#starship-toast");
  if (!node) {
    node = document.createElement("div");
    node.id = "starship-toast";
    node.className = "ss-toast";
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    document.body.append(node);
  }
  node.className = `ss-toast ${kind}`;
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.hidden = true; }, 1800);
}

function handleAttemptAfterSubmit() {
  if (!activeProfile) return;
  const profile = mathProfile();
  const attempts = Array.isArray(profile.attempts) ? profile.attempts : [];
  if (attempts.length <= lastAttemptCount) return;
  const latest = attempts.at(-1);
  lastAttemptCount = attempts.length;
  const xp = xpForAttempt(latest);
  if (xp > 0) {
    const suffix = latest.recovery ? " · recovery burn" : latest.recheck ? " · recheck" : latest.transfer ? " · transfer" : "";
    toast(`+${xp} Navigation XP${suffix}`);
    $("#session")?.classList.add("ss-thrust");
    setTimeout(() => $("#session")?.classList.remove("ss-thrust"), 420);
  }
}

function renderVisibleGameUi() {
  renderDashboard();
  const currentSessions = activeProfile ? progress().sessions : -1;
  if ($("#results")?.classList.contains("active") && currentSessions !== lastRenderedSession) renderResults();
}

function setProfile(profileId) {
  if (!PROFILE_IDS.has(profileId)) return;
  activeProfile = profileId;
  lastAttemptCount = Array.isArray(mathProfile().attempts) ? mathProfile().attempts.length : 0;
  lastRenderedSession = -1;
  queueMicrotask(renderVisibleGameUi);
}

$("#answer-form")?.addEventListener("submit", () => setTimeout(handleAttemptAfterSubmit, 0));

document.addEventListener("click", event => {
  const profileButton = event.target.closest("[data-profile]");
  if (profileButton) {
    setProfile(profileButton.dataset.profile);
    return;
  }

  const startButton = event.target.closest("[data-start]");
  if (startButton && activeProfile) {
    sessionSnapshot = progress();
    lastAttemptCount = Array.isArray(mathProfile().attempts) ? mathProfile().attempts.length : 0;
    lastRenderedSession = -1;
    return;
  }

  if (event.target.closest("[data-action='switch']")) {
    activeProfile = null;
    sessionSnapshot = null;
    closeHangar();
    return;
  }

  if (event.target.closest("[data-next], [data-action='dashboard']")) {
    setTimeout(renderVisibleGameUi, 0);
  }

  if (event.target.closest("[data-ss-open-hangar]")) {
    openHangar();
    return;
  }

  if (event.target.closest("[data-ss-close]")) {
    closeHangar();
    return;
  }

  const buy = event.target.closest("[data-ss-buy]");
  if (buy && activeProfile) {
    const result = purchaseItem(gameProfile(), mathProfile(), buy.dataset.ssBuy);
    if (!result.ok) {
      toast(result.reason === "not-enough-credits" ? "Not enough Star Credits yet." : "That upgrade is already handled.", "bad");
      return;
    }
    saveGameProfile(activeProfile, result.profile);
    toast(`${result.item.name} added and equipped.`);
    renderHangar();
    renderDashboard();
    renderResults();
    return;
  }

  const equip = event.target.closest("[data-ss-equip]");
  if (equip && activeProfile) {
    const result = equipItem(gameProfile(), equip.dataset.ssEquip);
    if (!result.ok) {
      toast("That upgrade is not owned yet.", "bad");
      return;
    }
    saveGameProfile(activeProfile, result.profile);
    toast(`${result.item.name} equipped.`);
    renderHangar();
    renderDashboard();
    renderResults();
  }
});

window.addEventListener("storage", event => {
  if (event.key === MATH_KEY || event.key === GAME_KEY) renderVisibleGameUi();
});
window.addEventListener("mathmission:cloud-updated", renderVisibleGameUi);
