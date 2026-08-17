# Gate 0 — Circulation review

Status: **v1 fails**. **v2 is the new provisional greybox**. Neither is clinical approval.

Coordinates are metres, room-centered, `Z` up, finished floor at `Z = 0`. Interior clear is 4.27 wide × 3.96 deep. Walls are 0.12 thick and sit on the exterior of that clear box.

```
X: -2.135 (west)  →  +2.135 (east)
Y: -1.980 (south / door) → +1.980 (north / window)
```

## Method

Axis-aligned envelopes from `build_exam_room_greybox.py` were converted to floor AABBs. Fail means two review envelopes occupy the same floor, a required aisle is narrower than its target, or the 36 in door approach is blocked. Warn means a parked cart sits closer than 0.76 m to another object but is intended to be used at the table.

Targets:

| Check | Fail if |
| --- | --- |
| Envelope overlap | intersection area > 0 |
| Provider working aisle | < 0.91 m on the south side of the table |
| Staff pass | < 0.76 m between workstation and table |
| Door clear | any seating or stool AABB intersects the 0.91 m door leaf in plan |
| Turning space | no 1.52 m circle exists in the south-center clear floor |

Run the same numbers on a workstation with Python 3:

```text
python cardiohospital-unreal/SourceAssets/ExamRoom/Gate1/validate_exam_room_greybox.py
```

## Layout v1 (as published this morning)

| Zone | Center (x, y) | Size (x, y) | Floor AABB |
| --- | --- | --- | --- |
| Exam table | 0.48, 0.34 | 1.85 × 0.78 | −0.445..1.405, −0.050..0.730 |
| Workstation | −1.42, 0.92 | 1.25 × 0.62 | −2.045..−0.795, 0.610..1.230 |
| ECG | 1.62, 0.72 | 0.90 × 0.45 | 1.170..2.070, 0.495..0.945 |
| Blood pressure | 1.62, −0.78 | 0.48 × 0.48 | 1.380..1.860, −1.020..−0.540 |
| Parent chair | −1.43, −0.62 | 0.78 × 0.82 | −1.820..−1.040, −1.030..−0.210 |
| Physician stool | 0.15, −0.98 | 0.58 × 0.58 | −0.140..0.440, −1.270..−0.690 |

Findings:

1. **FAIL — ECG overlaps the exam table** by about 0.24 × 0.24 m.
2. **FAIL — staff pass** between workstation and table is 0.35 m.
3. **FAIL — stool sits in the door path.** Stool south edge is 0.71 m from the door wall; the 0.91 m door opening is at x = −1.505..−0.595 and the stool occupies the first step inside the room.
4. **FAIL — parent chair crowds the door.** Chair AABB x = −1.82..−1.04 shares the door x-range; the chair starts 0.95 m inside the threshold.
5. **FAIL — provider aisle.** Table south edge is at y = −0.05. A 0.91 m aisle would run to y = −0.96 and is occupied by the stool.
6. **WARN — dedicated BP island** is atypical. Outpatient pediatric cardiology almost always uses a wall aneroid or a cuff on the table. The 0.48 m island buys almost no clinical value and spends circulation.
7. Door outswing into the waiting vignette is correct and should be kept.

This is the “busy with all six envelopes” note from the original handoff, now measured.

## Layout v2 (current greybox)

Same room. Same door and window. Equipment is pulled to walls and oriented so the provider stands on the patient’s right with the head of the table east (window).

| Zone | Center (x, y, z) | Size | Role |
| --- | --- | --- | --- |
| Exam table | 0.35, 1.47, 0.47 | 1.82 × 0.72 × 0.94 | 0.15 m off the north wall; matches PR #22 dimensions |
| Workstation | −1.825, 0.55, 0.625 | 0.62 × 1.25 × 1.25 | West-wall casework at the foot |
| ECG cart | 1.91, 1.47, 0.70 | 0.45 × 0.80 × 0.80 | Parked on the east wall at the head |
| BP keep-clear | 1.91, −0.40, 0.70 | 0.20 × 0.20 × 1.10 | Wall device, not a floor island |
| Parent chair | 1.595, −1.42, 0.525 | 0.78 × 0.82 × 1.05 | SE corner, clear of the door |
| Physician stool | 0.55, 0.67, 0.39 | 0.58 × 0.58 × 0.78 | Working position in the south aisle |

Clearances that now pass:

| Check | Value |
| --- | --- |
| Table vs workstation | 1.06 m |
| Provider aisle south of table | 0.91 m (y = 0.20..1.11), stool occupies it only while in use |
| Door vs chair / stool | no intersection |
| Turning circle | 1.52 m at (0.20, −0.70) |
| ECG parked vs table | 0.43 m (warn: cart is meant to pull to the table) |

## Clinical reading

v2 is how a tight but real peds-cardio exam room is usually packed:

- Table against the window wall, head toward daylight.
- Provider on the south side (patient’s right).
- Computer at the foot, not a second island in the middle.
- ECG as a wall/cart at the head, not overlapping the mattress.
- BP on the wall.
- Parent in the far corner.
- Stool lives in the working aisle and tucks under the table when not needed.

If you need a sixth full-size floor station (rolling BP cart + full ECG island + workstation + table + two seats), ask for a 16 × 14 ft shell (4.88 × 4.27 m) instead of forcing them into 4.27 × 3.96 m.

## What is not decided

- Whether 4.27 × 3.96 m is the real room you want to mimic.
- Whether the door should stay on the south-west or move to the south-center.
- Whether a sink/casework run is required. If yes, it almost certainly claims the west wall and the workstation becomes a surface on that run.
- Whether the PR #22 table (1.82 × 0.72 × 0.94 m) is the right silhouette once it is seen from the locked cameras.

Sign the checklist in `GATE0_REFERENCE_BOARD.md` before anyone starts Gate 2 architecture.
