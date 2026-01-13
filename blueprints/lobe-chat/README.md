# LobeChat

Modern AI chat platform with multi-provider support, knowledge base, and server-side storage.

## Overview

[LobeChat](https://github.com/lobehub/lobe-chat) is an open-source AI chat interface that supports multiple LLM providers including OpenAI, Anthropic Claude, Google Gemini, Azure OpenAI, and local models via Ollama. This template deploys the server-database version with PostgreSQL (pgvector) for persistent storage and optional Cloudflare R2 for file uploads.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│    LobeChat     │────▶│   PostgreSQL    │
│  (AI Chat UI)   │     │   (pgvector)    │
└─────────────────┘     └─────────────────┘
        │
        ├────▶ Cloudflare R2 (optional)
        │      - File uploads
        │      - Knowledge base docs
        │
        ▼
   HTTPS (Traefik)
```

## Features

- Multi-provider AI support (OpenAI, Anthropic, Google, Azure, Ollama)
- Knowledge base with file uploads and RAG
- Plugin marketplace (MCP support)
- Conversation history stored in PostgreSQL
- Vector search via pgvector extension
- Optional Cloudflare R2 for file storage

## Quick Start

1. Deploy this template in Dokploy
2. Set your domain
3. Add at least one AI provider API key
4. Access your chat at `https://your-domain.com`

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Your domain (e.g., `chat.example.com`) |
| `POSTGRES_PASSWORD` | Database password (auto-generated) |
| `NEXT_AUTH_SECRET` | NextAuth encryption key (auto-generated) |
| `KEY_VAULTS_SECRET` | API key vault encryption (auto-generated) |

### AI Provider API Keys

Configure at least one AI provider:

| Variable | Provider | Get API Key |
|----------|----------|-------------|
| `OPENAI_API_KEY` | OpenAI (GPT-4, GPT-3.5) | [platform.openai.com](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | Anthropic (Claude) | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| `GOOGLE_API_KEY` | Google (Gemini) | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `AZURE_API_KEY` | Azure OpenAI | Azure Portal |
| `OLLAMA_PROXY_URL` | Ollama (local models) | Your Ollama server URL |

### Optional: Access Protection

| Variable | Description | Default |
|----------|-------------|---------|
| `ACCESS_CODE` | Access code(s) for basic protection | Empty (no restriction) |

Set one or multiple comma-separated codes to require authentication before using the chat.

## Cloudflare R2 Setup (Optional)

R2 storage enables file uploads and knowledge base functionality.

### Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > R2 > Overview
2. Click "Create bucket"
3. Name your bucket (e.g., `lobechat-files`)
4. Note the bucket name

### Create R2 API Token

1. Go to R2 > Overview > Manage R2 API Tokens
2. Click "Create API token"
3. Set permissions: "Object Read & Write"
4. Copy the Access Key ID and Secret Access Key

### Configure R2 Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `S3_ENDPOINT` | R2 endpoint URL | `https://abc123.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY_ID` | R2 access key | From API token |
| `S3_SECRET_ACCESS_KEY` | R2 secret key | From API token |
| `S3_BUCKET` | Bucket name | `lobechat-files` |
| `S3_PUBLIC_DOMAIN` | Public URL for files | `https://files.example.com` (optional) |

### Configure CORS (Required for uploads)

In your R2 bucket settings, add this CORS policy:

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Using Local Models (Ollama)

To use local models via Ollama:

1. Run Ollama on your server or another machine
2. Set `OLLAMA_PROXY_URL` to your Ollama server:
   - Same machine: `http://host.docker.internal:11434`
   - Different machine: `http://ollama-server:11434`
3. Models will appear in the LobeChat model selector

## Post-Deployment

1. **First Access**: Visit `https://your-domain.com`
2. **Configure AI Provider**: Go to Settings > Model Provider and add your API key
3. **Create Account**: Register or use the access code if configured
4. **Start Chatting**: Create a new conversation and select your preferred model

## Troubleshooting

### "Database connection failed"

- Check PostgreSQL container is healthy: `docker ps`
- Verify `POSTGRES_PASSWORD` matches in both services
- Check logs: `docker logs lobe-chat`

### "API key invalid"

- Verify API key is correctly entered in Dokploy environment
- Check provider-specific proxy URL if using one
- Ensure API key has sufficient credits/quota

### "File upload failed"

- Verify R2 credentials are correct
- Check R2 bucket CORS configuration
- Ensure `S3_ENDPOINT` includes your account ID

### "502 Bad Gateway"

- Wait for container to fully start (60s start period)
- Check container logs for startup errors
- Verify database is healthy

## Resource Requirements

- **Memory**: 512MB minimum, 1GB recommended
- **CPU**: 1 core minimum
- **Storage**: PostgreSQL data volume (grows with usage)

## Links

- [LobeChat Documentation](https://lobehub.com/docs)
- [Self-Hosting Guide](https://lobehub.com/docs/self-hosting/start)
- [GitHub Repository](https://github.com/lobehub/lobe-chat)
- [Docker Hub](https://hub.docker.com/r/lobehub/lobe-chat-database)

## Version

- **Template**: 1.0.0
- **LobeChat Image**: 1.143.2
- **PostgreSQL**: 16 with pgvector
