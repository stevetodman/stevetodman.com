"""Skin mfyma's CC-BY Doctor in White Coat onto Patel.

The file is one dressed human (coat + shirt + trousers + head), not a
separate garment. Scale it to 175 cm, drop the duplicate head, transfer
Patel weights, export SK_LabCoat.fbx.

Run:
  blender --background --python Scripts/blender_skin_mfyma_doctor.py
"""

from __future__ import annotations

from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Content" / "Environment" / "Source"
DOCTOR = SOURCE / "Sketchfab" / "mfyma-doctor" / "doctor-in-white-coat.glb"
BODY_CANDIDATES = (
    Path("/tmp/cardio-assets/patel-export/SKM_Patel_Body.fbx"),
    SOURCE / "SKM_Patel_Body.fbx",
)
PREVIEW = Path("/tmp/cardio-assets/skin-preview/mfyma-front.png")
HEIGHT = 175.0
HEAD_CUT_Z = 143.0
MAX_WEIGHTS = 4


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 0.01


def world_bounds(obj):
    xs, ys, zs = [], [], []
    for vert in obj.data.vertices:
        point = obj.matrix_world @ vert.co
        xs.append(point.x)
        ys.append(point.y)
        zs.append(point.z)
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)


def select_only(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def flatten(obj):
    for modifier in list(obj.modifiers):
        obj.modifiers.remove(modifier)
    matrix = obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world = matrix
    select_only(obj)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def delete_above(obj, z_cut):
    select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for vert in obj.data.vertices:
        vert.select = (obj.matrix_world @ vert.co).z > z_cut
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")


def transfer_weights(source, dest, armature):
    select_only(dest)
    modifier = dest.modifiers.new(name="DataTransfer", type="DATA_TRANSFER")
    modifier.object = source
    modifier.use_vert_data = True
    modifier.data_types_verts = {"VGROUP_WEIGHTS"}
    modifier.vert_mapping = "POLYINTERP_NEAREST"
    modifier.layers_vgroup_select_src = "ALL"
    modifier.mix_mode = "REPLACE"
    bpy.ops.object.datalayout_transfer(modifier="DataTransfer")
    bpy.ops.object.modifier_apply(modifier="DataTransfer")
    if dest.vertex_groups:
        bpy.ops.object.vertex_group_limit_total(group_select_mode="ALL", limit=MAX_WEIGHTS)
        bpy.ops.object.vertex_group_normalize_all(group_select_mode="ALL", lock_active=False)
    arm = dest.modifiers.new(name="Armature", type="ARMATURE")
    arm.object = armature
    dest.parent = armature


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
    camera.location = (0.0, -220.0, 100.0)
    direction = Vector((0.0, 0.0, 100.0)) - Vector(camera.location)
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
    body_path = next((path for path in BODY_CANDIDATES if path.exists()), None)
    if not body_path:
        raise FileNotFoundError("SKM_Patel_Body.fbx")
    if not DOCTOR.exists():
        raise FileNotFoundError(DOCTOR)

    reset_scene()
    bpy.ops.import_scene.fbx(filepath=str(body_path), automatic_bone_orientation=False)
    armature = next(obj for obj in bpy.data.objects if obj.type == "ARMATURE")
    body = next(obj for obj in bpy.data.objects if obj.type == "MESH" and "Patel" in obj.name)

    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(DOCTOR))
    meshes = [obj for obj in bpy.data.objects if obj not in before and obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("no doctor mesh")
    suit = meshes[0]
    flatten(suit)
    suit.name = "SK_LabCoat"
    x0, x1, y0, y1, z0, z1 = world_bounds(suit)
    span = max(z1 - z0, 1.0)
    scale = HEIGHT / span
    print(f"doctor raw bounds={tuple(round(v, 2) for v in (x0, x1, y0, y1, z0, z1))} scale={scale:.4f}")
    suit.scale = (scale, scale, scale)
    select_only(suit)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    _x0, _x1, _y0, _y1, z0, z1 = world_bounds(suit)
    suit.location.z -= z0
    select_only(suit)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    print(f"doctor scaled bounds={tuple(round(v, 2) for v in world_bounds(suit))}")
    delete_above(suit, HEAD_CUT_Z)
    if len(suit.data.vertices) < 200:
        raise RuntimeError("head cut emptied the mesh")
    print(f"after head cut verts={len(suit.data.vertices)} bounds={tuple(round(v, 2) for v in world_bounds(suit))}")

    transfer_weights(body, suit, armature)
    print(f"groups={len(suit.vertex_groups)}")

    body.hide_render = True
    body.hide_set(True)
    render_preview(PREVIEW)

    bpy.ops.object.select_all(action="DESELECT")
    suit.select_set(True)
    armature.select_set(True)
    bpy.context.view_layer.objects.active = suit
    dest = SOURCE / "SK_LabCoat.fbx"
    bpy.ops.export_scene.fbx(
        filepath=str(dest),
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
    print(f"exported {dest} bytes={dest.stat().st_size}")


if __name__ == "__main__":
    main()
