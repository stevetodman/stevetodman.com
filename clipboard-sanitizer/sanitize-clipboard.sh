#!/bin/bash
# Clinical Clipboard Sanitizer v4.1 (macOS) — Single-clip mode
#
# Reads clipboard text, redacts common identifiers, keeps only YEAR from non-DOB dates,
# then writes the sanitized text back to the clipboard.
#
# Uses only built-in macOS tools: pbpaste/pbcopy/osascript + perl (ships with macOS).
#
# NOTE: Heuristic (regex-based). It reduces risk but cannot guarantee removal of all identifiers.

set -euo pipefail
umask 077

osa_escape() {
  # Escape for inclusion inside a double-quoted AppleScript string literal.
  # Replaces backslash and quote, and flattens newlines.
  perl -pe 's/\\/\\\\/g; s/"/\\"/g; s/\r?\n/ /g;'
}

notify() {
  # $1=message, $2=title (optional), $3=sound (optional)
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

on_err() {
  notify "Sanitizer error. Clipboard unchanged." "Sanitizer" "Basso"
  exit 1
}
trap on_err ERR

text="$(pbpaste || true)"
if [[ -z "${text}" ]]; then
  notify "Clipboard is empty" "Sanitizer"
  exit 0
fi

sanitized="$(printf '%s' "$text" | perl -0777 -pe '
  s/\r\n?/\n/g;

  # SSN
  s/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/[SSN]/g;

  # Phone (US-centric; common formats)
  s/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/[PHONE]/g;

  # Email
  s/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL]/gi;

  # MRN / Account / FIN / CSN (label + token)
  s/\b(MRN|Medical\s*Record|Med\s*Rec|MR#?|Account|Acct|ACC|FIN|Financial|Patient\s*ID|PID|Pat\s*ID|CSN|Case)\b[\s:#-]*[A-Z0-9][A-Z0-9\-]{3,24}\b/[MRN]/gi;
  # Visit/Encounter require delimiter to avoid "visit January" false positive
  s/\b(Visit|Encounter)\s*[:#-]+\s*[A-Z0-9][A-Z0-9\-]{3,24}\b/[MRN]/gi;

  # DOB (explicitly labeled)
  s/\b(DOB|D\.O\.B\.|Date\s+of\s+Birth|Birth\s*Date|Birthdate)\b[\s:=-]*[^\n,;]{3,40}/[DOB]/gi;

  # Full dates -> [YYYY]
  s!\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b![$3]!g;

  # Full dates with 2-digit year -> [19YY] or [20YY] (heuristic)
  s!\b(\d{1,2})[-/.](\d{1,2})[-/.]([0-2]\d)\b![20$3]!g;
  s!\b(\d{1,2})[-/.](\d{1,2})[-/.]([3-9]\d)\b![19$3]!g;

  # ISO dates -> [YYYY]
  s!\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b![$1]!g;

  # Month name Day, Year -> [YYYY]
  s/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?[,\s]+(\d{4})\b/[$2]/gi;

  # Month name + Year -> [YYYY]  (keep year only)
  s/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/[$2]/gi;

  # Numeric month/year -> [YYYY] (e.g., 01/2024)
  s!\b(\d{1,2})[-/](\d{4})\b![$2]!g;

  # Age > 89 -> 90+ years (labelled or inline)
  s/\bAge\b[\s:=-]*([9]\d|\d{3,})\b/Age: 90+/gi;
  s/\baged\b[\s:=-]*([9]\d|\d{3,})\b/aged 90+/gi;
  s/\b([9]\d|\d{3,})\s*(years?\s*old|y\/?o|yo|-year-old|yrs?)\b/90+ years/gi;

  # URLs
  s!https?://[^\s<>"{}|\\^`\[\]]+![URL]!gi;

  # IPv4
  s/\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\b/[IP]/g;

  # UUID
  s/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/[UUID]/gi;

  # IDs that commonly appear in reports (accession/order/specimen/etc.)
  s/\b(Accession|Order|Study|Exam|Procedure|Specimen|Sample|Requisition)\b[\s:#-]*[A-Z0-9][A-Z0-9\-]{3,32}\b/[ID]/gi;
  s/\b(Insurance|Member|Subscriber|Policy|Group)\s*(ID|Number|#)\s*[:#-]*\s*[A-Z0-9][A-Z0-9\-]{3,32}\b/[ID]/gi;
  s/\b(Insurance|Member|Subscriber|Policy|Group)\s*[:#-]+\s*[A-Z0-9][A-Z0-9\-]{3,32}\b/[ID]/gi;
  s/\b(Device|Serial|Equipment)\b[\s:#-]*[A-Z0-9][A-Z0-9\-]{3,32}\b/[ID]/gi;

  # Addresses (very heuristic)
  s/\b\d{1,5}\s+(?:[A-Za-z]+\s+){0,4}(Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl|Highway|Hwy)\.?\b/[ADDR]/gi;
  s/\bP\.?\s*O\.?\s*Box\s+\d+\b/[ADDR]/gi;

  # ZIP only when contextual (zip/postal or state+zip)
  s/\b(zip|postal)\b[\s:#-]*\d{5}(?:-\d{4})?\b/[ZIP]/gi;
  s/\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/[STATE] [ZIP]/g;

  # Collapse runs of tokens/whitespace while preserving newlines
  s/(\[(?:SSN|PHONE|EMAIL|MRN|DOB|ADDR|ZIP|ID|URL|IP|UUID)\])(?:\s*\1)+/$1/g;
  s/[ \t]{3,}/  /g;
  s/\n{4,}/\n\n\n/g;
')"

# Trim leading/trailing whitespace (keep internal newlines)
sanitized="$(printf '%s' "$sanitized" | perl -0777 -pe 's/\A[ \t\r\n]+//; s/[ \t\r\n]+\z//;')"

# Post-scan warning (lightweight heuristic)
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

printf '%s' "$sanitized" | pbcopy

if [[ -n "$warn" ]]; then
  notify "Clipboard sanitized (possible identifiers: $warn)" "Sanitizer" "Pop"
else
  notify "Clipboard sanitized" "Sanitizer" "Pop"
fi
