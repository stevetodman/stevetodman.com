# Standard-user Windows handoff

The repository workflow runs without elevation after IT has provisioned the
machine. Its scripts perform read-only inventory and write only normal project
outputs; they never install software, change policy, or request administrator
rights.

## First local prompt

> Open this repository as the active project. Read `AGENTS.md`, `README.md`, and
> `LOCAL_HANDOFF.md` completely. Run `Scripts/Run-Monday-Preflight.ps1`. If it
> fails, read its `UserAction` and `ITOrAdminRequired` sections and do not bypass
> a prerequisite. If it passes, run `Scripts/Generate-ProjectFiles.ps1`,
> `Scripts/Build-Editor.ps1`, and `Scripts/Run-Automation.ps1`. Fix and rerun any
> compile, automation, or data-schema failures. Do not add rooms or characters
> until that baseline passes. Commit and push the validated source, confirm the
> worktree is clean, then run `Scripts/Package-Windows.ps1`. Do not mark the
> package walkthrough true by hand. Follow `WALKTHROUGH_CHECKLIST.md` and use
> `Scripts/Record-WalkthroughEvidence.ps1` only after running that exact
> packaged executable at the required quality gate. Record an incomplete run
> as failed instead of weakening or skipping a gate.

## Managed-PC prerequisites

If any of these are absent, send `IT_PREREQUISITES.md` and the ignored JSON
report from `Saved/WorkstationReports` to authorized IT staff:

- Epic Games Launcher and Unreal Engine 5.8
- Visual Studio 2022 17.14+ or Visual Studio 2026 with Game development with C++
- MSVC 14.38+ and Windows SDK 10.0.22621.0+
- Git for Windows
- Node.js 24 or an approved Codex installation containing its bundled runtime
- NVIDIA Studio Driver

The target workstation must run Windows 11 with at least 48 GB RAM, at least
100 GB free on the project drive, and a desktop RTX 4080/4090 or RTX 5080/5090.
Passing preflight does not replace the packaged 2560×1440 performance
walkthrough.

Do not enter institutional credentials into project files or terminal prompts.

If Git is not yet installed, [PR #19](https://github.com/stevetodman/stevetodman.com/pull/19)
may be downloaded from GitHub as a ZIP for read-only inspection and portable
validation. A verifiable package
still requires a real Git checkout with a clean, committed `HEAD`; ask IT for
Git rather than weakening that provenance gate.

## After the baseline builds

1. Enable the MetaHuman plugin through Unreal's plugin manager.
2. Create/import only Dr. Patel for the first character-quality gate.
3. Build the team room and corridor using reference dimensions before decoration.
4. Implement dialogue selection from `case-hcm` in the clinical data subsystem.
5. Add voice, listening pose, gaze, blink, and facial performance.
6. Package and run the vertical slice before creating additional characters.

The final walkthrough is the 19-step packaged acceptance test in
`WALKTHROUGH_CHECKLIST.md`. It also explains how to preserve Unreal performance
capture evidence and attach a truthful pass or failure to the package manifest.

## Runtime integration already prepared

- `UCardioClinicalDataSubsystem` loads the schema-v3 generated runtime artifact,
  including clinical cases, graphs, safety rules, counterfactuals, and concepts.
- `UCardioCaseRuntimeSubsystem` exposes deterministic case actions to Blueprint.
- Portable tests simulate complete and unsafe paths across all five
  first-release cases. Keep these tests green while connecting world
  interactions.
- Run `Tools/case-authoring-report.mjs` before exposing a new order in the UI.
  The current expected result is zero errors and 23 warnings: 20 missing
  structured results, two deferred graphs, and one HCM genetics classification
  awaiting clinical review. Do not invent results or reclassify clinical
  content merely to silence those warnings.
- The first local compile must confirm Unreal Header Tool accepts the new
  reflected structs and subsystem signatures; that gate is not yet confirmed.
