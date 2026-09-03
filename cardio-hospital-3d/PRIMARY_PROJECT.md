# PRIMARY ACTIVE PROJECT

Last updated: 2026-09-03

## Primary

The current active hospital-simulator project is:

- Repository: `stevetodman/stevetodman.com`
- Application: `cardio-hospital-3d/`
- Branch: `hospital-unified`

This is the default source of truth for all current pediatric/cardiology 3D hospital simulator work unless the owner explicitly promotes another repository, site, or branch.

## Secondary / reference only

All other GitHub hospital/simulator-related repositories, branches, sites, prototypes, demos, and legacy implementations are secondary/reference only by default.

That includes, in particular:

- `/cardiohospital/` in `stevetodman/stevetodman.com`
- `stevetodman/pediatric-hospital-world`
- older hospital-simulator branches and prototypes
- related GitHub-hosted simulator sites
- `stevetodman/codex-control-plane` when relevant as infrastructure/control-plane context rather than the simulator implementation itself

Secondary projects may be inspected for assets, prior behavior, migration reference, or historical context, but must not be treated as the active implementation target unless the owner explicitly says so.

Do not split new hospital work across secondary repositories. New simulator implementation work belongs in the primary project above unless explicitly directed otherwise.

## Current resume state

- Desktop behavioral acceptance is complete.
- M4 Mobile/PWA and M5 second-consult/workload are implemented but remain open pending physical-iPhone acceptance.
- M6 must not start until the real-iPhone M4/M5 gate passes.
- Current validated executable checkpoint: `ee6f09a06096260a37dbf77e9f68f3eb4999c668`.
- Room 1 missing-prompt defect was fixed in `5073f86e9f1344f452970c3fb51e43e0246d850b`.
- The pre-priority documentation head `bec9f823c42cb78becfbae3606612ea88ab52e2a` passed `npm run test:engine` and `npm run build` in GitHub Actions run `33807378937`.

Next substantive task: physical-iPhone acceptance only; fix only reproduced failures; then close M4/M5 and begin M6.