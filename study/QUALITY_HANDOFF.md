# Resume Word Expedition here

Branch: `study/quality-90-10-20260828`
Repository: `stevetodman/stevetodman.com`
Base: `f069e8d4bef4c7e7e03cff63ea06514af401fcc3`

Read `QUALITY_PLAN.md` and `STUDY_CONTRACT.md` first. This is a recovery checkpoint,
not App Store-quality sign-off. Production is unchanged by this branch.

## Current work — checkpoint 2

Latest owner clarification: in-game purchases with earned study coins ARE allowed;
REAL MONEY is not. No checkout, paid currency, subscriptions or monetization.

The complete illustrated atlas and two world backdrops are now included under
`study/unit-1/assets/` with prompt provenance. Phone home/question screens were
visually inspected; atlas clipping was corrected. All outfits still need the full
rendered gallery review. No new image generation is required.

Implemented since checkpoint1: compact storybook game layout; meaningful labels;
shorter definition prompts; explicit word/sentence audio; try-on before spending;
free re-equip and starter gear; local timing including post-session activity;
bounded reward phase; route-based boss release valve; content-hashed asset URLs
in the production build. Production is still unchanged.

Current verification:21 unit checks pass, syntax/diff checks pass, build139files /
25 indexed pages. Browser suite adds pause/reload/final-question/preview/timing
scenarios; CI verification is NEXT, not yet claimed. Local Chromium remains absent.

Known open review items:
- Reward timeout can be too abrupt for very fast rounds; measure and refine without
  pretending all real child behavior is guaranteed90/10.
- Check full rendered shop, all equipment combinations, reduced motion, keyboard.
- Confirm real browser timing/round recovery assertions in CI.
- Production server merge source still requires separately authorized deployment.
- Real iOS audio/keyboard and child enjoyment need physical-device/family evidence.

## Earlier recovery checkpoint

Recovery checkpoint 1 (28 August 2026, approximately00:51 UTC): implementation
continues. Original cohesive atlas/world art is being generated and inspected.

Implemented: no reward-ledger pruning on client/server; max-per-ID union; session
count from union; device-local round snapshots and resume; official alternative
corrections accepted; deliberate Next after feedback; Done first; local timing core.

Verified: `npm run test:study:unit`20/20 passed; JavaScript syntax check passed;
`npm run build` passed (140files,25 indexed pages). New tests actually execute
client/server merge over1000/250 rewards, round reconstruction, full accepted
relation sets and fake-clock timing. No UI/UX quality gate has passed yet.

Next: integrate inspected art; refine mobile layout; update browser tests for
intentional Next; exercise actual pause/reload/correction; persist post-session
timing and enforce/verify reward budget. The timer core alone is NOT90/10 compliance.

Server merge source changed, but production Edge Function is NOT deployed.
Keep the256KB request limit; never silently compact the reward ledger. Add a
future tested monotonic compaction design before payload size becomes a problem.
Already-truncated historical rewards cannot be reconstructed from arbitrary guesses.

## Next-agent procedure

1. Fetch and check out this branch. Inspect dirty status; preserve unrelated work.
2. Read the latest commit and this handoff; do not restart the app or rename storage.
3. Run `npm run test:study` and `npm run build`. Separate failed assertions from
   unavailable browser infrastructure. The local Chromium download was unavailable
   in the previous session; do not repeatedly retry a broken download.
4. Continue open gates in `QUALITY_PLAN.md`. Use a local preview, not real family
   cloud data. Do not clear localStorage or change production while testing.
5. Record rendered/browser evidence. A passing unit suite is not visual approval.
6. Save another commit and update this file before ending. Do not claim 90/10 or
   child enjoyment without measured/observed evidence.

## Known baseline issues

- Client rewards truncated after80; server after160. This loses earned XP/coins.
- Reload/switch learner abandons the in-memory round.
- Correction accepts only first official answer; other listed synonyms are rejected.
- Armor chest details are covered by the body; tiny inconsistent game presentation.
- 900ms auto-advance can hide feedback before it is read; audio autoplay unreliable.
- Shop is too tall on phones, primary over Done, and jumps on purchase.
- No actual learning/play timing. Do not label the current app 90/10-compliant.
- Unversioned assets can stay stale despite cache headers.

No secrets belong in this document. Keep all existing learning and cloud identifiers.
