#pragma once

#include "CoreMinimal.h"
#include "CardioClinicalTypes.generated.h"

USTRUCT(BlueprintType)
struct FCardioHistoryFact
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Question;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Answer;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Key;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) bool RedFlag = false;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) bool Confidential = false;
};

USTRUCT(BlueprintType)
struct FCardioAuscultationFinding
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Site;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Description;
};

USTRUCT(BlueprintType)
struct FCardioFourLimbBloodPressure
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString RA;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString LA;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString RL;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString LL;
};

USTRUCT(BlueprintType)
struct FCardioVitals
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 HR = 0;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString BP;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 RR = 0;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 SpO2 = 0;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FCardioFourLimbBloodPressure FourLimbBP;
};

USTRUCT(BlueprintType)
struct FCardioExamFindings
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString General;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FCardioVitals Vitals;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FCardioAuscultationFinding> Auscultation;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString FemoralPulses;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> Extras;
};

USTRUCT(BlueprintType)
struct FCardioEcgIntervals
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString PR;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString QRS;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString QTc;
};

USTRUCT(BlueprintType)
struct FCardioEcgFindings
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Rhythm;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) int32 Rate = 0;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FCardioEcgIntervals Intervals;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Axis;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> KeyFindings;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Pattern;
};

USTRUCT(BlueprintType)
struct FCardioEchoFindings
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Summary;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> KeyFindings;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Anomaly;
};

USTRUCT(BlueprintType)
struct FCardioClinicalCase
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Id;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString PatientName;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) double Age = 0.0;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Sex;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString ChiefComplaint;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Room;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Vibe;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) bool ParentPresent = false;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) bool AllowConfidentialInterview = false;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString CorrectDiagnosis;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> Differentials;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FCardioHistoryFact> History;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FCardioExamFindings Exam;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FCardioEcgFindings Ecg;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FCardioEchoFindings Echo;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> AppropriateTests;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> UnnecessaryTests;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> CorrectManagement;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> RedFlagKeys;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString TeachingPoint;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TMap<FString, FString> MissedOpportunityTemplate;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> AttendingSocratic;
};

USTRUCT(BlueprintType)
struct FCardioCaseActionDefinition
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Id;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Type;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Target;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString EventType;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> Effects;
};

USTRUCT(BlueprintType)
struct FCardioCaseTransitionDefinition
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString To;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> AllOf;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> AnyOf;
};

USTRUCT(BlueprintType)
struct FCardioCaseNodeDefinition
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Id;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Phase;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> AvailableActions;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> AcceptanceActions;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FCardioCaseTransitionDefinition> Transitions;
};

USTRUCT(BlueprintType)
struct FCardioCaseGraphDefinition
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString CaseId;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString Version;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) FString StartNodeId;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FString> TerminalNodeIds;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FCardioCaseActionDefinition> Actions;
    UPROPERTY(EditAnywhere, BlueprintReadOnly) TArray<FCardioCaseNodeDefinition> Nodes;
};

USTRUCT()
struct FCardioClinicalContentDocument
{
    GENERATED_BODY()

    UPROPERTY() int32 SchemaVersion = 0;
    UPROPERTY() FString GeneratedAt;
    UPROPERTY() TArray<FCardioClinicalCase> Cases;
    UPROPERTY() TArray<FCardioCaseGraphDefinition> CaseGraphs;
};

