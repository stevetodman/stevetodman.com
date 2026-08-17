# Engineering requirement coverage

`LegacyCore/plan.md` is the authoritative 168-section product specification;
the product owner confirmed that authority on 2026-08-14. The complete
one-row-per-section ledger is
[`SPEC_TRACEABILITY.md`](SPEC_TRACEABILITY.md); this file is the engineering
summary. The plan was
written for a browser-first Three.js implementation; this directory is the
approved Unreal Engine 5.8 high-fidelity adaptation. Browser-specific stack and
deployment details are therefore historical constraints, while the clinical,
educational, privacy, scope, testing, performance, and acceptance intent still
applies.

The exact platform rebaseline is recorded in
[`Docs/ADR-0001-unreal-5-8-product-rebaseline.md`](Docs/ADR-0001-unreal-5-8-product-rebaseline.md).

Statuses below describe evidence in this repository, not aspirational claims.

| Original sections | Requirement | Current coverage | Status |
| --- | --- | --- | --- |
| 83, 109–110, 160, 165 | Clinical truth, case progression, scoring, and education remain independent of rendering and generative dialogue. | Generated schema-v3 truth, `UCardioClinicalDataSubsystem`, `UCardioCaseRuntimeSubsystem`, portable engines, and architecture rules enforce the boundary. | Covered in source; first UE compile still pending. |
| 106, 147, 152 | Measure performance and maintain a conservative scene budget. | The Unreal target is stable 60 FPS at 2560×1440. `WALKTHROUGH_CHECKLIST.md` requires preserved FPS, frame-time, draw-call, triangle, GPU/texture-memory, NPC-count, and startup evidence. | Workflow covered; real package evidence pending. |
| 108 | Recommended browser software stack. | Superseded for this high-fidelity client by Unreal Engine 5.8. The deterministic clinical core remains renderer-independent. | Intentionally adapted. |
| 123–124, 148, 151, 158 | Versioned cases, sources/review metadata, result completeness, reachability, consistency, and medical review. | Export/contract validation, case-authoring diagnostics, reachability and deterministic-path tests run on Windows and Linux. Review fields remain explicitly pending. | Partial: nine ready graphs and zero blocking errors; disclosed structured-result warnings require clinical review. |
| 128 | No real patient information or PHI. | Synthetic data rule in `AGENTS.md`, clinical metadata checks, identity-free learner tests, ignored local reports, and evidence privacy warnings. | Covered for current artifacts. |
| 131–145, 167 | Build the narrow outpatient vertical slice before expanding the hospital. | README, handoff, and engineering rules constrain work to the team-room/corridor/exam-room learner loop; nine deterministic clinic cases now exist. | Curriculum core expanded; world/presentation implementation pending. |
| 149 | Teleport, state triggers, case-variable display, navigation and performance debug tools. | No production-ready Unreal debug interface exists yet. | Pending after the baseline UE compile gate. |
| 150 | Unit, integration, and end-to-end tests. | Portable unit/integration suite, two locally passing browser HCM Playwright paths, Unreal automation wrapper/report validation, PowerShell fixture suite, and CI matrices exist. | Portable and local browser gates pass; GitHub browser result and packaged Unreal end-to-end run remain pending. |
| 151 | Every exposed order has a result; no dead ends, contradictions, or false full scores. | Deterministic paths, unsafe paths, reachability, result prerequisites, and scoring safeguards are tested. Structured-result warnings are explicitly blocked from gameplay exposure. | Partial pending medically reviewed result content. |
| 153 | Versioned deployment and independently verifiable packages. | Packaging requires clean committed Git source and records source, engine/toolchain versions, per-file SHA-256, package ID, and walkthrough state. Release publication remains a deliberate external step. | Package workflow covered; no release claimed. |
| 154 | Load only the first world/case initially and stream later content. | The repository is scoped to the first slice, but packaged streaming behavior has not been implemented or measured. | Pending. |
| 159 | Graceful runtime fallbacks for failed AI, assets, and speech. | Build scripts fail clearly and preserve diagnostic output. Runtime structured dialogue, asset, and typed-speech fallbacks are not yet connected. | Tooling covered; runtime behavior pending. |
| 166 | Nineteen-step vertical-slice acceptance test. | `WALKTHROUGH_CHECKLIST.md` maps all 19 steps to Unreal. The macOS `record-walkthrough-evidence.sh` path is the release recorder (ADR-0002); the PowerShell recorder is retained history. Neither can mark a pass without every step, fresh preflight, metrics, and a capture artifact. | Workflow covered; actual walkthrough pending. |

## Unreal workstation and handoff additions

The Unreal migration adds local requirements that were not part of the
browser-first source specification:

- Windows 11, at least 48 GB installed RAM, 100 GB free, and a supported desktop
  RTX GPU;
- Unreal Engine 5.8, a supported Visual Studio/MSVC toolchain, and Windows SDK;
- normal-user operation after IT provisioning, with no installation or
  elevation attempts from repository scripts; and
- a truthful separation between portable CI, UE compilation/automation,
  packaging, and the physical packaged walkthrough.

`Run-Monday-Preflight.ps1`, the resumable `Run-FirstBuild.ps1`,
`IT_PREREQUISITES.md`, `LOCAL_HANDOFF.md`, and the package/evidence manifests
cover those requirements. Passing one gate never implies that a later gate
passed.

## Current evidence boundary

The repository can currently prove portable clinical/test consistency and the
static behavior of its Windows orchestration. It cannot yet prove Unreal Header
Tool success, C++ compilation, cooking, packaged execution, presentation
quality, or real RTX performance. Those remain Monday workstation evidence and
must not be described as complete until their actual artifacts exist.
