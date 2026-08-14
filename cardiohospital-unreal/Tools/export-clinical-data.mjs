import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import { computeSourceHashes } from "./clinical-data-contract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");
const legacyRoot = resolve(projectRoot, "LegacyCore", "src", "lib");
const outputPath = resolve(projectRoot, "Content", "Data", "clinical-content.json");

async function load(moduleName) {
  return import(pathToFileURL(resolve(legacyRoot, moduleName)).href);
}

async function replaceFile(sourcePath, destinationPath) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await rename(sourcePath, destinationPath);
      return;
    } catch (error) {
      const retryable = ["EACCES", "EBUSY", "EPERM"].includes(error?.code);
      if (!retryable || attempt >= 39) throw error;
      await delay(25);
    }
  }
}

const casesModule = await load("cases-data.ts");
const caseGraphsModule = await load("case-graphs.ts");
const caseConceptsModule = await load("case-concepts.ts");
const metadataModule = await load("case-metadata.ts");
const capstoneModule = await load("capstone.ts");
const cathModule = await load("cath-case.ts");
const nicuModule = await load("nicu-case.ts");
const orModule = await load("or-case.ts");
const mriModule = await load("mri-case.ts");

const sourceHashes = await computeSourceHashes(legacyRoot);

const document = {
  schemaVersion: 3,
  // Keep generated output reproducible. Source hashes, not wall-clock time,
  // identify the exact clinical input set used for this document.
  generatedAt: "source-hash-derived",
  sourceHashes,
  cases: casesModule.CASES,
  caseGraphs: caseGraphsModule.CASE_GRAPHS,
  concepts: caseConceptsModule.CASE_CONCEPTS,
  metadata: metadataModule.CASE_METADATA,
  capstone: {
    patients: capstoneModule.CAPSTONE_PATIENTS,
    teaching: capstoneModule.CAPSTONE_TEACHING,
  },
  specialtyCases: {
    cath: cathModule.CATH_CASE,
    nicu: {
      steps: nicuModule.NICU_STEPS,
      teaching: nicuModule.NICU_TEACHING,
    },
    operatingRoom: orModule.OR_CASE,
    mri: {
      history: mriModule.MRI_HISTORY,
      slices: mriModule.MRI_SLICES,
      anatomyLabels: mriModule.MRI_ANATOMY_LABELS,
      teaching: mriModule.MRI_TEACHING,
    },
  },
};

await mkdir(dirname(outputPath), { recursive: true });
const temporaryPath = `${outputPath}.${process.pid}.${randomUUID()}.tmp`;
try {
  await writeFile(temporaryPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  await replaceFile(temporaryPath, outputPath);
} finally {
  await rm(temporaryPath, { force: true });
}
console.log(`Exported ${document.cases.length} cases to ${outputPath}`);
