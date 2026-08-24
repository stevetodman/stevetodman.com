#include "CardioEncounterPresentationNPC.h"

#include "CardioHospital.h"
#include "Components/TextRenderComponent.h"
#include "Engine/World.h"
#include "EngineUtils.h"

namespace
{
    FDelegateHandle EncounterPresentationWorldHandle;

    void SpawnExamRoomPresentation(UWorld& World)
    {
        TActorIterator<ACardioEncounterPresentationNPC> Existing(&World);
        if (Existing)
        {
            return;
        }

        FActorSpawnParameters Params;
        Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;

        // These are role-only presentation actors. The case runtime supplies
        // the patient's actual name, history, findings, diagnosis, and parent
        // context. Positions sit in the clear west-side exam-room aisle, away
        // from the bed and visitor chairs around the room center.
        ACardioEncounterPresentationNPC* Patient = World.SpawnActor<ACardioEncounterPresentationNPC>(
            FVector(-1220.f, 760.f, 0.f), FRotator(0.f, -35.f, 0.f), Params);
        if (Patient)
        {
            Patient->ConfigureRole(TEXT("Patient"), TEXT("encounter-patient"));
        }

        ACardioEncounterPresentationNPC* Parent = World.SpawnActor<ACardioEncounterPresentationNPC>(
            FVector(-1320.f, 570.f, 0.f), FRotator(0.f, -15.f, 0.f), Params);
        if (Parent)
        {
            Parent->ConfigureRole(TEXT("Parent"), TEXT("encounter-parent"));
        }

        UE_LOG(LogCardioHospital, Log,
            TEXT("Spawned presentation-only Patient and Parent actors in Exam Room 3; clinical truth remains runtime-authored."));
    }

    void OnEncounterWorldInitialized(UWorld* World, const UWorld::InitializationValues InitializationValues)
    {
        (void)InitializationValues;
        if (!World || !World->IsGameWorld())
        {
            return;
        }
        SpawnExamRoomPresentation(*World);
    }
}

ACardioEncounterPresentationNPC::ACardioEncounterPresentationNPC()
{
    RoleText = CreateDefaultSubobject<UTextRenderComponent>(TEXT("EncounterRoleText"));
    RoleText->SetupAttachment(GetRootComponent());
    RoleText->SetRelativeLocation(FVector(0.f, 0.f, 214.f));
    RoleText->SetHorizontalAlignment(EHTA_Center);
    RoleText->SetWorldSize(18.f);
    RoleText->SetTextRenderColor(FColor(20, 36, 44));
}

void ACardioEncounterPresentationNPC::ConfigureRole(
    const FString& RoleLabel,
    const FString& InteractionId)
{
    ConfigurePresentationIdentity(InteractionId, RoleLabel);
    if (RoleText)
    {
        RoleText->SetText(FText::FromString(RoleLabel));
    }
}

namespace CardioEncounterPresentation
{
    void RegisterWorldHook()
    {
        if (!EncounterPresentationWorldHandle.IsValid())
        {
            EncounterPresentationWorldHandle = FWorldDelegates::OnPostWorldInitialization.AddStatic(
                &OnEncounterWorldInitialized);
        }
    }

    void UnregisterWorldHook()
    {
        if (EncounterPresentationWorldHandle.IsValid())
        {
            FWorldDelegates::OnPostWorldInitialization.Remove(EncounterPresentationWorldHandle);
            EncounterPresentationWorldHandle.Reset();
        }
    }
}
