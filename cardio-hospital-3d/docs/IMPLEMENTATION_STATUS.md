# Pediatric Hospital — Historical Implementation Ledger

This file is historical evidence, **not** the current resume point.

For current state and next action, use:

- root `MASTER_PLAN.md` — canonical repository/program handoff;
- `cardio-hospital-3d/AGENTS.md` — hospital-local invariants and remaining physical-iPhone acceptance;
- `docs/BEHAVIORAL_ACCEPTANCE_2026-09-03.md` — completed desktop behavioral evidence;
- `docs/CLINICAL_VALIDATION.md` — clinical validation/evidence governance.

Do not add current branch/SHA/run/"resume here" prose back to this file.

## Historical milestone record

### M0 — Governance and drift prevention

Established the unified hospital direction, clinical governance, canonical architecture, and focused CI boundaries.

Historical artifacts included a dedicated migration branch and several now-retired handoff/rules files. Their durable rules have since been consolidated into root `MASTER_PLAN.md`, root `AGENTS.md`, and `cardio-hospital-3d/AGENTS.md`.

### M1 — Canonical engine foundation

Implemented:

- versioned serializable `HospitalState`;
- typed domain events;
- pure deterministic reducer;
- timeline/event history;
- canonical patient/task/encounter/pager state;
- selectors and simulation-time formatting;
- versioned persistence with explicit migrations;
- Zustand adapter around canonical state;
- deterministic schedule and consequence reconciliation;
- persistence hydration guard to prevent early interaction from overwriting saved encounters.

Result: hospital work and encounters moved to one canonical runtime state rather than parallel stores.

### M2 — HCM React clinical vertical slice

Implemented the HCM loop in the unified React application without depending on the legacy `/cardiohospital/` runtime:

- history and red-flag recognition;
- confidential adolescent interview gating;
- focused cardiovascular examination;
- synthesized auscultation and Valsalva interaction;
- synthetic 12-lead ECG viewer with interpretation workflow;
- testing and risk-stratification choices;
- assessment/management commitment;
- safety-event recording;
- deterministic scoring and attending debrief;
- completion and replay with preserved prior attempts and fresh encounter IDs.

Intentional differences from legacy behavior were retained where the unified architecture or reviewed teaching policy was safer or more coherent.

### M3 — World/encounter integration

Implemented:

- canonical patient/task/encounter lifecycle events;
- Room 3 HCM interaction against canonical state;
- world objective/prompt projection from selectors;
- canonical location tracking;
- state-preserving entry/exit from clinical overlays;
- reload/resume of active encounters;
- patient/family actors projected from canonical state;
- confidential-parent disappearance behavior;
- patient removal after completion/transfer;
- replay-safe encounter creation;
- focused reducer regression coverage.

Result: one patient, one encounter, one state across world and clinical UI.

### M4 — Mobile/PWA implementation history

Implemented in code:

- touch movement joystick;
- touch-look gesture;
- on-screen interact control;
- safe-area-aware mobile controls;
- mobile clinical layout rules;
- iPhone-landscape hardening;
- corrected camera-relative horizontal movement for keyboard and joystick;
- `viewport-fit=cover` and Apple web-app metadata;
- installable PWA shell/service worker;
- portrait + landscape orientation support;
- unified Pediatric Hospital app identity.

Historical acceptance-prep fixes included:

- `a0fb3436d21f31cd193eb8f8bee7df15c92ab77b` — corrected reversed horizontal movement;
- `e4d3b45426c229d0d08d98234276c839ae43e63f` — removed landscape-only PWA restriction.

Desktop behavioral acceptance is recorded separately in `docs/BEHAVIORAL_ACCEPTANCE_2026-09-03.md`. Physical-iPhone acceptance remains governed by `cardio-hospital-3d/AGENTS.md`.

### M5 — Hospital workload and second consult

Implemented workload foundation:

- canonical pager receive/acknowledge state;
- pager-to-task linkage;
- consult and non-patient work tasks in the same canonical model;
- explicit task completion;
- Worklist projection independent of pager UI state;
- deterministic task ordering by priority/due/creation/id;
- simulation-time-driven schedule releases;
- deterministic work duration and time advancement;
- persisted/idempotent missed-deadline consequences;
- workstation completion flow;
- Room 1 location/geometry support;
- competing unfinished overnight handoff work preserved independently of consult completion.

Implemented second clinical consult:

- Ava Rodriguez post-race syncope case selected as a low-risk contrast to urgent HCM;
- dedicated evidence review and physician sign-off recorded in `docs/CLINICAL_VALIDATION.md`;
- reviewed policy module at `src/lib/clinical-policy/vasovagal-2026.ts`;
- preferred teaching diagnosis: probable post-exertional neurally mediated syncope;
- history + family history + examination + ECG emphasized rather than an "ECG only" shortcut;
- reassuring athletic sinus bradycardia handled as physiologic in the supplied case context;
- energy drinks/vaping treated as confidential-history/counseling targets rather than automatic advanced-testing triggers;
- additional tests represented conditionally rather than categorically wrong;
- return-to-play logic constrained by recovery and reassuring evaluation;
- deterministic schedule release after the HCM consult;
- canonical patient/page/task creation with idempotent reconciliation;
- Room 1 start/resume through the same canonical interaction path;
- patient/father actor projection including confidential-history behavior;
- complete history → exam → tests/ECG → assessment/management → debrief → completion/replay loop;
- policy-aware scoring and focused regression coverage for release, idempotency, HCM noninterference, handoff noninterference, completion/replay, diagnosis aliases, required history, ECG, and test stewardship.

## Durable implementation facts

- Canonical hospital source: `cardio-hospital-3d/`.
- Legacy/reference sources must not be reconnected as competing runtime state.
- `src/lib/cases-data.ts` contains synthetic patient facts; reviewed policy modules may define teaching interpretation/scoring boundaries without silently changing those facts.
- Canonical state is serializable and versioned; persistence migrations are explicit.
- React/Three.js/audio/UI state must not become parallel clinical truth.
- Clinical review provenance is authoritative only where explicitly recorded in the clinical-validation process.

## Historical testing approach

Focused regression coverage was intentionally preferred over a broad brittle suite. High-value coverage includes:

- reducer/event transitions;
- persistence round trip/migration;
- schedule/consequence invariants;
- world-zone/interaction invariants where deterministic;
- HCM vertical-slice behavior;
- Ava/handoff/HCM noninterference;
- targeted browser/device acceptance for behavior code-level tests cannot prove.

## Historical evidence boundary

Source inspection and CI were never considered substitutes for browser/device acceptance. Physical-device touch feel, PWA installation/orientation, audio behavior, collision ergonomics, and thermal/performance behavior require target-device evidence.

Current acceptance requirements are deliberately **not duplicated here**; see `cardio-hospital-3d/AGENTS.md`.
