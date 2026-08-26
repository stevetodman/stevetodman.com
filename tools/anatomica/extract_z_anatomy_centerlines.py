#!/usr/bin/env python3
"""Extract cardiac-vessel spline control points from the Z-Anatomy Blender atlas.

Run with Blender, for example:
  blender --background Startup.blend --python extract_z_anatomy_centerlines.py -- \
    --output z_anatomy_centerlines.json

The extracted data remains derived from Z-Anatomy / BodyParts3D and is therefore
CC BY-SA 4.0. It must not be silently relicensed as part of another asset.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def arguments() -> argparse.Namespace:
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args(values)


def has_ancestor(obj, names):
    parent = obj.parent
    while parent:
        if parent.name in names:
            return True
        parent = parent.parent
    return False


def world_point(obj, coordinate):
    value = obj.matrix_world @ Vector(coordinate[:3])
    return [float(value.x), float(value.y), float(value.z)]


def spline_points(obj, spline):
    if spline.type == "BEZIER":
        # Preserve the editable centerline controls and handles. The downstream
        # fitter can sample them without reverse-engineering the tube mesh.
        return {
            "kind": "BEZIER",
            "cyclic": bool(spline.use_cyclic_u),
            "points": [
                {
                    "co": world_point(obj, point.co),
                    "handle_left": world_point(obj, point.handle_left),
                    "handle_right": world_point(obj, point.handle_right),
                }
                for point in spline.bezier_points
            ],
        }
    return {
        "kind": spline.type,
        "cyclic": bool(spline.use_cyclic_u),
        "points": [world_point(obj, point.co) for point in spline.points],
    }


def mesh_centroid(obj):
    vertices = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
    center = sum(vertices, Vector()) / max(len(vertices), 1)
    return [float(center.x), float(center.y), float(center.z)]


def main() -> int:
    args = arguments()
    roots = {"Arteries of heart.g", "Cardiac veins.g"}
    vessels = []
    for obj in bpy.data.objects:
        if obj.type != "CURVE" or not has_ancestor(obj, roots):
            continue
        vessels.append(
            {
                "name": obj.name,
                "system": "vein" if has_ancestor(obj, {"Cardiac veins.g"}) else "artery",
                "bevel_depth": float(obj.data.bevel_depth),
                "splines": [spline_points(obj, spline) for spline in obj.data.splines],
            }
        )

    landmarks = {}
    for name in ("Left ventricle", "Right ventricle", "Left atrium", "Right atrium"):
        obj = bpy.data.objects.get(name)
        if obj is None or obj.type != "MESH":
            raise RuntimeError(f"Missing expected Z-Anatomy landmark object: {name}")
        landmarks[name] = mesh_centroid(obj)

    payload = {
        "source": {
            "title": "Z-Anatomy - The libre 3D atlas of anatomy",
            "repository": "https://github.com/Z-Anatomy/Models-of-human-anatomy",
            "license": "CC BY-SA 4.0",
            "upstream": "BodyParts3D - DBCLS - CC BY-SA 2.1 Japan",
        },
        "coordinate_units": "Blender units in source file",
        "landmarks": landmarks,
        "vessels": sorted(vessels, key=lambda item: item["name"]),
    }
    args.output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(vessels)} vessel objects to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
