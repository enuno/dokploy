# Kubo - IPFS Implementation in Go

![License](https://img.shields.io/badge/license-MIT%2FApache--2.0-blue.svg)
![Docker](https://img.shields.io/badge/docker-required-blue.svg)
![Version](https://img.shields.io/badge/version-v0.39.0-green.svg)

**Kubo** is the first and most widely used implementation of the InterPlanetary File System (IPFS), written in Go. It provides a robust, production-ready IPFS node with both Gateway (HTTP access to IPFS content) and RPC API (full node control) capabilities.

## Overview

### What is Kubo?

Kubo (formerly go-ipfs) is a

 full IPFS node implementation that allows you to:

- **Store and retrieve content** using content-addressed storage (CIDs)
- **Participate in the IPFS network** via peer-to-peer swarm connectivity
- **Pin important content** to ensure availability across the network
- **Serve content** via HTTP gateway for browser access
- **Manage your node** via RPC API and WebUI

### Architecture

```
                    ┌─────────────────────┐
                    │   IPFS Network      │
                    │   (DHT, Swarm)      │
                    └──────────┬──────────┘
                               │ Port 4001 (P2P)
                               ▼
┌──────────────────────────────────────────────┐
│                Kubo Node                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   DHT    │  │  Blocks  │  │  Config  │  │
│  │ (Routing)│  │ (Storage)│  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└───┬────────────────────────────────────┬────┘
    │                                    │
    │ Port 8080                         │ Port 5001
    │ (Gateway)                         │ (RPC API + WebUI)
    ▼                                    ▼
┌─────────────┐                  ┌─────────────────┐
│   Public    │                  │  Admin Panel    │
│   Access    │                  │  (Protected)    │
│ (via Traefik)                  │ (via Traefik +  │
└─────────────┘                  │  Zero Trust)    │
                                  └─────────────────┘
```

### Key Features

- ✅ **Content Addressing**: Store and retrieve content by cryptographic hash (CID)
- ✅ **DHT Participation**: Distributed Hash Table for peer and content discovery
- ✅ **Swarm Connectivity**: P2P networking with UDP + TCP support
- ✅ **HTTP Gateway**: Browser-friendly access to IPFS content
- ✅ **RPC API**: Full programmatic control of the node
- ✅ **WebUI**: User-friendly administration interface
- ✅ **Fast Provider Announcements**: <1s content advertisement (v0.39.0+ DHT sweep provider)
- ✅ **Production Ready**: Resource limits, health checks, automatic SSL

## Prerequisites

- **Dokploy Instance**: Running Dokploy server with Traefik configured
- **Domain Names**:
  - Primary domain for gateway (e.g., `ipfs.example.com`)
  - Admin subdomain for RPC API (e.g., `admin-ipfs.example.com`)
- **Docker**: Managed by Dokploy
- **Storage**: Minimum 50GB for IPFS repository (scales with pinned content)
- **Resources**: Minimum 2 CPU cores, 6GB RAM (recommended: 4 CPU, 8GB RAM)

## Quick Start

### 1. Deploy via Dokploy UI

1. Navigate to your Dokploy instance
2. Go to **Templates** → **Import Template**
3. Select the **Kubo** template
4. Configure required variables:
   - `DOMAIN`: Your gateway domain (e.g., `ipfs.example.com`)
   - `ADMIN_DOMAIN`: Your admin subdomain (e.g., `admin-ipfs.example.com`)
5. Click **Deploy**

### 2. Access Your IPFS Node

Once deployed, your Kubo node will be available at:

**Gateway** (public content access):
```
https://your-domain.com/ipfs/<CID>
```

**Admin Panel** (protected WebUI):
```
https://admin.your-domain.com
```

### 3. Test Content Retrieval

Retrieve a file from the IPFS network:
```bash
# Via gateway
curl "https://your-domain.com/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"

# Example: IPFS logo
curl "https://your-domain.com/ipfs/QmPbDs1m6yqVfJQCFUdmuSmFFsb1F4Ppb2bNQYXHuPGxzN"
```

## Configuration

### Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| **Domain Configuration** ||||
| `DOMAIN` | - | ✅ | Gateway domain for public content access |
| `ADMIN_DOMAIN` | - | ✅ | Admin subdomain for RPC API + WebUI access |
| **IPFS Configuration** ||||
| `IPFS_PROFILE` | `server` | ❌ | IPFS profile: `server`, `lowpower`, `test`, or `default` |
| **Resource Management** ||||
| `GOMAXPROCS` | `4` | ❌ | Maximum OS threads (should match CPU limit) |
| `GOMEMLIMIT` | `7500MiB` | ❌ | Soft memory limit (~93% of container limit) |
| **Network Configuration** ||||
| `SWARM_PORT` | `4001` | ❌ | P2P swarm port (TCP + UDP, directly exposed) |
| **Private Network (Optional)** ||||
| `IPFS_SWARM_KEY` | - | ❌ | Swarm key for private IPFS networks (leave blank for public) |

### IPFS Profile Options

| Profile | Use Case | Resource Usage | Description |
|---------|----------|----------------|-------------|
| `server` | Production nodes | High | Optimized for dedicated IPFS nodes (recommended) |
| `lowpower` | Resource-constrained | Low | Reduced resource usage for lightweight deployments |
| `test` | Testing/development | Minimal | Minimal configuration for quick testing |
| `default` | Standard deployment | Medium | Standard IPFS configuration |

**Recommendation**: Use `server` profile for production deployments.

### Resource Scaling

**Storage Requirements**:
- Base repository: ~100 MB
- Per pinned item: Varies by content size
- Recommended minimum: 50 GB
- Scaling: Plan for 2x growth of pinned content

**Memory Requirements**:
- Base: 512 MB minimum
- Scaling: ~1 GB per 20 million pinned items
- Recommended: 6-8 GB for production

**CPU Requirements**:
- Minimum: 2 cores
- Recommended: 4+ cores (IPFS is highly parallel)
- Swarm connectivity benefits from multiple cores

### Port Strategy

| Port | Protocol | Exposure | Purpose |
|------|----------|----------|---------|
| 4001 | TCP + UDP | **Direct** | Swarm P2P connectivity (cannot use Traefik) |
| 5001 | HTTP | Traefik (admin subdomain) | RPC API + WebUI (MUST be protected) |
| 8080 | HTTP | Traefik (main domain) | HTTP Gateway (public content access) |

**Important**: Port 4001 MUST be directly exposed because:
- IPFS swarm requires UDP (Traefik is HTTP/TCP only)
- P2P connections need direct peer-to-peer routing
- NAT traversal requires both TCP and UDP

## Security

### RPC API Protection (Port 5001)

**CRITICAL**: The RPC API provides complete administrative access to your IPFS node:
- Add/remove content (pin/unpin)
- Modify node configuration
- Access private keys
- Control resource usage

**This template protects port 5001 via**:
1. **HTTPS Only**: Automatic SSL via LetsEncrypt
2. **Separate Subdomain**: Isolated from gateway on `${ADMIN_DOMAIN}`
3. **Stricter Security Headers**: Includes `frameDeny` to prevent clickjacking
4. **Zero Trust Ready**: Architecture supports optional Cloudflare Access (see below)

### Cloudflare Zero Trust Access (Recommended)

Protect the admin panel with Cloudflare Zero Trust Access for enhanced security:

#### 1. Create Cloudflare Access Application

1. Go to **Cloudflare Dashboard** → **Zero Trust** → **Access** → **Applications**
2. Click **Add an application** → **Self-hosted**
3. Configure application:
   - **Application name**: Kubo Admin Panel
   - **Subdomain**: `admin-ipfs` (or your admin subdomain)
   - **Domain**: Your domain
   - **Path**: Leave blank

4. Configure Access Policy:
   - **Policy name**: Admins Only
   - **Action**: Allow
   - **Include**: Add your email or team group

5. **Additional settings**:
   - Session Duration: 24 hours
   - Enable Binding Cookie (recommended)

6. Save application

#### 2. Verify Protection

Navigate to your admin panel:
```
https://admin.your-domain.com
```

You should be prompted to authenticate via Cloudflare Access before accessing the IPFS WebUI.

### Gateway Security (Port 8080)

The HTTP gateway (port 8080) is **intentionally public** - this is how users retrieve IPFS content via browsers. However:

- **HTTPS Only**: All gateway access encrypted via LetsEncrypt
- **Security Headers**: HSTS, XSS protection, content-type sniffing prevention
- **Rate Limiting**: Consider adding Traefik rate limiting for high-traffic deployments

### Swarm Security (Port 4001)

The swarm port (4001) is **intentionally public** for P2P connectivity. Security considerations:

- **Direct Exposure Required**: Cannot be proxied (P2P architecture)
- **Firewall Rules**: Consider restricting to known peer IPs if running private network
- **Private Networks**: Use `IPFS_SWARM_KEY` for private IPFS deployments

## Optional: Private IPFS Network

Create a private IPFS network isolated from the public network:

### 1. Generate Swarm Key

```bash
echo -e "/key/swarm/psk/1.0.0/\n/base16/\n`tr -dc 'a-f0-9' < /dev/urandom | head -c64`"
```

Example output:
```
/key/swarm/psk/1.0.0/
/base16/
0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### 2. Configure Swarm Key

Set the `IPFS_SWARM_KEY` environment variable in Dokploy:
```
IPFS_SWARM_KEY=/key/swarm/psk/1.0.0/
/base16/
0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### 3. Deploy Private Network

All nodes with the **same swarm key** will form a private network. They will:
- Only connect to peers with matching swarm key
- Ignore public IPFS network peers
- Provide isolated content routing

## Usage Examples

### Pin Content to Your Node

Via RPC API:
```bash
# Pin by CID
curl -X POST "https://admin.your-domain.com/api/v0/pin/add?arg=QmPbDs1m6yqVfJQCFUdmuSmFFsb1F4Ppb2bNQYXHuPGxzN"

# List pinned content
curl "https://admin.your-domain.com/api/v0/pin/ls"
```

Via WebUI:
1. Navigate to `https://admin.your-domain.com`
2. Go to **Files** → **Import**
3. Add content by CID or upload files

### Retrieve Content via Gateway

```bash
# By CID
curl "https://your-domain.com/ipfs/<CID>"

# By IPFS path
curl "https://your-domain.com/ipfs/<directory-CID>/file.txt"

# By IPNS name
curl "https://your-domain.com/ipns/<ipns-name>"
```

### Add Content to IPFS

```bash
# Add file via RPC API
curl -F file=@myfile.txt "https://admin.your-domain.com/api/v0/add"

# Response includes CID
{
  "Name": "myfile.txt",
  "Hash": "QmNewContentHash...",
  "Size": "1234"
}
```

### Node Statistics

```bash
# Node ID and addresses
curl "https://admin.your-domain.com/api/v0/id"

# Repository statistics
curl "https://admin.your-domain.com/api/v0/repo/stat"

# Bandwidth statistics
curl "https://admin.your-domain.com/api/v0/stats/bw"

# Connected peers
curl "https://admin.your-domain.com/api/v0/swarm/peers"
```

## Troubleshooting

### Issue: Gateway Returns 404 for Known CID

**Symptoms**: Gateway returns 404 or timeout for content that exists on IPFS network

**Causes**:
1. Content not yet discovered via DHT
2. No providers available for content
3. Firewall blocking swarm port

**Solutions**:
```bash
# 1. Check if node can reach DHT
curl "https://admin.your-domain.com/api/v0/dht/findprovs?arg=<CID>"

# 2. Verify swarm connectivity
curl "https://admin.your-domain.com/api/v0/swarm/peers" | grep -c "Addrs"
# Should show multiple connected peers

# 3. Test swarm port connectivity (from external host)
nc -zv your-server-ip 4001
# Should show "succeeded"

# 4. Manually connect to bootstrap nodes
curl -X POST "https://admin.your-domain.com/api/v0/swarm/connect?arg=/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN"
```

### Issue: High Memory Usage

**Symptoms**: Container consuming excessive RAM, potential OOM kills

**Causes**:
1. GOMEMLIMIT too high for container limit
2. Large number of pinned items
3. DHT cache accumulation

**Solutions**:
```env
# Option 1: Reduce memory limit to match container
GOMEMLIMIT=7500MiB  # For 8GB container (93% of 8192M)

# Option 2: Use lowpower profile
IPFS_PROFILE=lowpower

# Option 3: Reduce GOMAXPROCS to limit parallelism
GOMAXPROCS=2

# Option 4: Clear DHT cache (via RPC)
curl -X POST "https://admin.your-domain.com/api/v0/repo/gc"
```

### Issue: Swarm Port Connection Refused

**Symptoms**: Logs show "failed to dial" or "connection refused" for port 4001

**Causes**:
1. Firewall blocking port 4001
2. ISP blocking P2P ports
3. NAT/router not forwarding port

**Solutions**:
```bash
# 1. Verify port is exposed
docker ps | grep kubo
# Should show 0.0.0.0:4001->4001/tcp and 0.0.0.0:4001->4001/udp

# 2. Test external connectivity (from another machine)
nc -zv your-server-ip 4001  # TCP
nc -zvu your-server-ip 4001  # UDP

# 3. Check node's external addresses
curl "https://admin.your-domain.com/api/v0/id" | jq '.Addresses'

# 4. If behind NAT, configure port forwarding on router
# Forward external port 4001 → server IP:4001 (both TCP and UDP)
```

### Issue: Admin Panel Inaccessible (502 Bad Gateway)

**Symptoms**: Admin subdomain returns 502 error

**Causes**:
1. Kubo service not healthy
2. Traefik cannot route to port 5001
3. DNS not configured for admin subdomain

**Solutions**:
```bash
# 1. Check service health
docker ps | grep kubo
# Should show "healthy" status

# 2. View Kubo logs
docker logs <kubo-container-id>

# 3. Test internal connectivity
docker exec <kubo-container-id> curl -f http://localhost:5001/api/v0/id
# Should return node info

# 4. Verify DNS for admin subdomain
dig admin.your-domain.com
# Should resolve to your server IP

# 5. Check Traefik routing
curl -H "Host: admin.your-domain.com" http://localhost/api/v0/id
```

### Issue: Content Not Persisting After Restart

**Symptoms**: Pinned content disappears after container restart

**Causes**:
1. Volume not properly mounted
2. Repository corruption

**Solutions**:
```bash
# 1. Verify volume mount
docker inspect <kubo-container-id> | grep -A 5 "Mounts"
# Should show kubo-data volume mounted to /data/ipfs

# 2. Check volume data
docker volume inspect kubo-data
# Verify "Mountpoint" exists and has data

# 3. Verify repository integrity
docker exec <kubo-container-id> ipfs repo verify
```

### Issue: Slow Gateway Response Times

**Symptoms**: Gateway takes >30s to return content

**Causes**:
1. Content not cached locally (must be fetched from network)
2. Insufficient DHT peers
3. Resource constraints

**Solutions**:
```bash
# 1. Pre-fetch and pin frequently accessed content
curl -X POST "https://admin.your-domain.com/api/v0/pin/add?arg=<CID>"

# 2. Increase connection limits (if resources allow)
GOMAXPROCS=8
# Update container CPU limit to match

# 3. Use server profile for better performance
IPFS_PROFILE=server

# 4. Monitor DHT peer count
curl "https://admin.your-domain.com/api/v0/swarm/peers" | jq '. | length'
# Should show 20+ peers for healthy connectivity
```

## Performance Tuning

### For High-Traffic Gateways

```env
# Increase parallelism
GOMAXPROCS=8
# Update container CPU limit to 8.0

# Increase memory for caching
GOMEMLIMIT=15000MiB
# Update container memory limit to 16GB

# Use server profile
IPFS_PROFILE=server
```

### For Resource-Constrained Deployments

```env
# Reduce resource usage
GOMAXPROCS=2
GOMEMLIMIT=3500MiB
IPFS_PROFILE=lowpower

# Update container limits accordingly
deploy:
  resources:
    limits:
      cpus: "2.0"
      memory: 4096M
```

### For Private Networks

```env
# Disable public DHT (private network only)
IPFS_PROFILE=test
IPFS_SWARM_KEY=/key/swarm/psk/1.0.0/...

# Manually configure bootstrap peers (other private nodes)
# Via RPC:
# curl -X POST "https://admin.your-domain.com/api/v0/bootstrap/add?arg=/ip4/<peer-ip>/tcp/4001/p2p/<peer-id>"
```

## Monitoring

### Health Check

The template includes a health check using `ipfs id`:
```yaml
healthcheck:
  test: ["CMD-SHELL", "ipfs id || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

Check health status:
```bash
docker ps | grep kubo
# Should show "healthy" in STATUS column
```

### Key Metrics to Monitor

```bash
# Repository size
curl "https://admin.your-domain.com/api/v0/repo/stat" | jq '.RepoSize'

# Connected peers
curl "https://admin.your-domain.com/api/v0/swarm/peers" | jq '. | length'

# Bandwidth usage
curl "https://admin.your-domain.com/api/v0/stats/bw" | jq

# Pinned content count
curl "https://admin.your-domain.com/api/v0/pin/ls" | jq '.Keys | length'
```

### Prometheus Metrics (Optional)

Kubo exposes Prometheus metrics on port 5001:
```
https://admin.your-domain.com/debug/metrics/prometheus
```

**Note**: Metrics endpoint should be protected via Cloudflare Zero Trust Access (same as admin panel).

## Resources

- **Kubo GitHub**: https://github.com/ipfs/kubo
- **IPFS Documentation**: https://docs.ipfs.tech/
- **RPC API Reference**: https://docs.ipfs.tech/reference/kubo/rpc/
- **IPFS Specifications**: https://specs.ipfs.tech/
- **Community Forum**: https://discuss.ipfs.tech/
- **Dokploy Documentation**: https://docs.dokploy.com/

## Support

For issues specific to this Dokploy template:
- Review this README and troubleshooting section
- Check Dokploy logs: **Services** → **kubo** → **Logs**
- Verify environment variable configuration

For Kubo/IPFS issues:
- GitHub Issues: https://github.com/ipfs/kubo/issues
- IPFS Forums: https://discuss.ipfs.tech/
- IPFS Discord: https://discord.gg/ipfs

## License

Kubo is dual-licensed under MIT and Apache 2.0. See the [LICENSE](https://github.com/ipfs/kubo/blob/master/LICENSE) files for details.

---

**Template Version**: 1.0.0
**Last Updated**: December 27, 2025
**Maintainer**: Dokploy Community
