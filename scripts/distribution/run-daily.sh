#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
ENV_FILE=${FORTUNE_DISTRIBUTION_ENV_FILE:-"$SCRIPT_DIR/.env.distribution"}
NODE_BIN=${NODE_BIN:-"/Users/lixiaole/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"}
LOCK_DIR="$SCRIPT_DIR/state/daily-run.lock"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "A discovery run is already active." >&2
  exit 3
fi
trap 'rmdir "$LOCK_DIR"' EXIT INT TERM

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

cd "$PROJECT_DIR"
"$NODE_BIN" scripts/distribution/discover.mjs "$@"
