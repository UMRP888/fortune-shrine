#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CODEX_NODE="/Users/lixiaole/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"

if command -v node >/dev/null 2>&1; then
  NODE_BIN=$(command -v node)
elif [ -x "$CODEX_NODE" ]; then
  NODE_BIN="$CODEX_NODE"
else
  echo "Node.js 20 or newer is required." >&2
  exit 1
fi

exec "$NODE_BIN" "$SCRIPT_DIR/run.mjs" "$@"
