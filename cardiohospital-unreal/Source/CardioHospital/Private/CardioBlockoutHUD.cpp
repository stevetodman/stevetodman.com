#include "CardioBlockoutHUD.h"

#include "CardioBlockoutCharacter.h"
#include "CardioBlockoutNPC.h"
#include "Engine/Canvas.h"
#include "Engine/Engine.h"
#include "Engine/Font.h"

void ACardioBlockoutHUD::DrawHUD()
{
    Super::DrawHUD();
    if (!Canvas)
    {
        return;
    }

    const float Width = Canvas->SizeX;
    const float Height = Canvas->SizeY;

    // A small crosshair so the learner can tell what the interaction trace is
    // pointed at.
    DrawRect(FLinearColor(1.f, 1.f, 1.f, 0.55f), Width * 0.5f - 2.f, Height * 0.5f - 2.f, 4.f, 4.f);

    if (PanelLines.Num() > 0)
    {
        const float LineHeight = 27.f;
        const float PanelWidth = FMath::Min(Width * 0.6f, 880.f);
        const float PanelHeight = PanelLines.Num() * LineHeight + 52.f;
        const float PanelX = (Width - PanelWidth) * 0.5f;
        const float PanelY = (Height - PanelHeight) * 0.5f;

        DrawRect(FLinearColor(0.02f, 0.05f, 0.07f, 0.9f), PanelX, PanelY, PanelWidth, PanelHeight);
        DrawRect(FLinearColor(0.f, 0.81f, 0.79f, 1.f), PanelX, PanelY, PanelWidth, 3.f);

        float LineY = PanelY + 26.f;
        for (int32 Index = 0; Index < PanelLines.Num(); ++Index)
        {
            const bool bHeader = Index == 0;
            DrawText(
                PanelLines[Index],
                bHeader ? FLinearColor(0.f, 0.81f, 0.79f) : FLinearColor::White,
                PanelX + 30.f,
                LineY,
                bHeader ? UEngine::GetLargeFont() : UEngine::GetMediumFont());
            LineY += LineHeight;
        }
        return;
    }

    const ACardioBlockoutCharacter* Character = Cast<ACardioBlockoutCharacter>(GetOwningPawn());
    const ACardioBlockoutNPC* Focused = Character ? Character->GetFocusedNpc() : nullptr;
    if (Focused)
    {
        const FString Prompt = Focused->GetInteractionPrompt();
        float TextWidth = 0.f;
        float TextHeight = 0.f;
        GetTextSize(Prompt, TextWidth, TextHeight, UEngine::GetLargeFont());

        const float PromptX = (Width - TextWidth) * 0.5f;
        const float PromptY = Height * 0.82f;
        DrawRect(FLinearColor(0.f, 0.f, 0.f, 0.6f), PromptX - 14.f, PromptY - 8.f, TextWidth + 28.f, TextHeight + 16.f);
        DrawText(Prompt, FLinearColor::White, PromptX, PromptY, UEngine::GetLargeFont());
    }
}
