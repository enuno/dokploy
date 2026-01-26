# Browserless - Headless Browser Automation

Deploy a production-ready headless Chromium browser automation service with Puppeteer and Playwright support, optimized for Dokploy with optional Cloudflare R2 storage.

## Overview

Browserless is a managed browser automation service that runs headless Chromium in Docker containers, enabling you to execute Puppeteer and Playwright scripts against remote browser instances without managing the underlying infrastructure.

**Production-ready features:**

- 🚀 **Headless Chromium 134.0.6998.35** - Latest stable browser
- 🎭 **Puppeteer & Playwright support** - Compatible with both automation frameworks
- 🔒 **Token authentication** - Secure API access
- ☁️ **Cloudflare R2 integration** - Store screenshots, PDFs, and downloads
- 📊 **Configurable concurrency** - Scale based on resources
- 🔄 **Automatic SSL** - Let's Encrypt via Traefik
- 💪 **Health checks** - Production-grade monitoring
- 📝 **Interactive API docs** - Built-in documentation at /docs

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   User / Client                           │
│              (Puppeteer, Playwright)                      │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS/WSS
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  Traefik Router                           │
│               (SSL/TLS, WebSocket)                        │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│             Browserless Service                           │
│       (Chromium 134 + Puppeteer + Playwright)            │
│                                                           │
│  • Port 3000 (HTTP/WebSocket API)                        │
│  • TOKEN authentication                                  │
│  • Configurable concurrency                              │
│  • Session management                                    │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ├──▶ Cloudflare R2 (Optional)
                       │     - Screenshots
                       │     - PDFs
                       │     - Downloads
                       │
                       └──▶ Named Volume (Fallback)
                             /downloads (local storage)
```

## Features

### Browser Automation Capabilities

- **Puppeteer-core 24.4.0** - Full Puppeteer API support
- **Playwright-core 1.47.2 - 1.51.1** - Multi-browser automation
- **WebSocket & HTTP REST API** - Flexible integration
- **Screenshot generation** - PNG, JPEG with configurable quality
- **PDF generation** - From web pages with custom options
- **Session management** - Persistent browser sessions
- **Cookie & localStorage** - State persistence across requests

### Deployment Features

- **Single-container deployment** - No dependencies required
- **Automatic SSL certificates** - Via Let's Encrypt
- **WebSocket support** - Seamless Traefik upgrade
- **Health monitoring** - `/docs` endpoint health check
- **Configurable resources** - CPU/memory limits
- **Production logging** - Structured JSON logs

## Requirements

### System Resources

- **CPU**: 2+ cores (4 cores recommended for 10+ concurrent sessions)
- **RAM**: 2GB minimum (4GB recommended)
  - Formula: `(concurrent sessions × 500MB) + 1GB base`
  - Example: 10 concurrent = 6GB RAM
- **Disk**: 1GB for browser binaries + storage for downloads

### Network

- **Domain name** - For Traefik routing
- **HTTPS access** - Automatic via Let's Encrypt

### Optional: Cloudflare R2

- **Cloudflare account** with R2 enabled
- **R2 API tokens** (Object Read & Write permission)
- **R2 bucket** for artifact storage

## Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Your domain for Browserless | `browser.example.com` |
| `TOKEN` | Authentication token for API access | Auto-generated 48-char password |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CONCURRENT` | `10` | Maximum concurrent browser sessions |
| `MAX_QUEUE_LENGTH` | `100` | Maximum queued requests |
| `TIMEOUT` | `30000` | Session timeout (milliseconds) |
| `PREBOOT_CHROME` | `true` | Pre-boot Chrome instances for faster startup |

### Cloudflare R2 Storage (Optional)

Configure these variables to store browser-generated artifacts in Cloudflare R2:

| Variable | Required | Description |
|----------|----------|-------------|
| `S3_ENDPOINT` | Yes | R2 endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `S3_BUCKET` | Yes | R2 bucket name (e.g., `browserless-artifacts`) |
| `S3_ACCESS_KEY_ID` | Yes | R2 API token access key ID |
| `S3_SECRET_ACCESS_KEY` | Yes | R2 API token secret access key |
| `S3_REGION` | No | Set to `auto` for R2 |
| `S3_USE_PATH_STYLE` | No | Set to `true` for R2 compatibility |

## Cloudflare R2 Setup Guide

### Why Use Cloudflare R2?

Browserless generates files (screenshots, PDFs, downloads) that should be stored durably. Cloudflare R2 provides:

- ✅ **99.999999999% durability** - Never lose your automation artifacts
- ✅ **S3-compatible API** - Works with existing tools
- ✅ **CDN distribution** - Fast global access to generated files
- ✅ **Cost-effective** - $0.015/GB storage, $0/GB egress
- ✅ **No disk constraints** - Unlimited storage scaling

### Step 1: Create R2 Bucket

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the left sidebar
3. Click **"Create bucket"**
4. Enter bucket name: `browserless-artifacts` (or your choice)
5. Select **Region**: Automatic
6. Click **"Create bucket"**

### Step 2: Generate R2 API Tokens

1. In R2 dashboard, click **"Manage R2 API Tokens"**
2. Click **"Create API token"**
3. Configure token:
   - **Token name**: `browserless-dokploy`
   - **Permissions**: Object Read & Write
   - **TTL**: Never expire (or set expiry as needed)
4. Click **"Create API Token"**
5. **Copy and save** (shown only once):
   - Access Key ID
   - Secret Access Key

### Step 3: Get Account ID

1. In Cloudflare Dashboard, click on any R2 bucket
2. Copy your **Account ID** from the URL:
   - URL format: `https://dash.cloudflare.com/<ACCOUNT_ID>/r2/...`
   - Or find it in **Account** → **Account ID**

### Step 4: Configure in Dokploy

When deploying in Dokploy, set these environment variables:

```
S3_ENDPOINT = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_BUCKET = browserless-artifacts
S3_ACCESS_KEY_ID = <YOUR_ACCESS_KEY_ID>
S3_SECRET_ACCESS_KEY = <YOUR_SECRET_ACCESS_KEY>
S3_REGION = auto
S3_USE_PATH_STYLE = true
```

### R2 Bucket Security (Optional)

Set bucket to **private** (default) and use signed URLs for artifact access:

```javascript
// Example: Generate signed URL for screenshot
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const command = new GetObjectCommand({
  Bucket: process.env.S3_BUCKET,
  Key: "screenshots/example.png",
});

const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
// url valid for 1 hour
```

## Deployment

### 1. Deploy with Dokploy

1. In Dokploy dashboard, navigate to **Templates**
2. Search for **"Browserless"**
3. Click **"Deploy"**
4. Configure required variables:
   - **Domain**: Your subdomain (e.g., `browser.example.com`)
   - **Token**: Auto-generated (or customize)
   - **Concurrent**: Number of sessions (default: 10)
5. **(Optional)** Configure Cloudflare R2:
   - Set R2 endpoint, bucket, and credentials
6. Click **"Deploy"**

### 2. Verify Deployment

Wait for deployment to complete (~60 seconds for Chromium initialization):

```bash
# Check service health
curl https://browser.example.com/docs

# Expected: HTML response with API documentation
```

### 3. Test Browser Automation

**Using Puppeteer:**

```javascript
const puppeteer = require('puppeteer-core');

const browser = await puppeteer.connect({
  browserWSEndpoint: 'wss://browser.example.com?token=YOUR_TOKEN'
});

const page = await browser.newPage();
await page.goto('https://example.com');
const screenshot = await page.screenshot();

await browser.close();
```

**Using Playwright:**

```javascript
const { chromium } = require('playwright-core');

const browser = await chromium.connectOverCDP(
  'wss://browser.example.com/playwright?token=YOUR_TOKEN'
);

const context = await browser.newContext();
const page = await context.newPage();
await page.goto('https://example.com');
await page.screenshot({ path: 'screenshot.png' });

await browser.close();
```

## API Endpoints

All endpoints require `?token=YOUR_TOKEN` query parameter.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/docs` | GET | Interactive API documentation |
| `/` | WS | WebSocket for Puppeteer connection |
| `/playwright` | WS | WebSocket for Playwright connection |
| `/content` | GET/POST | Get page content as HTML/text |
| `/screenshot` | GET/POST | Generate screenshot (PNG/JPEG) |
| `/pdf` | GET/POST | Generate PDF from URL |
| `/function` | POST | Execute custom JavaScript function |
| `/download` | POST | Download files from URL |
| `/metrics` | GET | Prometheus-compatible metrics |

### Example: Generate Screenshot

```bash
curl "https://browser.example.com/screenshot?token=YOUR_TOKEN&url=https://example.com" \
  -o screenshot.png
```

### Example: Generate PDF

```bash
curl "https://browser.example.com/pdf?token=YOUR_TOKEN&url=https://example.com" \
  -o document.pdf
```

### Example: Execute Function

```bash
curl -X POST "https://browser.example.com/function?token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "async ({ page }) => { await page.goto('https://example.com'); return page.title(); }"
  }'
```

## Performance Tuning

### Concurrency Settings

Adjust based on available resources:

| Concurrent Sessions | RAM Required | CPU Cores | Use Case |
|---------------------|--------------|-----------|----------|
| 5 | 3.5 GB | 2 | Development/Testing |
| 10 (default) | 6 GB | 4 | Small production |
| 20 | 11 GB | 8 | Medium production |
| 50 | 26 GB | 16+ | Large production |

**Update in Dokploy:**
- Navigate to your Browserless deployment
- Update `CONCURRENT` environment variable
- Redeploy service

### Resource Limits (Docker)

For production, consider setting resource limits in docker-compose.yml:

```yaml
services:
  browserless:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 6G
        reservations:
          cpus: '2'
          memory: 4G
```

### Pre-boot Optimization

`PREBOOT_CHROME=true` (default) starts Chrome instances on service start, reducing first-request latency:

- **Pros**: Faster initial requests (~2s faster)
- **Cons**: Higher baseline memory usage

Disable for resource-constrained environments:

```
PREBOOT_CHROME=false
```

## Monitoring

### Health Check

Browserless includes a built-in health check at `/docs`:

```bash
curl -f https://browser.example.com/docs
# Returns 200 OK when healthy
```

### Metrics

Prometheus-compatible metrics available at `/metrics`:

```bash
curl "https://browser.example.com/metrics?token=YOUR_TOKEN"
```

**Key metrics:**
- `browserless_sessions_running` - Current active sessions
- `browserless_sessions_queued` - Queued requests
- `browserless_sessions_rejected` - Rejected requests
- `browserless_chrome_memory_usage` - Memory usage per session

### Logs

View service logs in Dokploy dashboard:

```bash
# Or via Docker CLI
docker logs browserless -f --tail 100
```

## Troubleshooting

### Issue 1: 401 Unauthorized

**Symptoms:** API requests return 401 error

**Cause:** Missing or invalid TOKEN

**Solution:**
```bash
# Check your token in Dokploy environment variables
# Ensure token is included in requests:
curl "https://browser.example.com/docs?token=YOUR_TOKEN"

# For WebSocket connections:
const browser = await puppeteer.connect({
  browserWSEndpoint: 'wss://browser.example.com?token=YOUR_TOKEN'
});
```

### Issue 2: 502 Bad Gateway

**Symptoms:** Traefik returns 502 error

**Causes:**
1. Service not started (check logs)
2. Health check failing
3. Chromium initialization timeout

**Solution:**
```bash
# Check service logs
docker logs browserless

# Verify health check
curl -f http://localhost:3000/docs  # From Dokploy host

# Increase start_period if Chromium is slow to initialize
# Edit docker-compose.yml:
healthcheck:
  start_period: 60s  # From 40s
```

### Issue 3: Out of Memory (OOM)

**Symptoms:** Service crashes, "Killed" in logs

**Cause:** Insufficient RAM for concurrent sessions

**Solution:**
```bash
# Calculate required RAM
# Formula: (CONCURRENT × 500MB) + 1GB base

# Reduce concurrent sessions
CONCURRENT=5  # Reduce from 10

# Or increase host RAM
# Or set Docker memory limits
```

### Issue 4: Sessions Queuing

**Symptoms:** Requests waiting in queue, slow responses

**Cause:** Too many concurrent requests for available resources

**Solution:**
```bash
# Increase concurrent sessions (if RAM available)
CONCURRENT=20

# Or increase queue length
MAX_QUEUE_LENGTH=200

# Or scale horizontally (multiple Browserless instances)
```

### Issue 5: R2 Upload Failures

**Symptoms:** Files not appearing in R2 bucket

**Causes:**
1. Invalid R2 credentials
2. Bucket doesn't exist
3. Incorrect endpoint format

**Solution:**
```bash
# Verify R2 endpoint format
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# Test credentials with AWS CLI
aws s3 ls s3://browserless-artifacts \
  --endpoint-url=$S3_ENDPOINT \
  --profile r2

# Check bucket permissions (Object Read & Write required)
```

### Issue 6: WebSocket Connection Drops

**Symptoms:** Browser disconnects mid-session

**Causes:**
1. Timeout too low
2. Network interruption
3. Proxy timeout

**Solution:**
```bash
# Increase session timeout
TIMEOUT=60000  # 60 seconds (from 30s default)

# For long-running sessions, consider:
TIMEOUT=300000  # 5 minutes
```

## Security Considerations

### 1. Token Security

- ✅ **ALWAYS** set a strong TOKEN (48+ characters)
- ✅ Never commit TOKEN to git
- ✅ Rotate TOKEN periodically
- ✅ Use environment variables only

### 2. Network Isolation

- ✅ Browserless is exposed via Traefik (HTTPS only)
- ✅ No direct port exposure
- ✅ Automatic SSL certificates

### 3. R2 Bucket Security

- ✅ Use private buckets (default)
- ✅ Generate signed URLs for artifact access
- ✅ Set bucket policies to restrict access
- ✅ Enable R2 bucket logging for audit trail

### 4. Rate Limiting (Optional)

Consider adding Cloudflare Workers for rate limiting:

```javascript
// cloudflare-worker.js (deploy separately)
export default {
  async fetch(request, env) {
    const ip = request.headers.get('CF-Connecting-IP');
    const key = `rate-limit:${ip}`;

    const count = await env.KV.get(key);
    if (count && parseInt(count) > 100) {
      return new Response('Rate limit exceeded', { status: 429 });
    }

    await env.KV.put(key, (parseInt(count || 0) + 1).toString(), { expirationTtl: 3600 });
    return fetch(request);
  }
};
```

## Advanced Configuration

### Zero Trust Access (Optional)

Protect Browserless API with Cloudflare Access:

1. Cloudflare Dashboard → Zero Trust → Access → Applications
2. Create Self-hosted application
3. Set Application URL: `https://browser.example.com`
4. Configure Access Policy (email domain, groups, etc.)
5. Update docker-compose.yml labels:

```yaml
labels:
  - "traefik.http.routers.browserless.middlewares=cf-access@file"
```

### Custom Chromium Flags

Pass custom flags to Chromium via environment:

```yaml
environment:
  CHROME_ARGS: "--no-sandbox,--disable-dev-shm-usage,--disable-gpu"
```

### Persistent Sessions

For long-running browser sessions, configure persistent storage:

```yaml
volumes:
  - browserless-downloads:/downloads
  - browserless-sessions:/workspace  # Add this
```

## Supported Versions

| Component | Version |
|-----------|---------|
| **Chromium** | 134.0.6998.35 |
| **Puppeteer-core** | 24.4.0 |
| **Playwright-core** | 1.47.2 - 1.51.1 |
| **Node.js** | 20.x (in image) |
| **Docker Compose** | 3.8+ |

## Resources

- **Official Documentation**: https://docs.browserless.io/
- **GitHub Repository**: https://github.com/browserless/browserless
- **Docker Images**: https://github.com/orgs/browserless/packages
- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **Puppeteer Docs**: https://pptr.dev/
- **Playwright Docs**: https://playwright.dev/

## Support

- **GitHub Issues**: https://github.com/browserless/browserless/issues
- **Dokploy Community**: https://docs.dokploy.com/
- **Cloudflare Community**: https://community.cloudflare.com/

## License

Browserless is licensed under SSPL-1.0. Free for non-commercial use. Commercial licenses available at https://www.browserless.io/

---

**Template Version**: 1.0.0
**Last Updated**: January 26, 2026
**Maintained By**: Home Lab Infrastructure Team
