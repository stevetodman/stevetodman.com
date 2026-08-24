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

test("Exam Room 3 station normalizes away from the center furniture cluster", async () => {
  const source = await read("Source/CardioHospital/Private/CardioBlockoutCharacter.cpp");
  assert.match(source, /LegacyExamRoom3Station\(-750\.f, 520\.f, 88\.f\)/,
    "the legacy station command must remain explicitly recognized");
  assert.match(source, /ExamRoom3PatientArrival\(-1080\.f, 700\.f, 88\.f\)/,
    "the station must resolve to the authored west-aisle patient arrival anchor");
  assert.match(source, /Destination\.Equals\(LegacyExamRoom3Station, 1\.f\)[\s\S]*ExamRoom3PatientArrival/,
    "station 2 must use the clear-floor arrival anchor before path construction");
});

test("encounter patient and parent have stable presentation-only interaction identities", async () => {
  const presentation = await read("Source/CardioHospital/Private/CardioEncounterPresentationNPC.cpp");
  const character = await read("Source/CardioHospital/Private/CardioBlockoutCharacter.cpp");
  const npcHeader = await read("Source/CardioHospital/Public/CardioBlockoutNPC.h");

  assert.match(presentation, /ConfigureRole\(TEXT\("Patient"\), TEXT\("encounter-patient"\)\)/);
  assert.match(presentation, /ConfigureRole\(TEXT\("Parent"\), TEXT\("encounter-parent"\)\)/);
  assert.match(npcHeader, /ConfigurePresentationIdentity/,
    "presentation roles need targeting IDs without invoking attending-specific visual assembly");
  assert.match(character, /Candidate->GetNpcId\(\) == EncounterPatientNpcId/,
    "station arrival must select the authored patient deterministically rather than actor iteration order");
});

test("presentation identities do not hardcode clinical patient truth", async () => {
  const presentation = await read("Source/CardioHospital/Private/CardioEncounterPresentationNPC.cpp");
  assert.doesNotMatch(presentation, /Marcus|Chen|hypertrophic|syncope|murmur/i,
    "presentation actors must remain role-only; clinical identity and findings belong to the runtime");
});
