# Paperclip

AI agent orchestration platform. Run a company of agents — with org charts, budgets, goals, governance, and accountability.

## Overview

Paperclip is a Node.js server and React UI that orchestrates a team of AI agents to run a business. Bring your own agents, assign goals, and track your agents' work and costs from one dashboard.

This Dokploy template deploys:
- **Paperclip server + UI** (built from source)
- **PostgreSQL 17** (persistent database)

## Features

- **Bring Your Own Agent** — Any agent, any runtime, one org chart
- **Goal Alignment** — Every task traces back to the company mission
- **Heartbeats** — Agents wake on a schedule, check work, and act
- **Cost Control** — Monthly budgets per agent; no runaway costs
- **Multi-Company** — One deployment, many companies with data isolation
- **Governance** — Approve hires, override strategy, pause or terminate agents
- **Mobile Ready** — Manage your autonomous businesses from anywhere

## Architecture

```
┌─────────────┐    ┌────────────────────┐    ┌──────────────────┐
│   Browser   │───▶│  Paperclip Server  │───▶│   PostgreSQL 17  │
│  (React UI) │    │  port 3100         │    │  (persistent)    │
│             │◀───│  Node.js + Express │◀───│                  │
└─────────────┘    └────────────────────┘    └──────────────────┘
```

## Prerequisites

- Dokploy with Traefik and LetsEncrypt configured
- Node.js build environment (handled by Docker BuildKit git context)
- A domain name pointed at your Dokploy instance

## Deployment

1. Click **Deploy** in Dokploy
2. Set your domain (e.g., `paperclip.yourdomain.com`)
3. Wait for the build to complete (first build may take 10–20 minutes)
4. Open your domain in a browser
5. Complete the onboarding wizard to create your first company

## Post-Deploy Setup

### 1. Complete Onboarding

On first visit, Paperclip will guide you through creating:
- Your first **company**
- An **org chart** with roles (CEO, CTO, engineers, etc.)
- **Agent employees** connected to your preferred LLM providers

### 2. Configure LLM Providers

This template is pre-configured for **Kimi** as the primary LLM provider. Add your API key in the Paperclip settings or via environment variables:

| Provider | Env Var | Endpoint |
|----------|---------|----------|
| **Kimi (primary)** | `KIMI_API_KEY` | `https://api.kimi.com/coding/v1` |
| OpenAI (fallback) | `OPENAI_API_KEY` | auto-mapped from Kimi key |
| Anthropic (fallback) | `ANTHROPIC_API_KEY` | — |

Kimi uses an OpenAI-compatible API, so Paperclip's OpenAI adapter automatically routes to `https://api.kimi.com/coding/v1` when `KIMI_API_KEY` is set.

### 3. Invite Your First CEO

In `authenticated` mode (default), Paperclip requires you to invite a CEO user via a bootstrap invite. Follow the on-screen instructions after onboarding.

### 4. Connect Agents

Paperclip supports adapters for:
- **Kimi CLI** (local or in-container)
- OpenClaw / OpenClaw Gateway
- Claude Code (local)
- Codex (local)
- Cursor (local)
- Gemini (local)
- OpenCode (local)
- Pi (local)

#### Using Kimi CLI as an Agent Adapter

To use [Kimi Code CLI](https://github.com/MoonshotAI/kimi-cli) (`kimi-cli`) as a Paperclip agent adapter:

**Option A — Local install (recommended)**
```bash
curl -L code.kimi.com/install.sh | bash
# Then configure Paperclip to invoke `kimi` on the host machine
```

**Option B — In-container install**
Open a terminal in the running Paperclip container and run:
```bash
# Install kimi-cli (Python + uv based)
curl -L code.kimi.com/install.sh | bash
# or via pipx/uv if available in the container
```

After installation, run `/login` inside `kimi` to authenticate with the Kimi Code platform using your API key. Paperclip can then dispatch heartbeats to `kimi` as an agent employee.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PAPERCLIP_DOMAIN` | — | Your public domain |
| `PAPERCLIP_PUBLIC_URL` | — | Full HTTPS URL |
| `PAPERCLIP_DEPLOYMENT_MODE` | `authenticated` | `authenticated` or `local_trusted` |
| `PAPERCLIP_DEPLOYMENT_EXPOSURE` | `private` | `private` or `public` |
| `BETTER_AUTH_SECRET` | — | Strong random secret for auth |
| `DATABASE_URL` | — | Postgres connection string |
| `POSTGRES_USER` | `paperclip` | Database user |
| `POSTGRES_PASSWORD` | — | Database password |
| `POSTGRES_DB` | `paperclip` | Database name |
| `KIMI_API_KEY` | — | **Required.** Kimi API key |
| `KIMI_BASE_URL` | `https://api.kimi.com/coding/v1` | Kimi API endpoint |
| `OPENAI_API_KEY` | — | Auto-set from `KIMI_API_KEY` for OpenAI-compatible adapters |
| `OPENAI_BASE_URL` | `https://api.kimi.com/coding/v1` | OpenAI-compatible base URL (points to Kimi) |
| `ANTHROPIC_API_KEY` | — | Optional Anthropic API key |
| `PAPERCLIP_TELEMETRY_DISABLED` | `1` | Disable telemetry by default |

## Deployment Modes

### `authenticated` (default)
- Requires user login
- Supports multiple human users
- Best for production deployments

### `local_trusted`
- No authentication required
- Anyone with access can create companies
- Best for local/Tailscale-only access

## Persistence

| Volume | Path | Contents |
|--------|------|----------|
| `paperclip-data` | `/paperclip` | Config, companies, instances, skills, logs |
| `postgres-data` | `/var/lib/postgresql/data` | All application data |

## Updating

To update Paperclip to the latest version:

1. Redeploy the service in Dokploy to trigger a fresh build from `master`
2. The database will persist across redeploys

To pin a specific version, edit the `docker-compose.yml` build context to point to a specific tag:
```yaml
build:
  context: https://github.com/paperclipai/paperclip.git#v1.2.3
```

## Resource Usage

- **Memory**: ~1G base, recommended 2G limit
- **CPU**: Moderate during builds; low at idle
- **Disk**: ~500 MB for the image; persistent volume grows with companies/tasks
- **Build time**: 10–20 minutes on first deploy (Node.js monorepo compilation)

## Troubleshooting

**Build fails with `pnpm install` errors**
- The upstream lockfile may be temporarily out of sync. Wait a few minutes and redeploy, or pin to a known-good tag.

**Health check fails after deploy**
- Paperclip takes 30–60 seconds to start on first boot while it initializes the database. The health check accounts for this with a 60-second start period.

**Cannot access the UI after deploy**
- Verify your domain DNS points to your Dokploy instance
- Check Traefik labels in the compose file
- Ensure LetsEncrypt certificates are issued

**Database connection errors**
- Verify the `DATABASE_URL` matches the Postgres service name (`postgres`)
- Check that the Postgres health check passed before Paperclip started

## Links

- [Paperclip GitHub](https://github.com/paperclipai/paperclip)
- [Paperclip Docs](https://docs.paperclip.ai)
- [Discord Community](https://discord.gg/paperclip)
