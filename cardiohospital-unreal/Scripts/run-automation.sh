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
#
# Parse it rather than grepping. The report is pretty-printed with a space after
# each colon, so a pattern like '"state":"Fail"' silently never matches and would
# wave through real failures. Node is already a hard prerequisite.
report_index="${report_dir}/index.json"
[[ -f "$report_index" ]] ||
  cardio_fail "Automation produced no index.json in ${report_dir}. No tests ran; this is not a pass."

node_path="$(cardio_resolve_node)"
"$node_path" -e '
const { readFileSync } = require("node:fs");
const report = JSON.parse(readFileSync(process.argv[1], "utf8"));
const tests = Array.isArray(report.tests) ? report.tests : [];

if (tests.length === 0) {
  console.error("Automation reported zero tests. The filter matched nothing; this is not a pass.");
  process.exit(1);
}

const notPassing = tests.filter((test) => test.state !== "Success");
if (notPassing.length > 0) {
  for (const test of notPassing) {
    console.error(`  ${test.fullTestPath}: ${test.state} (${test.errors} error(s))`);
  }
  console.error(`Automation reported ${notPassing.length} non-passing test(s).`);
  process.exit(1);
}

console.log(`    ${tests.length} test(s) passed:`);
for (const test of tests) {
  console.log(`      ${test.fullTestPath}`);
}
' "$report_index" || cardio_fail "Automation results in ${report_index} do not constitute a pass."

cardio_info "Native automation passed. No packaging or walkthrough claim follows from this."
