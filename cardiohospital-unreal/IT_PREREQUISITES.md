# Workstation prerequisites

The release target is macOS on Apple silicon, decided in
[`Docs/ADR-0002-macos-release-target.md`](Docs/ADR-0002-macos-release-target.md).

An earlier revision of this document described provisioning a managed Windows
PC through institutional IT. ADR-0002 replaced that target with a personally
administered Apple silicon workstation, so the managed-PC escalation path no
longer applies. Nothing here requires administrator action from another party.

`Scripts/check-workstation.sh` reports every item below and writes an ignored
JSON report under `Saved/WorkstationReports`. Read that report rather than
guessing which prerequisite is missing.

## Required

| Item | Requirement | Notes |
| --- | --- | --- |
| Hardware | Apple silicon | Intel Macs are out of scope |
| Memory | 48 GB unified minimum | The reference workstation has 128 GB |
| Disk | 100 GB free on the project drive | Cooked and packaged output is large |
| macOS | A release supported by Unreal Engine 5.8 | Confirm against the engine release notes |
| Unreal Engine | 5.8 | Install through the Epic Games Launcher |
| Xcode | The version UE 5.8 requires | `xcodebuild` must be available |
| Metal toolchain | Installed as an Xcode component | `xcodebuild -downloadComponent MetalToolchain` |
| Git | Any recent version | Required for package provenance |
| Node.js | 24 or newer | Required by the clinical tooling |

The command line tools alone are not sufficient. Unreal builds need full Xcode
selected via `xcode-select`.

Xcode 26 ships the Metal compiler as a separately downloadable component rather
than in the base install. Without it the editor builds and the automation tests
pass, and then every shader in the cook fails — thousands of errors, one per
shader, several minutes in. The preflight detects it by running
`xcrun metal --version`, because `xcrun -f metal` prints a tool path and exits 0
even when the component is absent.

If Unreal Engine is installed outside the default Epic Games location, set
`UE_5_8_ROOT` for the shell rather than editing the scripts.

## Not required

- Administrator rights. Every script runs as the normal user.
- Disabling Gatekeeper or System Integrity Protection. `package-macos.sh`
  ad-hoc signs the bundle so it launches normally, and clearing a quarantine
  attribute by hand invalidates the walkthrough.
- A Windows machine. The PowerShell workflow is retained as history and is not
  part of the release path.

## Boundaries

Do not enter institutional credentials into project files or terminal prompts.
Workstation reports contain local inventory; keep them out of source control
and share them only when someone actually needs them to diagnose a failure.

A passing preflight is not a performance pass and not a walkthrough pass. Only
measured execution of the exact packaged bundle can establish those.
