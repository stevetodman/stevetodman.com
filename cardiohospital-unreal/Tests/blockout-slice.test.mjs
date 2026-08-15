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
  assert.match(
    source,
    /const FVector ReceptionPlayerStart\(-1200\.0, -600\.0, 110\.0\)/,
    "the reception start must stay clear of its landmark desk",
  );
  assert.match(
    source,
    /const FVector ReceptionDoorwayCenter\(-750\.0, -200\.0, 110\.0\)/,
    "the intended doorway center must remain explicit",
  );
  assert.match(
    source,
    /StartRotation = \(ReceptionDoorwayCenter - ReceptionPlayerStart\)\.Rotation\(\)/,
    "the reception start must look through the doorway rather than at either adjoining wall",
  );
  assert.match(
    source,
    /SpawnActor<APlayerStart>\(ReceptionPlayerStart, StartRotation, Params\)/,
    "the calculated doorway-facing rotation must be used to spawn the player start",
  );

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

  // The same contract holds for actions: every BindAction name needs a
  // mapping, and every mapping needs a binding.
  const boundActions = new Set([...character.matchAll(/BindAction\(TEXT\("(\w+)"\)/g)].map((m) => m[1]));
  const mappedActions = new Set([...input.matchAll(/\+ActionMappings=\(ActionName="(\w+)"/g)].map((m) => m[1]));
  assert.ok(boundActions.has("Interact"), "the character must bind Interact");
  assert.deepEqual([...boundActions].sort(), [...mappedActions].sort(),
    "action names bound in C++ and mapped in DefaultInput.ini must match exactly");
});

test("the ward names its rooms to match the case flow", async () => {
  const source = await read("Source/CardioHospital/Private/CardioBlockoutGameMode.cpp");

  for (const room of ["Exam Room 3", "Cardiology Team Room", "Reception", "Education Room", "ECG / Echo"]) {
    assert.match(source, new RegExp(`SpawnSign\\(World, TEXT\\("${room}"\\)`), `missing door sign for ${room}`);
  }
});

test("the team room assignment starts a case that ships in clinical content", async () => {
  const source = await read("Source/CardioHospital/Private/CardioBlockoutGameMode.cpp");

  // The assigned case id must be a real id in the shipped content document,
  // or the packaged interaction fails at runtime with no compile-time signal.
  const idMatch = source.match(/GAssignedCaseId = TEXT\("([\w-]+)"\)/);
  assert.ok(idMatch, "the game mode must declare GAssignedCaseId");
  const content = JSON.parse(await read("Content/Data/clinical-content.json"));
  const caseIds = content.cases.map((c) => c.id);
  assert.ok(caseIds.includes(idMatch[1]),
    `assigned case "${idMatch[1]}" is not in clinical-content.json (has: ${caseIds.join(", ")})`);
  const graphIds = content.caseGraphs.map((g) => g.caseId);
  assert.ok(graphIds.includes(idMatch[1]),
    `assigned case "${idMatch[1]}" has no case graph, so StartCase would fail`);

  // Clinical truth lives in the content document. The game mode may name the
  // attending and the rooms, but never the patient or the diagnosis.
  assert.doesNotMatch(source, /\bMarcus\b|\bChen\b|\bHypertrophic\b|\bbasketball\b/i,
    "clinical facts must come from the content document, not the game mode");

  // The runtime and HUD wiring the assignment depends on.
  assert.match(source, /Runtime->StartCase\(GAssignedCaseId, StartError\)/);
  assert.match(source, /GetActiveClinicalCase\(\)/);
  assert.match(source, /HUDClass = ACardioBlockoutHUD::StaticClass\(\)/);
});

test("exam room 3 advances the case graph without a placeholder patient NPC", async () => {
  const source = await read("Source/CardioHospital/Private/CardioBlockoutGameMode.cpp");
  const header = await read("Source/CardioHospital/Public/CardioBlockoutGameMode.h");
  const character = await read("Source/CardioHospital/Private/CardioBlockoutCharacter.cpp");
  const hud = await read("Source/CardioHospital/Private/CardioBlockoutHUD.cpp");

  assert.match(header, /static bool IsExamRoom3Location/);
  assert.match(header, /static bool IsTeamRoomLocation/);
  assert.match(header, /static bool IsEducationRoomLocation/);
  assert.match(source, /ShowEcgReview/);
  assert.match(source, /ShowEchoReview/);
  assert.match(source, /ShowDiagnosticsMenu/);
  assert.match(hud, /Review ECG and echo/);
  assert.match(source, /TEXT\("navigate.exam-room"\)/);
  assert.match(source, /TEXT\("encounter.introduce"\)/);
  assert.match(source, /TEXT\("navigate.return-workroom"\)/);
  assert.match(source, /attending.open-assignment/);
  assert.match(source, /assignment.accept/);
  assert.match(source, /reasoning.submit/);
  assert.match(source, /debrief.review/);
  assert.match(source, /performance.record/);
  assert.match(source, /next-case.begin/);
  assert.match(source, /Differentials/);
  assert.match(source, /RecordAttempt/);
  assert.match(source, /SelectNextCase/);
  assert.match(source, /EvaluateCurrentAttempt/);
  assert.match(source, /AttendingSocratic/);
  assert.match(source, /MissedOpportunityTemplate/);
  assert.match(source, /SpeakOnChannel/);
  assert.match(source, /SetListening/);
  assert.match(source, /exam.auscultation/);
  assert.match(source, /ShowAuscultationMenu/);
  assert.match(source, /PatternForCaseId/);
  assert.match(source, /__valsalva/);
  assert.match(await read("CardioHospital.uproject"), /"Name": "TextToSpeech"/);
  assert.match(await read("CardioHospital.uproject"), /"Name": "MetaHumanCharacter"/);
  assert.match(await read("Source/CardioHospital/Private/CardioBlockoutNPC.cpp"), /TryAttachAssembledMetaHuman/);
  assert.match(await read("Source/CardioHospital/Private/CardioBlockoutNPC.cpp"), /BP_Patel/);
  assert.match(await read("Source/CardioHospital/CardioHospital.Build.cs"), /TextToSpeech/);
  assert.match(await read("Source/CardioHospital/Private/CardioBlockoutNPC.cpp"), /BlinkRemaining/);
  assert.match(source, /Fact.Key == Action.Target/);
  assert.match(source, /Fact.Answer/);
  assert.doesNotMatch(source, /SpawnActor<ACardioBlockoutNPC>.*marcus|GPatientNpcId/i);
  assert.doesNotMatch(source, /Hypertrophic Cardiomyopathy/);
  assert.match(character, /NotifyLearnerLocation/);
  assert.match(hud, /Evaluate the patient/);
});

test("numbered encounter choices are bound and mapped", async () => {
  const character = await read("Source/CardioHospital/Private/CardioBlockoutCharacter.cpp");
  const input = await read("Config/DefaultInput.ini");

  for (let index = 1; index <= 9; index += 1) {
    const name = `ChooseAction${index}`;
    assert.match(character, new RegExp(`BindAction\\(TEXT\\("${name}"\\)`));
    assert.match(input, new RegExp(`\\+ActionMappings=\\(ActionName="${name}"`));
  }
});
