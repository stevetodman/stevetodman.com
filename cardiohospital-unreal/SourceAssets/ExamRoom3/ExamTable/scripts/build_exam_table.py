"""Build the CardioHospital pediatric exam table production asset.

Run with Blender 5.2 LTS:
  blender --background --python scripts/build_exam_table.py

The asset is original and intentionally unbranded. Dimensions are metres.
"""

from __future__ import annotations

import json
import math
import struct
import zlib
from pathlib import Path

import bpy
from mathutils import Vector


ASSET_DIR = Path(__file__).resolve().parents[1]
EXPORT_DIR = ASSET_DIR / "exports"
RENDER_DIR = ASSET_DIR / "renders"
TEXTURE_DIR = ASSET_DIR / "textures"
SHARED_MATERIAL_SCRIPTS = ASSET_DIR.parents[1] / "Shared" / "ClinicalMaterials" / "scripts"
import sys
sys.path.insert(0, str(SHARED_MATERIAL_SCRIPTS))
from clinical_materials import apply_pbr_set
for folder in (EXPORT_DIR, RENDER_DIR, TEXTURE_DIR):
    folder.mkdir(parents=True, exist_ok=True)


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.materials, bpy.data.curves, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def collection(name: str):
    found = bpy.data.collections.get(name)
    if found:
        return found
    found = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(found)
    return found


def move_to(obj, target):
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    target.objects.link(obj)


def material(name, color, metallic=0.0, roughness=0.45, clearcoat=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*color, 1.0)
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = clearcoat
    return mat


def add_uv_channels(obj):
    if obj.type != "MESH":
        return
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    try:
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.025)
    except RuntimeError:
        pass
    bpy.ops.object.mode_set(mode="OBJECT")
    if not obj.data.uv_layers:
        obj.data.uv_layers.new(name="UV0")
    obj.data.uv_layers[0].name = "UV0"
    if len(obj.data.uv_layers) < 2:
        lightmap = obj.data.uv_layers.new(name="UV1_Lightmap")
        source = obj.data.uv_layers[0]
        for src, dst in zip(source.data, lightmap.data):
            dst.uv = src.uv
    obj.select_set(False)


def box(name, size, location, mat, bevel=0.025, target=None, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new("ProductionEdgeRadius", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "ANGLE"
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj["asset_units"] = "metres"
    obj["collision_policy"] = "custom_complexity"
    add_uv_channels(obj)
    if target:
        move_to(obj, target)
    return obj


def cylinder(name, radius, depth, location, mat, target, rotation=(0, 0, 0), vertices=48, bevel=0.006):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    if bevel:
        mod = obj.modifiers.new("ProductionEdgeRadius", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    add_uv_channels(obj)
    move_to(obj, target)
    return obj


def torus(name, major, minor, location, mat, target, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=64, minor_segments=12,
                                    location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    add_uv_channels(obj)
    move_to(obj, target)
    return obj


def create_upholstery_textures():
    """Create original 4K micro-grain maps for the hero upholstery."""
    import numpy as np

    size = 4096
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    x /= size
    y /= size
    grain = (
        np.sin(x * 1281.0 + np.sin(y * 91.0) * 2.1) * 0.45
        + np.sin(y * 947.0 + x * 37.0) * 0.30
        + np.sin((x + y) * 2113.0) * 0.15
        + np.sin((x - y) * 383.0) * 0.10
    )
    grain = grain / 2.0 + 0.5
    base = np.empty((size, size, 4), dtype=np.float32)
    # Stored through Blender's linear pipeline; values are lifted so the authored
    # vinyl reads as a saturated clinical teal after sRGB conversion.
    tint = np.array([0.14, 0.48, 0.52], dtype=np.float32)
    base[:, :, :3] = np.clip(tint[None, None, :] * (0.88 + grain[:, :, None] * 0.18), 0, 1)
    base[:, :, 3] = 1.0
    rough = np.empty_like(base)
    rough[:, :, :3] = np.clip(0.56 + (grain[:, :, None] - 0.5) * 0.18, 0, 1)
    rough[:, :, 3] = 1.0
    gy, gx = np.gradient(grain)
    strength = 3.2
    normal = np.empty_like(base)
    normal[:, :, 0] = np.clip(0.5 - gx * strength, 0, 1)
    normal[:, :, 1] = np.clip(0.5 - gy * strength, 0, 1)
    normal[:, :, 2] = 1.0
    normal[:, :, 3] = 1.0

    def png_chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    def write_png_rgba(path, pixels):
        rgba8 = np.clip(pixels * 255.0 + 0.5, 0, 255).astype(np.uint8)
        scanlines = b"".join(b"\x00" + rgba8[row].tobytes() for row in range(size))
        header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
        payload = b"\x89PNG\r\n\x1a\n"
        payload += png_chunk(b"IHDR", header)
        payload += png_chunk(b"IDAT", zlib.compress(scanlines, level=7))
        payload += png_chunk(b"IEND", b"")
        path.write_bytes(payload)

    results = {}
    for suffix, pixels, colorspace in (
        ("BaseColor", base, "sRGB"),
        ("Roughness", rough, "Non-Color"),
        ("Normal", normal, "Non-Color"),
    ):
        path = TEXTURE_DIR / f"T_CH_ExamTable_Upholstery_{suffix}_4K.png"
        write_png_rgba(path, pixels)
        results[suffix] = path
    return results


def attach_upholstery_nodes(mat, maps):
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    texcoord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (7.0, 7.0, 7.0)
    links.new(texcoord.outputs["UV"], mapping.inputs["Vector"])
    for suffix, y in (("BaseColor", 240), ("Roughness", 0), ("Normal", -240)):
        tex = nodes.new("ShaderNodeTexImage")
        tex.image = bpy.data.images.load(str(maps[suffix]))
        tex.image.colorspace_settings.name = "sRGB" if suffix == "BaseColor" else "Non-Color"
        tex.label = f"4K {suffix}"
        tex.location = (-620, y)
        links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
        if suffix == "BaseColor":
            links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        elif suffix == "Roughness":
            links.new(tex.outputs["Color"], bsdf.inputs["Roughness"])
        else:
            normal = nodes.new("ShaderNodeNormalMap")
            normal.inputs["Strength"].default_value = 0.24
            normal.location = (-300, -240)
            links.new(tex.outputs["Color"], normal.inputs["Color"])
            links.new(normal.outputs["Normal"], bsdf.inputs["Normal"])


def build_lod0(mats, target):
    white, upholstery, steel, dark, accent, rubber = mats
    objects = []
    # Fixed pedestal, floating toe-kick, and service plinth.
    objects += [
        box("SM_CH_ExamTable_BasePlinth", (1.30, 0.61, 0.10), (0.03, 0, 0.11), dark, 0.035, target),
        box("SM_CH_ExamTable_BaseCabinet", (1.36, 0.64, 0.48), (0.00, 0, 0.39), white, 0.045, target),
        box("SM_CH_ExamTable_LiftColumn", (0.36, 0.40, 0.29), (-0.18, 0, 0.675), dark, 0.025, target),
        box("SM_CH_ExamTable_Deck", (1.73, 0.70, 0.10), (0.00, 0, 0.77), white, 0.035, target),
    ]
    # Three-section pediatric upholstered surface, with a raised backrest.
    back_angle = math.radians(-8.0)
    objects += [
        box("SM_CH_ExamTable_CushionFoot", (0.50, 0.68, 0.105), (0.615, 0, 0.875), upholstery, 0.052, target),
        box("SM_CH_ExamTable_CushionSeat", (0.56, 0.68, 0.115), (0.085, 0, 0.88), upholstery, 0.055, target),
        box("SM_CH_ExamTable_CushionBack", (0.76, 0.68, 0.12), (-0.555, 0, 0.925), upholstery, 0.058, target,
            rotation=(0, back_angle, 0)),
    ]
    # Fine piping lines and hinge reveal add readable close-up construction detail.
    for x in (-0.21, 0.36):
        objects.append(box(f"SM_CH_ExamTable_Seam_{x:+.2f}", (0.007, 0.666, 0.009), (x, 0, 0.944), dark, 0.003, target))
    objects.append(cylinder("SM_CH_ExamTable_BackHinge", 0.036, 0.59, (-0.205, 0, 0.856), steel, target,
                            rotation=(math.radians(90), 0, 0)))

    # Front cabinetry: two drawers, pull-out step, door, and tactile handles.
    front_y = -0.326
    objects += [
        box("SM_CH_ExamTable_DrawerUpper", (0.53, 0.035, 0.155), (-0.37, front_y, 0.515), white, 0.012, target),
        box("SM_CH_ExamTable_DrawerLower", (0.53, 0.035, 0.175), (-0.37, front_y, 0.335), white, 0.012, target),
        box("SM_CH_ExamTable_CabinetDoor", (0.48, 0.035, 0.34), (0.255, front_y, 0.405), white, 0.012, target),
        box("SM_CH_ExamTable_PulloutStep", (0.46, 0.26, 0.07), (0.45, -0.30, 0.205), dark, 0.028, target),
        box("SM_CH_ExamTable_StepTread", (0.39, 0.21, 0.012), (0.45, -0.30, 0.247), rubber, 0.008, target),
    ]
    for index, z in enumerate((0.515, 0.335)):
        objects.append(cylinder(f"SM_CH_ExamTable_DrawerHandle_{index+1}", 0.012, 0.34, (-0.37, -0.355, z), steel,
                                target, rotation=(0, math.radians(90), 0), vertices=32, bevel=0.003))
    objects.append(cylinder("SM_CH_ExamTable_DoorHandle", 0.012, 0.22, (0.44, -0.355, 0.45), steel, target,
                            rotation=(math.radians(90), 0, 0), vertices=32, bevel=0.003))

    # Paper roll and tear bar at the head end.
    objects += [
        cylinder("SM_CH_ExamTable_PaperRoll", 0.085, 0.66, (-0.94, 0, 0.77), mats[0], target,
                 rotation=(math.radians(90), 0, 0), vertices=64, bevel=0.006),
        cylinder("SM_CH_ExamTable_PaperAxle", 0.018, 0.73, (-0.94, 0, 0.77), steel, target,
                 rotation=(math.radians(90), 0, 0), vertices=32, bevel=0.003),
        box("SM_CH_ExamTable_TearBar", (0.035, 0.72, 0.035), (-0.845, 0, 0.735), steel, 0.008, target),
    ]
    # Levelling feet, side bumpers, controls, and pediatric accent badge.
    for ix, x in enumerate((-0.51, 0.51)):
        for iy, y in enumerate((-0.25, 0.25)):
            objects.append(cylinder(f"SM_CH_ExamTable_LevelFoot_{ix}_{iy}", 0.036, 0.055, (x, y, 0.038), rubber, target,
                                    vertices=32, bevel=0.005))
    for y in (-0.335, 0.335):
        objects.append(box(f"SM_CH_ExamTable_SideBumper_{y:+.2f}", (0.62, 0.028, 0.085), (0.26, y, 0.73), rubber, 0.014, target))
    objects += [
        box("SM_CH_ExamTable_ControlPanel", (0.20, 0.025, 0.065), (-0.46, -0.346, 0.704), dark, 0.010, target,
            rotation=(math.radians(8), 0, 0)),
        cylinder("SM_CH_ExamTable_ControlButtonUp", 0.014, 0.008, (-0.50, -0.363, 0.714), accent, target,
                 rotation=(math.radians(90), 0, 0), vertices=32, bevel=0.002),
        cylinder("SM_CH_ExamTable_ControlButtonDown", 0.014, 0.008, (-0.43, -0.363, 0.714), accent, target,
                 rotation=(math.radians(90), 0, 0), vertices=32, bevel=0.002),
        box("SM_CH_ExamTable_AccentBadge", (0.16, 0.012, 0.055), (0.26, -0.354, 0.61), accent, 0.015, target),
    ]
    # Under-table cable relief loop.
    objects.append(torus("SM_CH_ExamTable_CableRelief", 0.055, 0.008, (-0.70, 0.30, 0.55), dark, target,
                         rotation=(math.radians(90), 0, 0)))
    for obj in objects:
        obj["lod"] = 0
        obj["asset_id"] = "CH-EXAMTABLE-001"
    return objects


def duplicate_lod(source_objects, target, level, ratio):
    copies = []
    for source in source_objects:
        copy = source.copy()
        copy.data = source.data.copy()
        copy.name = source.name.replace("SM_CH_", f"SM_CH_LOD{level}_")
        target.objects.link(copy)
        if copy.type == "MESH" and len(copy.data.polygons) > 48:
            mod = copy.modifiers.new(f"LOD{level}_Reduction", "DECIMATE")
            mod.ratio = ratio
            mod.use_collapse_triangulate = True
            bpy.context.view_layer.objects.active = copy
            copy.select_set(True)
            bpy.ops.object.modifier_apply(modifier=mod.name)
            copy.select_set(False)
        copy["lod"] = level
        copy.hide_render = True
        copy.hide_viewport = True
        copies.append(copy)
    return copies


def build_collision(target, collision_mat):
    shapes = [
        ("UCX_SM_CH_ExamTable_01_00", (1.38, 0.65, 0.58), (0.0, 0, 0.37)),
        ("UCX_SM_CH_ExamTable_01_01", (1.76, 0.71, 0.20), (0.0, 0, 0.84)),
        ("UCX_SM_CH_ExamTable_01_02", (0.50, 0.28, 0.08), (0.45, -0.30, 0.205)),
    ]
    result = []
    for name, size, loc in shapes:
        obj = box(name, size, loc, collision_mat, bevel=0.0, target=target)
        obj.display_type = "WIRE"
        obj.hide_render = True
        result.append(obj)
    return result


def select_collection(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_viewport = False
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]


def export_fbx(path, objects):
    select_collection(objects)
    bpy.ops.export_scene.fbx(
        filepath=str(path), use_selection=True, apply_unit_scale=True, apply_scale_options="FBX_SCALE_UNITS",
        axis_forward="-Y", axis_up="Z", bake_space_transform=False, add_leaf_bones=False,
        mesh_smooth_type="FACE", use_mesh_modifiers=True, use_custom_props=True, bake_anim=False,
    )


def build_studio(mats):
    scene = bpy.context.scene
    studio = collection("RENDER_STUDIO")
    floor = box("RenderFloor", (8, 8, 0.05), (0, 0, -0.04), mats[0], 0.0, studio)
    floor.hide_render = False
    floor.hide_viewport = False
    world = scene.world or bpy.data.worlds.new("ClinicalStudioWorld")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.035, 0.045, 0.055, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.35
    for name, loc, energy, size, color in (
        ("Key", (2.8, -3.2, 4.2), 1250, 3.0, (1.0, 0.93, 0.85)),
        ("Fill", (-3.1, -1.2, 2.5), 850, 2.5, (0.72, 0.86, 1.0)),
        ("Rim", (0.2, 3.0, 3.4), 1050, 2.0, (0.75, 0.9, 1.0)),
    ):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        data.color = color
        light = bpy.data.objects.new(name, data)
        studio.objects.link(light)
        light.location = loc
        point_camera(light, Vector((0, 0, 0.55)))
    camera_data = bpy.data.cameras.new("AssetValidationCamera")
    camera = bpy.data.objects.new("AssetValidationCamera", camera_data)
    studio.objects.link(camera)
    camera.data.lens = 58
    scene.camera = camera
    return camera


def point_camera(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def render_views(camera):
    scene = bpy.context.scene
    renderer = "EEVEE fallback"
    try:
        preferences = bpy.context.preferences.addons["cycles"].preferences
        preferences.compute_device_type = "OPTIX"
        preferences.get_devices()
        enabled = []
        for device in preferences.devices:
            device.use = device.type in {"OPTIX", "CUDA"}
            if device.use:
                enabled.append(device.name)
        if enabled:
            scene.render.engine = "CYCLES"
            scene.cycles.device = "GPU"
            scene.cycles.samples = 64
            scene.cycles.use_denoising = True
            scene.cycles.max_bounces = 6
            renderer = "OptiX: " + ", ".join(enabled)
        else:
            scene.render.engine = "BLENDER_EEVEE"
    except Exception:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1050
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.look = "AgX - Medium High Contrast"
    views = {
        "hero_three_quarter": ((2.85, -3.10, 2.10), (0.0, 0.0, 0.48)),
        "clinical_side": ((3.05, -0.15, 1.52), (0.0, 0.0, 0.50)),
        "cabinet_detail": ((1.55, -2.35, 1.15), (0.03, -0.05, 0.47)),
    }
    for name, (location, target) in views.items():
        camera.location = location
        point_camera(camera, Vector(target))
        scene.render.filepath = str(RENDER_DIR / f"CH_ExamTable_{name}.png")
        bpy.ops.render.render(write_still=True)
    print(f"VALIDATION_RENDERER={renderer}")
    return renderer


def mesh_stats(objects):
    return {
        "objects": len(objects),
        "vertices": sum(len(o.data.vertices) for o in objects if o.type == "MESH"),
        "triangles": sum(len(p.vertices) - 2 for o in objects if o.type == "MESH" for p in o.data.polygons),
    }


def main():
    reset_scene()
    lod0_collection = collection("CH_ExamTable_LOD0")
    lod1_collection = collection("CH_ExamTable_LOD1")
    lod2_collection = collection("CH_ExamTable_LOD2")
    collision_collection = collection("CH_ExamTable_COLLISION")

    white = material("MI_CH_PowderCoat_WarmWhite", (0.76, 0.79, 0.80), roughness=0.31, clearcoat=0.18)
    upholstery = material("MI_CH_Upholstery_Teal", (0.045, 0.205, 0.225), roughness=0.61, clearcoat=0.08)
    steel = material("MI_CH_BrushedSteel", (0.34, 0.38, 0.40), metallic=0.92, roughness=0.24)
    dark = material("MI_CH_ABS_Graphite", (0.035, 0.045, 0.055), roughness=0.38, clearcoat=0.12)
    accent = material("MI_CH_Pediatric_Coral", (0.82, 0.14, 0.085), roughness=0.36, clearcoat=0.22)
    rubber = material("MI_CH_Rubber_Tread", (0.018, 0.022, 0.024), roughness=0.78)
    collision = material("MI_CH_Collision_Debug", (1.0, 0.04, 0.02), roughness=0.4)
    maps = create_upholstery_textures()
    attach_upholstery_nodes(upholstery, maps)
    apply_pbr_set(white, "PowderCoat_WarmWhite", tiling=7.0, normal_strength=0.24)
    apply_pbr_set(upholstery, "MedicalVinyl_Teal", tiling=6.0, normal_strength=0.34)
    apply_pbr_set(steel, "BrushedSteel", tiling=5.0, normal_strength=0.28)
    apply_pbr_set(dark, "ABS_Graphite", tiling=8.0, normal_strength=0.26)
    apply_pbr_set(rubber, "Rubber_Black", tiling=9.0, normal_strength=0.30)
    mats = (white, upholstery, steel, dark, accent, rubber)

    lod0 = build_lod0(mats, lod0_collection)
    lod1 = duplicate_lod(lod0, lod1_collection, 1, 0.58)
    lod2 = duplicate_lod(lod0, lod2_collection, 2, 0.28)
    collisions = build_collision(collision_collection, collision)

    for obj in lod1 + lod2:
        obj.hide_render = True
        obj.hide_viewport = True
    for obj in lod0:
        obj.hide_render = False
        obj.hide_viewport = False

    export_fbx(EXPORT_DIR / "SM_CH_ExamTable_01_LOD0.fbx", lod0 + collisions)
    export_fbx(EXPORT_DIR / "SM_CH_ExamTable_01_LOD1.fbx", lod1)
    export_fbx(EXPORT_DIR / "SM_CH_ExamTable_01_LOD2.fbx", lod2)
    select_collection(lod0)
    bpy.ops.export_scene.gltf(filepath=str(EXPORT_DIR / "SM_CH_ExamTable_01_preview.glb"), export_format="GLB",
                              use_selection=True, export_apply=True, export_yup=True)

    camera = build_studio(mats)
    select_collection([])
    renderer = render_views(camera)

    manifest = {
        "asset_id": "CH-EXAMTABLE-001",
        "display_name": "CardioHospital Pediatric Exam Table",
        "authorship": "Original unbranded hard-surface asset authored for CardioHospital",
        "units": "metres",
        "dimensions_m": {"length": 1.82, "width": 0.72, "surface_height": 0.94},
        "origin": "floor center",
        "forward_axis": "-Y",
        "up_axis": "Z",
        "lod_stats": {"LOD0": mesh_stats(lod0), "LOD1": mesh_stats(lod1), "LOD2": mesh_stats(lod2)},
        "collision": [obj.name for obj in collisions],
        "uv_channels": ["UV0", "UV1_Lightmap"],
        "materials": [mat.name for mat in mats],
        "textures": {key: path.name for key, path in maps.items()},
        "texture_resolution": 4096,
        "validation_renderer": renderer,
        "shared_material_sets": ["PowderCoat_WarmWhite", "MedicalVinyl_Teal", "BrushedSteel", "ABS_Graphite", "Rubber_Black"],
        "unreal_import": {
            "combine_meshes": True,
            "import_normals_and_tangents": True,
            "generate_lightmap_uvs": False,
            "lod_distance_targets_m": [0, 6, 15],
            "nanite_recommended": True,
        },
        "license": "Project-owned original asset; no third-party geometry, trademarks, or reference imagery embedded.",
    }
    (ASSET_DIR / "asset_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(ASSET_DIR / "CH_PediatricExamTable_Production.blend"), compress=True)
    print(json.dumps(manifest["lod_stats"], indent=2))


if __name__ == "__main__":
    main()
