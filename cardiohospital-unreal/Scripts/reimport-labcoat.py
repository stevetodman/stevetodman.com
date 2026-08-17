"""Reimport the recut SK_LabCoat and pin the attending suit material."""

import unreal
from pathlib import Path

BODY_PATH = "/Game/MetaHumans/Patel/Body/SKM_Patel_BodyMesh"
DEST = "/Game/Environment/Clinic"
FBX = Path(unreal.Paths.project_content_dir()) / "Environment" / "Source" / "SK_LabCoat.fbx"
SUIT = f"{DEST}/M_AttendingSuit"


def log(message):
    unreal.log(f"[ReimportCoat] {message}")


def fail(message):
    unreal.log_error(f"[ReimportCoat] {message}")
    raise RuntimeError(message)


def main():
    if not FBX.exists():
        fail(f"missing {FBX}")
    body = unreal.EditorAssetLibrary.load_asset(BODY_PATH)
    if not body:
        fail(f"missing {BODY_PATH}")
    skeleton = body.get_editor_property("skeleton")
    if not skeleton:
        fail("Patel body has no skeleton")

    task = unreal.AssetImportTask()
    task.set_editor_property("filename", str(FBX))
    task.set_editor_property("destination_path", DEST)
    task.set_editor_property("destination_name", "SK_LabCoat")
    task.set_editor_property("replace_existing", True)
    task.set_editor_property("automated", True)
    task.set_editor_property("save", True)

    options = unreal.FbxImportUI()
    options.set_editor_property("import_mesh", True)
    options.set_editor_property("import_as_skeletal", True)
    options.set_editor_property("import_animations", False)
    options.set_editor_property("import_materials", False)
    options.set_editor_property("import_textures", False)
    options.set_editor_property("create_physics_asset", False)
    options.set_editor_property("skeleton", skeleton)
    options.set_editor_property("mesh_type_to_import", unreal.FBXImportType.FBXIT_SKELETAL_MESH)
    options.set_editor_property("automated_import_should_detect_type", False)
    options.set_editor_property("original_import_type", unreal.FBXImportType.FBXIT_SKELETAL_MESH)
    mesh_data = options.get_editor_property("skeletal_mesh_import_data")
    mesh_data.set_editor_property("update_skeleton_reference_pose", False)
    mesh_data.set_editor_property("use_t0_as_ref_pose", True)
    mesh_data.set_editor_property("preserve_smoothing_groups", True)
    mesh_data.set_editor_property("import_meshes_in_bone_hierarchy", False)
    mesh_data.set_editor_property("convert_scene", True)
    task.set_editor_property("options", options)

    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    coat = unreal.EditorAssetLibrary.load_asset(f"{DEST}/SK_LabCoat")
    if not coat:
        fail("import produced no SK_LabCoat")
    suit = unreal.EditorAssetLibrary.load_asset(SUIT)
    if not suit:
        fail(f"missing {SUIT}")
    slots = list(coat.get_editor_property("materials"))
    if not slots:
        fail("SK_LabCoat has no material slots")
    slots[0].set_editor_property("material_interface", suit)
    coat.set_editor_property("materials", slots)
    unreal.EditorAssetLibrary.save_asset(f"{DEST}/SK_LabCoat")
    log(f"reimported SK_LabCoat verts pinned {suit.get_path_name()}")


if __name__ == "__main__":
    main()
