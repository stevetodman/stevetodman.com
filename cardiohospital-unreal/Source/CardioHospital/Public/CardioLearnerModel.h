#pragma once

#include "CoreMinimal.h"
#include "CardioClinicalTypes.h"
#include "CardioEducationTypes.h"
#include "CardioLearnerProfileTypes.h"

class CARDIOHOSPITAL_API FCardioLearnerModel final
{
public:
    static int32 GetSupportedSchemaVersion();
    static FCardioLearnerProfile CreateProfile();
    static bool ValidateProfile(const FCardioLearnerProfile& Profile, FString& OutError);

    static bool RecordAttempt(
        const FCardioLearnerProfile& Profile,
        const FCardioCaseDebrief& Debrief,
        const TArray<FCardioCaseConceptDefinition>& Concepts,
        const FString& AttemptId,
        const FString& CompletedAt,
        FCardioLearnerProfile& OutProfile,
        FString& OutError);

    static FString MasteryLabel(int32 Value);

    static bool SelectNextCase(
        const FCardioLearnerProfile& Profile,
        const TArray<FCardioClinicalCase>& Cases,
        const TArray<FCardioCaseConceptDefinition>& Concepts,
        FCardioNextCaseSelection& OutSelection,
        FString& OutError);
};
