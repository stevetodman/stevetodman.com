using UnrealBuildTool;

public class CardioHospital : ModuleRules
{
    public CardioHospital(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        // Keep test translation units isolated. Several automation-test files use
        // intentionally file-local helpers in anonymous namespaces; Unreal unity
        // amalgamation can place those files in the same generated translation unit
        // and turn otherwise valid file-local helpers into redefinition errors.
        // This changes build mechanics only, not runtime behavior.
        bUseUnity = false;

        PublicDependencyModuleNames.AddRange(new[]
        {
            "Core",
            "CoreUObject",
            "Engine",
            "Json",
            "JsonUtilities",
            "TextToSpeech"
        });
    }
}

