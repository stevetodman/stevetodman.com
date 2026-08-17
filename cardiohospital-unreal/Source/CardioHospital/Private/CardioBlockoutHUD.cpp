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
    TArray<FString> Prompts;
    Prompts.Add(TEXT("Click a place to walk there.  Hold right mouse to look."));
    Prompts.Add(TEXT("[1] Team Room   [2] Exam Room 3   [3] Room 1   [4] ECG / Echo"));
    if (Focused)
    {
        Prompts.Add(Focused->GetInteractionPrompt());
    }
    else if (Character && Character->IsInExamRoom())
    {
        Prompts.Add(TEXT("[E]  Evaluate the patient"));
    }
    else if (Character && Character->IsInEducationRoom())
    {
        Prompts.Add(TEXT("[E]  Review ECG and echo"));
    }

    const float LineHeight = 26.f;
    float TextWidth = 0.f;
    float TextHeight = 0.f;
    for (const FString& Line : Prompts)
    {
        float LineW = 0.f;
        float LineH = 0.f;
        GetTextSize(Line, LineW, LineH, UEngine::GetMediumFont());
        TextWidth = FMath::Max(TextWidth, LineW);
        TextHeight += LineHeight;
    }
    const float PromptX = (Width - TextWidth) * 0.5f;
    const float PromptY = Height * 0.78f;
    DrawRect(FLinearColor(0.f, 0.f, 0.f, 0.58f), PromptX - 16.f, PromptY - 10.f, TextWidth + 32.f, TextHeight + 18.f);
    float LineY = PromptY;
    for (const FString& Line : Prompts)
    {
        DrawText(Line, FLinearColor::White, PromptX, LineY, UEngine::GetMediumFont());
        LineY += LineHeight;
    }
}
