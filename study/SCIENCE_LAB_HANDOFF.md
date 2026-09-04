# Resume Science Lab here

Repository: `stevetodman/stevetodman.com`  
Primary route: `/study/matter-lab.html`  
Deep-investigation route: `/study/science-lab/investigate.html`  
Audience: Luke and Samantha

## Resume here

M0-M5 are complete through the essential automated gate. The next milestone is **M6 - world-class Matter vertical slice**.

Read first:

1. `study/SCIENCE_LAB_HANDOFF.md`
2. `study/SCIENCE_LAB_MASTER_PLAN.md`
3. `study/LOUISIANA_GRADE5_COVERAGE.md`
4. `study/science-lab/core.mjs`
5. `study/science-lab/config.mjs`
6. `study/science-lab/data.mjs`
7. `study/science-lab/remediation.mjs`
8. `study/science-lab/representations.mjs`
9. `study/science-lab/visuals.mjs`
10. `study/science-lab/phenomena.mjs`
11. `study/science-lab/phenomenon-engine.mjs`
12. `study/science-lab/cer.mjs`
13. `science-lab-tests/core.test.mjs`
14. `science-lab-tests/smoke.test.mjs`
15. `.github/workflows/science-lab-ci.yml`

The old shared Grade 5 engine/data/tests are secondary/reference implementations for other Study products. Do not use `study/QUALITY_HANDOFF.md`; it belongs to Word Expedition.

## Owner decisions - hard constraints

- Science Lab remains pre-use; bold architecture changes are allowed when they materially improve learning.
- Current learner evidence store: `g5-science-lab-v2`.
- Once Luke/Samantha begin real v2 use, learner evidence becomes protected and future schema changes must migrate it deliberately.
- Phenomena, evidence, models, graphs, fair testing, CER, retention, transfer, and misconception repair are the instructional center.
- Preserve separate Luke/Samantha histories. No sibling leaderboard. No speed rewards.
- Gamification may not alter grading, mastery, difficulty, item count, or curriculum priority.
- Finish Matter deeply before scaling the architecture across the full course.
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

### M4 - Phenomenon/task-set engine

PR #160 merged at `ff10533beb34d0730eee851cbef9cdf64f4ac07f`.  
Essential run `33826056997`: PASS.

Two Matter investigations now use committed predictions, shared evidence, models/data, bounded mastery-writing checkpoints, revision, and delayed retrieval.

### M5 - CER / constructed scientific reasoning: COMPLETE THROUGH ESSENTIAL GATE

Branch: `science-lab-m5-20260903`  
PR: #161  
Pre-handoff implementation head: `c045414e2d92ade592086fa422617a940a927128`  
Essential run: `33826503965` - PASS.

Implemented:

- new deterministic `study/science-lab/cer.mjs` builder/rubric;
- no LLM grading and no opaque score;
- the open-vs-sealed reaction investigation ends with a true Claim-Evidence-Reasoning construction task;
- the old prewritten final-explanation choice was removed so the product no longer gives away the answer immediately before CER;
- CER itself is the learner's revision of the original prediction;
- Claim, Evidence, and Reasoning are scored independently, producing a transparent 0-3 rubric;
- first CER submission is stored as `provenance: independent` reasoning evidence;
- an incomplete/incorrect CER receives component-level feedback without revealing the complete answer;
- one guided revision is stored separately as `provenance: guided`;
- CER state persists through reload;
- final phenomenon session stores both independent and guided CER response/rubric data for later adult/reasoning analytics;
- CER writes **no additional content-mastery attempt**, preserving the M4 limit of two mastery-relevant evidence checkpoints per phenomenon;
- M5 route assets were cache-busted so production cannot serve stale M4 phenomenon code/CSS.

The same four core tests now also verify:

- valid CER schema;
- exact deterministic 3/3 scoring for the correct CER;
- 2/3 component scoring for a claim-only error;
- CER is not a `recordEvidence` content-mastery step.

The same single 390px Chromium smoke now also verifies:

- partial Claim/Evidence selection survives reload;
- a 2/3 first CER is stored as independent;
- only the weak Claim component is marked for repair;
- a corrected 3/3 second CER is stored as guided;
- both results are retained in the completed phenomenon session;
- CER adds zero new content-mastery attempts;
- CER does not overflow the 390px phone layout.

No human child-learning or physical-device claim is implied by automated checks.

## Minimal CI - preserve this design

Steady-state Science Lab CI remains exactly:

1. `science-lab-tests/core.test.mjs` - **4 tests total**.
2. `science-lab-tests/smoke.test.mjs` - **1 Chromium path at 390x844**.

M1-M5 all extended those same checks. Do not create feature-specific test suites.

## Exact next milestone: M6 - world-class Matter vertical slice

M6 is not a new engine project. It is where the existing M1-M5 architecture becomes a **deep, varied, coherent Matter course** before scaling to other units.

### M6 priorities

1. **Increase context diversity dramatically.**
   - Current Matter bank still has only 3 short-practice forms per micro-skill.
   - Target at least 8 genuinely different contexts per Matter micro-skill before calling Matter world-class.
   - Do not achieve this with shallow paraphrases.
   - Vary phenomenon, representation, evidence pattern, misconception trap, and transfer distance.

2. **Make SEP/CCC explicit in Matter metadata.**
   Add first-class Science and Engineering Practice and Crosscutting Concept tags to Matter tasks/phenomena so future scheduling/analytics can distinguish content knowledge from graph/model/evidence/fair-test reasoning.

3. **Deepen transfer.**
   Replace the temporary `third item = near-transfer` convention with explicit transfer metadata and genuinely different-context transfer tasks.

4. **Complete representation diversity across all four Matter expectations.**
   Ensure 5-PS1-1 through 5-PS1-4 each include more than selected-response recognition and use appropriate models/data/experimental evidence.

5. **Add one optional safe mini-investigation.**
   Prefer a low-friction closed-system or dissolving investigation using ordinary safe materials. It must include prediction, observation/data capture, and explanation. Skipping it may not block course progress.

6. **Add a compact adult insight view for Matter.**
   Show each twin's concept state, independent/delayed/transfer evidence, recurring misconception, CER result if present, and recommended next action. No sibling ranking and no pseudo-precise mastery score.

7. **Preserve learner experience.**
   Deep learning must not turn an ordinary session into a long worksheet. Short adaptive practice stays short; deep investigations remain clearly separate and intentional.

### M6 acceptance gate

Do not call Matter complete until:

- each of the four Matter micro-skills has at least 8 meaningfully different contexts or an equally strong validated alternative-generation design;
- every Matter item has explicit representation/transfer metadata appropriate to its role;
- Matter includes retrieval, misconception repair, graphs/models, phenomenon investigations, CER, delayed retrieval, and genuine transfer;
- one safe optional mini-investigation exists;
- the adult view explains strengths, misconceptions, evidence provenance, and next action without sibling comparison;
- 390px use remains unclipped and normal short practice remains low-friction;
- CI is still 4 core tests + 1 smoke.

### M6 implementation rule

Do not scale Earth/Sky, ecosystems, Earth systems, or engineering into the full new architecture during M6. Prove Matter deeply first.

### M6 testing rule

Do not add an M6 suite. Extend the existing fourth core invariant to protect the Matter context/metadata minimums and extend the one smoke only for one representative new interaction or adult-view path that could otherwise regress silently.

## After M6

Only after the Matter vertical slice is educationally coherent should the architecture be scaled across the full Grade 5 science course (M7+ in the master plan).

## Resume procedure

1. Inspect actual `main` and any open Science Lab PR.
2. If PR #161 is merged, continue from its merge commit; do not recreate M5.
3. Treat `study/science-lab/**` as the primary implementation.
4. Preserve unrelated Study projects.
5. Bold architecture remains allowed while pre-use; once real v2 learner data exists, preserve it.
6. Keep CI at 4 core tests + 1 smoke and extend those checks rather than multiplying them.
7. Before stopping, update this handoff with exact work, commit/PR, essential-gate result, remaining M6 gate, and exact next action.
8. Never claim physical-device or child-learning acceptance without actual evidence.
9. Never restart the project merely because a new agent takes over.
