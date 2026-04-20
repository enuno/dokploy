# Honcho

**Open source memory library for building stateful AI agents**

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](https://github.com/plastic-labs/honcho/blob/main/LICENSE)
[![Docker](https://img.shields.io/badge/docker-compose-blue.svg)](https://docs.docker.com/compose/)
[![Honcho](https://img.shields.io/badge/honcho-v0.0.14-purple.svg)](https://github.com/plastic-labs/honcho)

---

## 📖 Overview

Honcho is an open source memory library with a managed service for building stateful agents. Use it with any model, framework, or architecture. It enables agents to build and maintain state about any entity--users, agents, groups, ideas, and more. And because it's a continual learning system, it understands entities that change over time.

**Key Features:**
- 🧠 **Agent Memory**: Persistent memory for AI agents across sessions
- 👥 **Peer Paradigm**: Unified model for users and agents as "peers"
- 💬 **Multi-Participant Sessions**: Support for complex multi-agent interactions
- 🔍 **Hybrid Search**: Vector + keyword search across messages and documents
- 🏗️ **RAG-Ready**: Collections and documents with embedding support
- 🔗 **Multi-Provider LLM Support**: OpenAI, Anthropic, Google Gemini
- 📊 **Chat API**: Natural language queries about peer state and behavior
- 🔄 **Background Processing**: Asynchronous representation updates and summarization
- 🚀 **Production Ready**: Health checks, auto-restart, proper isolation

**Use Cases:**
- Build chatbots with long-term memory
- Create personalized AI assistants
- Design multi-agent systems with shared context
- Implement RAG applications with persistent state
- Build data moats through continual learning

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                External Users (HTTPS)                    │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │         Traefik Proxy         │
        │  (SSL/TLS via Let's Encrypt)  │
        └───────────────┬───────────────┘
                        │ Port 8000
                        │
                        ▼
        ┌───────────────────────────────────┐
        │           Honcho API              │
        │  (ghcr.io/plastic-labs/honcho)    │
        │                                   │
        │  - FastAPI REST server            │
        │  - Peer / Session / Message mgmt  │
        │  - Chat & search endpoints        │
        │  - Automatic DB migrations        │
        └────────────┬──────────────────────┘
                     │
        ┌────────────┴──────────────────────┐
        │                                   │
        ▼                                   ▼
┌───────────────┐              ┌───────────────────────┐
│   Deriver     │              │      PostgreSQL       │
│  (background) │              │  (pgvector/pgvector)  │
│               │              │                       │
│ - Memory      │              │ - Peers, Sessions,    │
│   extraction  │              │   Messages, Docs      │
│ - Summaries   │              │ - Vector embeddings   │
│ - Dreaming    │              │ - Full-text search    │
└───────────────┘              └───────────────────────┘
        │
        ▼
┌───────────────┐
│     Redis     │
│   (cache)     │
│               │
│ - Task queue  │
│ - Cache layer │
└───────────────┘
```

---

## 🚀 Deployment

### Prerequisites

- Dokploy instance with Traefik configured
- Domain name pointing to your Dokploy server
- At least one LLM provider API key (OpenAI recommended)

### Required Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `domain` | Domain name for Honcho API | (required) |
| `postgres_password` | PostgreSQL database password | (auto-generated) |
| `OPENAI_API_KEY` | OpenAI API key for embeddings & LLM | (required) |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | (empty) |
| `GEMINI_API_KEY` | Google Gemini API key | (empty) |

### Deployment Steps

1. **Create a new project** in Dokploy
2. **Add a service** using this template
3. **Configure the domain** to point to your server
4. **Set your LLM API key(s)** in the environment variables
5. **Deploy** and wait for services to become healthy

### First Use

After deployment, the Honcho API is available at your configured domain.

**Example using the Python SDK:**

```python
from honcho import Honcho

# Initialize client
honcho = Honcho(
    base_url="https://your-domain.com",
    workspace_id="my-app"
)

# Create peers
alice = honcho.peer("alice")
tutor = honcho.peer("tutor")

# Create a session and add messages
session = honcho.session("session-1")
session.add_messages([
    alice.message("Hey there — can you help me with my math homework?"),
    tutor.message("Absolutely. Send me your first problem!"),
])

# Query peer insights
response = alice.chat("What learning styles does the user respond to best?")
```

---

## ⚙️ Configuration

### LLM Providers

Honcho uses LLMs for memory extraction, summarization, and the dialectic chat endpoint. You must configure at least one provider:

- **OpenAI** (`LLM_OPENAI_API_KEY`) - Default for embeddings and text generation
- **Anthropic** (`LLM_ANTHROPIC_API_KEY`) - Used for dialectic medium/high/max reasoning
- **Google Gemini** (`LLM_GEMINI_API_KEY`) - Used for deriver, summary, and dialectic minimal/low

### Authentication (Optional)

By default, authentication is disabled for easier self-hosting. To enable JWT-based auth:

1. Set `AUTH_USE_AUTH=true`
2. Generate a JWT secret
3. Set `AUTH_JWT_SECRET` to the generated secret

### Vector Store

This template uses PostgreSQL with pgvector as the vector store (`VECTOR_STORE_TYPE=pgvector`). This is the simplest setup and requires no additional services.

---

## 🔧 Maintenance

### Database Backups

Back up the PostgreSQL volume regularly:

```bash
docker exec <postgres-container> pg_dump -U honcho honcho > honcho-backup.sql
```

### Scaling Derivers

To improve background processing throughput, you can scale the deriver service:

```yaml
deriver:
  deploy:
    replicas: 3
```

Or run multiple deriver containers with different `DERIVER_WORKERS` settings.

### Logs

View logs for specific services:

```bash
docker logs -f <api-container>
docker logs -f <deriver-container>
```

---

## 📚 Resources

- [Honcho Documentation](https://docs.honcho.dev)
- [GitHub Repository](https://github.com/plastic-labs/honcho)
- [Python SDK](https://github.com/plastic-labs/honcho/tree/main/sdks/python)
- [TypeScript SDK](https://github.com/plastic-labs/honcho/tree/main/sdks/typescript)
- [Honcho Managed Service](https://app.honcho.dev)

---

## 📝 License

Honcho is licensed under the [AGPL-3.0 License](https://github.com/plastic-labs/honcho/blob/main/LICENSE).
