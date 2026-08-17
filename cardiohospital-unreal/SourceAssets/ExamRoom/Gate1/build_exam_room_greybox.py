Exit code: 0
Wall time: 0.4 seconds
Output:
"""Build the Gate 1 pediatric cardiology exam-room benchmark greybox."""

from pathlib import Path
import json
import math

import bpy
from mathutils import Vector


OUTPUT = Path(r"C:\Users\sht001\Documents\Codex\2026-08-17\im\outputs")
OUTPUT.mkdir(parents=True, exist_ok=True)
ROOM_W, ROOM_D, ROOM_H = 4.27, 3.96, 2.74
WALL = 0.12


def reset():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def material(name, color, roughness=0.65, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, alpha)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    if alpha < 1:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.surface_render_method = "DITHERED"
    return mat


def box(name, size, location, mat, bevel=0.005, collection=None):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new("ConstructionEdge", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mat)
    if collection:
        for source in list(obj.users_collection):
            source.objects.unlink(obj)
        collection.objects.link(obj)
    return obj


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def wall_with_opening_y(name, y, opening_x, opening_w, sill, opening_h, wall_mat):
    left_edge, right_edge = -ROOM_W / 2, ROOM_W / 2
    open_left, open_right = opening_x - opening_w / 2, opening_x + opening_w / 2
    if open_left > left_edge:
        box(name + "_Left", (open_left - left_edge, WALL, ROOM_H), ((left_edge + open_left) / 2, y, ROOM_H / 2), wall_mat)
    if open_right < right_edge:
        box(name + "_Right", (right_edge - open_right, WALL, ROOM_H), ((open_right + right_edge) / 2, y, ROOM_H / 2), wall_mat)
    if sill > 0:
        box(name + "_Below", (opening_w, WALL, sill), (opening_x, y, sill / 2), wall_mat)
    top = sill + opening_h
    if top < ROOM_H:
        box(name + "_Above", (opening_w, WALL, ROOM_H - top), (opening_x, y, top + (ROOM_H - top) / 2), wall_mat)


def add_camera(name, location, target, lens=50):
    data = bpy.data.cameras.new(name)
    camera = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(camera)
    camera.location = location
    camera.data.lens = lens
    camera.data.sensor_width = 36
    look_at(camera, target)
    camera["benchmark_camera"] = True
    return camera


def main():
    reset()
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    wall_mat = material("GB_Wall", (0.63, 0.66, 0.68))
    floor_mat = material("GB_Floor", (0.30, 0.34, 0.36), 0.48)
    ceiling_mat = material("GB_Ceiling", (0.76, 0.78, 0.78), 0.82)
    trim_mat = material("GB_Protection", (0.36, 0.43, 0.46), 0.5)
    glass_mat = material("GB_Window", (0.18, 0.42, 0.56), 0.15, 0.35)
    exam_mat = material("ZONE_ExamTable", (0.16, 0.48, 0.52), 0.55, 0.80)
    equipment_mat = material("ZONE_Equipment", (0.93, 0.34, 0.18), 0.55, 0.75)
    seating_mat = material("ZONE_Seating", (0.40, 0.30, 0.60), 0.55, 0.75)

    architecture = bpy.data.collections.new("GB_ARCHITECTURE")
    scene.collection.children.link(architecture)
    zones = bpy.data.collections.new("GB_CLEARANCE_ZONES")
    scene.collection.children.link(zones)
    hardware = bpy.data.collections.new("GB_CEILING_HARDWARE")
    scene.collection.children.link(hardware)

    box("GB_FinishedFloor", (ROOM_W, ROOM_D, 0.10), (0, 0, -0.05), floor_mat, collection=architecture)
    box("GB_Wall_West", (WALL, ROOM_D, ROOM_H), (-ROOM_W / 2, 0, ROOM_H / 2), wall_mat, collection=architecture)
    box("GB_Wall_East", (WALL, ROOM_D, ROOM_H), (ROOM_W / 2, 0, ROOM_H / 2), wall_mat, collection=architecture)
    # South doorway: 0.91 m clear, slightly left of room center.
    wall_with_opening_y("GB_Wall_South", -ROOM_D / 2, -1.05, 0.91, 0.0, 2.13, wall_mat)
    # North daylight window: provisional 1.80 x 1.20 m, 0.95 m sill.
    wall_with_opening_y("GB_Wall_North", ROOM_D / 2, 0.55, 1.80, 0.95, 1.20, wall_mat)
    box("GB_WindowGlass", (1.76, 0.025, 1.16), (0.55, ROOM_D / 2 - 0.02, 1.55), glass_mat, 0.002, architecture)

    # Door leaf shown open toward the shallow waiting-area vignette.
    door = box("GB_DoorLeaf", (0.91, 0.045, 2.13), (-1.05, -ROOM_D / 2 - 0.03, 1.065), trim_mat, 0.01, architecture)
    door.rotation_euler.z = math.radians(-68)
    door.location.x = -1.48
    door.location.y = -2.32
    door.hide_render = True

    # Shallow, non-traversal waiting-area sightline.
    box("GB_WaitingFloor", (2.40, 1.55, 0.10), (-0.85, -2.78, -0.05), floor_mat, collection=architecture)
    box("GB_WaitingBackWall", (2.40, WALL, ROOM_H), (-0.85, -3.55, ROOM_H / 2), wall_mat, collection=architecture)
    box("GB_WaitingSideReturn", (WALL, 1.55, ROOM_H), (0.35, -2.78, ROOM_H / 2), wall_mat, collection=architecture)

    # Baseboard and wall-protection bands establish the architectural hierarchy.
    for x in (-ROOM_W / 2 + 0.065, ROOM_W / 2 - 0.065):
        box(f"GB_Baseboard_X_{x:+.2f}", (0.035, ROOM_D - 0.12, 0.12), (x, 0, 0.06), trim_mat, 0.003, architecture)
        box(f"GB_ChairRail_X_{x:+.2f}", (0.045, ROOM_D - 0.12, 0.13), (x, 0, 0.92), trim_mat, 0.006, architecture)
    for y in (-ROOM_D / 2 + 0.065, ROOM_D / 2 - 0.065):
        box(f"GB_Baseboard_Y_{y:+.2f}", (ROOM_W - 0.12, 0.035, 0.12), (0, y, 0.06), trim_mat, 0.003, architecture)
        box(f"GB_ChairRail_Y_{y:+.2f}", (ROOM_W - 0.12, 0.045, 0.13), (0, y, 0.92), trim_mat, 0.006, architecture)

    # Ceiling tiles and exposed review grid.
    tile = 0.61
    x_count = int(ROOM_W / tile)
    y_count = int(ROOM_D / tile)
    x_start = -(x_count - 1) * tile / 2
    y_start = -(y_count - 1) * tile / 2
    for ix in range(x_count):
        for iy in range(y_count):
            box(f"GB_CeilingTile_{ix}_{iy}", (tile - 0.018, tile - 0.018, 0.025),
                (x_start + ix * tile, y_start + iy * tile, ROOM_H), ceiling_mat, 0.002, architecture)
    for ix in range(x_count + 1):
        x = x_start - tile / 2 + ix * tile
        box(f"GB_CeilingRailX_{ix}", (0.018, ROOM_D, 0.035), (x, 0, ROOM_H - 0.006), trim_mat, 0.001, hardware)
    for iy in range(y_count + 1):
        y = y_start - tile / 2 + iy * tile
        box(f"GB_CeilingRailY_{iy}", (ROOM_W, 0.018, 0.035), (0, y, ROOM_H - 0.006), trim_mat, 0.001, hardware)
    for index, (x, y) in enumerate(((-0.9, 0.55), (0.9, -0.55))):
        box(f"GB_LED_Troffer_{index+1}", (1.18, 0.29, 0.04), (x, y, ROOM_H - 0.045), ceiling_mat, 0.008, hardware)
    box("GB_HVAC_Supply", (0.58, 0.58, 0.04), (-1.48, -1.18, ROOM_H - 0.045), trim_mat, 0.008, hardware)
    box("GB_HVAC_Return", (0.58, 0.29, 0.04), (1.48, 1.18, ROOM_H - 0.045), trim_mat, 0.008, hardware)

    # Provisional equipment envelopes; not production props.
    envelope_specs = (
        ("ZONE_ExamTable", (1.85, 0.78, 0.95), (0.48, 0.34, 0.475), exam_mat),
        ("ZONE_ProviderWorkstation", (1.25, 0.62, 1.25), (-1.42, 0.92, 0.625), equipment_mat),
        ("ZONE_ECGStation", (0.90, 0.45, 0.80), (1.62, 0.72, 1.42), equipment_mat),
        ("ZONE_BloodPressure", (0.48, 0.48, 1.30), (1.62, -0.78, 0.65), equipment_mat),
        ("ZONE_ParentChair", (0.78, 0.82, 1.05), (-1.43, -0.62, 0.525), seating_mat),
        ("ZONE_PhysicianStool", (0.58, 0.58, 0.78), (0.15, -0.98, 0.39), seating_mat),
    )
    for name, size, location, zone_mat in envelope_specs:
        obj = box(name, size, location, zone_mat, 0.025, zones)
        wire = obj.modifiers.new("ReviewEnvelopeWire", "WIREFRAME")
        wire.thickness = 0.009
        wire.use_replace = True
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=wire.name)
        obj["review_only"] = True

    # Neutral review lighting; final lighting remains an Unreal Gate 2 task.
    world = scene.world or bpy.data.worlds.new("GB_World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.055, 0.07, 0.085, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.15
    for index, (x, y) in enumerate(((-0.9, 0.55), (0.9, -0.55))):
        data = bpy.data.lights.new(f"GB_TrofferLight_{index+1}", "AREA")
        data.energy = 140
        data.shape = "RECTANGLE"
        data.size = 1.15
        data.size_y = 0.28
        data.color = (0.88, 0.94, 1.0)
        light = bpy.data.objects.new(data.name, data)
        scene.collection.objects.link(light)
        light.location = (x, y, ROOM_H - 0.10)
        light.rotation_euler = (0, 0, 0)
    day = bpy.data.lights.new("GB_DaylightContribution", "AREA")
    day.energy = 220
    day.shape = "RECTANGLE"
    day.size = 1.75
    day.size_y = 1.15
    day.color = (0.70, 0.84, 1.0)
    daylight = bpy.data.objects.new(day.name, day)
    scene.collection.objects.link(daylight)
    daylight.location = (0.55, 2.18, 1.55)
    daylight.rotation_euler = (math.radians(90), 0, 0)

    cameras = {
        "CAM_Benchmark_Doorway": add_camera("CAM_Benchmark_Doorway", (-1.05, -1.86, 1.70), (0.15, 0.35, 1.18), 30),
        "CAM_Benchmark_PatientSide": add_camera("CAM_Benchmark_PatientSide", (1.88, -1.72, 1.92), (-0.10, 0.25, 1.10), 32),
        "CAM_Benchmark_Provider": add_camera("CAM_Benchmark_Provider", (-1.88, -1.68, 1.92), (0.32, 0.30, 1.08), 32),
    }
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"
    for name, camera in cameras.items():
        scene.camera = camera
        scene.render.filepath = str(OUTPUT / f"{name}.png")
        bpy.ops.render.render(write_still=True)

    plan_data = bpy.data.cameras.new("CAM_ClearancePlan")
    plan_camera = bpy.data.objects.new("CAM_ClearancePlan", plan_data)
    scene.collection.objects.link(plan_camera)
    plan_camera.location = (0, 0, 8)
    plan_camera.data.type = "ORTHO"
    plan_camera.data.ortho_scale = 5.6
    hidden_for_plan = [obj for obj in scene.objects if obj.name.startswith("GB_Ceiling") or obj.name.startswith("GB_LED")
                       or obj.name.startswith("GB_HVAC")]
    for obj in hidden_for_plan:
        obj.hide_render = True
    scene.camera = plan_camera
    scene.render.filepath = str(OUTPUT / "CAM_ClearancePlan.png")
    bpy.ops.render.render(write_still=True)
    for obj in hidden_for_plan:
        obj.hide_render = False

    # Exports are review artifacts; clearance envelopes remain visible by design.
    bpy.ops.object.select_all(action="DESELECT")
    export_objects = [obj for obj in scene.objects if obj.type in {"MESH", "CURVE"}]
    for obj in export_objects:
        obj.select_set(True)
    bpy.ops.export_scene.fbx(filepath=str(OUTPUT / "CH_ExamRoom_Gate1_Greybox.fbx"), use_selection=True,
                             axis_forward="-Y", axis_up="Z", bake_anim=False, add_leaf_bones=False)
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / "CH_ExamRoom_Gate1_Greybox.glb"), export_format="GLB",
                              use_selection=True, export_apply=True, export_yup=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / "CH_ExamRoom_Gate1_Greybox.blend"), compress=True)
    manifest = {
        "gate": "Gate 1 - Architectural greybox",
        "status": "provisional; requires clinical-layout and reference-board review",
        "dimensions_m": {"width": ROOM_W, "depth": ROOM_D, "height": ROOM_H},
        "door_clear_m": [0.91, 2.13],
        "window_opening_m": [1.80, 1.20],
        "benchmark_cameras": {
            name: {"location_m": [round(v, 4) for v in camera.location],
                   "rotation_radians": [round(v, 6) for v in camera.rotation_euler], "lens_mm": camera.data.lens}
            for name, camera in cameras.items()
        },
        "equipment_zones": [name for name, *_ in envelope_specs],
        "production_warning": "No greybox geometry or clearance volume is approved final art.",
    }
    (OUTPUT / "CH_ExamRoom_Gate1_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()

