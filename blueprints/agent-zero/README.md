# Agent Zero

Dynamic agentic AI framework for autonomous task execution.

## Overview

[Agent Zero](https://github.com/agent0ai/agent-zero) is a next-generation AI assistant running in its own virtual computer, fully self-contained within a Docker environment. Unlike traditional AI chatbots, Agent Zero has full access to a Linux system, enabling it to write and execute code, install software, browse the web, and accomplish complex tasks autonomously.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Agent Zero Stack                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│              ┌───────────────────────┐                           │
│              │     agent-zero        │                           │
│              │   (Linux Container)   │                           │
│              │         :80           │                           │
│              └───────────┬───────────┘                           │
│                          │                                       │
│          ┌───────────────┼───────────────┐                       │
│          │               │               │                       │
│          ▼               ▼               ▼                       │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│   │   Memory    │ │  Knowledge  │ │   LLM API   │               │
│   │  (volume)   │ │  (volume)   │ │ (external)  │               │
│   └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                   │
│   dokploy-network ──▶ Traefik ──▶ HTTPS                          │
│                                                                   │
│   Capabilities:                                                   │
│   ├── Code execution (Python, Bash, etc.)                        │
│   ├── Browser automation                                         │
│   ├── Multi-agent cooperation                                    │
│   ├── Persistent memory across sessions                          │
│   ├── Document Q&A and analysis                                  │
│   └── Self-hosted SearXNG search                                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Features

- **Autonomous Task Execution**: Give it a task, and it gathers information, executes code, and accomplishes objectives
- **Persistent Memory**: Learns from previous solutions and interactions
- **Multi-Agent Cooperation**: Spawns subordinate agents for complex subtasks
- **Code Execution**: Full access to Linux system for running code
- **Browser Automation**: Interacts with web applications
- **Document Processing**: Q&A capabilities for document analysis
- **Self-Hosted Search**: Integrated SearXNG for private web searches
- **Multiple LLM Providers**: OpenRouter, OpenAI, Anthropic, Azure, Ollama, and more
- **Speech Capabilities**: Text-to-speech and speech-to-text support

## Prerequisites

- Domain name with DNS configured
- LLM API key (OpenRouter, OpenAI, Anthropic, etc.)
- At least 4GB RAM recommended

## Quick Start

1. Deploy this template in Dokploy
2. Set your domain (e.g., `agent.example.com`)
3. Set a Web UI password for authentication
4. Access the Web UI at `https://agent.example.com`
5. Configure your LLM provider in Settings → API Keys

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Your domain name |
| `WEB_UI_PASSWORD` | Password to protect the web interface |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_ZERO_VERSION` | `latest` | Docker image tag |
| `OLLAMA_BASE_URL` | - | Ollama API URL for local models |

## Services

| Service | Description | Ports |
|---------|-------------|-------|
| **agent-zero** | Main AI agent application | 80 |

## Image Variants

| Tag | Description | Size |
|-----|-------------|------|
| `latest` | Latest stable release | 2.2 GB |
| `v2` | Version 2.x branch | 2.2 GB |
| `v0.9.7` | Specific version | 2.3 GB |
| `hacking` | Kali Linux based (cybersecurity edition) | ~3 GB |
| `testing` | Pre-release testing builds | Variable |

## Volume Structure

Agent Zero uses specific subdirectories for data persistence:

| Volume | Container Path | Purpose |
|--------|---------------|---------|
| `agent-zero-memory` | `/a0/memory` | Agent persistent memory |
| `agent-zero-knowledge` | `/a0/knowledge` | Knowledge base files |
| `agent-zero-logs` | `/a0/logs` | Session logs (HTML) |
| `agent-zero-tmp` | `/a0/tmp` | Temporary working directory |

**Important**: Do NOT mount the entire `/a0` directory - only mount specific subdirectories to ensure safe upgrades.

## LLM Provider Setup

Agent Zero supports multiple LLM providers. Configure through Web UI → Settings → API Keys.

### OpenRouter (Recommended)

1. Create account at [OpenRouter](https://openrouter.ai/)
2. Generate API key
3. In Agent Zero Settings → API Keys, enter your OpenRouter key
4. Select models (e.g., `anthropic/claude-3-sonnet`)

### OpenAI

1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Enter key in Settings → API Keys
3. Select OpenAI models (e.g., `gpt-4`, `gpt-4-turbo`)

### Anthropic

1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Enter key in Settings → API Keys
3. Select Claude models

### Ollama (Local Models)

For running local models without API costs:

1. Install Ollama on your host machine
2. Set `OLLAMA_BASE_URL` in Dokploy:
   - Host machine: `http://host.docker.internal:11434`
   - Docker network: `http://ollama:11434`
3. In Settings, select Ollama as provider
4. Choose local models (e.g., `llama2`, `mistral`)

## Post-Deployment Setup

### 1. Access Web UI

Navigate to `https://your-domain.com` and log in with your configured password.

### 2. Configure LLM Provider

1. Click "Settings" button
2. Go to "API Keys" section
3. Enter your API key for chosen provider
4. Select chat model, utility model, and embedding model

### 3. Configure Agent Settings

In Settings, you can customize:
- Agent prompts and behavior
- Memory management
- Tool usage permissions
- Search settings (SearXNG)
- Speech capabilities

### 4. Test the Agent

Give it a simple task:
```
"Search for the current weather in New York and summarize the results"
```

## Security Considerations

**Critical Warning**: Agent Zero is capable of executing any code and commands on its container. It can potentially:
- Access your computer, data, and accounts (if given credentials)
- Make API calls with your keys
- Browse the web and interact with services
- Install software and modify its environment

**Security Best Practices**:

1. **Always use authentication**: Set `WEB_UI_PASSWORD`
2. **Never expose without auth**: Don't disable password protection
3. **Use Secrets feature**: Store sensitive credentials in Web UI "Secrets" section - the agent cannot see these
4. **Limit API permissions**: Use restricted API keys where possible
5. **Monitor logs**: Check `/a0/logs` for agent activity
6. **Consider Zero Trust**: Add Cloudflare Access for additional protection

### Cloudflare Zero Trust (Recommended)

For production deployments, protect the agent with Cloudflare Access:

1. Go to Cloudflare Dashboard → Zero Trust → Access
2. Create application for `https://${DOMAIN}`
3. Configure identity providers (Google, GitHub, etc.)
4. Require authentication before accessing the agent

## Troubleshooting

### Agent Not Responding

- Check container logs in Dokploy
- Verify LLM API key is valid
- Ensure API provider is reachable

### Memory Not Persisting

- Verify volume mounts are correct
- Check volume permissions
- Don't mount entire `/a0` directory

### Ollama Connection Failed

- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- Check URL format: `http://host.docker.internal:11434`
- Ensure Ollama allows external connections

### Browser Automation Fails

- Agent Zero includes headless browser support
- Check if specific sites block automated access
- Some features require additional permissions

### Slow Response Times

- Use faster LLM models (GPT-3.5, Claude Instant)
- Increase container resources if needed
- Check network latency to API providers

## Updating Agent Zero

To update to the latest version:

1. In Dokploy, change `AGENT_ZERO_VERSION` to desired version
2. Redeploy the service
3. Your data persists through volume mounts

**Note**: Review release notes before major version upgrades as prompts and behavior may change.

## Resource Requirements

| Component | Memory | CPU | Storage |
|-----------|--------|-----|---------|
| agent-zero | 1-2GB | 1 core | 5GB+ |

**Notes**:
- Memory usage increases with complex tasks
- Knowledge base and memory grow over time
- Initial image download is ~2.2GB

## Related Templates

| Template | Description |
|----------|-------------|
| `langflow` | Visual AI workflow builder |
| `open-notebook` | Multi-model AI knowledge management |
| `n8n` | Workflow automation with AI integration |
| `lobe-chat` | AI chat platform with multi-provider support |

## Links

- [Agent Zero GitHub](https://github.com/agent0ai/agent-zero)
- [Official Website](https://www.agent-zero.ai/)
- [Documentation](https://www.agent-zero.ai/p/docs/get-started/)
- [Docker Hub](https://hub.docker.com/r/agent0ai/agent-zero)
- [OpenRouter](https://openrouter.ai/) (recommended LLM provider)

## Version

- **Template**: 1.0.0
- **Agent Zero**: latest (agent0ai/agent-zero)
