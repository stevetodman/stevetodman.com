# Resume Science Lab here

Repository: `stevetodman/stevetodman.com`  
Primary route: `/study/matter-lab.html`  
Audience: Luke and Samantha  
Approved direction: evolve the existing Grade 5 Science Lab into a world-class phenomenon-centered adaptive science tutor while preserving the current reliable foundation.

## Read first

1. `study/SCIENCE_LAB_MASTER_PLAN.md` - approved architecture, invariants, milestones, and acceptance gates.
2. `study/LOUISIANA_GRADE5_COVERAGE.md` - curriculum coverage contract.
3. `study/grade5-learning-core.mjs` - adaptive/session engine.
4. `study/science-grade5-data.mjs` - science curriculum/items.
5. `tests/grade5-learning-core.test.mjs`
6. `tests/science-grade5-coverage.test.mjs`
7. `tests/grade5-learning-browser.test.mjs`

Do **not** use `study/QUALITY_HANDOFF.md` as the Science Lab handoff. That file belongs to the Word Expedition project.

## Owner decisions

- Keep the current Science Lab; do not restart it from scratch.
- Maximum educational value is the goal.
- Teach Luke and Samantha to think scientifically, not merely answer science questions.
- Phenomena, investigations, models, graphs, evidence, CER, fair testing, retention, and transfer are the long-term center of the product.
- Preserve short, low-friction practice and clean iPhone/Chromebook UX.
- Preserve separate Luke/Samantha learner histories permanently.
- No sibling leaderboard and no speed rewards.
- Gamification is secondary and must never affect grading, mastery, curriculum priority, or difficulty.
- Build one deep Matter vertical slice before scaling the new architecture to every Grade 5 unit.
- Keep testing proportionate; protect educational/data invariants without creating a testing project of its own.

## Current baseline to preserve

The existing Science Lab already provides:

- `/study/matter-lab.html` Grade 5 Science Lab route;
- 5 units covering 16 Louisiana Grade 5 science/engineering expectations;
- 48 science items, with 3 alternate forms per expectation;
- current Matter focus plus full-year review;
- separate Luke/Samantha device-local profiles;
- short eight-question standard sessions;
- skill-level scoring;
- errors weighted more strongly than isolated correct answers;
- same-session alternate-form recovery after a miss;
- multi-day mastery requirement;
- resumable active sessions;
- tables, flow models, and multi-select items;
- responsive 390 px phone layout and accessibility support;
- structural, adaptive-core, curriculum-coverage, learner-separation, and reload browser tests.

This foundation is an asset. Deepen it without regressing its reliability or simplicity.

## Accepted audit findings

1. The current system is stronger as an adaptive review engine than as a true `Science Lab`.
2. The unit of learning should move from isolated questions to scientific phenomena/investigations.
3. Three alternate forms per expectation are insufficient for long-term transfer and resistance to memorization.
4. Adaptive ordering exists, but instructional allocation needs to focus much more strongly on each learner's weakest/due concepts.
5. Guided/recovery success should not be able to establish mastery by itself.
6. Feedback should diagnose misconceptions, not merely reveal the correct answer.
7. Graph interpretation/construction, model construction, technology-enhanced responses, and constructed scientific reasoning are major gaps.
8. Science/engineering practices and crosscutting concepts should become first-class metadata/evidence dimensions.
9. Cross-device synchronization eventually matters because fragmented learner history weakens adaptivity.
10. Twin-specific paths should diverge based on evidence; recent sibling item overlap should be avoided when educationally equivalent alternatives exist.

## Milestone status

- **M0 Governance/checkpointing: COMPLETE.**
  - Master plan created.
  - Dedicated Science Lab handoff created.
  - Louisiana Grade 5 coverage contract linked to both documents and aligned with the approved phenomenon-based roadmap.
- **M1 Evidence semantics and true adaptivity: NEXT.**
- M2+ not started intentionally.

M0 documentation commits:

- Master plan: `b27c02d77ceaf49c3e51cb2566bdaa153b8efff8`
- Initial handoff: `00151dcc1f709aca8f27eaddebcaf8352679a471`
- Coverage-contract linking/alignment: `73976cbbf4345a49578e03557f2f67f316a58ba6`

The current branch head may be later than those commits. Always inspect actual `main` before editing.

## Exact next implementation objective: M1

Implement the minimum backward-compatible changes needed to make the learner model educationally trustworthy **before** adding graphing, simulations, or gamification.

### Required M1 changes

1. Add explicit attempt provenance so the engine can distinguish at least:
   - independent;
   - hinted;
   - guided;
   - recovery;
   - delayed retrieval;
   - transfer.

2. Replace/augment binary mastery with interpretable states:
   - New;
   - Learning;
   - Needs repair;
   - Repaired;
   - Retained;
   - Transfer demonstrated;
   - Secure.

3. Enforce:
   - recovery/guided answers alone cannot produce Secure;
   - Secure requires independent evidence on multiple dates;
   - Secure requires delayed retrieval;
   - Secure requires different-context transfer;
   - a recent unresolved misconception/error can block or downgrade Secure.

4. Change session allocation so weak/due skills receive substantially more practice rather than merely sorting roughly even skill lanes.

Suggested starting policy for ordinary practice:

- ~50% weakest/due;
- ~25% developing/current-unit;
- ~15% previously secure concepts due for retrieval;
- ~10% transfer/challenge.

This is an internal scheduling policy, not a child-facing promise. Small content pools require graceful fallback.

5. Add sibling-aware recent-item avoidance when an educationally equivalent alternative exists.
6. Preserve exact reload/resume and learner separation.
7. Preserve/migrate existing local learner data; never clear it or mix profiles silently.
8. Replace child-facing pseudo-precision such as `73/100 evidence strength` with meaningful evidence states where practical. Internal numeric scheduler values may remain.

## M1 acceptance gate

M1 is not complete until checks demonstrate:

- a learner repeatedly weak in one Matter concept receives materially more practice in that concept than in strong concepts;
- guided/recovery success alone never yields Secure;
- independent multi-date evidence plus delayed retrieval plus transfer can yield Secure;
- a recent unresolved error/misconception prevents false Secure status;
- Luke and Samantha can receive different queues from different histories;
- sibling recent-item avoidance works when an equivalent item exists;
- existing learner records migrate without cross-contamination;
- active-session reload remains exact;
- current-unit mode preserves curriculum isolation except for explicitly designed retrieval/transfer behavior;
- no required Louisiana science expectation disappears.

## Files likely involved in M1

Primary:

- `study/grade5-learning-core.mjs`
- `tests/grade5-learning-core.test.mjs`
- `tests/grade5-learning-browser.test.mjs`

Only if minimally needed:

- `study/science-grade5-data.mjs` for transfer/context metadata;
- `study/grade5-learning.css` for new mastery-state presentation;
- `tests/science-grade5-coverage.test.mjs` for new schema/content invariants.

Avoid broad unrelated Study changes.

## Ordered roadmap after M1

Proceed in this order unless the owner changes direction:

1. M2 misconception-aware remediation.
2. M3 graph/model engine.
3. M4 phenomenon/task-set engine.
4. M5 CER/constructed reasoning.
5. M6 world-class Matter vertical slice.
6. Only after M6 educational validation, scale across the rest of Grade 5.

See `SCIENCE_LAB_MASTER_PLAN.md` for the full roadmap through cross-device sync, cooperative Twin Lab missions, parent insight, real-world mini-labs, and LEAP-style challenge mode.

## Resume procedure for every agent

1. Inspect actual current `main`/working branch and dirty state. Do not trust an old chat SHA blindly.
2. Read this handoff and the current milestone in `SCIENCE_LAB_MASTER_PLAN.md`.
3. Inspect implementation before editing; preserve unrelated work.
4. Work only the current milestone or a reproduced regression unless the owner broadens scope.
5. Keep learner-data changes backward-compatible and versioned.
6. Add only tests needed to protect the changed educational/data invariant.
7. Run the proportionate affected tests plus repository build checks required by the change.
8. Before stopping, update this file with exact completed work, test results, checkpoint commit, open gates, and exact next action.
9. Never claim physical-device or child-learning acceptance without actual evidence.
10. Never restart the project merely because a new agent has taken over.
