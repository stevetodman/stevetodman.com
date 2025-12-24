#!/bin/bash
# Show Clipboard Sanitizer help

# Check if watcher is running
if [[ -f /tmp/clipboard-sanitizer-watcher.pid ]] && kill -0 "$(cat /tmp/clipboard-sanitizer-watcher.pid)" 2>/dev/null; then
    status="🟢 Auto-sanitizer ON"
else
    status="⚪ Auto-sanitizer OFF"
fi

osascript << EOF
display dialog "$status

SHORTCUTS:
⌃⌥S  Toggle auto-sanitizer on/off
⌃⌥C  Sanitize clipboard (one-time)
⌃⌥D  Add to draft (session mode)
⌃⌥H  Show this help

DRAFT COMMANDS (copy then ⌃⌥D):
LABS, HPI, MEDS, etc. → Set section
DONE → Finish & copy draft
CLEAR → Reset draft
UNDO → Revert last add" with title "Clipboard Sanitizer" buttons {"OK"} default button "OK"
EOF
