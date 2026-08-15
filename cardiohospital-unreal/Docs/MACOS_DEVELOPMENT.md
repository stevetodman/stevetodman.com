# macOS development tier

This document describes an optional development environment. It does not change
ADR-0001. The production client remains Unreal Engine 5.8 packaged as a Windows
executable, and the packaged Windows build remains the only source of release
evidence.

macOS sits in the same category as the browser previews: useful for building and
iterating, never admissible as proof that a gate passed.

## What this tier may and may not claim

A macOS session may claim:

- clinical content was authored, exported, and validated;
- portable deterministic tests passed;
- Unreal Header Tool accepted the reflected types under Clang;
- the editor target compiled under Clang;
- a map, pawn, input mapping, interaction actor, or MetaHuman asset was created.

A macOS session may never claim:

- the C++ compiles under MSVC;
- Unreal automation passed on the target workstation;
- a package was produced;
- any of the nineteen packaged acceptance steps passed;
- any frame rate, frame time, draw call, or memory figure relevant to the
  quality gate.

Record macOS results as `PREVIEW-ONLY` or as an explicit development note. Do not
move a `WORKSTATION-GATED` row in `SPEC_TRACEABILITY.md` on the strength of a Mac
result.

## Why the project builds on macOS

The native source carries no platform lock:

- `CardioHospital.Target.cs` and `CardioHospitalEditor.Target.cs` declare no
  `SupportedPlatforms` restriction.
- `CardioHospital.Build.cs` depends only on `Core`, `CoreUObject`, `Engine`,
  `Json`, and `JsonUtilities`, all of which are cross-platform first-party
  modules.
- No source file references `Windows.h`, `PLATFORM_WINDOWS`, `_WIN32`, or a
  Windows-only API.

This is a property worth preserving. Keep clinical, education, and learner logic
free of platform conditionals so the deterministic core stays portable.

## The main reason to use this tier

`LOCAL_HANDOFF.md` records that Unreal Header Tool has never accepted the
reflected structs and subsystem signatures, and that this gate is unconfirmed.
UHT parses reflection markup before any native compiler runs, so it behaves the
same on macOS as on Windows.

Compiling the editor target on macOS therefore surfaces reflection and header
errors early, at no cost to the evidence chain. Fixing them here means the first
Windows session spends its time on genuine MSVC differences instead of on
malformed `UPROPERTY` specifiers and missing includes.

Treat a clean macOS build as risk reduction, not as a passed gate.

## Portable workflow

Node 24 and a checkout are the only requirements. From the repository root:

```sh
npm run clinical:report    # authoring coverage: expect 0 errors, 32 warnings
npm run clinical:check     # export, validate, 54 portable tests, freshness gate
```

`clinical:check` mirrors the Linux and Windows steps in
`.github/workflows/cardiohospital-unreal.yml`, so a local pass predicts CI.

Do not run the `Scripts/*.ps1` workflow on macOS. `Check-Workstation.ps1`
requires Windows 11 and a desktop RTX 4080/4090/5080/5090 and will fail
preflight by design. That failure is correct and must not be bypassed.

## Editor workflow

1. Confirm the Unreal Engine 5.8 release notes list your macOS version as
   supported before investing time.
2. Generate project files and build the editor target through the Epic launcher
   or `Build.sh`, not through the PowerShell wrappers.
3. Author maps, pawns, input mappings, interaction actors, and MetaHuman assets
   as normal.
4. Commit `.uasset` and `.umap` output. `.gitattributes` already routes
   `*.uasset`, `*.umap`, `*.fbx`, `*.glb`, `*.wav`, and `*.exr` through Git LFS,
   and these formats are platform independent, so assets authored here open
   unchanged on the Windows workstation.
5. Run the packaged acceptance walkthrough only on the Windows workstation.

## Known differences to expect

- **Clang is not MSVC.** Each compiler rejects code the other accepts. A clean
  macOS build reduces the size of the first Windows failure; it does not remove
  it.
- **Metal is not D3D12.** Nanite and Lumen behave and perform differently.
  macOS frame rates say nothing about the 60 FPS at 2560x1440 gate.
- **MetaHuman tooling has been Windows-first.** Import and Bridge work on macOS,
  but confirm the specific animation features you need before planning the
  Dr. Patel quality spike around them.
- **SaveGame paths differ.** Learner profile persistence must still be proven in
  a packaged Windows build.

## Division of machines

| Work | macOS | Windows workstation |
| --- | --- | --- |
| Clinical authoring, export, validation | yes | yes |
| Portable deterministic tests | yes | yes |
| UHT and Clang compile | yes | not applicable |
| MSVC compile confirmation | no | required |
| Map, pawn, input, MetaHuman authoring | yes | yes |
| Unreal automation on target | no | required |
| Cook and package | no | required |
| Nineteen-step acceptance walkthrough | no | required |
| Performance and accessibility capture | no | required |
