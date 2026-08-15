#include "CardioBlockoutGameMode.h"

#include "CardioBlockoutCharacter.h"
#include "CardioHospital.h"
#include "Components/DirectionalLightComponent.h"
#include "Components/SkyAtmosphereComponent.h"
#include "Components/SkyLightComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/StaticMesh.h"
#include "Engine/StaticMeshActor.h"
#include "Engine/World.h"
#include "GameFramework/PlayerStart.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "UObject/ConstructorHelpers.h"

namespace
{
    struct FBlockSpec
    {
        FVector Center;
        FVector Size;
        FLinearColor Color;
    };

    const FLinearColor FloorGray(0.45f, 0.45f, 0.47f);
    const FLinearColor WallWhite(0.85f, 0.84f, 0.80f);
    const FLinearColor AccentTeal(0.0f, 0.808f, 0.788f); // site accent #00cec9
    const FLinearColor BedWhite(0.92f, 0.92f, 0.94f);
    const FLinearColor ExamBlue(0.55f, 0.70f, 0.90f);
    const FLinearColor TableWarm(0.60f, 0.50f, 0.40f);

    // A 30 m x 20 m ward slice: a central east-west corridor with two rooms on
    // each side. Interior walls leave door gaps into the corridor. There is no
    // ceiling on purpose — daylight is the cheapest way to keep every room
    // legible until real materials and interior lighting are authored.
    const FBlockSpec GBlockout[] =
    {
        // Floor. Top surface sits at z=0.
        { FVector(0.0, 0.0, -10.0), FVector(3000.0, 2000.0, 20.0), FloorGray },

        // Perimeter walls.
        { FVector(0.0, 1010.0, 175.0), FVector(3040.0, 20.0, 350.0), WallWhite },
        { FVector(0.0, -1010.0, 175.0), FVector(3040.0, 20.0, 350.0), WallWhite },
        { FVector(1510.0, 0.0, 175.0), FVector(20.0, 2040.0, 350.0), WallWhite },
        { FVector(-1510.0, 0.0, 175.0), FVector(20.0, 2040.0, 350.0), WallWhite },

        // North corridor wall, with door gaps at x=-750 and x=+750.
        { FVector(-1155.0, 200.0, 175.0), FVector(690.0, 20.0, 350.0), WallWhite },
        { FVector(0.0, 200.0, 175.0), FVector(1380.0, 20.0, 350.0), WallWhite },
        { FVector(1155.0, 200.0, 175.0), FVector(690.0, 20.0, 350.0), WallWhite },

        // South corridor wall, mirrored gaps.
        { FVector(-1155.0, -200.0, 175.0), FVector(690.0, 20.0, 350.0), WallWhite },
        { FVector(0.0, -200.0, 175.0), FVector(1380.0, 20.0, 350.0), WallWhite },
        { FVector(1155.0, -200.0, 175.0), FVector(690.0, 20.0, 350.0), WallWhite },

        // Cross walls splitting each side into two rooms.
        { FVector(0.0, 600.0, 175.0), FVector(20.0, 800.0, 350.0), WallWhite },
        { FVector(0.0, -600.0, 175.0), FVector(20.0, 800.0, 350.0), WallWhite },

        // Landmarks: reception desk (SW), patient bed (NW), exam table (NE),
        // education table (SE). Enough to orient by, nothing more.
        { FVector(-750.0, -600.0, 55.0), FVector(300.0, 120.0, 110.0), AccentTeal },
        { FVector(-750.0, 600.0, 40.0), FVector(220.0, 100.0, 80.0), BedWhite },
        { FVector(750.0, 600.0, 45.0), FVector(200.0, 90.0, 90.0), ExamBlue },
        { FVector(750.0, -600.0, 50.0), FVector(240.0, 140.0, 100.0), TableWarm },
    };
}

ACardioBlockoutGameMode::ACardioBlockoutGameMode()
{
    DefaultPawnClass = ACardioBlockoutCharacter::StaticClass();

    static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeFinder(TEXT("/Engine/BasicShapes/Cube.Cube"));
    BlockMesh = CubeFinder.Object;

    static ConstructorHelpers::FObjectFinder<UMaterialInterface> MaterialFinder(TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));
    BlockMaterial = MaterialFinder.Object;
}

void ACardioBlockoutGameMode::InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage)
{
    Super::InitGame(MapName, Options, ErrorMessage);

    UWorld* World = GetWorld();
    if (!World)
    {
        return;
    }

    if (!BlockMesh || !BlockMaterial)
    {
        UE_LOG(LogCardioHospital, Error,
            TEXT("Blockout primitives failed to load; the ward cannot be built. The packaged app will show an empty map."));
        return;
    }

    for (const FBlockSpec& Spec : GBlockout)
    {
        SpawnBlock(*World, Spec.Center, Spec.Size, Spec.Color);
    }

    SpawnLighting(*World);

    // Spawned before login so the default ChoosePlayerStart finds it. The
    // learner starts in the reception lobby facing the corridor.
    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    World->SpawnActor<APlayerStart>(FVector(-1200.0, -600.0, 110.0), FRotator::ZeroRotator, Params);
}

AStaticMeshActor* ACardioBlockoutGameMode::SpawnBlock(UWorld& World, const FVector& Center, const FVector& Size, const FLinearColor& Color) const
{
    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    AStaticMeshActor* Block = World.SpawnActor<AStaticMeshActor>(Center, FRotator::ZeroRotator, Params);
    if (!Block)
    {
        return nullptr;
    }

    UStaticMeshComponent* Mesh = Block->GetStaticMeshComponent();
    // Runtime-spawned meshes must be movable before the mesh is assigned;
    // static mobility rejects dynamic data changes after spawn.
    Mesh->SetMobility(EComponentMobility::Movable);
    Mesh->SetStaticMesh(BlockMesh);
    Block->SetActorScale3D(Size / 100.f); // the engine cube is 100 cm

    UMaterialInstanceDynamic* Tint = UMaterialInstanceDynamic::Create(BlockMaterial, Mesh);
    Tint->SetVectorParameterValue(TEXT("Color"), Color);
    Mesh->SetMaterial(0, Tint);
    return Block;
}

void ACardioBlockoutGameMode::SpawnLighting(UWorld& World) const
{
    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
    AActor* Rig = World.SpawnActor<AActor>(FVector::ZeroVector, FRotator::ZeroRotator, Params);
    if (!Rig)
    {
        return;
    }

    USceneComponent* Root = NewObject<USceneComponent>(Rig, TEXT("Root"));
    Rig->SetRootComponent(Root);
    Root->RegisterComponent();

    // Sun, atmosphere, and a real-time sky light. With the ward open to the
    // sky, this trio lights every room without any authored interior lights.
    UDirectionalLightComponent* Sun = NewObject<UDirectionalLightComponent>(Rig, TEXT("Sun"));
    Sun->SetupAttachment(Root);
    Sun->SetMobility(EComponentMobility::Movable);
    Sun->SetRelativeRotation(FRotator(-50.f, 30.f, 0.f));
    Sun->RegisterComponent();

    USkyAtmosphereComponent* Atmosphere = NewObject<USkyAtmosphereComponent>(Rig, TEXT("Atmosphere"));
    Atmosphere->SetupAttachment(Root);
    Atmosphere->RegisterComponent();

    USkyLightComponent* SkyAmbient = NewObject<USkyLightComponent>(Rig, TEXT("SkyAmbient"));
    SkyAmbient->SetupAttachment(Root);
    SkyAmbient->SetMobility(EComponentMobility::Movable);
    SkyAmbient->bRealTimeCapture = true;
    SkyAmbient->RegisterComponent();
}
