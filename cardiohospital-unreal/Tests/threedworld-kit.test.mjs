import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(resolve(projectRoot, path), "utf8");

const kitIds = [
  "SM_3DW_Computer",
  "SM_3DW_Keyboard",
  "SM_3DW_Mouse",
  "SM_3DW_Laptop",
  "SM_3DW_Sink",
  "SM_3DW_Stool",
  "SM_3DW_Trashcan",
  "SM_3DW_Bookcase",
  "SM_3DW_SideTable",
  "SM_3DW_Bear",
  "SM_3DW_Dino",
  "SM_3DW_HumanHeart",
  "SM_3DW_VsdHeart",
];

test("the 3dworld kit keeps source GLB, FBX, credits, and a provenance manifest", async () => {
  const manifest = JSON.parse(await read("Content/Environment/Source/3dworld/ASSET_MANIFEST.json"));
  const credit = await read("Content/Environment/Source/3dworld/CREDIT.txt");

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.sourceRepository, "https://github.com/stevetodman/3dworld");
  assert.equal(manifest.assets.length, kitIds.length);
  assert.match(credit, /Kenney Furniture Kit/);
  assert.match(credit, /CC-BY-NC-SA/);
  assert.match(credit, /parent-avatar\.glb/);

  for (const id of kitIds) {
    const asset = manifest.assets.find((entry) => entry.id === id);
    assert.ok(asset, `manifest missing ${id}`);
    assert.match(asset.unrealPath, new RegExp(`/Game/Environment/Clinic/${id}\\.${id}`));
    assert.ok(asset.license);
    assert.ok(asset.sha256.glb);
    assert.ok(asset.sha256.fbx);
    assert.ok(asset.dimensionsCm.z > 0);
    await stat(resolve(projectRoot, `Content/Environment/Source/3dworld/fbx/${id}.fbx`));
    await stat(resolve(projectRoot, `Content/Environment/Clinic/${id}.uasset`));
  }

  const vsd = manifest.assets.find((entry) => entry.id === "SM_3DW_VsdHeart");
  assert.equal(vsd.license, "CC-BY-NC-SA");
  assert.match(vsd.clinicalValidation, /not clinically validated/);
});

test("the cook hard-references every 3dworld clinic mesh", async () => {
  const source = await read("Source/CardioHospital/Private/CardioBlockoutGameMode.cpp");
  const polish = await read("Source/CardioHospital/Private/CardioClinicPolish.cpp");

  for (const id of kitIds) {
    const path = `\\/Game\\/Environment\\/Clinic\\/${id}\\.${id}`;
    assert.match(source, new RegExp(`ConstructorHelpers::FObjectFinder<UStaticMesh> \\w+\\(TEXT\\("${path}"\\)\\)`),
      `GameMode must hard-ref ${id}`);
    assert.match(polish, new RegExp(`LoadClinicMesh\\(TEXT\\("${path}"\\)\\)`),
      `polish must load ${id}`);
  }

  assert.match(polish, /SpawnThreeDWorldDressing/);
  assert.match(polish, /HeartStand\(1280\.f, -520\.f, 0\.f\)/,
    "teaching hearts must stay in the echo room, east of the doorway");
  assert.match(polish, /FVector\(-980\.f, 780\.f, 0\.f\)/,
    "Exam Room 3 side table must stay west of the bed and clear of the doorway");
  assert.doesNotMatch(polish, /hospital-full|operating-room|male-tech|parent-avatar|female-doctor/);
  assert.doesNotMatch(source, /hospital-full|operating-room|male-tech|parent-avatar/);
});

test("the blender converter stays slice-scoped and centimeter-correct", async () => {
  const script = await read("Scripts/blender_3dworld_kit.py");
  const importer = await read("Scripts/import-3dworld-kit.py");

  assert.match(script, /target_height_cm/);
  assert.match(script, /hospital-full/);
  assert.match(script, /Patel-only/);
  assert.match(script, /flatten_to_static_mesh/);
  assert.match(importer, /SM_3DW_\*\.fbx/);
  assert.match(importer, /\/Game\/Environment\/Clinic/);
});
