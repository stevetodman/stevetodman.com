#pragma once

#include "CoreMinimal.h"
#include "CardioCaseRuntimeTypes.generated.h"

USTRUCT(BlueprintType)
struct FCardioCaseActionEvent
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) int32 Sequence = 0;
    UPROPERTY(BlueprintReadOnly) FString NodeId;
    UPROPERTY(BlueprintReadOnly) FString ActionId;
    UPROPERTY(BlueprintReadOnly) FString EventType;
    UPROPERTY(BlueprintReadOnly) FString Target;
    UPROPERTY(BlueprintReadOnly) FString PayloadJson;
};

USTRUCT(BlueprintType)
struct FCardioCaseRuntimeState
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString CaseId;
    UPROPERTY(BlueprintReadOnly) FString GraphVersion;
    UPROPERTY(BlueprintReadOnly) FString NodeId;
    UPROPERTY(BlueprintReadOnly) TArray<FString> Effects;
    UPROPERTY(BlueprintReadOnly) TArray<FString> CompletedActions;
    UPROPERTY(BlueprintReadOnly) TArray<FCardioCaseActionEvent> ActionLog;
};

USTRUCT(BlueprintType)
struct FCardioCaseActionResult
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) bool bSucceeded = false;
    UPROPERTY(BlueprintReadOnly) bool bTransitioned = false;
    UPROPERTY(BlueprintReadOnly) FString Error;
    UPROPERTY(BlueprintReadOnly) FString NodeBefore;
    UPROPERTY(BlueprintReadOnly) FString NodeAfter;
    UPROPERTY(BlueprintReadOnly) FString PayloadJson;
};
