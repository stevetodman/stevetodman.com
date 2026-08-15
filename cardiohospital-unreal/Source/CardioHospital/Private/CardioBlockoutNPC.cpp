#include "CardioBlockoutNPC.h"

#include "GameFramework/PlayerController.h"
#include "GameFramework/Pawn.h"
#include "Components/StaticMeshComponent.h"
#include "Components/TextRenderComponent.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

ACardioBlockoutNPC::ACardioBlockoutNPC()
{
    // Ticks only to yaw toward the learner when they are in conversation range.
    PrimaryActorTick.bCanEverTick = true;

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeFinder(TEXT("/Engine/BasicShapes/Cube.Cube"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> SphereFinder(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    static ConstructorHelpers::FObjectFinder<UMaterialInterface> MaterialFinder(TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));

    Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
    Root->SetMobility(EComponentMobility::Movable);
    SetRootComponent(Root);

    Body = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Body"));
    Body->SetupAttachment(Root);
    Body->SetMobility(EComponentMobility::Movable);
    Body->SetStaticMesh(CubeFinder.Object);
    Body->SetMaterial(0, MaterialFinder.Object);
    Body->SetRelativeLocation(FVector(0.f, 0.f, 85.f));
    Body->SetRelativeScale3D(FVector(0.42f, 0.6f, 1.7f));

    Head = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Head"));
    Head->SetupAttachment(Root);
    Head->SetMobility(EComponentMobility::Movable);
    Head->SetStaticMesh(SphereFinder.Object);
    Head->SetMaterial(0, MaterialFinder.Object);
    Head->SetRelativeLocation(FVector(0.f, 0.f, 188.f));
    Head->SetRelativeScale3D(FVector(0.34f));

    NameText = CreateDefaultSubobject<UTextRenderComponent>(TEXT("NameText"));
    NameText->SetupAttachment(Root);
    NameText->SetMobility(EComponentMobility::Movable);
    NameText->SetRelativeLocation(FVector(0.f, 0.f, 218.f));
    NameText->SetHorizontalAlignment(EHTA_Center);
    NameText->SetWorldSize(22.f);
    NameText->SetTextRenderColor(FColor(15, 30, 40));
}

void ACardioBlockoutNPC::Configure(const FString& InNpcId, const FString& InDisplayName, const FLinearColor& CoatColor)
{
    NpcId = InNpcId;
    DisplayName = InDisplayName;
    NameText->SetText(FText::FromString(DisplayName));

    if (UMaterialInstanceDynamic* CoatTint = Body->CreateAndSetMaterialInstanceDynamic(0))
    {
        CoatTint->SetVectorParameterValue(TEXT("Color"), CoatColor);
    }
    if (UMaterialInstanceDynamic* HeadTint = Head->CreateAndSetMaterialInstanceDynamic(0))
    {
        HeadTint->SetVectorParameterValue(TEXT("Color"), FLinearColor(0.85f, 0.66f, 0.50f));
    }
}

void ACardioBlockoutNPC::Tick(const float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);

    const APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    const APawn* Learner = Controller ? Controller->GetPawn() : nullptr;
    if (!Learner)
    {
        return;
    }

    const FVector ToLearner = Learner->GetActorLocation() - GetActorLocation();
    if (ToLearner.Size2D() > 600.f)
    {
        return;
    }

    SetActorRotation(FRotator(0.f, ToLearner.Rotation().Yaw, 0.f));
}

FString ACardioBlockoutNPC::GetInteractionPrompt() const
{
    return FString::Printf(TEXT("[E]  Speak with %s"), *DisplayName);
}
