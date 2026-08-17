#!/usr/bin/env python3
"""Fail-fast circulation checks for the Gate 1 exam-room greybox.

Does not import Blender. Run with any Python 3:

    python validate_exam_room_greybox.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from exam_room_greybox_layout import (
    CAMERAS,
    ECG_PARKED_GAP_FAIL_M,
    ECG_PARKED_GAP_WARN_M,
    ENVELOPES,
    LAYOUT_VERSION,
    PROVIDER_AISLE_M,
    ROOM_D,
    ROOM_H,
    ROOM_W,
    STAFF_PASS_M,
    TURN_CENTER,
    TURN_DIAMETER_M,
    aabb_xy,
    door_clear_aabb,
    envelope_by_name,
    gap_x,
    gap_y,
    overlap_area,
    room_aabb,
)


def _result(name, status, detail):
    return {"name": name, "status": status, "detail": detail}


def _circle_hits_aabb(center, radius, box):
    cx, cy = center
    nearest_x = min(max(cx, box[0]), box[1])
    nearest_y = min(max(cy, box[2]), box[3])
    dx = cx - nearest_x
    dy = cy - nearest_y
    return (dx * dx + dy * dy) < (radius * radius)


def main():
    boxes = {item["name"]: aabb_xy(item["size"], item["location"]) for item in ENVELOPES}
    table = boxes["ZONE_ExamTable"]
    desk = boxes["ZONE_ProviderWorkstation"]
    ecg = boxes["ZONE_ECGStation"]
    chair = boxes["ZONE_ParentChair"]
    stool = boxes["ZONE_PhysicianStool"]
    door = door_clear_aabb()
    room = room_aabb()
    checks = []

    for name, box in boxes.items():
        outside = box[0] < room[0] - 1e-6 or box[1] > room[1] + 1e-6 or box[2] < room[2] - 1e-6 or box[3] > room[3] + 1e-6
        checks.append(
            _result(
                f"{name} inside room",
                "fail" if outside else "pass",
                f"aabb={tuple(round(v, 3) for v in box)}",
            )
        )

    names = list(boxes)
    for i, left in enumerate(names):
        for right in names[i + 1 :]:
            area = overlap_area(boxes[left], boxes[right])
            checks.append(
                _result(
                    f"overlap {left} vs {right}",
                    "fail" if area > 1e-4 else "pass",
                    f"area_m2={area:.4f}",
                )
            )

    aisle_south = table[2] - PROVIDER_AISLE_M
    aisle_ok = aisle_south >= stool[3] - 0.58  # stool is allowed inside the working aisle
    # The aisle itself must exist as empty space except the stool.
    blocked = False
    for name, box in boxes.items():
        if name in {"ZONE_ExamTable", "ZONE_PhysicianStool"}:
            continue
        aisle_box = (table[0], table[1], aisle_south, table[2])
        if overlap_area(box, aisle_box) > 1e-4:
            blocked = True
    checks.append(
        _result(
            "provider aisle 0.91 m south of table",
            "fail" if blocked else "pass",
            f"aisle_y={aisle_south:.3f}..{table[2]:.3f} stool_allowed={aisle_ok}",
        )
    )

    pass_gap = gap_x(table, desk)
    checks.append(
        _result(
            "staff pass table vs workstation",
            "fail" if pass_gap + 1e-6 < STAFF_PASS_M else "pass",
            f"gap_m={pass_gap:.3f}",
        )
    )

    ecg_gap = gap_x(table, ecg)
    if ecg_gap + 1e-6 < ECG_PARKED_GAP_FAIL_M:
        ecg_status = "fail"
    elif ecg_gap + 1e-6 < ECG_PARKED_GAP_WARN_M:
        ecg_status = "warn"
    else:
        ecg_status = "pass"
    checks.append(_result("ECG parked gap vs table", ecg_status, f"gap_m={ecg_gap:.3f}"))

    for name, box in (("parent chair", chair), ("stool", stool)):
        hit = overlap_area(box, door) > 1e-4
        checks.append(_result(f"{name} clear of door approach", "fail" if hit else "pass", f"overlap={hit}"))

    radius = TURN_DIAMETER_M / 2.0
    turn_hits = [
        name
        for name, box in boxes.items()
        if name != "ZONE_PhysicianStool" and _circle_hits_aabb(TURN_CENTER, radius, box)
    ]
    # Stool is movable; turning space is evaluated without it.
    checks.append(
        _result(
            "turning circle 1.52 m south-center",
            "fail" if turn_hits else "pass",
            f"center={TURN_CENTER} hits={turn_hits}",
        )
    )

    report = {
        "layout": LAYOUT_VERSION,
        "room_m": {"width": ROOM_W, "depth": ROOM_D, "height": ROOM_H},
        "cameras": sorted(CAMERAS),
        "envelope_count": len(ENVELOPES),
        "table": envelope_by_name("ZONE_ExamTable")["size"],
        "checks": checks,
        "failed": sum(1 for item in checks if item["status"] == "fail"),
        "warned": sum(1 for item in checks if item["status"] == "warn"),
    }
    print(json.dumps(report, indent=2))
    out = Path(__file__).resolve().parent / "generated"
    out.mkdir(parents=True, exist_ok=True)
    (out / "CH_ExamRoom_Gate1_circulation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    if report["failed"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
