const POWER_MICROS = new Set(["powers_multiply", "powers_divide"]);

function optionSet(answer, candidates) {
  return [...new Set([String(answer), ...candidates.map(String)])].slice(0, 4);
}

export function misconceptionForAttempt(question, workspaceEvidence = null) {
  if (!POWER_MICROS.has(question?.micro) || !question?.workspace || question.workspace.type !== "place-value") return null;
  const delta = Number(workspaceEvidence?.delta) || 0;
  const expected = Number(workspaceEvidence?.expectedDelta) || (question.workspace.operation === "multiply" ? question.workspace.shift : -question.workspace.shift);
  if (delta !== 0 && Math.sign(delta) !== Math.sign(expected)) return "wrong_direction";
  if (delta !== 0 && Math.sign(delta) === Math.sign(expected) && delta !== expected) return "wrong_shift_count";
  return "place_value_result";
}

export function checkpointFor(question, misconception) {
  if (!POWER_MICROS.has(question?.micro) || !question?.workspace) return null;
  const workspace = question.workspace;
  const shift = Number(workspace.shift) || 1;
  const operation = workspace.operation;
  const directionAnswer = operation === "multiply" ? "larger" : "smaller";

  if (misconception === "wrong_shift_count") {
    const candidates = [1, 2, 3, Math.max(1, shift - 1), shift + 1];
    return {
      ...question,
      prompt: `Before rebuilding the number: <strong>how many places</strong> should every digit move when ${operation === "multiply" ? "multiplying" : "dividing"} by <span class="math">${workspace.factor.toLocaleString()}</span>?`,
      answer: String(shift),
      options: optionSet(shift, candidates),
      why: `${workspace.factor.toLocaleString()} is 10 multiplied by itself ${shift} time${shift === 1 ? "" : "s"}, so every digit moves ${shift} place${shift === 1 ? "" : "s"}.`,
      workspace: null,
      assisted: true,
      recovery: false,
      transfer: false,
      nonScoring: true,
      scaffoldStage: "checkpoint",
      scaffoldReason: "wrong_shift_count",
      scaffoldText: "Count the factors of 10. Each factor of 10 corresponds to one place-value shift."
    };
  }

  return {
    ...question,
    prompt: `Before moving any digits: should the new number be <strong>larger or smaller</strong> than <span class="math">${workspace.value}</span>?`,
    answer: directionAnswer,
    options: ["larger", "smaller"],
    why: `${operation === "multiply" ? "Multiplication" : "Division"} by ${workspace.factor.toLocaleString()} makes the value ${directionAnswer}.`,
    workspace: null,
    assisted: true,
    recovery: false,
    transfer: false,
    nonScoring: true,
    scaffoldStage: "checkpoint",
    scaffoldReason: misconception || "place_value_result",
    scaffoldText: operation === "multiply"
      ? "Multiplying by a number greater than 1 must make this positive value larger."
      : "Dividing this positive value by a number greater than 1 must make it smaller."
  };
}

export function guidedBuildFor(question) {
  if (!question) return null;
  return {
    ...question,
    assisted: true,
    recovery: false,
    transfer: false,
    nonScoring: false,
    scaffoldStage: "guided-build"
  };
}
