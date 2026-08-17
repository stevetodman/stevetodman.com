# Standard-user workstation request

Use this template when the target workstation is managed and the developer
does not have administrator rights. The project scripts never install software,
change policy, or request elevation.

## Request for IT

Please provision or confirm the following on the Windows development
workstation:

- Windows 11 x64, at least 48 GB installed RAM, and a desktop NVIDIA GeForce
  RTX 4080/4090 or RTX 5080/5090.
- The current stable NVIDIA Studio Driver.
- Unreal Engine 5.8, including its Windows prerequisites and Win64 target
  support, installed in a location the standard user can read and execute.
- Visual Studio 2022 17.14 or newer, or a UE 5.8-supported Visual Studio 2026
  installation, with **Game development with C++**
  (`Microsoft.VisualStudio.Workload.NativeGame`).
- An x64 MSVC toolset version 14.38 or newer and Windows SDK 10.0.22621.0 or
  newer.
- Git for Windows and Node.js 24 available to the standard user. The project
  can also use the Node.js 24 runtime bundled with Codex when that managed app
  is already installed.
- At least 100 GB free on the user-writable project drive for generated
  project files, compilation, cooking, and package output.
- Permission for the standard user to run the approved Unreal executables,
  Visual Studio build tools, Git, Node.js, and repository PowerShell scripts.

No institutional credentials, elevated shell, inbound service, or firewall
exception is required by these project scripts.

## Verification after provisioning

From a normal, non-elevated PowerShell prompt in `cardiohospital-unreal`, run:

```powershell
./Scripts/Run-Monday-Preflight.ps1
```

For a non-standard Unreal installation, add
`-EngineRoot "D:\path\to\UE_5.8"`. The JSON report separates items the user can
address from items requiring IT or administrator action and is written to a
unique file under `Saved/WorkstationReports`. Do not bypass a failed hardware,
compiler, SDK, or engine check.
