import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// The walkable ward blockout is authored in C++ and wired through config. None
// of that is compiled or executed by CI on this platform, so these checks hold
// the three pieces together at the source level: a typo in a class path or an
// axis name produces a packaged app that boots to an empty world or a pawn
// that ignores input, and nothing else in the suite would notice.

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(resolve(projectRoot, path), "utf8");

test("the packaged app boots into the blockout game mode, not a bare Entry map", async () => {
  const engine = await read("Config/DefaultEngine.ini");

  // Entry stays the default map on purpose — the world is spawned in code.
  // Both halves of that design must hold, or launch is a black screen again.
  assert.match(engine, /GameDefaultMap=\/Engine\/Maps\/Entry/);
  assert.match(engine, /GlobalDefaultGameMode=\/Script\/CardioHospital\.CardioBlockoutGameMode/);

  const header = await read("Source/CardioHospital/Public/CardioBlockoutGameMode.h");
  assert.match(header, /UCLASS\(\)/);
  assert.match(header, /class CARDIOHOSPITAL_API ACardioBlockoutGameMode : public AGameModeBase/);
});

test("the blockout hard-references its engine primitives and spawns a start", async () => {
  const source = await read("Source/CardioHospital/Private/CardioBlockoutGameMode.cpp");

  // ConstructorHelpers references are what force the cooker to carry the
  // engine cube and its material; a soft object path would resolve in the
  // editor and quietly fail in the packaged build.
  assert.match(source, /ConstructorHelpers::FObjectFinder<UStaticMesh> \w+\(TEXT\("\/Engine\/BasicShapes\/Cube\.Cube"\)\)/);
  assert.match(source, /ConstructorHelpers::FObjectFinder<UMaterialInterface> \w+\(TEXT\("\/Engine\/BasicShapes\/BasicShapeMaterial\.BasicShapeMaterial"\)\)/);
  assert.match(source, /DefaultPawnClass = ACardioBlockoutCharacter::StaticClass\(\)/);
  assert.match(source, /SpawnActor<APlayerStart>/);

  // Movable before the mesh is assigned, or runtime spawning rejects it.
  assert.ok(
    source.indexOf("SetMobility(EComponentMobility::Movable)") < source.indexOf("SetStaticMesh(BlockMesh)"),
    "mobility must be set before the mesh is assigned",
  );
});

test("every axis the character binds is mapped, and every mapping is bound", async () => {
  const character = await read("Source/CardioHospital/Private/CardioBlockoutCharacter.cpp");
  const input = await read("Config/DefaultInput.ini");

  const bound = new Set([...character.matchAll(/BindAxis\(TEXT\("(\w+)"\)/g)].map((m) => m[1]));
  const mapped = new Set([...input.matchAll(/\+AxisMappings=\(AxisName="(\w+)"/g)].map((m) => m[1]));

  assert.ok(bound.size > 0, "the character must bind at least one axis");
  assert.deepEqual([...bound].sort(), [...mapped].sort(),
    "axis names bound in C++ and mapped in DefaultInput.ini must match exactly");

  // WASD plus mouse look are the minimum walkable contract.
  for (const key of ["Key=W", "Key=A", "Key=S", "Key=D", "Key=MouseX", "Key=MouseY"]) {
    assert.match(input, new RegExp(`\\+AxisMappings=\\([^)]*${key}\\)`), `missing mapping for ${key}`);
  }
});
