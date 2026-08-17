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
Max and 128 GB of unified memory. That machine exceeds the 48 GB memory floor
ADR-0001 set, and it is the machine on which the work will actually be done.

Continuing to name Windows as the release target while all development happens
on macOS would leave the repository asserting a gate nobody routinely
exercises. The native source was already portable when this decision was made.

This ADR adapts only platform-specific implementation and verification clauses.
It does not replace the clinical, educational, privacy, world-first,
accessibility, scope-control, or learner-loop requirements, and it does not
disturb the MetaHuman scope control in ADR-0001 section 4.

## Decision

### 1. Apple silicon macOS is the production platform

Unreal Engine 5.8 remains the production client. The production platform is
macOS on Apple silicon. Windows is no longer the release target.

The reference workstation is an Apple M4 Max with at least 48 GB of unified
memory, at least 100 GB free on the project drive, a macOS release listed as
supported by Unreal Engine 5.8, and the Xcode version required by that engine
release. Intel Macs are out of scope.

The Windows PowerShell workflow under `Scripts/` is retained as a historical
and optional path. It is no longer the release gate.

### 2. The packaged macOS application replaces the packaged Windows executable

Acceptance step 1 is launching the exact packaged macOS `.app` bundle
identified by the package manifest. The remaining 18 semantic steps stay in
force. The bundle must be ad-hoc signed so it launches without a Gatekeeper
bypass. Manually clearing quarantine attributes invalidates the walkthrough.

### 3. The quality gate keeps its learner-facing bar

Stable 60 FPS at 2560×1440, 95th-percentile frame time no greater than 16.7 ms,
on the Apple silicon reference workstation. No Windows performance figure may
be carried forward, because none was ever measured.

### 4. MetaHuman scope is unchanged

Dr. Patel remains the only initial MetaHuman character-quality gate.

## Requirements that are not rebaselined

The 19-step learner-loop semantics, the team-room / corridor / Exam Room 3
priority, synthetic-only cases, formal review, deterministic truth, keyboard
and mouse without VR, and the ban on expanding hospital breadth before the
first complete slice all remain in force.

## Rejected alternatives

Keep Windows as the release target and develop on macOS. Dual-target the first
release. Delete the PowerShell workflow. Lower the FPS bar because the
renderer changed.
