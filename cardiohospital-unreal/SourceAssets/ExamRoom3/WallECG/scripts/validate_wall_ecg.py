"""Fail-fast validation for the authored wall ECG workstation."""

from pathlib import Path
import json
import struct

import bpy


ASSET_DIR = Path(__file__).resolve().parents[1]
EXPECTED = {
    "CH_WallECG_LOD0": (15000, 18000),
    "CH_WallECG_LOD1": (8500, 10500),
    "CH_WallECG_LOD2": (3800, 5200),
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

collision = bpy.data.collections.get("CH_WallECG_COLLISION")
assert collision is not None and len(collision.objects) == 4, "expected four custom collision hulls"
assert all(obj.name.startswith("UCX_SM_CH_WallECG_01_") for obj in collision.objects), "invalid UCX naming"
results["collision_hulls"] = len(collision.objects)

for state in ("sinus", "tachy", "artifact"):
    path = ASSET_DIR / "textures" / f"T_CH_WallECG_Screen_{state}_4K.png"
    assert path.exists() and path.stat().st_size > 100000, f"missing or empty texture {path.name}"
    dimensions = png_dimensions(path)
    assert dimensions == (4096, 2048), f"{path.name} is {dimensions}, expected 4096x2048"
    results["textures"][state] = {"dimensions": dimensions, "bytes": path.stat().st_size}

manifest = json.loads((ASSET_DIR / "asset_manifest.json").read_text(encoding="utf-8"))
assert manifest["clinical_content"] == "Synthetic simulation display states; no PHI"
assert set(manifest["screen_states"]) == {"sinus", "tachy", "artifact"}
assert manifest["validation_renderer"].startswith("OptiX:"), "validation renders did not use OptiX"

for relative in (
    "exports/SM_CH_WallECG_01_LOD0.fbx",
    "exports/SM_CH_WallECG_01_LOD1.fbx",
    "exports/SM_CH_WallECG_01_LOD2.fbx",
    "exports/SM_CH_WallECG_01_preview.glb",
    "renders/CH_WallECG_hero_front.png",
    "renders/CH_WallECG_mount_profile.png",
    "renders/CH_WallECG_controls_detail.png",
):
    path = ASSET_DIR / relative
    assert path.exists() and path.stat().st_size > 1000, f"missing deliverable {relative}"

results["checks"] = [
    "LOD triangle budgets",
    "dual UV channels on every mesh",
    "four named UCX collision hulls",
    "three valid 4096x2048 simulation display states",
    "explicit no-PHI manifest contract",
    "RTX OptiX validation render",
    "FBX/GLB/render deliverables",
]
print("ASSET_VALIDATION_PASSED")
print(json.dumps(results, indent=2))
