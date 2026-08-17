using UnrealBuildTool;

public class CardioHospitalEditorTarget : TargetRules
{
    public CardioHospitalEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.Latest;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("CardioHospital");
    }
}

