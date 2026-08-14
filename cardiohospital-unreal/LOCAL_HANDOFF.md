# Local Windows handoff

This cloud session cannot install software or operate Unreal Editor on the local
workstation. Continue through the Windows ChatGPT app with Codex after completing
the account-bound installations.

## First local prompt

> Open this repository as the active project. Read `AGENTS.md`, `README.md`, and
> `LOCAL_HANDOFF.md` completely. Run `Scripts/Check-Workstation.ps1`, then
> `Scripts/Run-Validation.ps1`, `Scripts/Generate-ProjectFiles.ps1`,
> `Scripts/Build-Editor.ps1`, `Scripts/Run-Automation.ps1`, and
> `Scripts/Package-Windows.ps1`. Fix any compile, automation, packaging, or
> data-schema errors. Do not add rooms or characters until the baseline build
> and automation test pass. Commit the validated baseline to GitHub. Do not mark
> the package manifest walkthrough flag true; walkthrough status is recorded
> only after the packaged executable is run.

## Installation-bound actions

The local operator must accept licenses and UAC prompts for:

- Epic Games Launcher and Unreal Engine 5.8
- Visual Studio 2022 C++ workload
- Git for Windows
- ChatGPT desktop app for Windows
- NVIDIA Studio Driver

The target build workstation must run Windows 11 with at least 48 GB RAM and
an RTX 4080-class or better NVIDIA GPU. Passing the hardware check does not
replace the packaged 2560×1440 performance walkthrough.

Do not enter institutional credentials into project files or terminal prompts.

## After the baseline builds

1. Enable the MetaHuman plugin through Unreal's plugin manager.
2. Create/import only Dr. Patel for the first character-quality gate.
3. Build the team room and corridor using reference dimensions before decoration.
4. Implement dialogue selection from `case-hcm` in the clinical data subsystem.
5. Add voice, listening pose, gaze, blink, and facial performance.
6. Package and run the vertical slice before creating additional characters.

## Runtime integration already prepared

- `UCardioClinicalDataSubsystem` loads schema-v3 clinical truth, case graphs,
  safety rules, counterfactuals, and educational concepts.
- `UCardioCaseRuntimeSubsystem` exposes deterministic case actions to Blueprint.
- Portable tests simulate complete and unsafe paths across all five
  first-release cases. Keep these tests green while connecting world
  interactions.
- Run `Tools/case-authoring-report.mjs` before exposing a new order in the UI.
  Its remaining structured-result warnings require medically reviewed result
  content; do not invent placeholder clinical results during scene work.
- The first local compile must confirm Unreal Header Tool accepts the new
  reflected structs and subsystem signatures; this has not been claimed from
  the non-admin workstation.
