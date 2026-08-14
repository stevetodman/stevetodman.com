#include "CardioCaseRuntimeSubsystem.h"

#include "CardioClinicalDataSubsystem.h"
#include "CardioEducationEvaluator.h"
#include "CardioHospital.h"
#include "Dom/JsonObject.h"
#include "Engine/GameInstance.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Subsystems/SubsystemCollection.h"

void UCardioCaseRuntimeSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
    Collection.InitializeDependency<UCardioClinicalDataSubsystem>();
}

bool UCardioCaseRuntimeSubsystem::StartCase(const FString& CaseId, FString& OutError)
{
    OutError.Reset();
    UCardioClinicalDataSubsystem* ClinicalData = GetGameInstance()->GetSubsystem<UCardioClinicalDataSubsystem>();
    if (!ClinicalData || !ClinicalData->IsClinicalContentLoaded())
    {
        OutError = TEXT("Clinical content is not loaded");
        return false;
    }

    FCardioClinicalCase ClinicalCase;
    FCardioCaseGraphDefinition CaseGraph;
    if (!ClinicalData->FindCaseById(CaseId, ClinicalCase))
    {
        OutError = FString::Printf(TEXT("Unknown clinical case: %s"), *CaseId);
        return false;
    }
    if (!ClinicalData->FindCaseGraphById(CaseId, CaseGraph))
    {
        OutError = FString::Printf(TEXT("No deterministic graph is authored for case: %s"), *CaseId);
        return false;
    }

    ActiveCase = MoveTemp(ClinicalCase);
    ActiveGraph = MoveTemp(CaseGraph);
    State = FCardioCaseRuntimeState{};
    State.CaseId = ActiveGraph.CaseId;
    State.GraphVersion = ActiveGraph.Version;
    State.NodeId = ActiveGraph.StartNodeId;
    bHasActiveCase = true;

    UE_LOG(LogCardioHospital, Display, TEXT("Started deterministic case %s at node %s"), *State.CaseId, *State.NodeId);
    return true;
}

bool UCardioCaseRuntimeSubsystem::PerformAction(
    const FString& ActionId,
    const FString& PayloadJson,
    FCardioCaseActionResult& OutResult)
{
    OutResult = FCardioCaseActionResult{};
    OutResult.NodeBefore = State.NodeId;
    OutResult.NodeAfter = State.NodeId;

    if (!bHasActiveCase)
    {
        OutResult.Error = TEXT("No active case");
        return false;
    }

    const FCardioCaseNodeDefinition* Node = FindCurrentNode();
    if (!Node)
    {
        OutResult.Error = FString::Printf(TEXT("Active case references missing node: %s"), *State.NodeId);
        return false;
    }
    if (!Node->AvailableActions.Contains(ActionId))
    {
        OutResult.Error = FString::Printf(TEXT("Action %s is not available in node %s"), *ActionId, *State.NodeId);
        return false;
    }

    const FCardioCaseActionDefinition* Action = FindAction(ActionId);
    if (!Action)
    {
        OutResult.Error = FString::Printf(TEXT("Unknown action: %s"), *ActionId);
        return false;
    }
    if (!HasAllEffects(Action->RequiresAll))
    {
        OutResult.Error = FString::Printf(TEXT("Action %s has unmet prerequisites"), *ActionId);
        return false;
    }

    FString NormalizedPayloadJson = PayloadJson;
    NormalizedPayloadJson.TrimStartAndEndInline();
    if (NormalizedPayloadJson.IsEmpty())
    {
        NormalizedPayloadJson = TEXT("{}");
    }

    TSharedPtr<FJsonObject> PayloadObject;
    const TSharedRef<TJsonReader<>> PayloadReader = TJsonReaderFactory<>::Create(NormalizedPayloadJson);
    if (!FJsonSerializer::Deserialize(PayloadReader, PayloadObject) || !PayloadObject.IsValid())
    {
        OutResult.Error = FString::Printf(TEXT("Action %s payload must be a JSON object"), *ActionId);
        return false;
    }

    for (const FString& Effect : Action->Effects)
    {
        State.Effects.AddUnique(Effect);
    }
    State.CompletedActions.AddUnique(ActionId);

    FCardioCaseActionEvent& Event = State.ActionLog.AddDefaulted_GetRef();
    Event.Sequence = State.ActionLog.Num();
    Event.NodeId = State.NodeId;
    Event.ActionId = Action->Id;
    Event.EventType = Action->EventType;
    Event.Target = Action->Target;
    Event.PayloadJson = NormalizedPayloadJson;

    for (const FCardioCaseTransitionDefinition& Transition : Node->Transitions)
    {
        if (TransitionMatches(Transition))
        {
            State.NodeId = Transition.To;
            break;
        }
    }

    OutResult.bSucceeded = true;
    OutResult.NodeAfter = State.NodeId;
    OutResult.bTransitioned = !OutResult.NodeBefore.Equals(OutResult.NodeAfter, ESearchCase::CaseSensitive);
    return true;
}

bool UCardioCaseRuntimeSubsystem::IsCaseComplete() const
{
    return bHasActiveCase && ActiveGraph.TerminalNodeIds.Contains(State.NodeId);
}

TArray<FString> UCardioCaseRuntimeSubsystem::GetAvailableActions() const
{
    TArray<FString> Available;
    if (!bHasActiveCase || IsCaseComplete())
    {
        return Available;
    }

    const FCardioCaseNodeDefinition* Node = FindCurrentNode();
    if (!Node)
    {
        return Available;
    }

    for (const FString& ActionId : Node->AvailableActions)
    {
        const FCardioCaseActionDefinition* Action = FindAction(ActionId);
        if (Action && HasAllEffects(Action->RequiresAll))
        {
            Available.Add(ActionId);
        }
    }
    return Available;
}

TArray<FString> UCardioCaseRuntimeSubsystem::GetMissingAcceptanceActions() const
{
    TArray<FString> Missing;
    if (!bHasActiveCase)
    {
        return Missing;
    }

    for (const FCardioCaseNodeDefinition& Node : ActiveGraph.Nodes)
    {
        for (const FString& ActionId : Node.AcceptanceActions)
        {
            if (!State.CompletedActions.Contains(ActionId))
            {
                Missing.AddUnique(ActionId);
            }
        }
    }
    return Missing;
}

TArray<FCardioCaseActionDefinition> UCardioCaseRuntimeSubsystem::GetAvailableActionDefinitions() const
{
    TArray<FCardioCaseActionDefinition> Available;
    for (const FString& ActionId : GetAvailableActions())
    {
        if (const FCardioCaseActionDefinition* Action = FindAction(ActionId))
        {
            Available.Add(*Action);
        }
    }
    return Available;
}

bool UCardioCaseRuntimeSubsystem::HasPassedAcceptance() const
{
    return IsCaseComplete() && GetMissingAcceptanceActions().IsEmpty();
}

bool UCardioCaseRuntimeSubsystem::EvaluateCurrentAttempt(
    FCardioCaseDebrief& OutDebrief,
    FString& OutError) const
{
    OutDebrief = FCardioCaseDebrief{};
    OutError.Reset();
    if (!bHasActiveCase)
    {
        OutError = TEXT("No active case");
        return false;
    }

    return FCardioEducationEvaluator::EvaluateAttempt(
        State,
        ActiveGraph,
        ActiveCase,
        OutDebrief,
        OutError);
}

const FCardioCaseNodeDefinition* UCardioCaseRuntimeSubsystem::FindCurrentNode() const
{
    return ActiveGraph.Nodes.FindByPredicate(
        [this](const FCardioCaseNodeDefinition& Candidate)
        {
            return Candidate.Id.Equals(State.NodeId, ESearchCase::CaseSensitive);
        });
}

const FCardioCaseActionDefinition* UCardioCaseRuntimeSubsystem::FindAction(const FString& ActionId) const
{
    return ActiveGraph.Actions.FindByPredicate(
        [&ActionId](const FCardioCaseActionDefinition& Candidate)
        {
            return Candidate.Id.Equals(ActionId, ESearchCase::CaseSensitive);
        });
}

bool UCardioCaseRuntimeSubsystem::HasAllEffects(const TArray<FString>& RequiredEffects) const
{
    return !RequiredEffects.ContainsByPredicate(
        [this](const FString& RequiredEffect)
        {
            return !State.Effects.Contains(RequiredEffect);
        });
}

bool UCardioCaseRuntimeSubsystem::TransitionMatches(const FCardioCaseTransitionDefinition& Transition) const
{
    if (!HasAllEffects(Transition.AllOf))
    {
        return false;
    }
    return Transition.AnyOf.IsEmpty() || Transition.AnyOf.ContainsByPredicate(
        [this](const FString& Effect)
        {
            return State.Effects.Contains(Effect);
        });
}
