import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { computeSourceHashes, validateClinicalDocument } from "./clinical-data-contract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");
const path = resolve(projectRoot, "Content", "Data", "clinical-content.json");
const legacyRoot = resolve(projectRoot, "LegacyCore", "src", "lib");
const document = JSON.parse(await readFile(path, "utf8"));
const expectedSourceHashes = await computeSourceHashes(legacyRoot);

const failures = validateClinicalDocument(document, { expectedSourceHashes });

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Validated ${document.cases.length} outpatient cases and specialty content.`);

