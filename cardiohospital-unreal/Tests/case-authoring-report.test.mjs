import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildCaseAuthoringReport } from "../Tools/case-authoring-report.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(here, "..", "Content", "Data", "clinical-content.json");

async function loadDocument() {
  return JSON.parse(await readFile(dataPath, "utf8"));
}

test("authoring report finds no blocking errors in compiled graphs", async () => {
  const report = buildCaseAuthoringReport(await loadDocument());
  assert.equal(report.summary.graphCount, 9);
  assert.equal(report.summary.readyGraphCount, 9);
  assert.equal(report.summary.errorCount, 0);
  assert.equal(report.cases.find((entry) => entry.caseId === "case-hcm").status, "ready");
  assert.ok(report.summary.warningCount > 0, "known structured-result gaps should remain visible");
});

test("all first-release cases have ready deterministic graphs", async () => {
  const report = buildCaseAuthoringReport(await loadDocument());
  for (const caseId of report.firstReleaseCaseIds) {
    const entry = report.cases.find((candidate) => candidate.caseId === caseId);
    assert.equal(entry.status, "ready");
  }
});

test("report rejects a graph that hides correct management", async () => {
  const document = structuredClone(await loadDocument());
  const graph = document.caseGraphs.find((entry) => entry.caseId === "case-hcm");
  graph.actions = graph.actions.filter((action) => action.target !== "Genetics consultation");
  const report = buildCaseAuthoringReport(document);
  const hcm = report.cases.find((entry) => entry.caseId === "case-hcm");
  assert.equal(hcm.status, "blocked");
  assert.ok(hcm.diagnostics.some((entry) => entry.code === "correct-management-unavailable"));
});
