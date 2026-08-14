#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "CardioCaseRuntimeTypes.h"
#include "CardioClinicalTypes.h"
#include "CardioEducationTypes.h"
#include "CardioCaseRuntimeSubsystem.generated.h"

UCLASS()
class CARDIOHOSPITAL_API UCardioCaseRuntimeSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    UFUNCTION(BlueprintCallable, Category="Cardio Hospital|Case Runtime")
    bool StartCase(const FString& CaseId, FString& OutError);

    UFUNCTION(BlueprintCallable, Category="Cardio Hospital|Case Runtime")
    bool PerformAction(const FString& ActionId, const FString& PayloadJson, FCardioCaseActionResult& OutResult);

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Case Runtime")
    bool HasActiveCase() const { return bHasActiveCase; }

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Case Runtime")
    bool IsCaseComplete() const;

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Case Runtime")
    TArray<FString> GetAvailableActions() const;

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Case Runtime")
    TArray<FCardioCaseActionDefinition> GetAvailableActionDefinitions() const;

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Case Runtime")
    TArray<FString> GetMissingAcceptanceActions() const;

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Case Runtime")
    bool HasPassedAcceptance() const;

    UFUNCTION(BlueprintCallable, BlueprintPure=false, Category="Cardio Hospital|Education")
    bool EvaluateCurrentAttempt(FCardioCaseDebrief& OutDebrief, FString& OutError) const;

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Case Runtime")
    FCardioCaseRuntimeState GetRuntimeState() const { return State; }

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Case Runtime")
    FCardioClinicalCase GetActiveClinicalCase() const { return ActiveCase; }

private:
    const FCardioCaseNodeDefinition* FindCurrentNode() const;
    const FCardioCaseActionDefinition* FindAction(const FString& ActionId) const;
    bool HasAllEffects(const TArray<FString>& RequiredEffects) const;
    bool TransitionMatches(const FCardioCaseTransitionDefinition& Transition) const;

    FCardioCaseGraphDefinition ActiveGraph;
    FCardioClinicalCase ActiveCase;
    FCardioCaseRuntimeState State;
    bool bHasActiveCase = false;
};
