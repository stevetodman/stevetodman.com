#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "CardioBlockoutCharacter.generated.h"

class ACardioBlockoutNPC;
class UCameraComponent;

/**
 * First-person learner pawn for the walkable ward blockout. Walking pace,
 * mouse look, no weapons, no jump: the learner is on rounds. A short camera
 * trace tracks which staff member is in focus for interaction.
 */
UCLASS()
class CARDIOHOSPITAL_API ACardioBlockoutCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    ACardioBlockoutCharacter();

    virtual void Tick(float DeltaSeconds) override;

    ACardioBlockoutNPC* GetFocusedNpc() const { return FocusedNpc.Get(); }
    bool IsInExamRoom3() const;
    bool IsInExamRoom() const;
    bool IsInEducationRoom() const;

protected:
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

private:
    void MoveForward(float Value);
    void MoveRight(float Value);
    void Interact();
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
};
