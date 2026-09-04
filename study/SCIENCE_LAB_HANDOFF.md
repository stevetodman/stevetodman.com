# Resume Science Lab here

Repository: `stevetodman/stevetodman.com`  
Primary route: `/study/matter-lab.html`  
Audience: Luke and Samantha  
Approved direction: build a world-class, phenomenon-centered adaptive science tutor; educational value outranks compatibility with the unused prototype.

## Resume here

M0, M1, and M2 are complete through the essential automated gate. The next implementation milestone is **M3 - graph/model engine**.

Read in this order:

1. `study/SCIENCE_LAB_HANDOFF.md`
2. `study/SCIENCE_LAB_MASTER_PLAN.md`
3. `study/LOUISIANA_GRADE5_COVERAGE.md`
4. `study/science-lab/core.mjs`
5. `study/science-lab/config.mjs`
6. `study/science-lab/data.mjs`
7. `study/science-lab/remediation.mjs`
8. `study/science-lab/style.css`
9. `science-lab-tests/core.test.mjs`
10. `science-lab-tests/smoke.test.mjs`
11. `.github/workflows/science-lab-ci.yml`

Do not use `study/QUALITY_HANDOFF.md`; it belongs to Word Expedition. The old shared Grade 5 engine/data/tests are secondary/reference implementations for other Study products, not the primary Science Lab architecture.

## Owner decisions - hard constraints

- Science Lab is not currently in active use by the twins; pre-use prototype compatibility may be broken for a cleaner architecture.
- The current Science Lab learner store is `g5-science-lab-v2`.
- Once Luke or Samantha starts using v2 for real learning, learner evidence becomes protected data and future schema changes must migrate it deliberately.
- Teach scientific thinking: phenomena, models, graphs, evidence, fair testing, CER, retention, transfer, and misconception repair.
- Preserve separate Luke/Samantha histories. No sibling leaderboard. No speed rewards.
- Gamification may not alter grading, mastery, difficulty, item count, or curriculum priority.
- Build one deep Matter vertical slice before scaling the architecture across the whole course.
- **CI/tests must stay at the absolute minimum needed. Do not create another testing project.**
- Prefer extending the existing 4 core invariants and one phone smoke over adding test files, browsers, matrices, screenshots, or artifacts.

## Milestone status

### M0 - Governance: COMPLETE

Master plan, dedicated handoff, and Louisiana coverage contract are in the repository.

### M1 - Evidence semantics + true adaptivity: COMPLETE

Merged to `main` via PR #157.

M1 merge commit:

`9efe06744eeca0c2e9365b8fa3b17170f2a08692`

Implemented:

- isolated Science Lab engine/config/data namespace under `study/science-lab/`;
- fresh version-2 learner store;
- independent, hinted, guided, and recovery provenance;
- delayed-retrieval and transfer evidence;
- learner states: New, Learning, Needs repair, Repaired, Retained, Transfer demonstrated, Secure;
- Secure requires independent multi-date evidence plus delayed retrieval plus transfer and no unresolved latest independent miss;
- weak/due skills receive materially more queue slots;
- sibling recent-item avoidance when equivalent forms exist;
- child-facing pseudo-precision evidence scores removed;
- all 16 Louisiana Grade 5 expectations remain present.

### M2 - Misconception-aware remediation: COMPLETE THROUGH ESSENTIAL GATE

Branch: `science-lab-m2-20260903`  
PR: #158  
Pre-handoff implementation head: `17d718be721a97d2b3a223100eb4495150b5b687`

Implemented for all 12 Matter prompts:

- every wrong answer has explicit misconception metadata and a targeted reasoning hint in `study/science-lab/remediation.mjs`;
- first miss remains an independent attempt and records the selected `misconceptionTag`;
- a useful first miss gives a targeted clue **before** revealing the keyed answer;
- learner receives one hinted retry on the same prompt;
- hinted success is recorded as `provenance: hinted`, with `repairTarget`, never as independent mastery evidence;
- an alternate-form repair/recheck is still scheduled;
- later independent retrieval is still required for Secure;
- misconception and repair metadata survive reload;
- different distractors can trigger meaningfully different remediation.

Representative Matter misconception families now include:

- `dissolved-means-destroyed`
- `matter-becomes-energy`
- `gas-is-not-matter`
- `open-system-loss-means-destroyed`
- `single-property-is-enough`
- `stirring-alone-means-new-substance`
- `phase-change-means-new-substance`
- `shape-change-means-reaction`

## Minimal CI - do not expand casually

Science Lab steady-state CI is exactly one job in `.github/workflows/science-lab-ci.yml`:

1. `science-lab-tests/core.test.mjs` - **4 tests total** protecting the central learning/data/content invariants.
2. `science-lab-tests/smoke.test.mjs` - **1 Chromium path** at 390x844.

No WebKit matrix.  
No screenshot artifact suite.  
No full Study suite.  
No general site test fan-out.  
No duplicate coverage suite.

M1 essential run: `33824981005` - PASS.  
M2 essential run: `33825308872` - PASS.

For M2 the same 4 core tests now also prove:

- two different distractors can map to distinct misconceptions/hints;
- hinted repair does not become independent mastery evidence;
- all Matter distractors have a misconception tag and hint;
- misconception metadata survives store normalization.

The single phone smoke now proves the full repair loop:

- start an 8-prompt round at 390x844;
- independent wrong answer records misconception evidence;
- clue is shown before answer reveal;
- repair state survives reload without duplicate evidence;
- hinted retry is recorded as hinted, with the same repair target;
- Luke/Samantha active-session separation remains intact.

No human child-learning or physical-iPhone claim is implied by these tests.

## Exact next milestone: M3 - graph/model engine

Goal: Science Lab must support scientific reasoning from real visual representations, not merely text tables.

### M3 implementation target

Build reusable, accessible Science Lab primitives for:

1. **Line graph** - plot supplied data and support trend/point reasoning.
2. **Bar graph** - compare categories quantitatively.
3. **Simple graph construction** - learner places/selects points or builds the representation from supplied data.
4. **System/model diagram** - components, arrows/flows, and system boundaries.
5. **Particle model** - enough to represent spacing, mixing/dissolving, or conservation meaningfully.
6. Non-drag alternatives for any drag interaction; keyboard/tap must remain usable.

Start with Matter plus one Earth/Sky graph example. Do not redesign the whole course simultaneously.

### M3 educational acceptance

M3 is complete when at least:

- one Matter task requires reasoning from a rendered graph/model rather than a text table;
- one Earth/Sky task requires graph reasoning consistent with Louisiana 5-ESS1-2 expectations;
- at least one task requires the learner to **construct or manipulate** a representation rather than only select a sentence;
- visual tasks work at 390px without horizontal clipping;
- saved active state restores the learner's graph/model interaction exactly;
- graph/model responses enter the same evidence/provenance model as other Science Lab tasks.

### M3 testing rule

Do not add a graph test suite. Extend the existing 4 core tests only if a new data/scoring invariant requires it, and extend the one phone smoke with **one representative graph/model interaction**. Add another automated path only if a concrete defect cannot be covered by those existing checks.

## After M3

Proceed unless the owner redirects:

- M4 phenomenon/task-set engine;
- M5 CER/constructed reasoning;
- M6 world-class Matter vertical slice;
- only after M6 educational validation, scale across all Grade 5 units.

## Resume procedure for every agent

1. Inspect actual `main` and any open Science Lab PR; do not rely on an old chat SHA.
2. If PR #158 is merged, continue from its merge commit; do not recreate M2.
3. Treat `study/science-lab/**` as the primary implementation.
4. Work the current milestone or a reproduced regression; preserve unrelated Study projects.
5. Bold architecture changes are allowed while the product remains pre-use.
6. Do not reset/merge Luke and Samantha evidence once v2 has real usage.
7. Keep automated verification minimal: extend existing checks rather than multiplying them.
8. Before stopping, update this file with exact completed work, checkpoint/PR, essential-gate result, remaining gate, and exact next action.
9. Never claim physical-device or child-learning acceptance without actual evidence.
10. Never restart the project merely because a new agent takes over.
