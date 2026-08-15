#include "CardioLearnerProfileSubsystem.h"

#include "CardioClinicalDataSubsystem.h"
#include "CardioHospital.h"
#include "CardioLearnerModel.h"
#include "CardioLearnerProfileSaveGame.h"
#include "Engine/GameInstance.h"
#include "Kismet/GameplayStatics.h"
#include "Subsystems/SubsystemCollection.h"

namespace
{
    constexpr TCHAR LearnerProfileSlotName[] = TEXT("CardioLearnerProfile");
    constexpr int32 LearnerProfileUserIndex = 0;
}

void UCardioLearnerProfileSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
    Collection.InitializeDependency<UCardioClinicalDataSubsystem>();

    FString Error;
    if (!ReloadProfile(Error))
    {
        UE_LOG(LogCardioHospital, Error, TEXT("Learner profile failed to load: %s"), *Error);
    }
}

bool UCardioLearnerProfileSubsystem::FindMastery(
    const FString& ConceptId,
    FCardioConceptMastery& OutMastery) const
{
    OutMastery = FCardioConceptMastery{};
    if (!bProfileReady)
    {
        return false;
    }

    const FCardioConceptMastery* Match = Profile.Mastery.Find(ConceptId);
    if (!Match)
    {
        return false;
    }
    OutMastery = *Match;
    return true;
}

FString UCardioLearnerProfileSubsystem::GetMasteryLabel(const int32 Value) const
{
    return FCardioLearnerModel::MasteryLabel(Value);
}

bool UCardioLearnerProfileSubsystem::RecordAttempt(
    const FCardioCaseDebrief& Debrief,
    const FString& AttemptId,
    const FString& CompletedAt,
    FString& OutError)
{
    OutError.Reset();
    if (!bProfileReady)
    {
        OutError = LastProfileError.IsEmpty()
            ? TEXT("Learner profile is not ready")
            : LastProfileError;
        return false;
    }

    UGameInstance* GameInstance = GetGameInstance();
    UCardioClinicalDataSubsystem* ClinicalData = GameInstance
        ? GameInstance->GetSubsystem<UCardioClinicalDataSubsystem>()
        : nullptr;
    if (!ClinicalData || !ClinicalData->IsClinicalContentLoaded())
    {
        OutError = TEXT("Clinical content is not loaded");
        return false;
    }

    FCardioClinicalCase AuthoredCase;
    FCardioCaseGraphDefinition AuthoredGraph;
    if (!ClinicalData->FindCaseById(Debrief.CaseId, AuthoredCase)
        || !ClinicalData->FindCaseGraphById(Debrief.CaseId, AuthoredGraph))
    {
        OutError = FString::Printf(TEXT("Debrief references unavailable case %s"), *Debrief.CaseId);
        return false;
    }
    if (!Debrief.CaseVersion.Equals(AuthoredGraph.Version, ESearchCase::CaseSensitive))
    {
        OutError = FString::Printf(
            TEXT("Debrief case version %s does not match authored graph version %s"),
            *Debrief.CaseVersion,
            *AuthoredGraph.Version);
        return false;
    }

    FCardioLearnerProfile Candidate;
    if (!FCardioLearnerModel::RecordAttempt(
        Profile,
        Debrief,
        ClinicalData->GetConcepts(),
        AttemptId,
        CompletedAt,
        Candidate,
        OutError))
    {
        return false;
    }
    if (!WriteProfile(Candidate, OutError))
    {
        LastProfileError = OutError;
        return false;
    }

    Profile = MoveTemp(Candidate);
    LastProfileError.Reset();
    return true;
}

bool UCardioLearnerProfileSubsystem::SelectNextCase(
    FCardioNextCaseSelection& OutSelection,
    FString& OutError) const
{
    OutSelection = FCardioNextCaseSelection{};
    OutError.Reset();
    if (!bProfileReady)
    {
        OutError = LastProfileError.IsEmpty()
            ? TEXT("Learner profile is not ready")
            : LastProfileError;
        return false;
    }

    UGameInstance* GameInstance = GetGameInstance();
    UCardioClinicalDataSubsystem* ClinicalData = GameInstance
        ? GameInstance->GetSubsystem<UCardioClinicalDataSubsystem>()
        : nullptr;
    if (!ClinicalData || !ClinicalData->IsClinicalContentLoaded())
    {
        OutError = TEXT("Clinical content is not loaded");
        return false;
    }

    return FCardioLearnerModel::SelectNextCase(
        Profile,
        ClinicalData->GetCases(),
        ClinicalData->GetConcepts(),
        OutSelection,
        OutError);
}

bool UCardioLearnerProfileSubsystem::SaveProfile(FString& OutError)
{
    OutError.Reset();
    if (!bProfileReady)
    {
        OutError = LastProfileError.IsEmpty()
            ? TEXT("Learner profile is not ready")
            : LastProfileError;
        return false;
    }
    if (!WriteProfile(Profile, OutError))
    {
        LastProfileError = OutError;
        return false;
    }

    LastProfileError.Reset();
    return true;
}

bool UCardioLearnerProfileSubsystem::ReloadProfile(FString& OutError)
{
    OutError.Reset();
    bProfileReady = false;
    bLoadedFromDisk = false;
    LastProfileError.Reset();

    if (!UGameplayStatics::DoesSaveGameExist(LearnerProfileSlotName, LearnerProfileUserIndex))
    {
        Profile = FCardioLearnerModel::CreateProfile();
        bProfileReady = true;
        return true;
    }

    USaveGame* LoadedObject = UGameplayStatics::LoadGameFromSlot(
        LearnerProfileSlotName,
        LearnerProfileUserIndex);
    if (!LoadedObject)
    {
        return FailLoad(TEXT("Learner profile save could not be read"), OutError);
    }

    const UCardioLearnerProfileSaveGame* LoadedProfile = Cast<UCardioLearnerProfileSaveGame>(LoadedObject);
    if (!LoadedProfile)
    {
        return FailLoad(TEXT("Learner profile save has an unexpected type"), OutError);
    }

    FString ValidationError;
    if (!FCardioLearnerModel::ValidateProfile(LoadedProfile->Profile, ValidationError))
    {
        return FailLoad(
            FString::Printf(TEXT("Learner profile save is invalid: %s"), *ValidationError),
            OutError);
    }

    Profile = LoadedProfile->Profile;
    bProfileReady = true;
    bLoadedFromDisk = true;
    return true;
}

bool UCardioLearnerProfileSubsystem::ResetProfile(FString& OutError)
{
    OutError.Reset();
    const FCardioLearnerProfile Candidate = FCardioLearnerModel::CreateProfile();
    if (!WriteProfile(Candidate, OutError))
    {
        LastProfileError = OutError;
        return false;
    }

    Profile = Candidate;
    bProfileReady = true;
    bLoadedFromDisk = false;
    LastProfileError.Reset();
    return true;
}

bool UCardioLearnerProfileSubsystem::WriteProfile(
    const FCardioLearnerProfile& Candidate,
    FString& OutError) const
{
    OutError.Reset();
    if (!FCardioLearnerModel::ValidateProfile(Candidate, OutError))
    {
        return false;
    }

    UCardioLearnerProfileSaveGame* SaveObject = Cast<UCardioLearnerProfileSaveGame>(
        UGameplayStatics::CreateSaveGameObject(UCardioLearnerProfileSaveGame::StaticClass()));
    if (!SaveObject)
    {
        OutError = TEXT("Could not create learner profile save object");
        return false;
    }
    SaveObject->Profile = Candidate;

    if (!UGameplayStatics::SaveGameToSlot(
        SaveObject,
        LearnerProfileSlotName,
        LearnerProfileUserIndex))
    {
        OutError = TEXT("Could not write learner profile save");
        return false;
    }
    return true;
}

bool UCardioLearnerProfileSubsystem::FailLoad(
    const FString& Error,
    FString& OutError)
{
    bProfileReady = false;
    bLoadedFromDisk = false;
    LastProfileError = Error;
    OutError = Error;
    return false;
}
