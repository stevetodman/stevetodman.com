import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { computeSourceHashes, sha256Text, validateClinicalDocument } from "../Tools/clinical-data-contract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");
const dataPath = resolve(projectRoot, "Content", "Data", "clinical-content.json");
const legacyRoot = resolve(projectRoot, "LegacyCore", "src", "lib");
const exportPath = resolve(projectRoot, "Tools", "export-clinical-data.mjs");
const clinicalSubsystemPath = resolve(projectRoot, "Source", "CardioHospital", "Private", "CardioClinicalDataSubsystem.cpp");

async function loadDocument() {
  return JSON.parse(await readFile(dataPath, "utf8"));
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

test("committed clinical content satisfies the Unreal contract", async () => {
  const document = await loadDocument();
  const expectedSourceHashes = await computeSourceHashes(legacyRoot);
  assert.deepEqual(validateClinicalDocument(document, { expectedSourceHashes }), []);
});

test("source hashing is identical for LF and CRLF checkouts", () => {
  assert.equal(sha256Text("first\nsecond\n"), sha256Text("first\r\nsecond\r\n"));
});

test("export is byte-for-byte deterministic", async () => {
  execFileSync(process.execPath, ["--experimental-strip-types", exportPath], { cwd: projectRoot });
  const first = await readFile(dataPath);
  execFileSync(process.execPath, ["--experimental-strip-types", exportPath], { cwd: projectRoot });
  const second = await readFile(dataPath);
  assert.equal(digest(first), digest(second));
});

test("validator rejects immutable clinical truth changes", async () => {
  const document = structuredClone(await loadDocument());
  document.cases.find((item) => item.id === "case-hcm").correctDiagnosis = "Vasovagal syncope";
  const failures = validateClinicalDocument(document);
  assert.ok(failures.includes("HCM immutable diagnosis changed"));
});

test("validator rejects stale generated hashes", async () => {
  const document = structuredClone(await loadDocument());
  const expectedSourceHashes = await computeSourceHashes(legacyRoot);
  document.sourceHashes["cases-data.ts"] = "0".repeat(64);
  const failures = validateClinicalDocument(document, { expectedSourceHashes });
  assert.ok(failures.includes("sourceHashes.cases-data.ts does not match normalized source content"));
});

test("validator rejects fields missing from the Unreal USTRUCT contract", async () => {
  const document = structuredClone(await loadDocument());
  document.cases[0].runtimeOnlyTruth = "must not bypass UCardioClinicalDataSubsystem";
  const failures = validateClinicalDocument(document);
  assert.ok(failures.some((failure) => failure.includes("fields not represented by the Unreal contract")));
});

test("validator rejects unreachable case graph nodes", async () => {
  const document = structuredClone(await loadDocument());
  document.caseGraphs[0].nodes.push({
    id: "orphan",
    phase: "invalid",
    availableActions: [],
    acceptanceActions: [],
    transitions: [{ to: "complete", allOf: [], anyOf: [] }],
  });
  const failures = validateClinicalDocument(document);
  assert.ok(failures.includes("caseGraphs[0].nodes contains unreachable node orphan"));
});

test("validator rejects graph references to unknown actions", async () => {
  const document = structuredClone(await loadDocument());
  document.caseGraphs[0].nodes[0].availableActions.push("invented.action");
  const failures = validateClinicalDocument(document);
  assert.ok(failures.some((failure) => failure.includes("references unknown action invented.action")));
});

test("Unreal loader schema version stays synchronized with generated content", async () => {
  const document = await loadDocument();
  const source = await readFile(clinicalSubsystemPath, "utf8");
  const match = source.match(/SupportedClinicalSchemaVersion\s*=\s*(\d+)/);
  assert.ok(match, "C++ supported schema constant was not found");
  assert.equal(Number(match[1]), document.schemaVersion);
});
