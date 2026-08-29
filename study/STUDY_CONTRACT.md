# Study product contract

This file defines the compatibility contract for `/study/`. Changes under `study/**` must preserve these rules unless the product owner explicitly changes the contract in the same reviewed change.

## Routing and installed app

- `/study/` is the current one-tap Unit 1 assignment, not the retired assignment-card hub.
- `/study/unit-1/` must remain directly usable.
- Past activities remain linked through Device settings → Past practice; archived activities return to `/study/archive/`.
- The installed PWA identity remains `./us-states.html` for migration compatibility, while its `start_url` and `scope` remain `/study/`.
- The Study manifest, HTML, JavaScript, and CSS must be revalidated after deployment so an installed Chromebook shortcut cannot remain indefinitely pinned to stale behavior.

## Learner progress

- `studyhub-word-expedition-unit1-v3` is the current local progress schema and has `version: 3`.
- `studyhub-word-expedition-game-unit1-v1` is the separate cosmetic game-progress schema. Game progression must never overwrite, weaken, or reinterpret the learning schema.
- `studyhub-word-mission-unit1-v2` is a compatibility key. Do not rename or remove it without a tested migration.
- Existing legacy progress must load without clearing localStorage or site data.
- Cloud profile keys `word-mission-unit1-luke` and `word-mission-unit1-samantha` are compatibility identifiers. Do not rename them without a coordinated server migration.
- `studyhubCloudToken` and the legacy `usStatesCloudToken` must not be cleared during ordinary upgrades.

## Game layer

- Each learner has a four-monster collection book, accessible only inside an earned store visit. Browsing and roar previews share the existing 50-second deadline; opening, closing or scrolling the book cannot pause, restart or extend it. There are no book links on home, questions or results. Completed battles, including corrected answers, add their monster to the existing idempotent reward record; per-monster counts survive cloud merges. Older unclassified battles are not guessed; an explicit saved boss victory unlocks the owl. Locked entries hide the name/story and cannot play sounds. Roars respect device mute and stop on navigation or store timeout. No extra questions, currency charges or random drops.
- Monsters have distinct visual behavior: a troll swipes and staggers, a wisp darts and fades, a golem cracks and slams, and the owl shields and casts. Each correct or recovered answer always clears one shield point; monster defenses never cancel a correct answer. Weapons have family-specific motions and shared visual/audio contact timing. Shields block, mail braces, cloaks evade, and charms or the star mantle deflect with a barrier. All of this is presentation only, with reduced-motion support and no extra input or wait before the next question.
- Equipped weapons have distinct, brief synthesized effects: sword swishes and metallic strikes, or a wand chime. Monsters counterattack with creature and armor-impact sounds, without reducing progress or delaying the next question. Spelling audio starts immediately at normal speed and prefers a local English voice. Device settings can mute effects without muting spoken questions. Effects stop for narration, navigation and hidden tabs; unavailable audio never blocks learning.
- The question is the combat action. There are no separate attack, defend, movement, or energy-grind turns.
- Every battle contains the same 10 questions as the assignment session. Equipment may change appearance and feedback, but never question count, mastery, difficulty, correctness, or rewards.
- The shop has 24 cosmetic items in four six-item shelves. Every item has its own sound preview, including unaffordable items; purchases still require the full coin price. Completed rounds earn 2–4 coins based on first-try correct answers, plus 3 per new mastery seal and 8 for a boss victory. Historical coin rewards, ownership and original prices are preserved.
- XP and study coins are earned only by completed learning sessions and newly earned mastery seals. Study coins can buy cosmetic gear. No real-money purchases, paid currency, subscriptions, payment checkout, ads or loot boxes.
- Currency, equipment, level, and reward details remain private until a learner selects their profile.
- Luke and Samantha keep independent wallets, equipment, rewards, and purchase histories.
- Game rewards use an idempotent per-session ledger so a repeated or merged cloud save cannot award the same session twice.
- The boss is a presentation of the normal ten-question session, not a gate to practice. A learner may face it at 12 seals, at 10 seals after the unit test date, or on the twelfth travel session. Finishing the adventure is distinct from mastering every word; missing seals remain available afterward.
- Both learners receive a full 50-second store visit after every completed session, including fast rounds. The timer starts on first store entry, not on the results screen; preview, cancel and purchase never restart it. The learning/play ratio is measured, not enforced by removing store access. Equipment selection cannot interrupt a question. Preview gear before spending earned study coins. Owned gear can be equipped free.
- An unconfirmed gear choice is a validated, learner-specific device-local bookmark. It survives timeout/reload and resumes only in the next earned reward break; it never spends coins, changes equipment, syncs to another device, or extends the play budget. Cancel and successful confirmation clear it.

## Assignment behavior

- The teacher handout is the sole canonical source for Unit 1 headwords, definitions, synonyms, antonyms, spelling, and parts of speech. Authored sentences and paragraphs may demonstrate those supplied meanings, but may not add or change an instructional relationship.
- Fill-in-the-blank meaning practice uses the complete 12-word bank. The shared context library contains five sentence forms per word and ten 12-for-12 paragraph forms. Per-learner rotation exhausts each sentence/paragraph bag before reuse, prevents an immediate repeat at a bag boundary, and varies paragraph answer positions so answer order cannot become the learned cue.
- Multiple-choice meaning practice uses short, authored monster dialogue containing the target word. These contextual answers still earn normal hits, coins and correct-answer counts, but do not add mastery days. Typed recall, spelling, retries and the final checkpoint keep their context-free prompts and existing mastery credit. Existing earned mastery is preserved. After a wrong attempt, monsters may give a cartoon insult followed by a model sentence using the word; no taunt or target-word reveal appears before a spelling/recall attempt. Dialogue is text-only, adds no turns and never delays spoken words. No insults about intelligence, reading ability, identity or real-world appearance.
- A learner is one tap from question 1.
- A session is exactly 10 questions.
- Question 10 is the final checkpoint and cannot be replaced by retry scheduling.
- Teacher-listed synonyms and antonyms are all accepted as correct answers.
- Meaning recall for Unit 1 headwords of six or more letters tolerates one omitted or doubled letter and displays the correct spelling. Substitutions, short words, synonyms, antonyms and spelling questions retain exact normalized matching. A tolerated meaning typo never creates spelling credit.
- Round summaries identify the words and skills practiced with help. Practice suggestions prioritize the latest unresolved skill mistakes; successful recall clears urgent priority. No arbitrary first-three-word list for new learners.
- Relation distractors may not contain another defensible teacher-listed answer for the current word.
- Mastery-day keys use the learner device's local calendar date, not UTC.
- There is an explicit post-test retention schedule after the spelling test date.
- Randomized ranking values are sampled before sorting; sort comparators must remain deterministic.

## Privacy and resilience

- Learner names must not be placed in page metadata.
- A cloud share token is bearer access: the UI must continue warning that anyone with the link can read and change family progress.
- Only existing, parent-provisioned cloud-save rows accept pushes. Unknown tokens receive `403 family_link_required`; the public endpoint cannot insert rows. Existing family tokens remain valid. Fresh devices use the private family link or practice locally.
- Requests are limited to 256 KiB of streamed UTF-8 bytes; merged saves are limited to 1 MiB. Rejected writes preserve the previous row and local progress; history is never silently trimmed to fit.
- A cloud outage must not prevent device-local practice or device-local saving.
- Do not clear browser storage as an update or troubleshooting strategy.

## Release gates

Every Study change must pass the dedicated `Study contract` workflow. That workflow runs fast Study unit checks and one focused Chromium smoke pass for the twins, stores, saves, audio and speech. Broader suites and WebKit remain available manually, not required on every family-app edit. The same job on `main` also verifies the live production `/study/` route and deployed Study assets.
