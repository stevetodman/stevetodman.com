export function parseOrderItems(text) {
  return String(text || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
}

export function sequenceAnswer(items) {
  return items.join(", ");
}

function enhanceDecimalOrdering() {
  const body = document.querySelector("#question-body");
  const area = document.querySelector("#answer-area");
  const input = document.querySelector("#answer-input");
  if (!body || !area || !input || area.dataset.lowFriction === "order") return;
  if (!/order from least to greatest/i.test(body.textContent || "")) return;

  const items = parseOrderItems(body.querySelector(".math")?.textContent);
  if (items.length < 2) return;

  area.dataset.lowFriction = "order";
  const label = document.querySelector("#answer-label");
  if (label) label.hidden = true;
  input.type = "hidden";
  input.value = "";

  const instruction = document.createElement("p");
  instruction.className = "answer-label";
  instruction.textContent = "Tap the numbers from least to greatest";

  const grid = document.createElement("div");
  grid.className = "choice-grid";
  grid.setAttribute("aria-label", "Numbers to put in order");

  const preview = document.createElement("div");
  preview.className = "scaffold-note";
  preview.setAttribute("aria-live", "polite");

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "12px";
  actions.style.marginBottom = "12px";

  const undo = document.createElement("button");
  undo.type = "button";
  undo.className = "back";
  undo.textContent = "Undo last";

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "back";
  reset.textContent = "Reset order";

  actions.append(undo, reset);
  area.prepend(instruction, grid, preview, actions);

  const selected = [];
  const buttons = new Map();
  const check = document.querySelector("#check-button");

  function render() {
    input.value = sequenceAnswer(selected);
    preview.textContent = selected.length
      ? `Your order: ${selected.join(" → ")}`
      : "Tap the smallest number first.";
    undo.disabled = selected.length === 0;
    reset.disabled = selected.length === 0;
    if (check) check.disabled = selected.length !== items.length;
  }

  items.forEach(value => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = value;
    button.addEventListener("click", () => {
      if (button.disabled) return;
      selected.push(value);
      button.disabled = true;
      button.classList.add("selected");
      render();
    });
    buttons.set(value, button);
    grid.appendChild(button);
  });

  undo.addEventListener("click", () => {
    const value = selected.pop();
    if (value !== undefined) {
      const button = buttons.get(value);
      if (button) {
        button.disabled = false;
        button.classList.remove("selected");
      }
    }
    render();
  });

  reset.addEventListener("click", () => {
    selected.splice(0);
    buttons.forEach(button => {
      button.disabled = false;
      button.classList.remove("selected");
    });
    render();
  });

  render();
}

function enhance() {
  enhanceDecimalOrdering();
}

if (typeof document !== "undefined") {
  const area = document.querySelector("#answer-area");
  if (area) {
    new MutationObserver(enhance).observe(area, { childList: true });
    enhance();
  }
}
