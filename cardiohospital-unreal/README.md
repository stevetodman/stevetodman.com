# Cardio Hospital — Unreal vertical slice

Native Unreal Engine 5.8 foundation for the immersive Cardio Hospital simulation.
The first production gate is deliberately narrow:

1. Start in the outpatient cardiology team room.
2. Receive the assignment from Dr. Patel.
3. Walk to Exam Room 3.
4. Interview Marcus Chen and his parent.
5. Perform focused examination and initial testing.
6. Return to the team room for a scored debrief.

The browser project remains the curriculum preview. This project owns the
high-fidelity experience: MetaHumans, facial performance, locomotion, lighting,
spatial audio, and native interaction.

## Local prerequisites

- Windows 11
- Unreal Engine 5.8
- Visual Studio 2022 with **Game development with C++** and Windows 11 SDK
- Git for Windows
- NVIDIA Studio Driver current enough for UE 5.8

Run `Scripts/Check-Workstation.ps1` first. Then right-click
`CardioHospital.uproject`, generate Visual Studio project files, and build the
`CardioHospitalEditor` target for Win64 Development.

The equivalent repeatable PowerShell sequence is:

```powershell
./Scripts/Run-Validation.ps1
./Scripts/Generate-ProjectFiles.ps1
./Scripts/Build-Editor.ps1
./Scripts/Run-Automation.ps1
./Scripts/Package-Windows.ps1 -Configuration Development
```

Pass `-EngineRoot` to any Unreal-dependent script when UE 5.8 is installed in a
non-standard directory, or set `UE_5_8_ROOT` for the current shell. Automation
reports are written under `Saved/AutomationReports`; packaged builds and their
SHA-256 manifests are written under `PackagedBuilds`. Both directories are
ignored by Git. A package manifest always begins with `walkthroughPassed=false`;
only a real packaged walkthrough can satisfy that quality gate.

GitHub Actions repeats the portable export, contract validation, determinism
tests, and generated-file check on both Windows and Linux. This gate does not
claim that Unreal Header Tool, C++ compilation, cooking, or the walkthrough has
passed; those remain local UE 5.8 gates.

## Clinical source of truth

`Content/Data/clinical-content.json` is generated from the preserved TypeScript
clinical core. Runtime code loads and validates it through
`UCardioClinicalDataSubsystem`; visual actors never own clinical truth.

Rules:

- No PHI. All cases must remain synthetic or fully de-identified.
- Never silently change case truth during scene or character work.
- Every content revision must update metadata and pass validation.
- The vertical slice must complete end-to-end before additional rooms are built.

## Git hygiene

Unreal-generated directories are ignored. Large source assets belong in Git LFS
or a release asset store, not ordinary Git history. Packaged builds should be
published as GitHub Releases.
