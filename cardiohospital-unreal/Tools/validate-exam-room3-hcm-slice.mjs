import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

export async function loadSliceInputs() {
  const [contract, clinical] = await Promise.all([
    readFile(resolve(root, "VerticalSlices", "ExamRoom3HCM", "acceptance-contract.json"), "utf8").then(JSON.parse),
    readFile(resolve(root, "Content", "Data", "clinical-content.json"), "utf8").then(JSON.parse),
  ]);
  return { contract, clinical };
}

function assetFit(asset, zone) {
  const allowed = {
    x: zone.sizeMeters[0] * (1 + asset.toleranceFraction),
    y: zone.sizeMeters[1] * (1 + asset.toleranceFraction),
    z: zone.sizeMeters[2] * (1 + asset.toleranceFraction),
  };
  const failedAxes = Object.entries(asset.dimensionsMeters)
    .filter(([axis, value]) => value > allowed[axis])
    .map(([axis]) => axis);
  return { fits: failedAxes.length === 0, failedAxes, allowed };
}

export function validateVerticalSlice(contract, clinical) {
  const failures = [];
  const warnings = [];

  const clinicalCase = clinical.cases.find((candidate) => candidate.id === contract.caseId);
  const graph = clinical.caseGraphs.find((candidate) => candidate.caseId === contract.caseId);
  if (!clinicalCase) failures.push(`Missing clinical case ${contract.caseId}`);
  if (!graph) failures.push(`Missing case graph ${contract.caseId}`);

  if (contract.runtime.owner !== "UCardioCaseRuntimeSubsystem") {
    failures.push("Clinical state owner must remain UCardioCaseRuntimeSubsystem");
  }
  if (contract.runtime.presentationMustNotMutateClinicalTruth !== true) {
    failures.push("Presentation layer is not explicitly prohibited from mutating clinical truth");
  }
  if (contract.runtime.startCase !== contract.caseId) {
    failures.push("Configured startCase does not match the slice caseId");
  }

  if (graph) {
    const graphActions = new Set(graph.actions.map((action) => action.id));
    for (const actionId of contract.runtime.requiredActions) {
      if (!graphActions.has(actionId)) failures.push(`Required slice action missing from graph: ${actionId}`);
    }
  }

  const cameraIds = contract.cameras.map((camera) => camera.id);
  if (contract.cameras.length !== 3) failures.push(`Expected exactly 3 locked cameras, found ${contract.cameras.length}`);
  if (new Set(cameraIds).size !== cameraIds.length) failures.push("Locked camera IDs must be unique");
  for (const camera of contract.cameras) {
    if (!Array.isArray(camera.locationMeters) || camera.locationMeters.length !== 3) {
      failures.push(`Camera ${camera.id} has invalid location`);
    }
    if (!Array.isArray(camera.targetMeters) || camera.targetMeters.length !== 3) {
      failures.push(`Camera ${camera.id} has invalid target`);
    }
    if (!(camera.lensMm > 0)) failures.push(`Camera ${camera.id} has invalid lens`);
  }

  for (const [actorId, actor] of Object.entries(contract.actors)) {
    if (actor.required !== true) failures.push(`Slice actor ${actorId} must be explicitly required`);
  }

  const assetReports = [];
  for (const asset of contract.assets) {
    const zone = contract.zones[asset.zone];
    if (!zone) {
      failures.push(`Asset ${asset.id} references missing zone ${asset.zone}`);
      continue;
    }
    const fit = assetFit(asset, zone);
    assetReports.push({ id: asset.id, status: asset.status, ...fit });

    if (asset.status === "integration_target" && !fit.fits) {
      failures.push(`Integration target ${asset.id} does not fit ${asset.zone}: ${fit.failedAxes.join(",")}`);
    }
    if (asset.status === "blocked_candidate" && fit.fits) {
      failures.push(`Blocked candidate ${asset.id} now fits; explicit review is required before changing its status`);
    }
    if (asset.status === "blocked_candidate" && !fit.fits) {
      warnings.push(`${asset.id} remains blocked on ${fit.failedAxes.join(",")}`);
    }
  }

  const examTable = assetReports.find((asset) => asset.id === "CH-EXAMTABLE-001");
  if (!examTable?.fits || examTable.status !== "integration_target") {
    failures.push("Pediatric exam table is not an eligible integration target");
  }

  const wallEcg = assetReports.find((asset) => asset.id === "CH-WALLECG-001");
  if (!wallEcg || wallEcg.status !== "blocked_candidate" || wallEcg.fits) {
    failures.push("Wall ECG must remain blocked until its current spatial mismatch is resolved");
  }

  for (const [gate, required] of Object.entries(contract.acceptance)) {
    if (required !== true) failures.push(`Acceptance gate ${gate} must be true`);
  }

  return {
    sliceId: contract.sliceId,
    caseId: contract.caseId,
    clinicalCaseFound: Boolean(clinicalCase),
    graphFound: Boolean(graph),
    assetReports,
    failures,
    warnings,
    passed: failures.length === 0,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const { contract, clinical } = await loadSliceInputs();
  const report = validateVerticalSlice(contract, clinical);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = report.passed ? 0 : 1;
}
