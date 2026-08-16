"""Import the skinned Sketchfab coat/scope onto Patel's existing skeleton."""

import unreal
from pathlib import Path


BODY_PATH = "/Game/MetaHumans/Patel/Body/SKM_Patel_BodyMesh"
DEST = "/Game/Environment/Clinic"
SOURCE_DIR = Path(unreal.Paths.project_content_dir()) / "Environment" / "Source"
MESHES = ("SK_LabCoat.fbx", "SK_Trousers.fbx", "SK_Stethoscope.fbx")


def log(message):
    unreal.log(f"[SkinnedCoat] {message}")


def fail(message):
    unreal.log_error(f"[SkinnedCoat] {message}")
    raise RuntimeError(message)


def patel_skeleton():
    body = unreal.EditorAssetLibrary.load_asset(BODY_PATH)
    if not body:
        fail(f"missing {BODY_PATH}")
    skeleton = body.get_editor_property("skeleton")
    if not skeleton:
        fail(f"{BODY_PATH} has no skeleton")
    log(f"using skeleton {skeleton.get_path_name()}")
    return skeleton


def import_skeletal(fbx: Path, skeleton):
    if not fbx.exists():
        fail(f"missing {fbx}")
    task = unreal.AssetImportTask()
    task.set_editor_property("filename", str(fbx))
    task.set_editor_property("destination_path", DEST)
    task.set_editor_property("destination_name", fbx.stem)
    task.set_editor_property("replace_existing", True)
    task.set_editor_property("automated", True)
    task.set_editor_property("save", True)

    options = unreal.FbxImportUI()
    options.set_editor_property("import_mesh", True)
    options.set_editor_property("import_as_skeletal", True)
    options.set_editor_property("import_animations", False)
    options.set_editor_property("import_materials", True)
    options.set_editor_property("import_textures", True)
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
    mesh_data.set_editor_property("force_front_x_axis", False)
    task.set_editor_property("options", options)

    log(f"importing {fbx.name} -> {DEST}/{fbx.stem}")
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    asset_path = f"{DEST}/{fbx.stem}.{fbx.stem}"
    asset = unreal.EditorAssetLibrary.load_asset(asset_path)
    if not asset:
        fail(f"import produced no asset at {asset_path}")
    log(f"{asset_path} class={asset.get_class().get_name()}")
    if isinstance(asset, unreal.SkeletalMesh):
        used = asset.get_editor_property("skeleton")
        used_path = used.get_path_name() if used else "None"
        log(f"{asset_path} skeleton={used_path}")
        if used != skeleton:
            fail(f"{asset_path} did not bind Patel's skeleton ({used_path})")
    else:
        fail(f"{asset_path} is {asset.get_class().get_name()}, not a SkeletalMesh")
    return asset


def main():
    unreal.EditorAssetLibrary.make_directory(DEST)
    skeleton = patel_skeleton()
    for name in MESHES:
        import_skeletal(SOURCE_DIR / name, skeleton)
    for name in MESHES:
        path = f"{DEST}/{Path(name).stem}.{Path(name).stem}"
        log(f"exists {path}={unreal.EditorAssetLibrary.does_asset_exist(path)}")


if __name__ == "__main__":
    main()
