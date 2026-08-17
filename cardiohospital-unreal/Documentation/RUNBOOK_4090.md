# Runbook — RTX 4090 (Blender + Hunyuan)

GitHub is the inbox. This machine writes meshes.

## Once

```powershell
git clone https://github.com/stevetodman/stevetodman.com.git
cd stevetodman.com
git checkout agent/aaa-exam-room-benchmark-handoff
git lfs install
```

Need the Unreal C++ tree as well (optional on this box):

```powershell
git fetch origin agent/unreal-migration-scaffold
```

Blender 4.2+ or 5.x on PATH as `blender`.

## Gate 2 shell (do this first)

```powershell
cd cardiohospital-unreal\SourceAssets\ExamRoom\Architecture
blender --background --python build_exam_room_architecture.py
```

Expect `generated\` with `.blend`, FBX, GLB, and three 2560×1440 stills. Glance at the stills. If the sink is on the west wall as you enter and the table is under the window, commit:

```powershell
git add cardiohospital-unreal/SourceAssets/ExamRoom
git commit -m "assets: Gate 2 exam-room architectural shell"
git push -u origin agent/aaa-exam-room-benchmark-handoff
```

Use Git LFS for `.blend` / `.fbx` / `.glb` / 4K PNG.

## Hunyuan props (after the shell stills look right)

Cards: `Documentation/AAA_HUNYUAN_JOBS.md`.

Isolated input stills were generated in the Grok session (chair, stool, ECG cart, wall BP). Save them into:

```text
SourceAssets/ExamRoom/Props/ParentChair/hunyuan/input.png
SourceAssets/ExamRoom/Props/PhysicianStool/hunyuan/input.png
SourceAssets/ExamRoom/Props/ECGCart/hunyuan/input.png
SourceAssets/ExamRoom/Props/WallBP/hunyuan/input.png
```

One object per job. Export GLB next to `input.png`. Then in Blender: metres, pivot, UV0+UV1, collision, no fused floor. Do not Hunyuan the room.

The PR #22 table already exists on `agent/aaa-exam-table-asset`. Prefer a checkout of that branch over generating a new table.

## Do not

- Run Unreal here unless you are only checking an FBX import
- Claim OptiX product shots as the room benchmark
- Commit `Binaries/`, `Saved/`, or packaged builds
