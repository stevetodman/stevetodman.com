#if WITH_DEV_AUTOMATION_TESTS

#include "CardioClinicalTypes.h"
#include "CardioEducationEvaluator.h"
#include "JsonObjectConverter.h"
#include "Misc/AutomationTest.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"

namespace
{
    bool LoadClinicalDocument(FCardioClinicalContentDocument& OutDocument, FString& OutError)
    {
        const FString Path = FPaths::Combine(
            FPaths::ProjectContentDir(),
            TEXT("Data/clinical-content.json"));
        FString Json;
        if (!FFileHelper::LoadFileToString(Json, *Path))
        {
            OutError = FString::Printf(TEXT("Could not read %s"), *Path);
            return false;
        }
        if (!FJsonObjectConverter::JsonObjectStringToUStruct(Json, &OutDocument, 0, 0))
        {
            OutError = TEXT("Clinical JSON did not match the reflected schema");
            return false;
        }
        return true;
    }

    bool BuildSnapshot(
        const FCardioCaseGraphDefinition& Graph,
        const TArray<FString>& ActionIds,
        const FString& DiagnosisPayloadJson,
        FCardioCaseRuntimeState& OutSnapshot,
        FString& OutError)
    {
        OutSnapshot = FCardioCaseRuntimeState{};
        OutSnapshot.CaseId = Graph.CaseId;
        OutSnapshot.GraphVersion = Graph.Version;
        OutSnapshot.NodeId = Graph.StartNodeId;

        for (const FString& ActionId : ActionIds)
        {
            const FCardioCaseActionDefinition* Definition = Graph.Actions.FindByPredicate(
                [&ActionId](const FCardioCaseActionDefinition& Candidate)
                {
                    return Candidate.Id.Equals(ActionId, ESearchCase::CaseSensitive);
                });
            if (!Definition)
            {
                OutError = FString::Printf(TEXT("Unknown fixture action: %s"), *ActionId);
                return false;
            }

            FCardioCaseActionEvent& Event = OutSnapshot.ActionLog.AddDefaulted_GetRef();
            Event.Sequence = OutSnapshot.ActionLog.Num();
            Event.ActionId = Definition->Id;
            Event.EventType = Definition->EventType;
            Event.Target = Definition->Target;
            Event.PayloadJson = Definition->EventType.Equals(
                TEXT("diagnosis_submitted"),
                ESearchCase::CaseSensitive)
                ? DiagnosisPayloadJson
                : TEXT("{}");
            OutSnapshot.CompletedActions.AddUnique(Definition->Id);
            for (const FString& Effect : Definition->Effects)
            {
                OutSnapshot.Effects.AddUnique(Effect);
            }
        }
        return true;
    }
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(
    FCardioEducationEvaluatorTest,
    "CardioHospital.Education.DeterministicDebrief",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FCardioEducationEvaluatorTest::RunTest(const FString& Parameters)
{
    FCardioClinicalContentDocument Document;
    FString Error;
    if (!LoadClinicalDocument(Document, Error))
    {
        AddError(Error);
        return false;
    }

    const FCardioClinicalCase* ClinicalCase = Document.Cases.FindByPredicate(
        [](const FCardioClinicalCase& Candidate)
        {
            return Candidate.Id == TEXT("case-hcm");
        });
    const FCardioCaseGraphDefinition* Graph = Document.CaseGraphs.FindByPredicate(
        [](const FCardioCaseGraphDefinition& Candidate)
        {
            return Candidate.CaseId == TEXT("case-hcm");
        });
    TestNotNull(TEXT("HCM clinical truth exists"), ClinicalCase);
    TestNotNull(TEXT("HCM deterministic graph exists"), Graph);
    if (!ClinicalCase || !Graph)
    {
        return false;
    }

    const TArray<FString> OptimalActions = {
        TEXT("system.load"),
        TEXT("world.enter"),
        TEXT("navigate.workroom"),
        TEXT("attending.open-assignment"),
        TEXT("assignment.accept"),
        TEXT("navigate.exam-room"),
        TEXT("encounter.introduce"),
        TEXT("history.generic"),
        TEXT("history.exertional-timing"),
        TEXT("history.family-sudden-death"),
        TEXT("history.prodrome"),
        TEXT("history.palpitations"),
        TEXT("history.triggers"),
        TEXT("history.activity-level"),
        TEXT("history.stimulant-use"),
        TEXT("history.finish"),
        TEXT("exam.general"),
        TEXT("exam.vitals"),
        TEXT("exam.auscultation"),
        TEXT("exam.femoral-pulses"),
        TEXT("exam.finish"),
        TEXT("order.ecg"),
        TEXT("review.ecg"),
        TEXT("order.echo"),
        TEXT("review.echo"),
        TEXT("testing.finish"),
        TEXT("navigate.return-workroom"),
        TEXT("reasoning.submit"),
        TEXT("reasoning.finish"),
        TEXT("management.restrict-sports"),
        TEXT("management.ep-referral"),
        TEXT("management.family-screening"),
        TEXT("management.genetics"),
        TEXT("management.finish"),
        TEXT("debrief.review"),
        TEXT("performance.record"),
        TEXT("next-case.begin")
    };

    FCardioCaseRuntimeState OptimalSnapshot;
    if (!BuildSnapshot(
        *Graph,
        OptimalActions,
        TEXT("{\"diagnosis\":\"Hypertrophic Cardiomyopathy\"}"),
        OptimalSnapshot,
        Error))
    {
        AddError(Error);
        return false;
    }

    FCardioCaseDebrief OptimalDebrief;
    TestTrue(
        TEXT("Optimal HCM attempt evaluates"),
        FCardioEducationEvaluator::EvaluateAttempt(
            OptimalSnapshot,
            *Graph,
            *ClinicalCase,
            OptimalDebrief,
            Error));
    TestEqual(TEXT("Optimal overall score"), OptimalDebrief.OverallScore, 100);
    TestTrue(TEXT("Optimal diagnosis is correct"), OptimalDebrief.bDiagnosisCorrect);
    TestEqual(TEXT("All scoring dimensions are present"), OptimalDebrief.Dimensions.Num(), 10);
    TestTrue(
        TEXT("Every optimal dimension scores 100"),
        !OptimalDebrief.Dimensions.ContainsByPredicate(
            [](const FCardioScoreDimension& Dimension)
            {
                return Dimension.Score != 100;
            }));
    TestTrue(TEXT("Optimal attempt has no safety events"), OptimalDebrief.SafetyEvents.IsEmpty());
    TestTrue(TEXT("Optimal attempt has no missed red flags"), OptimalDebrief.MissedOpportunities.IsEmpty());
    TestTrue(TEXT("Optimal attempt has no unnecessary tests"), OptimalDebrief.UnnecessaryTests.IsEmpty());

    const TArray<FString> UnsafeActions = {
        TEXT("system.load"),
        TEXT("world.enter"),
        TEXT("navigate.workroom"),
        TEXT("attending.open-assignment"),
        TEXT("assignment.accept"),
        TEXT("navigate.exam-room"),
        TEXT("encounter.introduce"),
        TEXT("history.generic"),
        TEXT("history.finish"),
        TEXT("exam.finish"),
        TEXT("order.ct-angiography"),
        TEXT("testing.finish"),
        TEXT("navigate.return-workroom"),
        TEXT("reasoning.submit"),
        TEXT("reasoning.finish"),
        TEXT("management.clear-sports"),
        TEXT("management.finish")
    };

    FCardioCaseRuntimeState UnsafeSnapshot;
    if (!BuildSnapshot(
        *Graph,
        UnsafeActions,
        TEXT("{\"diagnosis\":\"Vasovagal syncope\"}"),
        UnsafeSnapshot,
        Error))
    {
        AddError(Error);
        return false;
    }

    FCardioCaseDebrief UnsafeDebrief;
    TestTrue(
        TEXT("Unsafe HCM attempt evaluates"),
        FCardioEducationEvaluator::EvaluateAttempt(
            UnsafeSnapshot,
            *Graph,
            *ClinicalCase,
            UnsafeDebrief,
            Error));
    TestFalse(TEXT("Unsafe diagnosis is incorrect"), UnsafeDebrief.bDiagnosisCorrect);
    TestTrue(TEXT("Unsafe attempt scores below 50"), UnsafeDebrief.OverallScore < 50);
    TestTrue(
        TEXT("Exertional timing omission is reported"),
        UnsafeDebrief.MissedOpportunities.ContainsByPredicate(
            [](const FCardioMissedOpportunity& Missed)
            {
                return Missed.Key == TEXT("exertional_timing");
            }));
    TestTrue(TEXT("CT angiography is reported as unnecessary"), UnsafeDebrief.UnnecessaryTests.Contains(TEXT("CT angiography")));
    TestTrue(
        TEXT("Unsafe clearance triggers a critical safety event"),
        UnsafeDebrief.SafetyEvents.ContainsByPredicate(
            [](const FCardioSafetyEvent& Event)
            {
                return Event.Severity == TEXT("critical");
            }));
    TestTrue(
        TEXT("Unsafe omission triggers the vasovagal counterfactual"),
        UnsafeDebrief.Counterfactuals.ContainsByPredicate(
            [](const FCardioCounterfactualFeedback& Feedback)
            {
                return Feedback.AlternateCaseId == TEXT("case-vasovagal");
            }));

    return true;
}

#endif
