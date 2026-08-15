#!/usr/bin/env bash
# Read-only macOS workstation preflight for the ADR-0002 release target.
#
# Reports readiness. Never installs, configures, or elevates. A passing
# preflight is not a performance pass and not a walkthrough pass.

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/common.sh"

MIN_MEMORY_GB=48
MIN_FREE_DISK_GB=100
SKIP_DISK_CHECK=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-disk-check) SKIP_DISK_CHECK=1; shift ;;
    --min-free-disk-gb) MIN_FREE_DISK_GB="$2"; shift 2 ;;
    *) cardio_fail "Unknown argument: $1" ;;
  esac
done

cardio_require_macos

user_actions=()
it_actions=()

add_user_action() { user_actions+=("$1"); }
add_it_action() { it_actions+=("$1"); }

# --- Architecture -----------------------------------------------------------
arch="$(uname -m)"
chip="$(cardio_chip_name)"
arch_passed=false
if [[ "$arch" == "arm64" ]]; then
  arch_passed=true
else
  add_it_action "ADR-0002 scopes the release target to Apple silicon. Detected ${arch} (${chip}). A hardware change is required."
fi

# --- macOS version ----------------------------------------------------------
macos_version="$(cardio_macos_version)"
macos_major="${macos_version%%.*}"
macos_passed=true
if (( macos_major < 14 )); then
  macos_passed=false
  add_user_action "macOS ${macos_version} predates the releases Unreal Engine 5.8 supports. Update macOS."
fi

# --- Memory -----------------------------------------------------------------
memory_gb="$(cardio_installed_memory_gb)"
memory_passed=true
if (( memory_gb < MIN_MEMORY_GB )); then
  memory_passed=false
  add_it_action "At least ${MIN_MEMORY_GB} GB of unified memory is required; detected ${memory_gb} GB. A hardware change is required."
fi

# --- Disk -------------------------------------------------------------------
free_disk_gb="$(cardio_free_disk_gb "$CARDIO_PROJECT_ROOT")"
disk_passed=true
if (( SKIP_DISK_CHECK == 0 )) && (( free_disk_gb < MIN_FREE_DISK_GB )); then
  disk_passed=false
  add_user_action "At least ${MIN_FREE_DISK_GB} GB free is required on the project drive; detected ${free_disk_gb} GB. Free space and re-run."
fi

# --- Unreal Engine ----------------------------------------------------------
engine_root=""
engine_passed=false
if engine_root="$(cardio_resolve_engine_root)"; then
  engine_passed=true
else
  engine_root=""
  add_user_action "Unreal Engine ${CARDIO_REQUIRED_ENGINE_VERSION} was not found. Install it through the Epic Games Launcher, or set UE_5_8_ROOT for this shell."
fi

# --- Xcode ------------------------------------------------------------------
xcode_path=""
xcode_passed=false
if xcode_path="$(xcode-select --print-path 2>/dev/null)"; then
  if [[ -d "$xcode_path" ]]; then
    if xcodebuild -version >/dev/null 2>&1; then
      xcode_passed=true
    else
      add_user_action "The Xcode command line tools are selected but xcodebuild is unavailable. Install full Xcode; the command line tools alone cannot build Unreal targets."
    fi
  fi
else
  add_user_action "Xcode is not selected. Install Xcode from the App Store and run xcode-select --switch on its path."
fi
xcode_version="$(xcodebuild -version 2>/dev/null | head -n 1 || printf 'not detected')"

# --- Node -------------------------------------------------------------------
node_passed=false
node_version="not detected"
if node_path="$(command -v node 2>/dev/null)"; then
  node_version="$("$node_path" --version)"
  node_major="${node_version#v}"; node_major="${node_major%%.*}"
  if (( node_major >= CARDIO_REQUIRED_NODE_MAJOR )); then
    node_passed=true
  else
    add_user_action "Node.js ${CARDIO_REQUIRED_NODE_MAJOR} or newer is required for clinical tooling; detected ${node_version}."
  fi
else
  add_user_action "Node.js ${CARDIO_REQUIRED_NODE_MAJOR} was not found on PATH."
fi

# --- Git --------------------------------------------------------------------
git_passed=false
git_version="not detected"
if command -v git >/dev/null 2>&1; then
  git_passed=true
  git_version="$(git --version)"
else
  add_user_action "Git is required for package provenance."
fi

# --- Report -----------------------------------------------------------------
passed=true
(( ${#user_actions[@]} > 0 || ${#it_actions[@]} > 0 )) && passed=false

emit_array() {
  local first=1 item
  printf '['
  for item in "$@"; do
    (( first )) || printf ','
    first=0
    printf '\n      "%s"' "$(cardio_json_escape "$item")"
  done
  (( first )) || printf '\n    '
  printf ']'
}

reports_dir="$(cardio_reports_dir WorkstationReports)"
report_path="${reports_dir}/workstation-$(date -u +%Y%m%dT%H%M%SZ).json"

{
  printf '{\n'
  printf '  "schemaVersion": 3,\n'
  printf '  "generatedAtUtc": "%s",\n' "$(cardio_utc_now)"
  printf '  "target": "macos-apple-silicon",\n'
  printf '  "authority": "Docs/ADR-0002-macos-release-target.md",\n'
  printf '  "passed": %s,\n' "$passed"
  printf '  "standardUserSafe": true,\n'
  printf '  "requiresElevationToRun": false,\n'
  printf '  "sharingNote": "Local workstation inventory. Keep it out of source control.",\n'
  printf '  "architecture": { "passed": %s, "arch": "%s", "chip": "%s" },\n' \
    "$arch_passed" "$(cardio_json_escape "$arch")" "$(cardio_json_escape "$chip")"
  printf '  "macos": { "passed": %s, "version": "%s" },\n' "$macos_passed" "$(cardio_json_escape "$macos_version")"
  printf '  "memory": { "passed": %s, "installedGB": %s, "requiredGB": %s },\n' \
    "$memory_passed" "$memory_gb" "$MIN_MEMORY_GB"
  printf '  "disk": { "passed": %s, "freeGB": %s, "requiredFreeGB": %s, "skipped": %s },\n' \
    "$disk_passed" "$free_disk_gb" "$MIN_FREE_DISK_GB" "$( ((SKIP_DISK_CHECK)) && echo true || echo false )"
  printf '  "unreal": { "passed": %s, "version": "%s", "root": "%s" },\n' \
    "$engine_passed" "$CARDIO_REQUIRED_ENGINE_VERSION" "$(cardio_json_escape "$engine_root")"
  printf '  "xcode": { "passed": %s, "version": "%s", "path": "%s" },\n' \
    "$xcode_passed" "$(cardio_json_escape "$xcode_version")" "$(cardio_json_escape "$xcode_path")"
  printf '  "node": { "passed": %s, "version": "%s" },\n' "$node_passed" "$(cardio_json_escape "$node_version")"
  printf '  "git": { "passed": %s, "version": "%s" },\n' "$git_passed" "$(cardio_json_escape "$git_version")"
  printf '  "userAction": %s,\n' "$(emit_array ${user_actions+"${user_actions[@]}"})"
  printf '  "itOrAdminRequired": %s,\n' "$(emit_array ${it_actions+"${it_actions[@]}"})"
  printf '  "performanceNote": "A passing preflight is not a performance pass. Only measured packaged execution can establish that."\n'
  printf '}\n'
} > "$report_path"

cardio_info "Workstation report: ${report_path}"
printf '    chip     %s (%s)\n' "$chip" "$arch"
printf '    macOS    %s\n' "$macos_version"
printf '    memory   %s GB (need %s)\n' "$memory_gb" "$MIN_MEMORY_GB"
printf '    disk     %s GB free (need %s)\n' "$free_disk_gb" "$MIN_FREE_DISK_GB"
printf '    unreal   %s\n' "${engine_root:-not found}"
printf '    xcode    %s\n' "$xcode_version"
printf '    node     %s\n' "$node_version"

if [[ "$passed" == true ]]; then
  cardio_info "Preflight passed. This does not constitute a build, package, or performance result."
  exit 0
fi

printf '\n'
for item in ${user_actions+"${user_actions[@]}"}; do printf 'UserAction: %s\n' "$item" >&2; done
for item in ${it_actions+"${it_actions[@]}"}; do printf 'ITOrAdminRequired: %s\n' "$item" >&2; done
cardio_fail "Preflight failed. Resolve the reported items; do not bypass a prerequisite."
