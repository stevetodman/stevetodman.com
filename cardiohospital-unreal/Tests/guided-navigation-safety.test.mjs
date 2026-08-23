import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(resolve(projectRoot, path), "utf8");

function functionSlice(source, startSignature, endSignature) {
  const start = source.indexOf(startSignature);
  const end = source.indexOf(endSignature, start + startSignature.length);
  assert.ok(start >= 0, `missing function: ${startSignature}`);
  assert.ok(end > start, `missing boundary after: ${startSignature}`);
  return source.slice(start, end);
}

test("guided clinic travel never teleports the learner into conversation position", async () => {
  const source = await read("Source/CardioHospital/Private/CardioBlockoutCharacter.cpp");
  const faceNpc = functionSlice(
    source,
    "void ACardioBlockoutCharacter::FaceNpc(AActor* Npc)",
    "void ACardioBlockoutCharacter::AdvanceGuidedWalk()",
  );
  assert.doesNotMatch(faceNpc, /SetActorLocation|TeleportPhysics/,
    "conversation facing must not teleport the player through room geometry");
  assert.match(faceNpc, /LookAtActorFace\(Npc\)/,
    "the learner should face the NPC after arriving normally");
  assert.match(faceNpc, /Attending->FaceToward\(GetActorLocation\(\)\)/,
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
  const walkTo = functionSlice(
    source,
    "void ACardioBlockoutCharacter::WalkTo(const FVector& Destination, const bool bInteractWhenThere)",
    "void ACardioBlockoutCharacter::CancelGuidedWalk()",
  );
  assert.match(walkTo, /bInteractOnArrival = false/,
    "station navigation should stop and let the learner choose when to interact");
  assert.match(source, /GuidedPath\.Add\(FVector\(DoorXFor\(From\), From\.Y > 0\.f \? 160\.f : -160\.f/,
    "room exits must route through authored doorway centers");
  assert.match(source, /GuidedPath\.Add\(FVector\(DoorXFor\(Destination\), Destination\.Y > 0\.f \? 160\.f : -160\.f/,
    "room entries must route through authored doorway centers");
});
