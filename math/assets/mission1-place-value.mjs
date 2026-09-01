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

export function expectedPlaceValueDelta(workspace) {
  return workspace.operation === "multiply" ? workspace.shift : -workspace.shift;
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
    const correctPosition = delta === expected;
    const locked = guided && correctPosition;
    const canLeft = !locked && shifted.every(token => token.exponent < MAX_EXPONENT);
    const canRight = !locked && shifted.every(token => token.exponent > MIN_EXPONENT);
    const wrongDirection = delta !== 0 && Math.sign(delta) !== Math.sign(expected);

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
      <div class="pv-scroll" tabindex="0" aria-label="Place-value chart. Scroll horizontally if needed.">
        <div class="pv-grid" role="grid" aria-label="Place-value chart">
          ${PLACE_VALUE_COLUMNS.map(column => `
            <div class="pv-column" role="gridcell" data-exponent="${column.exponent}" aria-label="${column.label}">
              <span class="pv-label"><span class="pv-label-full">${column.label}</span><span class="pv-label-short">${column.short}</span></span>
              <div class="pv-slot">
                ${shifted.filter(token => token.exponent === column.exponent).map(token => `<span class="pv-digit">${token.digit}</span>`).join("")}
              </div>
            </div>
            ${column.exponent === 0 ? `<div class="pv-decimal" aria-label="Fixed decimal point"><span>.</span><small>fixed</small></div>` : ""}
          `).join("")}
        </div>
      </div>
      <div class="pv-controls" aria-label="Move all digits one place">
        <button type="button" data-pv-shift="left" ${canLeft ? "" : "disabled"}>← Shift left</button>
        <button type="button" data-pv-reset ${delta === 0 || locked ? "disabled" : ""}>Reset</button>
        <button type="button" data-pv-shift="right" ${canRight ? "" : "disabled"}>Shift right →</button>
      </div>
      <div class="pv-status ${wrongDirection ? "needs-check" : correctPosition && delta !== 0 ? "ready" : ""}" aria-live="polite">
        ${wrongDirection
          ? `${workspace.operation === "divide" ? "Division should make the number smaller." : "Multiplication should make the number larger."} Check the direction.`
          : correctPosition && delta !== 0
            ? `Exactly. Each digit is now ${valueChange(workspace)}. Now enter the number you built.`
            : guided
              ? `You need ${workspace.shift} place-value shift${workspace.shift === 1 ? "" : "s"}. Choose the direction by reasoning from the operation.`
              : `Each tap moves every digit exactly one place.`}
      </div>
    `;

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
    reset() {
      question = null;
      baseTokens = [];
      delta = 0;
      ready = false;
      render();
    }
  };
}
