using UnrealBuildTool;
using System.Collections.Generic;

public class CardioHospitalEditorTarget : TargetRules
{
    public CardioHospitalEditorTarget(TargetInfo Target) : base(Target)
    {
        Type = TargetType.Editor;
        DefaultBuildSettings = BuildSettingsVersion.V5;
        IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
        ExtraModuleNames.Add("CardioHospital");
    }
}

