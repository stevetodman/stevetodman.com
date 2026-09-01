# Math Mission — World-Class Child UX Plan

Status: **LOCKED IMPLEMENTATION PLAN**

## Mission

Build the best possible child learning experience for Luke and Samantha's current Grade 5 Eureka Math work, beginning with **Module 1, Lessons 1–2 / 5.NBT.1–2**.

The product should feel less like an adaptive quiz and more like a calm, intelligent personal math tutor that uses the same mathematical representations the children see at school.

## Scope lock

### In scope
1. Child-first mission entry and dashboard.
2. Interactive place-value workspace for current Lessons 1–2.
3. Better wrong-answer flow: diagnose -> scaffold -> guided success -> later independent recovery.
4. Clear progress that does not punish the learner visually for guided questions.
5. Excellent iPhone and iPad ergonomics, including Apple Pencil/freehand scratchwork.
6. Accessibility, keyboard support, reduced motion, and regression coverage.
7. Preserve the existing adaptive engine, cloud evidence, broad Module 1 diagnostic, curriculum alignment, and mastery model unless a UX requirement demands a carefully tested interface change.

### Explicitly out of scope
- Parent mode or parent dashboard redesign.
- New subjects or new Module 1 curriculum beyond what is required to support the current weekly experience.
- Badges, coins, streaks, avatars, leaderboards, confetti, artificial gamification, or reward economies.
- Chatbot UI.
- Rewriting the cloud architecture.
- Replacing the mastery algorithm.
- Decorative redesign for its own sake.
- Building every future manipulative now. Number lines, area models, tape diagrams, and division workspaces come only when their lesson becomes active.

If a proposed change does not improve the current child learning loop, it does not belong in this project.

---

## Product principles

### 1. One cognitive task at a time
The child should always know the single next action. Avoid dashboards full of instructional metadata, score labels, and adult-facing analytics.

### 2. Represent before explaining
When the school teaches place value with a chart, the product should let the learner **see and manipulate place value**, not merely read a paragraph about it.

### 3. Match classroom mathematical language
Use place-value units, powers of ten, digit value, and movement across a fixed decimal point. Avoid shortcut-first language such as "move the decimal" or "just add zeros."

### 4. Productive struggle without punishment
An incorrect answer should not immediately dump the correct answer. The system should first expose the misconception, provide the smallest useful scaffold, then require a guided action. A fresh independent recovery problem comes later.

### 5. Guidance fades
The sequence is:
**independent attempt -> targeted scaffold -> guided representation -> independent recovery -> transfer**.

### 6. Child progress is simple; internal mastery stays internal
Do not show child-facing numeric skill levels such as `40 -> 49`. Keep those values in the data model. Child-facing language should communicate learning state, e.g. `Got it`, `Building`, `We'll see this again`.

### 7. Guided work must not make the mission feel longer
The main progress indicator counts independent mission questions. Guided interventions visually branch from the current question and do not add to the denominator.

### 8. Calm beats stimulating
The visual system should feel focused, premium, and trustworthy: excellent typography, generous spacing, meaningful animation only, no visual reward noise.

---

# Target child journey

## A. Profile picker
Goal: identify learner and enter today's work with almost no cognitive load.

Keep:
- Luke / Samantha profiles.

Improve:
- one clear status line per child (`Ready for today's mission` / `Continue today's mission`).
- remove curriculum explanation from the child-facing picker.
- current-week curriculum detail can live as a quiet secondary label, not instructional prose.

Acceptance:
- child can identify profile in under 2 seconds.
- no adult analytics visible.

## B. Today's mission screen
Goal: one decision — start.

Primary card should show:
- `Today's Mission`
- `Powers of 10`
- `Lessons 1–2`
- estimated independent question count / approximate time
- one dominant `Start` button

Do not foreground:
- mastery counts
- micro-skill counts
- numeric levels
- full Module 1 skill matrix

Existing detailed skill analytics may remain in code but should not dominate the child experience.

Acceptance:
- profile -> mission start requires at most 2 deliberate taps.

## C. Learning screen
This becomes the flagship experience.

### Layout hierarchy
1. Progress: `3 of 8`
2. Skill cue: `Divide by powers of 10`
3. Problem
4. Mathematical workspace / representation
5. Answer action
6. Feedback

### Desktop / iPad
Problem and place-value workspace may share a wide two-column composition when that improves comprehension.

### iPhone
Use a single-column learning flow with a sticky bottom answer/action region. Workspace expands naturally and remains usable without tiny controls.

---

# Flagship feature: interactive place-value workspace

## Purpose
Make the current Lessons 1–2 concepts visible and manipulable.

## Required behavior
For powers-of-ten questions, render a fixed place-value chart with appropriate columns such as:

`thousands | hundreds | tens | ones | . | tenths | hundredths | thousandths`

The decimal point is visually fixed.

Digits are represented as movable tokens in their current place-value columns.

### Guided mode
For `x10`, `x100`, `x1000`, `÷10`, `÷100`, `÷1000`:
- show source digit positions.
- show the target direction and number of place-value shifts only after the learner needs help.
- allow the learner to move digits to their new columns.
- update place-value labels as digits move.
- make the relationship explicit: each move left makes the digit 10x as valuable; each move right makes it 1/10 as valuable.

### Independent mode
The representation should not give away the answer. It may be available as scratch/manipulative space but should not pre-position solution arrows.

### Error-analysis questions
When the prompt describes a student's misconception, the chart should make the mistake inspectable rather than merely textual.

### Non-negotiable
Never animate the decimal point moving. The digits change place value relative to a fixed decimal point.

---

# Wrong-answer UX

## Current problem
The existing flow immediately reveals the correct answer and worked explanation after an independent miss.

## Target flow

### Step 1 — Independent miss
Display:
- `Not yet.`
- short misconception-sensitive cue.
- no full answer yet.
- CTA: `Show me with the place-value chart`.

Record the independent miss exactly as today.

### Step 2 — Guided representation
Use the current or a closely matched problem structure.
Ask the learner to perform the key mathematical action in the workspace.

Examples:
- choose direction (`left` / `right`).
- choose number of shifts.
- move a digit into the correct column.
- identify how its value changed.

### Step 3 — Guided completion
After the representation is correct, show the equation and concise explanation.
Do not increase the independent progress denominator.

### Step 4 — Delayed recovery
Later in the same mission or next mission, present a fresh independent problem testing the same misconception.

This preserves the existing adaptive recovery concept while making the intervention pedagogically visible.

---

# Child-facing feedback language

## Correct
Prefer:
- `Yes.`
- `Exactly.`
- `You used place value correctly.`
- `That relationship is solid.`

Then one concise explanation if useful.

Do not show numeric mastery deltas.

## Incorrect
Prefer:
- `Not yet.`
- `Check what happens to each digit's value.`
- `Division by 100 should make the number smaller. Use the chart to see why.`

Do not initially reveal the answer.

## Recovery
Prefer:
- `You got it independently this time.`

---

# Progress UX

Replace tiny ambiguous progress pips as the primary signal with:
- explicit `3 of 8` text
- a quiet linear progress bar

Guided intervention:
- remains attached to the current independent item
- does not change `3 of 8` to `3 of 9`
- may show a secondary `Guided step` label

Success criteria:
- the learner always knows how much independent work remains.

---

# Mobile / iPad ergonomics

## iPhone
- single column.
- no tiny two-column answer choices.
- sticky bottom answer/check action when the keyboard is not obscuring it.
- minimum 44px touch targets; aim for 52px+ on primary controls.
- place-value chart must horizontally fit by using compact labels or controlled horizontal scrolling, never browser-scale shrinking.
- scratchwork can expand to a focused workspace.

## iPad
- use screen width aggressively.
- keep problem and workspace simultaneously visible where possible.
- Apple Pencil/freehand scratchwork remains first-class.
- avoid excessive vertical scrolling between problem, representation, and answer.

---

# Visual direction

Preserve the current restrained navy/blue visual identity.

Refine toward:
- stronger hierarchy
- less dashboard density
- more whitespace around the mathematical object
- fewer boxes competing for attention
- softer secondary chrome
- deliberate state transitions

Do not turn the product into a cartoon game.

Animation is allowed only when it teaches:
- digit shifts across place-value columns
- progress transition
- scaffold reveal

Respect `prefers-reduced-motion`.

---

# Implementation sequence

## Phase 1 — Child-first shell
1. Simplify post-profile dashboard to Today's Mission.
2. Remove child-facing mastery levels and numeric deltas.
3. Replace primary progress pips with `x of y` + progress bar.
4. Improve feedback copy and guided-state labels.
5. Add iPhone sticky action behavior.

**Gate:** existing adaptive behavior, persistence, cloud records, diagnostic, and accessibility tests remain green.

## Phase 2 — Lessons 1–2 place-value workspace
1. Build reusable `mission1-place-value.mjs` component.
2. Render fixed decimal point and labeled columns.
3. Render digit tokens from current question values.
4. Support instructional shift animation / manipulation.
5. Integrate with `powers_multiply` and `powers_divide` weekly questions.
6. Maintain plain answer-entry fallback for accessibility and non-pointer users.

**Gate:** deterministic unit tests for place-value state transitions plus browser tests on iPhone and iPad viewports.

## Phase 3 — Scaffolded miss flow
1. Independent miss no longer immediately reveals answer.
2. Route the miss into the place-value guided state.
3. Require one meaningful guided action.
4. Reveal concise worked relationship after guided completion.
5. Preserve delayed recovery logic and independent scoring semantics.

**Gate:** browser test proves miss -> guided manipulation -> completion -> fresh recovery while independent denominator remains unchanged.

## Phase 4 — Polish and device QA
1. Refine spacing/type/hierarchy.
2. Tune mobile keyboard behavior and sticky actions.
3. Tune Apple Pencil / touch interaction.
4. Ensure no horizontal page overflow at supported widths.
5. Validate reduced motion, keyboard-only, screen-reader labeling, high zoom.

**Gate:** full Site smoke, accessibility, Math Mission, and cloud suites green.

## Phase 5 — Real learner validation
Do not add speculative features.

Have Luke complete real sessions and evaluate:
- where he hesitates
- whether he uses the workspace voluntarily
- whether guidance clarifies the misconception
- whether recovery succeeds without guidance
- whether the mission feels too long

Only then change the next interaction.

---

# Acceptance definition for "world class"

The UX is not done because it looks polished. It is done when:

1. A child can start today's mission without interpreting adult analytics.
2. The current mathematical representation matches the classroom representation.
3. A place-value misconception becomes visible in the interface.
4. A miss triggers the smallest useful scaffold instead of immediate answer exposure.
5. Guidance fades and the learner later demonstrates the same concept independently.
6. Independent progress remains predictable even when remediation occurs.
7. iPhone is comfortable; iPad feels purpose-built rather than stretched mobile.
8. Accessibility is a first-class parallel interaction path.
9. Existing adaptive, curriculum, cloud, and regression protections remain intact.
10. New features are driven by observed learner friction, not feature accumulation.

---

# Drift rule

Before any implementation change, ask:

> Does this directly improve the child learning loop for the active curriculum, without weakening existing adaptive or regression guarantees?

If the answer is not clearly yes, do not build it.
