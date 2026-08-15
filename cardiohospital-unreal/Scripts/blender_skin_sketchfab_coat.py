"""Skin the Sketchfab CC-BY lab coat and stethoscope to Patel's armature.

A static overlay cannot follow MetaHuman idle. This script:

  1. Imports the Unreal-exported Patel body (bind-pose armature + mesh).
  2. Scales the zeryshahid fabric coat onto that body (collar at neck_01).
  3. Transfers Patel vertex groups and parents the coat to the armature.
  4. Places the rigged stethoscope around the neck and transfers weights.
  5. Exports SK_LabCoat.fbx and SK_Stethoscope.fbx for Unreal skeletal import
     onto SKM_Patel_BodyMesh's existing skeleton.

Does not write SKM_Patel_Body.fbx into Content (do not cook the body export).

Run:
  blender --background --python Scripts/blender_skin_sketchfab_coat.py
"""

from __future__ import annotations

from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Content" / "Environment" / "Source"
SKETCH_COAT = SOURCE / "Sketchfab" / "lab-coat"
SKETCH_SCOPE = SOURCE / "Sketchfab" / "stethoscope"
PREVIEW_DIR = Path("/tmp/cardio-assets/skin-preview")
BODY_CANDIDATES = (
    Path("/tmp/cardio-assets/patel-export/SKM_Patel_Body.fbx"),
    SOURCE / "SKM_Patel_Body.fbx",
)

# Body mesh ends at the neck stump (~132 cm). Collar should sit on neck_01.
NECK_Z = 147.1
HEM_CUT_Z = 68.0
MAX_WEIGHTS = 4


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 0.01


def find_asset(folder: Path):
    for pattern in ("*.glb", "*.fbx", "*.gltf"):
        hits = sorted(folder.rglob(pattern))
        if hits:
            return hits[0]
    return None


def import_any(path: Path):
    suffix = path.suffix.lower()
    before = set(bpy.data.objects)
    if suffix == ".fbx":
        # Keep Unreal bone axes. automatic_bone_orientation rewrites them
        # and the re-imported skeleton will not match SKM_Patel_BodyMesh.
        bpy.ops.import_scene.fbx(filepath=str(path), automatic_bone_orientation=False)
    elif suffix in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=str(path))
    else:
        raise RuntimeError(f"unsupported {path}")
    return [obj for obj in bpy.data.objects if obj not in before]


def world_bounds(obj):
    xs, ys, zs = [], [], []
    for vert in obj.data.vertices:
        point = obj.matrix_world @ vert.co
        xs.append(point.x)
        ys.append(point.y)
        zs.append(point.z)
    if not xs:
        return 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)


def select_only(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def strip_deformers(obj):
    select_only(obj)
    for modifier in list(obj.modifiers):
        obj.modifiers.remove(modifier)
    while obj.vertex_groups:
        obj.vertex_groups.remove(obj.vertex_groups[0])


def flatten_to_world(obj):
    strip_deformers(obj)
    matrix = obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world = matrix
    select_only(obj)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def join_meshes(name, objects):
    if not objects:
        return None
    for obj in objects:
        flatten_to_world(obj)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    active = bpy.context.view_layer.objects.active
    active.name = name
    return active


def make_material(name, color, roughness=0.38, metallic=0.0):
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


def assign_material(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)


def delete_below(obj, z_cut):
    select_only(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for vert in obj.data.vertices:
        vert.select = (obj.matrix_world @ vert.co).z < z_cut
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

    select_only(dest)
    if dest.vertex_groups:
        bpy.ops.object.vertex_group_limit_total(group_select_mode="ALL", limit=MAX_WEIGHTS)
        bpy.ops.object.vertex_group_normalize_all(group_select_mode="ALL", lock_active=False)

    arm = dest.modifiers.new(name="Armature", type="ARMATURE")
    arm.object = armature
    dest.parent = armature
    dest.parent_type = "OBJECT"


def export_skeletal(objects, filename):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
        if obj.type == "MESH" and obj.parent:
            obj.parent.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    path = SOURCE / filename
    bpy.ops.export_scene.fbx(
        filepath=str(path),
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
    print(f"exported {path} bytes={path.stat().st_size}")
    return path


def render_preview(path, location, look_at):
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 720
    scene.render.resolution_y = 1280
    scene.render.filepath = str(path)
    scene.render.image_settings.file_format = "PNG"
    camera = bpy.data.objects.new("PreviewCam", bpy.data.cameras.new("PreviewCam"))
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.location = location
    direction = look_at - Vector(location)
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    light_data = bpy.data.lights.new("PreviewKey", "AREA")
    light_data.energy = 40000
    light_data.size = 80
    key = bpy.data.objects.new("PreviewKey", light_data)
    scene.collection.objects.link(key)
    key.location = (40.0, -80.0, 180.0)
    try:
        bpy.ops.render.render(write_still=True)
        print(f"preview {path}")
    except Exception as error:  # noqa: BLE001 — preview is optional
        print(f"preview failed: {error}")


def scale_coat_to_neck(meshes):
    highs = []
    lows = []
    for obj in meshes:
        *_, zmin, zmax = world_bounds(obj)
        lows.append(zmin)
        highs.append(zmax)
    top = max(highs)
    if top < 1.0:
        raise RuntimeError(f"coat top {top} looks empty")
    scale = NECK_Z / top
    print(f"coat top={top:.2f} scale={scale:.6f} -> neck {NECK_Z}")
    for obj in meshes:
        obj.scale = (obj.scale.x * scale, obj.scale.y * scale, obj.scale.z * scale)
        select_only(obj)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


def center_on_body(obj, body):
    # Only recenter X. The body AABB is back-heavy (scapulae); shifting Y
    # to that midpoint pulls the coat off the chest and onto the spine.
    bx0, bx1, *_ = world_bounds(body)
    cx0, cx1, *_ = world_bounds(obj)
    shift_x = 0.5 * (bx0 + bx1) - 0.5 * (cx0 + cx1)
    obj.location.x += shift_x
    select_only(obj)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    print(f"centered coat x by {shift_x:.2f}")


def prepare_coat(imported, body):
    meshes = []
    for obj in imported:
        if obj.type != "MESH":
            continue
        mat_names = " ".join(
            (slot.material.name if slot.material else "") for slot in obj.material_slots
        )
        if "FABRIC" in mat_names or "Cotton" in mat_names:
            meshes.append(obj)
        else:
            bpy.data.objects.remove(obj, do_unlink=True)
    if not meshes:
        raise RuntimeError("no coat fabric meshes in Sketchfab file")
    scale_coat_to_neck(meshes)
    white = make_material("M_LabCoat", (0.96, 0.96, 0.94), roughness=0.38)
    for obj in meshes:
        assign_material(obj, white)
        delete_below(obj, HEM_CUT_Z)
    coat = join_meshes("SK_LabCoat", meshes)
    if coat is None or len(coat.data.vertices) < 200:
        raise RuntimeError(f"coat join failed verts={0 if coat is None else len(coat.data.vertices)}")
    center_on_body(coat, body)
    print(f"coat verts={len(coat.data.vertices)} bounds={tuple(round(v, 2) for v in world_bounds(coat))}")
    return coat


def delete_foreign_armatures(keep):
    for obj in list(bpy.data.objects):
        if obj.type == "ARMATURE" and obj != keep:
            bpy.data.objects.remove(obj, do_unlink=True)


def prepare_scope(imported, _body):
    meshes = []
    for obj in imported:
        if obj.type != "MESH":
            continue
        if obj.name.startswith("Icosphere") or len(obj.data.vertices) < 50:
            bpy.data.objects.remove(obj, do_unlink=True)
            continue
        meshes.append(obj)
    if not meshes:
        raise RuntimeError("stethoscope imported with no usable mesh")
    scope = join_meshes("SK_Stethoscope", meshes)
    if scope is None:
        raise RuntimeError("stethoscope join failed")
    print(f"scope raw verts={len(scope.data.vertices)} bounds={tuple(round(v, 2) for v in world_bounds(scope))}")
    # Sketchfab scope is authored flat in XY with ears at +Y. Rotate so the
    # U sits on the neck and the bell hangs down the chest (+Y is front).
    select_only(scope)
    scope.rotation_euler = (1.57079632679, 0.0, 0.0)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    _sx0, _sx1, _sy0, _sy1, sz0, sz1 = world_bounds(scope)
    height = max(sz1 - sz0, 0.01)
    scale = 42.0 / height
    print(f"scope after rx height={height:.2f} scale={scale:.4f}")
    scope.scale = (scale, scale, scale)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    sx0, sx1, sy0, sy1, sz0, sz1 = world_bounds(scope)
    scope.location.x += -0.5 * (sx0 + sx1)
    scope.location.y += 6.0 - 0.5 * (sy0 + sy1)
    scope.location.z += NECK_Z - sz1 + 1.5
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    metal = make_material("M_Stethoscope", (0.12, 0.12, 0.13), roughness=0.28, metallic=0.55)
    assign_material(scope, metal)
    print(f"scope placed verts={len(scope.data.vertices)} bounds={tuple(round(v, 2) for v in world_bounds(scope))}")
    return scope


def main():
    body_path = next((path for path in BODY_CANDIDATES if path.exists()), None)
    if not body_path:
        raise FileNotFoundError("SKM_Patel_Body.fbx — run export-patel-body.py first")
    coat_path = find_asset(SKETCH_COAT)
    if not coat_path:
        raise FileNotFoundError(SKETCH_COAT)
    scope_path = find_asset(SKETCH_SCOPE)

    reset_scene()
    import_any(body_path)
    armature = next(obj for obj in bpy.data.objects if obj.type == "ARMATURE")
    body = next(obj for obj in bpy.data.objects if obj.type == "MESH" and "Patel" in obj.name)
    print(
        f"body {body.name} verts={len(body.data.vertices)} groups={len(body.vertex_groups)} "
        f"armature={armature.name} bones={len(armature.data.bones)} "
        f"bounds={tuple(round(v, 2) for v in world_bounds(body))}"
    )

    coat = prepare_coat(import_any(coat_path), body)
    transfer_weights(body, coat, armature)
    weighted = sum(1 for group in coat.vertex_groups)
    print(f"coat vertex groups={weighted}")
    if weighted < 8:
        raise RuntimeError(f"weight transfer produced only {weighted} groups")

    if scope_path:
        imported_scope = import_any(scope_path)
        scope = prepare_scope(imported_scope, body)
        delete_foreign_armatures(armature)
        transfer_weights(body, scope, armature)
        print(f"scope vertex groups={len(scope.vertex_groups)}")
    else:
        scope = None

    body.hide_render = False
    body.hide_set(False)
    export_skeletal([coat], "SK_LabCoat.fbx")
    if scope:
        export_skeletal([scope], "SK_Stethoscope.fbx")

    render_preview(
        PREVIEW_DIR / "front.png",
        (0.0, -220.0, 100.0),
        Vector((0.0, 0.0, 100.0)),
    )
    render_preview(
        PREVIEW_DIR / "three-quarter.png",
        (140.0, -160.0, 120.0),
        Vector((0.0, 0.0, 100.0)),
    )


if __name__ == "__main__":
    main()
