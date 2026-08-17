import unreal


DEST = "/Game/Environment/Clinic"


def make_lit_mat(name, color, roughness, metallic=0.0):
    path = f"{DEST}/{name}"
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        mat = unreal.EditorAssetLibrary.load_asset(path)
    else:
        mat = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
            name, DEST, unreal.Material, unreal.MaterialFactoryNew()
        )
    lib = unreal.MaterialEditingLibrary
    lib.delete_all_material_expressions(mat)
    base = lib.create_material_expression(mat, unreal.MaterialExpressionConstant3Vector, -380, 0)
    base.set_editor_property("constant", unreal.LinearColor(color[0], color[1], color[2], 1.0))
    lib.connect_material_property(base, "", unreal.MaterialProperty.MP_BASE_COLOR)
    rough = lib.create_material_expression(mat, unreal.MaterialExpressionConstant, -380, 140)
    rough.set_editor_property("r", roughness)
    lib.connect_material_property(rough, "", unreal.MaterialProperty.MP_ROUGHNESS)
    metal = lib.create_material_expression(mat, unreal.MaterialExpressionConstant, -380, 220)
    metal.set_editor_property("r", metallic)
    lib.connect_material_property(metal, "", unreal.MaterialProperty.MP_METALLIC)
    lib.recompile_material(mat)
    unreal.EditorAssetLibrary.save_asset(path)
    return mat


def main():
    shirt = make_lit_mat("M_DressShirt", (0.99, 0.99, 0.98), 0.30)
    tie = make_lit_mat("M_AttendingTie", (0.08, 0.14, 0.26), 0.42)
    button = make_lit_mat("M_CoatButton", (0.80, 0.81, 0.83), 0.20, metallic=0.9)
    mesh = unreal.EditorAssetLibrary.load_asset(f"{DEST}/SM_LabCoat")
    mesh.set_material(1, shirt)
    mesh.set_material(2, tie)
    mesh.set_material(3, button)
    unreal.EditorAssetLibrary.save_asset(f"{DEST}/SM_LabCoat")
    unreal.log("[AttendingKit] assigned shirt/tie/button materials")


if __name__ == "__main__":
    main()
