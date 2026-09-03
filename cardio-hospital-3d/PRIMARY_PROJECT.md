# PRIMARY ACTIVE PROJECT

Last updated: 2026-09-03

## Primary

The current active hospital-simulator project is:

- Repository: `stevetodman/stevetodman.com`
- Application source: `cardio-hospital-3d/`
- Development branch: `hospital-unified`
- Approved resident-facing production route: `/hospital/`

This is the default source of truth for all current pediatric/cardiology 3D hospital simulator work unless the owner explicitly promotes another repository, site, or branch.

On 2026-09-03 the owner explicitly directed that **the hospital built today is the hospital that should appear on the website**. The production integration therefore generates the validated unified app into `/hospital/`; the source directory itself remains excluded from the public artifact.

## Secondary / reference only

All other GitHub hospital/simulator-related repositories, branches, sites, prototypes, demos, and legacy implementations are secondary/reference only by default.

That includes, in particular:

- `/phs/` — former public Pediatric Hospital Simulator, now archived/reference-only
- `/cardiohospital/` in `stevetodman/stevetodman.com`
- `stevetodman/pediatric-hospital-world`
- older hospital-simulator branches and prototypes
- related GitHub-hosted simulator sites
- `stevetodman/codex-control-plane` when relevant as infrastructure/control-plane context rather than the simulator implementation itself

Secondary projects may be inspected for assets, prior behavior, migration reference, or historical context, but must not be treated as the active implementation target unless the owner explicitly says so.

Do not split new hospital work across secondary repositories. New simulator implementation work belongs in the primary project above unless explicitly directed otherwise.

## Current resume state

- Desktop behavioral acceptance is complete.
- The unified app passes canonical engine tests and static production export for the `/hospital/` base path.
- Resident Education promotion to `/hospital/` is approved and staged for production merge/deploy.
- M4 Mobile/PWA and M5 second-consult/workload are implemented but remain open pending physical-iPhone acceptance.
- Publishing the app does not itself satisfy the physical-iPhone acceptance gate.
- M6 must not start until the real-iPhone M4/M5 gate passes.
- Last fully behaviorally validated executable checkpoint before production-path packaging: `ee6f09a06096260a37dbf77e9f68f3eb4999c668`.
- Room 1 missing-prompt defect was fixed in `5073f86e9f1344f452970c3fb51e43e0246d850b`.
- Production-path static export is green at `6aa8adf79b16913b0feb03d68578e4029deb0cd2` in Unified Hospital Build run 95.

Next product-quality task after production promotion: physical-iPhone acceptance only; fix only reproduced failures; then close M4/M5 and begin M6.
