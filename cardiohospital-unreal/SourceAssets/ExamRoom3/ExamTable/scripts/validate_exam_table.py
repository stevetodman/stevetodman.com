"""Fail-fast validation for the authored exam-table Blender source."""

from pathlib import Path
import json
import struct

import bpy


ASSET_DIR = Path(__file__).resolve().parents[1]
EXPECTED = {
    "CH_ExamTable_LOD0": (11000, 13000),
    "CH_ExamTable_LOD1": (6000, 8000),
    "CH_ExamTable_LOD2": (2800, 4000),
}


def triangles(objects):
    return sum(len(poly.vertices) - 2 for obj in objects if obj.type == "MESH" for poly in obj.data.polygons)


def png_dimensions(path):
    with path.open("rb") as stream:
        assert stream.read(8) == b"\x89PNG\r\n\x1a\n", f"invalid PNG: {path.name}"
        stream.read(8)
        return struct.unpack(">II", stream.read(8))


results = {"collections": {}, "textures": {}, "checks": []}
for name, bounds in EXPECTED.items():
    group = bpy.data.collections.get(name)
    assert group is not None, f"missing collection {name}"
    meshes = [obj for obj in group.objects if obj.type == "MESH"]
    count = triangles(meshes)
    assert bounds[0] <= count <= bounds[1], f"{name} triangles {count} outside {bounds}"
    assert all(len(obj.data.uv_layers) >= 2 for obj in meshes), f"{name} mesh missing UV0/UV1"
    results["collections"][name] = {"mesh_objects": len(meshes), "triangles": count, "uv_channels": 2}

collision = bpy.data.collections.get("CH_ExamTable_COLLISION")
assert collision is not None and len(collision.objects) == 3, "expected three custom collision hulls"
assert all(obj.name.startswith("UCX_SM_CH_ExamTable_01_") for obj in collision.objects), "invalid UCX naming"
results["collision_hulls"] = len(collision.objects)

for suffix in ("BaseColor", "Roughness", "Normal"):
    path = ASSET_DIR / "textures" / f"T_CH_ExamTable_Upholstery_{suffix}_4K.png"
    assert path.exists() and path.stat().st_size > 100000, f"missing or empty texture {path.name}"
    dimensions = png_dimensions(path)
    assert dimensions == (4096, 4096), f"{path.name} is {dimensions}, expected 4096x4096"
    results["textures"][suffix] = {"dimensions": dimensions, "bytes": path.stat().st_size}

for relative in (
    "exports/SM_CH_ExamTable_01_LOD0.fbx",
    "exports/SM_CH_ExamTable_01_LOD1.fbx",
    "exports/SM_CH_ExamTable_01_LOD2.fbx",
    "exports/SM_CH_ExamTable_01_preview.glb",
    "renders/CH_ExamTable_hero_three_quarter.png",
    "renders/CH_ExamTable_clinical_side.png",
    "renders/CH_ExamTable_cabinet_detail.png",
    "asset_manifest.json",
):
    path = ASSET_DIR / relative
    assert path.exists() and path.stat().st_size > 1000, f"missing deliverable {relative}"

results["checks"] = [
    "LOD triangle budgets",
    "dual UV channels on every mesh",
    "three named UCX collision hulls",
    "three valid 4096x4096 PBR maps",
    "FBX/GLB/render/manifest deliverables",
]
print("ASSET_VALIDATION_PASSED")
print(json.dumps(results, indent=2))
