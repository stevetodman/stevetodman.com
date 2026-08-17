# ADR-0002: Rebaseline the release target on macOS and Apple silicon

- Status: Accepted
- Decision date: 2026-08-15
- Supersedes: platform, launch-surface, and performance-hardware clauses of
  [`ADR-0001-unreal-5-8-product-rebaseline.md`](ADR-0001-unreal-5-8-product-rebaseline.md)
- Authority: Product owner decision that the primary development and release
  machine is an Apple silicon MacBook Pro
- Assessment base: `2b9b0ffe13417e436d16985ae318eceab652ecda`, unchanged from
  ADR-0001 because no specification section changed status under this decision
- Trace: [`../SPEC_TRACEABILITY.md`](../SPEC_TRACEABILITY.md)

## Context

ADR-0001 rebaselined the production client from a desktop browser to Unreal
Engine 5.8, and chose Windows with an RTX 4080/4090 or RTX 5080/5090-class
workstation as the release target. That choice followed from the hardware
available on 2026-08-14.

The product owner's primary machine is a 16-inch MacBook Pro with an Apple M4
Max and 128 GB of unified memory, running macOS Tahoe 26.6.1. That machine
exceeds the 48 GB memory floor ADR-0001 set by a wide margin, and it is the
machine on which the work will actually be done.

Splitting development from evidence across two machines was considered and
rejected below. Continuing to name Windows as the release target while all
development happens on macOS would leave the repository asserting a gate nobody
routinely exercises, which is the same failure mode ADR-0001 was written to
prevent.

The native source was already portable when this decision was made. Both target
rules declare no `SupportedPlatforms` restriction, the module depends only on
`Core`, `CoreUObject`, `Engine`, `Json`, and `JsonUtilities`, and no source file
references `Windows.h`, `PLATFORM_WINDOWS`, `_WIN32`, or a Windows-only API.
This decision therefore changes the release platform, not the architecture.

This ADR adapts only platform-specific implementation and verification clauses.
It does not replace the clinical, educational, privacy, world-first,
accessibility, scope-control, or learner-loop requirements in the source plan,
and it does not disturb the MetaHuman scope control in ADR-0001 section 4.

## Decision

### 1. Apple silicon macOS is the production platform

Unreal Engine 5.8 remains the production client. The production platform is
macOS on Apple silicon. Windows is no longer the release target.

The reference workstation is an Apple M4 Max with at least 48 GB of unified
memory, at least 100 GB free on the project drive, a macOS release listed as
supported by Unreal Engine 5.8, and the Xcode version required by that engine
release. Intel Macs are out of scope.

The Windows PowerShell workflow under `Scripts/` is retained as a historical
and optional path. It is no longer the release gate, no longer required to
pass, and no longer describes the supported prerequisites. It is kept rather
than deleted because its portable fixtures still pass and deleting it would
discard tested work for no benefit.

This decision does not re-mark any specification section. Sections 70, 106,
107, 108, 110, and 143 remain `SUPERSEDED`, now by this ADR's platform terms
rather than ADR-0001's, and section 152 remains `WORKSTATION-GATED` against the
macOS reference workstation.

### 2. The packaged macOS application replaces the packaged Windows executable

In section 166, acceptance step 1 was adapted by ADR-0001 from loading the
application in Chrome to launching the exact packaged Windows executable. That
substitution is replaced: acceptance step 1 is launching the exact packaged
macOS application bundle identified by the package manifest. The remaining 18
semantic steps stay in force, unchanged in meaning.

A successful editor session, PIE run, portable test run, cook, package command,
or browser demonstration cannot satisfy the packaged walkthrough. A pass
requires all of the following from the same immutable package:

1. clean committed source provenance;
2. successful Unreal build, automation, cook, and packaging gates;
3. a launch of the packaged application bundle;
4. completion of all 19 mapped acceptance steps;
5. required accessibility and 2560x1440 performance observations; and
6. preserved capture evidence tied to the package manifest.

The application bundle must be ad-hoc signed at minimum so that it launches on
the reference workstation without a Gatekeeper bypass. Distribution signing and
notarization are out of scope until a distribution ADR exists. Manually
clearing quarantine attributes to make an unsigned bundle launch invalidates the
walkthrough, because it is not the launch path a learner would have.

`WALKTHROUGH_CHECKLIST.md` and `Scripts/record-walkthrough-evidence.sh` encode
this evidence boundary. Their existence is not evidence that a walkthrough has
passed.

### 3. The quality gate keeps its learner-facing bar and changes hardware class

The initial native vertical slice targets stable 60 FPS at 2560x1440 on the
Apple silicon reference workstation using the approved quality settings. The
learner-facing bar is deliberately unchanged from ADR-0001: 60 FPS average and
a 95th-percentile frame time no greater than 16.7 ms. Only the hardware class
and renderer change.

The exact package must preserve measurements for FPS, frame time, draw calls,
triangle count, GPU or texture memory, NPC count, and startup behavior.

Metal is not Direct3D 12. Nanite and Lumen behave and perform differently on
Apple silicon, and the quality settings that reach this bar must be established
by measurement on the reference workstation rather than inherited from the
Windows profile. No previously recorded Windows figure may be carried forward
as evidence, because none was ever measured.

The original typical-laptop support goal and 30 FPS minimum remain a later
compatibility and scalability track, unfulfilled until lower quality tiers and
representative lower-spec hardware are explicitly tested.

No documentation may translate a passing workstation preflight into a
performance pass. Only measured packaged execution can do that.

### 4. MetaHuman scope is unchanged

ADR-0001 section 4 stands in full. Dr. Patel remains the only initial MetaHuman
character-quality gate, MetaHuman actors remain presentation adapters that never
store clinical truth, and no cast expansion begins before the packaged learner
loop passes.

MetaHuman tooling support on macOS must be confirmed before the Dr. Patel gate
starts. If a required authoring feature proves unavailable on macOS, that is a
character-pipeline finding to record honestly against the gate, not grounds to
weaken the gate or to silently reintroduce a Windows dependency.

## Requirements that are not rebaselined

This ADR does not waive or weaken:

- the 19-step learner-loop semantics after the launch-surface substitution;
- the narrow team-room, corridor, Exam Room 3 vertical-slice priority;
- synthetic-only cases and the prohibition on PHI;
- formal clinical review, source attribution, and versioning requirements;
- deterministic clinical truth and scoring boundaries;
- keyboard/mouse usability without VR;
- accessibility and motion-sickness requirements;
- truthful separation of portable CI, Unreal compilation, packaging,
  walkthrough, and performance evidence; or
- the ban on expanding hospital breadth before the first complete slice.

## Consequences

Positive consequences:

- Development and release evidence occur on one machine, so the release gate is
  exercised continuously instead of episodically.
- Unified memory well above the previous floor benefits editor sessions,
  MetaHuman import, and cook throughput.
- The portable clinical core is unaffected, and its cross-platform CI already
  proves it.
- Keeping the native source free of platform conditionals is now enforced by
  the release path rather than by convention alone.

Costs and risks:

- No Windows build is produced. If residents on Windows are a distribution
  requirement, that needs a distribution ADR and a second package target.
- Clang and MSVC reject different code. Portability regressions toward
  Clang-only constructs will not be caught until a Windows target returns.
- Metal-path maturity for Nanite and Lumen is less proven than Direct3D 12, and
  the quality settings that reach the gate are not yet known.
- MetaHuman feature coverage on macOS is unconfirmed and may constrain the
  Dr. Patel gate.
- The PowerShell workflow becomes untested-in-practice legacy, and its fixtures
  can drift from the shell path they mirror.

## Rejected alternatives

### Keep Windows as the release target and develop on macOS

Rejected. It preserves a release gate that is exercised only when the product
owner is physically at a second machine, and it makes the most important
evidence the least frequently produced. It also fragments the first-build
debugging loop across two toolchains at the exact moment the Unreal Header Tool
gate is still unconfirmed.

### Dual-target macOS and Windows for the first release

Rejected for the first slice, not forever. It doubles the packaging,
walkthrough, and performance-capture surface before a single learner loop has
been proven end to end, which is the scope failure the plan warns about in
section 143. Revisit once the vertical slice passes and the distribution
audience is known.

### Delete the Windows PowerShell workflow

Rejected. Its portable fixtures pass, it documents a working stage model, and
removing it would break tested files to make a point that this ADR already
makes in prose.

### Lower the performance bar because the hardware class changed

Rejected. The 60 FPS and 16.7 ms figures describe the learner's experience, not
the GPU. Changing them because the renderer changed would convert a quality
requirement into a hardware excuse.

## Verification

This ADR is correctly applied only while all of these remain true:

- `CardioHospital.uproject` identifies Unreal Engine 5.8.
- `AGENTS.md` retains the 2560x1440 stable-60-FPS target, keyboard/mouse
  requirement, production placeholder ban, and truthful walkthrough rule.
- portable CI makes no Unreal compile, cook, package, or walkthrough claim;
- `SPEC_TRACEABILITY.md` marks browser demonstrations `PREVIEW-ONLY` and unrun
  native gates as partial, missing, or workstation-gated;
- the native source remains free of platform conditionals in the clinical,
  education, and learner modules;
- the first MetaHuman scope is limited to Dr. Patel; and
- the package manifest starts with walkthrough failure and is upgraded only by
  evidence from the exact packaged application bundle.

Any change to the production renderer, launch surface, performance hardware, or
MetaHuman scope requires a new ADR and a corresponding traceability update.
