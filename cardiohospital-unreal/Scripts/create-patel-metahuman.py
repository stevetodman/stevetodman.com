import json
import unreal

CHARACTER_PATH = "/Game/Characters/MetaHumans"
CHARACTER_NAME = "Patel"
CHARACTER_OBJECT = f"{CHARACTER_PATH}/{CHARACTER_NAME}.{CHARACTER_NAME}"
BUILD_PATH = "/Game/MetaHumans"
COMMON_PATH = "/Game/MetaHumans/Common"

# High is the real-time AAA target. Cinematic pipeline is offline-heavy and
# fights the 60 FPS / 2560x1440 packaged gate on this slice.
PIPELINE_TYPE = unreal.MetaHumanDefaultPipelineType.OPTIMIZED
PIPELINE_QUALITY = unreal.MetaHumanQualityLevel.HIGH

WARDROBE = {
    "Outfits": "/MetaHumanCharacter/Optional/Clothing/WI_DefaultGarment.WI_DefaultGarment",
    "Hair": "/MetaHumanCharacter/Optional/Grooms/Bindings/Hair/WI_Hair_S_Clean.WI_Hair_S_Clean",
    "Eyebrows": "/MetaHumanCharacter/Optional/Grooms/Bindings/Eyebrows/WI_Eyebrows_M_Natural.WI_Eyebrows_M_Natural",
    "Eyelashes": "/MetaHumanCharacter/Optional/Grooms/Bindings/Eyelashes/WI_Eyelashes_S_Fine.WI_Eyelashes_S_Fine",
}


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
    unreal.EditorAssetLibrary.save_loaded_asset(character)
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


def try_add_wardrobe(character, slot_name, asset_path):
    wardrobe_item = unreal.load_asset(asset_path)
    if not wardrobe_item:
        log(f"Wardrobe item missing: {asset_path}")
        return False
    item_key = character.internal_collection.try_add_item_from_wardrobe_item(slot_name, wardrobe_item)
    if not item_key:
        log(f"Could not add wardrobe item for {slot_name}")
        return False
    selection = unreal.MetaHumanPipelineSlotSelection(slot_name=slot_name, selected_item=item_key)
    character.internal_collection.default_instance.try_add_slot_selection(selection)
    log(f"Added {slot_name} from {asset_path}")
    return True


def apply_attending_skin(subsystem, character):
    # Warm medium-deep complexion for a South Asian attending. U/V are the
    # MetaHuman skin-tone atlas; this is authoring, not a stock preset swap.
    skin_properties = unreal.MetaHumanCharacterSkinProperties()
    skin_properties.u = 0.42
    skin_properties.v = 0.58
    skin_properties.show_top_underwear = True
    skin_properties.body_texture_index = 2
    skin_properties.face_texture_index = 2
    skin_properties.roughness = 0.72

    freckles = unreal.MetaHumanCharacterFrecklesProperties()
    freckles.density = 0.08
    freckles.strength = 0.18
    freckles.saturation = 0.55
    freckles.tone_shift = 0.1

    accent = unreal.MetaHumanCharacterAccentRegionProperties()
    accent.lightness = 0.12
    accent.redness = 0.22
    accent.saturation = 0.4

    accents = unreal.MetaHumanCharacterAccentRegions()
    accents.cheeks = accent
    accents.chin = accent
    accents.ears = accent
    accents.forehead = accent
    accents.lips = accent
    accents.nose = accent
    accents.under_eye = accent

    skin_settings = unreal.MetaHumanCharacterSkinSettings()
    skin_settings.skin = skin_properties
    skin_settings.freckles = freckles
    skin_settings.accents = accents
    skin_settings.enable_texture_overrides = False

    character.preview_material_type = unreal.MetaHumanCharacterSkinPreviewMaterial.EDITABLE
    subsystem.commit_skin_settings(character, skin_settings)
    log("Committed attending skin settings")


def write_report(payload):
    from pathlib import Path

    path = Path(unreal.Paths.project_content_dir()) / "Characters" / "MetaHumans" / "patel-assembly.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    log(f"Wrote {path}")


def main():
    log("Starting Patel MetaHuman authoring (HIGH optimized)")
    subsystem = unreal.get_editor_subsystem(unreal.MetaHumanCharacterEditorSubsystem)
    if subsystem is None:
        fail("MetaHumanCharacterEditorSubsystem is not available")

    character = load_or_create_character()
    if not subsystem.try_add_object_to_edit(character):
        fail("Could not open Patel for edit")

    report = {
        "character": CHARACTER_OBJECT,
        "pipeline": "OPTIMIZED",
        "quality": "HIGH",
        "wardrobe": [],
        "autoRig": False,
        "textures": False,
        "built": False,
        "canBuild": False,
        "error": "",
    }

    try:
        try_set_height(subsystem, character, 175.0)
        for slot_name, asset_path in WARDROBE.items():
            if try_add_wardrobe(character, slot_name, asset_path):
                report["wardrobe"].append(slot_name)
        apply_attending_skin(subsystem, character)

        auto_rig = unreal.MetaHumanCharacterAutoRiggingRequestParams()
        auto_rig.blocking = True
        auto_rig.report_progress = False
        auto_rig.rig_type = getattr(
            unreal.MetaHumanRigType,
            "JOINTS_AND_BLEND_SHAPES",
            unreal.MetaHumanRigType.JOINTS_ONLY,
        )
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
            build.pipeline_type = PIPELINE_TYPE
            build.pipeline_quality = PIPELINE_QUALITY
            build.absolute_build_path = BUILD_PATH
            build.common_folder_path = COMMON_PATH
            build.enable_wardrobe_item_validation = False
            log("Building assembled MetaHuman at HIGH")
            subsystem.build_meta_human(character=character, params=build)
            report["built"] = True
        else:
            report["error"] = (
                "can_build_meta_human is false after rig/texture steps. "
                "High-resolution textures require an Epic login in the editor "
                "and MetaHuman Creator Core Data (Optional)."
            )

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
