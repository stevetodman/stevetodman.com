"""Make the attending suit single-sided so collar insides are not skin tiles."""

import unreal

PATHS = (
    "/Game/Environment/Clinic/M_AttendingSuit",
    "/Game/Environment/Clinic/M_DoctorSuit",
)


def log(message):
    unreal.log(f"[SuitFix] {message}")


def main():
    for path in PATHS:
        if not unreal.EditorAssetLibrary.does_asset_exist(path):
            log(f"missing {path}")
            continue
        mat = unreal.EditorAssetLibrary.load_asset(path)
        mat.set_editor_property("two_sided", False)
        unreal.MaterialEditingLibrary.recompile_material(mat)
        unreal.EditorAssetLibrary.save_asset(path)
        log(f"{path} two_sided={mat.get_editor_property('two_sided')}")


if __name__ == "__main__":
    main()
