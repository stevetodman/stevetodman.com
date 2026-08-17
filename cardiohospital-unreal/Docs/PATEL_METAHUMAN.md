# Dr. Patel MetaHuman gate

ADR-0001 allows one bounded MetaHuman: Dr. Patel. This file records the
macOS workstation state as of 2026-08-15. Re-verify after merge; do not
treat this as a walkthrough pass.

## What already exists on the macOS branch

- `MetaHumanCharacter` and `MetaHumanSDK` enabled.
- MetaHuman Creator Core Data at
  `/Users/Shared/Epic Games/UE_5.8/Engine/Plugins/MetaHuman/MetaHumanCharacter/Content/Optional`.
- Assembled High Patel: `Content/MetaHumans/Patel/BP_Patel.uasset`.
- CC-BY Sketchfab coat (`SK_LabCoat`) leader-posed to Patel's body;
  `Patel_Outfits` hidden so the coat is not under the t-shirt.
- CC-BY stethoscope on the same skeleton.
- Static foam overlays stay hidden. This is still not a MetaHuman `WI_`
  wardrobe item. Legs under the hem are currently bare.

## What still fails walkthrough step 5

Voice, listening pose, gaze (yaw exists), blink, and facial viseme/lip-sync
are not a packaged human pass. Do not substitute Ada or a crowd template.
Do not expand the cast until the HCM slice passes.

## Re-assemble

From `cardiohospital-unreal`, with Epic signed in through the editor (not
unattended EOS):

```
"/Users/Shared/Epic Games/UE_5.8/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS/UnrealEditor" \
  CardioHospital.uproject -nop4 \
  -ExecutePythonScript="$PWD/Scripts/create-patel-metahuman.py"
```
