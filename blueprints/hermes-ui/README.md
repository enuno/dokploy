# Hermes UI

A sleek, glassmorphic web interface for [Hermes Agent](https://github.com/NousResearch/hermes-agent) — your self-hosted AI assistant.

## Overview

This Dokploy template bundles Hermes Agent with the Hermes UI web interface. It provides:

- Full-featured chat interface with SSE streaming
- Real-time log streaming (Gateway, Errors, Web UI)
- File browser for `~/.hermes`
- Memory inspector (MEMORY.md, USER.md)
- Skills browser and editor
- Jobs monitor
- MCP tool browser
- Artifact panel for HTML/SVG/PDF/CSV previews

## Architecture

```
┌─────────────┐    ┌────────────────┐    ┌──────────────────┐
│   Browser   │───▶│  hermes-ui     │───▶│  Hermes Agent    │
│ (React 18)  │    │  port 3333     │    │  (in-process)    │
│             │◀───│  serve_lite.py │◀───│                  │
└─────────────┘    └────────────────┘    └──────────────────┘
```

The container builds from source and includes:
- Hermes Agent (cloned from `NousResearch/hermes-agent`)
- Hermes UI (cloned from `pyrate-llama/hermes-ui`)
- A persistent volume at `/home/agent/.hermes` for config, logs, memories, sessions, and skills

## Prerequisites

- Dokploy with Traefik and LetsEncrypt configured
- An API key for your chosen LLM provider (OpenRouter, OpenAI, Anthropic, etc.)

## Deployment

1. Click "Deploy" in Dokploy
2. Set your domain (e.g., `hermes.yourdomain.com`)
3. Wait for the build to complete (Hermes Agent compilation can take several minutes)
4. Open your domain in a browser

## Post-Deploy Setup

### 1. Configure your LLM provider

Edit the config file in the persistent volume, or use the **Settings** modal inside the UI:

```yaml
# ~/.hermes/config.yaml
inference:
  base_url: https://openrouter.ai/api/v1
  api_key: sk-or-v1-your-openrouter-key
  model: anthropic/claude-sonnet-4-20250514
```

Or use a local endpoint like Ollama:
```yaml
inference:
  base_url: http://host.docker.internal:11434/v1
  api_key: ollama
  model: qwen2.5-coder:32b
```

### 2. Add your API keys

You can also set provider credentials via environment variables in the `.env` file inside the volume:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-v1-...
```

### 3. (Optional) Enable Gemini for image analysis

Add your Gemini API key in the **Settings** modal inside the UI to enable image paste/drop analysis.

## Persistence

All Hermes state is stored in the named volume `hermes-data`:

| Path | Contents |
|------|----------|
| `config.yaml` | Agent configuration |
| `.env` | API keys and secrets |
| `logs/` | Runtime logs |
| `memories/` | MEMORY.md, USER.md |
| `skills/` | Auto-created skills |
| `sessions/` | Chat sessions |
| `hermes-ui/sessions/` | Web UI session cache |

## Updating

To update Hermes Agent or Hermes UI to the latest version:

1. Redeploy the service in Dokploy to trigger a fresh image build, **or**
2. Use the built-in **Pull & Restart** button in the UI's Settings panel

To pin a specific Hermes Agent version, set the `HERMES_REF` build argument (e.g., `v2026.3.30`) before deploying.

## Health Check

The container exposes a health endpoint at `/health` that returns:
- `status: ok` when the agent is loaded and ready
- `status: degraded` when the UI is running but the agent failed to import

## Resource Usage

- **Memory**: ~512 MB base, scales with model context size
- **CPU**: Low at idle, spikes during agent inference
- **Disk**: Minimal for the image; persistent volume grows with logs/skills/memories

## Troubleshooting

**"AIAgent not available" in health check**
- The Hermes Agent source or venv may be corrupted. Restart the container to re-seed from image defaults.

**Chat returns "Stream ended without a completion event"**
- Check that your API key and `base_url` are correct in `config.yaml`
- Verify the model name is valid for your provider
- Ensure `compression.summary_base_url` is set (not `null`) in `config.yaml`

**Build takes a very long time**
- Hermes Agent has many Python dependencies. The first build may take 5–15 minutes depending on your server.

## Links

- [Hermes UI](https://github.com/pyrate-llama/hermes-ui)
- [Hermes Agent](https://github.com/NousResearch/hermes-agent)
- [Hermes Docs](https://hermes-agent.nousresearch.com/docs/)
