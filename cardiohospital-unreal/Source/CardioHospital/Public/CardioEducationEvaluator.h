#pragma once

#include "CoreMinimal.h"
#include "CardioCaseRuntimeTypes.h"
#include "CardioClinicalTypes.h"
#include "CardioEducationTypes.h"

class CARDIOHOSPITAL_API FCardioEducationEvaluator final
{
public:
    static bool EvaluateAttempt(
        const FCardioCaseRuntimeState& Snapshot,
        const FCardioCaseGraphDefinition& Graph,
        const FCardioClinicalCase& ClinicalCase,
        FCardioCaseDebrief& OutDebrief,
        FString& OutError);
};
