# Firecrawl - Web Scraping and Data Extraction API

A powerful API service for converting websites into clean markdown or structured data with AI-powered extraction capabilities. Turn any website into LLM-ready data.

## Overview

Firecrawl is an open-source web scraping and data extraction API that enables developers to convert websites into markdown, structured data, or screenshots. This Dokploy template provides a production-ready deployment with PostgreSQL persistence, Redis job queuing, RabbitMQ message brokering, and Playwright browser automation.

**Key Features:**
- 🔥 **Convert websites to markdown** - Clean, LLM-ready text extraction
- 🤖 **AI-powered data extraction** - Extract structured data using LLMs (OpenAI/Ollama)
- 🔗 **Intelligent crawling** - Follow links, respect robots.txt, handle dynamic content
- 📸 **Screenshot capture** - Full-page screenshots with Playwright
- 🚀 **Async job processing** - Background crawling with webhook notifications
- 🔒 **API authentication** - Secure API key-based access
- 📊 **Bull queue monitoring** - Real-time job queue visualization
- 🌐 **Proxy support** - Rotate proxies for large-scale scraping

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Firecrawl Stack                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐        ┌─────────────┐                     │
│  │   API       │───────▶│   Worker    │                     │
│  │ (Express)   │        │ (Jobs)      │                     │
│  │ Port: 3002  │        │             │                     │
│  └──────┬──────┘        └──────┬──────┘                     │
│         │                      │                             │
│         │                      │                             │
│    ┌────┴────────────────────┴────┐                         │
│    │                               │                         │
│    ▼                               ▼                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  PostgreSQL │    │    Redis    │    │  RabbitMQ   │     │
│  │ (Persistence)    │  (Queue)    │    │  (Broker)   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                               │                             │
│                               ▼                             │
│                      ┌─────────────┐                         │
│                      │ Playwright  │                         │
│                      │ (Browsers)  │                         │
│                      └─────────────┘                         │
│                                                               │
│                          │                                    │
│                          ▼                                    │
│                    Traefik (HTTPS)                           │
│                          │                                    │
│                          ▼                                    │
│              https://firecrawl.yourdomain.com                │
└──────────────────────────────────────────────────────────────┘
```

**Architecture Highlights:**
- **API Server**: REST API for scraping requests (Node.js/Express)
- **Worker Service**: Background job processor for async scraping
- **PostgreSQL**: Stores API keys, job history, and metadata
- **Redis**: Job queue and rate limiting
- **RabbitMQ**: Message broker for distributed job processing
- **Playwright**: Headless browser automation for JavaScript-heavy sites
- **Network Isolation**: Databases and queues on internal network only

## Quick Start

### Prerequisites

- Dokploy instance running
- Domain name pointed to your server
- Port 443 (HTTPS) accessible

### Deployment

1. **Import Template** in Dokploy:
   ```
   Template URL: https://raw.githubusercontent.com/[your-repo]/dokploy/main/blueprints/firecrawl/
   ```

2. **Configure Variables**:
   | Variable | Description | Example | Auto-Generated |
   |----------|-------------|---------|----------------|
   | `FIRECRAWL_DOMAIN` | Your domain for Firecrawl | `firecrawl.example.com` | No |
   | `POSTGRES_PASSWORD` | Database password | - | Yes (32 chars) |
   | `RABBITMQ_PASSWORD` | RabbitMQ password | - | Yes (32 chars) |
   | `FIRECRAWL_API_KEY` | API authentication key | - | Yes (base64, 48 chars) |
   | `BULL_AUTH_KEY` | Queue admin panel password | - | Yes (24 chars) |

3. **Optional Variables** (AI Integration):
   | Variable | Description | Required |
   |----------|-------------|----------|
   | `OPENAI_API_KEY` | OpenAI API key for AI extraction | Optional |
   | `OLLAMA_BASE_URL` | Ollama endpoint for local LLM | Optional |
   | `SEARXNG_ENDPOINT` | SearXNG search engine endpoint | Optional |
   | `PROXY_SERVER` | Proxy server URL | Optional |
   | `PROXY_USERNAME` | Proxy authentication username | Optional |
   | `PROXY_PASSWORD` | Proxy authentication password | Optional |

4. **Deploy**: Click "Deploy" in Dokploy

5. **Access**: Navigate to `https://your-domain.com`

### Manual Deployment

```bash
# Clone repository
git clone [your-repo-url]
cd blueprints/firecrawl

# Set environment variables
export FIRECRAWL_DOMAIN=firecrawl.example.com
export POSTGRES_PASSWORD=$(openssl rand -base64 32)
export RABBITMQ_PASSWORD=$(openssl rand -base64 32)
export FIRECRAWL_API_KEY=$(openssl rand -base64 48)
export BULL_AUTH_KEY=$(openssl rand -base64 24)

# Deploy with Docker Compose
docker compose up -d
```

## Configuration

### Environment Variables

#### Required Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `FIRECRAWL_DOMAIN` | - | Domain name for accessing Firecrawl |
| `POSTGRES_PASSWORD` | - | PostgreSQL database password |
| `RABBITMQ_PASSWORD` | - | RabbitMQ message broker password |
| `FIRECRAWL_API_KEY` | - | API key for authentication |
| `BULL_AUTH_KEY` | - | Password for Bull queue admin panel |

#### Worker Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `NUM_WORKERS_PER_QUEUE` | `8` | Number of concurrent workers per queue |
| `BLOCK_MEDIA` | `false` | Block images/videos to speed up scraping |
| `MAX_CONCURRENT_PAGES` | `10` | Max concurrent browser pages |

#### Database Configuration
- **PostgreSQL**: `postgresql://firecrawl:${POSTGRES_PASSWORD}@postgres:5432/firecrawl`
- **Redis**: `redis://redis:6379`
- **RabbitMQ**: `amqp://user:${RABBITMQ_PASSWORD}@rabbitmq:5672`

### Network Configuration

- **Internal Network**: `firecrawl-net` (bridge driver)
- **External Network**: `dokploy-network` (Traefik routing)
- **API Port**: 3002 (internal) → 443 (HTTPS via Traefik)
- **Worker**: Internal only (no external access)
- **Databases**: Internal only (no external access)

### SSL/TLS Configuration

- **Certificate**: Automatic Let's Encrypt via Traefik
- **Renewal**: Automatic (handled by Traefik)
- **Protocol**: HTTPS only (websecure entrypoint)
- **Security Headers**: HSTS, Content-Type-Nosniff, Frame-Deny, XSS-Filter enabled

## Post-Deployment

### 1. Verify Deployment

Check that all services are running:

```bash
# Check container status
docker ps | grep firecrawl

# Check health status
docker compose ps
```

Expected output:
```
NAME                      STATUS              HEALTH
firecrawl-api-1          Up 2 minutes        healthy
firecrawl-worker-1       Up 2 minutes        N/A
firecrawl-playwright-1   Up 2 minutes        N/A
firecrawl-postgres-1     Up 2 minutes        healthy
firecrawl-redis-1        Up 2 minutes        healthy
firecrawl-rabbitmq-1     Up 2 minutes        healthy
```

### 2. Test API Access

Test the health endpoint:

```bash
curl https://firecrawl.yourdomain.com/health
```

Expected response:
```json
{"status":"ok"}
```

### 3. Access Bull Queue Admin Panel

Monitor job queues at:
```
https://firecrawl.yourdomain.com/admin/queues
```

**Credentials:**
- Username: `admin`
- Password: `${BULL_AUTH_KEY}` (from environment)

### 4. Get Your API Key

Your API key was auto-generated during deployment. Retrieve it:

```bash
# View environment variables
docker compose exec api env | grep FIRECRAWL_API_KEY
```

Or check the Dokploy UI environment variables.

## Common Use Cases

### 1. Basic Web Scraping (Convert to Markdown)

**Request:**
```bash
curl -X POST https://firecrawl.yourdomain.com/v1/scrape \
  -H "Authorization: Bearer ${FIRECRAWL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "markdown": "# Example Domain\n\nThis domain is for use in illustrative examples...",
    "metadata": {
      "title": "Example Domain",
      "description": "Example domain for testing",
      "language": "en"
    }
  }
}
```

### 2. AI-Powered Data Extraction

Extract structured data using AI (requires OpenAI API key):

**Request:**
```bash
curl -X POST https://firecrawl.yourdomain.com/v1/scrape \
  -H "Authorization: Bearer ${FIRECRAWL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://news.ycombinator.com",
    "extract": {
      "schema": {
        "type": "object",
        "properties": {
          "top_story": {
            "type": "object",
            "properties": {
              "title": {"type": "string"},
              "points": {"type": "number"},
              "author": {"type": "string"}
            }
          }
        }
      }
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "top_story": {
      "title": "Show HN: Firecrawl - Turn websites into LLM-ready data",
      "points": 342,
      "author": "mendableai"
    }
  }
}
```

### 3. Website Crawling (Follow Links)

Crawl an entire website:

**Request:**
```bash
curl -X POST https://firecrawl.yourdomain.com/v1/crawl \
  -H "Authorization: Bearer ${FIRECRAWL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://docs.example.com",
    "maxDepth": 2,
    "limit": 100
  }'
```

**Response:**
```json
{
  "success": true,
  "id": "crawl_123abc",
  "url": "https://firecrawl.yourdomain.com/v1/crawl/crawl_123abc"
}
```

Check crawl status:
```bash
curl https://firecrawl.yourdomain.com/v1/crawl/crawl_123abc \
  -H "Authorization: Bearer ${FIRECRAWL_API_KEY}"
```

### 4. Screenshot Capture

Capture full-page screenshot:

**Request:**
```bash
curl -X POST https://firecrawl.yourdomain.com/v1/scrape \
  -H "Authorization: Bearer ${FIRECRAWL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "pageOptions": {
      "screenshot": true
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "screenshot": "data:image/png;base64,iVBORw0KGgoAAAANSUh...",
    "markdown": "..."
  }
}
```

### 5. Async Crawling with Webhooks

Large crawl with webhook notification:

**Request:**
```bash
curl -X POST https://firecrawl.yourdomain.com/v1/crawl \
  -H "Authorization: Bearer ${FIRECRAWL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://docs.example.com",
    "maxDepth": 3,
    "limit": 1000,
    "webhook": "https://your-app.com/webhook"
  }'
```

When complete, Firecrawl POSTs results to your webhook.

## Troubleshooting

### Issue 1: Cannot Access Firecrawl

**Symptoms:** Domain returns 404 or connection refused

**Diagnosis:**
```bash
# Check container is running
docker ps | grep firecrawl-api

# Check Traefik routing
docker logs traefik | grep firecrawl

# Check health status
docker compose ps
```

**Solutions:**
1. Verify DNS points to your server IP
2. Check domain configured correctly: `echo $FIRECRAWL_DOMAIN`
3. Restart API container: `docker compose restart api`
4. Check Traefik logs for routing errors

### Issue 2: API Returns 401 Unauthorized

**Symptoms:** API requests fail with 401 error

**Solutions:**
1. **Verify API key** is correct:
   ```bash
   docker compose exec api env | grep FIRECRAWL_API_KEY
   ```
2. **Check Authorization header** format:
   ```
   Authorization: Bearer your-api-key-here
   ```
3. **Regenerate API key** if compromised

### Issue 3: Scraping Fails / Timeouts

**Symptoms:** Scraping requests timeout or fail

**Diagnosis:**
```bash
# Check worker logs
docker logs firecrawl-worker-1 --tail 100

# Check Playwright service
docker logs firecrawl-playwright-1 --tail 100

# Check queue status
# Visit: https://firecrawl.yourdomain.com/admin/queues
```

**Solutions:**
1. **Increase timeout** in scrape request:
   ```json
   {"url": "...", "timeout": 60000}
   ```
2. **Enable media blocking** for faster scraping:
   ```bash
   # Set in environment
   BLOCK_MEDIA=true
   ```
3. **Check target website** isn't blocking requests
4. **Use proxy** if target requires it

### Issue 4: Database Connection Errors

**Symptoms:** API fails to start, PostgreSQL connection errors

**Diagnosis:**
```bash
# Check PostgreSQL health
docker compose exec postgres pg_isready -U firecrawl -d firecrawl

# Check database logs
docker logs firecrawl-postgres-1 --tail 50
```

**Solutions:**
1. **Verify password** is set correctly
2. **Wait for health check** - PostgreSQL takes 30s to start
3. **Check disk space** - database may be full
4. **Restart stack**:
   ```bash
   docker compose down
   docker compose up -d
   ```

### Issue 5: Job Queue Not Processing

**Symptoms:** Crawl jobs stuck in queue

**Diagnosis:**
```bash
# Check Redis connection
docker compose exec redis redis-cli ping

# Check RabbitMQ status
docker logs firecrawl-rabbitmq-1 --tail 50

# Check worker logs
docker logs firecrawl-worker-1 -f
```

**Solutions:**
1. **Restart worker**:
   ```bash
   docker compose restart worker
   ```
2. **Increase workers** (if queue is backed up):
   ```bash
   NUM_WORKERS_PER_QUEUE=16 docker compose up -d
   ```
3. **Clear stuck jobs** via Bull admin panel
4. **Check RabbitMQ memory** - may need more resources

### Issue 6: SSL Certificate Not Provisioning

**Symptoms:** HTTPS not working, certificate errors

**Diagnosis:**
```bash
# Check Traefik certificate status
docker exec traefik cat /letsencrypt/acme.json | jq '.letsencrypt.Certificates[] | select(.domain.main=="firecrawl.yourdomain.com")'
```

**Solutions:**
1. Verify domain DNS is correctly configured
2. Check domain is accessible on port 80 (Let's Encrypt validation)
3. Wait 5-10 minutes for certificate provisioning
4. Check Traefik logs: `docker logs traefik`

### Issue 7: AI Extraction Not Working

**Symptoms:** Extract requests return empty results

**Solutions:**
1. **Check OpenAI API key** is set:
   ```bash
   docker compose exec api env | grep OPENAI_API_KEY
   ```
2. **Verify API key is valid** (test at platform.openai.com)
3. **Check OpenAI rate limits** - may be exceeded
4. **Use Ollama** as alternative (local LLM):
   ```bash
   OLLAMA_BASE_URL=http://ollama:11434 docker compose up -d
   ```

## Security Considerations

### API Authentication

**CRITICAL**: Your `FIRECRAWL_API_KEY` provides full access to the scraping service:

- ✅ **Never commit API keys** to version control
- ✅ **Rotate keys regularly** (monthly recommended)
- ✅ **Use separate keys** for dev/staging/production
- ✅ **Monitor API usage** via Bull admin panel
- ✅ **Restrict by IP** if possible (via Traefik middleware)

### Network Security

- ✅ **HTTPS enforced**: All traffic encrypted via Let's Encrypt
- ✅ **Security headers**: HSTS, Content-Type-Nosniff, Frame-Deny, XSS-Filter
- ✅ **Database isolation**: PostgreSQL, Redis, RabbitMQ internal-only
- ✅ **No privileged containers**: Minimal attack surface
- ✅ **Network segmentation**: Internal bridge network + external Traefik network

### Data Privacy

**Important considerations:**

1. **Scraped content** is stored temporarily in PostgreSQL
2. **Job metadata** retained for monitoring (can be purged)
3. **AI extraction** sends content to OpenAI (if enabled)
4. **Use Ollama** for local LLM if privacy is critical

### Rate Limiting

Configure rate limiting to prevent abuse:

```bash
# In docker-compose.yml environment
RATE_LIMIT_ENABLED: "true"
RATE_LIMIT_MAX_REQUESTS: "100"
RATE_LIMIT_WINDOW_MS: "60000"  # 1 minute
```

### Cloudflare Zero Trust (Optional)

Protect the Bull admin panel with Cloudflare Access:

1. Go to Cloudflare Zero Trust dashboard
2. Create Access Application for `https://firecrawl.yourdomain.com/admin/*`
3. Configure authentication policy (email domain, SSO, etc.)
4. Users must authenticate before accessing queue admin

## Performance Tuning

### Worker Scaling

Adjust concurrent workers based on workload:

```yaml
# In template.toml or environment
NUM_WORKERS_PER_QUEUE = "16"  # Default: 8
```

**Guidelines:**
- **Light load** (< 100 requests/day): 4-8 workers
- **Medium load** (100-1000 requests/day): 8-16 workers
- **Heavy load** (1000+ requests/day): 16-32 workers

### Browser Optimization

Reduce Playwright resource usage:

```yaml
# Block media for faster scraping
BLOCK_MEDIA = "true"

# Reduce concurrent pages
MAX_CONCURRENT_PAGES = "5"
```

### Redis Memory Configuration

For high-volume deployments, tune Redis:

```bash
# Add to redis service in docker-compose.yml
command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
```

### Database Connection Pooling

Optimize PostgreSQL connections for high concurrency:

```yaml
# Add to postgres environment
POSTGRES_MAX_CONNECTIONS: "200"  # Default: 100
```

### Resource Limits (Optional)

Add resource constraints for production:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "2.0"
        reservations:
          memory: 512M
          cpus: "0.5"
```

## Backup and Maintenance

### Backup Strategy

**What to Backup:**
- ✅ **PostgreSQL database**: API keys, job history, metadata
- ✅ **Configuration**: docker-compose.yml, template.toml
- ❌ **Redis data**: Ephemeral job queue (no backup needed)
- ❌ **RabbitMQ data**: Ephemeral message queue (no backup needed)

**PostgreSQL Backup:**

```bash
# Backup database
docker compose exec postgres pg_dump -U firecrawl firecrawl > firecrawl-backup-$(date +%Y%m%d).sql

# Restore database
docker compose exec -T postgres psql -U firecrawl firecrawl < firecrawl-backup-20241229.sql
```

**Automated Backups:**

```bash
# Add to cron: Daily backup at 2 AM
0 2 * * * cd /path/to/firecrawl && docker compose exec postgres pg_dump -U firecrawl firecrawl | gzip > /backups/firecrawl-$(date +\%Y\%m\%d).sql.gz
```

### Container Updates

Update to latest Firecrawl version:

```bash
# Check current version
docker inspect firecrawl-api-1 --format='{{.Config.Image}}'

# Pull new images
docker compose pull

# Restart with new images
docker compose up -d
```

**Update Frequency:**
- Check for updates weekly: https://github.com/mendableai/firecrawl/releases
- Apply security patches immediately
- Test in staging before production update

### Database Maintenance

Regular maintenance tasks:

```bash
# Vacuum database (monthly)
docker compose exec postgres vacuumdb -U firecrawl -d firecrawl -v -z

# Check database size
docker compose exec postgres psql -U firecrawl -d firecrawl -c "SELECT pg_size_pretty(pg_database_size('firecrawl'));"
```

### Log Rotation

Prevent disk space issues:

```bash
# Check log sizes
docker ps -q | xargs docker inspect --format='{{.Name}} {{.HostConfig.LogConfig.Type}}' | grep json-file

# Configure log rotation in docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### Monitoring

**Health Monitoring:**

```bash
# Check all service health
docker compose ps

# Monitor resource usage
docker stats

# Check API uptime
curl https://firecrawl.yourdomain.com/health
```

**Queue Monitoring:**
- Access Bull admin panel: `https://firecrawl.yourdomain.com/admin/queues`
- Monitor job completion rates
- Watch for stuck or failed jobs

## Advanced Configuration

### Using Ollama (Local LLM)

Replace OpenAI with local Ollama for AI extraction:

1. **Deploy Ollama** in your stack:
   ```yaml
   # Add to docker-compose.yml
   ollama:
     image: ollama/ollama:latest
     networks:
       - firecrawl-net
   ```

2. **Configure Firecrawl**:
   ```bash
   OLLAMA_BASE_URL=http://ollama:11434
   ```

3. **Pull model**:
   ```bash
   docker compose exec ollama ollama pull llama2
   ```

### Proxy Configuration

Use proxies for large-scale scraping:

```yaml
# In template.toml
PROXY_SERVER = "http://proxy.example.com:8080"
PROXY_USERNAME = "user"
PROXY_PASSWORD = "pass"
```

**Rotating proxies:**
- Use proxy rotation services (Bright Data, ScraperAPI, etc.)
- Configure in Playwright service environment

### SearXNG Integration

Add web search capabilities:

1. **Deploy SearXNG** instance
2. **Configure endpoint**:
   ```bash
   SEARXNG_ENDPOINT=http://searxng:8080
   ```

3. **Use in requests**:
   ```json
   {
     "url": "https://example.com",
     "searchContext": true
   }
   ```

## Docker Image Version Notice

### Important: :latest Tag Limitation

This template uses `:latest` tags for Firecrawl-specific images:
- `ghcr.io/mendableai/firecrawl:latest` (API + Worker)
- `ghcr.io/mendableai/firecrawl-playwright:latest` (Playwright service)

**Why?**
- The upstream Firecrawl project **does not publish versioned Docker images**
- Their docker-compose.yaml uses `build:` directives for local builds
- Pre-built images on ghcr.io only have `:latest` tag

**Implications:**
- ⚠️ Updates may introduce breaking changes
- ⚠️ Image pulls get latest code from main branch
- ⚠️ Version drift possible between deployments

**Mitigation Strategies:**

1. **Pin to commit SHA** for stability:
   ```yaml
   image: ghcr.io/mendableai/firecrawl@sha256:abc123...
   ```

2. **Test updates in staging** before production
3. **Monitor releases**: https://github.com/mendableai/firecrawl/releases
4. **Subscribe to notifications** for breaking changes

**Database/Queue images** are properly versioned:
- ✅ `postgres:16-alpine` - Pinned to PostgreSQL 16
- ✅ `redis:7-alpine` - Pinned to Redis 7
- ✅ `rabbitmq:3.13-management-alpine` - Pinned to RabbitMQ 3.13

We will update this template when Firecrawl publishes versioned images.

## Resources

### Official Documentation
- **GitHub Repository**: https://github.com/mendableai/firecrawl
- **API Documentation**: https://docs.firecrawl.dev/
- **Self-Hosting Guide**: https://github.com/mendableai/firecrawl/blob/main/SELF_HOST.md

### Community
- **GitHub Issues**: https://github.com/mendableai/firecrawl/issues
- **Discussions**: https://github.com/mendableai/firecrawl/discussions
- **Discord**: https://discord.gg/firecrawl

### Related Tools
- **Playwright**: https://playwright.dev/
- **Bull Queue**: https://github.com/OptimalBits/bull
- **RabbitMQ**: https://www.rabbitmq.com/documentation.html

### Integration Examples
- **LangChain Integration**: https://python.langchain.com/docs/integrations/document_loaders/firecrawl
- **OpenAI API**: https://platform.openai.com/docs/
- **Ollama**: https://ollama.ai/

## Support

### Getting Help

1. **Check Logs**: `docker compose logs -f`
2. **Review Troubleshooting**: See section above
3. **GitHub Issues**: https://github.com/mendableai/firecrawl/issues
4. **Community Discussions**: https://github.com/mendableai/firecrawl/discussions

### Reporting Issues

For template-specific issues:
1. Include docker compose logs
2. Include domain configuration
3. Include API request/response (sanitize API keys!)
4. Specify Firecrawl image version/SHA

For Firecrawl application issues:
1. Report directly to mendableai/firecrawl repository
2. Include browser console errors (if UI issue)
3. Include API request/response examples

## Version History

### Template v1.0.0 (2025-12-29)

**Initial Release:**
- Docker Images:
  - API/Worker: `ghcr.io/mendableai/firecrawl:latest`
  - Playwright: `ghcr.io/mendableai/firecrawl-playwright:latest`
  - PostgreSQL: `postgres:16-alpine`
  - Redis: `redis:7-alpine`
  - RabbitMQ: `rabbitmq:3.13-management-alpine`
- 6-service architecture (API, Worker, Playwright, PostgreSQL, Redis, RabbitMQ)
- Automatic HTTPS via Let's Encrypt
- Security headers middleware enabled
- Production-ready defaults
- Comprehensive health monitoring

**Features:**
- ✅ Web scraping to markdown
- ✅ AI-powered data extraction (OpenAI/Ollama)
- ✅ Intelligent website crawling
- ✅ Screenshot capture
- ✅ Async job processing with webhooks
- ✅ Bull queue monitoring dashboard
- ✅ Proxy support for large-scale scraping

**Security:**
- ✅ HTTPS enforced (Let's Encrypt)
- ✅ Security headers (HSTS, CSP, XSS-Filter, Frame-Deny)
- ✅ Network isolation (databases internal-only)
- ✅ API key authentication
- ✅ Minimal attack surface

**Architecture:**
- ✅ Complex multi-service with message broker
- ✅ Redis job queue + RabbitMQ message broker
- ✅ Playwright browser automation
- ✅ PostgreSQL persistence
- ✅ Health-based dependency chain

## License

- **Firecrawl Application**: AGPL-3.0 (mendableai/firecrawl)
- **Dokploy Template**: MIT License (this repository)

---

**Template Maintained By:** Home Lab Infrastructure Team
**Review Cycle:** Quarterly or upon Firecrawl version updates
**Next Review:** March 2025

**Questions or Issues?** Open an issue in this repository.
