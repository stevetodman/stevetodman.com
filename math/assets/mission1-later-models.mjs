const SUPPORTED = new Set(["decimal_round", "decimal_add", "decimal_subtract", "decimal_multiply", "decimal_divide"]);

const clean = value => String(Number(Number(value).toFixed(6)));
const fixed = (value, places) => Number(value).toFixed(Math.max(0, Number(places) || 0));

function placeLabel(exponent) {
  return ({ 3: "thousands", 2: "hundreds", 1: "tens", 0: "ones", [-1]: "tenths", [-2]: "hundredths", [-3]: "thousandths" })[exponent] || `10^${exponent}`;
}

function alignedRows(aScaled, bScaled, places, operation) {
  const divisor = 10 ** places;
  const a = fixed(aScaled / divisor, places);
  const b = fixed(bScaled / divisor, places);
  const integerPlaces = Math.max(a.split(".")[0].length, b.split(".")[0].length);
  const exponents = [];
  for (let exponent = integerPlaces - 1; exponent >= -places; exponent -= 1) exponents.push(exponent);

  function digitsFor(text) {
    const [whole, fraction = ""] = text.split(".");
    const paddedWhole = whole.padStart(integerPlaces, "0");
    const paddedFraction = fraction.padEnd(places, "0");
    return [...paddedWhole, ...paddedFraction];
  }

  return {
    operation,
    places,
    exponents,
    columns: exponents.map(placeLabel),
    a,
    b,
    aDigits: digitsFor(a),
    bDigits: digitsFor(b),
    symbol: operation === "add" ? "+" : "−"
  };
}

function roundingModel(question) {
  const audit = question?.audit;
  if (audit?.kind !== "round") return null;
  const digits = Number(audit.digits) || 0;
  const value = Number(audit.thousandths) / 1000;
  const unit = 10 ** (-digits);
  const lower = Math.floor((value + 1e-10) / unit) * unit;
  const upper = lower + unit;
  const midpoint = lower + unit / 2;
  const nearest = value < midpoint ? lower : upper;
  const position = unit ? ((value - lower) / unit) * 100 : 50;
  return {
    type: "rounding",
    title: "Rounding number line",
    value: clean(value),
    lower: clean(lower),
    upper: clean(upper),
    midpoint: clean(midpoint),
    nearest: clean(nearest),
    position: Math.max(0, Math.min(100, position)),
    place: placeLabel(-digits)
  };
}

function addSubModel(question) {
  const audit = question?.audit;
  if (!audit || !["add", "subtract"].includes(audit.kind)) return null;
  return {
    type: "aligned",
    title: audit.kind === "add" ? "Align like place values" : "Align and rename place values",
    ...alignedRows(Number(audit.aScaled), Number(audit.bScaled), Number(audit.places), audit.kind)
  };
}

function placeTerms(scaled, places) {
  const text = String(Math.abs(Number(scaled))).padStart(places + 1, "0");
  const wholeDigits = text.length - places;
  const terms = [];
  for (let index = 0; index < text.length; index += 1) {
    const digit = Number(text[index]);
    if (!digit) continue;
    const exponent = wholeDigits - index - 1;
    terms.push({ digit, exponent, place: placeLabel(exponent), value: digit * (10 ** exponent) });
  }
  return terms;
}

function multiplicationModel(question) {
  const audit = question?.audit;
  if (audit?.kind !== "product" || Number(audit.bPlaces) !== 0) return null;
  const factor = Number(audit.bScaled);
  const terms = placeTerms(Number(audit.aScaled), Number(audit.aPlaces)).map(term => ({
    ...term,
    valueText: clean(term.value),
    partial: clean(term.value * factor)
  }));
  return {
    type: "area",
    title: "Place-value area model",
    factor,
    multiplicand: clean(Number(audit.aScaled) / (10 ** Number(audit.aPlaces))),
    terms
  };
}

function divisionModel(question) {
  const audit = question?.audit;
  if (audit?.kind !== "quotient") return null;
  const places = Number(audit.dividendPlaces) || 0;
  const scaled = Number(audit.dividendScaled);
  const divisor = Number(audit.divisor);
  if (!Number.isFinite(scaled) || !Number.isFinite(divisor) || divisor === 0) return null;
  const dividend = scaled / (10 ** places);
  const unitName = placeLabel(-places);
  const quotientUnits = scaled / divisor;
  return {
    type: "sharing",
    title: "Share place-value units",
    dividend: clean(dividend),
    divisor,
    scaled,
    places,
    unitName,
    quotientUnits: clean(quotientUnits),
    quotient: clean(quotientUnits / (10 ** places))
  };
}

export function laterModelFor(question) {
  if (!question?.assisted || !SUPPORTED.has(question.micro)) return null;
  if (question.micro === "decimal_round") return roundingModel(question);
  if (question.micro === "decimal_add" || question.micro === "decimal_subtract") return addSubModel(question);
  if (question.micro === "decimal_multiply") return multiplicationModel(question);
  if (question.micro === "decimal_divide") return divisionModel(question);
  return null;
}

function button(label, action) {
  return `<button type="button" class="lesson-model-action" data-model-action="${action}">${label}</button>`;
}

function renderRounding(root, model) {
  root.innerHTML = `
    <div class="lesson-model-head"><span>Guided model</span><strong>${model.title}</strong></div>
    <p class="lesson-model-copy">Place <strong>${model.value}</strong> between the two nearest ${model.place} benchmarks.</p>
    <div class="round-line" aria-label="Number line from ${model.lower} to ${model.upper}">
      <span class="round-end round-low">${model.lower}</span>
      <span class="round-track"><i class="round-marker" style="left:${model.position}%" aria-label="${model.value}"></i><i class="round-mid" hidden></i></span>
      <span class="round-end round-high">${model.upper}</span>
    </div>
    <div class="lesson-model-actions">${button("Show midpoint", "midpoint")}${button(`Choose ${model.lower}`, "lower")}${button(`Choose ${model.upper}`, "upper")}</div>
    <div class="lesson-model-status" aria-live="polite">First locate the midpoint. Then decide which benchmark is closer.</div>`;

  root.addEventListener("click", event => {
    const action = event.target.closest("[data-model-action]")?.dataset.modelAction;
    if (!action) return;
    const status = root.querySelector(".lesson-model-status");
    if (action === "midpoint") {
      root.querySelector(".round-mid").hidden = false;
      status.innerHTML = `Midpoint: <strong>${model.midpoint}</strong>. Now compare ${model.value} with the midpoint.`;
      return;
    }
    const chosen = action === "lower" ? model.lower : model.upper;
    status.innerHTML = chosen === model.nearest
      ? `<strong>${chosen}</strong> is the nearer benchmark. Use that reasoning to enter the rounded value.`
      : `${chosen} is farther away. Compare ${model.value} with the midpoint ${model.midpoint}.`;
  }, { once: false });
}

function renderAligned(root, model) {
  const headers = model.columns.map(column => `<span>${column}</span>`).join("");
  const a = model.aDigits.map((digit, index) => `<button type="button" class="align-cell" data-column="${index}">${digit}</button>`).join("");
  const b = model.bDigits.map((digit, index) => `<button type="button" class="align-cell" data-column="${index}">${digit}</button>`).join("");
  root.innerHTML = `
    <div class="lesson-model-head"><span>Guided model</span><strong>${model.title}</strong></div>
    <p class="lesson-model-copy">Tap a column to trace the same place-value unit in both numbers.</p>
    <div class="align-model" style="--model-columns:${model.columns.length}">
      <div class="align-head">${headers}</div>
      <div class="align-row"><b></b>${a}</div>
      <div class="align-row"><b>${model.symbol}</b>${b}</div>
    </div>
    <div class="lesson-model-actions">${button("Show placeholder zeros", "zeros")}${button("Clear highlight", "clear")}</div>
    <div class="lesson-model-status" aria-live="polite">Decimal points line up because like units must stay in the same column.</div>`;

  root.addEventListener("click", event => {
    const cell = event.target.closest(".align-cell");
    const action = event.target.closest("[data-model-action]")?.dataset.modelAction;
    const cells = [...root.querySelectorAll(".align-cell")];
    const status = root.querySelector(".lesson-model-status");
    if (cell) {
      cells.forEach(item => item.classList.toggle("active", item.dataset.column === cell.dataset.column));
      const index = Number(cell.dataset.column);
      status.innerHTML = `Both digits are in the <strong>${model.columns[index]}</strong> column. Work with this place before moving to another.`;
    } else if (action === "zeros") {
      cells.forEach(item => item.classList.toggle("placeholder", item.textContent === "0"));
      status.textContent = "Placeholder zeros make missing decimal places visible without changing either value.";
    } else if (action === "clear") {
      cells.forEach(item => item.classList.remove("active", "placeholder"));
      status.textContent = "Choose any place-value column to compare the aligned units.";
    }
  });
}

function renderArea(root, model) {
  root.innerHTML = `
    <div class="lesson-model-head"><span>Guided model</span><strong>${model.title}</strong></div>
    <p class="lesson-model-copy">Decompose <strong>${model.multiplicand}</strong> by place value, then multiply each part by ${model.factor}.</p>
    <div class="area-model">${model.terms.map((term, index) => `<button type="button" class="area-cell" data-term="${index}"><span>${term.digit} ${term.place}</span><strong>${term.valueText} × ${model.factor}</strong><small hidden>${term.partial}</small></button>`).join("")}</div>
    <div class="lesson-model-actions">${button("Reveal all partial products", "all")}${button("Reset model", "reset")}</div>
    <div class="lesson-model-status" aria-live="polite">Tap one place-value part at a time. The total product is built from these partial products.</div>`;

  root.addEventListener("click", event => {
    const termButton = event.target.closest(".area-cell");
    const action = event.target.closest("[data-model-action]")?.dataset.modelAction;
    const buttons = [...root.querySelectorAll(".area-cell")];
    const status = root.querySelector(".lesson-model-status");
    const reveal = item => { item.classList.add("revealed"); item.querySelector("small").hidden = false; };
    if (termButton) {
      reveal(termButton);
      const term = model.terms[Number(termButton.dataset.term)];
      status.innerHTML = `${term.valueText} × ${model.factor} = <strong>${term.partial}</strong>. Keep the place-value unit attached to the computation.`;
    } else if (action === "all") {
      buttons.forEach(reveal);
      status.textContent = "All partial products are visible. Combine them, then use your estimate to check the decimal position.";
    } else if (action === "reset") {
      buttons.forEach(item => { item.classList.remove("revealed"); item.querySelector("small").hidden = true; });
      status.textContent = "Tap one place-value part at a time.";
    }
  });
}

function renderSharing(root, model) {
  root.innerHTML = `
    <div class="lesson-model-head"><span>Guided model</span><strong>${model.title}</strong></div>
    <p class="lesson-model-copy">Rename the dividend in a single place-value unit before sharing equally.</p>
    <div class="sharing-model">
      <button type="button" class="sharing-step" data-model-action="rename"><span>${model.dividend}</span><small>rename</small></button>
      <span aria-hidden="true">→</span>
      <button type="button" class="sharing-step" data-model-action="share" disabled><span>${model.scaled} ${model.unitName}</span><small>share among ${model.divisor}</small></button>
      <span aria-hidden="true">→</span>
      <div class="sharing-result" hidden><strong>${model.quotientUnits}</strong><span>${model.unitName} in each group</span></div>
    </div>
    <div class="lesson-model-status" aria-live="polite">Start by renaming ${model.dividend} as ${model.unitName} units.</div>`;

  root.addEventListener("click", event => {
    const action = event.target.closest("[data-model-action]")?.dataset.modelAction;
    const status = root.querySelector(".lesson-model-status");
    if (action === "rename") {
      const share = root.querySelector('[data-model-action="share"]');
      share.disabled = false;
      status.innerHTML = `${model.dividend} = <strong>${model.scaled} ${model.unitName}</strong>. Now share those units equally among ${model.divisor} groups.`;
    } else if (action === "share") {
      root.querySelector(".sharing-result").hidden = false;
      status.innerHTML = `${model.scaled} ${model.unitName} ÷ ${model.divisor} = <strong>${model.quotientUnits} ${model.unitName}</strong>. Rename those units back into standard form before entering the quotient.`;
    }
  });
}

export function createLaterSkillManipulative({ root }) {
  function setQuestion(question) {
    root.replaceChildren();
    root.hidden = true;
    const model = laterModelFor(question);
    if (!model) return false;
    root.hidden = false;
    root.dataset.modelType = model.type;
    if (model.type === "rounding") renderRounding(root, model);
    else if (model.type === "aligned") renderAligned(root, model);
    else if (model.type === "area") renderArea(root, model);
    else if (model.type === "sharing") renderSharing(root, model);
    return true;
  }
  return { setQuestion, reset() { root.replaceChildren(); root.hidden = true; delete root.dataset.modelType; } };
}
