# Resume Science Lab here

Repository: `stevetodman/stevetodman.com`  
Primary route: `/study/matter-lab.html`  
Audience: Luke and Samantha

## Resume here

M0-M3 are complete through the essential automated gate. The next milestone is **M4 - phenomenon/task-set engine**.

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
10. `study/science-lab/style.css` and `visuals.css`
11. `science-lab-tests/core.test.mjs`
12. `science-lab-tests/smoke.test.mjs`
13. `.github/workflows/science-lab-ci.yml`

The old shared Grade 5 engine/data/tests are secondary/reference implementations for other Study products. Do not use `study/QUALITY_HANDOFF.md`; it belongs to Word Expedition.

## Owner decisions - hard constraints

- Science Lab is pre-use; bold architecture changes are allowed when they improve learning quality.
- Current learner store: `g5-science-lab-v2`.
- Once Luke/Samantha begin real v2 use, their learner evidence becomes protected and must be migrated deliberately.
- Teach scientific thinking: phenomena, models, graphs, evidence, fair tests, CER, retention, transfer, and misconception repair.
- Separate Luke/Samantha histories permanently. No sibling leaderboard. No speed rewards.
- Gamification may not alter grading, mastery, difficulty, item count, or curriculum priority.
- Build a deep Matter vertical slice before scaling to the whole course.
- **CI/tests remain the absolute minimum needed: exactly 4 core tests + 1 Chromium 390px smoke unless a concrete regression proves more is necessary.**
- No WebKit matrix, screenshot artifact suite, broad Study suite, or duplicate coverage suite for ordinary Science Lab changes.

## Milestones completed

### M0 - Governance: COMPLETE

Master plan, dedicated handoff, and Louisiana coverage contract are saved in GitHub.

### M1 - Evidence semantics + true adaptivity: COMPLETE

PR #157 merged to `main` at:

`9efe06744eeca0c2e9365b8fa3b17170f2a08692`

Key results:

- isolated Science Lab architecture under `study/science-lab/`;
- independent/hinted/guided/recovery evidence provenance;
- delayed retrieval + transfer evidence;
- meaningful learner states through Secure;
- Secure requires independent multi-date + delayed + transfer evidence and no unresolved latest independent miss;
- materially weighted weak/due-skill allocation;
- sibling recent-item avoidance;
- child-facing pseudo-precision removed.

M1 essential run `33824981005`: PASS.

### M2 - Misconception-aware remediation: COMPLETE

PR #158 merged to `main` at:

`9a8e6f1ee4bec337f3cefb7ec70793b796180007`

Key results:

- every wrong option in all 12 Matter prompts has a named misconception + targeted reasoning hint;
- first miss remains independent evidence;
- targeted clue appears before answer reveal;
- one hinted retry is available;
- hinted success is repair evidence, not independent mastery;
- misconception + repair target persist across reload;
- later independent retrieval still required.

M2 essential run `33825308872`: PASS.

### M3 - Graph/model engine: COMPLETE THROUGH ESSENTIAL GATE

Branch: `science-lab-m3-20260903`  
PR: #159  
Pre-handoff implementation head: `9293ecc55930e0bca1a10156f858e49073e1869b`

Implemented:

- reusable responsive SVG line graphs;
- reusable zero-baseline bar graphs;
- particle-model renderer;
- system/model diagram renderer;
- accessible tap/keyboard `graph-build` response; no drag-only dependency;
- partial graph construction stored in active session and restored exactly after reload;
- graph-build attempts enter the same response/provenance/mastery evidence model.

Task upgrades:

- `sp2` (5-ESS1-2): learner constructs a line graph from seasonal noon-shadow data;
- `sp3` (5-ESS1-2): reasoning from a rendered daylight line graph;
- `pm3` (5-PS1-1): before/after compressed-air particle model;
- `mc3` (5-PS1-2): mass-conservation bar graph with a scientifically appropriate zero baseline;
- `cy3` (5-LS2-1): system diagram showing matter cycling through organisms/environment.

M3 essential run `33825682173`: substantive checks PASS:

- four core invariants: PASS;
- one 390px phone smoke: PASS;
- smoke constructs a graph, reloads mid-graph, confirms exact points persist, completes the graph, and confirms independent graph evidence;
- no horizontal overflow at 390px.

No human learning-effectiveness or physical-device claim is implied by automated checks.

## Minimal CI - preserve this design

Steady-state Science Lab CI is one job:

1. `science-lab-tests/core.test.mjs` - exactly 4 tests.
2. `science-lab-tests/smoke.test.mjs` - exactly 1 Chromium path at 390x844.

M3 extended those same checks; it did not add another test file or workflow.

## Exact next milestone: M4 - phenomenon/task-set engine

Goal: change the unit of learning from an isolated prompt to a **multi-step scientific investigation** with shared evidence.

### M4 target architecture

Add a first-class `phenomenon`/task-set schema with state that can survive reload at any step.

Canonical sequence:

1. **Notice** - observe the phenomenon without being told the explanation.
2. **Predict** - commit to an initial prediction/model.
3. **Investigate evidence** - use data, graph, model, or observation.
4. **Reason** - interpret pattern/cause/system/matter-energy relationship.
5. **Claim** - decide what the evidence supports.
6. **Evidence** - identify the strongest observations/data.
7. **Revise** - update the initial model/claim when needed.
8. **Transfer** - later apply the principle in a different context.

M4 should establish the engine with **two deep Matter phenomena**, not convert the full course yet.

Recommended first Matter phenomena:

### Phenomenon A - Where did the sugar go?

- notice sugar disappearing during dissolving;
- predict what happened to the matter;
- particle-model evidence;
- conservation reasoning;
- revise model;
- later transfer to a different dissolving context.

Targets: 5-PS1-1 plus linkage to 5-PS1-2.

### Phenomenon B - Why did the measured mass drop?

- compare closed vs open reaction systems;
- predict mass outcome;
- inspect before/after mass evidence and gas formation;
- distinguish matter leaving the system from matter being destroyed;
- make/revise claim.

Targets: 5-PS1-2 plus linkage to 5-PS1-4.

### M4 acceptance

M4 is complete when:

- at least two Matter phenomena run end-to-end;
- multiple steps share one phenomenon context/evidence set rather than acting as unrelated questions;
- learner prediction is saved before later evidence is shown;
- later steps can depend on earlier responses;
- each step records evidence provenance without double-counting one phenomenon as many independent mastery events unless intentionally defined;
- reload at any step restores exact phenomenon step, responses, and evidence;
- a completed phenomenon can schedule later transfer/retrieval;
- normal 390px phone use remains unclipped and low-friction.

### M4 testing rule

Do **not** create a phenomenon test suite. Extend the existing 4 core tests with the minimum phenomenon-state/scoring invariant, and extend the existing one phone smoke to resume one phenomenon mid-step. No new browser path unless a concrete defect cannot be protected otherwise.

## After M4

- M5 CER / constructed reasoning;
- M6 world-class Matter vertical slice;
- only after M6 educational validation, scale across all Grade 5 science.

## Resume procedure

1. Inspect actual `main` and any open Science Lab PR.
2. If PR #159 is merged, continue from its merge commit; do not recreate M3.
3. Treat `study/science-lab/**` as the primary implementation.
4. Preserve unrelated Study projects.
5. Bold architecture is allowed while pre-use; once real v2 data exists, preserve it.
6. Keep CI at 4 core tests + 1 smoke and extend those checks rather than multiplying them.
7. Before stopping, update this file with exact work, commit/PR, essential-gate result, open gate, and exact next action.
8. Never claim physical-device or child-learning acceptance without actual evidence.
9. Never restart the project merely because a new agent takes over.
