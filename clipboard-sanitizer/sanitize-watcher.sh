#!/bin/bash
# Clipboard Sanitizer - Background Watcher
# Monitors clipboard and auto-sanitizes when content changes
#
# Start: ~/bin/clipboard-sanitizer/sanitize-watcher.sh start
# Stop:  ~/bin/clipboard-sanitizer/sanitize-watcher.sh stop
# Toggle: ~/bin/clipboard-sanitizer/sanitize-watcher.sh toggle

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="/tmp/clipboard-sanitizer-watcher.pid"
LOG_FILE="/tmp/clipboard-sanitizer-watcher.log"
SANITIZER="$SCRIPT_DIR/sanitize-clipboard.sh"

# Check interval in seconds (lower = more responsive, more CPU)
INTERVAL=1

notify() {
    osascript -e "display notification \"$1\" with title \"Clipboard Sanitizer\"" 2>/dev/null || true
}

start_watcher() {
    if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        notify "Already running"
        exit 0
    fi

    # Start background watcher
    (
        echo "Watcher started at $(date)" >> "$LOG_FILE"
        last_hash=""

        while true; do
            # Get current clipboard content hash
            current_hash=$(pbpaste 2>/dev/null | md5 -q 2>/dev/null || echo "")

            # If clipboard changed and not empty
            if [[ -n "$current_hash" && "$current_hash" != "$last_hash" ]]; then
                # Check if content looks like it needs sanitizing (has potential PHI patterns)
                content=$(pbpaste 2>/dev/null || true)
                if echo "$content" | grep -qE '(\d{3}[-.]?\d{3}[-.]?\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|@|MRN|DOB|SSN)' 2>/dev/null; then
                    # Run sanitizer
                    "$SANITIZER" 2>/dev/null || true
                    # Update hash to sanitized content
                    last_hash=$(pbpaste 2>/dev/null | md5 -q 2>/dev/null || echo "")
                else
                    last_hash="$current_hash"
                fi
            fi

            sleep "$INTERVAL"
        done
    ) &

    echo $! > "$PID_FILE"
    notify "Watcher ON - Auto-sanitizing clipboard"
    echo "Watcher started (PID: $(cat "$PID_FILE"))"
}

stop_watcher() {
    if [[ -f "$PID_FILE" ]]; then
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            # Also kill any child processes
            pkill -P "$pid" 2>/dev/null || true
        fi
        rm -f "$PID_FILE"
        notify "Watcher OFF"
        echo "Watcher stopped"
    else
        notify "Watcher not running"
        echo "Watcher not running"
    fi
}

toggle_watcher() {
    if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        stop_watcher
    else
        start_watcher
    fi
}

status_watcher() {
    if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Running (PID: $(cat "$PID_FILE"))"
    else
        echo "Stopped"
    fi
}

case "${1:-toggle}" in
    start)  start_watcher ;;
    stop)   stop_watcher ;;
    toggle) toggle_watcher ;;
    status) status_watcher ;;
    *)
        echo "Usage: $0 {start|stop|toggle|status}"
        exit 1
        ;;
esac
