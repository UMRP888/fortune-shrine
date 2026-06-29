#!/bin/sh
set -eu

QUEUE_URL="${TELEGRAM_DISCOVERY_QUEUE_URL:-http://127.0.0.1:4196/}"

osascript - "$QUEUE_URL" <<'APPLESCRIPT'
on run argv
  set queueUrl to item 1 of argv
  set foundQueueTab to false

  tell application "Google Chrome"
    if not running then
      open location queueUrl
      activate
      return
    end if

    repeat with windowIndex from (count of windows) to 1 by -1
      set currentWindow to window windowIndex
      repeat with tabIndex from (count of tabs of currentWindow) to 1 by -1
        set currentTab to tab tabIndex of currentWindow
        set currentUrl to URL of currentTab
        if currentUrl starts with queueUrl then
          if foundQueueTab is false then
            set foundQueueTab to true
          else
            close currentTab
          end if
        end if
      end repeat
    end repeat

    if foundQueueTab is false then
      open location queueUrl
    end if

    repeat with windowIndex from 1 to (count of windows)
      set currentWindow to window windowIndex
      repeat with tabIndex from 1 to (count of tabs of currentWindow)
        set currentTab to tab tabIndex of currentWindow
        if (URL of currentTab) starts with queueUrl then
          set active tab index of currentWindow to tabIndex
          set index of currentWindow to 1
          reload currentTab
          activate
          return
        end if
      end repeat
    end repeat

    activate
  end tell
end run
APPLESCRIPT
