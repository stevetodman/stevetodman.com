# Resume Word Expedition here

Repository: `stevetodman/stevetodman.com`
Branch: `study/quality-90-10-20260828`
Original base: `f069e8d4bef4c7e7e03cff63ea06514af401fcc3`

Read QUALITY_PLAN.md and STUDY_CONTRACT.md first. A saved checkpoint is NOT
App Store-quality, real-child 90/10, or production release sign-off.

## Owner decisions

- Reduce friction, keep the adventure fun, aim for 90% learning / 10% play.
- Earned study coins MAY buy cosmetic gear. NO REAL MONEY, paid currency,
  subscriptions, ads, loot boxes or payment integration.
- Ten questions; the question is the attack. Equipment never changes question
  count, grading, mastery, difficulty or rewards. No sibling rankings.
- Save work and evidence; continue fixing failed checks. Never silently merge to main.

## Current checkpoint — 28 August 2026

The owner authorized final polish and production deployment. The game is LIVE:
PR 93, production merge `88e60ab966f9fd5174d6f68021d38498a1e693e4`, app build
`4817f2505cec`, server function version 3. Both browser engines passed 43/43 and
the exact-build production canary passed. Active release record:
../tests/evidence/STUDY_RELEASE_20260828.md. It supersedes the historical statements
below that production has not changed. A pre-existing site-wide redirect-checker
issue is being corrected separately; real-device/child acceptance remains open.

The branch includes original illustrated heroes, all 32 equipment combinations,
four creatures, a forest stage and world map. Implemented and exercised:

- Permanent reward ledger and max-per-ID merge; independent wallets.
- Device-local round recovery, including correction and question 10; idempotent rewards.
- Any teacher-listed relation accepted in correction; explicit Next; short prompts.
- Readable assisted spelling model; tile choices survive reload and stay assisted.
- Compact phone layout; private expandable learning summary; separate device settings.
- Preview before spending; free re-equip/starter gear; six-item phone shelf fits.
- Shared bounded reward allowance, visible progress, no repeated live announcements.
- No stale audio toast in rewards; persistent warning when device saving fails.
- Travel independent of mastery; a twelfth-session boss without perfect mastery.
- Content-hashed app/art URLs; engineering documents excluded from production output.

Implementation and automated verification are complete for the current scope.
Latest code commit: `e174270bda69fcf41c55de2d34da43d8fda0ae1b`.
Final CI run: 33145356689. BOTH Chromium and WebKit passed 41/41 Study checks,
25/25 platform checks and the 139-file / 25-page build. Aggregate gate passed;
production canary correctly skipped. No assertion was removed to obtain a pass.

Speech warm-up, cancellation and playback tolerate exceptions. Event and exception
failures are tested through assisted spelling and reload. Only spelling auto-plays;
optional meaning audio failure says to read the question, never to find absent tiles.
Local 21/21 unit checks, syntax and diff checks also passed. All code/art is saved.
Physical iOS and observed child enjoyment/90/10 are still OPEN acceptance gates.

## Evidence, with scope

- Hosted UI clickthrough on build `766ca936cf20` is recorded in
  ../tests/evidence/STUDY_CLICKTHROUGH_20260828.md: two completed rounds, alternate correction, reload of
  correction/tiles, earned-coin preview and purchase, timeout/persistence, profile
  separation, review and device settings. No new functional failure found in
  those paths; no production activity. Physical audio and child 90/10 stay open.
- CI 33133053006 (`08cc9691f6dd6b979c696126001a2f6cbb4122a1`): Chromium 40/40,
  platform 25/25 and build 139 files / 25 indexed pages passed.
- Artifact 9670997499 was downloaded and inspected: 320px shelf, 390px armor
  preview, home, question, victory and all equipment combinations are readable,
  consistent and unclipped. No new image generation is needed.
- CI 33133269734: Chromium 40/40; WebKit 38/40. Fault-injection and QA-gallery issues.
- CI 33144925483 (`0c488b148c60e8289a0ea26a1c8286313cd4e814`): 39/40 in each
  engine. Gallery passed. Audio fixture lacked getVoices, preventing test startup;
  corrected in the latest work. Assertions were not removed or weakened.
- CI 33145172484: both engines 41/41, platform checks and build passed. WebKit
  screenshots from artifact 9675417903 were also reviewed for the narrow shop,
  question and all 32 equipment combinations. Layout and art are consistent.
- A tool-driven phone round completed 10 questions, including final-question reload,
  alternate correction and tiles. Local estimate: 7m45s learning / 52s menus/rewards.
  This interrupted agent session is NOT an observation of child attention.
- CI uploads screenshots and labeled simulated-reading timing JSON for
  320/390/1024px as study-rendered-evidence-chromium and ...-webkit.
- The stable aggregate Study contract fails if either engine fails. The production
  canary is deliberately skipped on this feature branch.

## Safe family preview

https://study-quality-90-10-20260828.stevetodman-com.pages.dev/study/

This URL is generated automatically by the existing branch integration. It was
opened and verified in a browser: correct assignment, fresh assets, answer feedback,
and pause/resume across the final fresh build: `766ca936cf20`. The same paused
question 2 and completed answer survived the update. This pages.dev hostname saves
locally only; it does NOT read/write
the production family cloud save. Each device has isolated preview progress.
The branch URL follows later commits. Record the build hash when testing.

No main merge or production deployment was performed by this work. The server
reward-merge source is changed but the production Edge Function is NOT deployed.
Web and server changes require a coordinated, separately approved release.

## Next-agent procedure

1. Fetch this branch; inspect dirty status and preserve unrelated work. Do not restart
   the product, rename compatibility keys, or clear storage.
2. Inspect the latest CI run for this exact commit. Run `npm run test:study:unit`,
   `npm run test:platform`, `npm run build`, and `git diff --check` locally.
3. Use `npm run test:study` for Chromium and `STUDY_BROWSER=webkit npm run test:study`
   with installed engines. Local Chromium download was unavailable; use working
   CI runners instead of repeatedly retrying the same failed download.
4. Inspect both browser artifacts; fix failed assertions or rendered defects.
   A test result is not evidence of physical iOS audio or actual enjoyment.
5. Follow the family/device acceptance protocol in QUALITY_PLAN.md. Real iOS
   keyboard/audio, whether the reward break feels rushed, and observed 90/10 remain
   human gates. Very fast rounds may have no shop allowance; menus can exceed the
   target before practice. Do not hide this by counting idle as learning.
6. Save a commit, exact results and this handoff before stopping. GitHub connector
   commits can have a different local SHA; compare tree SHAs, never force-push/reset.

Do not start another redesign on resumption. The next meaningful input is the
family/device acceptance record. If it finds a defect, reproduce it in the preview,
add a regression, implement the narrow fix, rerun both engines, and save a checkpoint.

## Preserved limits

Keep the 256KB server request limit. Reward history is no longer silently truncated;
future compaction must be explicitly designed and tested. Already-lost historical
rewards cannot be reconstructed by guessing. No secrets belong in this handoff.
