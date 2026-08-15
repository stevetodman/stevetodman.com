#include "CardioBlockoutGameMode.h"

#include "Components/AudioComponent.h"
#include "Kismet/GameplayStatics.h"
#include "Sound/SoundWaveProcedural.h"
#include "TimerManager.h"
#include "CardioBlockoutCharacter.h"
#include "CardioBlockoutHUD.h"
#include "CardioBlockoutNPC.h"
#include "CardioCaseRuntimeSubsystem.h"
#include "CardioCaseRuntimeTypes.h"
#include "CardioClinicalDataSubsystem.h"
#include "CardioHospital.h"
#include "CardioEducationTypes.h"
#include "CardioLearnerProfileSubsystem.h"
#include "CardioLearnerProfileTypes.h"
#include "Engine/Engine.h"
#include "Misc/Guid.h"
#include "TextToSpeechEngineSubsystem.h"
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

bool ACardioBlockoutGameMode::IsEducationRoomLocation(const FVector& Location)
{
    return Location.X > RoomMidX && Location.X <= RoomMaxX
        && Location.Y >= -RoomMaxY && Location.Y <= -RoomMinY;
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
        TryPerformAction(TEXT("navigate.return-workroom"));
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
        bChoosingDiagnosis = false;
        bChoosingAuscultation = false;
        StopMurmurAudio();
        SetAttendingListening(false);
        if (AttendingNpc)
        {
            AttendingNpc->NotifySpeaking(false);
        }
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
        return;
    }

    if (IsEducationRoomLocation(Character.GetActorLocation()))
    {
        HandleDiagnostics();
    }
}

void ACardioBlockoutGameMode::HandleChooseAction(const int32 ZeroBasedIndex)
{
    if (!CurrentMenuActions.IsValidIndex(ZeroBasedIndex))
    {
        return;
    }

    if (bChoosingAuscultation)
    {
        const FString Choice = CurrentMenuActions[ZeroBasedIndex];
        if (Choice == TEXT("__valsalva"))
        {
            Murmur.SetValsalva(!Murmur.IsValsalva());
            if (!Murmur.GetSite().IsEmpty())
            {
                StartAuscultationSite(Murmur.GetSite());
            }
            ShowAuscultationMenu();
            return;
        }
        StartAuscultationSite(Choice);
        return;
    }

    if (bChoosingDiagnosis)
    {
        const FString Diagnosis = CurrentMenuActions[ZeroBasedIndex];
        bChoosingDiagnosis = false;
        CurrentMenuActions.Reset();
        FCardioCaseActionDefinition Submitted;
        Submitted.Id = TEXT("reasoning.submit");
        Submitted.Type = TEXT("reasoning");
        Submitted.Target = TEXT("attending");
        Submitted.EventType = TEXT("diagnosis_submitted");
        if (!TryPerformAction(TEXT("reasoning.submit"), DiagnosisPayloadJson(Diagnosis)))
        {
            ShowEncounterMenu();
            return;
        }
        ShowSocraticResponse();
        return;
    }

    const FString ActionId = CurrentMenuActions[ZeroBasedIndex];
    if (ActionId == TEXT("__talk"))
    {
        ShowHistoryMenu();
        return;
    }
    if (ActionId == TEXT("__examine"))
    {
        ShowExamMenu();
        return;
    }
    if (ActionId == TEXT("__parent_step_out"))
    {
        bParentSteppedOut = true;
        ShowHistoryMenu();
        return;
    }

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
    if (!bFound)
    {
        RefreshStationMenu();
        return;
    }
    if (HandleSpecialAction(Chosen))
    {
        return;
    }
    if (!TryPerformAction(ActionId))
    {
        RefreshStationMenu();
        return;
    }
    if ((Chosen.Type == TEXT("history") || Chosen.Id.StartsWith(TEXT("history.")))
        && !Chosen.Id.EndsWith(TEXT(".finish")))
    {
        ShowHistoryMenu(LabelForAction(Chosen), ResultForAction(Chosen));
        return;
    }
    if (Chosen.Type == TEXT("exam") && !Chosen.Id.EndsWith(TEXT(".finish")))
    {
        ShowExamMenu(LabelForAction(Chosen), ResultForAction(Chosen));
        return;
    }
    if (Chosen.Id.EndsWith(TEXT(".finish")) && HasExamRoomWork())
    {
        ShowExamRoomMenu();
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
            TEXT("navigate.return-workroom"),
        });
        if (HasAttendingFollowUp())
        {
            ShowEncounterMenu();
            return;
        }
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
    bParentSteppedOut = false;
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
    SpeakAttending(TEXT("I have a patient I'd like you to see."));
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
    });
    if (Runtime->GetAvailableActions().Contains(TEXT("encounter.introduce")))
    {
        ShowEncounterIntroduction();
        return;
    }
    ShowExamRoomMenu();
}

void ACardioBlockoutGameMode::HandleDiagnostics()
{
    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    if (!Hud)
    {
        return;
    }
    if (!Runtime || !Runtime->HasActiveCase())
    {
        Hud->ShowPanel({
            TEXT("ECG / Echo"),
            FString(),
            TEXT("See Dr. Patel in the Cardiology Team Room first."),
            FString(),
            TEXT("[E] Close"),
        });
        return;
    }
    ShowDiagnosticsMenu();
}

void ACardioBlockoutGameMode::AdvanceImpliedActions(const TArray<FString>& ActionIds)
{
    for (const FString& ActionId : ActionIds)
    {
        TryPerformAction(ActionId);
    }
}

bool ACardioBlockoutGameMode::TryPerformAction(const FString& ActionId, const FString& PayloadJson)
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
    if (!Runtime->PerformAction(ActionId, PayloadJson, Result))
    {
        UE_LOG(LogCardioHospital, Warning, TEXT("PerformAction(%s) failed: %s"), *ActionId, *Result.Error);
        return false;
    }
    return true;
}

bool ACardioBlockoutGameMode::HasAttendingFollowUp() const
{
    const UGameInstance* GameInstance = GetGameInstance();
    const UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Runtime || !Runtime->HasActiveCase())
    {
        return false;
    }
    for (const FString& ActionId : Runtime->GetAvailableActions())
    {
        if (ActionId == TEXT("reasoning.submit")
            || ActionId == TEXT("debrief.review")
            || ActionId == TEXT("performance.record")
            || ActionId == TEXT("next-case.begin")
            || ActionId.StartsWith(TEXT("management.")))
        {
            return true;
        }
    }
    return false;
}

bool ACardioBlockoutGameMode::HasExamRoomWork() const
{
    const UGameInstance* GameInstance = GetGameInstance();
    const UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Runtime || !Runtime->HasActiveCase())
    {
        return false;
    }
    for (const FCardioCaseActionDefinition& Action : Runtime->GetAvailableActionDefinitions())
    {
        if (Action.Type == TEXT("exam")
            || Action.Id.StartsWith(TEXT("exam."))
            || Action.Type == TEXT("history")
            || Action.Id.StartsWith(TEXT("history.")))
        {
            return true;
        }
    }
    return false;
}

bool ACardioBlockoutGameMode::HasPendingConfidentialHistory() const
{
    if (bParentSteppedOut)
    {
        return false;
    }
    const UGameInstance* GameInstance = GetGameInstance();
    const UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Runtime || !Runtime->HasActiveCase())
    {
        return false;
    }
    const FCardioClinicalCase ClinicalCase = Runtime->GetActiveClinicalCase();
    if (!ClinicalCase.AllowConfidentialInterview || !ClinicalCase.ParentPresent)
    {
        return false;
    }
    for (const FCardioCaseActionDefinition& Action : Runtime->GetAvailableActionDefinitions())
    {
        if (Action.Type != TEXT("history") && !Action.Id.StartsWith(TEXT("history.")))
        {
            continue;
        }
        for (const FCardioHistoryFact& Fact : ClinicalCase.History)
        {
            if (Fact.Confidential && (Fact.Key == Action.Target || HistoryActionIdFromKey(Fact.Key) == Action.Id))
            {
                return true;
            }
        }
    }
    return false;
}

bool ACardioBlockoutGameMode::ShouldOfferHistoryAction(const FCardioCaseActionDefinition& Action) const
{
    if (Action.Type != TEXT("history") && !Action.Id.StartsWith(TEXT("history.")))
    {
        return false;
    }
    if (Action.Id.EndsWith(TEXT(".finish")))
    {
        return true;
    }

    const UGameInstance* GameInstance = GetGameInstance();
    const UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Runtime || !Runtime->HasActiveCase())
    {
        return false;
    }

    const FCardioClinicalCase ClinicalCase = Runtime->GetActiveClinicalCase();
    for (const FCardioHistoryFact& Fact : ClinicalCase.History)
    {
        if (Fact.Key != Action.Target && HistoryActionIdFromKey(Fact.Key) != Action.Id)
        {
            continue;
        }
        if (!Fact.Confidential)
        {
            return true;
        }
        return !ClinicalCase.ParentPresent || bParentSteppedOut;
    }
    return true;
}

void ACardioBlockoutGameMode::ShowEncounterIntroduction()
{
    APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Hud || !Runtime)
    {
        return;
    }

    TryPerformAction(TEXT("encounter.introduce"));
    const FCardioClinicalCase ClinicalCase = Runtime->GetActiveClinicalCase();
    TArray<FString> Lines;
    Lines.Add(ClinicalCase.Room.IsEmpty() ? TEXT("Encounter") : ClinicalCase.Room);
    Lines.Add(FString());
    Lines.Add(FString::Printf(TEXT("%s, %.0f-year-old %s"), *ClinicalCase.PatientName, ClinicalCase.Age, *ClinicalCase.Sex));
    if (!ClinicalCase.ChiefComplaint.IsEmpty())
    {
        Lines.Add(ClinicalCase.ChiefComplaint);
    }
    Lines.Add(FString());
    if (!ClinicalCase.Vibe.IsEmpty())
    {
        TArray<FString> Sentences;
        ClinicalCase.Vibe.ParseIntoArray(Sentences, TEXT(". "), true);
        for (FString& Sentence : Sentences)
        {
            Sentence.TrimStartAndEndInline();
            if (Sentence.IsEmpty())
            {
                continue;
            }
            if (!Sentence.EndsWith(TEXT(".")))
            {
                Sentence += TEXT(".");
            }
            Lines.Add(Sentence);
        }
    }
    if (ClinicalCase.ParentPresent)
    {
        Lines.Add(FString());
        Lines.Add(TEXT("A parent is present."));
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
}

void ACardioBlockoutGameMode::ShowExamRoomMenu()
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
    bChoosingDiagnosis = false;
    bChoosingAuscultation = false;
    TArray<FString> Lines;
    const FCardioClinicalCase ClinicalCase = Runtime->GetActiveClinicalCase();
    Lines.Add(ClinicalCase.Room.IsEmpty() ? TEXT("Encounter") : ClinicalCase.Room);
    Lines.Add(FString());
    Lines.Add(FString::Printf(TEXT("%s, %.0f-year-old %s"), *ClinicalCase.PatientName, ClinicalCase.Age, *ClinicalCase.Sex));
    if (ClinicalCase.ParentPresent)
    {
        Lines.Add(bParentSteppedOut
            ? TEXT("The parent has stepped outside.")
            : TEXT("A parent is present."));
    }
    Lines.Add(FString());

    bool bHasTalk = false;
    bool bHasExam = false;
    TArray<FCardioCaseActionDefinition> FinishActions;
    for (const FCardioCaseActionDefinition& Action : Runtime->GetAvailableActionDefinitions())
    {
        if (ShouldOfferHistoryAction(Action) && !Action.Id.EndsWith(TEXT(".finish")))
        {
            bHasTalk = true;
        }
        else if ((Action.Type == TEXT("exam") || Action.Id.StartsWith(TEXT("exam.")))
            && !Action.Id.EndsWith(TEXT(".finish")))
        {
            bHasExam = true;
        }
        else if ((Action.Id == TEXT("history.finish") || Action.Id == TEXT("exam.finish"))
            && FinishActions.Num() < 4)
        {
            FinishActions.Add(Action);
        }
    }
    if (HasPendingConfidentialHistory())
    {
        bHasTalk = true;
    }

    int32 Choice = 1;
    if (bHasTalk && Choice <= 9)
    {
        CurrentMenuActions.Add(TEXT("__talk"));
        Lines.Add(FString::Printf(
            TEXT("[%d]  %s"),
            Choice,
            (ClinicalCase.ParentPresent && !bParentSteppedOut)
                ? TEXT("Talk with the patient and parent")
                : TEXT("Talk with the patient")));
        ++Choice;
    }
    if (bHasExam && Choice <= 9)
    {
        CurrentMenuActions.Add(TEXT("__examine"));
        Lines.Add(FString::Printf(TEXT("[%d]  Examine"), Choice));
        ++Choice;
    }
    for (const FCardioCaseActionDefinition& Action : FinishActions)
    {
        if (Choice > 9)
        {
            break;
        }
        CurrentMenuActions.Add(Action.Id);
        Lines.Add(FString::Printf(TEXT("[%d]  %s"), Choice, *LabelForAction(Action)));
        ++Choice;
    }

    if (CurrentMenuActions.Num() == 0)
    {
        if (HasAttendingFollowUp())
        {
            Lines.Add(TEXT("Order and review studies in the Education Room, or return to Dr. Patel."));
        }
        else
        {
            Lines.Add(TEXT("Order and review studies in the Education Room."));
        }
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
}

void ACardioBlockoutGameMode::ShowHistoryMenu(const FString& LastQuestion, const FString& LastAnswer)
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
    bChoosingDiagnosis = false;
    bChoosingAuscultation = false;
    const FCardioClinicalCase ClinicalCase = Runtime->GetActiveClinicalCase();
    TArray<FString> Lines;
    Lines.Add(ClinicalCase.PatientName.IsEmpty() ? TEXT("History") : ClinicalCase.PatientName);
    Lines.Add(FString());
    if (ClinicalCase.ParentPresent)
    {
        Lines.Add(bParentSteppedOut
            ? TEXT("The parent has stepped outside.")
            : TEXT("A parent is present."));
        Lines.Add(FString());
    }
    if (!LastQuestion.IsEmpty() || !LastAnswer.IsEmpty())
    {
        if (!LastQuestion.IsEmpty())
        {
            Lines.Add(LastQuestion);
        }
        TArray<FString> AnswerLines;
        LastAnswer.ParseIntoArrayLines(AnswerLines);
        if (AnswerLines.Num() == 0 && !LastAnswer.IsEmpty())
        {
            Lines.Add(LastAnswer);
        }
        else
        {
            Lines.Append(AnswerLines);
        }
        Lines.Add(FString());
    }

    int32 Choice = 1;
    FCardioCaseActionDefinition FinishAction;
    bool bHasFinish = false;
    for (const FCardioCaseActionDefinition& Action : Runtime->GetAvailableActionDefinitions())
    {
        if (!ShouldOfferHistoryAction(Action))
        {
            continue;
        }
        if (Action.Id.EndsWith(TEXT(".finish")))
        {
            FinishAction = Action;
            bHasFinish = true;
            continue;
        }
        if (Choice > 8)
        {
            continue;
        }
        CurrentMenuActions.Add(Action.Id);
        Lines.Add(FString::Printf(TEXT("[%d]  %s"), Choice, *LabelForAction(Action)));
        ++Choice;
    }
    if (ClinicalCase.AllowConfidentialInterview && ClinicalCase.ParentPresent && !bParentSteppedOut && Choice <= 9)
    {
        CurrentMenuActions.Add(TEXT("__parent_step_out"));
        Lines.Add(FString::Printf(TEXT("[%d]  Ask the parent to step outside"), Choice));
        ++Choice;
    }
    if (bHasFinish && Choice <= 9)
    {
        CurrentMenuActions.Add(FinishAction.Id);
        Lines.Add(FString::Printf(TEXT("[%d]  %s"), Choice, *LabelForAction(FinishAction)));
    }
    if (CurrentMenuActions.Num() == 0)
    {
        Lines.Add(TEXT("No further history is available."));
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
}

void ACardioBlockoutGameMode::ShowExamMenu(const FString& LastLabel, const FString& LastResult)
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
    bChoosingDiagnosis = false;
    bChoosingAuscultation = false;
    TArray<FString> Lines;
    Lines.Add(TEXT("Examination"));
    Lines.Add(FString());
    if (!LastLabel.IsEmpty() || !LastResult.IsEmpty())
    {
        if (!LastLabel.IsEmpty())
        {
            Lines.Add(LastLabel);
        }
        TArray<FString> ResultLines;
        LastResult.ParseIntoArrayLines(ResultLines);
        if (ResultLines.Num() == 0 && !LastResult.IsEmpty())
        {
            Lines.Add(LastResult);
        }
        else
        {
            Lines.Append(ResultLines);
        }
        Lines.Add(FString());
    }

    int32 Choice = 1;
    for (const FCardioCaseActionDefinition& Action : Runtime->GetAvailableActionDefinitions())
    {
        const bool bExamAction = Action.Type == TEXT("exam") || Action.Id.StartsWith(TEXT("exam."));
        if (!bExamAction || Choice > 9)
        {
            continue;
        }
        CurrentMenuActions.Add(Action.Id);
        Lines.Add(FString::Printf(TEXT("[%d]  %s"), Choice, *LabelForAction(Action)));
        ++Choice;
    }
    if (CurrentMenuActions.Num() == 0)
    {
        Lines.Add(TEXT("No further exam actions are available."));
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
}

void ACardioBlockoutGameMode::RefreshStationMenu()
{
    if (HasExamRoomWork())
    {
        ShowExamRoomMenu();
        return;
    }
    ShowEncounterMenu();
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
    bChoosingDiagnosis = false;
    bChoosingAuscultation = false;
    SetAttendingListening(true);
    TArray<FString> Lines;
    Lines.Add(TEXT("Dr. Patel - Cardiology Attending"));
    Lines.Add(FString());

    int32 Choice = 1;
    for (const FCardioCaseActionDefinition& Action : Runtime->GetAvailableActionDefinitions())
    {
        const bool bFollowUpAction =
            Action.Type == TEXT("reasoning")
            || Action.Type == TEXT("management")
            || Action.Type == TEXT("debrief")
            || Action.Type == TEXT("continuation")
            || Action.Id == TEXT("performance.record")
            || Action.Id == TEXT("next-case.begin");
        if (!bFollowUpAction || Choice > 9)
        {
            continue;
        }
        CurrentMenuActions.Add(Action.Id);
        Lines.Add(FString::Printf(TEXT("[%d]  %s"), Choice, *LabelForAction(Action)));
        ++Choice;
    }

    if (CurrentMenuActions.Num() == 0)
    {
        Lines.Add(TEXT("Return to Exam Room 3 or the Education Room, or wait for follow-up."));
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
}

void ACardioBlockoutGameMode::ShowDiagnosticsMenu()
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
    bChoosingDiagnosis = false;
    bChoosingAuscultation = false;
    TArray<FString> Lines;
    Lines.Add(TEXT("ECG / Echo"));
    Lines.Add(FString());

    int32 Choice = 1;
    for (const FCardioCaseActionDefinition& Action : Runtime->GetAvailableActionDefinitions())
    {
        const bool bDiagnostic =
            Action.Type == TEXT("order")
            || Action.Type == TEXT("review")
            || Action.Id == TEXT("testing.finish");
        if (!bDiagnostic || Choice > 9)
        {
            continue;
        }
        CurrentMenuActions.Add(Action.Id);
        Lines.Add(FString::Printf(TEXT("[%d]  %s"), Choice, *LabelForAction(Action)));
        ++Choice;
    }
    if (CurrentMenuActions.Num() == 0)
    {
        Lines.Add(TEXT("No studies are available yet. Finish the exam in Exam Room 3, or return to Dr. Patel."));
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
}

void ACardioBlockoutGameMode::ShowEcgReview()
{
    APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Hud || !Runtime)
    {
        return;
    }

    const FCardioEcgFindings Ecg = Runtime->GetActiveClinicalCase().Ecg;
    TArray<FString> Lines;
    Lines.Add(TEXT("ECG"));
    Lines.Add(FString());
    Lines.Add(FString::Printf(TEXT("Rhythm  %s"), *Ecg.Rhythm));
    Lines.Add(FString::Printf(TEXT("Rate    %d"), Ecg.Rate));
    Lines.Add(FString::Printf(TEXT("PR %s   QRS %s   QTc %s"), *Ecg.Intervals.PR, *Ecg.Intervals.QRS, *Ecg.Intervals.QTc));
    Lines.Add(FString::Printf(TEXT("Axis    %s"), *Ecg.Axis));
    if (!Ecg.Pattern.IsEmpty())
    {
        Lines.Add(FString::Printf(TEXT("Pattern %s"), *Ecg.Pattern));
    }
    for (const FString& Finding : Ecg.KeyFindings)
    {
        Lines.Add(Finding);
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
}

void ACardioBlockoutGameMode::ShowEchoReview()
{
    APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Hud || !Runtime)
    {
        return;
    }

    const FCardioEchoFindings Echo = Runtime->GetActiveClinicalCase().Echo;
    TArray<FString> Lines;
    Lines.Add(TEXT("Echocardiogram"));
    Lines.Add(FString());
    if (!Echo.Summary.IsEmpty())
    {
        Lines.Add(Echo.Summary);
    }
    for (const FString& Finding : Echo.KeyFindings)
    {
        Lines.Add(Finding);
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
    if (Action.Id == TEXT("reasoning.submit"))
    {
        return TEXT("State your diagnosis");
    }
    if (Action.Id == TEXT("debrief.review"))
    {
        return TEXT("Review case-specific feedback");
    }
    if (Action.Id == TEXT("performance.record"))
    {
        return TEXT("Record this attempt");
    }
    if (Action.Id == TEXT("next-case.begin"))
    {
        return TEXT("Begin the next case");
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

bool ACardioBlockoutGameMode::HandleSpecialAction(const FCardioCaseActionDefinition& Action)
{
    if (Action.Id == TEXT("exam.auscultation"))
    {
        if (!TryPerformAction(Action.Id))
        {
            return false;
        }
        ShowAuscultationMenu();
        return true;
    }
    if (Action.Id == TEXT("review.ecg"))
    {
        if (!TryPerformAction(Action.Id))
        {
            return false;
        }
        ShowEcgReview();
        return true;
    }
    if (Action.Id == TEXT("review.echo"))
    {
        if (!TryPerformAction(Action.Id))
        {
            return false;
        }
        ShowEchoReview();
        return true;
    }
    if (Action.Id == TEXT("reasoning.submit"))
    {
        ShowDiagnosisMenu();
        return true;
    }
    if (Action.Id == TEXT("debrief.review"))
    {
        if (!TryPerformAction(Action.Id))
        {
            return false;
        }
        ShowDebrief();
        return true;
    }
    if (Action.Id == TEXT("performance.record"))
    {
        UGameInstance* GameInstance = GetGameInstance();
        UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
        UCardioLearnerProfileSubsystem* Profile = GameInstance ? GameInstance->GetSubsystem<UCardioLearnerProfileSubsystem>() : nullptr;
        APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
        ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
        if (!Runtime || !Profile || !Hud)
        {
            return false;
        }

        FCardioCaseDebrief Debrief;
        FString Error;
        if (!Runtime->EvaluateCurrentAttempt(Debrief, Error))
        {
            Hud->ShowPanel({ TEXT("Record attempt"), FString(), Error, FString(), TEXT("[E] Close") });
            return true;
        }
        const FString AttemptId = FGuid::NewGuid().ToString(EGuidFormats::DigitsWithHyphens);
        const FString CompletedAt = FDateTime::UtcNow().ToIso8601();
        if (!Profile->RecordAttempt(Debrief, AttemptId, CompletedAt, Error))
        {
            Hud->ShowPanel({ TEXT("Record attempt"), FString(), Error, FString(), TEXT("[E] Close") });
            return true;
        }
        if (!TryPerformAction(Action.Id))
        {
            return false;
        }
        Hud->ShowPanel({
            TEXT("Attempt recorded"),
            FString(),
            FString::Printf(TEXT("Content version %s stored without patient identifiers."), *Debrief.CaseVersion),
            FString(),
            TEXT("[E] Close"),
        });
        return true;
    }
    if (Action.Id == TEXT("next-case.begin"))
    {
        UGameInstance* GameInstance = GetGameInstance();
        UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
        UCardioLearnerProfileSubsystem* Profile = GameInstance ? GameInstance->GetSubsystem<UCardioLearnerProfileSubsystem>() : nullptr;
        APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
        ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
        if (!Runtime || !Profile || !Hud)
        {
            return false;
        }
        if (!TryPerformAction(Action.Id))
        {
            return false;
        }

        FCardioNextCaseSelection Next;
        FString Error;
        if (!Profile->SelectNextCase(Next, Error) || Next.CaseId.IsEmpty())
        {
            Hud->ShowPanel({
                TEXT("Next case"),
                FString(),
                Error.IsEmpty() ? TEXT("No contrastive next case is available.") : Error,
                FString(),
                TEXT("[E] Close"),
            });
            return true;
        }

        FString StartError;
        bParentSteppedOut = false;
        if (!Runtime->StartCase(Next.CaseId, StartError))
        {
            Hud->ShowPanel({ TEXT("Next case"), FString(), StartError, FString(), TEXT("[E] Close") });
            return true;
        }
        AdvanceImpliedActions({
            TEXT("system.load"),
            TEXT("world.enter"),
            TEXT("navigate.workroom"),
            TEXT("attending.open-assignment"),
            TEXT("assignment.accept"),
        });
        const FCardioClinicalCase ClinicalCase = Runtime->GetActiveClinicalCase();
        Hud->ShowPanel({
            TEXT("Dr. Patel - Cardiology Attending"),
            FString(),
            TEXT("\"I have another patient I'd like you to see.\""),
            FString(),
            FString::Printf(TEXT("Patient: %s, %.0f-year-old %s"), *ClinicalCase.PatientName, ClinicalCase.Age, *ClinicalCase.Sex),
            FString::Printf(TEXT("Chief complaint: %s"), *ClinicalCase.ChiefComplaint),
            FString::Printf(TEXT("Location: %s"), *ClinicalCase.Room),
            FString(),
            TEXT("Find your patient and begin the evaluation."),
            TEXT("[E] Close"),
        });
        SpeakAttending(TEXT("I have another patient I'd like you to see."));
        return true;
    }
    return false;
}

void ACardioBlockoutGameMode::ShowDiagnosisMenu()
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
    bChoosingDiagnosis = true;
    SetAttendingListening(true);
    TArray<FString> Lines;
    Lines.Add(TEXT("Diagnosis"));
    Lines.Add(FString());

    int32 Choice = 1;
    for (const FString& Diagnosis : Runtime->GetActiveClinicalCase().Differentials)
    {
        if (Diagnosis.IsEmpty() || Choice > 9)
        {
            continue;
        }
        CurrentMenuActions.Add(Diagnosis);
        Lines.Add(FString::Printf(TEXT("[%d]  %s"), Choice, *Diagnosis));
        ++Choice;
    }
    if (CurrentMenuActions.Num() == 0)
    {
        bChoosingDiagnosis = false;
        Lines.Add(TEXT("No authored differentials are available."));
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
}

void ACardioBlockoutGameMode::ShowDebrief()
{
    APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Hud || !Runtime)
    {
        return;
    }

    FCardioCaseDebrief Debrief;
    FString Error;
    if (!Runtime->EvaluateCurrentAttempt(Debrief, Error))
    {
        Hud->ShowPanel({ TEXT("Debrief"), FString(), Error, FString(), TEXT("[E] Close") });
        return;
    }

    TArray<FString> Lines;
    Lines.Add(TEXT("Case-specific feedback"));
    Lines.Add(FString());
    Lines.Add(FString::Printf(TEXT("Score %d"), Debrief.OverallScore));
    Lines.Add(FString::Printf(
        TEXT("Diagnosis: %s (%s)"),
        Debrief.DiagnosisSubmitted.IsEmpty() ? TEXT("not submitted") : *Debrief.DiagnosisSubmitted,
        Debrief.bDiagnosisCorrect ? TEXT("matches authored truth") : TEXT("does not match authored truth")));
    for (const FCardioScoreDimension& Dimension : Debrief.Dimensions)
    {
        Lines.Add(FString::Printf(TEXT("%s  %d"), *Dimension.Id, Dimension.Score));
    }
    for (const FCardioMissedOpportunity& Missed : Debrief.MissedOpportunities)
    {
        Lines.Add(Missed.Message);
    }
    for (const FCardioSafetyEvent& Event : Debrief.SafetyEvents)
    {
        Lines.Add(Event.Message);
        if (!Event.Intervention.IsEmpty())
        {
            Lines.Add(Event.Intervention);
        }
    }
    const FString TeachingPoint = Runtime->GetActiveClinicalCase().TeachingPoint;
    if (!TeachingPoint.IsEmpty())
    {
        Lines.Add(FString());
        Lines.Add(TeachingPoint);
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
}

FString ACardioBlockoutGameMode::DiagnosisPayloadJson(const FString& Diagnosis)
{
    FString Escaped = Diagnosis;
    Escaped.ReplaceInline(TEXT("\\"), TEXT("\\\\"));
    Escaped.ReplaceInline(TEXT("\""), TEXT("\\\""));
    return FString::Printf(TEXT("{\"diagnosis\":\"%s\"}"), *Escaped);
}

FString ACardioBlockoutGameMode::HistoryActionIdFromKey(const FString& Key)
{
    return FString::Printf(TEXT("history.%s"), *Key.Replace(TEXT("_"), TEXT("-")));
}

void ACardioBlockoutGameMode::SetAttendingListening(const bool bListening)
{
    if (AttendingNpc)
    {
        AttendingNpc->SetListening(bListening);
        if (bListening)
        {
            AttendingNpc->NotifySpeaking(false);
        }
    }
}

void ACardioBlockoutGameMode::SpeakAttending(const FString& AuthoredLine)
{
    if (AuthoredLine.IsEmpty())
    {
        return;
    }

    SetAttendingListening(false);
    if (AttendingNpc)
    {
        AttendingNpc->NotifySpeaking(true);
    }

    if (!GEngine)
    {
        return;
    }
    UTextToSpeechEngineSubsystem* Speech = GEngine->GetEngineSubsystem<UTextToSpeechEngineSubsystem>();
    if (!Speech)
    {
        return;
    }

    static const FName Channel(TEXT("CardioPatel"));
    if (!Speech->DoesChannelExist(Channel))
    {
        Speech->AddDefaultChannel(Channel);
        Speech->ActivateChannel(Channel);
        Speech->SetVolumeOnChannel(Channel, 0.85f);
        Speech->SetRateOnChannel(Channel, 0.45f);
    }
    FString Spoken = AuthoredLine;
    Speech->SpeakOnChannel(Channel, Spoken);
}

TArray<FString> ACardioBlockoutGameMode::CollectSocraticLines() const
{
    TArray<FString> Lines;
    const UGameInstance* GameInstance = GetGameInstance();
    const UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    if (!Runtime || !Runtime->HasActiveCase())
    {
        return Lines;
    }

    const FCardioClinicalCase ClinicalCase = Runtime->GetActiveClinicalCase();
    const TArray<FString>& Completed = Runtime->GetRuntimeState().CompletedActions;
    for (const FString& Key : ClinicalCase.RedFlagKeys)
    {
        if (Completed.Contains(HistoryActionIdFromKey(Key)))
        {
            continue;
        }
        if (const FString* Missed = ClinicalCase.MissedOpportunityTemplate.Find(Key))
        {
            if (!Missed->IsEmpty())
            {
                Lines.Add(*Missed);
            }
        }
    }
    for (const FString& Question : ClinicalCase.AttendingSocratic)
    {
        if (!Question.IsEmpty())
        {
            Lines.Add(Question);
        }
    }
    return Lines;
}

void ACardioBlockoutGameMode::ShowSocraticResponse()
{
    APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    if (!Hud)
    {
        return;
    }

    const TArray<FString> Socratic = CollectSocraticLines();
    TArray<FString> Lines;
    Lines.Add(TEXT("Dr. Patel - Cardiology Attending"));
    Lines.Add(FString());
    for (const FString& Line : Socratic)
    {
        Lines.Add(Line);
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
    if (Socratic.Num() > 0)
    {
        SpeakAttending(Socratic[0]);
    }
}

void ACardioBlockoutGameMode::ShowAuscultationMenu()
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
    bChoosingAuscultation = true;
    TArray<FString> Lines;
    Lines.Add(TEXT("Auscultation"));
    Lines.Add(FString());

    int32 Choice = 1;
    for (const FCardioAuscultationFinding& Finding : Runtime->GetActiveClinicalCase().Exam.Auscultation)
    {
        if (Finding.Site.IsEmpty() || Choice > 8)
        {
            continue;
        }
        CurrentMenuActions.Add(Finding.Site);
        const bool bActive = Murmur.GetSite() == Finding.Site && MurmurAudio != nullptr;
        Lines.Add(FString::Printf(TEXT("[%d]  %s%s"), Choice, *Finding.Site, bActive ? TEXT("  (listening)") : TEXT("")));
        ++Choice;
    }
    CurrentMenuActions.Add(TEXT("__valsalva"));
    Lines.Add(FString::Printf(TEXT("[%d]  Valsalva %s"), Choice, Murmur.IsValsalva() ? TEXT("on") : TEXT("off")));
    if (MurmurAudio)
    {
        for (const FCardioAuscultationFinding& Finding : Runtime->GetActiveClinicalCase().Exam.Auscultation)
        {
            if (Finding.Site == Murmur.GetSite() && !Finding.Description.IsEmpty())
            {
                Lines.Add(FString());
                Lines.Add(Finding.Description);
                break;
            }
        }
    }
    Lines.Add(FString());
    Lines.Add(TEXT("[E] Close"));
    Hud->ShowPanel(Lines);
}

void ACardioBlockoutGameMode::StartAuscultationSite(const FString& Site)
{
    UGameInstance* GameInstance = GetGameInstance();
    UCardioCaseRuntimeSubsystem* Runtime = GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
    APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    if (!Runtime || !Hud)
    {
        return;
    }

    const FCardioClinicalCase ClinicalCase = Runtime->GetActiveClinicalCase();
    Murmur.Configure(
        FCardioMurmurSynthesizer::PatternForCaseId(ClinicalCase.Id),
        ClinicalCase.Exam.Vitals.HR,
        Site,
        Murmur.IsValsalva());

    if (!MurmurWave)
    {
        MurmurWave = NewObject<USoundWaveProcedural>(this);
        MurmurWave->SetSampleRate(FCardioMurmurSynthesizer::SampleRate);
        MurmurWave->NumChannels = 1;
        MurmurWave->bLooping = false;
        MurmurWave->SoundGroup = SOUNDGROUP_Voice;
        MurmurWave->bCanProcessAsync = false;
    }

    TArray<uint8> Pcm;
    Murmur.RenderSeconds(1.2f, Pcm);
    MurmurWave->ResetAudio();
    MurmurWave->QueueAudio(Pcm.GetData(), Pcm.Num());

    if (!MurmurAudio)
    {
        MurmurAudio = UGameplayStatics::SpawnSound2D(this, MurmurWave, 1.f, 1.f, 0.f, nullptr, true, false);
    }
    else if (!MurmurAudio->IsPlaying())
    {
        MurmurAudio->SetSound(MurmurWave);
        MurmurAudio->Play();
    }

    if (UWorld* World = GetWorld())
    {
        World->GetTimerManager().SetTimer(MurmurTimer, this, &ACardioBlockoutGameMode::PumpMurmurAudio, 0.35f, true);
    }

    ShowAuscultationMenu();
}

void ACardioBlockoutGameMode::PumpMurmurAudio()
{
    if (!MurmurWave)
    {
        return;
    }
    TArray<uint8> Pcm;
    Murmur.RenderSeconds(0.6f, Pcm);
    MurmurWave->QueueAudio(Pcm.GetData(), Pcm.Num());
}

void ACardioBlockoutGameMode::StopMurmurAudio()
{
    if (UWorld* World = GetWorld())
    {
        World->GetTimerManager().ClearTimer(MurmurTimer);
    }
    if (MurmurAudio)
    {
        MurmurAudio->Stop();
        MurmurAudio = nullptr;
    }
    if (MurmurWave)
    {
        MurmurWave->ResetAudio();
    }
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
    SpawnSign(World, TEXT("ECG / Echo"), FVector(980.0, -184.0, 250.0), 90.f);
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
        AttendingNpc = Attending;
    }
}
