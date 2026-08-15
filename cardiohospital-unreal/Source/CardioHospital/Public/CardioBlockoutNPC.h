#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "CardioBlockoutNPC.generated.h"

class UStaticMeshComponent;
class UTextRenderComponent;

/**
 * Presentation adapter for the first attending. Clinical truth never lives
 * here. Gaze, listening lean, blink, and a speaking cue are blockout
 * stand-ins until a MetaHuman Patel exists; they do not satisfy the
 * packaged character-quality gate by themselves.
 */
UCLASS()
class CARDIOHOSPITAL_API ACardioBlockoutNPC : public AActor
{
    GENERATED_BODY()

public:
    ACardioBlockoutNPC();

    virtual void Tick(float DeltaSeconds) override;

    /** Apply identity and appearance. Call once, right after spawning. */
    void Configure(const FString& InNpcId, const FString& InDisplayName, const FLinearColor& CoatColor);

    const FString& GetNpcId() const { return NpcId; }
    const FString& GetDisplayName() const { return DisplayName; }
    FString GetInteractionPrompt() const;

    void SetListening(bool bInListening);
    void NotifySpeaking(bool bInSpeaking);

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

    FVector BodyBaseScale = FVector(0.42f, 0.6f, 1.7f);
    FVector HeadBaseScale = FVector(0.34f);
    float BlinkTimer = 3.2f;
    float BlinkRemaining = 0.f;
    bool bListening = false;
    bool bSpeaking = false;
};
