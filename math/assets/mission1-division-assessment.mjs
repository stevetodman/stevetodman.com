import { formatDecimal, isCorrectAnswer } from "./mission1-content.mjs?v=20260905-validity1";
import { isColdProof, scoreEvidence } from "./mission1-evidence.mjs?v=20260905-validity1";

export const DIVISION_ARCHETYPES = Object.freeze({
  division_units: Object.freeze({ lesson: 13, label: "Connect divisible units to decimal value", weight: 1.15, target: "division_unit_structure" }),
  division_decompose: Object.freeze({ lesson: 13, label: "Decompose into divisible units", weight: 1, target: "division_unit_structure" }),
  division_scale_relation: Object.freeze({ lesson: 13, label: "Relate scaled division facts", weight: .9, target: "division_scale_relation" }),
  division_reasonableness: Object.freeze({ lesson: 13, label: "Judge quotient reasonableness", weight: 1.1, target: "division_reasonableness" }),
  division_model: Object.freeze({ lesson: 14, label: "Interpret a place-value model", weight: .9, target: "division_model" }),
  division_algorithm: Object.freeze({ lesson: 14, label: "Use the standard division algorithm", weight: 1.3, target: "division_algorithm" }),
  division_regroup: Object.freeze({ lesson: 15, label: "Rename into smaller units", weight: 1.25, target: "division_regroup" }),
  division_error_analysis: Object.freeze({ lesson: 14, label: "Analyze a division error", weight: 1, target: "division_error_analysis" }),
  division_word_one_step: Object.freeze({ lesson: 13, label: "Recognize division in context", weight: 1, target: "division_context" }),
  division_multistep: Object.freeze({ lesson: 16, label: "Plan a multi-step decimal problem", weight: 1.25, target: "division_multistep" }),
  division_context_result: Object.freeze({ lesson: 16, label: "Interpret a quotient in context", weight: 1, target: "division_context" }),
  tape_diagram_transfer: Object.freeze({ lesson: 13, label: "Interpret a division tape diagram", weight: .85, target: "tape_diagram_transfer" }),
  metric_embedded: Object.freeze({ lesson: 16, label: "Use metric conversion inside a problem", weight: .8, target: "metric_embedded" })
});

export const DIVISION_ARCHETYPE_KEYS = Object.freeze(Object.keys(DIVISION_ARCHETYPES));
export const DIVISION_TARGETS = Object.freeze([...new Set(DIVISION_ARCHETYPE_KEYS.map(key => DIVISION_ARCHETYPES[key].target))]);
export const DIVISION_TEST_RUN_ARCHETYPES = Object.freeze([
  "division_units", "division_reasonableness", "operation_contrast", "division_algorithm",
  "division_word_one_step", "division_scale_relation", "division_regroup", "division_multistep",
  "division_model", "tape_diagram_transfer", "division_error_analysis", "metric_embedded"
]);
export const ASSESSMENT_ITEM_VERSION = 2;

const DAY = 86400000;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomInt = (random, min, max) => Math.floor(random() * (max - min + 1)) + min;
const shuffle = (values, random) => values.map(value => [random(), value]).sort((a, b) => a[0] - b[0]).map(item => item[1]);
const clean = value => formatDecimal(Number(value));

export function targetForArchetype(key) { return DIVISION_ARCHETYPES[key]?.target || null; }
function evidenceTarget(attempt) { return attempt?.target || targetForArchetype(attempt?.assessmentArchetype); }
function targetEvidence(profile, target) {
  return (profile?.attempts || []).filter(attempt => attempt.micro === "decimal_divide" && evidenceTarget(attempt) === target && !attempt.assisted && !attempt.repairOnly).sort((a, b) => (Number(a.at) || 0) - (Number(b.at) || 0));
}
function targetReadyState(profile, target, now = Date.now()) {
  const evidence = targetEvidence(profile, target);
  const all = (profile?.attempts || []).filter(attempt => evidenceTarget(attempt) === target).sort((a, b) => (Number(a.at) || 0) - (Number(b.at) || 0));
  let stage = -1, dueAt = 0, lastCold = null, openFailure = null;
  const intervals = [3, 7, 14, 30];
  for (const attempt of all) {
    if (attempt.assisted || attempt.repairOnly) { if (openFailure) dueAt = Math.max(dueAt, (Number(attempt.at) || 0) + DAY); continue; }
    if (!attempt.correct) { openFailure = attempt; dueAt = (Number(attempt.at) || 0) + DAY; stage = -1; continue; }
    if (!isColdProof(attempt, profile) || Number(attempt.difficulty) < 2) continue;
    const at = Number(attempt.at) || 0;
    if (openFailure || !lastCold) { openFailure = null; stage = 0; dueAt = at + intervals[stage] * DAY; lastCold = attempt; }
    else if (at >= dueAt) { stage = Math.min(3, stage + 1); dueAt = at + intervals[stage] * DAY; lastCold = attempt; }
  }
  if (openFailure) return { state: "relearning", dueAt, stage, openFailure, lastCold };
  if (!lastCold) return { state: evidence.length ? "refresh_due" : "unknown", dueAt: 0, stage: -1, openFailure: null, lastCold: null };
  return { state: now >= dueAt ? "refresh_due" : "ready", dueAt, stage, openFailure: null, lastCold };
}

export function divisionTargetStats(profile, target, options = {}) {
  const evidence = scoreEvidence(profile, target, 12);
  let score = 40;
  for (const attempt of evidence) { const difficulty = clamp(Number(attempt.difficulty) || 1, 1, 3); score = clamp(score + (attempt.correct ? 5 + difficulty * 2 : -10), 0, 100); }
  const correct = evidence.filter(attempt => attempt.correct);
  const cold = correct.filter(attempt => isColdProof(attempt, profile) && Number(attempt.difficulty) >= 2);
  const coverage = cold.some(attempt => {
    const required = Array.isArray(attempt.coverageRequired) ? attempt.coverageRequired : [];
    const got = Array.isArray(attempt.coverage) ? attempt.coverage : [];
    return required.length > 0 && required.every(component => got.includes(component));
  });
  return { target, score: Math.round(score), attempts: evidence.length, correct: correct.length, cold: cold.length, coverage, ...targetReadyState(profile, target, Number(options.now) || Date.now()) };
}
export function divisionArchetypeStats(profile, key, options = {}) {
  const target = targetForArchetype(key), stats = divisionTargetStats(profile, target, options), evidence = targetEvidence(profile, target), latest = evidence.at(-1) || null;
  return { key, ...stats, days: new Set(evidence.filter(a => a.correct).map(a => a.date).filter(Boolean)).size, latestCorrect: !!latest?.correct, recent: stats.state === "ready", ageDays: latest?.at ? Math.max(0, ((Number(options.now) || Date.now()) - Number(latest.at)) / DAY) : Infinity, ready: stats.state === "ready" };
}
export function divisionReadiness(profile, options = {}) {
  const skills = DIVISION_TARGETS.map(target => divisionTargetStats(profile, target, options));
  return { ready: skills.filter(item => item.state === "ready").length, total: skills.length, sampled: skills.filter(item => item.attempts > 0).length, score: Math.round(skills.reduce((sum, item) => sum + item.score, 0) / skills.length), skills };
}
export function nextDivisionArchetype(profile, options = {}) {
  const avoid = new Set(options.avoid || []), now = Number(options.now) || Date.now();
  const candidates = DIVISION_ARCHETYPE_KEYS.map((key, order) => {
    const stats = divisionTargetStats(profile, targetForArchetype(key), options), latest = targetEvidence(profile, stats.target).at(-1)?.at || 0;
    const klass = stats.state === "relearning" && stats.dueAt <= now ? 0 : stats.state === "unknown" ? 1 : stats.state === "refresh_due" ? 2 : stats.cold < 2 ? 3 : 4;
    return { key, stats, latest, klass, avoided: avoid.has(key) ? 1 : 0, order };
  });
  candidates.sort((a, b) => a.avoided - b.avoided || a.klass - b.klass || a.stats.score - b.stats.score || a.stats.cold - b.stats.cold || a.latest - b.latest || a.order - b.order);
  return candidates[0].key;
}
export function pickDivisionArchetype(random = Math.random, difficulty = 2) {
  const pool = difficulty <= 1 ? ["division_units", "division_decompose", "division_algorithm", "division_word_one_step", "division_model"] : difficulty === 2 ? DIVISION_ARCHETYPE_KEYS.filter(key => !["division_multistep", "metric_embedded"].includes(key)) : DIVISION_ARCHETYPE_KEYS;
  return pool[randomInt(random, 0, pool.length - 1)];
}

function component(id, label, answer, extras = {}) { return { id, label, answer: String(answer), options: extras.options || null, inputmode: extras.inputmode || "decimal", placeholder: extras.placeholder || "Number only" }; }
function item(archetype, prompt, components, why, difficulty, flags = {}, extras = {}) {
  const target = extras.target || targetForArchetype(archetype), correctResponse = Object.fromEntries(components.map(part => [part.id, String(part.answer)]));
  const q = { micro: extras.micro || "decimal_divide", skill: extras.skill || "divide", prompt, answer: components.length === 1 ? String(components[0].answer) : JSON.stringify(correctResponse), correctResponse, components, why, options: null, audit: { kind: "components", components: components.map(part => ({ id: part.id, answer: String(part.answer) })) }, workspace: null, difficulty, assisted: !!flags.assisted, recovery: !!flags.recovery, transferKind: extras.transferKind || "routine", transfer: (extras.transferKind || "routine") !== "routine" && !flags.assisted, testRun: !!flags.testRun, placeholder: "", scratch: extras.scratch || "grid", scaffoldText: flags.assisted ? (extras.scaffoldText || "Use place-value units and check the quotient by multiplying.") : "", assessmentArchetype: archetype === "operation_contrast" ? null : archetype, target, representation: extras.representation || "symbolic", contextStructure: extras.contextStructure || "none", familyId: extras.familyId || archetype, itemVersion: ASSESSMENT_ITEM_VERSION, coverageRequired: components.map(part => part.id) };
  if (!isCorrectAnswer(correctResponse, q)) throw new Error(`Invalid assessment item: ${archetype}`);
  return q;
}
function exactDivision(random, difficulty, options = {}) {
  const divisor = options.divisor || randomInt(random, 2, difficulty >= 3 ? 9 : 6), places = options.places ?? (difficulty <= 1 ? 1 : difficulty === 2 ? 2 : 3), quotientScaled = options.quotientScaled || randomInt(random, difficulty >= 3 ? 101 : 12, difficulty <= 1 ? 90 : difficulty === 2 ? 450 : 1800), dividendScaled = divisor * quotientScaled;
  return { divisor, places, quotientScaled, dividendScaled, dividend: clean(dividendScaled / 10 ** places), answer: clean(quotientScaled / 10 ** places) };
}

function unitsItem(random, d, flags, archetype = "division_units") {
  const divisor = randomInt(random, 2, 8), places = d >= 3 ? 3 : 1, perShare = randomInt(random, 2, 9), totalUnits = divisor * perShare, first = divisor * (perShare - 1), second = divisor;
  const unitName = places === 1 ? "tenths" : places === 2 ? "hundredths" : "thousandths", dividend = clean(totalUnits / 10 ** places), quotient = clean(perShare / 10 ** places), valid = `${totalUnits} ${unitName} = ${first} ${unitName} + ${second} ${unitName}`;
  return item(archetype, `<span class="math">${dividend} ÷ ${divisor}</span><br><small>Choose a true place-value-unit decomposition whose parts can each be shared equally among ${divisor} groups.</small>`, [component("partition", "Valid decomposition", valid, { options: shuffle([valid, `${totalUnits} ${unitName} = ${first + 1} ${unitName} + ${second} ${unitName}`, `${totalUnits} ${unitName} = ${first - 1} ${unitName} + ${second + 1} ${unitName}`], random), inputmode: "text" }), component("unitsPerShare", `${unitName[0].toUpperCase() + unitName.slice(1)} in each group`, perShare), component("quotient", "Decimal value in each group", quotient)], `${dividend} is ${totalUnits} ${unitName}. Each group receives ${perShare} ${unitName}, or ${quotient}.`, d, flags, { representation: "units", familyId: `units-p${places}`, transferKind: d >= 3 ? "near" : "routine", scratch: "place" });
}
function scaleItem(random, d, flags) {
  const divisor = randomInt(random, 2, 9), wholeQuotient = randomInt(random, 2, 9), wholeDividend = divisor * wholeQuotient, shift = d >= 3 ? randomInt(random, 2, 3) : 2, factor = 10 ** shift, scaledDividend = clean(wholeDividend / factor), answer = clean(wholeQuotient / factor);
  return item("division_scale_relation", `You know <span class="math">${wholeDividend} ÷ ${divisor} = ${wholeQuotient}</span>. Find <span class="math">${scaledDividend} ÷ ${divisor}</span>.`, [component("relation", "How the new quotient compares", `${factor} times smaller`, { options: shuffle([`${factor} times smaller`, `${factor} times larger`, "the same size"], random), inputmode: "text" }), component("quotient", "New quotient", answer)], `The dividend is ${factor} times smaller while the divisor stays fixed, so the quotient is ${factor} times smaller: ${answer}.`, d, flags, { familyId: `scale-${shift}`, transferKind: "near", scratch: "place" });
}
function reasonablenessItem(random, d, flags) {
  const data = exactDivision(random, d, { places: 2 }), value = Number(data.answer), bands = [[0, .1], [.1, 1], [1, 10], [10, 100]].map(([a, b]) => `between ${a} and ${b}`), index = value < .1 ? 0 : value < 1 ? 1 : value < 10 ? 2 : 3;
  return item("division_reasonableness", `Without finding the exact quotient, which interval contains <span class="math">${data.dividend} ÷ ${data.divisor}</span>?`, [component("interval", "Reasonable interval", bands[index], { options: shuffle(bands, random), inputmode: "text" })], `Compatible-number estimation places the quotient ${bands[index]}.`, d, flags, { familyId: `magnitude-band-${index}` });
}
function modelItem(random, d, flags) {
  const groups = randomInt(random, 2, 4), tenths = randomInt(random, 1, 4), hundredths = randomInt(random, 1, 6), each = tenths / 10 + hundredths / 100, total = each * groups;
  const groupHtml = `<span class="division-model-group">${Array.from({ length: tenths }, () => '<i class="disk tenths">0.1</i>').join("")}${Array.from({ length: hundredths }, () => '<i class="disk hundredths">0.01</i>').join("")}</span>`;
  return item("division_model", `<div class="division-model" role="img" aria-label="${groups} equal groups. Each group contains ${tenths} tenths disks and ${hundredths} hundredths disks.">${Array.from({ length: groups }, () => groupHtml).join("")}</div><small>The disks are arranged in equal groups. Read the model.</small>`, [component("total", "Total value shown", clean(total)), component("oneGroup", "Value of one group", clean(each))], `There are ${groups} equal groups of ${clean(each)}, so the total is ${clean(total)}.`, d, flags, { representation: "place_model", familyId: `model-${groups}-${tenths}-${hundredths}`, transferKind: "representation", scratch: "place" });
}
function guaranteedLongDivision(random, d) {
  for (let tries = 0; tries < 100; tries += 1) {
    const data = exactDivision(random, d, { places: 2 }), whole = Math.floor(data.dividendScaled / 100), tenthsDigit = Math.floor(data.dividendScaled / 10) % 10, hundredthsDigit = data.dividendScaled % 10, rWhole = whole % data.divisor, availableTenths = rWhole * 10 + tenthsDigit, rTenths = availableTenths % data.divisor;
    if (rTenths > 0) return { ...data, rTenths, availableHundredths: rTenths * 10 + hundredthsDigit };
  }
  return { divisor: 4, places: 2, quotientScaled: 216, dividendScaled: 864, dividend: "8.64", answer: "2.16", rTenths: 2, availableHundredths: 24 };
}
function algorithmItem(random, d, flags) {
  const data = guaranteedLongDivision(random, d);
  return item("division_algorithm", `<span class="math">${data.dividend} ÷ ${data.divisor}</span>`, [component("tenthsRemainder", "Tenths remaining after the tenths step", data.rTenths), component("quotient", "Quotient", data.answer)], `After the tenths step, ${data.rTenths} tenths remain. Rename and continue; the quotient is ${data.answer}.`, d, flags, { familyId: `algorithm-d${data.divisor}`, scratch: "grid" });
}
function regroupItem(random, d, flags) {
  const data = guaranteedLongDivision(random, Math.max(2, d));
  return item("division_regroup", `Find <span class="math">${data.dividend} ÷ ${data.divisor}</span>.`, [component("renamedHundredths", `Hundredths available after renaming the ${data.rTenths} remaining tenths`, data.availableHundredths), component("quotient", "Quotient", data.answer)], `${data.rTenths} remaining tenths become ${data.rTenths * 10} hundredths; combined with the existing hundredths, there are ${data.availableHundredths}. The quotient is ${data.answer}.`, d, flags, { familyId: `regroup-d${data.divisor}`, transferKind: d >= 3 ? "near" : "routine", scratch: "place" });
}
function errorAnalysisItem(random, d, flags) {
  const divisor = randomInt(random, 2, 6), tenths = randomInt(random, 1, 4), hundredths = randomInt(random, 1, 8), quotient = tenths / 10 + hundredths / 100, dividend = quotient * divisor, wrong = clean(quotient * 10), step = `The final step writes ${wrong} as the quotient`;
  return item("division_error_analysis", `<div class="worked-steps"><strong>A student solves ${clean(dividend)} ÷ ${divisor}:</strong><ol><li>Shares the decimal units equally.</li><li>Gets ${tenths} tenths and ${hundredths} hundredths per group.</li><li>Writes ${wrong} as the quotient.</li></ol></div>`, [component("firstError", "First invalid step", step, { options: shuffle(["Sharing the units equally", `Getting ${tenths} tenths and ${hundredths} hundredths per group`, step], random), inputmode: "text" }), component("quotient", "Correct quotient", clean(quotient))], `${tenths} tenths and ${hundredths} hundredths combine as ${clean(quotient)}, not ${wrong}.`, d, flags, { familyId: "error-unit-combine", transferKind: "near" });
}
function contextItem(random, d, flags, archetype = "division_word_one_step") {
  const data = exactDivision(random, d, { divisor: randomInt(random, 2, 6), places: 2 }), contexts = [["liters of juice", "containers", "liters"], ["meters of ribbon", "projects", "meters"], ["kilograms of clay", "groups", "kilograms"]], [thing, groupName, unit] = contexts[randomInt(random, 0, contexts.length - 1)], equation = `${data.dividend} ÷ ${data.divisor}`;
  return item(archetype, `${data.dividend} ${thing} are shared equally among ${data.divisor} ${groupName}. How much belongs to each ${groupName.slice(0, -1)}?`, [component("equation", "Equation", equation, { options: shuffle([equation, `${data.dividend} × ${data.divisor}`, `${data.dividend} − ${data.divisor}`], random), inputmode: "text" }), component("amount", "Amount in each group", data.answer), component("unit", "Unit", unit, { options: shuffle([unit, groupName, "groups"], random), inputmode: "text" })], `Equal sharing uses division: ${equation} = ${data.answer} ${unit}.`, d, flags, { representation: "word", contextStructure: "equal_share", familyId: `context-${unit}`, transferKind: "context", scratch: "tape" });
}
function multistepItem(random, d, flags) {
  const divisor = randomInt(random, 2, 6), quotientScaled = randomInt(random, 25, 180), remainingScaled = divisor * quotientScaled, usedScaled = randomInt(random, 20, 250), totalScaled = remainingScaled + usedScaled, total = clean(totalScaled / 100), used = clean(usedScaled / 100), answer = clean(quotientScaled / 100), plan = `(${total} − ${used}) ÷ ${divisor}`;
  return item("division_multistep", `A class has ${total} kilograms of clay. Students use ${used} kilograms, then share the rest equally among ${divisor} groups. How much does each group receive?`, [component("plan", "Complete equation plan", plan, { options: shuffle([plan, `${total} ÷ ${divisor} − ${used}`, `(${total} + ${used}) ÷ ${divisor}`], random), inputmode: "text" }), component("result", "Kilograms per group", answer)], `First subtract what was used, then divide: ${plan} = ${answer}.`, d, flags, { representation: "word", contextStructure: "subtract_then_share", familyId: "multistep-subtract-share", transferKind: "context", scratch: "tape" });
}
function tapeItem(random, d, flags) {
  const parts = randomInt(random, 3, 6), each = randomInt(random, 12, 90) / 10, total = clean(each * parts), boxes = Array.from({ length: parts }, () => '<span class="tape-part">?</span>').join("");
  return item("tape_diagram_transfer", `<div class="tape-model" role="img" aria-label="A tape with total ${total}, divided into ${parts} equal parts."><strong>Total: ${total}</strong><div>${boxes}</div></div><small>Each box has the same value. Find one box.</small>`, [component("onePart", "Value of one box", clean(each))], `The tape shows ${total} divided into ${parts} equal parts: ${total} ÷ ${parts} = ${clean(each)}.`, d, flags, { representation: "tape", familyId: `tape-part-${parts}`, transferKind: "representation", scratch: "tape" });
}
function metricItem(random, d, flags) {
  const divisor = randomInt(random, 2, 5), centimetersEach = randomInt(random, 20, d >= 3 ? 180 : 90), totalCentimeters = divisor * centimetersEach, meters = clean(totalCentimeters / 100);
  return item("metric_embedded", `A ${meters}-meter ribbon is cut equally into ${divisor} pieces. How long is each piece in centimeters?`, [component("amount", "Length of each piece", centimetersEach), component("unit", "Unit", "centimeters", { options: shuffle(["centimeters", "meters", "pieces"], random), inputmode: "text" })], `${meters} meters is ${totalCentimeters} centimeters; ${totalCentimeters} ÷ ${divisor} = ${centimetersEach} centimeters.`, d, flags, { representation: "word", contextStructure: "metric_share", familyId: "metric-m-cm-share", transferKind: "context", scratch: "tape" });
}
function operationContrast(random, completedRuns, flags) {
  const kind = ["multiply", "add", "subtract"][completedRuns % 3];
  if (kind === "multiply") {
    const groups = randomInt(random, 3, 8), each = randomInt(random, 12, 49) / 10, result = clean(groups * each), equation = `${groups} × ${clean(each)}`;
    return item("operation_contrast", `${groups} teams each receive ${clean(each)} meters of ribbon. How many meters are needed altogether?`, [component("equation", "Equation", equation, { options: shuffle([equation, `${clean(each)} ÷ ${groups}`, `${groups} + ${clean(each)}`], random), inputmode: "text" }), component("result", "Meters altogether", result)], `Equal groups with the group size known use multiplication: ${equation} = ${result}.`, 2, flags, { micro: "decimal_multiply", skill: "multiply", target: "decimal_multiply", representation: "word", contextStructure: "unknown_total", familyId: "contrast-multiply", transferKind: "context" });
  }
  const a = randomInt(random, 120, 690) / 100, b = randomInt(random, 20, 110) / 100;
  if (kind === "add") {
    const equation = `${clean(a)} + ${clean(b)}`;
    return item("operation_contrast", `Two containers hold ${clean(a)} liters and ${clean(b)} liters. How much do they hold altogether?`, [component("equation", "Equation", equation, { options: shuffle([equation, `${clean(a)} − ${clean(b)}`, `${clean(a)} ÷ ${clean(b)}`], random), inputmode: "text" }), component("result", "Liters altogether", clean(a + b))], `Combining amounts uses addition: ${equation} = ${clean(a + b)}.`, 2, flags, { micro: "decimal_add", skill: "addsub", target: "decimal_add", representation: "word", contextStructure: "combine", familyId: "contrast-add", transferKind: "context" });
  }
  const total = a + b, equation = `${clean(total)} − ${clean(b)}`;
  return item("operation_contrast", `A container held ${clean(total)} liters. After ${clean(b)} liters were used, how much remained?`, [component("equation", "Equation", equation, { options: shuffle([equation, `${clean(total)} + ${clean(b)}`, `${clean(total)} ÷ ${clean(b)}`], random), inputmode: "text" }), component("result", "Liters remaining", clean(a))], `Finding what remains uses subtraction: ${equation} = ${clean(a)}.`, 2, flags, { micro: "decimal_subtract", skill: "addsub", target: "decimal_subtract", representation: "word", contextStructure: "remainder", familyId: "contrast-subtract", transferKind: "context" });
}

export function generateDivisionAssessmentQuestion(archetypeKey, difficulty = 2, random = Math.random, flags = {}) {
  const d = clamp(Number(difficulty) || 1, 1, 3), archetype = DIVISION_ARCHETYPES[archetypeKey] ? archetypeKey : pickDivisionArchetype(random, d);
  if (archetype === "division_units" || archetype === "division_decompose") return unitsItem(random, d, flags, archetype);
  if (archetype === "division_scale_relation") return scaleItem(random, d, flags);
  if (archetype === "division_reasonableness") return reasonablenessItem(random, d, flags);
  if (archetype === "division_model") return modelItem(random, d, flags);
  if (archetype === "division_algorithm") return algorithmItem(random, d, flags);
  if (archetype === "division_regroup") return regroupItem(random, d, flags);
  if (archetype === "division_error_analysis") return errorAnalysisItem(random, d, flags);
  if (archetype === "division_word_one_step" || archetype === "division_context_result") return contextItem(random, d, flags, archetype);
  if (archetype === "division_multistep") return multistepItem(random, d, flags);
  if (archetype === "tape_diagram_transfer") return tapeItem(random, d, flags);
  return metricItem(random, d, flags);
}
export function buildDivisionTestRun(random = Math.random, options = {}) {
  const flags = { testRun: true }, completedRuns = Math.max(0, Number(options.completedRuns) || 0), itemRandoms = Array.isArray(options.itemRandoms) ? options.itemRandoms : [];
  return DIVISION_TEST_RUN_ARCHETYPES.map((key, index) => {
    const itemRandom = typeof itemRandoms[index] === "function" ? itemRandoms[index] : random;
    return key === "operation_contrast" ? operationContrast(itemRandom, completedRuns, flags) : generateDivisionAssessmentQuestion(key, ["division_regroup", "division_multistep", "metric_embedded"].includes(key) ? 3 : 2, itemRandom, flags);
  }).map(question => ({ ...question, assisted: false, recovery: false, testRun: true, scaffoldText: "", workspace: null }));
}
