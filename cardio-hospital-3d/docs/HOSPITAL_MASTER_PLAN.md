# Pediatric Hospital — Architecture and Milestone Plan

This document is intentionally **not** a resume point or current-status ledger.

- Current repository/program state: root `MASTER_PLAN.md`
- Hospital-local invariants and physical-iPhone acceptance: `cardio-hospital-3d/AGENTS.md`
- Completed desktop evidence: `docs/BEHAVIORAL_ACCEPTANCE_2026-09-03.md`
- Clinical evidence/governance: `docs/CLINICAL_VALIDATION.md`
- Historical implementation record: `docs/IMPLEMENTATION_STATUS.md`

## North star

Build one persistent pediatric hospital simulation where the learner moves through a 3D hospital, receives work, evaluates patients, performs clinical tasks, makes decisions, and experiences downstream consequences without switching between separate products.

The 3D hospital is the spatial interface. Clinical tools open in context inside the same application. One event-driven engine owns runtime truth.

## Product experience

The learner launches **Pediatric Hospital** from one URL or Home Screen icon and can:

- walk through clinical areas;
- receive pages and competing requests;
- interact with patients, families, clinicians, workstations, and equipment;
- open embedded clinical tools for history, examination, ECG, imaging, testing, management, and disposition;
- make decisions that alter the patient trajectory and later work;
- leave and return without losing canonical state;
- accumulate longitudinal learning history;
- receive a shift-level debrief based on actual actions and priorities.

## Architecture

### 1. Immutable content layer

Existing case definitions remain the source of synthetic patient facts. Versioned clinical-policy modules may define reviewed interpretation, scoring, management boundaries, or teaching policy without silently rewriting immutable patient facts.

Clinical content must pass the repository clinical-validation process before activation.

### 2. Canonical simulation engine

The engine owns mutable runtime truth through:

- a versioned `HospitalState` schema;
- typed domain events;
- a pure reducer/state-transition function;
- selectors for UI/world consumption;
- deterministic simulation time;
- versioned persistence and migrations;
- learner attempt/mastery integration.

Representative events include `SHIFT_STARTED`, `LOCATION_CHANGED`, `PAGE_RECEIVED`, `PAGE_ACKNOWLEDGED`, `PATIENT_ARRIVED`, task lifecycle events, encounter lifecycle events, history/exam/test events, `DIAGNOSIS_COMMITTED`, `MANAGEMENT_SELECTED`, `SAFETY_EVENT_RECORDED`, `PATIENT_TRANSFERRED`, and `TIME_ADVANCED`.

### 3. Hospital world

React Three Fiber + Three.js + Rapier is the spatial shell. World objects dispatch domain events and render from selectors. Rooms, monitors, patients, doors, and workstations may own transient visual state but never clinical truth.

### 4. Embedded clinical tools

Clinical tools are overlays/workstations inside the same application. The interaction model supports:

- history;
- confidential adolescent history where appropriate;
- focused examination;
- interactive auscultation;
- ECG acquisition/interpretation;
- diagnostic-test selection;
- assessment/management;
- scoring/debrief;
- completion and replay while preserving prior attempt history.

### 5. Persistence

Persistence is local, deterministic, versioned, and explicitly migrated. A backend remains deferred until a concrete requirement exists that cannot be met safely client-side, such as multi-device synchronization, accounts, collaborative sessions, or instructor dashboards.

## Canonical and reference sources

### Canonical

`cardio-hospital-3d/` is the hospital application. Runtime truth belongs to its canonical engine and adapters.

### Reference only

- `/cardiohospital/`
- `/phs/`
- `stevetodman/pediatric-hospital-world`
- `stevetodman/3dworld`
- `stevetodman/the_ward`

Reference implementations may inform behavior or visuals but must not be reconnected as parallel runtime truth.

## Milestone design

Milestone completion/current gating belongs in root `MASTER_PLAN.md` and local `AGENTS.md`. The definitions below describe durable scope and exit criteria only.

### M0 — Governance and drift prevention

Purpose: make canonical ownership, clinical governance, handoff, and change boundaries explicit.

### M1 — Canonical engine foundation

Deliverables include typed events, versioned state, pure reduction, persistence/migrations, selectors, deterministic scheduling, and consequence reconciliation.

Exit criterion: clinical encounters and hospital work are represented through one engine rather than competing runtime stores.

### M2 — HCM clinical vertical slice

Deliverables include the complete React clinical loop: history, examination/auscultation, ECG, testing, assessment/management, debrief/scoring, completion, and replay-safe attempts.

Exit criterion: the unified app can run the HCM loop without depending on the legacy `/cardiohospital/` runtime.

### M3 — World/encounter integration

Deliverables include canonical patient entities, room interaction, state-preserving overlay transitions, world objectives from selectors, and no duplicate encounter state.

Exit criterion: one patient, one encounter, one state across world and clinical UI.

### M4 — One-product navigation and mobile/PWA shell

Deliverables include responsive desktop/iPhone UX, touch movement/look/interact controls, PWA behavior, portrait/landscape support, safe-area handling, and one launch identity.

Exit criterion: demonstrated usable as one product on desktop and a real iPhone, including installed/Home Screen behavior where required.

### M5 — Hospital work system

Deliverables include pager, consult and non-patient tasks, Worklist projection, deterministic priority/deadline ordering, simulation time, schedule-driven releases, persisted consequences, persistent shift state, workstation completion, and multiple competing clinical/work tasks.

Exit criterion: the learner can manage competing work during a shift with correct reload/resume behavior on target devices.

### M6 — Department expansion

Planned sequence:

1. outpatient clinic depth;
2. echo;
3. PICU;
4. NICU;
5. MRI;
6. cath;
7. OR;
8. longitudinal follow-up.

Each department must use the existing event/state engine. Every new clinical case must pass clinical validation before runtime activation.

### M7 — Visual realism

Only after architecture, interaction loops, mobile behavior, workload flow, and department boundaries are stable:

- higher-fidelity rooms and props;
- improved lighting/materials;
- characters/animation;
- ambient audio;
- performance LOD/streaming where justified.

### M8 — Validation and retirement

Deliverables include clinical review of active teaching cases, cross-device regression, state-migration validation, performance budgets, final legacy-parity review, and explicit retirement/archive decisions for reference implementations.

## State-model principles

`HospitalState` contains only serializable domain state. Typical top-level concepts include shift, learner, world, pager, tasks, encounters, patients, results, and timeline.

Do not place Three.js objects, DOM nodes, React state, audio nodes, functions, Sets, Maps, or transient UI state in canonical storage.

Legacy pager/rotation stores remain references where the unified engine has already assumed ownership.

## Clinical interaction principles

- Free navigation is preferred when safe and educationally useful.
- Safety-critical decisions should be explicit and attributable.
- Unnecessary testing may have downstream consequences rather than only point penalties.
- Missed red flags should affect debriefs and longitudinal outcomes.
- Confidential history must remain appropriately gated.
- Diagnostic displays should require learner interpretation before teaching labels when that is the learning objective.
- Synthetic patient facts must not be silently changed to simplify teaching logic.
- Versioned clinical-policy modules define reviewed interpretation/teaching boundaries where needed.

## Performance principles

- Treat iPhone as a first-class target.
- Keep collision geometry simpler than render geometry.
- Cap device pixel ratio when measured performance requires it.
- Lazy-load heavy departments/diagnostic viewers when justified.
- Dispose audio/graphics resources when interfaces close.
- Avoid loading the entire hospital at maximum fidelity when streaming is simpler and faster.
- Do not infer device thermal/performance acceptance from desktop CI.

## Testing principles

Keep regression coverage small and high value:

1. reducer/event-transition invariants;
2. persistence round-trip/migration invariants;
3. schedule/consequence invariants;
4. focused world-zone/interaction invariants where deterministic;
5. focused clinical/noninterference regressions;
6. targeted browser/device acceptance for behavior code tests cannot prove.

Add tests to protect demonstrated invariants, not to increase test count.

## Durable boundaries

- Keep one canonical hospital engine and product.
- Do not reconnect legacy pager/rotation/runtime stores.
- Do not silently alter clinical content or provenance.
- Do not add a backend without a concrete requirement.
- Do not replace focused regression coverage with a large slow suite by default.
- Do not treat reference repositories/routes as parallel implementation targets.
- Use root `MASTER_PLAN.md` and local `AGENTS.md` for current priorities and acceptance gates; do not add current branch/SHA/run/resume prose back to this file.
