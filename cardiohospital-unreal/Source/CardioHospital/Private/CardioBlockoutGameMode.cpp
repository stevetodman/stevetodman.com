#include "CardioBlockoutGameMode.h"

#include "CardioBlockoutCharacter.h"
#include "CardioBlockoutHUD.h"
#include "CardioBlockoutNPC.h"
#include "CardioCaseRuntimeSubsystem.h"
#include "CardioCaseRuntimeTypes.h"
#include "CardioClinicalDataSubsystem.h"
#include "CardioHospital.h"
#include "Components/DirectionalLightComponent.h"
#include "Components/SkyAtmosphereComponent.h"
#include "Components/SkyLightComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/TextRenderComponent.h"
#include "Engine/GameInstance.h"
#include "Engine/StaticMesh.h"
#include "Engine/StaticMeshActor.h"
#include "Engine/TextRenderActor.h"
#include "Engine/World.h"
#include "GameFramework/PlayerStart.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

namespace
{
    struct FBlockSpec
    {
        FVector Center;
        FVector Size;
        FLinearColor Color;
    };

    const FLinearColor FloorGray(0.45f, 0.45f, 0.47f);
    const FLinearColor WallWhite(0.85f, 0.84f, 0.80f);
    const FLinearColor AccentTeal(0.0f, 0.808f, 0.788f); // site accent #00cec9
    const FLinearColor BedWhite(0.92f, 0.92f, 0.94f);
    const FLinearColor ExamBlue(0.55f, 0.70f, 0.90f);
    const FLinearColor TableWarm(0.60f, 0.50f, 0.40f);

    const FVector ReceptionPlayerStart(-1200.0, -600.0, 110.0);
    const FVector ReceptionDoorwayCenter(-750.0, -200.0, 110.0);

    // Northwest room is Exam Room 3; northeast is the Cardiology Team Room.
    // Bounds stay inside the door gaps so corridor travel does not count.
    const float RoomMinX = -1480.0f;
    const float RoomMidX = 0.0f;
    const float RoomMaxX = 1480.0f;
    const float RoomMinY = 220.0f;
    const float RoomMaxY = 990.0f;

    // The attending who assigns the first case, and the case they assign: the
    // exertional-syncope presentation. The id must exist in
    // Content/Data/clinical-content.json; a portable test enforces that, and
    // no clinical fact about the case may be hardcoded in this file.
    const FString GAttendingNpcId = TEXT("dr-patel");
    const FString GAssignedCaseId = TEXT("case-hcm");

    // A 30 m x 20 m ward slice: a central east-west corridor with two rooms on
    // each side. Interior walls leave door gaps into the corridor. There is no
    // ceiling on purpose - daylight is the cheapest way to keep every room
    // legible until real materials and interior lighting are authored.
    const FBlockSpec GBlockout[] =
    {
        // Floor. Top surface sits at z=0.
        { FVector(0.0, 0.0, -10.0), FVector(3000.0, 2000.0, 20.0), FloorGray },

        // Perimeter walls.
        { FVector(0.0, 1010.0, 175.0), FVector(3040.0, 20.0, 350.0), WallWhite },
        { FVector(0.0, -1010.0, 175.0), FVector(3040.0, 20.0, 350.0), WallWhite },
        { FVector(1510.0, 0.0, 175.0), FVector(20.0, 2040.0, 350.0), WallWhite },
        { FVector(-1510.0, 0.0, 175.0), FVector(20.0, 2040.0, 350.0), WallWhite },

        // North corridor wall, with door gaps at x=-750 and x=+750.
        { FVector(-1155.0, 200.0, 175.0), FVector(690.0, 20.0, 350.0), WallWhite },
        { FVector(0.0, 200.0, 175.0), FVector(1380.0, 20.0, 350.0), WallWhite },
        { FVector(1155.0, 200.0, 175.0), FVector(690.0, 20.0, 350.0), WallWhite },

        // South corridor wall, mirrored gaps.
        { FVector(-1155.0, -200.0, 175.0), FVector(690.0, 20.0, 350.0), WallWhite },
        { FVector(0.0, -200.0, 175.0), FVector(1380.0, 20.0, 350.0), WallWhite },
        { FVector(1155.0, -200.0, 175.0), FVector(690.0, 20.0, 350.0), WallWhite },

        // Cross walls splitting each side into two rooms.
        { FVector(0.0, 600.0, 175.0), FVector(20.0, 800.0, 350.0), WallWhite },
        { FVector(0.0, -600.0, 175.0), FVector(20.0, 800.0, 350.0), WallWhite },

        // Landmarks: reception desk (SW), patient bed (NW), team room table
        // (NE), education table (SE). Enough to orient by, nothing more.
        { FVector(-750.0, -600.0, 55.0), FVector(300.0, 120.0, 110.0), AccentTeal },
        { FVector(-750.0, 600.0, 40.0), FVector(220.0, 100.0, 80.0), BedWhite },
        { FVector(750.0, 600.0, 45.0), FVector(200.0, 90.0, 90.0), ExamBlue },
        { FVector(750.0, -600.0, 50.0), FVector(240.0, 140.0, 100.0), TableWarm },
    };
}

ACardioBlockoutGameMode::ACardioBlockoutGameMode()
{
    DefaultPawnClass = ACardioBlockoutCharacter::StaticClass();
    HUDClass = ACardioBlockoutHUD::StaticClass();

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeFinder(TEXT("/Engine/BasicShapes/Cube.Cube"));
    BlockMesh = CubeFinder.Object;

    static ConstructorHelpers::FObjectFinder<UMaterialInterface> MaterialFinder(TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));
    BlockMaterial = MaterialFinder.Object;
}

void ACardioBlockoutGameMode::InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage)
{
    Super::InitGame(MapName, Options, ErrorMessage);

    UWorld* World = GetWorld();
    if (!World)
    {
        return;
    }

    if (!BlockMesh || !BlockMaterial)
    {
        UE_LOG(LogCardioHospital, Error,
            TEXT("Blockout primitives failed to load; the ward cannot be built. The packaged app will show an empty map."));
        return;
    }

    for (const FBlockSpec& Spec : GBlockout)
    {
        SpawnBlock(*World, Spec.Center, Spec.Size, Spec.Color);
    }

    SpawnLighting(*World);
    SpawnSigns(*World);
    SpawnAttending(*World);

    // Spawned before login so the default ChoosePlayerStart finds it. The
    // learner starts in the reception lobby facing the corridor.
    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    // Aim at the actual doorway center. Due north from the off-center start
    // still faces a solid section of the corridor wall.
    const FRotator StartRotation = (ReceptionDoorwayCenter - ReceptionPlayerStart).Rotation();
    World->SpawnActor<APlayerStart>(ReceptionPlayerStart, StartRotation, Params);
}

bool ACardioBlockoutGameMode::IsExamRoom3Location(const FVector& Location)
{
    return Location.X >= RoomMinX && Location.X < RoomMidX
        && Location.Y >= RoomMinY && Location.Y <= RoomMaxY;
}

bool ACardioBlockoutGameMode::IsTeamRoomLocation(const FVector& Location)
{
    return Location.X > RoomMidX && Location.X <= RoomMaxX
        && Location.Y >= RoomMinY && Location.Y <= RoomMaxY;
}

void ACardioBlockoutGameMode::NotifyLearnerLocation(const FVector& Location)
{
    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Runtime || !Runtime->HasActiveCase())
    {
        return;
    }

    if (IsTeamRoomLocation(Location))
    {
        TryPerformAction(TEXT("navigate.workroom"));
    }
    if (IsExamRoom3Location(Location))
    {
        TryPerformAction(TEXT("navigate.exam-room"));
    }
}

void ACardioBlockoutGameMode::HandleInteract(ACardioBlockoutCharacter& Character, ACardioBlockoutNPC* Npc)
{
    APlayerController* Controller = Cast<APlayerController>(Character.GetController());
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    if (!Hud)
    {
        return;
    }

    // E toggles: an open panel closes before anything new can happen.
    if (Hud->IsPanelOpen())
    {
        CurrentMenuActions.Reset();
        Hud->ClosePanel();
        return;
    }

    if (Npc && Npc->GetNpcId() == GAttendingNpcId)
    {
        HandleAttending(*Npc);
        return;
    }

    if (IsExamRoom3Location(Character.GetActorLocation()))
    {
        HandleExamRoom();
    }
}

void ACardioBlockoutGameMode::HandleChooseAction(const int32 ZeroBasedIndex)
{
    if (!CurrentMenuActions.IsValidIndex(ZeroBasedIndex))
    {
        return;
    }

    const FString ActionId = CurrentMenuActions[ZeroBasedIndex];
    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Runtime)
    {
        return;
    }

    FCardioCaseActionDefinition Chosen;
    bool bFound = false;
    for (const FCardioCaseActionDefinition& Action : Runtime->GetAvailableActionDefinitions())
    {
        if (Action.Id == ActionId)
        {
            Chosen = Action;
            bFound = true;
            break;
        }
    }

    CurrentMenuActions.Reset();
    if (!TryPerformAction(ActionId) || !bFound)
    {
        ShowEncounterMenu();
        return;
    }
    ShowActionResult(Chosen);
}

void ACardioBlockoutGameMode::HandleAttending(ACardioBlockoutNPC& Npc)
{
    APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    if (!Hud)
    {
        return;
    }

    UGameInstance* GameInstance = GetGameInstance();
    UCardioClinicalDataSubsystem* Data = GameInstance ? GameInstance->GetSubsystem<UCardioClinicalDataSubsystem>() : nullptr;
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;

    const auto BuildAssignmentLines = [&Npc](const FCardioClinicalCase& ClinicalCase)
    {
        TArray<FString> Lines;
        Lines.Add(FString::Printf(TEXT("%s - Cardiology Attending"), *Npc.GetDisplayName()));
        Lines.Add(FString());
        Lines.Add(TEXT("\"I have a patient I'd like you to see.\""));
        Lines.Add(FString());
        Lines.Add(FString::Printf(TEXT("Patient: %s, %.0f-year-old %s"), *ClinicalCase.PatientName, ClinicalCase.Age, *ClinicalCase.Sex));
        Lines.Add(FString::Printf(TEXT("Chief complaint: %s"), *ClinicalCase.ChiefComplaint));
        Lines.Add(FString::Printf(TEXT("Location: %s"), *ClinicalCase.Room));
        Lines.Add(FString());
        Lines.Add(TEXT("Find your patient and begin the evaluation."));
        Lines.Add(TEXT("[E] Close"));
        return Lines;
    };

    if (Runtime && Runtime->HasActiveCase())
    {
        AdvanceImpliedActions({
            TEXT("system.load"),
            TEXT("world.enter"),
            TEXT("navigate.workroom"),
            TEXT("attending.open-assignment"),
            TEXT("assignment.accept"),
        });
        Hud->ShowPanel(BuildAssignmentLines(Runtime->GetActiveClinicalCase()));
        return;
    }

    if (!Data || !Data->IsClinicalContentLoaded() || !Runtime)
    {
        UE_LOG(LogCardioHospital, Error, TEXT("Clinical content is not loaded; the assignment cannot begin."));
        Hud->ShowPanel({
            TEXT("Dr. Patel - Cardiology Attending"),
            FString(),
            TEXT("Clinical content failed to load; the case cannot begin."),
            FString(),
            TEXT("[E] Close"),
        });
        return;
    }

    FString StartError;
    if (!Runtime->StartCase(GAssignedCaseId, StartError))
    {
        UE_LOG(LogCardioHospital, Error, TEXT("StartCase(%s) failed: %s"), *GAssignedCaseId, *StartError);
        Hud->ShowPanel({
            TEXT("Dr. Patel - Cardiology Attending"),
            FString(),
            FString::Printf(TEXT("The case could not be started: %s"), *StartError),
            FString(),
            TEXT("[E] Close"),
        });
        return;
    }

    AdvanceImpliedActions({
        TEXT("system.load"),
        TEXT("world.enter"),
        TEXT("navigate.workroom"),
        TEXT("attending.open-assignment"),
        TEXT("assignment.accept"),
    });

    UE_LOG(LogCardioHospital, Log, TEXT("Case %s started from the team room assignment."), *GAssignedCaseId);
    Hud->ShowPanel(BuildAssignmentLines(Runtime->GetActiveClinicalCase()));
}

void ACardioBlockoutGameMode::HandleExamRoom()
{
    APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    if (!Hud)
    {
        return;
    }

    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Runtime || !Runtime->HasActiveCase())
    {
        Hud->ShowPanel({
            TEXT("Exam Room 3"),
            FString(),
            TEXT("See Dr. Patel in the Cardiology Team Room first."),
            FString(),
            TEXT("[E] Close"),
        });
        return;
    }

    AdvanceImpliedActions({
        TEXT("navigate.exam-room"),
        TEXT("encounter.introduce"),
    });
    ShowEncounterMenu();
}

void ACardioBlockoutGameMode::AdvanceImpliedActions(const TArray<FString>& ActionIds)
{
    for (const FString& ActionId : ActionIds)
    {
        TryPerformAction(ActionId);
    }
}

bool ACardioBlockoutGameMode::TryPerformAction(const FString& ActionId)
{
    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Runtime || !Runtime->HasActiveCase())
    {
        return false;
    }
    if (!Runtime->GetAvailableActions().Contains(ActionId))
    {
        return false;
    }

    FCardioCaseActionResult Result;
    if (!Runtime->PerformAction(ActionId, TEXT("{}"), Result))
    {
        UE_LOG(LogCardioHospital, Warning, TEXT("PerformAction(%s) failed: %s"), *ActionId, *Result.Error);
        return false;
    }
    return true;
}

void ACardioBlockoutGameMode::ShowEncounterMenu()
{
    APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Hud || !Runtime)
    {
        return;
    }

    CurrentMenuActions.Reset();
    TArray<FString> Lines;
    const FCardioClinicalCase ClinicalCase = Runtime->GetActiveClinicalCase();
    Lines.Add(ClinicalCase.Room.IsEmpty() ? TEXT("Encounter") : ClinicalCase.Room);
    Lines.Add(FString());

    int32 Choice = 1;
    for (const FCardioCaseActionDefinition& Action : Runtime->GetAvailableActionDefinitions())
    {
        const bool bEncounterAction =
            Action.Type == TEXT("history")
            || Action.Type == TEXT("exam")
            || Action.Type == TEXT("order")
            || Action.Type == TEXT("review")
            || Action.Id == TEXT("encounter.introduce")
            || Action.Id.EndsWith(TEXT(".finish"));
        if (!bEncounterAction || Choice > 9)
        {
            continue;
        }
        CurrentMenuActions.Add(Action.Id);
        Lines.Add(FString::Printf(TEXT("[%d]  %s"), Choice, *LabelForAction(Action)));
        ++Choice;
    }

    if (CurrentMenuActions.Num() == 0)
    {
        Lines.Add(TEXT("No further actions are available in this room."));
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
}

void ACardioBlockoutGameMode::ShowActionResult(const FCardioCaseActionDefinition& Action)
{
    APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    if (!Hud)
    {
        return;
    }

    TArray<FString> Lines;
    Lines.Add(LabelForAction(Action));
    Lines.Add(FString());

    const FString Result = ResultForAction(Action);
    if (!Result.IsEmpty())
    {
        TArray<FString> ResultLines;
        Result.ParseIntoArrayLines(ResultLines);
        Lines.Append(ResultLines);
    }
    else
    {
        Lines.Add(TEXT("Recorded."));
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
}

FString ACardioBlockoutGameMode::LabelForAction(const FCardioCaseActionDefinition& Action) const
{
    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (Runtime && (Action.Type == TEXT("history") || Action.Id.StartsWith(TEXT("history."))))
    {
        for (const FCardioHistoryFact& Fact : Runtime->GetActiveClinicalCase().History)
        {
            if (Fact.Key == Action.Target && !Fact.Question.IsEmpty())
            {
                return Fact.Question;
            }
        }
    }
    if (Action.Id.EndsWith(TEXT(".finish")))
    {
        return FString::Printf(TEXT("Finish %s"), *Action.Type);
    }
    if (!Action.Target.IsEmpty())
    {
        return Action.Target.Replace(TEXT("_"), TEXT(" "));
    }
    return Action.Id;
}

FString ACardioBlockoutGameMode::ResultForAction(const FCardioCaseActionDefinition& Action) const
{
    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Runtime)
    {
        return FString();
    }

    const FCardioClinicalCase ClinicalCase = Runtime->GetActiveClinicalCase();
    if (Action.Type == TEXT("history") || Action.Id.StartsWith(TEXT("history.")))
    {
        for (const FCardioHistoryFact& Fact : ClinicalCase.History)
        {
            if (Fact.Key == Action.Target)
            {
                return Fact.Answer;
            }
        }
        return FString();
    }
    if (Action.Id == TEXT("exam.general"))
    {
        return ClinicalCase.Exam.General;
    }
    if (Action.Id == TEXT("exam.vitals"))
    {
        return FString::Printf(
            TEXT("HR %d   BP %s   RR %d   SpO2 %d"),
            ClinicalCase.Exam.Vitals.HR,
            *ClinicalCase.Exam.Vitals.BP,
            ClinicalCase.Exam.Vitals.RR,
            ClinicalCase.Exam.Vitals.SpO2);
    }
    if (Action.Id == TEXT("exam.auscultation"))
    {
        TArray<FString> Lines;
        for (const FCardioAuscultationFinding& Finding : ClinicalCase.Exam.Auscultation)
        {
            Lines.Add(FString::Printf(TEXT("%s: %s"), *Finding.Site, *Finding.Description));
        }
        return FString::Join(Lines, TEXT("\n"));
    }
    if (Action.Id == TEXT("exam.femoral-pulses"))
    {
        return ClinicalCase.Exam.FemoralPulses;
    }
    if (Action.Id == TEXT("review.ecg"))
    {
        TArray<FString> Lines;
        Lines.Add(FString::Printf(TEXT("%s at %d bpm"), *ClinicalCase.Ecg.Rhythm, ClinicalCase.Ecg.Rate));
        for (const FString& Finding : ClinicalCase.Ecg.KeyFindings)
        {
            Lines.Add(Finding);
        }
        return FString::Join(Lines, TEXT("\n"));
    }
    if (Action.Id == TEXT("review.echo"))
    {
        TArray<FString> Lines;
        Lines.Add(ClinicalCase.Echo.Summary);
        for (const FString& Finding : ClinicalCase.Echo.KeyFindings)
        {
            Lines.Add(Finding);
        }
        return FString::Join(Lines, TEXT("\n"));
    }
    return FString();
}

AStaticMeshActor* ACardioBlockoutGameMode::SpawnBlock(UWorld& World, const FVector& Center, const FVector& Size, const FLinearColor& Color) const
{
    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    AStaticMeshActor* Block = World.SpawnActor<AStaticMeshActor>(Center, FRotator::ZeroRotator, Params);
    if (!Block)
    {
        return nullptr;
    }

    UStaticMeshComponent* Mesh = Block->GetStaticMeshComponent();
    // Runtime-spawned meshes must be movable before the mesh is assigned;
    // static mobility rejects dynamic data changes after spawn.
    Mesh->SetMobility(EComponentMobility::Movable);
    Mesh->SetStaticMesh(BlockMesh);
    Block->SetActorScale3D(Size / 100.f); // the engine cube is 100 cm

    UMaterialInstanceDynamic* Tint = UMaterialInstanceDynamic::Create(BlockMaterial, Mesh);
    Tint->SetVectorParameterValue(TEXT("Color"), Color);
    Mesh->SetMaterial(0, Tint);
    return Block;
}

void ACardioBlockoutGameMode::SpawnLighting(UWorld& World) const
{
    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    AActor* Rig = World.SpawnActor<AActor>(FVector::ZeroVector, FRotator::ZeroRotator, Params);
    if (!Rig)
    {
        return;
    }

    USceneComponent* Root = NewObject<USceneComponent>(Rig, TEXT("Root"));
    Rig->SetRootComponent(Root);
    Root->RegisterComponent();

    // Sun, atmosphere, and a real-time sky light. With the ward open to the
    // sky, this trio lights every room without any authored interior lights.
    UDirectionalLightComponent* Sun = NewObject<UDirectionalLightComponent>(Rig, TEXT("Sun"));
    Sun->SetupAttachment(Root);
    Sun->SetMobility(EComponentMobility::Movable);
    Sun->SetRelativeRotation(FRotator(-50.f, 30.f, 0.f));
    Sun->RegisterComponent();

    USkyAtmosphereComponent* Atmosphere = NewObject<USkyAtmosphereComponent>(Rig, TEXT("Atmosphere"));
    Atmosphere->SetupAttachment(Root);
    Atmosphere->RegisterComponent();

    USkyLightComponent* SkyAmbient = NewObject<USkyLightComponent>(Rig, TEXT("SkyAmbient"));
    SkyAmbient->SetupAttachment(Root);
    SkyAmbient->SetMobility(EComponentMobility::Movable);
    SkyAmbient->bRealTimeCapture = true;
    SkyAmbient->RegisterComponent();
}

void ACardioBlockoutGameMode::SpawnSigns(UWorld& World) const
{
    // Door signs face the corridor from above each gap. Room names follow the
    // case flow the walkthrough checklist expects; the sign is wayfinding, the
    // clinical location string shown in the assignment comes from content.
    SpawnSign(World, TEXT("Exam Room 3"), FVector(-750.0, 184.0, 285.0), -90.f);
    SpawnSign(World, TEXT("Cardiology Team Room"), FVector(750.0, 184.0, 285.0), -90.f);
    SpawnSign(World, TEXT("Reception"), FVector(-750.0, -184.0, 285.0), 90.f);
    SpawnSign(World, TEXT("Education Room"), FVector(750.0, -184.0, 285.0), 90.f);
}

void ACardioBlockoutGameMode::SpawnSign(UWorld& World, const FString& Text, const FVector& Location, const float YawDegrees) const
{
    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    ATextRenderActor* Sign = World.SpawnActor<ATextRenderActor>(Location, FRotator(0.f, YawDegrees, 0.f), Params);
    if (!Sign)
    {
        return;
    }

    UTextRenderComponent* Render = Sign->GetTextRender();
    Render->SetMobility(EComponentMobility::Movable);
    Render->SetText(FText::FromString(Text));
    Render->SetHorizontalAlignment(EHTA_Center);
    Render->SetWorldSize(34.f);
    Render->SetTextRenderColor(FColor(8, 92, 88));
}

void ACardioBlockoutGameMode::SpawnAttending(UWorld& World)
{
    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    // In the team room, standing south of the table, facing the doorway.
    ACardioBlockoutNPC* Attending = World.SpawnActor<ACardioBlockoutNPC>(FVector(750.0, 430.0, 0.0), FRotator(0.f, -90.f, 0.f), Params);
    if (Attending)
    {
        Attending->Configure(GAttendingNpcId, TEXT("Dr. Patel"), FLinearColor(0.93f, 0.93f, 0.95f));
    }
}
