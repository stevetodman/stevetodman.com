const PLACE_NAMES = ["tenths", "hundredths", "thousandths"];

const parseNumber = value => {
  const cleaned = String(value ?? "").trim().replace(/,/g, "");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(cleaned)) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
};

const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-9;
const format = value => String(Math.round((Number(value) + Number.EPSILON) * 100000) / 100000);
const unique = values => [...new Set(values.map(String))];

function decimalShift(submitted, expected) {
  if (!Number.isFinite(submitted) || !Number.isFinite(expected) || expected === 0 || submitted === 0) return null;
  const ratio = Math.abs(submitted / expected);
  for (const shift of [-3, -2, -1, 1, 2, 3]) {
    if (close(ratio, 10 ** shift)) return shift;
  }
  return null;
}

function repair(prompt, options, answer, why) {
  const cleaned = unique(options);
  return { prompt, options: cleaned, answer: String(answer), why };
}

function expectedNumber(question) {
  const parsed = parseNumber(question?.answer);
  if (parsed !== null) return parsed;
  const audit = question?.audit || {};
  if (audit.kind === "expanded") return Number(audit.expected);
  return null;
}

function expandedForm(value) {
  const fixed = Math.abs(Number(value)).toFixed(3);
  const [wholeText, decimalText] = fixed.split(".");
  const terms = [];
  const whole = Number(wholeText);
  if (whole) terms.push(String(whole));
  [...decimalText].forEach((digitText, index) => {
    const digit = Number(digitText);
    if (!digit) return;
    terms.push(format(digit / (10 ** (index + 1))));
  });
  return terms.length ? terms.join(" + ") : "0";
}

function placeUnit(place) {
  return ({ tenths: "tenths of a whole", hundredths: "hundredths of a whole", thousandths: "thousandths of a whole" })[place] || "that place-value unit";
}

function magnitudeRepair(expected, operationName, question) {
  if (!Number.isFinite(expected) || expected === 0) {
    return repair(
      `Before doing ${operationName} again, what is the best first check?`,
      ["Estimate the size of the answer", "Ignore the decimal", "Count digits only"],
      "Estimate the size of the answer",
      "An estimate tells you where the decimal belongs before you trust the exact arithmetic."
    );
  }
  const absolute = Math.abs(expected);
  const lower = 10 ** Math.floor(Math.log10(absolute));
  const correctBand = `Between ${format(lower)} and ${format(lower * 10)}`;
  const options = unique([`Between ${format(lower / 10)} and ${format(lower)}`, correctBand, `Between ${format(lower * 10)} and ${format(lower * 100)}`]);
  return repair(
    `Before recalculating ${String(question?.prompt || operationName).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}, which interval has the right size for the answer?`,
    options,
    correctBand,
    "Estimate a range before calculating. The range checks the decimal position without revealing the exact answer."
  );
}

function componentDiagnosis(raw, question) {
  const response = raw && typeof raw === "object" ? raw : {};
  const expected = question?.correctResponse || {};
  const wrong = id => Object.hasOwn(expected, id) && String(response[id] ?? "").trim().toLowerCase() !== String(expected[id]).trim().toLowerCase();
  const wrongIds = Object.keys(expected).filter(wrong);
  if (wrongIds.length !== 1) return { key: "operation_arithmetic", confidence: "undifferentiated", message: "More than one part needs another example before the system can identify a specific misconception.", repair: magnitudeRepair(Number(Object.values(expected).find(value => parseNumber(value) !== null)), "calculation", question) };
  if (wrong("partition")) return { key: "division_decomposition", confidence: "plausible", message: "The decomposition must preserve the total and make each part divisible by the number of groups.", repair: repair("What makes a useful decomposition for division?", ["The parts equal the total and each part divides evenly", "The parts only need to look close", "Use the largest digits first"], "The parts equal the total and each part divides evenly", "A useful decomposition preserves the number and creates parts that can be shared equally.") };
  if (!wrong("unitsPerShare") && wrong("quotient")) return { key: "division_unit_to_value", confidence: "plausible", message: "You found the number of units; now connect those units to their decimal value.", repair: repair("Eight tenths has which decimal value?", ["0.8", "8", "0.08"], "0.8", "Eight tenths means 8 × 0.1, which is 0.8.") };
  if (wrong("renamedHundredths") || wrong("tenthsRemainder")) return { key: "division_regrouping", confidence: "plausible", message: "The intermediate remainder needs to be renamed into the next smaller unit.", repair: repair("When 2 tenths remain, how many hundredths do they become?", ["20", "2", "200"], "20", "Each tenth is 10 hundredths, so 2 tenths become 20 hundredths.") };
  if (wrong("total") || wrong("oneGroup") || wrong("onePart")) return { key: "division_model_interpretation", confidence: "plausible", message: "Read the model's unit labels and distinguish the total from one equal group.", repair: repair("In an equal-groups model, what does one box represent?", ["One equal share", "The total of all shares", "The number of groups"], "One equal share", "Each equal box represents one share; all boxes together represent the total.") };
  if (wrong("equation")) return { key: "division_quantity_roles", confidence: "plausible", message: "Identify the total, number of equal groups, and amount in each group before choosing an operation.", repair: repair("When the total and number of equal groups are known, what operation finds one share?", ["Division", "Multiplication", "Addition"], "Division", "Dividing the total by the number of equal groups finds one share.") };
  if (wrong("plan")) return { key: "multistep_sequence", confidence: "plausible", message: "Find the amount that remains before sharing it equally.", repair: repair("What must happen before the remaining amount is shared?", ["Subtract the amount used", "Divide the original total", "Add the amounts"], "Subtract the amount used", "First find the remainder; then divide that remainder into equal groups.") };
  if (wrong("unit")) return { key: "division_context_unit", confidence: "plausible", message: "The number and its unit must answer the quantity requested in the story.", repair: repair("What should the answer's unit describe?", ["The requested amount", "The number of groups", "The operation symbol"], "The requested amount", "A numerical result must keep the unit of the quantity the question asks for.") };
  if (wrong("firstError")) return { key: "division_error_analysis", confidence: "plausible", message: "Check each written step in order and stop at the first statement that changes the value incorrectly.", repair: repair("How should you find the first error in worked mathematics?", ["Check each step from the beginning", "Look only at the final answer", "Choose the longest step"], "Check each step from the beginning", "The first invalid transformation explains the later incorrect work.") };
  return null;
}

export function diagnoseMathError(raw, question) {
  const audit = question?.audit || {};
  if (audit.kind === "components") {
    const diagnosis = componentDiagnosis(raw, question);
    if (diagnosis) return diagnosis;
    const response = raw && typeof raw === "object" ? raw : {}, correct = question?.correctResponse || {};
    const wrongId = Object.keys(correct).find(id => String(response[id] ?? "").trim().toLowerCase() !== String(correct[id]).trim().toLowerCase());
    const submitted = parseNumber(response[wrongId]), expected = parseNumber(correct[wrongId]);
    const shift = decimalShift(submitted, expected);
    if (shift !== null) return { key: "decimal_magnitude", confidence: "plausible", message: "The decimal appears to be in the wrong place.", repair: magnitudeRepair(expected, "division", question) };
    return { key: "operation_arithmetic", confidence: "undifferentiated", message: "The response does not identify one specific misconception yet.", repair: magnitudeRepair(expected, "calculation", question) };
  }
  const submitted = parseNumber(raw);
  const expected = expectedNumber(question);

  if (audit.kind === "digitAtPlace") {
    return {
      key: "place_sequence",
      message: "This looks like a place-value position mix-up.",
      repair: repair(
        "Starting immediately to the right of the decimal point, what is the order?",
        ["tenths → hundredths → thousandths", "hundredths → tenths → thousandths", "ones → tens → hundreds"],
        "tenths → hundredths → thousandths",
        "Decimal places begin with tenths, then hundredths, then thousandths."
      )
    };
  }

  if (audit.kind === "digitValue") {
    const decimalText = String(audit.numberText || "").split(".")[1] || "";
    const index = PLACE_NAMES.indexOf(audit.place);
    const digit = index >= 0 ? Number(decimalText[index] || 0) : null;
    const isDigitNotValue = submitted !== null && digit !== null && close(submitted, digit);
    return {
      key: isDigitNotValue ? "digit_vs_value" : "place_value",
      message: isDigitNotValue
        ? "You found the digit, but the question asks for that digit’s value."
        : "This looks like a digit-value place mix-up.",
      repair: repair(
        `A digit in the ${audit.place} place represents what kind of units?`,
        ["tenths of a whole", "hundredths of a whole", "thousandths of a whole"],
        placeUnit(audit.place),
        `The ${audit.place} place represents ${placeUnit(audit.place)}.`
      )
    };
  }

  if (audit.kind === "scale") {
    const shiftCount = Math.round(Math.log10(Number(audit.factor) || 1));
    const reversed = submitted !== null && close(
      submitted,
      audit.operation === "multiply" ? audit.a / audit.factor : audit.a * audit.factor
    );
    const shift = decimalShift(submitted, expected);
    if (reversed) {
      const answer = audit.operation === "multiply" ? "More" : "Less";
      return {
        key: "power10_direction",
        message: "That answer looks like the place values changed in the opposite direction.",
        repair: repair(
          `When you ${audit.operation} by a power of 10 here, does each digit become worth more or less?`,
          ["More", "Less"],
          answer,
          `${audit.operation === "multiply" ? "Multiplying" : "Dividing"} by a power of 10 makes each digit worth ${answer.toLowerCase()}.`
        )
      };
    }
    if (shift !== null) {
      const count = String(Math.max(1, shiftCount));
      return {
        key: "power10_shift_count",
        message: "Your direction looks plausible, but the number of place-value shifts looks off.",
        repair: repair(
          `How many place-value positions does ${Number(audit.factor).toLocaleString()} change?`,
          ["1", "2", "3"],
          count,
          `${Number(audit.factor).toLocaleString()} is 10${shiftCount > 1 ? `^${shiftCount}` : ""}, so the digits change ${count} place${count === "1" ? "" : "s"}.`
        )
      };
    }
    return {
      key: "power10_structure",
      message: "Recheck the direction and number of place-value changes.",
      repair: repair(
        `What should control the decimal change when you ${audit.operation} by ${Number(audit.factor).toLocaleString()}?`,
        ["Place value", "The number of digits", "A memorized decimal jump"],
        "Place value",
        "Powers of 10 change what each digit is worth; place value is the reliable rule."
      )
    };
  }

  if (audit.kind === "metric") {
    const reversed = submitted !== null && close(
      submitted,
      audit.operation === "multiply" ? audit.a / audit.factor : audit.a * audit.factor
    );
    const answer = audit.operation === "multiply" ? "Larger" : "Smaller";
    return {
      key: reversed ? "metric_direction" : "metric_scale",
      message: reversed
        ? "That answer looks like the unit conversion went in the opposite direction."
        : "Check whether the new unit should make the numerical value larger or smaller.",
      repair: repair(
        "For this conversion, should the numerical value become larger or smaller?",
        ["Larger", "Smaller"],
        answer,
        `For this conversion the numerical value should become ${answer.toLowerCase()}.`
      )
    };
  }

  if (audit.kind === "expanded") {
    const rightValue = submitted !== null && close(submitted, Number(audit.expected));
    const correctExpanded = expandedForm(audit.expected);
    return {
      key: rightValue ? "expanded_form_notation" : "expanded_place_value",
      message: rightValue
        ? "You have the right value. The question is asking you to show its place-value parts."
        : "One of the decimal place-value parts is probably missing or in the wrong place.",
      repair: repair(
        "Which choice shows the number in expanded decimal form?",
        [correctExpanded, format(audit.expected), `${format(audit.expected)} + 0`],
        correctExpanded,
        "Expanded form shows each nonzero digit as its place-value amount."
      )
    };
  }

  if (audit.kind === "compare" || audit.kind === "order") {
    return {
      key: "decimal_compare_place_value",
      message: "This looks like a decimal place-value comparison issue.",
      repair: repair(
        "What is the fastest reliable first step when decimal lengths differ?",
        ["Add placeholder zeros, then compare left to right", "Compare the last digit first", "The longer decimal is always larger"],
        "Add placeholder zeros, then compare left to right",
        "Placeholder zeros make like places easy to compare without changing the number’s value."
      )
    };
  }

  if (audit.kind === "round" || audit.kind === "roundMinimum") {
    if (audit.kind === "round" && submitted !== null) {
      const divisor = 10 ** (3 - Number(audit.digits));
      const truncated = Math.floor(Number(audit.thousandths) / divisor) * divisor / 1000;
      if (close(submitted, truncated) && !close(truncated, expected)) {
        return {
          key: "rounding_truncated",
          message: "You kept the target digit instead of checking whether it should round up.",
          repair: repair(
            "Which digit decides whether the target place stays the same or rounds up?",
            ["The digit immediately to its right", "The digit immediately to its left", "The final digit in the number"],
            "The digit immediately to its right",
            "Only the digit immediately to the right of the target place decides whether to round up."
          )
        };
      }
    }
    return {
      key: "rounding_place",
      message: "Check which place is the target and inspect only the digit immediately to its right.",
      repair: repair(
        "What should you mark first when rounding?",
        ["The target place", "The decimal point only", "The last digit"],
        "The target place",
        "Mark the target place first; then look one digit to the right."
      )
    };
  }

  if (audit.kind === "add" || audit.kind === "subtract") {
    return {
      key: "decimal_alignment",
      message: "This answer suggests the place-value columns or arithmetic need a quick check.",
      repair: repair(
        `Before you ${audit.kind === "add" ? "add" : "subtract"} decimals, what must line up?`,
        ["Decimal points and like place values", "The last digits", "The largest digits"],
        "Decimal points and like place values",
        "Line up ones with ones, tenths with tenths, hundredths with hundredths, and use placeholder zeros when needed."
      )
    };
  }

  if (audit.kind === "product" || audit.kind === "quotient") {
    const shift = decimalShift(submitted, expected);
    return {
      key: shift !== null ? "decimal_magnitude" : "operation_arithmetic",
      message: shift !== null
        ? "Your digits look close, but the decimal appears to be in the wrong place."
        : "The decimal position may be fine; recheck the arithmetic with an estimate.",
      confidence: shift !== null ? "plausible" : "undifferentiated",
      repair: magnitudeRepair(expected, audit.kind === "product" ? "multiplication" : "division", question)
    };
  }

  if (audit.kind === "subtractDivide") {
    const totalPerGroup = Number.isFinite(Number(audit.totalScaled))
      ? (Number(audit.totalScaled) / (10 ** Number(audit.places))) / Number(audit.divisor)
      : null;
    const skippedSubtract = submitted !== null && close(submitted, totalPerGroup);
    return {
      key: skippedSubtract ? "multistep_skipped_subtraction" : "multistep_sequence",
      message: skippedSubtract
        ? "That answer looks like you divided the original total before subtracting what was used."
        : "This is a two-step problem. Check the order of the operations.",
      repair: repair(
        "What must happen before the remaining amount is shared equally?",
        ["Subtract the amount used", "Divide the original total", "Add the amounts"],
        "Subtract the amount used",
        "First find what remains. Then divide that remainder into equal groups."
      )
    };
  }

  return {
    key: "recheck_strategy",
    message: "Recheck the place value and use an estimate before trying the exact arithmetic again.",
    repair: repair(
      "What is the best quick check before recalculating?",
      ["Estimate the answer", "Ignore the decimal", "Count digits"],
      "Estimate the answer",
      "An estimate catches many place-value and operation errors quickly."
    )
  };
}

export function makeRepairQuestion(question, diagnosis) {
  const fix = diagnosis?.repair;
  if (!fix) return null;
  return {
    ...question,
    prompt: fix.prompt,
    options: fix.options,
    components: null,
    correctResponse: null,
    answer: fix.answer,
    why: fix.why,
    assisted: true,
    recovery: false,
    transfer: false,
    recheck: false,
    repairOnly: true,
    workspace: null,
    scaffoldText: diagnosis.message,
    placeholder: ""
  };
}

export function diagnosisWithHistory(profile, diagnosis, question, now = Date.now()) {
  if (!diagnosis) return null;
  const confidence = diagnosis.confidence || (["power10_direction", "rounding_truncated", "decimal_magnitude", "multistep_skipped_subtraction"].includes(diagnosis.key) ? "plausible" : "undifferentiated");
  if (confidence !== "plausible") return { ...diagnosis, confidence };
  const target = question?.target || question?.micro;
  const family = question?.familyId;
  const corroborating = (profile?.attempts || []).some(attempt => { const age = now - Number(attempt.at); return !attempt.assisted && !attempt.repairOnly && !attempt.scaffoldShown && attempt.misconception === diagnosis.key && (attempt.target || attempt.micro) === target && attempt.familyId && family && attempt.familyId !== family && age >= 0 && age <= 14 * 86400000; });
  return { ...diagnosis, confidence: corroborating ? "supported" : "plausible" };
}
