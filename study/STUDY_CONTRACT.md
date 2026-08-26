# Study product contract

This file defines the compatibility contract for `/study/`. Changes under `study/**` must preserve these rules unless the product owner explicitly changes the contract in the same reviewed change.

## Routing and installed app

- `/study/` is the current one-tap Unit 1 assignment, not the retired assignment-card hub.
- `/study/unit-1/` must remain directly usable.
- The installed PWA identity remains `./us-states.html` for migration compatibility, while its `start_url` and `scope` remain `/study/`.
- The Study manifest, HTML, JavaScript, and CSS must be revalidated after deployment so an installed Chromebook shortcut cannot remain indefinitely pinned to stale behavior.

## Learner progress

- `studyhub-word-expedition-unit1-v3` is the current local progress schema and has `version: 3`.
- `studyhub-word-mission-unit1-v2` is a compatibility key. Do not rename or remove it without a tested migration.
- Existing legacy progress must load without clearing localStorage or site data.
- Cloud profile keys `word-mission-unit1-luke` and `word-mission-unit1-samantha` are compatibility identifiers. Do not rename them without a coordinated server migration.
- `studyhubCloudToken` and the legacy `usStatesCloudToken` must not be cleared during ordinary upgrades.

## Assignment behavior

- A learner is one tap from question 1.
- A session is exactly 10 questions.
- Question 10 is the final checkpoint and cannot be replaced by retry scheduling.
- Teacher-listed synonyms and antonyms are all accepted as correct answers.
- Relation distractors may not contain another defensible teacher-listed answer for the current word.
- Mastery-day keys use the learner device's local calendar date, not UTC.
- There is an explicit post-test retention schedule after the spelling test date.
- Randomized ranking values are sampled before sorting; sort comparators must remain deterministic.

## Privacy and resilience

- Learner names must not be placed in page metadata.
- A cloud share token is bearer access: the UI must continue warning that anyone with the link can read and change family progress.
- A cloud outage must not prevent device-local practice or device-local saving.
- Do not clear browser storage as an update or troubleshooting strategy.

## Release gates

Every Study change must pass the dedicated `Study contract` workflow. That workflow runs Study-only regression/behavior tests. After a merge to `main`, it also verifies the live production `/study/` route and deployed Study assets.
