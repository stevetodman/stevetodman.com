"""Import the Exam Room 3 child patient as a static mesh.

Source is the Hunyuan 003 sculpt with ChatGPT front/side/back stills
projected in Blender. Temporary, not a rigged MetaHuman.
"""

from pathlib import Path

import unreal


SOURCE = (
    Path(unreal.Paths.project_content_dir())
    / "Characters"
    / "EncounterPatient"
    / "Source"
    / "hospital_boy.glb"
)
DEST = "/Game/Characters/EncounterPatient"
MESH_PACKAGE = f"{DEST}/SM_EncounterPatient"


def log(message):
    unreal.log(f"[EncounterPatient] {message}")


def fail(message):
    unreal.log_error(f"[EncounterPatient] {message}")
    raise RuntimeError(message)


def main():
    if not SOURCE.exists():
        fail(f"missing source GLB: {SOURCE}")

    unreal.EditorAssetLibrary.make_directory(DEST)

    task = unreal.AssetImportTask()
    task.set_editor_property("filename", str(SOURCE))
    task.set_editor_property("destination_path", DEST)
    task.set_editor_property("destination_name", "SM_EncounterPatient")
    task.set_editor_property("replace_existing", True)
    task.set_editor_property("automated", True)
    task.set_editor_property("save", True)

    log(f"importing {SOURCE} -> {MESH_PACKAGE}")
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])

    assets = []
    for asset_path in unreal.EditorAssetLibrary.list_assets(DEST, recursive=True):
        asset = unreal.EditorAssetLibrary.load_asset(asset_path)
        if asset:
            assets.append(asset)

    meshes = [asset for asset in assets if isinstance(asset, unreal.StaticMesh)]
    if not meshes:
        kinds = [type(a).__name__ for a in assets]
        fail(f"Interchange produced no StaticMesh under {DEST}; got {kinds}")

    mesh = next(
        (asset for asset in meshes if "SM_EncounterPatient" in asset.get_path_name()),
        meshes[0],
    )
    if mesh.get_path_name() != f"{MESH_PACKAGE}.SM_EncounterPatient":
        if unreal.EditorAssetLibrary.does_asset_exist(MESH_PACKAGE):
            unreal.EditorAssetLibrary.delete_asset(MESH_PACKAGE)
        if not unreal.EditorAssetLibrary.rename_asset(mesh.get_path_name(), MESH_PACKAGE):
            fail(f"could not rename {mesh.get_path_name()} to {MESH_PACKAGE}")
        mesh = unreal.EditorAssetLibrary.load_asset(MESH_PACKAGE)

    unreal.EditorAssetLibrary.save_directory(DEST, only_if_is_dirty=False, recursive=True)
    log(f"ready {mesh.get_path_name()}")


if __name__ == "__main__":
    main()
