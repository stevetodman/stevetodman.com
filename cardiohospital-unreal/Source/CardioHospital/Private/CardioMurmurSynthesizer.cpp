#include "CardioMurmurSynthesizer.h"

namespace
{
    uint32 NoiseState = 2463534242u;

    float NextNoise()
    {
        NoiseState ^= NoiseState << 13;
        NoiseState ^= NoiseState >> 17;
        NoiseState ^= NoiseState << 5;
        return (static_cast<int32>(NoiseState) / 2147483648.0f);
    }

    void AddThump(TArray<float>& Samples, const int32 Start, const int32 Rate, const float Frequency, const float Intensity)
    {
        const int32 Length = FMath::Max(1, FMath::RoundToInt32(0.12f * Rate));
        for (int32 Index = 0; Index < Length; ++Index)
        {
            const int32 SampleIndex = Start + Index;
            if (!Samples.IsValidIndex(SampleIndex))
            {
                break;
            }
            const float Time = static_cast<float>(Index) / Rate;
            const float Envelope = Intensity * FMath::Exp(-Time * 28.f);
            const float InstantFrequency = Frequency * FMath::Lerp(1.f, 0.5f, FMath::Min(1.f, Time / 0.09f));
            Samples[SampleIndex] += Envelope * FMath::Sin(2.f * PI * InstantFrequency * Time);
        }
    }

    void AddMurmur(
        TArray<float>& Samples,
        const int32 Start,
        const int32 Count,
        const float Intensity,
        const float HighPassHz,
        const float LowPassHz,
        const int32 Rate,
        const bool bCrescendo)
    {
        if (Intensity <= 0.001f || Count <= 0)
        {
            return;
        }

        float Low = 0.f;
        float High = 0.f;
        const float HighAlpha = FMath::Clamp(HighPassHz / (HighPassHz + Rate), 0.01f, 0.99f);
        const float LowAlpha = FMath::Clamp(LowPassHz / (LowPassHz + Rate), 0.01f, 0.99f);
        for (int32 Index = 0; Index < Count; ++Index)
        {
            const int32 SampleIndex = Start + Index;
            if (!Samples.IsValidIndex(SampleIndex))
            {
                break;
            }
            const float White = NextNoise();
            High += HighAlpha * (White - High);
            const float HighPassed = White - High;
            Low += LowAlpha * (HighPassed - Low);
            const float Phase = static_cast<float>(Index) / Count;
            const float Envelope = bCrescendo
                ? (Phase < 0.55f ? Phase / 0.55f : 1.f - (Phase - 0.55f) / 0.45f)
                : (Phase < 0.08f ? Phase / 0.08f : Phase > 0.92f ? (1.f - Phase) / 0.08f : 1.f);
            Samples[SampleIndex] += Low * Intensity * 0.35f * FMath::Max(0.f, Envelope);
        }
    }
}

FString FCardioMurmurSynthesizer::PatternForCaseId(const FString& CaseId)
{
    if (CaseId == TEXT("case-hcm"))
    {
        return TEXT("hcm");
    }
    if (CaseId == TEXT("case-innocent-murmur"))
    {
        return TEXT("stills");
    }
    if (CaseId == TEXT("case-myocarditis"))
    {
        return TEXT("myocarditis");
    }
    return TEXT("none");
}

float FCardioMurmurSynthesizer::SiteIntensity(const FString& Pattern, const FString& Site)
{
    auto Value = [](const float Rusb, const float Lusb, const float Llsb, const float Apex, const FString& Chosen)
    {
        if (Chosen == TEXT("RUSB")) return Rusb;
        if (Chosen == TEXT("LUSB")) return Lusb;
        if (Chosen == TEXT("LLSB")) return Llsb;
        if (Chosen == TEXT("Apex")) return Apex;
        return 0.f;
    };

    if (Pattern == TEXT("hcm"))
    {
        return Value(0.15f, 0.45f, 1.f, 0.55f, Site);
    }
    if (Pattern == TEXT("stills"))
    {
        return Value(0.1f, 0.35f, 0.9f, 0.6f, Site);
    }
    if (Pattern == TEXT("myocarditis"))
    {
        return Value(0.05f, 0.15f, 0.35f, 0.85f, Site);
    }
    return 0.f;
}

float FCardioMurmurSynthesizer::ValsalvaMultiplier(const FString& Pattern)
{
    if (Pattern == TEXT("hcm"))
    {
        return 1.5f;
    }
    if (Pattern == TEXT("stills"))
    {
        return 0.6f;
    }
    return 1.f;
}

void FCardioMurmurSynthesizer::Configure(
    const FString& InPattern,
    const int32 InHeartRate,
    const FString& InSite,
    const bool bInValsalva)
{
    Pattern = InPattern;
    HeartRate = FMath::Clamp(InHeartRate, 30, 180);
    Site = InSite;
    bValsalva = bInValsalva;
    SampleCursor = 0;
    BeatSamples.Reset();
    RenderBeat(BeatSamples);
}

void FCardioMurmurSynthesizer::SetSite(const FString& InSite)
{
    Configure(Pattern, HeartRate, InSite, bValsalva);
}

void FCardioMurmurSynthesizer::SetValsalva(const bool bInValsalva)
{
    Configure(Pattern, HeartRate, Site, bInValsalva);
}

void FCardioMurmurSynthesizer::RenderBeat(TArray<float>& OutSamples) const
{
    const int32 Rate = SampleRate;
    const int32 BeatCount = FMath::Max(1, FMath::RoundToInt32(60.f / HeartRate * Rate));
    OutSamples.Init(0.f, BeatCount);

    const float Base = SiteIntensity(Pattern, Site);
    const float Intensity = FMath::Min(1.f, Base * (bValsalva ? ValsalvaMultiplier(Pattern) : 1.f));
    AddThump(OutSamples, 0, Rate, 60.f, 0.35f + Intensity * 0.15f);
    AddThump(OutSamples, FMath::RoundToInt32(BeatCount * 0.4f), Rate, 80.f, 0.28f + Intensity * 0.1f);

    const int32 MurmurStart = FMath::RoundToInt32(0.05f * Rate);
    if (Pattern == TEXT("hcm"))
    {
        AddMurmur(OutSamples, MurmurStart, FMath::RoundToInt32(BeatCount * 0.34f), Intensity, 150.f, 900.f, Rate, true);
    }
    else if (Pattern == TEXT("stills"))
    {
        AddMurmur(OutSamples, MurmurStart, FMath::RoundToInt32(BeatCount * 0.32f), Intensity, 90.f, 260.f, Rate, true);
    }
    else if (Pattern == TEXT("myocarditis"))
    {
        AddMurmur(OutSamples, FMath::RoundToInt32(0.04f * Rate), FMath::RoundToInt32(BeatCount * 0.36f), Intensity * 0.7f, 150.f, 900.f, Rate, false);
    }
}

void FCardioMurmurSynthesizer::RenderSeconds(const float Seconds, TArray<uint8>& OutPcm)
{
    if (BeatSamples.Num() == 0)
    {
        RenderBeat(BeatSamples);
    }

    const int32 Needed = FMath::Max(1, FMath::RoundToInt32(Seconds * SampleRate));
    OutPcm.Reserve(OutPcm.Num() + Needed * sizeof(int16));
    for (int32 Index = 0; Index < Needed; ++Index)
    {
        const float Sample = BeatSamples[SampleCursor];
        SampleCursor = (SampleCursor + 1) % BeatSamples.Num();
        const int16 Quantized = static_cast<int16>(FMath::Clamp(Sample, -1.f, 1.f) * 30000.f);
        OutPcm.Add(static_cast<uint8>(Quantized & 0xff));
        OutPcm.Add(static_cast<uint8>((Quantized >> 8) & 0xff));
    }
}
