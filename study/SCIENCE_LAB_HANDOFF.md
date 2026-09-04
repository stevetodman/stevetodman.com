# Resume Science Lab here

Repository: `stevetodman/stevetodman.com`  
Primary route: `/study/matter-lab.html`  
Audience: Luke and Samantha  
Approved direction: evolve the existing Grade 5 Science Lab into a world-class phenomenon-centered adaptive science tutor while preserving the current reliable foundation.

## Read first

1. `study/SCIENCE_LAB_MASTER_PLAN.md`
2. `study/LOUISIANA_GRADE5_COVERAGE.md`
3. `study/grade5-learning-core.mjs`
4. `study/science-grade5-data.mjs`
5. `tests/grade5-learning-core.test.mjs`
6. `tests/science-grade5-coverage.test.mjs`
7. `tests/grade5-learning-browser.test.mjs`

Do **not** use `study/QUALITY_HANDOFF.md` as the Science Lab handoff. That file belongs to the Word Expedition project.

## Owner decisions

- Keep the current Science Lab; do not restart it from scratch.
- Maximum educational value is the goal.
- The product should teach Luke and Samantha how to think scientifically, not merely answer science questions.
- Phenomena, investigations, models, graphs, evidence, CER, fair testing, retention, and transfer are the long-term center of the product.
- Preserve short, low-friction practice and clean iPhone/Chromebook UX.
- Preserve separate Luke/Samantha learner histories permanently.
- No sibling leaderboard.
- Do not reward speed.
- Gamification is secondary and must never affect grading, mastery, curriculum priority, or difficulty.
- Build one deep Matter vertical slice before scaling the new architecture to all Grade 5 units.
- Keep tests proportionate; protect important educational/data invariants without creating a giant testing project.

## Current baseline

As of this handoff, the existing Science Lab already provides:

- `/study/matter-lab.html` Grade 5 Science Lab route;
- 5 units covering 16 Louisiana Grade 5 science/engineering expectations;
- 48 science items, with 3 alternate forms per expectation;
- current Matter focus;
- separate Luke/Samantha device-local profiles;
- eight-question sessions;
- full-year review;
- skill-level scoring;
- errors weighted more strongly than isolated correct answers;
- same-session alternate-form recovery after a miss;
- multi-day mastery requirement;
- resumable active sessions;
- tables, flow models, and multi-select items;
- responsive 390 px phone layout and accessibility support;
- structural, adaptive-core, curriculum-coverage, learner-separation, and reload browser tests.

This baseline is useful and should be preserved while the pedagogy is deepened.

## Key audit findings already accepted by owner

1. The current system is stronger as an adaptive review engine than as a true `Science Lab`.
2. The unit of learning should move from isolated questions to scientific phenomena/investigations.
3. Three alternate forms per expectation are insufficient for long-term transfer and resistance to memorization.
4. Adaptive ordering exists, but instructional allocation needs to focus much more strongly on each learner's weakest/due concepts.
5. Guided/recovery success should not be able to establish mastery by itself.
6. Feedback should diagnose misconceptions, not merely reveal the correct answer.
7. Graph interpretation/construction, model construction, technology-enhanced responses, and constructed scientific reasoning are major gaps.
8. SEP and CCC reasoning dimensions should become first-class metadata/evidence dimensions.
9. Cross-device synchronization eventually matters because fragmented learner history weakens adaptivity.
10. Twin-specific paths should diverge based on evidence, and recent sibling item overlap should be avoided when educationally equivalent alternatives exist.

## Current milestone

**M0 Governance/checkpointing: complete when this handoff, master plan, and coverage-contract links are committed.**

**Next milestone: M1 - Evidence semantics and true adaptivity.**

Do not jump ahead to flashy graphing, simulations, or gamification before M1 is correct.

## Exact next implementation objective: M1

Implement the minimum backward-compatible changes needed to make the learner model educationally trustworthy.

### Required M1 changes

1. Add explicit attempt provenance so the engine can distinguish at least:
   - independent;
   - hinted;
   - guided;
   - recovery;
   - delayed retrieval;
   - transfer.

2. Replace/augment the current binary mastery semantics with interpretable learning states:
   - New;
   - Learning;
   - Needs repair;
   - Repaired;
   - Retained;
   - Transfer demonstrated;
   - Secure.

3. Enforce that:
   - recovery/guided answers alone cannot make a skill Secure;
   - Secure requires independent evidence over multiple dates;
   - Secure requires delayed retrieval;
   - Secure requires a different-context transfer success;
   - a recent unresolved misconception can block or downgrade Secure.

4. Change session allocation so weak/due skills receive substantially more of the available practice rather than merely sorting roughly even skill lanes.

Suggested starting policy for ordinary practice:
   - ~50% weakest/due;
   - ~25% developing/current-unit;
   - ~15% previously secure due retrieval;
   - ~10% transfer/challenge.

This is a scheduling policy, not a child-facing promise. Small content pools may require graceful fallback.

5. Add sibling-aware recent-item avoidance when equivalent alternatives exist.

6. Preserve exact reload/resume and learner separation.

7. Preserve/migrate current local learner data. Do not clear it or silently mix profiles.

8. Replace child-facing pseudo-precision such as `73/100 evidence strength` with meaningful states where practical. Internal numeric scheduling values may remain.

## M1 acceptance gate

M1 is not complete until automated checks demonstrate all of the following:

- a learner repeatedly weak in one Matter concept gets materially more practice in that concept than strong concepts;
- guided/recovery success by itself never yields Secure;
- independent multi-date evidence plus delayed retrieval plus transfer can yield Secure;
- recent unresolved error/misconception prevents false Secure status;
- Luke and Samantha can produce different queues from different histories;
- sibling recent-item avoidance works when an equivalent item is available;
- existing learner records migrate without cross-contamination;
- active-session reload remains exact;
- current-unit mode remains inside the selected/current unit except for explicitly designed review/transfer behavior;
- no existing required Louisiana science expectation disappears.

## Files likely involved in M1

Primary:

- `study/grade5-learning-core.mjs`
- `study/science-grade5-data.mjs` only if transfer/context metadata is minimally needed for M1
- `tests/grade5-learning-core.test.mjs`
- `tests/grade5-learning-browser.test.mjs`

Possibly:

- `study/grade5-learning.css` for new learner-facing mastery-state labels
- `tests/science-grade5-coverage.test.mjs` for new schema/content invariants

Avoid broad unrelated Study changes.

## After M1

Proceed in this order unless the owner changes direction:

- M2 misconception-aware remediation;
- M3 graph/model engine;
- M4 phenomenon/task-set engine;
- M5 CER/constructed reasoning;
- M6 world-class Matter vertical slice;
- only then scale across the full Grade 5 science course.

See `SCIENCE_LAB_MASTER_PLAN.md` for full definitions and acceptance criteria.

## Resume procedure for every agent

1. Inspect the actual current `main`/working branch and dirty state. Do not trust an old chat SHA blindly.
2. Read this handoff and the relevant master-plan milestone.
3. Inspect the implementation before editing; preserve unrelated work.
4. Work only the current milestone or a reproduced regression.
5. Keep learner-data changes backward-compatible and versioned.
6. Add only tests needed to protect the changed educational/data invariant.
7. Run the proportionate affected tests plus build checks required by the repo.
8. Before stopping, update this file with:
   - exact completed work;
   - tests/results;
   - commit/checkpoint;
   - open gates;
   - exact next action.
9. Never claim physical-device or child-learning acceptance without actual evidence.
10. Never restart the project merely because a new agent has taken over.

## Documentation checkpoint

Master plan added on main in commit:

`b27c02d77ceaf49c3e51cb2566bdaa153b8efff8`

This handoff was created immediately afterward. A later agent should record the newest exact main commit after all M0 documentation-linking changes are complete.
