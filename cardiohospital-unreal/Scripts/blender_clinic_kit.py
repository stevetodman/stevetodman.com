"""Build attending clothes and clinic furniture for Unreal (cm, Z-up).

Run:
  blender --background --python Scripts/blender_clinic_kit.py
"""

from __future__ import annotations

from pathlib import Path

import bpy
import mathutils

OUT_DIR = Path(__file__).resolve().parents[1] / "Content" / "Environment" / "Source"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 0.01  # 1 blender unit = 1 cm


def mat(name, color, roughness=0.55, metallic=0.0, specular=0.4):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*color, 1.0)
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
        spec_key = "Specular IOR Level" if "Specular IOR Level" in bsdf.inputs else "Specular"
        if spec_key in bsdf.inputs:
            bsdf.inputs[spec_key].default_value = specular
    return material


def cube(name, size, location, material, bevel=0.8):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(material)
    return obj


def join(name, objects, material=None):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    objects[0].name = name
    if material:
        objects[0].data.materials.clear()
        objects[0].data.materials.append(material)
    return objects[0]


def origin_to_world_zero(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.context.scene.cursor.location = (0.0, 0.0, 0.0)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")


def export_fbx(obj, filename):
    origin_to_world_zero(obj)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    path = OUT_DIR / filename
    bpy.ops.export_scene.fbx(
        filepath=str(path),
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
        embed_textures=False,
    )
    print(f"exported {path}")


def _open_front_and_solidify(obj, front_y=7.0, thickness=1.15):
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for vertex in obj.data.vertices:
        vertex.select = vertex.co.y > front_y and abs(vertex.co.x) < 8.0
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    solid = obj.modifiers.new("Solidify", "SOLIDIFY")
    solid.thickness = thickness
    solid.offset = 1.0
    bpy.ops.object.modifier_apply(modifier=solid.name)
    sub = obj.modifiers.new("Subdiv", "SUBSURF")
    sub.levels = 2
    sub.render_levels = 2
    bpy.ops.object.modifier_apply(modifier=sub.name)
    return obj


def build_lab_coat():
    cloth = mat("M_LabCoat", (0.97, 0.97, 0.96), roughness=0.48)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=28, radius=17.5, depth=96, location=(0.0, 1.5, 118.0)
    )
    body = bpy.context.active_object
    body.name = "CoatBody"
    body.scale = (1.05, 0.92, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    # A-line: widen the hem.
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for vertex in body.data.vertices:
        vertex.select = vertex.co.z < -30.0
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.transform.resize(value=(1.18, 1.12, 1.0))
    bpy.ops.object.mode_set(mode="OBJECT")
    _open_front_and_solidify(body, front_y=8.5, thickness=1.2)

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16, radius=7.2, depth=54, location=(-23.0, 1.0, 138.0),
        rotation=(1.15, 0.0, 0.35),
    )
    left = bpy.context.active_object
    left.name = "LeftSleeve"
    _open_front_and_solidify(left, front_y=20.0, thickness=0.9)

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16, radius=7.2, depth=54, location=(23.0, 1.0, 138.0),
        rotation=(1.15, 0.0, -0.35),
    )
    right = bpy.context.active_object
    right.name = "RightSleeve"
    _open_front_and_solidify(right, front_y=20.0, thickness=0.9)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=10.5, minor_radius=2.4, major_segments=20, minor_segments=8,
        location=(0.0, 3.5, 168.0), rotation=(0.55, 0.0, 0.0),
    )
    collar = bpy.context.active_object
    collar.name = "Collar"
    sub = collar.modifiers.new("Subdiv", "SUBSURF")
    sub.levels = 1
    bpy.ops.object.modifier_apply(modifier=sub.name)

    pockets = [
        cube("PocketL", (9, 1.4, 11), (-11, 14.5, 102), cloth, 0.35),
        cube("PocketR", (9, 1.4, 11), (11, 14.5, 102), cloth, 0.35),
        cube("Breast", (7, 1.3, 8), (10, 14.2, 142), cloth, 0.25),
    ]
    return join("SM_LabCoat", [body, left, right, collar, *pockets], cloth)


def build_trousers():
    wool = mat("M_Trouser", (0.10, 0.11, 0.14), roughness=0.58)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16, radius=8.2, depth=78, location=(-7.5, 1.0, 44.0)
    )
    left = bpy.context.active_object
    left.scale = (1.0, 0.92, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    sub = left.modifiers.new("Subdiv", "SUBSURF")
    sub.levels = 1
    bpy.ops.object.modifier_apply(modifier=sub.name)

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16, radius=8.2, depth=78, location=(7.5, 1.0, 44.0)
    )
    right = bpy.context.active_object
    right.scale = (1.0, 0.92, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    sub = right.modifiers.new("Subdiv", "SUBSURF")
    sub.levels = 1
    bpy.ops.object.modifier_apply(modifier=sub.name)

    seat = cube("Seat", (28, 18, 18), (0, 1.5, 86), wool, 1.4)
    return join("SM_Trousers", [seat, left, right], wool)


def build_exam_table():
    pad = mat("M_ExamPad", (0.86, 0.87, 0.89), roughness=0.55)
    steel = mat("M_Steel", (0.55, 0.58, 0.62), roughness=0.28, metallic=0.75)
    parts = [
        cube("Top", (200, 70, 8), (0, 0, 82), pad, 0.8),
        cube("Headrest", (50, 64, 6), (-80, 0, 90), pad, 0.6),
        cube("Base", (70, 40, 8), (0, 0, 8), steel, 0.4),
        cube("Column", (14, 14, 68), (0, 0, 42), steel, 0.4),
        cube("RailL", (180, 3, 6), (0, 34, 78), steel, 0.3),
        cube("RailR", (180, 3, 6), (0, -34, 78), steel, 0.3),
    ]
    return join("SM_ExamTable", parts)


def build_hospital_bed():
    linen = mat("M_Linen", (0.94, 0.95, 0.96), roughness=0.65)
    frame = mat("M_BedFrame", (0.18, 0.22, 0.28), roughness=0.4, metallic=0.35)
    parts = [
        cube("Mattress", (200, 88, 16), (0, 0, 48), linen, 1.0),
        cube("Pillow", (36, 52, 10), (-72, 0, 62), linen, 1.2),
        cube("Base", (206, 94, 10), (0, 0, 18), frame, 0.4),
        cube("Headboard", (8, 94, 70), (-104, 0, 52), frame, 0.5),
        cube("Footboard", (6, 90, 36), (104, 0, 36), frame, 0.4),
        cube("RailL", (160, 4, 18), (0, 48, 58), frame, 0.3),
        cube("RailR", (160, 4, 18), (0, -48, 58), frame, 0.3),
    ]
    return join("SM_HospitalBed", parts)


def build_desk():
    wood = mat("M_DeskWood", (0.78, 0.80, 0.82), roughness=0.42)
    metal = mat("M_DeskMetal", (0.45, 0.47, 0.5), roughness=0.35, metallic=0.55)
    parts = [
        cube("Top", (180, 80, 6), (0, 0, 76), wood, 0.5),
        cube("Drawer", (50, 60, 12), (-40, 4, 64), wood, 0.3),
        cube("LegFL", (6, 6, 72), (-82, 32, 36), metal, 0.2),
        cube("LegFR", (6, 6, 72), (82, 32, 36), metal, 0.2),
        cube("LegBL", (6, 6, 72), (-82, -32, 36), metal, 0.2),
        cube("LegBR", (6, 6, 72), (82, -32, 36), metal, 0.2),
        cube("Modesty", (170, 2, 28), (0, -28, 50), wood, 0.2),
    ]
    return join("SM_ClinicDesk", parts)


def build_chair():
    fabric = mat("M_ChairFabric", (0.16, 0.22, 0.28), roughness=0.62)
    metal = mat("M_ChairMetal", (0.5, 0.52, 0.55), roughness=0.3, metallic=0.7)
    parts = [
        cube("Seat", (44, 44, 6), (0, 0, 44), fabric, 0.6),
        cube("Back", (44, 6, 46), (0, -19, 70), fabric, 0.6),
        cube("LegFL", (4, 4, 42), (-18, 16, 21), metal, 0.15),
        cube("LegFR", (4, 4, 42), (18, 16, 21), metal, 0.15),
        cube("LegBL", (4, 4, 42), (-18, -16, 21), metal, 0.15),
        cube("LegBR", (4, 4, 42), (18, -16, 21), metal, 0.15),
    ]
    return join("SM_ClinicChair", parts)


def build_door_jamb():
    frame = mat("M_DoorFrame", (0.42, 0.44, 0.46), roughness=0.45)
    parts = [
        cube("Left", (12, 20, 220), (-54, 0, 110), frame, 0.3),
        cube("Right", (12, 20, 220), (54, 0, 110), frame, 0.3),
        cube("Header", (120, 20, 14), (0, 0, 227), frame, 0.3),
    ]
    return join("SM_DoorJamb", parts)


def build_baseboard():
    paint = mat("M_Baseboard", (0.92, 0.93, 0.94), roughness=0.42)
    return cube("SM_Baseboard", (100, 4, 10), (0, 0, 5), paint, 0.2)


def build_ceiling_light():
    plastic = mat("M_LightHousing", (0.92, 0.93, 0.94), roughness=0.35)
    diffuser = mat("M_LightDiffuser", (0.96, 0.98, 1.0), roughness=0.18)
    parts = [
        cube("Housing", (160, 36, 6), (0, 0, 3), plastic, 0.3),
        cube("Lens", (148, 28, 2), (0, 0, 0.5), diffuser, 0.2),
    ]
    return join("SM_CeilingLight", parts)


def build_monitor():
    bezel = mat("M_Bezel", (0.08, 0.09, 0.1), roughness=0.35)
    screen = mat("M_Screen", (0.15, 0.45, 0.48), roughness=0.18)
    parts = [
        cube("Frame", (56, 6, 36), (0, 0, 18), bezel, 0.2),
        cube("Glass", (50, 1.5, 30), (0, 3.2, 18), screen, 0.1),
    ]
    return join("SM_WallMonitor", parts)


def main():
    reset_scene()
    builders = [
        (build_exam_table, "SM_ExamTable.fbx"),
        (build_hospital_bed, "SM_HospitalBed.fbx"),
        (build_desk, "SM_ClinicDesk.fbx"),
        (build_chair, "SM_ClinicChair.fbx"),
        (build_door_jamb, "SM_DoorJamb.fbx"),
        (build_baseboard, "SM_Baseboard.fbx"),
        (build_ceiling_light, "SM_CeilingLight.fbx"),
        (build_monitor, "SM_WallMonitor.fbx"),
    ]
    for build, filename in builders:
        reset_scene()
        export_fbx(build(), filename)


if __name__ == "__main__":
    main()
