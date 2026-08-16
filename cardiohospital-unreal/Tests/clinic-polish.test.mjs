import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(resolve(projectRoot, path), "utf8");

test("the game module owns the clinic-polish world hook", async () => {
  const module = await read("Source/CardioHospital/Private/CardioHospital.cpp");
  const header = await read("Source/CardioHospital/Private/CardioClinicPolish.h");

  assert.match(module, /class FCardioHospitalModule final : public FDefaultGameModuleImpl/);
  assert.match(module, /CardioClinicPolish::RegisterWorldHook\(\)/);
  assert.match(module, /CardioClinicPolish::UnregisterWorldHook\(\)/);
  assert.match(header, /void RegisterWorldHook\(\)/);
  assert.match(header, /void UnregisterWorldHook\(\)/);
});

test("the polish pass is packaged-safe, game-world-only, and idempotent", async () => {
  const source = await read("Source/CardioHospital/Private/CardioClinicPolish.cpp");

  assert.match(source, /FWorldDelegates::OnPostWorldInitialization/);
  assert.match(source, /World->IsGameWorld\(\)/);
  assert.match(source, /Cast<ACardioBlockoutGameMode>\(World->GetAuthGameMode\(\)\)/);
  assert.match(source, /SetTimerForNextTick/);
  assert.match(source, /CardioClinicPolish/);
  assert.match(source, /HasPolishActors/);
  assert.match(source, /ActorHasTag\(ClinicPolishTag\)/);
  assert.match(source, /\/Engine\/BasicShapes\/Cube\.Cube/);
  assert.match(source, /\/Game\/Environment\/Clinic\/SM_WallMonitor\.SM_WallMonitor/);
  assert.match(source, /ECollisionEnabled::NoCollision/);
  assert.doesNotMatch(source, /https?:\/\/|FHttp|Download|ProjectContentDir/,
    "the packaged visual pass must not depend on a network or editor-time source files");
});

test("the polish pass adds distinct clinical zones without embedding clinical truth", async () => {
  const source = await read("Source/CardioHospital/Private/CardioClinicPolish.cpp");

  for (const helper of [
    "SpawnWorkstation",
    "SpawnClinicalBoardDetails",
    "SpawnHeadwall",
    "SpawnSinkStation",
    "SpawnEchoConsole",
    "SpawnRoomBaseboards",
    "SpawnThreeDWorldDressing",
  ]) {
    assert.match(source, new RegExp(`${helper}\\(`), `missing ${helper}`);
  }

  assert.match(source, /FVector\(750\.f, 650\.f, 1\.2f\)/,
    "the team-room acoustic inset must stay clear of the corridor doorway");
  assert.match(source, /FVector\(-750\.f, 986\.f, 164\.f\)/,
    "Exam Room 3 needs a north-wall headwall behind its existing monitor");
  assert.match(source, /FVector\(1418\.f, -700\.f, 0\.f\)/,
    "the echo console must remain against the east wall, clear of the room entrance");
  assert.match(source, /hand-hygiene dispensers/);
  assert.doesNotMatch(source, /Marcus|Chen|Hypertrophic|diagnosis|chief complaint/i,
    "visual dressing may not duplicate authored case facts");
});
