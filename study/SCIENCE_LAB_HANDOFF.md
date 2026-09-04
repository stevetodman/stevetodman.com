# Resume Science Lab here

Repository: `stevetodman/stevetodman.com`  
Primary route: `/study/matter-lab.html`  
Primary branch while this checkpoint is open: `science-lab-m1-20260903`  
PR: `#157` - Science Lab M1: trustworthy evidence model with minimal CI  
Audience: Luke and Samantha  

## Read first

1. `study/SCIENCE_LAB_HANDOFF.md` - this file; current resume point.
2. `study/SCIENCE_LAB_MASTER_PLAN.md` - approved architecture and milestone roadmap.
3. `study/LOUISIANA_GRADE5_COVERAGE.md` - Louisiana curriculum coverage contract.
4. `study/science-lab/core.mjs` - **primary Science Lab engine**.
5. `study/science-lab/config.mjs` - Science Lab configuration and transfer metadata.
6. `study/science-lab/data.mjs` - current Grade 5 science content bank.
7. `study/science-lab/style.css` - current presentation layer.
8. `science-lab-tests/core.test.mjs` - only essential learner-model/content invariants.
9. `science-lab-tests/smoke.test.mjs` - one 390px Chromium route smoke.
10. `.github/workflows/science-lab-ci.yml` - intentionally minimal CI.

Do **not** use `study/QUALITY_HANDOFF.md` as the Science Lab handoff. It belongs to Word Expedition.

The old shared files `study/grade5-learning-core.mjs`, `study/science-grade5-data.mjs`, and the old Grade 5 tests are now **secondary/reference implementations for other Study products**. Science Lab has intentionally been split away from them so it can change boldly without destabilizing World Lab.

## Owner decisions - current and authoritative

- Maximum educational value is the goal.
- Teach scientific thinking, not merely question answering.
- Phenomena, investigation, models, graphs, evidence, CER, fair testing, retention, transfer, and misconception repair remain the roadmap.
- Science Lab is not currently in active use by the twins, so **pre-use prototype compatibility may be broken when it enables a cleaner architecture**.
- M1 therefore uses a fresh `g5-science-lab-v2` local learner store instead of carrying prototype storage baggage forward.
- Once Luke or Samantha begins using this v2 product for real learning, learner evidence becomes protected data and future schema changes must preserve/migrate it deliberately.
- Preserve separate Luke/Samantha histories permanently.
- No sibling leaderboard. No speed rewards.
- Gamification is secondary and may not change grading, mastery, curriculum priority, or difficulty.
- Build a deep Matter vertical slice before scaling the new architecture across the full Grade 5 course.
- **CI and automated tests must remain the absolute minimum needed to catch meaningful regressions.** Do not build another testing project.
- Bold product/architecture changes are preferred over compatibility scaffolding for an unused prototype.

## Milestone status

### M0 - Governance/checkpointing: COMPLETE

Master plan and dedicated handoff exist and are linked from the Louisiana Grade 5 coverage contract.

### M1 - Evidence semantics and true adaptivity: IMPLEMENTED AND ESSENTIAL GATE PASSED

Current implementation checkpoint before this handoff update:

`d70aa3ec483dff7fc6e4ad41e7b56b31e750e0f0`

PR: `#157`

Implemented:

- dedicated Science Lab engine under `study/science-lab/`;
- fresh version-2 Science Lab storage key;
- distinct evidence provenance: independent, hinted, guided, recovery;
- delayed-retrieval and transfer flags;
- child-facing evidence states:
  - New
  - Learning
  - Needs repair
  - Repaired
  - Retained
  - Transfer demonstrated
  - Secure
- `Secure` requires independent evidence across multiple dates plus delayed retrieval plus transfer;
- a new independent miss revokes Secure until genuinely recovered;
- recovery/guided success cannot establish Secure;
- adaptive queue allocation now gives materially more slots to a weak/due skill rather than merely changing ordering;
- sibling recent-item avoidance when equivalent forms exist;
- child-facing pseudo-precision evidence scores removed from the Science Lab summary/dashboard in favor of interpretable states;
- one of the three existing forms per skill is temporarily tagged as near-transfer so M1 can exercise transfer semantics before the content bank is expanded in later milestones;
- current Matter unit remains bounded and all 16 Louisiana science/engineering expectations remain represented.

## Minimal CI - hard rule

Steady-state Science Lab CI is intentionally only:

1. `science-lab-tests/core.test.mjs`
   - 4 focused tests covering:
     - trustworthy mastery/evidence semantics;
     - materially weighted weak-skill allocation;
     - sibling recent-item avoidance + current-unit bounding;
     - Luke/Samantha separation + 48-item/16-expectation curriculum presence.
2. `science-lab-tests/smoke.test.mjs`
   - one Chromium route at 390x844 checking:
     - learner picker;
     - start 8-prompt round;
     - independent miss;
     - repair scheduling;
     - reload without duplicate evidence;
     - Luke/Samantha active-session separation;
     - no initial horizontal overflow.

No Science Lab WebKit matrix.  
No screenshot artifact suite.  
No full Study suite.  
No broad accessibility suite on every Science Lab change.  
No duplicated coverage tests unless a new invariant genuinely requires one.

Workflow: `.github/workflows/science-lab-ci.yml`

Essential CI run for checkpoint `d70aa3e...`:

- GitHub Actions run `33824981005`
- job `essential`: **PASS**
- four learning invariants: **PASS**
- one phone smoke path: **PASS**

The old `Study contract` workflow also triggered on PR #157 **one time only because this PR edits `.github/workflows/study-contract.yml` itself**. That workflow is being changed to ignore `study/matter-lab.html` and `study/science-lab/**`. Future normal Science Lab changes must not invoke the large Study unit/WebKit workflow.

The general `.github/workflows/tests.yml` does not watch the new `science-lab-tests/` directory, so Science Lab changes also do not fan out into the site-wide test matrix.

Do not reverse this CI isolation without a concrete regression that the essential gate cannot catch.

## M1 acceptance evidence

Verified by the focused core tests:

- guided/recovery-only success cannot yield Secure;
- independent evidence on multiple dates plus delayed retrieval plus transfer can yield Secure;
- a recent independent miss produces Needs repair and blocks Secure;
- a recovery answer after that miss produces Repaired, not Secure;
- a repeatedly weak Matter skill receives more queue positions than secure peer skills;
- a sibling item seen recently is skipped when equivalent alternatives are available;
- current-unit Matter queues remain inside Matter;
- Luke and Samantha stores remain isolated;
- the science bank still contains 48 items, 16 expectations, and 12 Matter items.

Verified by the one browser smoke:

- 390px route loads;
- 8-prompt round starts;
- wrong answer creates repair evidence;
- reload resumes repair feedback without duplicating evidence;
- Luke active session remains isolated when switching to Samantha.

No physical-child usability or learning-effectiveness claim is implied by these automated checks.

## Exact next milestone: M2 - misconception-aware remediation

Do not expand CI first. Expand learning value first.

M2 goal: when a learner is wrong, Science Lab should diagnose the likely misconception and give targeted help rather than functioning as an answer key.

### M2 implementation target

Start with the Matter unit only.

1. Add misconception metadata to Matter distractors.
2. Add a short hint/remediation model that is specific to the selected misconception.
3. Distinguish a first independent attempt from any hinted retry.
4. Do not immediately reveal the correct answer when a useful reasoning hint can support another attempt.
5. After instruction, still schedule a later independent recheck.
6. Store the misconception tag on evidence so later adaptive scheduling can respond to recurring misconceptions.
7. Keep the UI calm and short; do not turn each miss into a long lesson.

Candidate Matter misconception families include:

- `dissolved-means-destroyed`
- `gas-has-no-mass`
- `open-system-loss-means-destroyed`
- `single-property-is-enough`
- `stirring-alone-means-new-substance`
- `phase-change-means-new-substance`

### M2 acceptance gate

Keep this small. Add only the minimum new invariant coverage needed to prove:

- two different wrong options on at least one Matter concept can trigger different remediation;
- hinted success is not recorded as independent mastery evidence;
- recurring misconception metadata survives reload;
- later independent recheck is still required.

Prefer adding assertions to the existing 4 core tests / one smoke rather than creating more files or workflows.

## Resume procedure for every agent

1. Inspect current `main`, PR #157, and branch state; do not trust an old chat SHA blindly.
2. If PR #157 is already merged, continue from the merge commit on `main`; do not recreate M1.
3. Read the current milestone in `SCIENCE_LAB_MASTER_PLAN.md`.
4. Treat `study/science-lab/**` as the primary Science Lab implementation.
5. Preserve unrelated Study projects.
6. Make bold architectural changes when they improve the unused/pre-use Science Lab, but once v2 real learner data exists, preserve it.
7. Keep tests minimal and extend existing Science Lab tests before creating new ones.
8. Before stopping, update this file with exact completed work, exact commit/PR, essential test results, open gate, and exact next action.
9. Never claim physical-device or child-learning acceptance without actual evidence.
10. Do not restart the product merely because a new agent takes over.
