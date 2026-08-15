#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "CardioBlockoutNPC.generated.h"

class USkeletalMeshComponent;
class UStaticMeshComponent;
class UTextRenderComponent;

/**
 * Presentation adapter for the first attending. Clinical truth never lives
 * here. The assembled MetaHuman is used when BP_Patel exists; otherwise a
 * proportioned clinic stand-in carries gaze, listen, blink, and speech cues.
 * That stand-in does not satisfy walkthrough step 5 by itself.
 */
UCLASS()
class CARDIOHOSPITAL_API ACardioBlockoutNPC : public AActor
{
    GENERATED_BODY()

public:
    ACardioBlockoutNPC();

    virtual void Tick(float DeltaSeconds) override;

    void Configure(const FString& InNpcId, const FString& InDisplayName, const FLinearColor& CoatColor);

    const FString& GetNpcId() const { return NpcId; }
    const FString& GetDisplayName() const { return DisplayName; }
    FString GetInteractionPrompt() const;

    void SetListening(bool bInListening);
    void NotifySpeaking(bool bInSpeaking);
    bool HasAssembledMetaHuman() const { return AssembledVisual != nullptr; }

private:
    UStaticMeshComponent* MakePart(
        FName Name,
        UStaticMesh* Mesh,
        UMaterialInterface* Material,
        const FVector& Location,
        const FVector& Scale);

    void ApplyTint(UStaticMeshComponent* Mesh, const FLinearColor& Color);
    void HidePrimitiveStandIn();
    void TryAttachAssembledMetaHuman();
    USkeletalMeshComponent* FindAssembledBody() const;
    void HideDefaultGarment() const;
    void EnsureSkinnedMeshesLoaded();
    bool AttachSkinnedAttendingKit();

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<USceneComponent> Root;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Torso;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Coat;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Head;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Hair;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> LeftEye;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> RightEye;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> LeftArm;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> RightArm;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> LeftLeg;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> RightLeg;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> AttendingCoat;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> AttendingTrousers;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> AttendingScope;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<USkeletalMeshComponent> AttendingCoatSkel;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<USkeletalMeshComponent> AttendingTrousersSkel;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<USkeletalMeshComponent> AttendingScopeSkel;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UTextRenderComponent> NameText;

    UPROPERTY()
    FString NpcId;

    UPROPERTY()
    FString DisplayName;

    FVector TorsoBaseScale = FVector(0.38f, 0.28f, 0.78f);
    FVector HeadBaseScale = FVector(0.28f);
    FVector EyeBaseScale = FVector(0.055f);
    float BlinkTimer = 3.2f;
    float BlinkRemaining = 0.f;
    bool bListening = false;
    bool bSpeaking = false;

    UPROPERTY()
    TObjectPtr<AActor> AssembledVisual;

    bool bAttendingKitAttached = false;
};
