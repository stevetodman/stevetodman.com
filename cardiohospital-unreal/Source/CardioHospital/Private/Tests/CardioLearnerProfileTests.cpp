#if WITH_DEV_AUTOMATION_TESTS

#include "CardioClinicalTypes.h"
#include "CardioLearnerModel.h"
#include "CardioLearnerProfileSaveGame.h"
#include "JsonObjectConverter.h"
#include "Kismet/GameplayStatics.h"
#include "Misc/AutomationTest.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "UObject/UnrealType.h"

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

    void AddDimension(FCardioCaseDebrief& Debrief, const TCHAR* Id, const int32 Score)
    {
        FCardioScoreDimension& Dimension = Debrief.Dimensions.AddDefaulted_GetRef();
        Dimension.Id = Id;
        Dimension.Score = Score;
    }

    FCardioCaseDebrief MakeFixtureDebrief()
    {
        FCardioCaseDebrief Debrief;
        Debrief.CaseId = TEXT("case-hcm");
        Debrief.CaseVersion = TEXT("1.0");
        Debrief.OverallScore = 35;
        AddDimension(Debrief, TEXT("history"), 25);
        AddDimension(Debrief, TEXT("physicalExamination"), 0);
        AddDimension(Debrief, TEXT("redFlagRecognition"), 0);
        AddDimension(Debrief, TEXT("differentialDiagnosis"), 0);
        AddDimension(Debrief, TEXT("testSelection"), 0);
        AddDimension(Debrief, TEXT("interpretation"), 0);
        AddDimension(Debrief, TEXT("clinicalReasoning"), 0);
        AddDimension(Debrief, TEXT("management"), 0);
        AddDimension(Debrief, TEXT("communication"), 75);
        AddDimension(Debrief, TEXT("efficiency"), 75);
        AddDimension(Debrief, TEXT("safety"), 0);

        FCardioMissedOpportunity& Missed = Debrief.MissedOpportunities.AddDefaulted_GetRef();
        Missed.Key = TEXT("exertional_timing");
        FCardioSafetyEvent& Safety = Debrief.SafetyEvents.AddDefaulted_GetRef();
        Safety.Id = TEXT("hcm-exercise-restriction");
        return Debrief;
    }

    FCardioCaseDebrief MakeUniformDebrief(
        const FString& CaseId,
        const FString& CaseVersion,
        const int32 Score)
    {
        FCardioCaseDebrief Debrief;
        Debrief.CaseId = CaseId;
        Debrief.CaseVersion = CaseVersion;
        Debrief.OverallScore = Score;
        AddDimension(Debrief, TEXT("history"), Score);
        AddDimension(Debrief, TEXT("physicalExamination"), Score);
        AddDimension(Debrief, TEXT("redFlagRecognition"), Score);
        AddDimension(Debrief, TEXT("differentialDiagnosis"), Score);
        AddDimension(Debrief, TEXT("testSelection"), Score);
        AddDimension(Debrief, TEXT("interpretation"), Score);
        AddDimension(Debrief, TEXT("clinicalReasoning"), Score);
        AddDimension(Debrief, TEXT("management"), Score);
        AddDimension(Debrief, TEXT("communication"), Score);
        AddDimension(Debrief, TEXT("efficiency"), Score);
        AddDimension(Debrief, TEXT("safety"), Score);
        return Debrief;
    }
}

IMPLEMENT_SIMPLE_AUTOMATION_TEST(
    FCardioLearnerProfileTest,
    "CardioHospital.Education.IdentityFreeLearnerProfile",
    EAutomationTestFlags::EditorContext | EAutomationTestFlags::EngineFilter)

bool FCardioLearnerProfileTest::RunTest(const FString& Parameters)
{
    FCardioClinicalContentDocument Document;
    FString Error;
    if (!LoadClinicalDocument(Document, Error))
    {
        AddError(Error);
        return false;
    }
    TestEqual(TEXT("All nine outpatient cases are available"), Document.Cases.Num(), 9);
    TestEqual(TEXT("All nine outpatient graphs are available"), Document.CaseGraphs.Num(), 9);

    TSet<FString> ProfilePropertyNames;
    for (TFieldIterator<FProperty> Property(FCardioLearnerProfile::StaticStruct()); Property; ++Property)
    {
        ProfilePropertyNames.Add(Property->GetName());
    }
    TestEqual(TEXT("Profile has only four top-level fields"), ProfilePropertyNames.Num(), 4);
    TestTrue(TEXT("Profile stores schemaVersion"), ProfilePropertyNames.Contains(TEXT("SchemaVersion")));
    TestTrue(TEXT("Profile stores attempts"), ProfilePropertyNames.Contains(TEXT("Attempts")));
    TestTrue(TEXT("Profile stores completed case ids"), ProfilePropertyNames.Contains(TEXT("CompletedCaseIds")));
    TestTrue(TEXT("Profile stores mastery"), ProfilePropertyNames.Contains(TEXT("Mastery")));

    TSet<FString> AttemptPropertyNames;
    for (TFieldIterator<FProperty> Property(FCardioStoredAttempt::StaticStruct()); Property; ++Property)
    {
        AttemptPropertyNames.Add(Property->GetName());
    }
    TestEqual(TEXT("Stored attempt has only nine fields"), AttemptPropertyNames.Num(), 9);
    for (const FString& RequiredField : {
        FString(TEXT("AttemptId")),
        FString(TEXT("CaseId")),
        FString(TEXT("CaseVersion")),
        FString(TEXT("CompletedAt")),
        FString(TEXT("bDiagnosisCorrect")),
        FString(TEXT("OverallScore")),
        FString(TEXT("Dimensions")),
        FString(TEXT("MissedOpportunityKeys")),
        FString(TEXT("SafetyEventIds")) })
    {
        TestTrue(
            *FString::Printf(TEXT("Stored attempt field is permitted: %s"), *RequiredField),
            AttemptPropertyNames.Contains(RequiredField));
    }

    const FCardioLearnerProfile EmptyProfile = FCardioLearnerModel::CreateProfile();
    TestEqual(
        TEXT("Learner profile schema is current"),
        EmptyProfile.SchemaVersion,
        FCardioLearnerModel::GetSupportedSchemaVersion());
    TestTrue(TEXT("New profile validates"), FCardioLearnerModel::ValidateProfile(EmptyProfile, Error));
    TestEqual(TEXT("Zero mastery is unassessed"), FCardioLearnerModel::MasteryLabel(0), FString(TEXT("unassessed")));
    TestEqual(TEXT("Sub-70 mastery is developing"), FCardioLearnerModel::MasteryLabel(69), FString(TEXT("developing")));
    TestEqual(TEXT("70 mastery is competent"), FCardioLearnerModel::MasteryLabel(70), FString(TEXT("competent")));
    TestEqual(TEXT("88 mastery is mastered"), FCardioLearnerModel::MasteryLabel(88), FString(TEXT("mastered")));

    const FCardioCaseDebrief FixtureDebrief = MakeFixtureDebrief();
    FCardioLearnerProfile RecordedProfile;
    const bool bRecorded = FCardioLearnerModel::RecordAttempt(
        EmptyProfile,
        FixtureDebrief,
        Document.Concepts,
        TEXT("attempt-001"),
        TEXT("2026-08-14T15:00:00Z"),
        RecordedProfile,
        Error);
    TestTrue(
        TEXT("Attempt records into a copied profile"),
        bRecorded);
    if (!bRecorded)
    {
        AddError(Error);
        return false;
    }
    TestTrue(TEXT("Input profile remains immutable"), EmptyProfile.Attempts.IsEmpty());
    TestEqual(TEXT("One attempt is stored"), RecordedProfile.Attempts.Num(), 1);
    if (RecordedProfile.Attempts.Num() != 1)
    {
        return false;
    }
    TestEqual(TEXT("Content version is retained"), RecordedProfile.Attempts[0].CaseVersion, FString(TEXT("1.0")));
    TestEqual(
        TEXT("One missed-opportunity key is stored"),
        RecordedProfile.Attempts[0].MissedOpportunityKeys.Num(),
        1);
    TestEqual(
        TEXT("One safety-event id is stored"),
        RecordedProfile.Attempts[0].SafetyEventIds.Num(),
        1);
    if (RecordedProfile.Attempts[0].MissedOpportunityKeys.Num() != 1
        || RecordedProfile.Attempts[0].SafetyEventIds.Num() != 1)
    {
        return false;
    }
    TestEqual(
        TEXT("Missed opportunity stores only its authored key"),
        RecordedProfile.Attempts[0].MissedOpportunityKeys[0],
        FString(TEXT("exertional_timing")));
    TestEqual(
        TEXT("Safety event stores only its authored id"),
        RecordedProfile.Attempts[0].SafetyEventIds[0],
        FString(TEXT("hcm-exercise-restriction")));

    const FCardioConceptMastery* RedFlagMastery = RecordedProfile.Mastery.Find(
        TEXT("exertional-syncope-red-flags"));
    TestNotNull(TEXT("Relevant mastery is aggregated"), RedFlagMastery);
    if (RedFlagMastery)
    {
        TestEqual(TEXT("Mastery matches portable model"), RedFlagMastery->Value, 6);
        TestEqual(TEXT("Mastery counts attempts"), RedFlagMastery->AttemptCount, 1);
        TestEqual(
            TEXT("Mastery retains last opaque attempt id"),
            RedFlagMastery->LastAttemptId,
            FString(TEXT("attempt-001")));
        TestEqual(
            TEXT("Mastery label matches portable model"),
            FCardioLearnerModel::MasteryLabel(RedFlagMastery->Value),
            FString(TEXT("developing")));
    }

    FCardioLearnerProfile DuplicateOutput;
    TestFalse(
        TEXT("Duplicate attempt ids are rejected"),
        FCardioLearnerModel::RecordAttempt(
            RecordedProfile,
            FixtureDebrief,
            Document.Concepts,
            TEXT("attempt-001"),
            TEXT("later"),
            DuplicateOutput,
            Error));
    TestTrue(TEXT("Duplicate error is explicit"), Error.Contains(TEXT("Duplicate attemptId")));
    TestEqual(TEXT("Rejected duplicate does not mutate source"), RecordedProfile.Attempts.Num(), 1);

    const FCardioCaseDebrief FullScoreDebrief = MakeUniformDebrief(TEXT("case-hcm"), TEXT("1.0"), 100);
    FCardioLearnerProfile AggregatedProfile;
    TestTrue(
        TEXT("A second attempt updates weighted mastery"),
        FCardioLearnerModel::RecordAttempt(
            RecordedProfile,
            FullScoreDebrief,
            Document.Concepts,
            TEXT("attempt-002"),
            TEXT("2026-08-14T16:00:00Z"),
            AggregatedProfile,
            Error));
    const FCardioConceptMastery* AggregatedMastery = AggregatedProfile.Mastery.Find(
        TEXT("exertional-syncope-red-flags"));
    TestNotNull(TEXT("Aggregated mastery remains available"), AggregatedMastery);
    if (AggregatedMastery)
    {
        TestEqual(TEXT("Weighted mastery matches portable formula"), AggregatedMastery->Value, 53);
        TestEqual(TEXT("Weighted mastery attempt count"), AggregatedMastery->AttemptCount, 2);
        TestEqual(
            TEXT("Weighted mastery retains newest opaque attempt id"),
            AggregatedMastery->LastAttemptId,
            FString(TEXT("attempt-002")));
    }

    FCardioLearnerProfile DeterministicCopy;
    const bool bRecordedDeterministically = FCardioLearnerModel::RecordAttempt(
        EmptyProfile,
        FixtureDebrief,
        Document.Concepts,
        TEXT("attempt-001"),
        TEXT("2026-08-14T15:00:00Z"),
        DeterministicCopy,
        Error);
    TestTrue(
        TEXT("Same immutable input records again deterministically"),
        bRecordedDeterministically);
    if (!bRecordedDeterministically)
    {
        AddError(Error);
        return false;
    }
    TestEqual(
        TEXT("Deterministic attempt score"),
        DeterministicCopy.Attempts[0].OverallScore,
        RecordedProfile.Attempts[0].OverallScore);
    TestEqual(
        TEXT("Deterministic mastery score"),
        DeterministicCopy.Mastery.FindRef(TEXT("exertional-syncope-red-flags")).Value,
        RecordedProfile.Mastery.FindRef(TEXT("exertional-syncope-red-flags")).Value);

    UCardioLearnerProfileSaveGame* SaveObject = NewObject<UCardioLearnerProfileSaveGame>();
    SaveObject->Profile = RecordedProfile;
    TArray<uint8> SaveBytes;
    const bool bSerialized = UGameplayStatics::SaveGameToMemory(SaveObject, SaveBytes);
    TestTrue(
        TEXT("Identity-free profile serializes through USaveGame"),
        bSerialized);
    if (!bSerialized)
    {
        return false;
    }
    USaveGame* LoadedBase = UGameplayStatics::LoadGameFromMemory(SaveBytes);
    UCardioLearnerProfileSaveGame* LoadedSave = Cast<UCardioLearnerProfileSaveGame>(LoadedBase);
    TestNotNull(TEXT("SaveGame bytes restore the expected class"), LoadedSave);
    if (LoadedSave)
    {
        TestTrue(
            TEXT("Restored profile validates"),
            FCardioLearnerModel::ValidateProfile(LoadedSave->Profile, Error));
        TestEqual(TEXT("Restored attempt count"), LoadedSave->Profile.Attempts.Num(), 1);
        if (LoadedSave->Profile.Attempts.Num() != 1)
        {
            return false;
        }
        TestEqual(
            TEXT("Restored case version"),
            LoadedSave->Profile.Attempts[0].CaseVersion,
            FString(TEXT("1.0")));
    }

    FCardioLearnerProfile WrongVersion = RecordedProfile;
    WrongVersion.SchemaVersion += 1;
    TestFalse(
        TEXT("Version mismatch is rejected safely"),
        FCardioLearnerModel::ValidateProfile(WrongVersion, Error));
    TestTrue(TEXT("Version mismatch is explained"), Error.Contains(TEXT("Unsupported learner profile schema")));

    FCardioLearnerProfile CorruptProfile = RecordedProfile;
    CorruptProfile.Attempts[0].CaseVersion.Reset();
    TestFalse(
        TEXT("Corrupt attempt is rejected safely"),
        FCardioLearnerModel::ValidateProfile(CorruptProfile, Error));
    TestTrue(TEXT("Corrupt attempt is explained"), Error.Contains(TEXT("case version")));

    FCardioLearnerProfile RotationProfile = FCardioLearnerModel::CreateProfile();
    TSet<FString> SelectedCaseIds;
    for (int32 Index = 0; Index < Document.Cases.Num(); ++Index)
    {
        FCardioNextCaseSelection Selection;
        const bool bSelected = FCardioLearnerModel::SelectNextCase(
            RotationProfile,
            Document.Cases,
            Document.Concepts,
            Selection,
            Error);
        TestTrue(
            *FString::Printf(TEXT("Adaptive selection succeeds at step %d"), Index + 1),
            bSelected);
        if (!bSelected)
        {
            AddError(Error);
            return false;
        }
        if (Index == 0)
        {
            TestEqual(TEXT("First case is HCM"), Selection.CaseId, FString(TEXT("case-hcm")));
            TestEqual(TEXT("First selection kind"), Selection.Kind, FString(TEXT("first")));
        }
        if (Index == 1)
        {
            TestEqual(TEXT("Second case is deterministic contrast"), Selection.CaseId, FString(TEXT("case-vasovagal")));
            TestEqual(TEXT("Second selection kind"), Selection.Kind, FString(TEXT("contrast")));
        }
        TestFalse(TEXT("Adaptive rotation does not repeat completed cases"), SelectedCaseIds.Contains(Selection.CaseId));
        SelectedCaseIds.Add(Selection.CaseId);

        const FCardioCaseGraphDefinition* Graph = Document.CaseGraphs.FindByPredicate(
            [&Selection](const FCardioCaseGraphDefinition& Candidate)
            {
                return Candidate.CaseId == Selection.CaseId;
            });
        TestNotNull(TEXT("Selected case retains an authored graph version"), Graph);
        if (!Graph)
        {
            return false;
        }

        const FCardioCaseDebrief Debrief = MakeUniformDebrief(
            Selection.CaseId,
            Graph->Version,
            50);
        FCardioLearnerProfile NextProfile;
        const bool bRotationAttemptRecorded = FCardioLearnerModel::RecordAttempt(
            RotationProfile,
            Debrief,
            Document.Concepts,
            FString::Printf(TEXT("rotation-attempt-%02d"), Index + 1),
            FString::Printf(TEXT("2026-08-14T15:%02d:00Z"), Index),
            NextProfile,
            Error);
        TestTrue(
            TEXT("Selected case attempt records"),
            bRotationAttemptRecorded);
        if (!bRotationAttemptRecorded)
        {
            AddError(Error);
            return false;
        }
        RotationProfile = MoveTemp(NextProfile);
    }
    TestEqual(TEXT("Adaptive rotation covers all nine cases"), SelectedCaseIds.Num(), 9);
    for (const FCardioClinicalCase& ClinicalCase : Document.Cases)
    {
        TestTrue(
            *FString::Printf(TEXT("Adaptive rotation includes %s"), *ClinicalCase.Id),
            SelectedCaseIds.Contains(ClinicalCase.Id));
    }

    FCardioNextCaseSelection SpacedSelection;
    TestTrue(
        TEXT("Completed rotation selects spaced repetition"),
        FCardioLearnerModel::SelectNextCase(
            RotationProfile,
            Document.Cases,
            Document.Concepts,
            SpacedSelection,
            Error));
    TestEqual(
        TEXT("Completed rotation selection kind"),
        SpacedSelection.Kind,
        FString(TEXT("spaced-repetition")));
    TestTrue(
        TEXT("Spaced repetition selects an authored case"),
        SelectedCaseIds.Contains(SpacedSelection.CaseId));

    return true;
}

#endif
