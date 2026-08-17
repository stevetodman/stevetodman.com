#include "CardioEducationEvaluator.h"

#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

namespace
{
    constexpr TCHAR HistoryDimension[] = TEXT("history");
    constexpr TCHAR PhysicalExaminationDimension[] = TEXT("physicalExamination");
    constexpr TCHAR RedFlagRecognitionDimension[] = TEXT("redFlagRecognition");
    constexpr TCHAR DifferentialDiagnosisDimension[] = TEXT("differentialDiagnosis");
    constexpr TCHAR TestSelectionDimension[] = TEXT("testSelection");
    constexpr TCHAR InterpretationDimension[] = TEXT("interpretation");
    constexpr TCHAR ClinicalReasoningDimension[] = TEXT("clinicalReasoning");
    constexpr TCHAR ManagementDimension[] = TEXT("management");
    constexpr TCHAR CommunicationDimension[] = TEXT("communication");
    constexpr TCHAR EfficiencyDimension[] = TEXT("efficiency");
    constexpr TCHAR SafetyDimension[] = TEXT("safety");

    int32 ClampScore(const double Value)
    {
        return FMath::Clamp(FMath::RoundToInt32(Value), 0, 100);
    }

    int32 Percentage(const TArray<FString>& Completed, const TArray<FString>& Expected)
    {
        if (Expected.IsEmpty())
        {
            return 100;
        }

        const int32 CompletedCount = Completed.CountByPredicate(
            [&Expected](const FString& Item)
            {
                return Expected.Contains(Item);
            });
        return ClampScore(static_cast<double>(CompletedCount) / Expected.Num() * 100.0);
    }

    TArray<FString> UniqueTargets(const TArray<FCardioCaseActionEvent>& ActionLog, const TCHAR* EventType)
    {
        TArray<FString> Targets;
        for (const FCardioCaseActionEvent& Event : ActionLog)
        {
            if (Event.EventType.Equals(EventType, ESearchCase::CaseSensitive))
            {
                Targets.AddUnique(Event.Target);
            }
        }
        return Targets;
    }

    TSet<FString> CompletedActionIds(const TArray<FCardioCaseActionEvent>& ActionLog)
    {
        TSet<FString> Completed;
        for (const FCardioCaseActionEvent& Event : ActionLog)
        {
            Completed.Add(Event.ActionId);
        }
        return Completed;
    }

    FString SubmittedDiagnosis(const TArray<FCardioCaseActionEvent>& ActionLog)
    {
        for (int32 Index = ActionLog.Num() - 1; Index >= 0; --Index)
        {
            const FCardioCaseActionEvent& Event = ActionLog[Index];
            if (!Event.EventType.Equals(TEXT("diagnosis_submitted"), ESearchCase::CaseSensitive))
            {
                continue;
            }

            TSharedPtr<FJsonObject> Payload;
            const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Event.PayloadJson);
            if (FJsonSerializer::Deserialize(Reader, Payload) && Payload.IsValid())
            {
                FString Diagnosis;
                if (Payload->TryGetStringField(TEXT("diagnosis"), Diagnosis))
                {
                    return Diagnosis;
                }
            }
            return FString{};
        }
        return FString{};
    }

    bool GraphContainsAction(const FCardioCaseGraphDefinition& Graph, const TCHAR* Type, const FString& Target)
    {
        return Graph.Actions.ContainsByPredicate(
            [Type, &Target](const FCardioCaseActionDefinition& Action)
            {
                return Action.Type.Equals(Type, ESearchCase::CaseSensitive)
                    && Action.Target.Equals(Target, ESearchCase::CaseSensitive);
            });
    }

    void AddDimension(FCardioCaseDebrief& Debrief, const TCHAR* Id, const int32 Score)
    {
        FCardioScoreDimension& Dimension = Debrief.Dimensions.AddDefaulted_GetRef();
        Dimension.Id = Id;
        Dimension.Score = Score;
    }
}

bool FCardioEducationEvaluator::EvaluateAttempt(
    const FCardioCaseRuntimeState& Snapshot,
    const FCardioCaseGraphDefinition& Graph,
    const FCardioClinicalCase& ClinicalCase,
    FCardioCaseDebrief& OutDebrief,
    FString& OutError)
{
    OutDebrief = FCardioCaseDebrief{};
    OutError.Reset();

    if (!Snapshot.CaseId.Equals(Graph.CaseId, ESearchCase::CaseSensitive)
        || !Graph.CaseId.Equals(ClinicalCase.Id, ESearchCase::CaseSensitive))
    {
        OutError = TEXT("Attempt, graph, and clinical truth must identify the same case");
        return false;
    }

    const TSet<FString> CompletedActions = CompletedActionIds(Snapshot.ActionLog);
    const TArray<FString> AskedHistory = UniqueTargets(Snapshot.ActionLog, TEXT("history_question"));
    const TArray<FString> PerformedExam = UniqueTargets(Snapshot.ActionLog, TEXT("exam_performed"));
    const TArray<FString> OrderedTests = UniqueTargets(Snapshot.ActionLog, TEXT("test_ordered"));
    const TArray<FString> InterpretedTests = UniqueTargets(Snapshot.ActionLog, TEXT("test_interpreted"));
    const TArray<FString> ManagementActions = UniqueTargets(Snapshot.ActionLog, TEXT("management_action"));

    for (const FString& Test : OrderedTests)
    {
        if (ClinicalCase.UnnecessaryTests.Contains(Test))
        {
            OutDebrief.UnnecessaryTests.Add(Test);
        }
    }

    TArray<FString> ExpectedOrderedTests;
    for (const FString& Test : ClinicalCase.AppropriateTests)
    {
        if (GraphContainsAction(Graph, TEXT("order"), Test))
        {
            ExpectedOrderedTests.Add(Test);
        }
    }

    TArray<FString> ExpectedInterpretedTests;
    for (const FString& Test : ExpectedOrderedTests)
    {
        if (GraphContainsAction(Graph, TEXT("review"), Test))
        {
            ExpectedInterpretedTests.Add(Test);
        }
    }

    const TArray<FString> ExamTargets = {
        TEXT("general"),
        TEXT("vitals"),
        TEXT("auscultation"),
        TEXT("femoralPulses")
    };
    TArray<FString> ExpectedExam;
    for (const FString& Target : ExamTargets)
    {
        if (GraphContainsAction(Graph, TEXT("exam"), Target))
        {
            ExpectedExam.Add(Target);
        }
    }

    TArray<FString> ExpectedHistory;
    ExpectedHistory.Reserve(ClinicalCase.History.Num());
    for (const FCardioHistoryFact& Fact : ClinicalCase.History)
    {
        ExpectedHistory.Add(Fact.Key);
    }

    const int32 HistoryScore = Percentage(AskedHistory, ExpectedHistory);
    const int32 PhysicalScore = Percentage(PerformedExam, ExpectedExam);
    const int32 RedFlagScore = Percentage(AskedHistory, ClinicalCase.RedFlagKeys);
    const int32 AppropriateTestScore = Percentage(OrderedTests, ExpectedOrderedTests);
    const int32 TestSelectionScore = ClampScore(
        AppropriateTestScore - OutDebrief.UnnecessaryTests.Num() * 25.0);
    const int32 InterpretationScore = Percentage(InterpretedTests, ExpectedInterpretedTests);

    OutDebrief.CaseId = Graph.CaseId;
    OutDebrief.CaseVersion = Graph.Version;
    OutDebrief.DiagnosisSubmitted = SubmittedDiagnosis(Snapshot.ActionLog);
    OutDebrief.bDiagnosisCorrect = OutDebrief.DiagnosisSubmitted.Equals(
        ClinicalCase.CorrectDiagnosis,
        ESearchCase::CaseSensitive);

    const bool bDiagnosisOnAuthoredDifferential = ClinicalCase.Differentials.Contains(
        OutDebrief.DiagnosisSubmitted);
    const int32 DifferentialScore = OutDebrief.DiagnosisSubmitted.IsEmpty() || !bDiagnosisOnAuthoredDifferential
        ? 0
        : ClampScore((OutDebrief.bDiagnosisCorrect ? 60.0 : 30.0) + RedFlagScore * 0.4);
    const int32 ReasoningScore = ClampScore(
        (OutDebrief.bDiagnosisCorrect ? 70.0 : 0.0) + RedFlagScore * 0.3);
    const int32 ManagementScore = Percentage(ManagementActions, ClinicalCase.CorrectManagement);

    const TArray<FString> CommunicationExpected = {
        TEXT("attending.open-assignment"),
        TEXT("encounter.introduce"),
        TEXT("reasoning.submit"),
        TEXT("debrief.review")
    };
    TArray<FString> CommunicationCompleted;
    for (const FString& ActionId : CompletedActions)
    {
        CommunicationCompleted.Add(ActionId);
    }
    const int32 CommunicationScore = Percentage(CommunicationCompleted, CommunicationExpected);

    const int32 DuplicateCount = Snapshot.ActionLog.Num() - CompletedActions.Num();
    const int32 EfficiencyScore = ClampScore(
        100.0 - OutDebrief.UnnecessaryTests.Num() * 25.0 - DuplicateCount * 5.0);

    for (const FCardioSafetyRuleDefinition& Rule : Graph.SafetyRules)
    {
        FCardioSafetyEvent Event;
        Event.Id = Rule.Id;
        Event.Severity = Rule.Severity;
        Event.Message = Rule.Message;
        Event.Intervention = Rule.Intervention;

        for (const FString& ActionId : Rule.RequiredActions)
        {
            if (!CompletedActions.Contains(ActionId))
            {
                Event.MissingActions.Add(ActionId);
            }
        }
        for (const FString& ActionId : Rule.ProhibitedActions)
        {
            if (CompletedActions.Contains(ActionId))
            {
                Event.ProhibitedActions.Add(ActionId);
            }
        }

        if (!Event.MissingActions.IsEmpty() || !Event.ProhibitedActions.IsEmpty())
        {
            OutDebrief.SafetyEvents.Add(MoveTemp(Event));
        }
    }

    const int32 SafetyScore = OutDebrief.SafetyEvents.IsEmpty()
        ? 100
        : OutDebrief.SafetyEvents.ContainsByPredicate(
            [](const FCardioSafetyEvent& Event)
            {
                return Event.Severity.Equals(TEXT("critical"), ESearchCase::CaseSensitive);
            })
            ? 0
            : 50;

    AddDimension(OutDebrief, HistoryDimension, HistoryScore);
    AddDimension(OutDebrief, PhysicalExaminationDimension, PhysicalScore);
    AddDimension(OutDebrief, RedFlagRecognitionDimension, RedFlagScore);
    AddDimension(OutDebrief, DifferentialDiagnosisDimension, DifferentialScore);
    AddDimension(OutDebrief, TestSelectionDimension, TestSelectionScore);
    AddDimension(OutDebrief, InterpretationDimension, InterpretationScore);
    AddDimension(OutDebrief, ClinicalReasoningDimension, ReasoningScore);
    AddDimension(OutDebrief, ManagementDimension, ManagementScore);
    AddDimension(OutDebrief, CommunicationDimension, CommunicationScore);
    AddDimension(OutDebrief, EfficiencyDimension, EfficiencyScore);
    AddDimension(OutDebrief, SafetyDimension, SafetyScore);

    int32 ScoreTotal = 0;
    for (const FCardioScoreDimension& Dimension : OutDebrief.Dimensions)
    {
        ScoreTotal += Dimension.Score;
    }
    OutDebrief.OverallScore = ClampScore(
        static_cast<double>(ScoreTotal) / OutDebrief.Dimensions.Num());

    for (const FString& Key : ClinicalCase.RedFlagKeys)
    {
        if (AskedHistory.Contains(Key))
        {
            continue;
        }

        FCardioMissedOpportunity& Missed = OutDebrief.MissedOpportunities.AddDefaulted_GetRef();
        Missed.Key = Key;
        if (const FString* AuthoredMessage = ClinicalCase.MissedOpportunityTemplate.Find(Key))
        {
            Missed.Message = *AuthoredMessage;
        }
        else
        {
            Missed.Message = FString::Printf(TEXT("You did not assess %s."), *Key);
        }
    }

    for (const FCardioCounterfactualDefinition& Definition : Graph.Counterfactuals)
    {
        const bool bTriggered = Definition.TriggerMissingActions.ContainsByPredicate(
            [&CompletedActions](const FString& ActionId)
            {
                return !CompletedActions.Contains(ActionId);
            });
        if (!bTriggered)
        {
            continue;
        }

        FCardioCounterfactualFeedback& Feedback = OutDebrief.Counterfactuals.AddDefaulted_GetRef();
        Feedback.Id = Definition.Id;
        Feedback.Prompt = Definition.Prompt;
        Feedback.AlternateCaseId = Definition.AlternateCaseId;
    }

    OutDebrief.ActionLog = Snapshot.ActionLog;
    return true;
}
