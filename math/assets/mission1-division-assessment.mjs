import { formatDecimal, isCorrectAnswer } from "./mission1-content.mjs";

export const DIVISION_ARCHETYPES = Object.freeze({
  division_units: Object.freeze({ lesson: 13, label: "Divide using place-value units", weight: 1.15 }),
  division_decompose: Object.freeze({ lesson: 13, label: "Decompose before dividing", weight: 1.0 }),
  division_scale_relation: Object.freeze({ lesson: 13, label: "Relate scaled division facts", weight: 0.9 }),
  division_reasonableness: Object.freeze({ lesson: 13, label: "Judge quotient reasonableness", weight: 1.1 }),
  division_model: Object.freeze({ lesson: 14, label: "Represent decimal division", weight: 0.9 }),
  division_algorithm: Object.freeze({ lesson: 14, label: "Use the standard division algorithm", weight: 1.3 }),
  division_regroup: Object.freeze({ lesson: 15, label: "Rename into smaller units", weight: 1.25 }),
  division_error_analysis: Object.freeze({ lesson: 14, label: "Analyze a division error", weight: 1.0 }),
  division_word_one_step: Object.freeze({ lesson: 13, label: "Recognize division in context", weight: 1.0 }),
  division_multistep: Object.freeze({ lesson: 16, label: "Plan a multi-step decimal problem", weight: 1.25 }),
  division_context_result: Object.freeze({ lesson: 16, label: "Interpret a quotient in context", weight: 1.0 }),
  tape_diagram_transfer: Object.freeze({ lesson: 13, label: "Model a division situation", weight: 0.85 }),
  metric_embedded: Object.freeze({ lesson: 16, label: "Use metric conversion inside a problem", weight: 0.8 })
});

export const DIVISION_ARCHETYPE_KEYS = Object.freeze(Object.keys(DIVISION_ARCHETYPES));
export const DIVISION_TEST_RUN_ARCHETYPES = Object.freeze([
  "division_units",
  "division_decompose",
  "division_algorithm",
  "division_regroup",
  "division_scale_relation",
  "division_reasonableness",
  "division_error_analysis",
  "division_word_one_step",
  "division_multistep",
  "division_context_result",
  "tape_diagram_transfer",
  "metric_embedded"
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomInt = (random, min, max) => Math.floor(random() * (max - min + 1)) + min;
const shuffle = (values, random) => values.map(value => [random(), value]).sort((a, b) => a[0] - b[0]).map(item => item[1]);
const recentEvidence = (profile, key) => (profile?.attempts || [])
  .filter(attempt => attempt.micro === "decimal_divide" && attempt.assessmentArchetype === key)
  .sort((a, b) => (Number(a.at) || 0) - (Number(b.at) || 0))
  .slice(-8);

export function divisionArchetypeStats(profile, key, options = {}) {
  const evidence = recentEvidence(profile, key).filter(attempt => !attempt.assisted && !attempt.repairOnly);
  let score = 40;
  for (const attempt of evidence) {
    const difficulty = clamp(Number(attempt.difficulty) || 1, 1, 3);
    score += attempt.correct ? 6 + difficulty * 2 : -(10 + difficulty * 2);
    score = clamp(score, 0, 100);
  }
  const correct = evidence.filter(attempt => attempt.correct);
  const transfer = correct.filter(attempt => attempt.testRun || attempt.transfer || (Number(attempt.difficulty) || 1) >= 3).length;
  const days = new Set(correct.map(attempt => attempt.date).filter(Boolean)).size;
  const latest = evidence.at(-1) || null;
  const now = Number(options.now) || Date.now();
  const latestAt = Math.max(0, Number(latest?.at) || 0);
  const ageDays = latestAt ? Math.max(0, (now - latestAt) / 86400000) : Infinity;
  const recent = ageDays <= (Number(options.maxAgeDays) || 7);
  const latestCorrect = !!latest?.correct;
  return {
    key,
    score: Math.round(score),
    attempts: evidence.length,
    correct: correct.length,
    transfer,
    days,
    latestCorrect,
    recent,
    ageDays,
    ready: score >= 78 && correct.length >= 2 && transfer >= 1 && days >= 2 && latestCorrect && recent
  };
}

export function divisionReadiness(profile, options = {}) {
  const skills = DIVISION_ARCHETYPE_KEYS.map(key => divisionArchetypeStats(profile, key, options));
  const ready = skills.filter(item => item.ready).length;
  const sampled = skills.filter(item => item.attempts > 0).length;
  const weighted = skills.reduce((sum, item) => sum + item.score * DIVISION_ARCHETYPES[item.key].weight, 0);
  const totalWeight = skills.reduce((sum, item) => sum + DIVISION_ARCHETYPES[item.key].weight, 0);
  return { ready, total: skills.length, sampled, score: Math.round(weighted / totalWeight), skills };
}

export function nextDivisionArchetype(profile, options = {}) {
  const avoid = new Set(options.avoid || []);
  const candidates = DIVISION_ARCHETYPE_KEYS.map((key, order) => {
    const stats = divisionArchetypeStats(profile, key, options);
    const latest = recentEvidence(profile, key).at(-1)?.at || 0;
    return { key, stats, latest, avoided: avoid.has(key) ? 1 : 0, weight: DIVISION_ARCHETYPES[key].weight, order };
  });
  candidates.sort((a, b) =>
    a.avoided - b.avoided ||
    Number(a.stats.ready) - Number(b.stats.ready) ||
    a.stats.score - b.stats.score ||
    a.stats.attempts - b.stats.attempts ||
    b.weight - a.weight ||
    a.latest - b.latest ||
    a.order - b.order
  );
  return candidates[0].key;
}

export function pickDivisionArchetype(random = Math.random, difficulty = 2) {
  const keys = difficulty <= 1
    ? ["division_units", "division_decompose", "division_algorithm", "division_word_one_step", "division_model"]
    : difficulty === 2
      ? DIVISION_ARCHETYPE_KEYS.filter(key => key !== "division_multistep" && key !== "metric_embedded")
      : DIVISION_ARCHETYPE_KEYS;
  const weighted = [];
  for (const key of keys) {
    const repeats = Math.max(1, Math.round(DIVISION_ARCHETYPES[key].weight * 4));
    for (let index = 0; index < repeats; index += 1) weighted.push(key);
  }
  return weighted[randomInt(random, 0, weighted.length - 1)];
}

function question(archetype, prompt, answer, why, audit, difficulty, flags = {}, extras = {}) {
  const q = {
    micro: "decimal_divide",
    skill: "divide",
    prompt,
    answer: String(answer),
    why,
    options: extras.options || null,
    audit,
    workspace: extras.workspace || null,
    difficulty,
    assisted: !!flags.assisted,
    recovery: !!flags.recovery,
    transfer: difficulty === 3 && !flags.assisted,
    testRun: !!flags.testRun,
    placeholder: extras.placeholder || "Number only",
    scratch: extras.scratch || "grid",
    scaffoldText: flags.assisted ? (extras.scaffoldText || "Estimate the quotient first. Rename into smaller place-value units when a unit cannot be shared equally, then multiply to check.") : "",
    assessmentArchetype: archetype
  };
  if (!isCorrectAnswer(q.answer, q)) throw new Error(`Invalid division assessment question: ${archetype}`);
  return q;
}

function exactDivision(random, difficulty, options = {}) {
  const divisor = options.divisor || randomInt(random, 2, difficulty >= 3 ? 9 : 6);
  const places = options.places ?? (difficulty <= 1 ? 1 : difficulty === 2 ? 2 : 3);
  const min = difficulty >= 3 ? 101 : 12;
  const max = difficulty <= 1 ? 90 : difficulty === 2 ? 450 : 2400;
  const quotientScaled = options.quotientScaled || randomInt(random, min, max);
  const dividendScaled = divisor * quotientScaled;
  return {
    divisor,
    places,
    quotientScaled,
    dividendScaled,
    dividend: formatDecimal(dividendScaled / (10 ** places)),
    answer: formatDecimal(quotientScaled / (10 ** places)),
    audit: { kind: "quotient", dividendScaled, dividendPlaces: places, divisor }
  };
}

export function generateDivisionAssessmentQuestion(archetypeKey, difficulty = 2, random = Math.random, flags = {}) {
  const d = clamp(Number(difficulty) || 1, 1, 3);
  const archetype = DIVISION_ARCHETYPES[archetypeKey] ? archetypeKey : pickDivisionArchetype(random, d);

  if (archetype === "division_units") {
    const divisor = randomInt(random, 2, 8);
    const unitPlaces = d >= 3 ? 3 : randomInt(random, 1, 2);
    const quotientUnits = randomInt(random, 2, 9);
    const dividendUnits = divisor * quotientUnits;
    const unitName = unitPlaces === 1 ? "tenths" : unitPlaces === 2 ? "hundredths" : "thousandths";
    const dividend = formatDecimal(dividendUnits / (10 ** unitPlaces));
    const answer = formatDecimal(quotientUnits / (10 ** unitPlaces));
    return question(archetype,
      `<span class="math">${dividend} ÷ ${divisor}</span><br><small>Think of ${dividend} as ${dividendUnits} ${unitName}. How many ${unitName} are in each equal group?</small>`,
      answer,
      `${dividend} is ${dividendUnits} ${unitName}. ${dividendUnits} ${unitName} ÷ ${divisor} = ${quotientUnits} ${unitName} = ${answer}.`,
      { kind: "quotient", dividendScaled: dividendUnits, dividendPlaces: unitPlaces, divisor }, d, flags, { scratch: "place" });
  }

  if (archetype === "division_decompose") {
    const data = exactDivision(random, d, { divisor: randomInt(random, 2, 6), places: d >= 3 ? 3 : 2 });
    return question(archetype,
      `Find <span class="math">${data.dividend} ÷ ${data.divisor}</span>.<br><small>Before using the algorithm, decompose the dividend into place-value units that can be shared by ${data.divisor}.</small>`,
      data.answer,
      `Decompose or rename the dividend into divisible place-value units, share each unit, and recombine. The quotient is ${data.answer}.`,
      data.audit, d, flags, { scratch: "place" });
  }

  if (archetype === "division_scale_relation") {
    const divisor = randomInt(random, 2, 9);
    const wholeQuotient = randomInt(random, 2, 9);
    const wholeDividend = divisor * wholeQuotient;
    const shift = d >= 3 ? randomInt(random, 2, 3) : 1;
    const factor = 10 ** shift;
    const dividend = wholeDividend / factor;
    const answer = wholeQuotient / factor;
    return question(archetype,
      `You know <span class="math">${wholeDividend} ÷ ${divisor} = ${wholeQuotient}</span>. Without starting over, use place value to find <span class="math">${formatDecimal(dividend)} ÷ ${divisor}</span>.`,
      formatDecimal(answer),
      `${formatDecimal(dividend)} is 1/${factor} of ${wholeDividend}, so its quotient by the same divisor is 1/${factor} of ${wholeQuotient}: ${formatDecimal(answer)}.`,
      { kind: "quotient", dividendScaled: wholeDividend, dividendPlaces: shift, divisor }, d, flags, { scratch: "place" });
  }

  if (archetype === "division_reasonableness") {
    const data = exactDivision(random, d);
    const expected = Number(data.answer);
    const options = shuffle([
      data.answer,
      formatDecimal(expected * 10),
      formatDecimal(expected / 10),
      formatDecimal(Number(data.dividend) * data.divisor)
    ].filter((value, index, array) => array.indexOf(value) === index), random);
    return question(archetype,
      `Which quotient is reasonable for <span class="math">${data.dividend} ÷ ${data.divisor}</span>?<br><small>Estimate the size before doing exact arithmetic.</small>`,
      data.answer,
      `Because the divisor is greater than 1, the quotient must be smaller than ${data.dividend}. Estimation puts it near ${data.answer}.`,
      data.audit, d, flags, { options, scratch: "grid" });
  }

  if (archetype === "division_model") {
    const data = exactDivision(random, d, { places: d >= 2 ? 3 : 2 });
    return question(archetype,
      `Use a place-value chart or disks to model <span class="math">${data.dividend} ÷ ${data.divisor}</span>. Rename units when needed. What quotient does your model show?`,
      data.answer,
      `Share each place-value unit equally. When a unit cannot be shared, rename it as 10 of the next smaller unit. The model gives ${data.answer}.`,
      data.audit, d, flags, { scratch: "place" });
  }

  if (archetype === "division_algorithm") {
    const data = exactDivision(random, d);
    return question(archetype,
      `Solve using the standard algorithm: <span class="math">${data.dividend} ÷ ${data.divisor}</span>`,
      data.answer,
      `Divide one place-value column at a time, rename when necessary, and place each quotient digit in its matching place. Check: ${data.answer} × ${data.divisor} = ${data.dividend}.`,
      data.audit, d, flags, { scratch: "grid" });
  }

  if (archetype === "division_regroup") {
    const divisor = randomInt(random, 2, 5);
    const quotientScaled = randomInt(random, 11, d >= 3 ? 999 : 199);
    const quotientPlaces = d >= 3 ? 3 : 2;
    const dividendScaled = divisor * quotientScaled;
    const dividend = formatDecimal(dividendScaled / (10 ** quotientPlaces));
    const answer = formatDecimal(quotientScaled / (10 ** quotientPlaces));
    return question(archetype,
      `Find <span class="math">${dividend} ÷ ${divisor}</span>.<br><small>When a place-value unit cannot be divided evenly, rename it as 10 of the next smaller unit.</small>`,
      answer,
      `Rename any leftover units into the next smaller place before continuing the division. The quotient is ${answer}.`,
      { kind: "quotient", dividendScaled, dividendPlaces: quotientPlaces, divisor }, d, flags, { scratch: "place" });
  }

  if (archetype === "division_error_analysis") {
    const data = exactDivision(random, Math.max(2, d));
    const wrong = formatDecimal(Number(data.answer) * 10);
    const options = shuffle([data.answer, wrong, formatDecimal(Number(data.answer) / 10)], random);
    return question(archetype,
      `A student says <span class="math">${data.dividend} ÷ ${data.divisor} = ${wrong}</span>. Which value is the correct quotient?<br><small>Use magnitude and place value to find the student's error.</small>`,
      data.answer,
      `The proposed answer is too large for division by ${data.divisor}. The correct quotient is ${data.answer}; multiplying ${data.answer} by ${data.divisor} returns ${data.dividend}.`,
      data.audit, d, flags, { options, scratch: "grid" });
  }

  if (archetype === "division_word_one_step") {
    const data = exactDivision(random, d, { divisor: randomInt(random, 2, 6), places: 2 });
    const contexts = [
      [`${data.dividend} meters of ribbon are cut equally for ${data.divisor} projects. How many meters of ribbon does each project receive?`, "meters"],
      [`${data.dividend} liters of juice are poured equally into ${data.divisor} pitchers. How many liters go in each pitcher?`, "liters"],
      [`${data.dividend} kilograms of flour are shared equally among ${data.divisor} bakers. How many kilograms does each baker receive?`, "kilograms"]
    ];
    const [story, unit] = contexts[randomInt(random, 0, contexts.length - 1)];
    return question(archetype,
      `${story}<br><small>Decide which operation matches equal sharing before calculating.</small>`,
      data.answer,
      `Equal sharing calls for division: ${data.dividend} ÷ ${data.divisor} = ${data.answer} ${unit}.`,
      data.audit, d, flags, { scratch: d >= 3 ? "tape" : "grid" });
  }

  if (archetype === "division_multistep") {
    const divisor = randomInt(random, 2, 6);
    const places = 2;
    const quotientScaled = randomInt(random, 25, 180);
    const remainingScaled = divisor * quotientScaled;
    const usedScaled = randomInt(random, 20, 250);
    const totalScaled = remainingScaled + usedScaled;
    const total = formatDecimal(totalScaled / 100);
    const used = formatDecimal(usedScaled / 100);
    const remaining = formatDecimal(remainingScaled / 100);
    const answer = formatDecimal(quotientScaled / 100);
    return question(archetype,
      `A classroom has <span class="math">${total} kilograms</span> of modeling material. Students use <span class="math">${used} kilograms</span>, then share what remains equally among <span class="math">${divisor}</span> groups. How many kilograms does each group receive?<br><small>Plan the operations before calculating.</small>`,
      answer,
      `First find what remains: ${total} − ${used} = ${remaining}. Then share the remainder: ${remaining} ÷ ${divisor} = ${answer}.`,
      { kind: "subtractDivide", totalScaled, usedScaled, places, divisor }, d, flags, { scratch: "tape" });
  }

  if (archetype === "division_context_result") {
    const divisor = randomInt(random, 2, 6);
    const groups = randomInt(random, 2, 8);
    const perGroup = randomInt(random, 2, 9) / 10;
    const total = groups * perGroup;
    const dividendScaled = Math.round(total * 100);
    const answer = formatDecimal(total / divisor);
    return question(archetype,
      `<span class="math">${formatDecimal(total)} kilograms</span> are divided equally among <span class="math">${divisor}</span> containers. What amount belongs in each container?<br><small>Include the kilogram unit when you explain what your quotient means.</small>`,
      answer,
      `The quotient is ${answer}. In context, that means each container receives ${answer} kilograms.`,
      { kind: "quotient", dividendScaled, dividendPlaces: 2, divisor }, d, flags, { scratch: "tape" });
  }

  if (archetype === "tape_diagram_transfer") {
    const data = exactDivision(random, Math.max(2, d), { divisor: randomInt(random, 2, 8), places: 2 });
    return question(archetype,
      `A total of <span class="math">${data.dividend}</span> is split into <span class="math">${data.divisor}</span> equal parts. Draw a tape diagram with ${data.divisor} equal boxes, then find the value of one box.`,
      data.answer,
      `The tape diagram represents ${data.dividend} as ${data.divisor} equal parts, so one part is ${data.dividend} ÷ ${data.divisor} = ${data.answer}.`,
      data.audit, d, flags, { scratch: "tape" });
  }

  const divisor = randomInt(random, 2, 5);
  const centimetersPerShare = randomInt(random, 20, d >= 3 ? 180 : 90);
  const totalCentimeters = divisor * centimetersPerShare;
  const meters = totalCentimeters / 100;
  return question("metric_embedded",
    `A <span class="math">${formatDecimal(meters)}-meter</span> ribbon is cut equally into <span class="math">${divisor}</span> pieces. How long is each piece in centimeters?<br><small>Convert meters to centimeters, then divide.</small>`,
    String(centimetersPerShare),
    `${formatDecimal(meters)} meters = ${totalCentimeters} centimeters. Then ${totalCentimeters} ÷ ${divisor} = ${centimetersPerShare} centimeters.`,
    { kind: "quotient", dividendScaled: totalCentimeters, dividendPlaces: 0, divisor }, d, flags, { scratch: "tape" });
}

export function buildDivisionTestRun(random = Math.random) {
  return DIVISION_TEST_RUN_ARCHETYPES.map(key => {
    const q = generateDivisionAssessmentQuestion(key, 3, random, { testRun: true });
    return { ...q, assisted: false, recovery: false, transfer: true, testRun: true, scaffoldText: "", workspace: null, scratch: "grid" };
  });
}
