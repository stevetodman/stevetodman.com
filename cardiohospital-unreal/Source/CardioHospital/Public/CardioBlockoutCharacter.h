#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "CardioBlockoutCharacter.generated.h"

class ACardioBlockoutNPC;
class UCameraComponent;

/**
 * First-person learner pawn. Default movement is click-to-walk between
 * clinic stations (plan section 6 accessibility navigation). WASD remains
 * available; mouse look is hold-to-look so the cursor stays visible.
 */
UCLASS()
class CARDIOHOSPITAL_API ACardioBlockoutCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    ACardioBlockoutCharacter();

    virtual void BeginPlay() override;
    virtual void PossessedBy(AController* NewController) override;
    virtual void Tick(float DeltaSeconds) override;

    ACardioBlockoutNPC* GetFocusedNpc() const { return FocusedNpc.Get(); }
    bool IsInExamRoom3() const;
    bool IsInExamRoom() const;
    bool IsInEducationRoom() const;
    void WalkTo(const FVector& Destination, bool bInteractOnArrival);
    void FaceNpc(AActor* Npc);

protected:
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

private:
    void MoveForward(float Value);
    void MoveRight(float Value);
    void Turn(float Value);
    void LookUp(float Value);
    void Interact();
    void ClickGo();
    void LookHoldPressed();
    void LookHoldReleased();
    void ApplyClinicInputMode();
    void CancelGuidedWalk();
    void AdvanceGuidedWalk();
    void AdvanceWaypoint();
    void FinishGuidedArrival();
    void BuildWalkPath(const FVector& Destination);
    void LookAtActorFace(const AActor* Target);
    static float DoorXFor(const FVector& Location);
    static bool IsIndoorsRoom(const FVector& Location);
    void ChooseAction1();
    void ChooseAction2();
    void ChooseAction3();
    void ChooseAction4();
    void ChooseAction5();
    void ChooseAction6();
    void ChooseAction7();
    void ChooseAction8();
    void ChooseAction9();
    void ChooseActionIndex(int32 ZeroBasedIndex);

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UCameraComponent> Camera;

    TWeakObjectPtr<ACardioBlockoutNPC> FocusedNpc;
    TArray<FVector> GuidedPath;
    bool bInteractOnArrival = false;
    bool bLookHeld = false;
    float WalkStallSeconds = 0.f;
};
