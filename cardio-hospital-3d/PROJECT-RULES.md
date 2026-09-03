# Pediatric Hospital — Project Rules

These rules are the operating contract for every agent and contributor working on the unified pediatric hospital simulator.

## Primary project precedence

The **primary active implementation** is:

- Repository: `stevetodman/stevetodman.com`
- Application: `cardio-hospital-3d/`
- Branch: `hospital-unified`

This repository/application/branch is the default source of truth for current hospital-simulator development unless the owner explicitly promotes another target.

All other GitHub hospital/simulator-related repositories, branches, sites, prototypes, demos, and legacy implementations are **secondary/reference only by default**. They may be used for assets, historical behavior, comparison, or migration reference, but must not supersede the primary implementation or receive new hospital product work unless explicitly directed.

In particular, `/cardiohospital/` and `stevetodman/pediatric-hospital-world` are secondary/reference implementations during the migration. Do not fork current work back into them.

## Product invariant

There is **one product**: Pediatric Hospital.

- One codebase.
- One canonical simulation state.
- One installable application.
- One hospital world.
- Clinical interfaces are embedded tools inside that world, not separate simulators.
- Existing projects (`cardiohospital`, `cardio-hospital-3d`, and `pediatric-hospital-world`) are source material during migration, not permanent parallel products.

## Source of truth

1. `cardio-hospital-3d/src/lib/cases-data.ts` remains immutable clinical case truth unless a deliberate medical-content revision is made.
2. Runtime medical reality belongs to the canonical event-driven hospital engine, never to a React component, Three.js object, modal, or page-local variable.
3. Every patient has one stable patient/case identity shared by the 3D world and clinical interfaces.
4. UI state and simulation state must remain separate.
5. Derived displays may be recomputed from canonical state; competing copies of state are prohibited.

## Migration rules

- Preserve the working `/cardiohospital/` clinical interactions until parity is demonstrated in the unified app.
- Preserve the current `pediatric-hospital-world` deployment until the unified app matches its iPhone usability and environmental capability.
- Do not delete or overwrite legacy implementations during migration.
- Port behavior first; redesign second.
- HCM (`case-hcm`) is the first end-to-end parity case.

## Safety and clinical integrity

- No real patient data or PHI.
- Teaching cases must remain synthetic.
- Do not silently alter clinical facts, thresholds, diagnoses, management logic, or source metadata.
- Any medical-content change requires explicit review and a dedicated commit describing the clinical change.
- Synthetic ECG/echo/audio assets must remain labeled as educational when appropriate.

## Engineering rules

- Work only on `hospital-unified` until explicitly approved for merge.
- Make small coherent commits. Every completed step is committed before starting the next step.
- Update `docs/IMPLEMENTATION_STATUS.md` whenever a milestone changes state.
- Do not add a backend unless a concrete requirement cannot be met safely in a client-only architecture.
- Prefer deterministic behavior over LLM-dependent core simulation logic.
- Persist only versioned, serializable canonical state.
- Storage migrations must be explicit; never silently reinterpret old saved state.
- New UI code must consume selectors/actions from the engine rather than mutate storage directly.
- New 3D interactions must dispatch domain events rather than directly changing clinical state.
- Avoid broad rewrites while migrating working behavior.

## Quality gates

A change is not complete until:

1. TypeScript/build passes.
2. Existing working behavior is not intentionally regressed.
3. The event/state transition is deterministic.
4. Reload persistence is considered.
5. Mobile/iPhone implications are considered.
6. The implementation status document is current.

## Definition of unified

The project is unified only when the learner can enter one application, navigate the hospital, interact with a patient, perform the complete clinical encounter, leave the room, receive additional work, return later, and observe the same persistent patient/learner state throughout.
