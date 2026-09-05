# Agent entrypoint

## Start here

Read `MASTER_PLAN.md` in full before changing this repository.

`MASTER_PLAN.md` is the canonical cross-window source of truth for:

- Steve's current goals and engineering principles;
- canonical repositories/products;
- current known project state;
- unresolved external/owner gates;
- technical-debt findings;
- execution order;
- exact next action;
- required end-of-session handoff behavior.

If a new chat/window/agent has no prior conversation context, **do not ask Steve to restate the project history**. Reconstruct current executable state from GitHub, preserve any newer work, and continue from the first incomplete item in `MASTER_PLAN.md` unless Steve gives newer explicit instructions.

### Current HospitalSim owner override — 2026-09-04

Before resuming the remaining physical-iPhone acceptance work, make the production HospitalSim work cleanly on Steve's **MacBook Pro first**. Treat this as the current highest-priority hospital acceptance step and as an explicit owner override of the older immediate iPhone-first resume wording in `MASTER_PLAN.md`.

For MacBook work:

- verify the current production `/hospital/` route on the actual MacBook browser;
- preserve already-completed automated desktop evidence rather than blindly rerunning broad suites;
- reproduce any Mac failure precisely and fix only the demonstrated cause;
- use the minimum focused test/build path plus exact-SHA production verification for code changes;
- do not resume remaining iPhone checks until the MacBook production path is usable, unless Steve explicitly changes priority again.

For substantive HospitalSim graphics/visual work, also read `cardio-hospital-3d/docs/VISUAL_ARCHITECTURE_SOURCE_OF_TRUTH.md` before editing. That document is the owner-approved Astra visual-architecture specification and governs the authored-hybrid graphics replacement program. Do not substitute another procedural realism pass, renderer migration, or ad-hoc asset strategy unless Steve explicitly supersedes it or the specification's measured reversal criteria are met.

After any meaningful work package, update the relevant status/checklist in `MASTER_PLAN.md` before stopping so future agents do not depend on chat memory.

# Production deployment verification

Never use “live” as a synonym for committed, CI-passed, or deployed.

Keep these states separate in every production report:

1. committed;
2. pre-deployment CI passed;
3. Cloudflare Pages deployment succeeded;
4. the exact current `main` SHA is the production deployment; and
5. the public custom-domain pages were independently browser-verified.

For Study changes, only report `DEPLOYED AND LIVE-VERIFIED` when the **Study production deployment** workflow succeeds for the same full SHA that is still at `main`. That workflow must discover a successful Cloudflare Pages production deployment for the exact SHA, reject branch previews, compare the custom domain and immutable deployment URL with that SHA's built `dist` files, and exercise the public pages in a touch-enabled browser without reading or writing family cloud data.

If the Cloudflare step has not succeeded, report `NOT DEPLOYED`. If Cloudflare succeeded but the browser step has not, report `DEPLOYED BUT NOT LIVE-VERIFIED`. If the browser step reproduces a failure, report `PRODUCTION BROKEN — FIX IN PROGRESS` and fix only the reproduced cause.

Do not infer production status from an older successful workflow run. Do not change DNS, TLS, caching, or build settings without a concrete reproduced production problem.
