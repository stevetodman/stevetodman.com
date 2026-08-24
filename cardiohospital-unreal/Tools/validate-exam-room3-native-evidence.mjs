#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const evidenceDir = path.resolve(process.argv[2] || "");
if (!process.argv[2]) {
  console.error("usage: node Tools/validate-exam-room3-native-evidence.mjs <evidence-dir>");
  process.exit(2);
}

const failures = [];
const resultPath = path.join(evidenceDir, "unreal-acceptance.json");

function inspectPng(filePath) {
  const bytes = readFileSync(filePath);
  if (bytes.length < 24) return { valid: false, reason: "too small to contain a PNG IHDR" };
  const signature = bytes.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return { valid: false, reason: "invalid PNG signature" };
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  return { valid: true, width, height, bytes: bytes.length };
}

if (!existsSync(resultPath)) {
  failures.push(`missing result file: ${resultPath}`);
} else {
  let result;
  try {
    result = JSON.parse(readFileSync(resultPath, "utf8"));
  } catch (error) {
    failures.push(`result JSON is invalid: ${error.message}`);
  }

  if (result) {
    if (result.schemaVersion !== 1) failures.push("schemaVersion must equal 1");
    if (result.sliceId !== "exam-room3-hcm") failures.push("sliceId must equal exam-room3-hcm");
    if (result.caseId !== "case-hcm") failures.push("caseId must equal case-hcm");
    if (result.status !== "success") failures.push(`native acceptance status is ${result.status}`);
    if (result.clinicalAcceptancePassed !== true) failures.push("clinicalAcceptancePassed must be true");
    if (result.manualWalkthroughClaimed !== false) failures.push("automated evidence must not claim the manual walkthrough");
    if (result.performanceClaimed !== false) failures.push("automated evidence must not claim performance validation");
    if (result.wallEcgPlaced !== false) failures.push("blocked wall ECG must remain absent");

    const requiredActions = [
      "system.load", "world.enter", "navigate.workroom", "attending.open-assignment",
      "assignment.accept", "navigate.exam-room", "encounter.introduce", "history.generic",
      "history.exertional-timing", "history.family-sudden-death", "history.prodrome", "history.finish",
      "exam.general", "exam.vitals", "exam.auscultation", "exam.finish", "order.ecg", "review.ecg",
      "order.echo", "review.echo", "testing.finish", "navigate.return-workroom", "reasoning.submit",
      "reasoning.finish", "management.restrict-sports", "management.finish", "debrief.review",
      "performance.record", "next-case.begin",
    ];
    const completed = Array.isArray(result.completedActions) ? result.completedActions : [];
    for (const action of requiredActions) {
      if (!completed.includes(action)) failures.push(`missing completed action: ${action}`);
    }

    const captures = Array.isArray(result.captures) ? result.captures : [];
    const expectedIds = ["doorway", "patient-side", "provider"];
    if (result.lockedCaptureCount !== 3) failures.push(`lockedCaptureCount must be 3, got ${result.lockedCaptureCount}`);

    for (const id of expectedIds) {
      const capture = captures.find((entry) => entry?.id === id);
      if (!capture) {
        failures.push(`missing capture entry: ${id}`);
        continue;
      }

      const capturePath = path.resolve(capture.path || "");
      const evidencePrefix = evidenceDir.endsWith(path.sep) ? evidenceDir : evidenceDir + path.sep;
      if (!capturePath.startsWith(evidencePrefix)) {
        failures.push(`${id} capture must live inside the evidence directory`);
        continue;
      }
      if (!existsSync(capturePath)) {
        failures.push(`${id} capture file does not exist: ${capturePath}`);
        continue;
      }
      if (statSync(capturePath).size <= 0) {
        failures.push(`${id} capture file is empty: ${capturePath}`);
        continue;
      }

      const png = inspectPng(capturePath);
      if (!png.valid) {
        failures.push(`${id} capture is not a valid PNG header: ${png.reason}`);
        continue;
      }
      if (png.width !== 2560 || png.height !== 1440) {
        failures.push(`${id} PNG dimensions must be 2560x1440, got ${png.width}x${png.height}`);
      }
      if (capture.width !== png.width || capture.height !== png.height) {
        failures.push(`${id} manifest dimensions do not match the PNG IHDR`);
      }
      if (capture.bytes !== png.bytes) {
        failures.push(`${id} manifest byte count does not match the capture file`);
      }
    }
  }
}

const output = {
  schemaVersion: 1,
  evidenceDir,
  passed: failures.length === 0,
  failures,
};
console.log(JSON.stringify(output, null, 2));
if (failures.length > 0) process.exit(1);
