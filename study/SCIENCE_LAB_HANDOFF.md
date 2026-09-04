# Resume Science Lab here

Repository: `stevetodman/stevetodman.com`  
Primary route: `/study/matter-lab.html`  
Deep-investigation route: `/study/science-lab/investigate.html`  
Optional mini-lab route: `/study/science-lab/mini-lab.html`  
Adult Matter evidence route: `/study/science-lab/adult.html`  
Audience: Luke and Samantha

## Resume here

**M0-M6 are complete, merged, and production-verified.** The next product milestone is **M7 - scale the proven Matter architecture across the rest of Louisiana Grade 5 science**.

Do not reconstruct M1-M6, do not migrate Science Lab back onto the legacy shared Grade 5 engine, and do not broaden CI.

Read first:

1. `study/SCIENCE_LAB_HANDOFF.md`
2. `study/SCIENCE_LAB_MASTER_PLAN.md`
3. `study/LOUISIANA_GRADE5_COVERAGE.md`
4. `study/science-lab/core.mjs`
5. `study/science-lab/config.mjs`
6. `study/science-lab/matter-m6.mjs`
7. `study/science-lab/data.mjs`
8. `study/science-lab/remediation.mjs`
9. `study/science-lab/representations.mjs`
10. `study/science-lab/visuals.mjs`
11. `study/science-lab/phenomena.mjs`
12. `study/science-lab/phenomenon-engine.mjs`
13. `study/science-lab/cer.mjs`
14. `study/science-lab/adult.mjs`
15. `study/science-lab/mini-lab.mjs`
16. `science-lab-tests/core.test.mjs`
17. `science-lab-tests/smoke.test.mjs`
18. `.github/workflows/science-lab-ci.yml`
19. `.github/workflows/study-live-canary.yml`
20. `scripts/wait-for-cloudflare-production.mjs`

The old shared Grade 5 engine/data/tests and World Lab are secondary/reference implementations for other Study products. Do not use `study/QUALITY_HANDOFF.md`; it belongs to Word Expedition.

## Owner decisions - hard constraints

- Science Lab remains isolated from the legacy shared Grade 5 engine.
- Current learner evidence store: `g5-science-lab-v2`.
- Once Luke/Samantha begin real v2 use, learner evidence becomes protected and future schema changes must migrate it deliberately.
- Phenomena, evidence, models, graphs, fair testing, CER, retention, transfer, and misconception repair are the instructional center.
- Preserve separate Luke/Samantha histories. No sibling leaderboard. No speed rewards.
- Gamification may not alter grading, mastery, difficulty, item count, or curriculum priority.
- Short adaptive practice stays short; deep investigations remain separate and intentional.
- **CI stays exactly 4 core tests + 1 Chromium 390px smoke unless a concrete uncaught regression proves more is necessary.**
- No WebKit matrix, screenshot/artifact suite, broad Study suite, or feature-specific Science Lab suites for ordinary changes.
- Do not claim physical-iPhone or real-child learning acceptance without actual evidence.

## Completed milestone ledger

### M1 - Evidence semantics + true adaptivity

PR #157 merged at `9efe06744eeca0c2e9365b8fa3b17170f2a08692`.  
Essential run `33824981005`: PASS.

Implemented distinct independent/hinted/recovery evidence, stronger weak-skill allocation, delayed retrieval semantics, sibling-aware item separation, and evidence states that do not let guided work manufacture mastery.

### M2 - Misconception-aware remediation

PR #158 merged at `9a8e6f1ee4bec337f3cefb7ec70793b796180007`.  
Essential run `33825308872`: PASS.

Implemented misconception-tagged distractors, hint-before-answer repair, and targeted alternate-form recovery.

### M3 - Graph/model engine

PR #159 merged at `79778caaed9a338bef79e629c39b6f38b9558e12`.  
Essential run `33825682173`: PASS.

Implemented reusable line/bar graphs, particle/system models, interactive graph construction, and exact reload persistence.

### M4 - Phenomenon/task-set engine

PR #160 merged at `ff10533beb34d0730eee851cbef9cdf64f4ac07f`.  
Essential run `33826056997`: PASS.

Two Matter investigations use committed predictions, shared evidence, models/data, bounded mastery-writing checkpoints, revision, and delayed retrieval. Prediction/revision steps do not inflate mastery evidence.

### M5 - Deterministic Claim-Evidence-Reasoning

PR #161 merged at `1ed20361315ef4fdbcbd6533c02af2476bc119c7`.  
Essential run `33826503965`: PASS.

Implemented deterministic component-level CER scoring, independent first construction, guided component-specific repair, reload persistence, and separate reasoning analytics. The prewritten final multiple-choice explanation was removed so CER itself is the final scientific revision. CER adds no extra content-mastery attempt.

### M6 - World-class Matter vertical slice: COMPLETE

PR: #162  
Final pre-merge branch head: `c6e206330bc23e400f588275fc5b6abd2f617737`  
Merged `main` code commit: `dbd895445eaf7371cdcb0e95f128213e1a09493e`  
PR essential run: `33827751764` - PASS.  
Post-merge essential run: `33827819235` - PASS.  
Exact production/browser run: `33827819236` - PASS on rerun attempt 2.  
Successful exact-production job: `100887131224`.  
Cloudflare deployment ID: `0f2b37d9-f2fc-47f7-8660-3e5afa5e92dc`.

The first production-verification attempt timed out while Cloudflare was still building and correctly refused to claim success. After Cloudflare completed the exact SHA, the same verifier was rerun without weakening any gate. On attempt 2, every step passed: exact-SHA Cloudflare wait, pinned install, exact build, Chromium install, touch-enabled custom-domain browser verification, stale-main refusal, and evidence preservation.

M6 implementation:

- Matter expanded from 12 to **32 short-practice tasks**: 8 genuinely distinct contexts for each of the four Matter micro-skills.
- New M6 content lives in `study/science-lab/matter-m6.mjs`; M1-M5 core behavior was not rewritten.
- Every Matter item now has explicit `sep`, `ccc`, `representationType`, `sourceFamily`, `transferLevel`, and mastery-relevant `transfer` semantics.
- Both existing Matter investigations and their individual reasoning steps also carry SEP/CCC/representation/transfer metadata.
- Representation diversity includes selected response, evidence/data-table reasoning, quantitative reasoning, particle models, bar graphs, graph construction, experimental observations, property-pattern reasoning, and system reasoning.
- Each Matter micro-skill has a deliberately different far-transfer task.
- **Only explicit `transferLevel: 'far'` Matter items set `transfer: true` and can satisfy the mastery transfer requirement. Near-transfer contexts remain useful practice but cannot unlock Secure.**
- New selected-response distractors retain misconception-specific remediation and hint-before-answer behavior.
- The scheduler remains an 8-prompt adaptive session; M6 did not turn normal practice into a worksheet.
- Existing phenomenon and CER evidence limits remain intact.

#### Optional closed-system home mini-lab

Route: `/study/science-lab/mini-lab.html`

- Uses a resealable plastic bag, 1-2 ice cubes, a kitchen scale, and paper towel.
- Learner commits a prediction before evidence.
- Records before/after mass and optional observations.
- Requires an explanation using the closed-system idea.
- Safety explicitly prohibits glass, heating, tasting, and continuing with a leaking/spilled setup.
- Stored under separate key `g5-science-lab-m6-mini-lab`.
- **It does not write a Science Lab mastery attempt or change the adaptive score.**
- It is optional and may be skipped without blocking progress.

#### Adult Matter evidence view

Route: `/study/science-lab/adult.html`

Shows Luke and Samantha separately, without ranking or pseudo-precise scores:

- concept evidence state;
- independent correct/total evidence;
- delayed retrieval evidence;
- far-transfer evidence;
- recent/recurring misconception;
- state-specific recommended next action;
- scientific-practice evidence grouped by SEP;
- latest independent CER component score and guided revision score when present.

The view explicitly distinguishes repair evidence from secure independent mastery evidence.

#### M6 automated acceptance

The existing fourth core invariant now verifies, without adding a fifth test:

- 32 Matter tasks total;
- at least 8 contexts and 8 distinct source families per Matter micro-skill;
- explicit SEP/CCC/representation/transfer metadata on every Matter item;
- a genuine far-transfer task per Matter skill;
- only far transfer earns mastery transfer credit;
- misconception-specific remediation completeness;
- representation diversity across 5-PS1-1 through 5-PS1-4;
- graph construction behavior;
- phenomenon metadata and bounded mastery checkpoints;
- deterministic CER semantics remain intact.

The same single 390x844 Chromium smoke still covers M1-M5 critical behavior and now also verifies the M6 adult route and dashboard links. It remains **one smoke test**, not a new suite.

## Minimal CI - preserve this design

Steady-state Science Lab CI remains exactly:

1. `science-lab-tests/core.test.mjs` - **4 tests total**.
2. `science-lab-tests/smoke.test.mjs` - **1 Chromium path at 390x844**.

M1-M6 extended these same checks. Do not create feature-specific test suites.

## Production-deployment invariant

A merge is not enough to claim the site is live.

For production changes, `.github/workflows/study-live-canary.yml` must:

1. wait for Cloudflare Pages to report the exact `main` commit as successfully deployed;
2. build the exact target artifact;
3. verify the custom production domain in a touch-enabled browser;
4. refuse to report a stale success if `main` advanced meanwhile;
5. preserve deployment/browser evidence.

The Cloudflare wait helper is `scripts/wait-for-cloudflare-production.mjs`. Its job is to reject branch-preview/stale deployment evidence and select the exact production deployment for the target SHA.

M6 production verification satisfied this invariant for `dbd895445eaf7371cdcb0e95f128213e1a09493e` in run `33827819236`, attempt 2.

## Exact next milestone: M7 - scale phenomena and reasoning across the full Grade 5 course

M7 should **reuse the Matter architecture rather than start a new engine project**.

Apply the proven structure to:

- Earth, Sun & Stars;
- Living Systems;
- Earth Systems & Resources;
- Engineering Design.

M7 acceptance from the master plan:

- all 16 Grade 5 expectations have representation diversity;
- all relevant units include modeling/data reasoning;
- major SEPs/CCCs are intentionally represented;
- bank breadth reduces surface-form memorization;
- independent/hinted/guided/recovery/delayed/far-transfer evidence semantics remain truthful;
- sibling-aware adaptation remains intact;
- normal practice remains 8 prompts and low-friction;
- CI remains exactly 4 core tests + 1 phone smoke.

### Recommended M7 implementation sequence

Do not scale all four remaining units in one undifferentiated commit. Use the successful M6 pattern:

1. create a dedicated M7 branch from the latest verified `main`;
2. audit the existing Earth, Sun & Stars items against the M6 schema and Louisiana coverage contract;
3. make Earth, Sun & Stars the first M7 vertical slice, adding real representation/context diversity, SEP/CCC metadata, and genuine far transfer without rewriting the Matter engine;
4. extend only the existing fourth invariant for the new unit-level acceptance contract;
5. extend the one phone smoke only if one representative interaction would otherwise be unprotected;
6. merge only after the same essential gate passes;
7. then repeat the proven pattern for Living Systems, Earth Systems & Resources, and Engineering Design.

If a shared abstraction is genuinely needed for M7, extract it only after a concrete second-unit use case demonstrates the need. Do not generalize speculatively.

## Resume procedure

1. Inspect actual `main`, this handoff, and any open Science Lab PR before editing.
2. Treat M6 as complete and production-verified at code SHA `dbd895445eaf7371cdcb0e95f128213e1a09493e`; do not redo M6 acceptance unless a later shared-code change or reproduced regression justifies it.
3. Treat `study/science-lab/**` as the primary implementation; preserve unrelated Study products.
4. Do not recreate M1-M6 or broaden CI.
5. Preserve `g5-science-lab-v2` learner evidence once real use begins.
6. Keep Matter behavior stable during M7 unless a reproduced shared-engine defect requires a correction.
7. Before stopping, update this handoff with exact branch/PR/merge/run identifiers and the next concrete action.
8. Never claim physical-device or child-learning acceptance without actual evidence.
9. Never restart the project merely because a new agent takes over.
