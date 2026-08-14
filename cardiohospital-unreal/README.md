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
- Node.js 24, or the Node.js runtime bundled with the Codex Windows app
- RTX 4080-class or better NVIDIA GPU
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
tests, headless case simulation, scoring, persistence, adaptive selection, and
generated-file check on both Windows and Linux. This gate does not
claim that Unreal Header Tool, C++ compilation, cooking, or the walkthrough has
passed; those remain local UE 5.8 gates.

## Clinical source of truth

`Content/Data/clinical-content.json` is generated from the preserved TypeScript
clinical core. Runtime code loads and validates it through
`UCardioClinicalDataSubsystem`; visual actors never own clinical truth.

`UCardioCaseRuntimeSubsystem` is the Blueprint-facing adapter for deterministic
case progression. World actors should call `StartCase`, query
`GetAvailableActions`, and report player choices through `PerformAction`; they
must not implement separate clinical branching in Blueprint.

The portable test suite currently exercises complete and deliberately flawed
paths through all five first-release cases: innocent murmur, HCM, vasovagal
syncope, WPW, and myocarditis. It verifies action ordering, clinical omissions,
unnecessary testing, safety intervention, debrief scoring, learner persistence,
mastery, and adaptive selection without claiming Unreal compilation or
presentation quality.

## Case authoring

`LegacyCore/src/lib/case-graph-authoring.ts` compiles a concise outpatient case
configuration into the shared 13-node clinic loop. Add or change case-specific
history, order, management, safety, and counterfactual rules in
`LegacyCore/src/lib/case-graphs.ts`; do not copy the generated node structure.

`Tools/case-authoring-report.mjs` emits a machine-readable coverage report and
fails validation on unknown history keys, unclassified orders, unavailable red
flags, missing correct management, or broken counterfactual references.
Warnings identify non-blocking authoring debt. In particular, a
`structured-result-missing` warning must be resolved with medically reviewed
content—not an invented placeholder—before that result is shown in gameplay.

Rules:

- No PHI. All cases must remain synthetic or fully de-identified.
- Never silently change case truth during scene or character work.
- Every content revision must update metadata and pass validation.
- The vertical slice must complete end-to-end before additional rooms are built.

## Git hygiene

Unreal-generated directories are ignored. Large source assets belong in Git LFS
or a release asset store, not ordinary Git history. Packaged builds should be
published as GitHub Releases.
