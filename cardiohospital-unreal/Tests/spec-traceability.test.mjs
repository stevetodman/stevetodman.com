import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");
const planPath = resolve(projectRoot, "LegacyCore", "plan.md");
const tracePath = resolve(projectRoot, "SPEC_TRACEABILITY.md");
const adrPath = resolve(projectRoot, "Docs", "ADR-0001-unreal-5-8-product-rebaseline.md");
const rebaselineAdrPath = resolve(projectRoot, "Docs", "ADR-0002-macos-release-target.md");
const checklistPath = resolve(projectRoot, "WALKTHROUGH_CHECKLIST.md");

const SOURCE_BLOB = "e89351733c467c694677100b4f82157f6917ba02";
const ASSESSMENT_BASE = "2b9b0ffe13417e436d16985ae318eceab652ecda";
const ALLOWED_STATUSES = new Set([
  "TESTED-PORTABLE",
  "PREVIEW-ONLY",
  "DATA-ONLY",
  "PARTIAL",
  "MISSING",
  "FUTURE",
  "SUPERSEDED",
  "WORKSTATION-GATED",
]);
const ALLOWED_EVIDENCE = new Set([
  "BH",
  "BW",
  "CG",
  "EE",
  "SD",
  "AR",
  "UD",
  "UR",
  "U0",
  "OPS",
  "CI",
  "NONE",
]);
const EXPECTED_STATUS_COUNTS = {
  "TESTED-PORTABLE": 20,
  "PREVIEW-ONLY": 22,
  "DATA-ONLY": 22,
  PARTIAL: 56,
  MISSING: 32,
  FUTURE: 8,
  SUPERSEDED: 6,
  "WORKSTATION-GATED": 2,
};

function gitBlobHash(buffer) {
  return createHash("sha1")
    .update(Buffer.from(`blob ${buffer.length}\0`))
    .update(buffer)
    .digest("hex");
}

function planSections(text) {
  return text
    .split(/\r?\n/)
    .map((line, index) => {
      const match = /^# (\d+)\. (.+)$/.exec(line);
      return match ? { id: Number(match[1]), title: match[2], line: index + 1 } : null;
    })
    .filter(Boolean);
}

function traceRows(text) {
  const start = text.indexOf("<!-- TRACEABILITY_TABLE_START -->");
  const end = text.indexOf("<!-- TRACEABILITY_TABLE_END -->");
  assert.ok(start >= 0 && end > start, "traceability table markers must exist in order");

  const body = text.slice(start, end);
  const rowPattern = /^\|\s*(\d+)\s*\|\s*`LegacyCore\/plan\.md:L(\d+)`\s*\|\s*([^|]+?)\s*\|\s*`([A-Z-]+)`\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm;
  return [...body.matchAll(rowPattern)].map((match) => ({
    id: Number(match[1]),
    line: Number(match[2]),
    title: match[3].trim(),
    status: match[4],
    evidence: [...match[5].matchAll(/`([A-Z0-9]+)`/g)].map((entry) => entry[1]),
    gap: match[6].trim(),
  }));
}

test("authoritative plan has one exact, classified trace row per section", async () => {
  const [planBuffer, trace] = await Promise.all([
    readFile(planPath),
    readFile(tracePath, "utf8"),
  ]);
  const plan = planBuffer.toString("utf8");
  const sections = planSections(plan);
  const rows = traceRows(trace);

  assert.equal(gitBlobHash(planBuffer), SOURCE_BLOB, "authoritative plan blob changed without a rebaseline");
  assert.equal(sections.length, 168);
  assert.equal(rows.length, 168);
  assert.match(trace, new RegExp(ASSESSMENT_BASE));

  const statusCounts = Object.fromEntries([...ALLOWED_STATUSES].map((status) => [status, 0]));
  for (let index = 0; index < 168; index += 1) {
    const expectedId = index + 1;
    const section = sections[index];
    const row = rows[index];

    assert.equal(section.id, expectedId, `plan section ${expectedId} is missing or out of order`);
    assert.equal(row.id, expectedId, `trace row ${expectedId} is missing or out of order`);
    assert.equal(row.line, section.line, `trace source line is stale for section ${expectedId}`);
    assert.equal(row.title, section.title, `trace title is stale for section ${expectedId}`);
    assert.ok(ALLOWED_STATUSES.has(row.status), `invalid status ${row.status} in section ${expectedId}`);
    assert.ok(row.evidence.length > 0, `section ${expectedId} must name evidence or NONE`);
    row.evidence.forEach((code) => {
      assert.ok(ALLOWED_EVIDENCE.has(code), `unknown evidence code ${code} in section ${expectedId}`);
    });
    assert.ok(row.gap.length >= 10, `section ${expectedId} must state a concrete gap or next gate`);
    statusCounts[row.status] += 1;
  }

  assert.deepEqual(statusCounts, EXPECTED_STATUS_COUNTS);
  for (const [status, count] of Object.entries(EXPECTED_STATUS_COUNTS)) {
    assert.match(trace, new RegExp("\\| `" + status + "` \\| " + count + " \\|"));
  }
});

test("rebaseline ADR covers every approved platform conflict and evidence boundary", async () => {
  const [plan, trace, adr] = await Promise.all([
    readFile(planPath, "utf8"),
    readFile(tracePath, "utf8"),
    readFile(adrPath, "utf8"),
  ]);

  assert.match(plan, /Rendering:\*\* Three\.js/);
  assert.match(plan, /Typical laptop should be supported\./);
  assert.match(plan, /Load the application in Chrome\./);
  assert.match(plan, /photorealistic avatars/);

  assert.match(adr, /Unreal Engine 5\.8 is the production client/);
  assert.match(adr, /packaged Windows executable replaces Chrome/);
  assert.match(adr, /stable 60 FPS at 2560x1440/);
  assert.match(adr, /RTX 4080\/4090 or RTX 5080\/5090-class/);
  assert.match(adr, /Dr\. Patel is the only initial MetaHuman character-quality gate/);
  assert.match(adr, /do not count as\s+native implementation/);
  assert.match(adr, /remaining 18 semantic steps stay in force/);
  assert.match(adr, new RegExp(ASSESSMENT_BASE));

  assert.match(trace, /`PREVIEW-ONLY` never\s+counts as native coverage/);
  assert.match(trace, /A checklist or script is evidence of a gate, not\s+evidence that the gate passed/);

  // ADR-0001 is retained unaltered as history and annotated, not rewritten.
  assert.match(adr, /superseded by/i);
  assert.match(adr, /ADR-0002-macos-release-target\.md/);

  await Promise.all([
    access(resolve(projectRoot, "AGENTS.md")),
    access(resolve(projectRoot, "WALKTHROUGH_CHECKLIST.md")),
    access(resolve(projectRoot, "CardioHospital.uproject")),
    access(resolve(projectRoot, "Content", "Data", "clinical-content.json")),
    access(resolve(projectRoot, "Source", "CardioHospital", "Private", "CardioCaseRuntimeSubsystem.cpp")),
    access(resolve(projectRoot, "..", "cardiohospital", "app.js")),
    access(resolve(projectRoot, "..", "cardio-hospital-3d", "src", "components", "world")),
  ]);
});

test("macOS rebaseline ADR moves the platform without loosening any gate", async () => {
  const [rebaseline, checklist, trace] = await Promise.all([
    readFile(rebaselineAdrPath, "utf8"),
    readFile(checklistPath, "utf8"),
    readFile(tracePath, "utf8"),
  ]);

  // What changed.
  assert.match(rebaseline, /Apple silicon macOS is the production platform/);
  assert.match(rebaseline, /packaged macOS application replaces the packaged Windows executable/);
  assert.match(rebaseline, /Apple M4 Max/);
  assert.match(rebaseline, new RegExp(ASSESSMENT_BASE));

  // What deliberately did not change. The learner-facing bar and the 19-step
  // semantics survive the platform move.
  assert.match(rebaseline, /stable 60 FPS at 2560x1440/);
  assert.match(rebaseline, /16\.7 ms/);
  assert.match(rebaseline, /remaining 18\s+semantic steps stay in force/);
  assert.match(rebaseline, /ADR-0001 section 4 stands in full/);

  // Measurements may not be inherited across a renderer change.
  assert.match(rebaseline, /No previously recorded Windows figure may be carried\s+forward/);
  assert.match(trace, /No\s+Windows figure may be carried forward/);

  // Gatekeeper bypass must not become the launch path.
  assert.match(rebaseline, /invalidates the\s+walkthrough/);
  assert.match(checklist, /quarantine attribute/);

  // The checklist points at the shell workflow and keeps all nineteen steps.
  assert.match(checklist, /Scripts\/check-workstation\.sh/);
  assert.match(checklist, /Scripts\/package-macos\.sh/);
  assert.match(checklist, /Scripts\/record-walkthrough-evidence\.sh/);
  assert.doesNotMatch(checklist, /CardioHospital\.exe/);
  const steps = [...checklist.matchAll(/^(\d+)\. /gm)].map((match) => Number(match[1]));
  assert.ok(steps.filter((step) => step === 19).length >= 1, "the nineteenth acceptance step must survive");

  await access(resolve(projectRoot, "Scripts", "run-first-build.sh"));
});
