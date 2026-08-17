#!/usr/bin/env bash
# Attach a truthful walkthrough result to an exact package.
#
# This script cannot make a walkthrough pass. It records one. A pass requires
# all nineteen acceptance steps, the performance observations, a preflight
# report from the last 24 hours, and an untouched package whose file hashes
# still match its manifest. An incomplete run is recorded as failed.

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/common.sh"

PACKAGE_DIR=""
WORKSTATION_REPORT=""
OUTCOME=""
PASSED_STEPS=""
AVERAGE_FPS=""; MINIMUM_FPS=""; FRAME_TIME_P95=""
DRAW_CALLS=""; TRIANGLES=""; GPU_MEMORY_MB=""; TEXTURE_MEMORY_MB=""
NPC_COUNT=""; STARTUP_SECONDS=""
RESOLUTION_WIDTH=2560; RESOLUTION_HEIGHT=1440
CONFIRM_EXACT_PACKAGE_RUN=0
NOTES=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --package-directory) PACKAGE_DIR="$2"; shift 2 ;;
    --workstation-report) WORKSTATION_REPORT="$2"; shift 2 ;;
    --outcome) OUTCOME="$2"; shift 2 ;;
    --passed-steps) PASSED_STEPS="$2"; shift 2 ;;
    --average-fps) AVERAGE_FPS="$2"; shift 2 ;;
    --minimum-fps) MINIMUM_FPS="$2"; shift 2 ;;
    --frame-time-p95-ms) FRAME_TIME_P95="$2"; shift 2 ;;
    --draw-calls) DRAW_CALLS="$2"; shift 2 ;;
    --triangles) TRIANGLES="$2"; shift 2 ;;
    --gpu-memory-mb) GPU_MEMORY_MB="$2"; shift 2 ;;
    --texture-memory-mb) TEXTURE_MEMORY_MB="$2"; shift 2 ;;
    --npc-count) NPC_COUNT="$2"; shift 2 ;;
    --startup-seconds) STARTUP_SECONDS="$2"; shift 2 ;;
    --resolution-width) RESOLUTION_WIDTH="$2"; shift 2 ;;
    --resolution-height) RESOLUTION_HEIGHT="$2"; shift 2 ;;
    --confirm-exact-package-run) CONFIRM_EXACT_PACKAGE_RUN=1; shift ;;
    --notes) NOTES="$2"; shift 2 ;;
    *) cardio_fail "Unknown argument: $1" ;;
  esac
done

[[ -n "$PACKAGE_DIR" ]] || cardio_fail "--package-directory is required."
[[ -n "$WORKSTATION_REPORT" ]] || cardio_fail "--workstation-report is required."
[[ "$OUTCOME" == "Passed" || "$OUTCOME" == "Failed" ]] ||
  cardio_fail "--outcome must be Passed or Failed."

manifest="${PACKAGE_DIR}/build-manifest.json"
[[ -f "$manifest" ]] || cardio_fail "No build-manifest.json in ${PACKAGE_DIR}."
[[ -f "$WORKSTATION_REPORT" ]] || cardio_fail "Workstation report not found: ${WORKSTATION_REPORT}."

# The preflight report must be recent, so a stale pass cannot be reused.
report_age_seconds=$(( $(date +%s) - $(stat -f%m "$WORKSTATION_REPORT") ))
(( report_age_seconds <= 86400 )) ||
  cardio_fail "The workstation report is older than 24 hours. Re-run check-workstation.sh."

grep -q '"passed": true' "$WORKSTATION_REPORT" ||
  cardio_fail "The workstation report does not record a passing preflight."

# The package must be the one that was built: every hash still matches.
cardio_info "Verifying package integrity against the manifest"
mismatches=0
while IFS=$'\t' read -r rel expected; do
  actual="$(shasum -a 256 "${PACKAGE_DIR}/${rel}" 2>/dev/null | awk '{print $1}')"
  if [[ "$actual" != "$expected" ]]; then
    printf 'modified since packaging: %s\n' "$rel" >&2
    mismatches=$(( mismatches + 1 ))
  fi
done < <(sed -n 's/.*"path": "\([^"]*\)", "bytes": [0-9]*, "sha256": "\([^"]*\)".*/\1\t\2/p' "$manifest")

(( mismatches == 0 )) ||
  cardio_fail "${mismatches} packaged file(s) changed after packaging. This is no longer the exact package."

# Gate the pass.
recorded="$OUTCOME"
reasons=()

if [[ "$OUTCOME" == "Passed" ]]; then
  (( CONFIRM_EXACT_PACKAGE_RUN )) ||
    reasons+=("--confirm-exact-package-run was not supplied")

  step_count=0
  [[ -n "$PASSED_STEPS" ]] && step_count="$(printf '%s' "$PASSED_STEPS" | tr ',' '\n' | grep -c '[0-9]' || true)"
  (( step_count == 19 )) ||
    reasons+=("only ${step_count} of 19 acceptance steps were recorded")

  for pair in "average FPS:$AVERAGE_FPS" "minimum FPS:$MINIMUM_FPS" \
              "p95 frame time:$FRAME_TIME_P95" "draw calls:$DRAW_CALLS" \
              "triangles:$TRIANGLES" "GPU memory:$GPU_MEMORY_MB" \
              "texture memory:$TEXTURE_MEMORY_MB" "NPC count:$NPC_COUNT" \
              "startup seconds:$STARTUP_SECONDS"; do
    [[ -n "${pair#*:}" ]] || reasons+=("${pair%%:*} was not observed")
  done

  if [[ -n "$AVERAGE_FPS" ]] && awk "BEGIN{exit !($AVERAGE_FPS < 60)}"; then
    reasons+=("average FPS ${AVERAGE_FPS} is below the 60 FPS gate")
  fi
  if [[ -n "$FRAME_TIME_P95" ]] && awk "BEGIN{exit !($FRAME_TIME_P95 > 16.7)}"; then
    reasons+=("p95 frame time ${FRAME_TIME_P95} ms exceeds the 16.7 ms gate")
  fi
  if (( RESOLUTION_WIDTH != 2560 || RESOLUTION_HEIGHT != 1440 )); then
    reasons+=("performance was observed at ${RESOLUTION_WIDTH}x${RESOLUTION_HEIGHT}, not 2560x1440")
  fi

  if (( ${#reasons[@]} > 0 )); then
    recorded="Failed"
    cardio_warn "Recording this run as failed. An incomplete run is a failed run:"
    for reason in "${reasons[@]}"; do printf '    - %s\n' "$reason" >&2; done
  fi
fi

evidence_dir="$(cardio_reports_dir WalkthroughEvidence)"
evidence_path="${evidence_dir}/walkthrough-$(date -u +%Y%m%dT%H%M%SZ).json"

{
  printf '{\n'
  printf '  "schemaVersion": 2,\n'
  printf '  "recordedAtUtc": "%s",\n' "$(cardio_utc_now)"
  printf '  "authority": "Docs/ADR-0002-macos-release-target.md",\n'
  printf '  "packageDirectory": "%s",\n' "$(cardio_json_escape "$PACKAGE_DIR")"
  printf '  "workstationReport": "%s",\n' "$(cardio_json_escape "$WORKSTATION_REPORT")"
  printf '  "requestedOutcome": "%s",\n' "$OUTCOME"
  printf '  "recordedOutcome": "%s",\n' "$recorded"
  printf '  "walkthroughPassed": %s,\n' "$( [[ "$recorded" == Passed ]] && echo true || echo false )"
  printf '  "passedAcceptanceSteps": "%s",\n' "$(cardio_json_escape "$PASSED_STEPS")"
  printf '  "resolution": "%sx%s",\n' "$RESOLUTION_WIDTH" "$RESOLUTION_HEIGHT"
  printf '  "averageFps": %s,\n' "${AVERAGE_FPS:-null}"
  printf '  "minimumFps": %s,\n' "${MINIMUM_FPS:-null}"
  printf '  "frameTimeP95Ms": %s,\n' "${FRAME_TIME_P95:-null}"
  printf '  "drawCalls": %s,\n' "${DRAW_CALLS:-null}"
  printf '  "triangles": %s,\n' "${TRIANGLES:-null}"
  printf '  "gpuMemoryMB": %s,\n' "${GPU_MEMORY_MB:-null}"
  printf '  "textureMemoryMB": %s,\n' "${TEXTURE_MEMORY_MB:-null}"
  printf '  "npcCount": %s,\n' "${NPC_COUNT:-null}"
  printf '  "startupSeconds": %s,\n' "${STARTUP_SECONDS:-null}"
  printf '  "downgradeReasons": ['
  first=1
  for reason in ${reasons+"${reasons[@]}"}; do
    (( first )) || printf ','
    first=0
    printf '\n    "%s"' "$(cardio_json_escape "$reason")"
  done
  (( first )) || printf '\n  '
  printf '],\n'
  printf '  "notes": "%s"\n' "$(cardio_json_escape "$NOTES")"
  printf '}\n'
} > "$evidence_path"

cardio_info "Walkthrough evidence: ${evidence_path}"
if [[ "$recorded" == "Passed" ]]; then
  cardio_info "Recorded as PASSED against package ${PACKAGE_DIR}."
else
  cardio_warn "Recorded as FAILED. Fix the first broken acceptance step and package again."
  exit 1
fi
