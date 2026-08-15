import unreal
from pathlib import Path


def main():
    source = Path(unreal.Paths.project_content_dir()) / "Environment" / "Source"
    dest = "/Game/Environment/Clinic"
    unreal.EditorAssetLibrary.make_directory(dest)

    names = ("SM_LabCoat.fbx", "SM_Trousers.fbx", "SM_Stethoscope.fbx")
    tasks = []
    for name in names:
        fbx = source / name
        if not fbx.exists():
            unreal.log_error(f"[AttendingKit] missing {fbx}")
            continue
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
        options.set_editor_property("import_textures", False)
        options.set_editor_property("automated_import_should_detect_type", False)
        mesh_data = options.get_editor_property("static_mesh_import_data")
        mesh_data.set_editor_property("combine_meshes", True)
        mesh_data.set_editor_property("auto_generate_collision", True)
        mesh_data.set_editor_property("convert_scene", True)
        mesh_data.set_editor_property("force_front_x_axis", False)
        task.set_editor_property("options", options)
        tasks.append(task)
        unreal.log(f"[AttendingKit] Importing {fbx.name}")

    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks(tasks)
    for name in names:
        path = f"{dest}/{Path(name).stem}.{Path(name).stem}"
        exists = unreal.EditorAssetLibrary.does_asset_exist(path)
        unreal.log(f"[AttendingKit] {path} exists={exists}")


if __name__ == "__main__":
    main()
