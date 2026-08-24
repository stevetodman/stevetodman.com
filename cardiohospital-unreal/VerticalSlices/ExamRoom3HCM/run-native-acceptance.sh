#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
source "${PROJECT_ROOT}/Scripts/common.sh"

cardio_require_macos
cardio_require_apple_silicon
engine_root="$(cardio_require_engine_root)"
editor_cmd="${engine_root}/Engine/Binaries/Mac/UnrealEditor-Cmd"
uproject="${PROJECT_ROOT}/CardioHospital.uproject"
python_script="${SCRIPT_DIR}/run_acceptance_in_unreal.py"
evidence_dir="${CARDIO_HCM_EVIDENCE_DIR:-${PROJECT_ROOT}/Saved/ExamRoom3HCMEvidence/$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$evidence_dir"
export CARDIO_HCM_EVIDENCE_DIR="$evidence_dir"

[[ -x "$editor_cmd" ]] || cardio_fail "UnrealEditor-Cmd not found: ${editor_cmd}"
[[ -f "$python_script" ]] || cardio_fail "Native HCM acceptance script not found: ${python_script}"

cardio_info "Running portable Exam Room 3 HCM contract gate"
node "${PROJECT_ROOT}/Tools/validate-exam-room3-hcm-slice.mjs"

cardio_info "Running native build and Unreal automation prerequisites"
"${PROJECT_ROOT}/Scripts/run-first-build.sh" --configuration Development

cardio_info "Running native Exam Room 3 HCM acceptance and locked-camera capture"
set +e
"$editor_cmd" "$uproject" \
  "-ExecutePythonScript=${python_script}" \
  -unattended -nopause -nosplash -log
editor_status=$?
set -e

result_json="${evidence_dir}/unreal-acceptance.json"
[[ -f "$result_json" ]] || cardio_fail "Unreal emitted no acceptance result: ${result_json}"

node "${PROJECT_ROOT}/Tools/validate-exam-room3-native-evidence.mjs" "$evidence_dir"

if (( editor_status != 0 )); then
  cardio_fail "UnrealEditor-Cmd exited with code ${editor_status}; evidence was retained at ${evidence_dir}."
fi

cardio_info "Native HCM acceptance evidence passed: ${evidence_dir}"
cardio_warn "This automated pass does not satisfy the separate human walkthrough or measured performance gates."
