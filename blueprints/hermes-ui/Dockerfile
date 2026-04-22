# =============================================================================
# Hermes UI — Dokploy Blueprint
# =============================================================================
# Builds a container that bundles Hermes Agent (backend) with Hermes UI
# (glassmorphic web interface). On first start, seeds the persistent volume
# with Hermes defaults so state survives container restarts.
#
# Based on: https://github.com/xmbshwll/hermes-agent-docker
# -----------------------------------------------------------------------------

FROM python:3.11-slim

ARG HERMES_REF=main

# ---------------------------------------------------------------------------
# System dependencies
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ffmpeg \
    build-essential \
    gcc \
    python3-dev \
    libffi-dev \
    procps \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# Agent user (matches upstream hermes-agent-docker convention)
# ---------------------------------------------------------------------------
RUN useradd -m -d /home/agent -s /bin/bash agent \
    && mkdir -p /home/agent/.hermes /home/agent/.local/bin \
    && chown -R agent:agent /home/agent

USER agent
ENV HOME=/home/agent
ENV PATH="/home/agent/.local/bin:${PATH}"
WORKDIR /home/agent

# ---------------------------------------------------------------------------
# Install Hermes Agent via official installer
# We install directly into ~/.hermes/hermes-agent because serve_lite.py
# expects the agent source at that path.
# ---------------------------------------------------------------------------
RUN curl -fsSL "https://raw.githubusercontent.com/NousResearch/hermes-agent/${HERMES_REF}/scripts/install.sh" \
    | bash -s -- --skip-setup --branch "${HERMES_REF}" --dir /home/agent/.hermes/hermes-agent

# ---------------------------------------------------------------------------
# Clone Hermes UI (the web interface)
# ---------------------------------------------------------------------------
RUN git clone --depth 1 https://github.com/pyrate-llama/hermes-ui.git /home/agent/hermes-ui

# ---------------------------------------------------------------------------
# Warm the venv import cache so first-start is faster
# ---------------------------------------------------------------------------
RUN /home/agent/.hermes/hermes-agent/venv/bin/python -c \
    "from run_agent import AIAgent; print('Agent import OK')" 2>/dev/null || true

# ---------------------------------------------------------------------------
# Save pristine defaults for volume seeding at runtime
# ---------------------------------------------------------------------------
USER root
RUN mkdir -p /usr/local/share/hermes-home \
    && cp -a /home/agent/.hermes/. /usr/local/share/hermes-home/ \
    && mkdir -p /usr/local/share/hermes-agent \
    && cp -a /home/agent/.hermes/hermes-agent/. /usr/local/share/hermes-agent/ \
    && chown -R agent:agent /usr/local/share/hermes-home /usr/local/share/hermes-agent

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
COPY docker-entrypoint.sh /usr/local/bin/hermes-entrypoint
RUN chmod +x /usr/local/bin/hermes-entrypoint

USER agent
WORKDIR /home/agent/hermes-ui

ENV HERMES_HOME=/home/agent/.hermes
ENV HOME=/home/agent
ENV PYTHONUNBUFFERED=1

VOLUME ["/home/agent/.hermes"]

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:3333/health')" || exit 1

ENTRYPOINT ["/usr/local/bin/hermes-entrypoint"]
CMD ["/home/agent/.hermes/hermes-agent/venv/bin/python", "serve_lite.py", "--port", "3333"]
