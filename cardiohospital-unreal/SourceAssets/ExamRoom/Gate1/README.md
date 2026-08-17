# AAA pediatric cardiology exam-room handoff

## Authoritative direction

Use Unreal Engine as the primary immersive runtime. Keep conventional product UI in the existing web stack if needed, but do not use React Three Fiber as the production renderer for the AAA room.

Build one pediatric cardiology exam room vertical slice plus only a shallow waiting-area sightline through its doorway. Do not expand to a general hospital, hallway network, or multiple rooms until this room passes benchmark review.

The detailed scope, visual target, architecture, asset tiers, and review gates are in `AAA_EXAM_ROOM_BENCHMARK_SPEC.md`.

## Current state

This branch adds a provisional **Gate 1 architectural greybox**:

- Room: 4.27 m W × 3.96 m D × 2.74 m H
- Door clear opening: 0.91 m × 2.13 m
- Window opening: 1.80 m × 1.20 m
- Equipment represented only as labelled wireframe clearance envelopes
- Three benchmark cameras plus a clearance-plan camera
- Neutral temporary lighting only

The greybox is deliberately not final art. It revealed that this footprint is busy with all six equipment envelopes. Review dimensions and circulation before modeling production architecture or props.

## Rebuild the local package

Run `build_exam_room_greybox.py` with Blender's Python. Before running, change its `OUTPUT` path to a writable local folder. It produces the Blender source, FBX, GLB, PNG review renders, and manifest.

## Next assistant: required first steps

1. Read the benchmark spec in full.
2. Treat the current room dimensions and object positions as provisional—not clinical approval.
3. Create a photographic reference board and validate circulation before moving to Gate 2.
4. Build the production architectural shell in Unreal: painted drywall, wall protection, baseboards, realistic trim, acoustic ceiling grid, troffers, HVAC, sprinklers, and speakers.
5. Establish calibrated clinical lighting and materials before detailed hero assets.
6. Do not present the Gate 1 clearance geometry as AAA art or as final equipment.

## Existing project caution

This handoff was published as an isolated branch to avoid mixing it with separate interrupted material-generation work in the local checkout. Integrate deliberately after reviewing the diff.
