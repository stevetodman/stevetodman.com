# Walkthrough evidence — 2026-08-18T14:50:02Z

Failed record for the exact package
`PackagedBuilds/Mac-Development-20260818T143911Z`.

| Field | Value |
| --- | --- |
| Package ID | `CardioHospital-Mac-Development-0e7377b4ecc6-20260818T143911Z` |
| Source commit | `0e7377b4ecc66ab08532aa8986d0c59fe4a979db` |
| Requested / recorded outcome | Failed / Failed |
| `walkthroughPassed` | false |
| `performanceCaptured` | false |
| Passed acceptance steps | 1, 2 |
| Observed window | 1440×1112 |
| Requested window | 2560×1440 |
| Performance numbers | none observed |

The recorder verified the package file hashes against the manifest before
writing the local JSON under `Saved/WalkthroughEvidence/`. That directory is
gitignored; this file is the committed summary.

## Observed

1. The exact 143911Z `.app` started without an Editor or missing-prerequisite
   error. Command line was `-ResX=2560 -ResY=1440 -WINDOWED`. Clinical content
   loaded nine cases. Engine init was 1.12 seconds.
2. The packaged clinic rendered: white walls, tiled floor, desks, monitors,
   ceiling lights, and a labeled Dr. Patel actor. The HUD offered click-to-walk
   destinations: Team Room, Exam Room 3, Room 1, ECG / Echo.

## Log-only, not accepted as walkthrough steps

- `case-hcm` started from the team-room assignment about ten seconds after
  launch. That is not a human Patel engagement pass.
- Patel used the temporary generic doctor mesh
  (`SK_GenericDoctor`), not a packaged MetaHuman voice/gaze/face pass.
- Live window bounds were 1440×1112. The engine also reported
  `systemresolution` 1440×1080 after a `r.setres=1280x720` override. The
  2560×1440 gate was not met.

## Not observed

- WASD / natural look through the doorway into the team room.
- Human assignment of the exertional-syncope case.
- Navigation to Exam Room 3, Marcus/parent interaction, history, exam,
  ECG/echo review, return, diagnosis, management, debrief, persist, or
  contrastive next case.
- Any FPS, frame-time, or memory capture.

`CardioBlockoutGameMode` still owns `bParentSteppedOut`. The surgical
replacements in `Docs/MAC_MERGE_GAME_MODE.md` have not been applied.

Do not treat this file as a pass. The next human run can stay on this same
package for a WASD pass. A new package is required after the GameMode merge
edits or any Patel voice/face work.
