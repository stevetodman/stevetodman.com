# Pediatric Hospital — Implementation Status

Last updated: 2026-09-03
Branch: `hospital-unified`

## Current milestone

**M1 — Canonical engine foundation**

## Completed

- Created isolated `hospital-unified` branch from main.
- Added `PROJECT-RULES.md` with product, safety, migration, engineering, and commit invariants.
- Added `docs/HOSPITAL_MASTER_PLAN.md` with the full one-product architecture and milestone sequence.
- Repository audit completed:
  - `/cardiohospital/` is the most complete working HCM clinical interaction reference.
  - `cardio-hospital-3d` is the chosen master codebase.
  - `pediatric-hospital-world` is the iPhone/world reference and remains untouched during migration.
  - `src/lib` already contains immutable cases, persistence, rotation/action logging, adaptive case selection, longitudinal outcomes, pager logic, and capstone logic.

## In progress

- Introduce a framework-independent canonical hospital state and typed event model without breaking existing stores.

## Next actions

1. Add `src/lib/hospital-engine.ts` containing versioned state, event types, initial state, reducer, and selectors.
2. Add `src/lib/hospital-persistence.ts` with versioned local persistence and migration boundary.
3. Add `src/lib/hospital-store.ts` as the Zustand adapter used by React/3D code.
4. Wire world phase/location/encounter entry to the canonical store while preserving current visual behavior.
5. Port HCM clinical history from `/cardiohospital/` into React using engine events.

## Do not do yet

- Do not delete or modify `/cardiohospital/`.
- Do not modify `pediatric-hospital-world`.
- Do not merge to main.
- Do not perform a visual redesign.
- Do not add a backend.
- Do not alter clinical case truth unless explicitly reviewed as a medical-content change.

## Acceptance gates for M1

- Canonical state is serializable and versioned.
- Reducer is pure and deterministic.
- HCM runtime encounter state can be expressed using engine events.
- Reload persistence round-trips without changing meaning.
- Existing application still builds.

## Handoff note

Any agent resuming this project should read, in order:

1. `PROJECT-RULES.md`
2. `docs/HOSPITAL_MASTER_PLAN.md`
3. this file
4. `src/lib/cases-data.ts`
5. `src/lib/rotation-store.ts`
6. `src/lib/simulation-store.ts`

Then continue from the first incomplete item under **Next actions** and commit each coherent step before proceeding.
