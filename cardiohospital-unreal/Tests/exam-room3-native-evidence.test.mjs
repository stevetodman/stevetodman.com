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

function syntheticPng(width = 2560, height = 1440) {
  const bytes = Buffer.alloc(2048);
  Buffer.from("89504e470d0a1a0a", "hex").copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function makeEvidence(mutator = () => {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "exam-room3-native-"));
  const captureDir = path.join(dir, "captures");
  mkdirSync(captureDir, { recursive: true });
  const captures = ["doorway", "patient-side", "provider"].map((id) => {
    const capturePath = path.join(captureDir, `${id}.png`);
    const fixture = syntheticPng();
    writeFileSync(capturePath, fixture);
    return { id, path: capturePath, bytes: fixture.length, width: 2560, height: 1440 };
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

test("renamed text cannot impersonate a PNG capture", () => {
  withEvidence((result) => {
    writeFileSync(result.captures[0].path, "not a png");
    result.captures[0].bytes = 9;
  }, (dir) => {
    const validation = validate(dir);
    assert.notEqual(validation.status, 0);
    assert.match(validation.stdout, /not a valid PNG header/);
  });
});

test("wrong-resolution PNG cannot satisfy the locked capture gate", () => {
  withEvidence((result) => {
    const fixture = syntheticPng(1920, 1080);
    writeFileSync(result.captures[1].path, fixture);
    result.captures[1].bytes = fixture.length;
    result.captures[1].width = 1920;
    result.captures[1].height = 1080;
  }, (dir) => {
    const validation = validate(dir);
    assert.notEqual(validation.status, 0);
    assert.match(validation.stdout, /PNG dimensions must be 2560x1440/);
  });
});
