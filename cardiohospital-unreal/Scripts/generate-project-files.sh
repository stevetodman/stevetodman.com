#!/usr/bin/env bash
# Generate Xcode project files for the macOS toolchain.

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/common.sh"

cardio_require_macos
engine_root="$(cardio_require_engine_root)"
uproject="${CARDIO_PROJECT_ROOT}/CardioHospital.uproject"

[[ -f "$uproject" ]] || cardio_fail "CardioHospital.uproject was not found at ${uproject}."

cardio_info "Generating project files with ${engine_root}"
"${engine_root}/Engine/Build/BatchFiles/Mac/GenerateProjectFiles.sh" -project="$uproject" -game -engine
cardio_info "Project files generated."
