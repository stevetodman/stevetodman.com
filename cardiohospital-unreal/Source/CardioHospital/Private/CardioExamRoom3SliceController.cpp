#include "CardioExamRoom3SliceController.h"

#include "CardioCaseRuntimeSubsystem.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"

ACardioExamRoom3SliceController::ACardioExamRoom3SliceController()
{
    PrimaryActorTick.bCanEverTick = false;
}

void ACardioExamRoom3SliceController::BeginPlay()
{
    Super::BeginPlay();

    if (!bStartCaseOnBeginPlay)
    {
        return;
    }

    FString Error;
    if (!StartConfiguredCase(Error))
    {
        UE_LOG(LogTemp, Error, TEXT("Exam Room 3 vertical slice failed to start %s: %s"), *CaseId, *Error);
    }
}

UCardioCaseRuntimeSubsystem* ACardioExamRoom3SliceController::GetRuntime() const
{
    const UWorld* World = GetWorld();
    if (!World)
    {
        return nullptr;
    }

    UGameInstance* GameInstance = World->GetGameInstance();
    return GameInstance ? GameInstance->GetSubsystem<UCardioCaseRuntimeSubsystem>() : nullptr;
}

bool ACardioExamRoom3SliceController::StartConfiguredCase(FString& OutError)
{
    UCardioCaseRuntimeSubsystem* Runtime = GetRuntime();
    if (!Runtime)
    {
        OutError = TEXT("Cardio case runtime subsystem is unavailable.");
        return false;
    }

    return Runtime->StartCase(CaseId, OutError);
}

bool ACardioExamRoom3SliceController::PerformCaseAction(
    const FString& ActionId,
    const FString& PayloadJson,
    FCardioCaseActionResult& OutResult)
{
    UCardioCaseRuntimeSubsystem* Runtime = GetRuntime();
    return Runtime ? Runtime->PerformAction(ActionId, PayloadJson, OutResult) : false;
}

TArray<FString> ACardioExamRoom3SliceController::GetAvailableCaseActions() const
{
    const UCardioCaseRuntimeSubsystem* Runtime = GetRuntime();
    return Runtime ? Runtime->GetAvailableActions() : TArray<FString>();
}

bool ACardioExamRoom3SliceController::HasPassedCaseAcceptance() const
{
    const UCardioCaseRuntimeSubsystem* Runtime = GetRuntime();
    return Runtime && Runtime->HasPassedAcceptance();
}
