# Clinical Clipboard Sanitizer

Strips PHI (Protected Health Information) from clipboard text before pasting.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **⌃⌥C** (Control+Option+C) | Sanitize clipboard in place |
| **⌃⌥D** (Control+Option+D) | Add to draft (session mode) |

## Quick Start

1. Copy text containing PHI (dates, MRNs, phone numbers, etc.)
2. Press **⌃⌥C**
3. Paste - PHI is redacted

## Draft Mode (⌃⌥D)

Build cumulative clinical notes from multiple sources:

```
Copy "LABS"        → ⌃⌥D → Sets section to LABS
Copy lab results   → ⌃⌥D → Sanitizes & adds under LABS
Copy "HPI"         → ⌃⌥D → Sets section to HPI
Copy history text  → ⌃⌥D → Sanitizes & adds under HPI
Copy "DONE"        → ⌃⌥D → Final draft to clipboard
```

### Commands (copy word, press ⌃⌥D)

- `DONE` - Copy final draft, clear session
- `CLEAR` - Clear draft immediately
- `UNDO` - Revert last addition

### Section names

LABS, NOTES, HPI, MEDS, IMAGING, REFERRAL, VITALS, PMH, ALLERGIES, ASSESSMENT, PLAN, CC, OTHER

Or custom: `SECTION: GENETICS`

## What Gets Redacted

| Data | Replacement |
|------|-------------|
| SSN | `[SSN]` |
| Phone numbers | `[PHONE]` |
| Email addresses | `[EMAIL]` |
| MRN/Account numbers | `[MRN]` |
| DOB (labeled) | `[DOB]` |
| Full dates | `[YYYY]` (year kept) |
| Ages 90+ | `90+ years` |
| Addresses | `[ADDR]` |
| URLs | `[URL]` |
| IPs | `[IP]` |

## Files

```
~/bin/clipboard-sanitizer/
├── sanitize-clipboard.sh       # Single-clip mode
├── sanitize-clipboard-draft.sh # Session draft mode
├── self-test.sh                # Verification tests
└── README.md                   # This file

~/Library/Services/
├── Sanitize Clipboard.workflow
└── Sanitize Clipboard Draft.workflow
```

## Troubleshooting

**Shortcut not working?**
- Try logging out and back in
- Check: System Settings → Keyboard → Keyboard Shortcuts → Services
- Look for "Sanitize Clipboard" under General

**Test manually:**
```bash
echo "MRN: A123, DOB: 01/15/1990" | pbcopy
~/bin/clipboard-sanitizer/sanitize-clipboard.sh
pbpaste  # Should show: [MRN], [DOB]
```

**Run self-test:**
```bash
~/bin/clipboard-sanitizer/self-test.sh
```

## Limitations

This is regex-based heuristic sanitization. It reduces risk but **cannot guarantee** removal of all identifiers. Always review before sharing.
