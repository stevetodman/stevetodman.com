# Pediatric Myocarditis ABP Question Bank

This directory contains the **v2 editorial draft** of the pediatric myocarditis board-review database generated from `../ABP_QUESTION_BANK_PROMPT.md` and rebuilt after a full medical/item-writing critique.

It is deliberately **not marked complete or published**. The core bank now contains **60 questions in six 10-question stacks** (`MYO-001` through `MYO-060`). Repetitive stacks 7–10 from v1 were retired rather than preserved to satisfy an arbitrary question count.

## Current status

- Manifest status: `editorial-review-required`
- Independent pediatric cardiology / ABP-style SME review: pending
- Human item-writer review: pending
- Automated structural/browser validation: included in `tests/`
- Psychometric validation: not performed
- Production merge: not appropriate until the review state is explicitly advanced

## Files

- `manifest.json` — bank metadata, review state, schema, blueprint, and rendering rules
- `sources.json` — evidence registry with population scope and verification date
- `stack-01.json` — recognition and close differentials
- `stack-02.json` — diagnostic testing and tissue characterization
- `stack-03.json` — heart failure, shock, disposition, and mechanical support
- `stack-04.json` — arrhythmias and electrical instability
- `stack-05.json` — etiology, immunotherapy, and systemic mimics
- `stack-06.json` — recovery, follow-up, sports, recurrence, and integration
- `index.html`, `app.js`, `styles.css` — database-backed self-study renderer

## Answer architecture

The database does **not** store a canonical answer letter.

Each option has a stable semantic `id`, and each question stores `correct_option_id`. The browser shuffles option objects at render time and only then assigns displayed `A`–`E` labels. Grading and explanations are mapped from stable option IDs, so there is no raw all-A/all-B answer-position pattern to conceal.

This design prevents the v1 failure mode in which later stacks had highly biased canonical answer positions.

## Exam-mode rendering

Hide these fields until grading:

- `correct_option_id`
- `rationale`
- `option_explanations`
- `board_pearl`
- `evidence`
- `concept`
- `learning_objective`
- `cognitive_level`
- `difficulty`
- editorial review metadata

The included browser renderer follows those rules in the visible UI. Because the JSON is ultimately delivered to the browser, this is a **self-study interface rather than a secure examination environment**.

## Grading-mode rendering

After submission, display:

1. learner answer and correct displayed answer
2. overall rationale
3. explanation for **every** option
4. board pearl
5. tested concept and learning objective context
6. difficulty/cognitive level
7. claim-level evidence mapping

## Item-writing rules

The v2 bank enforces these editorial principles:

- clinically competitive distractors rather than unrelated throwaway choices
- distinct learning objectives rather than superficial age/wording variants of the same question
- general-pediatrics decisions prioritized over fellowship-level procedural trivia
- explicit uncertainty when evidence is observational, evolving, or population-dependent
- current terminology, including the distinction between **myopericarditis** and **perimyocarditis**
- current-source context for return-to-sport recommendations rather than a timeless calendar-only rule
- full option explanations intended to teach why an answer is tempting, why it is or is not best, and when it would become appropriate

## Evidence model

Each question has an `evidence` array containing a concise claim and a `source_id`. Source IDs resolve in `sources.json`, which records the source's population scope and role.

Pediatric sources are preferred for pediatric claims. Adult guidance such as the 2024 ACC myocarditis pathway is explicitly labeled as an adult **overlay** rather than silently treated as pediatric primary evidence.

## Validation

`tests/myocarditis-question-bank.test.mjs` checks database integrity, including:

- exactly 60 unique sequential IDs
- six active stacks and retired v1 padding stacks absent
- exactly five stable option IDs per question
- no legacy `answer: "A"`-style fields
- every `correct_option_id` resolves
- every option has an explanation
- every evidence source resolves
- no digit-only superficial duplicate stems
- banned throwaway-distractor vocabulary absent
- difficulty distribution within editorial tolerance
- adult guidance labeled as an overlay

`tests/myocarditis-question-bank-ui.test.mjs` checks that the browser renderer:

- loads the v2 manifest and all six stacks
- renders 10 questions with five choices each
- keeps grading content out of the visible question cards until submission
- uses stable option IDs rather than A–E as stored values
- can grade a complete stack correctly after option randomization

## Publication rule

Automated tests are necessary but not sufficient. Do not change the manifest to `published` solely because the tests pass. Independent clinical/item-writing review is required, and no psychometric performance claims should be made until learner data exist.
