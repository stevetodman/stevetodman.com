#!/usr/bin/env bash
# Cook and package the macOS application bundle, then write a provenance
# manifest.
#
# Packaging refuses a dirty or unverifiable worktree. The manifest always starts
# with walkthroughPassed=false; only record-walkthrough-evidence.sh may raise it,
# and only against this exact package.

source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/common.sh"

CONFIGURATION="Development"
ARCHIVE_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --configuration) CONFIGURATION="$2"; shift 2 ;;
    --archive-directory) ARCHIVE_DIR="$2"; shift 2 ;;
    *) cardio_fail "Unknown argument: $1" ;;
  esac
done

cardio_require_macos
cardio_require_apple_silicon
engine_root="$(cardio_require_engine_root)"
uproject="${CARDIO_PROJECT_ROOT}/CardioHospital.uproject"

commit="$(cardio_require_clean_worktree)"
short_commit="${commit:0:12}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"

if [[ -z "$ARCHIVE_DIR" ]]; then
  ARCHIVE_DIR="${CARDIO_PROJECT_ROOT}/PackagedBuilds/Mac-${CONFIGURATION}-${stamp}"
fi
mkdir -p "$ARCHIVE_DIR"

cardio_info "Packaging Mac ${CONFIGURATION} from ${short_commit}"
"${engine_root}/Engine/Build/BatchFiles/RunUAT.sh" BuildCookRun \
  -project="$uproject" \
  -platform=Mac \
  -clientconfig="$CONFIGURATION" \
  -architecture=arm64 \
  -nop4 -cook -build -stage -pak -archive \
  -archivedirectory="$ARCHIVE_DIR" \
  -utf8output

app_bundle="$(find "$ARCHIVE_DIR" -maxdepth 3 -name '*.app' -print -quit || true)"
[[ -n "$app_bundle" ]] ||
  cardio_fail "Unreal reported success but no .app bundle was archived under ${ARCHIVE_DIR}."

# Ad-hoc signing so the bundle launches on the reference workstation without a
# Gatekeeper bypass. ADR-0002 treats a manual quarantine clear as invalidating
# the walkthrough, because it is not the learner's launch path.
cardio_info "Ad-hoc signing ${app_bundle}"
codesign --force --deep --sign - "$app_bundle"
codesign --verify --deep --strict "$app_bundle" ||
  cardio_fail "Signature verification failed for ${app_bundle}."

manifest="${ARCHIVE_DIR}/build-manifest.json"
package_id="CardioHospital-Mac-${CONFIGURATION}-${short_commit}-${stamp}"

{
  printf '{\n'
  printf '  "schemaVersion": 2,\n'
  printf '  "packageId": "%s",\n' "$package_id"
  printf '  "generatedAtUtc": "%s",\n' "$(cardio_utc_now)"
  printf '  "platform": "Mac",\n'
  printf '  "architecture": "arm64",\n'
  printf '  "configuration": "%s",\n' "$CONFIGURATION"
  printf '  "authority": "Docs/ADR-0002-macos-release-target.md",\n'
  printf '  "sourceCommit": "%s",\n' "$commit"
  printf '  "worktreeState": "clean",\n'
  printf '  "engineRoot": "%s",\n' "$(cardio_json_escape "$engine_root")"
  printf '  "appBundle": "%s",\n' "$(cardio_json_escape "${app_bundle#"$ARCHIVE_DIR"/}")"
  printf '  "codesign": "adhoc",\n'
  printf '  "walkthroughPassed": false,\n'
  printf '  "performanceCaptured": false,\n'
  printf '  "files": [\n'
  first=1
  while IFS= read -r file; do
    (( first )) || printf ',\n'
    first=0
    printf '    { "path": "%s", "bytes": %s, "sha256": "%s" }' \
      "$(cardio_json_escape "${file#"$ARCHIVE_DIR"/}")" \
      "$(stat -f%z "$file")" \
      "$(shasum -a 256 "$file" | awk '{print $1}')"
  done < <(find "$ARCHIVE_DIR" -type f ! -name build-manifest.json | sort)
  printf '\n  ]\n'
  printf '}\n'
} > "$manifest"

cardio_info "Package completed: ${ARCHIVE_DIR}"
cardio_warn "The manifest records walkthroughPassed=false until the packaged build is actually run."
