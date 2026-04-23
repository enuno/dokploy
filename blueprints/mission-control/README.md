# Mission Control

Self-hosted AI agent orchestration platform. Dispatch tasks, run multi-agent workflows, monitor spend, and govern operations from one dashboard.

## Overview

Mission Control is a Next.js 16 dashboard for managing AI agent fleets. It provides:

- **32 panels** — Tasks, agents, skills, logs, tokens, memory, security, cron, alerts, webhooks, pipelines, and more
- **Real-time updates** — WebSocket + SSE push with smart polling
- **Zero external deps** — SQLite database, no Redis or Postgres required
- **Role-based access** — Viewer, operator, and admin roles
- **Quality gates** — Built-in Aegis review system
- **Skills Hub** — Browse and install skills from ClawdHub and skills.sh
- **Multi-gateway** — Adapters for OpenClaw, CrewAI, LangGraph, AutoGen, Claude SDK
- **Recurring tasks** — Natural language scheduling with cron templates

## Architecture

```
┌─────────────┐    ┌────────────────────┐    ┌──────────────────┐
│   Browser   │───▶│  Mission Control   │    │    SQLite (WAL)  │
│  (Next.js)  │    │  port 3000         │    │  /app/.data      │
│             │◀───│  Node.js + Express │◀───│                  │
└─────────────┘    └────────────────────┘    └──────────────────┘
```

## Prerequisites

- Dokploy with Traefik and LetsEncrypt configured
- A domain name pointed at your Dokploy instance

## Deployment

1. Click **Deploy** in Dokploy
2. Set your domain (e.g., `mission.yourdomain.com`)
3. Wait for the container to start (~10–20 seconds)
4. Open your domain in a browser
5. Log in with the auto-generated admin credentials (shown in Dokploy env vars)

## Post-Deploy Setup

### 1. Log In

The template auto-generates an admin password. Find it in your Dokploy environment variables as `AUTH_PASS`.

- **Username**: `admin`
- **Password**: (from Dokploy env vars)

Visit `https://yourdomain.com/login` to sign in.

### 2. (Optional) Connect an OpenClaw Gateway

Mission Control works out of the box without a gateway for task/project management. To enable live agent sessions and messaging:

1. Deploy an [OpenClaw](https://github.com/openclaw/openclaw) gateway
2. In Mission Control, go to **Settings → Advanced → Gateway**
3. Set your gateway host and port

Or set environment variables before deploy:
```yaml
environment:
  OPENCLAW_GATEWAY_HOST: your-gateway-host
  OPENCLAW_GATEWAY_PORT: "18789"
```

### 3. Register Your First Agent

From the dashboard:
- Go to **Agents → Register**
- Fill in name, role, and adapter type
- Save and start dispatching tasks

Or via API:
```bash
curl -X POST "https://yourdomain.com/api/agents/register" \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"name": "scout", "role": "researcher"}'
```

The API key is auto-generated on first run and persisted in `/app/.data/.generated-secrets`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MISSION_CONTROL_DOMAIN` | — | Your public domain |
| `AUTH_USER` | `admin` | Initial admin username |
| `AUTH_PASS` | — | Initial admin password (auto-generated if empty) |
| `MC_ALLOWED_HOSTS` | — | Host allowlist; must include your domain |
| `MC_COOKIE_SECURE` | `true` | Secure cookie flag |
| `MC_COOKIE_SAMESITE` | `strict` | Cookie SameSite policy |
| `MISSION_CONTROL_DATA_DIR` | `/app/.data` | SQLite DB and token logs |
| `OPENCLAW_GATEWAY_HOST` | — | Gateway host (optional) |
| `OPENCLAW_GATEWAY_PORT` | `18789` | Gateway port (optional) |

## Persistence

| Volume | Path | Contents |
|--------|------|----------|
| `mission-control-data` | `/app/.data` | SQLite DB, auto-generated secrets, token logs, activities |

All data is stored locally in SQLite. No external database required.

## Updating

To update to a newer version:

1. Edit `docker-compose.yml` and change the image tag:
   ```yaml
   image: ghcr.io/builderz-labs/mission-control:v2.x.x
   ```
2. Redeploy in Dokploy
3. The SQLite database persists across updates

## Security Notes

- **Alpha software** — APIs and schemas may change between releases
- `MC_ALLOWED_HOSTS` is enforced in production mode; Traefik requests will be blocked unless your domain is in the list
- Change the default admin password after first login
- All secrets (AUTH_SECRET, API_KEY) are auto-generated and persisted in the volume
- See the upstream [SECURITY.md](https://github.com/builderz-labs/mission-control/blob/master/SECURITY.md) for vulnerability reporting

## Resource Usage

- **Memory**: ~256 MB base, 512M limit recommended
- **CPU**: Low at idle; moderate during task dispatch
- **Disk**: Minimal for the image; volume grows with SQLite DB and logs

## Troubleshooting

**"Blocked host" error**
- Verify `MC_ALLOWED_HOSTS` includes your domain
- Check Traefik labels are routing correctly

**Login fails with "Internal server error"**
- Restart the container to regenerate secrets
- Check `pnpm rebuild better-sqlite3` is not needed (native module is pre-built in the image)

**Gateway not connecting**
- Ensure `OPENCLAW_GATEWAY_HOST` is reachable from the container
- Use the Advanced Settings panel in the UI to override gateway URL at runtime

## Links

- [Mission Control GitHub](https://github.com/builderz-labs/mission-control)
- [Documentation](https://github.com/builderz-labs/mission-control/tree/master/docs)
- [Quickstart Guide](https://github.com/builderz-labs/mission-control/blob/master/docs/quickstart.md)
- [API Reference](https://github.com/builderz-labs/mission-control/blob/master/openapi.json)
