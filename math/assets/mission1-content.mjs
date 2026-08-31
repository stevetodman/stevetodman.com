export const SKILLS = {
  place: { name: "Place value & powers of 10", lessons: "Lessons 1–4", topic: "Topic A" },
  forms: { name: "Decimal forms & comparison", lessons: "Lessons 5–6", topic: "Topic B" },
  round: { name: "Rounding decimals", lessons: "Lessons 7–8", topic: "Topic C" },
  addsub: { name: "Add & subtract decimals", lessons: "Lessons 9–10", topic: "Topic D" },
  multiply: { name: "Multiply decimals", lessons: "Lessons 11–12", topic: "Topic E" },
  divide: { name: "Divide decimals", lessons: "Lessons 13–16", topic: "Topic F" }
};

const choice = (skill, prompt, options, answer, why, transfer = false, audit = null) =>
  ({ skill, prompt, options, answer: String(answer), why, transfer, audit });

const input = (skill, prompt, answer, why, transfer = false, placeholder = "Type your answer", audit = null) =>
  ({ skill, prompt, answer: String(answer), why, transfer, placeholder, audit });

export function diagnostic() {
  return [
    input("place", `Multiply: <span class="math">4.7 × 10³</span>`, "4700", "Multiplying by 10³ makes every digit worth 1,000 times as much, so 4.7 × 1,000 = 4,700.", false, "Number only", { kind: "multiply", a: 4.7, b: 1000, expected: 4700 }),
    choice("place", `In <span class="math">6.282</span>, the 6 has how many times the value of the 2 in the hundredths place?`, ["3 times", "30 times", "300 times", "3,000 times"], "300 times", "The 6 has a value of 6. The 2 in the hundredths place has a value of 0.02. 6 ÷ 0.02 = 300.", false, { kind: "ratio", numerator: 6, denominator: 0.02, expected: 300 }),
    input("place", `Convert <span class="math">3.6 meters</span> to centimeters.`, "360", "One meter is 100 centimeters, so 3.6 × 100 = 360 centimeters.", true, "Number only", { kind: "multiply", a: 3.6, b: 100, expected: 360 }),
    input("forms", `Write as a decimal: <span class="math">7 + 4/10 + 9/1000</span>`, "7.409", "Tenths occupy the first decimal place and thousandths the third: 7 + 0.4 + 0.009 = 7.409.", false, "Number only", { kind: "sum", values: [7, 0.4, 0.009], expected: 7.409 }),
    input("forms", `Write <span class="math">0.305</span> in expanded form using decimals.`, "0.3 + 0.005", "The 3 is three tenths, the 0 holds the hundredths place, and the 5 is five thousandths.", true, "Example: 0.2 + 0.04", { kind: "expanded", expected: 0.305 }),
    choice("forms", `Choose the true comparison.`, ["0.507 < 0.57", "0.507 = 0.57", "0.507 > 0.57"], "0.507 < 0.57", "Write equal places: 0.507 and 0.570. Compare from left to right.", false, { kind: "compare", a: 0.507, b: 0.57, expected: "<" }),
    input("round", `Round <span class="math">18.376</span> to the nearest hundredth.`, "18.38", "The hundredths digit is 7. The next digit is 6, so round the 7 up to 8.", false, "Number only", { kind: "round", thousandths: 18376, digits: 2, expected: 18.38 }),
    input("round", `Round <span class="math">49.51</span> to the nearest whole number.`, "50", "The tenths digit is 5, so 49.51 rounds up to 50.", true, "Number only", { kind: "round", thousandths: 49510, digits: 0, expected: 50 }),
    input("addsub", `Find the sum: <span class="math">6.48 + 13.7</span>`, "20.18", "Align decimal points: 6.48 + 13.70 = 20.18.", false, "Number only", { kind: "add", hundredthsA: 648, hundredthsB: 1370, expected: 20.18 }),
    input("addsub", `Find the difference: <span class="math">20 − 3.86</span>`, "16.14", "Write 20 as 20.00, align decimal points, then subtract.", false, "Number only", { kind: "subtract", hundredthsA: 2000, hundredthsB: 386, expected: 16.14 }),
    input("multiply", `Find the product: <span class="math">0.42 × 6</span>`, "2.52", "42 hundredths × 6 = 252 hundredths = 2.52.", true, "Number only", { kind: "multiply", a: 0.42, b: 6, expected: 2.52 }),
    input("divide", `Find the quotient: <span class="math">7.56 ÷ 6</span>`, "1.26", "756 hundredths ÷ 6 = 126 hundredths = 1.26. Check: 1.26 × 6 = 7.56.", true, "Number only", { kind: "divide", a: 7.56, b: 6, expected: 1.26 })
  ];
}

const randomInt = (random, min, max) => Math.floor(random() * (max - min + 1)) + min;
const decimalFromInteger = (value, places) => formatDecimal(value / (10 ** places));

export function formatDecimal(value) {
  return String(Math.round((value + Number.EPSILON) * 1000) / 1000);
}

export function generate(skill, random = Math.random) {
  const ri = (min, max) => randomInt(random, min, max);

  if (skill === "place") {
    const power = [10, 100, 1000][ri(0, 2)];
    const shift = String(power).length - 1;
    const decimalPlaces = ri(0, 3 - shift);
    const units = ri(11, 8999);
    const operation = random() < 0.5 ? "multiply" : "divide";
    const number = units / (10 ** decimalPlaces);
    const expected = operation === "multiply" ? number * power : number / power;
    const symbol = operation === "multiply" ? "×" : "÷";
    const verb = operation === "multiply" ? "Multiplying" : "Dividing";
    const direction = operation === "multiply" ? "left" : "right";
    return input("place", `Calculate: <span class="math">${formatDecimal(number)} ${symbol} ${power.toLocaleString()}</span>`, formatDecimal(expected), `${verb} by ${power.toLocaleString()} shifts every digit ${shift} place${power > 10 ? "s" : ""} to the ${direction} on a place-value chart.`, true, "Number only", { kind: operation, a: number, b: power, expected });
  }

  if (skill === "forms") {
    const whole = ri(0, 8);
    const aThousandths = whole * 1000 + ri(1, 9) * 100 + ri(1, 9);
    const bThousandths = whole * 1000 + ri(1, 9) * 100 + ri(1, 9) * 10;
    const a = decimalFromInteger(aThousandths, 3);
    const b = decimalFromInteger(bThousandths, 3);
    const operator = aThousandths < bThousandths ? "<" : aThousandths > bThousandths ? ">" : "=";
    return choice("forms", `Choose the true comparison.`, [`${a} < ${b}`, `${a} = ${b}`, `${a} > ${b}`], `${a} ${operator} ${b}`, `Write both numbers to the thousandths place, then compare digits from left to right.`, true, { kind: "compare", a: aThousandths, b: bThousandths, expected: operator });
  }

  if (skill === "round") {
    const thousandths = ri(101, 99999);
    const places = [[1, "tenth"], [2, "hundredth"], [0, "whole number"]];
    const [digits, place] = places[ri(0, 2)];
    const divisor = 10 ** (3 - digits);
    const roundedUnits = Math.floor((thousandths + divisor / 2) / divisor) * divisor;
    const expected = roundedUnits / 1000;
    return input("round", `Round <span class="math">${decimalFromInteger(thousandths, 3)}</span> to the nearest ${place}.`, formatDecimal(expected), `Find the ${place} place, then inspect the digit immediately to its right.`, true, "Number only", { kind: "round", thousandths, digits, expected });
  }

  if (skill === "addsub") {
    let hundredthsA = ri(100, 5000);
    let hundredthsB = ri(10, 999);
    const operation = random() < 0.5 ? "add" : "subtract";
    if (operation === "subtract" && hundredthsB > hundredthsA) [hundredthsA, hundredthsB] = [hundredthsB, hundredthsA];
    const result = operation === "add" ? hundredthsA + hundredthsB : hundredthsA - hundredthsB;
    const symbol = operation === "add" ? "+" : "−";
    const a = decimalFromInteger(hundredthsA, 2);
    const b = decimalFromInteger(hundredthsB, 2);
    const expected = result / 100;
    return input("addsub", `Calculate: <span class="math">${a} ${symbol} ${b}</span>`, formatDecimal(expected), `Write both numbers with aligned decimal points and use zeros as placeholders.`, true, "Number only", { kind: operation, hundredthsA, hundredthsB, expected });
  }

  if (skill === "multiply") {
    const hundredths = ri(11, 499);
    const factor = ri(2, 9);
    const expectedHundredths = hundredths * factor;
    const a = decimalFromInteger(hundredths, 2);
    const expected = expectedHundredths / 100;
    return input("multiply", `Find the product: <span class="math">${a} × ${factor}</span>`, formatDecimal(expected), `Multiply as whole numbers, then use place value to position the decimal. Check: ${hundredths} hundredths × ${factor} = ${expectedHundredths} hundredths.`, true, "Number only", { kind: "multiply", hundredths, factor, expected });
  }

  if (skill === "divide") {
    const divisor = ri(2, 9);
    const quotientHundredths = ri(11, 299);
    const dividendHundredths = divisor * quotientHundredths;
    const dividend = decimalFromInteger(dividendHundredths, 2);
    const expected = quotientHundredths / 100;
    return input("divide", `Find the quotient: <span class="math">${dividend} ÷ ${divisor}</span>`, formatDecimal(expected), `Divide the hundredths, then check by multiplying: ${formatDecimal(expected)} × ${divisor} = ${dividend}.`, true, "Number only", { kind: "divide", dividendHundredths, divisor, expected });
  }

  throw new Error(`Unknown math skill: ${skill}`);
}

export function generators(random = Math.random) {
  return Object.fromEntries(Object.keys(SKILLS).map(skill => [skill, () => generate(skill, random)]));
}

function parseNumber(value) {
  const cleaned = String(value).trim().replace(/,/g, "");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned)) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function parseExpandedSum(value) {
  const parts = String(value).split("+");
  if (parts.length < 2) return null;
  const values = parts.map(parseNumber);
  return values.some(number => number === null) ? null : values.reduce((sum, number) => sum + number, 0);
}

export function normalize(value) {
  return String(value).toLowerCase().trim().replace(/,/g, "").replace(/\s*([+−-])\s*/g, "$1").replace(/\s+/g, " ");
}

export function isCorrectAnswer(raw, question) {
  if (question.audit?.kind === "expanded") {
    const sum = parseExpandedSum(raw);
    return sum !== null && Math.abs(sum - question.audit.expected) < 1e-9;
  }
  if (!question.options) {
    const submitted = parseNumber(raw);
    const expected = parseNumber(question.answer);
    if (submitted !== null && expected !== null) return Math.abs(submitted - expected) < 1e-9;
  }
  return normalize(raw) === normalize(question.answer);
}
