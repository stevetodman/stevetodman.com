#!/usr/bin/env bash
# Compile the editor target under Clang. This is the gate that first exercises
# Unreal Header Tool against the reflected clinical, education, and learner
# types. A pass here is a compile result only, never a walkthrough result.

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/common.sh"

CONFIGURATION="Development"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --configuration) CONFIGURATION="$2"; shift 2 ;;
    *) cardio_fail "Unknown argument: $1" ;;
  esac
done

cardio_require_macos
cardio_require_apple_silicon
engine_root="$(cardio_require_engine_root)"
uproject="${CARDIO_PROJECT_ROOT}/CardioHospital.uproject"

cardio_info "Building CardioHospitalEditor (${CONFIGURATION}, Mac arm64)"
"${engine_root}/Engine/Build/BatchFiles/Mac/Build.sh" \
  CardioHospitalEditor Mac "$CONFIGURATION" \
  -project="$uproject" -architecture=arm64 -waitmutex

cardio_info "Editor target compiled. Unreal Header Tool accepted the reflected types."
