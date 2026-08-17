import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const FIRST_RELEASE_CASE_IDS = Object.freeze([
  "case-innocent-murmur",
  "case-hcm",
  "case-vasovagal",
  "case-wpw",
  "case-myocarditis",
]);

function diagnostic(severity, code, message, reference) {
  return { severity, code, message, reference };
}

export function buildCaseAuthoringReport(document) {
  const clinicalCases = new Map(document.cases.map((clinicalCase) => [clinicalCase.id, clinicalCase]));
  const graphs = new Map(document.caseGraphs.map((graph) => [graph.caseId, graph]));
  const cases = [];

  for (const clinicalCase of document.cases) {
    const graph = graphs.get(clinicalCase.id);
    const diagnostics = [];
    if (!graph) {
      diagnostics.push(diagnostic(
        FIRST_RELEASE_CASE_IDS.includes(clinicalCase.id) ? "error" : "warning",
        "case-graph-missing",
        "Clinical truth has no deterministic encounter graph.",
        clinicalCase.id,
      ));
      cases.push({ caseId: clinicalCase.id, graphVersion: null, status: "not-authored", diagnostics });
      continue;
    }

    const historyKeys = new Set(clinicalCase.history.map((fact) => fact.key));
    const actionsByType = Map.groupBy(graph.actions, (action) => action.type);
    const historyActions = actionsByType.get("history") ?? [];
    const orderActions = actionsByType.get("order") ?? [];
    const reviewActions = actionsByType.get("review") ?? [];
    const managementActions = actionsByType.get("management") ?? [];
    const historyTargets = new Set(historyActions.map((action) => action.target));
    const orderTargets = new Set(orderActions.map((action) => action.target));
    const reviewTargets = new Set(reviewActions.map((action) => action.target));
    const managementTargets = new Set(managementActions.map((action) => action.target));

    for (const target of historyTargets) {
      if (!historyKeys.has(target)) {
        diagnostics.push(diagnostic("error", "unknown-history-target", `Graph exposes unknown history key ${target}.`, target));
      }
    }
    for (const key of clinicalCase.redFlagKeys) {
      if (!historyTargets.has(key)) {
        diagnostics.push(diagnostic("error", "red-flag-unavailable", `Red-flag history key ${key} cannot be asked.`, key));
      }
    }

    const classifiedTests = new Set([...clinicalCase.appropriateTests, ...clinicalCase.unnecessaryTests]);
    for (const target of orderTargets) {
      if (!classifiedTests.has(target)) {
        diagnostics.push(diagnostic("error", "unclassified-order", `Order ${target} is neither appropriate nor unnecessary.`, target));
      }
      if (!reviewTargets.has(target) && target !== "ECG" && target !== "Echocardiogram") {
        diagnostics.push(diagnostic("warning", "structured-result-missing", `Order ${target} has no structured review action or result payload.`, target));
      }
    }
    for (const target of clinicalCase.appropriateTests) {
      if (!orderTargets.has(target) && !managementTargets.has(target)) {
        diagnostics.push(diagnostic("warning", "appropriate-test-unavailable", `Appropriate test ${target} is not exposed in this graph.`, target));
      }
    }
    for (const target of clinicalCase.correctManagement) {
      if (!managementTargets.has(target)) {
        diagnostics.push(diagnostic("error", "correct-management-unavailable", `Correct management ${target} is not selectable.`, target));
      }
    }
    for (const entry of graph.counterfactuals) {
      if (!clinicalCases.has(entry.alternateCaseId)) {
        diagnostics.push(diagnostic("error", "counterfactual-case-missing", `Counterfactual case ${entry.alternateCaseId} has no clinical truth.`, entry.id));
      }
      else if (!graphs.has(entry.alternateCaseId)) {
        diagnostics.push(diagnostic("warning", "counterfactual-graph-missing", `Counterfactual case ${entry.alternateCaseId} is not yet playable.`, entry.id));
      }
    }

    const errorCount = diagnostics.filter((entry) => entry.severity === "error").length;
    cases.push({
      caseId: clinicalCase.id,
      graphVersion: graph.version,
      status: errorCount === 0 ? "ready" : "blocked",
      diagnostics,
    });
  }

  const allDiagnostics = cases.flatMap((entry) => entry.diagnostics);
  return {
    schemaVersion: 1,
    clinicalSchemaVersion: document.schemaVersion,
    firstReleaseCaseIds: [...FIRST_RELEASE_CASE_IDS],
    summary: {
      clinicalCaseCount: document.cases.length,
      graphCount: document.caseGraphs.length,
      readyGraphCount: cases.filter((entry) => entry.status === "ready").length,
      errorCount: allDiagnostics.filter((entry) => entry.severity === "error").length,
      warningCount: allDiagnostics.filter((entry) => entry.severity === "warning").length,
    },
    cases,
  };
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const dataPath = resolve(here, "..", "Content", "Data", "clinical-content.json");
  const document = JSON.parse(await readFile(dataPath, "utf8"));
  const report = buildCaseAuthoringReport(document);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.summary.errorCount > 0) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
