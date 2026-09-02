export const SKILLS = {
  place: { name: "Place value & powers of 10", lessons: "Lessons 1–4", topic: "Topic A" },
  forms: { name: "Decimal forms & comparison", lessons: "Lessons 5–6", topic: "Topic B" },
  round: { name: "Rounding decimals", lessons: "Lessons 7–8", topic: "Topic C" },
  addsub: { name: "Add & subtract decimals", lessons: "Lessons 9–10", topic: "Topic D" },
  multiply: { name: "Multiply decimals", lessons: "Lessons 11–12", topic: "Topic E" },
  divide: { name: "Divide decimals", lessons: "Lessons 13–16", topic: "Topic F" }
};

export const CURRENT_PACKET = {
  effective: "2026-08-31",
  module: "Module 1",
  lessons: "Lessons 1–16",
  title: "Place value & decimal operations",
  standards: ["5.NBT.1", "5.NBT.2", "5.NBT.3", "5.NBT.4", "5.NBT.7", "5.MD.1"]
};

export const MICRO_SKILLS = {
  place_digit: { name: "Identify a decimal place", skill: "place", scratch: "place" },
  place_value: { name: "Find a digit’s value", skill: "place", scratch: "place" },
  powers_multiply: { name: "Multiply by powers of 10", skill: "place", scratch: "place" },
  powers_divide: { name: "Divide by powers of 10", skill: "place", scratch: "place" },
  metric_conversion: { name: "Convert metric units", skill: "place", scratch: "place" },
  decimal_forms: { name: "Read and write decimal forms", skill: "forms", scratch: "place" },
  decimal_compare: { name: "Compare decimals", skill: "forms", scratch: "numberline" },
  decimal_round: { name: "Round decimals", skill: "round", scratch: "numberline" },
  decimal_add: { name: "Add decimals", skill: "addsub", scratch: "vertical" },
  decimal_subtract: { name: "Subtract decimals", skill: "addsub", scratch: "vertical" },
  decimal_multiply: { name: "Multiply decimals", skill: "multiply", scratch: "grid" },
  decimal_divide: { name: "Divide decimals", skill: "divide", scratch: "grid" }
};

export const DOMAIN_MICROS = Object.fromEntries(Object.keys(SKILLS).map(skill => [
  skill,
  Object.keys(MICRO_SKILLS).filter(micro => MICRO_SKILLS[micro].skill === skill)
]));

export const CURRENT_WEEK_MICROS = Object.keys(MICRO_SKILLS);
export const PREREQUISITE_MICROS = [];

const PLACE_INDEX = { tenths: 0, hundredths: 1, thousandths: 2 };
const PLACE_DIVISOR = { tenths: 10, hundredths: 100, thousandths: 1000 };
const UNIT_NAMES = { 0: "ones", 1: "tenths", 2: "hundredths", 3: "thousandths" };
const randomInt = (random, min, max) => Math.floor(random() * (max - min + 1)) + min;
const numberText = (scaled, places) => {
  const divisor = 10 ** places;
  return `${Math.floor(scaled / divisor)}.${String(scaled % divisor).padStart(places, "0")}`;
};

export function formatDecimal(value) {
  return String(Math.round((value + Number.EPSILON) * 100000) / 100000);
}

export function digitAtPlace(text, place) {
  const index = PLACE_INDEX[place];
  if (index === undefined || !/^\d+\.\d+$/.test(String(text))) return null;
  const decimals = String(text).split(".")[1];
  return index < decimals.length ? Number(decimals[index]) : 0;
}

export function valueAtPlace(text, place) {
  const digit = digitAtPlace(text, place);
  return digit === null ? null : digit / PLACE_DIVISOR[place];
}

const makeQuestion = (micro, prompt, answer, why, options, audit, extras = {}) => {
  const meta = MICRO_SKILLS[micro];
  const question = {
    micro, skill: meta.skill, prompt, answer: String(answer), why, options, audit,
    difficulty: extras.difficulty ?? 2,
    assisted: !!extras.assisted,
    recovery: !!extras.recovery,
    transfer: !!extras.transfer,
    placeholder: extras.placeholder || "Type your answer",
    scratch: extras.scratch || meta.scratch,
    scaffoldText: extras.scaffoldText || ""
  };
  validateQuestion(question);
  return question;
};

const input = (micro, prompt, answer, why, audit, extras) => makeQuestion(micro, prompt, answer, why, null, audit, extras);
const choice = (micro, prompt, options, answer, why, audit, extras) => makeQuestion(micro, prompt, answer, why, options, audit, extras);

export function diagnostic() {
  return [
    choice("place_digit", `Which digit is in the hundredths place in <span class="math">6.282</span>?`, ["2", "6", "8", "0"], "8", "Read right from the decimal point: 2 tenths, 8 hundredths, 2 thousandths.", { kind: "digitAtPlace", numberText: "6.282", place: "hundredths" }),
    choice("place_value", `What is the value of the digit in the hundredths place in <span class="math">4.731</span>?`, ["0.3", "0.03", "0.003", "3"], "0.03", "The hundredths digit is 3, so its value is 3 hundredths, or 0.03.", { kind: "digitValue", numberText: "4.731", place: "hundredths" }),
    input("powers_multiply", `Multiply: <span class="math">4.7 × 10³</span>`, "4700", "Multiplying by 10³ makes every digit worth 1,000 times as much: 4.7 × 1,000 = 4,700.", { kind: "scale", operation: "multiply", a: 4.7, factor: 1000 }, { placeholder: "Number only" }),
    input("powers_divide", `Divide: <span class="math">36.4 ÷ 10²</span>`, "0.364", "Dividing by 10² makes every digit worth one hundredth as much: 36.4 ÷ 100 = 0.364.", { kind: "scale", operation: "divide", a: 36.4, factor: 100 }, { placeholder: "Number only" }),
    input("metric_conversion", `Convert <span class="math">3.6 meters</span> to centimeters.`, "360", "One meter is 100 centimeters, so 3.6 × 100 = 360 centimeters.", { kind: "metric", operation: "multiply", a: 3.6, factor: 100 }, { transfer: true, placeholder: "Number only" }),
    input("decimal_forms", `Write <span class="math">0.305</span> in expanded form using decimals.`, "0.3 + 0.005", "The 3 is three tenths, the 0 holds the hundredths place, and the 5 is five thousandths.", { kind: "expanded", expected: 0.305 }, { transfer: true, placeholder: "Example: 0.2 + 0.04" }),
    choice("decimal_compare", `Choose the true comparison.`, ["0.507 < 0.57", "0.507 = 0.57", "0.507 > 0.57"], "0.507 < 0.57", "Write equal places: 0.507 and 0.570. Compare from left to right.", { kind: "compare", aScaled: 507, bScaled: 570, left: "0.507", right: "0.57" }),
    input("decimal_round", `Round <span class="math">18.376</span> to the nearest hundredth.`, "18.38", "The hundredths digit is 7. The thousandths digit is 6, so round the 7 up to 8.", { kind: "round", thousandths: 18376, digits: 2 }, { placeholder: "Number only" }),
    input("decimal_add", `Find the sum: <span class="math">6.48 + 13.7</span>`, "20.18", "Combine like place-value units: 6.48 + 13.70 = 20.18.", { kind: "add", aScaled: 648, bScaled: 1370, places: 2 }, { placeholder: "Number only" }),
    input("decimal_subtract", `Find the difference: <span class="math">20 − 3.86</span>`, "16.14", "Write 20 as 20.00 so like place-value units are aligned, then subtract to get 16.14.", { kind: "subtract", aScaled: 2000, bScaled: 386, places: 2 }, { placeholder: "Number only" }),
    input("decimal_multiply", `Find the product: <span class="math">0.42 × 6</span>`, "2.52", "42 hundredths × 6 = 252 hundredths = 2.52.", { kind: "product", aScaled: 42, aPlaces: 2, bScaled: 6, bPlaces: 0 }, { transfer: true, placeholder: "Number only" }),
    input("decimal_divide", `Find the quotient: <span class="math">7.56 ÷ 6</span>`, "1.26", "756 hundredths ÷ 6 = 126 hundredths = 1.26. Check: 1.26 × 6 = 7.56.", { kind: "quotient", dividendScaled: 756, dividendPlaces: 2, divisor: 6 }, { transfer: true, placeholder: "Number only" })
  ];
}

const placeForDifficulty = (difficulty, random) => {
  const places = difficulty <= 1 ? ["tenths"] : difficulty === 2 ? ["tenths", "hundredths"] : ["hundredths", "thousandths"];
  return places[randomInt(random, 0, places.length - 1)];
};
const choicesAround = (answer, candidates) => [...new Set([String(answer), ...candidates.map(String)])].slice(0, 4);
const shuffled = (values, random) => values.map(value => [random(), value]).sort((a, b) => a[0] - b[0]).map(item => item[1]);
export const scaffoldFor = micro => ({
  place_digit: "Use the place-value chart. Start immediately to the right of the decimal point.",
  place_value: "First identify the digit, then write its value as a decimal.",
  powers_multiply: "Use the chart: multiplying makes every digit shift left.",
  powers_divide: "Use the chart: dividing makes every digit shift right.",
  metric_conversion: "Decide whether you are renaming to smaller or larger units, then write the power-of-10 relationship.",
  decimal_forms: "Match each nonzero digit to its place-value amount.",
  decimal_compare: "Add placeholder zeros, then compare from left to right.",
  decimal_round: "Mark the target place and inspect only the digit immediately to its right.",
  decimal_add: "Line up like place-value units: ones with ones, tenths with tenths, and hundredths with hundredths.",
  decimal_subtract: "Line up like place-value units and rename with placeholder zeros when needed.",
  decimal_multiply: "Estimate first. Multiply using place-value units, then use the estimate to confirm the decimal's position.",
  decimal_divide: "Rename the dividend in place-value units as needed, divide those units, then multiply to check."
})[micro] || "Break the problem into place-value units, complete one step at a time, and check the result.";

export function generate(micro, difficulty = 2, random = Math.random, flags = {}) {
  if (!MICRO_SKILLS[micro]) throw new Error(`Unknown math micro-skill: ${micro}`);
  const ri = (min, max) => randomInt(random, min, max);
  const assisted = !!flags.assisted, recovery = !!flags.recovery;
  const d = Math.max(1, Math.min(3, Number(difficulty) || 1));
  const extras = { difficulty: d, assisted, recovery, transfer: d === 3 && !assisted, scaffoldText: assisted ? scaffoldFor(micro) : "", placeholder: "Number only" };

  if (micro === "place_digit" || micro === "place_value") {
    const place = placeForDifficulty(d, random);
    const whole = ri(0, d === 3 ? 99 : 9);
    const decimalDigits = Array.from({ length: 3 }, () => ri(0, 9));
    decimalDigits[PLACE_INDEX[place]] = ri(1, 9);
    const text = `${whole}.${decimalDigits.join("")}`;
    const digit = digitAtPlace(text, place);
    if (micro === "place_digit") {
      const options = shuffled(choicesAround(digit, [decimalDigits[(PLACE_INDEX[place] + 1) % 3], whole % 10, 0, (digit + 1) % 10]), random);
      return choice(micro, `Which digit is in the ${place} place in <span class="math">${text}</span>?`, options, digit, `Starting at the decimal point, locate the ${place} place. Its digit is ${digit}.`, { kind: "digitAtPlace", numberText: text, place }, extras);
    }
    const value = valueAtPlace(text, place);
    const options = shuffled(choicesAround(value, [digit, digit / 10, digit / 100, digit / 1000]), random);
    return choice(micro, `What is the value of the digit in the ${place} place in <span class="math">${text}</span>?`, options, formatDecimal(value), `The ${place} digit is ${digit}, so its value is ${formatDecimal(value)}.`, { kind: "digitValue", numberText: text, place }, extras);
  }

  if (micro === "powers_multiply" || micro === "powers_divide") {
    const shift = ri(1, d === 1 ? 1 : d === 2 ? 2 : 3);
    const factor = 10 ** shift;
    const decimalPlaces = micro === "powers_divide" ? ri(0, Math.max(0, 3 - shift)) : ri(0, 2);
    const scaled = ri(11, d === 3 ? 9999 : 999);
    const a = scaled / (10 ** decimalPlaces);
    const operation = micro === "powers_multiply" ? "multiply" : "divide";
    const symbol = operation === "multiply" ? "×" : "÷";
    const shownFactor = d === 3 ? `10<sup>${shift}</sup>` : factor.toLocaleString();
    const answer = operation === "multiply" ? a * factor : a / factor;
    const direction = operation === "multiply" ? "left" : "right";
    if (d === 3 && random() < .35) {
      const start = ri(1, 99) / 10, middle = operation === "multiply" ? start * 100 : start / 100;
      const sequence = operation === "multiply"
        ? `${formatDecimal(start)}, ${formatDecimal(start * 10)}, ___, ${formatDecimal(start * 1000)}`
        : `${formatDecimal(start)}, ${formatDecimal(start / 10)}, ___, ${formatDecimal(start / 1000)}`;
      return input(micro, `Complete the pattern: <span class="math">${sequence}</span><br><small>Use words, numbers, or a place-value chart to explain the pattern.</small>`, formatDecimal(middle), `Each term is ${operation === "multiply" ? "10 times the previous term" : "one tenth of the previous term"}.`, { kind: "scale", operation, a: start, factor: 100 }, extras);
    }
    return input(micro, `Calculate: <span class="math">${formatDecimal(a)} ${symbol} ${shownFactor}</span>`, formatDecimal(answer), `${operation === "multiply" ? "Multiplying" : "Dividing"} by ${factor.toLocaleString()} shifts every digit ${shift} place${shift === 1 ? "" : "s"} to the ${direction} on a place-value chart.`, { kind: "scale", operation, a, factor }, extras);
  }

  if (micro === "metric_conversion") {
    const conversions = d === 1
      ? [["meters", "centimeters", 100, "multiply"], ["centimeters", "millimeters", 10, "multiply"]]
      : [
          ["meters", "centimeters", 100, "multiply"],
          ["kilometers", "meters", 1000, "multiply"],
          ["centimeters", "millimeters", 10, "multiply"],
          ["centimeters", "meters", 100, "divide"],
          ["millimeters", "centimeters", 10, "divide"],
          ["meters", "kilometers", 1000, "divide"],
          ["millimeters", "meters", 1000, "divide"]
        ];
    const [from, to, factor, operation] = conversions[ri(0, conversions.length - 1)];
    const a = operation === "divide"
      ? ri(1, d === 3 ? 999 : 199)
      : ri(11, d === 3 ? 999 : 199) / (d === 1 ? 1 : 10);
    const answer = operation === "multiply" ? a * factor : a / factor;
    const directionPrompt = d === 3 ? `<br><small>Write an equation using a power of 10 to justify your answer.</small>` : "";
    const exponent = Math.log10(factor);
    const why = operation === "multiply"
      ? `One ${from.slice(0, -1)} equals ${factor.toLocaleString()} ${to}, so ${formatDecimal(a)} × 10<sup>${exponent}</sup> = ${formatDecimal(answer)}.`
      : `One ${to.slice(0, -1)} equals ${factor.toLocaleString()} ${from}, so ${formatDecimal(a)} ÷ 10<sup>${exponent}</sup> = ${formatDecimal(answer)}.`;
    return input(micro, `Convert <span class="math">${formatDecimal(a)} ${from}</span> to ${to}.${directionPrompt}`, formatDecimal(answer), why, { kind: "metric", operation, a, factor }, extras);
  }

  if (micro === "decimal_forms") {
    const whole = ri(0, d === 3 ? 19 : 8), tenths = ri(1, 9), hundredths = ri(0, 9), thousandths = ri(1, 9);
    const expected = whole + tenths / 10 + hundredths / 100 + thousandths / 1000;
    const formRoll = random();
    if (d >= 2 && formRoll < 0.34) {
      const terms = [whole, tenths / 10, hundredths / 100, thousandths / 1000].filter(value => value !== 0);
      return input(micro, `Write <span class="math">${formatDecimal(expected)}</span> in expanded form using decimals.`, terms.map(formatDecimal).join(" + "), "Write the value of each nonzero digit, then add the parts.", { kind: "expanded", expected }, { ...extras, placeholder: "Example: 4 + 0.2 + 0.006" });
    }
    if (d >= 2 && formRoll < 0.68) {
      const unitParts = [
        [whole, whole === 1 ? "one" : "ones"],
        [tenths, tenths === 1 ? "tenth" : "tenths"],
        [hundredths, hundredths === 1 ? "hundredth" : "hundredths"],
        [thousandths, thousandths === 1 ? "thousandth" : "thousandths"]
      ].filter(([count]) => count > 0);
      return input(
        micro,
        `Write in standard form: <span class="math">${unitParts.map(([count, unit]) => `${count} ${unit}`).join(" + ")}</span>`,
        formatDecimal(expected),
        "Place each unit in its matching column. Keep a zero as a placeholder when a place has no units.",
        { kind: "sum", values: [whole, tenths / 10, hundredths / 100, thousandths / 1000] },
        extras
      );
    }
    return input(micro, `Write as a decimal: <span class="math">${whole} + ${tenths}/10 + ${hundredths}/100 + ${thousandths}/1000</span>`, formatDecimal(expected), "Place tenths, hundredths, and thousandths in their matching positions.", { kind: "sum", values: [whole, tenths / 10, hundredths / 100, thousandths / 1000] }, extras);
  }

  if (micro === "decimal_compare") {
    const places = d === 1 ? 1 : d === 2 ? 2 : 3;
    const maxScaled = (10 ** places) - 1;
    const aScaled = ri(1, maxScaled), bScaled = ri(1, maxScaled);
    const left = formatDecimal(aScaled / (10 ** places)), right = formatDecimal(bScaled / (10 ** places));
    if (d === 3 && random() < .4) {
      const values = [...new Set([aScaled, bScaled, ri(1, 999), ri(1, 999)])];
      while (values.length < 4) {
        const candidate = ri(1, 999);
        if (!values.includes(candidate)) values.push(candidate);
      }
      const shown = shuffled(values.map(value => formatDecimal(value / 1000)), random);
      const answer = [...shown].sort((a, b) => Number(a) - Number(b)).join(", ");
      return input(micro, `Order from least to greatest: <span class="math">${shown.join(", ")}</span>`, answer, `Write each number to three decimal places, then compare from left to right. The order is ${answer}.`, { kind: "order", values: shown }, { ...extras, placeholder: "Separate the four numbers with commas" });
    }
    const operator = aScaled < bScaled ? "<" : aScaled > bScaled ? ">" : "=";
    return choice(micro, "Choose the true comparison.", [`${left} < ${right}`, `${left} = ${right}`, `${left} > ${right}`], `${left} ${operator} ${right}`, "Write equal decimal places, then compare digits from left to right.", { kind: "compare", aScaled, bScaled, left, right }, extras);
  }

  if (micro === "decimal_round") {
    const thousandths = ri(101, d === 3 ? 99999 : 9999);
    const places = d === 1 ? [[1, "tenth"]] : d === 2 ? [[1, "tenth"], [2, "hundredth"]] : [[0, "whole number"], [1, "tenth"], [2, "hundredth"]];
    const [digits, place] = places[ri(0, places.length - 1)];
    const divisor = 10 ** (3 - digits);
    const answer = Math.floor((thousandths + divisor / 2) / divisor) * divisor / 1000;
    const boundaryRoll = random();
    if (d === 3 && boundaryRoll < .25) {
      const targetTenths = ri(11, 998), target = targetTenths / 10, minimum = (targetTenths * 10 - 5) / 100;
      const options = shuffled([minimum, minimum - .01, minimum + .01, target + .05].map(formatDecimal), random);
      return choice(micro, `A number with exactly two decimal places rounds to <span class="math">${formatDecimal(target)}</span> to the nearest tenth. What is the smallest possible number?`, options, formatDecimal(minimum), `The midpoint below ${formatDecimal(target)} is ${formatDecimal(minimum)}. It rounds up to ${formatDecimal(target)}, so it is the smallest possible hundredth.`, { kind: "roundMinimum", targetTenths }, extras);
    }
    if (d === 3 && boundaryRoll < .5) {
      const targetTenths = ri(11, 998), target = targetTenths / 10, maximum = (targetTenths * 10 + 4) / 100;
      const options = shuffled([maximum, maximum - .01, maximum + .01, target - .05].map(formatDecimal), random);
      return choice(micro, `A number with exactly two decimal places rounds to <span class="math">${formatDecimal(target)}</span> to the nearest tenth. What is the greatest possible number?`, options, formatDecimal(maximum), `The next hundredth, ${formatDecimal(maximum + .01)}, reaches the upper midpoint and rounds to the next tenth. Therefore ${formatDecimal(maximum)} is the greatest possible hundredth that still rounds to ${formatDecimal(target)}.`, { kind: "roundMaximum", targetTenths }, extras);
    }
    return input(micro, `Round <span class="math">${numberText(thousandths, 3)}</span> to the nearest ${place}.`, formatDecimal(answer), `Mark the ${place} place, then inspect the digit immediately to its right.`, { kind: "round", thousandths, digits }, extras);
  }

  if (micro === "decimal_add" || micro === "decimal_subtract") {
    let aScaled = ri(100, d === 3 ? 9999 : 5000), bScaled = ri(10, d === 1 ? 999 : 2999);
    const operation = micro === "decimal_add" ? "add" : "subtract";
    if (operation === "subtract" && bScaled > aScaled) [aScaled, bScaled] = [bScaled, aScaled];
    if (operation === "subtract" && bScaled === aScaled) aScaled += 1;
    const result = operation === "add" ? aScaled + bScaled : aScaled - bScaled;
    const symbol = operation === "add" ? "+" : "−";
    const familyRoll = random();
    if (d >= 2 && familyRoll < .28) {
      const places = d === 2 ? ri(1, 2) : ri(1, 3);
      let leftUnits = ri(5, d === 3 ? 70 : 40);
      let rightUnits = ri(1, Math.min(30, leftUnits - 1));
      if (operation === "add") rightUnits = ri(1, 30);
      const unitResult = operation === "add" ? leftUnits + rightUnits : leftUnits - rightUnits;
      const unit = UNIT_NAMES[places];
      return input(
        micro,
        `Combine the like units, then write the answer in standard form: <span class="math">${leftUnits} ${unit} ${symbol} ${rightUnits} ${unit}</span>`,
        formatDecimal(unitResult / (10 ** places)),
        `First ${operation} the ${unit}: ${leftUnits} ${symbol} ${rightUnits} = ${unitResult} ${unit}. Then rename that amount in standard form.`,
        { kind: operation, aScaled: leftUnits, bScaled: rightUnits, places },
        { ...extras, scratch: "place" }
      );
    }
    if (d === 3 && familyRoll < .48) {
      const wholeScaled = ri(2, 50) * 100;
      const smallScaled = ri(1, 9);
      const correctScaled = operation === "add" ? wholeScaled + smallScaled : wholeScaled - smallScaled;
      const wrongScaled = operation === "add" ? wholeScaled + smallScaled * 10 : wholeScaled - smallScaled * 10;
      return input(
        micro,
        `A student treats ${formatDecimal(smallScaled / 100)} as ${formatDecimal(smallScaled / 10)} and says <span class="math">${formatDecimal(wholeScaled / 100)} ${symbol} ${formatDecimal(smallScaled / 100)} = ${formatDecimal(wrongScaled / 100)}</span>. What is the correct result?`,
        formatDecimal(correctScaled / 100),
        `${smallScaled} hundredths is ${formatDecimal(smallScaled / 100)}, not ${smallScaled} tenths. Keep the empty tenths place, then ${operation} like units to get ${formatDecimal(correctScaled / 100)}.`,
        { kind: operation, aScaled: wholeScaled, bScaled: smallScaled, places: 2 },
        extras
      );
    }
    if (d === 3 && familyRoll < .78) {
      const a = formatDecimal(aScaled / 100), b = formatDecimal(bScaled / 100), resultText = formatDecimal(result / 100);
      const prompt = operation === "add"
        ? `A runner completed <span class="math">${a} km</span> on Monday and <span class="math">${b} km</span> on Tuesday. How many kilometers did the runner complete altogether?`
        : `A container held <span class="math">${a} liters</span>. After <span class="math">${b} liters</span> were used, how many liters remained?`;
      return input(micro, `${prompt}<br><small>Use a tape diagram, and show your calculation.</small>`, resultText, `The situation calls for ${operation === "add" ? "addition" : "subtraction"}: ${a} ${symbol} ${b} = ${resultText}.`, { kind: operation, aScaled, bScaled, places: 2 }, { ...extras, scratch: "tape" });
    }
    return input(micro, `Calculate: <span class="math">${formatDecimal(aScaled / 100)} ${symbol} ${formatDecimal(bScaled / 100)}</span>`, formatDecimal(result / 100), `Combine like place-value units and use zeros to rename missing units before you ${operation}.`, { kind: operation, aScaled, bScaled, places: 2 }, extras);
  }

  if (micro === "decimal_multiply") {
    const aPlaces = d === 1 ? 1 : d === 2 ? 2 : 3;
    const aScaled = ri(d === 3 ? 101 : 11, d === 1 ? 99 : d === 2 ? 499 : 9999), bScaled = ri(2, 9), bPlaces = 0;
    const productScaled = aScaled * bScaled;
    const answer = productScaled / (10 ** aPlaces);
    const left = numberText(aScaled, aPlaces), right = String(bScaled), answerText = formatDecimal(answer);
    const familyRoll = random();
    if (d <= 2 && familyRoll < .36) {
      const places = d === 1 ? 1 : ri(1, 3);
      const unitsPerCopy = ri(1, d === 1 ? 9 : 24);
      const copies = ri(2, 9);
      const productUnits = unitsPerCopy * copies;
      const unit = unitsPerCopy === 1 ? UNIT_NAMES[places].slice(0, -1) : UNIT_NAMES[places];
      return input(
        micro,
        `Find the product and write it in standard form: <span class="math">${copies} copies of ${unitsPerCopy} ${unit}</span>.`,
        formatDecimal(productUnits / (10 ** places)),
        `${copies} × ${unitsPerCopy} ${UNIT_NAMES[places]} = ${productUnits} ${UNIT_NAMES[places]} = ${formatDecimal(productUnits / (10 ** places))}.`,
        { kind: "product", aScaled: unitsPerCopy, aPlaces: places, bScaled: copies, bPlaces: 0 },
        { ...extras, scratch: "place" }
      );
    }
    if (d === 3 && familyRoll < .28) {
      const wrong = formatDecimal(answer * 10);
      return input(
        micro,
        `A student says <span class="math">${left} × ${right} = ${wrong}</span>. Estimate first, then find the correct product.`,
        answerText,
        `${left} is about ${Math.round(Number(left))}. That estimate shows the product should be near ${Math.round(Number(left)) * Number(right)}, not ${wrong}. The exact product is ${answerText}.`,
        { kind: "product", aScaled, aPlaces, bScaled, bPlaces },
        extras
      );
    }
    if (d >= 2 && familyRoll < .66) {
      const wrongA = formatDecimal(answer / 10), wrongB = formatDecimal(answer * 10), wrongC = formatDecimal(answer * 100);
      return choice(micro, `Without calculating first, choose the reasonable product for <span class="math">${left} × ${right}</span>.`, shuffled([answerText, wrongA, wrongB, wrongC], random), answerText, `Estimate ${left} with a nearby whole number and multiply by ${right}. The reasonable magnitude is ${answerText}; the other choices do not fit the estimate.`, { kind: "product", aScaled, aPlaces, bScaled, bPlaces }, extras);
    }
    const units = UNIT_NAMES[aPlaces];
    return input(micro, `Find the product: <span class="math">${left} × ${right}</span>`, answerText, `${aScaled.toLocaleString()} ${units} × ${right} = ${productScaled.toLocaleString()} ${units} = ${answerText}. Use an estimate to check that the decimal is in a reasonable position.`, { kind: "product", aScaled, aPlaces, bScaled, bPlaces }, extras);
  }

  const familyRoll = random();
  if (familyRoll < (d === 1 ? .6 : .32)) {
    const divisor = ri(2, 9);
    const onesPerGroup = ri(1, d === 1 ? 4 : 12);
    const hundredthsPerGroup = ri(1, Math.min(d === 1 ? 9 : 18, Math.floor(99 / divisor)));
    const wholeOnes = onesPerGroup * divisor;
    const hundredths = hundredthsPerGroup * divisor;
    const dividendScaled = wholeOnes * 100 + hundredths;
    const quotientScaled = onesPerGroup * 100 + hundredthsPerGroup;
    const dividend = numberText(dividendScaled, 2);
    return input(
      "decimal_divide",
      `Find <span class="math">${dividend} ÷ ${divisor}</span>. Decompose ${dividend} as ${wholeOnes} ones and ${hundredths} hundredths, then divide both parts.`,
      formatDecimal(quotientScaled / 100),
      `${wholeOnes} ones ÷ ${divisor} = ${onesPerGroup} ones, and ${hundredths} hundredths ÷ ${divisor} = ${hundredthsPerGroup} hundredths. Combine both quotient parts: ${formatDecimal(quotientScaled / 100)}.`,
      { kind: "quotient", dividendScaled, dividendPlaces: 2, divisor },
      { ...extras, scratch: "place" }
    );
  }

  if (d >= 2 && familyRoll < .55) {
    const [divisor, step] = [[2, 50], [4, 25], [5, 20], [8, 25]][ri(0, 3)];
    let multiplier = ri(5, 160);
    if ((multiplier * step) % 100 === 0) multiplier += 1;
    const quotientScaled = multiplier * step;
    const dividendTenths = quotientScaled * divisor / 100;
    const dividend = formatDecimal(dividendTenths / 10);
    const answer = formatDecimal(quotientScaled / 1000);
    return input(
      "decimal_divide",
      `Find <span class="math">${dividend} ÷ ${divisor}</span>. Rename a remainder into the next smaller place-value unit until the quotient is complete.`,
      answer,
      `${dividend} is ${dividendTenths * 100} thousandths. ${dividendTenths * 100} thousandths ÷ ${divisor} = ${quotientScaled} thousandths, or ${answer}. Check: ${answer} × ${divisor} = ${dividend}.`,
      { kind: "quotient", dividendScaled: dividendTenths, dividendPlaces: 1, divisor },
      { ...extras, scratch: "vertical" }
    );
  }

  if (d === 3 && familyRoll < .78) {
    const bags = ri(4, 8);
    const perBagScaled = ri(80, 250);
    const leftoverScaled = ri(10, 75);
    const totalScaled = bags * perBagScaled + leftoverScaled;
    const firstScaled = ri(100, totalScaled - 100);
    const secondScaled = totalScaled - firstScaled;
    const first = numberText(firstScaled, 2), second = numberText(secondScaled, 2), leftover = numberText(leftoverScaled, 2);
    const answer = formatDecimal(perBagScaled / 100);
    return input(
      "decimal_divide",
      `A snack maker combines <span class="math">${first} kg</span> of one ingredient and <span class="math">${second} kg</span> of another. After filling ${bags} equal bags, ${leftover} kg remains. How many kilograms are in each full bag?<br><small>Show the total, subtraction, and division.</small>`,
      answer,
      `Add ${first} + ${second} = ${formatDecimal(totalScaled / 100)}. Subtract the remainder: ${formatDecimal(totalScaled / 100)} − ${leftover} = ${formatDecimal((totalScaled - leftoverScaled) / 100)}. Divide by ${bags}: each bag holds ${answer} kg.`,
      { kind: "mixtureShare", firstScaled, secondScaled, leftoverScaled, bags, places: 2 },
      { ...extras, scratch: "tape" }
    );
  }

  const divisor = ri(2, 9), quotientPlaces = d === 1 ? 1 : d === 2 ? 2 : 3;
  const quotientScaled = ri(d === 3 ? 101 : 11, d === 1 ? 99 : d === 2 ? 199 : 4999);
  const dividendScaled = divisor * quotientScaled, dividend = numberText(dividendScaled, quotientPlaces), answer = quotientScaled / (10 ** quotientPlaces);
  if (d === 3 && familyRoll < .9) {
    const usedScaled = ri(10, 900), totalScaled = dividendScaled + usedScaled, total = numberText(totalScaled, quotientPlaces), used = numberText(usedScaled, quotientPlaces);
    return input("decimal_divide", `A baker had <span class="math">${total} kilograms</span> of flour and used <span class="math">${used} kilograms</span>. The rest was shared equally among <span class="math">${divisor}</span> bins. How many kilograms went in each bin?<br><small>Use a tape diagram, and show both calculations.</small>`, formatDecimal(answer), `First subtract: ${total} − ${used} = ${dividend}. Then divide: ${dividend} ÷ ${divisor} = ${formatDecimal(answer)}.`, { kind: "subtractDivide", totalScaled, usedScaled, places: quotientPlaces, divisor }, { ...extras, scratch: "tape" });
  }
  if (d === 3 && random() < .6) return input("decimal_divide", `A baker shares <span class="math">${dividend} kilograms</span> of flour equally among <span class="math">${divisor}</span> bins. How many kilograms go in each bin?<br><small>Use a tape diagram, and show your calculation.</small>`, formatDecimal(answer), `Divide the total into ${divisor} equal groups: ${dividend} ÷ ${divisor} = ${formatDecimal(answer)}. Check by multiplying.`, { kind: "quotient", dividendScaled, dividendPlaces: quotientPlaces, divisor }, { ...extras, scratch: "tape" });
  const units = UNIT_NAMES[quotientPlaces];
  return input("decimal_divide", `Find the quotient: <span class="math">${dividend} ÷ ${divisor}</span>`, formatDecimal(answer), `${dividendScaled.toLocaleString()} ${units} ÷ ${divisor} = ${quotientScaled.toLocaleString()} ${units} = ${formatDecimal(answer)}. Check by multiplying.`, { kind: "quotient", dividendScaled, dividendPlaces: quotientPlaces, divisor }, extras);
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

export function independentlySolve(audit) {
  switch (audit.kind) {
    case "digitAtPlace": return String(digitAtPlace(audit.numberText, audit.place));
    case "digitValue": return formatDecimal(valueAtPlace(audit.numberText, audit.place));
    case "scale": return formatDecimal(audit.operation === "multiply" ? audit.a * audit.factor : audit.a / audit.factor);
    case "metric": return formatDecimal(audit.operation === "divide" ? audit.a / audit.factor : audit.a * audit.factor);
    case "sum": return formatDecimal(audit.values.reduce((sum, value) => sum + value, 0));
    case "expanded": return formatDecimal(audit.expected);
    case "compare": return `${audit.left} ${audit.aScaled < audit.bScaled ? "<" : audit.aScaled > audit.bScaled ? ">" : "="} ${audit.right}`;
    case "order": return [...audit.values].sort((a, b) => Number(a) - Number(b)).join(", ");
    case "round": { const divisor = 10 ** (3 - audit.digits); return formatDecimal(Math.floor((audit.thousandths + divisor / 2) / divisor) * divisor / 1000); }
    case "roundMinimum": return formatDecimal((audit.targetTenths * 10 - 5) / 100);
    case "roundMaximum": return formatDecimal((audit.targetTenths * 10 + 4) / 100);
    case "add": return formatDecimal((audit.aScaled + audit.bScaled) / (10 ** audit.places));
    case "subtract": return formatDecimal((audit.aScaled - audit.bScaled) / (10 ** audit.places));
    case "product": return formatDecimal((audit.aScaled * audit.bScaled) / (10 ** (audit.aPlaces + audit.bPlaces)));
    case "quotient": return formatDecimal((audit.dividendScaled / (10 ** audit.dividendPlaces)) / audit.divisor);
    case "subtractDivide": return formatDecimal(((audit.totalScaled - audit.usedScaled) / (10 ** audit.places)) / audit.divisor);
    case "mixtureShare": return formatDecimal(((audit.firstScaled + audit.secondScaled - audit.leftoverScaled) / (10 ** audit.places)) / audit.bags);
    default: throw new Error(`Unsupported audit kind: ${audit.kind}`);
  }
}

export function isCorrectAnswer(raw, question) {
  if (question.audit.kind === "expanded") {
    const sum = parseExpandedSum(raw);
    return sum !== null && Math.abs(sum - Number(independentlySolve(question.audit))) < 1e-9;
  }
  if (!question.options) {
    const submitted = parseNumber(raw), expected = parseNumber(independentlySolve(question.audit));
    if (submitted !== null && expected !== null) return Math.abs(submitted - expected) < 1e-9;
  }
  return normalize(raw) === normalize(independentlySolve(question.audit));
}

export function validateQuestion(question) {
  if (!MICRO_SKILLS[question.micro]) throw new Error(`Unknown micro-skill: ${question.micro}`);
  if (question.skill !== MICRO_SKILLS[question.micro].skill) throw new Error(`Domain mismatch: ${question.micro}`);
  if (!question.prompt || !question.why || !question.audit) throw new Error(`Incomplete question: ${question.micro}`);
  if (/times (?:as much as|the value of)/i.test(question.prompt)) throw new Error("The retired place-value ratio family is forbidden");
  const solved = independentlySolve(question.audit);
  if (question.audit.kind === "expanded") {
    if (!isCorrectAnswer(question.answer, question)) throw new Error(`Invalid expanded answer: ${question.prompt}`);
  } else if (normalize(question.answer) !== normalize(solved)) throw new Error(`Key mismatch for ${question.prompt}: ${question.answer} !== ${solved}`);
  if (question.options) {
    if (new Set(question.options).size !== question.options.length) throw new Error(`Duplicate options: ${question.prompt}`);
    if (question.options.filter(option => normalize(option) === normalize(question.answer)).length !== 1) throw new Error(`Question needs exactly one keyed option: ${question.prompt}`);
  }
  return true;
}
