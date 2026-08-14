import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { computeSourceHashes } from "./clinical-data-contract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");
const legacyRoot = resolve(projectRoot, "LegacyCore", "src", "lib");
const outputPath = resolve(projectRoot, "Content", "Data", "clinical-content.json");

async function load(moduleName) {
  return import(pathToFileURL(resolve(legacyRoot, moduleName)).href);
}

const casesModule = await load("cases-data.ts");
const metadataModule = await load("case-metadata.ts");
const capstoneModule = await load("capstone.ts");
const cathModule = await load("cath-case.ts");
const nicuModule = await load("nicu-case.ts");
const orModule = await load("or-case.ts");
const mriModule = await load("mri-case.ts");

const sourceHashes = await computeSourceHashes(legacyRoot);

const document = {
  schemaVersion: 1,
  // Keep generated output reproducible. Source hashes, not wall-clock time,
  // identify the exact clinical input set used for this document.
  generatedAt: "source-hash-derived",
  sourceHashes,
  cases: casesModule.CASES,
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
await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
console.log(`Exported ${document.cases.length} cases to ${outputPath}`);
