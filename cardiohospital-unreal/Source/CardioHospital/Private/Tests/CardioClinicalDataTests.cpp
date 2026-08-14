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
    TestEqual(TEXT("Schema version"), Document.SchemaVersion, 1);
    TestEqual(TEXT("Outpatient case count"), Document.Cases.Num(), 7);

    const FCardioClinicalCase* Hcm = Document.Cases.FindByPredicate(
        [](const FCardioClinicalCase& Case) { return Case.Id == TEXT("case-hcm"); });
    TestNotNull(TEXT("HCM vertical-slice case exists"), Hcm);
    if (Hcm)
    {
        TestEqual(TEXT("HCM immutable diagnosis"), Hcm->CorrectDiagnosis, FString(TEXT("Hypertrophic Cardiomyopathy")));
        TestTrue(TEXT("HCM has red flags"), Hcm->RedFlagKeys.Num() >= 3);
    }

    return true;
}

#endif

