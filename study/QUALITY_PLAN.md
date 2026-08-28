# Word Expedition — quality plan

Owner brief (28 August 2026): reduce friction, make a genuinely delightful game,
and keep at least 90% of active time in learning. “App Store quality” describes
the graphics and experience, not native packaging or submission paperwork.

Latest owner clarification: NO REAL-MONEY purchasing. Earned study coins can
buy cosmetic gear. Preview before spending; owned gear can be equipped free.
No paid currency, subscriptions, payment checkout, ads or loot boxes.

## Rules that do not move

- One tap to start or resume; exactly ten questions. The question is the attack.
- Gear changes appearance and hit effects, never question count or mastery.
- Independent wallets and permanent mastery. No sibling rankings or penalties.
- Keep the existing school list, local dates, migration keys and private cloud link.
- Wrong answers teach, allow correction, and never take away earned progress.
- A saved checkpoint is NOT a passed product gate. Never deploy to hide unfinished work.

## Gate sequence

| Gate | Deliverable | Evidence required before passing |
| --- | --- | --- |
| G0: baseline | Reproducible defects and this plan | Inspect actual implementation; distinguish observed bugs from suggestions |
| G1: trust | Permanent rewards, recoverable rounds, fair correction | Reload/merge >160 rewards; no duplicate awards; pause/reload at answer, correction, final question; twins isolated |
| G2: visual system | One coherent storybook world, readable heroes, visible armor and weapons | Inspect every equipped combination; phone and desktop screenshots; no clipping, mismatched scale or placeholder art |
| G3: practice flow | Compact combat; readable prompt/input; explicit replay audio; calm feedback | Full ten-question correct/wrong/assisted paths, keyboard visibility, focus, back/resume, audio failure fallback |
| G4: reward loop | Satisfying hit/recovery/victory; clear travel vs knowledge; small optional shop | First purchase visibly changes hero; starter gear restorable; no accidental spend; no grinding or duplicate payout |
| G5: 90/10 | Active-time accounting and bounded reward phase | Fake-clock tests plus timed real play; count menus, shopping and celebration as play; do not count idle as learning |
| G6: release | Browser tests, accessible layouts, performance, delivery | Study suite and build green; reduced motion; 320–1024px; real iOS keyboard/audio checks; fresh asset delivery; no known P0/P1 bugs |

No gate is passed merely because source matches a regular expression. Automated
behavior checks, rendered screenshots and observed play are separate evidence.
Actual child enjoyment and native iOS behavior require a family/device playtest;
an agent must not fabricate that evidence.

## Recorded status, 28 August 2026

- G0 baseline defects were reproduced and the compatibility contract retained.
- G1 branch checks pass for reward history, merges, recoverable rounds, alternative
  grading, blocked storage and damaged device links. Production merge code is not deployed.
- G2 original art, all32 equipped combinations, four creatures and the320/390px
  reward shelf have been rendered and inspected. CI stores repeatable screenshots.
- G3/G4 browser flows pass through correct/wrong/assisted answers, final-question
  reload, the boss, preview/cancel/spend/re-equip and reward expiry without spending.
- G5 has local active-time records and tested budgeting. Actual child90/10 and
  enjoyment are still OPEN; simulated reading is explicitly labeled in artifacts.
- G6 Chromium has40/40 Study tests,25/25 platform checks and a successful build.
  The final cross-engine WebKit run and physical iOS checks must be recorded separately.

These are evidence statements, not a blanket App Store-quality or release sign-off.

## Final family/device acceptance protocol

Use a branch preview with isolated practice data, not the production family save.
Record device/browser/date, learner, observation and any screenshot for each result.

1. On iPhone Safari, iPad Safari and the installed shortcut, open the app cold.
   Check readable art, responsive taps, visible prompt/input above the keyboard,
   explicit Hear word/Hear a sentence, muted-device recovery and reduced motion.
2. Each twin independently starts, completes10 questions, corrects one error,
   pauses/reloads once, and finds the same question. No explanation from an adult
   should be needed to find Start, Next, hear a word, or return from the shop.
3. Try one affordable item, cancel, then buy it with study coins. Verify the hero
   changes, the other wallet does not, starter gear remains available, and expiry
   never spends coins or loses progress. Note whether the short break feels rushed.
4. Time at least three ordinary rounds per learner. Compare observed retrieval,
   listening, correction and feedback reading with menu/reward time and the local
   estimate. Require learning/(learning+play)>=0.90 on representative observed
   use; investigate mismatches instead of reclassifying idle or adding filler.
5. Ask whether they want another adventure and what confused them. Any lost work,
   unfair grading, blocked keyboard/audio flow, clipped control, accidental spend,
   or frustrating expiry fails the relevant gate and returns to implementation.

Only after these checks and owner approval: merge/deploy web and server changes
as a coordinated release, then run the production canary and inspect actual fresh
asset versions. Keep the compatibility keys and a rollback to the prior commit.

## 90/10 measurement contract

Learning = retrieval, listening to the question, reading meaningful feedback,
correction and active word review. Play = navigation, shop, map and rewards.
Background time and inactivity are excluded from both, reported separately.
All foreground interaction must have a classification, including pauses. Never
inflate learning time by inserting a wait or counting an unattended screen.

For learning time L, play allowance is L/9, not L/10. Four minutes of learning
supports 26.7 seconds of play. The compact battle animation runs alongside
feedback; any blocking animation time is play. Count overlapping time only once.

Show no countdown on questions. Save coins if a shop visit ends. Do not erase a
purchase or force extra questions because the budget ran out. Initially record
real totals; then bound the optional shop/celebration phase and verify. A timer
alone cannot prove attention, so validate the classifications by observation.

## Implementation order and scope

1. Preserve progress: remove silent ledger truncation, union duplicates by maximum,
   and add pure behavioral tests. Document finite payload limits without discarding history.
2. Persist device-local round snapshots at meaningful state transitions; resume
   the same question/correction safely. No new login or start interstitial.
3. Accept every teacher-listed correction; show concise feedback with a voluntary
   Next action. Keep spelling exact; don't invent semantic grading.
4. Introduce original atlas/backgrounds, a single type/color system, quieter
   learning layout, visible gear, distinct but brief hit styles, and reduced motion.
5. Put Done first; offer a short, understandable gear choice. Make world progress
   visible without a second redundant row of numbered mastery markers.
6. Instrument active time locally; test with a fake clock, then time full flows.
7. Test and revise all states. Publish only after release approval and gates pass.

Not in scope: accounts, hub rewrite, extra modes, five-question sessions, classes
with stats, PvP, loot boxes, energy, weekly new maps, native App Store submission.

## Regression matrix

- Fresh Luke/Samantha; existing v3 learning + v1 game; legacy learning migration.
- Correct, wrong MC, wrong typed, alternative accepted correction, assisted spelling.
- Pause before answer / during correction / after hit / on final question; reload.
- Repeated completion; 81/161/1000 reward sessions; duplicate and disjoint device merges.
- Offline storage, malformed draft, rejected storage write, hidden tab and idle time.
- Phone 320/375/390px, tablet768px, desktop1024px; keyboard; reduced motion.
- Shop affordable/unaffordable/owned/equipped, weapon and armor, Done without buying.

## Checkpoint protocol

Save on `study/quality-90-10-20260828`, never silently merge to main. Maintain
`study/QUALITY_HANDOFF.md` with exact tests, remaining failures, next steps and
production status. Keep original art prompts/provenance. On resumption read the
handoff, inspect git status and continue the current gate rather than rebuild.
