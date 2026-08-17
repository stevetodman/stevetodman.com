"""Skin Mhanimations' CC-BY lab coat (a real garment) to Patel.

Unlike the zeryshahid outfit, this mesh is already a standalone coat at
character scale (A-pose sleeve span ~554 units, collar at z~713).

Run:
  blender --background --python Scripts/blender_skin_mhanimations_coat.py
"""

from __future__ import annotations

from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Content" / "Environment" / "Source"
COAT_PATH = SOURCE / "Sketchfab" / "mhanimations-labcoat" / "mhanimations-labcoat.glb"
BODY_CANDIDATES = (
    Path("/tmp/cardio-assets/patel-export/SKM_Patel_Body.fbx"),
    SOURCE / "SKM_Patel_Body.fbx",
)
NECK_Z = 147.1
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


def main():
    body_path = next((path for path in BODY_CANDIDATES if path.exists()), None)
    if not body_path:
        raise FileNotFoundError("SKM_Patel_Body.fbx")
    if not COAT_PATH.exists():
        raise FileNotFoundError(COAT_PATH)

    reset_scene()
    bpy.ops.import_scene.fbx(filepath=str(body_path), automatic_bone_orientation=False)
    armature = next(obj for obj in bpy.data.objects if obj.type == "ARMATURE")
    body = next(obj for obj in bpy.data.objects if obj.type == "MESH" and "Patel" in obj.name)

    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(COAT_PATH))
    meshes = [obj for obj in bpy.data.objects if obj not in before and obj.type == "MESH"]
    if not meshes:
        raise RuntimeError("no coat mesh")
    coat = meshes[0]
    flatten(coat)
    coat.name = "SK_LabCoat"
    *_, _z0, z1 = world_bounds(coat)
    scale = NECK_Z / max(z1, 1.0)
    print(f"mhanimations top={z1:.2f} scale={scale:.6f} verts={len(coat.data.vertices)}")
    coat.scale = (scale, scale, scale)
    select_only(coat)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    white = bpy.data.materials.new("M_LabCoat")
    white.use_nodes = True
    bsdf = white.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.96, 0.96, 0.94, 1.0)
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = 0.38
    coat.data.materials.clear()
    coat.data.materials.append(white)

    print(f"coat bounds={tuple(round(v, 2) for v in world_bounds(coat))}")
    transfer_weights(body, coat, armature)
    print(f"groups={len(coat.vertex_groups)}")

    bpy.ops.object.select_all(action="DESELECT")
    coat.select_set(True)
    armature.select_set(True)
    bpy.context.view_layer.objects.active = coat
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
        embed_textures=False,
    )
    print(f"exported {dest} bytes={dest.stat().st_size}")


if __name__ == "__main__":
    main()
