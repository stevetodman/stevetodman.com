# Science Lab - World-Class Learning Master Plan

Repository: `stevetodman/stevetodman.com`  
Primary route: `/study/matter-lab.html`  
Audience: Luke and Samantha, Louisiana Grade 5  
Status: approved product direction  
Owner decision: preserve the strong adaptive foundation and evolve Science Lab from a quiz engine into a phenomenon-centered scientific reasoning and investigation system.

> This document is the stable product and implementation plan. It should change only when the owner changes the product direction or a completed milestone materially changes the architecture. For the current resume point, read `SCIENCE_LAB_HANDOFF.md` first.

## 1. North star

Science Lab should not merely make Luke and Samantha better at answering Grade 5 science questions. It should make them better at **thinking scientifically**.

The product should train them to:

1. notice and describe phenomena;
2. make predictions;
3. distinguish observation from inference;
4. construct and use models;
5. identify variables and design fair tests;
6. read, construct, and reason from tables and graphs;
7. trace matter and energy through systems;
8. recognize patterns, cause/effect, systems, structure/function, and stability/change;
9. make claims supported by evidence;
10. explain why evidence supports a claim;
11. compare competing explanations or designs;
12. revise a model or explanation after new evidence;
13. retain concepts over time;
14. transfer the same scientific principle to a different context.

The site should feel like a calm, capable science tutor and lab notebook, not a noisy test-prep game.

## 2. Existing foundation to preserve

Do not discard the current implementation. It already has important strengths:

- separate Luke and Samantha learner profiles;
- short eight-question standard sessions;
- current classroom unit as the default;
- full-year review as an explicit option;
- skill-level evidence tracking;
- errors weighted more strongly than isolated successes;
- alternate-form recovery after a miss;
- multi-day evidence requirement for mastery;
- resumable active sessions in local storage;
- broad Louisiana Grade 5 standards coverage;
- current Matter unit coverage;
- tables, flow models, multi-select items, and instructional explanations;
- responsive iPhone/Chromebook layout;
- keyboard focus, reduced-motion, and forced-color support;
- automated structural, adaptive, learner-separation, reload, and coverage checks.

These are assets. The goal is to deepen the pedagogy without regressing the simplicity or reliability.

## 3. Current limitations that define the roadmap

### 3.1 The unit of learning is still a question

The current engine is dominated by selected-response items. It can present tables and simple model stimuli, but it does not yet support genuine phenomenon/task sets, graph construction, model construction, CER, or investigation sequences.

The new unit of learning should be the **investigation**, with questions as one type of evidence inside it.

### 3.2 Three alternate forms per expectation are not enough

The current 48-item bank establishes coverage, not durable mastery. With repeated use, learners can memorize surface forms.

The target is a broad bank of genuinely different contexts, plus parameterized tasks where appropriate.

### 3.3 Adaptivity is skill-aware but not strongly resource-weighted

The queue prioritizes weaker skills, but session allocation is still relatively even across available skill lanes. If one learner is weak in one concept and strong in three, the weak concept should receive substantially more instructional time.

### 3.4 Mastery evidence needs stronger semantics

A recovery answer after instruction is valuable evidence of repair, but it is not equivalent to an independent delayed success. Guided and recovery performance must not be able to establish mastery by themselves.

### 3.5 Feedback explains the answer but does not diagnose the misconception

Distractors are not yet tagged with misconception meaning. The system therefore cannot distinguish, for example, energy/matter confusion from a soil-as-source misconception.

### 3.6 Science and engineering practices and crosscutting concepts are not first-class learner dimensions

The system records skill and standard, but not the practice or reasoning pattern used. A learner may understand a content idea but be weak at graph interpretation, modeling, fair testing, or evidence selection. Science Lab should detect that.

### 3.7 Device-local profiles fragment adaptivity

Local-only evidence is acceptable for the current baseline, but long-term adaptive quality requires one learner model across iPhone and Chromebook.

## 4. Product principles and invariants

These rules are hard constraints unless the owner explicitly changes them.

### Learning first

- Scientific reasoning outranks gamification.
- Do not reward speed.
- Do not make animation, cosmetics, or streaks affect grading, mastery, difficulty, item count, or curriculum priority.
- Do not build a sibling leaderboard.
- Do not inflate session length merely to increase engagement metrics.
- Explanations must improve understanding, not merely reveal the keyed answer.

### Evidence integrity

- Independent performance, hinted performance, guided performance, and recovery performance are distinct evidence classes.
- A learner cannot become `Secure` from guided/recovery performance alone.
- Mastery requires evidence over time and at least one different-context transfer task.
- Recent unresolved misconceptions can reduce or block mastery.
- Internal scheduler scores may be numerical; child-facing mastery should use meaningful states rather than false precision.

### Twin-specific learning

- Luke and Samantha always retain separate learning histories.
- Their recommended queues should diverge when their evidence diverges.
- Avoid giving one twin an item the other saw very recently when an equivalent alternative exists.
- Cooperative missions may combine information across twins, but individual mastery evidence must remain attributable.

### Curriculum fidelity

- `LOUISIANA_GRADE5_COVERAGE.md` remains the coverage contract.
- Every Louisiana Grade 5 science/engineering expectation remains represented.
- Every task must identify its disciplinary target, science/engineering practice, and crosscutting concept when applicable.
- Current-unit sessions must not silently introduce future-unit content unless the task intentionally bridges already taught concepts.

### UX restraint

- One obvious recommended action after learner selection.
- Preserve short, readable sessions.
- iPhone portrait remains a first-class layout.
- Avoid unnecessary typing for routine retrieval tasks, but do require short constructed reasoning when the learning objective calls for it.
- Do not turn every lesson into a long simulation.

## 5. Target learning model

Replace the simple idea of `score -> mastered` with an interpretable evidence state.

Recommended concept states:

1. **New** - insufficient evidence.
2. **Learning** - initial exposure or unstable performance.
3. **Needs repair** - a recent independent misconception/error.
4. **Repaired** - correct after guidance or same-session alternate form.
5. **Retained** - delayed independent success.
6. **Transfer demonstrated** - independent success in a meaningfully different context/representation.
7. **Secure** - repeated independent, delayed, and transfer evidence with no unresolved recent misconception.

The scheduler can still maintain an internal continuous priority value, but learner-facing labels should describe actual evidence.

### Evidence classes

Each attempt should explicitly record at least:

- `independent`
- `hinted`
- `guided`
- `recovery`
- `delayedRetrieval`
- `transfer`

A single attempt may have several orthogonal flags, but the provenance must be unambiguous.

## 6. Adaptive scheduling target

The scheduler should allocate instructional time, not merely sort questions.

Default adaptive mix for a normal practice session:

- about 50% weakest or currently due concepts;
- about 25% developing/current-unit concepts;
- about 15% previously secure concepts due for spaced retrieval;
- about 10% transfer/challenge tasks.

These percentages are a starting policy, not a user-facing promise. The algorithm may adjust for a small unit, insufficient item supply, a just-repaired misconception, or an assigned teacher focus.

### Scheduler requirements

- Weight recent independent misses heavily.
- Increase priority for overdue concepts.
- Avoid unnecessary repetition of the same item or surface context.
- Prefer a different representation on recheck when possible.
- Schedule same-session repair after a miss.
- Schedule next-day or next-session delayed retrieval.
- Schedule later transfer before declaring secure.
- Respect the current classroom unit by default.
- Preserve a small amount of interleaved prior learning.
- Ensure the two twins can receive different queues based on their own data.

## 7. Content architecture

Every science task should move toward a richer schema. Suggested fields:

```js
{
  id,
  unit,
  skill,
  standard,
  phenomenonId,
  sourceFamily,
  sep,
  ccc,
  difficulty,
  transferLevel,
  responseType,
  representationType,
  misconceptionTags,
  prerequisites,
  prompt,
  stimulus,
  scoring,
  explanation,
  hints,
  remediation,
  safety
}
```

Not every field must be present in the first implementation. Introduce them through schema versions and compatibility helpers rather than a destructive rewrite.

### Representation types to support

- plain text;
- data table;
- line graph;
- bar graph;
- stacked/part-to-whole representation;
- sequence/flow;
- system diagram;
- particle model;
- annotated image;
- experimental setup;
- map/physical context where scientifically relevant.

### Response types to support

- single select;
- multi-select;
- numeric/table completion;
- drag-sort/order;
- drag-to-model;
- hotspot/region selection;
- graph reading;
- graph construction;
- model construction;
- claim selection + evidence selection;
- short constructed explanation;
- CER;
- prediction followed by observation;
- design choice and revision.

## 8. Phenomenon and investigation architecture

A phenomenon set should be a multi-step learning object, not a bundle of unrelated questions.

Canonical sequence:

1. **Notice** - observe a phenomenon without immediately telling the explanation.
2. **Predict** - commit to an initial model or prediction.
3. **Investigate evidence** - read data, manipulate a model, or perform a short safe observation.
4. **Reason** - identify pattern, cause/effect, system interaction, matter/energy flow, etc.
5. **Claim** - state what the evidence supports.
6. **Evidence** - choose or cite the most relevant observations/data.
7. **Reasoning** - connect scientific principle to evidence.
8. **Revise** - change a model or explanation if needed.
9. **Transfer** - apply the principle in a new context later.

### Example phenomenon families

#### Matter

- inflated vs uninflated ball mass;
- sugar disappearing in water;
- mass before/after melting in a sealed container;
- reaction in open vs closed systems;
- mystery materials identified from properties;
- new substance vs mixture evidence.

#### Earth and sky

- changing flagpole shadows;
- daylight across seasons;
- apparent brightness vs star distance;
- gravity direction around Earth.

#### Living systems

- plant mass gain with little soil mass loss;
- energy traced through a local food web;
- matter cycling through organisms and environment.

#### Earth systems/resources

- runoff carrying sediment to a bayou;
- wetland restoration evidence;
- freshwater availability and reservoirs.

#### Engineering

- bridge strength under cost constraints;
- fair-test design;
- water-filter design and revision;
- insulation or erosion-control design.

## 9. Content-volume target

Move from 3 forms per micro-skill toward **8-15 genuinely different contexts per micro-skill** over time.

Do not achieve this by shallow paraphrase. Variants should differ in at least one meaningful dimension:

- phenomenon/context;
- representation;
- evidence pattern;
- response type;
- misconception trap;
- transfer distance;
- required practice (modeling, data interpretation, fair test, CER, etc.).

Parameterized generation is appropriate only when the generated forms preserve scientific validity and can be exhaustively validated.

## 10. Feedback and misconception engine

Every distractor should progressively acquire a misconception tag or rationale.

Examples:

- `energy-is-matter`
- `soil-supplies-most-plant-mass`
- `dissolved-means-destroyed`
- `gas-has-no-mass`
- `open-system-mass-loss-means-matter-destroyed`
- `correlation-without-control`
- `all-variables-can-change-in-fair-test`
- `apparent-size-equals-actual-size`
- `energy-cycles-like-matter`

### Feedback ladder

1. Independent attempt.
2. If wrong, provide a reasoning hint when useful.
3. Allow a second attempt without counting it as independent evidence.
4. If still wrong or if the item is not suited to retry, show a worked conceptual explanation.
5. Schedule an alternate-form recovery task.
6. Schedule delayed retrieval.
7. Schedule transfer.

Feedback should target the selected misconception rather than repeat generic wording.

## 11. Graph and model system

Graphical reasoning is a P0 educational capability.

Build reusable, accessible primitives for:

- line graphs;
- bar graphs;
- category comparisons;
- part-to-whole displays;
- graph construction from supplied data;
- point/segment selection;
- trend interpretation.

Build model primitives for:

- particles;
- arrows/flows;
- system boundaries;
- matter vs energy pathways;
- labels and components;
- drag-and-drop construction.

All visual interactions must have keyboard and non-drag alternatives.

## 12. CER and constructed reasoning

Introduce Claim-Evidence-Reasoning gradually.

### Scaffold levels

**Level A - recognition**  
Choose the best claim and the strongest evidence.

**Level B - assembly**  
Arrange claim, evidence, and reasoning fragments.

**Level C - constrained construction**  
Choose evidence and write one reasoning sentence.

**Level D - independent short CER**  
Write a concise explanation from a phenomenon/task set.

Constructed response should not become a typing endurance test. Grade 5 science reasoning is the target.

Scoring can initially use deterministic rubrics and selected evidence anchors. LLM-based evaluation, if ever added, must be optional, auditable, bounded, and never the sole source of mastery evidence without validation.

## 13. Real-world mini-labs

Add optional, safe, low-friction investigations where the computer acts as lab notebook and coach.

Examples:

- shadow length at different times;
- magnetism of household objects;
- dissolving common safe solids in water;
- ice melting in a closed bag/container;
- paper-airplane fair test;
- simple absorbency comparison;
- plant observation over time.

Each mini-lab should include:

- materials;
- safety note;
- prediction;
- variables;
- observation/data capture;
- claim/evidence/reasoning;
- transfer question.

Never require hazardous substances, heat/flame, ingestion, electrical disassembly, unsupervised chemical mixing, or ambiguous household materials.

## 14. Twin-specific design

### Independent pathways

Luke and Samantha should have separate:

- concept states;
- misconception histories;
- spaced schedules;
- item histories;
- challenge level;
- recommended next action.

### Sibling-aware anti-overlap

When both learners use the same device/account, the scheduler should prefer item/context separation if educationally equivalent tasks exist.

Do not hide a needed task simply because the sibling saw it; learning priority still wins.

### Cooperative Twin Lab Missions

Occasionally provide investigations where each learner receives different evidence and they must communicate to solve the shared phenomenon.

Rules:

- cooperation, not competition;
- no ranking;
- shared mission success can be celebrated;
- individual concept evidence remains separately attributable;
- each twin should still independently answer at least one key reasoning step.

## 15. Parent/teacher insight

The adult view should answer three questions:

1. What does each child understand?
2. What misconception or reasoning weakness is blocking progress?
3. What should happen next?

Avoid pseudo-precision such as `73/100 evidence strength` as the primary presentation.

Preferred presentation:

**Conservation of matter - Developing**  
Independent first attempts: 5/8  
Delayed retrieval: 1/2  
Transfer: not yet demonstrated  
Recent misconception: open-system mass loss  
Next: closed vs open system investigation

Also show practice dimensions such as:

- data interpretation;
- graph reasoning;
- model use;
- fair-test design;
- evidence selection;
- CER/reasoning.

## 16. Cloud learner model

Cross-device synchronization is not the first milestone, but it is required for the mature product.

Requirements:

- identity should remain simple for the family;
- Luke and Samantha records stay isolated;
- merges must be deterministic and idempotent;
- offline work must not be lost;
- active session recovery must remain reliable;
- never merge learner evidence across siblings;
- preserve schema versions and migration paths;
- no secrets in client code or documentation.

The current local-only system remains valid until the synchronization milestone is explicitly implemented and accepted.

## 17. Motivation and gamification

Gamification is secondary to learning quality.

Good themes:

- lab notebook;
- discoveries;
- investigation badges;
- model-builder milestones;
- scientist progression;
- collections of completed phenomena;
- cooperative twin discoveries.

Avoid:

- speed bonuses;
- sibling leaderboards;
- random loot;
- rewards that change difficulty or grading;
- streak pressure that encourages low-quality rapid answering;
- large animation interruptions between questions.

## 18. Modes

Mature Science Lab should support three clearly distinct modes.

### Learn

- adaptive;
- hints available;
- immediate misconception-aware feedback;
- retries allowed;
- repair/recheck scheduling;
- low stakes.

### Challenge

- no hints during the item/task set;
- more transfer-heavy;
- phenomenon sets;
- delayed results where appropriate;
- constructed reasoning included.

### LEAP Mission

- occasional;
- set-based and task-based;
- representative response types;
- no attempt to reproduce secure or proprietary test content;
- instructional debrief after completion;
- should not dominate the curriculum.

## 19. Milestone plan

### M0 - Governance and checkpointing

**Goal:** make the work resumable and prevent future agents from restarting the project.

Deliverables:

- this master plan;
- `SCIENCE_LAB_HANDOFF.md`;
- links from the Louisiana Grade 5 coverage contract;
- clear file map and next-agent procedure.

Acceptance:

- a new agent can identify current state, next action, invariants, and relevant files without reading old chats.

### M1 - Evidence semantics and true adaptivity

**Goal:** fix the learning model before adding flashy features.

Implement:

- attempt provenance (`independent`, `hinted`, `guided`, `recovery`, delayed, transfer);
- mastery states;
- recovery cannot establish mastery alone;
- delayed retrieval requirement;
- transfer requirement;
- strongly weighted adaptive allocation;
- sibling-aware recent-item avoidance;
- remove child-facing false-precision score where appropriate.

Acceptance:

- a learner repeatedly weak in one Matter skill receives visibly more Matter practice in that skill;
- guided/recovery successes alone never produce `Secure`;
- independent successes on multiple dates plus transfer can produce `Secure`;
- Luke and Samantha queues diverge appropriately;
- reload remains exact;
- existing learner data migrates without mixing profiles.

### M2 - Misconception-aware remediation

**Goal:** make feedback tutor-like rather than answer-key-like.

Implement:

- misconception tags on distractors;
- hint schema;
- retry evidence distinction;
- misconception-specific feedback;
- remediation mapping;
- adult insight into recent misconceptions.

Acceptance:

- at least all Matter items have misconception-aware feedback;
- selecting two different wrong answers can produce meaningfully different remediation;
- hinted/guided attempts are stored separately from independent evidence.

### M3 - Graph and representation engine

**Goal:** support real graphical science reasoning.

Implement reusable accessible components for:

- line graphs;
- bar graphs;
- graph construction;
- model/diagram interaction;
- system boundaries and arrows;
- non-drag keyboard alternatives.

Acceptance:

- Matter and Earth/Sky each include at least one graph/model task that cannot be reduced to reading a text table;
- phone portrait is usable without horizontal clipping;
- keyboard access is complete;
- saved active tasks restore exactly.

### M4 - Phenomenon/task-set engine

**Goal:** make investigations first-class objects.

Implement:

- phenomenon data schema;
- multi-step task state;
- shared stimulus across steps;
- prediction -> evidence -> reasoning -> revision flow;
- scoring/evidence per step;
- task-set resume/reload.

Acceptance:

- at least two Matter phenomena are complete end-to-end;
- each phenomenon integrates content + practice + crosscutting concept;
- later questions depend on earlier evidence rather than being standalone trivia;
- reload can occur at any step without duplication or lost responses.

### M5 - Constructed reasoning and CER

**Goal:** move from recognition to explanation.

Implement:

- CER scaffold levels A-D;
- deterministic rubric model;
- evidence-selection tasks;
- short text reasoning where appropriate;
- revision after feedback.

Acceptance:

- at least one Matter phenomenon ends in a CER;
- learner can receive partial instructional feedback without the response being counted as independent mastery;
- mobile typing burden remains reasonable.

### M6 - Matter vertical slice to world-class quality

**Goal:** finish one unit deeply before scaling the architecture.

Matter should contain:

- robust concept bank;
- varied contexts;
- graphs/models;
- misconception remediation;
- at least several phenomenon sets;
- fair use of retrieval items;
- constructed reasoning;
- delayed retrieval and transfer;
- at least one optional mini-lab where safe.

Acceptance:

- 5-PS1-1 through 5-PS1-4 can each be demonstrated through more than selected-response recognition;
- at least 8 genuinely different contexts per Matter micro-skill or equivalent validated generative coverage;
- a child can complete a normal session without excessive length/friction;
- parent view explains specific strengths, misconceptions, and next steps.

**Do not scale every unit before M6 is educationally validated.**

### M7 - Scale phenomena and reasoning across the full Grade 5 course

Apply the proven Matter architecture to:

- Earth, Sun & Stars;
- Living Systems;
- Earth Systems & Resources;
- Engineering Design.

Acceptance:

- all 16 expectations have representation diversity;
- all relevant units include modeling/data reasoning;
- all major SEPs/CCCs are intentionally represented;
- bank breadth reduces surface-form memorization.

### M8 - Safe real-world investigations

Implement optional mini-labs with notebook capture.

Acceptance:

- activities are safe, short, and use common materials;
- every lab includes prediction, evidence, and explanation;
- skipping the physical activity does not block course progress.

### M9 - Twin cooperative missions

Implement carefully after independent learner modeling is stable.

Acceptance:

- no sibling ranking;
- each twin contributes unique evidence;
- both perform an independently scored reasoning step;
- cooperative mode is optional and does not contaminate individual mastery.

### M10 - Cross-device learner synchronization

Implement one learner model across family devices.

Acceptance:

- Luke on iPhone and Luke on Chromebook see one coherent history;
- Samantha remains separate;
- offline/online merge is deterministic;
- active sessions and evidence are not duplicated;
- migration from existing local profiles is safe.

### M11 - Parent/teacher dashboard

Implement interpretable learning analytics.

Acceptance:

- concepts displayed as evidence states, not misleading precision;
- recent misconceptions are visible;
- science-practice weaknesses are visible;
- recommended next action is clear;
- no sibling ranking.

### M12 - LEAP-style challenge and final polish

Only after core learning quality is proven:

- authentic set/task pacing;
- representative technology-enhanced interactions;
- periodic constructed response;
- polished lab-notebook motivation layer;
- observed child usability checks.

## 20. Testing strategy

Testing should protect educational invariants without becoming a separate project.

### Unit tests

Protect:

- curriculum schema validity;
- mastery semantics;
- adaptive weighting;
- learner separation;
- migration;
- scheduler idempotence;
- misconception mapping;
- phenomenon state transitions;
- scoring provenance.

### Browser tests

Protect:

- learner picker;
- start/resume/pause;
- recovery;
- task-set reload;
- graph/model interactions;
- constructed response save/reload;
- 390 px portrait layout;
- keyboard access;
- sibling profile separation.

### Content tests

Protect:

- all 16 expectations;
- required SEP/CCC representation;
- minimum context diversity;
- no duplicate item IDs;
- no invalid answer keys;
- every wrong option has a remediation rationale once that milestone applies;
- phenomenon/task sets have complete step definitions;
- current-unit isolation rules.

### Human acceptance

Automated tests cannot prove:

- scientific explanation quality;
- whether a hint is actually helpful;
- whether Luke/Samantha understand the interaction;
- whether a session is too long;
- whether a phenomenon is interesting;
- whether the adaptive mix feels repetitive.

Record observed child feedback separately. Do not fabricate it.

## 21. Success metrics

Do not optimize primarily for time-on-site.

Useful measures:

- delayed independent retrieval success;
- transfer success after earlier instruction;
- decrease in repeated misconception frequency;
- proportion of previously weak concepts reaching retained/secure states;
- performance across representations, not just item accuracy;
- improvement in CER quality;
- ability to explain a concept verbally or in writing after a delay;
- low friction: normal session completion without navigation confusion;
- evidence that Luke and Samantha receive meaningfully individualized practice.

## 22. Anti-goals

Do not:

- rebuild Science Lab from scratch without a reproduced architectural reason;
- replace science with vocabulary drills;
- create hundreds of near-duplicate multiple-choice questions and call that depth;
- use an LLM as an opaque mastery grader;
- add gamification before the learning model is correct;
- expose internal heuristic scores as though psychometrically calibrated;
- reward speed;
- create sibling competition;
- introduce unsafe home experiments;
- broaden CI endlessly when a small invariant test will do;
- merge learner records;
- clear existing saved learner data without an explicit migration decision.

## 23. Source-of-truth files

A future agent should read these first:

1. `study/SCIENCE_LAB_HANDOFF.md` - current resume point.
2. `study/SCIENCE_LAB_MASTER_PLAN.md` - stable approved architecture and milestone plan.
3. `study/LOUISIANA_GRADE5_COVERAGE.md` - curriculum coverage contract.
4. `study/matter-lab.html` - current route shell.
5. `study/grade5-learning-core.mjs` - current adaptive/session engine.
6. `study/science-grade5-data.mjs` - science units and items.
7. `study/grade5-learning.css` - shared Grade 5 presentation.
8. `tests/science-grade5-coverage.test.mjs` - science coverage invariants.
9. `tests/grade5-learning-core.test.mjs` - adaptive core tests.
10. `tests/grade5-learning-browser.test.mjs` - learner separation/reload/browser contract.

Do not treat `study/QUALITY_HANDOFF.md` as the Science Lab handoff; it is for the Word Expedition project.

## 24. Agent operating procedure

At the start of every Science Lab work session:

1. Read `SCIENCE_LAB_HANDOFF.md`.
2. Read the relevant milestone in this plan.
3. Inspect the actual current files and branch state; do not assume an old chat or stale commit is current.
4. Preserve unrelated Study work.
5. Fix only the current milestone or a reproduced regression unless the owner broadens scope.
6. Keep migrations backward-compatible when learner data is involved.
7. Run proportionate tests for the changed invariant.
8. Update `SCIENCE_LAB_HANDOFF.md` with exact completed work, remaining gate, relevant commit, and next action before stopping.
9. Never mark a human/child/device acceptance gate complete without actual evidence.
10. If architecture changes materially, update this master plan; otherwise keep it stable.

## 25. Immediate implementation order

The approved near-term order is:

1. M1 evidence semantics + real adaptive weighting.
2. M2 misconception-aware remediation.
3. M3 graphs/models.
4. M4 phenomenon/task-set engine.
5. M5 CER/constructed reasoning.
6. M6 world-class Matter vertical slice.

Only then scale the architecture to the remainder of Grade 5.

This ordering is intentional: **fix the learner model first, prove the instructional architecture deeply in Matter, then scale.**
