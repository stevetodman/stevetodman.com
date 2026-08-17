"""Import the temporary functional-first Dr. Patel placeholder from glTF.

This intentionally imports the already-dressed, non-medical-looking Ready
Player Me avatar as one skeletal mesh. It is a temporary testing unblocker,
not the final art direction; proper MetaHuman-native medical clothing can
replace it after the clinical simulation is proven.
"""

from pathlib import Path

import unreal


SOURCE = (
    Path(unreal.Paths.project_content_dir())
    / "Environment"
    / "Source"
    / "3dworld"
    / "male-doctor.glb"
)
DEST = "/Game/Characters/GenericDoctor"
MESH_PACKAGE = f"{DEST}/SK_GenericDoctor"
MESH_OBJECT = f"{MESH_PACKAGE}.SK_GenericDoctor"


def log(message):
    unreal.log(f"[GenericDoctor] {message}")


def fail(message):
    unreal.log_error(f"[GenericDoctor] {message}")
    raise RuntimeError(message)


def imported_assets():
    assets = []
    for asset_path in unreal.EditorAssetLibrary.list_assets(DEST, recursive=True):
        asset = unreal.EditorAssetLibrary.load_asset(asset_path)
        if asset:
            assets.append(asset)
    return assets


def main():
    if not SOURCE.exists():
        fail(f"missing source GLB: {SOURCE}")

    unreal.EditorAssetLibrary.make_directory(DEST)

    task = unreal.AssetImportTask()
    task.set_editor_property("filename", str(SOURCE))
    task.set_editor_property("destination_path", DEST)
    task.set_editor_property("destination_name", "SK_GenericDoctor")
    task.set_editor_property("replace_existing", True)
    task.set_editor_property("automated", True)
    task.set_editor_property("save", True)

    # A skinned glTF is recognized as a Skeletal Mesh by UE 5.8's built-in
    # Interchange glTF pipeline. No MetaHuman skeleton or coat-fitting options
    # belong on this self-contained placeholder.
    log(f"importing {SOURCE} -> {MESH_OBJECT}")
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])

    assets = imported_assets()
    meshes = [asset for asset in assets if isinstance(asset, unreal.SkeletalMesh)]
    if not meshes:
        fail(f"Interchange produced no SkeletalMesh under {DEST}")

    mesh = next((asset for asset in meshes if asset.get_path_name() == MESH_OBJECT), meshes[0])
    if mesh.get_path_name() != MESH_OBJECT:
        if unreal.EditorAssetLibrary.does_asset_exist(MESH_PACKAGE):
            unreal.EditorAssetLibrary.delete_asset(MESH_PACKAGE)
        source_path = mesh.get_path_name()
        if not unreal.EditorAssetLibrary.rename_asset(source_path, MESH_PACKAGE):
            fail(f"could not rename {source_path} to {MESH_PACKAGE}")
        mesh = unreal.EditorAssetLibrary.load_asset(MESH_PACKAGE)

    if not isinstance(mesh, unreal.SkeletalMesh):
        fail(f"{MESH_OBJECT} is not a SkeletalMesh")

    skeleton = mesh.get_editor_property("skeleton")
    if not skeleton:
        fail(f"{MESH_OBJECT} has no skeleton")

    animations = [asset for asset in assets if isinstance(asset, unreal.AnimSequence)]
    if animations:
        log("animation clips: " + ", ".join(asset.get_path_name() for asset in animations))
    else:
        # The source GLB currently has no animation array. A static reference
        # pose is accepted for this deliberately short-lived placeholder.
        log("source contains no baked animation clips; using its static reference pose")

    unreal.EditorAssetLibrary.save_directory(DEST, only_if_is_dirty=False, recursive=True)
    log(f"ready {mesh.get_path_name()} skeleton={skeleton.get_path_name()}")


if __name__ == "__main__":
    main()
