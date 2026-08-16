"""Import mfyma doctor textures and pin them on SK_LabCoat."""

import unreal
from pathlib import Path

DEST = "/Game/Environment/Clinic"
SOURCE = Path(unreal.Paths.project_content_dir()) / "Environment" / "Source" / "Sketchfab" / "mfyma-doctor"


def log(message):
    unreal.log(f"[DoctorSuit] {message}")


def fail(message):
    unreal.log_error(f"[DoctorSuit] {message}")
    raise RuntimeError(message)


def import_texture(png: Path, name: str, normal: bool):
    if not png.exists():
        fail(f"missing {png}")
    task = unreal.AssetImportTask()
    task.set_editor_property("filename", str(png))
    task.set_editor_property("destination_path", DEST)
    task.set_editor_property("destination_name", name)
    task.set_editor_property("replace_existing", True)
    task.set_editor_property("automated", True)
    task.set_editor_property("save", True)
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    path = f"{DEST}/{name}.{name}"
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


def make_suit_material(albedo, normal):
    name = "M_DoctorSuit"
    path = f"{DEST}/{name}"
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        mat = unreal.EditorAssetLibrary.load_asset(path)
    else:
        mat = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
            name, DEST, unreal.Material, unreal.MaterialFactoryNew()
        )
    lib = unreal.MaterialEditingLibrary
    lib.delete_all_material_expressions(mat)

    sample_bc = lib.create_material_expression(mat, unreal.MaterialExpressionTextureSample, -480, -40)
    sample_bc.set_editor_property("texture", albedo)
    lib.connect_material_property(sample_bc, "RGB", unreal.MaterialProperty.MP_BASE_COLOR)

    sample_n = lib.create_material_expression(mat, unreal.MaterialExpressionTextureSample, -480, 180)
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
    log(f"material {path}")
    return mat


def main():
    albedo = import_texture(SOURCE / "T_DoctorSuit_BC.png", "T_DoctorSuit_BC", False)
    normal = import_texture(SOURCE / "T_DoctorSuit_N.png", "T_DoctorSuit_N", True)
    mat = make_suit_material(albedo, normal)
    coat = unreal.EditorAssetLibrary.load_asset(f"{DEST}/SK_LabCoat")
    if not coat:
        fail("missing SK_LabCoat")
    slots = list(coat.get_editor_property("materials"))
    if not slots:
        fail("SK_LabCoat has no material slots")
    slots[0].set_editor_property("material_interface", mat)
    coat.set_editor_property("materials", slots)
    unreal.EditorAssetLibrary.save_asset(f"{DEST}/SK_LabCoat")
    log("pinned M_DoctorSuit on SK_LabCoat")


if __name__ == "__main__":
    main()
