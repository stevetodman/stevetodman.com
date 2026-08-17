# AAA pediatric cardiology exam-room handoff

## Authoritative direction

Use Unreal Engine as the primary immersive runtime. Keep conventional product UI in the existing web stack if needed, but do not use React Three Fiber as the production renderer for the AAA room.

Build one pediatric cardiology exam room vertical slice plus only a shallow waiting-area sightline through its doorway. Do not expand to a general hospital, hallway network, or multiple rooms until this room passes benchmark review.

The detailed scope, visual target, architecture, asset tiers, and review gates are in `AAA_EXAM_ROOM_BENCHMARK_SPEC.md`.

## Current state

Gate 0 is now in the repo as review documents, not as photographs:

- `Documentation/GATE0_REFERENCE_BOARD.md` — photographic slots, material targets, license ledger, decision checklist
- `Documentation/GATE0_CIRCULATION_REVIEW.md` — v1 failures and v2 layout
- `CH_ExamRoom_Gate1_ClearancePlan.svg` — dimensioned plan of v2

The greybox is **layout v2**:

- Room still 4.27 m W × 3.96 m D × 2.74 m H
- Door still 0.91 m × 2.13 m, outswing into the waiting vignette
- Table on the north wall, head east, matching the PR #22 1.82 × 0.72 × 0.94 m envelope
- Workstation on the west wall, ECG cart and wall BP on the east wall
- Parent chair in the SE corner
- Stool in the south provider aisle
- Equipment still wireframe clearance envelopes, not production art

Layout v1 is recorded in the circulation review and must not be rebuilt as the default. v1 had an overlapping ECG, a 0.35 m staff pass, and seating in the door path.

The original committed spec, manifest, and builder had a shell-output prefix (`Exit code: 0` / `Wall time`) from the originating session. That prefix is removed.

## Rebuild the local package

From this folder, with Blender on PATH:

```text
blender --background --python build_exam_room_greybox.py
```

Output goes to `./generated`. Override with:

```text
blender --background --python build_exam_room_greybox.py -- --output D:/tmp/examroom
```

Renders are now 2560 × 1440 to match the spec. Circulation without Blender:

```text
python validate_exam_room_greybox.py
```

## Next assistant: required first steps

1. Do not start Gate 2 architecture until the Gate 0 checklist is signed in a PR comment.
2. Do not merge PR #22 (`agent/aaa-exam-table-asset`) as room-approved art. Reassess those assets at Gate 3 against the locked cameras.
3. If the user supplies clinic photographs, drop them into the R01–R10 slots and fill the license ledger. Do not scrape vendor catalogs.
4. If the user wants a larger room or a sink/casework run on the west wall, change `exam_room_greybox_layout.py` first, then rebuild.
5. Do not present clearance geometry as AAA art.

## Existing project caution

This branch was published in isolation from the interrupted material-generation work on `agent/aaa-exam-table-asset` (PR #22) and the Unreal scaffold on `agent/unreal-migration-scaffold` (PR #19 / #20). Integrate deliberately after reviewing those diffs.
