#if WITH_DEV_AUTOMATION_TESTS

#include "CardioClinicalTypes.h"
#include "JsonObjectConverter.h"
#include "Misc/AutomationTest.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(
    FCardioClinicalContentTest,
    "CardioHospital.Clinical.ContentLoads",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FCardioClinicalContentTest::RunTest(const FString& Parameters)
{
    const FString Path = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("Data/clinical-content.json"));
    FString Json;
    TestTrue(TEXT("Clinical JSON exists"), FFileHelper::LoadFileToString(Json, *Path));

    FCardioClinicalContentDocument Document;
    TestTrue(
        TEXT("Clinical JSON matches the Unreal schema"),
        FJsonObjectConverter::JsonObjectStringToUStruct(Json, &Document, 0, 0));
    TestEqual(TEXT("Schema version"), Document.SchemaVersion, 3);
    TestEqual(TEXT("Outpatient case count"), Document.Cases.Num(), 7);
    TestTrue(TEXT("At least one deterministic case graph exists"), Document.CaseGraphs.Num() > 0);
    TestTrue(TEXT("Educational concept map exists"), Document.Concepts.Num() > 0);

    const FCardioClinicalCase* Hcm = Document.Cases.FindByPredicate(
        [](const FCardioClinicalCase& Case) { return Case.Id == TEXT("case-hcm"); });
    TestNotNull(TEXT("HCM vertical-slice case exists"), Hcm);
    if (Hcm)
    {
        TestEqual(TEXT("HCM immutable diagnosis"), Hcm->CorrectDiagnosis, FString(TEXT("Hypertrophic Cardiomyopathy")));
        TestTrue(TEXT("HCM has red flags"), Hcm->RedFlagKeys.Num() >= 3);
    }

    const FCardioCaseGraphDefinition* HcmGraph = Document.CaseGraphs.FindByPredicate(
        [](const FCardioCaseGraphDefinition& Graph) { return Graph.CaseId == TEXT("case-hcm"); });
    TestNotNull(TEXT("HCM case graph exists"), HcmGraph);
    if (HcmGraph)
    {
        TestEqual(TEXT("HCM graph starts at launch"), HcmGraph->StartNodeId, FString(TEXT("launch")));
        TestTrue(TEXT("HCM graph has a complete terminal"), HcmGraph->TerminalNodeIds.Contains(TEXT("complete")));
    }

    const FCardioCaseGraphDefinition* VasovagalGraph = Document.CaseGraphs.FindByPredicate(
        [](const FCardioCaseGraphDefinition& Graph) { return Graph.CaseId == TEXT("case-vasovagal"); });
    TestNotNull(TEXT("Vasovagal contrast graph exists"), VasovagalGraph);

    return true;
}

#endif

