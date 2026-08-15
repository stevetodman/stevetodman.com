#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
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

    /** Routes an E-press: closes an open panel, or engages the focused NPC. */
    void HandleInteract(ACardioBlockoutCharacter& Character, ACardioBlockoutNPC* Npc);

private:
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
