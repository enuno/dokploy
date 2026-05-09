# gpt-researcher

Autonomous deep research agent that conducts comprehensive web and local document research using LLM providers, generating detailed reports with citations.

## Overview

[gpt-researcher](https://github.com/assafelovic/gpt-researcher) is an open-source AI research agent that uses a planner-executor architecture to research any topic and produce long-form, factual reports. It searches the web via Tavily, synthesizes sources, and formats findings with inline citations.

**Key features:**
- Deep web research with automatic source discovery and citation
- Local document research (PDF, Word, Excel, CSV, PowerPoint, Markdown)
- React-based frontend with real-time research progress streaming
- Support for any OpenAI-compatible LLM (GPT-4, local LLMs via Ollama, etc.)
- Optional LangChain tracing for observability
- Optional AI image generation in reports

## Architecture

```
Browser
  │
  ▼
https://${DOMAIN}          ← gptr-nextjs (Next.js, port 3000)
  │                              │
  │  NEXT_PUBLIC_GPTR_API_URL    │ shared gptr-outputs volume
  ▼                              ▼
https://api.${DOMAIN}      ← gpt-researcher (FastAPI, port 8000)
  │
  ├── Tavily API (web search)
  ├── OpenAI API (or compatible)
  └── /my-docs volume (local document research)
```

Both services are independently routed via Traefik on separate subdomains. The `gptr-outputs` volume is shared — the backend writes research results and the frontend serves them.

## Prerequisites

- Dokploy with Traefik configured
- [OpenAI API key](https://platform.openai.com/api-keys) (or OpenAI-compatible provider)
- [Tavily API key](https://tavily.com) — free tier: 1,000 credits/month (~50–200 research tasks)
- Two DNS A records pointing to your server (see DNS Setup below)

## DNS Setup

This template requires **two subdomains** pointing to the same server IP. Traefik handles subdomain routing.

```
A  @    →  <your-server-ip>    # resolves ${DOMAIN}
A  api  →  <your-server-ip>    # resolves api.${DOMAIN}
```

Both records must point to the **same IP**. Traefik on that host differentiates them by hostname.

If your DNS provider uses `@` for the root domain, use that. Some providers use the full domain name for the root record.

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Your primary domain (e.g., `research.example.com`) |
| `OPENAI_API_KEY` | OpenAI API key, or compatible provider key (see [Alternative LLM Providers](#alternative-llm-providers)) |
| `TAVILY_API_KEY` | Tavily web search API key — free tier provides 1,000 credits/month; ~5–20 credits per research task ([tavily.com](https://tavily.com)) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_BASE_URL` | _(OpenAI)_ | Custom base URL for OpenAI-compatible APIs (Ollama, Azure, Groq, etc.) |
| `LANGCHAIN_API_KEY` | _(off)_ | LangSmith API key to enable LangChain tracing |
| `LANGCHAIN_TRACING_V2` | `false` | Enable LangChain trace export |
| `LANGCHAIN_PROJECT` | `gpt-researcher` | LangSmith project name |
| `GOOGLE_API_KEY` | _(off)_ | Google Gemini API key for AI image generation in reports |
| `IMAGE_GENERATION_ENABLED` | `false` | Enable AI image generation in research reports |
| `IMAGE_GENERATION_MODEL` | `dall-e-3` | Image generation model |
| `IMAGE_GENERATION_MAX_IMAGES` | `5` | Max images per report |
| `LOGGING_LEVEL` | `INFO` | Log verbosity: `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `GA_MEASUREMENT_ID` | _(off)_ | Google Analytics measurement ID for the frontend |

## Deployment Steps

1. **Create DNS records** — add both A records (see DNS Setup above) before deploying

2. **Deploy via Dokploy** — import this template and set required variables:
   - `DOMAIN` — your primary domain (without `api.` prefix)
   - `OPENAI_API_KEY` — your LLM provider key
   - `TAVILY_API_KEY` — your Tavily key

3. **Wait for startup** — both containers need ~30–45 seconds to initialize; the backend starts accepting requests before the frontend finishes its Next.js compilation

4. **Verify deployment** — open `https://${DOMAIN}` in your browser; you should see the research interface

## Post-Deployment Verification

```bash
# Check both services are healthy
docker ps --filter name=gpt-researcher --filter name=gptr-nextjs

# Verify backend API responds
curl -s https://api.your-domain.com/ | head -c 100

# Verify frontend loads
curl -sI https://your-domain.com/ | grep "HTTP/"

# Check backend logs (useful if research fails)
docker logs gpt-researcher --tail 50

# Check frontend logs
docker logs gptr-nextjs --tail 50
```

## Local Document Research

gpt-researcher can research your own documents (PDFs, Word, Excel, CSV, Markdown, PowerPoint).

Upload documents to the `gptr-docs` volume:

```bash
# Copy documents into the container
docker cp /path/to/your/docs/. gpt-researcher:/usr/src/app/my-docs/

# Or use Dokploy's file manager to browse the gptr-docs volume
```

When submitting a research query in the UI, select **"Local Documents"** as the research source to search your uploaded files instead of the web.

Research outputs (reports, PDFs) are saved to the `gptr-outputs` volume and accessible from the frontend.

## Alternative LLM Providers

gpt-researcher supports any OpenAI-compatible API via `OPENAI_BASE_URL`. Set this variable to use alternatives:

| Provider | `OPENAI_BASE_URL` | Notes |
|----------|-------------------|-------|
| **Ollama** (local) | `http://host.docker.internal:11434/v1` | Run models locally; no API cost |
| **Groq** | `https://api.groq.com/openai/v1` | Fast inference, generous free tier |
| **Azure OpenAI** | `https://<resource>.openai.azure.com/` | Enterprise Azure deployment |
| **OpenRouter** | `https://openrouter.ai/api/v1` | Multi-model routing |
| **Together AI** | `https://api.together.xyz/v1` | Open-source model hosting |

Set `OPENAI_API_KEY` to the corresponding key for your chosen provider.

## Resource Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 1 GB | 2 GB |
| CPU | 1 core | 2 cores |
| Disk | 2 GB | 10 GB (for document storage) |
| Network | Required | Outbound to OpenAI + Tavily APIs |

## Troubleshooting

### Frontend shows "Failed to connect to API"

The `NEXT_PUBLIC_GPTR_API_URL` is embedded at container startup — it must equal `https://api.${DOMAIN}` where `${DOMAIN}` is your actual domain. If you changed the domain after first deploy, recreate the `gptr-nextjs` container so the variable is re-embedded.

Verify the env var is set correctly:
```bash
docker exec gptr-nextjs printenv NEXT_PUBLIC_GPTR_API_URL
```

### Research fails with "TAVILY_API_KEY not set"

The backend container did not receive the key. Check Dokploy's environment variables panel and confirm `TAVILY_API_KEY` is set. Restart the `gpt-researcher` container after any env var change.

### CORS errors in browser console

This occurs when the frontend is calling a different domain than Traefik is routing the backend to. Ensure:
1. `api.${DOMAIN}` DNS record exists and resolves to your server
2. The `gptr-api` Traefik router is running: check Traefik dashboard at `:8080`
3. No typo in `DOMAIN` — the value must match your actual DNS record exactly

### api.${DOMAIN} returns 404

The `gpt-researcher` backend service may not be registered with Traefik. Check:
```bash
# Confirm the container is on dokploy-network
docker inspect gpt-researcher | grep -A5 Networks
```

Both `gptr-net` and `dokploy-network` should appear. If `dokploy-network` is missing, the service won't be routed.

### Backend starts but research hangs indefinitely

Check for rate limiting on Tavily (free tier exhausted) or OpenAI (quota exceeded). View backend logs:
```bash
docker logs gpt-researcher -f
```

### Image version note

This template uses `gptresearcher/gpt-researcher:latest` and `gptresearcher/gptr-nextjs:latest`. The project does not publish semver-tagged Docker images — the only versioned tag on Docker Hub (`0.8.1`) is over 2 years stale. For production deployments, pin to a specific digest after pulling:

```bash
# Get current digest
docker inspect gptresearcher/gpt-researcher:latest --format '{{index .RepoDigests 0}}'

# Pin in compose file
image: gptresearcher/gpt-researcher@sha256:<digest>
```
