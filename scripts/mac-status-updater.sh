#!/bin/bash

# Mac Status Updater for Blog
# This script detects the currently active app and sends it to your blog API
#
# Usage:
# 1. Set environment variables:
#    export BLOG_URL="https://your-blog.vercel.app"
#    export STATUS_SECRET="your-secret-key"
#
# 2. Run the script:
#    ./mac-status-updater.sh
#
# 3. To run continuously (every 30 seconds):
#    while true; do ./mac-status-updater.sh; sleep 30; done
#
# 4. Or add to crontab for periodic updates:
#    */1 * * * * /path/to/mac-status-updater.sh

# Configuration
BLOG_URL="${BLOG_URL:-http://localhost:3000}"
STATUS_SECRET="${STATUS_SECRET:-}"
UPDATE_INTERVAL="${UPDATE_INTERVAL:-30}"

# Check if STATUS_SECRET is set
if [ -z "$STATUS_SECRET" ]; then
    echo "Error: STATUS_SECRET environment variable is not set"
    echo "Usage: STATUS_SECRET=your-secret BLOG_URL=https://your-blog.com ./mac-status-updater.sh"
    exit 1
fi

# Get the frontmost application name using AppleScript
get_active_app() {
    osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true' 2>/dev/null
}

# Check if screen is locked or screensaver is running
is_screen_locked() {
    local screensaver_running=$(osascript -e 'tell application "System Events" to get running of screen saver preferences' 2>/dev/null)

    if [ "$screensaver_running" = "true" ]; then
        return 0  # Screen is locked/screensaver
    fi

    # Check if loginwindow is the frontmost app (indicates lock screen)
    local active_app=$(get_active_app)
    if [ "$active_app" = "loginwindow" ]; then
        return 0
    fi

    return 1  # Screen is not locked
}

# Send status update to API
update_status() {
    local app="$1"
    local is_online="$2"

    curl -s -X POST "${BLOG_URL}/api/status" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${STATUS_SECRET}" \
        -d "{\"app\": ${app}, \"isOnline\": ${is_online}}" \
        > /dev/null 2>&1

    return $?
}

# Main function
main() {
    if is_screen_locked; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Screen locked, setting offline"
        update_status "null" "false"
    else
        local active_app=$(get_active_app)
        if [ -n "$active_app" ]; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') - Active app: $active_app"
            update_status "\"$active_app\"" "true"
        else
            echo "$(date '+%Y-%m-%d %H:%M:%S') - Could not detect active app"
            update_status "null" "false"
        fi
    fi
}

# Run main function
main

# If running in continuous mode
if [ "$1" = "--continuous" ] || [ "$1" = "-c" ]; then
    echo "Running in continuous mode (every ${UPDATE_INTERVAL} seconds)"
    echo "Press Ctrl+C to stop"
    while true; do
        sleep "$UPDATE_INTERVAL"
        main
    done
fi
