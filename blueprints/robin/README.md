# Robin - AI-Powered Dark Web OSINT Tool

## Overview

Robin is a production-ready Dokploy template for deploying **Robin**, an advanced OSINT investigation platform that combines artificial intelligence with dark web search capabilities.

Run your own instance with this production-ready Dokploy template featuring:

- **Streamlit Web UI** - Interactive investigation interface
- **Tor Integration** - Direct dark web search access via SOCKS5 proxy
- **Venice.ai & OpenRouter.ai LLM Support** - Flexible LLM provider selection
- **Cloudflare R2 Storage** - Scalable object storage for investigation reports and findings
- **Automatic SSL/TLS** - Let's Encrypt certificate provisioning
- **Production-Grade Health Checks** - Automatic service recovery
- **Zero Trust Ready** - Compatible with Cloudflare Access for authentication

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Robin OSINT Investigation Platform                   │
│  ┌────────────────────────────────────────────┐      │
│  │  Streamlit Web UI (Port 8501)               │      │
│  │  - Investigation Dashboard                 │      │
│  │  - Query Refinement                        │      │
│  │  - Results Filtering & Analysis            │      │
│  └───────────────┬────────────────────────────┘      │
│                  │                                    │
│                  ├─────────────────────────┐         │
│                  │                         │         │
│                  ▼                         ▼         │
│           ┌────────────┐            ┌─────────┐     │
│           │   Tor      │            │   LLM   │     │
│           │  Service   │            │ Providers│    │
│           │ (SOCKS5)   │            │ (Venice/ │     │
│           └────────────┘            │ OpenRtr)│     │
│                                     └─────────┘     │
└──────────────────────────────────────────────────────┘
             │
             ├──────────────────────────────┐
             │                              │
             ▼                              ▼
     ┌──────────────┐           ┌──────────────────┐
     │   Tor.onion  │           │ Cloudflare R2    │
     │  (Dark Web)  │           │ (Investigation   │
     │   Search     │           │  Storage)        │
     └──────────────┘           └──────────────────┘

External Routing:
┌────────────────────────────────────────────────────────┐
│  HTTPS (Traefik + Let's Encrypt)                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Your Domain (auto SSL certificate)             │  │
│  │  robin.example.com                              │  │
│  └─────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Dokploy running on your server
- Cloudflare account with R2 enabled
- Venice.ai or OpenRouter.ai API key (or both)
- Domain name pointed to your Dokploy server

### 1. Create Robin Application

1. Go to Dokploy Dashboard
2. Click "New Project" → "New Application"
3. Select "Robin" from available templates
4. Enter your domain name

### 2. Configure Environment Variables

The template will prompt for these required variables:

| Variable | Example | Description |
|----------|---------|-------------|
| `DOMAIN` | `robin.example.com` | Your public domain (auto-configures SSL) |
| `CF_ACCOUNT_ID` | `a1b2c3d4e5f6g7h8` | Your Cloudflare Account ID |
| `R2_BUCKET_NAME` | `robin-investigations` | R2 bucket name for investigation storage |
| `R2_ACCESS_KEY_ID` | `abc123...` | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | `xyz789...` | R2 API secret key |
| `VENICE_API_KEY` | `v_...` | Venice.ai API key |
| `OPENROUTER_API_KEY` | (optional) | OpenRouter.ai API key for fallback |

Optional variables (auto-configured):
- `LLM_PROVIDER` - Default: `venice` (options: `venice`, `openrouter`)

### 3. Deploy

Click "Deploy" and wait for services to start (typically 2-3 minutes)

### 4. Access

Open `https://your-domain.com` in your browser once deployment is complete.

## Configuration Guide

### Cloudflare R2 Setup

Robin uses Cloudflare R2 to store investigation reports, findings, and exports.

#### Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > **R2** > **Overview**
2. Click **"Create bucket"**
3. **Name**: `robin-investigations` (or preferred name)
4. **Region**: Automatic
5. Click **Create bucket**

#### Create R2 API Token

1. From R2 Overview, click **"Manage R2 API Tokens"**
2. Click **"Create API token"**
3. **Token Name**: `robin-dokploy`
4. **Permissions**: Select "Object Read & Write"
5. **Resource scope**: (Optional) Restrict to specific bucket for security
6. Click **Create**
7. **Copy and save**:
   - Access Key ID
   - Secret Access Key

#### Get Your Cloudflare Account ID

Your Account ID is visible in the Cloudflare Dashboard URL:
```
https://dash.cloudflare.com/a1b2c3d4e5f6g7h8/...
                        ↑ Your Account ID
```

### LLM Provider Setup

#### Option 1: Venice.ai (Recommended)

Venice.ai offers fast, affordable inference with excellent LLM quality.

1. Go to [Venice.ai Console](https://venice.ai/console/api)
2. Sign in or create account
3. **API Keys** section
4. Click **"Create new key"**
5. Copy API key
6. Set in Dokploy: `VENICE_API_KEY=your_key_here`

**Pricing**: Pay-as-you-go (e.g., GPT-4 Turbo: ~$0.03 per 1K prompt tokens)

#### Option 2: OpenRouter.ai (Optional Fallback)

OpenRouter.ai provides access to multiple LLM providers with unified API.

1. Go to [OpenRouter.ai Keys](https://openrouter.ai/keys)
2. Sign in or create account
3. Copy API key
4. Set in Dokploy: `OPENROUTER_API_KEY=your_key_here`

**Features**:
- Access to 50+ models (GPT-4, Claude, Llama, etc.)
- Price comparison across providers
- Fallback model selection

**Set as Primary Provider**:
```
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key
```

### R2 CORS Configuration (Optional)

If you plan to implement direct uploads from the UI:

1. In R2 bucket > **Settings**
2. Scroll to **CORS**
3. Click **"Add CORS policy"**
4. Paste:

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

## Features & Capabilities

### OSINT Investigation
- **Multi-Model LLM Support** - Switch between Venice.ai, OpenRouter.ai models mid-investigation
- **Intelligent Query Refinement** - LLM enhances raw dark web searches
- **Filtered Results** - AI filters relevant findings from noise
- **Investigation Summaries** - Automated analysis of findings

### Investigation Management
- **Custom Reporting** - Export findings in multiple formats
- **Investigation History** - Track all searches and results
- **Cloudflare R2 Storage** - Persistent storage of investigation data
- **Search Organization** - Tag, filter, and organize investigations

### Dark Web Access
- **Tor Integration** - Direct access to dark web search engines
- **SOCKS5 Proxy** - Containerized Tor service for reliable anonymity
- **Multi-Engine Search** - Query multiple dark web sources simultaneously

## Post-Deployment

### Verify Installation

1. **Check Services**
   - Robin service should be running and healthy
   - Tor service should show as healthy

2. **Test Investigation**
   - Go to `https://your-domain.com`
   - Verify Streamlit UI loads
   - Test LLM connection (settings > test)
   - Test Tor connectivity (settings > test Tor proxy)

3. **Verify R2 Storage**
   - Run a test investigation
   - Export findings
   - Verify file appears in R2 bucket

### Monitor Logs

```bash
# View Robin logs
docker logs <robin-container-id>

# View Tor logs
docker logs <tor-container-id>

# Check service health
docker ps | grep robin
```

## Troubleshooting

### Issue: "Domain not resolving"

**Solution**: Ensure DNS A record points to your server
```bash
dig robin.example.com
# Should return your server's IP address
```

### Issue: "SSL certificate not issued"

**Solution**: Let's Encrypt might need more time (up to 5 minutes)
```bash
# Check Traefik logs for certificate status
docker logs traefik | grep -i certificate
```

### Issue: "LLM API errors"

**Check API Key**:
- Venice.ai: Dashboard > API Keys > Verify key is active
- OpenRouter.ai: Dashboard > Keys > Check key permissions

**Check Rate Limits**:
- Monitor API usage in provider dashboard
- Consider using fallback provider if primary hits limit

### Issue: "Tor connection failed"

**Verify Tor Service**:
1. Check Tor is running: `docker ps | grep tor`
2. Test SOCKS proxy:
   ```bash
   curl --socks5 localhost:9050 https://check.torproject.org/api/ip
   ```

### Issue: "R2 uploads fail"

**Verify Credentials**:
1. Account ID correct format (hex string)
2. Access Key ID and Secret are valid
3. R2 bucket exists
4. API token has "Object Read & Write" permission

**Check CORS** (if using direct uploads):
```bash
curl -X OPTIONS https://bucket.r2.cloudflarestorage.com/test \
  -H "Origin: https://your-domain.com"
```

## Cloudflare Zero Trust (Optional)

To add authentication to your Robin instance:

### Setup Cloudflare Access

1. Cloudflare Dashboard > **Zero Trust** > **Access** > **Applications**
2. Click **"Self-hosted"**
3. **Application name**: `robin`
4. **Application URL**: `https://your-domain.com`
5. Configure policies (e.g., allow only your email domain)
6. Save

### Apply to Dokploy

In template settings, add Zero Trust middleware (advanced configuration).

## Performance & Scaling

### Resource Recommendations

| Component | Recommendation | Notes |
|-----------|---|---|
| CPU | 2+ cores | Tor + Robin can use 1-2 cores |
| RAM | 2GB+ | Streamlit + Tor: 1GB minimum |
| Disk | 10GB+ | For investigation storage |
| Bandwidth | 10 Mbps+ | For dark web searches |

### Optimizations

1. **LLM Selection**: Venice.ai for speed, OpenRouter for model variety
2. **Caching**: Robin caches dark web results locally
3. **Tor Circuits**: Rotate every 10 minutes for anonymity
4. **R2 Lifecycle**: Implement S3 lifecycle rules for old investigations

## Cost Estimation

### Monthly Costs (Typical Usage)

| Service | Usage | Cost |
|---------|-------|------|
| Venice.ai | 100K tokens/day | ~$90 |
| Tor (Dokploy) | Included | $0 |
| Cloudflare R2 | 10GB storage | ~$0.15 |
| R2 Operations | 1M requests | ~$0.50 |
| **Total** | | **~$91/month** |

*Costs vary based on investigation frequency and LLM model selection*

## Security Considerations

### Best Practices

1. **API Keys**
   - Rotate R2 keys quarterly
   - Use minimum permission scopes
   - Monitor API usage for anomalies

2. **Tor Privacy**
   - Separate investigation topics by new Tor sessions
   - Don't correlate searches across sessions
   - Consider additional anonymization layers

3. **Data Protection**
   - Enable R2 encryption (Cloudflare managed)
   - Consider private domain if sensitive investigations
   - Regular backups of R2 data

4. **Access Control**
   - Use Cloudflare Access for authentication
   - Enable audit logging
   - Restrict to authorized researchers only

### Compliance

- **GDPR**: Ensure OSINT targets have legal basis
- **Data Retention**: Set R2 lifecycle policies
- **Audit Trail**: Enable Cloudflare audit logs
- **Legal Review**: Consult legal team for jurisdiction

## Updates & Maintenance

### Check for Updates

New Robin versions are released on [GitHub](https://github.com/apurvsinghgautam/robin/releases)

To update in Dokploy:
1. Note current version
2. Check [Robin Releases](https://github.com/apurvsinghgautam/robin/releases)
3. In Dokploy: Update image tag to new version
4. Restart service

### Tor Updates

Tor container updates automatically when deployed:
```bash
# Force update to latest Tor
docker pull osminogin/tor:latest
# Redeploy in Dokploy
```

## Support & Community

### Resources

- **Robin GitHub**: https://github.com/apurvsinghgautam/robin
- **Venice.ai Docs**: https://docs.venice.ai
- **OpenRouter.ai Docs**: https://openrouter.ai/docs
- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **Dokploy Docs**: https://dokploy.com/docs

### Getting Help

1. **GitHub Issues**: Report bugs on [Robin GitHub Issues](https://github.com/apurvsinghgautam/robin/issues)
2. **Venice.ai Support**: API issues → [Venice.ai Support](https://venice.ai/support)
3. **Cloudflare Support**: R2 issues → [Cloudflare Support](https://support.cloudflare.com)
4. **Dokploy Support**: Deployment issues → [Dokploy Documentation](https://dokploy.com/docs)

## Legal Notice

⚠️ **Important**: Robin is an OSINT investigation tool. Users are responsible for:
- Complying with local laws regarding dark web access
- Respecting privacy and legal limitations
- Not using for illegal purposes
- Following responsible disclosure practices

Operators are advised to:
- Conduct OSINT for legitimate research/security purposes
- Document legal basis for investigations
- Maintain audit logs for compliance
- Consult legal counsel for jurisdiction-specific regulations

## License

Robin is released under its original open-source license.
See [Robin GitHub](https://github.com/apurvsinghgautam/robin) for details.

This Dokploy template is provided as-is for deployment convenience.

---

**Template Version**: 1.0.0
**Last Updated**: February 27, 2026
**Compatible with**: Robin v2.0+
