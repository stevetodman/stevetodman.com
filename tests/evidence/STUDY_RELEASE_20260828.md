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

## Release completed

- PR 93 merged the tested head `2d4dce89c7327e5725f289f3016533b9aa7f95a6`.
- Production merge: `88e60ab966f9fd5174d6f68021d38498a1e693e4`.
- Live app build: `4817f2505cec`, on `/study/` and `/study/unit-1/`.
- Backend: `studyhub-save` version 3, ACTIVE. Retrieved deployed source and
  deno.json match this release exactly; custom token authentication is unchanged.
- Both cloud canaries pass: input validation, CORS, rejected direct table access,
  push/pull/merge and 250-session plus legacy reward preservation. Synthetic only.
- Release-branch CI 33146772880: Chromium 43/43, WebKit 43/43, platform 25/25
  in each engine and build 139 files/25 pages. Aggregate passed.
- PR CI 33146775465 passed both engines. Broader Tests 33146775446 and cloud
  canary 33146775421 also passed. No failing assertion was removed.
- Main Study CI 33147018781 passed both engines and the exact-build production
  canary, job 98770740071: both live routes verified at 06:13:52 UTC.
- Main broader Tests 33147018815 and cloud canary 33147018782 passed.
- Independent HTTP checks matched both live HTML files and all seven app/art
  assets byte-for-byte to dist. Browser home showed the correct build, both hero
  cards, healthy cloud status and no app-origin errors. No family answers submitted.
- Final Chrome artifact 9676088286 and WebKit artifact 9676120489 were inspected.
  Gear preview, all six items and Done fit at 320px; the test now explicitly checks
  the preview as well as the initial shelf. Audio is one line with 44px+ targets.
- A complete Samantha preview round also finished at 7/10, +20 XP, +8 coins,
  Level 2 and route 1/12; its saved results were inspected. This was test progress.

## Production checker follow-up

The broader production-policy job 33147018775 failed on 12 expected Cloudflare
`.html` → extensionless 308 redirects, counting each as a missing page and missing
robots meta. The prior production main run 33129338900 also failed; this was not a
Study regression. The game release and its exact-build canary passed independently.

The follow-up checker accepts only one same-origin, exact-extension-removal
301/308 hop for cataloged public HTML. It verifies noindex on the redirect and
checks status, headers and robots metadata on the destination. Internal/excluded
routes still require a direct 404. New tests reject missing destinations, missing
metadata and unrelated same-origin or cross-origin redirects. All 28 platform
checks pass locally. The corrected full-site verifier passed against production.
PR 94 merged this checker-only fix as `f97271d9ec98febf7659dc0e8b34d3f2892a6819`
after its checks cleared. No website content or security policy was changed;
the game remains build `4817f2505cec`.

## Remaining acceptance limits

Physical iOS audio/keyboard, child enjoyment and real-child 90/10 remain unverified.
The agent interaction timer and automated simulated-reading fixtures are not child
attention measurements. Deployment does not certify these gates or App Store
approval. No real-money purchasing exists.

## Next-agent instructions

The owner explicitly requested proportionate testing: this is for the twins,
not a commercial platform. Do not expand CI, build more test infrastructure, or
hold routine polish for exhaustive certification. Retain existing safety checks.
For subsequent changes, use a short playthrough, save/reload and phone-layout check;
add a regression only when it protects a concrete bug worth catching again.

Read this record and study/QUALITY_HANDOFF.md before working. The game is already
live and the checker follow-up is complete. Do not redeploy the old version, clear
progress, rename storage keys or restart the design. Prioritize feedback from the
twins and preserve the rollback baseline above. Human acceptance limitations are
honest limitations, not a reason to keep building verification machinery.
