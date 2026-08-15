#!/usr/bin/env bash
# Shared helpers for the macOS release workflow.
#
# These scripts run as the normal user. They never install software, change
# system policy, or request administrator rights. They write only project
# outputs under Saved/ and PackagedBuilds/, both of which are ignored.

set -euo pipefail

CARDIO_SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CARDIO_PROJECT_ROOT="$(cd -- "${CARDIO_SCRIPT_DIR}/.." && pwd)"
CARDIO_REQUIRED_NODE_MAJOR=24
CARDIO_REQUIRED_ENGINE_VERSION="5.8"

cardio_info() { printf '==> %s\n' "$*"; }
cardio_warn() { printf 'warning: %s\n' "$*" >&2; }
cardio_fail() { printf 'error: %s\n' "$*" >&2; exit 1; }

# JSON string escaping for report emission. Handles the characters that can
# appear in paths, chip names, and error text.
cardio_json_escape() {
  local raw="$1"
  raw="${raw//\\/\\\\}"
  raw="${raw//\"/\\\"}"
  raw="${raw//$'\t'/\\t}"
  raw="${raw//$'\r'/\\r}"
  raw="${raw//$'\n'/\\n}"
  printf '%s' "$raw"
}

cardio_utc_now() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

cardio_require_macos() {
  [[ "$(uname -s)" == "Darwin" ]] ||
    cardio_fail "The macOS release workflow requires macOS. Detected: $(uname -s)."
}

cardio_require_apple_silicon() {
  [[ "$(uname -m)" == "arm64" ]] ||
    cardio_fail "ADR-0002 scopes the release target to Apple silicon. Detected architecture: $(uname -m)."
}

# Resolve node and enforce the major version the clinical tooling expects.
cardio_resolve_node() {
  local node_path
  node_path="$(command -v node || true)"
  [[ -n "$node_path" ]] ||
    cardio_fail "Node.js ${CARDIO_REQUIRED_NODE_MAJOR} was not found on PATH."

  local major
  major="$("$node_path" --version | sed -E 's/^v([0-9]+).*/\1/')"
  if (( major < CARDIO_REQUIRED_NODE_MAJOR )); then
    cardio_fail "Node.js ${CARDIO_REQUIRED_NODE_MAJOR} or newer is required. Detected v${major}."
  fi
  printf '%s' "$node_path"
}

# Locate an Unreal Engine 5.8 installation. UE_5_8_ROOT wins so a non-default
# install location can be used without editing scripts.
cardio_resolve_engine_root() {
  local candidates=()
  [[ -n "${UE_5_8_ROOT:-}" ]] && candidates+=("$UE_5_8_ROOT")
  candidates+=(
    "/Users/Shared/Epic Games/UE_${CARDIO_REQUIRED_ENGINE_VERSION}"
    "${HOME}/Epic Games/UE_${CARDIO_REQUIRED_ENGINE_VERSION}"
    "/Applications/Epic Games/UE_${CARDIO_REQUIRED_ENGINE_VERSION}"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -x "${candidate}/Engine/Build/BatchFiles/Mac/Build.sh" ]]; then
      printf '%s' "$candidate"
      return 0
    fi
  done
  return 1
}

cardio_require_engine_root() {
  local root
  if ! root="$(cardio_resolve_engine_root)"; then
    cardio_fail "Unreal Engine ${CARDIO_REQUIRED_ENGINE_VERSION} was not found. Install it through the Epic Games Launcher, or set UE_5_8_ROOT for this shell."
  fi
  printf '%s' "$root"
}

cardio_installed_memory_gb() {
  local bytes
  bytes="$(sysctl -n hw.memsize)"
  printf '%s' "$(( bytes / 1024 / 1024 / 1024 ))"
}

cardio_free_disk_gb() {
  local target="${1:-$CARDIO_PROJECT_ROOT}"
  df -g "$target" | awk 'NR==2 {print $4}'
}

cardio_chip_name() { sysctl -n machdep.cpu.brand_string 2>/dev/null || printf 'unknown'; }
cardio_macos_version() { sw_vers -productVersion; }

# Package provenance. Mirrors Get-CardioPackageProvenance in Unreal-Common.ps1:
# packaging refuses a dirty or unverifiable worktree so a package can always be
# tied back to committed source.
cardio_require_clean_worktree() {
  command -v git >/dev/null 2>&1 ||
    cardio_fail "Git is required to establish package provenance."

  local commit status_lines
  commit="$(git -C "$CARDIO_PROJECT_ROOT" rev-parse --verify HEAD 2>/dev/null || true)"
  [[ -n "$commit" ]] ||
    cardio_fail "Git HEAD could not be resolved. Commit the package source before packaging."

  status_lines="$(git -C "$CARDIO_PROJECT_ROOT" status --porcelain=v1 --untracked-files=all -- . || true)"
  if [[ -n "$status_lines" ]]; then
    printf 'error: the Unreal project contains uncommitted or untracked files:\n%s\n' \
      "$(printf '%s\n' "$status_lines" | head -n 10)" >&2
    cardio_fail "Commit or intentionally remove them before creating a verifiable package."
  fi
  printf '%s' "$commit"
}

cardio_reports_dir() {
  local kind="$1"
  local dir="${CARDIO_PROJECT_ROOT}/Saved/${kind}"
  mkdir -p "$dir"
  printf '%s' "$dir"
}
