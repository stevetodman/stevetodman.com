#!/usr/bin/env bash
# Run the native Unreal automation tests headlessly.
#
# These are the CardioClinicalData, CardioEducationEvaluator, and
# CardioLearnerProfile suites. Passing them proves native behaviour in the
# editor runtime. It does not prove cook, package, or walkthrough behaviour.

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/common.sh"

FILTER="CardioHospital"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --filter) FILTER="$2"; shift 2 ;;
    *) cardio_fail "Unknown argument: $1" ;;
  esac
done

cardio_require_macos
engine_root="$(cardio_require_engine_root)"
uproject="${CARDIO_PROJECT_ROOT}/CardioHospital.uproject"
editor_cmd="${engine_root}/Engine/Binaries/Mac/UnrealEditor-Cmd"

[[ -x "$editor_cmd" ]] ||
  cardio_fail "UnrealEditor-Cmd was not found at ${editor_cmd}. Build the editor target first."

log_dir="$(cardio_reports_dir AutomationReports)"
report_dir="${log_dir}/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$report_dir"

cardio_info "Running automation filter '${FILTER}'"
set +e
"$editor_cmd" "$uproject" \
  -ExecCmds="Automation RunTest ${FILTER}; Quit" \
  -unattended -nopause -nosplash -nullrhi \
  -ReportExportPath="$report_dir" \
  -log
status=$?
set -e

cardio_info "Automation report: ${report_dir}"
if (( status != 0 )); then
  cardio_fail "Unreal automation failed with exit code ${status}. Read the report before changing any gate."
fi

# A zero exit code alone is not a pass: UnrealEditor-Cmd can exit clean when no
# test matched the filter. The exported index.json is the actual result.
report_index="${report_dir}/index.json"
[[ -f "$report_index" ]] ||
  cardio_fail "Automation produced no index.json in ${report_dir}. No tests ran; this is not a pass."
grep -q '"Fail"' "$report_index" &&
  cardio_fail "Automation reported failing tests in ${report_index}."
cardio_info "Native automation passed. No packaging or walkthrough claim follows from this."
