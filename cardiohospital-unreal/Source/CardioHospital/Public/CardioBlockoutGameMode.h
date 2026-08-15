#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "CardioClinicalTypes.h"
#include "CardioMurmurSynthesizer.h"
#include "CardioBlockoutGameMode.generated.h"

class UAudioComponent;
class USoundWaveProcedural;

class ACardioBlockoutCharacter;
class ACardioBlockoutNPC;
class AStaticMeshActor;
class UMaterialInterface;
class UStaticMesh;

/**
 * Spawns the walkable ward blockout at runtime. The project deliberately has
 * no authored .umap yet: geometry built in code is diffable in git, cooks
 * deterministically, and cannot drift from review the way a binary asset can.
 * Before this game mode existed the packaged app loaded the engine's empty
 * Entry map and rendered a black screen.
 *
 * It also owns the first encounter moment: speaking with Dr. Patel in the
 * team room starts the assigned case through the real case runtime, with
 * every clinical fact drawn from the shipped content document rather than
 * hardcoded here.
 */
UCLASS()
class CARDIOHOSPITAL_API ACardioBlockoutGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    ACardioBlockoutGameMode();

    virtual void InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage) override;

    /** Routes an E-press: closes an open panel, or engages Patel / Exam Room 3. */
    void HandleInteract(ACardioBlockoutCharacter& Character, ACardioBlockoutNPC* Npc);

    /** Numbered menu choice 0-8 while an encounter panel is open; otherwise walk to a station. */
    void HandleChooseAction(int32 ZeroBasedIndex);

    /** Accessibility navigation: walk the learner to a named clinic station. */
    void GoToStation(ACardioBlockoutCharacter& Character, int32 StationIndex);

    /** Location-driven graph progress: workroom and exam-room navigation actions. */
    void NotifyLearnerLocation(const FVector& Location);

    static bool IsExamRoom3Location(const FVector& Location);
    static bool IsRoom1Location(const FVector& Location);
    static bool IsTeamRoomLocation(const FVector& Location);
    static bool IsEducationRoomLocation(const FVector& Location);
    static bool MatchesExamRoom(const FVector& Location, const FString& AuthoredRoom);
    bool IsAssignedExamRoomLocation(const FVector& Location) const;

private:
    void HandleAttending(ACardioBlockoutNPC& Npc);
    void HandleExamRoom();
    void HandleDiagnostics();
    void ShowDiagnosticsMenu();
    void ShowEcgReview();
    void ShowEchoReview();
    void AdvanceImpliedActions(const TArray<FString>& ActionIds);
    bool TryPerformAction(const FString& ActionId, const FString& PayloadJson = TEXT("{}"));
    bool HasAttendingFollowUp() const;
    bool HasExamRoomWork() const;
    bool HasPendingConfidentialHistory() const;
    bool ShouldOfferHistoryAction(const FCardioCaseActionDefinition& Action) const;
    void ShowEncounterIntroduction();
    void ShowExamRoomMenu();
    void ShowHistoryMenu(const FString& LastQuestion = FString(), const FString& LastAnswer = FString());
    void ShowExamMenu(const FString& LastLabel = FString(), const FString& LastResult = FString());
    void ShowEncounterMenu();
    void RefreshStationMenu();
    void ShowDiagnosisMenu();
    void ShowDebrief();
    void ShowActionResult(const FCardioCaseActionDefinition& Action);
    bool HandleSpecialAction(const FCardioCaseActionDefinition& Action);
    FString LabelForAction(const FCardioCaseActionDefinition& Action) const;
    FString ResultForAction(const FCardioCaseActionDefinition& Action) const;
    void SpeakAttending(const FString& AuthoredLine);
    void SetAttendingListening(bool bListening);
    void ShowSocraticResponse();
    TArray<FString> CollectSocraticLines() const;
    void ShowAuscultationMenu();
    void StartAuscultationSite(const FString& Site);
    void PumpMurmurAudio();
    void StopMurmurAudio();
    static FString DiagnosisPayloadJson(const FString& Diagnosis);
    static FString HistoryActionIdFromKey(const FString& Key);

    TArray<FString> CurrentMenuActions;
    bool bChoosingDiagnosis = false;
    bool bChoosingAuscultation = false;
    bool bParentSteppedOut = false;
    FCardioMurmurSynthesizer Murmur;

    UPROPERTY()
    TObjectPtr<USoundWaveProcedural> MurmurWave;

    UPROPERTY()
    TObjectPtr<UAudioComponent> MurmurAudio;

    FTimerHandle MurmurTimer;

    UPROPERTY()
    TObjectPtr<ACardioBlockoutNPC> AttendingNpc;
    AStaticMeshActor* SpawnBlock(UWorld& World, const FVector& Center, const FVector& Size, const FLinearColor& Color) const;
    AStaticMeshActor* SpawnMesh(
        UWorld& World,
        UStaticMesh* Mesh,
        const FVector& Location,
        const FRotator& Rotation = FRotator::ZeroRotator,
        const FVector& Scale = FVector(1.f)) const;
    void SpawnLighting(UWorld& World) const;
    void SpawnSigns(UWorld& World) const;
    void SpawnSign(UWorld& World, const FString& Text, const FVector& Location, float YawDegrees) const;
    void SpawnClinicDressing(UWorld& World) const;
    void SpawnAttending(UWorld& World);

    // Hard references so the cook always carries the engine primitives the
    // blockout is built from. A soft path would resolve in the editor and
    // silently fail in a packaged build if the cooker never saw it.
    UPROPERTY()
    TObjectPtr<UStaticMesh> BlockMesh;

    UPROPERTY()
    TObjectPtr<UMaterialInterface> BlockMaterial;

    UPROPERTY()
    TObjectPtr<UStaticMesh> ExamTableMesh;

    UPROPERTY()
    TObjectPtr<UStaticMesh> HospitalBedMesh;

    UPROPERTY()
    TObjectPtr<UStaticMesh> ClinicDeskMesh;

    UPROPERTY()
    TObjectPtr<UStaticMesh> ClinicChairMesh;

    UPROPERTY()
    TObjectPtr<UStaticMesh> DoorJambMesh;

    UPROPERTY()
    TObjectPtr<UStaticMesh> BaseboardMesh;

    UPROPERTY()
    TObjectPtr<UStaticMesh> CeilingLightMesh;

    UPROPERTY()
    TObjectPtr<UStaticMesh> WallMonitorMesh;
};
