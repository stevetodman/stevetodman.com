#include "CardioClinicPolish.h"

#include "CardioHospital.h"
#include "CardioBlockoutGameMode.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/StaticMesh.h"
#include "Engine/StaticMeshActor.h"
#include "Engine/World.h"
#include "EngineUtils.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"
#include "TimerManager.h"
#include "UObject/UObjectGlobals.h"

namespace
{
    const FName ClinicPolishTag(TEXT("CardioClinicPolish"));

    const FLinearColor EquipmentGraphite(0.055f, 0.065f, 0.075f);
    const FLinearColor EquipmentScreen(0.055f, 0.30f, 0.43f);
    const FLinearColor EquipmentScreenGlow(0.13f, 0.58f, 0.67f);
    const FLinearColor CounterQuartz(0.72f, 0.77f, 0.79f);
    const FLinearColor CabinetWhite(0.84f, 0.88f, 0.89f);
    const FLinearColor CabinetShadow(0.34f, 0.39f, 0.41f);
    const FLinearColor ClinicalTeal(0.00f, 0.47f, 0.48f);
    const FLinearColor ClinicalBlue(0.12f, 0.28f, 0.38f);
    const FLinearColor FrostedGlass(0.72f, 0.87f, 0.90f);
    const FLinearColor WarmPaper(0.93f, 0.91f, 0.84f);
    const FLinearColor TeamCarpet(0.12f, 0.24f, 0.27f);
    const FLinearColor TeamCarpetBorder(0.05f, 0.12f, 0.14f);
    const FLinearColor OutletWhite(0.88f, 0.90f, 0.91f);
    const FLinearColor OxygenGreen(0.12f, 0.55f, 0.34f);
    const FLinearColor SuctionYellow(0.78f, 0.63f, 0.10f);
    const FLinearColor CallRed(0.72f, 0.08f, 0.08f);

    FDelegateHandle PostWorldInitializationHandle;

    class FClinicPolishBuilder
    {
    public:
        FClinicPolishBuilder(
            UWorld& InWorld,
            UStaticMesh& InCube,
            UMaterialInterface& InBlockMaterial,
            UStaticMesh* InWallMonitor,
            UStaticMesh* InBaseboard)
            : World(InWorld)
            , Cube(InCube)
            , BlockMaterial(InBlockMaterial)
            , WallMonitor(InWallMonitor)
            , Baseboard(InBaseboard)
        {
        }

        AStaticMeshActor* SpawnMesh(
            UStaticMesh* MeshAsset,
            const FVector& Location,
            const FRotator& Rotation = FRotator::ZeroRotator,
            const FVector& Scale = FVector(1.f),
            const bool bCollision = false) const
        {
            if (!MeshAsset)
            {
                return nullptr;
            }

            FActorSpawnParameters Params;
            Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
            AStaticMeshActor* Actor = World.SpawnActor<AStaticMeshActor>(Location, Rotation, Params);
            if (!Actor)
            {
                return nullptr;
            }

            Actor->Tags.Add(ClinicPolishTag);
            UStaticMeshComponent* Mesh = Actor->GetStaticMeshComponent();
            Mesh->SetMobility(EComponentMobility::Movable);
            Mesh->SetStaticMesh(MeshAsset);
            Mesh->SetCollisionEnabled(bCollision
                ? ECollisionEnabled::QueryAndPhysics
                : ECollisionEnabled::NoCollision);
            Mesh->SetGenerateOverlapEvents(false);
            Actor->SetActorScale3D(Scale);
            return Actor;
        }

        AStaticMeshActor* SpawnBlock(
            const FVector& Center,
            const FVector& Size,
            const FLinearColor& Color,
            const FRotator& Rotation = FRotator::ZeroRotator,
            const bool bCollision = false) const
        {
            AStaticMeshActor* Actor = SpawnMesh(&Cube, Center, Rotation, Size / 100.f, bCollision);
            if (!Actor)
            {
                return nullptr;
            }

            UStaticMeshComponent* Mesh = Actor->GetStaticMeshComponent();
            UMaterialInstanceDynamic* Tint = UMaterialInstanceDynamic::Create(&BlockMaterial, Mesh);
            if (Tint)
            {
                Tint->SetVectorParameterValue(TEXT("Color"), Color);
                Mesh->SetMaterial(0, Tint);
            }
            return Actor;
        }

        FVector LocalPoint(const FVector& Origin, const float YawDegrees, const FVector& Local) const
        {
            return Origin + FRotator(0.f, YawDegrees, 0.f).RotateVector(Local);
        }

        void SpawnLocalBlock(
            const FVector& Origin,
            const float YawDegrees,
            const FVector& LocalCenter,
            const FVector& Size,
            const FLinearColor& Color) const
        {
            SpawnBlock(
                LocalPoint(Origin, YawDegrees, LocalCenter),
                Size,
                Color,
                FRotator(0.f, YawDegrees, 0.f));
        }

        void SpawnWorkstation(const FVector& SurfaceCenter, const float YawDegrees) const
        {
            // Compact 24-inch workstation: monitor, stand, keyboard, mouse,
            // and a readable cyan-on-navy clinical screen. All parts are
            // non-colliding so they cannot snag click-to-walk navigation.
            SpawnLocalBlock(SurfaceCenter, YawDegrees, FVector(0.f, 4.f, 3.f),
                FVector(28.f, 18.f, 3.f), EquipmentGraphite);
            SpawnLocalBlock(SurfaceCenter, YawDegrees, FVector(0.f, 4.f, 16.f),
                FVector(4.f, 4.f, 24.f), EquipmentGraphite);
            SpawnLocalBlock(SurfaceCenter, YawDegrees, FVector(0.f, 4.f, 39.f),
                FVector(56.f, 6.f, 36.f), EquipmentGraphite);
            SpawnLocalBlock(SurfaceCenter, YawDegrees, FVector(0.f, 0.4f, 39.f),
                FVector(49.f, 1.6f, 29.f), EquipmentScreen);
            SpawnLocalBlock(SurfaceCenter, YawDegrees, FVector(-10.f, -0.6f, 42.f),
                FVector(22.f, 0.8f, 2.f), EquipmentScreenGlow);
            SpawnLocalBlock(SurfaceCenter, YawDegrees, FVector(14.f, -0.6f, 34.f),
                FVector(12.f, 0.8f, 2.f), EquipmentScreenGlow);
            SpawnLocalBlock(SurfaceCenter, YawDegrees, FVector(-3.f, -32.f, 2.f),
                FVector(45.f, 18.f, 2.5f), EquipmentGraphite);
            SpawnLocalBlock(SurfaceCenter, YawDegrees, FVector(31.f, -31.f, 2.f),
                FVector(7.f, 11.f, 3.f), EquipmentGraphite);
        }

        void SpawnFramedBoard(
            const FVector& Center,
            const FVector& Size,
            const FRotator& Rotation,
            const FVector& Inward,
            const FLinearColor& FaceColor) const
        {
            SpawnBlock(Center, Size + FVector(10.f, 2.f, 10.f), EquipmentGraphite, Rotation);
            SpawnBlock(Center + Inward * 2.2f, Size, FaceColor, Rotation);
        }

        void SpawnClinicalBoardDetails(
            const FVector& Center,
            const float YawDegrees,
            const FVector& Inward) const
        {
            const FRotator Rotation(0.f, YawDegrees, 0.f);
            SpawnFramedBoard(Center, FVector(220.f, 4.f, 112.f), Rotation, Inward, OutletWhite);

            const FVector Face = Center + Inward * 4.5f;
            const FVector Right = Rotation.RotateVector(FVector(1.f, 0.f, 0.f));
            SpawnBlock(Face + Right * -58.f + FVector(0.f, 0.f, 20.f),
                FVector(64.f, 1.4f, 7.f), ClinicalTeal, Rotation);
            SpawnBlock(Face + Right * 35.f + FVector(0.f, 0.f, 20.f),
                FVector(76.f, 1.4f, 7.f), ClinicalBlue, Rotation);
            SpawnBlock(Face + Right * -70.f + FVector(0.f, 0.f, -17.f),
                FVector(36.f, 1.4f, 28.f), WarmPaper, Rotation);
            SpawnBlock(Face + Right * -24.f + FVector(0.f, 0.f, -17.f),
                FVector(36.f, 1.4f, 28.f), FrostedGlass, Rotation);
            SpawnBlock(Face + Right * 22.f + FVector(0.f, 0.f, -17.f),
                FVector(36.f, 1.4f, 28.f), WarmPaper, Rotation);
            SpawnBlock(Face + Right * 68.f + FVector(0.f, 0.f, -17.f),
                FVector(36.f, 1.4f, 28.f), FrostedGlass, Rotation);
        }

        void SpawnHeadwall(
            const FVector& Center,
            const float YawDegrees,
            const FVector& Inward) const
        {
            const FRotator Rotation(0.f, YawDegrees, 0.f);
            SpawnBlock(Center, FVector(520.f, 8.f, 138.f), CabinetWhite, Rotation);
            SpawnBlock(Center + Inward * 4.5f + FVector(0.f, 0.f, -48.f),
                FVector(500.f, 3.f, 10.f), ClinicalTeal, Rotation);

            const FVector Right = Rotation.RotateVector(FVector(1.f, 0.f, 0.f));
            const FVector Face = Center + Inward * 5.5f + FVector(0.f, 0.f, -18.f);
            SpawnBlock(Face + Right * -175.f, FVector(28.f, 3.f, 28.f), OutletWhite, Rotation);
            SpawnBlock(Face + Right * -122.f, FVector(24.f, 3.f, 24.f), OxygenGreen, Rotation);
            SpawnBlock(Face + Right * -76.f, FVector(24.f, 3.f, 24.f), SuctionYellow, Rotation);
            SpawnBlock(Face + Right * 166.f, FVector(24.f, 3.f, 24.f), CallRed, Rotation);
            SpawnBlock(Center + Inward * 6.f + Right * 155.f + FVector(0.f, 0.f, 34.f),
                FVector(80.f, 3.f, 24.f), FrostedGlass, Rotation);
        }

        void SpawnSinkStation(const FVector& Center, const float YawDegrees) const
        {
            const FRotator Rotation(0.f, YawDegrees, 0.f);
            SpawnBlock(Center + FVector(0.f, 0.f, 41.f),
                FVector(230.f, 62.f, 82.f), CabinetWhite, Rotation);
            SpawnBlock(Center + FVector(0.f, 0.f, 84.f),
                FVector(238.f, 68.f, 5.f), CounterQuartz, Rotation);
            SpawnLocalBlock(Center, YawDegrees, FVector(-22.f, 0.f, 88.f),
                FVector(78.f, 42.f, 4.f), CabinetShadow);
            SpawnLocalBlock(Center, YawDegrees, FVector(-22.f, 8.f, 105.f),
                FVector(5.f, 5.f, 34.f), EquipmentGraphite);
            SpawnLocalBlock(Center, YawDegrees, FVector(-22.f, -5.f, 122.f),
                FVector(5.f, 28.f, 5.f), EquipmentGraphite);
            SpawnLocalBlock(Center, YawDegrees, FVector(72.f, 22.f, 139.f),
                FVector(34.f, 14.f, 50.f), FrostedGlass);
            SpawnLocalBlock(Center, YawDegrees, FVector(72.f, 14.f, 159.f),
                FVector(17.f, 4.f, 4.f), ClinicalTeal);
        }

        void SpawnEchoConsole(const FVector& Center, const float YawDegrees) const
        {
            const FRotator Rotation(0.f, YawDegrees, 0.f);
            SpawnBlock(Center + FVector(0.f, 0.f, 42.f),
                FVector(150.f, 72.f, 84.f), CabinetWhite, Rotation);
            SpawnBlock(Center + FVector(0.f, 0.f, 86.f),
                FVector(156.f, 78.f, 5.f), CounterQuartz, Rotation);
            SpawnWorkstation(Center + FVector(0.f, 0.f, 88.f), YawDegrees);
            SpawnLocalBlock(Center, YawDegrees, FVector(-56.f, 28.f, 123.f),
                FVector(10.f, 10.f, 66.f), EquipmentGraphite);
            SpawnLocalBlock(Center, YawDegrees, FVector(-56.f, 28.f, 157.f),
                FVector(40.f, 8.f, 8.f), EquipmentGraphite);
            SpawnLocalBlock(Center, YawDegrees, FVector(-74.f, 28.f, 146.f),
                FVector(9.f, 9.f, 28.f), FrostedGlass);
            SpawnLocalBlock(Center, YawDegrees, FVector(58.f, 30.f, 104.f),
                FVector(22.f, 8.f, 34.f), ClinicalTeal);
        }

        void SpawnRoomBaseboards() const
        {
            if (!Baseboard)
            {
                return;
            }

            SpawnMesh(Baseboard, FVector(0.f, 994.f, 0.f), FRotator::ZeroRotator, FVector(29.7f, 1.f, 1.f));
            SpawnMesh(Baseboard, FVector(0.f, -994.f, 0.f), FRotator(0.f, 180.f, 0.f), FVector(29.7f, 1.f, 1.f));
            SpawnMesh(Baseboard, FVector(1494.f, 0.f, 0.f), FRotator(0.f, 90.f, 0.f), FVector(19.7f, 1.f, 1.f));
            SpawnMesh(Baseboard, FVector(-1494.f, 0.f, 0.f), FRotator(0.f, -90.f, 0.f), FVector(19.7f, 1.f, 1.f));
        }

        UStaticMesh* GetWallMonitor() const
        {
            return WallMonitor;
        }

    private:
        UWorld& World;
        UStaticMesh& Cube;
        UMaterialInterface& BlockMaterial;
        UStaticMesh* WallMonitor = nullptr;
        UStaticMesh* Baseboard = nullptr;
    };

    bool HasPolishActors(UWorld& World)
    {
        for (TActorIterator<AActor> It(&World); It; ++It)
        {
            if (It->ActorHasTag(ClinicPolishTag))
            {
                return true;
            }
        }
        return false;
    }

    void SpawnClinicPolish(const TWeakObjectPtr<UWorld> WeakWorld)
    {
        UWorld* World = WeakWorld.Get();
        if (!World || !World->IsGameWorld()
            || !Cast<ACardioBlockoutGameMode>(World->GetAuthGameMode())
            || HasPolishActors(*World))
        {
            return;
        }

        UStaticMesh* Cube = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube"));
        UMaterialInterface* BlockMaterial = LoadObject<UMaterialInterface>(
            nullptr,
            TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial"));
        if (!Cube || !BlockMaterial)
        {
            UE_LOG(LogCardioHospital, Error,
                TEXT("Clinic polish could not load the cooked cube and material; skipping the visual pass."));
            return;
        }

        UStaticMesh* WallMonitor = LoadObject<UStaticMesh>(
            nullptr,
            TEXT("/Game/Environment/Clinic/SM_WallMonitor.SM_WallMonitor"));
        UStaticMesh* Baseboard = LoadObject<UStaticMesh>(
            nullptr,
            TEXT("/Game/Environment/Clinic/SM_Baseboard.SM_Baseboard"));

        FClinicPolishBuilder Builder(*World, *Cube, *BlockMaterial, WallMonitor, Baseboard);

        // Team room: a darker acoustic inset grounds the meeting zone, while
        // paired workstations and a task board make it read as an active
        // cardiology workroom instead of a furnished empty box.
        Builder.SpawnBlock(FVector(750.f, 650.f, 1.2f), FVector(600.f, 560.f, 2.f), TeamCarpet);
        Builder.SpawnBlock(FVector(750.f, 650.f, 2.1f), FVector(570.f, 530.f, 0.8f), TeamCarpetBorder);
        Builder.SpawnWorkstation(FVector(675.f, 620.f, 78.f), 0.f);
        Builder.SpawnWorkstation(FVector(825.f, 620.f, 78.f), 0.f);
        Builder.SpawnClinicalBoardDetails(FVector(1486.f, 650.f, 192.f), 90.f, FVector(-1.f, 0.f, 0.f));

        // Exam rooms: continuous headwalls organize the existing monitor and
        // add recognizable gas, suction, call, outlet, and hand-wash cues.
        Builder.SpawnHeadwall(FVector(-750.f, 986.f, 164.f), 0.f, FVector(0.f, -1.f, 0.f));
        Builder.SpawnSinkStation(FVector(-1458.f, 760.f, 0.f), 90.f);
        Builder.SpawnHeadwall(FVector(-750.f, -986.f, 164.f), 180.f, FVector(0.f, 1.f, 0.f));
        Builder.SpawnSinkStation(FVector(-1458.f, -760.f, 0.f), 90.f);

        // Education / ECG-echo: a dedicated echo console, teaching board, and
        // secondary display make the diagnostic station legible at a glance.
        Builder.SpawnEchoConsole(FVector(1418.f, -700.f, 0.f), -90.f);
        Builder.SpawnClinicalBoardDetails(FVector(1486.f, -480.f, 192.f), 90.f, FVector(-1.f, 0.f, 0.f));
        if (UStaticMesh* Monitor = Builder.GetWallMonitor())
        {
            Builder.SpawnMesh(Monitor, FVector(1290.f, -430.f, 148.f), FRotator(0.f, -90.f, 0.f), FVector(0.78f));
        }

        // Corridor hand-hygiene dispensers repeat at each doorway and serve as
        // small-scale landmarks without narrowing the walkable openings.
        const FVector Dispensers[] = {
            FVector(-620.f, 178.f, 132.f),
            FVector(620.f, 178.f, 132.f),
            FVector(-620.f, -178.f, 132.f),
            FVector(620.f, -178.f, 132.f),
        };
        for (const FVector& Center : Dispensers)
        {
            const bool bNorth = Center.Y > 0.f;
            Builder.SpawnBlock(Center, FVector(26.f, 8.f, 44.f), CabinetWhite);
            Builder.SpawnBlock(Center + FVector(0.f, bNorth ? -5.f : 5.f, -12.f),
                FVector(15.f, 4.f, 6.f), ClinicalTeal);
        }

        Builder.SpawnRoomBaseboards();
        UE_LOG(LogCardioHospital, Log, TEXT("Clinic polish pass spawned workstations, headwalls, sinks, and diagnostic fixtures."));
    }

    void OnPostWorldInitialization(UWorld* World, const UWorld::InitializationValues InitializationValues)
    {
        (void)InitializationValues;
        if (!World || !World->IsGameWorld())
        {
            return;
        }

        // The ward itself is created by ACardioBlockoutGameMode::InitGame.
        // Deferring one tick ensures these details layer over that geometry
        // rather than racing the room shell during world initialization.
        World->GetTimerManager().SetTimerForNextTick(
            FTimerDelegate::CreateStatic(&SpawnClinicPolish, TWeakObjectPtr<UWorld>(World)));
    }
}

namespace CardioClinicPolish
{
    void RegisterWorldHook()
    {
        if (!PostWorldInitializationHandle.IsValid())
        {
            PostWorldInitializationHandle = FWorldDelegates::OnPostWorldInitialization.AddStatic(
                &OnPostWorldInitialization);
        }
    }

    void UnregisterWorldHook()
    {
        if (PostWorldInitializationHandle.IsValid())
        {
            FWorldDelegates::OnPostWorldInitialization.Remove(PostWorldInitializationHandle);
            PostWorldInitializationHandle.Reset();
        }
    }
}
