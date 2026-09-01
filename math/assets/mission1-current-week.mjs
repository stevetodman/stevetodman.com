import { formatDecimal, generate as generateModuleQuestion } from "./mission1-content.mjs";

const CURRENT_MICROS = new Set(["powers_multiply", "powers_divide"]);
const randomInt = (random, min, max) => Math.floor(random() * (max - min + 1)) + min;

function factorForDifficulty(difficulty, random) {
  const shifts = difficulty <= 1 ? [1] : difficulty === 2 ? [1, 2] : [1, 2, 3];
  const shift = shifts[randomInt(random, 0, shifts.length - 1)];
  return { shift, factor: 10 ** shift };
}

function valueFor(random, maxPlaces = 3, forceDecimal = false) {
  const minimumPlaces = forceDecimal ? 1 : 0;
  const places = randomInt(random, minimumPlaces, Math.max(minimumPlaces, maxPlaces));
  const scaled = randomInt(random, 11, places === 0 ? 9999 : 9999);
  return scaled / (10 ** places);
}

function scaffold(operation, shift, factor) {
  if (operation === "multiply") return `Use a place-value chart. Multiplying by ${factor.toLocaleString()} makes each digit's value ${factor.toLocaleString()} times as large, so each digit shifts ${shift} place${shift === 1 ? "" : "s"} left.`;
  return `Use a place-value chart. Dividing by ${factor.toLocaleString()} makes each digit's value 1/${factor.toLocaleString()} as large, so each digit shifts ${shift} place${shift === 1 ? "" : "s"} right.`;
}

function workspaceFor(audit) {
  if (audit?.kind !== "scale") return null;
  const shift = Math.round(Math.log10(audit.factor));
  return {
    type: "place-value",
    operation: audit.operation,
    value: audit.a,
    factor: audit.factor,
    shift
  };
}

function makeQuestion(micro, prompt, answer, why, audit, difficulty, flags, scaffoldText = "") {
  return {
    micro,
    skill: "place",
    prompt,
    answer: String(answer),
    why,
    options: null,
    audit,
    workspace: workspaceFor(audit),
    difficulty,
    assisted: !!flags.assisted,
    recovery: !!flags.recovery,
    transfer: difficulty === 3 && !flags.assisted,
    placeholder: "Number only",
    scratch: "place",
    scaffoldText: flags.assisted ? scaffoldText : ""
  };
}

export function generateCurrentWeekQuestion(micro, difficulty = 2, random = Math.random, flags = {}) {
  if (!CURRENT_MICROS.has(micro)) return generateModuleQuestion(micro, difficulty, random, flags);

  const d = Math.max(1, Math.min(3, Number(difficulty) || 1));
  const { shift, factor } = factorForDifficulty(d, random);
  const operation = micro === "powers_multiply" ? "multiply" : "divide";
  const symbol = operation === "multiply" ? "×" : "÷";
  const power = `10<sup>${shift}</sup>`;
  const familyRoll = random();

  if (d >= 3 && familyRoll < 0.34) {
    if (operation === "multiply") {
      const start = valueFor(random, 3);
      const result = start * factor;
      return makeQuestion(
        micro,
        `A number was multiplied by <span class="math">${power}</span> and became <span class="math">${formatDecimal(result)}</span>. What was the starting number?<br><small>Reason backward using the place-value chart.</small>`,
        formatDecimal(start),
        `Multiplying by ${factor.toLocaleString()} made every digit ${factor.toLocaleString()} times as valuable. Reverse that change by dividing ${formatDecimal(result)} by ${factor.toLocaleString()}: the starting number was ${formatDecimal(start)}.`,
        { kind: "scale", operation: "divide", a: result, factor },
        d,
        flags,
        scaffold(operation, shift, factor)
      );
    }

    const start = valueFor(random, Math.max(0, 3 - shift));
    const result = start / factor;
    return makeQuestion(
      micro,
      `A number was divided by <span class="math">${power}</span> and became <span class="math">${formatDecimal(result)}</span>. What was the starting number?<br><small>Reason backward using the place-value chart.</small>`,
      formatDecimal(start),
      `Dividing by ${factor.toLocaleString()} made every digit worth 1/${factor.toLocaleString()} as much. Reverse that change by multiplying ${formatDecimal(result)} by ${factor.toLocaleString()}: the starting number was ${formatDecimal(start)}.`,
      { kind: "scale", operation: "multiply", a: result, factor },
      d,
      flags,
      scaffold(operation, shift, factor)
    );
  }

  if (d >= 3 && familyRoll < 0.68) {
    if (operation === "multiply") {
      const start = valueFor(random, 3, true);
      const answer = start * factor;
      const written = formatDecimal(start);
      const wrong = `${written}${"0".repeat(shift)}`;
      return makeQuestion(
        micro,
        `A student says <span class="math">${written} × ${power} = ${wrong}</span> because the exponent tells you to append ${shift} zero${shift === 1 ? "" : "s"}. What is the correct product?<br><small>Use the value of each digit—not a zero-adding shortcut.</small>`,
        formatDecimal(answer),
        `The exponent tells how many factors of 10 are used. Each digit becomes ${factor.toLocaleString()} times as valuable and shifts ${shift} place${shift === 1 ? "" : "s"} left. The correct product is ${formatDecimal(answer)}.`,
        { kind: "scale", operation: "multiply", a: start, factor },
        d,
        flags,
        scaffold(operation, shift, factor)
      );
    }

    const start = valueFor(random, Math.max(0, 3 - shift));
    const answer = start / factor;
    const wrong = start * factor;
    return makeQuestion(
      micro,
      `A student moves the digits the wrong direction and says <span class="math">${formatDecimal(start)} ÷ ${power} = ${formatDecimal(wrong)}</span>. What is the correct quotient?<br><small>Justify the direction using the operation of division.</small>`,
      formatDecimal(answer),
      `Division by ${factor.toLocaleString()} makes every digit worth 1/${factor.toLocaleString()} as much, so the digits shift ${shift} place${shift === 1 ? "" : "s"} right. The correct quotient is ${formatDecimal(answer)}.`,
      { kind: "scale", operation: "divide", a: start, factor },
      d,
      flags,
      scaffold(operation, shift, factor)
    );
  }

  const maxPlaces = operation === "divide" ? Math.max(0, 3 - shift) : 3;
  const start = valueFor(random, maxPlaces);
  const answer = operation === "multiply" ? start * factor : start / factor;
  const change = operation === "multiply"
    ? `Each digit becomes ${factor.toLocaleString()} times as valuable and shifts ${shift} place${shift === 1 ? "" : "s"} left.`
    : `Each digit becomes 1/${factor.toLocaleString()} as valuable and shifts ${shift} place${shift === 1 ? "" : "s"} right.`;
  return makeQuestion(
    micro,
    `Calculate: <span class="math">${formatDecimal(start)} ${symbol} ${power}</span><br><small>Before calculating, predict how the value of each digit changes.</small>`,
    formatDecimal(answer),
    `${change} Therefore ${formatDecimal(start)} ${symbol} ${factor.toLocaleString()} = ${formatDecimal(answer)}.`,
    { kind: "scale", operation, a: start, factor },
    d,
    flags,
    scaffold(operation, shift, factor)
  );
}
