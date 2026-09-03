# Pediatric Hospital — Implementation Status

Last updated: 2026-09-03
Branch: `hospital-unified`
Product: **Pediatric Hospital**

## Resume here

The unified application now has one canonical hospital engine, a complete HCM clinical vertical slice, Room 3/world integration, replay-safe attempts, first-class touch controls, an installable PWA shell, and the first end-to-end hospital workload slice. The old assignment/task migration described in earlier handoffs is finished and must not be repeated.

**Current milestone: M5 — Hospital work system (IN PROGRESS).**

M3 exit criteria are met. M4 is implemented in code but still requires physical-device acceptance. M5 now has a canonical visible pager plus a real secondary task that can be accepted from the pager and completed at the existing team-room workstations.

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
  - canonical patient/task/encounter/pager runtime state;
  - selectors and simulation time formatting.
- `src/lib/hospital-persistence.ts`
  - versioned local persistence envelope;
  - schema-v1 → schema-v2 migration;
  - explicit migration/validation boundary.
- `src/lib/hospital-store.ts`
  - Zustand adapter around the canonical engine.
- `src/lib/simulation-store.ts`
  - transient UI/input state only; no assignment, pager, workload, or clinical domain truth.
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

- richer department-specific equipment actions;
- additional clinical departments/world entities.

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

### M5 — Hospital work system: IN PROGRESS

Completed first vertical slice:

- visible in-world pager surface with desktop/mobile-safe layout;
- immutable page definitions separated from canonical runtime state;
- canonical `PAGE_RECEIVED` and `PAGE_ACKNOWLEDGED` behavior with idempotent reducer semantics;
- acknowledgement state persists through the existing hospital persistence path;
- pager messages can link to canonical task entities;
- task model now supports both patient `consult` tasks and non-patient `work` tasks without introducing a second domain store;
- explicit canonical `TASK_COMPLETED` event;
- `getOpenTasks()` selector exposes the cross-hospital worklist while the HCM workflow selector remains consult-specific;
- first competing routine task: overnight cardiology handoff review;
- learner accepts that task from the pager;
- HUD shows it as a secondary objective without replacing the HCM objective;
- all three existing team-room workstations can complete the task through the same keyboard/touch interaction path;
- reducer regression checks cover pager idempotency and the work-task lifecycle.

Still required for M5 exit:

- a first-class work-queue/prioritization surface independent of pager history;
- priority/deadline metadata in the canonical task model;
- simulation-clock-driven page/task arrival rather than only shift-entry seeding;
- timing/consequence rules that remain deterministic and persist across reloads;
- at least one additional competing clinical consult once its department/world and clinical content are validated;
- mobile/desktop behavioral smoke test of pager → accept → workstation → completion;
- regression coverage for task ordering/timing once those semantics exist.

## Clinical-content state

A versioned HCM teaching policy lives separately from immutable synthetic patient facts:

- `src/lib/clinical-policy/hcm-2024.ts`

The unified path intentionally uses that policy rather than copying legacy management strings. Legacy `cases-data.ts`, `rotation-store.ts`, `pager-store.ts`, and longitudinal/adaptive modules contain older or separate state/content paths; treat them as references only and do not reconnect them as runtime truth. Any future urgent clinical pager scenario must pass the same clinical validation gate as a full encounter.

## Build / regression status

CI performs both:

1. `npm run test:engine` — focused canonical reducer/workflow regression checks;
2. `npm run build` — production Next.js build.

The pager-only checkpoint `1f4e541a1f854882361b1e42d52a703653401c0a` passed the unified build. The first competing-work checkpoint `103f236cea29a52b3f75ccf0f07ddc1f797c7471` also passed. Confirm the actual current branch head is green before merge or handoff.

## Next actions — exact order

1. Complete the real-device M4 acceptance checklist above when a target iPhone is available; fix only demonstrated mobile/desktop regressions.
2. Add a compact first-class M5 work queue derived from canonical tasks, not pager-message UI state.
3. Add task priority and due-time semantics with deterministic selectors and minimal regression coverage.
4. Add clock-driven release of future pages/tasks; do not use wall-clock timers as domain truth.
5. Only then add a second clinical consult, after its world location and teaching content are validated.
6. Expand departments incrementally under M6 after the work system is stable.
7. Defer photorealistic/Needle asset work until architecture, mobile interaction, workload flow, and department boundaries are stable.

## Do not do yet

- Do not modify or delete `/cardiohospital/`.
- Do not modify or delete the separate `pediatric-hospital-world` repository.
- Do not merge `hospital-unified` to main without explicit approval and a green parity/clinical validation checkpoint.
- Do not perform a photorealism/asset-generation pass yet.
- Do not add a backend.
- Do not reconnect `pager-store.ts` or `rotation-store.ts` as competing runtime state.
- Do not copy legacy HCM or urgent pager management content into new unified code without clinical validation.

## Handoff reading order

Any agent resuming this project should read, in order:

1. `PROJECT-RULES.md`
2. `docs/HOSPITAL_MASTER_PLAN.md`
3. this file
4. `docs/CLINICAL_VALIDATION.md`
5. `src/lib/hospital-engine.ts`
6. `src/lib/hospital-persistence.ts`
7. `src/lib/hospital-store.ts`
8. `src/lib/hospital-pages.ts`
9. `src/lib/hospital-work.ts`
10. `src/lib/clinical-policy/hcm-2024.ts`
11. `src/components/pager-panel.tsx`
12. `src/components/clinical/hcm-encounter.tsx`
13. `src/components/clinical/hcm-assessment-stage.tsx`
14. `src/components/world/interaction-system.tsx`
15. `src/components/world/patient-room-actors.tsx`
16. `src/components/mobile-controls.tsx`
17. `src/components/world/touch-look-controls.tsx`
18. `scripts/hospital-engine.test.mjs`

Then continue from the first incomplete item under **Next actions**, keep commits coherent, and update this ledger whenever milestone state or the next action changes materially.
