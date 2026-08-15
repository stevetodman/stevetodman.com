#pragma once

#include "CoreMinimal.h"

/**
 * Presentation adapter for auscultation. Pattern and heart rate come from
 * authored case data; this class only turns those into PCM. It must stay
 * aligned with LegacyCore/src/lib/murmur-audio.ts.
 */
class CARDIOHOSPITAL_API FCardioMurmurSynthesizer
{
public:
    static FString PatternForCaseId(const FString& CaseId);
    static float SiteIntensity(const FString& Pattern, const FString& Site);
    static float ValsalvaMultiplier(const FString& Pattern);

    void Configure(const FString& Pattern, int32 HeartRate, const FString& Site, bool bValsalva);
    void SetSite(const FString& Site);
    void SetValsalva(bool bValsalva);
    bool IsValsalva() const { return bValsalva; }
    FString GetSite() const { return Site; }
    FString GetPattern() const { return Pattern; }

    void RenderSeconds(float Seconds, TArray<uint8>& OutPcm);

    static constexpr int32 SampleRate = 22050;

private:
    void RenderBeat(TArray<float>& OutSamples) const;

    FString Pattern = TEXT("none");
    FString Site = TEXT("LLSB");
    int32 HeartRate = 68;
    bool bValsalva = false;
    int32 SampleCursor = 0;
    TArray<float> BeatSamples;
};
