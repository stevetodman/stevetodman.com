# Resume Science Lab here

Repository: `stevetodman/stevetodman.com`  
Primary route: `/study/matter-lab.html`  
Deep-investigation route: `/study/science-lab/investigate.html`  
Audience: Luke and Samantha

## Resume here

M0-M4 are complete through the essential automated gate. The next milestone is **M5 - CER / constructed scientific reasoning**.

Read first:

1. `study/SCIENCE_LAB_HANDOFF.md`
2. `study/SCIENCE_LAB_MASTER_PLAN.md`
3. `study/LOUISIANA_GRADE5_COVERAGE.md`
4. `study/science-lab/core.mjs`
5. `study/science-lab/phenomenon-engine.mjs`
6. `study/science-lab/phenomena.mjs`
7. `study/science-lab/config.mjs`
8. `study/science-lab/remediation.mjs`
9. `study/science-lab/representations.mjs`
10. `study/science-lab/visuals.mjs`
11. `science-lab-tests/core.test.mjs`
12. `science-lab-tests/smoke.test.mjs`
13. `.github/workflows/science-lab-ci.yml`

The old shared Grade 5 engine/data/tests remain secondary/reference implementations for other Study products. Do not use `study/QUALITY_HANDOFF.md`; it belongs to Word Expedition.

## Owner decisions - hard constraints

- Science Lab is still pre-use, so bold architecture changes are allowed when they improve learning quality.
- Current learner evidence store: `g5-science-lab-v2`.
- Once Luke/Samantha begin real v2 use, learner evidence becomes protected and future schema changes must migrate it deliberately.
- Phenomena, evidence, models, graphs, fair tests, CER, retention, transfer, and misconception repair are the instructional center.
- Preserve separate Luke/Samantha histories. No sibling leaderboard. No speed rewards.
- Gamification may not alter grading, mastery, difficulty, item count, or curriculum priority.
- Finish the Matter vertical slice deeply before scaling the new architecture across the full course.
- **CI stays exactly 4 core tests + 1 Chromium 390px smoke unless a concrete uncaught regression proves more is necessary.**
- No WebKit matrix, screenshot artifact suite, broad Study suite, or duplicate coverage suite for ordinary Science Lab changes.

## Completed milestones

### M1 - Evidence semantics + true adaptivity

PR #157 merged at `9efe06744eeca0c2e9365b8fa3b17170f2a08692`.  
Essential run `33824981005`: PASS.

### M2 - Misconception-aware remediation

PR #158 merged at `9a8e6f1ee4bec337f3cefb7ec70793b796180007`.  
Essential run `33825308872`: PASS.

### M3 - Graph/model engine

PR #159 merged at `79778caaed9a338bef79e629c39b6f38b9558e12`.  
Essential run `33825682173`: PASS.

Implemented responsive SVG line/bar graphs, particle models, system models, and a tap/keyboard graph-construction response with exact reload persistence.

### M4 - Phenomenon/task-set engine: COMPLETE THROUGH ESSENTIAL GATE

Branch: `science-lab-m4-20260903`  
PR: #160  
Pre-handoff implementation head: `6593c5bae0f02a08b02610a58055e90e80480f30`

Implemented two deep Matter investigations:

1. **Where did the sugar go?**
   - notice dissolving without explanation;
   - commit a prediction before evidence;
   - inspect a particle model;
   - reason from sealed-system mass evidence;
   - revise/confirm the original model.

2. **Why did the measured mass drop?**
   - compare open vs sealed reactions;
   - commit a prediction;
   - analyze a zero-baseline mass graph;
   - connect gas formation to new-substance evidence;
   - revise the final explanation.

Architecture/results:

- phenomenon context and evidence are shared across multiple steps rather than repeated as isolated questions;
- investigation resume state uses a separate small local key so it cannot be mistaken for an 8-prompt practice session;
- both runtimes still write to the same Luke/Samantha learner evidence histories;
- prediction is saved before later evidence is revealed;
- revision can explicitly compare with the original prediction;
- only **two designated evidence checkpoints per phenomenon** write independent mastery evidence; notice/prediction/revision do not inflate mastery;
- evidence writes are idempotent per phenomenon session/step;
- completion schedules targeted skills for delayed retrieval;
- the main Matter dashboard recommends the next unfinished deep investigation when no short-practice round is active;
- 8-prompt adaptive practice remains a secondary action;
- after both Matter investigations are completed, adaptive practice becomes primary again naturally.

M4 essential run `33826056997`: PASS.

The same single 390px smoke now also proves:

- a wrong prediction can be committed before evidence;
- reload returns to the exact later evidence step with prediction preserved;
- particle-model and graph evidence render without phone overflow;
- revision can differ from the original prediction;
- one completed phenomenon creates exactly two mastery-relevant phenomenon attempts;
- delayed skill scheduling occurs;
- phenomenon active state clears on completion.

No human child-learning or physical-device claim is implied by automated checks.

## Minimal CI - preserve this design

Steady-state Science Lab CI remains exactly:

1. `science-lab-tests/core.test.mjs` - 4 tests total.
2. `science-lab-tests/smoke.test.mjs` - 1 Chromium path at 390x844.

M4 extended those existing checks only. Do not add a phenomenon-specific suite.

## Exact next milestone: M5 - CER / constructed reasoning

Goal: move beyond selecting a correct scientific statement and make the learner **construct an evidence-based explanation**.

### M5 target

Add a deterministic, transparent Claim-Evidence-Reasoning builder to the phenomenon runtime.

Recommended first implementation: end **Why did the measured mass drop?** with a scaffolded CER that asks the learner to construct:

1. **Claim** - what happened to the matter;
2. **Evidence** - select the strongest observations/data from the investigation;
3. **Reasoning** - choose/build the scientific principle that connects the evidence to the claim.

Use a Grade-5-appropriate scaffold before free-form writing. Avoid typing endurance.

### M5 evidence rules

- first CER submission is independent reasoning evidence;
- deterministic rubric scores Claim, Evidence, and Reasoning separately;
- component-level feedback identifies which part needs repair without immediately replacing the whole response;
- one guided revision may follow;
- guided revision must remain distinguishable from the first independent response;
- CER must **not** create extra content-mastery attempts beyond the M4 two-checkpoint ceiling unless deliberately approved;
- store CER rubric results in the phenomenon completion/session record for later parent/reasoning analytics.

### M5 acceptance

M5 is complete when:

- at least one Matter phenomenon ends in a real CER construction task;
- learner must select/build claim + evidence + reasoning rather than choose one prewritten full explanation;
- rubric deterministically scores all three dimensions;
- partial feedback can trigger a guided revision;
- independent and guided CER results remain distinguishable;
- CER state survives reload;
- mobile interaction remains low-friction at 390px;
- no additional CI path is added.

### M5 testing rule

Extend the existing fourth core invariant with the CER rubric/schema check. Extend the existing one phone smoke with one CER repair/revision interaction. Do not create a CER test suite.

## After M5

M6 - world-class Matter vertical slice: expand context diversity, deepen transfer, finish remaining Matter interactions/mini-lab and parent insight needed for the unit, then evaluate the complete Matter experience before scaling across the full Grade 5 course.

## Resume procedure

1. Inspect actual `main` and any open Science Lab PR.
2. If PR #160 is merged, continue from its merge commit; do not recreate M4.
3. Treat `study/science-lab/**` as the primary implementation.
4. Preserve unrelated Study projects.
5. Bold architecture remains allowed while pre-use; once real v2 data exists, preserve it.
6. Keep CI at 4 core tests + 1 smoke and extend those checks rather than multiplying them.
7. Before stopping, update this handoff with exact work, commit/PR, essential-gate result, open gate, and exact next action.
8. Never claim physical-device or child-learning acceptance without actual evidence.
9. Never restart the project merely because a new agent takes over.
