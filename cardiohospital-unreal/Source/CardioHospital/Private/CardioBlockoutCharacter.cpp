#include "CardioBlockoutCharacter.h"

#include "CardioBlockoutGameMode.h"
#include "CardioBlockoutHUD.h"
#include "CardioBlockoutNPC.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/InputComponent.h"
#include "Engine/World.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/Controller.h"
#include "GameFramework/PlayerController.h"
#include "Kismet/GameplayStatics.h"

namespace
{
    constexpr float InteractionRangeCm = 320.f;
    constexpr float ArriveRadiusCm = 90.f;
    constexpr float ConversationStandOffCm = 180.f;
    // The temporary Ready Player Me attending is about 188 cm tall; 170 cm is
    // a reasonable face target until final MetaHuman-native medical art lands.
    constexpr float AttendingFaceHeightCm = 170.f;
    // A blocked guided walk must stop rather than silently discard a waypoint
    // and send the learner through a wall or piece of furniture.
    constexpr float WalkStallLimitSeconds = 2.0f;

    // Number-key station 2 historically targeted the center furniture cluster.
    // Normalize that command to an authored clear-floor anchor in the west
    // aisle, close enough to the presentation patient for deterministic facing.
    const FVector LegacyExamRoom3Station(-750.f, 520.f, 88.f);
    const FVector ExamRoom3PatientArrival(-1080.f, 700.f, 88.f);
    // Enter and leave Exam Room 3 orthogonally: first clear the doorway, then
    // move into the west aisle, then approach the patient. The previous single
    // diagonal from the doorway to the patient anchor cut across the jamb /
    // furniture envelope and could collision-stall while still inside the room.
    const FVector ExamRoom3InsideDoor(-750.f, 320.f, 88.f);
    const FVector ExamRoom3WestAisleEntry(-1080.f, 320.f, 88.f);
    const FString EncounterPatientNpcId = TEXT("encounter-patient");
}

ACardioBlockoutCharacter::ACardioBlockoutCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    GetCapsuleComponent()->InitCapsuleSize(42.f, 88.f);

    bUseControllerRotationPitch = false;
    bUseControllerRotationYaw = true;
    bUseControllerRotationRoll = false;

    Camera = CreateDefaultSubobject<UCameraComponent>(TEXT("Camera"));
    Camera->SetupAttachment(GetCapsuleComponent());
    // Capsule center is 88 cm; +56 puts the eye at 144 cm, conversation
    // height with Patel's face rather than looking down on his hair.
    Camera->SetRelativeLocation(FVector(0.f, 0.f, 56.f));
    Camera->bUsePawnControlRotation = true;

    GetCharacterMovement()->MaxWalkSpeed = 260.f;
    GetCharacterMovement()->BrakingDecelerationWalking = 800.f;
}

void ACardioBlockoutCharacter::ApplyClinicInputMode()
{
    if (APlayerController* Controller = Cast<APlayerController>(GetController()))
    {
        Controller->bShowMouseCursor = true;
        Controller->bEnableClickEvents = true;
        Controller->bEnableMouseOverEvents = true;
        FInputModeGameAndUI InputMode;
        InputMode.SetHideCursorDuringCapture(false);
        InputMode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
        Controller->SetInputMode(InputMode);
    }
}

void ACardioBlockoutCharacter::BeginPlay()
{
    Super::BeginPlay();
    ApplyClinicInputMode();
}

void ACardioBlockoutCharacter::PossessedBy(AController* NewController)
{
    Super::PossessedBy(NewController);
    ApplyClinicInputMode();
}

void ACardioBlockoutCharacter::Tick(const float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);

    if (ACardioBlockoutGameMode* Mode = GetWorld()->GetAuthGameMode<ACardioBlockoutGameMode>())
    {
        Mode->NotifyLearnerLocation(GetActorLocation());
    }

    AdvanceGuidedWalk();

    FocusedNpc = nullptr;
    const FVector Start = Camera->GetComponentLocation();
    const FVector End = Start + Camera->GetForwardVector() * InteractionRangeCm;
    FCollisionQueryParams Params(FName(TEXT("CardioInteraction")), false, this);
    FHitResult Hit;
    if (GetWorld()->LineTraceSingleByChannel(Hit, Start, End, ECC_Visibility, Params))
    {
        FocusedNpc = Cast<ACardioBlockoutNPC>(Hit.GetActor());
    }
}

void ACardioBlockoutCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    PlayerInputComponent->BindAxis(TEXT("MoveForward"), this, &ACardioBlockoutCharacter::MoveForward);
    PlayerInputComponent->BindAxis(TEXT("MoveRight"), this, &ACardioBlockoutCharacter::MoveRight);
    PlayerInputComponent->BindAxis(TEXT("Turn"), this, &ACardioBlockoutCharacter::Turn);
    PlayerInputComponent->BindAxis(TEXT("LookUp"), this, &ACardioBlockoutCharacter::LookUp);
    PlayerInputComponent->BindAction(TEXT("Interact"), IE_Pressed, this, &ACardioBlockoutCharacter::Interact);
    PlayerInputComponent->BindAction(TEXT("ClickGo"), IE_Pressed, this, &ACardioBlockoutCharacter::ClickGo);
    PlayerInputComponent->BindAction(TEXT("LookHold"), IE_Pressed, this, &ACardioBlockoutCharacter::LookHoldPressed);
    PlayerInputComponent->BindAction(TEXT("LookHold"), IE_Released, this, &ACardioBlockoutCharacter::LookHoldReleased);
    PlayerInputComponent->BindAction(TEXT("ChooseAction1"), IE_Pressed, this, &ACardioBlockoutCharacter::ChooseAction1);
    PlayerInputComponent->BindAction(TEXT("ChooseAction2"), IE_Pressed, this, &ACardioBlockoutCharacter::ChooseAction2);
    PlayerInputComponent->BindAction(TEXT("ChooseAction3"), IE_Pressed, this, &ACardioBlockoutCharacter::ChooseAction3);
    PlayerInputComponent->BindAction(TEXT("ChooseAction4"), IE_Pressed, this, &ACardioBlockoutCharacter::ChooseAction4);
    PlayerInputComponent->BindAction(TEXT("ChooseAction5"), IE_Pressed, this, &ACardioBlockoutCharacter::ChooseAction5);
    PlayerInputComponent->BindAction(TEXT("ChooseAction6"), IE_Pressed, this, &ACardioBlockoutCharacter::ChooseAction6);
    PlayerInputComponent->BindAction(TEXT("ChooseAction7"), IE_Pressed, this, &ACardioBlockoutCharacter::ChooseAction7);
    PlayerInputComponent->BindAction(TEXT("ChooseAction8"), IE_Pressed, this, &ACardioBlockoutCharacter::ChooseAction8);
    PlayerInputComponent->BindAction(TEXT("ChooseAction9"), IE_Pressed, this, &ACardioBlockoutCharacter::ChooseAction9);
}

bool ACardioBlockoutCharacter::IsInExamRoom3() const
{
    return ACardioBlockoutGameMode::IsExamRoom3Location(GetActorLocation());
}

bool ACardioBlockoutCharacter::IsInExamRoom() const
{
    return ACardioBlockoutGameMode::IsExamRoom3Location(GetActorLocation())
        || ACardioBlockoutGameMode::IsRoom1Location(GetActorLocation());
}

bool ACardioBlockoutCharacter::IsInEducationRoom() const
{
    return ACardioBlockoutGameMode::IsEducationRoomLocation(GetActorLocation());
}

void ACardioBlockoutCharacter::MoveForward(const float Value)
{
    if (Value != 0.f)
    {
        CancelGuidedWalk();
        AddMovementInput(GetActorForwardVector(), Value);
    }
}

void ACardioBlockoutCharacter::MoveRight(const float Value)
{
    if (Value != 0.f)
    {
        CancelGuidedWalk();
        AddMovementInput(GetActorRightVector(), Value);
    }
}

void ACardioBlockoutCharacter::Turn(const float Value)
{
    if (bLookHeld && Value != 0.f)
    {
        AddControllerYawInput(Value);
    }
}

void ACardioBlockoutCharacter::LookUp(const float Value)
{
    if (bLookHeld && Value != 0.f)
    {
        AddControllerPitchInput(Value);
    }
}

void ACardioBlockoutCharacter::LookHoldPressed()
{
    bLookHeld = true;
}

void ACardioBlockoutCharacter::LookHoldReleased()
{
    bLookHeld = false;
}

void ACardioBlockoutCharacter::Interact()
{
    if (ACardioBlockoutGameMode* Mode = GetWorld()->GetAuthGameMode<ACardioBlockoutGameMode>())
    {
        Mode->HandleInteract(*this, FocusedNpc.Get());
    }
}

void ACardioBlockoutCharacter::ClickGo()
{
    APlayerController* Controller = Cast<APlayerController>(GetController());
    ACardioBlockoutHUD* Hud = Controller ? Cast<ACardioBlockoutHUD>(Controller->GetHUD()) : nullptr;
    if (!Controller || (Hud && Hud->IsPanelOpen()))
    {
        return;
    }

    float MouseX = 0.f;
    float MouseY = 0.f;
    if (!Controller->GetMousePosition(MouseX, MouseY))
    {
        return;
    }

    FVector WorldOrigin;
    FVector WorldDirection;
    if (!Controller->DeprojectScreenPositionToWorld(MouseX, MouseY, WorldOrigin, WorldDirection))
    {
        return;
    }

    FHitResult Hit;
    const FVector End = WorldOrigin + WorldDirection * 8000.f;
    FCollisionQueryParams Params(FName(TEXT("CardioClickGo")), false, this);
    if (!GetWorld()->LineTraceSingleByChannel(Hit, WorldOrigin, End, ECC_Visibility, Params))
    {
        return;
    }

    if (ACardioBlockoutNPC* Npc = Cast<ACardioBlockoutNPC>(Hit.GetActor()))
    {
        FocusedNpc = Npc;
        WalkTo(Npc->GetActorLocation() + Npc->GetActorForwardVector() * ConversationStandOffCm, true);
        return;
    }

    FVector Dest = Hit.ImpactPoint;
    Dest.Z = GetActorLocation().Z;
    WalkTo(Dest, false);
}

void ACardioBlockoutCharacter::WalkTo(const FVector& Destination, const bool bInteractWhenThere)
{
    // Guided movement only positions and faces the learner. Interaction stays
    // explicit so an NPC can turn toward the learner and the learner gets a
    // real opportunity to press E instead of the conversation auto-firing.
    (void)bInteractWhenThere;
    bInteractOnArrival = false;

    FVector AuthoredDestination = Destination;
    if (Destination.Equals(LegacyExamRoom3Station, 1.f))
    {
        AuthoredDestination = FVector(
            ExamRoom3PatientArrival.X,
            ExamRoom3PatientArrival.Y,
            Destination.Z);
        FocusedNpc = nullptr;
    }
    BuildWalkPath(AuthoredDestination);
}

void ACardioBlockoutCharacter::CancelGuidedWalk()
{
    GuidedPath.Reset();
    bInteractOnArrival = false;
    WalkStallSeconds = 0.f;
}

void ACardioBlockoutCharacter::LookAtActorFace(const AActor* Target)
{
    if (!Target || !Controller || !Camera)
    {
        return;
    }

    const FVector Face = Target->GetActorLocation() + FVector(0.f, 0.f, AttendingFaceHeightCm);
    const FVector Eye = Camera->GetComponentLocation();
    FRotator Facing = (Face - Eye).Rotation();
    Facing.Roll = 0.f;
    Controller->SetControlRotation(Facing);
}

void ACardioBlockoutCharacter::FaceNpc(AActor* Npc)
{
    if (!Npc)
    {
        return;
    }

    // Never teleport the learner for conversation framing. The character
    // reaches the interaction point through collision-aware movement, then
    // both sides turn to face one another in place.
    LookAtActorFace(Npc);
    if (ACardioBlockoutNPC* Attending = Cast<ACardioBlockoutNPC>(Npc))
    {
        Attending->FaceToward(GetActorLocation());
    }
}

void ACardioBlockoutCharacter::AdvanceGuidedWalk()
{
    if (GuidedPath.Num() == 0)
    {
        return;
    }

    FVector To = GuidedPath[0] - GetActorLocation();
    To.Z = 0.f;
    const UCharacterMovementComponent* Movement = GetCharacterMovement();
    const bool bStalled = Movement && Movement->Velocity.Size2D() < 8.f;
    if (bStalled)
    {
        WalkStallSeconds += GetWorld() ? GetWorld()->GetDeltaSeconds() : 0.016f;
    }
    else
    {
        WalkStallSeconds = 0.f;
    }

    // A collision stall means the authored path needs attention. Do not skip
    // the blocked waypoint: skipping is what can turn a safe doorway path into
    // an unnatural wall/furniture cut.
    if (WalkStallSeconds >= WalkStallLimitSeconds)
    {
        CancelGuidedWalk();
        return;
    }

    if (To.Size() <= ArriveRadiusCm)
    {
        GuidedPath.RemoveAt(0);
        WalkStallSeconds = 0.f;
        if (GuidedPath.Num() == 0)
        {
            if (!FocusedNpc.IsValid())
            {
                TArray<AActor*> Npcs;
                UGameplayStatics::GetAllActorsOfClass(GetWorld(), ACardioBlockoutNPC::StaticClass(), Npcs);
                float Best = 360.f;
                for (AActor* Actor : Npcs)
                {
                    ACardioBlockoutNPC* Candidate = Cast<ACardioBlockoutNPC>(Actor);
                    if (!Candidate)
                    {
                        continue;
                    }
                    const float Dist = FVector::Dist2D(GetActorLocation(), Candidate->GetActorLocation());
                    if (Dist >= Best)
                    {
                        continue;
                    }

                    // In the assigned exam room, the authored station means
                    // "approach the patient", not "pick whichever NPC happens
                    // to be first in actor iteration order". Parent remains
                    // independently clickable/approachable.
                    if (IsInExamRoom3()
                        && Candidate->GetNpcId() == EncounterPatientNpcId)
                    {
                        FocusedNpc = Candidate;
                        break;
                    }

                    Best = Dist;
                    FocusedNpc = Candidate;
                }
            }
            if (FocusedNpc.IsValid())
            {
                FaceNpc(FocusedNpc.Get());
            }
            if (bInteractOnArrival)
            {
                bInteractOnArrival = false;
                Interact();
            }
        }
        return;
    }

    const FVector Direction = To.GetSafeNormal();
    AddMovementInput(Direction, 1.f);
    if (!bLookHeld)
    {
        if (AController* WalkController = GetController())
        {
            FRotator Facing = Direction.Rotation();
            Facing.Pitch = WalkController->GetControlRotation().Pitch;
            Facing.Roll = 0.f;
            WalkController->SetControlRotation(Facing);
        }
    }
}

bool ACardioBlockoutCharacter::IsIndoorsRoom(const FVector& Location)
{
    return FMath::Abs(Location.Y) > 220.f;
}

float ACardioBlockoutCharacter::DoorXFor(const FVector& Location)
{
    return Location.X < 0.f ? -750.f : 750.f;
}

void ACardioBlockoutCharacter::BuildWalkPath(const FVector& Destination)
{
    GuidedPath.Reset();
    const FVector From = GetActorLocation();
    const bool bFromRoom = IsIndoorsRoom(From);
    const bool bDestRoom = IsIndoorsRoom(Destination);
    const bool bSameSide = (From.Y > 0.f) == (Destination.Y > 0.f);
    const bool bSameWing = (From.X < 0.f) == (Destination.X < 0.f);
    const bool bSameRoom = bFromRoom && bDestRoom && bSameSide && bSameWing;
    const bool bFromExamRoom3 = ACardioBlockoutGameMode::IsExamRoom3Location(From);
    const bool bToExamRoom3Patient = Destination.Equals(
        FVector(ExamRoom3PatientArrival.X, ExamRoom3PatientArrival.Y, Destination.Z),
        1.f);

    // Exam Room 3 needs an authored orthogonal aisle route because its bed,
    // chairs and jamb make the old doorway-to-patient diagonal collision-prone.
    // No waypoint may be skipped on a stall; these points keep the capsule in
    // known clear floor on both ingress and egress.
    if (bFromRoom && !bSameRoom)
    {
        if (bFromExamRoom3)
        {
            GuidedPath.Add(FVector(ExamRoom3WestAisleEntry.X, ExamRoom3WestAisleEntry.Y, From.Z));
            GuidedPath.Add(FVector(ExamRoom3InsideDoor.X, ExamRoom3InsideDoor.Y, From.Z));
        }
        GuidedPath.Add(FVector(DoorXFor(From), From.Y > 0.f ? 160.f : -160.f, From.Z));
    }
    if (bDestRoom && !bSameRoom)
    {
        GuidedPath.Add(FVector(DoorXFor(Destination), Destination.Y > 0.f ? 160.f : -160.f, From.Z));
        if (bToExamRoom3Patient)
        {
            GuidedPath.Add(FVector(ExamRoom3InsideDoor.X, ExamRoom3InsideDoor.Y, From.Z));
            GuidedPath.Add(FVector(ExamRoom3WestAisleEntry.X, ExamRoom3WestAisleEntry.Y, From.Z));
        }
    }
    GuidedPath.Add(FVector(Destination.X, Destination.Y, From.Z));
}

void ACardioBlockoutCharacter::ChooseActionIndex(const int32 ZeroBasedIndex)
{
    if (ACardioBlockoutGameMode* Mode = GetWorld()->GetAuthGameMode<ACardioBlockoutGameMode>())
    {
        Mode->HandleChooseAction(ZeroBasedIndex);
    }
}

void ACardioBlockoutCharacter::ChooseAction1() { ChooseActionIndex(0); }
void ACardioBlockoutCharacter::ChooseAction2() { ChooseActionIndex(1); }
void ACardioBlockoutCharacter::ChooseAction3() { ChooseActionIndex(2); }
void ACardioBlockoutCharacter::ChooseAction4() { ChooseActionIndex(3); }
void ACardioBlockoutCharacter::ChooseAction5() { ChooseActionIndex(4); }
void ACardioBlockoutCharacter::ChooseAction6() { ChooseActionIndex(5); }
void ACardioBlockoutCharacter::ChooseAction7() { ChooseActionIndex(6); }
void ACardioBlockoutCharacter::ChooseAction8() { ChooseActionIndex(7); }
void ACardioBlockoutCharacter::ChooseAction9() { ChooseActionIndex(8); }