# Pediatric Hospital — Implementation Status

Last updated: 2026-09-03
Branch: `hospital-unified`
Product: **Pediatric Hospital**

## Resume here

The unified application now has one canonical hospital engine, a complete HCM clinical vertical slice, Room 3/world integration, replay-safe attempts, first-class touch controls, an installable PWA shell, and a real end-to-end hospital workload foundation.

**Current milestone: M5 — Hospital work system (IN PROGRESS).**

Do **not** repeat the old assignment/task migration, pager migration, Worklist build, priority/deadline work, or schedule reconciler. Those are complete. The next code increment is deterministic **task duration/consequence semantics**, followed by a second clinically validated consult when its world location is ready.

M3 exit criteria are met. M4 is implemented in code but still requires physical-device acceptance. M5 now includes canonical pager/task state, competing work, a first-class Worklist, deterministic priority/deadline ordering, overdue projection, and simulation-time-driven schedule release.

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
  - Zustand adapter around the canonical engine;
  - schedule reconciliation after canonical transitions and on hydration.
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

Completed:

- visible pager surface with desktop/mobile-safe layout;
- immutable page definitions separated from canonical runtime state;
- canonical `PAGE_RECEIVED` and `PAGE_ACKNOWLEDGED` behavior with idempotent reducer semantics;
- acknowledgement state persists through the existing hospital persistence path;
- pager messages can link to canonical task entities;
- task model supports both patient `consult` tasks and non-patient `work` tasks without introducing a second domain store;
- explicit canonical `TASK_COMPLETED` event;
- `getOpenTasks()` exposes the cross-hospital worklist while the HCM workflow selector remains consult-specific;
- first-class collapsible Worklist UI is a read-only projection of `hospital.tasks`, independent of pager-message state;
- first competing routine task: overnight cardiology handoff review;
- learner accepts that task from the pager;
- HUD shows it as a secondary objective without replacing the HCM objective;
- all three existing team-room workstations can complete the task through the same keyboard/touch interaction path;
- canonical task `priority`, creation time, and optional due time;
- deterministic Worklist ordering by priority → due time → creation time → task ID;
- overdue state derives only from canonical simulation time;
- HCM consult is seeded as urgent; overnight handoff is routine and due before the existing noon-conference boundary;
- `src/lib/hospital-schedule.ts` materializes due page/task releases from canonical day/time only;
- schedule reconciliation occurs after canonical transitions and on hydration, so release survives reloads and cannot depend on wall-clock timers;
- repeated schedule reconciliation is idempotent;
- regression checks cover pager idempotency, work-task lifecycle, deterministic ordering, overdue transition, schedule release, and release idempotency.

Still required for M5 exit:

- deterministic task/action duration semantics rather than leaving simulation time mostly static during gameplay;
- explicit consequence rules for missed/overdue work that remain replayable and persisted;
- at least one additional competing clinical consult after its department/world and clinical content are validated;
- mobile/desktop behavioral smoke test of pager → accept → Worklist → workstation → completion;
- physical-device M4 acceptance remains a prerequisite to calling the overall mobile experience complete.

## Clinical-content state

A versioned HCM teaching policy lives separately from immutable synthetic patient facts:

- `src/lib/clinical-policy/hcm-2024.ts`

The unified path intentionally uses that policy rather than copying legacy management strings. Legacy `cases-data.ts`, `rotation-store.ts`, `pager-store.ts`, and longitudinal/adaptive modules contain older or separate state/content paths; treat them as references only and do not reconnect them as runtime truth. Any future urgent clinical pager scenario must pass the same clinical validation gate as a full encounter.

## Build / regression status

CI performs both:

1. `npm run test:engine` — focused canonical reducer/workflow regression checks;
2. `npm run build` — production Next.js build.

Current scheduler/import checkpoint `d645583e2b09bdd5e0d97f0f2c213628bd974337` passed both the engine regression suite and the production build. The immediately preceding scheduler commit failed only because Node's stripped-TypeScript test runner could not resolve extensionless runtime TypeScript imports; that boundary was corrected without changing scheduler semantics.

Before merge or final handoff, confirm the actual current branch head is green.

## Next actions — exact order

1. Complete the real-device M4 acceptance checklist above when a target iPhone is available; fix only demonstrated mobile/desktop regressions.
2. Add deterministic duration semantics for selected non-clinical work actions and advance canonical time only through explicit domain events.
3. Add explicit, persisted consequence state/selectors for overdue/missed work without using wall-clock timers.
4. Add the smallest regression coverage for those duration/consequence rules.
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
8. `src/lib/hospital-schedule.ts`
9. `src/lib/hospital-pages.ts`
10. `src/lib/hospital-work.ts`
11. `src/lib/clinical-policy/hcm-2024.ts`
12. `src/components/pager-panel.tsx`
13. `src/components/work-queue-panel.tsx`
14. `src/components/clinical/hcm-encounter.tsx`
15. `src/components/clinical/hcm-assessment-stage.tsx`
16. `src/components/world/interaction-system.tsx`
17. `src/components/world/patient-room-actors.tsx`
18. `src/components/mobile-controls.tsx`
19. `src/components/world/touch-look-controls.tsx`
20. `scripts/hospital-engine.test.mjs`

Then continue from the first incomplete item under **Next actions**, keep commits coherent, and update this ledger whenever milestone state or the next action changes materially.
