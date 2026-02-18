"use strict";

(() => {
  const STORAGE_KEY = "mathlab.fractions.v1";
  let storageEnabled = true;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function storageGet(key) {
    if (!storageEnabled) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      storageEnabled = false;
      return null;
    }
  }

  function storageSet(key, value) {
    if (!storageEnabled) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      storageEnabled = false;
      return false;
    }
  }

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x || 1;
  }

  function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
  }

  function simplifyFraction(n, d) {
    const g = gcd(n, d);
    return { n: n / g, d: d / g, g };
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function parseIntSafe(value) {
    const s = String(value || "").trim();
    if (!/^\d+$/.test(s)) return null;
    return Number.parseInt(s, 10);
  }

  function setFeedback(el, kind, msg) {
    el.classList.remove("good", "bad");
    if (kind) el.classList.add(kind);
    el.textContent = msg;
  }

  function setWsFeedback(kind, msg) {
    const el = document.getElementById("ws-feedback");
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.classList.remove("good", "bad");
      el.textContent = "";
      return;
    }
    el.hidden = false;
    setFeedback(el, kind, msg);
  }

  function revealSteps(container, html) {
    container.innerHTML = html;
    container.hidden = false;
  }

  function hideSteps(container) {
    container.hidden = true;
    container.innerHTML = "";
  }

  function makeTapeSvg(num, den, opts = {}) {
    const template = document.getElementById("tape-template");
    const svg = template.content.firstElementChild.cloneNode(true);
    const w = 318;
    const h = 42;
    const inset = 8;
    const innerW = w - inset * 2;
    const y = 1 + inset / 2;
    const partH = h - inset;
    const rx = 10;

    const denInt = Math.trunc(den);
    const numInt = Math.trunc(num);
    if (!Number.isFinite(denInt) || !Number.isFinite(numInt) || denInt <= 0) {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", "14");
      label.setAttribute("y", "28");
      label.setAttribute("fill", "rgba(11,18,32,0.7)");
      label.setAttribute("font-size", "14");
      label.setAttribute("font-weight", "700");
      label.textContent = "Enter a valid fraction";
      svg.appendChild(label);
      return svg;
    }

    const maxParts = opts.maxParts ?? 24;
    if (denInt > maxParts) {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", "14");
      label.setAttribute("y", "28");
      label.setAttribute("fill", "rgba(11,18,32,0.7)");
      label.setAttribute("font-size", "14");
      label.setAttribute("font-weight", "700");
      label.textContent = `${numInt}/${denInt}`;
      svg.appendChild(label);
      return svg;
    }

    const partW = innerW / denInt;
    const safeNum = clamp(numInt, 0, denInt);

    for (let i = 0; i < denInt; i++) {
      const x = 1 + inset + i * partW;
      const r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("x", String(x));
      r.setAttribute("y", String(y));
      r.setAttribute("width", String(partW));
      r.setAttribute("height", String(partH));
      r.setAttribute("rx", String(rx));
      r.setAttribute("class", i < safeNum ? "tape-fill" : "tape-part");
      svg.appendChild(r);
    }

    return svg;
  }

  function makeNumberLineSvg(a, b, c, d) {
    const leftVal = a / b;
    const rightVal = c / d;

    const w = 420;
    const h = 120;
    const padX = 22;
    const y = 54;
    const x0 = padX;
    const x1 = w - padX;
    const lineW = x1 - x0;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("class", "tape");

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", "1");
    bg.setAttribute("y", "1");
    bg.setAttribute("width", String(w - 2));
    bg.setAttribute("height", String(h - 2));
    bg.setAttribute("rx", "18");
    bg.setAttribute("fill", "rgba(255,255,255,0.55)");
    bg.setAttribute("stroke", "rgba(11,18,32,0.14)");
    bg.setAttribute("stroke-width", "2");
    svg.appendChild(bg);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x0));
    line.setAttribute("x2", String(x1));
    line.setAttribute("y1", String(y));
    line.setAttribute("y2", String(y));
    line.setAttribute("stroke", "rgba(11,18,32,0.32)");
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-linecap", "round");
    svg.appendChild(line);

    const ticks = [0, 0.25, 0.5, 0.75, 1];
    for (const t of ticks) {
      const xt = x0 + t * lineW;
      const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
      tick.setAttribute("x1", String(xt));
      tick.setAttribute("x2", String(xt));
      tick.setAttribute("y1", String(y - 10));
      tick.setAttribute("y2", String(y + 10));
      tick.setAttribute("stroke", "rgba(11,18,32,0.18)");
      tick.setAttribute("stroke-width", "2");
      svg.appendChild(tick);
    }

    function dotAt(n, color, labelText, yOffset) {
      const x = x0 + n * lineW;

      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", String(x));
      dot.setAttribute("cy", String(y));
      dot.setAttribute("r", "7");
      dot.setAttribute("fill", color);
      dot.setAttribute("opacity", "0.9");
      svg.appendChild(dot);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", String(x));
      label.setAttribute("y", String(y + yOffset));
      label.setAttribute("fill", "rgba(11,18,32,0.78)");
      label.setAttribute("font-size", "14");
      label.setAttribute("font-weight", "800");
      label.setAttribute("text-anchor", "middle");
      label.textContent = labelText;
      svg.appendChild(label);
    }

    dotAt(leftVal, "rgba(15,118,110,0.85)", `${a}/${b}`, -18);
    dotAt(rightVal, "rgba(180,83,9,0.90)", `${c}/${d}`, 28);

    const end0 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    end0.setAttribute("x", String(x0));
    end0.setAttribute("y", String(y + 42));
    end0.setAttribute("fill", "rgba(11,18,32,0.70)");
    end0.setAttribute("font-size", "14");
    end0.setAttribute("font-weight", "800");
    end0.textContent = "0";
    svg.appendChild(end0);

    const end1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    end1.setAttribute("x", String(x1));
    end1.setAttribute("y", String(y + 42));
    end1.setAttribute("fill", "rgba(11,18,32,0.70)");
    end1.setAttribute("font-size", "14");
    end1.setAttribute("font-weight", "800");
    end1.setAttribute("text-anchor", "end");
    end1.textContent = "1";
    svg.appendChild(end1);

    const note = document.createElementNS("http://www.w3.org/2000/svg", "text");
    note.setAttribute("x", String(padX));
    note.setAttribute("y", "26");
    note.setAttribute("fill", "rgba(11,18,32,0.70)");
    note.setAttribute("font-size", "13");
    note.setAttribute("font-weight", "750");
    note.textContent = "Scale: 0 to 1";
    svg.appendChild(note);

    return { svg };
  }

  function makePointNumberLineSvg(den, points) {
    const w = 420;
    const h = 150;
    const padX = 22;
    const y = 72;
    const x0 = padX;
    const x1 = w - padX;
    const lineW = x1 - x0;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("class", "tape");

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", "1");
    bg.setAttribute("y", "1");
    bg.setAttribute("width", String(w - 2));
    bg.setAttribute("height", String(h - 2));
    bg.setAttribute("rx", "18");
    bg.setAttribute("fill", "rgba(255,255,255,0.55)");
    bg.setAttribute("stroke", "rgba(11,18,32,0.14)");
    bg.setAttribute("stroke-width", "2");
    svg.appendChild(bg);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x0));
    line.setAttribute("x2", String(x1));
    line.setAttribute("y1", String(y));
    line.setAttribute("y2", String(y));
    line.setAttribute("stroke", "rgba(11,18,32,0.32)");
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-linecap", "round");
    svg.appendChild(line);

    const denInt = Math.trunc(den);
    const maxTicks = 16;
    const tickCount = denInt > 0 && denInt <= maxTicks ? denInt : 0;
    for (let i = 0; i <= tickCount; i++) {
      const t = i / tickCount;
      const xt = x0 + t * lineW;
      const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
      tick.setAttribute("x1", String(xt));
      tick.setAttribute("x2", String(xt));
      tick.setAttribute("y1", String(y - 10));
      tick.setAttribute("y2", String(y + 10));
      tick.setAttribute("stroke", "rgba(11,18,32,0.18)");
      tick.setAttribute("stroke-width", i === 0 || i === tickCount ? "2.5" : "2");
      svg.appendChild(tick);
    }

    const end0 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    end0.setAttribute("x", String(x0));
    end0.setAttribute("y", String(y + 44));
    end0.setAttribute("fill", "rgba(11,18,32,0.70)");
    end0.setAttribute("font-size", "14");
    end0.setAttribute("font-weight", "900");
    end0.textContent = "0";
    svg.appendChild(end0);

    const end1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    end1.setAttribute("x", String(x1));
    end1.setAttribute("y", String(y + 44));
    end1.setAttribute("fill", "rgba(11,18,32,0.70)");
    end1.setAttribute("font-size", "14");
    end1.setAttribute("font-weight", "900");
    end1.setAttribute("text-anchor", "end");
    end1.textContent = "1";
    svg.appendChild(end1);

    for (const p of points) {
      const val = p.n / p.d;
      const x = x0 + val * lineW;

      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", String(x));
      dot.setAttribute("cy", String(y));
      dot.setAttribute("r", "7");
      dot.setAttribute("fill", "rgba(15,118,110,0.85)");
      dot.setAttribute("opacity", "0.9");
      svg.appendChild(dot);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", String(x));
      label.setAttribute("y", String(y - 18));
      label.setAttribute("fill", "rgba(11,18,32,0.78)");
      label.setAttribute("font-size", "15");
      label.setAttribute("font-weight", "950");
      label.setAttribute("text-anchor", "middle");
      label.textContent = p.label;
      svg.appendChild(label);
    }

    const note = document.createElementNS("http://www.w3.org/2000/svg", "text");
    note.setAttribute("x", String(padX));
    note.setAttribute("y", "26");
    note.setAttribute("fill", "rgba(11,18,32,0.70)");
    note.setAttribute("font-size", "13");
    note.setAttribute("font-weight", "750");
    note.textContent = `Split into ${denInt} equal parts`;
    svg.appendChild(note);

    return svg;
  }

  const NUMBER_WORDS = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    "twenty",
    "twenty-one",
    "twenty-two",
    "twenty-three",
    "twenty-four",
  ];

  const DENOM_WORDS = {
    2: "half",
    3: "third",
    4: "fourth",
    5: "fifth",
    6: "sixth",
    7: "seventh",
    8: "eighth",
    9: "ninth",
    10: "tenth",
    11: "eleventh",
    12: "twelfth",
    13: "thirteenth",
    14: "fourteenth",
    15: "fifteenth",
    16: "sixteenth",
    17: "seventeenth",
    18: "eighteenth",
    19: "nineteenth",
    20: "twentieth",
    21: "twenty-first",
    22: "twenty-second",
    23: "twenty-third",
    24: "twenty-fourth",
  };

  function fractionWords(n, d) {
    const nn = Math.trunc(n);
    const dd = Math.trunc(d);
    if (!Number.isFinite(nn) || !Number.isFinite(dd) || dd <= 0) return null;

    const denomBase = DENOM_WORDS[dd];
    const numWord = NUMBER_WORDS[nn] ?? String(nn);
    if (!denomBase) return null;

    if (dd === 2 && nn !== 1) return `${numWord} halves`;
    if (nn === 1) return `${numWord} ${denomBase}`;
    return `${numWord} ${denomBase}s`;
  }

  function fractionAriaLabel(n, d) {
    const nn = Math.trunc(n);
    const dd = Math.trunc(d);
    if (!Number.isFinite(nn) || !Number.isFinite(dd) || dd <= 0) return "Invalid fraction";

    const words = fractionWords(nn, dd);
    if (!words) return `${nn} over ${dd}`;
    return `${words} (${nn} over ${dd})`;
  }

  function setFractionAria(el, prefix, n, d) {
    if (!el) return;
    const label = fractionAriaLabel(n, d);
    el.setAttribute("aria-label", prefix ? `${prefix}: ${label}` : label);
  }

  function loadState() {
    try {
      const raw = storageGet(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveState(state) {
    storageSet(STORAGE_KEY, JSON.stringify(state));
  }

  const state = {
    showSteps: false,
    focus: false,
    total: 0,
    correct: 0,
    streak: 0,
  };

  const loaded = loadState();
  if (loaded) {
    state.showSteps = !!loaded.showSteps;
    state.focus = !!loaded.focus;
    state.total = Number.isFinite(loaded.total) ? loaded.total : 0;
    state.correct = Number.isFinite(loaded.correct) ? loaded.correct : 0;
    state.streak = Number.isFinite(loaded.streak) ? loaded.streak : 0;
  }

  function updateStatsUI() {
    const accuracy = state.total === 0 ? 0 : Math.round((state.correct / state.total) * 100);
    document.getElementById("stat-streak").textContent = String(state.streak);
    document.getElementById("stat-accuracy").textContent = `${accuracy}%`;
    document.getElementById("stat-total").textContent = String(state.total);
  }

  function applyTogglesUI() {
    document.body.classList.toggle("is-focus", state.focus);
    const stepsBtn = document.getElementById("toggle-steps");
    const focusBtn = document.getElementById("toggle-focus");
    stepsBtn.setAttribute("aria-pressed", String(state.showSteps));
    focusBtn.setAttribute("aria-pressed", String(state.focus));
    stepsBtn.textContent = state.showSteps ? "Hide steps" : "Show steps";
    focusBtn.textContent = state.focus ? "Exit focus" : "Focus";
  }

  function setRevealObserver() {
    const els = [...document.querySelectorAll("[data-reveal]")];
    if (els.length === 0) return;

    // Progressive enhancement: keep content visible unless we successfully enable reveals.
    const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
    for (const el of els) {
      el.classList.remove("is-hidden", "is-visible");
      const r = el.getBoundingClientRect();
      const isInView = r.bottom > 0 && r.top < viewportH;
      el.classList.add(isInView ? "is-visible" : "is-hidden");
    }

    document.documentElement.classList.add("reveal");

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => {
        el.classList.remove("is-hidden");
        el.classList.add("is-visible");
      });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.remove("is-hidden");
            e.target.classList.add("is-visible");
          }
        }
      },
      { threshold: 0.18 },
    );
    els.forEach((el) => io.observe(el));
  }

  // Quiz (Topic B & C)
  const quiz = {
    active: false,
    questions: [],
    idx: 0,
    score: 0,
    misses: { eq: 0, simp: 0, cmp: 0, point: 0, addsub: 0 },
  };

  function quizMakeEq() {
    const maxDen = 24;
    const op = pick(["mul", "div", "mul"]);
    if (op === "mul") {
      const k = randInt(2, 5);
      const maxD = Math.max(2, Math.floor(maxDen / k));
      const d = randInt(2, maxD);
      const n = randInt(1, d - 1);
      return { type: "eq", op, k, n, d, expected: { n: n * k, d: d * k } };
    }

    const k = randInt(2, 5);
    const baseMaxD = Math.max(2, Math.floor(maxDen / k));
    const baseD = randInt(2, baseMaxD);
    const baseN = randInt(1, baseD - 1);
    return { type: "eq", op, k, n: baseN * k, d: baseD * k, expected: { n: baseN, d: baseD } };
  }

  function quizMakeSimp() {
    const maxDen = 24;
    const baseD = randInt(2, 12);
    const baseN = randInt(1, baseD - 1);
    const maxK = clamp(Math.floor(maxDen / baseD), 2, 6);
    const k = randInt(2, maxK);
    const n = baseN * k;
    const d = baseD * k;
    const expected = simplifyFraction(n, d);
    return { type: "simp", n, d, expected };
  }

  function quizMakeCmp() {
    let b = randInt(2, 12);
    let a = randInt(1, b - 1);
    let d = randInt(2, 12);
    let c = randInt(1, d - 1);
    let tries = 0;
    while (tries < 3 && a * d === c * b) {
      d = randInt(2, 12);
      c = randInt(1, d - 1);
      tries += 1;
    }
    const left = a * d;
    const right = c * b;
    const expected = left === right ? "=" : left > right ? ">" : "<";
    return { type: "cmp", a, b, c, d, expected, picked: null };
  }

  function quizMakePointLine() {
    const den = pick([4, 8]);
    const nums = [];
    while (nums.length < 3) {
      const n = randInt(1, den - 1);
      if (!nums.includes(n)) nums.push(n);
    }
    nums.sort((x, y) => x - y);
    const labels = ["A", "B", "C"];
    const points = nums.map((n, idx) => ({ label: labels[idx], n, d: den }));
    const targetIndex = randInt(0, points.length - 1);
    const target = points[targetIndex];
    return { type: "point", den, points, target: { n: target.n, d: target.d }, expected: target.label, picked: null };
  }

  function quizMakeAddSub(level) {
    const lv = level ?? pick([1, 2, 3, 4]);
    let a, b, c, d, op;

    if (lv === 1) {
      op = "+";
      b = randInt(3, 12);
      d = b;
      a = randInt(1, b - 2);
      c = randInt(1, b - a - 1);
    } else if (lv === 2) {
      op = "-";
      b = randInt(3, 12);
      d = b;
      a = randInt(2, b - 1);
      c = randInt(1, a - 1);
    } else if (lv === 3) {
      op = "+";
      b = randInt(2, 8);
      d = randInt(2, 8);
      let tries = 0;
      while (d === b && tries < 5) { d = randInt(2, 8); tries++; }
      const common = lcm(b, d);
      a = randInt(1, b - 1);
      const used = a * (common / b);
      const maxC = Math.floor((common - used - 1) / (common / d));
      c = randInt(1, clamp(maxC, 1, d - 1));
      if (a * (common / b) + c * (common / d) >= common) { a = 1; c = 1; }
    } else {
      op = "-";
      b = randInt(2, 8);
      d = randInt(2, 8);
      let tries = 0;
      while (d === b && tries < 5) { d = randInt(2, 8); tries++; }
      a = randInt(2, b - 1);
      const leftVal = a / b;
      const maxC = Math.max(1, Math.ceil(leftVal * d) - 1);
      c = randInt(1, clamp(maxC, 1, d - 1));
      if (a / b <= c / d) { const ta = a; const tb = b; a = c; b = d; c = ta; d = tb; }
      const common = lcm(b, d);
      const resultN = a * (common / b) - c * (common / d);
      if (resultN <= 0) { a = 2; b = 3; c = 1; d = 4; }
    }

    const common = lcm(b, d);
    const m1 = common / b;
    const m2 = common / d;
    const resultN = op === "+" ? a * m1 + c * m2 : a * m1 - c * m2;
    const expected = simplifyFraction(resultN, common);
    return { type: "addsub", op, a, b, c, d, expected, level: lv };
  }

  function quizMakeQuestions(opts) {
    const count = clamp(opts.count, 6, 20);
    const mix = opts.mix;
    const includeNumberLine = !!opts.includeNumberLine;

    const bank =
      mix === "topicb"
        ? ["eq", "simp", "eq", "simp", "eq"]
        : mix === "topicc"
          ? includeNumberLine
            ? ["cmp", "cmp", "point", "cmp", "point"]
            : ["cmp", "cmp", "cmp", "cmp"]
          : mix === "topicd"
            ? ["addsub", "addsub", "addsub", "addsub"]
            : mix === "bcd"
              ? includeNumberLine
                ? ["eq", "simp", "cmp", "point", "addsub", "addsub"]
                : ["eq", "simp", "cmp", "cmp", "addsub", "addsub"]
              : includeNumberLine
                ? ["eq", "simp", "cmp", "cmp", "point"]
                : ["eq", "simp", "cmp", "cmp"];

    const qs = [];
    for (let i = 0; i < count; i++) {
      const kind = pick(bank);
      if (kind === "eq") qs.push(quizMakeEq());
      else if (kind === "simp") qs.push(quizMakeSimp());
      else if (kind === "point") qs.push(quizMakePointLine());
      else if (kind === "addsub") qs.push(quizMakeAddSub());
      else qs.push(quizMakeCmp());
    }
    return qs;
  }

  function quizSetFeedback(kind, msg) {
    const el = document.getElementById("quiz-feedback");
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.classList.remove("good", "bad");
      el.textContent = "";
      return;
    }
    el.hidden = false;
    setFeedback(el, kind, msg);
  }

  function quizSetQFeedback(kind, msg) {
    const el = document.getElementById("quiz-q-feedback");
    if (!el) return;
    if (!msg) {
      el.hidden = true;
      el.classList.remove("good", "bad");
      el.textContent = "";
      return;
    }
    el.hidden = false;
    setFeedback(el, kind, msg);
  }

  function quizUpdateScoreUI() {
    const el = document.getElementById("quiz-score");
    if (!el) return;
    if (!quiz.active) {
      el.textContent = "";
      return;
    }
    el.textContent = `Score: ${quiz.score}/${quiz.questions.length}`;
  }

  function quizClearStage() {
    const stage = document.getElementById("quiz-stage");
    const actions = document.getElementById("quiz-actions");
    if (stage) stage.textContent = "";
    if (actions) {
      actions.hidden = true;
      actions.textContent = "";
    }
  }

  function quizRenderDone() {
    const stage = document.getElementById("quiz-stage");
    if (!stage) return;
    stage.textContent = "";

    const headline = document.createElement("div");
    headline.className = "quiz-promptline";
    headline.innerHTML = `<span>Done.</span><span class="muted">Final score: ${quiz.score}/${quiz.questions.length}</span>`;
    stage.appendChild(headline);

    const msg = document.createElement("div");
    msg.className = "feedback";
    msg.textContent = "Review any misses in the labs below, then retake the quiz.";
    stage.appendChild(msg);

    const actions = document.getElementById("quiz-actions");
    if (actions) {
      actions.hidden = false;
      actions.classList.add("actions", "quiz-actions");
      actions.innerHTML = `<button class="btn primary" type="button" id="quiz-retake">Retake</button>
        <a class="btn ghost" href="#eq">Equivalent</a>
        <a class="btn ghost" href="#simplify">Simplify</a>
        <a class="btn ghost" href="#compare">Compare</a>
        <a class="btn ghost" href="#addsub">Add/Sub</a>`;
      const retakeBtn = document.getElementById("quiz-retake");
      if (retakeBtn) retakeBtn.addEventListener("click", () => quizStart(true));
    }

    quizSetQFeedback(null, "");
  }

  function quizRender() {
    quizUpdateScoreUI();
    const stage = document.getElementById("quiz-stage");
    const actions = document.getElementById("quiz-actions");
    if (!stage || !actions) return;

    if (!quiz.active) {
      quizClearStage();
      stage.innerHTML = `<div class="model-placeholder">Choose settings, then press “Start quiz”.</div>`;
      quizSetQFeedback(null, "");
      return;
    }

    if (quiz.idx >= quiz.questions.length) {
      quizRenderDone();
      return;
    }

    const q = quiz.questions[quiz.idx];
    stage.textContent = "";

    const promptLine = document.createElement("div");
    promptLine.className = "quiz-promptline";
    const label =
      q.type === "eq"
        ? "Equivalent"
        : q.type === "simp"
          ? "Simplify"
          : q.type === "point"
            ? "Number line"
            : q.type === "addsub"
              ? "Add/Sub"
              : "Compare";
    promptLine.innerHTML = `<span>Question ${quiz.idx + 1} of ${quiz.questions.length}</span><span class="muted">${label}</span>`;
    stage.appendChild(promptLine);

    if (q.type === "eq") {
      const opSymbol = q.op === "mul" ? "\u00d7" : "\u00f7";
      const text = document.createElement("div");
      text.style.fontWeight = "850";
      text.style.color = "rgba(11,18,32,0.82)";
      text.textContent = `Compute: ${q.n}/${q.d} ${opSymbol} ${q.k} = ___/___`;
      stage.appendChild(text);

      const wrap = document.createElement("div");
      wrap.className = "prompt";
      wrap.innerHTML = `
        <div class="fraction big" aria-label="Given fraction">
          <span class="top">${q.n}</span>
          <span class="bar"></span>
          <span class="bottom">${q.d}</span>
        </div>
        <div class="op" aria-hidden="true">
          <span>${opSymbol}</span>
          <span class="pill">${q.k}</span>
        </div>
        <div class="fraction big" aria-label="Your answer">
          <label class="sr-only" for="quiz-ans-n">Numerator</label>
          <input id="quiz-ans-n" inputmode="numeric" pattern="[0-9]*" maxlength="3" />
          <span class="bar"></span>
          <label class="sr-only" for="quiz-ans-d">Denominator</label>
          <input id="quiz-ans-d" inputmode="numeric" pattern="[0-9]*" maxlength="3" />
        </div>`;
      stage.appendChild(wrap);
    } else if (q.type === "simp") {
      const text = document.createElement("div");
      text.style.fontWeight = "850";
      text.style.color = "rgba(11,18,32,0.82)";
      text.textContent = `Simplify to lowest terms: ${q.n}/${q.d} = ___/___`;
      stage.appendChild(text);

      const wrap = document.createElement("div");
      wrap.className = "prompt";
      wrap.innerHTML = `
        <div class="fraction big" aria-label="Fraction to simplify">
          <span class="top">${q.n}</span>
          <span class="bar"></span>
          <span class="bottom">${q.d}</span>
        </div>
        <div class="arrow" aria-hidden="true">&rarr;</div>
        <div class="fraction big" aria-label="Your answer">
          <label class="sr-only" for="quiz-ans-n">Numerator</label>
          <input id="quiz-ans-n" inputmode="numeric" pattern="[0-9]*" maxlength="3" />
          <span class="bar"></span>
          <label class="sr-only" for="quiz-ans-d">Denominator</label>
          <input id="quiz-ans-d" inputmode="numeric" pattern="[0-9]*" maxlength="3" />
        </div>`;
      stage.appendChild(wrap);
    } else if (q.type === "cmp") {
      const text = document.createElement("div");
      text.style.fontWeight = "850";
      text.style.color = "rgba(11,18,32,0.82)";
      text.textContent = "Choose <, =, or >.";
      stage.appendChild(text);

      const row = document.createElement("div");
      row.className = "compare-row";
      row.innerHTML = `
        <div class="fraction big" aria-label="Left fraction">
          <span class="top">${q.a}</span>
          <span class="bar"></span>
          <span class="bottom">${q.b}</span>
        </div>
        <div class="compare-buttons" role="group" aria-label="Choose comparison sign">
          <button class="cmp-btn" type="button" data-cmp="<" aria-label="Less than">&lt;</button>
          <button class="cmp-btn" type="button" data-cmp="=" aria-label="Equal to">=</button>
          <button class="cmp-btn" type="button" data-cmp=">" aria-label="Greater than">&gt;</button>
        </div>
        <div class="fraction big" aria-label="Right fraction">
          <span class="top">${q.c}</span>
          <span class="bar"></span>
          <span class="bottom">${q.d}</span>
        </div>`;
      stage.appendChild(row);

      row.querySelectorAll(".cmp-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (q.answered) return;
          row.querySelectorAll(".cmp-btn").forEach((b) => b.classList.remove("is-picked"));
          btn.classList.add("is-picked");
          q.picked = btn.dataset.cmp;
        });
      });
    } else if (q.type === "point") {
      const text = document.createElement("div");
      text.style.fontWeight = "850";
      text.style.color = "rgba(11,18,32,0.82)";
      text.textContent = `The number line is split into ${q.den} equal parts. Which point shows ${q.target.n}/${q.target.d}?`;
      stage.appendChild(text);

      const svg = makePointNumberLineSvg(q.den, q.points);
      stage.appendChild(svg);

      const choiceRow = document.createElement("div");
      choiceRow.className = "quiz-choices";
      choiceRow.setAttribute("role", "group");
      choiceRow.setAttribute("aria-label", "Choose point");
      choiceRow.innerHTML = q.points
        .map((p) => `<button class="cmp-btn" type="button" data-choice="${p.label}" aria-label="Point ${p.label}">${p.label}</button>`)
        .join("");
      stage.appendChild(choiceRow);

      choiceRow.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (q.answered) return;
          choiceRow.querySelectorAll("button").forEach((b) => b.classList.remove("is-picked"));
          btn.classList.add("is-picked");
          q.picked = btn.dataset.choice;
        });
      });
    } else if (q.type === "addsub") {
      const opSymbol = q.op === "+" ? "+" : "\u2212";
      const text = document.createElement("div");
      text.style.fontWeight = "850";
      text.style.color = "rgba(11,18,32,0.82)";
      text.textContent = `Compute: ${q.a}/${q.b} ${opSymbol} ${q.c}/${q.d} = ___/___`;
      stage.appendChild(text);

      const wrap = document.createElement("div");
      wrap.className = "prompt";
      wrap.innerHTML = `
        <div class="fraction big" aria-label="First fraction">
          <span class="top">${q.a}</span>
          <span class="bar"></span>
          <span class="bottom">${q.b}</span>
        </div>
        <div class="op-sign" aria-hidden="true">${opSymbol}</div>
        <div class="fraction big" aria-label="Second fraction">
          <span class="top">${q.c}</span>
          <span class="bar"></span>
          <span class="bottom">${q.d}</span>
        </div>
        <div class="arrow" aria-hidden="true">=</div>
        <div class="fraction big" aria-label="Your answer">
          <label class="sr-only" for="quiz-ans-n">Numerator</label>
          <input id="quiz-ans-n" inputmode="numeric" pattern="[0-9]*" maxlength="3" />
          <span class="bar"></span>
          <label class="sr-only" for="quiz-ans-d">Denominator</label>
          <input id="quiz-ans-d" inputmode="numeric" pattern="[0-9]*" maxlength="3" />
        </div>`;
      stage.appendChild(wrap);
    }

    actions.hidden = false;
    actions.classList.add("actions", "quiz-actions");
    actions.innerHTML = `<button class="btn primary" type="button" id="quiz-check">Check</button>
      <button class="btn" type="button" id="quiz-next">Next</button>`;

    const nextBtn = document.getElementById("quiz-next");
    if (nextBtn) nextBtn.disabled = !q.answered;

    document.getElementById("quiz-check").addEventListener("click", quizCheckCurrent);
    document.getElementById("quiz-next").addEventListener("click", quizNext);

    quizSetQFeedback(null, "");
  }

  function quizCheckCurrent() {
    if (!quiz.active) return;
    if (quiz.idx >= quiz.questions.length) return;
    const q = quiz.questions[quiz.idx];
    if (q.answered) return;

    let ok = false;
    let msg = "";
    let kind = "bad";

    if (q.type === "eq" || q.type === "simp") {
      const an = parseIntSafe(document.getElementById("quiz-ans-n")?.value);
      const ad = parseIntSafe(document.getElementById("quiz-ans-d")?.value);

      if (an === null || ad === null) {
        quizSetQFeedback("bad", "Type both numbers (numerator and denominator).");
        return;
      }
      if (ad === 0) {
        quizSetQFeedback("bad", "The denominator cannot be 0.");
        return;
      }
      if (an >= ad) {
        quizSetQFeedback("bad", "In this quiz, use proper fractions (top smaller than bottom).");
        return;
      }

      if (q.type === "eq") {
        ok = an === q.expected.n && ad === q.expected.d;
        if (ok) {
          kind = "good";
          msg = "Correct.";
        } else {
          msg = `Not quite. Correct answer: ${q.expected.n}/${q.expected.d}.`;
        }
      } else {
        const expected = q.expected;
        ok = an === expected.n && ad === expected.d;
        if (ok) {
          kind = "good";
          msg = "Correct.";
        } else {
          const reduced = simplifyFraction(an, ad);
          if (reduced.n === expected.n && reduced.d === expected.d) {
            msg = `Close. Your fraction is equivalent, but you can simplify more. Correct answer: ${expected.n}/${expected.d}.`;
          } else {
            msg = `Not quite. Correct answer: ${expected.n}/${expected.d}.`;
          }
        }
      }
    } else if (q.type === "addsub") {
      const an = parseIntSafe(document.getElementById("quiz-ans-n")?.value);
      const ad = parseIntSafe(document.getElementById("quiz-ans-d")?.value);

      if (an === null || ad === null) {
        quizSetQFeedback("bad", "Type both numbers (numerator and denominator).");
        return;
      }
      if (ad === 0) {
        quizSetQFeedback("bad", "The denominator cannot be 0.");
        return;
      }

      const userSimp = simplifyFraction(an, ad);
      ok = userSimp.n === q.expected.n && userSimp.d === q.expected.d;
      if (ok) {
        kind = "good";
        msg = "Correct.";
      } else {
        msg = `Not quite. Correct answer: ${q.expected.n}/${q.expected.d}.`;
      }
    } else if (q.type === "cmp") {
      if (!q.picked) {
        quizSetQFeedback("bad", "Pick <, =, or >.");
        return;
      }
      ok = q.picked === q.expected;
      if (ok) {
        kind = "good";
        msg = "Correct.";
      } else {
        const common = lcm(q.b, q.d);
        const a2 = q.a * (common / q.b);
        const c2 = q.c * (common / q.d);
        msg = `Not quite. Correct sign: ${q.expected}. (Common denominator ${common}: ${a2}/${common} ${q.expected} ${c2}/${common})`;
      }
    } else {
      if (!q.picked) {
        quizSetQFeedback("bad", "Pick A, B, or C.");
        return;
      }
      ok = q.picked === q.expected;
      if (ok) {
        kind = "good";
        msg = "Correct.";
      } else {
        msg = `Not quite. Correct answer: ${q.expected}.`;
      }
    }

    q.answered = true;
    q.correct = ok;
    if (ok) quiz.score += 1;
    else quiz.misses[q.type] += 1;

    recordResult(ok);
    quizUpdateScoreUI();

    const nextBtn = document.getElementById("quiz-next");
    if (nextBtn) nextBtn.disabled = false;

    quizSetQFeedback(kind, msg);
  }

  function quizNext() {
    if (!quiz.active) return;
    if (quiz.idx >= quiz.questions.length) return;
    const q = quiz.questions[quiz.idx];
    if (!q.answered) {
      quizSetQFeedback("bad", "Press Check first.");
      return;
    }
    quiz.idx += 1;
    quizRender();
  }

  function quizReset() {
    quiz.active = false;
    quiz.questions = [];
    quiz.idx = 0;
    quiz.score = 0;
    quiz.misses = { eq: 0, simp: 0, cmp: 0, point: 0, addsub: 0 };
    quizSetFeedback(null, "");
    quizSetQFeedback(null, "");
    quizUpdateScoreUI();
    quizRender();
  }

  function quizStart(reuseSettings = false) {
    const count = parseIntSafe(document.getElementById("quiz-count")?.value) ?? 10;
    const mix = document.getElementById("quiz-mix")?.value ?? "mixed";
    const includeNumberLine = document.getElementById("quiz-numberline")?.checked ?? true;

    if (!reuseSettings) quizSetFeedback(null, "");

    quiz.active = true;
    quiz.questions = quizMakeQuestions({ count, mix, includeNumberLine });
    quiz.idx = 0;
    quiz.score = 0;
    quiz.misses = { eq: 0, simp: 0, cmp: 0, point: 0, addsub: 0 };
    quizUpdateScoreUI();
    quizRender();
  }

  // Equivalent Fractions
  const eq = {
    n: 3,
    d: 5,
    op: "mul",
    k: 2,
  };

  function eqExpected() {
    if (eq.op === "mul") return { n: eq.n * eq.k, d: eq.d * eq.k };
    return { n: eq.n / eq.k, d: eq.d / eq.k };
  }

  function eqMakeNew() {
    const maxDen = 24;
    const op = pick(["mul", "div", "mul"]);
    if (op === "mul") {
      eq.op = "mul";
      eq.k = randInt(2, 5);
      const maxD = Math.max(2, Math.floor(maxDen / eq.k));
      eq.d = randInt(2, maxD);
      eq.n = randInt(1, eq.d - 1);
    } else {
      // Build a divisible fraction by multiplying a simplified one.
      eq.op = "div";
      eq.k = randInt(2, 5);
      const baseMaxD = Math.max(2, Math.floor(maxDen / eq.k));
      const baseD = randInt(2, baseMaxD);
      const baseN = randInt(1, baseD - 1);
      eq.n = baseN * eq.k;
      eq.d = baseD * eq.k;
    }
    eqRender();
  }

  function eqRender() {
    document.getElementById("eq-given-n").textContent = String(eq.n);
    document.getElementById("eq-given-d").textContent = String(eq.d);
    document.getElementById("eq-op").textContent = eq.op === "mul" ? "\u00d7" : "\u00f7";
    document.getElementById("eq-factor").textContent = String(eq.k);
    setFractionAria(document.getElementById("eq-given-frac"), "Given fraction", eq.n, eq.d);
    document.getElementById("eq-ans-n").value = "";
    document.getElementById("eq-ans-d").value = "";
    setFeedback(document.getElementById("eq-feedback"), null, "Enter your equivalent fraction, then press Check.");
    hideSteps(document.getElementById("eq-steps"));
    eqRenderModels(null);
  }

  function eqRenderModels(ans) {
    const givenHost = document.getElementById("eq-model-given");
    const ansHost = document.getElementById("eq-model-ans");
    givenHost.textContent = "";
    ansHost.textContent = "";
    givenHost.appendChild(makeTapeSvg(eq.n, eq.d));

    if (!ans || !Number.isFinite(ans.n) || !Number.isFinite(ans.d)) {
      const ph = document.createElement("div");
      ph.className = "model-placeholder";
      ph.textContent = "Type an answer to draw the model.";
      ansHost.appendChild(ph);
      return;
    }

    ansHost.appendChild(makeTapeSvg(ans.n, ans.d));
  }

  function eqCheck() {
    const an = parseIntSafe(document.getElementById("eq-ans-n").value);
    const ad = parseIntSafe(document.getElementById("eq-ans-d").value);
    const feedback = document.getElementById("eq-feedback");
    const steps = document.getElementById("eq-steps");

    if (an === null || ad === null) {
      setFeedback(feedback, "bad", "Type both numbers (numerator and denominator).");
      return;
    }

    if (ad === 0) {
      setFeedback(feedback, "bad", "The denominator cannot be 0.");
      eqRenderModels({ n: an, d: ad });
      return;
    }

    if (an >= ad) {
      setFeedback(feedback, "bad", "In this practice, the numerator should be smaller than the denominator.");
      eqRenderModels({ n: an, d: ad });
      return;
    }

    eqRenderModels({ n: an, d: ad });

    const expected = eqExpected();
    const ok = an === expected.n && ad === expected.d;
    if (ok) {
      setFeedback(feedback, "good", "Correct. Same factor on top and bottom keeps the value the same.");
    } else {
      setFeedback(feedback, "bad", "Not yet. Double-check the operation and multiply/divide both numbers.");
    }

    recordResult(ok);

    if (state.showSteps) {
      const opSymbol = eq.op === "mul" ? "\u00d7" : "\u00f7";
      const stepHtml =
        eq.op === "mul"
          ? `<div>${eq.n} ${opSymbol} ${eq.k} = <strong>${expected.n}</strong></div>
             <div>${eq.d} ${opSymbol} ${eq.k} = <strong>${expected.d}</strong></div>`
          : `<div>${eq.n} ${opSymbol} ${eq.k} = <strong>${expected.n}</strong></div>
             <div>${eq.d} ${opSymbol} ${eq.k} = <strong>${expected.d}</strong></div>`;
      revealSteps(steps, stepHtml);
    } else {
      hideSteps(steps);
    }
  }

  function eqHint() {
    const feedback = document.getElementById("eq-feedback");
    const opSymbol = eq.op === "mul" ? "multiply" : "divide";
    setFeedback(feedback, null, `Hint: ${opSymbol} both numbers by ${eq.k}.`);
  }

  function eqReveal() {
    const expected = eqExpected();
    document.getElementById("eq-ans-n").value = String(expected.n);
    document.getElementById("eq-ans-d").value = String(expected.d);
    eqRenderModels(expected);
    setFeedback(document.getElementById("eq-feedback"), null, "Revealed. Try the next one and do it without looking.");
    if (state.showSteps) {
      const opSymbol = eq.op === "mul" ? "\u00d7" : "\u00f7";
      const stepHtml = `<div>${eq.n} ${opSymbol} ${eq.k} = <strong>${expected.n}</strong></div>
             <div>${eq.d} ${opSymbol} ${eq.k} = <strong>${expected.d}</strong></div>`;
      revealSteps(document.getElementById("eq-steps"), stepHtml);
    }
  }

  // Simplify
  const simp = { n: 16, d: 20 };

  function simpMakeNew() {
    const maxDen = 24;
    const baseD = randInt(2, 12);
    const baseN = randInt(1, baseD - 1);
    const maxK = clamp(Math.floor(maxDen / baseD), 2, 6);
    const k = randInt(2, maxK);
    simp.n = baseN * k;
    simp.d = baseD * k;
    simpRender();
  }

  function simpRender() {
    document.getElementById("simp-given-n").textContent = String(simp.n);
    document.getElementById("simp-given-d").textContent = String(simp.d);
    setFractionAria(document.getElementById("simp-given-frac"), "Fraction to simplify", simp.n, simp.d);
    document.getElementById("simp-ans-n").value = "";
    document.getElementById("simp-ans-d").value = "";
    setFeedback(document.getElementById("simp-feedback"), null, "Simplify the fraction, then press Check.");
    hideSteps(document.getElementById("simp-steps"));
    simpRenderModels(null);
  }

  function simpRenderModels(ans) {
    const givenHost = document.getElementById("simp-model-given");
    const ansHost = document.getElementById("simp-model-ans");
    givenHost.textContent = "";
    ansHost.textContent = "";
    givenHost.appendChild(makeTapeSvg(simp.n, simp.d));

    if (!ans || !Number.isFinite(ans.n) || !Number.isFinite(ans.d)) {
      const ph = document.createElement("div");
      ph.className = "model-placeholder";
      ph.textContent = "Type an answer to draw the model.";
      ansHost.appendChild(ph);
      return;
    }

    ansHost.appendChild(makeTapeSvg(ans.n, ans.d));
  }

  function simpCheck() {
    const an = parseIntSafe(document.getElementById("simp-ans-n").value);
    const ad = parseIntSafe(document.getElementById("simp-ans-d").value);
    const feedback = document.getElementById("simp-feedback");
    const steps = document.getElementById("simp-steps");

    if (an === null || ad === null) {
      setFeedback(feedback, "bad", "Type both numbers (numerator and denominator).");
      return;
    }

    if (ad === 0) {
      setFeedback(feedback, "bad", "The denominator cannot be 0.");
      simpRenderModels({ n: an, d: ad });
      return;
    }

    if (an >= ad) {
      setFeedback(feedback, "bad", "In this practice, the numerator should be smaller than the denominator.");
      simpRenderModels({ n: an, d: ad });
      return;
    }

    simpRenderModels({ n: an, d: ad });

    const expected = simplifyFraction(simp.n, simp.d);
    const ok = an === expected.n && ad === expected.d;
    if (ok) {
      setFeedback(feedback, "good", "Correct. Lowest terms means no common factor left (besides 1).");
    } else {
      const reduced = simplifyFraction(an, ad);
      if (reduced.n === expected.n && reduced.d === expected.d) {
        setFeedback(feedback, "bad", "Close. Your fraction is equivalent, but you can simplify more.");
      } else {
        setFeedback(feedback, "bad", "Not yet. Try dividing both by a common factor (2, 3, 4, 5...).");
      }
    }

    recordResult(ok);

    if (state.showSteps) {
      const stepHtml = `<div>Greatest common factor: <strong>${expected.g}</strong></div>
        <div>${simp.n} \u00f7 ${expected.g} = <strong>${expected.n}</strong></div>
        <div>${simp.d} \u00f7 ${expected.g} = <strong>${expected.d}</strong></div>`;
      revealSteps(steps, stepHtml);
    } else {
      hideSteps(steps);
    }
  }

  function simpHint() {
    const feedback = document.getElementById("simp-feedback");
    setFeedback(feedback, null, "Hint: try 2 first. If both are even, divide by 2. Then try again.");
  }

  function simpReveal() {
    const expected = simplifyFraction(simp.n, simp.d);
    document.getElementById("simp-ans-n").value = String(expected.n);
    document.getElementById("simp-ans-d").value = String(expected.d);
    simpRenderModels(expected);
    setFeedback(document.getElementById("simp-feedback"), null, "Revealed. Say the factor you divided by out loud.");
    if (state.showSteps) {
      const stepHtml = `<div>Greatest common factor: <strong>${expected.g}</strong></div>
        <div>${simp.n} \u00f7 ${expected.g} = <strong>${expected.n}</strong></div>
        <div>${simp.d} \u00f7 ${expected.g} = <strong>${expected.d}</strong></div>`;
      revealSteps(document.getElementById("simp-steps"), stepHtml);
    }
  }

  // Compare
  const cmp = { a: 2, b: 3, c: 3, d: 5, answered: false };

  function cmpMakeNew() {
    cmp.b = randInt(2, 12);
    cmp.a = randInt(1, cmp.b - 1);
    cmp.d = randInt(2, 12);
    cmp.c = randInt(1, cmp.d - 1);

    // Avoid always-equal by regenerating a couple times.
    let tries = 0;
    while (tries < 3 && cmp.a * cmp.d === cmp.c * cmp.b) {
      cmp.d = randInt(2, 12);
      cmp.c = randInt(1, cmp.d - 1);
      tries += 1;
    }

    cmp.answered = false;
    cmpRender();
  }

  function cmpExpectedSign() {
    const left = cmp.a * cmp.d;
    const right = cmp.c * cmp.b;
    if (left === right) return "=";
    return left > right ? ">" : "<";
  }

  function cmpRender() {
    document.getElementById("cmp-left-n").textContent = String(cmp.a);
    document.getElementById("cmp-left-d").textContent = String(cmp.b);
    document.getElementById("cmp-right-n").textContent = String(cmp.c);
    document.getElementById("cmp-right-d").textContent = String(cmp.d);
    setFractionAria(document.getElementById("cmp-left-frac"), "Left fraction", cmp.a, cmp.b);
    setFractionAria(document.getElementById("cmp-right-frac"), "Right fraction", cmp.c, cmp.d);

    setFeedback(document.getElementById("cmp-feedback"), null, "Pick <, =, or >.");
    hideSteps(document.getElementById("cmp-steps"));

    document.querySelectorAll(".cmp-btn").forEach((b) => b.classList.remove("is-picked"));
    cmpRenderNumberLine();
  }

  function cmpRenderNumberLine() {
    const host = document.getElementById("cmp-numberline");
    host.textContent = "";
    const { svg } = makeNumberLineSvg(cmp.a, cmp.b, cmp.c, cmp.d);
    host.appendChild(svg);
  }

  function cmpExplain() {
    const steps = document.getElementById("cmp-steps");
    const common = lcm(cmp.b, cmp.d);
    const m1 = common / cmp.b;
    const m2 = common / cmp.d;
    const a2 = cmp.a * m1;
    const c2 = cmp.c * m2;
    const sign = cmpExpectedSign();
    const html = `<div>Common denominator: <strong>${common}</strong></div>
      <div>${cmp.a}/${cmp.b} = (${cmp.a}\u00d7${m1})/(${cmp.b}\u00d7${m1}) = <strong>${a2}/${common}</strong></div>
      <div>${cmp.c}/${cmp.d} = (${cmp.c}\u00d7${m2})/(${cmp.d}\u00d7${m2}) = <strong>${c2}/${common}</strong></div>
      <div>Compare numerators: <strong>${a2} ${sign} ${c2}</strong></div>`;
    revealSteps(steps, html);
  }

  function cmpPick(sign, buttonEl) {
    if (cmp.answered) return;
    cmp.answered = true;
    document.querySelectorAll(".cmp-btn").forEach((b) => b.classList.remove("is-picked"));
    if (buttonEl) buttonEl.classList.add("is-picked");

    const expected = cmpExpectedSign();
    const ok = sign === expected;

    if (ok) {
      setFeedback(document.getElementById("cmp-feedback"), "good", "Correct.");
    } else {
      setFeedback(document.getElementById("cmp-feedback"), "bad", `Not quite. The correct sign is ${expected}.`);
    }

    recordResult(ok);

    if (state.showSteps) cmpExplain();
  }

  // Add & Subtract
  const addsub = { a: 2, b: 5, c: 1, d: 5, op: "+", level: 1 };

  function addsubExpected() {
    const common = lcm(addsub.b, addsub.d);
    const m1 = common / addsub.b;
    const m2 = common / addsub.d;
    const a2 = addsub.a * m1;
    const c2 = addsub.c * m2;
    const resultN = addsub.op === "+" ? a2 + c2 : a2 - c2;
    return simplifyFraction(resultN, common);
  }

  function addsubMakeNew() {
    const level = parseInt(document.getElementById("addsub-level")?.value, 10) || addsub.level;
    addsub.level = level;

    if (level === 1) {
      addsub.op = "+";
      addsub.b = randInt(3, 12);
      addsub.d = addsub.b;
      addsub.a = randInt(1, addsub.b - 2);
      addsub.c = randInt(1, addsub.b - addsub.a - 1);
    } else if (level === 2) {
      addsub.op = "-";
      addsub.b = randInt(3, 12);
      addsub.d = addsub.b;
      addsub.a = randInt(2, addsub.b - 1);
      addsub.c = randInt(1, addsub.a - 1);
    } else if (level === 3) {
      addsub.op = "+";
      addsub.b = randInt(2, 8);
      addsub.d = randInt(2, 8);
      let tries = 0;
      while (addsub.d === addsub.b && tries < 5) { addsub.d = randInt(2, 8); tries++; }
      const common = lcm(addsub.b, addsub.d);
      addsub.a = randInt(1, addsub.b - 1);
      const used = addsub.a * (common / addsub.b);
      const maxC = Math.floor((common - used - 1) / (common / addsub.d));
      addsub.c = randInt(1, clamp(maxC, 1, addsub.d - 1));
      if (addsub.a * (common / addsub.b) + addsub.c * (common / addsub.d) >= common) {
        addsub.a = 1;
        addsub.c = 1;
      }
    } else if (level === 4) {
      addsub.op = "-";
      addsub.b = randInt(2, 8);
      addsub.d = randInt(2, 8);
      let tries = 0;
      while (addsub.d === addsub.b && tries < 5) { addsub.d = randInt(2, 8); tries++; }
      addsub.a = randInt(2, addsub.b - 1);
      const leftVal = addsub.a / addsub.b;
      const maxC = Math.max(1, Math.ceil(leftVal * addsub.d) - 1);
      addsub.c = randInt(1, clamp(maxC, 1, addsub.d - 1));
      if (addsub.a / addsub.b <= addsub.c / addsub.d) {
        const tmp = { a: addsub.a, b: addsub.b };
        addsub.a = addsub.c;
        addsub.b = addsub.d;
        addsub.c = tmp.a;
        addsub.d = tmp.b;
      }
      const common = lcm(addsub.b, addsub.d);
      const resultN = addsub.a * (common / addsub.b) - addsub.c * (common / addsub.d);
      if (resultN <= 0) { addsub.a = 2; addsub.b = 3; addsub.c = 1; addsub.d = 4; }
    } else {
      const subLevel = pick([1, 2, 3, 4]);
      const saved = addsub.level;
      addsub.level = subLevel;
      addsubMakeNew();
      addsub.level = saved;
      return;
    }

    addsubRender();
  }

  function addsubRender() {
    document.getElementById("addsub-left-n").textContent = String(addsub.a);
    document.getElementById("addsub-left-d").textContent = String(addsub.b);
    document.getElementById("addsub-right-n").textContent = String(addsub.c);
    document.getElementById("addsub-right-d").textContent = String(addsub.d);
    document.getElementById("addsub-op").textContent = addsub.op === "+" ? "+" : "\u2212";
    setFractionAria(document.getElementById("addsub-left-frac"), "First fraction", addsub.a, addsub.b);
    setFractionAria(document.getElementById("addsub-right-frac"), "Second fraction", addsub.c, addsub.d);
    document.getElementById("addsub-ans-n").value = "";
    document.getElementById("addsub-ans-d").value = "";
    setFeedback(document.getElementById("addsub-feedback"), null, "Solve the problem, then press Check.");
    hideSteps(document.getElementById("addsub-steps"));
    addsubRenderModels(null);
  }

  function addsubRenderModels(ans) {
    const leftHost = document.getElementById("addsub-model-left");
    const rightHost = document.getElementById("addsub-model-right");
    const resultHost = document.getElementById("addsub-model-result");
    leftHost.textContent = "";
    rightHost.textContent = "";
    resultHost.textContent = "";

    const common = lcm(addsub.b, addsub.d);
    const leftN = addsub.a * (common / addsub.b);
    const rightN = addsub.c * (common / addsub.d);
    leftHost.appendChild(makeTapeSvg(leftN, common));
    rightHost.appendChild(makeTapeSvg(rightN, common));

    document.getElementById("addsub-model-left-label").textContent =
      addsub.b === addsub.d ? `First (${addsub.a}/${addsub.b})` : `First as ${leftN}/${common}`;
    document.getElementById("addsub-model-right-label").textContent =
      addsub.b === addsub.d ? `Second (${addsub.c}/${addsub.d})` : `Second as ${rightN}/${common}`;

    if (!ans || !Number.isFinite(ans.n) || !Number.isFinite(ans.d)) {
      const ph = document.createElement("div");
      ph.className = "model-placeholder";
      ph.textContent = "Type an answer to see the result model.";
      resultHost.appendChild(ph);
      return;
    }

    resultHost.appendChild(makeTapeSvg(ans.n, ans.d));
  }

  function addsubCheck() {
    const an = parseIntSafe(document.getElementById("addsub-ans-n").value);
    const ad = parseIntSafe(document.getElementById("addsub-ans-d").value);
    const feedback = document.getElementById("addsub-feedback");
    const steps = document.getElementById("addsub-steps");

    if (an === null || ad === null) {
      setFeedback(feedback, "bad", "Type both numbers (numerator and denominator).");
      return;
    }
    if (ad === 0) {
      setFeedback(feedback, "bad", "The denominator cannot be 0.");
      return;
    }

    addsubRenderModels({ n: an, d: ad });

    const expected = addsubExpected();
    const userSimp = simplifyFraction(an, ad);
    const ok = userSimp.n === expected.n && userSimp.d === expected.d;

    if (ok) {
      setFeedback(feedback, "good", "Correct.");
    } else {
      const userVal = an / ad;
      const expectedVal = expected.n / expected.d;
      if (Math.abs(userVal - expectedVal) < 0.0001 && an !== expected.n) {
        setFeedback(feedback, "bad", `Almost. Your fraction is equivalent, but simplify to lowest terms: ${expected.n}/${expected.d}.`);
      } else {
        setFeedback(feedback, "bad", `Not quite. Correct answer: ${expected.n}/${expected.d}.`);
      }
    }

    recordResult(ok);

    if (state.showSteps) {
      addsubShowSteps(steps);
    } else {
      hideSteps(steps);
    }
  }

  function addsubShowSteps(container) {
    const common = lcm(addsub.b, addsub.d);
    const m1 = common / addsub.b;
    const m2 = common / addsub.d;
    const a2 = addsub.a * m1;
    const c2 = addsub.c * m2;
    const resultN = addsub.op === "+" ? a2 + c2 : a2 - c2;
    const simplified = simplifyFraction(resultN, common);
    const opWord = addsub.op === "+" ? "+" : "\u2212";

    let html = "";
    if (addsub.b !== addsub.d) {
      html += `<div>Common denominator: <strong>${common}</strong></div>`;
      html += `<div>${addsub.a}/${addsub.b} = ${addsub.a}\u00d7${m1}/${addsub.b}\u00d7${m1} = <strong>${a2}/${common}</strong></div>`;
      html += `<div>${addsub.c}/${addsub.d} = ${addsub.c}\u00d7${m2}/${addsub.d}\u00d7${m2} = <strong>${c2}/${common}</strong></div>`;
    }
    html += `<div>${a2}/${common} ${opWord} ${c2}/${common} = <strong>${resultN}/${common}</strong></div>`;
    if (simplified.g > 1) {
      html += `<div>Simplify: ${resultN}/${common} \u00f7 ${simplified.g} = <strong>${simplified.n}/${simplified.d}</strong></div>`;
    }
    revealSteps(container, html);
  }

  function addsubHint() {
    const feedback = document.getElementById("addsub-feedback");
    if (addsub.b === addsub.d) {
      const opWord = addsub.op === "+" ? "Add" : "Subtract";
      setFeedback(feedback, null, `Hint: same denominator. ${opWord} the numerators, keep the denominator.`);
    } else {
      const common = lcm(addsub.b, addsub.d);
      setFeedback(feedback, null, `Hint: find a common denominator. Try ${common}. Rename both fractions, then ${addsub.op === "+" ? "add" : "subtract"}.`);
    }
  }

  function addsubReveal() {
    const expected = addsubExpected();
    document.getElementById("addsub-ans-n").value = String(expected.n);
    document.getElementById("addsub-ans-d").value = String(expected.d);
    addsubRenderModels(expected);
    setFeedback(document.getElementById("addsub-feedback"), null, "Revealed. Try to work through the steps yourself next time.");
    if (state.showSteps) {
      addsubShowSteps(document.getElementById("addsub-steps"));
    }
  }

  function recordResult(ok) {
    state.total += 1;
    if (ok) {
      state.correct += 1;
      state.streak += 1;
    } else {
      state.streak = 0;
    }
    updateStatsUI();
    saveState(state);
  }

  function resetProgress() {
    state.total = 0;
    state.correct = 0;
    state.streak = 0;
    updateStatsUI();
    saveState(state);
    setFeedback(document.getElementById("eq-feedback"), null, "Progress reset. Start with a fresh problem.");
    setFeedback(document.getElementById("simp-feedback"), null, "Progress reset. Start with a fresh problem.");
    setFeedback(document.getElementById("cmp-feedback"), null, "Progress reset. Start with a fresh problem.");
    setFeedback(document.getElementById("addsub-feedback"), null, "Progress reset. Start with a fresh problem.");
  }

  // Worksheet generator
  function wsMakeProblem(kind) {
    if (kind === "equivalent") {
      const op = pick(["mul", "div", "mul"]);
      if (op === "mul") {
        const d = randInt(2, 12);
        const n = randInt(1, d - 1);
        const k = randInt(2, 5);
        return { type: "eq", prompt: `${n}/${d} \u00d7 ${k} = ___/___`, answer: `${n * k}/${d * k}` };
      }
      const baseD = randInt(2, 12);
      const baseN = randInt(1, baseD - 1);
      const k = randInt(2, 5);
      return {
        type: "eq",
        prompt: `${baseN * k}/${baseD * k} \u00f7 ${k} = ___/___`,
        answer: `${baseN}/${baseD}`,
      };
    }

    if (kind === "simplify") {
      const baseD = randInt(2, 12);
      const baseN = randInt(1, baseD - 1);
      const k = randInt(2, 6);
      return { type: "simp", prompt: `Simplify ${baseN * k}/${baseD * k}`, answer: `${baseN}/${baseD}` };
    }

    if (kind === "addsub" || kind === "addsub-like" || kind === "addsub-unlike") {
      const useLike = kind === "addsub-like" ? true : kind === "addsub-unlike" ? false : pick([true, false]);
      const op = pick(["+", "-"]);
      let a, b, c, d;
      if (useLike) {
        b = randInt(3, 12);
        d = b;
        if (op === "+") {
          a = randInt(1, b - 2);
          c = randInt(1, b - a - 1);
        } else {
          a = randInt(2, b - 1);
          c = randInt(1, a - 1);
        }
      } else {
        b = randInt(2, 8);
        d = randInt(2, 8);
        let tries = 0;
        while (d === b && tries < 5) { d = randInt(2, 8); tries++; }
        if (op === "+") {
          const common = lcm(b, d);
          a = randInt(1, b - 1);
          const used = a * (common / b);
          const maxC = Math.floor((common - used - 1) / (common / d));
          c = randInt(1, clamp(maxC, 1, d - 1));
          if (a * (common / b) + c * (common / d) >= common) { a = 1; c = 1; }
        } else {
          a = randInt(2, b - 1);
          const leftVal = a / b;
          const maxC = Math.max(1, Math.ceil(leftVal * d) - 1);
          c = randInt(1, clamp(maxC, 1, d - 1));
          if (a / b <= c / d) { const ta = a; const tb = b; a = c; b = d; c = ta; d = tb; }
          const common = lcm(b, d);
          if (a * (common / b) - c * (common / d) <= 0) { a = 2; b = 3; c = 1; d = 4; }
        }
      }
      const common = lcm(b, d);
      const resultN = op === "+" ? a * (common / b) + c * (common / d) : a * (common / b) - c * (common / d);
      const simplified = simplifyFraction(resultN, common);
      const opSymbol = op === "+" ? "+" : "\u2212";
      return { type: "addsub", prompt: `${a}/${b} ${opSymbol} ${c}/${d} = ___/___`, answer: `${simplified.n}/${simplified.d}` };
    }

    // compare
    const b = randInt(2, 12);
    const a = randInt(1, b - 1);
    const d = randInt(2, 12);
    const c = randInt(1, d - 1);
    const left = a * d;
    const right = c * b;
    const sign = left === right ? "=" : left > right ? ">" : "<";
    return { type: "cmp", prompt: `${a}/${b} ___ ${c}/${d}`, answer: sign };
  }

  function wsBuildHtml(opts) {
    const count = clamp(opts.count, 6, 30);
    const mix = opts.mix;
    const includeSteps = !!opts.includeSteps;
    const includeKey = !!opts.includeKey;
    const problems = [];

    const kinds =
      mix === "mixed"
        ? ["equivalent", "simplify", "compare", "addsub"]
        : mix === "equivalent"
          ? ["equivalent"]
          : mix === "simplify"
            ? ["simplify"]
            : mix === "compare"
              ? ["compare"]
              : mix === "addsub"
                ? ["addsub"]
                : mix === "addsub-like"
                  ? ["addsub-like"]
                  : mix === "addsub-unlike"
                    ? ["addsub-unlike"]
                    : ["compare"];

    for (let i = 0; i < count; i++) {
      problems.push(wsMakeProblem(pick(kinds)));
    }

    const example = includeSteps
      ? `<div class="example">
          <div class="ex-title">Example (show your work like this)</div>
          <div class="ex-body">
            Compare <strong>2/3</strong> and <strong>3/5</strong>: common denominator 15.
            <div>2/3 = 10/15, 3/5 = 9/15, so 2/3 &gt; 3/5.</div>
          </div>
        </div>`
      : "";

    const rows = problems
      .map((p, idx) => `<div class="row"><div class="q"><span class="n">${idx + 1}.</span> ${p.prompt}</div></div>`)
      .join("");

    const answers = problems
      .map((p, idx) => `<div class="row"><div class="q"><span class="n">${idx + 1}.</span> ${p.answer}</div></div>`)
      .join("");

    const gridCols = includeKey ? "1fr 1fr" : "1fr";
    const answersBox = includeKey
      ? `<div class="box">
        <div style="font-weight:800; margin-bottom:8px;">Answer Key (for grown-ups)</div>
        ${answers}
      </div>`
      : "";

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Fractions Worksheet</title>
  <style>
    :root { --ink:#0b1220; --muted:rgba(11,18,32,0.7); }
    html,body { margin:0; padding:0; color:var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; }
    .wrap { padding: 28px 32px; }
    h1 { margin:0 0 6px; font-size: 20px; letter-spacing: -0.2px; }
    .sub { margin:0 0 16px; color:var(--muted); font-size: 12px; }
    .grid { display:grid; grid-template-columns: ${gridCols}; gap: 18px; }
    .box { border:1px solid rgba(11,18,32,0.18); border-radius: 14px; padding: 14px; }
    .row { padding: 8px 0; border-bottom: 1px dashed rgba(11,18,32,0.14); }
    .row:last-child { border-bottom: none; }
    .n { display:inline-block; width: 28px; font-weight: 800; }
    .example { border:1px solid rgba(11,18,32,0.18); border-radius: 14px; padding: 12px 14px; margin: 14px 0 0; }
    .ex-title { font-weight: 800; margin-bottom: 6px; }
    .ex-body { color: rgba(11,18,32,0.78); font-size: 13px; line-height: 1.35; }
    @media print {
      .wrap { padding: 0.4in; }
      .grid { gap: 0.25in; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Fractions Worksheet</h1>
    <p class="sub">Equivalent fractions, simplifying, and comparing. Name: ______________________   Date: ____________</p>
    <div class="grid">
      <div class="box">
        <div style="font-weight:800; margin-bottom:8px;">Problems</div>
        ${rows}
        ${example}
      </div>
      ${answersBox}
    </div>
  </div>
</body>
</html>`;
  }

  function wsGeneratePrintable(e) {
    e.preventDefault();
    const count = parseIntSafe(document.getElementById("ws-count").value) ?? 12;
    const mix = document.getElementById("ws-mix").value;
    const includeSteps = document.getElementById("ws-steps").checked;
    const includeKey = document.getElementById("ws-key")?.checked ?? true;

    const html = wsBuildHtml({ count, mix, includeSteps, includeKey });
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      setWsFeedback("bad", "Pop-up blocked. Allow pop-ups for this site to generate the printable worksheet.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    // Some browsers need a beat before printing.
    setTimeout(() => win.print(), 250);
    setWsFeedback("good", "Printable opened in a new tab/window.");
  }

  function bind() {
    setRevealObserver();
    updateStatsUI();
    applyTogglesUI();

    const storageNote = document.getElementById("storage-note");
    if (storageNote && !storageEnabled) {
      storageNote.textContent = "Note: progress saving is unavailable in this browser mode.";
    }

    document.getElementById("toggle-steps").addEventListener("click", () => {
      state.showSteps = !state.showSteps;
      saveState(state);
      applyTogglesUI();
      // Re-render visible steps blocks if needed.
      hideSteps(document.getElementById("eq-steps"));
      hideSteps(document.getElementById("simp-steps"));
      hideSteps(document.getElementById("cmp-steps"));
      setFeedback(document.getElementById("eq-feedback"), null, "Steps toggled. Check a problem to see them.");
    });

    document.getElementById("toggle-focus").addEventListener("click", () => {
      state.focus = !state.focus;
      saveState(state);
      applyTogglesUI();
    });

    document.getElementById("eq-new").addEventListener("click", eqMakeNew);
    document.getElementById("eq-check").addEventListener("click", eqCheck);
    document.getElementById("eq-hint").addEventListener("click", eqHint);
    document.getElementById("eq-reveal").addEventListener("click", eqReveal);

    document.getElementById("simp-new").addEventListener("click", simpMakeNew);
    document.getElementById("simp-check").addEventListener("click", simpCheck);
    document.getElementById("simp-hint").addEventListener("click", simpHint);
    document.getElementById("simp-reveal").addEventListener("click", simpReveal);

    document.getElementById("cmp-new").addEventListener("click", cmpMakeNew);
    document.querySelectorAll(".cmp-btn").forEach((btn) => {
      btn.addEventListener("click", () => cmpPick(btn.dataset.cmp, btn));
    });
    document.getElementById("cmp-reveal").addEventListener("click", () => {
      cmpExplain();
    });

    document.getElementById("addsub-new").addEventListener("click", addsubMakeNew);
    document.getElementById("addsub-check").addEventListener("click", addsubCheck);
    document.getElementById("addsub-hint").addEventListener("click", addsubHint);
    document.getElementById("addsub-reveal").addEventListener("click", addsubReveal);
    document.getElementById("addsub-level").addEventListener("change", addsubMakeNew);
    document.getElementById("addsub-ans-d").addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") addsubCheck();
    });

    document.getElementById("ws-form").addEventListener("submit", wsGeneratePrintable);
    document.getElementById("ws-reset").addEventListener("click", resetProgress);
    setWsFeedback(null, "");

    const quizForm = document.getElementById("quiz-form");
    if (quizForm) {
      quizForm.addEventListener("submit", (e) => {
        e.preventDefault();
        quizStart();
      });
    }
    const quizResetBtn = document.getElementById("quiz-reset");
    if (quizResetBtn) quizResetBtn.addEventListener("click", quizReset);
    quizReset();

    // Enter key convenience in inputs.
    document.getElementById("eq-ans-d").addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") eqCheck();
    });
    document.getElementById("simp-ans-d").addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") simpCheck();
    });

    // Initial content.
    eqMakeNew();
    simpMakeNew();
    cmpMakeNew();
    addsubMakeNew();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
