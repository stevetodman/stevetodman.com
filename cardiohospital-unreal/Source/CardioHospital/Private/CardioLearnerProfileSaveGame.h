#pragma once

#include "CoreMinimal.h"
#include "GameFramework/SaveGame.h"
#include "CardioLearnerProfileTypes.h"
#include "CardioLearnerProfileSaveGame.generated.h"

UCLASS()
class UCardioLearnerProfileSaveGame final : public USaveGame
{
    GENERATED_BODY()

public:
    UPROPERTY(SaveGame)
    FCardioLearnerProfile Profile;
};
