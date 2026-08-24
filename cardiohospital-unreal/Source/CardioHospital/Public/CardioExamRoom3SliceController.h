#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "CardioCaseRuntimeTypes.h"
#include "CardioExamRoom3SliceController.generated.h"

class UCardioCaseRuntimeSubsystem;

UCLASS(Blueprintable)
class CARDIOHOSPITAL_API ACardioExamRoom3SliceController : public AActor
{
    GENERATED_BODY()

public:
    ACardioExamRoom3SliceController();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Cardio Hospital|Vertical Slice")
    FString CaseId = TEXT("case-hcm");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Cardio Hospital|Vertical Slice")
    bool bStartCaseOnBeginPlay = true;

    UFUNCTION(BlueprintCallable, Category="Cardio Hospital|Vertical Slice")
    bool StartConfiguredCase(FString& OutError);

    UFUNCTION(BlueprintCallable, Category="Cardio Hospital|Vertical Slice")
    bool PerformCaseAction(const FString& ActionId, const FString& PayloadJson, FCardioCaseActionResult& OutResult);

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Vertical Slice")
    TArray<FString> GetAvailableCaseActions() const;

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Vertical Slice")
    bool HasPassedCaseAcceptance() const;

protected:
    virtual void BeginPlay() override;

private:
    UCardioCaseRuntimeSubsystem* GetRuntime() const;
};
