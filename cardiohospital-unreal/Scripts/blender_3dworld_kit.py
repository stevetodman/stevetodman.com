"""Convert selected 3dworld GLB models into Unreal clinic FBX (cm, Z-up).

Run:
  blender --background --python Scripts/blender_3dworld_kit.py
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "Content" / "Environment" / "Source" / "3dworld"
FBX_DIR = SOURCE_DIR / "fbx"
GLB_DIR = SOURCE_DIR / "glb"
WORLD_REPO = Path("/Users/steven/Projects/3dworld")

# Curated clinic-slice assets. hospital-full.glb, the OR, and the 12-24 MB
# avatars stay out: they break the 60 FPS / Patel-only ADRs.
ASSETS = (
    {
        "id": "SM_3DW_Computer",
        "src": "public/models/furniture/computerScreen.glb",
        "target_height_cm": 42.0,
    },
    {
        "id": "SM_3DW_Keyboard",
        "src": "public/models/furniture/computerKeyboard.glb",
        "target_height_cm": 3.0,
    },
    {
        "id": "SM_3DW_Mouse",
        "src": "public/models/furniture/computerMouse.glb",
        "target_height_cm": 3.5,
    },
    {
        "id": "SM_3DW_Laptop",
        "src": "public/models/furniture/laptop.glb",
        "target_height_cm": 22.0,
    },
    {
        "id": "SM_3DW_Sink",
        "src": "public/models/furniture/bathroomSink.glb",
        "target_height_cm": 86.0,
    },
    {
        "id": "SM_3DW_Stool",
        "src": "public/models/furniture/stoolBar.glb",
        "target_height_cm": 62.0,
    },
    {
        "id": "SM_3DW_Trashcan",
        "src": "public/models/furniture/trashcan.glb",
        "target_height_cm": 42.0,
    },
    {
        "id": "SM_3DW_Bookcase",
        "src": "public/models/furniture/bookcaseOpen.glb",
        "target_height_cm": 160.0,
    },
    {
        "id": "SM_3DW_SideTable",
        "src": "public/models/furniture/sideTable.glb",
        "target_height_cm": 55.0,
    },
    {
        "id": "SM_3DW_Bear",
        "src": "public/models/furniture/bear.glb",
        "target_height_cm": 22.0,
    },
    {
        "id": "SM_3DW_Dino",
        "src": "public/models/props/dino-stuffed.glb",
        "target_height_cm": 28.0,
    },
    {
        "id": "SM_3DW_HumanHeart",
        "src": "public/models/medical/hearts/human-heart.glb",
        "target_height_cm": 18.0,
    },
    {
        "id": "SM_3DW_VsdHeart",
        "src": "public/models/medical/hearts/vsd-heart.glb",
        "target_height_cm": 20.0,
    },
)


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 0.01


def world_bounds(obj):
    corners = [obj.matrix_world @ mathutils_vector(corner) for corner in obj.bound_box]
    xs = [c.x for c in corners]
    ys = [c.y for c in corners]
    zs = [c.z for c in corners]
    return (min(xs), min(ys), min(zs), max(xs), max(ys), max(zs))


def mathutils_vector(values):
    import mathutils

    return mathutils.Vector(values)


def flatten_to_static_mesh(name: str):
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        raise RuntimeError(f"no mesh found while converting {name}")

    # Keep the densest mesh (the authored prop) and drop importer leftovers
    # such as the icosphere that ships inside dino-stuffed.glb.
    meshes.sort(key=lambda obj: len(obj.data.vertices), reverse=True)
    keep = meshes[0]
    for extra in meshes[1:]:
        bpy.data.objects.remove(extra, do_unlink=True)

    bpy.ops.object.select_all(action="DESELECT")
    keep.select_set(True)
    bpy.context.view_layer.objects.active = keep
    if keep.parent:
        bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    keep.name = name
    return keep


def sit_on_ground_and_center(obj) -> None:
    min_x, min_y, min_z, max_x, max_y, max_z = world_bounds(obj)
    obj.location.x -= (min_x + max_x) * 0.5
    obj.location.y -= (min_y + max_y) * 0.5
    obj.location.z -= min_z
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    bpy.context.scene.cursor.location = (0.0, 0.0, 0.0)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")


def scale_to_height(obj, target_height_cm: float) -> None:
    _, _, min_z, _, _, max_z = world_bounds(obj)
    height = max_z - min_z
    if height < 1e-4:
        raise RuntimeError(f"{obj.name} has no height")
    # glTF is meters. After a cm-unit scene import the mesh is often still
    # ~1 unit tall; treat anything under 10 blender units as meters.
    if height < 10.0:
        obj.scale *= 100.0
        bpy.ops.object.transform_apply(scale=True)
        _, _, min_z, _, _, max_z = world_bounds(obj)
        height = max_z - min_z
    obj.scale *= target_height_cm / height
    bpy.ops.object.transform_apply(scale=True)


def export_fbx(obj, dest: Path) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    dest.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.fbx(
        filepath=str(dest),
        use_selection=True,
        object_types={"MESH"},
        axis_forward="-Y",
        axis_up="Z",
        global_scale=1.0,
        apply_unit_scale=True,
        apply_scale_options="FBX_SCALE_ALL",
        mesh_smooth_type="FACE",
        add_leaf_bones=False,
        path_mode="COPY",
        embed_textures=True,
    )


def convert(asset: dict) -> dict:
    src = WORLD_REPO / asset["src"]
    if not src.is_file():
        raise FileNotFoundError(src)
    GLB_DIR.mkdir(parents=True, exist_ok=True)
    staged = GLB_DIR / src.name
    shutil.copy2(src, staged)

    reset_scene()
    bpy.ops.import_scene.gltf(filepath=str(staged))
    obj = flatten_to_static_mesh(asset["id"])
    scale_to_height(obj, asset["target_height_cm"])
    sit_on_ground_and_center(obj)
    dest = FBX_DIR / f"{asset['id']}.fbx"
    export_fbx(obj, dest)
    min_x, min_y, min_z, max_x, max_y, max_z = world_bounds(obj)
    report = {
        "id": asset["id"],
        "source": asset["src"],
        "glb": str(staged.relative_to(ROOT)),
        "fbx": str(dest.relative_to(ROOT)),
        "size_cm": {
            "x": round(max_x - min_x, 2),
            "y": round(max_y - min_y, 2),
            "z": round(max_z - min_z, 2),
        },
    }
    print(json.dumps(report))
    return report


def main() -> None:
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    reports = [convert(asset) for asset in ASSETS]
    (SOURCE_DIR / "conversion-report.json").write_text(
        json.dumps(reports, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
