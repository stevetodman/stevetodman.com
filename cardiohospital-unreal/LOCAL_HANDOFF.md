# macOS handoff

The release target is macOS on Apple silicon, decided in
[`Docs/ADR-0002-macos-release-target.md`](Docs/ADR-0002-macos-release-target.md).

The workflow runs as the normal user without elevation. Its scripts perform
read-only inventory and write only normal project outputs under `Saved/` and
`PackagedBuilds/`; they never install software, change system policy, or
request administrator rights.

## First local prompt

> Open this repository as the active project. Read `AGENTS.md`, `README.md`,
> `LOCAL_HANDOFF.md`, and `Docs/ADR-0002-macos-release-target.md` completely.
> From `cardiohospital-unreal`, run `./Scripts/run-first-build.sh`.
> If preflight fails, read the workstation report's `userAction` and
> `itOrAdminRequired` entries and do not bypass a prerequisite.
> If a later stage fails, fix the reported compile, automation, or data-schema
> problem and paste the stage report's `resumeCommand`; do not add rooms or
> characters until the baseline passes. Commit and push the validated source,
> confirm the worktree is clean, then paste `packageResumeCommand` to create the
> package. Do not mark the walkthrough true by hand. Follow
> `WALKTHROUGH_CHECKLIST.md` and use
> `Scripts/record-walkthrough-evidence.sh` only after running that exact packaged
> `.app` bundle at the required quality gate. Record an incomplete run as failed
> instead of weakening or skipping a gate.

## Prerequisites

`Scripts/check-workstation.sh` reports all of these and writes an ignored JSON
report under `Saved/WorkstationReports`:

- Epic Games Launcher and Unreal Engine 5.8
- Xcode at the version that engine release requires, with `xcodebuild`
  available; the command line tools alone cannot build Unreal targets
- Git
- Node.js 24

The reference workstation is Apple silicon with at least 48 GB of unified
memory, at least 100 GB free on the project drive, and a macOS release listed
as supported by Unreal Engine 5.8. Intel Macs are out of scope.

Passing preflight does not replace the packaged 2560×1440 performance
walkthrough.

Do not enter institutional credentials into project files or terminal prompts.

Packaging requires a real Git checkout with a clean, committed `HEAD`. A ZIP
download has no `HEAD` and can never satisfy the provenance gate; use it only
for read-only inspection.

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
- Portable tests simulate complete and unsafe paths across all seven current
  deterministic clinic cases. Keep these tests green while connecting world
  interactions.
- Run `Tools/case-authoring-report.mjs` before exposing a new order in the UI.
  The current expected result is zero errors and 32 warnings: 31 missing
  structured results and one HCM genetics classification awaiting clinical
  review. Do not invent results or reclassify clinical content merely to silence
  those warnings.
- The first local compile must confirm Unreal Header Tool accepts the new
  reflected structs and subsystem signatures; that gate is not yet confirmed.
  It is the largest single unknown in the migration, and `./Scripts/build-editor.sh`
  is the shortest path to retiring it.
