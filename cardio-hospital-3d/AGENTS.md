# Pediatric Hospital — Local Agent Contract

Root `MASTER_PLAN.md` owns current repository/program state. This file contains only hospital-local invariants and the remaining physical-device acceptance contract.

## Canonical product

- Repository: `stevetodman/stevetodman.com`
- Application: `cardio-hospital-3d/`
- Production route: `/hospital/`
- `/phs/`, `/cardiohospital/`, `stevetodman/pediatric-hospital-world`, `stevetodman/3dworld`, and `stevetodman/the_ward` are reference/legacy sources unless Steve explicitly reverses that decision.

Do not split new hospital implementation work back into legacy repositories or routes.

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

## Current acceptance boundary

Desktop behavioral acceptance is complete. Do **not** rerun the full desktop pass by default.

Durable evidence:

- last fully desktop-behaviorally validated executable checkpoint: `ee6f09a06096260a37dbf77e9f68f3eb4999c668`;
- reproduced Room 1 prompt-cache defect fixed in `5073f86e9f1344f452970c3fb51e43e0246d850b`;
- detailed desktop evidence: `docs/BEHAVIORAL_ACCEPTANCE_2026-09-03.md`.

The remaining product-quality gate is **physical-iPhone M4/M5 acceptance**. Browser/device emulation is not a substitute where this gate is required. Do not begin M6 until it passes.

## Physical-iPhone acceptance

### Safari portrait

Verify:

- launch and enter hospital;
- movement joystick, right-side touch look, interact button;
- pager and Worklist usability;
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
- joystick + touch look + interact;
- pager/Worklist overlays;
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
- Do not widen scope into M6, backend work, new cases, or visual overhaul during this gate.

## When the iPhone gate passes

Record device model, iOS/Safari version, portrait/landscape/PWA/audio/ECG/reload/actor-visibility/thermal results and any reproduced defects/fixing commits. Update the hospital implementation ledger, then mark M4/M5 complete. Only then begin M6 using the existing canonical engine.

## Read only as needed

- `docs/BEHAVIORAL_ACCEPTANCE_2026-09-03.md` — completed desktop evidence.
- `docs/CLINICAL_VALIDATION.md` — clinical validation/evidence boundaries.
- `docs/HOSPITAL_MASTER_PLAN.md` — hospital architecture and future milestone design.
- `docs/IMPLEMENTATION_STATUS.md` — historical implementation ledger; root `MASTER_PLAN.md` and this file override stale resume language.
- `src/lib/hospital-engine.ts`, persistence/store/schedule/consequences/pages/work/scoring — canonical engine internals.
- `src/lib/clinical-policy/` — case-specific clinical policy.
- `src/components/` — world, clinical UI, pager/work queue, mobile/touch controls.

The next hospital product action is physical-iPhone acceptance, not architecture work and not another default desktop pass.
