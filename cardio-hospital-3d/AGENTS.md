# Pediatric Hospital — READ THIS FIRST

Last updated: 2026-09-03
Branch: `hospital-unified`

This file is the **current resume checkpoint for the next agent**. It supersedes older resume/next-action language in `docs/IMPLEMENTATION_STATUS.md` where that language still says desktop behavioral acceptance is pending.

## Current branch / validation state

- Current branch head immediately before this handoff file: `1b669252defd1bb475979715d6d3de95b8efe718`.
- That head is documentation-only relative to the fully behaviorally validated executable checkpoint below.
- Standard unified engine tests + production build on `1b669252...`: **PASS** — GitHub Actions run `33806948265`.
- Cloudflare Pages deployment on `1b669252...`: **PASS**.
- Last fully behaviorally validated executable checkpoint: `ee6f09a06096260a37dbf77e9f68f3eb4999c668`.
- Focused desktop behavioral acceptance on `ee6f09a0...`: **PASS** — GitHub Actions run `33806615889`.
- Standard unified engine tests + production build on `ee6f09a0...`: **PASS** — GitHub Actions run `33806615847`.
- Acceptance artifact: `hospital-desktop-acceptance`, artifact ID `9913217078`.
- Detailed evidence: `docs/BEHAVIORAL_ACCEPTANCE_2026-09-03.md`.
- No merge to `main` has occurred.
- `/cardiohospital/` and the separate `pediatric-hospital-world` repository remain untouched.

## Milestone state

- M0 Governance / drift prevention — **COMPLETE**.
- M1 Canonical engine — **COMPLETE**.
- M2 HCM vertical slice — **FUNCTIONALLY COMPLETE**.
- M3 World ↔ clinical integration — **COMPLETE**.
- M4 Mobile/PWA — **IMPLEMENTED IN CODE; PHYSICAL IPHONE ACCEPTANCE REMAINS**.
- M5 Hospital workload / second consult — **DESKTOP BEHAVIORAL ACCEPTANCE COMPLETE; PHYSICAL IPHONE ACCEPTANCE REMAINS**.
- M6+ — **NOT STARTED INTENTIONALLY**.

Do **not** start M6 until the real-iPhone M4/M5 gate passes.

## Desktop acceptance is DONE — do not redo it by default

The full production-build Chromium acceptance passed all of the following:

1. Enter hospital and interact with Dr. Patel.
2. Accept Marcus Chen.
3. Navigate to Room 3 and complete the HCM consult through debrief/completion.
4. Confirm Ava is released only after Marcus completes.
5. Accept Ava from the pager.
6. Confirm Worklist simultaneously contains exactly:
   - `Ava Rodriguez · Cardiology consult`
   - unfinished `Review overnight cardiology handoff`
7. Traverse Room 1 doorway corridor → room and room → corridor.
8. Reacquire Room 1 proximity interaction and enter with `E`.
9. Perform Ava confidential interview.
10. Leave and re-enter the same active Ava encounter.
11. Reload during active Ava history and resume the **same encounter ID, same stage, prior history work, and confidentiality state**.
12. Confirm no duplicate Ava encounter, Marcus encounter, pager entry, patient, or task state after reload.
13. Confirm Ava + unfinished handoff Worklist state survives reload.
14. Complete Ava history → examination → ECG/testing → assessment/management → debrief.
15. Replay Ava and confirm a fresh encounter with father/confidential state reset and no carried-over history answers.
16. Repeat the confidential interview on the replay and complete the replay attempt.
17. Confirm final Ava task/patient disposition complete and no active consult remains.

Do **not** repeat this entire desktop sequence unless a later code change touches shared behavior covered by these assertions or a real device reveals a shared regression that needs desktop revalidation.

## Reproduced product bug already fixed

During desktop acceptance, one genuine simulator defect was reproduced:

- **Failure:** after Ava entered confidential history, `Return to the 3D hospital` could leave the learner in Room 1 without the expected `Continue Ava Rodriguez encounter` prompt.
- **Root cause:** `closeEncounter()` cleared the visible prompt while `InteractionSystem` retained a private `priorPrompt` cache containing the same computed prompt, so it did not republish the externally-cleared prompt.
- **Fix:** `5073f86e9f1344f452970c3fb51e43e0246d850b`.
- The exact leave/re-enter sequence passed after the fix and remained green in the final full desktop acceptance.

Do not rework this area unless the device test reproduces another failure.

## Exact next action — REAL IPHONE ACCEPTANCE

Use a **physical iPhone** against the current intentional descendant of the validated checkpoint. Browser/device emulation is not sufficient for this gate.

### Safari portrait

Verify:

- launch and enter hospital;
- movement joystick;
- right-side touch look;
- interact button;
- pager open/close and usability;
- Worklist open/close and usability;
- Room 1 doorway/collision both directions;
- Room 1 proximity/interact behavior;
- Ava clinical scrolling and tap targets;
- confidential interview;
- after returning to Room 1, **visually confirm father disappears**;
- ECG controls, pan/scroll, and touch usability;
- auscultation audio starts/stops correctly after user interaction;
- leave/re-enter encounter;
- reload during active Ava encounter and exact resume without duplicates;
- complete Ava and **visually confirm Ava disappears from Room 1**;
- replay and **visually confirm father/fresh confidential state returns**.

### Safari landscape

Repeat the interaction-critical path after rotating to landscape, especially:

- safe areas;
- joystick + touch look + interact;
- pager/Worklist overlays;
- Room 1 doorway;
- short-height clinical scrolling;
- ECG controls;
- orientation change while the clinical UI is open.

### Add to Home Screen / installed PWA

Verify:

- Add to Home Screen succeeds;
- launch from Home Screen succeeds;
- portrait and landscape are both permitted;
- reload/resume works in installed mode;
- audio works after user interaction in installed mode;
- no obvious severe frame-rate collapse, excessive heat, or unacceptable battery/thermal behavior during a sustained run.

## Evidence boundary from desktop run

The headless desktop runner behaviorally validated movement/collision/proximity and canonical state. Its screenshots captured the DOM/HUD but did **not** visibly capture the WebGL 3D scene. Therefore:

- Room 1 collision/proximity behavior is already desktop-validated.
- Father removal and Ava removal are supported by canonical state/render gates, but were **not visually image-verified** in headless Chromium.
- Visually observe both actor transitions on the physical iPhone before closing M4/M5.

## Fix policy during iPhone acceptance

- Reproduce the failure precisely before editing.
- Fix only demonstrated failures.
- Keep the canonical engine and single-source-of-truth architecture intact.
- Add only focused regression coverage for a newly demonstrated state/shared-behavior bug.
- After any product fix, require `npm run test:engine` + `npm run build` green.
- Rerun the focused desktop behavioral acceptance only if the fix touches desktop/shared behavior covered by it.
- Do not widen scope into M6, backend work, new clinical cases, or visual-asset overhaul during this gate.

## When the iPhone gate passes

1. Record device model, iOS/Safari version, portrait/landscape results, PWA result, audio, ECG, reload/resume, actor-visibility checks, and performance/thermal observations.
2. Record every reproduced defect and its fixing commit.
3. Confirm final engine tests + production build are green.
4. Update `docs/IMPLEMENTATION_STATUS.md` and `docs/BEHAVIORAL_ACCEPTANCE_2026-09-03.md`.
5. Mark M4 and M5 complete only then.
6. Only then begin M6, using the existing canonical engine; do not create a parallel state subsystem.

## Read next

After this file, read in this order:

1. `docs/BEHAVIORAL_ACCEPTANCE_2026-09-03.md`
2. `PROJECT-RULES.md`
3. `docs/HOSPITAL_MASTER_PLAN.md`
4. `docs/IMPLEMENTATION_STATUS.md` — useful historical ledger, but ignore its stale statements that desktop acceptance is still pending
5. `docs/CLINICAL_VALIDATION.md`
6. `src/lib/hospital-engine.ts`
7. `src/lib/hospital-persistence.ts`
8. `src/lib/hospital-store.ts`
9. `src/lib/hospital-schedule.ts`
10. `src/lib/hospital-consequences.ts`
11. `src/lib/hospital-pages.ts`
12. `src/lib/hospital-work.ts`
13. `src/lib/clinical-policy/hcm-2024.ts`
14. `src/lib/clinical-policy/vasovagal-2026.ts`
15. `src/lib/hospital-scoring.ts`
16. `src/lib/hospital-world-layout.ts`
17. `src/components/cardio-hospital.tsx`
18. `src/components/pager-panel.tsx`
19. `src/components/work-queue-panel.tsx`
20. `src/components/clinical/hcm-encounter.tsx`
21. `src/components/clinical/hcm-assessment-stage.tsx`
22. `src/components/clinical/vasovagal-encounter.tsx`
23. `src/components/world/hospital-world.tsx`
24. `src/components/world/architecture.tsx`
25. `src/components/world/player-controller.tsx`
26. `src/components/world/interaction-system.tsx`
27. `src/components/world/patient-room-actors.tsx`
28. `src/components/mobile-controls.tsx`
29. `src/components/world/touch-look-controls.tsx`
30. focused regression scripts under `scripts/`.

The next meaningful action is **physical-iPhone behavioral acceptance**, not more architecture work and not another desktop pass.