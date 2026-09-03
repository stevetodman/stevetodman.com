# Pediatric Hospital — Implementation Status

Last updated: 2026-09-03
Branch: `hospital-unified`
Product: **Pediatric Hospital**

## Resume here

The unified application now has one canonical hospital engine, a complete HCM clinical vertical slice, Room 3/world integration, replay-safe attempts, first-class touch controls, an installable PWA shell, a real hospital workload foundation, and a second physician-approved clinical consult (Ava Rodriguez, Room 1) wired through the same canonical pager/task/patient/encounter architecture.

**Current milestone: M5 — Hospital work system (IN PROGRESS; second consult implemented and CI-green, real-browser/device acceptance remains).**

### Current safe checkpoint

- Branch head at this handoff: `517bc02e6db15063372cc9ab8286001bdbaaf3e2`.
- Latest validated workflow: **Unified Hospital Build run 76 — PASS**.
- Run 76 passed both `npm run test:engine` and `npm run build`.
- The latest focused regression explicitly verifies that unfinished overnight handoff work remains open while Ava is released and completed.
- The Worklist now labels Ava explicitly as **Ava Rodriguez · Cardiology consult — Post-race syncope · Clinic Room 1** instead of generic `Clinical consult`.
- A suspected Room 1 actor regression was investigated and rejected: `HospitalWorld` already renders `VasovagalRoomActors` at scene root, so Ava/father are mounted without duplicating them inside `architecture.tsx`.
- No merge to `main` has occurred.
- `/cardiohospital/` and the separate `pediatric-hospital-world` repository remain untouched.

### Do not redo completed work

Do **not** repeat the old assignment/task migration, pager migration, Worklist build, priority/deadline work, schedule reconciler, first duration/consequence increment, Room 1 geometry build, vasovagal evidence review, physician sign-off, Ava runtime migration, Ava Worklist labeling fix, or Ava/handoff noninterference regression coverage. Those are complete.

The remaining work is **behavioral acceptance** of the complete M4/M5 loop in actual target browsers/devices and correction of demonstrated interaction problems only.

### Exact first action for the next agent

1. Read the handoff files in the order listed at the end of this document.
2. Confirm `hospital-unified` still points to this checkpoint or a newer intentional descendant.
3. Confirm the newest `Unified Hospital Build` on the actual branch head is green before editing.
4. Do **not** add another patient/case or start M6 yet.
5. Start the app from `cardio-hospital-3d` and perform the desktop behavioral smoke test described under **Next actions — exact order**.
6. Record any failure by exact reproduction steps before changing code; fix only demonstrated regressions.
7. After desktop passes, perform the real-iPhone portrait/landscape acceptance checklist.
8. Only after both behavioral gates pass should M4/M5 be marked complete and M6 begin.

For a local desktop run from the repository root:

```bash
cd cardio-hospital-3d
npm install
npm run test:engine
npm run build
npm run dev
```

Then open `http://localhost:3000` in a desktop browser. There is currently no branch preview/deployment that substitutes for this acceptance test; do not claim live-browser or iPhone acceptance from CI alone.

M3 exit criteria are met. M4 is implemented in code but still requires physical-device acceptance. M5 now includes canonical pager/task state, competing work, a first-class Worklist, deterministic priority/deadline ordering, simulation-time-driven schedule release, deterministic non-clinical work duration, persisted missed-deadline consequences, two physical clinic rooms, and two complete clinical consults using one canonical state path.

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

The unified React app reproduces and extends the working HCM vertical-slice loop without depending on `/cardiohospital/`:

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

Completed workload foundation:

- visible pager surface with desktop/mobile-safe layout;
- immutable page definitions separated from canonical runtime state;
- canonical `PAGE_RECEIVED` and `PAGE_ACKNOWLEDGED` behavior with idempotent reducer semantics;
- acknowledgement state persists through the existing hospital persistence path;
- pager messages can link to canonical task entities;
- task model supports both patient `consult` tasks and non-patient `work` tasks without introducing a second domain store;
- explicit canonical `TASK_COMPLETED` event;
- `getOpenTasks()` exposes the cross-hospital worklist while the consult workflow remains canonical;
- first-class collapsible Worklist UI is a read-only projection of `hospital.tasks`, independent of pager-message state;
- first competing routine task: overnight cardiology handoff review;
- learner accepts that task from the pager;
- all three team-room workstations can complete the task through the same keyboard/touch interaction path;
- canonical task priority, creation time, optional due time, optional duration, completion time, and persisted deadline-miss time;
- deterministic Worklist ordering by priority → due time → creation time → task ID;
- overdue state derives only from canonical simulation time;
- HCM consult is seeded urgent; overnight handoff is routine and due before the existing noon-conference boundary;
- `src/lib/hospital-schedule.ts` materializes due releases from canonical state only;
- schedule reconciliation occurs after canonical transitions and on hydration, so releases survive reloads and cannot depend on wall-clock timers;
- repeated schedule reconciliation is idempotent;
- overnight handoff has a deterministic canonical 12-minute duration;
- workstation completion advances simulation time only through explicit `TIME_ADVANCED` before `TASK_COMPLETED`;
- `src/lib/hospital-consequences.ts` materializes missed-deadline state from canonical simulation time only;
- canonical `TASK_DEADLINE_MISSED` is persisted, replayable, and idempotent;
- schema v2 saves migrate explicitly to schema v3 and recover known deterministic work duration without discarding prior state;
- Worklist displays task duration and distinguishes a persisted missed deadline from merely approaching a due time;
- Room 1 geometry exists west of the clinic corridor and canonical world-zone projection distinguishes `clinic-room-1`, `clinic-room-3`, corridor, and workroom;
- focused CI now explicitly verifies that unfinished handoff work remains open while Ava is released and completed.

Completed second-consult migration:

- legacy `case-vasovagal` selected as the low-risk contrast to urgent HCM;
- dedicated evidence review and explicit physician sign-off recorded in `docs/CLINICAL_VALIDATION.md`;
- `src/lib/clinical-policy/vasovagal-2026.ts` is versioned `physician-approved` and exposes machine-readable approved history/test requirements without changing synthetic patient facts;
- preferred diagnosis is **probable post-exertional neurally mediated syncope**; accepted labels do not require the word “vasovagal”;
- the runtime explicitly teaches history + family history + examination + ECG rather than “ECG only”;
- athletic sinus bradycardia is interpreted as physiologic in the supplied reassuring ECG;
- energy drinks/vaping are confidential-history and counseling targets but do not automatically trigger imaging/monitoring;
- echo, ambulatory monitoring, exercise testing, CMR, troponin, BNP, and broad labs are represented as conditional tools rather than universally wrong tests;
- same-day automatic return to competition is a safety error; return after complete recovery and reassuring evaluation is the approved low-risk pathway;
- broader adolescent/endurance-athlete history domains are taught without inventing patient-specific answers absent from `cases-data.ts`;
- Ava is released deterministically after the first HCM consult completes, through canonical schedule reconciliation rather than a wall-clock timer;
- release materializes one canonical Room 1 patient, pager message, and routine consult task and is idempotent across repeated reconciliation/reload;
- the existing generic pager accepts the consult and the existing Worklist reflects it without a parallel task store;
- Worklist labeling now identifies Ava explicitly rather than falling back to a generic clinical-consult label;
- Room 1 interaction starts/resumes the canonical Ava encounter through the same keyboard/touch path as Room 3;
- top-level encounter rendering and HUD objectives are now case-aware rather than hard-coded to Marcus;
- `HospitalWorld` renders `VasovagalRoomActors` at scene root; Room 1 Ava/father actors project canonical state, the father disappears after the confidential interview, and replay restores a fresh confidential state;
- Ava has a complete history → exam → tests/ECG interpretation → assessment/management → debrief → completion/replay loop;
- policy-aware scoring supports accepted diagnosis aliases and approved required-history keys while preserving existing HCM behavior;
- tests that are merely non-routine in this fixed low-risk phenotype can reduce efficiency without being mislabeled categorically unnecessary;
- focused regression coverage verifies post-HCM release, idempotency, HCM noninterference, handoff noninterference, Ava completion/replay preservation, approved diagnosis aliases, required history, ECG requirement, and conditional-test stewardship.

Second-consult readiness status:

- **Clinical gate: COMPLETE.** Evidence review and explicit physician sign-off are recorded.
- **World/code gate: COMPLETE IN CODE.** Room 1 exists, canonical location mapping is tested, Room 1 actors are mounted, and Room 1 interactions use canonical state.
- **Runtime gate: COMPLETE IN CODE AND CI-GREEN.** Ava is scheduled, paged, accepted, rendered, scored, completed, and replayed through the canonical engine.
- **Behavioral acceptance gate: OPEN.** Actual desktop/iPhone navigation, collision ergonomics, touch interaction, overlay usability, and the full pager → Worklist → Room 1 → completion flow still require real-browser/device smoke testing.

Still required for M5 exit:

- desktop browser smoke test of Marcus completion → Ava page release → pager acceptance → Worklist display → Room 1 navigation → confidential history → exam/tests/assessment/debrief → completion/replay;
- visually confirm unfinished handoff work remains visible/competing in the actual Worklist while Ava releases and that completing either task leaves the other usable; this invariant is now covered in reducer CI but still needs UI confirmation;
- desktop reload/resume check with Ava actively in progress;
- iPhone portrait/landscape smoke test of the same flow, especially Room 1 doorway/collision, pager/worklist overlays, touch interact, clinical scrolling/tap targets, and reload/resume;
- fix only demonstrated behavioral regressions, rerun focused CI/build, then record M5 completion.

## Clinical-content state

Versioned teaching policies live separately from immutable synthetic patient facts:

- `src/lib/clinical-policy/hcm-2024.ts`
- `src/lib/clinical-policy/vasovagal-2026.ts`

The unified path intentionally uses policy modules rather than copying legacy management strings. Legacy `cases-data.ts`, `rotation-store.ts`, `pager-store.ts`, and longitudinal/adaptive modules contain older or separate state/content paths; treat them as references only and do not reconnect them as runtime truth.

`case-vasovagal` is clinically approved **and active in the unified runtime**. Its immutable synthetic facts remain in `cases-data.ts`; corrected interpretation/scoring/management boundaries come from the physician-approved policy module. Future cases must pass the same clinical validation gate before runtime activation.

## Build / regression status

CI performs both:

1. `npm run test:engine` — focused canonical reducer/workflow/world-zone/second-consult regression checks;
2. `npm run build` — production Next.js build.

### Latest green chain

- `517bc02e6db15063372cc9ab8286001bdbaaf3e2` — **Cover Ava and handoff workload noninterference** — Unified Hospital Build **run 76 PASS**.
- `249d24d956ceaf94bc2de48e56e86253203ea44b` — **Label Ava explicitly in unified hospital worklist** — Unified Hospital Build **run 75 PASS**.
- `785e2eba6e2d9f5626033a8d52b3a59396fe0652` — **Advance M5 ledger after Ava runtime activation** — Unified Hospital Build **run 74 PASS**.
- `e7973cff01ffcfffc08c4b8a84bbcf0dba958037` — stripped-TypeScript pager import fix — Unified Hospital Build **run 73 PASS**.

Historical note: second-consult commit `6c78b9edd6a505af03f68e31701304bf4240bce3` failed before build because the new pager definition used an extensionless runtime TypeScript import under Node's stripped-TypeScript runner. `e7973cf…` corrected that module-resolution boundary; subsequent runs are green.

The CI run corresponding to the **actual current branch head** is the one that matters. A later agent must re-check it rather than assuming the SHA above is still current.

Known non-blocking CI/build warnings at this checkpoint:

- Node emits `MODULE_TYPELESS_PACKAGE_JSON` warnings under the stripped-TypeScript test runner.
- Next.js reports multiple lockfiles/workspace-root inference and no build cache.
- These warnings did not fail tests/build and are not M4/M5 acceptance blockers; do not widen scope solely to silence them unless they cause a demonstrated problem.

## Next actions — exact order

1. **Desktop behavioral acceptance — highest priority.** Run the app locally and complete the full M5 path: enter hospital → accept Marcus → complete HCM consult → observe Ava page release → accept Ava → verify Worklist shows Ava by name and unfinished handoff concurrently → navigate into Room 1 → private adolescent history → exam → ECG/conditional testing → assessment/management → debrief → complete → replay.
2. **Desktop persistence/reload acceptance.** During an active Ava encounter, close/reload the page, re-enter the hospital, verify the same active Ava encounter resumes with prior stage/history/test state intact, and verify duplicate patient/page/task/encounter entities are not created.
3. **Desktop world/interaction acceptance.** Verify Room 1 doorway/collision in both directions, proximity prompt, keyboard `E`, leaving/re-entering encounter overlay, parent disappearance after confidential interview, patient disappearance after final completion, and fresh parent/confidential state on replay.
4. **Real iPhone M4/M5 acceptance — portrait and landscape.** Test movement joystick, right-side touch look, interact button, Room 1 doorway, pager and Worklist overlays, clinical scrolling/tap targets, ECG controls, auscultation/Web Audio, orientation change, reload/resume, Add to Home Screen launch, and performance/thermal behavior.
5. **Fix only reproduced failures.** Keep fixes narrow, preserve the canonical engine, add only focused regression coverage for any newly demonstrated state bug, and require `npm run test:engine` + `npm run build` green after each coherent fix.
6. **Close milestones only after behavioral acceptance.** Once desktop and iPhone gates pass, update this ledger and mark M4/M5 complete.
7. **Then begin M6.** Start with outpatient-clinic depth under the existing engine; do not create a new state subsystem. Every new case must pass the same clinical validation gate before activation.
8. Defer photorealistic/Needle asset work until architecture, mobile interaction, workload flow, and department boundaries are stable.

## Acceptance evidence to record

When M4/M5 behavioral testing is performed, the next agent should add a short dated section here containing:

- device/browser and orientation;
- branch SHA tested;
- exact flow completed;
- pass/fail for movement, look, interact, pager, Worklist, Room 1 collision, clinical overlay, confidentiality actor change, completion/replay, reload/resume, audio, ECG controls, and PWA launch where applicable;
- any reproduced defect and the commit that fixed it;
- final CI run number after fixes.

Do not mark an acceptance item passed from code inspection or CI alone when it requires real browser/device behavior.

## Do not do yet

- Do not modify or delete `/cardiohospital/`.
- Do not modify or delete the separate `pediatric-hospital-world` repository.
- Do not merge `hospital-unified` to main without explicit approval and a green parity/clinical validation checkpoint.
- Do not perform a photorealism/asset-generation pass yet.
- Do not add a backend.
- Do not reconnect `pager-store.ts` or `rotation-store.ts` as competing runtime state.
- Do not copy legacy HCM, vasovagal, or future case management content into unified runtime without the clinical validation process.
- Do not add another clinical consult merely to expand content volume before M5 behavioral acceptance.
- Do not replace focused CI with a large slow E2E suite; add only tests needed to prevent a demonstrated regression.

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
14. `src/lib/hospital-scoring.ts`
15. `src/lib/hospital-world-layout.ts`
16. `src/components/cardio-hospital.tsx`
17. `src/components/pager-panel.tsx`
18. `src/components/work-queue-panel.tsx`
19. `src/components/clinical/hcm-encounter.tsx`
20. `src/components/clinical/hcm-assessment-stage.tsx`
21. `src/components/clinical/vasovagal-encounter.tsx`
22. `src/components/world/hospital-world.tsx`
23. `src/components/world/architecture.tsx`
24. `src/components/world/player-controller.tsx`
25. `src/components/world/interaction-system.tsx`
26. `src/components/world/patient-room-actors.tsx`
27. `src/components/mobile-controls.tsx`
28. `src/components/world/touch-look-controls.tsx`
29. `scripts/hospital-engine.test.mjs`
30. `scripts/hospital-world-layout.test.mjs`
31. `scripts/vasovagal-second-consult.test.mjs`

Then continue from item 1 under **Next actions — exact order**, keep commits coherent, and update this ledger whenever milestone state, verified acceptance evidence, branch head, or the next action changes materially.
