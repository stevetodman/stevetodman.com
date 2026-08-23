#!/usr/bin/env python3
"""Evaluate candidate Exam Room 3 hero assets against locked Gate 1 envelopes.

Default mode fails only when an asset already designated `integration_target` does
not fit. `--strict-candidates` also fails for incompatible parked candidates so
an agent can use the command as an adversarial pre-integration gate.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from exam_room_greybox_layout import LAYOUT_VERSION, envelope_by_name

HERE = Path(__file__).resolve().parent
CONTRACT = HERE / "candidate_asset_contracts.json"

AXIS_INDEX = {"x": 0, "y": 1, "z": 2}


def evaluate_candidate(candidate):
    zone = envelope_by_name(candidate["zone"])
    tolerance = float(candidate.get("tolerance_fraction", 0.0))
    comparisons = []

    for dimension_name, axis_name in candidate["axis_map"].items():
        axis_index = AXIS_INDEX[axis_name]
        zone_m = float(zone["size"][axis_index])
        asset_m = float(candidate["dimensions_m"][dimension_name])
        max_m = zone_m * (1.0 + tolerance)
        fits = asset_m <= max_m + 1e-9
        comparisons.append(
            {
                "dimension": dimension_name,
                "axis": axis_name,
                "asset_m": round(asset_m, 4),
                "zone_m": round(zone_m, 4),
                "max_with_tolerance_m": round(max_m, 4),
                "oversize_m": round(max(0.0, asset_m - zone_m), 4),
                "status": "pass" if fits else "fail",
            }
        )

    failed = [item for item in comparisons if item["status"] == "fail"]
    return {
        "id": candidate["id"],
        "display_name": candidate["display_name"],
        "zone": candidate["zone"],
        "decision": candidate["decision"],
        "status": "pass" if not failed else "fail",
        "comparisons": comparisons,
        "failed_dimensions": [item["dimension"] for item in failed],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--strict-candidates",
        action="store_true",
        help="Fail if any candidate is incompatible, not only integration targets.",
    )
    args = parser.parse_args()

    contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
    results = [evaluate_candidate(item) for item in contract["candidates"]]

    target_failures = [
        item for item in results if item["decision"] == "integration_target" and item["status"] == "fail"
    ]
    candidate_failures = [item for item in results if item["status"] == "fail"]

    report = {
        "layout": LAYOUT_VERSION,
        "contract_schema_version": contract["schema_version"],
        "source": contract["source"],
        "strict_candidates": args.strict_candidates,
        "results": results,
        "integration_target_failures": len(target_failures),
        "all_candidate_failures": len(candidate_failures),
    }

    print(json.dumps(report, indent=2))

    generated = HERE / "generated"
    generated.mkdir(parents=True, exist_ok=True)
    (generated / "CH_ExamRoom_Gate1_asset_fit.json").write_text(
        json.dumps(report, indent=2) + "\n", encoding="utf-8"
    )

    if target_failures:
        return 1
    if args.strict_candidates and candidate_failures:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
