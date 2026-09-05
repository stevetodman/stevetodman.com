# Pediatric Hospital — Local Agent Contract

Root `MASTER_PLAN.md` owns current repository/program state. This file contains hospital-local invariants, the remaining physical-device acceptance contract, and the local handoff into the owner-approved visual architecture program.

## Canonical product

- Repository: `stevetodman/stevetodman.com`
- Application: `cardio-hospital-3d/`
- Production route: `/hospital/`
- `/phs/`, `/cardiohospital/`, `stevetodman/pediatric-hospital-world`, `stevetodman/3dworld`, and `stevetodman/the_ward` are reference/legacy sources unless Steve explicitly reverses that decision.

Do not split new hospital implementation work back into legacy repositories or routes.

## Required reading order for hospital work

1. Root `MASTER_PLAN.md` — current program state and exact resume point.
2. This file — hospital-local invariants and physical-iPhone acceptance.
3. For any substantive graphics/visual work: `docs/VISUAL_ARCHITECTURE_SOURCE_OF_TRUTH.md` — owner-approved Astra visual architecture and phased implementation plan.

Do not ask the owner to reconstruct prior context when these documents answer the question. Preserve newer completed work and continue from the first unfinished item.

## Durable engine / clinical invariants

- There is one Pediatric Hospital product and one canonical simulation state.
- `src/lib/cases-data.ts` remains clinical case truth unless a deliberate reviewed medical-content revision is made.
- Runtime medical reality belongs to the canonical event-driven engine, never React/Three.js/page-local state.
- Every patient has one stable identity across the world and clinical interfaces.
- UI state and simulation state remain separate; derived displays may be recomputed, competing state copies are prohibited.
- New 3D/clinical interactions dispatch domain events rather than mutating clinical state directly.
- Persist only versioned, serializable canonical state; storage migrations must be explicit.
- Teaching cases remain synthetic; no PHI.
- Do not silently alter clinical facts, thresholds, diagnoses, management logic, or source metadata.
- Prefer deterministic behavior over LLM-dependent core simulation logic.
- Do not add a backend without a concrete requirement that cannot be met safely client-side.
- Visuals and animation are projections of canonical clinical state; they must never become a competing clinical state machine.

## Current acceptance boundary

Desktop behavioral acceptance is complete. Do **not** rerun the full desktop pass by default.

Durable evidence:

- last fully desktop-behaviorally validated executable checkpoint: `ee6f09a06096260a37dbf77e9f68f3eb4999c668`;
- reproduced Room 1 prompt-cache defect fixed in `5073f86e9f1344f452970c3fb51e43e0246d850b`;
- detailed desktop evidence: `docs/BEHAVIORAL_ACCEPTANCE_2026-09-03.md`.

The remaining product-quality gate is **physical-iPhone M4/M5 acceptance**. Browser/device emulation is not a substitute where this gate is required. The accepted Astra visual plan calls this **Phase 0**. Do not begin the authored visual proof until Phase 0 is complete.

## Physical-iPhone acceptance — Phase 0

### Safari portrait

Verify:

- launch and enter hospital;
- left movement joystick, right look joystick, simultaneous move + look, and interact button;
- the interactive team-room clinician shows the expected Speak affordance and opens the briefing;
- each visible consult case shows the expected Speak/Interact affordance at natural proximity while its task is available, assigned, or in progress;
- Pager and Worklist open, scroll, and close correctly above the twin-stick controls;
- Room 1 doorway/collision both directions and proximity interaction;
- Ava clinical scrolling/tap targets and confidential interview;
- after confidential return, visually confirm father disappears;
- ECG controls/pan/scroll and touch usability;
- auscultation audio starts/stops after user interaction;
- leave/re-enter the same active encounter;
- reload during active Ava encounter resumes the same encounter/state without duplicates;
- after completion, visually confirm Ava disappears from Room 1;
- replay creates a fresh encounter and father/confidential state returns.

### Safari landscape

Repeat the interaction-critical path, especially:

- safe areas;
- left movement joystick + right look joystick + simultaneous move/look + interact;
- Pager/Worklist overlays;
- clinician and consult-case Speak/Interact proximity behavior;
- Room 1 doorway;
- short-height clinical scrolling;
- ECG controls;
- orientation change while clinical UI is open.

### Installed PWA

Verify:

- Add to Home Screen and launch succeed;
- portrait and landscape are permitted;
- reload/resume works;
- audio works after user interaction;
- no severe frame-rate collapse, excessive heat, or unacceptable battery/thermal behavior during a sustained run.

## Fix policy during iPhone acceptance

- Reproduce a failure precisely before editing.
- Fix only demonstrated failures.
- Keep canonical engine/single-source-of-truth architecture intact.
- Add only focused regression coverage for the reproduced defect.
- After a product fix, require `npm run test:engine` + `npm run build` green.
- Rerun full desktop behavioral acceptance only if the fix touches shared behavior covered by that acceptance.
- Do not widen scope into backend work, new cases, or visual overhaul during this gate.
- Do not repeat already-passed physical checks unless a new reproducible regression appears.

## After Phase 0 passes

Record device model, iOS/Safari version, portrait/landscape/PWA/audio/ECG/reload/actor-visibility/thermal results and any reproduced defects/fixing commits. Update the hospital implementation ledger and root `MASTER_PLAN.md`, then mark M4/M5 / Phase 0 complete.

The next graphics action is then **Phase 1 of `docs/VISUAL_ARCHITECTURE_SOURCE_OF_TRUTH.md`**:

- prove one authored room;
- prove one equipment set;
- prove the minimum compatible rigged character family;
- prove the complete lighting/export/lightmap recipe;
- preserve simple explicit collision and the canonical clinical engine;
- use minimum focused tests;
- do **not** extend the old procedural realism program and do **not** migrate renderers first.

Subsequent order is fixed unless explicitly superseded: Phase 2 complete encounter vertical slice -> Phase 3 second-room reuse proof -> Phase 4 progressive room-by-room replacement.

## Read only as needed

- `docs/VISUAL_ARCHITECTURE_SOURCE_OF_TRUTH.md` — governing HospitalSim visual architecture, performance envelope, proof-scene criteria, do-not-build list, and Phases 0–4.
- `docs/BEHAVIORAL_ACCEPTANCE_2026-09-03.md` — completed desktop evidence.
- `docs/CLINICAL_VALIDATION.md` — clinical validation/evidence boundaries.
- `docs/HOSPITAL_MASTER_PLAN.md` — durable hospital architecture/milestone background; the visual source-of-truth document overrides conflicting older graphics guidance.
- `docs/IMPLEMENTATION_STATUS.md` — historical implementation ledger; root `MASTER_PLAN.md`, this file, and the visual source-of-truth document override stale resume language.
- `src/lib/hospital-engine.ts`, persistence/store/schedule/consequences/pages/work/scoring — canonical engine internals.
- `src/lib/clinical-policy/` — case-specific clinical policy.
- `src/components/` — world, clinical UI, pager/work queue, mobile/touch controls.

The next hospital product action is completion of physical-iPhone Phase 0. After that, continue directly into the owner-approved Astra authored-hybrid visual program.
