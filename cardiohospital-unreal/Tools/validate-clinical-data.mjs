import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const path = resolve(here, "..", "Content", "Data", "clinical-content.json");
const document = JSON.parse(await readFile(path, "utf8"));

const failures = [];
if (document.schemaVersion !== 1) failures.push("schemaVersion must be 1");
if (!Array.isArray(document.cases) || document.cases.length !== 7) failures.push("expected exactly seven outpatient cases");

const ids = new Set();
for (const clinicalCase of document.cases ?? []) {
  if (!clinicalCase.id) failures.push("case missing id");
  if (ids.has(clinicalCase.id)) failures.push(`duplicate id ${clinicalCase.id}`);
  ids.add(clinicalCase.id);
  if (!clinicalCase.correctDiagnosis) failures.push(`${clinicalCase.id} missing diagnosis`);
  if (!Array.isArray(clinicalCase.history) || clinicalCase.history.length === 0) failures.push(`${clinicalCase.id} missing history`);
  if (!clinicalCase.exam?.vitals) failures.push(`${clinicalCase.id} missing vitals`);
  if (!clinicalCase.ecg?.pattern) failures.push(`${clinicalCase.id} missing ECG pattern`);
  if (!Array.isArray(clinicalCase.redFlagKeys)) failures.push(`${clinicalCase.id} missing red-flag keys`);
}

const hcm = document.cases?.find((item) => item.id === "case-hcm");
if (hcm?.correctDiagnosis !== "Hypertrophic Cardiomyopathy") failures.push("HCM immutable diagnosis changed");
if (!document.specialtyCases?.nicu?.steps?.length) failures.push("NICU sequence missing");
if (!document.capstone?.patients?.some((item) => item.correctFirst)) failures.push("capstone urgent-first truth missing");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Validated ${document.cases.length} outpatient cases and specialty content.`);

