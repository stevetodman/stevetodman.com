"""Retint clinic surface materials to a cool modern ward palette.

Does not delete material expressions. Existing Constant3Vector / VectorParameter
nodes are recolored in place and the material is recompiled.
"""

import unreal

DEST = "/Game/Environment/Clinic"

SURFACES = (
    ("M_WallPaint", (0.96, 0.97, 0.98)),
    ("M_Wainscot", (0.88, 0.90, 0.92)),
    ("M_WallTrim", (0.97, 0.98, 0.99)),
    ("M_ClinicFloor", (0.74, 0.76, 0.78)),
    ("M_FloorGrout", (0.52, 0.54, 0.56)),
    ("M_CeilingTile", (0.97, 0.98, 0.99)),
    ("M_CeilingGrid", (0.78, 0.80, 0.82)),
    ("M_Baseboard", (0.92, 0.93, 0.94)),
    ("M_DeskWood", (0.78, 0.80, 0.82)),
    ("M_Linen", (0.94, 0.95, 0.96)),
    ("M_LightDiffuser", (0.96, 0.98, 1.0)),
    ("M_WindowSill", (0.82, 0.84, 0.86)),
)


def log(message):
    unreal.log(f"[ClinicTint] {message}")


def retint(name, rgb):
    path = f"{DEST}/{name}"
    if not unreal.EditorAssetLibrary.does_asset_exist(path):
        log(f"missing {path}")
        return
    mat = unreal.EditorAssetLibrary.load_asset(path)
    if not mat:
        log(f"failed to load {path}")
        return

    color = unreal.LinearColor(rgb[0], rgb[1], rgb[2], 1.0)
    lib = unreal.MaterialEditingLibrary
    class_name = mat.get_class().get_name()
    changed = 0

    if class_name == "MaterialInstanceConstant":
        existing = {}
        try:
            for entry in list(mat.get_editor_property("vector_parameter_values") or []):
                info = entry.get_editor_property("parameter_info")
                if info:
                    existing[str(info.get_editor_property("name"))] = True
        except Exception as error:  # noqa: BLE001
            log(f"{name} vector params unread: {error}")
        assignments = {
            "DiffuseColor": color,
            "BaseColor": color,
            "Color": color,
            "Tint": color,
            "AmbientColor": unreal.LinearColor(rgb[0] * 0.35, rgb[1] * 0.35, rgb[2] * 0.35, 1.0),
            "SpecularColor": unreal.LinearColor(0.08, 0.08, 0.08, 1.0),
            "EmissiveColor": (
                color if name == "M_LightDiffuser"
                else unreal.LinearColor(0.0, 0.0, 0.0, 1.0)
            ),
        }
        for param, value in assignments.items():
            if param not in existing and param not in ("DiffuseColor", "BaseColor", "Color"):
                continue
            try:
                lib.set_material_instance_vector_parameter_value(mat, param, value)
                changed += 1
                log(f"{name} set {param}")
            except Exception as error:  # noqa: BLE001
                log(f"{name} skip {param}: {error}")
        if changed:
            lib.update_material_instance(mat)
    else:
        expressions = []
        try:
            expressions = list(mat.get_editor_property("expressions") or [])
        except Exception as error:  # noqa: BLE001
            log(f"{name} expressions unavailable: {error}")
        for expr in expressions:
            if not expr:
                continue
            expr_class = expr.get_class().get_name()
            if expr_class in (
                "MaterialExpressionConstant3Vector",
                "MaterialExpressionVectorParameter",
            ):
                try:
                    expr.set_editor_property("constant", color)
                    changed += 1
                except Exception as error:  # noqa: BLE001
                    log(f"{name} could not set {expr_class}: {error}")
        if changed:
            lib.recompile_material(mat)

    if changed == 0:
        log(f"{name} had no color to retint (class={class_name})")
        return

    unreal.EditorAssetLibrary.save_asset(path)
    log(f"{name} retinted {changed} value(s) -> {rgb}")


def main():
    for name, rgb in SURFACES:
        retint(name, rgb)


if __name__ == "__main__":
    main()
