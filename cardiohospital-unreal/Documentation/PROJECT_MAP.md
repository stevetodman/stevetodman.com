# Cardio Hospital — whole project, from this machine

There is one product with two surfaces.

1. **stevetodman.com (`main`)** — live Cloudflare site. Resident academies, PHS, BP calculator, study, cooking. Already reviewed; August 2026 P0s are fixed on `main`.
2. **Cardio Hospital Unreal (`cardiohospital-unreal/`)** — the AAA vertical slice. Not on `main` yet. Split across four open PRs that do not stack.

The slice that matters:

> Team room → Dr. Patel assigns the HCM / exertional-syncope case → Exam Room 3 → Marcus Chen + parent → scored debrief.

Stable 60 FPS at 2560×1440 in a **packaged** build. No clinical lies. No primitive NPCs in that package.

## Four PRs, one stack (do not pull at random)

| PR | Branch | What it is | Pull on |
| --- | --- | --- | --- |
| [#19](https://github.com/stevetodman/stevetodman.com/pull/19) | `agent/unreal-migration-scaffold` | UE 5.8 C++, 7 cases, first-build scripts | Mac (engine) |
| [#20](https://github.com/stevetodman/stevetodman.com/pull/20) | `claude/github-work-yesterday-62xjvk` | macOS / M4 Max is the release target | Mac, on top of #19 |
| [#23](https://github.com/stevetodman/stevetodman.com/pull/23) | `agent/aaa-exam-room-benchmark-handoff` | Exam Room 3 layout, DCC pipeline, Gate 1/2 scripts | 4090 and Mac |
| [#22](https://github.com/stevetodman/stevetodman.com/pull/22) | `agent/aaa-exam-table-asset` | 4090 exam table + shared 4K materials | 4090 only, parked |

#23 currently targets `main` and does not contain the Unreal C++ tree. #22 targets #19, not #20. That is why a fresh clone on the Mac is confusing. Intended integration, when you are at a real machine with git:

```text
#19 scaffold
  └─ #20 macOS rebaseline     ← Unreal trunk
       └─ cherry-pick / merge #23 exam-room docs + builders
            └─ #22 table only after the shell is in the cameras
```

Stale and unrelated to the slice: PRs #1–#3 (BP/ABPM). #3 supersedes #2. Do not let them cut in front of the Unreal stack.

## Two rooms, two fidelity bars

| Space | Gameplay | AAA visual bar |
| --- | --- | --- |
| Team room + short walk | Required (assignment, debrief) | Graybox is allowed until Exam Room 3 passes Gate 5 |
| Exam Room 3 | Required (Marcus encounter) | The photoreal benchmark. One room + doorway vignette. |
| Rest of hospital | Out of scope | Do not build |

A long corridor, cafeteria, or second clinic pod is how this project dies.

## Clinical truth

Lives in `LegacyCore/src/lib` → generated `Content/Data/clinical-content.json`. Seven cases: innocent murmur, HCM, vasovagal, WPW, myocarditis, Long-QT, coarctation. 32 authoring warnings (missing structured results + one HCM genetics item) stay warnings until you review them. Nobody invents an echo report to silence CI.

Actors and MetaHumans never own case logic. They call `UCardioCaseRuntimeSubsystem`.

## What this PC / the cloud can finish

These do not need the 4090 or the Mac:

- Specs, job cards, circulation math, PR comments
- Blender Python the 4090 will execute
- Unreal Editor Python the Mac will execute
- Isolated Hunyuan input stills (cloud Imagine)
- Case-graph authoring *after* you supply reviewed result text
- Site work on `main` (academies, PHS, BP) — already shipping
- Stacking plan and review of whatever you push

These require the other machines:

- `.blend` / FBX / GLB written by Blender (4090)
- Hunyuan GLB (4090 or hosted Hunyuan)
- `.uasset`, Lumen, MetaHuman, packaged 1440p/60 (M4 Max)

## What to do this week, in order

1. **Mac:** pull #19 + #20. Phase A graybox: team room, short connector, Exam Room 3 volumes using the **measured** 4.27 × 3.96 × 2.74 m room. Walk Patel → door. Call `StartCase` for HCM. See `RUNBOOK_MAC.md`.
2. **4090:** pull #23. Run the Gate 2 Blender architecture builder. Commit LFS. See `RUNBOOK_4090.md`.
3. **4090:** Hunyuan the chair / stool / ECG / wall BP from the isolated stills. Leave the PR #22 table parked until the shell is in the cameras.
4. **Mac:** import the shell, temp materials, three locked cameras at 2560×1440.
5. Only then dress the room and turn on MetaHumans for Patel / Marcus / parent.

If you only have 90 minutes on the Mac, do step 1 and stop.
If you only have 90 minutes on the 4090, do step 2 and stop.
