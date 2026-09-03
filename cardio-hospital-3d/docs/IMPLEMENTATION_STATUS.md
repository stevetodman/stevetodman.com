# Pediatric Hospital — Implementation Status

Last updated: 2026-09-03
Branch: `hospital-unified`
Product: **Pediatric Hospital**

## Resume here

The project is now past the architecture-only stage. The HCM patient has a complete React clinical loop running on the canonical event/state engine, and Room 3 has patient/family actors tied back to that same encounter state.

**Current milestone: M3 — World/encounter integration.**

The next agent should preserve the current working HCM loop and continue by removing the remaining domain-level duplication from `simulation-store.ts`, then make mobile/iPhone interaction a first-class shell.

## Milestone state

### M0 — Governance and drift prevention: COMPLETE

- Isolated `hospital-unified` branch created from main.
- `PROJECT-RULES.md` defines product, safety, migration, engineering, and commit invariants.
- `docs/HOSPITAL_MASTER_PLAN.md` defines the one-product architecture and milestone sequence.
- `docs/CLINICAL_VALIDATION.md` establishes the medical-content validation gate.
- Focused GitHub Actions build workflow added for this branch.

### M1 — Canonical engine foundation: COMPLETE

Implemented:

- `src/lib/hospital-engine.ts`
  - serializable/versioned `HospitalState`;
  - typed domain events;
  - pure deterministic reducer;
  - timeline/event history;
  - selectors and simulation time formatting.
- `src/lib/hospital-persistence.ts`
  - versioned local persistence envelope;
  - explicit migration/validation boundary.
- `src/lib/hospital-store.ts`
  - Zustand adapter around the canonical engine.
- Canonical state persists across reloads and active encounters can be resumed.

### M2 — HCM React clinical parity: FUNCTIONALLY IMPLEMENTED; PARITY AUDIT REMAINS

The unified React app now includes the complete HCM vertical-slice loop:

- history and red-flag recognition;
- confidential adolescent interview gating;
- focused cardiovascular examination;
- interactive auscultation and Valsalva using synthesized audio;
- synthetic 12-lead ECG viewer with speed/gain controls and committed interpretation;
- ECG/echo testing plus post-diagnosis HCM risk-stratification choices;
- assessment and management commitment;
- safety-event recording;
- deterministic multidimensional scoring;
- attending debrief;
- encounter completion and replay-safe encounter IDs.

Still required before declaring strict parity:

- browser-by-browser behavioral comparison against legacy `/cardiohospital/`;
- visual/usability comparison of every HCM stage;
- verify audio lifecycle and ECG behavior across repeat/reload flows.

### M3 — World/encounter integration: IN PROGRESS

Completed:

- Room 3 interaction opens/resumes the canonical HCM encounter.
- Walking through the existing world updates canonical hospital location.
- Leaving the clinical overlay and returning preserves encounter state.
- Reload can resume the same active patient.
- Room 3 now contains a patient actor and parent actor.
- The parent actor reads canonical encounter state: after `CONFIDENTIAL_INTERVIEW_STARTED`, the parent is absent from the 3D room when the learner returns.
- Patient/family actors carry stable entity metadata but do not own clinical truth.

Remaining:

- move assignment/workflow domain state out of the temporary `simulation-store.ts` phase field and derive it from canonical hospital/task state;
- make patient arrival/assignment an explicit canonical event rather than relying on scene composition before encounter start;
- make prompts/objectives derive from canonical task/encounter selectors;
- bind additional room equipment/workstations to domain events;
- add one concise world↔clinical regression check once the task model is stable.

### M4 — One-product mobile/PWA shell: NOT STARTED

Required next:

- iPhone touch movement joystick;
- touch-look gesture;
- persistent on-screen interact control;
- mobile-safe clinical overlay behavior;
- orientation/safe-area handling audit;
- PWA/install strategy;
- one production launch path and app identity.

## Clinical-content state

A current 2024 multisociety HCM teaching policy now lives separately from immutable synthetic patient facts:

- `src/lib/clinical-policy/hcm-2024.ts`

The unified HCM path now avoids several legacy traps:

- no blanket teaching that all HCM patients are permanently excluded from competitive sports;
- no blanket penalty that cardiac MRI is an unnecessary HCM test;
- ambulatory ECG and CMR are represented as pediatric risk-stratification tools rather than required core diagnostic tests;
- ICD teaching is framed as pediatric HCM/EP risk stratification and shared decision-making;
- the initial presentation is described as high-risk cardiac syncope until ECG/echo establish HCM.

**Important:** legacy `cases-data.ts`, `rotation-store.ts`, and longitudinal/adaptive modules still contain older HCM wording/assumptions in places. Do not allow those legacy fields to leak back into the unified teaching path. Reconcile them deliberately in dedicated clinical-content commits before production.

## Build status

- The unified branch build has previously passed after the canonical engine/clinical migration.
- Every subsequent coherent change is pushed as its own commit and triggers `Unified Hospital Build`.
- Before merge or handoff, confirm the current branch head has a successful run; fix failures before proceeding.

## Next actions — exact order

1. Confirm CI for the current branch head and fix any TypeScript/build failure.
2. Introduce a canonical **task/assignment** model (versioned state + migration) so arrival → briefing → assignment → encounter is no longer domain state inside `simulation-store.ts`.
3. Derive HUD objective and Room 3 interaction availability from canonical selectors.
4. Add explicit canonical patient arrival/assignment event and make the Room 3 actor render from that patient state.
5. Run a focused HCM parity audit against `/cardiohospital/` and record discrepancies in this file.
6. Begin M4 iPhone controls using `pediatric-hospital-world` only as a behavior/reference source; do not adopt its compressed-payload architecture.
7. After mobile movement/interact works, integrate pager/competing work into the same canonical engine.

## Do not do yet

- Do not modify or delete `/cardiohospital/`.
- Do not modify or delete the separate `pediatric-hospital-world` repository.
- Do not merge `hospital-unified` to main without explicit approval and a green parity/clinical validation checkpoint.
- Do not perform a photorealism/asset-generation pass yet.
- Do not add a backend.
- Do not copy legacy HCM management strings into new unified code without checking the versioned teaching policy.

## Handoff reading order

Any agent resuming this project should read, in order:

1. `PROJECT-RULES.md`
2. `docs/HOSPITAL_MASTER_PLAN.md`
3. this file
4. `docs/CLINICAL_VALIDATION.md`
5. `src/lib/hospital-engine.ts`
6. `src/lib/hospital-persistence.ts`
7. `src/lib/hospital-store.ts`
8. `src/lib/clinical-policy/hcm-2024.ts`
9. `src/components/clinical/hcm-encounter.tsx`
10. `src/components/world/interaction-system.tsx`
11. `src/components/world/patient-room-actors.tsx`

Then continue from the first incomplete item under **Next actions**, commit each coherent step before starting the next, and update this ledger whenever milestone state or the next action changes materially.
