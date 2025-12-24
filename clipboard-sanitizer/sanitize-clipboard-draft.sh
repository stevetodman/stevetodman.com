#!/bin/bash
# Clinical Clipboard Sanitizer v4.1 (macOS) — Session draft mode
#
# One hotkey, two uses:
#   1) Copy a section name (e.g., LABS) then run -> sets the current section.
#   2) Copy any text then run -> sanitizes and appends under the current section.
#
# Special commands (clipboard content; run hotkey):
#   CLEAR -> clears draft + section
#   DONE  -> copies final draft to clipboard and clears session
#   UNDO  -> reverts the last change (one-level undo)
#
# Uses only built-in macOS tools: pbpaste/pbcopy/osascript + perl (ships with macOS).
#
# NOTE: Heuristic (regex-based). It reduces risk but cannot guarantee removal of all identifiers.

set -euo pipefail
umask 077

# Use per-user temp on macOS when available (TMPDIR is usually per-user).
TMP_BASE="${TMPDIR:-/tmp}"
STATE_DIR="${TMP_BASE%/}/clipboard_sanitizer"
mkdir -p "$STATE_DIR"

DRAFT_FILE="${STATE_DIR}/draft.txt"
SECTION_FILE="${STATE_DIR}/section.txt"
BAK_FILE="${STATE_DIR}/draft.bak"

LOCK_DIR="${STATE_DIR}/.lock"

osa_escape() {
  perl -pe 's/\\/\\\\/g; s/"/\\"/g; s/\r?\n/ /g;'
}

notify() {
  local msg="${1:-}"
  local title="${2:-Sanitizer}"
  local sound="${3:-}"

  local msg_esc title_esc
  msg_esc="$(printf '%s' "$msg" | osa_escape)"
  title_esc="$(printf '%s' "$title" | osa_escape)"

  if [[ -n "$sound" ]]; then
    osascript -e "display notification \"${msg_esc}\" with title \"${title_esc}\" sound name \"${sound}\"" >/dev/null 2>&1 || true
  else
    osascript -e "display notification \"${msg_esc}\" with title \"${title_esc}\"" >/dev/null 2>&1 || true
  fi
}

cleanup() {
  # Remove lock and any temp files if they exist.
  rm -rf "$LOCK_DIR" 2>/dev/null || true
  [[ -n "${ADD_FILE:-}" && -f "${ADD_FILE:-}" ]] && rm -f "$ADD_FILE" || true
  [[ -n "${TMP_DRAFT:-}" && -f "${TMP_DRAFT:-}" ]] && rm -f "$TMP_DRAFT" || true
}
trap cleanup EXIT

on_err() {
  notify "Sanitizer error. Clipboard unchanged." "Sanitizer" "Basso"
  exit 1
}
trap on_err ERR

# Prevent concurrent runs (e.g., accidental double hotkey)
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  notify "Sanitizer already running" "Sanitizer"
  exit 0
fi

clip="$(pbpaste || true)"
if [[ -z "${clip}" ]]; then
  notify "Clipboard is empty" "Sanitizer"
  exit 0
fi

# Normalize command input from first line
cmd="$(printf '%s' "$clip" | tr -d '\r' | awk 'NR==1{print; exit}')"
cmd_trim="$(printf '%s' "$cmd" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g')"
cmd_upper="$(printf '%s' "$cmd_trim" | tr '[:lower:]' '[:upper:]')"

# Allow "#LABS" or "LABS:" for section shortcuts
cmd_upper="${cmd_upper#\#}"
cmd_upper="${cmd_upper%:}"

case "$cmd_upper" in
  CLEAR)
    rm -f "$DRAFT_FILE" "$SECTION_FILE" "$BAK_FILE"
    printf '' | pbcopy
    notify "Draft cleared" "Sanitizer" "Purr"
    exit 0
    ;;
  DONE)
    if [[ -f "$DRAFT_FILE" ]]; then
      cat "$DRAFT_FILE" | pbcopy
      rm -f "$DRAFT_FILE" "$SECTION_FILE" "$BAK_FILE"
      notify "Final draft copied (session cleared)" "Sanitizer" "Glass"
    else
      notify "No draft to finalize" "Sanitizer"
    fi
    exit 0
    ;;
  UNDO)
    if [[ -f "$BAK_FILE" ]]; then
      mv -f "$BAK_FILE" "$DRAFT_FILE"
      cat "$DRAFT_FILE" | pbcopy
      notify "Reverted last change" "Sanitizer" "Tink"
    else
      notify "Nothing to undo" "Sanitizer"
    fi
    exit 0
    ;;
esac

# Section command: allow "SECTION: LABS" or bare known section names
section=""
if [[ "$cmd_upper" =~ ^SECTION[[:space:]]*:[[:space:]]*([A-Z0-9_ -]{2,30})$ ]]; then
  section="${BASH_REMATCH[1]}"
  section="$(printf '%s' "$section" | sed -E 's/^[[:space:]]+|[[:space:]]+$//g' | tr ' ' '_' )"
else
  case "$cmd_upper" in
    LABS|NOTES|HPI|MEDS|IMAGING|REFERRAL|VITALS|PMH|ALLERGIES|ASSESSMENT|PLAN|CC|OTHER)
      section="$cmd_upper"
      ;;
  esac
fi

if [[ -n "$section" ]]; then
  printf '%s' "$section" > "$SECTION_FILE"
  notify "Next clip goes under: $section" "Sanitizer" "Tink"
  exit 0
fi

# Get current section (default OTHER)
current_section="OTHER"
if [[ -f "$SECTION_FILE" ]]; then
  current_section="$(cat "$SECTION_FILE" | tr -d '\r' | tr '[:lower:]' '[:upper:]' | head -n 1)"
  [[ -z "$current_section" ]] && current_section="OTHER"
fi

sanitized="$(printf '%s' "$clip" | perl -0777 -pe '
  s/\r\n?/\n/g;

  s/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/[SSN]/g;
  s/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/[PHONE]/g;
  s/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL]/gi;
  s/\b(MRN|Medical\s*Record|Med\s*Rec|MR#?|Account|Acct|ACC|FIN|Financial|Patient\s*ID|PID|Pat\s*ID|CSN|Case)\b[\s:#-]*[A-Z0-9][A-Z0-9\-]{3,24}\b/[MRN]/gi;
  s/\b(Visit|Encounter)\s*[:#-]+\s*[A-Z0-9][A-Z0-9\-]{3,24}\b/[MRN]/gi;
  s/\b(DOB|D\.O\.B\.|Date\s+of\s+Birth|Birth\s*Date|Birthdate)\b[\s:=-]*[^\n,;]{3,40}/[DOB]/gi;

  s!\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b![$3]!g;
  s!\b(\d{1,2})[-/.](\d{1,2})[-/.]([0-2]\d)\b![20$3]!g;
  s!\b(\d{1,2})[-/.](\d{1,2})[-/.]([3-9]\d)\b![19$3]!g;
  s!\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b![$1]!g;

  s/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?[,\s]+(\d{4})\b/[$2]/gi;
  s/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/[$2]/gi;
  s!\b(\d{1,2})[-/](\d{4})\b![$2]!g;

  s/\bAge\b[\s:=-]*([9]\d|\d{3,})\b/Age: 90+/gi;
  s/\baged\b[\s:=-]*([9]\d|\d{3,})\b/aged 90+/gi;
  s/\b([9]\d|\d{3,})\s*(years?\s*old|y\/?o|yo|-year-old|yrs?)\b/90+ years/gi;

  s!https?://[^\s<>"{}|\\^`\[\]]+![URL]!gi;
  s/\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\b/[IP]/g;
  s/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/[UUID]/gi;

  s/\b(Accession|Order|Study|Exam|Procedure|Specimen|Sample|Requisition)\b[\s:#-]*[A-Z0-9][A-Z0-9\-]{3,32}\b/[ID]/gi;
  s/\b(Insurance|Member|Subscriber|Policy|Group)\s*(ID|Number|#)\s*[:#-]*\s*[A-Z0-9][A-Z0-9\-]{3,32}\b/[ID]/gi;
  s/\b(Insurance|Member|Subscriber|Policy|Group)\s*[:#-]+\s*[A-Z0-9][A-Z0-9\-]{3,32}\b/[ID]/gi;
  s/\b(Device|Serial|Equipment)\b[\s:#-]*[A-Z0-9][A-Z0-9\-]{3,32}\b/[ID]/gi;

  s/\b\d{1,5}\s+(?:[A-Za-z]+\s+){0,4}(Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl|Highway|Hwy)\.?\b/[ADDR]/gi;
  s/\bP\.?\s*O\.?\s*Box\s+\d+\b/[ADDR]/gi;
  s/\b(zip|postal)\b[\s:#-]*\d{5}(?:-\d{4})?\b/[ZIP]/gi;
  s/\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/[STATE] [ZIP]/g;

  s/(\[(?:SSN|PHONE|EMAIL|MRN|DOB|ADDR|ZIP|ID|URL|IP|UUID)\])(?:\s*\1)+/$1/g;
  s/[ \t]{3,}/  /g;
  s/\n{4,}/\n\n\n/g;
')"

sanitized="$(printf '%s' "$sanitized" | perl -0777 -pe 's/\A[ \t\r\n]+//; s/[ \t\r\n]+\z//;')"

if [[ -z "$sanitized" ]]; then
  notify "Nothing to add (sanitized empty)" "Sanitizer"
  exit 0
fi

# One-level undo: keep previous draft before modification
if [[ -f "$DRAFT_FILE" ]]; then
  cp -f "$DRAFT_FILE" "$BAK_FILE"
fi

hdr="--- ${current_section} ---"

if [[ ! -f "$DRAFT_FILE" ]]; then
  printf '%s\n%s\n' "$hdr" "$sanitized" > "$DRAFT_FILE"
else
  ADD_FILE="$(mktemp "${STATE_DIR}/add.XXXXXX")"
  printf '%s' "$sanitized" > "$ADD_FILE"
  TMP_DRAFT="$(mktemp "${STATE_DIR}/draft.XXXXXX")"

  SECTION="$current_section" ADD_FILE="$ADD_FILE" perl -0777 -pe '
    my $section = $ENV{SECTION} // "OTHER";
    my $add_file = $ENV{ADD_FILE} // "";
    open my $fh, "<", $add_file or die "cannot read add file";
    local $/;
    my $add = <$fh>;
    close $fh;

    $add =~ s/\A[ \t\r\n]+//;
    $add =~ s/[ \t\r\n]+\z//;

    my $hdr = "--- $section ---\n";
    if (index($_, $hdr) >= 0) {
      # Append within existing section (before next header or end)
      $_ =~ s/(^--- \Q$section\E ---\n)(.*?)(?=^--- .+ ---\n|\z)/$1$2\n\n$add\n/sm;
    } else {
      $_ .= "\n\n$hdr$add\n";
    }
  ' "$DRAFT_FILE" > "$TMP_DRAFT"

  mv -f "$TMP_DRAFT" "$DRAFT_FILE"
fi

# Draft preview always goes to clipboard
cat "$DRAFT_FILE" | pbcopy

# Lightweight warning scan on the just-added sanitized clip
warn="$(printf '%s' "$sanitized" | perl -0777 -ne '
  my $long = () = $_ =~ /\b\d{7,}\b/g;
  my $namecomma = () = $_ =~ /\b[A-Z][a-z]{2,},\s*[A-Z][a-z]{2,}\b/g;
  my $left_email = () = $_ =~ /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  my @bits;
  push @bits, "long#=$long" if $long;
  push @bits, "name=$namecomma" if $namecomma;
  push @bits, "email=$left_email" if $left_email;
  print join(", ", @bits);
')"

msg="Added to draft → ${current_section}. Copy DONE to finalize; CLEAR to reset; UNDO to revert."
if [[ -n "$warn" ]]; then
  msg="${msg} (possible identifiers: ${warn})"
fi
notify "$msg" "Sanitizer" "Pop"
