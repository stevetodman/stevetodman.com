# Platform paths

macOS on Apple silicon is the release target, decided in
[`ADR-0002-macos-release-target.md`](ADR-0002-macos-release-target.md). This
document explains what each path in the repository may claim.

## The three paths

| Path | Status | May claim |
| --- | --- | --- |
| macOS shell workflow (`Scripts/*.sh` on the macOS branch) | Release | Everything, up to the packaged walkthrough |
| Portable Node tooling (`Tools/`, `Tests/`) | Supporting | Clinical content and deterministic behaviour, on any platform |
| Windows PowerShell workflow (`Scripts/*.ps1`) | Retained, optional | Nothing about the current release |

Browser projects remain `PREVIEW-ONLY`.

## What a macOS session may and may not claim

A macOS session may claim a gate passed only when that gate actually ran on
the packaged `.app`. `UnrealEditor-Cmd` can exit zero when no test matched
the filter — `run-automation.sh` must see the exported `index.json`.
Preflight is not a performance result. No inherited Windows FPS figure is
evidence. A walkthrough with any failed, blocked, skipped, or unimplemented
step is a failure.

## Keeping the source portable

Neither target declares `SupportedPlatforms`. The module depends only on
`Core`, `CoreUObject`, `Engine`, `Json`, and `JsonUtilities`. Do not add
`Windows.h`, `PLATFORM_WINDOWS`, or `_WIN32` to clinical, education, or
learner code.

## Differences that will bite

- Clang is not MSVC.
- Metal is not Direct3D 12. Measure Lumen/Nanite settings on the M4 Max.
- MetaHuman tooling is still Windows-first in places; record gaps honestly.
- `package-macos.sh` ad-hoc signs the bundle. Clearing quarantine by hand
  invalidates the walkthrough.
- `xcrun -f metal` can succeed when the Metal compiler is absent. Preflight
  must run `xcrun metal --version`.
- A force-killed packaged app can leave a "reopen windows?" alert. Set
  `ApplePersistenceIgnoreState` for the bundle id, do not click through as
  if it were a learner launch.
- GameController delivers the desk mouse to the packaged game even under
  `-RenderOffscreen`. Issue `SetMouseSensitivity 0` before scripted shots.
