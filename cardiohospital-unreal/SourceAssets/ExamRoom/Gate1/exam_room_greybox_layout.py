"""Shared Gate 1 exam-room dimensions and clearance envelopes.

Layout v2 is the current provisional greybox. Numbers are metres.
This module has no Blender dependency so the validator can run on any Python 3.
"""

from __future__ import annotations

from pathlib import Path

LAYOUT_VERSION = "v2"
ROOM_W = 4.27
ROOM_D = 3.96
ROOM_H = 2.74
WALL = 0.12
DOOR_W = 0.91
DOOR_H = 2.13
DOOR_X = -1.05
WINDOW_W = 1.80
WINDOW_H = 1.20
WINDOW_X = 0.55
WINDOW_SILL = 0.95

# Floor envelopes. Sizes and centers match the Blender builder.
ENVELOPES = (
    {
        "name": "ZONE_ExamTable",
        "size": (1.82, 0.72, 0.94),
        "location": (0.35, 1.47, 0.47),
        "role": "hero",
    },
    {
        "name": "ZONE_ProviderWorkstation",
        "size": (0.62, 1.25, 1.25),
        "location": (-1.825, 0.55, 0.625),
        "role": "hero",
    },
    {
        "name": "ZONE_ECGStation",
        "size": (0.45, 0.80, 0.80),
        "location": (1.91, 1.47, 0.70),
        "role": "hero",
    },
    {
        "name": "ZONE_BloodPressure",
        "size": (0.20, 0.20, 1.10),
        "location": (1.91, -0.40, 0.70),
        "role": "keep_clear",
    },
    {
        "name": "ZONE_ParentChair",
        "size": (0.78, 0.82, 1.05),
        "location": (1.595, -1.42, 0.525),
        "role": "seating",
    },
    {
        "name": "ZONE_PhysicianStool",
        "size": (0.58, 0.58, 0.78),
        "location": (0.55, 0.67, 0.39),
        "role": "seating",
    },
)

CAMERAS = {
    "CAM_Benchmark_Doorway": {
        "location": (-1.05, -1.70, 1.70),
        "target": (0.25, 1.20, 1.18),
        "lens_mm": 30.0,
    },
    "CAM_Benchmark_PatientSide": {
        "location": (1.70, 0.15, 1.70),
        "target": (0.35, 1.40, 1.05),
        "lens_mm": 32.0,
    },
    "CAM_Benchmark_Provider": {
        "location": (-1.70, -0.20, 1.70),
        "target": (0.10, 1.00, 1.05),
        "lens_mm": 32.0,
    },
}

PROVIDER_AISLE_M = 0.91
STAFF_PASS_M = 0.76
TURN_DIAMETER_M = 1.52
TURN_CENTER = (0.20, -0.70)
ECG_PARKED_GAP_WARN_M = 0.76
ECG_PARKED_GAP_FAIL_M = 0.25

GATE1_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT = GATE1_DIR / "generated"


def aabb_xy(size, location):
    hx, hy = size[0] / 2.0, size[1] / 2.0
    cx, cy = location[0], location[1]
    return (cx - hx, cx + hx, cy - hy, cy + hy)


def overlap_area(a, b):
    x0 = max(a[0], b[0])
    x1 = min(a[1], b[1])
    y0 = max(a[2], b[2])
    y1 = min(a[3], b[3])
    if x1 <= x0 or y1 <= y0:
        return 0.0
    return (x1 - x0) * (y1 - y0)


def gap_x(a, b):
    if a[1] < b[0]:
        return b[0] - a[1]
    if b[1] < a[0]:
        return a[0] - b[1]
    return 0.0


def gap_y(a, b):
    if a[3] < b[2]:
        return b[2] - a[3]
    if b[3] < a[2]:
        return a[2] - b[3]
    return 0.0


def envelope_by_name(name):
    for item in ENVELOPES:
        if item["name"] == name:
            return item
    raise KeyError(name)


def door_clear_aabb():
    return (DOOR_X - DOOR_W / 2.0, DOOR_X + DOOR_W / 2.0, -ROOM_D / 2.0, -ROOM_D / 2.0 + 0.60)


def room_aabb():
    return (-ROOM_W / 2.0, ROOM_W / 2.0, -ROOM_D / 2.0, ROOM_D / 2.0)
