# AI-Context - Markdown Generator for LLM Context

**AI-Context** is a Go-based CLI tool that transforms various content sources (GitHub repositories, local codebases, YouTube transcripts, web pages) into standardized markdown format optimized for large language models (ChatGPT, Claude, Llama, Gemini).

This production-ready Dokploy template runs ai-context as a stateless web service with:
- **Cloudflare Access authentication** for secure multi-user access
- **Cloudflare R2 integration** for persistent storage of generated markdown files
- **Cloudflare Workers rate limiting** to protect the service from resource exhaustion
- **Automatic TLS/HTTPS** with Let's Encrypt certificate renewal

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Client Requests                                            │
│  (Browsers, API Clients)                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │  Cloudflare Edge            │
        │  - Rate Limiting Worker     │
        │  - DDoS Protection          │
        │  - Caching                  │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │  Traefik (Reverse Proxy)    │
        │  - TLS Termination          │
        │  - Let's Encrypt Auto-Renew │
        │  - Path Routing             │
        └────────────┬────────────────┘
                     │
    ┌────────────────┴────────────────┐
    │                                 │
    ▼                                 ▼
PUBLIC ROUTES                   PROTECTED ROUTES
(/, /static, /download)         (/generate, /clear, /sync)
    │                                 │
    │                                 ▼
    │                    ┌────────────────────────┐
    │                    │ Cloudflare Access      │
    │                    │ (Zero Trust Auth MFA)  │
    │                    └────────────┬───────────┘
    │                                 │
    └─────────────────┬───────────────┘
                      │
                      ▼
          ┌──────────────────────┐
          │  AI-Context Service  │
          │  (tanq16/ai-context) │
          │  - Markdown Gen      │
          │  - Git Processing    │
          │  - Web Scraping      │
          │  - YT Transcripts    │
          └──────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   LOCAL VOLUME           CLOUDFLARE R2
   context-data           (Auto-Sync)
   (temporary)            (Persistent)
```

## Key Features

- **Stateless Web Service**: No database, no external dependencies
- **Multi-Source Processing**: Handle GitHub repos, local code, YouTube, web pages
- **Secure Access**: Cloudflare Zero Trust authentication with MFA
- **Rate Protection**: Automatic rate limiting (100 req/hour) to prevent abuse
- **Persistent Storage**: Auto-sync outputs to Cloudflare R2
- **Private Repos**: Support for private GitHub repositories via personal access token
- **Automatic Scaling**: Horizontal scaling support via Dokploy
- **Zero Configuration**: Works with no mandatory environment variables

## Requirements

### Infrastructure
- **Dokploy** instance with Traefik running
- **Docker & Docker Compose** v2.x or higher
- **Disk Space**: 5-50GB for context volume (depending on usage)
- **CPU**: Minimal baseline, scales with concurrent processing
- **Memory**: 256MB minimum, 512MB recommended

### Cloudflare Services (Free/Paid)
- **Cloudflare Domain** with DNS pointing to your Dokploy server
- **Cloudflare Zero Trust** (Cloudflare Access) for authentication
- **Cloudflare R2** for object storage (optional, but recommended)
- **Cloudflare Workers** for rate limiting and R2 sync
- **Cloudflare API Tokens** with appropriate permissions

## Configuration

### Environment Variables Reference

| Variable | Purpose | Required | Type | Default | Example |
|----------|---------|----------|------|---------|---------|
| `DOMAIN` | Service domain | ✅ Yes | String | — | `ai-context.example.com` |
| `CF_TEAM_NAME` | Cloudflare Access team name | ✅ Yes | String | — | `mycompany` |
| `CF_ACCOUNT_ID` | Cloudflare Account ID (for R2) | ✅ Yes | String | — | `a1b2c3d4e5f6g7h8i9j0k1l2` |
| `R2_BUCKET_NAME` | R2 bucket for context storage | ❌ No | String | `ai-context` | `my-ai-context-bucket` |
| `R2_ACCESS_KEY_ID` | R2 API token access key | ❌ No | String | — | See R2 Setup below |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret | ❌ No | String | — | See R2 Setup below |
| `GH_TOKEN` | GitHub PAT for private repos | ❌ No | String | — | `ghp_xxxxxxxxxxxxxxxxxxxxxxxx` |

### Optional Configuration

**Traefik Certificate Resolver** (in template.toml):
- `letsencrypt` (default) - HTTP-01 challenge
- `cloudflare` - DNS-01 challenge (requires CF_DNS_API_TOKEN)

**Rate Limiting** (in docker-compose.yml):
- Default: 100 requests/hour per client IP
- Customizable via Traefik middleware labels

## Setup Instructions

### Step 1: Domain & DNS Configuration

1. **Add A/AAAA Record** in Cloudflare DNS:
   - Name: `ai-context`
   - Type: `A` (IPv4) or `AAAA` (IPv6)
   - Content: Your Dokploy server IP
   - Proxy Status: DNS only (grey cloud)

2. **Verify DNS Resolution**:
   ```bash
   nslookup ai-context.example.com
   # Should resolve to your Dokploy server IP
   ```

### Step 2: Cloudflare Access Setup (Zero Trust Authentication)

1. **Create Access Application**:
   - Go to Cloudflare Dashboard → Zero Trust → Applications → Access
   - Click "Create an application"
   - Select "Web"

2. **Configure Application Settings**:
   - **Application name**: `AI-Context`
   - **Subdomain**: `ai-context` (if not using custom domain)
   - **Custom domain**: `ai-context.example.com` (your domain)
   - **Path**: Leave blank or use `/` for the root application

3. **Add Policies** (Click "Add a policy"):
   - **Policy 1 - Public Access**:
     - Name: `Allow Public Routes`
     - Path: `/` (web UI)
     - Policy: Allow (unauthenticated)

   - **Policy 2 - Protected Access**:
     - Name: `Require Authentication`
     - Path: `/generate`
     - Require: Authenticated Users
     - Require: Multi-factor Authentication (MFA)
     - Approve: Users (your email domain or specific users)

4. **Get Team Name** for Configuration:
   - Go to Zero Trust → Settings → Account
   - Copy your **Cloudflare Team Domain** (looks like: `myteam.cloudflareaccess.com`)
   - Your **CF_TEAM_NAME** is `myteam` (the prefix before `.cloudflareaccess.com`)

5. **Configure Access Policies**:
   - **Organization**: Your organization (if using Cloudflare for Teams)
   - **Identity Providers**: Select how users authenticate (Google, GitHub, Microsoft, Email OTP)
   - **Device Posture**: Optional (require antivirus, etc.)

### Step 3: Cloudflare R2 Setup (Object Storage for Outputs)

#### Create R2 Bucket

1. **Create Bucket**:
   - Go to Cloudflare Dashboard → R2
   - Click "Create bucket"
   - Name: `ai-context` (or your preferred name)
   - Region: Automatic
   - Click "Create bucket"

2. **Get Account ID**:
   - View bucket details
   - Copy the **Account ID** (shown in R2 endpoint: `{ACCOUNT_ID}.r2.cloudflarestorage.com`)

#### Generate R2 API Token

1. **Create API Token**:
   - In R2 section, click "Manage R2 API Tokens"
   - Click "Create API Token"
   - Token name: `ai-context-dokploy`

2. **Set Permissions**:
   - **Permission**: Object Read & Write (or Admin)
   - **Resource**: Specific bucket → `ai-context`
   - TTL: Custom (30, 60, 90, 180, 365 days or No Expiration)

3. **Copy Credentials**:
   - **Access Key ID**: Copy to `R2_ACCESS_KEY_ID`
   - **Secret Access Key**: Copy to `R2_SECRET_ACCESS_KEY`
   - Store securely; **you can only view this once**

### Step 4: GitHub Token Setup (Optional - for Private Repos)

1. **Generate Personal Access Token**:
   - Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
   - Click "Generate new token"
   - Token name: `ai-context-dokploy`
   - Expiration: As needed (recommended: 90 days)

2. **Select Scopes**:
   - ✅ `repo` (full repository access)
   - ✅ `read:user` (read user profile)

3. **Copy Token**:
   - Store in `GH_TOKEN` environment variable
   - This allows ai-context to access private repositories

### Step 5: Dokploy Deployment

1. **Create New Application** in Dokploy:
   - Project: Your project
   - Environment: Production (or your choice)
   - Click "Use Template" or "Deploy from Repository"
   - Select `ai-context` template

2. **Configure Variables** in Dokploy:
   ```
   DOMAIN = ai-context.example.com
   CF_TEAM_NAME = myteam
   CF_ACCOUNT_ID = a1b2c3d4e5f6g7h8i9j0k1l2
   R2_BUCKET_NAME = ai-context
   R2_ACCESS_KEY_ID = [from R2 API token]
   R2_SECRET_ACCESS_KEY = [from R2 API token]
   GH_TOKEN = [optional GitHub PAT]
   ```

3. **Deploy**:
   - Review configuration
   - Click "Deploy"
   - Wait for health check to pass (30-60 seconds)

4. **Verify Deployment**:
   ```bash
   # Check service is running
   curl https://ai-context.example.com/
   # Should return HTML (web UI)

   # Verify Cloudflare Access is protecting /generate
   curl -i https://ai-context.example.com/generate
   # Should return 401 or redirect to Cloudflare Access login
   ```

### Step 6: Cloudflare Workers Deployment (Rate Limiting & R2 Sync)

#### Deploy Rate Limit Worker

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create KV Namespace**:
   ```bash
   wrangler kv:namespace create ai-context-rate-limit
   # Output: { binding = "RATE_LIMIT_KV", id = "your-namespace-id-here" }
   ```

3. **Create wrangler.toml**:
   ```toml
   name = "ai-context-rate-limit"
   main = "src/worker.js"
   compatibility_date = "2024-12-01"

   [[kv_namespaces]]
   binding = "RATE_LIMIT_KV"
   id = "your-namespace-id-here"

   [env.production]
   route = "ai-context.example.com/generate"
   zone_id = "your-cloudflare-zone-id"
   ```

4. **Deploy Worker**:
   ```bash
   wrangler deploy --env production
   ```

#### Deploy R2 Sync Worker (Optional)

1. **Create KV Namespace for Sync Metadata**:
   ```bash
   wrangler kv:namespace create ai-context-sync-meta
   ```

2. **Set Environment Secrets**:
   ```bash
   wrangler secret put R2_BUCKET_NAME --env production
   wrangler secret put R2_ACCESS_KEY_ID --env production
   wrangler secret put R2_SECRET_ACCESS_KEY --env production
   wrangler secret put CF_ACCOUNT_ID --env production
   ```

3. **Deploy R2 Sync Worker**:
   ```bash
   wrangler deploy --env production
   # Get Worker URL from output (e.g., https://ai-context-r2-sync.your-subdomain.workers.dev)
   ```

## Post-Deployment Verification

### 1. Service Health Check

```bash
# Check service is responding
curl -i https://ai-context.example.com/

# Expected response: 200 OK with HTML content
```

### 2. Cloudflare Access Authentication

```bash
# Attempt to access protected endpoint (no credentials)
curl -i https://ai-context.example.com/generate

# Expected response: 302 Redirect to Cloudflare Access login
# OR: 401 Unauthorized (Access policy blocking)
```

### 3. Rate Limiting

```bash
# Test rate limiting headers
curl -i https://ai-context.example.com/generate \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected headers in response:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: [ISO timestamp]
```

### 4. TLS Certificate Verification

```bash
# Check certificate details
openssl s_client -connect ai-context.example.com:443

# Expected: Valid Let's Encrypt certificate
# Subject CN: ai-context.example.com
```

### 5. R2 Bucket Connectivity (Optional)

```bash
# Verify bucket is accessible
aws s3 ls s3://ai-context/ \
  --endpoint-url https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com \
  --region auto

# Expected: Empty output (no files yet) or file listing
```

### 6. Service Logs

```bash
# Check docker-compose logs
docker compose -f blueprints/ai-context/docker-compose.yml logs -f ai-context

# Expected: No errors, service responding to requests
```

## Usage Examples

### Generate Markdown from GitHub Repository

```bash
curl -X POST https://ai-context.example.com/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CF_ACCESS_TOKEN" \
  -d '{
    "URL": "https://github.com/tanq16/ai-context",
    "Ignore": ["node_modules", ".git", "dist"]
  }'
```

### Generate from Local Directory

```bash
curl -X POST https://ai-context.example.com/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CF_ACCESS_TOKEN" \
  -d '{
    "URL": "/path/to/local/directory",
    "Ignore": ["node_modules", "dist"]
  }'
```

### Generate from YouTube Transcript

```bash
curl -X POST https://ai-context.example.com/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CF_ACCESS_TOKEN" \
  -d '{
    "URL": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

### Download Generated Content

```bash
# Download as markdown file
curl -O https://ai-context.example.com/download \
  -H "Authorization: Bearer $CF_ACCESS_TOKEN" \
  -o context.md

# Download as ZIP archive
curl -O "https://ai-context.example.com/download?format=zip" \
  -H "Authorization: Bearer $CF_ACCESS_TOKEN" \
  -o context.zip
```

## Troubleshooting

### Service Won't Start

**Symptom**: `docker compose ps` shows container status as `Exited` or `Restarting`

**Diagnosis**:
```bash
docker compose logs ai-context
# Look for error messages about image pull or port conflicts
```

**Solutions**:
- **Image Pull Failure**: Check internet connectivity, verify `tanq16/ai-context:main` is publicly available
- **Port Already Bound**: Verify port 8080 is not in use: `lsof -i :8080`
- **Insufficient Memory**: Check available RAM: `free -h`

---

### 502 Bad Gateway Error

**Symptom**: HTTPS requests return `502 Bad Gateway`

**Diagnosis**:
- Health check is failing
- Service is not responding on port 8080

**Solutions**:
```bash
# Check container health
docker compose exec ai-context curl http://localhost:8080/

# Check Traefik logs
docker logs traefik | grep ai-context

# Increase health check timeout
# Edit docker-compose.yml:
# healthcheck:
#   timeout: 20s  # increased from 10s
#   retries: 5    # increased from 3
```

---

### Cloudflare Access Shows 401/Forbidden

**Symptom**: Users see "401 Unauthorized" or "You don't have access" after Cloudflare Access login

**Diagnosis**:
- CF_TEAM_NAME is incorrect
- Access policy is not configured properly
- User is not in the allowed group

**Solutions**:
1. Verify CF_TEAM_NAME is correct (prefix before `.cloudflareaccess.com`)
2. Check Access application is configured for correct domain
3. Add user email to Access policy approvals
4. Verify MFA is enabled for user account

---

### R2 Sync Not Working

**Symptom**: Files not appearing in R2 bucket after generation

**Diagnosis**:
```bash
# Check Worker logs in Cloudflare Dashboard
# Check R2 bucket exists and is accessible
aws s3 ls s3://ai-context/ \
  --endpoint-url https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com
```

**Solutions**:
- Verify R2 credentials are correct (Access Key ID, Secret)
- Verify R2 bucket name matches in template
- Check Worker is deployed and triggering
- Check R2 API token has correct permissions (Object Read & Write)

---

### Rate Limiting Not Working

**Symptom**: `X-RateLimit-*` headers not appearing in response

**Diagnosis**:
- Rate limit Worker is not deployed
- Worker routing not configured for `/generate` path

**Solutions**:
1. Verify Worker is deployed: `wrangler deployments list`
2. Check Worker routing in wrangler.toml includes `route = "ai-context.example.com/generate"`
3. Verify KV namespace is bound: `wrangler kv:namespace list`

---

### High Memory Usage

**Symptom**: Service consuming excessive memory (>1GB)

**Causes**:
- Processing very large repositories (>1GB codebases)
- Concurrent requests with heavy content
- Memory leak in ai-context binary

**Solutions**:
1. Increase memory reservation in docker-compose.yml:
   ```yaml
   mem_limit: 1g
   memswap_limit: 2g
   ```

2. Limit concurrent processing:
   - Reduce concurrent requests via rate limiting
   - Process smaller repositories in batches

3. Clear context directory periodically:
   ```bash
   docker compose exec ai-context rm -rf /app/context/*
   ```

---

### Transcripts or Web Content Not Processing

**Symptom**: YouTube transcripts or webpage content returns empty markdown

**Causes**:
- External service is blocking requests
- Content format is not supported
- JavaScript-rendered content requires special handling

**Solutions**:
1. Test with simpler content first (public GitHub repos)
2. Check if external service requires authentication
3. Verify internet connectivity from container
4. Check logs for specific error messages

---

## Advanced Configuration

### GH_TOKEN Rotation (Optional)

For enhanced security, rotate GitHub tokens automatically:

```bash
# Install GitHub CLI
brew install gh  # macOS
# or
apt-get install gh  # Linux

# Authenticate
gh auth login

# Set up renewal reminder (manual, or use cron job)
# Store token in secure location (not in docker-compose.yml)

# Rotate token:
gh auth refresh --scopes repo,read:user
```

Consider using GitHub App tokens instead of Personal Access Tokens for better security.

### Custom Domain Paths

Route ai-context to a subpath instead of subdomain:

```yaml
# In docker-compose.yml Traefik labels:
- "traefik.http.routers.ai-context.rule=Host(`example.com`) && PathPrefix(`/ai-context`)"
```

### Ephemeral Context Mode

For sensitive data, clear context files after download:

```bash
# Add health check that clears old files
docker compose exec ai-context \
  find /app/context -mtime +7 -delete  # Remove files older than 7 days
```

## Security Notes

### Built-In Authentication

AI-Context has **no built-in authentication**. This template is **NOT SECURE** without Cloudflare Access.

**Critical**: Always enable Cloudflare Access before exposing to internet.

### Secret Management

- ✅ Use Dokploy environment variables for secrets
- ✅ Store in vault (Hashicorp, 1Password, etc.)
- ❌ Never hardcode in docker-compose.yml
- ❌ Never commit GH_TOKEN to git
- ❌ Never expose R2 credentials in logs

### Network Isolation

- Internal volume: `/app/context` (only accessible from container)
- R2 bucket: Private by default (configure public access with caution)
- Traefik: TLS only for all connections
- Cloudflare Access: Enforces MFA for protected endpoints

### Data Privacy

Generated markdown files contain:
- Source code contents (from repositories)
- YouTube transcript text
- Webpage text and images (if scraping)

**Ensure compliance with**:
- GDPR (for European users)
- Copyright (for content scraping)
- Terms of Service (for third-party content)

## Resource Requirements

### Minimum
- CPU: 2 cores (shared)
- RAM: 256MB
- Storage: 5GB
- Network: 1 Mbps (sufficient for small repos)

### Recommended
- CPU: 4 cores (dedicated or reserved)
- RAM: 512MB - 1GB
- Storage: 20-50GB
- Network: 10-100 Mbps (for large repos and video transcripts)

### Cloudflare Quotas

- **R2**: 10 GB free per month, $0.015/GB thereafter
- **Workers**: 100,000 free requests/day, $0.50 per 1M additional
- **Zero Trust Access**: Free for up to 50 users
- **KV**: 100,000 free writes/day, $0.50 per 1M additional

## Support & Documentation

- **AI-Context GitHub**: https://github.com/tanq16/ai-context
- **Dokploy Documentation**: https://dokploy.com
- **Cloudflare Zero Trust**: https://developers.cloudflare.com/cloudflare-one/
- **Cloudflare R2**: https://developers.cloudflare.com/r2/
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/

## License

AI-Context: Original project by tanq16 (check repository for license)
This Dokploy template: Same license as parent Dokploy project
