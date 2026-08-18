# Next agent — start here

Session date: 2026-08-18. M4 Max. Branch `mac/integrate-launch-set`.

## What you are building

Packaged outpatient slice: team room → Patel assigns HCM → Exam Room 3
→ Marcus + parent → debrief → vasovagal contrast in Room 1.
Acceptance is the 19-step packaged walkthrough at 2560×1440.
`walkthroughPassed` is still false.

## Current Mac state (2026-08-18)

- Merge of #24 into the Mac world branch is committed as `0e7377b`.
- Package exists:
  `PackagedBuilds/Mac-Development-20260818T143911Z/CardioHospital.app`
- Honest packaged launch recorded in
  `Docs/walkthrough-20260818T145002Z-failed.md`. Steps 1–2 only.
- Live window was 1440×1112, not 2560×1440.
- Patel is still the temporary generic doctor mesh.
- `bParentSteppedOut` is still in `CardioBlockoutGameMode`. Apply
  [`MAC_MERGE_GAME_MODE.md`](MAC_MERGE_GAME_MODE.md) before trusting
  the #24 confidential-interview / action-menu HUD path.

If you are on this Mac, do **not** re-merge. Do the GameMode edits,
repackage, then a human WASD pass of that new `.app`.

Authoritative spec: `LegacyCore/plan.md` (168 sections).
Ledger: `SPEC_TRACEABILITY.md`. Do not invent structured results.
Do not Hunyuan the room. Do not add a second MetaHuman before step 5.

## Do this first (the user is often not at the Mac)

If you are on the **M4 Max**, follow
[`MAC_FIRST_SESSION.md`](MAC_FIRST_SESSION.md) then
[`MAC_MERGE_GAME_MODE.md`](MAC_MERGE_GAME_MODE.md).

If you are **not** on the Mac, do not start a Windows graybox.
Portable clinical work on PR #24 is largely done. Further graphs
are not the finish line.

## Branch map

| PR | Branch | Role |
| ---: | --- | --- |
| #20 | `claude/github-work-yesterday-62xjvk` | Mac world: packaged `.app`, ward, Patel, E-key loop |
| #24 | `agent/launch-set-msk-htn` | Clinical core: 9 cases, disclosure, 11 scores, HUD APIs |
| #19 | `agent/unreal-migration-scaffold` | Shared Unreal scaffold both PRs target |
| #23 | `agent/aaa-exam-room-benchmark-handoff` | Exam-room AAA spec. Isolated. Parked. |
| #22 | `agent/aaa-exam-table-asset` | Table. Parked until cameras locked. |

**Biggest remaining job:** merge #24 into #20 on the Mac. Keep Mac
world files. Keep #24 clinical APIs (`GetPresentationState`,
`GetActionMenu`, `GetRevealed*`, `SummaryFeedback`, 9-case contract).
In `CardioBlockoutGameMode.cpp` delete `bParentSteppedOut` and drive
menus from `GetActionMenu()`.

## What this session already landed (PR #24)

- Nine ready graphs including MSK chest pain and adolescent HTN/ABPM
- Confidential interview gate (HCM, vasovagal, myocarditis, HTN)
- All 11 scoring dimensions including `differentialDiagnosis`
- History / exam / result disclosure
- Presentation state hides diagnosis until debrief
- Authored menu labels; spent actions drop off
- `SummaryFeedback` from authored text only
- Mac-first docs: `MAC_FIRST_SESSION.md`, `MAC_MERGE_GAME_MODE.md`, ADR-0002

Portable Node suite: **67/67**. Clinical CI on #24 was green.

## Constraints that stay in force

- Clinical truth only in `LegacyCore` → generated `clinical-content.json`
- 41 authoring warnings remain. Do not invent structured results.
- Formal medical review still pending
- PR #22 / #23 stay parked
- Patel is the only MetaHuman gate (ADR-0001 §4)

## After the merge compiles

1. Human walk of the **exact packaged `.app`**
2. Honest Failed record if step 5 (voice/face) is still short
3. Then Patel packaged voice / listen / gaze / face — not Marcus
4. Then 2560×1440 performance capture on Apple silicon
5. Only then consider P0 Blender props / #23 cameras

## Do not tell the user the slice is done

No packaged 19/19 pass exists. No passing FPS capture exists.
Browser and review stills are not shipped art.
