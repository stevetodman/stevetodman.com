# Word Expedition game layer

Status: implementation plan for the Unit 1 vertical slice.

This plan adds a polished adventure presentation to the existing ten-question
learning loop without changing the learning, mastery, privacy, or compatibility
contracts in `STUDY_CONTRACT.md`.

## Product rule

The question is the combat action. There is no separate combat mode.

- Every expedition remains exactly ten questions.
- Every completed question removes exactly one of a monster's ten shield points.
- A correct first response produces a critical-hit presentation.
- A response corrected after feedback produces a normal-hit presentation.
- A miss is blocked; it never removes coins, XP, health, or prior progress.
- Equipment changes character art, attack presentation, and celebration only.
- Equipment never changes question count, difficulty, selection, scoring, or mastery.

The game layer is therefore motivational feedback around retrieval rather than
a second activity competing with retrieval.

## Progress model

The existing mastery trail remains the academic source of truth. Game state is
stored separately so no update can corrupt or reinterpret learner statistics.

| Track | Source | Persistence | Purpose |
| --- | --- | --- | --- |
| Mastery seals | Existing `wordLevel()` rules | Existing v3 learner schema and cloud merge | Honest word mastery |
| Path step | Completed ten-question expeditions | Game-state schema | Visible journey progress |
| XP and level | Completed expeditions plus first-time mastery | Game-state schema | Permanent hero growth |
| Coins | Completed expeditions plus first-time mastery | Game-state schema | Player-selected equipment |

The two learners have private, independent game profiles. Their currency and
equipment never appear side by side on the profile picker.

### Initial economy

- Complete ten questions: 20 XP and 8 coins.
- Each new mastery seal in that expedition: 15 XP and 5 coins.
- Level is derived from lifetime XP using a small increasing threshold table.
- Coins are never removed except by an explicit purchase.
- No daily login reward, streak loss, random loot box, paid currency, trading,
  or player-versus-player system.

Prices are chosen so the first expedition can purchase one visible item while
larger items require saving:

- Common weapon: 8-12 coins.
- Hat or armor appearance: 16-24 coins.
- Premium armor appearance: 24 coins.

## Unit journey

Unit 1 uses one reusable illustrated route with twelve seal positions and four
encounter landmarks. Session completion advances travel; mastery fills seals.

- Sessions 1-3: woodland approach.
- Sessions 4-6: river crossing.
- Sessions 7-9: ruined gate.
- Sessions 10-12: castle approach.
- The final encounter presentation unlocks at 12/12 seals or on the final study
  day at 10/12 seals.
- Completing the final mixed review wins the narrative level.
- Missing seals remain missing until the existing mastery rule is satisfied.

Unit completion never falsifies mastery and mastery never traps a child outside
the story ending.

## Vertical-slice content

The slice intentionally proves the reusable visual and interaction system
instead of creating a weekly art treadmill.

- One responsive route map.
- One modular hero body rendered in two profile palettes.
- Three purchasable weapons.
- Three purchasable head/armor appearances.
- Three reusable monster variants.
- One boss treatment assembled from the same visual system.
- Reusable critical, blocked, hit, reward, purchase, level-up, and victory motion.
- One six-item merchant shelf shown only after an expedition.

No class statistics, inventory grid, health system, defend button, battle
energy, random drops, free-roaming map, or new weekly map exists in this slice.

## Interaction flow

1. Learner taps their existing profile card.
2. The question screen shows the learner's hero, current enemy, ten shield
   segments, level, and the existing question UI.
3. The answer is graded by the unchanged learning engine.
4. The battle stage presents a brief critical, block, correction, or hit state.
5. Question ten defeats the enemy and opens the existing summary.
6. Summary awards XP, coins, new seals, and path movement exactly once.
7. The learner may finish immediately or open the six-item merchant shelf.
8. Clearly priced purchase and equip actions each take one tap and confirm with
   a toast.

The primary learning controls remain first in reading and focus order. Motion is
non-blocking, skippable by continued interaction, and disabled when the learner
prefers reduced motion.

## State and migration

The existing keys and `version: 3` learning schema remain unchanged.

New local key: `studyhub-word-expedition-game-unit1-v1`.

Each learner stores only bounded data:

```json
{
  "rewards": {},
  "sessionsCompleted": 0,
  "bossDefeatedAt": null,
  "owned": ["starter-sword", "starter-cloak"],
  "equipped": { "weapon": "starter-sword", "armor": "starter-cloak" },
  "purchases": {}
}
```

XP and earned coins are derived from the union of session reward records, while
spent coins are derived from the stable prices of purchased item IDs. This means
cloud merge cannot lose progress made concurrently on two devices. Purchase IDs
make a purchase idempotent. Owned item identifiers are allow-listed on load so broken
or obsolete values cannot damage rendering. Invalid game state falls back to a
new game profile without touching learning progress.

## Quality gates

### Gate 1: compatibility

- Existing Study tests pass unchanged.
- Ten questions remain ten questions.
- Question ten remains the final checkpoint.
- Existing local and cloud learning progress loads and saves.
- The learner remains one tap from question one.

### Gate 2: game-state integrity

- Profiles remain independent.
- Rewards are applied once per completed session.
- Reloading cannot duplicate XP, coins, purchases, or equipped items.
- Unaffordable and duplicate purchases are rejected.
- Invalid stored item IDs recover safely.

### Gate 3: learning integrity

- Equipment never changes the question plan or accepted answers.
- Assisted spelling never receives mastery credit.
- Correction and retry scheduling remain unchanged.
- Both correct and corrected responses advance exactly one shield point.

### Gate 4: interaction quality

- Complete keyboard operation and visible focus.
- Announced reward, purchase, level-up, and error states.
- Touch targets at least 44 CSS pixels.
- No horizontal overflow at 320, 375, 390, 768, or 1024 CSS pixels.
- Reduced-motion mode removes battle movement without hiding state changes.
- High-contrast and forced-colors modes retain understandable controls.

### Gate 5: visual quality

- Character, equipment, enemies, map, and merchant share one palette, outline,
  lighting, and shape language.
- Equipped layers align at all supported sizes.
- Text remains legible over every game background.
- No generated text is embedded in artwork.
- Loading, empty, unaffordable, owned, equipped, offline, and save-failure states
  are intentionally styled.

### Gate 6: release

- Dedicated Study suite passes.
- Full repository test suite passes.
- Production build passes.
- Automated browser flow completes an expedition, earns rewards, purchases and
  equips an item, reloads, and confirms persistence.
- Browser console and failed-request checks remain clean apart from intentionally
  simulated offline cloud requests.

Implementation stops at the first failing gate, fixes the defect, and repeats
that gate before continuing.
