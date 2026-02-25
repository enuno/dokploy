# Personalized Deep Research Web UI

An intelligent research agent that synthesizes large amounts of online data and completes complex research tasks, customized to your unique preferences and insights.

**Repository**: https://github.com/mem0ai/personalized-deep-research

## Overview

Personalized Deep Research is a Vue/Nuxt-based web interface for conducting advanced research tasks powered by AI and web search. All configuration stays in your browser locally—there's no server-side data storage or processing. The application features:

- **Client-side processing**: Configuration, API requests, and all computation stay locally in your browser
- **Real-time streaming**: Watch AI responses stream in real-time as research progresses
- **Tree visualization**: See the research process visualized as a hierarchical tree structure
- **Export capabilities**: Export research findings as PDF or Markdown documents
- **Multi-language support**: Search and research in multiple languages
- **Multiple AI providers**: Support for OpenAI, SiliconFlow, DeepSeek, OpenRouter, and local Ollama
- **Web search integration**: Tavily and Firecrawl for real-time web research

## Architecture

```
┌──────────────────────────────────────┐
│  Deep Research Web UI                │
│  (Nuxt/Vue Frontend)                 │
│  Port: 3000                          │
└──────────────────────────────────────┘
         ↓
   Traefik (HTTPS Routing)
         ↓
   Cloudflare (CDN/DNS)
         ↓
   End Users (Your Domain)

External APIs (Client-Initiated):
├── OpenAI, SiliconFlow, DeepSeek
├── Tavily Web Search
├── Firecrawl
└── Optional: Local Ollama (user's network)
```

## Requirements

### Minimum Resources
- **CPU**: 0.5 - 1 CPU (minimal during idle, scales with user load)
- **Memory**: 512 MB - 1 GB
- **Disk**: 500 MB (for Docker image and cache)
- **Network**: Low bandwidth required (client-side processing)

### System Requirements
- Docker and Docker Compose v2.x or higher
- Domain name (for HTTPS)
- Internet connection (for web search and AI APIs)

### Optional Requirements
- Cloudflare DNS (for automatic HTTPS certificate management)
- Local Ollama instance (if using offline LLM)

## Quick Start

### 1. Deploy with Dokploy

1. Go to Dokploy dashboard
2. Create new service from template
3. Select **personalized-deep-research**
4. Configure domain (required)
5. Deploy

### 2. Manual Docker Compose Deployment

```bash
# Clone this template
git clone https://github.com/your-repo/dokploy-templates.git
cd dokploy-templates/blueprints/personalized-deep-research

# Set your domain
export DOMAIN=research.yourdomain.com

# Start the service
docker compose up -d
```

### 3. Verify Deployment

```bash
# Check if service is running
docker compose ps

# Check logs
docker compose logs -f deep-research-web

# Test web UI (replace with your domain)
curl -k https://research.yourdomain.com/
```

## Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DOMAIN` | Yes | Domain for web UI access | `research.example.com` |
| `NODE_ENV` | No | Node environment (default: production) | `production` |

### Client-Side Configuration

All application settings are configured within the browser UI:

1. **AI Provider Selection**
   - Choose between OpenAI, SiliconFlow, DeepSeek, OpenRouter
   - Enter your API key for the provider
   - Optional: Set up local Ollama for offline usage

2. **Web Search Provider**
   - Choose Tavily (1000 free credits/month) or Firecrawl
   - Enter API credentials if using paid plans

3. **Research Preferences**
   - Custom system prompts
   - Search depth and scope settings
   - Export format preferences
   - Language preferences

**Important**: All credentials are stored locally in your browser. They are never sent to the server or any third party except the respective AI/search providers.

## Deployment Steps

### Step 1: Prepare Domain

1. Point your domain DNS to your Dokploy/Docker host
2. Ensure port 443 (HTTPS) is accessible from the internet
3. Allow HTTP (port 80) for Let's Encrypt certificate validation

### Step 2: Set Environment Variables

```bash
# In Dokploy UI or docker-compose
DOMAIN=research.yourdomain.com
```

### Step 3: Deploy

```bash
docker compose up -d
```

### Step 4: Wait for Startup

- First startup takes ~30-60 seconds (Nuxt build optimization)
- Check health: `curl https://research.yourdomain.com/`

### Step 5: Access Web UI

Open browser to `https://research.yourdomain.com/`

## Post-Deployment

### Verify Service Health

```bash
# Check service status
docker compose ps

# Expected output:
# NAME                 IMAGE                                    STATUS
# deep-research-web    anotia/deep-research-web:1.0.0           Up (healthy)
```

### Configure Your First Research

1. Open https://research.yourdomain.com/
2. Select your preferred AI provider
3. Enter your API credentials in the settings
4. Start your first research task

### Optional: Set Up Local LLM

To use Ollama locally instead of cloud providers:

1. Install Ollama on your network: https://ollama.ai/
2. Pull a model: `ollama pull llama2`
3. Ensure Ollama is accessible at `http://ollama-host:11434`
4. In the UI, select "Ollama" and set your endpoint

## Configuration Variables

### Traefik Labels

The template includes automatic HTTPS setup:

```yaml
- "traefik.http.routers.deep-research-web.rule=Host(`${DOMAIN}`)"
- "traefik.http.routers.deep-research-web.tls.certresolver=letsencrypt"
```

### Networks

- **deep-research-net**: Internal Docker network
- **dokploy-network**: External network for Traefik routing

## Troubleshooting

### Issue: "Cannot reach the website"

**Symptoms**: Connection refused or timeout

**Checks**:
1. Container is running: `docker compose ps`
2. Port 443 is accessible: `telnet yourdomain.com 443`
3. DNS resolves: `nslookup yourdomain.com`
4. Traefik is routing: Check Traefik dashboard

**Solutions**:
```bash
# Restart the service
docker compose restart deep-research-web

# Check logs
docker compose logs deep-research-web

# Verify Traefik configuration
docker compose logs traefik | grep deep-research
```

### Issue: "SSL certificate error"

**Symptoms**: Certificate validation failed, untrusted certificate

**Causes**:
1. Let's Encrypt certificate not yet issued
2. Port 80 not accessible for HTTP challenge
3. DNS not pointing to host

**Solutions**:
1. Wait 5-10 minutes for certificate generation
2. Check firewall allows port 80 and 443
3. Verify DNS: `nslookup yourdomain.com`
4. Check Traefik logs: `docker compose logs traefik`

### Issue: "Service shows unhealthy"

**Symptoms**: Container restarts repeatedly

**Checks**:
1. Health check endpoint: `curl http://localhost:3000/`
2. Service logs: `docker compose logs deep-research-web`
3. Memory/CPU limits: `docker stats`

**Solutions**:
```bash
# Check health endpoint manually
docker compose exec deep-research-web curl -f http://localhost:3000/

# View full logs
docker compose logs deep-research-web

# Restart
docker compose restart deep-research-web
```

### Issue: "Research queries timing out"

**Symptoms**: Research tasks fail to complete or return incomplete results

**Causes**:
1. Web search provider rate limits
2. AI API throttling or timeout
3. Network connectivity issues
4. Large search scope

**Solutions**:
1. Check API quotas in Tavily/Firecrawl dashboard
2. Reduce search depth or scope in settings
3. Switch to alternative AI provider
4. Check network connectivity to internet

### Issue: "Cannot export to PDF/Markdown"

**Symptoms**: Export button doesn't work or downloads fail

**Causes**:
1. Browser security restrictions
2. Pop-up blocker enabled
3. Insufficient disk space in browser cache
4. JavaScript disabled

**Solutions**:
1. Disable pop-up blocker for your domain
2. Check browser permissions
3. Clear browser cache
4. Try a different browser

### Issue: "Credentials not being saved"

**Symptoms**: API keys disappear after refresh

**Causes**:
1. Browser private/incognito mode (localStorage disabled)
2. Browser data cleared on exit
3. Third-party cookies disabled
4. Cross-site tracking protection

**Solutions**:
1. Use regular browsing mode, not private/incognito
2. Configure browser to keep localStorage on exit
3. Allow third-party cookies for your domain
4. Whitelist your domain in tracking protection settings

## Performance Optimization

### For Faster Research

1. **Increase search depth** (uses more API calls but finds more comprehensive results)
2. **Use faster AI model** (trade accuracy for speed)
3. **Parallel searches** (research multiple angles simultaneously)

### For Lower API Costs

1. **Reduce search depth** (fewer web queries)
2. **Use cheaper AI provider** (e.g., DeepSeek vs OpenAI)
3. **Limit research scope** (narrower search parameters)
4. **Use local Ollama** (zero API costs)

## Backup and Data Recovery

Since all data is stored client-side:

1. **Browser localStorage**: Automatically persisted in browser
2. **Exported files**: Export research as PDF/Markdown for backup
3. **No server-side backup needed**: No data on server to back up
4. **Migrate between browsers**: Export research, import in new browser

## Security Considerations

### What's Local
- ✅ Your research queries and results (stored in browser)
- ✅ Your API credentials (stored in browser localStorage)
- ✅ All configuration and preferences (stored in browser)

### What's Transmitted
- 🌐 Queries sent to your chosen AI provider (OpenAI, DeepSeek, etc.)
- 🌐 Search queries sent to Tavily or Firecrawl
- 🌐 Zero data sent to Deep Research servers (stateless app)

### Security Best Practices

1. **Use HTTPS only**: Always access via https://your-domain.com
2. **Keep API keys private**: Don't share your API credentials
3. **Clear cache periodically**: If using shared computers
4. **Update browser**: Keep your browser updated for security patches
5. **Use strong domain**: Don't use default/weak domains if on public internet

## Storage Information

The application stores no data on the server:
- No database (stateless)
- No file storage
- No session data
- No research history

All data stays in your browser's localStorage or is immediately transmitted to external APIs.

## Advanced: Using with Ollama

To use the application with a local Ollama instance:

1. **Install Ollama** on your network

2. **Pull a model**:
   ```bash
   ollama pull llama2
   # or
   ollama pull mistral
   ```

3. **Ensure Ollama is accessible**:
   - Default: http://localhost:11434
   - Over network: Configure IP/hostname

4. **In the app**:
   - Select "Ollama" as AI provider
   - Set endpoint: http://ollama-host:11434
   - Model will auto-detect available models

## Scaling and High Availability

### Single Instance
- Stateless design means easy horizontal scaling
- Each instance can handle multiple concurrent users
- No shared state needed

### Multi-Instance Setup (Optional)
```bash
# Scale to 3 instances
docker compose up -d --scale deep-research-web=3
```

**Note**: Traefik will automatically load-balance between instances.

## Updates

### Check for Updates

1. **Image tags**: `anotia/deep-research-web:latest` (not recommended)
2. **Latest stable**: Update to latest `1.x.x` tag as needed

### Update Process

```bash
# Pull latest image
docker compose pull

# Restart service
docker compose up -d
```

## Support and Community

- **GitHub Issues**: https://github.com/mem0ai/personalized-deep-research/issues
- **Documentation**: https://github.com/mem0ai/personalized-deep-research
- **Tavily API Support**: https://tavily.com/docs
- **Firecrawl API Support**: https://firecrawl.dev/

## License

See the original repository for licensing information:
https://github.com/mem0ai/personalized-deep-research

## Contributing

To improve this Dokploy template:
1. Fork the Dokploy templates repository
2. Make improvements
3. Submit a pull request

## Credits

- **Deep Research UI**: https://github.com/mem0ai/personalized-deep-research
- **Dokploy**: https://dokploy.io/

---

**Template Version**: 1.0.0
**Last Updated**: February 2026
**Compatibility**: Dokploy 2.0+, Docker Compose v2.x+
