#pragma once

#include "CoreMinimal.h"
#include "CardioClinicalTypes.h"
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
struct FCardioAssignmentBrief
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString PatientName;
    UPROPERTY(BlueprintReadOnly) double Age = 0.0;
    UPROPERTY(BlueprintReadOnly) FString Sex;
    UPROPERTY(BlueprintReadOnly) FString ChiefComplaint;
    UPROPERTY(BlueprintReadOnly) FString Room;
    UPROPERTY(BlueprintReadOnly) FString Vibe;
    UPROPERTY(BlueprintReadOnly) bool ParentPresent = false;
};

USTRUCT(BlueprintType)
struct FCardioActionMenuItem
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString Id;
    UPROPERTY(BlueprintReadOnly) FString Type;
    UPROPERTY(BlueprintReadOnly) FString Label;
};

USTRUCT(BlueprintType)
struct FCardioPresentationState
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString CaseId;
    UPROPERTY(BlueprintReadOnly) FString Phase;
    UPROPERTY(BlueprintReadOnly) FString NodeId;
    UPROPERTY(BlueprintReadOnly) TArray<FString> AvailableActionIds;
    UPROPERTY(BlueprintReadOnly) TArray<FCardioActionMenuItem> Menu;
    UPROPERTY(BlueprintReadOnly) bool bHasAssignment = false;
    UPROPERTY(BlueprintReadOnly) FCardioAssignmentBrief Assignment;
    UPROPERTY(BlueprintReadOnly) TArray<FCardioHistoryFact> History;
    UPROPERTY(BlueprintReadOnly) FCardioExamFindings Exam;
    UPROPERTY(BlueprintReadOnly) TArray<FString> DiagnosisChoices;
    UPROPERTY(BlueprintReadOnly) TArray<FString> Socratic;
    UPROPERTY(BlueprintReadOnly) FString TeachingPoint;
    UPROPERTY(BlueprintReadOnly) FString CorrectDiagnosis;
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
