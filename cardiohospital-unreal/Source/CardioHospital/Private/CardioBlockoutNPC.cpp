#include "CardioBlockoutNPC.h"

#include "Engine/World.h"
#include "Math/UnrealMathUtility.h"
#include "GameFramework/PlayerController.h"
#include "UObject/SoftObjectPath.h"
#include "GameFramework/Pawn.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/TextRenderComponent.h"
#include "Engine/SkeletalMesh.h"
#include "Engine/StaticMesh.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

DEFINE_LOG_CATEGORY_STATIC(LogCardioAttending, Log, All);

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
    static ConstructorHelpers::FObjectFinder<USkeletalMesh> CoatSkelFinder(TEXT("/Game/Environment/Clinic/SK_LabCoat.SK_LabCoat"));
    static ConstructorHelpers::FObjectFinder<USkeletalMesh> TrouserSkelFinder(TEXT("/Game/Environment/Clinic/SK_Trousers.SK_Trousers"));
    static ConstructorHelpers::FObjectFinder<USkeletalMesh> ScopeSkelFinder(TEXT("/Game/Environment/Clinic/SK_Stethoscope.SK_Stethoscope"));

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

    AttendingCoatSkel = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("AttendingCoatSkel"));
    AttendingCoatSkel->SetupAttachment(Root);
    AttendingCoatSkel->SetMobility(EComponentMobility::Movable);
    AttendingCoatSkel->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    AttendingCoatSkel->SetHiddenInGame(true);
    AttendingCoatSkel->SetAnimationMode(EAnimationMode::AnimationCustomMode);
    if (CoatSkelFinder.Succeeded())
    {
        AttendingCoatSkel->SetSkeletalMesh(CoatSkelFinder.Object);
    }

    AttendingTrousersSkel = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("AttendingTrousersSkel"));
    AttendingTrousersSkel->SetupAttachment(Root);
    AttendingTrousersSkel->SetMobility(EComponentMobility::Movable);
    AttendingTrousersSkel->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    AttendingTrousersSkel->SetHiddenInGame(true);
    AttendingTrousersSkel->SetAnimationMode(EAnimationMode::AnimationCustomMode);
    if (TrouserSkelFinder.Succeeded())
    {
        AttendingTrousersSkel->SetSkeletalMesh(TrouserSkelFinder.Object);
    }

    AttendingScopeSkel = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("AttendingScopeSkel"));
    AttendingScopeSkel->SetupAttachment(Root);
    AttendingScopeSkel->SetMobility(EComponentMobility::Movable);
    AttendingScopeSkel->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    AttendingScopeSkel->SetHiddenInGame(true);
    AttendingScopeSkel->SetAnimationMode(EAnimationMode::AnimationCustomMode);
    if (ScopeSkelFinder.Succeeded())
    {
        AttendingScopeSkel->SetSkeletalMesh(ScopeSkelFinder.Object);
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
    if (AttendingCoat)
    {
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
    EnsureSkinnedMeshesLoaded();
    AttachSkinnedAttendingKit();
}

USkeletalMeshComponent* ACardioBlockoutNPC::FindAssembledBody() const
{
    if (!AssembledVisual)
    {
        return nullptr;
    }

    TArray<USkeletalMeshComponent*> Skels;
    AssembledVisual->GetComponents<USkeletalMeshComponent>(Skels, true);
    for (USkeletalMeshComponent* Skel : Skels)
    {
        if (!Skel)
        {
            continue;
        }
        const USkeletalMesh* Mesh = Skel->GetSkeletalMeshAsset();
        const FString MeshName = Mesh ? Mesh->GetName() : FString();
        UE_LOG(LogCardioAttending, Display, TEXT("assembled skel %s mesh=%s"), *Skel->GetName(), *MeshName);
        if (Skel->GetName().Contains(TEXT("Body")) || MeshName.Contains(TEXT("Body")))
        {
            continue;
        }
    }
    HideDefaultGarment();
    for (USkeletalMeshComponent* Skel : Skels)
    {
        if (!Skel)
        {
            continue;
        }
        const USkeletalMesh* Mesh = Skel->GetSkeletalMeshAsset();
        const FString MeshName = Mesh ? Mesh->GetName() : FString();
        if (Skel->GetName().Contains(TEXT("Body")) || MeshName.Contains(TEXT("Body")))
        {
            return Skel;
        }
    }
    for (USkeletalMeshComponent* Skel : Skels)
    {
        if (!Skel)
        {
            continue;
        }
        const FString Name = Skel->GetName();
        if (!Name.Contains(TEXT("Face")) && !Name.Contains(TEXT("Hair")) && !Name.Contains(TEXT("Groom")))
        {
            return Skel;
        }
    }
    return Skels.Num() > 0 ? Skels[0] : nullptr;
}

void ACardioBlockoutNPC::HideDefaultGarment() const
{
    if (!AssembledVisual)
    {
        return;
    }

    TArray<USkeletalMeshComponent*> Skels;
    AssembledVisual->GetComponents<USkeletalMeshComponent>(Skels, true);
    for (USkeletalMeshComponent* Skel : Skels)
    {
        if (!Skel)
        {
            continue;
        }
        const USkeletalMesh* Mesh = Skel->GetSkeletalMeshAsset();
        const FString Combined = Skel->GetName() + TEXT(" ") + (Mesh ? Mesh->GetName() : FString());
        if (Combined.Contains(TEXT("Garment")) || Combined.Contains(TEXT("Shirt"))
            || Combined.Contains(TEXT("Short")) || Combined.Contains(TEXT("Outfit"))
            || Combined.Contains(TEXT("Cloth")))
        {
            Skel->SetHiddenInGame(true);
            Skel->SetVisibility(false);
        }
    }
}

void ACardioBlockoutNPC::EnsureSkinnedMeshesLoaded()
{
    auto LoadInto = [](USkeletalMeshComponent* Comp, const TCHAR* Path)
    {
        if (!Comp || Comp->GetSkeletalMeshAsset())
        {
            return;
        }
        if (USkeletalMesh* Mesh = LoadObject<USkeletalMesh>(nullptr, Path))
        {
            Comp->SetSkeletalMesh(Mesh);
            UE_LOG(LogCardioAttending, Display, TEXT("runtime loaded %s"), Path);
        }
        else
        {
            UE_LOG(LogCardioAttending, Warning, TEXT("missing skeletal mesh %s"), Path);
        }
    };
    LoadInto(AttendingCoatSkel, TEXT("/Game/Environment/Clinic/SK_LabCoat.SK_LabCoat"));
    LoadInto(AttendingTrousersSkel, TEXT("/Game/Environment/Clinic/SK_Trousers.SK_Trousers"));
    LoadInto(AttendingScopeSkel, TEXT("/Game/Environment/Clinic/SK_Stethoscope.SK_Stethoscope"));
}

bool ACardioBlockoutNPC::AttachSkinnedAttendingKit()
{
    if (bAttendingKitAttached)
    {
        return true;
    }

    EnsureSkinnedMeshesLoaded();
    USkeletalMeshComponent* Body = FindAssembledBody();
    if (!Body)
    {
        UE_LOG(LogCardioAttending, Warning, TEXT("no assembled body yet for %s"), *DisplayName);
        return false;
    }

    auto AttachFollower = [Body](USkeletalMeshComponent* Follower, const TCHAR* Label) -> bool
    {
        if (!Follower)
        {
            UE_LOG(LogCardioAttending, Warning, TEXT("%s component missing"), Label);
            return false;
        }
        USkeletalMesh* Mesh = Follower->GetSkeletalMeshAsset();
        if (!Mesh)
        {
            UE_LOG(LogCardioAttending, Warning, TEXT("%s has no mesh"), Label);
            return false;
        }
        Follower->DetachFromComponent(FDetachmentTransformRules::KeepWorldTransform);
        Follower->AttachToComponent(Body, FAttachmentTransformRules::SnapToTargetNotIncludingScale);
        Follower->SetRelativeLocationAndRotation(FVector::ZeroVector, FRotator::ZeroRotator);
        Follower->SetRelativeScale3D(FVector(1.06f));
        Follower->SetLeaderPoseComponent(Body, true);
        Follower->SetHiddenInGame(false);
        Follower->SetVisibility(true, true);
        Follower->bCastDynamicShadow = true;
        Follower->SetCastShadow(true);
        Follower->bNeverDistanceCull = true;
        Follower->SetBoundsScale(2.f);
        if (FCString::Strstr(Label, TEXT("LabCoat")))
        {
            if (UMaterialInterface* CoatMat = LoadObject<UMaterialInterface>(
                    nullptr, TEXT("/Game/Environment/Clinic/M_LabCoat.M_LabCoat")))
            {
                Follower->SetMaterial(0, CoatMat);
            }
        }
        else if (FCString::Strstr(Label, TEXT("Trousers")))
        {
            if (UMaterialInterface* TrouserMat = LoadObject<UMaterialInterface>(
                    nullptr, TEXT("/Game/Environment/Clinic/M_Trousers.M_Trousers")))
            {
                Follower->SetMaterial(0, TrouserMat);
            }
        }
        Follower->UpdateBounds();
        Follower->MarkRenderStateDirty();
        const FBoxSphereBounds Bounds = Follower->Bounds;
        UE_LOG(
            LogCardioAttending,
            Display,
            TEXT("leader-posed %s (%s) onto %s/%s loc=%s origin=%s box=%s hidden=%d vis=%d"),
            Label,
            *Mesh->GetName(),
            *Body->GetName(),
            Body->GetSkeletalMeshAsset() ? *Body->GetSkeletalMeshAsset()->GetName() : TEXT("none"),
            *Follower->GetComponentLocation().ToCompactString(),
            *Bounds.Origin.ToCompactString(),
            *Bounds.BoxExtent.ToCompactString(),
            Follower->bHiddenInGame ? 1 : 0,
            Follower->IsVisible() ? 1 : 0);
        return true;
    };

    const bool bCoat = AttachFollower(AttendingCoatSkel, TEXT("SK_LabCoat"));
    AttachFollower(AttendingTrousersSkel, TEXT("SK_Trousers"));
    AttachFollower(AttendingScopeSkel, TEXT("SK_Stethoscope"));
    bAttendingKitAttached = bCoat;
    return bAttendingKitAttached;
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
        HideDefaultGarment();
        if (!bAttendingKitAttached)
        {
            AttachSkinnedAttendingKit();
        }
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
