# Dr. Patel MetaHuman gate

ADR-0001 allows one bounded MetaHuman: Dr. Patel. This file records what this
workstation can and cannot do.

## What exists now

- `MetaHumanCharacter` and `MetaHumanSDK` are enabled in
  `CardioHospital.uproject`.
- `Scripts/create-patel-metahuman.py` creates
  `/Game/Characters/MetaHumans/Patel` at 175 cm, requests joints+blendshape
  auto-rig, requests textures, and assembles an optimized Medium build when
  `can_build_meta_human` is true.
- `ACardioBlockoutNPC` loads `BP_Patel` if that assembled Blueprint exists and
  hides the cube fallback. Clinical truth still lives in the case runtime.
- The character source asset `Content/Characters/MetaHumans/Patel.uasset` was
  created on 2026-08-15.

## What blocked assembly on this Mac

Unreal Editor logged:

- `MetaHuman Optional Content folder not found. MetaHuman Creator plugin initialized with limited features.`
- No `/Engine/Plugins/MetaHuman/MetaHumanCharacter/Content/Optional` tree
  (no default garment, no local texture-synthesis models).
- Unattended EOS login failed: `EOS_Auth_PinGrantExpired` then
  `EOS_InvalidAuth`. Texture download therefore set
  `has_high_resolution_textures=false` and `can_build_meta_human=false`.

Until those two items are present, a packaged Patel cannot be a MetaHuman.

## What a human must do once

1. In Epic Games Launcher, install MetaHuman Creator / Optional Content for
   Unreal Engine 5.8.
2. Open this project in the editor and sign in to an Epic account so MetaHuman
   texture requests can complete.
3. From `cardiohospital-unreal`, run:

   ```
   "/Users/Shared/Epic Games/UE_5.8/Engine/Binaries/Mac/UnrealEditor-Cmd" \
     CardioHospital.uproject -nop4 \
     -ExecutePythonScript="$PWD/Scripts/create-patel-metahuman.py"
   ```

4. Confirm `Content/Characters/MetaHumans/patel-assembly.json` shows
   `"built": true` and that `Content/MetaHumans/` contains `BP_Patel`.
5. Package again. Do not mark walkthrough step 5 until the packaged app shows
   voice, gaze, listening, and facial motion on that assembled Patel.

Do not substitute the Ada test mesh or a crowd template for Dr. Patel.
