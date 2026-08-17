"""Scale the Sketchfab CC-BY lab coat onto the exported Patel body.

Expects:
  Content/Environment/Source/Sketchfab/lab-coat/  (glb, gltf zip, or fbx)
  Content/Environment/Source/SKM_Patel_Body.fbx   (from export-patel-body.py)

Writes SM_LabCoat.fbx / SM_Trousers.fbx into Content/Environment/Source.
"""

from __future__ import annotations

from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Content" / "Environment" / "Source"
SKETCH = SOURCE / "Sketchfab" / "lab-coat"
BODY = SOURCE / "SKM_Patel_Body.fbx"
SCOPE_DIR = SOURCE / "Sketchfab" / "stethoscope"


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
        bpy.ops.import_scene.fbx(filepath=str(path), automatic_bone_orientation=True)
    elif suffix in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=str(path))
    else:
        raise RuntimeError(f"unsupported {path}")
    return [obj for obj in bpy.data.objects if obj not in before]


def mesh_objects(candidates=None):
    pool = candidates if candidates is not None else bpy.data.objects
    return [obj for obj in pool if obj.type == "MESH"]


def world_height(obj):
    corners = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    zs = [c.z for c in corners]
    return min(zs), max(zs)


def select_only(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def join_meshes(name, objects):
    if not objects:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    objects[0].name = name
    return objects[0]


def origin_to_world_zero(obj):
    select_only(obj)
    bpy.context.scene.cursor.location = (0.0, 0.0, 0.0)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")


def export_fbx(obj, filename):
    origin_to_world_zero(obj)
    select_only(obj)
    path = SOURCE / filename
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


def scale_to_patel(meshes, body):
    _, body_top = world_height(body)
    lows, highs = [], []
    for obj in meshes:
        lo, hi = world_height(obj)
        lows.append(lo)
        highs.append(hi)
    coat_span = max(highs) - min(lows)
    if coat_span < 1.0:
        raise RuntimeError(f"coat height {coat_span} looks empty")
    # Patel body mesh is feet-to-neck ~132 cm; a mid-thigh coat should land
    # around 70-150 cm. Use neck height as the target top.
    target = max(body_top, 132.0)
    scale = target / coat_span
    print(f"coat span={coat_span:.2f} body_top={body_top:.2f} scale={scale:.4f}")
    for obj in meshes:
        obj.scale = (obj.scale.x * scale, obj.scale.y * scale, obj.scale.z * scale)
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        lo, _ = world_height(obj)
        obj.location.z -= lo
        bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)


def main():
    reset_scene()
    if not BODY.exists():
        raise FileNotFoundError(BODY)
    coat_path = find_asset(SKETCH)
    if not coat_path:
        raise FileNotFoundError(SKETCH)
    import_any(BODY)
    body = next(obj for obj in bpy.data.objects if obj.type == "MESH" and "Patel" in obj.name)
    imported = import_any(coat_path)
    meshes = []
    for obj in mesh_objects(imported):
        mat_names = " ".join(
            (slot.material.name if slot.material else "") for slot in obj.material_slots
        )
        # Keep the cotton/fabric coat. Skip lining/pants slabs.
        if "FABRIC" in mat_names or "Cotton" in mat_names:
            meshes.append(obj)
        else:
            bpy.data.objects.remove(obj, do_unlink=True)
    if not meshes:
        raise RuntimeError("no coat fabric meshes in Sketchfab file")
    scale_to_patel(meshes, body)
    white = bpy.data.materials.new("M_LabCoat")
    white.use_nodes = True
    bsdf = white.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.96, 0.96, 0.94, 1.0)
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = 0.38
    for obj in meshes:
        obj.data.materials.clear()
        obj.data.materials.append(white)
        # Drop the pants slab that rides between the legs.
        bpy.ops.object.mode_set(mode="OBJECT")
        select_only(obj)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="DESELECT")
        bpy.ops.object.mode_set(mode="OBJECT")
        for vert in obj.data.vertices:
            vert.select = (obj.matrix_world @ vert.co).z < 64.0
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.delete(type="VERT")
        bpy.ops.object.mode_set(mode="OBJECT")
    # Prefer a single coat export; trousers stay joined if the source is one outfit.
    coat = join_meshes("SM_LabCoat", meshes)
    body.hide_set(True)
    export_fbx(coat, "SM_LabCoat.fbx")

    scope_path = find_asset(SCOPE_DIR) if SCOPE_DIR.exists() else None
    if scope_path:
        reset_scene()
        imported = import_any(scope_path)
        meshes = mesh_objects(imported)
        if not meshes:
            print("stethoscope imported with no mesh objects")
        else:
            scope = join_meshes("SM_Stethoscope", meshes)
            export_fbx(scope, "SM_Stethoscope.fbx")


if __name__ == "__main__":
    main()
