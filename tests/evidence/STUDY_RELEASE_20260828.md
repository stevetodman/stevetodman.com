# Study production release — 28 August 2026

Owner authorized polish and production release in this conversation.
This is release evidence, not App Store approval or real-child 90/10 certification.

## Rollback baseline

- Production main before release: `f069e8d4bef4c7e7e03cff63ea06514af401fcc3`.
- Study backend: project `lpjvsjezjjasgpkvjjlq`, function `studyhub-save`, version 2.
  Retrieved deployed source matches the function at that main commit exactly.
- The function's existing custom bearer-token authentication remains unchanged;
  `verify_jwt: false` is the prior setting, not a newly relaxed requirement.
- No database schema migration is required. Existing saves and compatibility keys
  must not be cleared. Never restore a database backup to undo this web release.
- If the website fails verification, revert the release merge through a new commit
  on main or restore the previous known-good Pages deployment; preserve dist-only
  deployment and all unrelated site work. The compatible server ledger fix can stay.
- Do not roll the server back to its truncating merge after new reward history has
  accumulated without assessing data-loss risk. Prefer a forward fix. The prior
  source/deno.json remain available at the baseline commit if urgently required.

## Polish

- Hear word uses a single-line, minimum-44px control at all supported widths.
- Unconfirmed try-ons are validated, device-local, learner-specific bookmarks.
  A timeout/reload preserves them for the next earned reward break, never buys
  automatically, and never changes the time allowance. Cancel/confirmation clears
  the bookmark. Practice and the other learner are not interrupted.
- Production canary now checks the exact content build on both Study URLs.
- Added a synthetic 250-session cloud ledger canary, including stale writes and
  preserved legacy totals. Uses the existing public test row, not family data.

## Verification checkpoint

- Local Study unit checks: 22/22 passed.
- Platform checks: 25/25 passed.
- Production build: 139 files, 25 indexed pages; code syntax and diff checks passed.
- Browser-engine checks and production cutover: pending at this checkpoint.
- Physical iOS audio/keyboard and observed child enjoyment/90/10 remain unverified.

## Next action

Run both browser engines on the feature branch, inspect audio/saved-choice evidence,
deploy the compatible server function and run both synthetic cloud canaries, then
merge only the tested head. Wait for Pages and exact-build production verification.
Append exact commit/build/CI/function version and live results before reporting done.
