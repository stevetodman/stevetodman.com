#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "CardioBlockoutCharacter.generated.h"

class UCameraComponent;

/**
 * First-person learner pawn for the walkable ward blockout. Walking pace,
 * mouse look, no weapons, no jump: the learner is on rounds.
 */
UCLASS()
class CARDIOHOSPITAL_API ACardioBlockoutCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    ACardioBlockoutCharacter();

protected:
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

private:
    void MoveForward(float Value);
    void MoveRight(float Value);

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UCameraComponent> Camera;
};
