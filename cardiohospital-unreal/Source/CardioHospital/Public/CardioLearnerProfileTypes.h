#pragma once

#include "CoreMinimal.h"
#include "CardioEducationTypes.h"
#include "CardioLearnerProfileTypes.generated.h"

USTRUCT(BlueprintType)
struct CARDIOHOSPITAL_API FCardioConceptMastery
{
    GENERATED_BODY()

    UPROPERTY(SaveGame, BlueprintReadOnly) int32 Value = 0;
    UPROPERTY(SaveGame, BlueprintReadOnly) int32 AttemptCount = 0;
    UPROPERTY(SaveGame, BlueprintReadOnly) FString LastAttemptId;
};

USTRUCT(BlueprintType)
struct CARDIOHOSPITAL_API FCardioStoredAttempt
{
    GENERATED_BODY()

    UPROPERTY(SaveGame, BlueprintReadOnly) FString AttemptId;
    UPROPERTY(SaveGame, BlueprintReadOnly) FString CaseId;
    UPROPERTY(SaveGame, BlueprintReadOnly) FString CaseVersion;
    UPROPERTY(SaveGame, BlueprintReadOnly) FString CompletedAt;
    UPROPERTY(SaveGame, BlueprintReadOnly) bool bDiagnosisCorrect = false;
    UPROPERTY(SaveGame, BlueprintReadOnly) int32 OverallScore = 0;
    UPROPERTY(SaveGame, BlueprintReadOnly) TArray<FCardioScoreDimension> Dimensions;
    UPROPERTY(SaveGame, BlueprintReadOnly) TArray<FString> MissedOpportunityKeys;
    UPROPERTY(SaveGame, BlueprintReadOnly) TArray<FString> SafetyEventIds;
};

USTRUCT(BlueprintType)
struct CARDIOHOSPITAL_API FCardioLearnerProfile
{
    GENERATED_BODY()

    UPROPERTY(SaveGame, BlueprintReadOnly) int32 SchemaVersion = 0;
    UPROPERTY(SaveGame, BlueprintReadOnly) TArray<FCardioStoredAttempt> Attempts;
    UPROPERTY(SaveGame, BlueprintReadOnly) TArray<FString> CompletedCaseIds;
    UPROPERTY(SaveGame, BlueprintReadOnly) TMap<FString, FCardioConceptMastery> Mastery;
};

USTRUCT(BlueprintType)
struct CARDIOHOSPITAL_API FCardioNextCaseSelection
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString CaseId;
    UPROPERTY(BlueprintReadOnly) FString Kind;
    UPROPERTY(BlueprintReadOnly) FString Reason;
};
