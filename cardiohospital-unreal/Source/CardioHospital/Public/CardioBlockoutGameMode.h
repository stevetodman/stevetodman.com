#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "CardioClinicalTypes.h"
#include "CardioBlockoutGameMode.generated.h"

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

    /** Numbered menu choice 0-8 while an encounter panel is open. */
    void HandleChooseAction(int32 ZeroBasedIndex);

    /** Location-driven graph progress: workroom and exam-room navigation actions. */
    void NotifyLearnerLocation(const FVector& Location);

    static bool IsExamRoom3Location(const FVector& Location);
    static bool IsTeamRoomLocation(const FVector& Location);

private:
    void HandleAttending(ACardioBlockoutNPC& Npc);
    void HandleExamRoom();
    void AdvanceImpliedActions(const TArray<FString>& ActionIds);
    bool TryPerformAction(const FString& ActionId, const FString& PayloadJson = TEXT("{}"));
    bool HasAttendingFollowUp() const;
    void ShowEncounterMenu();
    void ShowDiagnosisMenu();
    void ShowDebrief();
    void ShowActionResult(const FCardioCaseActionDefinition& Action);
    bool HandleSpecialAction(const FCardioCaseActionDefinition& Action);
    FString LabelForAction(const FCardioCaseActionDefinition& Action) const;
    FString ResultForAction(const FCardioCaseActionDefinition& Action) const;
    static FString DiagnosisPayloadJson(const FString& Diagnosis);

    TArray<FString> CurrentMenuActions;
    bool bChoosingDiagnosis = false;
    AStaticMeshActor* SpawnBlock(UWorld& World, const FVector& Center, const FVector& Size, const FLinearColor& Color) const;
    void SpawnLighting(UWorld& World) const;
    void SpawnSigns(UWorld& World) const;
    void SpawnSign(UWorld& World, const FString& Text, const FVector& Location, float YawDegrees) const;
    void SpawnAttending(UWorld& World);

    // Hard references so the cook always carries the engine primitives the
    // blockout is built from. A soft path would resolve in the editor and
    // silently fail in a packaged build if the cooker never saw it.
    UPROPERTY()
    TObjectPtr<UStaticMesh> BlockMesh;

    UPROPERTY()
    TObjectPtr<UMaterialInterface> BlockMaterial;
};
