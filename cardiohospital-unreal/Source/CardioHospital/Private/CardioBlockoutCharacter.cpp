#include "CardioBlockoutCharacter.h"

#include "Camera/CameraComponent.h"
#include "Components/CapsuleComponent.h"
#include "Components/InputComponent.h"
#include "GameFramework/CharacterMovementComponent.h"

ACardioBlockoutCharacter::ACardioBlockoutCharacter()
{
    PrimaryActorTick.bCanEverTick = false;

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

void ACardioBlockoutCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    // Legacy axis bindings, mapped in Config/DefaultInput.ini. The project's
    // EnhancedPlayerInput still services legacy mappings; migrate these to
    // Enhanced Input assets when real interaction authoring starts.
    PlayerInputComponent->BindAxis(TEXT("MoveForward"), this, &ACardioBlockoutCharacter::MoveForward);
    PlayerInputComponent->BindAxis(TEXT("MoveRight"), this, &ACardioBlockoutCharacter::MoveRight);
    PlayerInputComponent->BindAxis(TEXT("Turn"), this, &APawn::AddControllerYawInput);
    PlayerInputComponent->BindAxis(TEXT("LookUp"), this, &APawn::AddControllerPitchInput);
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
