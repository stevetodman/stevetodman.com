# AAA pediatric cardiology exam-room handoff

## Authoritative direction

Unreal Engine is the immersive runtime. Blender is the source of truth for assets. Hunyuan3D is first-pass generation for discrete props only. Conventional product UI stays in the web stack. React Three Fiber is not the production renderer.

Build one pediatric cardiology exam room plus a shallow waiting-area sightline. Do not expand the hospital until this room passes benchmark review.

See:

- `Documentation/AAA_EXAM_ROOM_BENCHMARK_SPEC.md`
- `Documentation/AAA_DCC_PIPELINE.md`
- `Documentation/AAA_HUNYUAN_JOBS.md`

## Current state

Layout v2 + west-wall sink is accepted for greybox purposes (2026-08-17).

- 4.27 × 3.96 × 2.74 m room
- Door 0.91 × 2.13 m outswing
- Table on the north wall, head east
- West wall is one casework run: sink near the door, computer at the foot
- ECG cart and wall BP on the east wall
- Parent chair SE

Gate 2 has not started. No production architecture mesh exists yet.

## Integration gauntlet

Before importing a hero prop into the Unreal benchmark room, run:

```bash
python3 validate_exam_room_greybox.py
python3 validate_candidate_asset_fit.py
python3 validate_candidate_asset_fit.py --strict-candidates
```

The candidate contract is pinned to PR #22 head `d8945694694fee258af5f23534e252bf0b8d7a87` so cross-branch dimensions are explicit rather than inferred from screenshots.

Current deterministic result:

- Gate 1 circulation: 0 failures; one existing warning for the 0.425 m parked ECG/table gap.
- `CH-EXAMTABLE-001`: fits the locked table envelope and is eligible for the next in-room benchmark pass.
- `CH-WALLECG-001`: does not fit the current ECG envelope; width and projection from the east wall exceed the envelope even with the 5% tolerance used by the DCC rejection rule.
- Default evaluation stays green because the ECG remains `candidate_only`; strict-candidate mode intentionally fails until the asset or the explicitly reviewed room zone changes.

Do not enlarge the room or clearance envelope merely to make a candidate asset pass. Resolve the mismatch deliberately and rerun the circulation and locked-camera gates.

## Next assistant

1. Build the P0 architectural shell in Blender per `AAA_DCC_PIPELINE.md`. Do not Hunyuan the room.
2. Integrate the exam table candidate only after the shell is visible from the three locked cameras.
3. Keep the current Wall ECG candidate blocked until its fit mismatch is deliberately resolved and the strict evaluator passes.
4. Only then run remaining Hunyuan jobs HY-01…HY-05 as needed.
5. Do not present review stills or Hunyuan previews as shipped Unreal art.
