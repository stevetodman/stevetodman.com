export function parseOrderItems(text) {
  return String(text || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
}

export function sequenceAnswer(items) {
  return items.join(", ");
}

const PLACE_NAMES = {
  0: "ones",
  [-1]: "tenths",
  [-2]: "hundredths",
  [-3]: "thousandths"
};

const METRIC_RELATIONSHIPS = {
  "meters|centimeters": { operation: "multiply", exponent: 2 },
  "kilometers|meters": { operation: "multiply", exponent: 3 },
  "centimeters|millimeters": { operation: "multiply", exponent: 1 },
  "centimeters|meters": { operation: "divide", exponent: 2 },
  "millimeters|centimeters": { operation: "divide", exponent: 1 },
  "meters|kilometers": { operation: "divide", exponent: 3 },
  "millimeters|meters": { operation: "divide", exponent: 3 }
};

const SUPERSCRIPTS = { 1: "¹", 2: "²", 3: "³" };

function cleanDecimal(value) {
  return String(Number(Number(value).toFixed(6)));
}

export function metricRelationship(from, to) {
  return METRIC_RELATIONSHIPS[`${String(from || "").toLowerCase()}|${String(to || "").toLowerCase()}`] || null;
}

export function relationshipResult(value, operation, exponent) {
  const factor = 10 ** Number(exponent);
  const start = Number(value);
  return cleanDecimal(operation === "divide" ? start / factor : start * factor);
}

export function powerOfTenLabel(operation, exponent) {
  return `${operation === "divide" ? "÷" : "×"} 10${SUPERSCRIPTS[exponent] || `^${exponent}`}`;
}

export function expandedFormGroups(text) {
  const match = String(text || "").trim().match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return [];
  const [whole, fraction = ""] = [match[1], match[2] || ""];
  const groups = [];

  for (let index = 0; index < whole.length; index += 1) {
    const digit = Number(whole[index]);
    if (!digit) continue;
    const exponent = whole.length - index - 1;
    const correct = cleanDecimal(digit * (10 ** exponent));
    const candidates = [
      correct,
      cleanDecimal(digit * (10 ** Math.max(-3, exponent - 1))),
      cleanDecimal(digit * (10 ** Math.max(-3, exponent - 2)))
    ];
    groups.push({ digit, place: exponent === 0 ? "ones" : `10^${exponent}`, correct, choices: [...new Set(candidates)] });
  }

  for (let index = 0; index < Math.min(3, fraction.length); index += 1) {
    const digit = Number(fraction[index]);
    if (!digit) continue;
    const exponent = -(index + 1);
    const correct = cleanDecimal(digit * (10 ** exponent));
    const candidates = [
      cleanDecimal(digit * (10 ** Math.min(0, exponent + 1))),
      correct,
      cleanDecimal(digit * (10 ** Math.max(-3, exponent - 1)))
    ];
    groups.push({ digit, place: PLACE_NAMES[exponent], correct, choices: [...new Set(candidates)] });
  }

  return groups;
}

function enhanceComparison() {
  const body = document.querySelector("#question-body");
  const area = document.querySelector("#answer-area");
  if (!body || !area || area.dataset.lowFriction) return;
  if (!/choose the true comparison/i.test(body.textContent || "")) return;

  const buttons = [...area.querySelectorAll(".choice[data-value]")];
  if (buttons.length !== 3) return;
  const parsed = buttons.map(button => String(button.dataset.value || "").match(/^\s*(.+?)\s*([<>=])\s*(.+?)\s*$/));
  if (parsed.some(match => !match)) return;
  const left = parsed[0][1], right = parsed[0][3];
  if (!parsed.every(match => match[1] === left && match[3] === right)) return;

  area.dataset.lowFriction = "comparison";
  const prompt = document.createElement("div");
  prompt.className = "scaffold-note";
  prompt.innerHTML = `<strong>${left}</strong> &nbsp; ? &nbsp; <strong>${right}</strong>`;
  prompt.setAttribute("aria-label", `Compare ${left} and ${right}`);

  const instruction = document.createElement("p");
  instruction.className = "answer-label";
  instruction.textContent = "Choose the correct symbol";

  const grid = area.querySelector(".choice-grid");
  if (grid) grid.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
  buttons.forEach((button, index) => {
    const symbol = parsed[index][2];
    button.textContent = symbol;
    button.style.fontSize = "1.55rem";
    button.setAttribute("aria-label", `${left} ${symbol === "<" ? "is less than" : symbol === ">" ? "is greater than" : "equals"} ${right}`);
  });
  area.prepend(prompt, instruction);
}

function enhanceMetricConversion() {
  const body = document.querySelector("#question-body");
  const area = document.querySelector("#answer-area");
  const input = document.querySelector("#answer-input");
  if (!body || !area || !input || area.dataset.lowFriction) return;

  const text = String(body.textContent || "").replace(/\s+/g, " ").trim();
  const match = text.match(/^Convert\s+([0-9]+(?:\.[0-9]+)?)\s+(kilometers|meters|centimeters|millimeters)\s+to\s+(kilometers|meters|centimeters|millimeters)\b/i);
  if (!match) return;
  const start = Number(match[1]), from = match[2].toLowerCase(), to = match[3].toLowerCase();
  if (!metricRelationship(from, to)) return;

  area.dataset.lowFriction = "metric";
  const label = document.querySelector("#answer-label");
  if (label) label.hidden = true;
  input.type = "hidden";
  input.value = "";

  const instruction = document.createElement("p");
  instruction.className = "answer-label";
  instruction.textContent = `How do you rename ${from} as ${to}?`;

  const grid = document.createElement("div");
  grid.className = "choice-grid";
  grid.setAttribute("aria-label", "Choose a power-of-ten relationship");

  const preview = document.createElement("div");
  preview.className = "scaffold-note";
  preview.setAttribute("aria-live", "polite");
  preview.textContent = "Choose × or ÷ and the power of 10. The app will handle the typing.";

  const check = document.querySelector("#check-button");
  if (check) check.disabled = true;

  ["multiply", "divide"].forEach(operation => {
    [1, 2, 3].forEach(exponent => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.textContent = powerOfTenLabel(operation, exponent);
      button.addEventListener("click", () => {
        [...grid.querySelectorAll(".choice")].forEach(item => item.classList.remove("selected"));
        button.classList.add("selected");
        const result = relationshipResult(start, operation, exponent);
        input.value = result;
        preview.innerHTML = `<strong>${cleanDecimal(start)} ${powerOfTenLabel(operation, exponent)} = ${result}</strong>`;
        if (check) check.disabled = false;
      });
      grid.appendChild(button);
    });
  });

  area.prepend(instruction, grid, preview);
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

function enhanceExpandedForm() {
  const body = document.querySelector("#question-body");
  const area = document.querySelector("#answer-area");
  const input = document.querySelector("#answer-input");
  if (!body || !area || !input || area.dataset.lowFriction) return;
  if (!/expanded form using decimals/i.test(body.textContent || "")) return;

  const numberText = body.querySelector(".math")?.textContent?.trim();
  const groups = expandedFormGroups(numberText);
  if (!groups.length) return;

  area.dataset.lowFriction = "expanded";
  const label = document.querySelector("#answer-label");
  if (label) label.hidden = true;
  input.type = "hidden";
  input.value = "";

  const instruction = document.createElement("p");
  instruction.className = "answer-label";
  instruction.textContent = "Choose what each nonzero digit is worth";

  const builder = document.createElement("div");
  const preview = document.createElement("div");
  preview.className = "scaffold-note";
  preview.setAttribute("aria-live", "polite");
  const check = document.querySelector("#check-button");
  const selections = new Array(groups.length).fill("");

  groups.forEach((group, groupIndex) => {
    const section = document.createElement("section");
    section.style.marginBottom = "12px";

    const heading = document.createElement("div");
    heading.className = "answer-label";
    heading.textContent = `Digit ${group.digit} in the ${group.place} place`;

    const grid = document.createElement("div");
    grid.className = "choice-grid";
    grid.setAttribute("aria-label", `Value of digit ${group.digit} in the ${group.place} place`);

    group.choices.forEach(value => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.textContent = value;
      button.addEventListener("click", () => {
        [...grid.querySelectorAll(".choice")].forEach(item => item.classList.remove("selected"));
        button.classList.add("selected");
        selections[groupIndex] = value;
        const complete = selections.every(Boolean);
        input.value = complete ? sequenceAnswer(selections).replaceAll(", ", " + ") : "";
        preview.textContent = selections.filter(Boolean).length
          ? `Your expanded form: ${selections.filter(Boolean).join(" + ")}`
          : "Choose one value for each nonzero digit.";
        if (check) check.disabled = !complete;
      });
      grid.appendChild(button);
    });

    section.append(heading, grid);
    builder.appendChild(section);
  });

  preview.textContent = "Choose one value for each nonzero digit.";
  if (check) check.disabled = true;
  area.prepend(instruction, builder, preview);
}

function enhance() {
  enhanceComparison();
  enhanceMetricConversion();
  enhanceDecimalOrdering();
  enhanceExpandedForm();
}

if (typeof document !== "undefined") {
  const area = document.querySelector("#answer-area");
  if (area) {
    new MutationObserver(records => {
      if (records.some(record => record.removedNodes.length)) {
        delete area.dataset.lowFriction;
      }
      enhance();
    }).observe(area, { childList: true });
    enhance();
  }
}
