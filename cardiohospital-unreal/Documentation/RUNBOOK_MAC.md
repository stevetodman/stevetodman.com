# Runbook — M4 Max 128 GB (Unreal 5.8)

This machine owns lighting, MetaHumans, and the packaged gate. ADR-0002: no Windows FPS number counts.

## Once

```bash
git clone https://github.com/stevetodman/stevetodman.com.git
cd stevetodman.com
git fetch origin
git checkout claude/github-work-yesterday-62xjvk   # PR #20, based on the #19 scaffold
```

You want **#20**, not `main` and not #23 alone. #23’s exam-room files can be fetched without taking its whole branch:

```bash
git checkout origin/agent/aaa-exam-room-benchmark-handoff -- cardiohospital-unreal/Documentation cardiohospital-unreal/SourceAssets/ExamRoom
```

UE 5.8 installed. Xcode / Metal toolchain as required by that engine.

## Phase A — playable graybox (90 minutes)

1. Open `cardiohospital-unreal/CardioHospital.uproject`.
2. Map `Content/Maps/OutpatientClinic_VSlice`.
3. Team room (any reasonable graybox) + a **short** connector + Exam Room 3 at **4.27 × 3.96 × 2.74 m** (427 × 396 × 274 cm).
4. Keyboard/mouse walk from Patel’s desk through the 91 cm door.
5. `UCardioCaseRuntimeSubsystem::StartCase` for the HCM graph. Do not reimplement branching in Blueprint.

Or run the measured-room helper once it is in this tree:

```text
Unreal Editor → Output Log → Cmd:
py cardiohospital-unreal/SourceAssets/ExamRoom/Unreal/build_exam_room3_graybox.py
```

(Path may need to be copied under `Content/Python` depending on project settings.)

**Stop when you can walk in and start the case.** Commit. Do not light, do not MetaHuman, do not import Hunyuan yet.

## After the 4090 pushes a shell

```bash
git pull
```

Import FBX to `/Game/Environments/ExamRoom3/` per `Docs/aaa-vertical-slice/CONTENT_FOLDERS.md`. Temp materials. Place the three locked cameras from `CH_ExamRoom_Gate1_manifest.json` (locations are metres — multiply by 100). Render 2560×1440.

## Package gate

Follow `WALKTHROUGH_CHECKLIST.md` on the **packaged** app, not PIE. `walkthroughPassed` only via the evidence script.

## Do not

- Treat this laptop as the Hunyuan box
- Expand the connector into a hospital
- Mark the walkthrough passed by hand
- Invent structured echo/ECG text to clear the 32 authoring warnings
