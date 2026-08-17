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
    TestEqual(TEXT("Outpatient case count"), Document.Cases.Num(), 9);
    TestEqual(TEXT("Playable graph count"), Document.CaseGraphs.Num(), 9);
    TestTrue(TEXT("Educational concept map exists"), Document.Concepts.Num() > 0);
    TestEqual(TEXT("Every case has provenance metadata"), Document.Metadata.Num(), Document.Cases.Num());
    TestTrue(TEXT("Clinical source hashes are retained"), Document.SourceHashes.Num() > 0);

    const FCardioClinicalCase* Hcm = Document.Cases.FindByPredicate(
        [](const FCardioClinicalCase& Case) { return Case.Id == TEXT("case-hcm"); });
    TestNotNull(TEXT("HCM vertical-slice case exists"), Hcm);
    if (Hcm)
    {
        TestEqual(TEXT("HCM immutable diagnosis"), Hcm->CorrectDiagnosis, FString(TEXT("Hypertrophic Cardiomyopathy")));
        TestTrue(TEXT("HCM has red flags"), Hcm->RedFlagKeys.Num() >= 3);
    }

    const FCardioCaseMetadataDefinition* HcmMetadata = Document.Metadata.Find(TEXT("case-hcm"));
    TestNotNull(TEXT("HCM provenance metadata exists"), HcmMetadata);
    if (HcmMetadata)
    {
        TestFalse(TEXT("HCM author is recorded"), HcmMetadata->Author.IsEmpty());
        TestFalse(TEXT("HCM medical-review status is recorded"), HcmMetadata->MedicalReviewer.IsEmpty());
        TestFalse(TEXT("HCM version is recorded"), HcmMetadata->Version.IsEmpty());
        TestFalse(TEXT("HCM review date or status is recorded"), HcmMetadata->LastReviewed.IsEmpty());
        TestTrue(TEXT("HCM guideline sources are retained"), HcmMetadata->Sources.Num() > 0);
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

    for (const FString& RequiredCaseId : {
        FString(TEXT("case-innocent-murmur")),
        FString(TEXT("case-wpw")),
        FString(TEXT("case-myocarditis")) })
    {
        TestTrue(
            *FString::Printf(TEXT("First-release graph exists: %s"), *RequiredCaseId),
            Document.CaseGraphs.ContainsByPredicate(
                [&RequiredCaseId](const FCardioCaseGraphDefinition& Graph)
                {
                    return Graph.CaseId == RequiredCaseId;
                }));
    }

    return true;
}

#endif

