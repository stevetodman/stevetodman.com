#!/usr/bin/env bash
# Resumable macOS baseline: preflight, portable validation, project files,
# editor compile, native automation, and optionally packaging.
#
# Each stage writes a JSON report under Saved/FirstBuildReports with a
# resumeCommand. Preflight always re-runs. On failure, fix the reported problem
# and run the resumeCommand rather than restarting the whole plan.

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/common.sh"

CONFIGURATION="Development"
INCLUDE_PACKAGE=0
START_AT=""
RERUN_ALL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --configuration) CONFIGURATION="$2"; shift 2 ;;
    --include-package) INCLUDE_PACKAGE=1; shift ;;
    --start-at) START_AT="$2"; shift 2 ;;
    --rerun-all) RERUN_ALL=1; shift ;;
    *) cardio_fail "Unknown argument: $1" ;;
  esac
done

cardio_require_macos

STAGES=(preflight validation project-generation editor-build automation)
(( INCLUDE_PACKAGE )) && STAGES+=(package)

reports_dir="$(cardio_reports_dir FirstBuildReports)"
report_path="${reports_dir}/first-build-$(date -u +%Y%m%dT%H%M%SZ).json"
script_rel="Scripts/run-first-build.sh"

resume_command() {
  local stage="$1"
  local extra=""
  (( INCLUDE_PACKAGE )) && extra=" --include-package"
  printf './%s --start-at %s --configuration %s%s' "$script_rel" "$stage" "$CONFIGURATION" "$extra"
}

run_stage() {
  case "$1" in
    preflight)    "${CARDIO_SCRIPT_DIR}/check-workstation.sh" ;;
    validation)   "${CARDIO_SCRIPT_DIR}/run-validation.sh" ;;
    project-generation) "${CARDIO_SCRIPT_DIR}/generate-project-files.sh" ;;
    editor-build)       "${CARDIO_SCRIPT_DIR}/build-editor.sh" --configuration "$CONFIGURATION" ;;
    automation)   "${CARDIO_SCRIPT_DIR}/run-automation.sh" ;;
    package)      "${CARDIO_SCRIPT_DIR}/package-macos.sh" --configuration "$CONFIGURATION" ;;
    *) cardio_fail "Unknown stage: $1" ;;
  esac
}

# --start-at skips earlier stages, except preflight which always runs.
skipping=0
[[ -n "$START_AT" ]] && skipping=1
(( RERUN_ALL )) && { skipping=0; START_AT=""; }

results=()
overall="passed"
failed_stage=""

for stage in "${STAGES[@]}"; do
  if (( skipping )) && [[ "$stage" != "preflight" ]]; then
    if [[ "$stage" == "$START_AT" ]]; then
      skipping=0
    else
      results+=("$stage:skipped")
      continue
    fi
  fi

  cardio_info "Stage: ${stage}"
  started="$(cardio_utc_now)"
  if run_stage "$stage"; then
    results+=("${stage}:passed")
  else
    results+=("${stage}:failed")
    overall="failed"
    failed_stage="$stage"
    break
  fi
  printf '    started %s, finished %s\n' "$started" "$(cardio_utc_now)"
done

{
  printf '{\n'
  printf '  "schemaVersion": 2,\n'
  printf '  "generatedAtUtc": "%s",\n' "$(cardio_utc_now)"
  printf '  "target": "macos-apple-silicon",\n'
  printf '  "authority": "Docs/ADR-0002-macos-release-target.md",\n'
  printf '  "configuration": "%s",\n' "$CONFIGURATION"
  printf '  "outcome": "%s",\n' "$overall"
  printf '  "stages": [\n'
  first=1
  for entry in "${results[@]}"; do
    (( first )) || printf ',\n'
    first=0
    printf '    { "stage": "%s", "result": "%s" }' "${entry%%:*}" "${entry##*:}"
  done
  printf '\n  ],\n'
  if [[ -n "$failed_stage" ]]; then
    printf '  "resumeCommand": "%s",\n' "$(cardio_json_escape "$(resume_command "$failed_stage")")"
  else
    printf '  "packageResumeCommand": "%s",\n' \
      "$(cardio_json_escape "./${script_rel} --start-at package --configuration ${CONFIGURATION} --include-package")"
  fi
  printf '  "evidenceNote": "Stage results are build evidence only. The nineteen-step packaged walkthrough and the 2560x1440 performance capture are separate gates and are not implied by any stage above."\n'
  printf '}\n'
} > "$report_path"

cardio_info "Stage report: ${report_path}"

if [[ "$overall" == "failed" ]]; then
  printf '\n'
  cardio_warn "Stage '${failed_stage}' failed. Fix the reported problem, then run:"
  printf '    %s\n' "$(resume_command "$failed_stage")"
  exit 1
fi

cardio_info "Baseline stages passed."
if (( INCLUDE_PACKAGE )); then
  cardio_warn "A package exists. It has not been walked through; the manifest records walkthroughPassed=false."
else
  printf '    Commit and push the validated source, confirm the worktree is clean, then run:\n'
  printf '    ./%s --start-at package --configuration %s --include-package\n' "$script_rel" "$CONFIGURATION"
fi
