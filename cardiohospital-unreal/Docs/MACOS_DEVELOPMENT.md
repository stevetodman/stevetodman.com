# Platform paths

macOS on Apple silicon is the release target, decided in
[`ADR-0002-macos-release-target.md`](ADR-0002-macos-release-target.md). This
document explains what each path in the repository may claim, so that a passing
command is never mistaken for a passing gate.

An earlier revision of this file described macOS as a non-evidence development
tier. ADR-0002 inverted that. The text is kept in history rather than silently
replaced, because the distinction it drew still matters — only the platform it
applied to changed.

## The three paths

| Path | Status | May claim |
| --- | --- | --- |
| macOS shell workflow (`Scripts/*.sh`) | Release | Everything, up to and including the packaged walkthrough |
| Portable Node tooling (`Tools/`, `Tests/`) | Supporting | Clinical content and deterministic behaviour, on any platform |
| Windows PowerShell workflow (`Scripts/*.ps1`) | Retained, optional | Nothing about the current release; kept as history |

The browser projects at `../cardiohospital/` and `../cardio-hospital-3d/`
remain curriculum and interaction previews. They are `PREVIEW-ONLY` and never
count as native implementation, Unreal compilation, packaged behaviour, or
release evidence.

## What a macOS session may and may not claim

A macOS session may claim a gate passed when it actually ran:

- clinical content authored, exported, and validated;
- portable deterministic tests passed;
- Unreal Header Tool accepted the reflected types;
- the editor target compiled;
- native Unreal automation passed, with an exported `index.json` to show it;
- a package was produced, with a manifest and SHA-256 provenance;
- the nineteen-step walkthrough was run, at the recorded outcome.

A macOS session may never claim:

- that a command's exit code alone proves a gate — `UnrealEditor-Cmd` can exit
  zero when no test matched the filter, which is why `run-automation.sh`
  requires the exported report;
- that a preflight pass is a performance result;
- that any figure was measured when it was not, including a figure inherited
  from the Windows profile, which was never measured on any hardware;
- that a walkthrough passed when any step was failed, blocked, skipped, or
  unimplemented.

## Why the Windows path is retained

The PowerShell workflow is tested, documents a working stage model, and its
fixtures still pass. ADR-0002 rejected deleting it: removing tested files makes
a point that the ADR already makes in prose.

Both workflows use the same stage vocabulary — `preflight`, `validation`,
`project-generation`, `editor-build`, `automation`, `package` — so a
`resumeCommand` reads the same regardless of which produced the report. A
fixture asserts that parity in both directions, so the two cannot silently
diverge.

If a Windows package is ever needed for distribution, that requires a new ADR,
not a quiet revival of the old path.

## Keeping the source portable

The native source carries no platform lock, and that is a property to preserve:

- neither target rule declares a `SupportedPlatforms` restriction;
- the module depends only on `Core`, `CoreUObject`, `Engine`, `Json`, and
  `JsonUtilities`;
- no source file references `Windows.h`, `PLATFORM_WINDOWS`, `_WIN32`, or a
  Windows-only API.

Keep clinical, education, and learner logic free of platform conditionals. The
portable core is what allows CI to prove determinism on three operating systems
while the release gate runs on one.

## Differences that will bite

- **Clang is not MSVC.** With Windows out of the release path, nothing catches
  a Clang-only construct until a Windows target returns. That is an accepted
  cost recorded in ADR-0002, not an oversight.
- **Metal is not Direct3D 12.** Nanite and Lumen behave and perform
  differently. The quality settings that reach 60 FPS at 2560x1440 must be
  established by measurement on the reference workstation.
- **MetaHuman tooling has been Windows-first.** Confirm the specific authoring
  features the Dr. Patel gate needs before planning around them. If something
  is unavailable, record it against the gate honestly.
- **Gatekeeper.** `package-macos.sh` ad-hoc signs the bundle so it launches
  normally. Clearing the quarantine attribute by hand to open an unsigned
  bundle invalidates the walkthrough, because it is not the learner's launch
  path.
