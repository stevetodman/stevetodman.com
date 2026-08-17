#include "CardioLearnerModel.h"

namespace
{
    constexpr int32 SupportedLearnerProfileSchemaVersion = 1;

    bool IsBlank(const FString& Value)
    {
        FString Trimmed = Value;
        Trimmed.TrimStartAndEndInline();
        return Trimmed.IsEmpty();
    }

    bool IsScore(const int32 Value)
    {
        return Value >= 0 && Value <= 100;
    }

    int32 AverageDimensionScores(
        const TArray<FString>& DimensionIds,
        const TMap<FString, int32>& DimensionScores)
    {
        if (DimensionIds.IsEmpty())
        {
            return 0;
        }

        int64 Total = 0;
        for (const FString& DimensionId : DimensionIds)
        {
            Total += DimensionScores.FindRef(DimensionId);
        }
        return FMath::RoundToInt32(static_cast<double>(Total) / DimensionIds.Num());
    }

    bool ConceptIdPrecedes(
        const FCardioCaseConceptDefinition& Candidate,
        const FCardioCaseConceptDefinition& Current)
    {
        return Candidate.Id.Compare(Current.Id, ESearchCase::CaseSensitive) < 0;
    }
}

int32 FCardioLearnerModel::GetSupportedSchemaVersion()
{
    return SupportedLearnerProfileSchemaVersion;
}

FCardioLearnerProfile FCardioLearnerModel::CreateProfile()
{
    FCardioLearnerProfile Profile;
    Profile.SchemaVersion = SupportedLearnerProfileSchemaVersion;
    return Profile;
}

bool FCardioLearnerModel::ValidateProfile(
    const FCardioLearnerProfile& Profile,
    FString& OutError)
{
    OutError.Reset();
    if (Profile.SchemaVersion != SupportedLearnerProfileSchemaVersion)
    {
        OutError = FString::Printf(
            TEXT("Unsupported learner profile schema %d; expected %d"),
            Profile.SchemaVersion,
            SupportedLearnerProfileSchemaVersion);
        return false;
    }

    TSet<FString> AttemptIds;
    TSet<FString> AttemptCaseIds;
    for (const FCardioStoredAttempt& Attempt : Profile.Attempts)
    {
        if (IsBlank(Attempt.AttemptId)
            || IsBlank(Attempt.CaseId)
            || IsBlank(Attempt.CaseVersion)
            || IsBlank(Attempt.CompletedAt))
        {
            OutError = TEXT("Every learner attempt requires an opaque id, case id, case version, and completion time");
            return false;
        }
        if (AttemptIds.Contains(Attempt.AttemptId))
        {
            OutError = FString::Printf(TEXT("Duplicate attemptId %s"), *Attempt.AttemptId);
            return false;
        }
        if (!IsScore(Attempt.OverallScore))
        {
            OutError = FString::Printf(TEXT("Attempt %s has an invalid overall score"), *Attempt.AttemptId);
            return false;
        }
        if (Attempt.Dimensions.IsEmpty())
        {
            OutError = FString::Printf(TEXT("Attempt %s has no dimension scores"), *Attempt.AttemptId);
            return false;
        }

        TSet<FString> DimensionIds;
        for (const FCardioScoreDimension& Dimension : Attempt.Dimensions)
        {
            if (IsBlank(Dimension.Id) || !IsScore(Dimension.Score))
            {
                OutError = FString::Printf(TEXT("Attempt %s has an invalid dimension score"), *Attempt.AttemptId);
                return false;
            }
            if (DimensionIds.Contains(Dimension.Id))
            {
                OutError = FString::Printf(
                    TEXT("Attempt %s repeats dimension %s"),
                    *Attempt.AttemptId,
                    *Dimension.Id);
                return false;
            }
            DimensionIds.Add(Dimension.Id);
        }

        for (const FString& Key : Attempt.MissedOpportunityKeys)
        {
            if (IsBlank(Key))
            {
                OutError = FString::Printf(TEXT("Attempt %s has an empty missed-opportunity key"), *Attempt.AttemptId);
                return false;
            }
        }
        for (const FString& EventId : Attempt.SafetyEventIds)
        {
            if (IsBlank(EventId))
            {
                OutError = FString::Printf(TEXT("Attempt %s has an empty safety-event id"), *Attempt.AttemptId);
                return false;
            }
        }

        AttemptIds.Add(Attempt.AttemptId);
        AttemptCaseIds.Add(Attempt.CaseId);
    }

    TSet<FString> CompletedCaseIds;
    for (const FString& CaseId : Profile.CompletedCaseIds)
    {
        if (IsBlank(CaseId) || CompletedCaseIds.Contains(CaseId))
        {
            OutError = TEXT("Completed case ids must be unique and non-empty");
            return false;
        }
        if (!AttemptCaseIds.Contains(CaseId))
        {
            OutError = FString::Printf(TEXT("Completed case %s has no stored attempt"), *CaseId);
            return false;
        }
        CompletedCaseIds.Add(CaseId);
    }
    for (const FString& AttemptCaseId : AttemptCaseIds)
    {
        if (!CompletedCaseIds.Contains(AttemptCaseId))
        {
            OutError = FString::Printf(TEXT("Stored attempt case %s is not marked complete"), *AttemptCaseId);
            return false;
        }
    }

    for (const TPair<FString, FCardioConceptMastery>& Entry : Profile.Mastery)
    {
        const FCardioConceptMastery& Mastery = Entry.Value;
        if (IsBlank(Entry.Key)
            || !IsScore(Mastery.Value)
            || Mastery.AttemptCount <= 0
            || Mastery.AttemptCount > Profile.Attempts.Num()
            || IsBlank(Mastery.LastAttemptId)
            || !AttemptIds.Contains(Mastery.LastAttemptId))
        {
            OutError = FString::Printf(TEXT("Concept mastery %s is invalid"), *Entry.Key);
            return false;
        }
    }

    return true;
}

bool FCardioLearnerModel::RecordAttempt(
    const FCardioLearnerProfile& Profile,
    const FCardioCaseDebrief& Debrief,
    const TArray<FCardioCaseConceptDefinition>& Concepts,
    const FString& AttemptId,
    const FString& CompletedAt,
    FCardioLearnerProfile& OutProfile,
    FString& OutError)
{
    OutProfile = FCardioLearnerProfile{};
    OutError.Reset();
    if (!ValidateProfile(Profile, OutError))
    {
        return false;
    }
    if (IsBlank(AttemptId))
    {
        OutError = TEXT("attemptId is required");
        return false;
    }
    if (IsBlank(CompletedAt))
    {
        OutError = TEXT("completedAt is required");
        return false;
    }
    if (Profile.Attempts.ContainsByPredicate(
        [&AttemptId](const FCardioStoredAttempt& Attempt)
        {
            return Attempt.AttemptId.Equals(AttemptId, ESearchCase::CaseSensitive);
        }))
    {
        OutError = FString::Printf(TEXT("Duplicate attemptId %s"), *AttemptId);
        return false;
    }
    if (IsBlank(Debrief.CaseId) || IsBlank(Debrief.CaseVersion))
    {
        OutError = TEXT("Debrief requires a case id and case version");
        return false;
    }
    if (!IsScore(Debrief.OverallScore) || Debrief.Dimensions.IsEmpty())
    {
        OutError = TEXT("Debrief requires valid overall and dimension scores");
        return false;
    }

    TMap<FString, int32> DimensionScores;
    for (const FCardioScoreDimension& Dimension : Debrief.Dimensions)
    {
        if (IsBlank(Dimension.Id) || !IsScore(Dimension.Score))
        {
            OutError = TEXT("Debrief contains an invalid dimension score");
            return false;
        }
        DimensionScores.Add(Dimension.Id, Dimension.Score);
    }

    FCardioStoredAttempt StoredAttempt;
    StoredAttempt.AttemptId = AttemptId;
    StoredAttempt.CaseId = Debrief.CaseId;
    StoredAttempt.CaseVersion = Debrief.CaseVersion;
    StoredAttempt.CompletedAt = CompletedAt;
    StoredAttempt.bDiagnosisCorrect = Debrief.bDiagnosisCorrect;
    StoredAttempt.OverallScore = Debrief.OverallScore;
    StoredAttempt.Dimensions = Debrief.Dimensions;
    for (const FCardioMissedOpportunity& Missed : Debrief.MissedOpportunities)
    {
        if (IsBlank(Missed.Key))
        {
            OutError = TEXT("Debrief contains an empty missed-opportunity key");
            return false;
        }
        StoredAttempt.MissedOpportunityKeys.Add(Missed.Key);
    }
    for (const FCardioSafetyEvent& Event : Debrief.SafetyEvents)
    {
        if (IsBlank(Event.Id))
        {
            OutError = TEXT("Debrief contains an empty safety-event id");
            return false;
        }
        StoredAttempt.SafetyEventIds.Add(Event.Id);
    }

    OutProfile = Profile;
    OutProfile.Attempts.Add(MoveTemp(StoredAttempt));
    OutProfile.CompletedCaseIds.AddUnique(Debrief.CaseId);

    for (const FCardioCaseConceptDefinition& Concept : Concepts)
    {
        if (!Concept.CaseIds.Contains(Debrief.CaseId))
        {
            continue;
        }
        if (IsBlank(Concept.Id))
        {
            OutError = TEXT("Clinical concept id cannot be empty");
            OutProfile = FCardioLearnerProfile{};
            return false;
        }

        const int32 AttemptScore = AverageDimensionScores(Concept.DimensionIds, DimensionScores);
        const FCardioConceptMastery Previous = OutProfile.Mastery.FindRef(Concept.Id);
        if (Previous.AttemptCount >= MAX_int32)
        {
            OutError = FString::Printf(TEXT("Concept %s attempt count overflow"), *Concept.Id);
            OutProfile = FCardioLearnerProfile{};
            return false;
        }

        FCardioConceptMastery Updated;
        Updated.AttemptCount = Previous.AttemptCount + 1;
        Updated.Value = FMath::RoundToInt32(
            (static_cast<double>(Previous.Value) * Previous.AttemptCount + AttemptScore)
            / Updated.AttemptCount);
        Updated.LastAttemptId = AttemptId;
        OutProfile.Mastery.Add(Concept.Id, MoveTemp(Updated));
    }

    if (!ValidateProfile(OutProfile, OutError))
    {
        OutProfile = FCardioLearnerProfile{};
        return false;
    }
    return true;
}

FString FCardioLearnerModel::MasteryLabel(const int32 Value)
{
    if (Value <= 0)
    {
        return TEXT("unassessed");
    }
    if (Value < 70)
    {
        return TEXT("developing");
    }
    if (Value < 88)
    {
        return TEXT("competent");
    }
    return TEXT("mastered");
}

bool FCardioLearnerModel::SelectNextCase(
    const FCardioLearnerProfile& Profile,
    const TArray<FCardioClinicalCase>& Cases,
    const TArray<FCardioCaseConceptDefinition>& Concepts,
    FCardioNextCaseSelection& OutSelection,
    FString& OutError)
{
    OutSelection = FCardioNextCaseSelection{};
    OutError.Reset();
    if (!ValidateProfile(Profile, OutError))
    {
        return false;
    }
    if (Cases.IsEmpty())
    {
        OutError = TEXT("Clinical content contains no cases");
        return false;
    }

    TSet<FString> AvailableCaseIds;
    for (const FCardioClinicalCase& ClinicalCase : Cases)
    {
        if (IsBlank(ClinicalCase.Id) || AvailableCaseIds.Contains(ClinicalCase.Id))
        {
            OutError = TEXT("Clinical cases must have unique non-empty ids");
            return false;
        }
        AvailableCaseIds.Add(ClinicalCase.Id);
    }

    if (Profile.Attempts.IsEmpty())
    {
        if (!AvailableCaseIds.Contains(TEXT("case-hcm")))
        {
            OutError = TEXT("The initial HCM vertical-slice case is unavailable");
            return false;
        }
        OutSelection.CaseId = TEXT("case-hcm");
        OutSelection.Kind = TEXT("first");
        OutSelection.Reason = TEXT("The vertical-slice case exercises the complete clinical loop.");
        return true;
    }

    const FCardioStoredAttempt& LastAttempt = Profile.Attempts.Last();
    if (LastAttempt.CaseId.Equals(TEXT("case-hcm"), ESearchCase::CaseSensitive)
        && !Profile.CompletedCaseIds.Contains(TEXT("case-vasovagal")))
    {
        if (!AvailableCaseIds.Contains(TEXT("case-vasovagal")))
        {
            OutError = TEXT("The authored HCM contrast case is unavailable");
            return false;
        }
        OutSelection.CaseId = TEXT("case-vasovagal");
        OutSelection.Kind = TEXT("contrast");
        OutSelection.Reason = TEXT("Contrast mid-exertional HCM syncope with post-exertional vasovagal syncope.");
        return true;
    }

    struct FAdaptiveCandidate
    {
        const FCardioClinicalCase* ClinicalCase = nullptr;
        const FCardioCaseConceptDefinition* WeakestConcept = nullptr;
        int32 WeakestMastery = 0;
    };

    FAdaptiveCandidate BestCandidate;
    bool bHasBestCandidate = false;
    for (const FCardioClinicalCase& ClinicalCase : Cases)
    {
        if (Profile.CompletedCaseIds.Contains(ClinicalCase.Id))
        {
            continue;
        }

        FAdaptiveCandidate Candidate;
        Candidate.ClinicalCase = &ClinicalCase;
        for (const FCardioCaseConceptDefinition& Concept : Concepts)
        {
            if (!Concept.CaseIds.Contains(ClinicalCase.Id))
            {
                continue;
            }
            const FCardioConceptMastery* Mastery = Profile.Mastery.Find(Concept.Id);
            if (!Mastery)
            {
                continue;
            }
            if (!Candidate.WeakestConcept
                || Mastery->Value < Candidate.WeakestMastery
                || (Mastery->Value == Candidate.WeakestMastery
                    && ConceptIdPrecedes(Concept, *Candidate.WeakestConcept)))
            {
                Candidate.WeakestConcept = &Concept;
                Candidate.WeakestMastery = Mastery->Value;
            }
        }

        const bool bCandidateIsBetter = !bHasBestCandidate
            || (Candidate.WeakestConcept && !BestCandidate.WeakestConcept)
            || (Candidate.WeakestConcept
                && BestCandidate.WeakestConcept
                && Candidate.WeakestMastery < BestCandidate.WeakestMastery);
        if (bCandidateIsBetter)
        {
            BestCandidate = Candidate;
            bHasBestCandidate = true;
        }
    }

    if (bHasBestCandidate)
    {
        OutSelection.CaseId = BestCandidate.ClinicalCase->Id;
        if (BestCandidate.WeakestConcept)
        {
            OutSelection.Kind = TEXT("weakness");
            OutSelection.Reason = FString::Printf(
                TEXT("Reinforce %s (%s)."),
                *BestCandidate.WeakestConcept->Label,
                *MasteryLabel(BestCandidate.WeakestMastery));
        }
        else
        {
            OutSelection.Kind = TEXT("rotation");
            OutSelection.Reason = TEXT("Continue the uncompleted clinic rotation.");
        }
        return true;
    }

    const FCardioCaseConceptDefinition* WeakestConcept = nullptr;
    int32 WeakestMastery = 0;
    for (const FCardioCaseConceptDefinition& Concept : Concepts)
    {
        const FCardioConceptMastery* Mastery = Profile.Mastery.Find(Concept.Id);
        const int32 Value = Mastery ? Mastery->Value : 0;
        if (!WeakestConcept
            || Value < WeakestMastery
            || (Value == WeakestMastery && ConceptIdPrecedes(Concept, *WeakestConcept)))
        {
            WeakestConcept = &Concept;
            WeakestMastery = Value;
        }
    }
    if (!WeakestConcept || WeakestConcept->CaseIds.IsEmpty())
    {
        OutError = TEXT("Clinical concepts cannot select a spaced-repetition case");
        return false;
    }

    const FString& SpacedCaseId = WeakestConcept->CaseIds[0];
    if (!AvailableCaseIds.Contains(SpacedCaseId))
    {
        OutError = FString::Printf(TEXT("Clinical concept %s references an unavailable case"), *WeakestConcept->Id);
        return false;
    }
    OutSelection.CaseId = SpacedCaseId;
    OutSelection.Kind = TEXT("spaced-repetition");
    OutSelection.Reason = FString::Printf(
        TEXT("Revisit %s (%s)."),
        *WeakestConcept->Label,
        *MasteryLabel(WeakestMastery));
    return true;
}
