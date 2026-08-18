# Next agent — start here

Session date: 2026-08-18. M4 Max. Branch `mac/integrate-launch-set` (PR #27).
`walkthroughPassed` is still **false**.

## Do this first

1. In the already-open Unreal Editor, compile or restart PIE so it loads the new `CardioBlockoutNPC` dylib.
2. Assign the HCM case, press **2** (Exam Room 3).
3. Confirm the **patient** is the projected child (`SM_EncounterPatient`), not a scaled Patel/generic doctor.
4. Note yaw, height, and whether the face reads at conversation distance. Fix those before Mixamo.

If the child is missing, the mesh failed to load. Re-run:

```
UnrealEditor-Cmd CardioHospital.uproject \
  -ExecutePythonScript="$PWD/Scripts/import-encounter-patient.py" \
  -unattended -nopause -nosplash -nullrhi
```

Source GLB: `Content/Characters/EncounterPatient/Source/hospital_boy.glb`.

## What just landed (this session)

- Hunyuan 003 sculpt + ChatGPT stills (front, left side, back) projected in Blender.
- Best door mesh on disk: `~/AI3D/outputs/projected-pediatric_003i/pediatric_003i.glb` (imported as `SM_EncounterPatient`).
- `encounter-patient` uses that static mesh. Parent and Patel are still `SK_GenericDoctor`.
- Cook path added: `/Game/Characters/EncounterPatient`.

## Honest quality

- Static A-pose. No idle/talk/rig.
- Front is the ChatGPT boy. Side of the head is still smeared. Back hair is from the back still.
- Parent mesh exists at `~/AI3D/outputs/projected-parent_001/parent_001f.glb` but is **not** in the game.
- Do **not** use the Mixamo OBJ or the ChatGPT primitive doll zip.

## Stills (do not remake)

| View | Path |
| --- | --- |
| Front | `~/AI3D/inputs/pediatric_patient_003.png` |
| Side | `~/AI3D/inputs/pediatric_patient_003_side.png` |
| Back | `~/AI3D/inputs/pediatric_patient_003_back.png` |

Projection scripts: `~/AI3D/scripts/project_triple.py`, `project_front_fill.py`.

## After the doorway look is acceptable

1. Mixamo: upload the GLB, download **FBX with skin + idle**. Not OBJ.
2. Import that FBX, keep Patel as the only MetaHuman (ADR-0001).
3. Same projection recipe on the parent, then import.
4. Package a new `.app` and do a **human packaged walk**. Record Failed honestly if step 5 (Patel voice/face) is still short.
5. Do not mark `walkthroughPassed` from Editor PIE.

## Do not

- Remesh with Hunyuan (paint fails on humans).
- Ask ChatGPT for another boy still or a primitive 3D file.
- Buy Sketchfab.
- Hunyuan the room.
- Add a second MetaHuman before Patel step 5 is honest.

## Older merge work (still true)

Apply [`MAC_MERGE_GAME_MODE.md`](MAC_MERGE_GAME_MODE.md) (`bParentSteppedOut` → `GetActionMenu()`) before trusting the #24 HUD path. Spec: `LegacyCore/plan.md`. Clinical truth stays in `LegacyCore`.
