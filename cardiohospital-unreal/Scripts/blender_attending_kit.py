"""Tailored attending lab coat, trousers, and neck-draped stethoscope.

Standing 175 cm male, feet at origin, +Y forward. Mid-thigh open-front
white coat with a shoulder yoke so the sleeves actually join the body,
notched lapels, double-breasted buttons, patch pockets, and a Littmann
silhouette draped in front of the collar.

Run:
  blender --background --python Scripts/blender_attending_kit.py
"""

from __future__ import annotations

import math
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

OUT_DIR = Path(__file__).resolve().parents[1] / "Content" / "Environment" / "Source"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 0.01


def mat(name, color, roughness=0.5, metallic=0.0, specular=0.45):
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


def shade_smooth(obj):
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def bm_to_obj(name, bm, material=None):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if material:
        obj.data.materials.append(material)
    return shade_smooth(obj)


def apply_mods(obj, names):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    for name in names:
        if name in obj.modifiers:
            bpy.ops.object.modifier_apply(modifier=name)
    return obj


def solidify_subdiv(obj, thickness=0.9, levels=2, offset=1.0):
    solid = obj.modifiers.new("Solidify", "SOLIDIFY")
    solid.thickness = thickness
    solid.offset = offset
    solid.use_quality_normals = True
    sub = obj.modifiers.new("Subdiv", "SUBSURF")
    sub.levels = levels
    sub.render_levels = levels
    return apply_mods(obj, [solid.name, sub.name])


def join_keep_materials(name, objects):
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


def fit_to_patel(obj, y=-10.0, z=-8.0):
    """Patel's assembled body is not centered: chest ~+8 Y, back ~-28 Y,
    clavicle ~141 Z. Shift the standing coat onto that frame."""
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    obj.location = (0.0, y, z)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    return obj


def export_fbx(obj, filename, y=-10.0, z=-8.0):
    fit_to_patel(obj, y=y, z=z)
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
    print(f"exported {path} verts={len(obj.data.vertices)}")


def lerp(a, b, t):
    return a + (b - a) * t


def smoothstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def coat_radius(t):
    hem, mid, waist, chest, yoke = 22.4, 19.6, 16.8, 18.6, 19.8
    if t < 0.16:
        return lerp(hem, mid, smoothstep(t / 0.16))
    if t < 0.40:
        return lerp(mid, waist, smoothstep((t - 0.16) / 0.24))
    if t < 0.74:
        return lerp(waist, chest, smoothstep((t - 0.40) / 0.34))
    return lerp(chest, yoke, smoothstep((t - 0.74) / 0.26))


def body_point(t, u):
    z = lerp(60.0, 154.0, t)
    radius = coat_radius(t)
    depth = 0.84 + 0.08 * math.sin(min(1.0, t / 0.85) * math.pi)
    # Narrower opening at the chest, a little more ease at the hem.
    open_deg = lerp(18.0, 13.0, smoothstep(t))
    start = math.radians(-open_deg)
    sweep = math.radians(-(360.0 - 2.0 * open_deg))
    theta = start + u * sweep
    x = radius * math.sin(theta)
    y = radius * depth * math.cos(theta)
    if t > 0.90:
        neck = (t - 0.90) / 0.10
        x *= 1.0 - 0.22 * neck
        y *= 1.0 - 0.12 * neck
        z += 2.0 * neck
    return Vector((x, y, z))


def grid_surface(name, rings, segs, point_fn, material, thickness=1.05, levels=2, closed_u=False):
    bm = bmesh.new()
    verts = []
    for i in range(rings):
        t = i / (rings - 1)
        row = []
        count = segs if closed_u else segs
        for j in range(count):
            u = j / segs if closed_u else j / (segs - 1)
            row.append(bm.verts.new(point_fn(t, u)))
        verts.append(row)
    for i in range(rings - 1):
        for j in range(segs if closed_u else segs - 1):
            a = verts[i][j]
            b = verts[i][(j + 1) % segs] if closed_u else verts[i][j + 1]
            c = verts[i + 1][(j + 1) % segs] if closed_u else verts[i + 1][j + 1]
            d = verts[i + 1][j]
            bm.faces.new((a, b, c, d))
    obj = bm_to_obj(name, bm, material)
    return solidify_subdiv(obj, thickness=thickness, levels=levels, offset=1.0)


def sleeve_point(side, t, u):
    """Sleeve grows out of the shoulder, then hangs beside a standing arm."""
    root = Vector((side * 17.2, 1.0, 146.5))
    deltoid = Vector((side * 21.8, 1.6, 142.0))
    elbow = Vector((side * 22.6, 3.2, 114.0))
    wrist = Vector((side * 23.2, 5.2, 84.5))
    if t < 0.16:
        center = root.lerp(deltoid, t / 0.16)
        radius = lerp(8.6, 7.6, t / 0.16)
    elif t < 0.58:
        center = deltoid.lerp(elbow, (t - 0.16) / 0.42)
        radius = lerp(7.6, 6.4, (t - 0.16) / 0.42)
    else:
        center = elbow.lerp(wrist, (t - 0.58) / 0.42)
        radius = lerp(6.4, 5.5, (t - 0.58) / 0.42)
    angle = u * math.tau
    return center + Vector((
        math.cos(angle) * radius * 0.94,
        math.sin(angle) * radius * 1.04,
        math.sin(angle) * 0.4,
    ))


def make_sleeve(side, cloth):
    return grid_surface(
        "SleeveL" if side < 0 else "SleeveR",
        rings=12,
        segs=14,
        point_fn=lambda t, u: sleeve_point(side, t, u),
        material=cloth,
        thickness=0.9,
        levels=2,
        closed_u=True,
    )


def make_shoulder_cap(side, cloth):
    """Smooth deltoid that hides the sleeve-to-body join."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=18,
        ring_count=12,
        radius=1.0,
        location=(side * 18.4, 0.8, 146.8),
    )
    obj = bpy.context.active_object
    obj.name = "ShoulderL" if side < 0 else "ShoulderR"
    obj.scale = (8.8, 6.4, 6.0)
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(cloth)
    return shade_smooth(obj)


def make_cuff(side, cloth):
    return grid_surface(
        "CuffL" if side < 0 else "CuffR",
        rings=4,
        segs=16,
        point_fn=lambda t, u: Vector((
            side * 23.2 + math.cos(u * math.tau) * lerp(5.8, 6.1, t),
            5.2 + math.sin(u * math.tau) * lerp(5.8, 6.1, t),
            lerp(83.2, 88.4, t),
        )),
        material=cloth,
        thickness=1.2,
        levels=1,
        closed_u=True,
    )


def make_lapel(side, cloth):
    """Notched lapel leaf sitting on the chest, not a vertical slab."""
    bm = bmesh.new()
    pts = [
        Vector((side * 3.8, 16.0, 153.6)),
        Vector((side * 4.6, 16.4, 145.2)),
        Vector((side * 6.4, 16.8, 126.5)),
        Vector((side * 13.2, 17.6, 128.0)),
        Vector((side * 15.4, 17.0, 144.0)),
        Vector((side * 11.2, 16.4, 153.0)),
    ]
    verts = [bm.verts.new(p) for p in pts]
    bm.faces.new(verts)
    # Extra face so the notch reads.
    notch = [
        bm.verts.new(Vector((side * 5.0, 16.05, 144.8))),
        bm.verts.new(Vector((side * 9.4, 16.5, 146.6))),
        bm.verts.new(Vector((side * 14.2, 16.85, 144.4))),
    ]
    bm.faces.new(notch)
    obj = bm_to_obj("LapelL" if side < 0 else "LapelR", bm, cloth)
    return solidify_subdiv(obj, thickness=1.5, levels=2, offset=1.0)


def make_collar(cloth):
    bm = bmesh.new()
    rings, segs = 4, 16
    verts = []
    for i in range(rings):
        t = i / (rings - 1)
        row = []
        for j in range(segs):
            u = j / (segs - 1)
            theta = math.radians(-42.0 - u * 276.0)
            radius = lerp(10.8, 9.6, t)
            x = radius * math.sin(theta)
            y = radius * 0.72 * math.cos(theta) + 0.8
            z = lerp(153.6, 160.4, t) + 2.4 * t * (1.0 - abs(math.cos(theta)))
            row.append(bm.verts.new((x, y, z)))
        verts.append(row)
    for i in range(rings - 1):
        for j in range(segs - 1):
            bm.faces.new((verts[i][j], verts[i][j + 1], verts[i + 1][j + 1], verts[i + 1][j]))
    obj = bm_to_obj("Collar", bm, cloth)
    return solidify_subdiv(obj, thickness=1.55, levels=2, offset=1.0)


def make_pocket(name, location, size, cloth):
    w, d, h = size
    x, y, z = location
    bm = bmesh.new()
    corners = [
        (-w / 2, 0.0, -h / 2),
        (w / 2, 0.0, -h / 2),
        (w / 2, 0.0, h / 2),
        (-w / 2, 0.0, h / 2),
        (-w / 2, d, -h / 2),
        (w / 2, d, -h / 2),
        (w / 2, d, h / 2 - 1.0),
        (-w / 2, d, h / 2 - 1.0),
    ]
    verts = [bm.verts.new((x + c[0], y + c[1], z + c[2])) for c in corners]
    for face in (
        (0, 1, 2, 3),
        (4, 5, 6, 7),
        (0, 4, 7, 3),
        (1, 5, 6, 2),
        (0, 1, 5, 4),
        (3, 2, 6, 7),
    ):
        bm.faces.new([verts[i] for i in face])
    # Welt
    welt = [
        bm.verts.new((x - w / 2, y + d + 0.2, z + h / 2 - 0.2)),
        bm.verts.new((x + w / 2, y + d + 0.2, z + h / 2 - 0.2)),
        bm.verts.new((x + w / 2, y + d + 0.2, z + h / 2 + 1.1)),
        bm.verts.new((x - w / 2, y + d + 0.2, z + h / 2 + 1.1)),
    ]
    bm.faces.new(welt)
    obj = bm_to_obj(name, bm, cloth)
    return solidify_subdiv(obj, thickness=0.4, levels=1, offset=1.0)


def make_button(name, location, metal, scale=1.0):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=18,
        radius=0.95 * scale,
        depth=0.5 * scale,
        location=location,
        rotation=(math.radians(90.0), 0.0, 0.0),
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(metal)
    return shade_smooth(obj)


def make_shirt_and_tie(shirt_mat, tie_mat):
    shirt = grid_surface(
        "ShirtFront",
        rings=10,
        segs=7,
        point_fn=lambda t, u: Vector((
            lerp(-5.6, 5.6, u),
            13.6 + 0.8 * math.sin(t * math.pi),
            lerp(86.0, 152.5, t),
        )),
        material=shirt_mat,
        thickness=0.5,
        levels=1,
    )
    # Shirt collar points
    bm = bmesh.new()
    for side in (-1.0, 1.0):
        pts = [
            Vector((0.0, 14.4, 153.2)),
            Vector((side * 5.4, 14.8, 152.0)),
            Vector((side * 4.4, 15.6, 147.2)),
            Vector((side * 0.6, 15.0, 149.4)),
        ]
        bm.faces.new([bm.verts.new(p) for p in pts])
    collar = bm_to_obj("ShirtCollar", bm, shirt_mat)
    solidify_subdiv(collar, thickness=0.7, levels=1, offset=1.0)

    bm = bmesh.new()
    knot = [
        Vector((-1.7, 15.0, 148.8)),
        Vector((1.7, 15.0, 148.8)),
        Vector((2.1, 15.2, 145.4)),
        Vector((-2.1, 15.2, 145.4)),
    ]
    blade = [
        Vector((-1.4, 15.1, 145.4)),
        Vector((1.4, 15.1, 145.4)),
        Vector((2.3, 15.4, 109.0)),
        Vector((0.0, 15.6, 105.0)),
        Vector((-2.3, 15.4, 109.0)),
    ]
    bm.faces.new([bm.verts.new(p) for p in knot])
    bm.faces.new([bm.verts.new(p) for p in blade])
    tie = bm_to_obj("Tie", bm, tie_mat)
    solidify_subdiv(tie, thickness=0.75, levels=1, offset=1.0)
    return shirt, collar, tie


def build_lab_coat():
    cloth = mat("M_LabCoat", (0.97, 0.97, 0.95), roughness=0.36, specular=0.58)
    shirt_mat = mat("M_DressShirt", (0.99, 0.99, 0.98), roughness=0.30)
    tie_mat = mat("M_AttendingTie", (0.08, 0.14, 0.26), roughness=0.42)
    metal = mat("M_CoatButton", (0.80, 0.81, 0.83), roughness=0.20, metallic=0.9, specular=0.75)

    parts = [
        grid_surface("CoatBody", 16, 24, body_point, cloth, thickness=1.15, levels=2),
        make_sleeve(-1.0, cloth),
        make_sleeve(1.0, cloth),
        make_shoulder_cap(-1.0, cloth),
        make_shoulder_cap(1.0, cloth),
        make_cuff(-1.0, cloth),
        make_cuff(1.0, cloth),
        make_lapel(-1.0, cloth),
        make_lapel(1.0, cloth),
        make_collar(cloth),
        make_pocket("PocketL", (-11.4, 16.2, 90.5), (11.0, 1.8, 13.6), cloth),
        make_pocket("PocketR", (11.4, 16.2, 90.5), (11.0, 1.8, 13.6), cloth),
        make_pocket("Breast", (9.4, 16.4, 131.0), (8.0, 1.4, 9.4), cloth),
    ]
    parts.extend(make_shirt_and_tie(shirt_mat, tie_mat))
    for index, z in enumerate((145.5, 134.0, 122.5)):
        parts.append(make_button(f"BtnL{index}", (-6.6, 16.9, z), metal))
        parts.append(make_button(f"BtnR{index}", (6.6, 16.9, z), metal))
    parts.append(make_button("CuffBtnL", (-28.6, 6.4, 85.6), metal, 0.68))
    parts.append(make_button("CuffBtnR", (28.6, 6.4, 85.6), metal, 0.68))
    return join_keep_materials("SM_LabCoat", parts)


def trouser_point(side, t, u):
    waist = Vector((side * 8.2, 1.0, 99.0))
    hip = Vector((side * 9.4, 1.6, 84.0))
    knee = Vector((side * 7.4, 2.2, 47.0))
    ankle = Vector((side * 6.0, 2.6, 9.0))
    if t < 0.20:
        center = waist.lerp(hip, t / 0.20)
        radius = lerp(8.8, 9.6, t / 0.20)
    elif t < 0.58:
        center = hip.lerp(knee, (t - 0.20) / 0.38)
        radius = lerp(9.6, 7.1, (t - 0.20) / 0.38)
    else:
        center = knee.lerp(ankle, (t - 0.58) / 0.42)
        radius = lerp(7.1, 5.5, (t - 0.58) / 0.42)
    angle = u * math.tau
    return center + Vector((
        math.cos(angle) * radius * 0.94,
        math.sin(angle) * radius * 1.08,
        0.0,
    ))


def build_trousers():
    wool = mat("M_Trouser", (0.08, 0.09, 0.12), roughness=0.64)
    left = grid_surface("TrouserL", 12, 14, lambda t, u: trouser_point(-1.0, t, u), wool, 0.7, 2, True)
    right = grid_surface("TrouserR", 12, 14, lambda t, u: trouser_point(1.0, t, u), wool, 0.7, 2, True)
    seat = grid_surface(
        "Seat",
        6,
        12,
        lambda t, u: Vector((
            lerp(-12.8, 12.8, u),
            1.0 + 7.2 * math.sin(u * math.pi) * (0.30 + 0.70 * math.sin(t * math.pi)),
            lerp(87.0, 101.0, t),
        )),
        wool,
        0.85,
        1,
    )
    return join_keep_materials("SM_Trousers", [left, right, seat])


def curve_tube(name, points, radius, material, resolution=7):
    curve = bpy.data.curves.new(name, type="CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    curve.bevel_resolution = resolution
    curve.fill_mode = "FULL"
    curve.resolution_u = 16
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for index, co in enumerate(points):
        point = spline.bezier_points[index]
        point.co = co
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target="MESH")
    obj.data.materials.append(material)
    return shade_smooth(obj)


def make_chest_piece(metal, rubber):
    rot = (math.radians(72.0), 0.0, math.radians(16.0))
    loc = (8.4, 16.6, 114.8)
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=2.85, depth=0.75, location=loc, rotation=rot)
    diaphragm = bpy.context.active_object
    diaphragm.name = "Diaphragm"
    diaphragm.data.materials.append(metal)
    shade_smooth(diaphragm)

    bpy.ops.mesh.primitive_cone_add(
        vertices=22, radius1=1.7, radius2=0.5, depth=1.7,
        location=(7.8, 15.4, 113.6), rotation=rot,
    )
    bell = bpy.context.active_object
    bell.name = "Bell"
    bell.data.materials.append(metal)
    shade_smooth(bell)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=2.85, minor_radius=0.26, major_segments=24, minor_segments=8,
        location=loc, rotation=rot,
    )
    rim = bpy.context.active_object
    rim.name = "DiaphragmRim"
    rim.data.materials.append(rubber)
    shade_smooth(rim)

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12, radius=0.42, depth=2.0,
        location=(7.2, 14.8, 116.4),
        rotation=(math.radians(50.0), 0.0, math.radians(10.0)),
    )
    stem = bpy.context.active_object
    stem.name = "Stem"
    stem.data.materials.append(metal)
    shade_smooth(stem)
    return [diaphragm, bell, rim, stem]


def build_stethoscope():
    rubber = mat("M_ScopeTube", (0.05, 0.05, 0.055), roughness=0.46)
    metal = mat("M_ScopeMetal", (0.76, 0.77, 0.79), roughness=0.16, metallic=0.94, specular=0.82)
    ear = mat("M_ScopeEar", (0.03, 0.03, 0.035), roughness=0.55)

    # Iconic attending drape: U sits on the collar in front, then hangs
    # down the chest to a dual-head chest piece.
    collar_u = curve_tube(
        "CollarU",
        [
            Vector((-11.2, 7.0, 154.0)),
            Vector((-7.0, 12.4, 157.6)),
            Vector((0.0, 14.6, 158.8)),
            Vector((7.0, 12.4, 157.6)),
            Vector((11.2, 7.0, 154.0)),
        ],
        radius=0.46,
        material=rubber,
    )
    left_hang = curve_tube(
        "LeftHang",
        [
            Vector((-11.2, 7.0, 154.0)),
            Vector((-10.4, 8.8, 146.0)),
            Vector((-8.6, 11.0, 136.0)),
            Vector((-3.2, 13.2, 126.0)),
            Vector((0.6, 14.4, 122.0)),
        ],
        radius=0.44,
        material=rubber,
    )
    right_hang = curve_tube(
        "RightHang",
        [
            Vector((11.2, 7.0, 154.0)),
            Vector((10.6, 9.4, 144.0)),
            Vector((9.4, 13.2, 128.0)),
            Vector((8.6, 15.2, 118.0)),
        ],
        radius=0.44,
        material=rubber,
    )
    binaural = curve_tube(
        "Binaural",
        [
            Vector((-10.2, 5.0, 155.6)),
            Vector((-6.6, -2.4, 160.4)),
            Vector((0.0, -6.8, 161.6)),
            Vector((6.6, -2.4, 160.4)),
            Vector((10.2, 5.0, 155.6)),
        ],
        radius=0.30,
        material=metal,
    )

    parts = [collar_u, left_hang, right_hang, binaural]
    for side, name in ((-1.0, "EarL"), (1.0, "EarR")):
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=16, ring_count=10, radius=0.78,
            location=(side * 10.6, 5.6, 155.2),
        )
        earpiece = bpy.context.active_object
        earpiece.name = name
        earpiece.data.materials.append(ear)
        parts.append(shade_smooth(earpiece))
    parts.extend(make_chest_piece(metal, rubber))
    return join_keep_materials("SM_Stethoscope", parts)


def main():
    builders = [
        (build_lab_coat, "SM_LabCoat.fbx", -10.0, -8.0),
        (build_trousers, "SM_Trousers.fbx", -10.0, 0.0),
        (build_stethoscope, "SM_Stethoscope.fbx", -10.0, -8.0),
    ]
    for build, filename, y, z in builders:
        reset_scene()
        export_fbx(build(), filename, y=y, z=z)


if __name__ == "__main__":
    main()
