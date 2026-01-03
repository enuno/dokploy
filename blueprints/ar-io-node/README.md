# AR.IO Node - Gateway to the Arweave Permaweb

Run your own **AR.IO gateway node** - a production-grade gateway to the Arweave permanent data storage network (the permaweb). This Dokploy template provides a complete 4-service stack with Cloudflare R2 integration for scalable archival storage.

## Overview

**AR.IO** is a scalable gateway implementation that indexes Arweave blockchain data and provides GraphQL access to the permaweb. As a gateway operator, you participate in the AR.IO network by serving Arweave data, earning rewards, and supporting decentralized permanent storage.

### Key Features

- **Complete 4-Service Stack**: Envoy proxy, Core gateway, Redis cache, Observer monitoring
- **Arweave Integration**: Full blockchain indexing from genesis or custom start height
- **ArNS Support**: Serve Arweave Name System (ArNS) content on subdomains
- **Cloudflare R2 Storage**: Optional S3-compatible archival for multi-TB datasets (zero egress fees)
- **Production-Ready**: Health checks, security headers, automatic SSL via Let's Encrypt
- **Network Rewards**: Participate in AR.IO network observation and earn rewards

### Official Resources

- **GitHub**: https://github.com/ar-io/ar-io-node
- **Documentation**: https://docs.ar.io
- **AR.IO Network**: https://ar.io

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    AR.IO Gateway Stack                        │
└──────────────────────────────────────────────────────────────┘

Internet
   │
   ▼
┌─────────────┐
│   Traefik   │ (Dokploy - HTTPS/SSL)
│  (Reverse   │
│   Proxy)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Envoy    │────▶│    Core     │────▶│   Redis 7   │
│  (Routing)  │     │  (Gateway)  │     │   (Cache)   │
│  Port 3000  │     │  Port 4000  │     │  Port 6379  │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │
       │
       ▼
┌─────────────┐
│  Observer   │
│ (Monitoring)│
│  Port 5050  │
└─────────────┘
       │
       ▼
External Services (Optional):
• Cloudflare R2 (Archival Storage)
• Arweave Network (Data Source)

Data Volumes (9 volumes):
• chunks/      - Arweave chunk data
• contiguous/  - Continuous data blocks
• headers/     - Block headers
• sqlite/      - Metadata database
• duckdb/      - Analytics database
• temp/        - Temporary processing
• lmdb/        - Lightning Memory-Mapped DB
• parquet/     - Columnar data files
• datasets/    - Dataset storage
```

### Service Responsibilities

| Service | Role | Port | Exposed |
|---------|------|------|---------|
| **Envoy** | Reverse proxy routing traffic to core/observer, handles fallback to arweave.net | 3000 | Yes (via Traefik) |
| **Core** | Main gateway engine - indexes blockchain, serves data via GraphQL | 4000 | No (internal) |
| **Redis** | Cache layer for chain data and rate limiting | 6379 | No (internal) |
| **Observer** | Network health monitoring, submits gateway observations for rewards | 5050 | No (internal) |

---

## System Requirements

### Minimum (Testing/Development)

- **CPU**: 4 cores
- **RAM**: 4 GB
- **Storage**: 500 GB SSD
- **Network**: 50 Mbps stable connection
- **Expected Growth**: 500 GB → 2 TB over 6-12 months

### Recommended (Production)

- **CPU**: 12 cores
- **RAM**: 32 GB
- **Storage**: 2 TB SSD (or 500 GB SSD + Cloudflare R2)
- **Network**: 1 Gbps stable connection
- **Backup**: Cloudflare R2 for archival (unlimited scalability)

### Storage Growth Pattern

The AR.IO gateway indexes the Arweave blockchain, which grows continuously:

- **Genesis → Block 800,000**: ~200 GB
- **Block 800,000 → 1,000,000**: +150 GB
- **Ongoing**: ~50-100 GB per month

**💡 Cloudflare R2 Recommendation**: Use R2 for archival storage to avoid expensive SSD upgrades. Zero egress fees make it perfect for serving indexed data.

---

## Prerequisites

### 1. Arweave Wallets (REQUIRED)

You need **two Arweave wallets**:

#### Gateway Wallet (`AR_IO_WALLET`)
- **Purpose**: Identifies your gateway in the AR.IO network
- **Requirements**: Funded with AR tokens for transactions
- **Create**: https://arweave.app/ → Generate Wallet
- **Funding**: Purchase AR tokens on exchanges (minimum ~1 AR recommended)

#### Observer Wallet (`OBSERVER_WALLET`)
- **Purpose**: Submits network observations for rewards
- **Requirements**: Separate from gateway wallet (security best practice)
- **Create**: https://arweave.app/ → Generate Wallet
- **Funding**: Small amount for transaction fees (~0.1 AR)

**🔐 Security**: Store wallet JSON files securely. **NEVER commit to version control.**

### 2. Domain Configuration

- **Primary Domain**: `gateway.example.com` (your gateway endpoint)
- **ArNS Wildcard** (Optional): `*.gateway.example.com` for ArNS subdomain routing
  - Requires **Cloudflare DNS-01 challenge** for wildcard SSL certificate
  - See [ArNS Configuration](#arns-configuration-optional) section below

### 3. Cloudflare Account (Optional but Recommended)

- **R2 Storage**: For archival/backup (reduces local storage costs)
- **DNS Management**: For wildcard SSL certificates (ArNS support)
- **Zero Trust Access**: Protect `/ar-io/admin` endpoints (optional)

---

## Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Your gateway domain | `gateway.example.com` |
| `AR_IO_WALLET` | Gateway wallet address | `abc123...xyz` (43 chars) |
| `OBSERVER_WALLET` | Observer wallet address | `def456...uvw` (43 chars) |
| `ADMIN_API_KEY` | Admin API protection | Auto-generated (base64) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `START_HEIGHT` | `0` | Block height to start indexing (0 = genesis) |
| `STOP_HEIGHT` | (empty) | Block height to stop indexing (empty = continuous) |
| `ARNS_ROOT_HOST` | (empty) | Your domain for ArNS subdomain routing |
| `REDIS_MAX_MEMORY` | `256mb` | Redis cache size limit |
| `ENVOY_LOG_LEVEL` | `info` | Envoy logging level |
| `ANS104_UNBUNDLE_WORKERS` | `5` | Parallel unbundle workers |
| `ANS104_DOWNLOAD_WORKERS` | `10` | Parallel download workers |

---

## Cloudflare R2 Setup (Optional - Recommended for Production)

Cloudflare R2 provides S3-compatible object storage with **zero egress fees**, making it ideal for archiving multi-TB indexed Arweave data.

### Benefits

- **Cost Savings**: $0.015/GB/month vs local SSD upgrades
- **Unlimited Scale**: Grow beyond local disk capacity
- **Zero Egress**: No data transfer fees (unlike AWS S3)
- **High Availability**: Cloudflare's global network

### Step 1: Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 → Overview
2. Click **"Create bucket"**
3. Name your bucket: `ar-io-gateway-archive`
4. Location: **Automatic** (recommended)
5. Click **"Create bucket"**

### Step 2: Generate R2 API Token

1. Go to R2 → Overview → **"Manage R2 API Tokens"**
2. Click **"Create API token"**
3. **Token name**: `ar-io-gateway-token`
4. **Permissions**: **Object Read & Write**
5. **Scope**: Specific bucket → `ar-io-gateway-archive`
6. Click **"Create API token"**
7. **Copy both**:
   - Access Key ID
   - Secret Access Key
   - **⚠️ Secret shown only once - save securely**

### Step 3: Configure in Dokploy

Set these environment variables in Dokploy:

| Variable | Value | Example |
|----------|-------|---------|
| `AWS_S3_BUCKET` | Bucket name | `ar-io-gateway-archive` |
| `AWS_ENDPOINT` | R2 endpoint | `https://abc123.r2.cloudflarestorage.com` |
| `AWS_ACCESS_KEY_ID` | Access key from Step 2 | `abc123xyz...` |
| `AWS_SECRET_ACCESS_KEY` | Secret key from Step 2 | `def456uvw...` |
| `AWS_REGION` | Always `auto` for R2 | `auto` |

**📝 Note**: Find your R2 endpoint format in Cloudflare Dashboard → R2 → Overview. It's always `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

### Cost Estimate

**Scenario**: 1 TB archived data, 10 GB/day reads

- **Storage**: 1,000 GB × $0.015 = **$15/month**
- **Class A operations** (writes): Minimal
- **Class B operations** (reads): Free up to limits
- **Egress**: **$0** (zero egress fees)

**Total**: ~$15-20/month vs $200+ for 1TB SSD upgrade

---

## ArNS Configuration (Optional)

**ArNS (Arweave Name System)** allows serving content on human-readable subdomains like `myapp.gateway.example.com`.

### Requirements for ArNS

1. **Wildcard Domain**: `*.gateway.example.com`
2. **Wildcard SSL Certificate**: Requires Cloudflare DNS-01 challenge
3. **ARNS_ROOT_HOST**: Set to your base domain

### Step 1: Enable Cloudflare DNS-01 Challenge

**Why DNS-01?**: HTTP-01 challenge can't issue wildcard certificates (`*.domain.com`). DNS-01 challenge validates via DNS records, enabling wildcards.

#### Create Cloudflare DNS API Token

1. Cloudflare Dashboard → **Profile** → **API Tokens**
2. Click **"Create Token"**
3. Use template: **"Edit zone DNS"**
4. **Permissions**:
   - Zone → DNS → Edit
5. **Zone Resources**:
   - Include → Specific zone → `example.com` (your domain)
6. Click **"Continue to summary"** → **"Create Token"**
7. **Copy the token** (shown only once)

#### Configure Traefik for DNS-01

**⚠️ Important**: This requires modifying your Dokploy/Traefik configuration. Contact your system administrator or see Dokploy documentation.

Add to Traefik static configuration (`traefik.yml`):

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

Set Cloudflare credentials as environment variables in Traefik container:

```yaml
environment:
  CF_DNS_API_TOKEN: your-cloudflare-token-here
```

### Step 2: Update AR.IO Configuration

Set in Dokploy:

```
ARNS_ROOT_HOST=gateway.example.com
```

### Step 3: Verify ArNS Routing

1. Deploy an ArNS name (via AR.IO network)
2. Access at: `https://your-arns-name.gateway.example.com`
3. Verify wildcard certificate in browser (should show valid SSL)

**📚 More Info**: https://docs.ar.io/build/arns/

---

## Deployment

### Step 1: Deploy via Dokploy

1. Go to Dokploy → **Templates**
2. Search for **"AR.IO Node"**
3. Click **"Deploy"**
4. Configure required variables:
   - `DOMAIN`: Your gateway domain
   - `AR_IO_WALLET`: Your gateway wallet address
   - `OBSERVER_WALLET`: Your observer wallet address
5. **(Optional)** Configure Cloudflare R2 variables
6. Click **"Deploy"**

### Step 2: Initial Sync (Can Take Hours/Days)

The gateway will start indexing the Arweave blockchain. Monitor progress:

```bash
# Check core logs
docker logs ar-io-node-core-1 -f

# Check current block height
curl https://your-gateway.example.com/ar-io/info
```

**Expected Timeline**:
- Block 0 → 800,000: 24-48 hours (on recommended hardware)
- Full sync to current height: 3-7 days
- Ongoing: Real-time indexing

### Step 3: Verify Deployment

```bash
# Gateway info
curl https://your-gateway.example.com/ar-io/info

# Health check
curl https://your-gateway.example.com/ar-io/healthcheck

# GraphQL endpoint
curl https://your-gateway.example.com/graphql
```

### Step 4: Join AR.IO Network (Optional - For Rewards)

1. Go to https://ar.io
2. Connect your `AR_IO_WALLET`
3. Register your gateway
4. Configure observation settings
5. Start earning rewards for network participation

---

## Post-Deployment

### Admin API Access

Protected by `ADMIN_API_KEY` (auto-generated during deployment):

```bash
# Get admin API key from Dokploy environment variables
ADMIN_API_KEY=your-key-here

# Admin endpoints
curl -H "Authorization: Bearer $ADMIN_API_KEY" \
  https://your-gateway.example.com/ar-io/admin/queue-tx
```

**🔐 Security**: Consider Cloudflare Zero Trust Access for additional protection of `/ar-io/admin` endpoints.

### Monitoring

Access service logs:

```bash
# Envoy proxy logs
docker logs ar-io-node-envoy-1 -f

# Core gateway logs (blockchain indexing)
docker logs ar-io-node-core-1 -f

# Observer logs (network monitoring)
docker logs ar-io-node-observer-1 -f

# Redis cache logs
docker logs ar-io-node-redis-1 -f
```

### Performance Metrics

Monitor via AR.IO info endpoint:

```bash
curl https://your-gateway.example.com/ar-io/info | jq
```

Returns:
- Current block height
- Indexed transaction count
- Cache statistics
- Network status

---

## Troubleshooting

### Issue 1: Slow Initial Sync

**Symptoms**: Block indexing taking longer than expected

**Solutions**:
1. **Increase Worker Counts**:
   ```
   ANS104_UNBUNDLE_WORKERS=10
   ANS104_DOWNLOAD_WORKERS=20
   ```
2. **Upgrade Hardware**: Use recommended specs (12-core CPU, 32GB RAM)
3. **Check Network**: Ensure 1 Gbps connection
4. **Monitor Disk I/O**: SSD required for acceptable performance

### Issue 2: Out of Disk Space

**Symptoms**: Container stops, logs show disk full errors

**Solutions**:
1. **Immediate**: Increase SSD storage capacity
2. **Long-term**: Configure Cloudflare R2 for archival storage
3. **Temporary**: Set `STOP_HEIGHT` to pause indexing
4. **Cleanup**: Remove old temp files in `/app/data/temp/`

### Issue 3: Redis Out of Memory

**Symptoms**: High cache eviction rate, performance degradation

**Solutions**:
1. **Increase Redis Memory**:
   ```
   REDIS_MAX_MEMORY=2gb
   ```
2. **Upgrade RAM**: Consider 32 GB for production
3. **Monitor**: Check eviction rate in Redis logs

### Issue 4: Observer Not Submitting

**Symptoms**: No observation transactions on-chain

**Solutions**:
1. **Check Wallet Balance**: Observer wallet needs AR tokens
2. **Verify Configuration**: Ensure `OBSERVER_WALLET` is correct
3. **Check Network**: Firewall may be blocking outbound connections
4. **Review Logs**: `docker logs ar-io-node-observer-1`

### Issue 5: ArNS Subdomains Not Working

**Symptoms**: 404 errors on `*.gateway.example.com`

**Solutions**:
1. **Verify Wildcard SSL**: Check certificate includes `*.gateway.example.com`
2. **Confirm DNS-01**: Ensure Cloudflare DNS-01 challenge configured
3. **Set ARNS_ROOT_HOST**: Must match your domain exactly
4. **Check DNS**: Wildcard A record `*.gateway.example.com` → server IP

### Issue 6: High R2 Costs

**Symptoms**: Unexpected Cloudflare bill

**Solutions**:
1. **Check Class A Operations**: Excessive writes indicate misconfiguration
2. **Review Access Patterns**: Ensure cache (Redis) working correctly
3. **Monitor Bandwidth**: R2 egress is free, but check Class B operations
4. **Lifecycle Rules**: Set up archival policies for old data

---

## Maintenance

### Update AR.IO Version

```bash
# Edit docker-compose.yml
# Change image tags to new versions:
# ghcr.io/ar-io/ar-io-envoy:1.4.0
# ghcr.io/ar-io/ar-io-core:1.4.0
# ghcr.io/ar-io/ar-io-observer:1.1.0

# Redeploy via Dokploy
```

### Backup Strategy

**Critical Data**:
1. **Wallets**: Store JSON files securely (offline)
2. **SQLite Database**: `/app/data/sqlite/` (backup to R2)
3. **Configuration**: docker-compose.yml, template.toml

**Backup Command**:
```bash
# Backup SQLite to R2 (if configured)
# AR.IO automatically archives to R2 when configured

# Manual backup
docker cp ar-io-node-core-1:/app/data/sqlite ./backup-sqlite-$(date +%F)
```

### Resource Cleanup

```bash
# Clear Redis cache (safe - will rebuild)
docker exec ar-io-node-redis-1 redis-cli FLUSHALL

# Clear temp files
docker exec ar-io-node-core-1 rm -rf /app/data/temp/*

# Prune Docker (removes stopped containers, unused images)
docker system prune -a
```

---

## Security Considerations

### Network Isolation

- ✅ **Redis**: Internal network only (not exposed)
- ✅ **Core**: Internal network only (accessed via Envoy)
- ✅ **Observer**: Internal network only
- ✅ **Envoy**: External network (user-facing proxy)

### Secrets Management

- ✅ **Wallet Addresses**: Store securely, never commit to git
- ✅ **Admin API Key**: Auto-generated, stored in Dokploy environment
- ✅ **R2 Credentials**: Stored as environment variables (encrypted by Dokploy)

### HTTPS/TLS

- ✅ **Automatic SSL**: Let's Encrypt via Traefik
- ✅ **Security Headers**: HSTS, X-Frame-Options, CSP configured
- ✅ **Wildcard Cert**: Available via Cloudflare DNS-01 challenge

### Admin API Protection

Consider adding **Cloudflare Zero Trust Access** for `/ar-io/admin` endpoints:

1. Cloudflare Dashboard → Zero Trust → Access → Applications
2. Create Self-hosted application
3. Set Application URL: `https://gateway.example.com/ar-io/admin`
4. Configure access policy (email domain, Google OAuth, etc.)
5. Apply Zero Trust authentication before admin API access

---

## Performance Optimization

### For High-Traffic Gateways

1. **Increase Worker Counts**:
   ```
   ANS104_UNBUNDLE_WORKERS=20
   ANS104_DOWNLOAD_WORKERS=40
   ```

2. **Scale Redis**:
   ```
   REDIS_MAX_MEMORY=4gb
   ```

3. **Enable R2 Caching**: Offload frequently accessed data to R2

4. **Horizontal Scaling**: Run multiple core instances behind load balancer (advanced)

### For Storage-Constrained Setups

1. **Aggressive R2 Archival**: Archive all indexed data to R2
2. **Increase START_HEIGHT**: Start indexing from recent block
3. **Prune Old Data**: Remove historical data older than N months

---

## Community & Support

- **GitHub**: https://github.com/ar-io/ar-io-node
- **Documentation**: https://docs.ar.io
- **Discord**: https://discord.gg/ar-io
- **Twitter**: https://twitter.com/ar_io_network

---

## License

AR.IO is open source. See: https://github.com/ar-io/ar-io-node/blob/main/LICENSE

---

**Template Version**: 1.0.0
**Last Updated**: 2026-01-03
**Maintainer**: Dokploy Template Library

🤖 Generated with [Claude Code](https://claude.com/claude-code)
