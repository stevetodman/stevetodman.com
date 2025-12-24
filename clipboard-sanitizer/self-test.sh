#!/bin/bash
# Self-test for Clipboard Sanitizer (macOS)
# Uses fake sample data and restores your original clipboard at the end.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SINGLE="${HERE}/sanitize-clipboard.sh"
DRAFT="${HERE}/sanitize-clipboard-draft.sh"

if [[ ! -x "$SINGLE" || ! -x "$DRAFT" ]]; then
  echo "Make scripts executable first:"
  echo "  chmod +x sanitize-clipboard.sh sanitize-clipboard-draft.sh"
  exit 1
fi

orig_file="$(mktemp)"
pbpaste > "$orig_file" || true

cleanup() {
  cat "$orig_file" | pbcopy || true
  rm -f "$orig_file" || true
}
trap cleanup EXIT

echo "Running single-clip test..."
cat <<'EOF' | pbcopy
Patient: Jane Doe
MRN: A123-4567
DOB: 01/02/1990
Seen on 12/23/2024; follow up Jan 2024.
Call (555) 123-4567 or email test.user+demo@example.com
Address: 123 Main Street
EOF

"$SINGLE" >/dev/null 2>&1 || true
out="$(pbpaste || true)"

echo "$out" | grep -q '\[MRN\]' || { echo "FAIL: MRN not redacted"; exit 1; }
echo "$out" | grep -q '\[DOB\]' || { echo "FAIL: DOB not redacted"; exit 1; }
echo "$out" | grep -q '\[PHONE\]' || { echo "FAIL: phone not redacted"; exit 1; }
echo "$out" | grep -q '\[EMAIL\]' || { echo "FAIL: email not redacted"; exit 1; }
echo "$out" | grep -q '\[2024\]' || { echo "FAIL: date year not preserved as [2024]"; exit 1; }

# Regression test: "visit January" should NOT become [MRN]
echo "Running visit+month regression test..."
echo "Previous visit January 2024" | pbcopy
"$SINGLE" >/dev/null 2>&1 || true
regress="$(pbpaste || true)"
echo "$regress" | grep -q 'visit' || { echo "FAIL: 'visit January' incorrectly redacted as MRN"; exit 1; }

echo "Running draft-mode test..."
echo "CLEAR" | pbcopy
"$DRAFT" >/dev/null 2>&1 || true

echo "LABS" | pbcopy
"$DRAFT" >/dev/null 2>&1 || true

cat <<'EOF' | pbcopy
CBC 12/23/2024: WBC 8.2
Phone 555-123-4567
EOF
"$DRAFT" >/dev/null 2>&1 || true

echo "DONE" | pbcopy
"$DRAFT" >/dev/null 2>&1 || true

draft="$(pbpaste || true)"
echo "$draft" | grep -q '^--- LABS ---' || { echo "FAIL: LABS header missing"; exit 1; }
echo "$draft" | grep -q '\[PHONE\]' || { echo "FAIL: phone not redacted in draft"; exit 1; }
echo "$draft" | grep -q '\[2024\]' || { echo "FAIL: year not preserved in draft"; exit 1; }

echo "PASS: all tests succeeded."
