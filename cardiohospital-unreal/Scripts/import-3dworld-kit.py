import unreal
from pathlib import Path


def main():
    source = Path(unreal.Paths.project_content_dir()) / "Environment" / "Source" / "3dworld" / "fbx"
    dest = "/Game/Environment/Clinic"
    unreal.EditorAssetLibrary.make_directory(dest)

    fbx_files = sorted(source.glob("SM_3DW_*.fbx"))
    if not fbx_files:
        raise RuntimeError(f"no SM_3DW_*.fbx files in {source}")

    tasks = []
    for fbx in fbx_files:
        task = unreal.AssetImportTask()
        task.set_editor_property("filename", str(fbx))
        task.set_editor_property("destination_path", dest)
        task.set_editor_property("destination_name", fbx.stem)
        task.set_editor_property("replace_existing", True)
        task.set_editor_property("automated", True)
        task.set_editor_property("save", True)
        options = unreal.FbxImportUI()
        options.set_editor_property("import_mesh", True)
        options.set_editor_property("import_as_skeletal", False)
        options.set_editor_property("import_materials", True)
        options.set_editor_property("import_textures", True)
        options.set_editor_property("automated_import_should_detect_type", False)
        mesh_data = options.get_editor_property("static_mesh_import_data")
        mesh_data.set_editor_property("combine_meshes", True)
        mesh_data.set_editor_property("auto_generate_collision", True)
        mesh_data.set_editor_property("convert_scene", True)
        mesh_data.set_editor_property("force_front_x_axis", False)
        task.set_editor_property("options", options)
        tasks.append(task)
        unreal.log(f"[3dworld] Importing {fbx.name}")

    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks(tasks)
    missing = []
    for fbx in fbx_files:
        asset_path = f"{dest}/{fbx.stem}.{fbx.stem}"
        if not unreal.EditorAssetLibrary.does_asset_exist(asset_path):
            missing.append(asset_path)
        else:
            unreal.log(f"[3dworld]  {asset_path}")
    if missing:
        raise RuntimeError("import missed: " + ", ".join(missing))
    unreal.log(f"[3dworld] Imported {len(fbx_files)} assets into {dest}")


if __name__ == "__main__":
    main()
