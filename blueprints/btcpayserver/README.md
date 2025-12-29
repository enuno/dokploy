# BTCPay Server

Self-hosted Bitcoin payment processor for accepting Bitcoin without fees or intermediaries. Run your own payment gateway with full control over your private keys.

## Overview

BTCPay Server is a free and open-source cryptocurrency payment processor which allows you to accept Bitcoin (and other cryptocurrencies) without fees, transaction fees, or a middleman. Run your own instance with this production-ready Dokploy template featuring:

- **Self-Hosted Payment Processing**: Accept Bitcoin payments directly to your wallet
- **No Fees**: Zero processing fees, zero middlemen
- **Full Control**: Non-custodial - you control your private keys
- **NBXplorer Integration**: Lightweight blockchain indexer for fast transaction tracking
- **PostgreSQL Backend**: Reliable, production-grade database storage
- **Automatic SSL**: Let's Encrypt certificates via Traefik
- **Optional Cloudflare DNS-01**: For self-hosted deployments behind NAT
- **Optional Zero Trust Access**: Cloudflare Access protection for admin panel
- **Security Headers**: Complete OWASP-recommended security middleware

## Deployment Planning

### Recommended Deployment Presets

Choose a preset that matches your use case:

| Preset | Bitcoin Node | Lightning | Access Method | Storage | Use Case |
|--------|--------------|-----------|---------------|---------|----------|
| **🚀 Lightweight** | External | Core Lightning | Traefik | ~30 GB | Testing, low-volume merchants, external node access |
| **🔒 Privacy** | External | None | Tor | ~30 GB | Privacy-focused, censorship-resistant, no Lightning needed |
| **🏢 Enterprise** | Full Archival | LND | Cloudflare Tunnel + R2 | ~700 GB | High-volume, Lightning routing, automated backups |

### Decision Matrix: Bitcoin Node

| Option | Storage | Sync Time | Compatible With | Best For |
|--------|---------|-----------|-----------------|----------|
| **External** | ~10 GB | Immediate | All Lightning | Testing, using existing node |
| **Pruned** | ~80 GB | 1-2 days | LND, **CLN** | Self-hosted, limited storage |
| **Full Archival** | ~600 GB | 1-2 weeks | LND, CLN, Eclair | Lightning routing, analytics |

**Recommendation**: Start with **External** for testing, upgrade to **Pruned + CLN** for production.

### Decision Matrix: Lightning Network

| Implementation | Memory | Ecosystem | Works with Pruned? | Best For |
|----------------|--------|-----------|-------------------|----------|
| **LND** | ~512 MB | ⭐⭐⭐ Largest | ✅ Yes | Ecosystem compatibility, most tools |
| **Core Lightning** | ~256 MB | ⭐⭐ Growing | ✅ **Best** | Resource-constrained, pruned nodes |
| **Eclair** | ~512 MB | ⭐ Smaller | ❌ **No** (requires txindex) | Scala/JVM environments |
| **None** | 0 MB | N/A | N/A | On-chain only, simpler setup |

**Recommendation**: Use **Core Lightning with Pruned Bitcoin** for optimal storage/features balance.

### Decision Matrix: Access Method

| Method | Complexity | Port Forwarding | Latency | Privacy | Best For |
|--------|------------|-----------------|---------|---------|----------|
| **Traefik** (default) | ⭐ Easy | ✅ Required | Low | Standard HTTPS | Standard deployments, VPS |
| **Tor Hidden Service** | ⭐⭐ Medium | ❌ Not required | High | ⭐⭐⭐ Maximum | Privacy, censorship resistance |
| **Cloudflare Tunnel** | ⭐⭐ Medium | ❌ Not required | Low | ⭐⭐ Good | Home/NAT, DDoS protection |

**Recommendation**: Start with **Traefik**, add **Tor** or **Cloudflare Tunnel** if you can't forward ports.

### Storage Calculator

Calculate your required storage based on chosen components:

| Component | Storage | Calculation |
|-----------|---------|-------------|
| **Base System** | 10 GB | Fixed |
| **PostgreSQL** | 2 GB | Fixed (grows with transactions) |
| **BTCPay Data** | 5 GB | Fixed |
| **Bitcoin Node** | | |
| ↳ External | 0 GB | (uses remote node) |
| ↳ Pruned | **+80 GB** | = **97 GB total** |
| ↳ Full Archival | **+600 GB** | = **617 GB total** |
| **Lightning Node** | +2 GB | (any implementation) |
| **NBXplorer Cache** | +5 GB | (blockchain index) |

**Example Calculations**:
- **External + LND**: 10 + 2 + 5 + 0 + 2 + 5 = **24 GB** ✅
- **Pruned + CLN**: 10 + 2 + 5 + 80 + 2 + 5 = **104 GB** ✅
- **Full + Eclair**: 10 + 2 + 5 + 600 + 2 + 5 = **624 GB** ⚠️

**Recommendation**: Budget **120 GB** for pruned deployments, **700 GB** for full archival nodes.

## Architecture

### Full Stack Overview

```
┌──────────────────────────────────────────────────────────────┐
│              BTCPay Server Full Stack Architecture           │
└──────────────────────────────────────────────────────────────┘

ACCESS LAYER (Choose ONE or combine)
┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
│   Traefik   │  │ Tor Hidden  │  │ Cloudflare      │
│ Let's Encrypt│  │  Service    │  │ Tunnel          │
│   (Default)  │  │  (.onion)   │  │ (NAT bypass)    │
└──────┬──────┘  └──────┬──────┘  └────────┬────────┘
       │                │                   │
       └────────────────┴───────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  BTCPay Server  │
              │    :49392       │
              └────────┬────────┘
                       │
        ┌──────────────┴──────────────┐
        │      btcpay-net             │
        │   (Internal Network)        │
        └──────────────┬──────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼
┌───────────┐  ┌──────────────┐  ┌──────────────┐
│NBXplorer  │  │ PostgreSQL   │  │   Bitcoin    │
│  :24444   │  │   :5432      │  │    Node      │
│(Indexer)  │  │  (Database)  │  │ (Choose ONE) │
└───────────┘  └──────────────┘  └──────────────┘
                                         │
                       ┌─────────────────┼─────────────────┐
                       │                 │                 │
                       ▼                 ▼                 ▼
                 ┌──────────┐    ┌──────────┐    ┌──────────┐
                 │ External │    │ Pruned   │    │   Full   │
                 │   Node   │    │  80 GB   │    │ 600 GB   │
                 │  (RPC)   │    │ 1-2 days │    │ 1-2 weeks│
                 └──────────┘    └──────────┘    └──────────┘

LIGHTNING LAYER (Optional - Choose ONE)
┌──────────────────────────────────────────────────────────┐
│  ┌─────────┐    ┌─────────────────┐    ┌──────────┐    │
│  │   LND   │    │Core Lightning   │    │  Eclair  │    │
│  │  :10009 │    │     :9835       │    │  :8080   │    │
│  │  512 MB │    │     256 MB      │    │  512 MB  │    │
│  │ ⭐⭐⭐   │    │    ⭐⭐ + Pruned │    │ ⭐ (Full) │    │
│  └─────────┘    └─────────────────┘    └──────────┘    │
└──────────────────────────────────────────────────────────┘

BACKUP LAYER (Optional)
┌──────────────────────────────────────────┐
│  ☁️ Cloudflare R2 Automated Backups     │
│  • PostgreSQL database dumps            │
│  • Lightning channel backups (SCB)      │
│  • GPG encrypted, 30-day retention      │
└──────────────────────────────────────────┘
```

### Minimal Stack (External Bitcoin + No Lightning)

```
Internet → Traefik → BTCPay → NBXplorer → PostgreSQL
                              ↓
                       External Bitcoin Core
                       (RPC connection)

Storage: ~24 GB
Sync: Immediate
```

### Recommended Stack (Pruned + Core Lightning)

```
Internet → Traefik → BTCPay → NBXplorer → PostgreSQL
                              ↓           ↓
                       Bitcoin Pruned   Core Lightning
                       (80 GB, 1-2 days) (256 MB)

Storage: ~104 GB
Sync: 1-2 days
Best for: Self-hosted, production merchants
```

### Enterprise Stack (Full + LND + R2 + Tunnel)

```
Internet → Cloudflare Tunnel → BTCPay → NBXplorer → PostgreSQL
                                         ↓           ↓
                                  Bitcoin Full       LND
                                  (600GB, 2 weeks)  (512 MB)
                                         ↓
                                  R2 Automated Backups
                                  (encrypted, daily)

Storage: ~624 GB
Sync: 1-2 weeks
Best for: High-volume, Lightning routing, business-critical
```

## Features

### Payment Processing
- ✅ **Bitcoin (BTC)** support (additional chains can be configured)
- ✅ **Lightning Network** support (requires additional configuration)
- ✅ **Point of Sale** interface for in-person payments
- ✅ **Invoice Management** with customizable payment flows
- ✅ **Refunds** and partial refunds support
- ✅ **Webhooks** for payment notifications
- ✅ **API** for e-commerce integrations

### Store Management
- ✅ **Multi-Store Support**: Manage multiple businesses
- ✅ **Customizable Checkout**: Brand your payment pages
- ✅ **Receipt Printing**: Thermal printer support
- ✅ **Apps**: Crowdfund, Payment Button, Point of Sale
- ✅ **Plugins**: Extensible architecture

### Security & Privacy
- ✅ **Non-Custodial**: You control your Bitcoin keys
- ✅ **No KYC**: No identity verification required
- ✅ **Self-Hosted**: Complete data sovereignty
- ✅ **TOR Support**: Hidden service capability
- ✅ **Security Headers**: HSTS, XSS protection, CSP

## Requirements

### System Resources

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 2 GB | 4 GB |
| **Storage** | 20 GB | 100 GB+ |
| **Network** | 10 Mbps | 100 Mbps |

**Note**: Storage requirements vary based on:
- Database size (invoice history, transaction data)
- Bitcoin Core configuration (if running full node: 500GB+)
- Backup retention policy

### External Dependencies

**Required:**
- Domain name with DNS configured
- SMTP server for email notifications (recommended)

**Optional:**
- Bitcoin Core full node (can use external RPC)
- Cloudflare account (for DNS-01 challenge or Zero Trust)
- Lightning Network node (LND, Core Lightning, or Eclair)

## Bitcoin Node Configuration

BTCPay Server requires access to a Bitcoin node for blockchain data. This template supports **three deployment modes** to match your infrastructure and storage capacity:

### Mode 1: External Bitcoin Core (Default) ⭐

**Best for**: Testing, existing infrastructure, limited storage

Connect to an external Bitcoin Core node you already operate:

```yaml
# In Dokploy environment variables:
BTC_RPC_HOST=your-bitcoin-node.example.com:8332
BTC_RPC_USER=your_rpc_username
BTC_RPC_PASSWORD=your_rpc_password
```

**Deployment**:
```bash
docker compose up -d  # No --profile needed
```

**Storage Required**: ~20GB (BTCPay data only)

**Advantages**:
- ✅ Instant deployment (no blockchain sync)
- ✅ Minimal storage requirements
- ✅ Can use remote node over Tor for privacy

**Limitations**:
- ⚠️ Depends on external infrastructure
- ⚠️ Requires trusted Bitcoin node access

---

### Mode 2: Pruned Bitcoin Core (Recommended) 🚀

**Best for**: Self-hosted deployments, home servers, beginners

Deploy `blockstream/bitcoind:30.0` with blockchain pruning enabled:

```yaml
# In Dokploy environment variables:
BTC_RPC_HOST=bitcoin-pruned:8332
BTC_RPC_USER_INTERNAL=btcpay
BTC_RPC_PASSWORD_INTERNAL=<auto-generated>
```

**Deployment**:
```bash
docker compose --profile bitcoin-pruned up -d
```

**Storage Required**: ~80-100GB
- Bitcoin blockchain (pruned): ~80GB
- BTCPay data: ~20GB

**Configuration**:
- `prune=550` - Keeps only recent blocks (~550MB)
- `txindex=0` - Transaction index disabled (incompatible with pruning)
- Full validation: ✅ (validates all blocks, only stores recent ones)

**Sync Time**: 1-2 days (depends on internet speed)

**Advantages**:
- ✅ Full validation without full storage
- ✅ Significantly lower disk requirements
- ✅ Works with Lightning Network (Core Lightning compatible)

**Limitations**:
- ⚠️ Cannot query historical transactions beyond prune window
- ⚠️ Initial blockchain download required

---

### Mode 3: Full Archival Node

**Best for**: Advanced users, production businesses, blockchain exploration

Deploy full Bitcoin Core node with complete blockchain history:

```yaml
# In Dokploy environment variables:
BTC_RPC_HOST=bitcoin-full:8332
BTC_RPC_USER_INTERNAL=btcpay
BTC_RPC_PASSWORD_INTERNAL=<auto-generated>
```

**Deployment**:
```bash
docker compose --profile bitcoin-full up -d
```

**Storage Required**: ~700GB+
- Bitcoin blockchain (full): ~600GB+ (grows ~50-60GB/year)
- Transaction index: ~80GB
- BTCPay data: ~20GB

**Configuration**:
- `prune=0` - Full blockchain retained
- `txindex=1` - Complete transaction index
- Full validation: ✅
- Full query capability: ✅

**Sync Time**: 1-2 weeks (depends on hardware and internet)

**Advantages**:
- ✅ Complete blockchain history
- ✅ Query any historical transaction
- ✅ Maximum ecosystem compatibility
- ✅ Can serve as blockchain explorer backend

**Limitations**:
- ⚠️ Very high storage requirements
- ⚠️ Long initial sync time
- ⚠️ Higher bandwidth usage

---

### Storage Requirement Calculator

| Mode | BTCPay | Bitcoin Core | Transaction Index | **Total** |
|------|--------|--------------|-------------------|-----------|
| **External** | 20 GB | 0 GB | 0 GB | **20 GB** |
| **Pruned** ⭐ | 20 GB | 60 GB | 0 GB | **80 GB** |
| **Full Archival** | 20 GB | 600+ GB | 80 GB | **700+ GB** |

**Growth Rate**: Bitcoin blockchain grows approximately 50-60GB per year

---

### Deployment Examples

#### Example 1: External Node
```bash
# No profile - uses external Bitcoin Core
docker compose up -d

# NBXplorer connects to host.docker.internal:8332 (or configured RPC host)
```

#### Example 2: Pruned Node (Recommended)
```bash
# Deploy with pruned Bitcoin Core
docker compose --profile bitcoin-pruned up -d

# Includes:
# - btcpayserver
# - nbxplorer → bitcoin-pruned:8332
# - postgres
# - bitcoin-pruned (blockstream/bitcoind:30.0 with prune=550)
```

#### Example 3: Full Archival Node
```bash
# Deploy with full Bitcoin Core
docker compose --profile bitcoin-full up -d

# Includes:
# - btcpayserver
# - nbxplorer → bitcoin-full:8332
# - postgres
# - bitcoin-full (blockstream/bitcoind:30.0 with txindex=1)
```

---

### Monitoring Blockchain Sync

When using internal Bitcoin nodes (pruned or full), monitor Initial Block Download (IBD):

```bash
# Check sync progress
docker compose exec bitcoin-pruned bitcoin-cli getblockchaininfo

# Output:
{
  "blocks": 820000,              # Current block height
  "headers": 850000,             # Network block height (target)
  "verificationprogress": 0.85,  # 85% synced
  "initialblockdownload": true   # Still syncing
}
```

**Sync complete when**:
- `verificationprogress` = 1.0
- `initialblockdownload` = false

---

### Switching Between Modes

To switch Bitcoin node modes:

1. **Stop services**:
   ```bash
   docker compose down
   ```

2. **Update environment variables** in Dokploy:
   - External → Pruned: Set `BTC_RPC_HOST=bitcoin-pruned:8332`
   - External → Full: Set `BTC_RPC_HOST=bitcoin-full:8332`
   - Pruned/Full → External: Set `BTC_RPC_HOST=host.docker.internal:8332` + external credentials

3. **Start with new profile**:
   ```bash
   docker compose --profile bitcoin-pruned up -d  # Or bitcoin-full
   ```

**WARNING**: Switching modes requires blockchain re-sync if moving to internal node.

---

## Lightning Network Configuration

BTCPay Server supports **three Lightning Network implementations**, each with different characteristics and Bitcoin Core requirements. Choose ONE based on your needs and Bitcoin mode.

### Lightning Implementation Comparison

| Feature | LND | Core Lightning (CLN) | Eclair |
|---------|-----|---------------------|--------|
| **Ecosystem Support** | ⭐⭐⭐⭐⭐ Largest | ⭐⭐⭐⭐ Growing | ⭐⭐⭐ Enterprise |
| **Memory Usage** | Higher (~500MB-2GB) | Lower (~100MB-1GB) | Medium (~200MB-1GB) |
| **Pruned Node** | ✅ Compatible | ✅ Compatible | ❌ Requires full archival |
| **External Node** | ✅ Compatible | ✅ Compatible | ⚠️ Requires txindex |
| **Full Node** | ✅ Compatible | ✅ Compatible | ✅ Compatible |
| **Authentication** | Macaroons + TLS | Rune tokens | Password |
| **API** | gRPC + REST | CLNRest | REST |
| **Language** | Go | C | Scala/Java |
| **Best For** | Most apps/wallets | Resource-constrained | Enterprise deployments |

### Compatibility Matrix

| Lightning | External BTC | Pruned BTC | Full BTC |
|-----------|--------------|------------|----------|
| **LND** | ✅ Yes | ✅ Yes | ✅ Yes |
| **CLN** | ✅ Yes | ✅ **Best choice** | ✅ Yes |
| **Eclair** | ⚠️ Only if txindex=1 | ❌ **Incompatible** | ✅ Yes |

**Key Takeaways:**
- **Core Lightning (CLN)** is the best choice for pruned nodes (no txindex required)
- **Eclair** ONLY works with full archival nodes (`bitcoin-full` profile)
- **LND** has the largest ecosystem support and works with any Bitcoin mode

---

### Deployment Examples

#### LND with Pruned Node (Recommended for Most Users)

**Best for**: Beginners, home servers, cost-conscious users

```bash
docker compose --profile bitcoin-pruned --profile lnd up -d
```

**Storage**: ~100GB (pruned node + LND)
**Sync Time**: 1-2 days (pruned node), LND syncs instantly after Bitcoin
**Memory**: 4GB+ recommended

**Enable in BTCPay**:
1. Edit `docker-compose.yml`
2. Uncomment this line (around line 44):
   ```yaml
   BTCPAY_BTCLIGHTNING: type=lnd-rest;server=http://lnd:8080/;allowinsecure=true
   ```
3. Restart BTCPay: `docker compose restart btcpayserver`

---

#### Core Lightning with External Node (Lightest Option)

**Best for**: Users with existing Bitcoin Core node, minimal resource usage

```bash
# Use external Bitcoin Core
docker compose --profile cln up -d
```

**Storage**: ~30GB (BTCPay + CLN only, no Bitcoin node)
**Sync Time**: Immediate (uses existing Bitcoin Core)
**Memory**: 2GB sufficient

**Enable in BTCPay**:
1. Edit `docker-compose.yml`
2. Uncomment this line (around line 46):
   ```yaml
   BTCPAY_BTCLIGHTNING: type=clightning;server=tcp://cln:9835/
   ```
3. Restart BTCPay: `docker compose restart btcpayserver`

---

#### Eclair with Full Archival Node (Enterprise Option)

**Best for**: Production businesses, advanced users, complete blockchain history needs

```bash
docker compose --profile bitcoin-full --profile eclair up -d
```

**Storage**: ~700GB (full node + Eclair)
**Sync Time**: 1-2 weeks (full blockchain sync)
**Memory**: 8GB+ recommended

**Enable in BTCPay**:
1. Edit `docker-compose.yml`
2. Uncomment this line (around line 48):
   ```yaml
   BTCPAY_BTCLIGHTNING: type=eclair;server=http://eclair:8080;password=eclairpass
   ```
3. Restart BTCPay: `docker compose restart btcpayserver`

⚠️ **CRITICAL**: Eclair REQUIRES `bitcoin-full` profile. Do NOT use with `bitcoin-pruned` or external nodes without txindex.

---

### Lightning Channel Backup (CRITICAL)

**CHANNEL DATA LOSS = PERMANENT LOSS OF FUNDS**

Lightning Network funds are stored in payment channels. If you lose channel data, **you lose access to funds in those channels permanently**.

#### Critical Volumes to Backup

| Implementation | Volume Name | Critical Data |
|----------------|-------------|---------------|
| LND | `lnd-data` | Channel database, macaroons, TLS certs |
| CLN | `cln-data` | `hsm_secret`, channel database |
| Eclair | `eclair-data` | Channel database, node keys |

#### Backup Recommendations

1. **Automated Volume Backups** (Phase 4 - Coming Soon):
   - Cloudflare R2 encrypted backups every 10 minutes
   - PostgreSQL dumps + Lightning channel backups
   - GPG encrypted before upload

2. **Manual Backup (Immediate)**:
   ```bash
   # LND - Backup channel database
   docker compose exec lnd lncli exportchanbackup

   # CLN - Backup hsm_secret
   docker compose exec cln cat /root/.lightning/bitcoin/hsm_secret

   # Eclair - Backup entire data directory
   docker run --rm -v eclair-data:/data -v $(pwd):/backup \
     alpine tar czf /backup/eclair-backup-$(date +%Y%m%d).tar.gz /data
   ```

3. **Static Channel Backup (SCB)** - LND Only:
   - Stored in `/root/.lnd/data/chain/bitcoin/mainnet/channel.backup`
   - Allows force-closing channels to recover funds
   - **Still requires LND node to be online**

#### Recommended Channel Limits

To minimize risk of fund loss:

| User Type | Max Channel Capacity | Max Total Lightning Funds |
|-----------|---------------------|--------------------------|
| **Testing** | 0.001 BTC (~$50) | 0.01 BTC (~$500) |
| **Personal Use** | 0.01 BTC (~$500) | 0.1 BTC (~$5,000) |
| **Small Business** | 0.1 BTC (~$5,000) | 1 BTC (~$50,000) |
| **Enterprise** | Custom | Custom (with automated backups) |

**Start small**: Open small channels initially, verify backups work, then scale up.

---

### Storage Requirements

Lightning adds minimal storage overhead:

| Component | Storage |
|-----------|---------|
| LND | 500MB - 2GB (scales with channel count) |
| Core Lightning | 100MB - 1GB (most efficient) |
| Eclair | 200MB - 1GB |
| Channel backups | <10MB (recommend 100MB buffer) |

**Total Storage Calculator**:
- **Pruned + LND**: ~100GB (Bitcoin) + 2GB (LND) = **~102GB**
- **Pruned + CLN**: ~100GB (Bitcoin) + 1GB (CLN) = **~101GB**
- **Full + Eclair**: ~700GB (Bitcoin) + 1GB (Eclair) = **~701GB**
- **External + CLN**: ~30GB (BTCPay) + 1GB (CLN) = **~31GB**

---

### Verifying Lightning Integration

After enabling Lightning in BTCPay:

1. **Check Lightning Node Status**:
   ```bash
   # LND
   docker compose exec lnd lncli getinfo

   # Core Lightning
   docker compose exec cln lightning-cli getinfo

   # Eclair
   docker compose exec eclair eclair-cli -p eclair getinfo
   ```

2. **BTCPay Server UI**:
   - Log into BTCPay Server
   - Navigate to **Server Settings** → **Services** → **Lightning**
   - Should show "Lightning node online" with node info

3. **Test Lightning Payment**:
   - Create a test invoice for 1000 satoshis
   - Use a Lightning wallet (Phoenix, Wallet of Satoshi) to pay
   - Verify payment arrives in BTCPay

---

### Troubleshooting Lightning

#### Lightning Node Not Connecting

**Symptoms**: BTCPay shows "Lightning node offline"

**Common Causes**:
1. **Lightning profile not activated**:
   ```bash
   docker compose ps | grep -E "lnd|cln|eclair"
   # Should show running container
   ```

2. **Wrong Bitcoin mode for Eclair**:
   - Check: `docker compose ps | grep bitcoin`
   - Fix: Use `--profile bitcoin-full` with Eclair

3. **Bitcoin Core not synced**:
   ```bash
   docker compose exec bitcoin-pruned bitcoin-cli getblockchaininfo
   # verificationprogress should be 1.0
   ```

4. **Incorrect connection string**:
   - Verify you uncommented the correct `BTCPAY_BTCLIGHTNING` line
   - Match profile: `--profile lnd` → `type=lnd-rest`

#### Channel Sync Issues

**Symptoms**: Channels show as inactive or offline

**Fixes**:
1. **Check peers**:
   ```bash
   # LND
   docker compose exec lnd lncli listpeers

   # CLN
   docker compose exec cln lightning-cli listpeers
   ```

2. **Restart Lightning node**:
   ```bash
   docker compose restart lnd  # or cln, eclair
   ```

3. **Wait for blockchain sync**:
   - Lightning requires fully synced Bitcoin node
   - Check: `docker compose logs -f nbxplorer`

#### Out of Sync After Restart

**Symptoms**: Lightning node takes long time to start

**Expected Behavior**:
- LND: 2-5 minutes for graph sync
- CLN: 1-3 minutes
- Eclair: 5-10 minutes

If longer than 15 minutes, check:
```bash
docker compose logs -f lnd  # or cln, eclair
```

Look for errors about Bitcoin connection or database corruption.

---

## Access Methods

BTCPay Server supports **three access methods**, each designed for different deployment scenarios and security requirements.

### Access Method Comparison

| Feature | Traefik (Default) | Tor Hidden Service | Cloudflare Tunnel |
|---------|-------------------|-------------------|-------------------|
| **Setup Complexity** | ⭐ Easy | ⭐⭐ Medium | ⭐⭐ Medium |
| **Public Access** | ✅ HTTPS via domain | ⚠️ .onion only | ✅ HTTPS via domain |
| **Anonymity** | ❌ No | ✅ Yes (with caveats) | ❌ No |
| **DDoS Protection** | ❌ No | ⚠️ Tor network | ✅ Cloudflare |
| **SSL/TLS** | Let's Encrypt | N/A (Tor protocol) | Cloudflare |
| **Port Forwarding** | ✅ Required | ❌ Not required | ❌ Not required |
| **Latency** | Low (direct) | High (Tor network) | Low (Cloudflare CDN) |
| **Best For** | Standard deployments | Privacy-focused | Behind NAT/firewall |

**Key Takeaway**: Each access method serves a specific use case. Choose based on your deployment environment and security requirements.

---

### Method 1: Traefik with Let's Encrypt (Default)

**Recommended for**: VPS, dedicated servers, standard deployments with public IP

```bash
# Standard deployment (no access profile needed)
docker compose up -d
```

**How it works:**
1. **Traefik** receives HTTPS requests on port 443
2. **Let's Encrypt** provides free SSL certificates (auto-renewal)
3. Traefik routes to BTCPay Server on internal network
4. Direct connection, lowest latency

**Requirements:**
- Public IP address or port forwarding
- Domain DNS pointing to your IP
- Ports 80 (HTTP challenge) and 443 (HTTPS) accessible

**Setup:**
1. Configure DNS A record: `btcpay.yourdomain.com` → `your-server-ip`
2. Deploy with Dokploy (Traefik is built-in)
3. Access at `https://btcpay.yourdomain.com`

**Pros:**
- ✅ Simple setup
- ✅ Lowest latency
- ✅ Widely compatible
- ✅ Free SSL certificates

**Cons:**
- ❌ Requires public IP or port forwarding
- ❌ No DDoS protection (unless behind Cloudflare DNS proxy)
- ❌ IP address publicly visible

---

### Method 2: Tor Hidden Service (Privacy-Focused)

**Recommended for**: Privacy-conscious users, censorship-resistant access, no public IP

```bash
# Deploy with Tor hidden service
docker compose --profile tor up -d
```

**How it works:**
1. **Tor daemon** creates .onion hidden service
2. BTCPay accessible via Tor Browser at `.onion` address
3. All traffic encrypted and routed through Tor network
4. No public IP required

**⚠️ Important Limitations:**
- **Not full anonymity**: Does NOT protect against targeted deanonymization attacks
- **Outbound traffic**: BTCPay's outbound connections (to Bitcoin network) are NOT routed through Tor
- **Performance**: High latency due to Tor network routing
- **Access**: Requires Tor Browser for users to access

**Get Your .onion Address:**
```bash
docker compose exec tor cat /var/lib/tor/hidden_services/BTCPayServer/hostname
```

**Enable Tor in BTCPay Server:**
1. Edit `docker-compose.yml`
2. Uncomment these lines in BTCPay service (around line 54-56):
   ```yaml
   BTCPAY_SOCKSENDPOINT: tor:9050
   BTCPAY_TORRCFILE: /usr/local/etc/tor/torrc
   BTCPAY_TORSERVICES: btcpayserver:49392
   ```
3. Uncomment Tor volumes (around line 14-15):
   ```yaml
   - tor_servicesdir:/var/lib/tor/hidden_services
   - tor_torrcdir:/usr/local/etc/tor
   ```
4. Restart: `docker compose restart btcpayserver`

**Access:**
- Share .onion address with users
- Users access via Tor Browser: `http://your-onion-address.onion`

**Pros:**
- ✅ No public IP required
- ✅ Censorship-resistant
- ✅ IP address hidden
- ✅ No port forwarding needed

**Cons:**
- ❌ High latency (3-5 second page loads typical)
- ❌ Requires Tor Browser for access
- ❌ Not suitable for high-traffic businesses
- ⚠️ Not complete anonymity

**Use Cases:**
- Personal Bitcoin wallet server
- Privacy-focused merchants
- Regions with internet censorship
- Testing without exposing public IP

---

### Method 3: Cloudflare Tunnel (NAT/Firewall Solution)

**Recommended for**: Behind NAT, no public IP, need DDoS protection, home servers

```bash
# Deploy with Cloudflare Tunnel
docker compose --profile cloudflared up -d
```

**How it works:**
1. **Cloudflared** creates outbound tunnel to Cloudflare
2. Cloudflare provides public HTTPS endpoint
3. Traffic routed through Cloudflare's global network
4. No inbound ports required

**Prerequisites:**
1. **Cloudflare account** with domain added
2. **Zero Trust account** (free tier available)

**Setup Steps:**

#### 1. Create Cloudflare Tunnel

**Cloudflare Dashboard:**
1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Navigate to **Networks** → **Tunnels**
3. Click **Create a tunnel**
4. Select **Docker** environment
5. Name your tunnel: `btcpay-server`
6. **Copy the tunnel token** (looks like: `eyJhIjoiNz...`)

#### 2. Configure Public Hostname

**In Cloudflare Tunnel configuration:**
1. **Subdomain**: `btcpay` (or your choice)
2. **Domain**: Select your domain
3. **Service**:
   - Type: **HTTP**
   - URL: `btcpayserver:49392`
4. Save tunnel configuration

#### 3. Deploy with Token

**In Dokploy:**
1. Set environment variable:
   ```
   CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiNz...  (your token)
   ```
2. Deploy: `docker compose --profile cloudflared up -d`

#### 4. Verify Access

- Access at: `https://btcpay.yourdomain.com`
- Cloudflare handles SSL automatically
- DDoS protection active

**Additional Security (Recommended):**

Enable **Always Use HTTPS**:
1. Cloudflare Dashboard → SSL/TLS → Edge Certificates
2. Toggle **Always Use HTTPS** to ON

Restrict Access with **Cloudflare Access**:
1. Zero Trust → Access → Applications
2. Create application for `btcpay.yourdomain.com`
3. Add access policies (email domain, specific users, etc.)
4. Enable 2FA for admin panel

**Pros:**
- ✅ No port forwarding needed
- ✅ DDoS protection included
- ✅ Global CDN (low latency worldwide)
- ✅ Free SSL certificates
- ✅ Works behind NAT/firewall
- ✅ Optional Zero Trust Access control

**Cons:**
- ❌ Depends on Cloudflare service
- ❌ Traffic visible to Cloudflare
- ⚠️ Cloudflare can terminate service
- ⚠️ Subject to Cloudflare Terms of Service

**Use Cases:**
- Home servers behind NAT
- ISPs that block inbound ports
- Need enterprise DDoS protection
- Want Zero Trust authentication
- Global user base (CDN benefits)

---

### Combining Access Methods

You can enable **multiple access methods simultaneously**:

```bash
# Traefik (default) + Tor
docker compose --profile tor up -d

# Traefik + Cloudflare Tunnel
docker compose --profile cloudflared up -d

# Tor + Cloudflare Tunnel (no Traefik needed)
docker compose --profile tor --profile cloudflared up -d
```

**Common Scenarios:**

**Scenario 1: Public HTTPS + Privacy Option**
- Primary: Traefik (standard users)
- Secondary: Tor hidden service (privacy-conscious users)
- Users choose their preferred access method

**Scenario 2: Home Server + Professional Access**
- Primary: Cloudflare Tunnel (customers)
- Secondary: Tor (personal access)
- Cloudflare for business, Tor for personal wallet

**Scenario 3: Development vs Production**
- Development: Traefik on LAN only
- Production: Cloudflare Tunnel with Zero Trust
- Separate access for different environments

---

### Access Method Decision Guide

**Choose Traefik if:**
- ✅ You have a VPS or dedicated server
- ✅ You can forward ports 80 and 443
- ✅ You want the simplest setup
- ✅ Latency is critical

**Choose Tor if:**
- ✅ Privacy is your top priority
- ✅ You're in a region with censorship
- ✅ You don't need high performance
- ✅ Users can use Tor Browser
- ❌ You don't need to process many transactions

**Choose Cloudflare Tunnel if:**
- ✅ You're behind NAT or firewall
- ✅ You can't forward ports
- ✅ You want DDoS protection
- ✅ You need professional reliability
- ✅ You want Zero Trust authentication

---

## Cloudflare Configuration

This template supports optional Cloudflare services for production-grade features:

### 1. DNS-01 Challenge for SSL (Recommended for Self-Hosted)

Use Cloudflare DNS challenge when:
- BTCPay Server is behind NAT/firewall
- You need wildcard certificates (`*.yourdomain.com`)
- HTTP-01 challenge port (80) is not accessible

#### Setup Steps

1. **Create Cloudflare DNS API Token**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Profile → API Tokens
   - Click "Create Token"
   - Use "Edit zone DNS" template
   - **Zone Resources**: Include → Specific zone → `yourdomain.com`
   - **Permissions**: Zone → DNS → Edit
   - Copy the token

2. **Configure Traefik** (Dokploy host):
   ```yaml
   # In Traefik static configuration (traefik.yml)
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

3. **Set Environment Variable in Traefik**:
   ```bash
   CF_DNS_API_TOKEN=your_cloudflare_api_token
   ```

4. **Enable in docker-compose.yml**:
   - Uncomment the DNS-01 challenge labels (lines 72-74)
   - Comment out the `letsencrypt` certresolver (line 54)

### 2. Zero Trust Access (Highly Recommended)

Protect BTCPay Server's admin panel with Cloudflare Access (SSO/2FA):

**Protected Paths:**
- `/server/*` - Server settings and configuration
- `/stores/*/settings/*` - Store management
- `/account/*` - User account settings

#### Setup Steps

1. **Create Cloudflare Access Application**:
   - Go to Cloudflare Dashboard → Zero Trust → Access → Applications
   - Click "Add an application" → "Self-hosted"
   - **Application name**: "BTCPay Server Admin"
   - **Application domain**: `yourdomain.com`
   - **Path**: `/server`

2. **Configure Access Policy**:
   ```
   Policy Name: Admin Only
   Action: Allow
   Include Rules:
     - Emails ending in: @yourdomain.com
     OR
     - Specific emails: admin@example.com
   ```

3. **Add Identity Provider** (Optional but recommended):
   - Settings → Authentication → Add an identity provider
   - Options: Google, GitHub, Microsoft, Email OTP, etc.

4. **Enable in docker-compose.yml**:
   - Uncomment Zero Trust Access labels (lines 83-89)
   - Set `CF_TEAM_NAME` in Dokploy environment variables

5. **Configure in Dokploy**:
   ```
   CF_TEAM_NAME=your-team-name
   ```
   (Team name found in: Zero Trust dashboard URL: `https://your-team-name.cloudflareaccess.com`)

### 3. R2 Backup Storage (Optional)

Use Cloudflare R2 for off-server backup storage:

#### Setup Steps

1. **Create R2 Bucket**:
   - Go to Cloudflare Dashboard → R2 → Create bucket
   - **Bucket name**: `btcpay-backups`
   - **Region**: Automatic

2. **Generate R2 API Tokens**:
   - R2 → Manage R2 API Tokens → Create API token
   - **Permissions**: Object Read & Write
   - **Bucket**: (optionally restrict to specific bucket)
   - Copy **Access Key ID** and **Secret Access Key**

3. **Configure in Dokploy**:
   ```
   S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   S3_BUCKET=btcpay-backups
   S3_ACCESS_KEY_ID=your_access_key_id
   S3_SECRET_ACCESS_KEY=your_secret_access_key
   S3_REGION=auto
   ```

4. **Configure Backup Settings**:
   ```env
   # Backup encryption passphrase (CRITICAL - store securely!)
   GPG_PASSPHRASE=your-secure-passphrase-32-chars

   # Backup schedule (cron format, default: daily at 2 AM UTC)
   BACKUP_SCHEDULE=0 2 * * *

   # Backup retention (days)
   BACKUP_RETENTION_DAYS=30
   ```

5. **Enable Automated Backups**:
   ```bash
   docker compose --profile r2-backup up -d
   ```

**Account ID**: Found in Cloudflare Dashboard → R2 → Overview

#### What Gets Backed Up

The automated backup service (`--profile r2-backup`) backs up:

| Component | Description | Encryption |
|-----------|-------------|------------|
| **PostgreSQL** | Full database dump (stores, invoices, users) | ✅ GPG AES256 |
| **BTCPay Data** | Application data, settings, configurations | ✅ GPG AES256 |
| **LND Channels** | Static Channel Backup (SCB) for fund recovery | ✅ GPG AES256 |
| **CLN Wallet** | `hsm_secret` (CRITICAL - wallet seed) | ✅ GPG AES256 |
| **Eclair Data** | Channel database and wallet data | ✅ GPG AES256 |

**Excluded**: Blockchain data (reproducible from Bitcoin network)

#### Backup Schedule & Retention

- **Default Schedule**: Daily at 2 AM UTC (customizable via `BACKUP_SCHEDULE`)
- **Retention**: 30 days (customizable via `BACKUP_RETENTION_DAYS`)
- **Encryption**: All backups encrypted with GPG before upload
- **Storage Location**: `s3://your-bucket/btcpay-backups/`

#### Backup Restoration

To restore from encrypted backup:

1. **Download Backup from R2**:
   ```bash
   aws s3 cp s3://btcpay-backups/postgres_20240101_020000.dump.gpg . \
       --endpoint-url https://your-account-id.r2.cloudflarestorage.com
   ```

2. **Decrypt with GPG**:
   ```bash
   echo "your-gpg-passphrase" | gpg --batch --yes --passphrase-fd 0 \
       --decrypt -o postgres_20240101_020000.dump \
       postgres_20240101_020000.dump.gpg
   ```

3. **Restore PostgreSQL**:
   ```bash
   pg_restore -h localhost -U btcpay -d btcpay \
       -c -F c postgres_20240101_020000.dump
   ```

4. **Restore Lightning Channels** (if using LND):
   ```bash
   # Copy channel.backup to LND data directory
   docker cp lnd-channel_20240101_020000.backup \
       btcpay-lnd:/root/.lnd/data/chain/bitcoin/mainnet/channel.backup

   # Restart LND to trigger channel recovery
   docker compose restart lnd
   ```

⚠️ **CRITICAL**: Store `GPG_PASSPHRASE` securely! Without it, encrypted backups are **unrecoverable**.

#### BTCPay File Storage (UI Uploads)

To configure BTCPay Server's file upload feature to use R2:

1. **Access BTCPay Admin**: Login → Server Settings → Services
2. **Enable External Storage**: Toggle "External Storage" feature
3. **Choose Storage Provider**: Select "Amazon S3 Compatible"
4. **Configure S3 Settings**:
   - **Endpoint**: `https://your-account-id.r2.cloudflarestorage.com`
   - **Bucket**: `btcpay-files` (create separate bucket for uploads)
   - **Access Key**: Your R2 Access Key ID
   - **Secret Key**: Your R2 Secret Access Key
   - **Region**: `auto`
5. **Save**: Server Settings → Files (upload and manage files)

**Note**: File uploads are separate from automated backups. Create a dedicated R2 bucket for user uploads.

**Sources**:
- [BTCPay Server Settings FAQ](https://docs.btcpayserver.org/FAQ/ServerSettings/)
- [External Storage Release Notes](https://blog.btcpayserver.org/btcpay-server-1-0-3-95/)

## Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BTCPAY_DOMAIN` | Your domain name | `btcpay.example.com` |
| `POSTGRES_PASSWORD` | PostgreSQL database password | Auto-generated (32 chars) |

### Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `btcpay` | Database name |
| `POSTGRES_USER` | `btcpay` | Database username |
| `BTC_RPC_URL` | `http://host.docker.internal:8332/` | Bitcoin Core RPC endpoint |
| `BTC_RPC_USER` | (empty) | Bitcoin Core RPC username |
| `BTC_RPC_PASSWORD` | (empty) | Bitcoin Core RPC password |

### Optional Cloudflare Variables

| Variable | Description | Required For |
|----------|-------------|--------------|
| `S3_ENDPOINT` | Cloudflare R2 endpoint | R2 backup storage |
| `S3_BUCKET` | R2 bucket name | R2 backup storage |
| `S3_ACCESS_KEY_ID` | R2 access key | R2 backup storage |
| `S3_SECRET_ACCESS_KEY` | R2 secret key | R2 backup storage |
| `CF_TEAM_NAME` | Cloudflare team name | Zero Trust Access |

## Deployment

### 1. Configure Domain DNS

Point your domain to your Dokploy server:

```
A Record: btcpay.example.com → YOUR_SERVER_IP
```

### 2. Deploy with Dokploy

1. Log into Dokploy dashboard
2. Navigate to your project
3. Click "Create Service" → "Template"
4. Search for "BTCPay Server"
5. Configure required variables:
   - **BTCPAY_DOMAIN**: Your domain (e.g., `btcpay.example.com`)
   - **POSTGRES_PASSWORD**: Auto-generated (keep default)
6. Click "Deploy"

### 3. Monitor Deployment

Initial deployment takes **5-10 minutes** due to:
- PostgreSQL initialization
- NBXplorer blockchain sync (can take longer on first run)
- BTCPay Server database migrations

**Monitor with:**
```bash
docker compose -f blueprints/btcpayserver/docker-compose.yml logs -f
```

### 4. Access BTCPay Server

Once deployed, access at: `https://yourdomain.com`

**First-time setup wizard will appear:**
1. Create admin account
2. Configure email settings (SMTP)
3. Create your first store
4. Set up Bitcoin wallet (new or existing)

## Bitcoin Core Configuration

BTCPay Server requires connection to a Bitcoin Core node via NBXplorer. You have two options:

### Option 1: Use External Bitcoin Core (Recommended)

Connect to an existing Bitcoin Core node (local or remote):

**Configure in Dokploy:**
```
BTC_RPC_URL=http://your-bitcoin-node:8332/
BTC_RPC_USER=your_rpc_username
BTC_RPC_PASSWORD=your_rpc_password
```

**Bitcoin Core Configuration** (bitcoin.conf):
```conf
# Enable RPC server
server=1
rpcuser=btcpay
rpcpassword=your_secure_password

# Allow connections from BTCPay Server
rpcallowip=YOUR_BTCPAY_SERVER_IP
rpcbind=0.0.0.0

# Network settings
testnet=0  # Set to 1 for testnet
```

### Option 2: Run Bitcoin Core Locally

If running Bitcoin Core on the same machine as Dokploy (not in Docker):

**Default configuration (already set):**
```
BTC_RPC_URL=http://host.docker.internal:8332/
```

This uses Docker's special DNS name to access the host machine.

**Bitcoin Core Requirements:**
- **Full Node**: 500GB+ storage for mainnet blockchain
- **Pruned Node**: 5GB minimum (set `prune=550` in bitcoin.conf)
- **Bandwidth**: 100GB+/month for initial sync

## Post-Deployment

### 1. Verify Services

Check all services are healthy:

```bash
docker compose ps
```

Expected output:
```
btcpayserver    healthy
nbxplorer      healthy
postgres       healthy
```

### 2. Test HTTPS

Visit `https://yourdomain.com` - should show:
- ✅ Valid SSL certificate
- ✅ BTCPay Server login/setup page
- ✅ No browser security warnings

### 3. Check NBXplorer Sync

NBXplorer needs to sync with the Bitcoin blockchain:

```bash
docker compose logs nbxplorer | grep "Height"
```

**Sync status indicators:**
- `Syncing... Height: 123456/850000` - Still syncing
- `Synced at height 850000` - Fully synced ✅

**Note**: Full sync can take **hours to days** depending on:
- Bitcoin Core sync status
- Network speed
- Server resources

### 4. Create First Store

1. Log into BTCPay Server
2. Click "Create Store"
3. Set store name and default currency
4. Configure Bitcoin wallet:
   - **Import existing wallet** (recommended for security)
   - **Or generate new wallet** (BTCPay will manage keys)
5. Wait for wallet to sync

### 5. Test Payment

1. Create a test invoice
2. Pay using a Bitcoin testnet wallet (if on testnet)
3. Verify invoice updates to "Paid" status

## Troubleshooting

### Issue 1: NBXplorer Not Syncing

**Symptoms:**
- BTCPay shows "NBXplorer is synchronizing"
- Payments not detected

**Diagnosis:**
```bash
# Check NBXplorer logs
docker compose logs nbxplorer

# Check Bitcoin Core connection
docker compose exec nbxplorer curl http://bitcoin-node:8332
```

**Solutions:**
1. **Verify Bitcoin Core RPC credentials**:
   - Check `BTC_RPC_USER` and `BTC_RPC_PASSWORD` match bitcoin.conf
2. **Check Bitcoin Core sync status**:
   - Bitcoin Core must be fully synced before NBXplorer can sync
3. **Increase NBXplorer timeout**:
   - Edit `start_period: 120s` to `180s` in docker-compose.yml

### Issue 2: Database Connection Failed

**Symptoms:**
- BTCPay Server shows "Unable to connect to database"
- Service keeps restarting

**Solutions:**
1. **Check PostgreSQL health**:
   ```bash
   docker compose ps postgres
   ```
2. **Verify password**:
   - Ensure `POSTGRES_PASSWORD` is set correctly
3. **Check logs**:
   ```bash
   docker compose logs postgres
   ```

### Issue 3: SSL Certificate Not Provisioning

**Symptoms:**
- Browser shows "Not Secure" or "Invalid Certificate"
- Traefik logs show ACME errors

**Solutions:**
1. **Verify DNS**:
   ```bash
   nslookup yourdomain.com
   ```
   Should return your server IP
2. **Check Traefik logs** (on Dokploy host):
   ```bash
   docker logs traefik
   ```
3. **Use DNS-01 Challenge** (if behind NAT):
   - Follow Cloudflare DNS-01 setup above
   - Uncomment DNS-01 labels in docker-compose.yml

### Issue 4: Payments Not Showing

**Symptoms:**
- Created invoice, sent payment, but BTCPay doesn't detect it

**Solutions:**
1. **Verify NBXplorer sync**:
   ```bash
   docker compose logs nbxplorer | tail -50
   ```
   Should show "Synced at height [latest block]"
2. **Check wallet derivation scheme**:
   - Store Settings → Wallet → Check derivation path
3. **Verify Bitcoin Core connection**:
   - NBXplorer logs should show successful RPC connections

### Issue 5: Cloudflare Zero Trust Not Working

**Symptoms:**
- Admin pages not showing Cloudflare Access login
- 403 Forbidden errors

**Solutions:**
1. **Verify Cloudflare Access application**:
   - Check application domain matches exactly
   - Verify path is set to `/server`
2. **Check CF_TEAM_NAME**:
   ```bash
   docker compose exec btcpayserver env | grep CF_TEAM
   ```
3. **Verify Traefik labels**:
   - Ensure Zero Trust labels are uncommented
   - Check middleware name matches

### Issue 6: Out of Memory

**Symptoms:**
- Services crashing with OOM (Out of Memory) errors
- Slow performance

**Solutions:**
1. **Add resource limits** (see docker-compose.yml comments):
   ```yaml
   deploy:
     resources:
       limits:
         memory: 2G
   ```
2. **Upgrade server resources**:
   - Recommended: 4GB RAM minimum for BTCPay + Bitcoin Core
3. **Use pruned Bitcoin node**:
   - Set `prune=550` in bitcoin.conf to limit blockchain storage

## Maintenance

### Backups

**Critical data to backup:**
1. **Database**: PostgreSQL contains all invoice/payment data
2. **BTCPay Data**: `/datadir` volume (wallet seeds, settings)
3. **NBXplorer Data**: `/datadir` volume (blockchain index cache)

**Backup script example:**
```bash
#!/bin/bash
# backup-btcpay.sh

BACKUP_DIR="/backups/btcpay-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
docker compose exec postgres pg_dump -U btcpay btcpay > "$BACKUP_DIR/database.sql"

# Backup BTCPay data volume
docker run --rm -v btcpay-data:/data -v "$BACKUP_DIR":/backup alpine tar czf /backup/btcpay-data.tar.gz /data

# Backup to Cloudflare R2 (if configured)
aws s3 cp "$BACKUP_DIR" s3://btcpay-backups/$(date +%Y%m%d)/ --recursive --endpoint-url="$S3_ENDPOINT"
```

**Schedule with cron:**
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-btcpay.sh
```

### Updates

**Updating BTCPay Server:**

1. **Check for updates**:
   - Visit [BTCPay Server Releases](https://github.com/btcpayserver/btcpayserver/releases)

2. **Update docker-compose.yml**:
   ```yaml
   image: btcpayserver/btcpayserver:2.3.0  # New version
   ```

3. **Deploy update**:
   ```bash
   docker compose pull
   docker compose up -d
   ```

4. **Verify**:
   - Check logs for migration messages
   - Test payment creation and detection

**Update schedule recommendation:**
- **Security updates**: Within 1 week of release
- **Feature updates**: Monthly or quarterly
- **Major versions**: Review changelog carefully

### Monitoring

**Key metrics to monitor:**
- **NBXplorer sync status**: Should stay synced
- **Database size**: Monitor growth over time
- **Disk space**: Especially if running Bitcoin Core
- **Payment success rate**: Track failed payments
- **API response times**: For integrations

**Monitoring tools:**
- **Uptime Kuma**: Monitor HTTPS endpoint health
- **Grafana + Prometheus**: Detailed metrics
- **Cloudflare Analytics**: Traffic and DDoS protection

## Security Best Practices

### 1. Enable Cloudflare Zero Trust

Protect admin panel with SSO/2FA (see Cloudflare Configuration above)

### 2. Use Strong Passwords

- Database password: 32+ characters (auto-generated)
- Admin account: 16+ characters with mixed case, numbers, symbols
- Bitcoin RPC: 24+ characters

### 3. Regular Updates

- Update BTCPay Server monthly
- Update PostgreSQL image quarterly
- Monitor security advisories

### 4. Backup Wallet Seeds

**CRITICAL**: Store wallet seed phrases offline and securely
- Write on paper (not digital)
- Store in multiple secure locations
- Never share or photograph seeds

### 5. Network Security

- Use Cloudflare proxy (orange cloud) for DDoS protection
- Enable Cloudflare WAF rules
- Limit admin access by IP (Cloudflare Firewall Rules)

### 6. Monitor Logs

```bash
# Check for suspicious activity
docker compose logs btcpayserver | grep -i "login\|admin\|fail"
```

## Integration Examples

### WooCommerce (WordPress)

1. Install "BTCPay for WooCommerce" plugin
2. Configure:
   ```
   BTCPay Server URL: https://yourdomain.com
   API Key: (generate in BTCPay Server Settings)
   Store ID: (from BTCPay store settings)
   ```

### Shopify

1. Install BTCPay Server app from Shopify App Store
2. Connect to your BTCPay Server instance
3. Configure payment settings

### Custom Integration (API)

```bash
# Create invoice via API
curl -X POST https://yourdomain.com/api/v1/stores/{storeId}/invoices \
  -H "Authorization: token YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "100.00",
    "currency": "USD"
  }'
```

## Resources

### Official Documentation
- **BTCPay Server Docs**: https://docs.btcpayserver.org/
- **API Documentation**: https://docs.btcpayserver.org/API/Greenfield/v1/
- **NBXplorer**: https://github.com/dgarage/NBXplorer

### Community
- **BTCPay Server Mattermost**: https://chat.btcpayserver.org/
- **GitHub Discussions**: https://github.com/btcpayserver/btcpayserver/discussions
- **Reddit**: r/BTCPayServer

### Support
- **GitHub Issues**: https://github.com/btcpayserver/btcpayserver/issues
- **Community Chat**: https://chat.btcpayserver.org/btcpayserver/channels/general

### Educational
- **BTCPay Server Foundation**: https://foundation.btcpayserver.org/
- **Video Tutorials**: https://www.youtube.com/@BTCPayServer

## License

BTCPay Server is free and open-source software licensed under the MIT License.

## Changelog

### v2.2.1 (Current)
- Enhanced reporting features
- Public plugin builder
- Miniscript wallet support
- Lightning Service Provider (LSP) plugin
- GiveWP integration

See full changelog: https://github.com/btcpayserver/btcpayserver/releases

---

**Note**: This template is community-maintained and not officially supported by BTCPay Server Foundation. For official support, visit https://btcpayserver.org/
