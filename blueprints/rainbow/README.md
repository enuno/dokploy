# Rainbow IPFS Gateway

Production-ready IPFS HTTP Gateway for self-hosted content retrieval from the IPFS network. Rainbow implements the [IPFS HTTP Gateway API](https://specs.ipfs.tech/http-gateways/) specification with optimized performance for gateway-only deployments.

## Overview

Rainbow is a specialized IPFS gateway that acts as a DHT and Bitswap client, optimized for content retrieval without permanent storage. This template provides:

- **Subdomain Gateway Support**: Access IPFS content via `https://<cid>.ipfs.yourdomain.com`
- **Wildcard SSL Certificates**: Automatic Let's Encrypt certificates via Cloudflare DNS-01 challenge
- **Admin Protection**: Optional Cloudflare Zero Trust authentication for management endpoints
- **Production-Grade Security**: HSTS, security headers, and encrypted traffic
- **Automatic Configuration**: Connects to IPFS mainnet with optimal settings
- **Resource Efficiency**: No permanent storage, automatic garbage collection

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                 Rainbow IPFS Gateway                      │
│                                                            │
│  ┌─────────────┐     ┌──────────────┐                    │
│  │   Gateway   │────▶│  Local Cache │                    │
│  │  (HTTP API) │     │  (flatfs)    │                    │
│  │   :8080     │     │  /data       │                    │
│  └─────────────┘     └──────────────┘                    │
│         │                                                  │
│  ┌──────┴──────┐     ┌──────────────┐                    │
│  │   Mgmt API  │     │  Libp2p/DHT  │                    │
│  │    :8091    │     │    :4001     │                    │
│  └─────────────┘     └──────────────┘                    │
└──────────────────────────────────────────────────────────┘
         │                      │
         │                      └────▶ IPFS Network
         │
         ├────▶ Cloudflare DNS-01 (wildcard SSL)
         │
         └────▶ Cloudflare Zero Trust (admin auth)
         │
         ▼
   Traefik (HTTPS)
```

## Features

### IPFS Gateway Capabilities
- ✅ **Path Gateway**: `https://yourdomain.com/ipfs/<cid>`
- ✅ **Subdomain Gateway**: `https://<cid>.ipfs.yourdomain.com/`
- ✅ **DNSLink Support**: Resolve IPFS content via DNS
- ✅ **Automatic Peer Discovery**: Connects to IPFS mainnet via DHT
- ✅ **Content Caching**: Local blockstore with automatic garbage collection
- ✅ **Denylist Support**: Content filtering capabilities

### Security & Performance
- 🔒 **Wildcard SSL**: Automatic certificates for subdomain gateway
- 🔒 **Security Headers**: HSTS, XSS protection, referrer policy
- 🔒 **Admin Authentication**: Cloudflare Zero Trust for management API
- ⚡ **Optimized Storage**: Flatfs datastore with writethrough uncached blockstore
- ⚡ **Auto Garbage Collection**: Configurable threshold and interval
- ⚡ **Production Hardened**: Based on Boxo (same as Kubo IPFS)

## Prerequisites

- **Dokploy**: Self-hosted deployment platform
- **Cloudflare Account**: For DNS-01 challenge (wildcard SSL)
- **Domain Name**: Pointed to your Dokploy server
- **Resources**:
  - CPU: 2-4 cores (IPFS DHT and Bitswap are network-intensive)
  - RAM: 2-4 GB (depends on caching strategy)
  - Disk: 50-500 GB (local cache before garbage collection)

## Cloudflare Configuration

### DNS-01 Challenge for Wildcard SSL (REQUIRED)

Rainbow requires wildcard SSL certificates for the subdomain gateway pattern (`*.ipfs.yourdomain.com`). HTTP-01 challenge cannot issue wildcard certificates, so Cloudflare DNS-01 challenge is required.

#### Step 1: Create DNS API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Profile → API Tokens
2. Click **"Create Token"**
3. Use template: **"Edit zone DNS"**
4. Configure permissions:
   - **Permissions**: Zone → DNS → Edit
   - **Zone Resources**: Include → Specific zone → Select your domain
5. Click **"Continue to summary"** → **"Create Token"**
6. **Copy the token** (you won't see it again)

#### Step 2: Configure in Dokploy

When deploying the Rainbow template in Dokploy, provide:

| Variable | Value | Description |
|----------|-------|-------------|
| `CF_DNS_API_TOKEN` | `your-token-here` | DNS API token from Step 1 |
| `DOMAIN` | `rainbow.yourdomain.com` | Your gateway domain |

#### Step 3: DNS Records

Create these DNS records in Cloudflare:

```
Type: A
Name: rainbow
Content: <your-dokploy-server-ip>
Proxy status: DNS only (grey cloud)

Type: CNAME
Name: *.ipfs.rainbow
Content: rainbow.yourdomain.com
Proxy status: DNS only (grey cloud)
```

**Important**: Set proxy status to "DNS only" (grey cloud), not "Proxied" (orange cloud), for Traefik to handle SSL certificates directly.

### Cloudflare Zero Trust (OPTIONAL)

Protect the Rainbow management API (`/mgr/*` endpoints) with authentication.

#### Step 1: Set Up Cloudflare Access

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Zero Trust → Access
2. Click **"Add an Application"** → **"Self-hosted"**
3. Configure application:
   - **Application name**: Rainbow Management API
   - **Application domain**: `rainbow.yourdomain.com`
   - **Path**: `/mgr/*`
4. Configure access policy:
   - **Policy name**: Allow Admins
   - **Action**: Allow
   - **Include**: Emails ending in `@yourdomain.com` (or your requirements)
5. Click **"Add application"**

#### Step 2: Get Team Name

1. Go to Zero Trust → Settings → Custom Pages
2. Your team name is in the URL: `https://<TEAM-NAME>.cloudflareaccess.com`
3. Copy the team name (e.g., `mycompany`)

#### Step 3: Configure in Dokploy

| Variable | Value | Description |
|----------|-------|-------------|
| `CF_TEAM_NAME` | `mycompany` | Your Zero Trust team name |

**Note**: If you leave `CF_TEAM_NAME` empty, the management API will be publicly accessible (not recommended for production).

## Installation

### 1. Deploy in Dokploy

1. Log into your Dokploy dashboard
2. Navigate to **Templates** → **Community Templates**
3. Search for **"Rainbow"** or find it in the IPFS category
4. Click **"Deploy"**

### 2. Configure Required Variables

| Variable | Required? | Default | Description |
|----------|-----------|---------|-------------|
| `DOMAIN` | **Yes** | - | Your gateway domain (e.g., `rainbow.example.com`) |
| `CF_DNS_API_TOKEN` | **Yes** | - | Cloudflare DNS API token for wildcard SSL |
| `CF_TEAM_NAME` | No | (empty) | Cloudflare Zero Trust team name for admin protection |
| `RAINBOW_GC_INTERVAL` | No | `1h` | How often to run garbage collection |
| `RAINBOW_GC_THRESHOLD` | No | `90` | Free disk space target (percentage) |

### 3. Deploy and Verify

1. Click **"Deploy"** in Dokploy
2. Wait for deployment to complete (~2-3 minutes)
3. Check service health:
   ```bash
   docker ps | grep rainbow
   ```
4. Verify DHT connectivity:
   ```bash
   curl https://rainbow.example.com/mgr/peers
   ```

## Usage

### Access IPFS Content

#### Path Gateway (Standard)
```
https://rainbow.yourdomain.com/ipfs/QmHash
```

#### Subdomain Gateway (IPFS Native)
```
https://QmHash.ipfs.rainbow.yourdomain.com/
```

#### Example: Fetch a File
```bash
# Using path gateway
curl https://rainbow.yourdomain.com/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme

# Using subdomain gateway
curl https://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG.ipfs.rainbow.yourdomain.com/readme
```

### Management API

Access management endpoints at `https://rainbow.yourdomain.com/mgr/*` (protected by Cloudflare Zero Trust if configured).

#### List Connected Peers
```bash
curl https://rainbow.yourdomain.com/mgr/peers
```

#### Trigger Garbage Collection
```bash
curl -X POST https://rainbow.yourdomain.com/mgr/gc
```

#### Adjust Log Level
```bash
# Set debug logging for blockstore
curl "https://rainbow.yourdomain.com/mgr/log/level?subsystem=blockstore&level=debug"
```

#### Disconnect Peer
```bash
curl "https://rainbow.yourdomain.com/mgr/purge?peer=<peer-id>"
```

## Configuration

### Environment Variables

All configuration is done via environment variables. Common tuning options:

#### Garbage Collection
```yaml
RAINBOW_GC_INTERVAL: "30m"      # Run GC every 30 minutes
RAINBOW_GC_THRESHOLD: "85"      # Keep 15% free space
```

#### Automatic Configuration
```yaml
RAINBOW_AUTOCONF: "true"                                    # Enable auto-config
RAINBOW_AUTOCONF_URL: "https://conf.ipfs-mainnet.org/autoconf.json"
RAINBOW_AUTOCONF_REFRESH: "12h"                            # Refresh config every 12h
```

#### Custom Bootstrap Peers
```yaml
RAINBOW_BOOTSTRAP: "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN,..."
```

### Resource Limits

For production deployments, consider adding resource limits:

```yaml
deploy:
  resources:
    limits:
      memory: 4G
      cpus: "2.0"
    reservations:
      memory: 1G
      cpus: "0.5"
```

## Monitoring

### Health Checks

Rainbow includes built-in health monitoring:

```bash
# Check service health
curl https://rainbow.yourdomain.com/mgr/peers

# View container health
docker inspect rainbow | jq '.[0].State.Health'
```

### Metrics

Monitor these key metrics:

- **Peer connections**: Number of connected IPFS peers
- **Disk usage**: Cache size and garbage collection frequency
- **Request rate**: Gateway request volume
- **Cache hit rate**: How often content is served from cache vs. fetched from network

### Logs

View Rainbow logs:

```bash
# Docker logs
docker logs rainbow -f

# Via Dokploy dashboard
# Navigate to: Services → Rainbow → Logs
```

## Troubleshooting

### Issue: Wildcard SSL Certificate Not Working

**Symptoms**: `*.ipfs.yourdomain.com` returns certificate errors

**Diagnosis**:
1. Check DNS API token has correct permissions:
   ```bash
   docker logs traefik | grep cloudflare
   ```
2. Verify DNS records exist:
   ```bash
   dig *.ipfs.rainbow.yourdomain.com
   ```

**Solution**:
- Ensure `CF_DNS_API_TOKEN` has Zone:DNS:Edit permission
- Verify DNS CNAME record: `*.ipfs.rainbow` → `rainbow.yourdomain.com`
- Check Traefik logs for certificate generation errors

### Issue: No Peers Connecting

**Symptoms**: `/mgr/peers` returns empty list or very few peers

**Diagnosis**:
```bash
# Check DHT connectivity
curl https://rainbow.yourdomain.com/mgr/peers | jq length

# View Rainbow logs
docker logs rainbow | grep -i "peer\|dht"
```

**Solution**:
- Wait 2-5 minutes for initial DHT bootstrap
- Check firewall allows outbound connections on port 4001
- Verify `RAINBOW_AUTOCONF` is enabled (default)
- Consider custom bootstrap peers if behind restrictive firewall

### Issue: Slow Content Retrieval

**Symptoms**: IPFS content takes a long time to load

**Diagnosis**:
- Check peer count (should be 50-200+)
- Monitor disk I/O (cache writes)
- Check network bandwidth

**Solution**:
- Increase `RAINBOW_GC_THRESHOLD` to allow larger cache
- Add more CPU/memory resources
- Consider faster storage (SSD recommended)
- Verify network connectivity to IPFS mainnet

### Issue: Disk Space Filling Up

**Symptoms**: Disk usage constantly increasing

**Diagnosis**:
```bash
# Check current disk usage
docker exec rainbow du -sh /data

# View GC status
docker logs rainbow | grep -i "garbage\|gc"
```

**Solution**:
- Lower `RAINBOW_GC_THRESHOLD` (e.g., 80% instead of 90%)
- Increase `RAINBOW_GC_INTERVAL` frequency (e.g., 30m instead of 1h)
- Manually trigger GC:
  ```bash
  curl -X POST https://rainbow.yourdomain.com/mgr/gc
  ```

### Issue: Cloudflare Zero Trust Not Working

**Symptoms**: Management API accessible without authentication

**Diagnosis**:
1. Check `CF_TEAM_NAME` is set correctly
2. Verify Cloudflare Access application is active
3. Check Traefik middleware configuration:
   ```bash
   docker logs traefik | grep rainbow-cf-access
   ```

**Solution**:
- Ensure `CF_TEAM_NAME` matches your Zero Trust team name exactly
- Verify Access application path is `/mgr/*`
- Check Access policy includes your email/identity provider
- Try accessing in incognito mode to bypass cached auth

## Performance Tuning

### For High-Traffic Gateways

```yaml
# Increase cache size
RAINBOW_GC_THRESHOLD: "95"  # Keep only 5% free

# More aggressive GC
RAINBOW_GC_INTERVAL: "15m"  # Run every 15 minutes

# Resource limits
deploy:
  resources:
    limits:
      memory: 8G
      cpus: "4.0"
```

### For Low-Resource Servers

```yaml
# Smaller cache
RAINBOW_GC_THRESHOLD: "80"  # Keep 20% free

# Less frequent GC
RAINBOW_GC_INTERVAL: "2h"   # Run every 2 hours

# Resource limits
deploy:
  resources:
    limits:
      memory: 2G
      cpus: "1.0"
```

## Security Considerations

### Production Deployment Checklist

- ✅ **Wildcard SSL Enabled**: Cloudflare DNS-01 challenge configured
- ✅ **Admin Protection**: Cloudflare Zero Trust protecting `/mgr/*`
- ✅ **Security Headers**: HSTS, XSS protection, content-type sniffing disabled
- ✅ **HTTPS Only**: All traffic encrypted via Traefik
- ✅ **DNS Monitoring**: Monitor for unauthorized DNS record changes
- ✅ **Access Logs**: Enable Traefik access logs for audit trails

### Recommended Cloudflare Settings

1. **DNS Records**: Use DNS-only mode (grey cloud) for proper SSL handling
2. **Zero Trust**: Enable session duration limits (e.g., 24 hours)
3. **API Tokens**: Use scoped tokens (Zone:DNS:Edit only, not global)
4. **Audit Logs**: Review Cloudflare audit logs monthly

## Upgrading

### Update Rainbow Version

1. Edit `docker-compose.yml`:
   ```yaml
   image: ghcr.io/ipfs/rainbow:v1.22.0  # Update version
   ```

2. Pull new image and restart:
   ```bash
   docker compose pull rainbow
   docker compose up -d rainbow
   ```

3. Verify health:
   ```bash
   docker ps | grep rainbow
   curl https://rainbow.yourdomain.com/mgr/peers
   ```

### Backup Before Upgrading

```bash
# Backup configuration
docker compose config > docker-compose.backup.yml

# Backup peer identity (optional, will regenerate if lost)
docker cp rainbow:/libp2p-identity/libp2p.key ./libp2p.key.backup
```

## Additional Resources

- **Official Repository**: https://github.com/ipfs/rainbow
- **IPFS HTTP Gateway Spec**: https://specs.ipfs.tech/http-gateways/
- **Cloudflare DNS-01**: https://doc.traefik.io/traefik/https/acme/#dnschallenge
- **Cloudflare Zero Trust**: https://developers.cloudflare.com/cloudflare-one/
- **IPFS Documentation**: https://docs.ipfs.tech/

## License

Rainbow is dual-licensed under MIT and Apache 2.0.

## Support

For issues or questions:
- **Template Issues**: Open an issue in this repository
- **Rainbow Issues**: https://github.com/ipfs/rainbow/issues
- **IPFS Community**: https://discuss.ipfs.tech/
- **Dokploy Support**: https://docs.dokploy.com/
