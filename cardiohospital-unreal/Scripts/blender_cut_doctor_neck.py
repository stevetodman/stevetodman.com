"""Remove the leftover doctor head/neck from the already-skinned coat.

The first cut stopped at z=148 and left a brown neck stump. Patel's
MetaHuman face then sits on that stump like a mask. Delete the stump
and any remaining face-atlas verts; keep the collar.

Run:
  blender --background --python Scripts/blender_cut_doctor_neck.py
"""

from __future__ import annotations

from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
FBX = ROOT / "Content" / "Environment" / "Source" / "SK_LabCoat.fbx"
PREVIEW = Path("/tmp/cardio-assets/skin-preview/coat-neck-cut.png")
# Keep the coat collar. Only the inner neck stump and leftover chin.
HEAD_CUT_Z = 143.0
NECK_CUT_Z = 132.0
NECK_RADIUS = 6.0


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 0.01


def world_z(obj, vert):
    return (obj.matrix_world @ vert.co).z


def world_xy(obj, vert):
    point = obj.matrix_world @ vert.co
    return (point.x ** 2 + point.y ** 2) ** 0.5


def uv_v(obj, vert_index):
    mesh = obj.data
    if not mesh.uv_layers:
        return 0.0
    uv = mesh.uv_layers.active.data
    values = []
    for loop in mesh.loops:
        if loop.vertex_index == vert_index:
            values.append(uv[loop.index].uv.y)
    return max(values) if values else 0.0


def select_only(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def cut_stump(obj):
    select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    removed = 0
    for vert in obj.data.vertices:
        height = world_z(obj, vert)
        radius = world_xy(obj, vert)
        drop = height > HEAD_CUT_Z or (height > NECK_CUT_Z and radius < NECK_RADIUS)
        vert.select = drop
        if drop:
            removed += 1
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    print(f"removed {removed} neck/head verts remaining={len(obj.data.vertices)}")


def bounds(obj):
    xs, ys, zs = [], [], []
    for vert in obj.data.vertices:
        point = obj.matrix_world @ vert.co
        xs.append(point.x)
        ys.append(point.y)
        zs.append(point.z)
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)


def render_preview(path):
    path.parent.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 1280
    scene.render.filepath = str(path)
    scene.render.image_settings.file_format = "PNG"
    camera = bpy.data.objects.new("PreviewCam", bpy.data.cameras.new("PreviewCam"))
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.location = (0.0, -180.0, 130.0)
    direction = Vector((0.0, 0.0, 145.0)) - Vector(camera.location)
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    light = bpy.data.lights.new("Key", "AREA")
    light.energy = 40000
    light.size = 80
    key = bpy.data.objects.new("Key", light)
    scene.collection.objects.link(key)
    key.location = (40.0, -80.0, 180.0)
    try:
        bpy.ops.render.render(write_still=True)
        print(f"preview {path}")
    except Exception as error:  # noqa: BLE001
        print(f"preview failed: {error}")


def main():
    if not FBX.exists():
        raise FileNotFoundError(FBX)
    reset_scene()
    bpy.ops.import_scene.fbx(filepath=str(FBX), automatic_bone_orientation=False)
    suit = next(obj for obj in bpy.data.objects if obj.type == "MESH")
    armature = next(obj for obj in bpy.data.objects if obj.type == "ARMATURE")
    print(f"imported verts={len(suit.data.vertices)} bounds={tuple(round(v, 2) for v in bounds(suit))}")
    cut_stump(suit)
    if len(suit.data.vertices) < 200:
        raise RuntimeError("neck cut emptied the mesh")
    print(f"after cut bounds={tuple(round(v, 2) for v in bounds(suit))}")
    render_preview(PREVIEW)
    select_only(suit)
    armature.select_set(True)
    bpy.context.view_layer.objects.active = suit
    bpy.ops.export_scene.fbx(
        filepath=str(FBX),
        use_selection=True,
        object_types={"ARMATURE", "MESH"},
        axis_forward="-Y",
        axis_up="Z",
        global_scale=1.0,
        apply_unit_scale=True,
        apply_scale_options="FBX_SCALE_ALL",
        mesh_smooth_type="FACE",
        add_leaf_bones=False,
        bake_anim=False,
        use_armature_deform_only=True,
        path_mode="COPY",
        embed_textures=True,
    )
    print(f"exported {FBX} bytes={FBX.stat().st_size}")


if __name__ == "__main__":
    main()
