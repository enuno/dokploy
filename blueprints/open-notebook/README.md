# Open Notebook - Private Multi-Model AI Knowledge Management Platform

A self-hosted AI-powered knowledge management platform that serves as a private alternative to NotebookLM, supporting 16+ AI providers for semantic search and intelligent research.

![Open Notebook](https://raw.githubusercontent.com/lfnovo/open-notebook/main/docs/images/banner.png)

## Overview

Open Notebook is a modern, self-hosted knowledge management application that combines traditional note-taking with AI-powered semantic search and research capabilities. Built with Next.js, FastAPI, and embedded SurrealDB, it provides a fast, private, and intelligent way to organize and retrieve your research.

**Key Features:**
- 🤖 **Multi-Model AI Support**: Works with 16+ AI providers (OpenAI, Anthropic, Google, Ollama, etc.)
- 📚 **Semantic Search**: Find information by meaning, not just keywords
- 🔐 **Privacy-First**: All processing happens locally except AI API calls
- 🎙️ **Podcast Generation**: Convert notes to audio with ElevenLabs TTS
- 🌐 **Web Research**: Integrated web crawling with Firecrawl and Jina AI
- 💾 **Embedded Database**: SurrealDB runs inside the container for simplicity
- ⚡ **Fast & Responsive**: Next.js frontend with FastAPI backend

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Dokploy Environment                      │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │        open-notebook-network (Internal)                 │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │         Open Notebook All-in-One Service         │  │ │
│  │  │                                                    │  │ │
│  │  │  ┌──────────────────────────────────────────┐    │  │ │
│  │  │  │  Next.js Frontend (Port 8502)            │    │  │ │
│  │  │  │  - Web UI for notebooks                  │    │  │ │
│  │  │  │  - React components                      │    │  │ │
│  │  │  └──────────────────────────────────────────┘    │  │ │
│  │  │                      ▼                            │  │ │
│  │  │  ┌──────────────────────────────────────────┐    │  │ │
│  │  │  │  FastAPI Backend (Port 5055)             │    │  │ │
│  │  │  │  - AI orchestration via Esperanto        │    │  │ │
│  │  │  │  - Multi-provider support                │    │  │ │
│  │  │  └──────────────────────────────────────────┘    │  │ │
│  │  │                      ▼                            │  │ │
│  │  │  ┌──────────────────────────────────────────┐    │  │ │
│  │  │  │  SurrealDB Embedded (Port 8000)          │    │  │ │
│  │  │  │  - NoSQL database for notes              │    │  │ │
│  │  │  │  - Vector embeddings storage             │    │  │ │
│  │  │  └──────────────────────────────────────────┘    │  │ │
│  │  │                                                    │  │ │
│  │  │  Volumes:                                         │  │ │
│  │  │  - /app/data (notebooks, research)                │  │ │
│  │  │  - /mydata (SurrealDB database)                   │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  └───────────────────────────┼──────────────────────────────┘ │
│                              │                                │
│  ┌───────────────────────────┼──────────────────────────────┐ │
│  │              dokploy-network (External)                  │ │
│  │                           │                              │ │
│  │                      ┌────▼────┐                         │ │
│  │                      │ Traefik │                         │ │
│  │                      │ Routing │                         │ │
│  │                      │ + SSL   │                         │ │
│  │                      └────┬────┘                         │ │
│  └───────────────────────────┼──────────────────────────────┘ │
└──────────────────────────────┼───────────────────────────────┘
                               │
                        ┌──────▼──────┐
                        │   Internet  │
                        │ (HTTPS/443) │
                        └─────────────┘
```

### Components

| Component | Purpose | Network |
|-----------|---------|---------|
| **Next.js Frontend** | Web UI for managing notebooks and research | open-notebook-network + dokploy-network |
| **FastAPI Backend** | AI orchestration with Esperanto library | Internal (localhost:5055) |
| **SurrealDB** | Embedded NoSQL database with vector storage | Internal (localhost:8000) |
| **open-notebook-data Volume** | Persistent storage for notebooks | Local volume |
| **open-notebook-db Volume** | Persistent storage for database | Local volume |
| **Traefik** | Reverse proxy with SSL termination | dokploy-network |

### Security

- ✅ **HTTPS Only**: All traffic encrypted via Let's Encrypt
- ✅ **Security Headers**: HSTS, XSS protection, frame deny, content-type nosniff
- ✅ **Network Isolation**: Database and API internal-only
- ✅ **Optional Password**: OPEN_NOTEBOOK_PASSWORD for public hosting protection
- ✅ **Secrets Management**: All sensitive data via environment variables
- ✅ **Privacy-First**: AI processing only sends to your chosen providers

## Prerequisites

- Dokploy instance running
- Domain name pointed to your server
- Docker and Docker Compose installed
- Port 443 available for HTTPS traffic
- At least one AI provider API key (OpenAI, Anthropic, Ollama, etc.)

## Quick Start

### 1. Deploy via Dokploy UI

1. Navigate to your Dokploy instance
2. Go to **Templates** → **Create Template**
3. Select **Open Notebook** from the template list
4. Configure the required variables (see below)
5. Click **Deploy**

### 2. Configuration Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `domain` | ✅ Yes | - | Domain for accessing Open Notebook (e.g., `notebook.example.com`) |
| `surreal_password` | ✅ Yes | Auto-generated | SurrealDB password (32 chars, auto-generated) |
| **AI Providers** (at least one required) | | | |
| `openai_api_key` | ⚠️ Optional | - | OpenAI API key for GPT models |
| `anthropic_api_key` | ⚠️ Optional | - | Anthropic API key for Claude models |
| `ollama_api_base` | ⚠️ Optional | - | Ollama base URL (e.g., `http://host.docker.internal:11434`) |
| `google_api_key` | ⚠️ Optional | - | Google AI API key for Gemini models |
| `mistral_api_key` | ⚠️ Optional | - | Mistral AI API key |
| `deepseek_api_key` | ⚠️ Optional | - | DeepSeek API key |
| **Optional Features** | | | |
| `open_notebook_password` | No | - | Password protection for public hosting (recommended) |
| `elevenlabs_api_key` | No | - | ElevenLabs TTS for podcast generation |
| `firecrawl_api_key` | No | - | Firecrawl web crawling service |
| `jina_api_key` | No | - | Jina AI Reader for web content |
| `voyage_api_key` | No | - | Voyage AI embeddings |
| **Database Settings** | | | |
| `surreal_user` | No | `root` | SurrealDB username |
| `surreal_namespace` | No | `open_notebook` | SurrealDB namespace |
| `surreal_database` | No | `production` | SurrealDB database name |
| **Application Tuning** | | | |
| `api_client_timeout` | No | `300` | API client timeout (seconds) |
| `esperanto_llm_timeout` | No | `60` | LLM request timeout (seconds) |
| `tts_batch_size` | No | `5` | TTS batch size for podcast generation |
| `uid` | No | `1000` | Container user ID |
| `gid` | No | `1000` | Container group ID |

**Note**: The `surreal_password` is automatically generated by Dokploy during deployment for maximum security. You must configure at least one AI provider API key for the application to function.

### 3. Obtaining AI Provider API Keys

#### OpenAI
1. Visit https://platform.openai.com/api-keys
2. Create new API key
3. Copy key and paste into `openai_api_key` variable

#### Anthropic Claude
1. Visit https://console.anthropic.com/settings/keys
2. Create new API key
3. Copy key and paste into `anthropic_api_key` variable

#### Ollama (Local)
1. Install Ollama on your host or another server
2. Set `ollama_api_base` to `http://host.docker.internal:11434` (if running on same host)
3. No API key required (local deployment)

#### Google Gemini
1. Visit https://makersuite.google.com/app/apikey
2. Create new API key
3. Copy key and paste into `google_api_key` variable

#### Mistral AI
1. Visit https://console.mistral.ai/api-keys
2. Create new API key
3. Copy key and paste into `mistral_api_key` variable

#### DeepSeek
1. Visit https://platform.deepseek.com/api_keys
2. Create new API key
3. Copy key and paste into `deepseek_api_key` variable

### 4. Post-Deployment

After deployment completes:

1. **Access your instance**: Navigate to `https://your-domain.com`
2. **Configure AI provider**: The application will detect which API keys you provided
3. **Create your first notebook**: Start organizing your research and notes
4. **Test semantic search**: Add some notes and try AI-powered search

## Configuration

### Supported AI Providers

Open Notebook uses the Esperanto library to support 16+ AI providers:

| Provider | Models | Use Case |
|----------|--------|----------|
| **OpenAI** | GPT-4, GPT-3.5 | General-purpose, high quality |
| **Anthropic** | Claude 3.5, Claude 3 | Analysis, long-context |
| **Ollama** | Llama, Mistral, etc. | Local/private, no API costs |
| **Google** | Gemini Pro, Gemini Flash | Fast responses, multimodal |
| **Mistral** | Mistral Large, Medium | European alternative |
| **DeepSeek** | DeepSeek Chat | Cost-effective |
| **Others** | Groq, Together, etc. | Various specialized uses |

You can configure multiple providers and switch between them in the UI.

### Environment Variables

The following environment variables are configured automatically via template.toml:

```yaml
# Domain Configuration
OPEN_NOTEBOOK_DOMAIN: your-domain.com

# Database Configuration (SurrealDB Embedded)
SURREAL_URL: ws://localhost:8000/rpc
SURREAL_USER: root
SURREAL_PASSWORD: <auto-generated>
SURREAL_NAMESPACE: open_notebook
SURREAL_DATABASE: production

# Security (Optional - Recommended for Public Hosting)
OPEN_NOTEBOOK_PASSWORD: ""  # Set to protect your instance

# AI Provider Configuration
OPENAI_API_KEY: ""
ANTHROPIC_API_KEY: ""
OLLAMA_API_BASE: ""
GOOGLE_API_KEY: ""
MISTRAL_API_KEY: ""
DEEPSEEK_API_KEY: ""

# Optional Features
ELEVENLABS_API_KEY: ""  # Podcast generation
FIRECRAWL_API_KEY: ""   # Web crawling
JINA_API_KEY: ""        # Web content extraction
VOYAGE_API_KEY: ""      # Advanced embeddings

# Application Settings
API_CLIENT_TIMEOUT: 300
ESPERANTO_LLM_TIMEOUT: 60
TTS_BATCH_SIZE: 5
```

### Customizing Settings

To modify settings after deployment, update the environment variables in Dokploy:

1. Navigate to your Open Notebook service in Dokploy
2. Go to **Environment** tab
3. Update desired variables
4. Click **Save** and **Redeploy**

## Features

### 1. Multi-Provider AI Support

Open Notebook is provider-agnostic, allowing you to:
- Use multiple AI providers simultaneously
- Switch providers based on task requirements
- Compare responses from different models
- Maintain privacy with local Ollama models

### 2. Semantic Search

Traditional search finds exact keyword matches. Open Notebook's semantic search:
- Understands the meaning of your query
- Finds related content even without exact words
- Uses AI embeddings for intelligent retrieval
- Learns from your research patterns

### 3. Research Workflows

- **Web Research**: Crawl and extract content from URLs
- **Note Organization**: Tag, categorize, and link notes
- **AI Summarization**: Generate summaries of long content
- **Citation Management**: Track sources and references

### 4. Podcast Generation

With ElevenLabs TTS integration:
- Convert notes to audio
- Listen to your research on-the-go
- Batch process multiple notes
- Customizable voice settings

## Health Checks

Open Notebook includes optimized health checks for the all-in-one container:

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8502"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s  # Allows time for Next.js + FastAPI + SurrealDB startup
```

The 60-second start period accommodates the initialization of all three components (Next.js frontend, FastAPI backend, and embedded SurrealDB).

## Security Configuration

### HTTPS & SSL

- **Certificate**: Automatic Let's Encrypt via Traefik
- **Renewal**: Automatic certificate renewal
- **Protocols**: TLS 1.2 and TLS 1.3 only

### Security Headers

The template includes comprehensive security headers via Traefik middleware:

```yaml
# HSTS (HTTP Strict Transport Security)
Strict-Transport-Security: max-age=31536000; includeSubDomains

# XSS Protection
X-XSS-Protection: 1; mode=block

# Clickjacking Protection
X-Frame-Options: DENY

# Content-Type Sniffing Protection
X-Content-Type-Options: nosniff

# Referrer Policy
Referrer-Policy: strict-origin-when-cross-origin
```

### Optional Password Protection

For public hosting, enable password protection:

1. Set `OPEN_NOTEBOOK_PASSWORD` environment variable
2. Users must enter this password to access the application
3. Recommended for internet-facing deployments

### API Key Security

**IMPORTANT**: Never commit API keys to version control!

- API keys are stored as environment variables in Dokploy
- Keys are not visible in logs or UI
- Use different keys for development and production
- Rotate keys regularly for security

## Data Management

### Backup

Regular backups are critical for protecting your research data:

```bash
# Backup notebooks and application data
docker run --rm -v open-notebook_open-notebook-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/notebooks-$(date +%Y%m%d).tar.gz /data

# Backup SurrealDB database
docker run --rm -v open-notebook_open-notebook-db:/data -v $(pwd):/backup \
  alpine tar czf /backup/database-$(date +%Y%m%d).tar.gz /data

# Backup both volumes together
docker run --rm \
  -v open-notebook_open-notebook-data:/notebooks \
  -v open-notebook_open-notebook-db:/database \
  -v $(pwd):/backup \
  alpine sh -c "tar czf /backup/open-notebook-full-$(date +%Y%m%d).tar.gz /notebooks /database"
```

### Restore

To restore from backup:

```bash
# Restore notebooks
cat notebooks-20231225.tar.gz | docker run --rm -i \
  -v open-notebook_open-notebook-data:/data \
  alpine tar xzf - -C /

# Restore database
cat database-20231225.tar.gz | docker run --rm -i \
  -v open-notebook_open-notebook-db:/data \
  alpine tar xzf - -C /

# Restore full backup
cat open-notebook-full-20231225.tar.gz | docker run --rm -i \
  -v open-notebook_open-notebook-data:/notebooks \
  -v open-notebook_open-notebook-db:/database \
  alpine sh -c "tar xzf - -C /"
```

### Export Data

To export your notebooks for migration or archival:

1. Access Open Notebook UI
2. Go to **Settings** → **Export**
3. Choose export format (Markdown, JSON, etc.)
4. Download exported files

## Troubleshooting

### Issue: Application shows blank page after deployment

**Symptoms**: White/blank page when accessing domain

**Solution**:
1. Check if container is running:
   ```bash
   docker ps | grep open-notebook
   ```
2. Check logs for startup errors:
   ```bash
   docker logs $(docker ps -q -f name=open-notebook_open-notebook)
   ```
3. Verify environment variables are set:
   ```bash
   docker exec $(docker ps -q -f name=open-notebook_open-notebook) env | grep -E "SURREAL|DOMAIN"
   ```
4. Check if all components started (may take up to 60 seconds on first run)

### Issue: "No AI provider configured" error

**Symptoms**: Application loads but shows error about missing AI provider

**Solution**:
1. Verify at least one AI provider API key is set:
   ```bash
   docker exec $(docker ps -q -f name=open-notebook_open-notebook) env | grep -E "API_KEY|API_BASE"
   ```
2. Check API key validity by testing with provider directly
3. Restart container after adding API keys:
   ```bash
   docker restart $(docker ps -q -f name=open-notebook_open-notebook)
   ```

### Issue: 502 Bad Gateway

**Symptoms**: Nginx/Traefik returns 502 error

**Solution**:
1. Check if container is healthy:
   ```bash
   docker ps | grep open-notebook
   docker inspect $(docker ps -q -f name=open-notebook_open-notebook) | grep -A 10 Health
   ```
2. Verify container is on both networks:
   ```bash
   docker inspect $(docker ps -q -f name=open-notebook_open-notebook) | grep -A 10 Networks
   ```
3. Check Traefik routing:
   ```bash
   docker logs $(docker ps -q -f name=traefik)
   ```
4. Verify port 8502 is accessible inside container:
   ```bash
   docker exec $(docker ps -q -f name=open-notebook_open-notebook) wget -qO- http://localhost:8502
   ```

### Issue: Database connection errors

**Symptoms**: "Cannot connect to SurrealDB" or database errors in logs

**Solution**:
1. Check if SurrealDB is running (embedded in same container):
   ```bash
   docker exec $(docker ps -q -f name=open-notebook_open-notebook) ps aux | grep surreal
   ```
2. Verify database volume is mounted:
   ```bash
   docker inspect $(docker ps -q -f name=open-notebook_open-notebook) | grep -A 5 Mounts
   ```
3. Check database logs:
   ```bash
   docker logs $(docker ps -q -f name=open-notebook_open-notebook) | grep -i surreal
   ```

### Issue: Slow AI responses

**Symptoms**: Queries take very long to return results

**Solution**:
1. Check which AI provider you're using (some are faster than others)
2. Increase timeout settings:
   - `ESPERANTO_LLM_TIMEOUT` (default 60s)
   - `API_CLIENT_TIMEOUT` (default 300s)
3. Consider using faster providers:
   - Google Gemini Flash (fastest)
   - Groq (very fast)
   - Ollama local (no network latency)
4. Check network connectivity to AI provider

### Issue: Podcast generation not working

**Symptoms**: Cannot generate audio from notes

**Solution**:
1. Verify ElevenLabs API key is set:
   ```bash
   docker exec $(docker ps -q -f name=open-notebook_open-notebook) env | grep ELEVENLABS
   ```
2. Check ElevenLabs API quota (may be exhausted)
3. Review TTS batch size setting:
   ```bash
   docker exec $(docker ps -q -f name=open-notebook_open-notebook) env | grep TTS_BATCH_SIZE
   ```

## Maintenance

### Update Open Notebook

To update to a newer version:

**IMPORTANT**: Open Notebook is in active development and uses `v1-latest-single` tag:

1. **Backup your data first** (see Backup section above)
2. Pull the latest image:
   ```bash
   docker pull lfnovo/open_notebook:v1-latest-single
   ```
3. Redeploy via Dokploy UI or restart container:
   ```bash
   docker restart $(docker ps -q -f name=open-notebook_open-notebook)
   ```
4. Verify data persists (stored in volumes)
5. Check logs for migration messages:
   ```bash
   docker logs $(docker ps -q -f name=open-notebook_open-notebook) | tail -50
   ```

**Version Strategy**:
- Open Notebook is pre-1.0 and in active development
- The `v1-latest-single` tag receives updates within major version 1
- When v1.0 stable releases, consider pinning to specific versions for production
- The major version boundary (v1) provides stability while allowing improvements

### Volume Management

Open Notebook uses persistent volumes for data:

```bash
# List volumes
docker volume ls | grep open-notebook

# Inspect volumes
docker volume inspect open-notebook_open-notebook-data
docker volume inspect open-notebook_open-notebook-db

# Check volume disk usage
docker system df -v | grep open-notebook
```

### Database Maintenance

SurrealDB is embedded and maintains itself, but you can check database size:

```bash
# Check database size
docker exec $(docker ps -q -f name=open-notebook_open-notebook) \
  du -sh /mydata

# Check application data size
docker exec $(docker ps -q -f name=open-notebook_open-notebook) \
  du -sh /app/data
```

### Log Management

Monitor application logs for issues:

```bash
# View logs
docker logs $(docker ps -q -f name=open-notebook_open-notebook)

# Follow logs in real-time
docker logs -f $(docker ps -q -f name=open-notebook_open-notebook)

# Last 100 lines
docker logs --tail 100 $(docker ps -q -f name=open-notebook_open-notebook)

# Search logs for errors
docker logs $(docker ps -q -f name=open-notebook_open-notebook) | grep -i error
```

## Resources

### Official Documentation
- **GitHub Repository**: https://github.com/lfnovo/open-notebook
- **Documentation**: https://github.com/lfnovo/open-notebook#readme
- **Issue Tracker**: https://github.com/lfnovo/open-notebook/issues

### Docker Image
- **Docker Hub**: https://hub.docker.com/r/lfnovo/open_notebook
- **Image Tag**: `v1-latest-single` (all-in-one container)

### AI Provider Documentation
- **OpenAI**: https://platform.openai.com/docs
- **Anthropic**: https://docs.anthropic.com
- **Ollama**: https://ollama.ai/docs
- **Google AI**: https://ai.google.dev/docs
- **Mistral**: https://docs.mistral.ai
- **DeepSeek**: https://platform.deepseek.com/docs

### Optional Services
- **ElevenLabs**: https://elevenlabs.io/docs
- **Firecrawl**: https://docs.firecrawl.dev
- **Jina AI**: https://jina.ai/reader
- **Voyage AI**: https://docs.voyageai.com

### Community
- **GitHub Discussions**: https://github.com/lfnovo/open-notebook/discussions
- **GitHub Issues**: https://github.com/lfnovo/open-notebook/issues

### Related Projects
- **NotebookLM**: Google's AI-powered notebook (cloud-based)
- **Obsidian**: Markdown-based knowledge management
- **Notion**: All-in-one workspace
- **Logseq**: Privacy-first knowledge base

## Template Information

- **Template Version**: 1.0.0
- **Open Notebook Version**: v1-latest-single (active development)
- **Created**: December 2025
- **Maintainer**: Dokploy Community
- **License**: Check upstream Open Notebook project for licensing

## Contributing

Found an issue or have a suggestion? Please open an issue or pull request in the Dokploy templates repository.

---

**Happy Research with AI! 🤖📚**
