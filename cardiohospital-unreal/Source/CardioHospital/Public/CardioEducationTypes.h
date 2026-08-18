#pragma once

#include "CoreMinimal.h"
#include "CardioCaseRuntimeTypes.h"
#include "CardioEducationTypes.generated.h"

USTRUCT(BlueprintType)
struct CARDIOHOSPITAL_API FCardioScoreDimension
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString Id;
    UPROPERTY(BlueprintReadOnly) int32 Score = 0;
};

USTRUCT(BlueprintType)
struct CARDIOHOSPITAL_API FCardioMissedOpportunity
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString Key;
    UPROPERTY(BlueprintReadOnly) FString Message;
};

USTRUCT(BlueprintType)
struct CARDIOHOSPITAL_API FCardioSafetyEvent
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString Id;
    UPROPERTY(BlueprintReadOnly) FString Severity;
    UPROPERTY(BlueprintReadOnly) FString Message;
    UPROPERTY(BlueprintReadOnly) FString Intervention;
    UPROPERTY(BlueprintReadOnly) TArray<FString> MissingActions;
    UPROPERTY(BlueprintReadOnly) TArray<FString> ProhibitedActions;
};

USTRUCT(BlueprintType)
struct CARDIOHOSPITAL_API FCardioCounterfactualFeedback
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString Id;
    UPROPERTY(BlueprintReadOnly) FString Prompt;
    UPROPERTY(BlueprintReadOnly) FString AlternateCaseId;
};

USTRUCT(BlueprintType)
struct CARDIOHOSPITAL_API FCardioCaseDebrief
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString CaseId;
    UPROPERTY(BlueprintReadOnly) FString CaseVersion;
    UPROPERTY(BlueprintReadOnly) FString DiagnosisSubmitted;
    UPROPERTY(BlueprintReadOnly) bool bDiagnosisCorrect = false;
    UPROPERTY(BlueprintReadOnly) int32 OverallScore = 0;
    UPROPERTY(BlueprintReadOnly) FString SummaryFeedback;
    UPROPERTY(BlueprintReadOnly) TArray<FCardioScoreDimension> Dimensions;
    UPROPERTY(BlueprintReadOnly) TArray<FCardioMissedOpportunity> MissedOpportunities;
    UPROPERTY(BlueprintReadOnly) TArray<FString> UnnecessaryTests;
    UPROPERTY(BlueprintReadOnly) TArray<FCardioSafetyEvent> SafetyEvents;
    UPROPERTY(BlueprintReadOnly) TArray<FCardioCounterfactualFeedback> Counterfactuals;
    UPROPERTY(BlueprintReadOnly) TArray<FCardioCaseActionEvent> ActionLog;
};
