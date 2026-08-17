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

The platform, launch-surface, performance, and bounded MetaHuman decisions are
recorded in
[`Docs/ADR-0001-unreal-5-8-product-rebaseline.md`](Docs/ADR-0001-unreal-5-8-product-rebaseline.md).

## Local prerequisites

**Release machine is the M4 Max.** Start at
[`Docs/MAC_FIRST_SESSION.md`](Docs/MAC_FIRST_SESSION.md) and ADR-0002.

- macOS on Apple silicon, Unreal Engine 5.8, Xcode (not CLT-only), Git, Node 24
- At least 48 GB unified memory and 100 GB free
- `xcrun metal --version` must print a real compiler

Windows PowerShell prerequisites below are optional history, not the release gate.

All repository scripts are designed to run as a standard user. They never
install software, alter policy, or request elevation. On a managed PC, send
[`IT_PREREQUISITES.md`](IT_PREREQUISITES.md) to IT for anything the read-only
preflight reports as administrator-required.

From `cardiohospital-unreal`, run the resumable standard-user baseline:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Scripts\Run-FirstBuild.ps1
```

That one command runs preflight, portable validation, project generation,
Editor compilation, and Unreal automation in order. It writes a unique ignored
stage report under `Saved/FirstBuildReports`. If a stage fails, fix the reported
problem and paste the report's `resumeCommand`; preflight always reruns, and a
completed stage is reused only when its source, workstation/toolchain, and
artifact hashes still match. Pass `-RerunAll` to deliberately rerun every
stage. The individual scripts remain available for focused troubleshooting.

After the baseline passes, commit and push any source fixes and confirm the
worktree is clean. Then paste the report's `packageResumeCommand`, which adds
`-IncludePackage`, or start a fresh packaged run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Scripts\Run-FirstBuild.ps1 -IncludePackage -Configuration Development
```

The package stage refuses unverifiable or dirty source. The preflight and
first-build workflows never overwrite an earlier report. Pass `-ReportPath` to
choose another new `.json` destination.

Pass `-EngineRoot` to any Unreal-dependent script when UE 5.8 is installed in a
non-standard directory, or set `UE_5_8_ROOT` for the current shell. Automation
reports are written under `Saved/AutomationReports`; packaged builds and their
SHA-256 manifests are written under `PackagedBuilds`. Both directories are
ignored by Git. A package manifest always begins with `walkthroughPassed=false`;
only a real packaged walkthrough tied to that package ID can satisfy that
quality gate.

After packaging, follow [`WALKTHROUGH_CHECKLIST.md`](WALKTHROUGH_CHECKLIST.md).
`Scripts/Record-WalkthroughEvidence.ps1` verifies the untouched archive and can
record a failed run without changing the gate. It changes `walkthroughPassed`
to true only when a fresh passing preflight, the exact packaged executable, all
19 acceptance steps, the 2560×1440 performance metrics, and a preserved capture
artifact are explicitly supplied. The full one-row-per-section trace from the
authoritative 168-section specification to current evidence is recorded in
[`SPEC_TRACEABILITY.md`](SPEC_TRACEABILITY.md). A shorter engineering summary
remains in [`REQUIREMENT_COVERAGE.md`](REQUIREMENT_COVERAGE.md).

GitHub Actions parses the PowerShell wrappers, runs their isolated workstation
and package-evidence fixtures on Windows, and repeats the
portable export, contract validation, determinism tests, headless case
simulation, scoring, persistence, adaptive selection, and generated-file check
on both Windows and Linux. This gate does not
claim that Unreal Header Tool, C++ compilation, cooking, or the walkthrough has
passed; those remain local UE 5.8 gates.

## Clinical source of truth

The clinical authoring source lives under `LegacyCore/src/lib`.
`Content/Data/clinical-content.json` is its deterministic generated runtime
artifact and must never be edited by hand. Runtime code loads and validates it
through `UCardioClinicalDataSubsystem`; visual actors never own clinical truth.

All current review-attribution fields explicitly say formal review is pending.
Do not describe this curriculum as medically reviewed until the named content
and sources have actually completed that gate with the reviewers' consent.

`UCardioCaseRuntimeSubsystem` is the Blueprint-facing adapter for deterministic
case progression. World actors should call `StartCase`, query
`GetAvailableActions`, report player choices through `PerformAction`, and
display `GetPresentationState` rather than `GetActiveClinicalCase`.
They must not implement separate clinical branching in Blueprint. A
generic history question must not reveal a red-flag answer. Diagnosis
and teaching text stay hidden until debrief.

The portable test suite currently exercises complete and deliberately flawed
paths through all nine deterministic clinic cases: innocent murmur, HCM,
vasovagal syncope, WPW, myocarditis, Long-QT syndrome, coarctation,
musculoskeletal chest pain, and adolescent hypertension / ABPM. It
verifies action ordering, clinical omissions, unnecessary testing, safety
intervention, debrief scoring, learner persistence, mastery, and adaptive
selection without claiming Unreal compilation or presentation quality.

A separate Playwright regression completes the safe 100% HCM browser-preview
path and the unsafe/replay persistence path. Both pass locally against Chrome;
GitHub CI for the integration checkpoint remains pending. These are
browser-preview results, not Unreal compilation or packaged-walkthrough
evidence.

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
The current expected report is zero errors and 41 warnings: 40 missing
structured results and one HCM `Genetics referral` test/management
classification that requires clinical review. Do not invent results or
silently reclassify that item merely to remove a warning.

Rules:

- No PHI. All cases must remain synthetic or fully de-identified.
- Never silently change case truth during scene or character work.
- Every content revision must update metadata and pass validation.
- The vertical slice must complete end-to-end before additional rooms are built.

## Git hygiene

Unreal-generated directories are ignored. Large source assets belong in Git LFS
or a release asset store, not ordinary Git history. Packaged builds should be
published as GitHub Releases.
