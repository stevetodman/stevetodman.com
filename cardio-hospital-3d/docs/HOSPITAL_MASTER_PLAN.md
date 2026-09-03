# Pediatric Hospital — Master Plan

## North star

Build one persistent pediatric hospital simulation where the learner moves through a 3D hospital, receives work, evaluates patients, performs clinical tasks, makes decisions, and experiences downstream consequences without ever switching between separate products.

The 3D hospital is the spatial interface. Clinical tools open in context inside the same application. One event-driven engine owns runtime truth.

## Final product experience

The learner launches **Pediatric Hospital** from one URL or Home Screen icon. A shift begins in the hospital. The learner can:

- walk through clinic, echo, MRI, cath, NICU, PICU, OR, workroom, and other hospital areas;
- receive pages and competing requests;
- enter patient rooms and interact with patients, parents, nurses, fellows, attendings, and equipment;
- open embedded clinical tools for history, examination, ECG, echo, imaging, orders, medications, consults, and disposition;
- make decisions that alter the patient trajectory and future encounters;
- leave and return without losing state;
- accumulate longitudinal learner mastery and receive adaptive future cases;
- complete a shift-level debrief based on actual actions and priorities.

## Architecture

### 1. Immutable content layer

Existing case definitions remain the clinical source of truth. They define synthetic patient facts, disclosure gates, examinations, diagnostic results, correct diagnoses, management, teaching points, and metadata.

### 2. Canonical simulation engine

The engine owns all mutable runtime state. It consists of:

- a versioned `HospitalState` schema;
- typed domain events;
- a pure reducer/state transition function;
- selectors for UI/world consumption;
- deterministic timestamps/simulation clock;
- versioned persistence and migrations;
- learner attempt/mastery integration.

Representative events:

- `SHIFT_STARTED`
- `LOCATION_CHANGED`
- `PAGE_RECEIVED`
- `PAGE_ACKNOWLEDGED`
- `ENCOUNTER_STARTED`
- `HISTORY_ASKED`
- `CONFIDENTIAL_INTERVIEW_STARTED`
- `EXAM_PERFORMED`
- `TEST_ORDERED`
- `RESULT_REVIEWED`
- `DIAGNOSIS_COMMITTED`
- `MANAGEMENT_SELECTED`
- `SAFETY_EVENT_RECORDED`
- `PATIENT_TRANSFERRED`
- `TIME_ADVANCED`
- `ENCOUNTER_COMPLETED`

### 3. Hospital world

React Three Fiber + Three.js + Rapier remains the spatial shell. World objects dispatch domain events and render from selectors. A room, monitor, patient, door, or workstation may have visual state, but it cannot own clinical truth.

### 4. Embedded clinical tools

Clinical tools are overlays/workstations in the same app. The working `/cardiohospital/` HCM encounter is the first parity target and supplies behavior for:

- history;
- focused cardiac examination;
- interactive auscultation;
- ECG acquisition/interpretation;
- diagnostic test selection;
- assessment/management;
- scoring/debrief.

### 5. Persistence

Initial persistence remains local and deterministic, suitable for the personal educational application. The state envelope is versioned. A backend is deferred until there is a real requirement such as multi-device synchronization, accounts, analytics, collaborative sessions, or instructor dashboards.

## Migration strategy

### Source A — `cardio-hospital-3d`

This becomes the master application because it has the best maintainable foundation: React, React Three Fiber, Rapier, Zustand, immutable case definitions, rotation state, adaptive learning, longitudinal outcomes, pager logic, and capstone logic.

### Source B — `/cardiohospital/`

This remains untouched as the behavioral reference until parity. Its complete HCM clinical encounter is ported into React in small increments.

### Source C — `pediatric-hospital-world`

This remains untouched as the iPhone/world reference until parity. Harvest touch controls, PWA behavior, scene/room ideas, environmental realism, and useful assets/geometry patterns. Do not make its compressed payload architecture the future source of truth.

## Milestones

### M0 — Governance and drift prevention

Deliverables:
- project rules;
- master plan;
- implementation status ledger;
- isolated `hospital-unified` branch.

Exit criteria:
- another agent can identify current architecture, active milestone, invariants, and next action from the repository alone.

### M1 — Canonical engine foundation

Deliverables:
- typed events;
- versioned canonical state;
- pure reducer;
- serialization/persistence adapter;
- minimal selectors;
- bridge from current case/rotation systems.

Exit criteria:
- HCM encounter can be represented entirely as engine state/events without UI-local medical state.

### M2 — HCM clinical parity in React

Deliverables:
- React encounter shell;
- history parity;
- examination/auscultation parity;
- ECG reader parity;
- test ordering parity;
- assessment/management parity;
- debrief/scoring parity.

Exit criteria:
- the React app reproduces the working HCM clinical loop without needing `/cardiohospital/`.

### M3 — World/encounter integration

Deliverables:
- Room 3 patient entity bound to canonical state;
- entering/interacting with Room 3 opens the same HCM encounter;
- leaving and returning preserves state;
- world objective/prompt derives from engine state;
- no duplicate encounter state in the world layer.

Exit criteria:
- one patient, one encounter, one state across world and clinical UI.

### M4 — One-product navigation and mobile shell

Deliverables:
- responsive desktop/iPhone UX;
- touch movement/look/interact controls;
- PWA manifest/service worker strategy;
- orientation/loading/performance handling;
- one launch path and app identity.

Exit criteria:
- the unified application is usable as a single product on iPhone and desktop.

### M5 — Hospital work system

Deliverables:
- pager integrated with engine;
- location-aware consults;
- prioritization queue;
- simulation clock/time advancement;
- persistent shift state;
- workroom/huddle flow.

Exit criteria:
- learner can manage multiple competing tasks during one shift.

### M6 — Department expansion

Sequence:
1. outpatient clinic;
2. echo;
3. PICU;
4. NICU;
5. MRI;
6. cath;
7. OR;
8. longitudinal follow-up.

Each department must use the same event/state engine rather than creating a subsystem-specific simulation store.

### M7 — Visual realism pass

Only after architecture and interaction loops are stable:
- higher-fidelity rooms;
- optimized hospital props;
- better lighting/materials;
- characters/animation;
- ambient audio;
- performance LOD;
- optional generated/optimized geometry (including Needle or equivalent workflows).

### M8 — Validation and retirement

Deliverables:
- clinical review of all teaching cases;
- cross-device regression checks;
- state migration tests;
- performance budget;
- final parity checklist against legacy implementations;
- legacy apps retained only as archived references or redirected after explicit approval.

## State model principles

`HospitalState` should contain only serializable domain state. Suggested top-level sections:

- `schemaVersion`
- `shift`
- `learner`
- `world`
- `pager`
- `encounters`
- `patients`
- `results`
- `timeline`

Avoid putting Three.js objects, DOM nodes, React state, audio nodes, functions, Sets, Maps, or transient UI state in canonical storage.

## Clinical interaction principles

- The learner should not be forced through an artificial wizard when free navigation is safe and educationally useful.
- Safety-critical decisions should be explicit and attributable.
- Unnecessary testing should have consequences, not merely point penalties.
- Missed red flags should influence later debriefs and longitudinal outcomes.
- Confidential adolescent history must remain gated appropriately.
- Diagnostic displays should require learner interpretation before revealing teaching labels when that is the learning objective.

## Performance principles

- Target iPhone as a first-class device, not a later port.
- Cap device pixel ratio when needed.
- Keep collision geometry simpler than render geometry.
- Lazy-load heavy departments and diagnostic viewers.
- Dispose audio/graphics resources when interfaces close.
- Avoid loading the entire hospital at maximum fidelity when room/department streaming is sufficient.

## Testing strategy

Keep tests small and high value:

1. reducer/event transition tests;
2. persistence round-trip/migration tests;
3. one HCM end-to-end vertical-slice regression;
4. one mobile smoke test when the shell is ready.

Do not create a large brittle test suite during migration.

## Commit discipline

Every coherent step gets its own commit. Commit messages should describe the architectural or behavioral invariant being added. `docs/IMPLEMENTATION_STATUS.md` is the handoff ledger and must be updated after milestone changes or when the next action changes materially.

## First implementation sequence

1. Create canonical event types and initial state schema.
2. Add a pure reducer with deterministic encounter transitions.
3. Add versioned local persistence.
4. Add a React/Zustand adapter around the engine.
5. Bind existing world phase/navigation to the adapter.
6. Port HCM history into React using engine events.
7. Port examination/auscultation.
8. Port ECG reader.
9. Port test selection and assessment.
10. Port debrief/scoring.
11. Perform HCM parity audit.
12. Begin iPhone controls and one-product shell.
