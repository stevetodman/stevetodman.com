"""Gate 2 architectural shell for Exam Room 3.

Blender 4.2+ / 5.x, metres, Z-up. Run on the RTX 4090:

    blender --background --python build_exam_room_architecture.py

This is authored modular architecture with temporary materials, not Hunyuan,
and not final Unreal lighting.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
GATE1 = HERE.parent / "Gate1"
if str(GATE1) not in sys.path:
    sys.path.insert(0, str(GATE1))

from exam_room_greybox_layout import (  # noqa: E402
    CAMERAS,
    DOOR_H,
    DOOR_W,
    DOOR_X,
    ENVELOPES,
    LAYOUT_VERSION,
    ROOM_D,
    ROOM_H,
    ROOM_W,
    SINK,
    WALL,
    WINDOW_H,
    WINDOW_SILL,
    WINDOW_W,
    WINDOW_X,
)

OUTPUT = HERE / "generated"


def reset():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.materials) + list(bpy.data.cameras) + list(bpy.data.lights):
        if block.users == 0:
            block.id_data.user_remap(block) if False else None
            try:
                block.user_clear()
            except Exception:
                pass


def collection(name):
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


def material(name, color, roughness=0.6, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = (*color, 1.0)
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return mat


def add_uvs(obj):
    if obj.type != "MESH":
        return
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    try:
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.02)
    except RuntimeError:
        pass
    bpy.ops.object.mode_set(mode="OBJECT")
    if not obj.data.uv_layers:
        obj.data.uv_layers.new(name="UV0")
    obj.data.uv_layers[0].name = "UV0"
    if len(obj.data.uv_layers) < 2:
        lightmap = obj.data.uv_layers.new(name="UV1_Lightmap")
        for src, dst in zip(obj.data.uv_layers[0].data, lightmap.data):
            dst.uv = src.uv
    obj.select_set(False)


def box(name, size, location, mat, target, bevel=0.004, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new("Edge", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    add_uvs(obj)
    move_to(obj, target)
    obj["asset_units"] = "metres"
    return obj


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def wall_opening(name, y, opening_x, opening_w, sill, opening_h, wall_mat, target):
    left, right = -ROOM_W / 2, ROOM_W / 2
    open_l, open_r = opening_x - opening_w / 2, opening_x + opening_w / 2
    if open_l > left:
        box(name + "_Left", (open_l - left, WALL, ROOM_H), ((left + open_l) / 2, y, ROOM_H / 2), wall_mat, target)
    if open_r < right:
        box(name + "_Right", (right - open_r, WALL, ROOM_H), ((open_r + right) / 2, y, ROOM_H / 2), wall_mat, target)
    if sill > 0:
        box(name + "_SillWall", (opening_w, WALL, sill), (opening_x, y, sill / 2), wall_mat, target)
    top = sill + opening_h
    if top < ROOM_H:
        box(name + "_Header", (opening_w, WALL, ROOM_H - top), (opening_x, y, top + (ROOM_H - top) / 2), wall_mat, target)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    reset()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0

    wall = material("MI_CH_Drywall_Temp", (0.78, 0.79, 0.77), 0.62)
    paint_protect = material("MI_CH_WallProtection_Temp", (0.38, 0.44, 0.42), 0.48)
    floor = material("MI_CH_LVT_Temp", (0.28, 0.30, 0.31), 0.42)
    ceiling = material("MI_CH_CeilingTile_Temp", (0.82, 0.83, 0.82), 0.86)
    metal = material("MI_CH_PowderCoat_Temp", (0.72, 0.73, 0.71), 0.4)
    steel = material("MI_CH_Steel_Temp", (0.55, 0.56, 0.57), 0.32, 1.0)
    glass = material("MI_CH_Glass_Temp", (0.22, 0.38, 0.46), 0.12)
    laminate = material("MI_CH_Laminate_Temp", (0.62, 0.60, 0.56), 0.45)
    sink_mat = material("MI_CH_Sink_Temp", (0.70, 0.71, 0.72), 0.22, 1.0)

    arch = collection("SM_CH_ExamRoom_Architecture")
    trim = collection("SM_CH_ExamRoom_Trim")
    ceil = collection("SM_CH_ExamRoom_Ceiling")
    case = collection("SM_CH_ExamRoom_Casework")
    review = collection("SM_CH_ExamRoom_ReviewOnly")

    box("SM_CH_Floor", (ROOM_W, ROOM_D, 0.08), (0, 0, -0.04), floor, arch, 0.002)
    box("SM_CH_Wall_West", (WALL, ROOM_D, ROOM_H), (-ROOM_W / 2, 0, ROOM_H / 2), wall, arch)
    box("SM_CH_Wall_East", (WALL, ROOM_D, ROOM_H), (ROOM_W / 2, 0, ROOM_H / 2), wall, arch)
    wall_opening("SM_CH_Wall_South", -ROOM_D / 2, DOOR_X, DOOR_W, 0.0, DOOR_H, wall, arch)
    wall_opening("SM_CH_Wall_North", ROOM_D / 2, WINDOW_X, WINDOW_W, WINDOW_SILL, WINDOW_H, wall, arch)

    box(
        "SM_CH_WindowGlass",
        (WINDOW_W - 0.06, 0.02, WINDOW_H - 0.06),
        (WINDOW_X, ROOM_D / 2 - 0.03, WINDOW_SILL + WINDOW_H / 2),
        glass,
        arch,
        0.001,
    )
    box(
        "SM_CH_WindowSill",
        (WINDOW_W + 0.04, 0.10, 0.03),
        (WINDOW_X, ROOM_D / 2 - 0.06, WINDOW_SILL),
        paint_protect,
        trim,
        0.003,
    )

    door = box("SM_CH_DoorLeaf", (DOOR_W, 0.045, DOOR_H), (DOOR_X, -ROOM_D / 2 - 0.04, DOOR_H / 2), metal, arch, 0.008)
    door.rotation_euler.z = math.radians(-68)
    door.location.x = -1.48
    door.location.y = -2.32
    box("SM_CH_DoorCloser", (0.22, 0.06, 0.05), (-0.62, -ROOM_D / 2 - 0.02, DOOR_H - 0.08), metal, trim, 0.002)
    box("SM_CH_KickPlate", (DOOR_W - 0.08, 0.004, 0.20), (DOOR_X, -ROOM_D / 2 - 0.07, 0.14), steel, trim, 0.001)

    box("SM_CH_WaitingFloor", (2.40, 1.55, 0.08), (-0.85, -2.78, -0.04), floor, arch, 0.002)
    box("SM_CH_WaitingBack", (2.40, WALL, ROOM_H), (-0.85, -3.55, ROOM_H / 2), wall, arch)
    box("SM_CH_WaitingReturn", (WALL, 1.55, ROOM_H), (0.35, -2.78, ROOM_H / 2), wall, arch)

    for x in (-ROOM_W / 2 + 0.07, ROOM_W / 2 - 0.07):
        box(f"SM_CH_Base_X_{x:+.2f}", (0.012, ROOM_D - 0.10, 0.10), (x, 0, 0.05), paint_protect, trim, 0.002)
        box(f"SM_CH_Rail_X_{x:+.2f}", (0.018, ROOM_D - 0.10, 0.12), (x, 0, 0.92), paint_protect, trim, 0.003)
    for y in (-ROOM_D / 2 + 0.07, ROOM_D / 2 - 0.07):
        box(f"SM_CH_Base_Y_{y:+.2f}", (ROOM_W - 0.10, 0.012, 0.10), (0, y, 0.05), paint_protect, trim, 0.002)
        box(f"SM_CH_Rail_Y_{y:+.2f}", (ROOM_W - 0.10, 0.018, 0.12), (0, y, 0.92), paint_protect, trim, 0.003)

    tile = 0.61
    x_count = int(ROOM_W / tile)
    y_count = int(ROOM_D / tile)
    x0 = -(x_count - 1) * tile / 2
    y0 = -(y_count - 1) * tile / 2
    for ix in range(x_count):
        for iy in range(y_count):
            box(
                f"SM_CH_CeilingTile_{ix}_{iy}",
                (tile - 0.016, tile - 0.016, 0.02),
                (x0 + ix * tile, y0 + iy * tile, ROOM_H),
                ceiling,
                ceil,
                0.001,
            )
    for ix in range(x_count + 1):
        box(f"SM_CH_CeilingGridX_{ix}", (0.016, ROOM_D, 0.03), (x0 - tile / 2 + ix * tile, 0, ROOM_H - 0.005), metal, ceil, 0.0)
    for iy in range(y_count + 1):
        box(f"SM_CH_CeilingGridY_{iy}", (ROOM_W, 0.016, 0.03), (0, y0 - tile / 2 + iy * tile, ROOM_H - 0.005), metal, ceil, 0.0)
    for i, (x, y) in enumerate(((-0.9, 0.55), (0.9, -0.55))):
        box(f"SM_CH_Troffer_{i+1}", (1.20, 0.30, 0.05), (x, y, ROOM_H - 0.04), metal, ceil, 0.004)
    box("SM_CH_HVAC_Supply", (0.58, 0.58, 0.04), (-1.48, -1.18, ROOM_H - 0.04), metal, ceil, 0.004)
    box("SM_CH_HVAC_Return", (0.58, 0.28, 0.04), (1.48, 1.18, ROOM_H - 0.04), metal, ceil, 0.004)
    box("SM_CH_Sprinkler", (0.08, 0.08, 0.04), (0.0, 0.0, ROOM_H - 0.03), steel, ceil, 0.004)
    box("SM_CH_Speaker", (0.16, 0.16, 0.03), (1.2, -1.4, ROOM_H - 0.03), metal, ceil, 0.002)

    # West casework: sink near door, computer toward the foot of the table.
    box("SM_CH_Casework_Carcass", (0.62, 2.20, 0.88), (-1.825, 0.25, 0.44), laminate, case, 0.008)
    box("SM_CH_Casework_Counter", (0.64, 2.22, 0.04), (-1.815, 0.25, 0.90), laminate, case, 0.003)
    box("SM_CH_SinkBowl", (0.42, 0.42, 0.16), tuple(SINK["location"]), sink_mat, case, 0.006)
    box("SM_CH_Faucet", (0.04, 0.04, 0.18), (-1.62, -0.45, 1.08), steel, case, 0.002)
    box("SM_CH_Monitor", (0.06, 0.52, 0.34), (-1.58, 0.85, 1.28), metal, case, 0.003)
    box("SM_CH_Keyboard", (0.16, 0.42, 0.02), (-1.62, 0.85, 0.93), metal, case, 0.001)

    for name, size, loc in (
        ("SM_CH_Outlet_West", (0.01, 0.07, 0.12), (-ROOM_W / 2 + 0.07, -0.9, 0.40)),
        ("SM_CH_Outlet_East", (0.01, 0.07, 0.12), (ROOM_W / 2 - 0.07, 0.2, 0.40)),
        ("SM_CH_Switch_South", (0.07, 0.01, 0.12), (-0.45, -ROOM_D / 2 + 0.07, 1.15)),
    ):
        box(name, size, loc, metal, trim, 0.001)

    # Review envelopes stay visible so the 4090 stills can be checked against v2.
    zone_mat = material("MI_CH_ReviewZone", (0.2, 0.55, 0.5), 0.5)
    for spec in ENVELOPES:
        if spec["name"] == "ZONE_WestCasework":
            continue
        obj = box(spec["name"], spec["size"], spec["location"], zone_mat, review, 0.01)
        wire = obj.modifiers.new("Review", "WIREFRAME")
        wire.thickness = 0.008
        wire.use_replace = True
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=wire.name)
        obj["review_only"] = True
        obj.hide_render = True

    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.06, 0.07, 0.08, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.2
    for i, (x, y) in enumerate(((-0.9, 0.55), (0.9, -0.55))):
        data = bpy.data.lights.new(f"Troffer_{i+1}", "AREA")
        data.energy = 160
        data.shape = "RECTANGLE"
        data.size = 1.18
        data.size_y = 0.28
        data.color = (0.90, 0.94, 1.0)
        light = bpy.data.objects.new(data.name, data)
        scene.collection.objects.link(light)
        light.location = (x, y, ROOM_H - 0.12)
    day = bpy.data.lights.new("Daylight", "AREA")
    day.energy = 240
    day.shape = "RECTANGLE"
    day.size = 1.7
    day.size_y = 1.1
    day.color = (0.72, 0.84, 1.0)
    sun = bpy.data.objects.new(day.name, day)
    scene.collection.objects.link(sun)
    sun.location = (WINDOW_X, 2.2, WINDOW_SILL + WINDOW_H / 2)
    sun.rotation_euler = (math.radians(90), 0, 0)

    cameras = {}
    for name, spec in CAMERAS.items():
        data = bpy.data.cameras.new(name)
        cam = bpy.data.objects.new(name, data)
        scene.collection.objects.link(cam)
        cam.location = spec["location"]
        cam.data.lens = spec["lens_mm"]
        cam.data.sensor_width = 36
        look_at(cam, spec["target"])
        cameras[name] = cam

    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 2560
    scene.render.resolution_y = 1440
    scene.render.image_settings.file_format = "PNG"
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    for name, cam in cameras.items():
        scene.camera = cam
        scene.render.filepath = str(OUTPUT / f"{name}.png")
        bpy.ops.render.render(write_still=True)

    bpy.ops.object.select_all(action="DESELECT")
    exportable = [o for o in scene.objects if o.type == "MESH" and not o.get("review_only")]
    for obj in exportable:
        obj.select_set(True)
    bpy.ops.export_scene.fbx(
        filepath=str(OUTPUT / "SM_CH_ExamRoom3_Architecture.fbx"),
        use_selection=True,
        axis_forward="-Y",
        axis_up="Z",
        bake_anim=False,
        add_leaf_bones=False,
    )
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT / "SM_CH_ExamRoom3_Architecture.glb"),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / "SM_CH_ExamRoom3_Architecture.blend"), compress=True)

    manifest = {
        "gate": "Gate 2 - Architectural shell",
        "layout": LAYOUT_VERSION,
        "materials": "temporary",
        "units": "metres",
        "room_m": {"width": ROOM_W, "depth": ROOM_D, "height": ROOM_H},
        "exports": [
            "SM_CH_ExamRoom3_Architecture.blend",
            "SM_CH_ExamRoom3_Architecture.fbx",
            "SM_CH_ExamRoom3_Architecture.glb",
        ],
        "cameras": list(CAMERAS),
        "note": "Review envelopes are excluded from FBX/GLB. Lighting is not final.",
    }
    (OUTPUT / "asset_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
