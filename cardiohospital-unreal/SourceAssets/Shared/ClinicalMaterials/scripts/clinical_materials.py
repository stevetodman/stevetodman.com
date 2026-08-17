"""Blender node helper for the CardioHospital shared clinical PBR library."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[1]
TEXTURES = ROOT / "textures"


def apply_pbr_set(material, set_name, tiling=6.0, normal_strength=0.32):
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    texcoord = nodes.new("ShaderNodeTexCoord")
    texcoord.label = "Shared clinical UV source"
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (tiling, tiling, tiling)
    links.new(texcoord.outputs["UV"], mapping.inputs["Vector"])

    base = nodes.new("ShaderNodeTexImage")
    base.name = f"CH_{set_name}_BaseColor"
    base.image = bpy.data.images.load(str(TEXTURES / f"T_CH_{set_name}_BaseColor_4K.png"), check_existing=True)
    base.image.colorspace_settings.name = "sRGB"
    links.new(mapping.outputs["Vector"], base.inputs["Vector"])
    links.new(base.outputs["Color"], bsdf.inputs["Base Color"])

    orm = nodes.new("ShaderNodeTexImage")
    orm.name = f"CH_{set_name}_ORM"
    orm.image = bpy.data.images.load(str(TEXTURES / f"T_CH_{set_name}_ORM_4K.png"), check_existing=True)
    orm.image.colorspace_settings.name = "Non-Color"
    links.new(mapping.outputs["Vector"], orm.inputs["Vector"])
    separate = nodes.new("ShaderNodeSeparateColor")
    separate.mode = "RGB"
    links.new(orm.outputs["Color"], separate.inputs["Color"])
    links.new(separate.outputs["Green"], bsdf.inputs["Roughness"])
    links.new(separate.outputs["Blue"], bsdf.inputs["Metallic"])

    normal_tex = nodes.new("ShaderNodeTexImage")
    normal_tex.name = f"CH_{set_name}_Normal"
    normal_tex.image = bpy.data.images.load(str(TEXTURES / f"T_CH_{set_name}_Normal_4K.png"), check_existing=True)
    normal_tex.image.colorspace_settings.name = "Non-Color"
    links.new(mapping.outputs["Vector"], normal_tex.inputs["Vector"])
    normal = nodes.new("ShaderNodeNormalMap")
    normal.inputs["Strength"].default_value = normal_strength
    links.new(normal_tex.outputs["Color"], normal.inputs["Color"])
    links.new(normal.outputs["Normal"], bsdf.inputs["Normal"])
    material["clinical_material_set"] = set_name
    material["texture_resolution"] = 4096
    material["orm_packing"] = "R=AO,G=Roughness,B=Metalness"
    return material
