"""Author the original CardioHospital wall-mounted ECG workstation asset.

The display content is synthetic, contains no PHI, and is intended for simulation.
Dimensions are metres. Run in Blender 5.2 LTS with:
  blender --background --python scripts/build_wall_ecg.py
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


ASSET_DIR = Path(__file__).resolve().parents[1]
EXPORT_DIR = ASSET_DIR / "exports"
RENDER_DIR = ASSET_DIR / "renders"
TEXTURE_DIR = ASSET_DIR / "textures"
for folder in (EXPORT_DIR, RENDER_DIR, TEXTURE_DIR):
    folder.mkdir(parents=True, exist_ok=True)


def mat(name, color, metallic=0.0, roughness=0.45, emission=None, emission_strength=1.0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = (*color, 1.0)
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return material


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def collection(name):
    group = bpy.data.collections.get(name)
    if group is None:
        group = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(group)
    return group


def relink(obj, group):
    for current in list(obj.users_collection):
        current.objects.unlink(obj)
    group.objects.link(obj)


def uv_channels(obj):
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
        second = obj.data.uv_layers.new(name="UV1_Lightmap")
        for source, target in zip(obj.data.uv_layers[0].data, second.data):
            target.uv = source.uv
    obj.select_set(False)


def box(name, size, location, material, group, bevel=0.012, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        modifier = obj.modifiers.new("ProductionEdgeRadius", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        modifier.limit_method = "ANGLE"
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    uv_channels(obj)
    relink(obj, group)
    return obj


def cylinder(name, radius, depth, location, material, group, rotation=(0, 0, 0), vertices=48, bevel=0.003):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    if bevel:
        modifier = obj.modifiers.new("ProductionEdgeRadius", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    uv_channels(obj)
    relink(obj, group)
    return obj


def cylinder_between(name, start, end, radius, material, group, vertices=48):
    start, end = Vector(start), Vector(end)
    delta = end - start
    obj = cylinder(name, radius, delta.length, (start + end) / 2, material, group, vertices=vertices)
    obj.rotation_euler = delta.to_track_quat("Z", "Y").to_euler()
    return obj


def display_plane(name, size, location, material, group):
    """Create a full-frame UV display surface facing the asset's -Y front axis."""
    bpy.ops.mesh.primitive_plane_add(size=2.0, location=location, rotation=(math.radians(90), 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.scale = (size[0] / 2.0, size[1] / 2.0, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.uv_layers[0].name = "UV0"
    second = obj.data.uv_layers.new(name="UV1_Lightmap")
    for source, target in zip(obj.data.uv_layers[0].data, second.data):
        target.uv = source.uv
    obj.data.materials.append(material)
    relink(obj, group)
    return obj


def cable_curve(name, points, bevel, material, group):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 3
    curve.bevel_depth = bevel
    curve.bevel_resolution = 4
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    group.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def screen_material(scene, name, color, strength=2.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Emission Color"].default_value = (*color, 1.0)
    bsdf.inputs["Emission Strength"].default_value = strength
    bsdf.inputs["Roughness"].default_value = 0.35
    return material


def add_text(scene, body, location, size, material, align="LEFT"):
    data = bpy.data.curves.new(f"TXT_{body}", "FONT")
    data.body = body
    data.align_x = align
    data.align_y = "CENTER"
    data.size = size
    data.extrude = 0.001
    obj = bpy.data.objects.new(f"TXT_{body}", data)
    scene.collection.objects.link(obj)
    obj.location = (*location, 0.16)
    obj.data.materials.append(material)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target="MESH")
    return bpy.context.object


def line_curve(scene, name, points, material, thickness=0.006):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.resolution_u = 1
    data.bevel_depth = thickness
    data.bevel_resolution = 2
    spline = data.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for target, source in zip(spline.points, points):
        target.co = (source[0], source[1], 0.12, 1.0)
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def ecg_value(phase):
    def gaussian(center, width, amplitude):
        distance = min(abs(phase - center), 1.0 - abs(phase - center))
        return amplitude * math.exp(-((distance / width) ** 2))
    return (gaussian(0.18, 0.035, 0.12) - gaussian(0.39, 0.012, 0.20)
            + gaussian(0.415, 0.010, 1.05) - gaussian(0.445, 0.016, 0.32)
            + gaussian(0.70, 0.075, 0.28))


def bake_screen_state(key, title, heart_rate, spo2, bp, rhythm_scale, color_shift=0.0):
    scene = bpy.data.scenes.new(f"ECG_SCREEN_{key}")
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 4096
    scene.render.resolution_y = 2048
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new(f"ECG_WORLD_{key}")
    scene.world.color = (0.001, 0.003, 0.006)
    background = mat(f"M_UI_Background_{key}", (0.002, 0.008, 0.014), roughness=1.0, emission=(0.002, 0.008, 0.014), emission_strength=1)
    green = screen_material(scene, f"M_UI_Green_{key}", (0.05, 1.0, 0.32), 3.0)
    cyan = screen_material(scene, f"M_UI_Cyan_{key}", (0.05, 0.72, 1.0), 2.7)
    yellow = screen_material(scene, f"M_UI_Yellow_{key}", (1.0, 0.72, 0.08), 2.4)
    white = screen_material(scene, f"M_UI_White_{key}", (0.75, 0.9, 1.0), 1.8)
    dim = screen_material(scene, f"M_UI_Dim_{key}", (0.08, 0.24, 0.30), 1.2)
    alert = screen_material(scene, f"M_UI_Alert_{key}", (1.0, 0.18 + color_shift, 0.08), 2.8)

    bpy.context.window.scene = scene
    box("ScreenBackground", (2.0, 1.0, 0.02), (0, 0, 0), background, scene.collection, bevel=0)
    for x in (-0.68, 0.64):
        line_curve(scene, f"GridV{x}", [(x, -0.47), (x, 0.47)], dim, 0.002)
    for y in (-0.18, 0.15):
        line_curve(scene, f"GridH{y}", [(-0.98, y), (0.98, y)], dim, 0.002)

    add_text(scene, "CARDIOHOSPITAL  |  SIMULATION", (-0.94, 0.43), 0.052, white)
    add_text(scene, title, (-0.94, 0.34), 0.055, alert if key != "sinus" else green)
    add_text(scene, "LEAD II", (-0.94, 0.23), 0.040, green)
    add_text(scene, "PLETH", (-0.94, -0.10), 0.040, cyan)
    add_text(scene, "RESP", (-0.94, -0.40), 0.040, yellow)
    add_text(scene, str(heart_rate), (0.75, 0.24), 0.22, green, "CENTER")
    add_text(scene, "HR", (0.75, 0.38), 0.042, green, "CENTER")
    add_text(scene, f"{spo2}%", (0.75, -0.05), 0.125, cyan, "CENTER")
    add_text(scene, "SpO2", (0.75, 0.06), 0.040, cyan, "CENTER")
    add_text(scene, bp, (0.75, -0.31), 0.105, yellow, "CENTER")
    add_text(scene, "NIBP mmHg", (0.75, -0.20), 0.038, yellow, "CENTER")
    add_text(scene, "NO PATIENT DATA", (0.75, -0.44), 0.032, white, "CENTER")

    ecg_points, pleth_points, resp_points = [], [], []
    for index in range(900):
        x = -0.64 + index / 899 * 1.25
        phase = (index / 899 * rhythm_scale) % 1.0
        ecg_points.append((x, 0.21 + ecg_value(phase) * 0.19))
        pleth = max(0.0, math.sin(phase * math.tau)) ** 3
        pleth_points.append((x, -0.12 + pleth * 0.12 - math.sin(phase * math.tau * 2) * 0.018))
        resp_points.append((x, -0.40 + math.sin(index / 899 * math.tau * 2.2) * 0.045))
    line_curve(scene, f"ECG_{key}", ecg_points, green, 0.0045)
    line_curve(scene, f"PLETH_{key}", pleth_points, cyan, 0.004)
    line_curve(scene, f"RESP_{key}", resp_points, yellow, 0.0035)

    camera_data = bpy.data.cameras.new(f"ScreenCamera_{key}")
    camera = bpy.data.objects.new(f"ScreenCamera_{key}", camera_data)
    scene.collection.objects.link(camera)
    camera.location = (0, 0, 4)
    camera.rotation_euler = (0, 0, 0)
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = 1.0
    scene.camera = camera
    scene.render.filepath = str(TEXTURE_DIR / f"T_CH_WallECG_Screen_{key}_4K.png")
    bpy.ops.render.render(write_still=True)
    return Path(scene.render.filepath)


def screen_display_material(path):
    material = bpy.data.materials.new("MI_CH_ECG_Display_Sinus")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    image = nodes.new("ShaderNodeTexImage")
    image.image = bpy.data.images.load(str(path))
    image.image.colorspace_settings.name = "sRGB"
    links.new(image.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(image.outputs["Color"], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = 1.4
    bsdf.inputs["Roughness"].default_value = 0.18
    return material


def build_lod0(materials, group, screen_texture):
    white, graphite, steel, rubber, glass, coral, cyan, yellow = materials
    display = screen_display_material(screen_texture)
    objects = []
    # Wall plate, articulated arm, and VESA coupling.
    objects += [
        box("SM_CH_WallECG_WallPlate", (0.25, 0.045, 0.31), (0, 0.015, 0.0), white, group, 0.025),
        box("SM_CH_WallECG_PlateInset", (0.18, 0.018, 0.22), (0, -0.013, 0.0), graphite, group, 0.015),
        cylinder("SM_CH_WallECG_PivotWall", 0.062, 0.075, (0, -0.045, 0), steel, group,
                 rotation=(math.radians(90), 0, 0), vertices=64, bevel=0.005),
        cylinder_between("SM_CH_WallECG_ArmUpper", (0, -0.07, 0.0), (0.18, -0.16, 0.055), 0.038, white, group, 64),
        cylinder("SM_CH_WallECG_PivotElbow", 0.054, 0.082, (0.18, -0.16, 0.055), steel, group,
                 rotation=(math.radians(90), 0, 0), vertices=64, bevel=0.005),
        cylinder_between("SM_CH_WallECG_ArmLower", (0.18, -0.19, 0.055), (0.05, -0.28, 0.09), 0.033, white, group, 64),
        box("SM_CH_WallECG_VESA", (0.22, 0.042, 0.20), (0.05, -0.31, 0.09), graphite, group, 0.018),
    ]
    # Display housing, inset glass, protective bumper, and lower equipment rail.
    objects += [
        box("SM_CH_WallECG_RearShell", (0.80, 0.105, 0.48), (0, -0.365, 0.10), graphite, group, 0.045),
        box("SM_CH_WallECG_FrontHousing", (0.78, 0.055, 0.46), (0, -0.425, 0.10), white, group, 0.042),
        box("SM_CH_WallECG_Glass", (0.682, 0.012, 0.342), (-0.018, -0.459, 0.115), glass, group, 0.018),
        display_plane("SM_CH_WallECG_Display", (0.652, 0.315), (-0.018, -0.467, 0.115), display, group),
        box("SM_CH_WallECG_LowerRail", (0.66, 0.075, 0.055), (0, -0.405, -0.205), steel, group, 0.016),
        box("SM_CH_WallECG_BumperTop", (0.67, 0.022, 0.018), (-0.02, -0.474, 0.292), rubber, group, 0.009),
        box("SM_CH_WallECG_BumperBottom", (0.67, 0.022, 0.018), (-0.02, -0.474, -0.062), rubber, group, 0.009),
    ]
    # Right-side tactile control island.
    objects.append(box("SM_CH_WallECG_ControlIsland", (0.082, 0.026, 0.33), (0.35, -0.468, 0.10), graphite, group, 0.022))
    for index, z in enumerate((0.21, 0.145, 0.08, 0.015)):
        material = (coral, cyan, yellow, white)[index]
        objects.append(cylinder(f"SM_CH_WallECG_Button_{index+1}", 0.018, 0.010, (0.35, -0.488, z), material, group,
                                rotation=(math.radians(90), 0, 0), vertices=40, bevel=0.003))
    objects += [
        cylinder("SM_CH_WallECG_Dial", 0.035, 0.018, (0.35, -0.493, -0.045), steel, group,
                 rotation=(math.radians(90), 0, 0), vertices=64, bevel=0.004),
        box("SM_CH_WallECG_StatusLight", (0.034, 0.010, 0.012), (0.35, -0.489, 0.265), cyan, group, 0.005),
    ]
    # Lower ECG acquisition dock with color-coded lead ports.
    objects += [
        box("SM_CH_WallECG_AcquisitionDock", (0.45, 0.14, 0.16), (-0.08, -0.40, -0.315), white, group, 0.030),
        box("SM_CH_WallECG_DockFace", (0.39, 0.025, 0.105), (-0.08, -0.481, -0.315), graphite, group, 0.016),
    ]
    port_materials = (coral, yellow, cyan, white, coral, yellow)
    for index, x in enumerate((-0.235, -0.175, -0.115, -0.055, 0.005, 0.065)):
        objects.append(cylinder(f"SM_CH_WallECG_LeadPort_{index+1}", 0.013, 0.012, (x, -0.500, -0.315),
                                port_materials[index], group, rotation=(math.radians(90), 0, 0), vertices=32, bevel=0.002))
    objects += [
        box("SM_CH_WallECG_CableTray", (0.70, 0.15, 0.045), (0, -0.32, -0.425), graphite, group, 0.018),
        box("SM_CH_WallECG_AccentBadge", (0.13, 0.011, 0.033), (0.18, -0.493, -0.345), coral, group, 0.012),
    ]
    # Rear vents and service fasteners survive close inspection.
    for index, x in enumerate((-0.23, -0.15, -0.07, 0.01, 0.09, 0.17, 0.25)):
        objects.append(box(f"SM_CH_WallECG_Vent_{index+1}", (0.045, 0.012, 0.008), (x, -0.316, 0.29), rubber, group, 0.003))
    for index, (x, z) in enumerate(((-0.35, 0.29), (0.35, 0.29), (-0.35, -0.09), (0.35, -0.09))):
        objects.append(cylinder(f"SM_CH_WallECG_Fastener_{index+1}", 0.008, 0.008, (x, -0.319, z), steel, group,
                                rotation=(math.radians(90), 0, 0), vertices=24, bevel=0.001))
    cable_curve("SM_CH_WallECG_PowerCable", [(0.23, -0.32, -0.02), (0.32, -0.18, -0.18),
                                              (0.27, -0.11, -0.39), (0.12, -0.13, -0.48)], 0.008, rubber, group)
    cable_curve("SM_CH_WallECG_LeadBundle", [(-0.18, -0.50, -0.32), (-0.28, -0.58, -0.40),
                                             (-0.12, -0.62, -0.49), (0.10, -0.50, -0.46)], 0.006, graphite, group)
    for obj in objects:
        obj["asset_id"] = "CH-WALLECG-001"
        obj["lod"] = 0
    return objects


def duplicate_lod(sources, group, level, ratio):
    results = []
    for source in sources:
        copy = source.copy()
        if source.type == "MESH":
            copy.data = source.data.copy()
        elif source.data:
            copy.data = source.data.copy()
        copy.name = source.name.replace("SM_CH_", f"SM_CH_LOD{level}_")
        group.objects.link(copy)
        if copy.type == "MESH" and len(copy.data.polygons) > 48:
            modifier = copy.modifiers.new(f"LOD{level}_Reduction", "DECIMATE")
            modifier.ratio = ratio
            modifier.use_collapse_triangulate = True
            bpy.context.view_layer.objects.active = copy
            copy.select_set(True)
            bpy.ops.object.modifier_apply(modifier=modifier.name)
            copy.select_set(False)
        copy["lod"] = level
        copy.hide_render = True
        copy.hide_viewport = True
        results.append(copy)
    return results


def collisions(group, debug):
    specs = (
        ("UCX_SM_CH_WallECG_01_00", (0.82, 0.13, 0.50), (0, -0.39, 0.10)),
        ("UCX_SM_CH_WallECG_01_01", (0.48, 0.17, 0.19), (-0.08, -0.40, -0.315)),
        ("UCX_SM_CH_WallECG_01_02", (0.28, 0.34, 0.34), (0.07, -0.15, 0.03)),
        ("UCX_SM_CH_WallECG_01_03", (0.72, 0.17, 0.06), (0, -0.32, -0.425)),
    )
    result = []
    for name, size, location in specs:
        obj = box(name, size, location, debug, group, bevel=0)
        obj.display_type = "WIRE"
        obj.hide_render = True
        result.append(obj)
    return result


def select(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_viewport = False
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]


def export_fbx(path, objects):
    select(objects)
    bpy.ops.export_scene.fbx(filepath=str(path), use_selection=True, apply_unit_scale=True,
                             apply_scale_options="FBX_SCALE_UNITS", axis_forward="-Y", axis_up="Z",
                             mesh_smooth_type="FACE", use_mesh_modifiers=True, use_custom_props=True,
                             add_leaf_bones=False, bake_anim=False)


def point_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def configure_gpu_render(scene):
    renderer = "EEVEE"
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
    except Exception as error:
        scene.render.engine = "BLENDER_EEVEE"
        renderer = f"EEVEE fallback ({error})"
    print(f"VALIDATION_RENDERER={renderer}")
    return renderer


def render_studio(materials, lod0):
    scene = bpy.context.scene
    studio = collection("RENDER_STUDIO")
    wall = box("RenderWall", (3.6, 0.08, 2.6), (0, 0.16, 0), materials[0], studio, 0.02)
    wall.hide_render = False
    wall.hide_viewport = False
    floor = box("RenderFloor", (4.0, 4.0, 0.04), (0, -1.2, -1.28), materials[0], studio, 0)
    floor.hide_render = False
    floor.hide_viewport = False
    world = scene.world or bpy.data.worlds.new("ECGStudioWorld")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.028, 0.04, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.22
    for name, location, energy, size, color in (
        ("Key", (2.4, -2.6, 2.3), 900, 2.1, (1.0, 0.93, 0.84)),
        ("Fill", (-2.5, -1.8, 1.0), 600, 2.4, (0.65, 0.82, 1.0)),
        ("Rim", (0.8, 0.1, 2.4), 850, 1.8, (0.70, 0.90, 1.0)),
    ):
        data = bpy.data.lights.new(name, "AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        data.color = color
        light = bpy.data.objects.new(name, data)
        studio.objects.link(light)
        light.location = location
        point_at(light, (0, -0.35, 0.0))
    camera_data = bpy.data.cameras.new("AssetValidationCamera")
    camera = bpy.data.objects.new("AssetValidationCamera", camera_data)
    studio.objects.link(camera)
    camera.data.lens = 62
    scene.camera = camera
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1050
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"
    renderer = configure_gpu_render(scene)
    for obj in lod0:
        obj.hide_render = False
        obj.hide_viewport = False
    views = {
        "hero_front": ((1.45, -2.55, 0.85), (0.0, -0.32, -0.04)),
        "mount_profile": ((1.85, -1.15, 0.42), (0.0, -0.18, -0.02)),
        "controls_detail": ((0.72, -1.35, 0.25), (0.16, -0.42, -0.06)),
    }
    for name, (location, target) in views.items():
        camera.location = location
        point_at(camera, target)
        scene.render.filepath = str(RENDER_DIR / f"CH_WallECG_{name}.png")
        bpy.ops.render.render(write_still=True)
    return renderer


def stats(objects):
    return {
        "objects": len(objects),
        "vertices": sum(len(obj.data.vertices) for obj in objects if obj.type == "MESH"),
        "triangles": sum(len(poly.vertices) - 2 for obj in objects if obj.type == "MESH" for poly in obj.data.polygons),
    }


def main():
    screen_states = {
        key: TEXTURE_DIR / f"T_CH_WallECG_Screen_{key}_4K.png"
        for key in ("sinus", "tachy", "artifact")
    }
    missing = [path.name for path in screen_states.values() if not path.exists()]
    if missing:
        raise RuntimeError(f"Missing screen textures {missing}; run scripts/generate_ecg_screens.py first")
    main_scene = bpy.data.scenes.get("Scene")
    bpy.context.window.scene = main_scene
    reset_scene()
    lod0_group = collection("CH_WallECG_LOD0")
    lod1_group = collection("CH_WallECG_LOD1")
    lod2_group = collection("CH_WallECG_LOD2")
    collision_group = collection("CH_WallECG_COLLISION")
    white = mat("MI_CH_MedicalPolymer_White", (0.68, 0.73, 0.75), roughness=0.30)
    graphite = mat("MI_CH_ABS_Graphite", (0.025, 0.035, 0.045), roughness=0.34)
    steel = mat("MI_CH_BrushedSteel", (0.30, 0.34, 0.37), metallic=0.90, roughness=0.24)
    rubber = mat("MI_CH_Rubber_Black", (0.012, 0.016, 0.02), roughness=0.76)
    glass = mat("MI_CH_AntiGlareGlass", (0.03, 0.06, 0.08), metallic=0.0, roughness=0.12)
    coral = mat("MI_CH_Alert_Coral", (0.85, 0.07, 0.035), roughness=0.32, emission=(0.45, 0.015, 0.005), emission_strength=0.8)
    cyan = mat("MI_CH_Status_Cyan", (0.02, 0.40, 0.62), roughness=0.26, emission=(0.01, 0.36, 0.7), emission_strength=1.5)
    yellow = mat("MI_CH_Status_Amber", (0.88, 0.46, 0.025), roughness=0.30, emission=(0.7, 0.25, 0.01), emission_strength=1.0)
    debug = mat("MI_CH_Collision_Debug", (1.0, 0.02, 0.01), roughness=0.5)
    materials = (white, graphite, steel, rubber, glass, coral, cyan, yellow)
    lod0 = build_lod0(materials, lod0_group, screen_states["sinus"])
    lod1 = duplicate_lod(lod0, lod1_group, 1, 0.58)
    lod2 = duplicate_lod(lod0, lod2_group, 2, 0.27)
    collision_objects = collisions(collision_group, debug)
    export_fbx(EXPORT_DIR / "SM_CH_WallECG_01_LOD0.fbx", lod0 + collision_objects)
    export_fbx(EXPORT_DIR / "SM_CH_WallECG_01_LOD1.fbx", lod1)
    export_fbx(EXPORT_DIR / "SM_CH_WallECG_01_LOD2.fbx", lod2)
    select(lod0)
    bpy.ops.export_scene.gltf(filepath=str(EXPORT_DIR / "SM_CH_WallECG_01_preview.glb"), export_format="GLB",
                              use_selection=True, export_apply=True, export_yup=True)
    renderer = render_studio(materials, lod0)
    manifest = {
        "asset_id": "CH-WALLECG-001",
        "display_name": "CardioHospital Wall-Mounted ECG Workstation",
        "authorship": "Original unbranded hard-surface asset authored for CardioHospital",
        "clinical_content": "Synthetic simulation display states; no PHI",
        "units": "metres",
        "dimensions_m": {"width": 0.92, "depth_from_wall": 0.64, "height": 0.78},
        "origin": "wall mounting-plate center",
        "forward_axis": "-Y",
        "up_axis": "Z",
        "lod_stats": {"LOD0": stats(lod0), "LOD1": stats(lod1), "LOD2": stats(lod2)},
        "collision": [obj.name for obj in collision_objects],
        "uv_channels": ["UV0", "UV1_Lightmap"],
        "screen_states": {key: path.name for key, path in screen_states.items()},
        "screen_resolution": [4096, 2048],
        "validation_renderer": renderer,
        "unreal_import": {
            "combine_meshes": True,
            "import_normals_and_tangents": True,
            "generate_lightmap_uvs": False,
            "screen_material": "translucency disabled; emissive RGB texture",
            "suggested_lod_distance_m": [0, 7, 18],
            "nanite_recommended": True,
        },
        "license": "Project-owned original asset; no third-party geometry, trademarks, or patient data embedded.",
    }
    (ASSET_DIR / "asset_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(ASSET_DIR / "CH_WallECG_Production.blend"), compress=True)
    print(json.dumps(manifest["lod_stats"], indent=2))


if __name__ == "__main__":
    main()
