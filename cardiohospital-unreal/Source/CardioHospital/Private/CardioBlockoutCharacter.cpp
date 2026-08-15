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
