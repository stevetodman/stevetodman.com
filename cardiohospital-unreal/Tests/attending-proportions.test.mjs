import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("Patel recovers head height without widening the MetaHuman neck bust", async () => {
  const source = await readFile(
    resolve(projectRoot, "Source/CardioHospital/Private/CardioBlockoutNPC.cpp"),
    "utf8",
  );
  const scale = source.match(
    /SetRelativeScale3D\(FVector\((0\.\d+)f, (0\.\d+)f, (0\.\d+)f\)\);\n        }\n    }\n}\n\nvoid ACardioBlockoutNPC::EnsureSkinnedMeshesLoaded/,
  );
  assert.ok(scale, "the face-specific scale must remain adjacent to garment hiding");
  const [, x, y, z] = scale.map(Number);
  assert.equal(x, 0.88, "the neck bust must stay narrow across the lapels");
  assert.equal(y, 0.88, "the neck bust depth must stay constrained");
  assert.equal(z, 0.96, "the head should recover vertical proportion");
  assert.ok(z > x && z > y, "only vertical proportion should be recovered");
});
