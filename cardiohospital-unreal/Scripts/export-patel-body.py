import unreal
from pathlib import Path


def export_mesh(asset_path, filename):
    dest = Path(unreal.Paths.project_content_dir()) / "Environment" / "Source" / filename
    dest.parent.mkdir(parents=True, exist_ok=True)
    mesh = unreal.EditorAssetLibrary.load_asset(asset_path)
    if not mesh:
        unreal.log_error(f"[PatelExport] missing {asset_path}")
        return False

    task = unreal.AssetExportTask()
    task.object = mesh
    task.filename = str(dest)
    task.automated = True
    task.replace_identical = True
    task.prompt = False
    task.use_file_archive = False
    task.write_empty_files = False

    options = unreal.FbxExportOption()
    options.ascii = False
    options.collision = False
    options.level_of_detail = False
    options.vertex_color = False
    options.export_morph_targets = False
    options.export_local_time = True
    task.options = options
    ok = unreal.Exporter.run_asset_export_task(task)
    unreal.log(f"[PatelExport] {asset_path} -> {dest} ok={ok} exists={dest.exists()} bytes={dest.stat().st_size if dest.exists() else 0}")
    return ok


def main():
    export_mesh("/Game/MetaHumans/Patel/Body/SKM_Patel_BodyMesh.SKM_Patel_BodyMesh", "SKM_Patel_Body.fbx")
    export_mesh("/Game/MetaHumans/Patel/Face/SKM_Patel_FaceMesh.SKM_Patel_FaceMesh", "SKM_Patel_Face.fbx")


if __name__ == "__main__":
    main()
