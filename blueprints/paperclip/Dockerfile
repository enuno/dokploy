FROM node:lts-trixie-slim AS base
ARG USER_UID=1000
ARG USER_GID=1000
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates gosu curl gh git wget ripgrep python3 \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable

# Modify the existing node user/group to have the specified UID/GID to match host user
RUN usermod -u $USER_UID --non-unique node \
 && groupmod -g $USER_GID --non-unique node \
 && usermod -g $USER_GID -d /paperclip node

# ---------------------------------------------------------------------------
# Fetch upstream source
# ---------------------------------------------------------------------------
FROM base AS clone
WORKDIR /src
RUN git clone --depth 1 https://github.com/paperclipai/paperclip.git .

# ---------------------------------------------------------------------------
# Dependencies: copy only package manifests for layer caching
# ---------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY --from=clone /src/package.json /src/pnpm-workspace.yaml /src/pnpm-lock.yaml /src/.npmrc ./
COPY --from=clone /src/cli/package.json cli/
COPY --from=clone /src/server/package.json server/
COPY --from=clone /src/ui/package.json ui/
COPY --from=clone /src/packages/shared/package.json packages/shared/
COPY --from=clone /src/packages/db/package.json packages/db/
COPY --from=clone /src/packages/adapter-utils/package.json packages/adapter-utils/
COPY --from=clone /src/packages/mcp-server/package.json packages/mcp-server/
COPY --from=clone /src/packages/adapters/claude-local/package.json packages/adapters/claude-local/
COPY --from=clone /src/packages/adapters/codex-local/package.json packages/adapters/codex-local/
COPY --from=clone /src/packages/adapters/cursor-local/package.json packages/adapters/cursor-local/
COPY --from=clone /src/packages/adapters/gemini-local/package.json packages/adapters/gemini-local/
COPY --from=clone /src/packages/adapters/openclaw-gateway/package.json packages/adapters/openclaw-gateway/
COPY --from=clone /src/packages/adapters/opencode-local/package.json packages/adapters/opencode-local/
COPY --from=clone /src/packages/adapters/pi-local/package.json packages/adapters/pi-local/
COPY --from=clone /src/packages/plugins/sdk/package.json packages/plugins/sdk/
COPY --from=clone /src/packages/plugins/paperclip-plugin-fake-sandbox/package.json packages/plugins/paperclip-plugin-fake-sandbox/
COPY --from=clone /src/patches patches/

# Fix: pnpm errors when workspace packages declare bin entries pointing to files that
# don't yet exist (dist is built later). Create a placeholder so install succeeds.
# https://github.com/pnpm/pnpm/issues/10524
RUN mkdir -p packages/plugins/sdk/dist && \
    printf '%s\n' '#!/usr/bin/env node' 'module.exports = {};' > packages/plugins/sdk/dist/dev-cli.js

RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Build: bring in full source and compile
# ---------------------------------------------------------------------------
FROM base AS build
WORKDIR /app
COPY --from=deps /app /app
COPY --from=clone /src .
RUN pnpm --filter @paperclipai/ui build
RUN pnpm --filter @paperclipai/plugin-sdk build
RUN pnpm --filter @paperclipai/server build
RUN test -f server/dist/index.js || (echo "ERROR: server build output missing" && exit 1)

# ---------------------------------------------------------------------------
# Production
# ---------------------------------------------------------------------------
FROM base AS production
ARG USER_UID=1000
ARG USER_GID=1000
WORKDIR /app
COPY --chown=node:node --from=build /app /app
RUN npm install --global --omit=dev @anthropic-ai/claude-code@latest @openai/codex@latest opencode-ai \
 && apt-get update \
 && apt-get install -y --no-install-recommends openssh-client jq \
 && rm -rf /var/lib/apt/lists/* \
 && mkdir -p /paperclip \
 && chown node:node /paperclip

COPY --from=clone /src/scripts/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production \
 HOME=/paperclip \
 HOST=0.0.0.0 \
 PORT=3100 \
 SERVE_UI=true \
 PAPERCLIP_HOME=/paperclip \
 PAPERCLIP_INSTANCE_ID=default \
 USER_UID=${USER_UID} \
 USER_GID=${USER_GID} \
 PAPERCLIP_CONFIG=/paperclip/instances/default/config.json \
 PAPERCLIP_DEPLOYMENT_MODE=authenticated \
 PAPERCLIP_DEPLOYMENT_EXPOSURE=private \
 OPENCODE_ALLOW_ALL_MODELS=true

VOLUME ["/paperclip"]
EXPOSE 3100

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "--import", "./server/node_modules/tsx/dist/loader.mjs", "server/dist/index.js"]
