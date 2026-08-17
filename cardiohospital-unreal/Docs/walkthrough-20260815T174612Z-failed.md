# Walkthrough evidence — 2026-08-15T17:46:12Z

Failed record for the exact package
`PackagedBuilds/Mac-Development-20260815T171530Z`.

| Field | Value |
| --- | --- |
| Package ID | `CardioHospital-Mac-Development-facfa6d249f3-20260815T171530Z` |
| Source commit | `facfa6d249f31605549843d4e14c4148816c3f21` |
| Requested / recorded outcome | Failed / Failed |
| `walkthroughPassed` | false |
| `performanceCaptured` | false |
| Passed acceptance steps | 1, 2 |
| Performance numbers | none observed |

The recorder verified the package file hashes against the manifest before
writing the local JSON under `Saved/WalkthroughEvidence/`. That directory is
gitignored; this file is the committed summary.

## Observed

1. The exact 171530Z `.app` started without an Editor or missing-prerequisite
   error. Command line was `-ResX=2560 -ResY=1440 -WINDOWED`. Clinical content
   loaded seven cases.
2. The runtime blockout ward rendered (white walls, gray floor, daylight rig).

## Not observed or not implemented

- The first captured view already faced a wall/floor after mouse capture, so
  the reception-doorway spawn aim was not confirmed.
- No WASD navigation through the doorway, into the Cardiology Team Room, to
  Dr. Patel, or toward Exam Room 3.
- `E` never started `case-hcm` (no `StartCase` line in the game log).
- Step 5 (voice, gaze, listening, facial behavior) is unimplemented.
- Steps 8–19 are unimplemented.
- The live window did not land at 2560×1440. No FPS, frame-time, or memory
  artifact was captured.

Do not treat this file as a pass. The next human run should stay on this same
package and finish the implemented slice before any later learner-loop work.
