# ADR-0001: Rebaseline the production client on Unreal Engine 5.8

- Status: Accepted
- Superseded-by (platform, launch surface, and performance hardware only):
  [`ADR-0002-macos-release-target.md`](ADR-0002-macos-release-target.md)
- Decision date: 2026-08-14
- Authority: Product owner confirmation that `LegacyCore/plan.md` is the
  authoritative 168-section plan
- Assessment base: `2b9b0ffe13417e436d16985ae318eceab652ecda`
- Trace: [`../SPEC_TRACEABILITY.md`](../SPEC_TRACEABILITY.md)

## Context

The authoritative plan was written for a desktop-browser product. It names
Three.js as the renderer, Chrome as the first acceptance-test launch target,
and a typical laptop as the performance floor. It also directs the team not to
start by building photorealistic avatars.

The approved native direction is a high-fidelity Unreal Engine 5.8 client for
Windows, with packaged-executable evidence, a 2560x1440 RTX-class quality gate,
and a bounded MetaHuman character-quality spike. Without an explicit decision,
the repository would contain mutually incompatible definitions of success.

This ADR adapts only platform-specific implementation and verification clauses.
It does not replace the clinical, educational, privacy, world-first,
accessibility, scope-control, or learner-loop requirements in the source plan.

## Decision

### 1. Unreal Engine 5.8 is the production client

The production high-fidelity client uses Unreal Engine 5.8. The original
Next.js, React, Three.js, React Three Fiber, Rapier, WebGPU/WebGL, GLB-runtime,
and browser-module prescriptions are no longer mandatory for the production
client.

The inherited browser projects remain curriculum and interaction previews.
They may inform clinical flow and blockout decisions, but they do not count as
native implementation, Unreal compilation, packaged behavior, or release
evidence.

The following intent survives unchanged:

- modular world construction and measurable scene budgets;
- deterministic clinical truth independent of rendering and dialogue;
- single-player and keyboard/mouse first;
- world-first interaction with minimal UI;
- progressive loading and conservative performance practices; and
- platform-independent authored clinical content where practical.

This decision is the reason specification sections 70, 107, 108, and 110 are
marked `SUPERSEDED` rather than `MISSING`.

### 2. The packaged Windows executable replaces Chrome as the release gate

In section 166, acceptance step 1 is adapted from loading the application in
Chrome to launching the exact packaged Windows executable identified by the
package manifest. The remaining 18 semantic steps stay in force.

A successful editor session, PIE run, portable test run, cook, package command,
or browser demonstration cannot satisfy the packaged walkthrough. A pass
requires all of the following from the same immutable package:

1. clean committed source provenance;
2. successful Unreal build, automation, cook, and packaging gates;
3. a launch of the packaged executable;
4. completion of all 19 mapped acceptance steps;
5. required accessibility and 2560x1440 performance observations; and
6. preserved capture evidence tied to the package manifest.

`WALKTHROUGH_CHECKLIST.md` and `Scripts/Record-WalkthroughEvidence.ps1` encode
this evidence boundary. Their existence is not evidence that a walkthrough has
passed.

The browser deployment may continue as a preview. It is not the production
acceptance surface after this decision.

### 3. The first native quality target is RTX-class, not typical-laptop parity

The initial native vertical slice targets stable 60 FPS at 2560x1440 on a
desktop RTX 4080/4090 or RTX 5080/5090-class development workstation using the
approved quality settings. The exact package must preserve measurements for
FPS, frame time, draw calls, triangle count, GPU or texture memory, NPC count,
and startup behavior.

This is a quality target for the first high-fidelity slice, not a claim that the
product requires that class of hardware forever. The original typical-laptop
support goal and 30 FPS minimum become a later compatibility and scalability
track. They remain unfulfilled until lower quality tiers and representative
lower-spec hardware are explicitly tested.

No documentation may translate a passing workstation preflight into a
performance pass. Only measured packaged execution can do that.

This decision is the reason section 106 is marked `SUPERSEDED` and section 152
remains `WORKSTATION-GATED`.

### 4. MetaHuman is a bounded quality spike, not a cast-first strategy

The source plan calls for stylized-realistic people, warns against uncanny
photorealistic faces, and says not to build photorealistic avatars first. The
native handoff asks for MetaHuman presentation. These directions conflict if
MetaHuman work expands before the learner loop is proven.

The approved exception is therefore narrow:

- Dr. Patel is the only initial MetaHuman character-quality gate.
- MetaHuman actors are presentation adapters and never store clinical truth,
  scoring state, or case progression.
- The Dr. Patel gate starts only after the baseline Unreal project compiles and
  the team-room-to-exam-room slice is underway.
- The gate includes voice, listening pose, gaze, blink, facial motion, and
  acceptable real-time performance; appearance alone is insufficient.
- No patient, parent, background cast, wardrobe breadth, cinematic pass, or
  photorealistic-avatar program begins before the packaged learner loop passes.
- Primitive NPCs may be used in internal blockouts but may not ship in a
  production build.
- Cinematic photorealism is not a product acceptance criterion. Medical
  clarity, believable proportion, non-distracting expression, performance, and
  avoidance of uncanny-valley failure remain the quality criteria.

This controlled exception is the reason section 143 is marked `SUPERSEDED`.
Character-visual, animation, gaze, facial-motion, and accessibility
requirements remain active and incomplete until demonstrated in the package.

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

- Native animation, lighting, audio, interaction, and character systems have a
  single production target.
- Package provenance and workstation captures provide stronger release
  evidence than an editor or browser-only claim.
- Browser clinical work remains reusable as a renderer-independent authoring
  and test layer.
- MetaHuman scope is constrained to the smallest useful character-quality
  experiment.

Costs and risks:

- The first production build is Windows-specific and requires a provisioned
  Unreal workstation.
- Browser and native presentation can diverge unless the generated clinical
  artifact remains the single source of runtime truth.
- RTX-first quality can conceal lower-spec problems; compatibility must be a
  separately measured future track.
- MetaHuman polish can consume disproportionate time; the one-character and
  post-baseline gates are mandatory scope controls.
- The inherited browser implementation cannot be credited as Unreal progress.

## Rejected alternatives

### Keep Chrome and Unreal as equal production targets

Rejected for the first release. It would create two presentation acceptance
surfaces and split scarce world, interaction, accessibility, and end-to-end
test effort. Browser projects remain previews unless a later ADR funds them as
a separately supported product.

### Retain the typical-laptop target for the first high-fidelity slice

Rejected as the initial native evidence target because it is undefined without
a specific hardware profile and conflicts with the approved RTX workstation
quality gate. Lower-spec support is deferred, not abandoned.

### Build a full MetaHuman cast immediately

Rejected because it directly recreates the scope failure warned about in
section 143. One attending is enough to prove the character pipeline and
dialogue quality gate.

### Treat browser preview behavior as native acceptance evidence

Rejected. It would conflate renderer-independent curriculum progress with
Unreal world, presentation, package, and hardware evidence.

## Verification

This ADR is correctly applied only while all of these remain true:

- `CardioHospital.uproject` identifies Unreal Engine 5.8.
- `AGENTS.md` retains the 2560x1440 stable-60-FPS RTX target, keyboard/mouse
  requirement, production placeholder ban, and truthful walkthrough rule.
- portable CI makes no Unreal compile, cook, package, or walkthrough claim;
- `SPEC_TRACEABILITY.md` marks browser demonstrations `PREVIEW-ONLY` and
  unrun native gates as partial, missing, or workstation-gated;
- the first MetaHuman scope is limited to Dr. Patel; and
- the package manifest starts with walkthrough failure and is upgraded only by
  evidence from the exact packaged executable.

Any change to the production renderer, launch surface, performance hardware,
or MetaHuman scope requires a new ADR and a corresponding traceability update.
