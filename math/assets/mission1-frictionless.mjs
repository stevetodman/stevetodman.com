import { CURRENT_FOCUS } from "./mission1-focus.mjs?v=20260902-focus1";

const DATA_KEY = "mathmission.m1.v1";

const MICRO_BY_LABEL = new Map([
  ["Identify a decimal place", "place_digit"],
  ["Find a digit’s value", "place_value"],
  ["Multiply by powers of 10", "powers_multiply"],
  ["Divide by powers of 10", "powers_divide"],
  ["Convert metric units", "metric_conversion"],
  ["Read and write decimal forms", "decimal_forms"],
  ["Compare decimals", "decimal_compare"],
  ["Round decimals", "decimal_round"],
  ["Add decimals", "decimal_add"],
  ["Subtract decimals", "decimal_subtract"],
  ["Multiply decimals", "decimal_multiply"],
  ["Divide decimals", "decimal_divide"]
]);

function chartNumber(root) {
  const values = new Map();
  for (const cell of root.querySelectorAll(".pv-column[data-exponent]")) {
    const digits = [...cell.querySelectorAll(".pv-digit")].map(node => node.textContent || "").join("");
    if (digits) values.set(Number(cell.dataset.exponent), digits);
  }
  if (!values.size) return "";
  const exponents = [...values.keys()];
  const high = Math.max(0, ...exponents);
  const low = Math.min(0, ...exponents);
  let text = "";
  for (let exponent = high; exponent >= 0; exponent -= 1) text += values.get(exponent) || "0";
  if (low < 0) {
    text += ".";
    for (let exponent = -1; exponent >= low; exponent -= 1) text += values.get(exponent) || "0";
  }
  return String(Number(text));
}

function moveCount(root) {
  const text = root.querySelector(".pv-move-count")?.textContent || "";
  const match = text.match(/(\d+)\s+place/);
  return match ? Number(match[1]) : 0;
}

function syncChartAnswer(root) {
  root.querySelector(".pv-use-answer")?.remove();
  const input = document.querySelector("#answer-input");
  const label = document.querySelector("#answer-label");
  if (!input) return;
  const moved = moveCount(root);
  if (moved === 0) {
    if (input.dataset.chartOwned === "true") {
      input.value = "";
      input.readOnly = false;
      delete input.dataset.chartOwned;
      if (label) label.textContent = "Your answer";
    }
    return;
  }
  if (input.disabled) return;
  const value = chartNumber(root);
  if (!value) return;
  input.value = value;
  input.readOnly = true;
  input.dataset.chartOwned = "true";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  if (label) label.textContent = "Answer from your chart";
}

function syncDashboard(card) {
  if (!card?.querySelector('[data-start="practice"]')) return;
  const label = card.querySelector(".label");
  const heading = card.querySelector("h2");
  const description = [...card.querySelectorAll("p")].find(node => !node.classList.contains("mission-meta"));
  if (label) label.textContent = `Current focus · ${CURRENT_FOCUS.module} · ${CURRENT_FOCUS.lessons}`;
  if (heading) heading.textContent = CURRENT_FOCUS.title;
  if (description) description.textContent = "Math Mission will stay on the current lesson first, then bring back closely related review when it helps.";
}

function activeMicro() {
  const label = String(document.querySelector("#skill-tag")?.textContent || "").replace(/\s*·.*$/, "").trim();
  return MICRO_BY_LABEL.get(label) || null;
}

function inferMisconception() {
  const micro = activeMicro();
  const workspace = document.querySelector("#place-value-workspace:not([hidden])");
  if (workspace) {
    const status = workspace.querySelector(".pv-status");
    if (status?.classList.contains("needs-check")) return "wrong_direction";
    if (moveCount(workspace) > 0 && !status?.classList.contains("ready")) return "wrong_shift_count";
    return "place_value_result";
  }
  return ({
    place_digit: "place_identification",
    place_value: "digit_value",
    metric_conversion: "unit_scale_relation",
    decimal_forms: "decimal_form_place_value",
    decimal_compare: "comparison_relation",
    decimal_round: "rounding_rule",
    decimal_add: "addition_place_value_or_computation",
    decimal_subtract: "subtraction_place_value_or_computation",
    decimal_multiply: "multiplication_place_value_or_computation",
    decimal_divide: "division_place_value_or_computation"
  })[micro] || "unknown_misconception";
}

function selectedProfile() {
  const name = String(document.querySelector("#learner-pill")?.textContent || "").trim().toLowerCase();
  return name === "luke" || name === "samantha" ? name : null;
}

function annotateLatestIncorrectAttempt(profileName, misconception) {
  if (!profileName || !misconception) return;
  try {
    const data = JSON.parse(localStorage.getItem(DATA_KEY) || "{}");
    const attempts = data?.[profileName]?.attempts;
    if (!Array.isArray(attempts) || !attempts.length) return;
    const latest = attempts.at(-1);
    if (!latest || latest.correct || latest.misconception) return;
    latest.misconception = misconception;
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("mathmission:evidence-updated", { detail: { profile: profileName, misconception } }));
  } catch {}
}

function install() {
  const workspace = document.querySelector("#place-value-workspace");
  if (workspace) {
    const observer = new MutationObserver(() => requestAnimationFrame(() => syncChartAnswer(workspace)));
    observer.observe(workspace, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class", "disabled"] });
    workspace.addEventListener("click", event => {
      if (!event.target.closest("[data-pv-shift], [data-pv-reset]")) return;
      requestAnimationFrame(() => syncChartAnswer(workspace));
    });
  }

  const card = document.querySelector("#primary-card");
  if (card) {
    new MutationObserver(() => syncDashboard(card)).observe(card, { childList: true, subtree: true });
    syncDashboard(card);
  }

  const form = document.querySelector("#answer-form");
  if (form) {
    form.addEventListener("submit", () => {
      const profile = selectedProfile();
      const misconception = inferMisconception();
      setTimeout(() => annotateLatestIncorrectAttempt(profile, misconception), 0);
    }, true);
  }
}

if (typeof document !== "undefined") install();

export { chartNumber, inferMisconception, syncDashboard };
