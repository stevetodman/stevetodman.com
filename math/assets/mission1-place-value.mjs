export const PLACE_VALUE_COLUMNS = [
  { exponent: 6, label: "Millions", short: "M" },
  { exponent: 5, label: "Hundred thousands", short: "HTh" },
  { exponent: 4, label: "Ten thousands", short: "TTh" },
  { exponent: 3, label: "Thousands", short: "Th" },
  { exponent: 2, label: "Hundreds", short: "H" },
  { exponent: 1, label: "Tens", short: "T" },
  { exponent: 0, label: "Ones", short: "O" },
  { exponent: -1, label: "Tenths", short: "t" },
  { exponent: -2, label: "Hundredths", short: "h" },
  { exponent: -3, label: "Thousandths", short: "th" }
];

const MIN_EXPONENT = PLACE_VALUE_COLUMNS.at(-1).exponent;
const MAX_EXPONENT = PLACE_VALUE_COLUMNS[0].exponent;

function plainNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");
  return number.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 6 });
}

export function placeValueTokensFor(value) {
  const text = plainNumber(value);
  const [integerRaw, fractionRaw = ""] = text.split(".");
  const integer = integerRaw.replace(/^[-+]/, "");
  const tokens = [];
  for (let index = 0; index < integer.length; index += 1) {
    const exponent = integer.length - index - 1;
    if (exponent <= MAX_EXPONENT) tokens.push({ digit: integer[index], exponent });
  }
  for (let index = 0; index < Math.min(3, fractionRaw.length); index += 1) {
    tokens.push({ digit: fractionRaw[index], exponent: -(index + 1) });
  }
  return tokens.length ? tokens : [{ digit: "0", exponent: 0 }];
}

export function shiftPlaceValueTokens(tokens, delta) {
  return tokens.map(token => ({ ...token, exponent: token.exponent + delta }));
}

export function placeValueNumberForTokens(tokens) {
  const total = tokens.reduce((sum, token) => sum + Number(token.digit) * (10 ** token.exponent), 0);
  return plainNumber(total);
}

export function expectedPlaceValueDelta(workspace) {
  return workspace.operation === "multiply" ? workspace.shift : -workspace.shift;
}

// Keep the chart small enough to read before asking a child to scroll. Two
// nearby empty places on either side leave room for a move without rendering a
// permanently wide ten-column worksheet.
export function visiblePlaceValueColumns(tokens, padding = 2) {
  const exponents = tokens.map(token => token.exponent);
  const highest = Math.min(MAX_EXPONENT, Math.max(...exponents) + padding);
  const lowest = Math.max(MIN_EXPONENT, Math.min(...exponents) - padding);
  return PLACE_VALUE_COLUMNS.filter(column => column.exponent <= highest && column.exponent >= lowest);
}

function directionWord(delta) {
  return delta > 0 ? "left" : "right";
}

function valueChange(workspace) {
  return workspace.operation === "multiply"
    ? `${workspace.factor.toLocaleString()} times as valuable`
    : `1/${workspace.factor.toLocaleString()} as valuable`;
}

export function createPlaceValueWorkspace({ root, onGuidedReady = () => {} }) {
  let question = null;
  let baseTokens = [];
  let delta = 0;
  let ready = false;

  function render() {
    if (!question?.workspace || question.workspace.type !== "place-value") {
      root.hidden = true;
      root.innerHTML = "";
      return;
    }

    const workspace = question.workspace;
    const guided = !!question.assisted;
    const expected = expectedPlaceValueDelta(workspace);
    const shifted = shiftPlaceValueTokens(baseTokens, delta);
    const columns = visiblePlaceValueColumns([...baseTokens, ...shifted]);
    const correctPosition = delta === expected;
    const locked = guided && correctPosition;
    const canLeft = !locked && shifted.every(token => token.exponent < MAX_EXPONENT);
    const canRight = !locked && shifted.every(token => token.exponent > MIN_EXPONENT);
    const wrongDirection = delta !== 0 && Math.sign(delta) !== Math.sign(expected);
    const canUseChartAnswer = delta !== 0 && (!guided || correctPosition);

    root.hidden = false;
    root.dataset.guided = String(guided);
    root.innerHTML = `
      <div class="pv-topline">
        <div>
          <span class="pv-kicker">${guided ? "Guided place-value step" : "Place-value workspace"}</span>
          <strong>${guided ? "Build the new value" : "Use the chart if it helps"}</strong>
        </div>
        <span class="pv-move-count" aria-live="polite">${Math.abs(delta)} place${Math.abs(delta) === 1 ? "" : "s"} ${delta === 0 ? "moved" : directionWord(delta)}</span>
      </div>
      <p class="pv-instruction">${guided
        ? `Move every digit one place at a time. The decimal point stays fixed.`
        : `Move the digits to reason about place value. The decimal point never moves.`}</p>
      <div class="pv-scroll" tabindex="0" aria-label="Place-value chart. Swipe horizontally if more columns are available.">
        <div class="pv-grid" style="--pv-columns:${columns.map(column => column.exponent === 0 ? "minmax(var(--pv-column-min), 1fr) var(--pv-decimal-width)" : "minmax(var(--pv-column-min), 1fr)").join(" ")}">
          ${columns.map(column => `
            <div class="pv-column" role="group" data-exponent="${column.exponent}" aria-label="${column.label}">
              <span class="pv-label">${column.label}</span>
              <div class="pv-slot">
                ${shifted.filter(token => token.exponent === column.exponent).map(token => `<span class="pv-digit">${token.digit}</span>`).join("")}
              </div>
            </div>
            ${column.exponent === 0 ? `<div class="pv-decimal" role="img" aria-label="Fixed decimal point"><span aria-hidden="true">.</span><small aria-hidden="true">fixed</small></div>` : ""}
          `).join("")}
        </div>
      </div>
      <p class="pv-scroll-hint" hidden>Swipe the chart to see the remaining columns.</p>
      <div class="pv-controls" aria-label="Move all digits one place">
        <button type="button" data-pv-shift="left" ${canLeft ? "" : "disabled"}>← Shift left</button>
        <button type="button" data-pv-reset ${delta === 0 || locked ? "disabled" : ""}>Reset</button>
        <button type="button" data-pv-shift="right" ${canRight ? "" : "disabled"}>Shift right →</button>
      </div>
      ${canUseChartAnswer ? '<button type="button" class="primary-button pv-use-answer" data-pv-use>Use chart answer</button>' : ""}
      <div class="pv-status ${wrongDirection ? "needs-check" : correctPosition && delta !== 0 ? "ready" : ""}" aria-live="polite">
        ${wrongDirection
          ? `${workspace.operation === "divide" ? "Division should make the number smaller." : "Multiplication should make the number larger."} Check the direction.`
          : correctPosition && delta !== 0
            ? `Exactly. Each digit is now ${valueChange(workspace)}. You can use the chart answer or type it yourself.`
            : guided
              ? `You need ${workspace.shift} place-value shift${workspace.shift === 1 ? "" : "s"}. Choose the direction by reasoning from the operation.`
              : `Each tap moves every digit exactly one place.`}
      </div>
    `;

    requestAnimationFrame(() => {
      const scroll = root.querySelector(".pv-scroll");
      const digits = [...root.querySelectorAll(".pv-digit")];
      if (!scroll || !digits.length) return;
      const first = Math.min(...digits.map(digit => digit.offsetLeft));
      const last = Math.max(...digits.map(digit => digit.offsetLeft + digit.offsetWidth));
      scroll.scrollLeft = Math.max(0, Math.round((first + last) / 2 - scroll.clientWidth / 2));
      const hint = root.querySelector(".pv-scroll-hint");
      if (hint) hint.hidden = scroll.scrollWidth <= scroll.clientWidth + 1;
    });

    if (guided && correctPosition && !ready) {
      ready = true;
      queueMicrotask(() => onGuidedReady(question));
    }
  }

  root.addEventListener("click", event => {
    if (!question?.workspace) return;
    const shift = event.target.closest("[data-pv-shift]")?.dataset.pvShift;
    if (shift) {
      delta += shift === "left" ? 1 : -1;
      ready = false;
      render();
      return;
    }
    if (event.target.closest("[data-pv-reset]")) {
      delta = 0;
      ready = false;
      render();
      return;
    }
    if (event.target.closest("[data-pv-use]")) {
      const input = root.ownerDocument.getElementById("answer-input");
      if (!input || input.disabled) return;
      input.value = placeValueNumberForTokens(shiftPlaceValueTokens(baseTokens, delta));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus({ preventScroll: true });
    }
  });

  return {
    setQuestion(nextQuestion) {
      question = nextQuestion;
      baseTokens = nextQuestion?.workspace ? placeValueTokensFor(nextQuestion.workspace.value) : [];
      delta = 0;
      ready = false;
      render();
      return !!nextQuestion?.workspace;
    },
    isReady() {
      return !question?.assisted || !question?.workspace || ready;
    },
    evidence() {
      const workspace = question?.workspace;
      if (!workspace || workspace.type !== "place-value") return null;
      const expectedDelta = expectedPlaceValueDelta(workspace);
      return {
        delta,
        expectedDelta,
        operation: workspace.operation,
        shift: workspace.shift,
        factor: workspace.factor,
        wrongDirection: delta !== 0 && Math.sign(delta) !== Math.sign(expectedDelta),
        correctPosition: delta === expectedDelta
      };
    },
    reset() {
      question = null;
      baseTokens = [];
      delta = 0;
      ready = false;
      render();
    }
  };
}
