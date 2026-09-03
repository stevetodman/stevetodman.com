# Pediatric Hospital — Implementation Status

Last updated: 2026-09-03
Branch: `hospital-unified`
Product: **Pediatric Hospital**

## Resume here

The unified application now has one canonical hospital engine, a complete HCM clinical vertical slice, Room 3/world integration, replay-safe attempts, first-class touch controls, and an installable PWA shell. The old assignment/task migration described in earlier handoffs is finished and must not be repeated.

**Current milestone: M4 — One-product mobile/PWA shell (implemented in code; physical-device acceptance remains).**

M3 exit criteria are now met: Room 3, its patient/family actors, workflow prompts, task state, encounter state, persistence, completion, and replay all project from the same canonical state/event model.

## Milestone state

### M0 — Governance and drift prevention: COMPLETE

- Isolated `hospital-unified` branch created from main.
- `PROJECT-RULES.md` defines product, safety, migration, engineering, and commit invariants.
- `docs/HOSPITAL_MASTER_PLAN.md` defines the one-product architecture and milestone sequence.
- `docs/CLINICAL_VALIDATION.md` establishes the medical-content validation gate.
- Focused GitHub Actions workflow runs on unified-hospital changes.

### M1 — Canonical engine foundation: COMPLETE

Implemented:

- `src/lib/hospital-engine.ts`
  - serializable/versioned `HospitalState`;
  - typed domain events;
  - pure deterministic reducer;
  - timeline/event history;
  - canonical patient/task/encounter runtime state;
  - selectors and simulation time formatting.
- `src/lib/hospital-persistence.ts`
  - versioned local persistence envelope;
  - schema-v1 → schema-v2 migration;
  - explicit migration/validation boundary.
- `src/lib/hospital-store.ts`
  - Zustand adapter around the canonical engine.
- `src/lib/simulation-store.ts`
  - transient UI/input state only; no assignment or clinical domain truth.
- Canonical state persists across reloads and active encounters can be resumed.
- Entry is blocked until persistence hydration completes, preventing an early tap from overwriting a saved encounter.

### M2 — HCM React clinical loop: FUNCTIONALLY COMPLETE

The unified React app now reproduces and extends the working HCM vertical-slice loop without depending on `/cardiohospital/`:

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
- encounter completion;
- **Replay this case** with the prior encounter preserved and a new encounter ID created.

Code-level parity review against `/cardiohospital/` is complete. Intentional differences remain where the legacy implementation conflicts with the versioned unified teaching policy or where the unified architecture is safer/better (canonical persistence, confidential-interview state, and non-destructive replay).

Still required as validation rather than migration work:

- browser/device behavioral comparison of every HCM stage;
- verify audio lifecycle and ECG behavior across repeat/reload flows on real target browsers;
- final visual/usability parity review belongs to M8.

### M3 — World/encounter integration: COMPLETE

Completed:

- explicit canonical `PATIENT_ARRIVED`, `TASK_CREATED`, `TASK_ASSIGNED`, `TASK_STARTED`, `ENCOUNTER_STARTED`, and `ENCOUNTER_COMPLETED` lifecycle;
- schema-v2 task state plus v1 → v2 persistence migration;
- Room 3 interaction opens/resumes the canonical HCM encounter;
- HUD objective and interaction availability derive from canonical selectors;
- walking through the world updates canonical hospital location;
- leaving the clinical overlay and returning preserves encounter state;
- reload resumes the same active patient;
- Room 3 patient/family actors are projections of canonical patient/encounter state;
- confidential interview removes the parent from the room when the learner returns;
- completed/transferred-away patients no longer remain incorrectly rendered in Room 3;
- replay preserves completed encounter history while beginning a fresh canonical encounter;
- focused reducer regression check covers arrival → assignment → encounter → completion → replay and runs in CI.

Deferred to later milestones, not blockers for M3:

- richer equipment/workstation actions;
- multiple simultaneous task queues and competing work;
- department-specific world entities.

### M4 — One-product mobile/PWA shell: IMPLEMENTED IN CODE; DEVICE ACCEPTANCE REMAINS

Implemented:

- device-agnostic movement/interaction path;
- iPhone/coarse-pointer movement joystick;
- touch-look gesture on the world canvas;
- persistent on-screen interact control;
- desktop pointer-lock behavior kept separate from touch input;
- safe-area-aware controls;
- mobile clinical overlay rules;
- height-aware iPhone-landscape clinical/ECG layout hardening;
- `viewport-fit=cover` and Apple web-app metadata;
- web app manifest and application icon;
- production service-worker registration and conservative durable-shell asset cache;
- unified Pediatric Hospital app identity.

Acceptance still required before calling M4 fully complete:

- real iPhone Safari portrait + landscape smoke test;
- Add to Home Screen launch test;
- movement/look/interact ergonomics check;
- clinical overlay scrolling/tap-target check;
- auscultation/Web Audio lifecycle check;
- ECG pan/scroll/control check;
- reload/resume check;
- desktop regression smoke test;
- performance/thermal check on a real iPhone.

### M5 — Hospital work system: NEXT

Planned next increment:

- integrate pager state into visible gameplay;
- model multiple location-aware consult tasks;
- add a prioritization/work queue;
- use the existing simulation clock for task timing and consequences;
- preserve all task/page state across reloads;
- keep all workload truth in `hospital-engine.ts`, not UI stores.

## Clinical-content state

A versioned HCM teaching policy lives separately from immutable synthetic patient facts:

- `src/lib/clinical-policy/hcm-2024.ts`

The unified path intentionally uses that policy rather than copying legacy management strings. Legacy `cases-data.ts`, `rotation-store.ts`, and longitudinal/adaptive modules still contain older HCM wording/assumptions in places; reconcile those deliberately before production and do not let them leak back into the unified path by accident.

## Build / regression status

CI now performs both:

1. `npm run test:engine` — concise canonical workflow regression;
2. `npm run build` — production Next.js build.

For commit `e3149dd54947ab9de92151b8dd22698c89234093`, both the engine regression step and production build completed successfully.

Every coherent branch change should continue to trigger `Unified Hospital Build`. Before merge or final handoff, confirm the actual current branch head is green.

## Next actions — exact order

1. Complete the real-device M4 acceptance checklist above; fix only demonstrated mobile/desktop regressions.
2. Add the first M5 pager/work-queue vertical slice using the existing canonical `pager`, `tasks`, `patients`, `world`, and simulation clock state.
3. Make the first competing task location-aware and visible in the world/HUD without introducing another domain store.
4. Add only the smallest regression coverage needed for prioritization/persistence behavior.
5. Expand departments incrementally under M6 after the work system is stable.
6. Defer photorealistic/Needle asset work until architecture, mobile interaction, workload flow, and department boundaries are stable.

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
10. `src/components/clinical/hcm-assessment-stage.tsx`
11. `src/components/world/interaction-system.tsx`
12. `src/components/world/patient-room-actors.tsx`
13. `src/components/mobile-controls.tsx`
14. `src/components/world/touch-look-controls.tsx`
15. `scripts/hospital-engine.test.mjs`

Then continue from the first incomplete item under **Next actions**, keep commits coherent, and update this ledger whenever milestone state or the next action changes materially.
