#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "CardioEducationTypes.h"
#include "CardioLearnerProfileTypes.h"
#include "CardioLearnerProfileSubsystem.generated.h"

UCLASS()
class CARDIOHOSPITAL_API UCardioLearnerProfileSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Learner Profile")
    bool IsProfileReady() const { return bProfileReady; }

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Learner Profile")
    bool WasProfileLoadedFromDisk() const { return bLoadedFromDisk; }

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Learner Profile")
    FString GetLastProfileError() const { return LastProfileError; }

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Learner Profile")
    FCardioLearnerProfile GetProfile() const { return Profile; }

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Learner Profile")
    bool FindMastery(const FString& ConceptId, FCardioConceptMastery& OutMastery) const;

    UFUNCTION(BlueprintPure, Category="Cardio Hospital|Learner Profile")
    FString GetMasteryLabel(int32 Value) const;

    UFUNCTION(BlueprintCallable, Category="Cardio Hospital|Learner Profile")
    bool RecordAttempt(
        const FCardioCaseDebrief& Debrief,
        const FString& AttemptId,
        const FString& CompletedAt,
        FString& OutError);

    UFUNCTION(BlueprintCallable, BlueprintPure=false, Category="Cardio Hospital|Learner Profile")
    bool SelectNextCase(FCardioNextCaseSelection& OutSelection, FString& OutError) const;

    UFUNCTION(BlueprintCallable, Category="Cardio Hospital|Learner Profile")
    bool SaveProfile(FString& OutError);

    UFUNCTION(BlueprintCallable, Category="Cardio Hospital|Learner Profile")
    bool ReloadProfile(FString& OutError);

    UFUNCTION(BlueprintCallable, Category="Cardio Hospital|Learner Profile")
    bool ResetProfile(FString& OutError);

private:
    bool WriteProfile(const FCardioLearnerProfile& Candidate, FString& OutError) const;
    bool FailLoad(const FString& Error, FString& OutError);

    UPROPERTY(Transient)
    FCardioLearnerProfile Profile;

    UPROPERTY(Transient)
    FString LastProfileError;

    bool bProfileReady = false;
    bool bLoadedFromDisk = false;
};
