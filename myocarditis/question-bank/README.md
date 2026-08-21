# Pediatric Myocarditis ABP Question Bank

This directory contains the **v2.1 editorial draft** of the pediatric myocarditis board-review database generated from `../ABP_QUESTION_BANK_PROMPT.md` and rebuilt after a full medical/item-writing critique.

It is deliberately **not marked complete or published**. The core bank contains **60 questions in six 10-question stacks** (`MYO-001` through `MYO-060`). Repetitive stacks 7–10 from v1 were retired rather than preserved to satisfy an arbitrary question count.

## Current status

- Manifest status: `editorial-review-required`
- Independent pediatric cardiology / ABP-style SME review: pending
- Human item-writer review: pending
- Automated structural/browser validation: the dedicated myocarditis workflow has a verified green run on draft PR #77 (16/16 schema/editorial tests and 8/8 browser/UI tests); any subsequent content, renderer, or validation-harness revision must pass again before publication
- Psychometric validation: not performed
- Production merge: not appropriate until the review state is explicitly advanced

## Files

- `manifest.json` — bank metadata, review state, schema, blueprint, and rendering rules
- `sources.json` — evidence registry with source type, population, jurisdiction, primary-vs-overlay role, identifiers where verified, and verification date
- `stack-01.json` — recognition and close differentials
- `stack-02.json` — diagnostic testing and tissue characterization
- `stack-03.json` — heart failure, shock, disposition, complications, and mechanical support principles
- `stack-04.json` — arrhythmias and electrical instability
- `stack-05.json` — etiology, immunotherapy, genetics, and systemic mimics
- `stack-06.json` — recovery, follow-up, sports, recurrence, and integration
- `index.html`, `app.js`, `styles.css` — database-backed self-study renderer

## Answer architecture

The database does **not** store a canonical answer letter.

Each option has a stable semantic `id`, and each question stores `correct_option_id`. The browser shuffles option objects at render time and only then assigns displayed `A`–`E` labels. Grading and explanations are mapped from stable option IDs, so there is no raw all-A/all-B answer-position pattern to conceal.

On retake, choices are reshuffled again. If randomization happens to reproduce the exact prior order for a question, the renderer rotates that order once so the retry is visibly different while preserving semantic-ID grading.

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
4. learning objective
5. board pearl
6. tested concept, difficulty, and cognitive level
7. claim-level evidence mapping

## Item-writing rules

The v2.1 bank enforces these editorial principles:

- clinically competitive distractors rather than unrelated throwaway choices
- distinct learning objectives rather than superficial age/wording variants of the same question
- general-pediatrics decisions prioritized over fellowship-level procedural trivia
- explicit uncertainty when evidence is observational, evolving, or population-dependent
- current terminology, including the distinction between **myopericarditis** and **perimyocarditis**
- the current US competitive-athlete myocarditis framework, including phenotype-specific return timing rather than a universal 3–6-month rule
- full option explanations intended to teach why an answer is tempting, why it is or is not best, and when it would become appropriate

## Evidence model

Each question has an `evidence` array containing a concise claim and a `source_id`. Source IDs resolve in `sources.json`.

The source registry now records:

- source type
- population scope
- jurisdiction
- primary pediatric evidence versus adult/general overlay
- DOI/PMID when verified and appropriate
- clinical role in the bank
- `last_verified`

Pediatric sources are preferred for pediatric claims. Adult/general guidance is explicitly labeled as an **overlay** rather than silently treated as pediatric primary evidence. For example, the LV-thrombus statement is used only for the general principle of managing an established thrombus; pediatric medication choice and duration remain specialist-dependent.

## Validation

`tests/myocarditis-question-bank.test.mjs` checks database integrity, including:

- exactly 60 unique sequential IDs
- six active stacks and retired v1 padding stacks absent
- exactly five stable option IDs per question
- no legacy `answer: "A"`-style fields
- every `correct_option_id` resolves
- every option has an explanation
- every evidence source resolves and placeholder-style source IDs are rejected
- all questions remain explicitly SME-gated with no completed medical-review date
- no superficial duplicate stems or normalized learning objectives
- prior throwaway-distractor vocabulary absent
- advanced ECMO unloading mechanics absent from core learner targets
- difficulty distribution within editorial tolerance
- source provenance/population/jurisdiction/overlay metadata present

`tests/myocarditis-question-bank-ui.test.mjs` checks that the browser renderer:

- loads the v2.1 manifest and all six stacks
- renders 10 questions with five choices each
- keeps grading content and learning objectives concealed until submission
- blocks incomplete submissions
- uses stable option IDs rather than A–E as stored values
- grades a complete stack correctly after option randomization
- maps wrong semantic option IDs back to the correct displayed learner/correct A–E labels
- reveals full explanations and learning objectives only after grading
- guarantees a visibly different option order on retake and hides prior feedback again
- advances to the next declared stack and renders a fresh 10-question exam state

The dedicated workflow runs these checks for relevant feature-branch/main pushes and pull requests. Changes to the shared test harness also trigger the workflow.

## Publication rule

Automated tests are necessary but not sufficient. Do not change the manifest to `published` solely because the tests pass. Independent clinical/item-writing review is required, and no psychometric performance claims should be made until learner data exist.
