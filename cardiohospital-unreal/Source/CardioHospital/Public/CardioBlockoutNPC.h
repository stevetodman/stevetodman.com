#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "CardioBlockoutNPC.generated.h"

class UStaticMeshComponent;
class UTextRenderComponent;

/**
 * Placeholder staff figure for the ward blockout: a coat-colored block with a
 * head and a floating name. It exists so the interaction and encounter flow
 * can be proven before any MetaHuman work; behavioral fidelity (voice, gaze,
 * facial response) is explicitly not claimed at this stage.
 */
UCLASS()
class CARDIOHOSPITAL_API ACardioBlockoutNPC : public AActor
{
    GENERATED_BODY()

public:
    ACardioBlockoutNPC();

    /** Apply identity and appearance. Call once, right after spawning. */
    void Configure(const FString& InNpcId, const FString& InDisplayName, const FLinearColor& CoatColor);

    const FString& GetNpcId() const { return NpcId; }
    const FString& GetDisplayName() const { return DisplayName; }
    FString GetInteractionPrompt() const;

private:
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<USceneComponent> Root;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Body;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Head;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UTextRenderComponent> NameText;

    UPROPERTY()
    FString NpcId;

    UPROPERTY()
    FString DisplayName;
};
