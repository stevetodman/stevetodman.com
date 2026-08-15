# Dr. Patel MetaHuman gate

ADR-0001 allows one bounded MetaHuman: Dr. Patel. This file records what this
workstation can and cannot do.

## What exists now

- `MetaHumanCharacter` and `MetaHumanSDK` are enabled in
  `CardioHospital.uproject`.
- MetaHuman Creator Core Data is installed at
  `/Users/Shared/Epic Games/UE_5.8/Engine/Plugins/MetaHuman/MetaHumanCharacter/Content/Optional`.
- `Scripts/create-patel-metahuman.py` authors `/Game/Characters/MetaHumans/Patel`
  at 175 cm with attending skin, short clean hair, natural brows, and eyelashes,
  then auto-rigs joints+blendshapes, downloads high-resolution textures, and
  assembles an **optimized High** build (real-time AAA, not cinematic).
- `Content/Characters/MetaHumans/patel-assembly.json` reports
  `"built": true`, `"textures": true`, `"quality": "HIGH"`.
- Assembled Blueprint: `Content/MetaHumans/Patel/BP_Patel.uasset`.
- `ACardioBlockoutNPC` loads that Blueprint, hides the primitive stand-in, and
  yaws the assembled actor toward the learner. Clinical truth still lives in
  the case runtime.

## What is still not the walkthrough pass

- Core Data ships only the default casual garment. There is no MetaHuman lab
  coat in Optional. Do not treat a t-shirt as finished attending wardrobe.
- Voice, gaze (yaw), and listen still need a packaged human look before
  walkthrough step 5 can pass. Facial viseme/lip-sync is not wired yet.
- Do not substitute the Ada test mesh or a crowd template for Dr. Patel.

## Re-assemble

From `cardiohospital-unreal`, with Epic signed in through the editor (not
unattended EOS):

```
"/Users/Shared/Epic Games/UE_5.8/Engine/Binaries/Mac/UnrealEditor.app/Contents/MacOS/UnrealEditor" \
  CardioHospital.uproject -nop4 \
  -ExecutePythonScript="$PWD/Scripts/create-patel-metahuman.py"
```
