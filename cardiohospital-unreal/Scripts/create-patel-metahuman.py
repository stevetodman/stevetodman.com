import json
import unreal

CHARACTER_PATH = "/Game/Characters/MetaHumans"
CHARACTER_NAME = "Patel"
CHARACTER_OBJECT = f"{CHARACTER_PATH}/{CHARACTER_NAME}.{CHARACTER_NAME}"
BUILD_PATH = "/Game/MetaHumans"
COMMON_PATH = "/Game/MetaHumans/Common"
REPORT_PATH = "/Game/Characters/MetaHumans/patel-assembly"


def log(message):
    unreal.log(f"[PatelMetaHuman] {message}")


def fail(message):
    unreal.log_error(f"[PatelMetaHuman] {message}")
    raise RuntimeError(message)


def load_or_create_character():
    existing = unreal.load_asset(CHARACTER_OBJECT)
    if existing:
        log(f"Loaded existing character {CHARACTER_OBJECT}")
        return existing

    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    character = asset_tools.create_asset(
        asset_name=CHARACTER_NAME,
        package_path=CHARACTER_PATH,
        asset_class=unreal.MetaHumanCharacter,
        factory=unreal.new_object(type=unreal.MetaHumanCharacterFactoryNew),
    )
    if character is None:
        fail("MetaHumanCharacterFactoryNew did not create Patel")
    log(f"Created {CHARACTER_OBJECT}")
    return character


def try_set_height(subsystem, character, centimeters):
    constraints = subsystem.get_body_constraints(character)
    by_name = {str(constraint.name).lower().replace(" ", "_"): constraint for constraint in constraints}
    height = by_name.get("height")
    if not height:
        log("No height constraint; leaving default body")
        return
    height.is_active = True
    height.target_measurement = centimeters
    subsystem.set_body_constraints(character, list(by_name.values()))
    subsystem.commit_body_state(character)
    log(f"Set height to {centimeters} cm")


def try_add_default_garment(character):
    wardrobe_item = unreal.load_asset(
        "/MetaHumanCharacter/Optional/Clothing/WI_DefaultGarment.WI_DefaultGarment"
    )
    if not wardrobe_item:
        log("Default garment wardrobe item not available")
        return
    item_key = character.internal_collection.try_add_item_from_wardrobe_item("Outfits", wardrobe_item)
    selection = unreal.MetaHumanPipelineSlotSelection(slot_name="Outfits", selected_item=item_key)
    character.internal_collection.default_instance.try_add_slot_selection(selection)
    log("Added default garment")


def write_report(payload):
    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    existing = unreal.load_asset(f"{REPORT_PATH}.{REPORT_NAME}" if False else None)
    report_dir = unreal.Paths.project_content_dir() + "Characters/MetaHumans/"
    unreal.SystemLibrary.make_directory(report_dir)
    path = report_dir + "patel-assembly.json"
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")
    log(f"Wrote {path}")


def main():
    log("Starting Patel MetaHuman authoring")
    subsystem = unreal.get_editor_subsystem(unreal.MetaHumanCharacterEditorSubsystem)
    if subsystem is None:
        fail("MetaHumanCharacterEditorSubsystem is not available")

    character = load_or_create_character()
    if not subsystem.try_add_object_to_edit(character):
        fail("Could not open Patel for edit")

    report = {
        "character": CHARACTER_OBJECT,
        "autoRig": False,
        "textures": False,
        "built": False,
        "canBuild": False,
        "error": "",
    }

    try:
        try_set_height(subsystem, character, 175.0)
        try_add_default_garment(character)

        auto_rig = unreal.MetaHumanCharacterAutoRiggingRequestParams()
        auto_rig.blocking = True
        auto_rig.report_progress = False
        auto_rig.rig_type = unreal.MetaHumanRigType.JOINTS_AND_BLENDSHAPES
        log("Requesting auto-rig (joints + blendshapes)")
        subsystem.request_auto_rigging(character, auto_rig)
        report["autoRig"] = True

        textures = unreal.MetaHumanCharacterTextureRequestParams()
        textures.blocking = True
        textures.report_progress = False
        log("Requesting high-resolution textures")
        subsystem.request_texture_sources(character, textures)
        report["textures"] = bool(character.has_high_resolution_textures)
        log(f"has_high_resolution_textures={report['textures']}")

        report["canBuild"] = bool(subsystem.can_build_meta_human(character=character))
        log(f"can_build_meta_human={report['canBuild']}")
        if report["canBuild"]:
            build = unreal.MetaHumanCharacterEditorBuildParameters()
            build.pipeline_type = unreal.MetaHumanDefaultPipelineType.OPTIMIZED
            build.pipeline_quality = unreal.MetaHumanQualityLevel.MEDIUM
            build.absolute_build_path = BUILD_PATH
            build.common_folder_path = COMMON_PATH
            build.enable_wardrobe_item_validation = False
            log("Building assembled MetaHuman")
            subsystem.build_meta_human(character=character, params=build)
            report["built"] = True
        else:
            report["error"] = "can_build_meta_human is false after rig/texture steps"

        unreal.EditorAssetLibrary.save_directory("/Game/Characters/MetaHumans")
        if report["built"]:
            unreal.EditorAssetLibrary.save_directory(BUILD_PATH)

    except Exception as exc:
        report["error"] = str(exc)
        log(f"Authoring failed: {exc}")
        raise
    finally:
        if subsystem.is_object_added_for_editing(character):
            subsystem.remove_object_to_edit(character)
        write_report(report)
        log(json.dumps(report))


if __name__ == "__main__":
    main()
