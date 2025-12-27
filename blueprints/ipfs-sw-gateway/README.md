# IPFS Service Worker Gateway

Production-ready deployment template for IPFS Service Worker Gateway - a browser-based IPFS gateway using Service Workers for peer-to-peer content retrieval and cryptographic verification.

## Overview

The IPFS Service Worker Gateway enables browsers to fetch content from IPFS using Service Workers, providing:

- **Browser-Native IPFS**: Fetch IPFS content directly in the browser without browser extensions
- **Service Worker Architecture**: Intercepts HTTP requests and retrieves content via IPFS p2p network
- **Cryptographic Verification**: Uses verified-fetch to ensure content integrity
- **Subdomain Gateway Pattern**: Content addressing via `<CID>.ipfs.domain.com` and `<dnslink>.ipns.domain.com`
- **Wildcard SSL Support**: Single certificate covering unlimited IPFS/IPNS subdomains
- **Lightweight Deployment**: ~20MB Alpine-based Docker image with embedded static files
- **Production-Grade Security**: HSTS, security headers, Cloudflare DNS-01 SSL

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Browser (Service Worker)                     │
│                                                            │
│  ┌─────────────┐     ┌──────────────┐                    │
│  │  HTTP Req   │────▶│  Intercept   │                    │
│  │  /ipfs/CID  │     │  via SW      │                    │
│  └─────────────┘     └──────────────┘                    │
│         │                     │                           │
│  ┌──────┴──────┐     ┌───────┴──────┐                   │
│  │  Helia      │────▶│  verified-   │                    │
│  │  IPFS Node  │     │  fetch       │                    │
│  └─────────────┘     └──────────────┘                    │
└──────────────────────────────────────────────────────────┘
         │                      │
         │                      └────▶ IPFS p2p Network
         │
         ├────▶ Gateway Service (Go Binary, Port 3000)
         │      - Serves static files (HTML/JS/CSS)
         │      - Registers Service Worker
         │      - Provides /ipfs/ and /ipns/ endpoints
         │
         ▼
   Traefik (HTTPS + Wildcard SSL)
   - domain.com (main gateway)
   - *.ipfs.domain.com (IPFS content)
   - *.ipns.domain.com (IPNS content)
```

## Features

### Service Worker Capabilities
- ✅ **Browser-Native IPFS**: No plugins or extensions required
- ✅ **P2P Content Retrieval**: Fetch content from IPFS network via libp2p
- ✅ **Cryptographic Verification**: Verify content integrity using verified-fetch
- ✅ **Service Worker Caching**: Cache IPFS content in browser for offline access
- ✅ **Subdomain Gateway**: Each CID gets isolated subdomain (e.g., `bafyb...xyz.ipfs.domain.com`)
- ✅ **IPNS Support**: Mutable pointers via `<dnslink>.ipns.domain.com`

### Security & Performance
- 🔒 **HTTPS Required**: Service Workers only work over HTTPS (enforced)
- 🔒 **Security Headers**: HSTS, XSS protection, referrer policy
- 🔒 **Wildcard SSL**: Cloudflare DNS-01 challenge for `*.ipfs.*` and `*.ipns.*`
- ⚡ **Lightweight**: ~20MB Docker image (Alpine + Go binary)
- ⚡ **Fast Startup**: 10s health check period (embedded static files)
- ⚡ **Stateless**: No databases, no volumes, no persistent data

## Prerequisites

- **Dokploy**: Self-hosted deployment platform
- **Domain Name**: Pointed to your Dokploy server
- **Cloudflare Account**: **REQUIRED** for wildcard SSL (DNS-01 challenge)
- **DNS Configuration**: Wildcard DNS records for `*.ipfs.domain.com` and `*.ipns.domain.com`
- **Resources**:
  - CPU: 0.5-1 cores (lightweight Go binary)
  - RAM: 256-512 MB
  - Disk: Minimal (stateless, ~20MB image)

## Cloudflare DNS Setup (REQUIRED)

### Why Cloudflare DNS-01 is Required

**Service Workers ONLY work over HTTPS** (browser security policy). To support unlimited IPFS subdomains (e.g., `bafybeigdyr...xyz.ipfs.domain.com`), you need a **wildcard SSL certificate** covering `*.ipfs.domain.com` and `*.ipns.domain.com`.

**HTTP-01 ACME challenge cannot issue wildcard certificates** - only DNS-01 can. Cloudflare DNS-01 requires API access to your DNS records.

### Step 1: Configure Wildcard DNS Records

In Cloudflare DNS dashboard, add these records:

```
Type    Name                   Content             Proxy   TTL
A       @                      YOUR_DOKPLOY_IP     DNS     Auto
A       *.ipfs                 YOUR_DOKPLOY_IP     DNS     Auto
A       *.ipns                 YOUR_DOKPLOY_IP     DNS     Auto
```

**Important**: Set Proxy status to **DNS only** (grey cloud, not orange) to allow proper SSL handling.

### Step 2: Create Cloudflare DNS API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Profile → **API Tokens**
2. Click **"Create Token"**
3. Use template: **"Edit zone DNS"**
4. Configure permissions:
   - **Permissions**: Zone → DNS → Edit
   - **Zone Resources**: Include → Specific zone → [your domain]
5. Click **"Continue to summary"** → **"Create Token"**
6. **Copy the token** (you won't see it again!)

### Step 3: Configure Traefik for Cloudflare DNS-01

Your Dokploy Traefik instance needs Cloudflare DNS-01 configuration. Add to `traefik.yml`:

```yaml
certificatesResolvers:
  cloudflare:
    acme:
      email: your-email@example.com
      storage: /letsencrypt/acme.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "1.0.0.1:53"
```

And set Cloudflare credentials in Traefik environment:

```yaml
environment:
  CF_DNS_API_TOKEN: your-cloudflare-dns-api-token
```

**Note**: If your Dokploy already has Cloudflare DNS-01 configured, you can skip this step and just provide the token when deploying this template.

## Installation

### 1. Deploy in Dokploy

1. Log into your Dokploy dashboard
2. Navigate to **Templates** → **Community Templates**
3. Search for **"IPFS Service Worker Gateway"** or find in the IPFS category
4. Click **"Deploy"**

### 2. Configure Required Variables

| Variable | Required? | Default | Description |
|----------|-----------|---------|-------------|
| `DOMAIN` | **Yes** | - | Your gateway domain (e.g., `ipfs.example.com`) |
| `CF_DNS_API_TOKEN` | **Yes** | - | Cloudflare DNS API token (see setup above) |

### 3. Verify DNS Configuration

Before deploying, verify DNS records are propagated:

```bash
# Check main domain
dig +short ipfs.example.com
# Should return: YOUR_DOKPLOY_IP

# Check IPFS wildcard
dig +short bafytest.ipfs.ipfs.example.com
# Should return: YOUR_DOKPLOY_IP

# Check IPNS wildcard
dig +short test.ipns.ipfs.example.com
# Should return: YOUR_DOKPLOY_IP
```

### 4. Deploy and Verify

1. Click **"Deploy"** in Dokploy
2. Wait for deployment to complete (~2-3 minutes for build)
3. Check service health:
   ```bash
   docker ps | grep ipfs-sw-gateway
   ```
4. Verify gateway is responding:
   ```bash
   curl https://ipfs.example.com/
   ```

## Usage

### Access Gateway Web Interface

Visit your gateway domain:
```
https://ipfs.example.com/
```

You should see the IPFS Service Worker Gateway interface.

### Fetch IPFS Content

#### Via Path Gateway (Traditional)
```
https://ipfs.example.com/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi
```

#### Via Subdomain Gateway (Recommended)
```
https://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi.ipfs.ipfs.example.com/
```

**Why subdomain gateway?**
- Better isolation (each CID has its own origin in browser)
- Improved security (separate cookies, storage per CID)
- CORS-friendly (no cross-origin issues)

### Fetch IPNS Content

#### DNSLink Resolution
```
https://docs.ipfs.tech.ipns.ipfs.example.com/
```

This resolves the DNSLink TXT record for `_dnslink.docs.ipfs.tech` and fetches content from IPFS.

#### IPNS Name Resolution
```
https://k51qzi5uqu5dg9ws...xyz.ipns.ipfs.example.com/
```

### Service Worker Status

Check if Service Worker is registered:

1. Open your gateway in browser: `https://ipfs.example.com/`
2. Open Developer Tools → Application → Service Workers
3. You should see `service-worker-gateway` registered for your domain

## Configuration

### Environment Variables

All configuration is done via environment variables set during Dokploy deployment:

```yaml
# Domain Configuration
GATEWAY_DOMAIN: ipfs.example.com

# Cloudflare DNS API Token (REQUIRED for wildcard SSL)
CF_DNS_API_TOKEN: your-cloudflare-dns-api-token
```

### Custom Domain Configuration

To use a different domain structure:

1. Update `DOMAIN` in Dokploy deployment
2. Ensure wildcard DNS records exist:
   - `*.ipfs.yourdomain.com` → Dokploy IP
   - `*.ipns.yourdomain.com` → Dokploy IP
3. Redeploy the service

### Resource Limits (Optional)

For production deployments, consider adding resource limits in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: "0.5"
    reservations:
      memory: 128M
      cpus: "0.1"
```

## Troubleshooting

### Issue: Service Worker Not Registering

**Symptoms**: Service Worker fails to register, console shows HTTPS errors

**Diagnosis**:
```bash
# Check if site is served over HTTPS
curl -I https://ipfs.example.com/
# Should return: HTTP/2 200
```

**Solution**:
- **Service Workers ONLY work over HTTPS** (or localhost for dev)
- Verify Traefik is serving HTTPS (check Traefik labels in compose)
- Check Cloudflare DNS-01 certificate issuance:
  ```bash
  docker logs traefik | grep "Obtaining certificate"
  ```
- Ensure DNS records are DNS-only (grey cloud), not proxied (orange cloud)

### Issue: Wildcard SSL Certificate Not Issued

**Symptoms**: 502 Bad Gateway, SSL errors in browser

**Diagnosis**:
```bash
# Check Traefik logs for ACME errors
docker logs traefik | grep "cloudflare\|acme\|certificate"
```

**Common Causes**:
1. **Invalid CF_DNS_API_TOKEN**: Token doesn't have DNS:Edit permission
2. **Wrong zone scope**: Token doesn't include your specific domain
3. **Traefik not configured**: Cloudflare certresolver not defined in traefik.yml

**Solution**:
- Recreate Cloudflare DNS API token with correct permissions
- Verify token has access to your specific zone
- Check Traefik configuration for `cloudflare` certresolver
- Restart Traefik after configuration changes

### Issue: IPFS Content Not Loading

**Symptoms**: Subdomain gateway returns 404 or timeout errors

**Diagnosis**:
1. Check if Service Worker is registered (DevTools → Application → Service Workers)
2. Check browser console for IPFS errors
3. Test with known working CID:
   ```
   https://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi.ipfs.ipfs.example.com/
   ```

**Solution**:
- Ensure Service Worker is registered (reload page if not)
- Check if CID is valid and available on IPFS network
- Verify wildcard DNS is resolving correctly:
  ```bash
  dig +short randomtest.ipfs.ipfs.example.com
  # Should return your Dokploy IP
  ```
- Check gateway logs for errors:
  ```bash
  docker logs ipfs-sw-gateway
  ```

### Issue: DNS Resolution Failures

**Symptoms**: Cannot access `*.ipfs.domain.com` or `*.ipns.domain.com`

**Diagnosis**:
```bash
# Test wildcard resolution
dig +short test123.ipfs.yourdomain.com
# Should return: YOUR_DOKPLOY_IP

# Check DNS propagation
dig +short test123.ipfs.yourdomain.com @1.1.1.1
dig +short test123.ipfs.yourdomain.com @8.8.8.8
```

**Solution**:
- Verify wildcard A records exist in Cloudflare DNS
- Wait for DNS propagation (up to 24 hours, typically 5-10 minutes)
- Use DNS-only mode (grey cloud), not Cloudflare proxy (orange cloud)
- Clear local DNS cache:
  ```bash
  # macOS
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

  # Linux
  sudo systemd-resolve --flush-caches
  ```

### Issue: Health Check Failing

**Symptoms**: Container marked as unhealthy in `docker ps`

**Diagnosis**:
```bash
# Check health status
docker inspect ipfs-sw-gateway | jq '.[0].State.Health'

# Test health endpoint manually
docker exec ipfs-sw-gateway wget -qO- http://localhost:3000/
```

**Solution**:
- Increase `start_period` if service takes longer to start
- Check if port 3000 is accessible inside container
- Review gateway startup logs for errors:
  ```bash
  docker logs ipfs-sw-gateway --tail 100
  ```

## Security Considerations

### Production Deployment Checklist

- ✅ **HTTPS Only**: Service Workers require HTTPS (enforced by browser)
- ✅ **Security Headers**: HSTS, XSS protection enabled by default
- ✅ **Wildcard Certificate**: Properly scoped to `*.ipfs.*` and `*.ipns.*`
- ✅ **Cloudflare Token Security**: Store CF_DNS_API_TOKEN securely in Dokploy
- ✅ **Regular Updates**: Monitor for gateway updates and rebuild periodically
- ✅ **DNS-Only Mode**: Use grey cloud (DNS-only), not orange cloud (proxied)

### Cloudflare DNS API Token Security

⚠️ **CRITICAL SECURITY PRACTICES**:

- **Least Privilege**: Token should ONLY have `Zone:DNS:Edit` permission
- **Scope to Specific Zone**: Don't use account-wide tokens
- **Rotate Regularly**: Regenerate token quarterly or if compromised
- **Secure Storage**: Store in Dokploy secrets, never commit to version control
- **Monitor Usage**: Review Cloudflare audit logs for unexpected DNS changes

**Potential Risk**: A compromised DNS API token could allow attackers to modify DNS records, potentially redirecting your domain. Mitigate by:
- Using zone-scoped tokens (not account-wide)
- Enabling Cloudflare email notifications for DNS changes
- Implementing DNS CAA records to restrict certificate issuance

### Wildcard Certificate Security

**Understanding Wildcard Certificates**:
- Single cert covers unlimited subdomains: `*.ipfs.domain.com`
- Each IPFS CID gets its own subdomain (e.g., `bafyb...xyz.ipfs.domain.com`)
- Browser treats each subdomain as separate origin (security isolation)

**Security Implications**:
- Compromised content on one subdomain cannot access data from another subdomain
- Phishing attacks could use subdomains that appear to be from your domain
- Users should verify full subdomain (including CID) before trusting content

**Best Practices**:
- Monitor gateway access logs for suspicious subdomain patterns
- Consider implementing rate limiting at Traefik level
- Educate users about subdomain verification

## Upgrading

### Update Gateway Version

The IPFS Service Worker Gateway uses commit SHA-based versioning.

**Current Version**: `39dce782d27bc0eb43ff2096acc3dcbe4c7def45` (2025-12-27)

To update:

1. Check latest version at https://github.com/ipfs/service-worker-gateway/commits/main
2. Note the commit SHA of the version you want to deploy
3. Edit `Dockerfile`:
   ```dockerfile
   # Update line 11
   git checkout <NEW_COMMIT_SHA>
   ```
4. Rebuild and redeploy:
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```
5. Verify health:
   ```bash
   docker ps | grep ipfs-sw-gateway
   curl https://ipfs.example.com/
   ```

### Backup Before Upgrading

Since the gateway is stateless (no volumes), no backup is needed. However, document your configuration:

```bash
# Backup configuration
docker compose config > docker-compose.backup.yml

# Backup environment variables
cp .env .env.backup
```

## Performance Tuning

### For High-Traffic Gateways

```yaml
# In docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: "2.0"
    reservations:
      memory: 256M
      cpus: "0.5"

  replicas: 3  # Scale horizontally
```

### For Low-Resource Servers

```yaml
deploy:
  resources:
    limits:
      memory: 256M
      cpus: "0.25"
```

### Browser Caching

The gateway leverages Service Worker caching for performance:
- First request: Fetches from IPFS network (slower)
- Subsequent requests: Served from Service Worker cache (instant)
- Cache persists across page reloads
- Cache cleared when Service Worker updates

## Additional Resources

- **Official Repository**: https://github.com/ipfs/service-worker-gateway
- **IPFS Documentation**: https://docs.ipfs.tech/
- **Service Workers API**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **Helia (IPFS Implementation)**: https://github.com/ipfs/helia
- **verified-fetch**: https://github.com/ipfs/verified-fetch
- **Cloudflare DNS**: https://developers.cloudflare.com/dns/
- **Traefik DNS Challenge**: https://doc.traefik.io/traefik/https/acme/#dnschallenge
- **Dokploy Documentation**: https://docs.dokploy.com/

## Support

For issues or questions:
- **Template Issues**: Open an issue in this repository
- **IPFS Service Worker Gateway Issues**: https://github.com/ipfs/service-worker-gateway/issues
- **IPFS Community**: https://discuss.ipfs.tech/
- **Dokploy Support**: https://docs.dokploy.com/

## License

This template configuration is provided under MIT License. The IPFS Service Worker Gateway is licensed under MIT/Apache-2.0 (see upstream repository).
