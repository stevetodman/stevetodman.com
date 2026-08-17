# Surgical edits in `CardioBlockoutGameMode` after the merge

Do this **after** `git merge origin/agent/launch-set-msk-htn` compiles.
Keep every spawn/lighting/Patel function. Only change how clinical text
is chosen.

The Mac header already names the functions. Edit these and nothing else.

## Delete one member

In `CardioBlockoutGameMode.h`:

```
bool bParentSteppedOut = false;
```

Confidential gating now lives on `history.confidential-interview` in the
graph. A second flag will desync the HUD from the runtime.

## Replace these helpers

| Mac function | After merge |
| --- | --- |
| `HasPendingConfidentialHistory()` | `Runtime->GetAvailableActions().Contains("history.confidential-interview")` |
| `ShouldOfferHistoryAction(Action)` | Trust `GetAvailableActions()`. Spent and gated actions are already gone. |
| `LabelForAction(Action)` | `GetActionMenu()` item with the same `Id`. Do not write new label strings. |
| `ResultForAction(Action)` | For `history_question`, last revealed history answer. For exam, `GetRevealedExam()`. For `review.ecg` / `review.echo`, `GetRevealedEcg` / `GetRevealedEcho` only if `HasReviewedTest`. |
| `CollectSocraticLines()` | `GetPresentationState().Socratic` — empty until `reasoning.submit` |
| `ShowDiagnosisMenu()` | `GetPresentationState().DiagnosisChoices` — empty until the learner is back with Patel |
| `ShowDebrief()` | `EvaluateCurrentAttempt` then `Debrief.SummaryFeedback` plus `Debrief.Dimensions` (11 entries, including `differentialDiagnosis`). `TeachingPoint` / `CorrectDiagnosis` only from `GetPresentationState()` after `debrief.review`. |
| `ShowEcgReview()` / `ShowEchoReview()` | `GetRevealedEcg` / `GetRevealedEcho`. If `bRevealed` is false, show “not reviewed yet”, never `GetActiveClinicalCase().Ecg`. |

## Replace the parent-step-out branch

In `HandleChooseAction`, this block:

```
if (ActionId == TEXT("__parent_step_out"))
{
    bParentSteppedOut = true;
    ShowHistoryMenu();
    return;
}
```

becomes:

```
if (ActionId == TEXT("history.confidential-interview"))
{
    TryPerformAction(TEXT("history.confidential-interview"));
    ShowHistoryMenu();
    return;
}
```

`__talk` / `__examine` hubs can stay as local navigation **only if**
their child lists come from `GetActionMenu()` filtered by `Type`
(`history`, `exam`, `order`, `review`, `management`).

## Build every numbered list from the menu

```
const FCardioPresentationState View = Runtime->GetPresentationState();
CurrentMenuActions.Reset();
TArray<FString> Lines;
Lines.Add(/* header from View.Assignment.ChiefComplaint or phase */);
for (const FCardioActionMenuItem& Item : View.Menu)
{
    if (/* optional type filter for this panel */)
    {
        CurrentMenuActions.Add(Item.Id);
        Lines.Add(FString::Printf(TEXT("[%d]  %s"), CurrentMenuActions.Num(), *Item.Label));
    }
}
Hud->ShowPanel(Lines);
```

History `Label` is the authored question. It will never contain the
sudden-death answer. Do not append `Action.Target` answers yourself.

## Do not

- Call `GetActiveClinicalCase()` to fill a panel. Room matching in
  `IsAssignedExamRoomLocation` may still read `.Room`.
- Hardcode “Ask parent to step out”. The menu label is already authored.
- Show `CorrectDiagnosis` or `TeachingPoint` before `debrief.review`.
- Invent ECG/echo text. If `HasReviewedTest` is false, there is no result.

## Verify

```
npm run test:unreal
./Scripts/run-first-build.sh
```

Then walk: assign HCM → Exam Room 3 → generic history must not mention
the uncle/brother death → parent step-out unlocks stimulant use →
order echo without seeing the HCM echo summary → return → diagnosis
list is the authored differentials → debrief shows eleven dimensions.
