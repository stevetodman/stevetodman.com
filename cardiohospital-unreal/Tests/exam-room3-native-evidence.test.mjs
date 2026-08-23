import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const validator = path.join(projectRoot, "Tools", "validate-exam-room3-native-evidence.mjs");

const actions = [
  "system.load", "world.enter", "navigate.workroom", "attending.open-assignment",
  "assignment.accept", "navigate.exam-room", "encounter.introduce", "history.generic",
  "history.exertional-timing", "history.family-sudden-death", "history.prodrome", "history.finish",
  "exam.general", "exam.vitals", "exam.auscultation", "exam.finish", "order.ecg", "review.ecg",
  "order.echo", "review.echo", "testing.finish", "navigate.return-workroom", "reasoning.submit",
  "reasoning.finish", "management.restrict-sports", "management.finish", "debrief.review",
  "performance.record", "next-case.begin",
];

function makeEvidence(mutator = () => {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "exam-room3-native-"));
  const captureDir = path.join(dir, "captures");
  mkdirSync(captureDir, { recursive: true });
  const captures = ["doorway", "patient-side", "provider"].map((id) => {
    const capturePath = path.join(captureDir, `${id}.png`);
    writeFileSync(capturePath, `synthetic-fixture-${id}`);
    return { id, path: capturePath, bytes: 10, width: 2560, height: 1440 };
  });
  const result = {
    schemaVersion: 1,
    sliceId: "exam-room3-hcm",
    caseId: "case-hcm",
    status: "success",
    clinicalAcceptancePassed: true,
    manualWalkthroughClaimed: false,
    performanceClaimed: false,
    wallEcgPlaced: false,
    completedActions: [...actions],
    captures,
    lockedCaptureCount: 3,
  };
  mutator(result, dir);
  writeFileSync(path.join(dir, "unreal-acceptance.json"), JSON.stringify(result, null, 2));
  return dir;
}

function validate(dir) {
  return spawnSync(process.execPath, [validator, dir], { encoding: "utf8" });
}

function withEvidence(mutator, fn) {
  const dir = makeEvidence(mutator);
  try { fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("complete native evidence fixture passes", () => {
  withEvidence(() => {}, (dir) => {
    const result = validate(dir);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  });
});

test("two locked captures cannot pass", () => {
  withEvidence((result) => {
    result.captures.pop();
    result.lockedCaptureCount = 2;
  }, (dir) => {
    const validation = validate(dir);
    assert.notEqual(validation.status, 0);
    assert.match(validation.stdout, /lockedCaptureCount must be 3|missing capture entry/);
  });
});

test("missing exertional history cannot pass", () => {
  withEvidence((result) => {
    result.completedActions = result.completedActions.filter((id) => id !== "history.exertional-timing");
  }, (dir) => {
    const validation = validate(dir);
    assert.notEqual(validation.status, 0);
    assert.match(validation.stdout, /missing completed action: history\.exertional-timing/);
  });
});

test("automated evidence cannot impersonate the manual walkthrough", () => {
  withEvidence((result) => {
    result.manualWalkthroughClaimed = true;
  }, (dir) => {
    const validation = validate(dir);
    assert.notEqual(validation.status, 0);
    assert.match(validation.stdout, /must not claim the manual walkthrough/);
  });
});
