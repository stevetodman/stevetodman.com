#include "CardioBlockoutCharacter.h"

#include "CardioBlockoutGameMode.h"
#include "CardioBlockoutNPC.h"
#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/InputComponent.h"
#include "Engine/World.h"
#include "GameFramework/CharacterMovementComponent.h"

namespace
{
    // Conversation distance: close enough to require walking up to someone.
    constexpr float InteractionRangeCm = 320.f;
}

ACardioBlockoutCharacter::ACardioBlockoutCharacter()
{
    // Ticks only to refresh the interaction focus trace.
    PrimaryActorTick.bCanEverTick = true;

    GetCapsuleComponent()->InitCapsuleSize(42.f, 96.f);

    // The pawn yaws with the mouse; pitch lives on the camera alone so the
    // capsule never tilts.
    bUseControllerRotationPitch = false;
    bUseControllerRotationYaw = true;
    bUseControllerRotationRoll = false;

    Camera = CreateDefaultSubobject<UCameraComponent>(TEXT("Camera"));
    Camera->SetupAttachment(GetCapsuleComponent());
    // Standing adult eye height against the 96 cm half-height capsule.
    Camera->SetRelativeLocation(FVector(0.f, 0.f, 60.f));
    Camera->bUsePawnControlRotation = true;

    // An unhurried clinical walking pace, not a shooter sprint.
    GetCharacterMovement()->MaxWalkSpeed = 300.f;
}

void ACardioBlockoutCharacter::Tick(const float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);

    if (ACardioBlockoutGameMode* Mode = GetWorld()->GetAuthGameMode<ACardioBlockoutGameMode>())
    {
        Mode->NotifyLearnerLocation(GetActorLocation());
    }

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

    // Legacy bindings, mapped in Config/DefaultInput.ini. The project's
    // EnhancedPlayerInput still services them; migrate to Enhanced Input
    // assets when real interaction authoring starts.
    PlayerInputComponent->BindAxis(TEXT("MoveForward"), this, &ACardioBlockoutCharacter::MoveForward);
    PlayerInputComponent->BindAxis(TEXT("MoveRight"), this, &ACardioBlockoutCharacter::MoveRight);
    PlayerInputComponent->BindAxis(TEXT("Turn"), this, &APawn::AddControllerYawInput);
    PlayerInputComponent->BindAxis(TEXT("LookUp"), this, &APawn::AddControllerPitchInput);
    PlayerInputComponent->BindAction(TEXT("Interact"), IE_Pressed, this, &ACardioBlockoutCharacter::Interact);
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

bool ACardioBlockoutCharacter::IsInEducationRoom() const
{
    return ACardioBlockoutGameMode::IsEducationRoomLocation(GetActorLocation());
}

void ACardioBlockoutCharacter::MoveForward(const float Value)
{
    if (Value != 0.f)
    {
        AddMovementInput(GetActorForwardVector(), Value);
    }
}

void ACardioBlockoutCharacter::MoveRight(const float Value)
{
    if (Value != 0.f)
    {
        AddMovementInput(GetActorRightVector(), Value);
    }
}

void ACardioBlockoutCharacter::Interact()
{
    if (ACardioBlockoutGameMode* Mode = GetWorld()->GetAuthGameMode<ACardioBlockoutGameMode>())
    {
        Mode->HandleInteract(*this, FocusedNpc.Get());
    }
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
