"""Clinic architecture kit: paneled walls, tiled floor, drop ceiling, windows.

Run:
  blender --background --python Scripts/blender_clinic_architecture.py
"""

from __future__ import annotations

from pathlib import Path

import bpy

OUT_DIR = Path(__file__).resolve().parents[1] / "Content" / "Environment" / "Source"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 0.01


def mat(name, color, roughness=0.55, metallic=0.0, specular=0.35):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*color, 1.0)
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
    return material


def cube(name, size, location, material, bevel=0.4):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(material)
    return obj


def join(name, objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    objects[0].name = name
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


def tile_uvs(obj, tile_cm):
    mesh = obj.data
    if not mesh.uv_layers:
        mesh.uv_layers.new(name="UVMap")
    uv = mesh.uv_layers.active.data
    for poly in mesh.polygons:
        for loop_index in poly.loop_indices:
            vert = mesh.vertices[mesh.loops[loop_index].vertex_index]
            uv[loop_index].uv = (vert.co.x / tile_cm, vert.co.y / tile_cm)


def build_wall_panel():
    paint = mat("M_WallPaint", (0.96, 0.97, 0.98), roughness=0.38)
    wainscot = mat("M_Wainscot", (0.88, 0.90, 0.92), roughness=0.30)
    trim = mat("M_WallTrim", (0.97, 0.98, 0.99), roughness=0.34)
    # 100 cm wide, 12 cm thick, 350 cm tall. Origin at floor center.
    parts = [
        cube("Upper", (100, 10, 230), (0, 0, 235), paint, 0.2),
        cube("Lower", (100, 11, 110), (0, 0, 55), wainscot, 0.3),
        cube("Base", (100, 13, 10), (0, 1, 5), trim, 0.15),
        cube("ChairRail", (100, 13, 6), (0, 1, 112), trim, 0.15),
        cube("Crown", (100, 13, 8), (0, 1, 346), trim, 0.2),
        cube("Seam", (1.2, 12, 350), (49.4, 0, 175), trim, 0.05),
    ]
    return join("SM_WallPanel", parts)


def build_floor_tile():
    vinyl = mat("M_ClinicFloor", (0.74, 0.76, 0.78), roughness=0.36)
    grout = mat("M_FloorGrout", (0.52, 0.54, 0.56), roughness=0.50)
    parts = [cube("Slab", (200, 200, 3), (0, 0, 1.5), vinyl, 0.05)]
    for x in (-50, 50):
        parts.append(cube(f"GX{x}", (1.2, 200, 3.2), (x, 0, 1.6), grout, 0.0))
    for y in (-50, 50):
        parts.append(cube(f"GY{y}", (200, 1.2, 3.2), (0, y, 1.6), grout, 0.0))
    obj = join("SM_FloorTile", parts)
    tile_uvs(obj, 100.0)
    return obj


def build_ceiling_tile():
    tile = mat("M_CeilingTile", (0.97, 0.98, 0.99), roughness=0.50)
    grid = mat("M_CeilingGrid", (0.78, 0.80, 0.82), roughness=0.32, metallic=0.2)
    parts = [cube("Field", (196, 196, 2), (0, 0, 0), tile, 0.1)]
    parts.append(cube("FrameX", (200, 4, 3), (0, 98, 0), grid, 0.05))
    parts.append(cube("FrameX2", (200, 4, 3), (0, -98, 0), grid, 0.05))
    parts.append(cube("FrameY", (4, 200, 3), (98, 0, 0), grid, 0.05))
    parts.append(cube("FrameY2", (4, 200, 3), (-98, 0, 0), grid, 0.05))
    return join("SM_CeilingTile", parts)


def build_window_unit():
    frame = mat("M_WindowFrame", (0.55, 0.58, 0.60), roughness=0.32, metallic=0.45)
    glass = mat("M_WindowGlass", (0.55, 0.72, 0.86), roughness=0.08)
    sill = mat("M_WindowSill", (0.74, 0.75, 0.73), roughness=0.4)
    parts = [
        cube("Outer", (280, 10, 140), (0, 0, 0), frame, 0.3),
        cube("Glass", (248, 2, 112), (0, 0, 0), glass, 0.1),
        cube("Mullion", (4, 8, 112), (0, 0, 0), frame, 0.1),
        cube("Sill", (292, 16, 6), (0, 6, -70), sill, 0.2),
        cube("Head", (292, 12, 6), (0, 2, 70), frame, 0.2),
    ]
    return join("SM_WindowUnit", parts)


def main():
    for build, filename in (
        (build_wall_panel, "SM_WallPanel.fbx"),
        (build_floor_tile, "SM_FloorTile.fbx"),
        (build_ceiling_tile, "SM_CeilingTile.fbx"),
        (build_window_unit, "SM_WindowUnit.fbx"),
    ):
        reset_scene()
        export_fbx(build(), filename)


if __name__ == "__main__":
    main()
