import { MISSION_PATCHES, ROUTE_STOPS, patchState, routeState } from "./starship-progression-core.mjs?v=20260903-chart1";

const MATH_KEY = "mathmission.m1.v1";
const PROFILE_IDS = new Set(["luke", "samantha"]);
let activeProfile = null;

const $ = selector => document.querySelector(selector);

function readMathProfile(profileId = activeProfile) {
  if (!PROFILE_IDS.has(profileId)) return {};
  try {
    const root = JSON.parse(localStorage.getItem(MATH_KEY)) || {};
    return root?.[profileId] || {};
  } catch {
    return {};
  }
}

function routeNode(stop, index, route) {
  const reached = route.reached[index];
  const current = route.currentIndex === index;
  const state = current ? "Current" : reached ? "Reached" : "Uncharted";
  return `<li class="ssp-route-node ${reached ? "is-reached" : ""} ${current ? "is-current" : ""}">
    <span class="ssp-route-dot" aria-hidden="true"></span>
    <div><strong>${stop.name}</strong><small>${state} · ${stop.note}</small></div>
  </li>`;
}

function ensureChart() {
  const dock = $("#starship-dock");
  if (!dock) return null;
  let chart = $("#starship-chart");
  if (!chart) {
    chart = document.createElement("section");
    chart.id = "starship-chart";
    chart.className = "ssp-chart";
    chart.setAttribute("aria-label", "Star chart");
    dock.insertAdjacentElement("afterend", chart);
  }
  return chart;
}

function renderChart() {
  if (!activeProfile || !$("#dashboard")?.classList.contains("active")) return;
  const chart = ensureChart();
  if (!chart) return;
  const route = routeState(readMathProfile());
  const patches = patchState(readMathProfile());
  const nextCopy = route.next
    ? `${Math.max(0, route.next.sessions - route.sessions)} mission${route.next.sessions - route.sessions === 1 ? "" : "s"} to ${route.next.name}`
    : "Deep Space is open";
  chart.innerHTML = `<details>
    <summary>
      <span><b>Star chart</b><small>${route.current.name} · ${nextCopy}</small></span>
      <span class="ssp-summary-count">${patches.unlockedCount}/${patches.total} patches</span>
    </summary>
    <div class="ssp-route-wrap">
      <div class="ssp-route-line" aria-hidden="true"><span style="width:${Math.round(((route.currentIndex + route.legProgress) / (ROUTE_STOPS.length - 1)) * 100)}%"></span></div>
      <ol class="ssp-route">${ROUTE_STOPS.map((stop, index) => routeNode(stop, index, route)).join("")}</ol>
    </div>
  </details>`;
}

function patchMarkup(patch) {
  return `<article class="ssp-patch ${patch.unlocked ? "is-unlocked" : "is-locked"}" aria-label="${patch.name}: ${patch.unlocked ? "earned" : "not yet earned"}">
    <span class="ssp-patch-mark" aria-hidden="true">${patch.unlocked ? patch.mark : "?"}</span>
    <div><strong>${patch.name}</strong><p>${patch.description}</p></div>
  </article>`;
}

function renderPatchWall() {
  if (!activeProfile) return;
  const dialog = $("#starship-hangar");
  if (!dialog) return;
  let wall = $("#starship-patches");
  if (!wall) {
    wall = document.createElement("section");
    wall.id = "starship-patches";
    wall.className = "ssp-patches";
    const note = dialog.querySelector(".ss-hangar-note");
    if (note) note.insertAdjacentElement("beforebegin", wall);
    else dialog.append(wall);
  }
  const state = patchState(readMathProfile());
  wall.innerHTML = `<div class="ssp-patches-head"><div><div class="ss-kicker">Mission patches</div><h3>Flight achievements</h3></div><strong>${state.unlockedCount}/${state.total}</strong></div>
    <div class="ssp-patch-grid">${state.patches.map(patchMarkup).join("")}</div>`;
}

function renderVisible() {
  renderChart();
  if ($("#starship-hangar")?.open) renderPatchWall();
}

function setProfile(profileId) {
  if (!PROFILE_IDS.has(profileId)) return;
  activeProfile = profileId;
  queueMicrotask(renderVisible);
}

document.addEventListener("click", event => {
  const profile = event.target.closest("[data-profile]");
  if (profile) {
    setProfile(profile.dataset.profile);
    return;
  }
  if (event.target.closest("[data-action='switch']")) {
    activeProfile = null;
    return;
  }
  if (event.target.closest("[data-action='dashboard'], [data-next]")) setTimeout(renderVisible, 0);
  if (event.target.closest("[data-ss-open-hangar]")) setTimeout(renderPatchWall, 0);
});

window.addEventListener("storage", event => {
  if (event.key === MATH_KEY) renderVisible();
});
window.addEventListener("mathmission:cloud-updated", renderVisible);
