import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { murmurPatternForCase } from "../LegacyCore/src/lib/murmur-audio.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(projectRoot, "Source/CardioHospital/Private/CardioMurmurSynthesizer.cpp"), "utf8");

test("C++ murmur patterns stay aligned with the portable audio engine", () => {
  for (const caseId of ["case-hcm", "case-innocent-murmur", "case-myocarditis"]) {
    const pattern = murmurPatternForCase(caseId);
    assert.match(
      source,
      new RegExp(`CaseId == TEXT\\("${caseId}"\\)[\\s\\S]{0,80}return TEXT\\("${pattern}"\\)`),
      `${caseId} must map to ${pattern} in C++`,
    );
  }
  assert.equal(murmurPatternForCase("case-vasovagal"), "none");
  assert.match(source, /return TEXT\("none"\)/);
});

test("HCM and Still murmur site intensities match the portable table", () => {
  assert.match(source, /Pattern == TEXT\("hcm"\)[\s\S]{0,80}0\.15f, 0\.45f, 1\.f, 0\.55f/);
  assert.match(source, /Pattern == TEXT\("stills"\)[\s\S]{0,80}0\.1f, 0\.35f, 0\.9f, 0\.6f/);
  assert.match(source, /Pattern == TEXT\("hcm"\)[\s\S]{0,80}return 1\.5f/);
  assert.match(source, /Pattern == TEXT\("stills"\)[\s\S]{0,80}return 0\.6f/);
});
