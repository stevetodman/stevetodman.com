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
