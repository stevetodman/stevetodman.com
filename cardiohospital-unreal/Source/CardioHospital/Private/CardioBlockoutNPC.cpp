#include "CardioBlockoutNPC.h"

#include "Engine/World.h"
#include "Math/UnrealMathUtility.h"
#include "GameFramework/PlayerController.h"
#include "UObject/SoftObjectPath.h"
#include "GameFramework/Pawn.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/TextRenderComponent.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

ACardioBlockoutNPC::ACardioBlockoutNPC()
{
    PrimaryActorTick.bCanEverTick = true;

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CylinderFinder(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> SphereFinder(TEXT("/Engine/BasicShapes/Sphere.Sphere"));
    static ConstructorHelpers::FObjectFinder<UMaterialInterface> MaterialFinder(TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));

    UStaticMesh* Cylinder = CylinderFinder.Object;
    UStaticMesh* Sphere = SphereFinder.Object;
    UMaterialInterface* Material = MaterialFinder.Object;

    Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
    Root->SetMobility(EComponentMobility::Movable);
    SetRootComponent(Root);

    LeftLeg = MakePart(TEXT("LeftLeg"), Cylinder, Material, FVector(-12.f, 0.f, 42.f), FVector(0.12f, 0.12f, 0.42f));
    RightLeg = MakePart(TEXT("RightLeg"), Cylinder, Material, FVector(12.f, 0.f, 42.f), FVector(0.12f, 0.12f, 0.42f));
    Torso = MakePart(TEXT("Torso"), Cylinder, Material, FVector(0.f, 0.f, 118.f), TorsoBaseScale);
    Coat = MakePart(TEXT("Coat"), Cylinder, Material, FVector(0.f, 4.f, 122.f), FVector(0.42f, 0.24f, 0.82f));
    LeftArm = MakePart(TEXT("LeftArm"), Cylinder, Material, FVector(-28.f, 0.f, 128.f), FVector(0.09f, 0.09f, 0.46f));
    RightArm = MakePart(TEXT("RightArm"), Cylinder, Material, FVector(28.f, 0.f, 128.f), FVector(0.09f, 0.09f, 0.46f));
    Head = MakePart(TEXT("Head"), Sphere, Material, FVector(0.f, 2.f, 176.f), HeadBaseScale);
    Hair = MakePart(TEXT("Hair"), Sphere, Material, FVector(0.f, -2.f, 186.f), FVector(0.29f, 0.30f, 0.18f));
    LeftEye = MakePart(TEXT("LeftEye"), Sphere, Material, FVector(-7.f, 12.f, 178.f), EyeBaseScale);
    RightEye = MakePart(TEXT("RightEye"), Sphere, Material, FVector(7.f, 12.f, 178.f), EyeBaseScale);

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CoatFinder(TEXT("/Game/Environment/Clinic/SM_LabCoat.SM_LabCoat"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> TrouserFinder(TEXT("/Game/Environment/Clinic/SM_Trousers.SM_Trousers"));
    static ConstructorHelpers::FObjectFinder<UStaticMesh> ScopeFinder(TEXT("/Game/Environment/Clinic/SM_Stethoscope.SM_Stethoscope"));

    AttendingCoat = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("AttendingCoat"));
    AttendingCoat->SetupAttachment(Root);
    AttendingCoat->SetMobility(EComponentMobility::Movable);
    AttendingCoat->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    AttendingCoat->SetHiddenInGame(true);
    if (CoatFinder.Succeeded())
    {
        AttendingCoat->SetStaticMesh(CoatFinder.Object);
    }
    static ConstructorHelpers::FObjectFinder<UMaterialInterface> ShirtFinder(TEXT("/Game/Environment/Clinic/M_DressShirt.M_DressShirt"));
    static ConstructorHelpers::FObjectFinder<UMaterialInterface> TieFinder(TEXT("/Game/Environment/Clinic/M_AttendingTie.M_AttendingTie"));
    static ConstructorHelpers::FObjectFinder<UMaterialInterface> ButtonFinder(TEXT("/Game/Environment/Clinic/M_CoatButton.M_CoatButton"));
    if (ShirtFinder.Succeeded())
    {
        AttendingCoat->SetMaterial(1, ShirtFinder.Object);
    }
    if (TieFinder.Succeeded())
    {
        AttendingCoat->SetMaterial(2, TieFinder.Object);
    }
    if (ButtonFinder.Succeeded())
    {
        AttendingCoat->SetMaterial(3, ButtonFinder.Object);
    }

    AttendingTrousers = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("AttendingTrousers"));
    AttendingTrousers->SetupAttachment(Root);
    AttendingTrousers->SetMobility(EComponentMobility::Movable);
    AttendingTrousers->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    AttendingTrousers->SetHiddenInGame(true);
    if (TrouserFinder.Succeeded())
    {
        AttendingTrousers->SetStaticMesh(TrouserFinder.Object);
    }

    AttendingScope = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("AttendingScope"));
    AttendingScope->SetupAttachment(Root);
    AttendingScope->SetMobility(EComponentMobility::Movable);
    AttendingScope->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    AttendingScope->SetHiddenInGame(true);
    if (ScopeFinder.Succeeded())
    {
        AttendingScope->SetStaticMesh(ScopeFinder.Object);
    }

    NameText = CreateDefaultSubobject<UTextRenderComponent>(TEXT("NameText"));
    NameText->SetupAttachment(Root);
    NameText->SetMobility(EComponentMobility::Movable);
    NameText->SetRelativeLocation(FVector(0.f, 0.f, 214.f));
    NameText->SetHorizontalAlignment(EHTA_Center);
    NameText->SetWorldSize(18.f);
    NameText->SetTextRenderColor(FColor(20, 36, 44));
}

UStaticMeshComponent* ACardioBlockoutNPC::MakePart(
    const FName Name,
    UStaticMesh* Mesh,
    UMaterialInterface* Material,
    const FVector& Location,
    const FVector& Scale)
{
    UStaticMeshComponent* Part = CreateDefaultSubobject<UStaticMeshComponent>(Name);
    Part->SetupAttachment(Root);
    Part->SetMobility(EComponentMobility::Movable);
    Part->SetStaticMesh(Mesh);
    Part->SetMaterial(0, Material);
    Part->SetRelativeLocation(Location);
    Part->SetRelativeScale3D(Scale);
    Part->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
    return Part;
}

void ACardioBlockoutNPC::ApplyTint(UStaticMeshComponent* Mesh, const FLinearColor& Color)
{
    if (!Mesh)
    {
        return;
    }
    if (UMaterialInstanceDynamic* Tint = Mesh->CreateAndSetMaterialInstanceDynamic(0))
    {
        Tint->SetVectorParameterValue(TEXT("Color"), Color);
        Tint->SetVectorParameterValue(TEXT("BaseColor"), Color);
    }
}

void ACardioBlockoutNPC::Configure(const FString& InNpcId, const FString& InDisplayName, const FLinearColor& CoatColor)
{
    NpcId = InNpcId;
    DisplayName = InDisplayName;
    NameText->SetText(FText::FromString(DisplayName));

    const FLinearColor Skin(0.76f, 0.58f, 0.46f);
    const FLinearColor Trouser(0.12f, 0.14f, 0.18f);
    const FLinearColor HairColor(0.08f, 0.06f, 0.05f);
    const FLinearColor EyeWhite(0.92f, 0.93f, 0.94f);

    ApplyTint(Torso, CoatColor);
    ApplyTint(Coat, CoatColor);
    ApplyTint(LeftArm, CoatColor);
    ApplyTint(RightArm, CoatColor);
    ApplyTint(LeftLeg, Trouser);
    ApplyTint(RightLeg, Trouser);
    ApplyTint(Head, Skin);
    ApplyTint(Hair, HairColor);
    ApplyTint(LeftEye, EyeWhite);
    ApplyTint(RightEye, EyeWhite);

    TryAttachAssembledMetaHuman();
}

void ACardioBlockoutNPC::HidePrimitiveStandIn()
{
    TArray<UStaticMeshComponent*> Parts = {
        Torso, Coat, Head, Hair, LeftEye, RightEye, LeftArm, RightArm, LeftLeg, RightLeg
    };
    for (UStaticMeshComponent* Part : Parts)
    {
        if (!Part)
        {
            continue;
        }
        Part->SetHiddenInGame(true);
        Part->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    }
}

void ACardioBlockoutNPC::TryAttachAssembledMetaHuman()
{
    static const TCHAR* CandidatePaths[] = {
        TEXT("/Game/MetaHumans/Patel/BP_Patel.BP_Patel_C"),
        TEXT("/Game/MetaHumans/Patel.BP_Patel_C"),
        TEXT("/Game/MetaHumans/BP_Patel.BP_Patel_C"),
    };

    UClass* VisualClass = nullptr;
    for (const TCHAR* Path : CandidatePaths)
    {
        VisualClass = LoadClass<AActor>(nullptr, Path);
        if (VisualClass)
        {
            break;
        }
    }
    if (!VisualClass || !GetWorld())
    {
        return;
    }

    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    Params.Owner = this;
    AssembledVisual = GetWorld()->SpawnActor<AActor>(VisualClass, GetActorTransform(), Params);
    if (!AssembledVisual)
    {
        return;
    }

    AssembledVisual->AttachToActor(this, FAttachmentTransformRules::SnapToTargetNotIncludingScale);
    HidePrimitiveStandIn();
    // The Sketchfab coat is authored in A-pose. Freeze the assembled
    // MetaHuman on its bind pose so the real garment can sit on him
    // instead of a foam column in front of an idle.
    TArray<USkeletalMeshComponent*> Skels;
    AssembledVisual->GetComponents<USkeletalMeshComponent>(Skels);
    for (USkeletalMeshComponent* Skel : Skels)
    {
        if (!Skel)
        {
            continue;
        }
        Skel->SetAnimationMode(EAnimationMode::AnimationCustomMode);
        Skel->Stop();
    }
    if (AttendingCoat)
    {
        // Live look: the Sketchfab coat sat as a sheet on his front.
        // Keep the CC-BY mesh in the project; do not plaster it on.
        AttendingCoat->SetHiddenInGame(true);
    }
    if (AttendingTrousers)
    {
        AttendingTrousers->SetHiddenInGame(true);
    }
    if (AttendingScope)
    {
        AttendingScope->SetHiddenInGame(true);
    }
}

void ACardioBlockoutNPC::SetListening(const bool bInListening)
{
    bListening = bInListening;
}

void ACardioBlockoutNPC::NotifySpeaking(const bool bInSpeaking)
{
    bSpeaking = bInSpeaking;
    if (bSpeaking)
    {
        bListening = false;
    }
}

void ACardioBlockoutNPC::Tick(const float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);

    const APlayerController* Controller = GetWorld() ? GetWorld()->GetFirstPlayerController() : nullptr;
    const APawn* Learner = Controller ? Controller->GetPawn() : nullptr;
    if (AssembledVisual)
    {
        if (!Learner)
        {
            return;
        }
        const FVector ToLearner = Learner->GetActorLocation() - GetActorLocation();
        if (ToLearner.Size2D() > 700.f)
        {
            return;
        }
        SetActorRotation(FRotator(0.f, ToLearner.Rotation().Yaw, 0.f));
        AssembledVisual->SetActorRotation(GetActorRotation());
        return;
    }

    const float Time = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.f;
    const float Breath = 1.f + 0.015f * FMath::Sin(Time * 1.6f);
    Torso->SetRelativeScale3D(TorsoBaseScale * FVector(1.f, 1.f, Breath));
    Coat->SetRelativeScale3D(FVector(0.42f, 0.24f, 0.82f * Breath));

    BlinkTimer -= DeltaSeconds;
    if (BlinkTimer <= 0.f)
    {
        BlinkRemaining = 0.11f;
        BlinkTimer = 2.6f + FMath::FRandRange(0.f, 2.2f);
    }
    if (BlinkRemaining > 0.f)
    {
        BlinkRemaining = FMath::Max(0.f, BlinkRemaining - DeltaSeconds);
    }

    const float EyeZ = BlinkRemaining > 0.f ? EyeBaseScale.Z * 0.18f : EyeBaseScale.Z;
    LeftEye->SetRelativeScale3D(FVector(EyeBaseScale.X, EyeBaseScale.Y, EyeZ));
    RightEye->SetRelativeScale3D(FVector(EyeBaseScale.X, EyeBaseScale.Y, EyeZ));

    FVector HeadScale = HeadBaseScale;
    if (bSpeaking)
    {
        HeadScale *= 1.f + 0.018f * FMath::Sin(Time * 16.f);
    }
    Head->SetRelativeScale3D(HeadScale);

    const float Lean = bListening ? 8.f : 0.f;
    Torso->SetRelativeRotation(FRotator(-Lean, 0.f, 0.f));
    Coat->SetRelativeRotation(FRotator(-Lean, 0.f, 0.f));

    if (!Learner)
    {
        return;
    }

    const FVector ToLearner = Learner->GetActorLocation() - GetActorLocation();
    if (ToLearner.Size2D() > 700.f)
    {
        return;
    }

    const float Yaw = ToLearner.Rotation().Yaw;
    SetActorRotation(FRotator(0.f, Yaw, 0.f));
    const float HeadYaw = FMath::ClampAngle(Yaw - GetActorRotation().Yaw, -18.f, 18.f);
    Head->SetRelativeRotation(FRotator(-2.f, HeadYaw, 0.f));
    Hair->SetRelativeRotation(FRotator(-2.f, HeadYaw, 0.f));
}

FString ACardioBlockoutNPC::GetInteractionPrompt() const
{
    return FString::Printf(TEXT("[E]  Speak with %s"), *DisplayName);
}
