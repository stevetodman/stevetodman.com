#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "CardioClinicalTypes.h"
#include "CardioClinicalDataSubsystem.generated.h"

UCLASS()
class CARDIOHOSPITAL_API UCardioClinicalDataSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Clinical Data")
    bool IsClinicalContentLoaded() const { return bLoaded; }

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Clinical Data")
    const TArray<FCardioClinicalCase>& GetCases() const { return Content.Cases; }

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Clinical Data")
    bool FindCaseById(const FString& CaseId, FCardioClinicalCase& OutCase) const;

    bool ReloadClinicalContent(FString& OutError);

private:
    FCardioClinicalContentDocument Content;
    bool bLoaded = false;
};

