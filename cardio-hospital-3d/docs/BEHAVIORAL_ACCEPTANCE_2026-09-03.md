# Behavioral Acceptance Evidence — 2026-09-03

Branch: `hospital-unified`

## Validated executable checkpoint

- Commit: `ee6f09a06096260a37dbf77e9f68f3eb4999c668`
- Focused desktop behavioral acceptance: GitHub Actions run `33806615889` — **PASS**
- Standard unified engine tests + production build: GitHub Actions run `33806615847` — **PASS**
- Cloudflare branch preview deployment for the same checkpoint — **PASS**
- Acceptance artifact: `hospital-desktop-acceptance`, artifact ID `9913217078`

The browser run used Chromium 151 on Ubuntu with a 1440×1000 desktop viewport and exercised the production Next.js build through the actual rendered UI. This is desktop-browser behavioral evidence. It is **not** a substitute for physical-iPhone acceptance.

## Desktop behavioral acceptance — PASS

The focused browser run completed and asserted all of the following:

1. Enter hospital.
2. Acquire the Dr. Patel proximity interaction and use `E`.
3. Accept Marcus Chen.
4. Navigate through the 3D hospital to the Room 3 encounter zone.
5. Complete the Marcus HCM consult through debrief and return to the hospital.
6. Confirm Marcus is canonically complete and Ava is released only afterward.
7. Accept Ava from the pager.
8. Confirm the Worklist simultaneously contains exactly:
   - `Ava Rodriguez · Cardiology consult`
   - `Review overnight cardiology handoff`
9. Traverse the Room 1 doorway from corridor → room and room → corridor.
10. Reacquire the Room 1 interaction prompt after returning through the doorway.
11. Use `E` to open Ava's encounter.
12. Ask the father to step out and enter confidential history.
13. Leave the clinical overlay and re-enter the same active Ava encounter from Room 1.
14. Reload during active Ava history and resume the exact same encounter ID and stage with prior history work and confidentiality state preserved.
15. Confirm reload creates no duplicate Ava encounter, Marcus encounter, pager entry, patient, or task state.
16. Confirm the Ava + unfinished-handoff Worklist invariant survives reload.
17. Complete Ava history → examination → ECG/testing → assessment/management → attending debrief.
18. Replay Ava.
19. Confirm replay preserves the prior completed attempt and creates exactly one fresh attempt with father/confidential state reset and no carried-over history answers.
20. Repeat the confidential-interview step on the fresh replay and complete the replay attempt.
21. Confirm final Ava task/patient disposition is complete, no active consult remains, and the HUD reports clinical consults complete.

## Reproduced product defect and fix

One actual behavioral regression was reproduced during acceptance:

**Failure:** after entering Ava's confidential history, clicking **Return to the 3D hospital** could leave the learner in Room 1 without the expected `Continue Ava Rodriguez encounter` interaction prompt.

**Root cause:** `closeEncounter()` cleared the visible transient prompt, while `InteractionSystem` retained a private `priorPrompt` cache containing the same computed Ava prompt. Because the computed prompt had not changed, the interaction system did not republish it, leaving the visible store prompt and the cache out of sync.

**Fix:** `5073f86e9f1344f452970c3fb51e43e0246d850b` — `src/components/world/interaction-system.tsx` now compares the computed prompt with both its prior cache and the currently visible simulation-store prompt. If the visible prompt was externally cleared, it is republished on the next frame.

The exact previously failing leave/re-enter step passed after this fix, and the final full desktop run passed.

## Harness-only corrections — not product defects

Two failed acceptance iterations were test-harness problems and did not justify simulator changes:

- `setup-node` was initially pointed at a package lockfile path that did not exist at that checkpoint; the acceptance run stopped before launching the simulator.
- After reload/resume, the harness initially assumed the transient 3D camera would still be physically at Room 1. Persistence intentionally restores the clinical encounter while the transient camera restarts at the hospital entrance. The harness was corrected to inspect the Worklist at the entrance and then use `Resume patient` again.

No production code was changed for those harness failures.

## World/visual evidence boundary

The desktop browser run directly exercised movement, Room 1 collision in both directions, proximity-prompt acquisition, keyboard `E`, leave/re-enter behavior, canonical confidential state, replay reset, and final patient/task disposition.

The uploaded screenshots capture the DOM/HUD overlays but the headless Chromium artifact does not visibly capture the WebGL 3D scene. Therefore:

- Room 1 collision/proximity behavior is behaviorally validated by actual movement + prompt assertions.
- Father removal after confidential interview is validated by the canonical `confidentialInterviewDone` transition and the existing actor render gate, but **not claimed as visually image-verified from the headless screenshots**.
- Ava removal after final completion is validated by canonical patient disposition/task completion and the existing actor render gate, but **not claimed as visually image-verified from the headless screenshots**.

Those visual actor checks should be observed again during the physical-iPhone pass.

## Remaining required gate — REAL iPhone only

M4/M5 must **not** be marked complete and M6 must **not** begin until the following is performed on a physical iPhone against the current intentional descendant of the validated checkpoint:

### Portrait

- Launch in Safari.
- Enter hospital.
- Movement joystick.
- Right-side touch look.
- Interact button.
- Pager and Worklist open/close and remain usable.
- Navigate through Room 1 doorway in both directions.
- Start/continue Ava encounter.
- Clinical scrolling and tap targets.
- Confidential interview; visually confirm father disappears after returning to Room 1.
- ECG controls/pan/scroll.
- Auscultation audio starts/stops correctly.
- Leave/re-enter encounter.
- Reload during an active Ava encounter and confirm exact resume without duplicates.
- Complete Ava; visually confirm Ava disappears from Room 1.
- Replay; visually confirm father/fresh confidential state returns.

### Landscape

Repeat the interaction-critical items above after rotating to landscape, especially:

- safe areas and controls;
- joystick + touch look + interact;
- pager/Worklist overlays;
- Room 1 doorway;
- short-height clinical scrolling;
- ECG controls;
- orientation change while clinical UI is open.

### PWA / device behavior

- Add to Home Screen.
- Launch from Home Screen.
- Confirm portrait and landscape are both permitted.
- Reload/resume from installed mode.
- Check audio after user interaction in installed mode.
- Run long enough to assess obvious frame-rate collapse, excessive heat, or battery-impact problems.

## Next action

1. Do **not** redo the desktop acceptance unless a later code change touches behavior covered by it.
2. Perform the physical-iPhone checklist above.
3. Fix only failures that can be reproduced on the device.
4. Require focused engine tests + production build after any product fix, and rerun the relevant focused browser acceptance if the fix affects desktop/shared behavior.
5. Once the real-iPhone gate passes, update `docs/IMPLEMENTATION_STATUS.md` to mark M4/M5 complete and only then begin M6.
