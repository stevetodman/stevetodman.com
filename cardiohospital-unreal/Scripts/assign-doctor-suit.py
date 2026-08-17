"""Pin the premade doctor's albedo on SK_LabCoat for skeletal use.

M_DoctorSuit previously compiled without UsedWithSkeletalMesh. The packaged
game then swapped in the default material, which is why Patel looked like
brown plastic. This script never deletes expressions on an existing material.
"""

import unreal
from pathlib import Path

DEST = "/Game/Environment/Clinic"
SOURCE = Path(unreal.Paths.project_content_dir()) / "Environment" / "Source" / "Sketchfab" / "mfyma-doctor"
SUIT_NAME = "M_AttendingSuit"


def log(message):
    unreal.log(f"[DoctorSuit] {message}")


def fail(message):
    unreal.log_error(f"[DoctorSuit] {message}")
    raise RuntimeError(message)


def import_texture(png: Path, name: str, normal: bool):
    if not png.exists():
        fail(f"missing {png}")
    path = f"{DEST}/{name}.{name}"
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        tex = unreal.EditorAssetLibrary.load_asset(path)
        if tex:
            if normal:
                tex.set_editor_property("compression_settings", unreal.TextureCompressionSettings.TC_NORMALMAP)
                tex.set_editor_property("srgb", False)
            else:
                tex.set_editor_property("srgb", True)
            unreal.EditorAssetLibrary.save_asset(path)
            log(f"reused texture {path}")
            return tex
    task = unreal.AssetImportTask()
    task.set_editor_property("filename", str(png))
    task.set_editor_property("destination_path", DEST)
    task.set_editor_property("destination_name", name)
    task.set_editor_property("replace_existing", True)
    task.set_editor_property("automated", True)
    task.set_editor_property("save", True)
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    tex = unreal.EditorAssetLibrary.load_asset(path)
    if not tex:
        fail(f"import produced no texture at {path}")
    if normal:
        tex.set_editor_property("compression_settings", unreal.TextureCompressionSettings.TC_NORMALMAP)
        tex.set_editor_property("srgb", False)
    else:
        tex.set_editor_property("srgb", True)
    unreal.EditorAssetLibrary.save_asset(path)
    log(f"texture {path}")
    return tex


def enable_skeletal(mat):
    mat.set_editor_property("used_with_skeletal_mesh", True)
    mat.set_editor_property("two_sided", True)
    unreal.MaterialEditingLibrary.recompile_material(mat)


def inspect_material(path):
    if not unreal.EditorAssetLibrary.does_asset_exist(path):
        log(f"missing {path}")
        return None
    mat = unreal.EditorAssetLibrary.load_asset(path)
    if not mat:
        log(f"failed to load {path}")
        return None
    skeletal = mat.get_editor_property("used_with_skeletal_mesh")
    two_sided = mat.get_editor_property("two_sided")
    log(f"{path} class={mat.get_class().get_name()} skeletal={skeletal} two_sided={two_sided}")
    return mat


def make_suit_material(albedo, normal):
    path = f"{DEST}/{SUIT_NAME}"
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        mat = inspect_material(path)
        enable_skeletal(mat)
        unreal.EditorAssetLibrary.save_asset(path)
        log(f"enabled skeletal usage on existing {path}")
        return mat

    mat = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        SUIT_NAME, DEST, unreal.Material, unreal.MaterialFactoryNew()
    )
    if not mat:
        fail(f"could not create {path}")
    enable_skeletal(mat)
    lib = unreal.MaterialEditingLibrary

    sample_bc = lib.create_material_expression(
        mat, unreal.MaterialExpressionTextureSample, -480, -40
    )
    sample_bc.set_editor_property("texture", albedo)
    lib.connect_material_property(sample_bc, "RGB", unreal.MaterialProperty.MP_BASE_COLOR)

    sample_n = lib.create_material_expression(
        mat, unreal.MaterialExpressionTextureSample, -480, 180
    )
    sample_n.set_editor_property("texture", normal)
    sample_n.set_editor_property("sampler_type", unreal.MaterialSamplerType.SAMPLERTYPE_NORMAL)
    lib.connect_material_property(sample_n, "RGB", unreal.MaterialProperty.MP_NORMAL)

    rough = lib.create_material_expression(mat, unreal.MaterialExpressionConstant, -480, 400)
    rough.set_editor_property("r", 0.55)
    lib.connect_material_property(rough, "", unreal.MaterialProperty.MP_ROUGHNESS)

    metal = lib.create_material_expression(mat, unreal.MaterialExpressionConstant, -480, 480)
    metal.set_editor_property("r", 0.0)
    lib.connect_material_property(metal, "", unreal.MaterialProperty.MP_METALLIC)

    lib.recompile_material(mat)
    unreal.EditorAssetLibrary.save_asset(path)
    log(f"created {path}")
    return mat


def pin_on_coat(mat):
    coat = unreal.EditorAssetLibrary.load_asset(f"{DEST}/SK_LabCoat")
    if not coat:
        fail("missing SK_LabCoat")
    slots = list(coat.get_editor_property("materials"))
    if not slots:
        fail("SK_LabCoat has no material slots")
    slots[0].set_editor_property("material_interface", mat)
    coat.set_editor_property("materials", slots)
    unreal.EditorAssetLibrary.save_asset(f"{DEST}/SK_LabCoat")
    applied = slots[0].get_editor_property("material_interface")
    log(f"pinned {applied.get_path_name() if applied else 'None'} on SK_LabCoat")


def main():
    inspect_material(f"{DEST}/M_DoctorSuit")
    albedo = import_texture(SOURCE / "T_DoctorSuit_BC.png", "T_DoctorSuit_BC", False)
    normal = import_texture(SOURCE / "T_DoctorSuit_N.png", "T_DoctorSuit_N", True)
    existing = inspect_material(f"{DEST}/M_DoctorSuit")
    if existing:
        enable_skeletal(existing)
        unreal.EditorAssetLibrary.save_asset(f"{DEST}/M_DoctorSuit")
        log("enabled UsedWithSkeletalMesh on M_DoctorSuit")
    mat = make_suit_material(albedo, normal)
    pin_on_coat(mat)
    inspect_material(f"{DEST}/{SUIT_NAME}")
    inspect_material(f"{DEST}/M_DoctorSuit")


if __name__ == "__main__":
    main()
