# someguy - HTTP Delegated Routing V1 Server for IPFS

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-required-blue.svg)
![Version](https://img.shields.io/badge/version-v0.11.0-green.svg)

**someguy** is an HTTP Delegated Routing V1 server that proxies IPFS routing requests to the Amino DHT and other Delegated Routing servers. It provides a lightweight, stateless gateway for IPFS content routing, peer discovery, and IPNS resolution without requiring a full IPFS node.

## Overview

### What is someguy?

someguy implements the [IPFS Delegated Routing V1 HTTP API](https://specs.ipfs.tech/routing/http-routing-v1/) specification, acting as a proxy between HTTP clients and the IPFS network's Distributed Hash Table (DHT). This allows applications to query the IPFS network for:

- **Provider Records**: Find peers hosting specific content (CIDs)
- **Peer Records**: Discover peer information and multiaddresses
- **IPNS Records**: Resolve IPNS names to content identifiers

### Architecture

```
┌─────────────┐
│   Client    │
│  (HTTP/S)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│     someguy         │
│  (Port 8190)        │
│                     │
│  Delegated Routing  │
│  V1 HTTP API        │
└──────┬──────────────┘
       │
       ├─────────────► IPFS Amino DHT (via LibP2P)
       │
       ├─────────────► IPNI (InterPlanetary Network Indexer)
       │
       └─────────────► Other Delegated Routing Endpoints
```

### Key Features

- ✅ **Stateless Design**: No persistent storage required
- ✅ **AutoConf Support**: Automatic bootstrap peer and routing endpoint configuration
- ✅ **Delegated Routing**: Proxies to multiple routing backends (DHT, IPNI, custom)
- ✅ **DHT Modes**: Accelerated, standard, or disabled DHT functionality
- ✅ **Connection Management**: Configurable LibP2P connection pooling
- ✅ **Metrics & Tracing**: Optional Prometheus metrics and OpenTelemetry tracing
- ✅ **Production Ready**: Health checks, security headers, automatic SSL via Traefik

## Prerequisites

- **Dokploy Instance**: Running Dokploy server with Traefik configured
- **Domain Name**: Domain pointing to your Dokploy server
- **Docker**: Managed by Dokploy
- **No Database Required**: someguy is completely stateless

## Quick Start

### 1. Deploy via Dokploy UI

1. Navigate to your Dokploy instance
2. Go to **Templates** → **Import Template**
3. Select the **someguy** template
4. Configure required variables:
   - `DOMAIN`: Your domain (e.g., `routing.example.com`)
5. Click **Deploy**

### 2. Access Your Instance

Once deployed, someguy will be available at:
```
https://your-domain.com/
```

Test the routing API:
```bash
# Get provider records for a CID
curl "https://your-domain.com/routing/v1/providers/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"

# Get peer information
curl "https://your-domain.com/routing/v1/peers/12D3KooWGC6TvWhfapngX6wvJHMYvKpDMXPb3ZnCZ6dMoaMtimQ5"

# Resolve IPNS name
curl "https://your-domain.com/routing/v1/ipns/k51qzi5uqu5dlvj2baxnqndepeb86cbk3ng7n3i46uzyxzyqj2xjonzllnv0v8"
```

## Configuration

### Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| **Domain & Network** ||||
| `DOMAIN` | - | ✅ | Your domain name |
| `SOMEGUY_DOMAIN` | `${DOMAIN}` | ✅ | someguy domain (usually same as DOMAIN) |
| `SOMEGUY_LISTEN_ADDRESS` | `0.0.0.0:8190` | ✅ | Listen address (**must be 0.0.0.0 for Traefik**) |
| **DHT Configuration** ||||
| `SOMEGUY_DHT` | `accelerated` | ❌ | DHT mode: `accelerated`, `standard`, or `off` |
| `SOMEGUY_CACHED_ADDR_BOOK` | `true` | ❌ | Enable address book caching |
| **Delegated Routing** ||||
| `SOMEGUY_PROVIDER_ENDPOINTS` | `auto` | ❌ | Provider routing endpoints (comma-separated URLs or `auto`) |
| `SOMEGUY_PEER_ENDPOINTS` | `auto` | ❌ | Peer routing endpoints (comma-separated URLs or `auto`) |
| `SOMEGUY_IPNS_ENDPOINTS` | `auto` | ❌ | IPNS routing endpoints (comma-separated URLs or `auto`) |
| **AutoConf** ||||
| `SOMEGUY_AUTOCONF` | `true` | ❌ | Enable automatic configuration |
| `SOMEGUY_AUTOCONF_URL` | `https://conf.ipfs-mainnet.org/autoconf.json` | ❌ | AutoConf endpoint |
| `SOMEGUY_AUTOCONF_REFRESH` | `24h` | ❌ | AutoConf refresh interval |
| **Logging** ||||
| `GOLOG_LOG_LEVEL` | `error` | ❌ | Log level: `error`, `warn`, `info`, `debug` |
| **LibP2P Connection Manager** ||||
| `SOMEGUY_LIBP2P_CONNMGR_LOW` | `100` | ❌ | Minimum connections to maintain |
| `SOMEGUY_LIBP2P_CONNMGR_HIGH` | `3000` | ❌ | Maximum connections before pruning |
| `SOMEGUY_LIBP2P_LISTEN_ADDRS` | (empty) | ❌ | Custom LibP2P listen multiaddrs |
| `SOMEGUY_LIBP2P_ANNOUNCE_ADDRS` | (empty) | ❌ | Custom LibP2P announce multiaddrs |
| `SOMEGUY_LIBP2P_NO_ANNOUNCE_ADDRS` | (empty) | ❌ | LibP2P addresses to NOT announce |
| **Metrics & Tracing** ||||
| `SOMEGUY_METRICS_ADDR` | (empty) | ❌ | Prometheus metrics endpoint (e.g., `0.0.0.0:9090`) |
| `SOMEGUY_TRACING` | `false` | ❌ | Enable OpenTelemetry tracing |
| `SOMEGUY_TRACING_AUTH` | (empty) | ❌ | Tracing authentication token |

### DHT Configuration Modes

| Mode | Performance | Resource Usage | Use Case |
|------|-------------|----------------|----------|
| `accelerated` | Fast | High | Production deployments with high traffic |
| `standard` | Balanced | Medium | Moderate traffic, resource-constrained |
| `off` | N/A | Low | Rely solely on delegated routing endpoints |

**Recommendation**: Use `accelerated` for production unless resource-constrained.

### Delegated Routing Endpoints

someguy can route requests to multiple backends:

1. **AutoConf (Recommended)**: Automatically fetches optimal endpoints from IPFS mainnet
   ```
   SOMEGUY_PROVIDER_ENDPOINTS=auto
   SOMEGUY_PEER_ENDPOINTS=auto
   SOMEGUY_IPNS_ENDPOINTS=auto
   ```

2. **Custom Endpoints**: Specify comma-separated HTTP URLs
   ```
   SOMEGUY_PROVIDER_ENDPOINTS=https://cid.contact/routing/v1,https://custom.example.com/routing/v1
   ```

3. **Mixed Mode**: Combine AutoConf with custom endpoints
   ```
   SOMEGUY_PROVIDER_ENDPOINTS=auto,https://custom.example.com/routing/v1
   ```

## Performance Tuning

### Connection Manager Settings

Adjust based on expected traffic and available resources:

| Traffic Level | Low (connmgr) | High (connmgr) | Memory Estimate |
|---------------|---------------|----------------|-----------------|
| Low (<100 req/min) | 50 | 500 | ~200 MB |
| Medium (<1000 req/min) | 100 | 3000 | ~500 MB |
| High (>1000 req/min) | 500 | 10000 | ~2 GB |

Example for high-traffic deployment:
```env
SOMEGUY_LIBP2P_CONNMGR_LOW=500
SOMEGUY_LIBP2P_CONNMGR_HIGH=10000
```

### Logging

For production, keep logging at `error` level:
```env
GOLOG_LOG_LEVEL=error
```

For debugging connection issues:
```env
GOLOG_LOG_LEVEL=info
```

For deep troubleshooting:
```env
GOLOG_LOG_LEVEL=debug
```

**Warning**: `debug` level generates significant log volume.

## Optional: Cloudflare Zero Trust Access

Protect metrics/tracing endpoints with Cloudflare Zero Trust Access:

### 1. Enable Metrics
```env
SOMEGUY_METRICS_ADDR=0.0.0.0:9090
```

### 2. Create Cloudflare Access Application

1. Go to **Cloudflare Dashboard** → **Zero Trust** → **Access** → **Applications**
2. Click **Add an application** → **Self-hosted**
3. Configure application:
   - **Application name**: someguy Metrics
   - **Subdomain**: `metrics` (or custom subdomain)
   - **Domain**: Your domain
   - **Path**: Leave blank or set to `/`

4. Configure Access Policy:
   - **Policy name**: Admins Only
   - **Action**: Allow
   - **Include**: Add your email or team group

5. Save application

### 3. Update Traefik Routing

Add subdomain routing for metrics endpoint:

```yaml
# In docker-compose.yml, add additional router
labels:
  # ... existing labels ...

  # Metrics endpoint
  - "traefik.http.routers.someguy-metrics.rule=Host(`metrics.${DOMAIN}`)"
  - "traefik.http.routers.someguy-metrics.entrypoints=websecure"
  - "traefik.http.routers.someguy-metrics.tls.certresolver=letsencrypt"
  - "traefik.http.services.someguy-metrics.loadbalancer.server.port=9090"
```

### 4. Access Metrics

Navigate to:
```
https://metrics.your-domain.com/metrics
```

You'll be prompted to authenticate via Cloudflare Access before accessing Prometheus metrics.

## Troubleshooting

### Issue: 502 Bad Gateway

**Symptoms**: Accessing domain returns 502 error

**Causes**:
1. someguy not listening on correct address
2. Traefik cannot reach service
3. Health check failing

**Solutions**:
```bash
# 1. Verify SOMEGUY_LISTEN_ADDRESS is 0.0.0.0:8190
# Check Dokploy environment variables

# 2. Check service health
docker ps | grep someguy
# Should show "healthy" status

# 3. View someguy logs
docker logs <container-id>

# 4. Test internal connectivity
docker exec <container-id> wget -qO- http://localhost:8190/
# Should return HTTP response
```

### Issue: DHT Connection Failures

**Symptoms**: Logs show "failed to dial DHT bootstrap peers"

**Causes**:
1. Network restrictions (firewall, ISP blocking)
2. Incorrect LibP2P configuration
3. AutoConf endpoint unreachable

**Solutions**:
```env
# Option 1: Disable DHT, rely on delegated routing only
SOMEGUY_DHT=off

# Option 2: Use standard DHT mode (less resource-intensive)
SOMEGUY_DHT=standard

# Option 3: Specify custom bootstrap peers
SOMEGUY_LIBP2P_ANNOUNCE_ADDRS=/ip4/YOUR_PUBLIC_IP/tcp/4001

# Option 4: Check AutoConf connectivity
curl https://conf.ipfs-mainnet.org/autoconf.json
```

### Issue: High Memory Usage

**Symptoms**: Container consuming excessive RAM

**Causes**:
1. Connection manager limits too high
2. DHT accelerated mode with high peer count
3. Address book caching accumulation

**Solutions**:
```env
# Reduce connection manager limits
SOMEGUY_LIBP2P_CONNMGR_LOW=50
SOMEGUY_LIBP2P_CONNMGR_HIGH=500

# Switch to standard DHT
SOMEGUY_DHT=standard

# Disable address book caching
SOMEGUY_CACHED_ADDR_BOOK=false
```

### Issue: Routing Queries Failing

**Symptoms**: HTTP 404 or empty provider records

**Causes**:
1. Delegated routing endpoints unreachable
2. AutoConf configuration stale
3. CID/IPNS record doesn't exist on network

**Solutions**:
```bash
# 1. Test AutoConf endpoint
curl https://conf.ipfs-mainnet.org/autoconf.json | jq .

# 2. Force AutoConf refresh (restart container)
docker restart <container-id>

# 3. Test with known-good CID
curl "https://your-domain.com/routing/v1/providers/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"

# 4. Check specific delegated routing endpoint
curl "https://cid.contact/routing/v1/providers/<cid>"
```

### Issue: Slow Query Response Times

**Symptoms**: Routing queries take >5 seconds

**Causes**:
1. DHT mode misconfigured
2. Insufficient connections to peers
3. AutoConf endpoints slow

**Solutions**:
```env
# Enable accelerated DHT
SOMEGUY_DHT=accelerated

# Increase connection manager limits
SOMEGUY_LIBP2P_CONNMGR_LOW=200
SOMEGUY_LIBP2P_CONNMGR_HIGH=5000

# Reduce AutoConf refresh interval
SOMEGUY_AUTOCONF_REFRESH=12h

# Add faster delegated routing endpoints
SOMEGUY_PROVIDER_ENDPOINTS=https://cid.contact/routing/v1,auto
```

## API Reference

someguy implements the [IPFS Delegated Routing V1 HTTP API](https://specs.ipfs.tech/routing/http-routing-v1/) specification.

### Endpoints

#### GET `/routing/v1/providers/{cid}`
Find providers for a content identifier (CID).

**Example**:
```bash
curl "https://your-domain.com/routing/v1/providers/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
```

**Response**: NDJSON stream of provider records

#### GET `/routing/v1/peers/{peer-id}`
Get peer information and multiaddresses.

**Example**:
```bash
curl "https://your-domain.com/routing/v1/peers/12D3KooWGC6TvWhfapngX6wvJHMYvKpDMXPb3ZnCZ6dMoaMtimQ5"
```

**Response**: JSON peer record

#### GET `/routing/v1/ipns/{ipns-name}`
Resolve IPNS name to content identifier.

**Example**:
```bash
curl "https://your-domain.com/routing/v1/ipns/k51qzi5uqu5dlvj2baxnqndepeb86cbk3ng7n3i46uzyxzyqj2xjonzllnv0v8"
```

**Response**: JSON IPNS record

### Health Check

#### GET `/`
Basic health check endpoint.

**Example**:
```bash
curl "https://your-domain.com/"
```

**Response**: 200 OK if healthy

## Monitoring

### Prometheus Metrics

Enable metrics collection:
```env
SOMEGUY_METRICS_ADDR=0.0.0.0:9090
```

**Available Metrics**:
- LibP2P connection counts
- DHT query latency
- Delegated routing backend response times
- Request counts and error rates
- Memory and Go runtime stats

**Scrape Configuration** (prometheus.yml):
```yaml
scrape_configs:
  - job_name: 'someguy'
    static_configs:
      - targets: ['someguy:9090']
```

### OpenTelemetry Tracing

Enable distributed tracing:
```env
SOMEGUY_TRACING=true
SOMEGUY_TRACING_AUTH=your-tracing-auth-token
```

## Resources

- **someguy GitHub**: https://github.com/ipfs/someguy
- **Delegated Routing Spec**: https://specs.ipfs.tech/routing/http-routing-v1/
- **IPFS Amino DHT**: https://blog.ipfs.tech/2023-09-amino-refactoring/
- **IPNI (InterPlanetary Network Indexer)**: https://github.com/ipni
- **Dokploy Documentation**: https://docs.dokploy.com/
- **Traefik Routing**: https://doc.traefik.io/traefik/routing/routers/

## Support

For issues specific to this Dokploy template:
- Review this README and troubleshooting section
- Check Dokploy logs: **Services** → **someguy** → **Logs**
- Verify environment variable configuration

For someguy application issues:
- GitHub Issues: https://github.com/ipfs/someguy/issues
- IPFS Forums: https://discuss.ipfs.tech/

## License

someguy is licensed under the MIT License. See the [LICENSE](https://github.com/ipfs/someguy/blob/main/LICENSE) file for details.

---

**Template Version**: 1.0.0
**Last Updated**: December 27, 2025
**Maintainer**: Dokploy Community
