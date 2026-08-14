# Local Windows handoff

This cloud session cannot install software or operate Unreal Editor on the local
workstation. Continue through the Windows ChatGPT app with Codex after completing
the account-bound installations.

## First local prompt

> Open this repository as the active project. Read `AGENTS.md`, `README.md`, and
> `LOCAL_HANDOFF.md` completely. Run `Scripts/Check-Workstation.ps1`, then
> `Scripts/Run-Validation.ps1`, generate Unreal project files, and build the
> CardioHospitalEditor target. Fix any compile or data-schema errors. Do not add
> rooms or characters until the baseline build and automation test pass. Commit
> the validated baseline to GitHub.

## Installation-bound actions

The local operator must accept licenses and UAC prompts for:

- Epic Games Launcher and Unreal Engine 5.8
- Visual Studio 2022 C++ workload
- Git for Windows
- ChatGPT desktop app for Windows
- NVIDIA Studio Driver

Do not enter institutional credentials into project files or terminal prompts.

## After the baseline builds

1. Enable the MetaHuman plugin through Unreal's plugin manager.
2. Create/import only Dr. Patel for the first character-quality gate.
3. Build the team room and corridor using reference dimensions before decoration.
4. Implement dialogue selection from `case-hcm` in the clinical data subsystem.
5. Add voice, listening pose, gaze, blink, and facial performance.
6. Package and run the vertical slice before creating additional characters.

