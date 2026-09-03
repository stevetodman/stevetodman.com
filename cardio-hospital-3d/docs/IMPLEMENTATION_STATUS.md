# Pediatric Hospital — Implementation Status

Last updated: 2026-09-03
Branch: `hospital-unified`
Product: **Pediatric Hospital**

## Resume here

The unified application now has one canonical hospital engine, a complete HCM clinical vertical slice, Room 3/world integration, replay-safe attempts, first-class touch controls, an installable PWA shell, and a real end-to-end hospital workload foundation with deterministic time consumption and persisted deadline consequences.

**Current milestone: M5 — Hospital work system (IN PROGRESS).**

Do **not** repeat the old assignment/task migration, pager migration, Worklist build, priority/deadline work, schedule reconciler, first duration/consequence increment, Room 1 geometry build, or vasovagal evidence-review pass. Those are complete. The next M5 runtime increment is the second competing clinical consult, but it must remain blocked until the vasovagal teaching policy receives explicit physician sign-off. Physical/browser behavioral validation of Room 1 and the complete workload loop also remains required before M5 can be called complete.

M3 exit criteria are met. M4 is implemented in code but still requires physical-device acceptance. M5 now includes canonical pager/task state, competing work, a first-class Worklist, deterministic priority/deadline ordering, simulation-time-driven schedule release, deterministic non-clinical work duration, persisted missed-deadline consequences, a second physical clinic room in code, and an evidence-reviewed second-case policy draft.

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
  - explicit schema-v1 → schema-v2 → schema-v3 migration path;
  - explicit migration/validation boundary.
- `src/lib/hospital-store.ts`
  - Zustand adapter around the canonical engine;
  - schedule and consequence reconciliation after canonical transitions and on hydration.
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
- canonical task state with explicit versioned persistence migrations;
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
- canonical task `priority`, creation time, optional due time, optional duration, completion time, and persisted deadline-miss time;
- deterministic Worklist ordering by priority → due time → creation time → task ID;
- overdue state derives only from canonical simulation time;
- HCM consult is seeded as urgent; overnight handoff is routine and due before the existing noon-conference boundary;
- `src/lib/hospital-schedule.ts` materializes due page/task releases from canonical day/time only;
- schedule reconciliation occurs after canonical transitions and on hydration, so release survives reloads and cannot depend on wall-clock timers;
- repeated schedule reconciliation is idempotent;
- overnight handoff has a deterministic canonical 12-minute duration;
- workstation completion advances simulation time only through explicit `TIME_ADVANCED` before `TASK_COMPLETED`;
- `src/lib/hospital-consequences.ts` materializes missed-deadline state from canonical simulation time only;
- canonical `TASK_DEADLINE_MISSED` is persisted, replayable, and idempotent;
- schema v2 saves migrate explicitly to schema v3 and recover known deterministic work duration without discarding prior state;
- Worklist displays task duration and distinguishes a persisted missed deadline from merely approaching a due time;
- regression checks cover pager idempotency, work-task lifecycle, deterministic ordering, overdue transition, schedule release/idempotency, duration-driven time consumption, on-time versus late completion, consequence idempotency, completion timestamps/replay behavior, and v2 → v3 persistence migration;
- reusable physical Room 1 geometry now exists west of the clinic corridor, with its own walls, doorway, floor, exam furniture, workstation, and lighting while leaving Room 3/HCM actors untouched;
- canonical world-zone projection now distinguishes `clinic-room-1`, `clinic-room-3`, clinic corridor, and workroom through a pure testable selector;
- Room 1/Room 3 doorway boundary tests run with the canonical reducer suite; the first Room 1 test correctly failed on an asymmetric assertion, the assertion was corrected without changing production geometry, and the follow-up run passed all tests and the production build;
- legacy `case-vasovagal` was selected as the preferred low-complexity second consult because it contrasts post-exertional neurally mediated syncope with the urgent HCM case;
- a dedicated evidence-review pass modernized the vasovagal teaching boundaries in `src/lib/clinical-policy/vasovagal-2026.ts` and `docs/CLINICAL_VALIDATION.md` without importing that policy into runtime;
- the vasovagal policy explicitly requires event/family history, examination, and resting ECG; treats additional cardiac testing as context-dependent rather than universally wrong; and makes sports return conditional on a reassuring initial evaluation rather than post-exertional timing alone;
- the policy remains intentionally marked `awaiting-physician-signoff`.

Second-consult readiness status:

- **World/code gate:** implemented and CI-green. Room 1 exists physically in the unified 3D architecture and canonical location mapping is regression-tested. Actual desktop/iPhone navigation/collision ergonomics still require behavioral smoke testing and are not being claimed from CI alone.
- **Clinical evidence-review gate:** complete and CI-green. The dedicated policy draft is separated from immutable synthetic patient facts and from runtime wiring.
- **Clinical approval gate:** NOT COMPLETE. Explicit physician sign-off has not yet been recorded, so the second consult must not be scheduled, rendered as a patient, scored, or exposed through the pager yet.

Still required for M5 exit:

- explicit physician sign-off of `src/lib/clinical-policy/vasovagal-2026.ts` and the corresponding vasovagal section of `docs/CLINICAL_VALIDATION.md`;
- after sign-off, add the second consult to canonical pager/task/patient/encounter scheduling and world interaction without introducing a second state path;
- focused regression coverage for second-consult release, ordering, persistence, and noninterference with HCM/replay state;
- desktop/mobile behavioral smoke test of Room 1 doorway/navigation and pager → accept → Worklist → workstation/clinical room → completion;
- physical-device M4 acceptance remains a prerequisite to calling the overall mobile experience complete.

## Clinical-content state

Versioned teaching policies live separately from immutable synthetic patient facts:

- `src/lib/clinical-policy/hcm-2024.ts`
- `src/lib/clinical-policy/vasovagal-2026.ts`

The unified path intentionally uses policy modules rather than copying legacy management strings. Legacy `cases-data.ts`, `rotation-store.ts`, `pager-store.ts`, and longitudinal/adaptive modules contain older or separate state/content paths; treat them as references only and do not reconnect them as runtime truth. Any future clinical pager scenario must pass the same clinical validation gate as a full encounter.

The current second-consult candidate is legacy `case-vasovagal`. Its evidence-review pass is complete, but it is **not yet runtime-approved** because explicit physician sign-off remains outstanding. Do not infer sign-off from the existence of the policy file or from the user's professional role.

## Build / regression status

CI performs both:

1. `npm run test:engine` — focused canonical reducer/workflow/world-zone regression checks;
2. `npm run build` — production Next.js build.

Current branch clinical-validation checkpoint `126e35b050946110654d12fa1d0517f3b22059a7` passed both gates in **Unified Hospital Build run 67**.

Room 1 corrected geometry checkpoint `da8c7403c106f7ea0a42668fc51479f005d074de` passed the expanded 10-test suite and the production build in **Unified Hospital Build run 66**. Its parent `bcf239a11a09ff61c023376b3bf4bb708b5a806c` correctly failed before build because one new doorway-boundary assertion expected `clinic-corridor` for a coordinate intentionally inside Room 1; only that assertion was corrected.

Duration/consequence runtime checkpoint `aee2f8f590af1c4771d8fc52855460bf5c3041d0` passed both the engine regression suite and the production build in **Unified Hospital Build run 63**.

The prior scheduler/import checkpoint `d645583e2b09bdd5e0d97f0f2c213628bd974337` also passed both gates; the immediately preceding scheduler commit failed only because Node's stripped-TypeScript test runner could not resolve extensionless runtime TypeScript imports, and that boundary was corrected without changing scheduler semantics.

Before merge or final handoff, confirm the actual current branch head is green.

## Next actions — exact order

1. Complete the real-device M4 acceptance checklist above when a target iPhone is available; fix only demonstrated mobile/desktop regressions.
2. Obtain explicit physician sign-off on the vasovagal policy; if changes are requested, make them in a clinical-content-only commit and rerun CI.
3. After sign-off, add the second consult as a canonical scheduled page/task/patient/encounter in Room 1 and make it compete with existing HCM/workload state.
4. Add focused regression coverage for second-consult release, ordering, persistence, completion/replay behavior, and noninterference with the HCM encounter.
5. Run desktop/mobile behavioral smoke testing of the complete M5 workload loop, including Room 1 doorway/navigation/collision behavior.
6. Expand departments incrementally under M6 only after M5 is stable.
7. Defer photorealistic/Needle asset work until architecture, mobile interaction, workload flow, and department boundaries are stable.

## Do not do yet

- Do not modify or delete `/cardiohospital/`.
- Do not modify or delete the separate `pediatric-hospital-world` repository.
- Do not merge `hospital-unified` to main without explicit approval and a green parity/clinical validation checkpoint.
- Do not perform a photorealism/asset-generation pass yet.
- Do not add a backend.
- Do not reconnect `pager-store.ts` or `rotation-store.ts` as competing runtime state.
- Do not copy legacy HCM, vasovagal, or urgent pager management content into new unified code without clinical validation.
- Do not treat evidence review as physician sign-off.
- Do not schedule/render/score the vasovagal second consult until its policy is explicitly approved.

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
9. `src/lib/hospital-consequences.ts`
10. `src/lib/hospital-pages.ts`
11. `src/lib/hospital-work.ts`
12. `src/lib/clinical-policy/hcm-2024.ts`
13. `src/lib/clinical-policy/vasovagal-2026.ts`
14. `src/lib/hospital-world-layout.ts`
15. `src/components/pager-panel.tsx`
16. `src/components/work-queue-panel.tsx`
17. `src/components/clinical/hcm-encounter.tsx`
18. `src/components/clinical/hcm-assessment-stage.tsx`
19. `src/components/world/architecture.tsx`
20. `src/components/world/player-controller.tsx`
21. `src/components/world/interaction-system.tsx`
22. `src/components/world/patient-room-actors.tsx`
23. `src/components/mobile-controls.tsx`
24. `src/components/world/touch-look-controls.tsx`
25. `scripts/hospital-engine.test.mjs`
26. `scripts/hospital-world-layout.test.mjs`

Then continue from the first incomplete item under **Next actions**, keep commits coherent, and update this ledger whenever milestone state or the next action changes materially.
