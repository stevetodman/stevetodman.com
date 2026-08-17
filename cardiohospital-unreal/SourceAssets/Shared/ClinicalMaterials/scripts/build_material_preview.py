"""Build and OptiX-render a validation board for the shared material library."""

from pathlib import Path
import math
import sys

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
RENDERS = ROOT / "renders"
RENDERS.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(ROOT / "scripts"))
from clinical_materials import apply_pbr_set


def point_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def base_material(name, color, metallic=0.0, roughness=0.4):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return material


bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
specs = (
    ("PowderCoat_WarmWhite", (0.72, .75, .76), 0.0, 7.0, .24),
    ("BrushedSteel", (.43, .47, .49), 1.0, 5.0, .28),
    ("ABS_Graphite", (.028, .038, .048), 0.0, 8.0, .26),
    ("MedicalVinyl_Teal", (.055, .34, .38), 0.0, 6.0, .34),
    ("Rubber_Black", (.015, .020, .024), 0.0, 9.0, .30),
    ("AntiGlareGlass", (.025, .055, .070), 0.0, 4.0, .16),
)
for index, (name, color, metallic, tiling, strength) in enumerate(specs):
    x = (index % 3 - 1) * 1.25
    z = (1 - index // 3) * 1.15
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=64, location=(x, 0, z), radius=.47)
    obj = bpy.context.object
    obj.name = f"Preview_{name}"
    material = base_material(f"MI_CH_{name}", color, metallic)
    apply_pbr_set(material, name, tiling=tiling, normal_strength=strength)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    bevel = obj.modifiers.new("MicroBevel", "BEVEL")
    bevel.width = .006
    bevel.segments = 2

floor_mat = base_material("StudioFloor", (.055, .065, .075), 0.0, .42)
bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 1.3, -.58))
floor = bpy.context.object
floor.rotation_euler.x = math.radians(90)
floor.data.materials.append(floor_mat)

scene = bpy.context.scene
world = scene.world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (.012, .018, .028, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = .22
for name, location, energy, size, color in (
    ("Key", (3.8, -4.5, 4.7), 1250, 3.2, (1.0, .92, .82)),
    ("Fill", (-4.0, -2.0, 2.1), 800, 3.0, (.62, .80, 1.0)),
    ("Rim", (0, 2.5, 4.0), 1000, 2.6, (.70, .90, 1.0)),
):
    data = bpy.data.lights.new(name, "AREA")
    data.energy, data.shape, data.size, data.color = energy, "DISK", size, color
    light = bpy.data.objects.new(name, data)
    scene.collection.objects.link(light)
    light.location = location
    point_at(light, (0, 0, .25))

camera_data = bpy.data.cameras.new("MaterialPreviewCamera")
camera = bpy.data.objects.new("MaterialPreviewCamera", camera_data)
scene.collection.objects.link(camera)
camera.location = (0, -8.4, 1.0)
camera.data.lens = 60
point_at(camera, (0, 0, .15))
scene.camera = camera
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
        scene.cycles.samples = 96
        scene.cycles.use_denoising = True
        scene.cycles.max_bounces = 6
        renderer = "OptiX: " + ", ".join(enabled)
    else:
        scene.render.engine = "BLENDER_EEVEE"
except Exception:
    scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1600
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.render.filepath = str(RENDERS / "CH_ClinicalMaterials_preview.png")
bpy.ops.render.render(write_still=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / "CH_ClinicalMaterials_Preview.blend"), compress=True)
print(f"MATERIAL_PREVIEW_RENDERER={renderer}")
