# Langflow

**Visual AI workflow builder for creating LLM-powered applications**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/langflow-ai/langflow/blob/main/LICENSE)
[![Docker](https://img.shields.io/badge/docker-compose-blue.svg)](https://docs.docker.com/compose/)
[![Langflow](https://img.shields.io/badge/langflow-1.7.1-purple.svg)](https://github.com/langflow-ai/langflow)

---

## 📖 Overview

Langflow is a low-code platform for building and deploying AI-powered agents and workflows. Create intelligent applications through visual drag-and-drop interfaces or programmatic approaches, with support for all major LLMs and vector databases.

**Key Features:**
- 🎨 **Visual Flow Builder**: Drag-and-drop interface for AI workflow design
- 🤖 **Multi-LLM Support**: OpenAI, Anthropic, Google, local models, and more
- 🔗 **Vector Database Integration**: Pinecone, Weaviate, Chroma, Qdrant
- 📊 **Built-in Components**: 300+ pre-built components for common AI tasks
- 🔌 **API-First**: RESTful API for programmatic workflow execution
- 💾 **PostgreSQL Backend**: Production-grade data persistence
- 🔒 **Optional Authentication**: User login with LANGFLOW_SUPERUSER
- 💨 **Performance Optimized**: Auto-saving, lazy loading, component caching
- 🚀 **Production Ready**: Health checks, auto-restart, proper isolation, security headers

**Use Cases:**
- Build chatbots and conversational AI agents
- Create RAG (Retrieval Augmented Generation) systems
- Design multi-agent AI workflows
- Prototype LLM applications rapidly
- Integrate AI into existing applications via API

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
                        │ Port 7860
                        │
                        ▼
        ┌───────────────────────────────────┐
        │           Langflow                │
        │  (langflowai/langflow:1.7.1)      │
        │                                   │
        │  - Visual workflow builder        │
        │  - Component library (300+)       │
        │  - API server (REST)              │
        │  - WebSocket for real-time        │
        │  - Optional authentication        │
        └────────────┬──────────────────────┘
                     │ PostgreSQL connection
                     │ (internal only)
                     ▼
        ┌───────────────────────────────────┐
        │         PostgreSQL 16             │
        │   (postgres:16-alpine)            │
        │                                   │
        │  - Workflow storage               │
        │  - Component configurations       │
        │  - User sessions                  │
        │  - Chat history                   │
        └───────────────────────────────────┘
                     │
                     ▼
        ┌───────────────────────────────────┐
        │      Persistent Storage           │
        │                                   │
        │  - langflow-data: App config      │
        │  - langflow-flows: Flow defs      │
        │  - langflow-cache: Components     │
        │  - postgres-data: Database files  │
        └───────────────────────────────────┘

Networks:
  langflow-net (internal): Langflow ↔ PostgreSQL
  dokploy-network (external): Traefik ↔ Langflow
```

**Security Design:**
- PostgreSQL isolated on internal network (not exposed)
- Langflow bridges networks (needs both DB access + external routing)
- HTTPS enforced via Let's Encrypt with security headers (HSTS, XSS protection)
- Auto-generated secrets (PostgreSQL password, Langflow secret key)
- Optional user authentication (disabled by default for ease of use)

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LANGFLOW_DOMAIN` | ✅ Yes | - | Your domain (e.g., `langflow.yourdomain.com`) |
| `POSTGRES_PASSWORD` | ✅ Yes | Auto-generated | PostgreSQL database password (32 chars) |
| `LANGFLOW_SECRET_KEY` | ✅ Yes | Auto-generated | Session encryption key (64 base64 chars) |
| `LANGFLOW_SUPERUSER` | No | - | Admin username (enables authentication if set) |
| `LANGFLOW_SUPERUSER_PASSWORD` | No | - | Admin password (required if SUPERUSER is set) |
| `POSTGRES_USER` | No | `langflow` | PostgreSQL username |
| `POSTGRES_DB` | No | `langflow` | PostgreSQL database name |
| `LANGFLOW_LOG_LEVEL` | No | `info` | Log verbosity: `debug`, `info`, `warning`, `error` |
| `LANGFLOW_AUTO_LOGIN` | No | `false` | Skip authentication (dev only, **never in production**) |
| `LANGFLOW_MAX_FILE_SIZE_UPLOAD` | No | `10000` | Max upload size in KB (10MB default) |
| `LANGFLOW_WORKERS` | No | `1` | Number of worker processes |
| `LANGFLOW_AUTO_SAVING` | No | `true` | Automatically save flows on changes |
| `LANGFLOW_LAZY_LOAD_COMPONENTS` | No | `true` | Load components on-demand (faster startup) |

**Auto-Generated Secrets:**
- `postgres_password`: 32-character random alphanumeric password
- `langflow_secret_key`: 64-character base64-encoded encryption key

### Port Configuration

| Port | Protocol | Purpose | Exposure |
|------|----------|---------|----------|
| 7860 | HTTP | Langflow web UI + API | External (via Traefik) |
| 5432 | TCP | PostgreSQL | Internal only |

---

## 🚀 Quick Start

### Prerequisites

**Required:**
1. **Dokploy Instance**: Running Dokploy installation
2. **Domain Name**: DNS A record pointing to your server
3. **Storage**: Minimum 5-10 GB free space
4. **RAM**: 2-4 GB recommended

**Optional:**
- Custom LLM API keys (OpenAI, Anthropic, etc.)
- Vector database credentials (Pinecone, Weaviate)

### Deployment Steps

#### Step 1: Deploy in Dokploy

1. **Create New Service** in Dokploy
2. **Select Template**: Choose "Langflow" from templates
3. **Configure Variables**:
   - `LANGFLOW_DOMAIN`: Your domain (e.g., `langflow.example.com`)
   - `POSTGRES_PASSWORD`: Auto-generated (leave default)
   - `LANGFLOW_SECRET_KEY`: Auto-generated (leave default)
4. **Deploy**: Click "Deploy" and wait for services to start (~30-60 seconds)

#### Step 2: DNS Configuration

Point your domain to the Dokploy server:

```bash
# Example A record
langflow.example.com.  A  203.0.113.10
```

**DNS propagation** may take 5-60 minutes.

#### Step 3: Access Langflow

1. **Navigate** to `https://your-domain.com`
2. **First Run**: Langflow will initialize the database (may take 1-2 minutes)
3. **Authentication** (optional):
   - If `LANGFLOW_SUPERUSER` is set: Log in with configured credentials
   - If not set: Direct access to flow builder (no login required)

**Note**: Authentication is disabled by default for ease of use. To enable:
- Set `LANGFLOW_SUPERUSER` to your desired username
- Set `LANGFLOW_SUPERUSER_PASSWORD` to a strong password
- Redeploy the service

---

## 💡 Using Langflow

### Creating Your First Flow

1. **Dashboard**: Click "New Flow" on the main page
2. **Select Template**: Choose a starter template or start blank
3. **Add Components**: Drag components from the sidebar:
   - **LLM Models**: OpenAI, Anthropic, Google, local models
   - **Vector Stores**: Pinecone, Chroma, Weaviate
   - **Data Sources**: Files, URLs, APIs
   - **Tools**: Search, calculators, custom functions
4. **Connect Nodes**: Drag connections between component outputs/inputs
5. **Test Flow**: Use the chat interface to test your workflow
6. **Deploy**: Export as API or save for later use

### API Usage

Access your flows programmatically:

```bash
# Get flow API endpoint
curl https://langflow.example.com/api/v1/flows

# Run a flow
curl -X POST https://langflow.example.com/api/v1/run/{flow_id} \
  -H "Content-Type: application/json" \
  -d '{"input": "your question here"}'
```

### Example Workflows

**RAG Chatbot:**
1. Add "File Loader" component → Upload PDF/text files
2. Add "Text Splitter" → Chunk documents
3. Add "Vector Store" → Store embeddings (Chroma)
4. Add "Retriever" → Search relevant chunks
5. Add "ChatOpenAI" → Generate response with context
6. Connect and test

**Multi-Agent System:**
1. Add multiple "Agent" components with different roles
2. Add "Tool" components for each agent
3. Add "Router" to delegate tasks
4. Add "Memory" for conversation context
5. Connect agents in sequence or parallel

---

## 🔒 Security Considerations

### Production Security

1. **Auto-Login Disabled**: `LANGFLOW_AUTO_LOGIN=false` (default)
   - Never enable in production
   - Only for local development/testing

2. **HTTPS Enforced**: All traffic encrypted via Let's Encrypt
   - Automatic certificate renewal
   - HSTS headers recommended (see enhancement below)

3. **PostgreSQL Isolation**: Database not exposed externally
   - Only accessible from Langflow container
   - Strong auto-generated password

4. **Secret Management**: All secrets auto-generated
   - 32-character database password
   - 64-character base64 encryption key

### Optional: Cloudflare Zero Trust

For **additional admin protection**, integrate Cloudflare Zero Trust Access:

**Benefits:**
- SSO/OAuth authentication (Google, GitHub, etc.)
- IP restrictions and geofencing
- Audit logs for all access
- MFA enforcement

**Setup:**
1. **Cloudflare Dashboard** → Zero Trust → Access → Applications
2. **Create Application**:
   - Name: `Langflow Admin`
   - Application Domain: `langflow.example.com`
   - Type: Self-hosted
3. **Configure Policy**:
   - Include: Emails ending in `@yourdomain.com`
   - Require: MFA (recommended)
4. **Traefik Integration**: See [Cloudflare Access docs](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/self-hosted-apps/)

### Security Headers (Built-in)

This template includes security headers middleware by default:

```yaml
labels:
  # Security headers (already included)
  - "traefik.http.routers.langflow.middlewares=security-headers@docker"
  - "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"
  - "traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true"
  - "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"
  - "traefik.http.middlewares.security-headers.headers.frameDeny=true"
  - "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"
```

**Provides**: HSTS (1 year), XSS protection, clickjacking prevention, content-type sniffing protection

---

## 🔍 Troubleshooting

### Issue 1: Service Won't Start

**Symptoms:**
- Container restarts repeatedly
- "Unhealthy" status in Dokploy

**Solutions:**
1. **Check PostgreSQL health**:
   ```bash
   docker logs <postgres-container> | tail -50
   # Look for connection errors, disk space issues
   ```
2. **Verify database connection**:
   ```bash
   docker exec <langflow-container> env | grep DATABASE_URL
   # Should show postgresql://langflow:...@postgres:5432/langflow
   ```
3. **Check disk space**:
   ```bash
   df -h
   # Langflow needs ~5GB minimum
   ```

### Issue 2: Can't Access Web UI

**Symptoms:**
- 502 Bad Gateway or connection refused
- DNS not resolving

**Solutions:**
1. **Verify DNS propagation**:
   ```bash
   nslookup langflow.example.com
   # Should return your server IP
   ```
2. **Check Traefik logs**:
   ```bash
   docker logs <traefik-container> | grep langflow
   # Look for routing errors
   ```
3. **Verify Langflow is healthy**:
   ```bash
   docker ps | grep langflow
   # Health column should show "healthy"
   ```
4. **Test health endpoint directly**:
   ```bash
   docker exec <langflow-container> curl -f http://localhost:7860/health
   # Should return success
   ```

### Issue 3: Slow Performance

**Symptoms:**
- UI lagging
- Flow execution slow

**Solutions:**
1. **Increase workers** (if you have CPU headroom):
   ```yaml
   LANGFLOW_WORKERS: "2"  # or "4"
   ```
2. **Add resource limits** in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 4G
         cpus: "2.0"
   ```
3. **Check PostgreSQL performance**:
   ```bash
   docker exec <postgres-container> psql -U langflow -d langflow -c "SELECT pg_database_size('langflow');"
   # Large database? Consider vacuuming
   ```

### Issue 4: Database Connection Errors

**Symptoms:**
- "Connection refused" to PostgreSQL
- Langflow health check failing

**Solutions:**
1. **Verify PostgreSQL is running**:
   ```bash
   docker ps | grep postgres
   # Should show "healthy" status
   ```
2. **Check network connectivity**:
   ```bash
   docker exec <langflow-container> ping postgres
   # Should respond
   ```
3. **Verify credentials match**:
   ```bash
   # PostgreSQL password
   docker exec <postgres-container> env | grep POSTGRES_PASSWORD
   # Langflow database URL
   docker exec <langflow-container> env | grep DATABASE_URL
   # Passwords must match
   ```

### Issue 5: Flows Not Saving

**Symptoms:**
- Changes lost on refresh
- "Database error" messages

**Solutions:**
1. **Check auto-saving is enabled**:
   ```bash
   docker exec <langflow-container> env | grep LANGFLOW_AUTO_SAVING
   # Should show "true"
   ```
2. **Check PostgreSQL volume**:
   ```bash
   docker volume inspect langflow_postgres-data
   # Verify mountpoint exists
   ```
3. **Check flow volume**:
   ```bash
   docker volume inspect langflow_langflow-flows
   # Verify mountpoint exists and has space
   ```
4. **Check disk space**:
   ```bash
   df -h
   # Ensure volumes have space
   ```
5. **Review PostgreSQL logs**:
   ```bash
   docker logs <postgres-container> | grep ERROR
   ```

---

## 📊 Monitoring & Maintenance

### Health Checks

**Automated health monitoring:**
- Langflow: HTTP GET to `/health` every 30s
- PostgreSQL: `pg_isready` check every 30s

**Manual health check:**
```bash
# Langflow
curl -f https://langflow.example.com/health

# PostgreSQL
docker exec <postgres-container> pg_isready -U langflow -d langflow
```

### Backup Recommendations

**Critical data to backup:**
1. **PostgreSQL Database**: All workflows, users, configurations
2. **Langflow Config**: Application settings and secrets

**Backup procedure:**
```bash
# Stop Langflow (to ensure consistency)
docker stop <langflow-container>

# Backup PostgreSQL database
docker exec <postgres-container> pg_dump -U langflow langflow > langflow-backup-$(date +%Y%m%d).sql

# Backup Langflow config volume
docker run --rm -v langflow_langflow-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/langflow-config-$(date +%Y%m%d).tar.gz /data

# Backup flow definitions
docker run --rm -v langflow_langflow-flows:/data -v $(pwd):/backup alpine \
  tar czf /backup/langflow-flows-$(date +%Y%m%d).tar.gz /data

# Backup component cache (optional)
docker run --rm -v langflow_langflow-cache:/data -v $(pwd):/backup alpine \
  tar czf /backup/langflow-cache-$(date +%Y%m%d).tar.gz /data

# Restart Langflow
docker start <langflow-container>
```

**Restore procedure:**
```bash
# Restore PostgreSQL
docker exec -i <postgres-container> psql -U langflow langflow < langflow-backup-YYYYMMDD.sql

# Restore config volume
docker run --rm -v langflow_langflow-data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/langflow-config-YYYYMMDD.tar.gz -C /

# Restore flow definitions
docker run --rm -v langflow_langflow-flows:/data -v $(pwd):/backup alpine \
  tar xzf /backup/langflow-flows-YYYYMMDD.tar.gz -C /

# Restore component cache (optional)
docker run --rm -v langflow_langflow-cache:/data -v $(pwd):/backup alpine \
  tar xzf /backup/langflow-cache-YYYYMMDD.tar.gz -C /
```

### Resource Usage

**Expected consumption:**
- **CPU**: 10-30% idle, 50-100% during flow execution
- **RAM**: 1-2 GB idle, up to 4 GB with large flows
- **Storage**:
  - Initial: ~500 MB (images)
  - PostgreSQL: Grows with flows (~10-100 MB per complex flow)
  - Growth rate: ~100-500 MB/month (depends on usage)

### Log Monitoring

```bash
# Langflow logs
docker logs <langflow-container> -f

# PostgreSQL logs
docker logs <postgres-container> -f

# Filter for errors only
docker logs <langflow-container> 2>&1 | grep -i error

# Last 100 lines
docker logs <langflow-container> --tail 100
```

---

## 🔄 Updates & Maintenance

### Updating Langflow

**Before updating:**
1. **Backup** database and config (see Backup section)
2. **Check** release notes for breaking changes
3. **Test** in staging environment if possible

**Update procedure:**

1. **Stop current deployment** in Dokploy
2. **Update docker-compose.yml**:
   ```yaml
   image: langflowai/langflow:1.8.0  # Change version
   ```
3. **Redeploy** in Dokploy
4. **Verify** health checks pass
5. **Test** critical flows

**Version Notes:**
- **1.7.0-1.7.1**: Critical bug fix for .env file reading (security patch)
- Always check [release notes](https://github.com/langflow-ai/langflow/releases) before upgrading

**Rollback procedure** (if update fails):
1. **Stop** deployment
2. **Restore** previous `docker-compose.yml` version
3. **Restore** database backup (if schema changed)
4. **Redeploy**

### PostgreSQL Maintenance

**Vacuum database** (recommended monthly):
```bash
docker exec <postgres-container> vacuumdb -U langflow -d langflow --analyze
```

**Check database size**:
```bash
docker exec <postgres-container> psql -U langflow -d langflow -c "\l+"
```

---

## 🌐 Advanced Configuration

### Custom LLM Providers

Langflow supports these LLM providers out of the box:

| Provider | API Key Required | Setup |
|----------|------------------|-------|
| OpenAI | Yes | Add API key in flow component |
| Anthropic (Claude) | Yes | Add API key in flow component |
| Google (Gemini) | Yes | Add API key in flow component |
| Hugging Face | Optional | Some models are free |
| Local (Ollama) | No | Run Ollama separately, point to endpoint |

**Environment variable approach** (global API keys):
```yaml
# Add to Langflow service environment in docker-compose.yml
environment:
  OPENAI_API_KEY: ${OPENAI_API_KEY}
  ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
  GOOGLE_API_KEY: ${GOOGLE_API_KEY}
```

### Vector Database Integration

**Supported vector databases:**
- **Chroma** (embedded, no setup)
- **Pinecone** (cloud, API key needed)
- **Weaviate** (self-hosted or cloud)
- **Qdrant** (self-hosted or cloud)
- **FAISS** (embedded, no setup)

**Example: Self-hosted Chroma**:
```yaml
# Add to docker-compose.yml
services:
  chroma:
    image: ghcr.io/chroma-core/chroma:latest
    restart: always
    networks:
      - langflow-net
    volumes:
      - chroma-data:/chroma/chroma
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/heartbeat"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  chroma-data:
    driver: local
```

Then in Langflow flows, use `http://chroma:8000` as the endpoint.

### Scaling Workers

For **high-traffic deployments**:

```yaml
# In docker-compose.yml
environment:
  LANGFLOW_WORKERS: "4"  # Increase based on CPU cores

# Add resource limits
deploy:
  resources:
    limits:
      memory: 8G
      cpus: "4.0"
```

**Rule of thumb**: 1 worker per CPU core, max 4-8 workers.

---

## 📚 Resources

### Official Documentation
- **Langflow Docs**: https://docs.langflow.org/
- **GitHub Repository**: https://github.com/langflow-ai/langflow
- **Community Forum**: https://github.com/langflow-ai/langflow/discussions
- **Docker Hub**: https://hub.docker.com/r/langflowai/langflow

### Learning Resources
- **Getting Started Guide**: https://docs.langflow.org/get-started-installation
- **Component Library**: https://docs.langflow.org/components-overview
- **API Reference**: https://docs.langflow.org/api-reference-api-examples
- **Video Tutorials**: https://www.youtube.com/@langflow-ai

### External Services
- **OpenAI API**: https://platform.openai.com/api-keys
- **Anthropic API**: https://console.anthropic.com/
- **Pinecone**: https://www.pinecone.io/
- **Cloudflare Zero Trust**: https://developers.cloudflare.com/cloudflare-one/

---

## 📝 License

This Dokploy template is provided as-is for deploying Langflow.

**Langflow License**: [MIT License](https://github.com/langflow-ai/langflow/blob/main/LICENSE)

---

## 🤝 Support

- **Template Issues**: Open issue in this repository
- **Langflow Issues**: https://github.com/langflow-ai/langflow/issues
- **Dokploy Issues**: https://github.com/Dokploy/dokploy/issues
- **Community**: [Langflow Discord](https://discord.gg/langflow) (check GitHub for link)

---

**Maintained by**: Home Lab Infrastructure Team
**Template Version**: 2.0.0 (Langflow 1.7.1)
**Last Updated**: December 30, 2025
**Next Review**: March 2025

**Changelog:**
- **v2.0.0** (Dec 30, 2025): Updated to Langflow 1.7.1, added authentication support, security headers, flow/cache volumes
- **v1.0.0** (Dec 2024): Initial release with Langflow 1.1.1
