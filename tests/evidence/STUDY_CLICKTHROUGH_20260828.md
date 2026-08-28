# Hosted preview clickthrough — 28 August 2026

Build observed in the rendered page: `766ca936cf20`.
URL: https://study-quality-90-10-20260828.stevetodman-com.pages.dev/study/

This is an actual UI clickthrough in the remote Chrome browser, not another
automated-test run. Test activity stayed on the isolated preview. No production
save, cloud pairing, deployment, or real-money transaction was performed. No
hidden state was injected and no browser storage was cleared.

## Observed results

| Path | Result |
| --- | --- |
| Resume existing Luke round | Returned to question 2, with the first answer retained. |
| Wrong multiple-choice answer | Correct definition and explicit recovery action appeared. |
| Reload during correction | Returned home; Resume restored the same unresolved correction. |
| Retry scheduling | Missed scuffle returned at question 4; missed fragile returned at question 7. Round still ended at question 10. |
| Typed definitions, synonyms and antonyms | Accepted distribute, scuffle, brittle, temporary, blunder, tussle and collect on their corresponding prompts. |
| Alternate official correction | Fragile correction suggested weak; typing delicate was accepted. |
| Spelling audio failure | Hear word showed a clear unavailable message and usable tile fallback. No blocked round. This browser could not verify audible playback. |
| Partial spelling reload | Continuous remained in assisted mode with c-o-n already selected; completed remaining letters successfully. |
| Assisted answer feedback | Explicitly said that tiles do not earn a mastery day. |
| Final-question spelling recovery | Accepted blunder and completed the first round without an extra retry question. |
| First completed round | 5/10 first-try score saved. Its pause/reload/menu time exhausted the reward allowance; no shop opened. Rewards were retained. |
| Second completed round | Ten questions, 7/10 first-try score, +20 XP and +8 study coins, route 2/12, Level 2. |
| Shop preview and confirmation | Balance was 16 coins after two rounds. Copper Blade preview said no coins spent and retained 16. Use 8 coins changed balance to 8 and marked the blade Equipped. Unaffordable items stayed disabled. |
| Reward timeout | Summary and shop shared the shrinking allowance. Expiry returned to heroes. |
| Equipment persistence | After timeout and reload, Luke visibly carried the Copper Blade against the Trail 3 Rune Sentinel. |
| Profile separation | Samantha remained Level 1 / Trail 1 with starter gear. Her first correct answer saved independently and survived reload while waiting for Next. |
| Word review | All 12 words, definitions, assigned relations and example sentences rendered. Review audio failure showed a clear message; Back worked. |
| Device settings | Explicitly reported device-only preview saving; Done returned home. No production pairing was attempted. |
| Learning summary | Correct separate learner summaries and Luke's latest 7/10 result appeared. |
| Runtime errors | No app-origin errors in the inspected browser error log. Browser-extension metadata errors were present and excluded from app findings. |

## Timing and visual observations — not sign-off

The interrupted first round displayed 3m34s learning and 1m05s menus/rewards.
The uninterrupted second round displayed 2m13s learning and 0m15s menus/rewards.
These are rounded interaction estimates from a tool-driven test, not measurements
of a child's attention. The first route does NOT meet 90/10. The second is near
the target, but its rounded display is insufficient to certify the exact ratio.

The reward timer behaved as configured. In the second round it showed 14 seconds
on the summary, 11 on entering the shop, 5 during preview and 2 after confirmation.
This was enough to purchase one item, but whether it feels rushed remains an open
UX question; do not describe the timeout check as proof of enjoyment.

Live screenshots showed consistent forest, hero, monster and equipped-sword art,
with prompt and input together and no observed clipping at the desktop viewport.
The text Hear word wraps over two lines in its compact button; readable, but a
remaining minor polish candidate. No code was changed during this verification.

## Coverage limits and next test

- This pass completed two Luke rounds and started/resumed Samantha's first; it did
  not manually traverse all 12 adventures or complete Samantha's whole round.
- Boss, every equipment combination, free re-equip/cancel, fault injection and
  phone widths retain their separately recorded automated coverage. They were
  not all clicked again in this pass.
- Native iPhone/iPad keyboard, audible speech, production cross-device sync and
  actual child enjoyment/time were not validated here.
- App Store-quality, real-child 90/10 and release gates remain OPEN.
- Preview browser was left safely at home, with Luke's third round paused at
  question 1 and Samantha's first round paused after her correct first answer.

No new functional failure was found in the paths above. Preserve the current
branch and test saves. Continue with the device/family protocol in study/QUALITY_PLAN.md;
do not substitute more simulated time for the missing human evidence.
