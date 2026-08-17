#pragma once

#include "CoreMinimal.h"
#include "GameFramework/HUD.h"
#include "CardioBlockoutHUD.generated.h"

/**
 * Canvas HUD for the blockout slice: a crosshair, an interaction prompt, and a
 * simple text panel for encounter moments. Deliberately built on AHUD rather
 * than UMG so the slice adds no module dependencies; a real UI replaces this
 * when interaction authoring starts.
 */
UCLASS()
class CARDIOHOSPITAL_API ACardioBlockoutHUD : public AHUD
{
    GENERATED_BODY()

public:
    virtual void DrawHUD() override;

    void ShowPanel(const TArray<FString>& Lines) { PanelLines = Lines; }
    void ClosePanel() { PanelLines.Reset(); }
    bool IsPanelOpen() const { return PanelLines.Num() > 0; }

private:
    TArray<FString> PanelLines;
};
