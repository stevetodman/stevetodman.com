#include "CardioClinicalDataSubsystem.h"

#include "CardioHospital.h"
#include "JsonObjectConverter.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"

namespace
{
    constexpr int32 SupportedClinicalSchemaVersion = 3;
}

void UCardioClinicalDataSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);

    FString Error;
    if (!ReloadClinicalContent(Error))
    {
        UE_LOG(LogCardioHospital, Error, TEXT("Clinical content failed to load: %s"), *Error);
    }
}

bool UCardioClinicalDataSubsystem::ReloadClinicalContent(FString& OutError)
{
    bLoaded = false;
    Content = FCardioClinicalContentDocument{};

    const FString Path = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("Data/clinical-content.json"));
    FString Json;
    if (!FFileHelper::LoadFileToString(Json, *Path))
    {
        OutError = FString::Printf(TEXT("Could not read %s"), *Path);
        return false;
    }

    if (!FJsonObjectConverter::JsonObjectStringToUStruct(Json, &Content, 0, 0))
    {
        OutError = TEXT("JSON did not match FCardioClinicalContentDocument");
        return false;
    }

    if (Content.SchemaVersion != SupportedClinicalSchemaVersion)
    {
        OutError = FString::Printf(
            TEXT("Unsupported clinical schema version %d; expected %d"),
            Content.SchemaVersion,
            SupportedClinicalSchemaVersion);
        return false;
    }

    if (Content.Cases.IsEmpty())
    {
        OutError = TEXT("Clinical content contains no outpatient cases");
        return false;
    }

    if (Content.CaseGraphs.IsEmpty())
    {
        OutError = TEXT("Clinical content contains no deterministic case graphs");
        return false;
    }

    TSet<FString> SeenIds;
    for (const FCardioClinicalCase& Case : Content.Cases)
    {
        if (Case.Id.IsEmpty() || Case.CorrectDiagnosis.IsEmpty())
        {
            OutError = TEXT("Every case requires an id and correct diagnosis");
            return false;
        }
        if (SeenIds.Contains(Case.Id))
        {
            OutError = FString::Printf(TEXT("Duplicate case id: %s"), *Case.Id);
            return false;
        }
        SeenIds.Add(Case.Id);
    }

    bLoaded = true;
    UE_LOG(LogCardioHospital, Display, TEXT("Loaded %d clinical cases"), Content.Cases.Num());
    return true;
}

bool UCardioClinicalDataSubsystem::FindCaseById(const FString& CaseId, FCardioClinicalCase& OutCase) const
{
    const FCardioClinicalCase* Match = Content.Cases.FindByPredicate(
        [&CaseId](const FCardioClinicalCase& Candidate)
        {
            return Candidate.Id.Equals(CaseId, ESearchCase::CaseSensitive);
        });

    if (!Match)
    {
        return false;
    }

    OutCase = *Match;
    return true;
}

bool UCardioClinicalDataSubsystem::FindCaseGraphById(const FString& CaseId, FCardioCaseGraphDefinition& OutGraph) const
{
    const FCardioCaseGraphDefinition* Match = Content.CaseGraphs.FindByPredicate(
        [&CaseId](const FCardioCaseGraphDefinition& Candidate)
        {
            return Candidate.CaseId.Equals(CaseId, ESearchCase::CaseSensitive);
        });

    if (!Match)
    {
        return false;
    }

    OutGraph = *Match;
    return true;
}

