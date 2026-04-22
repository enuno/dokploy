#!/bin/sh
# =============================================================================
# Hermes UI — Docker Entrypoint
# =============================================================================
# Seeds the persistent volume with Hermes defaults on first run, then
# launches serve_lite.py. Safe to restart: existing data is never overwritten.
# -----------------------------------------------------------------------------

set -eu

HERMES_HOME=${HERMES_HOME:-/home/agent/.hermes}
DEFAULTS_DIR=/usr/local/share/hermes-home
AGENT_DEFAULTS=/usr/local/share/hermes-agent
SEED_MARKER="$HERMES_HOME/.docker-defaults-seeded"

mkdir -p "$HERMES_HOME"

# ---------------------------------------------------------------------------
# First-run seeding (empty volume only)
# ---------------------------------------------------------------------------
if [ ! -e "$SEED_MARKER" ] && [ -z "$(find "$HERMES_HOME" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]; then
    cp -a "$DEFAULTS_DIR"/. "$HERMES_HOME"/
    : > "$SEED_MARKER"
fi

# ---------------------------------------------------------------------------
# Ensure hermes-agent source tree exists in the volume.
# This covers the case where a user mounts a pre-existing config volume
# that does not yet contain the agent code.
# ---------------------------------------------------------------------------
if [ ! -f "$HERMES_HOME/hermes-agent/run_agent.py" ]; then
    mkdir -p "$HERMES_HOME/hermes-agent"
    cp -a "$AGENT_DEFAULTS"/. "$HERMES_HOME/hermes-agent"/
fi

# ---------------------------------------------------------------------------
# Ensure expected subdirectories exist
# ---------------------------------------------------------------------------
mkdir -p "$HERMES_HOME"/{logs,memories,skills,cron,hermes-ui/sessions,home}

exec "$@"
