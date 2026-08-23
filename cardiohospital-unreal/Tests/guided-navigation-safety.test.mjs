import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(resolve(projectRoot, path), "utf8");

test("guided clinic travel never teleports the learner into conversation position", async () => {
  const source = await read("Source/CardioHospital/Private/CardioBlockoutCharacter.cpp");
  const faceNpc = source.match(/void ACardioBlockoutCharacter::FaceNpc\(AActor\* Npc\)[\s\S]*?\n}\n\nvoid ACardioBlockoutCharacter::AdvanceGuidedWalk/);
  assert.ok(faceNpc, "FaceNpc implementation must remain inspectable");
  assert.doesNotMatch(faceNpc[0], /SetActorLocation|TeleportPhysics/,
    "conversation facing must not teleport the player through room geometry");
  assert.match(faceNpc[0], /LookAtActorFace\(Npc\)/,
    "the learner should face the NPC after arriving normally");
  assert.match(faceNpc[0], /Attending->FaceToward\(GetActorLocation\(\)\)/,
    "the NPC should turn toward the learner before interaction");
});

test("guided travel stops on a collision stall instead of skipping blocked waypoints", async () => {
  const source = await read("Source/CardioHospital/Private/CardioBlockoutCharacter.cpp");
  assert.match(source, /WalkStallLimitSeconds = 2\.0f/);
  assert.match(source, /if \(WalkStallSeconds >= WalkStallLimitSeconds\)[\s\S]*CancelGuidedWalk\(\);[\s\S]*return;/,
    "a blocked path must stop rather than advance through geometry");
  assert.doesNotMatch(source, /To\.Size\(\) <= ArriveRadiusCm \|\| WalkStallSeconds/,
    "stall detection must never count as successful waypoint arrival");
});

test("guided station arrival leaves interaction explicit", async () => {
  const source = await read("Source/CardioHospital/Private/CardioBlockoutCharacter.cpp");
  const walkTo = source.match(/void ACardioBlockoutCharacter::WalkTo\([^]*?\n}\n\nvoid ACardioBlockoutCharacter::CancelGuidedWalk/);
  assert.ok(walkTo, "WalkTo implementation must remain inspectable");
  assert.match(walkTo[0], /bInteractOnArrival = false/,
    "station navigation should stop and let the learner choose when to interact");
  assert.match(source, /GuidedPath\.Add\(FVector\(DoorXFor\(From\), From\.Y > 0\.f \? 160\.f : -160\.f/,
    "room exits must route through authored doorway centers");
  assert.match(source, /GuidedPath\.Add\(FVector\(DoorXFor\(Destination\), Destination\.Y > 0\.f \? 160\.f : -160\.f/,
    "room entries must route through authored doorway centers");
});
