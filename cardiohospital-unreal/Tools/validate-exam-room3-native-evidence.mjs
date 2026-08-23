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
      "system.load",
      "world.enter",
      "navigate.workroom",
      "attending.open-assignment",
      "assignment.accept",
      "navigate.exam-room",
      "encounter.introduce",
      "history.generic",
      "history.exertional-timing",
      "history.family-sudden-death",
      "history.prodrome",
      "history.finish",
      "exam.general",
      "exam.vitals",
      "exam.auscultation",
      "exam.finish",
      "order.ecg",
      "review.ecg",
      "order.echo",
      "review.echo",
      "testing.finish",
      "navigate.return-workroom",
      "reasoning.submit",
      "reasoning.finish",
      "management.restrict-sports",
      "management.finish",
      "debrief.review",
      "performance.record",
      "next-case.begin",
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
      if (capture.width !== 2560 || capture.height !== 1440) {
        failures.push(`${id} capture must be 2560x1440`);
      }
      const capturePath = path.resolve(capture.path || "");
      if (!existsSync(capturePath)) {
        failures.push(`${id} capture file does not exist: ${capturePath}`);
      } else if (statSync(capturePath).size <= 0) {
        failures.push(`${id} capture file is empty: ${capturePath}`);
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
