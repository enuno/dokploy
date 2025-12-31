# OpenRAG

OpenRAG is a comprehensive Retrieval-Augmented Generation (RAG) platform that enables intelligent document search and AI-powered conversations. Upload, process, and query documents via a chat interface powered by LLMs and semantic search.

## Overview

OpenRAG integrates three core technologies into a unified platform:

- **Langflow** - Low-code AI workflow orchestration for document ingestion and retrieval pipelines
- **OpenSearch** - Distributed search and analytics engine with vector database capabilities
- **Docling** - Advanced document processing and conversion engine

This production-ready Dokploy template features:

- ✅ **Cloudflare R2 integration** for scalable object storage
- ✅ **Automatic SSL with Cloudflare DNS-01 challenge** (wildcard certificates)
- ✅ **Zero Trust access protection** for admin panels (Langflow, OpenSearch Dashboards)
- ✅ **Production-grade health checks** and dependency management
- ✅ **Multi-AI provider support** (OpenAI, Anthropic, IBM WatsonX, Ollama)
- ✅ **OAuth integration** (Google Drive, Microsoft SharePoint/OneDrive)
- ✅ **Observability** with Langfuse LLM tracing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│              https://your-domain.com:3000                    │
│                    [Public Access]                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend (Starlette API)                       │
│                    [Internal Only]                           │
└───────┬──────────────────────────────────┬──────────────────┘
        │                                  │
        ▼                                  ▼
┌──────────────────┐            ┌─────────────────────────────┐
│     Langflow     │◀───────────│       OpenSearch            │
│   (Port 7860)    │            │    (Ports 9200, 9600)       │
│ [Zero Trust]     │            │      [Internal Only]        │
└──────────────────┘            └─────────────┬───────────────┘
        │                                     │
        │                                     ▼
        │                         ┌──────────────────────────┐
        │                         │ OpenSearch Dashboards    │
        │                         │     (Port 5601)          │
        │                         │    [Zero Trust]          │
        │                         └──────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│                  Cloudflare R2 Storage                        │
│         (Documents, Uploads, Processed Files)                 │
└──────────────────────────────────────────────────────────────┘

External Services:
- OpenAI / Anthropic / IBM WatsonX / Ollama (AI Models)
- Google Drive / Microsoft OneDrive (OAuth, optional)
- Langfuse (LLM Observability, optional)
```

### Service Communication

- **Frontend** → Backend API (http://backend:8000)
- **Backend** → Langflow (http://langflow:7860)
- **Backend** → OpenSearch (http://opensearch:9200)
- **Backend** → Cloudflare R2 (S3-compatible API)
- **Langflow** → OpenSearch (http://opensearch:9200)
- **Dashboards** → OpenSearch (https://opensearch:9200)

### Public Access URLs

- `https://your-domain.com` - Frontend (public)
- `https://langflow.your-domain.com` - Langflow UI (Zero Trust protected)
- `https://dashboards.your-domain.com` - OpenSearch Dashboards (Zero Trust protected)

## Requirements

### System Resources

| Component | CPU | Memory | Storage |
|-----------|-----|--------|---------|
| OpenSearch | 1 core | 1-2 GB | 10+ GB (indices) |
| Langflow | 0.5 core | 512 MB | 1 GB (flows/cache) |
| Backend | 0.5 core | 512 MB | 5+ GB (documents) |
| Frontend | 0.25 core | 256 MB | 500 MB |
| Dashboards | 0.25 core | 256 MB | 100 MB |
| **Total** | **2.5+ cores** | **3+ GB** | **17+ GB** |

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Dokploy (for deployment)
- Cloudflare account with R2 enabled
- At least one AI provider API key:
  - OpenAI API key, OR
  - Anthropic API key, OR
  - IBM WatsonX credentials, OR
  - Ollama endpoint (self-hosted)

## Configuration

### Required Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `DOMAIN` | `openrag.example.com` | Your domain name |
| `OPENSEARCH_PASSWORD` | (auto-generated) | OpenSearch admin password (8+ chars, mixed case, digits, special chars) |
| `LANGFLOW_SUPERUSER` | `admin` | Langflow admin username |
| `LANGFLOW_SUPERUSER_PASSWORD` | (auto-generated) | Langflow admin password |
| `LANGFLOW_SECRET_KEY` | (auto-generated) | Langflow API authentication key |
| `R2_BUCKET_NAME` | `openrag-storage` | Cloudflare R2 bucket name |
| `R2_ACCESS_KEY_ID` | `abc123...` | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | `xyz789...` | R2 API secret key |
| `CF_ACCOUNT_ID` | `abc123def456` | Cloudflare account ID |
| `CF_DNS_API_TOKEN` | `token_here` | Cloudflare DNS API token (for wildcard SSL) |
| `CF_TEAM_NAME` | `my-team` | Cloudflare Zero Trust team name |

### AI Provider Configuration

**Choose at least ONE AI provider:**

#### Option 1: OpenAI (Recommended)
```env
LLM_PROVIDER=openai
LLM_MODEL=gpt-4
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
OPENAI_API_KEY=sk-...
```

#### Option 2: Anthropic
```env
LLM_PROVIDER=anthropic
LLM_MODEL=claude-3-sonnet-20240229
EMBEDDING_PROVIDER=openai  # Anthropic doesn't provide embeddings
EMBEDDING_MODEL=text-embedding-3-small
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...  # Still needed for embeddings
```

#### Option 3: IBM WatsonX
```env
LLM_PROVIDER=watsonx
LLM_MODEL=ibm/granite-13b-chat-v2
EMBEDDING_PROVIDER=watsonx
EMBEDDING_MODEL=ibm/slate-125m-english-rtrvr
WATSONX_API_KEY=your_api_key
WATSONX_ENDPOINT=https://us-south.ml.cloud.ibm.com
WATSONX_PROJECT_ID=your_project_id
```

#### Option 4: Ollama (Self-Hosted)
```env
LLM_PROVIDER=ollama
LLM_MODEL=llama2
EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL=llama2
OLLAMA_ENDPOINT=http://your-ollama-server:11434
```

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LANGFLOW_CHAT_FLOW_ID` | Langflow chat pipeline ID | (empty) |
| `LANGFLOW_INGEST_FLOW_ID` | Document ingestion pipeline ID | (empty) |
| `LANGFLOW_URL_INGEST_FLOW_ID` | URL ingestion pipeline ID | (empty) |
| `NUDGES_FLOW_ID` | AI nudges/suggestions pipeline ID | (empty) |
| `GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID | (empty) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret | (empty) |
| `MICROSOFT_GRAPH_OAUTH_CLIENT_ID` | Microsoft OAuth client ID | (empty) |
| `MICROSOFT_GRAPH_OAUTH_CLIENT_SECRET` | Microsoft OAuth client secret | (empty) |
| `LANGFUSE_SECRET_KEY` | Langfuse secret key | (empty) |
| `LANGFUSE_PUBLIC_KEY` | Langfuse public key | (empty) |
| `LANGFUSE_HOST` | Langfuse host URL | (empty) |
| `WEBHOOK_BASE_URL` | External webhook base URL | (empty) |

## Cloudflare Configuration

This template uses Cloudflare services for production-grade features.

### R2 Object Storage (Required)

OpenRAG stores uploaded documents, processed files, and media in Cloudflare R2.

#### 1. Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 → Overview
2. Click **"Create bucket"**
3. Name: `openrag-storage` (or your preferred name)
4. Region: **Automatic**
5. Click **"Create bucket"**

#### 2. Generate R2 API Tokens

1. Go to R2 → Overview → **"Manage R2 API Tokens"**
2. Click **"Create API token"**
3. Token name: `openrag-token`
4. Permissions: **"Object Read & Write"**
5. (Optional) Restrict to specific bucket: `openrag-storage`
6. Click **"Create API token"**
7. **Copy the Access Key ID and Secret Access Key** (shown only once)

#### 3. Get Cloudflare Account ID

1. Go to Cloudflare Dashboard
2. In the URL, find your account ID: `dash.cloudflare.com/<ACCOUNT_ID>/r2`
3. Copy the account ID

#### 4. Configure in Dokploy

Set these environment variables:

```env
R2_BUCKET_NAME=openrag-storage
R2_ACCESS_KEY_ID=<Access Key ID from step 2>
R2_SECRET_ACCESS_KEY=<Secret Access Key from step 2>
CF_ACCOUNT_ID=<Account ID from step 3>
```

### DNS-01 Challenge for SSL (Required)

For wildcard certificates (`*.your-domain.com`), configure Cloudflare DNS challenge:

#### 1. Create DNS API Token

1. Cloudflare Dashboard → Profile → **API Tokens**
2. Click **"Create Token"**
3. Use template: **"Edit zone DNS"**
4. Permissions:
   - Zone → DNS → Edit
5. Zone Resources:
   - Include → Specific zone → `your-domain.com`
6. Click **"Continue to summary"** → **"Create Token"**
7. **Copy the API token** (shown only once)

#### 2. Configure in Dokploy

```env
CF_DNS_API_TOKEN=<API token from step 1>
```

### Zero Trust Access (Required)

Protect admin UIs (Langflow, OpenSearch Dashboards) with Cloudflare Access:

#### 1. Set Up Cloudflare Access

1. Cloudflare Dashboard → **Zero Trust** → Access → Applications
2. Click **"Add an application"** → **"Self-hosted"**

**For Langflow:**
3. Application name: `OpenRAG Langflow`
4. Application URL: `https://langflow.your-domain.com`
5. Configure identity providers (Google, GitHub, Email, etc.)
6. Create Access Policy:
   - Name: `Allow Admins`
   - Action: **Allow**
   - Include: Emails ending in `@your-company.com` (or your criteria)
7. Click **"Save application"**

**For OpenSearch Dashboards:**
8. Repeat steps 2-7 with:
   - Application name: `OpenRAG Dashboards`
   - Application URL: `https://dashboards.your-domain.com`

#### 2. Get Team Name

1. Cloudflare Dashboard → Zero Trust
2. In the URL, find your team name: `<TEAM_NAME>.cloudflareaccess.com`
3. Copy the team name

#### 3. Configure in Dokploy

```env
CF_TEAM_NAME=<Team name from step 2>
```

### CORS Configuration (Optional)

If enabling direct browser uploads to R2:

1. Go to R2 bucket → Settings → CORS Policy
2. Add this configuration:

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

## Deployment

### Via Dokploy

1. **Add Template** in Dokploy:
   - Navigate to Templates
   - Click "Add Template"
   - Select "OpenRAG" from the template list

2. **Configure Variables**:
   - Set your domain
   - Configure Cloudflare R2 credentials
   - Set Cloudflare DNS API token
   - Set Cloudflare Zero Trust team name
   - Choose AI provider and set API key
   - (Optional) Configure OAuth credentials

3. **Deploy**:
   - Click "Deploy"
   - Wait for all services to build and start
   - Monitor health checks in Dokploy dashboard

### Via Docker Compose (Manual)

```bash
# Clone repository
git clone https://github.com/langflow-ai/openrag.git
cd openrag

# Create .env file with all required variables
cp .env.example .env
nano .env  # Configure all variables

# Deploy
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

## Post-Deployment Steps

### 1. Access Frontend

Visit `https://your-domain.com` to access the OpenRAG frontend.

### 2. Configure Langflow Workflows

1. Visit `https://langflow.your-domain.com`
2. Login with your Cloudflare Zero Trust credentials
3. Create or import AI workflows:
   - **Chat Flow**: Document Q&A pipeline
   - **Ingest Flow**: Document processing pipeline
   - **URL Ingest Flow**: Web page ingestion
   - **Nudges Flow**: AI-powered suggestions

4. Copy flow IDs and set in environment:
   ```env
   LANGFLOW_CHAT_FLOW_ID=<chat-flow-id>
   LANGFLOW_INGEST_FLOW_ID=<ingest-flow-id>
   LANGFLOW_URL_INGEST_FLOW_ID=<url-ingest-flow-id>
   NUDGES_FLOW_ID=<nudges-flow-id>
   ```

5. Restart backend service to load flow IDs

### 3. Monitor via OpenSearch Dashboards

1. Visit `https://dashboards.your-domain.com`
2. Login with your Cloudflare Zero Trust credentials
3. Create index patterns for document monitoring
4. Set up visualizations for search analytics

### 4. Upload Test Documents

1. In the frontend, click "Upload Documents"
2. Upload a test PDF, DOCX, or TXT file
3. Wait for processing (check backend logs)
4. Query the document via chat interface

### 5. Configure OAuth (Optional)

#### Google Drive Integration

1. Create OAuth credentials in Google Cloud Console
2. Set authorized redirect URIs
3. Configure environment variables:
   ```env
   GOOGLE_OAUTH_CLIENT_ID=<your-client-id>
   GOOGLE_OAUTH_CLIENT_SECRET=<your-client-secret>
   ```

#### Microsoft SharePoint/OneDrive

1. Register app in Azure Portal
2. Configure permissions (Files.Read.All, Sites.Read.All)
3. Set environment variables:
   ```env
   MICROSOFT_GRAPH_OAUTH_CLIENT_ID=<your-client-id>
   MICROSOFT_GRAPH_OAUTH_CLIENT_SECRET=<your-client-secret>
   ```

## Troubleshooting

### Issue 1: Services Failing to Start

**Symptom**: Services crash or restart repeatedly

**Diagnosis**:
```bash
docker compose logs <service-name>
```

**Common Causes**:
- Insufficient memory (OpenSearch needs 1-2GB)
- Missing environment variables
- Health check failures

**Solution**:
```bash
# Check memory usage
docker stats

# Increase memory allocation
# Edit docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 2G
```

### Issue 2: OpenSearch Won't Start

**Symptom**: `opensearch` service unhealthy

**Common Causes**:
- Weak password (must be 8+ chars, mixed case, digits, special chars)
- Insufficient memory
- Port conflicts (9200, 9600)

**Solution**:
```bash
# Check OpenSearch logs
docker compose logs opensearch

# Ensure password meets complexity requirements
# Check available memory
free -h

# Check port conflicts
netstat -tulpn | grep 9200
```

### Issue 3: Can't Access Frontend

**Symptom**: 404 or 502 errors when visiting domain

**Diagnosis**:
```bash
# Check frontend logs
docker compose logs frontend

# Check Traefik routing
docker logs dokploy-traefik-1

# Verify DNS
dig your-domain.com
```

**Solutions**:
- Ensure DNS points to your server IP
- Wait for Cloudflare DNS propagation (up to 5 minutes)
- Check Traefik labels in docker-compose.yml
- Verify frontend container is healthy

### Issue 4: Langflow/Dashboards Zero Trust Not Working

**Symptom**: Can access admin UIs without authentication

**Common Causes**:
- CF_TEAM_NAME not set or incorrect
- Cloudflare Access application not configured
- Middleware not applied

**Solution**:
```bash
# Verify environment variable
docker compose config | grep CF_TEAM_NAME

# Check Traefik middleware
docker compose logs | grep middleware

# Ensure Cloudflare Access applications are created
# Visit Cloudflare Dashboard > Zero Trust > Access
```

### Issue 5: Document Upload Fails

**Symptom**: Files upload but processing fails

**Common Causes**:
- R2 credentials incorrect
- R2 bucket doesn't exist
- CORS not configured (for browser uploads)

**Solution**:
```bash
# Check backend logs
docker compose logs backend | grep -i s3

# Verify R2 credentials
# Test R2 connection:
docker compose exec backend python -c "import boto3; s3=boto3.client('s3', endpoint_url='https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com', aws_access_key_id='${R2_ACCESS_KEY_ID}', aws_secret_access_key='${R2_SECRET_ACCESS_KEY}'); print(s3.list_buckets())"
```

### Issue 6: AI Responses Not Working

**Symptom**: Chat works but AI doesn't respond

**Common Causes**:
- Missing AI provider API key
- Invalid API key
- LLM_PROVIDER not set correctly
- Langflow flows not configured

**Solution**:
```bash
# Check backend logs
docker compose logs backend | grep -i "openai\|anthropic\|watsonx"

# Verify API key is set
docker compose config | grep OPENAI_API_KEY

# Test API key manually
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer ${OPENAI_API_KEY}"

# Ensure Langflow flow IDs are set
docker compose config | grep FLOW_ID
```

### Issue 7: High Memory Usage

**Symptom**: Server running out of memory

**Solutions**:

1. **Reduce OpenSearch memory**:
```yaml
# Edit docker-compose.yml
environment:
  OPENSEARCH_JAVA_OPTS: "-Xms256m -Xmx512m"  # Reduce from 512m/512m
```

2. **Limit container resources**:
```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: "0.5"
```

3. **Use swap** (if available):
```bash
sudo swapon --show
```

## Backup & Restore

### Backup Strategy

#### 1. OpenSearch Data

```bash
# Create snapshot repository (one-time setup)
curl -X PUT "http://localhost:9200/_snapshot/backup_repo" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/opensearch/backup"
  }
}'

# Create snapshot
curl -X PUT "http://localhost:9200/_snapshot/backup_repo/snapshot_$(date +%Y%m%d)" -H 'Content-Type: application/json' -d'
{
  "indices": "*",
  "ignore_unavailable": true,
  "include_global_state": false
}'

# Or use volume backup
docker run --rm \
  -v openrag_opensearch-data:/source:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/opensearch-$(date +%Y%m%d).tar.gz -C /source .
```

#### 2. Langflow Flows

```bash
# Backup flows volume
docker run --rm \
  -v openrag_langflow-flows:/source:ro \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/langflow-flows-$(date +%Y%m%d).tar.gz -C /source .
```

#### 3. Documents in R2

Documents are automatically stored in Cloudflare R2 with built-in redundancy. For additional backup:

```bash
# Use rclone or s3cmd to sync R2 bucket
rclone sync cloudflare-r2:openrag-storage ./local-backup
```

### Restore Procedure

#### 1. Restore OpenSearch Data

```bash
# Stop OpenSearch
docker compose stop opensearch

# Restore volume
docker run --rm \
  -v openrag_opensearch-data:/target \
  -v $(pwd)/backups:/backup \
  alpine sh -c "cd /target && tar xzf /backup/opensearch-20240101.tar.gz"

# Start OpenSearch
docker compose start opensearch
```

#### 2. Restore Langflow Flows

```bash
docker run --rm \
  -v openrag_langflow-flows:/target \
  -v $(pwd)/backups:/backup \
  alpine sh -c "cd /target && tar xzf /backup/langflow-flows-20240101.tar.gz"

docker compose restart langflow
```

## Performance Optimization

### 1. OpenSearch Tuning

```yaml
# docker-compose.yml - OpenSearch service
environment:
  # Increase memory for better performance
  OPENSEARCH_JAVA_OPTS: "-Xms1g -Xmx1g"

  # Disable memory lock if running into issues
  bootstrap.memory_lock: "false"
```

### 2. Langflow Optimization

```env
# Increase timeouts for large documents
LANGFLOW_TIMEOUT=3600
LANGFLOW_CONNECT_TIMEOUT=60
```

### 3. Backend Scaling

```yaml
# Run multiple backend replicas (requires load balancer)
deploy:
  replicas: 3
```

### 4. R2 Optimization

- Enable R2 caching for frequently accessed files
- Use Cloudflare CDN for public assets
- Consider R2 lifecycle policies for old documents

## Security Considerations

1. **Change Default Passwords**: Always change auto-generated passwords
2. **Restrict Zero Trust Access**: Limit access to trusted emails/domains
3. **API Key Rotation**: Rotate AI provider API keys regularly
4. **Monitor Access Logs**: Review Cloudflare Access logs monthly
5. **Backup Encryption**: Encrypt backups before storing
6. **Network Isolation**: Ensure OpenSearch is not externally accessible
7. **Regular Updates**: Update Docker images monthly

## Cost Estimation

### Cloudflare R2 Costs

- **Storage**: $0.015/GB-month
- **Class A operations (write)**: $4.50/million
- **Class B operations (read)**: $0.36/million
- **Egress**: **FREE** (no data transfer fees)

**Example**: 100GB storage + 1M writes + 10M reads/month = **~$10/month**

### AI Provider Costs

- **OpenAI GPT-4**: ~$30/1M input tokens, ~$60/1M output tokens
- **Anthropic Claude**: ~$15/1M input tokens, ~$75/1M output tokens
- **WatsonX**: Varies by model
- **Ollama**: Self-hosted (free, but requires GPU server)

**Example**: 1M tokens/month (mixed) ≈ **$30-50/month**

### Total Estimated Monthly Cost

- **Compute**: $10-50 (depending on server/VPS)
- **Cloudflare R2**: $10-20
- **AI Provider**: $30-100
- **Total**: **$50-170/month**

## Links

- **Official Documentation**: https://docs.openr.ag
- **GitHub Repository**: https://github.com/langflow-ai/openrag
- **Langflow Docs**: https://docs.langflow.org
- **OpenSearch Docs**: https://opensearch.org/docs
- **Cloudflare R2**: https://developers.cloudflare.com/r2
- **Cloudflare Zero Trust**: https://developers.cloudflare.com/cloudflare-one

## License

OpenRAG is licensed under the Apache License 2.0. See the [LICENSE](https://github.com/langflow-ai/openrag/blob/main/LICENSE) file for details.

## Support

- **Issues**: https://github.com/langflow-ai/openrag/issues
- **Discussions**: https://github.com/langflow-ai/openrag/discussions
- **Dokploy Support**: https://discord.gg/dokploy
