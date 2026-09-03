# Pediatric Hospital — Master Plan

Last updated: 2026-09-03
Branch: `hospital-unified`

## North star

Build one persistent pediatric hospital simulation where the learner moves through a 3D hospital, receives work, evaluates patients, performs clinical tasks, makes decisions, and experiences downstream consequences without ever switching between separate products.

The 3D hospital is the spatial interface. Clinical tools open in context inside the same application. One event-driven engine owns runtime truth.

## Current execution checkpoint — read before doing any work

The project is no longer in initial migration. The canonical architecture, HCM vertical slice, world/encounter integration, mobile/PWA implementation, hospital workload foundation, and second clinical consult are already implemented.

### Milestone status

- **M0 — Governance / handoff:** COMPLETE.
- **M1 — Canonical engine:** COMPLETE.
- **M2 — HCM clinical vertical slice:** FUNCTIONALLY COMPLETE.
- **M3 — World ↔ clinical integration:** COMPLETE.
- **M4 — One-product mobile/PWA shell:** IMPLEMENTED IN CODE; real-device acceptance remains open.
- **M5 — Hospital work system:** IMPLEMENTED THROUGH THE CURRENT TWO-CONSULT / COMPETING-WORK LOOP; behavioral acceptance remains open.
- **M6+ — Department expansion / realism / final validation:** NOT STARTED intentionally.

### Last verified checkpoint before this plan refresh

- Branch head: `adf9dea02a9ca89fe607866f5373f20199cd8103`.
- Unified Hospital Build **run 80: PASS**.
- Run 80 passed both `npm run test:engine` and `npm run build`.
- No merge to `main` has occurred.
- `/cardiohospital/` remains untouched as a legacy/reference implementation.
- The separate `pediatric-hospital-world` repository remains untouched as a legacy/reference implementation.

This master-plan edit is documentation-only and will create a newer branch-head commit. The next agent must always verify the actual `hospital-unified` head and its newest CI run before editing.

### Acceptance-prep fixes already completed — do not redo

1. **Horizontal movement correction** — commit `a0fb3436d21f31cd193eb8f8bee7df15c92ab77b`.
   - Keyboard A/D and left/right arrows had the wrong sign relative to the camera-derived right vector.
   - The mobile joystick horizontal axis had the same error.
   - Unified Hospital Build run 78 passed.

2. **PWA orientation correction** — commit `e4d3b45426c229d0d08d98234276c839ae43e63f`.
   - The web-app manifest forced landscape-only orientation even though the product acceptance contract requires portrait and landscape iPhone operation.
   - The manifest now allows both orientations.
   - Unified Hospital Build run 79 passed.

3. **Acceptance-prep handoff ledger refresh** — commit `adf9dea02a9ca89fe607866f5373f20199cd8103`.
   - Records the two fixes above and preserves the behavioral acceptance checklist.
   - Unified Hospital Build run 80 passed.

A source audit also covered canonical persistence/reconciliation, pager and Worklist projections, Room 1/Room 3 interactions and actors, responsive overlays, ECG scrolling/stacking, service-worker shell behavior, and HCM Web Audio lifecycle. No additional deterministic defect was demonstrated from source inspection.

**Do not interpret source inspection or CI as browser/device acceptance.** Desktop collision ergonomics, actual touch feel, audio output, Add to Home Screen behavior, orientation transitions, and iPhone performance/thermal behavior still require the target environments.

## Exact resume sequence for the next agent

Follow this order. Do not skip ahead to M6.

1. Read:
   1. `PROJECT-RULES.md`
   2. `docs/HOSPITAL_MASTER_PLAN.md`
   3. `docs/IMPLEMENTATION_STATUS.md`
   4. `docs/CLINICAL_VALIDATION.md`
2. Confirm `hospital-unified` is still at this plan-refresh commit or a newer intentional descendant.
3. Confirm the newest **Unified Hospital Build** on the actual branch head is green before editing.
4. Do **not** add another patient, clinical case, department, backend, or visual-realism system yet.
5. Run the unified app from `cardio-hospital-3d`:

```bash
npm install
npm run test:engine
npm run build
npm run dev
```

6. Perform the **desktop behavioral acceptance** in one continuous product flow:
   - enter the hospital;
   - accept Marcus Chen / HCM work;
   - complete the HCM consult;
   - confirm Ava Rodriguez is released through the canonical schedule;
   - acknowledge/accept Ava from the existing pager;
   - verify the Worklist identifies Ava explicitly and still shows unfinished overnight handoff work as a competing task;
   - navigate physically to Clinic Room 1;
   - open/resume Ava through the room interaction;
   - complete confidential history, focused exam, ECG/testing, assessment/management, debrief, completion, and replay;
   - verify completing Ava does not silently complete/remove the handoff task and vice versa.
7. Perform **desktop persistence/reload acceptance**:
   - reload during an active Ava encounter;
   - re-enter the hospital;
   - verify the same canonical encounter resumes with prior stage/history/test state;
   - verify no duplicate patient, page, task, or encounter is created.
8. Perform **desktop world/interaction acceptance**:
   - Room 1 doorway/collision in both directions;
   - proximity prompt;
   - keyboard `E` interaction;
   - leaving/re-entering the clinical overlay;
   - parent disappearance after confidential interview;
   - patient disappearance after final completion;
   - fresh parent/confidential state on replay;
   - corrected A/D and left/right movement behavior.
9. Perform **real-iPhone M4/M5 acceptance in portrait and landscape**:
   - movement joystick;
   - right-side touch look;
   - on-screen interact button;
   - Room 1 doorway/collision;
   - pager and Worklist overlays;
   - clinical scrolling and tap targets;
   - ECG pan/scroll/controls;
   - auscultation/Web Audio start/stop/repeat behavior;
   - orientation changes;
   - reload/resume;
   - Add to Home Screen launch;
   - performance and thermal behavior.
10. For every reproduced failure:
    - record exact reproduction steps first;
    - fix only the demonstrated problem;
    - preserve the canonical engine and one-product architecture;
    - add only focused regression coverage when the defect is state/logic-testable;
    - require `npm run test:engine` and `npm run build` to pass after each coherent fix.
11. When desktop and iPhone behavioral gates both pass:
    - record acceptance evidence in `docs/IMPLEMENTATION_STATUS.md`;
    - mark M4 and M5 complete;
    - only then begin M6 with **outpatient clinic depth** under the existing engine.

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

Existing case definitions remain the clinical source of truth for synthetic patient facts. Versioned clinical policy modules may correct interpretation, scoring, management boundaries, or teaching policy without rewriting immutable patient facts.

Clinical content must pass the repository clinical-validation process before activation.

### 2. Canonical simulation engine

The engine owns all mutable runtime state. It consists of:

- a versioned `HospitalState` schema;
- typed domain events;
- a pure reducer/state transition function;
- selectors for UI/world consumption;
- deterministic timestamps/simulation clock;
- versioned persistence and migrations;
- learner attempt/mastery integration.

Representative events include:

- `SHIFT_STARTED`
- `LOCATION_CHANGED`
- `PAGE_RECEIVED`
- `PAGE_ACKNOWLEDGED`
- `PATIENT_ARRIVED`
- `TASK_CREATED`
- `TASK_ASSIGNED`
- `TASK_STARTED`
- `TASK_COMPLETED`
- `TASK_DEADLINE_MISSED`
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

Clinical tools are overlays/workstations in the same app. Current completed clinical loops include the HCM consult in Room 3 and the physician-approved post-exertional neurally mediated syncope consult in Room 1.

The interaction model includes:

- history;
- confidential adolescent history;
- focused cardiac examination;
- interactive auscultation;
- ECG acquisition/interpretation;
- diagnostic test selection;
- assessment/management;
- scoring/debrief;
- completion and replay while preserving prior attempt history.

### 5. Persistence

Initial persistence remains local and deterministic, suitable for the personal educational application. The state envelope is versioned and explicitly migrated. A backend is deferred until there is a real requirement such as multi-device synchronization, accounts, analytics, collaborative sessions, or instructor dashboards.

## Migration strategy

### Source A — `cardio-hospital-3d`

This is the master application. Runtime truth belongs to the canonical hospital engine and its adapters in this application.

### Source B — `/cardiohospital/`

This remains untouched as a behavioral/reference implementation until explicit retirement approval. Do not reconnect it as runtime state.

### Source C — `pediatric-hospital-world`

This remains untouched as the iPhone/world reference until explicit retirement approval. Harvest useful interaction/visual lessons only; do not adopt its compressed payload architecture as the new source of truth.

## Milestones

### M0 — Governance and drift prevention — COMPLETE

Deliverables:
- project rules;
- master plan;
- implementation status ledger;
- isolated `hospital-unified` branch.

Exit criteria:
- another agent can identify current architecture, active milestone, invariants, and next action from the repository alone.

### M1 — Canonical engine foundation — COMPLETE

Deliverables:
- typed events;
- versioned canonical state;
- pure reducer;
- serialization/persistence adapter;
- minimal selectors;
- canonical store adapter;
- deterministic schedule/consequence reconciliation.

Exit criteria:
- clinical encounters and hospital work are represented through engine state/events rather than competing runtime stores.

### M2 — HCM clinical parity in React — FUNCTIONALLY COMPLETE

Deliverables:
- React encounter shell;
- history parity;
- examination/auscultation parity;
- ECG reader parity;
- test ordering parity;
- assessment/management parity;
- debrief/scoring parity;
- replay-safe attempts.

Exit criteria:
- the React app reproduces the HCM clinical loop without needing `/cardiohospital/`.

### M3 — World/encounter integration — COMPLETE

Deliverables:
- Room 3 patient entity bound to canonical state;
- entering/interacting with Room 3 opens the same HCM encounter;
- leaving and returning preserves state;
- world objective/prompt derives from engine state;
- no duplicate encounter state in the world layer;
- canonical Room 1 support using the same architecture.

Exit criteria:
- one patient, one encounter, one state across world and clinical UI.

### M4 — One-product navigation and mobile shell — CODE COMPLETE; DEVICE ACCEPTANCE OPEN

Deliverables:
- responsive desktop/iPhone UX;
- touch movement/look/interact controls;
- PWA manifest/service worker strategy;
- portrait and landscape support;
- orientation/loading/performance handling;
- one launch path and app identity.

Exit criteria:
- the unified application is demonstrated usable as a single product on desktop and a real iPhone, including installed/Home Screen behavior.

### M5 — Hospital work system — CODE COMPLETE THROUGH CURRENT SCOPE; BEHAVIORAL ACCEPTANCE OPEN

Deliverables implemented:
- pager integrated with engine;
- canonical consult and non-patient work tasks;
- Worklist projection;
- deterministic priority/deadline ordering;
- location-aware consults;
- simulation clock/time advancement;
- schedule-driven work release;
- persisted missed-deadline consequences;
- persistent shift state;
- workstation completion flow;
- two physical clinic rooms;
- HCM consult plus physician-approved Ava Rodriguez consult;
- competing unfinished handoff work preserved independently of Ava completion.

Exit criteria:
- learner can demonstrably manage multiple competing tasks during one shift in actual desktop/iPhone runtime, including reload/resume.

### M6 — Department expansion — DO NOT START UNTIL M4/M5 ACCEPTANCE CLOSES

Sequence:
1. outpatient clinic depth;
2. echo;
3. PICU;
4. NICU;
5. MRI;
6. cath;
7. OR;
8. longitudinal follow-up.

Each department must use the same event/state engine rather than creating a subsystem-specific simulation store.

Every new clinical case must pass the clinical validation gate before runtime activation.

### M7 — Visual realism pass

Only after architecture, interaction loops, mobile behavior, workload flow, and department boundaries are stable:
- higher-fidelity rooms;
- optimized hospital props;
- better lighting/materials;
- characters/animation;
- ambient audio;
- performance LOD;
- optional generated/optimized geometry, including Needle or equivalent workflows.

### M8 — Validation and retirement

Deliverables:
- clinical review of all teaching cases;
- cross-device regression checks;
- state migration tests;
- performance budget;
- final parity checklist against legacy implementations;
- legacy apps retained only as archived references or redirected after explicit approval.

## State model principles

`HospitalState` contains only serializable domain state. Current/suggested top-level concepts include:

- `schemaVersion`
- `shift`
- `learner`
- `world`
- `pager`
- `tasks`
- `encounters`
- `patients`
- `results`
- `timeline`

Avoid putting Three.js objects, DOM nodes, React state, audio nodes, functions, Sets, Maps, or transient UI state in canonical storage.

Legacy `pager-store.ts`, `rotation-store.ts`, and other historical stores are references only where the unified engine has already assumed ownership. Do not reconnect them as competing sources of runtime truth.

## Clinical interaction principles

- The learner should not be forced through an artificial wizard when free navigation is safe and educationally useful.
- Safety-critical decisions should be explicit and attributable.
- Unnecessary testing should have consequences, not merely point penalties.
- Missed red flags should influence later debriefs and longitudinal outcomes.
- Confidential adolescent history must remain gated appropriately.
- Diagnostic displays should require learner interpretation before revealing teaching labels when that is the learning objective.
- Synthetic patient facts must not be silently changed to make a teaching policy easier to implement.
- Versioned clinical-policy modules define approved interpretation/teaching boundaries when legacy content is stale or overly rigid.

## Performance principles

- Target iPhone as a first-class device, not a later port.
- Cap device pixel ratio when needed.
- Keep collision geometry simpler than render geometry.
- Lazy-load heavy departments and diagnostic viewers.
- Dispose audio/graphics resources when interfaces close.
- Avoid loading the entire hospital at maximum fidelity when room/department streaming is sufficient.
- Do not claim performance or thermal acceptance from desktop CI.

## Testing strategy

Keep tests small and high value:

1. reducer/event transition tests;
2. persistence round-trip/migration tests;
3. focused schedule/consequence invariants;
4. focused world-zone/interaction invariants where deterministic;
5. one HCM vertical-slice regression;
6. focused second-consult/noninterference regressions;
7. targeted browser/device smoke testing for behavior that cannot be proven by reducer tests.

Do not create a large brittle test suite during migration. Add tests to protect demonstrated invariants, not for test-count growth.

## Commit discipline

Every coherent step gets its own commit. Commit messages should describe the architectural or behavioral invariant being added or corrected.

`docs/IMPLEMENTATION_STATUS.md` is the detailed handoff ledger and must be updated whenever milestone state, verified acceptance evidence, branch head/checkpoint, or the next action changes materially.

Do not mark a behavioral acceptance item passed from source inspection or CI when the acceptance criterion requires a real browser or physical device.

## Hard boundaries until M4/M5 acceptance is complete

- Do not merge `hospital-unified` to `main` without explicit approval.
- Do not modify or delete `/cardiohospital/`.
- Do not modify or delete the separate `pediatric-hospital-world` repository.
- Do not start M6 early.
- Do not add another clinical consult merely to expand content volume.
- Do not add a backend.
- Do not reconnect legacy pager/rotation stores as parallel runtime truth.
- Do not begin a photorealistic/asset-generation pass.
- Do not replace focused CI with a large slow E2E suite.
- Do not copy legacy clinical management text into the unified runtime without clinical validation.

The next legitimate development step is **behavioral acceptance of M4/M5**, followed by narrow fixes for reproduced failures only. After those gates pass and are recorded, M6 begins with outpatient clinic depth.