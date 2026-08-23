#pragma once

#include "CoreMinimal.h"
#include "CardioBlockoutNPC.h"
#include "CardioEncounterPresentationNPC.generated.h"

class UTextRenderComponent;

/**
 * Presentation-only exam-room actor. Clinical identity and truth remain in
 * the case runtime; this actor exists only to give the learner a visible
 * person to approach, face, and interact with in the 3D world.
 */
UCLASS()
class CARDIOHOSPITAL_API ACardioEncounterPresentationNPC : public ACardioBlockoutNPC
{
    GENERATED_BODY()

public:
    ACardioEncounterPresentationNPC();

    void ConfigureRole(const FString& RoleLabel);

private:
    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UTextRenderComponent> RoleText;
};

namespace CardioEncounterPresentation
{
    void RegisterWorldHook();
    void UnregisterWorldHook();
}
