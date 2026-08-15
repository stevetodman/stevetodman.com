#!/usr/bin/env bash
# Portable clinical validation. Platform independent: this is the same work CI
# performs on Linux and Windows, and it makes no Unreal claim of any kind.

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/common.sh"

node_path="$(cardio_resolve_node)"
cd "$CARDIO_PROJECT_ROOT"

cardio_info "Export generated clinical data"
"$node_path" --experimental-strip-types Tools/export-clinical-data.mjs

cardio_info "Validate the Unreal clinical-data contract"
"$node_path" Tools/validate-clinical-data.mjs

cardio_info "Generate the case-authoring report"
"$node_path" Tools/case-authoring-report.mjs >/dev/null

cardio_info "Run portable clinical tests"
"$node_path" --test Tests/*.test.mjs

cardio_info "Require committed generated content to be current"
git -C "$CARDIO_PROJECT_ROOT" diff --exit-code -- Content/Data/clinical-content.json ||
  cardio_fail "The generated clinical artifact is stale. Commit the regenerated file."

cardio_info "Portable clinical content validation passed. No Unreal gate was exercised."
