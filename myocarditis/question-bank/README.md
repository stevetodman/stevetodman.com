# Pediatric Myocarditis ABP Question Bank

This directory contains a complete 100-question pediatric myocarditis board-review database generated from `../ABP_QUESTION_BANK_PROMPT.md`.

## Structure

- `manifest.json` — bank metadata, schema, coverage map, and rendering rules
- `sources.json` — evidence/source registry
- `stack-01.json` through `stack-10.json` — 10 questions per file, `MYO-001` through `MYO-100`

## Exam-mode rendering

Do **not** render the canonical stored A-E order directly. The UI should shuffle all five options for every question, remap the displayed A-E labels, and remap the displayed correct-answer letter. This avoids answer-position cueing while preserving a stable canonical database representation.

Hide these fields until grading:

- `answer`
- `rationale`
- `option_explanations`
- `board_pearl`
- `concept`
- `difficulty`
- `sources`

## Grading

For every answered question, display:

1. correct answer
2. learner answer
3. `rationale`
4. explanation for **every** answer option
5. `board_pearl`
6. tested `concept`
7. `difficulty`

The bank is designed for 10-question stacks but can be sampled adaptively by concept or difficulty.

## Difficulty

- `1` — foundational recognition
- `2` — standard ABP-level application
- `3` — challenging discrimination or multi-step reasoning

## Scope

The bank emphasizes general-pediatrics recognition and management of pediatric myocarditis rather than pediatric-cardiology fellowship trivia. Major domains include diagnosis, mimics, ECG/rhythm, biomarkers, echocardiography, CMR, shock, fluid pitfalls, escalation, mechanical support, prognosis, and return to sports.
