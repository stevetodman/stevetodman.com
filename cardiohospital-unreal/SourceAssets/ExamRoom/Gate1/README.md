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

## Next assistant

1. Build the P0 architectural shell in Blender per `AAA_DCC_PIPELINE.md`. Do not Hunyuan the room.
2. Only then run Hunyuan jobs HY-01…HY-05.
3. Keep PR #22 parked until the table is seen from the locked cameras inside this shell.
4. Do not present review stills or Hunyuan previews as shipped Unreal art.
