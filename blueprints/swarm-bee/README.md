# Swarm Bee - Decentralized Storage Node

Deploy a production-ready [Swarm Bee](https://github.com/ethersphere/bee) node for the Ethereum Swarm decentralized storage network using Dokploy.

## Overview

Swarm is a decentralized storage and communication system for a sovereign digital society. Bee is the official Go client that connects your node to the Swarm network, enabling you to:

- **Store and retrieve data**: Upload files to the distributed network and retrieve them via content addressing
- **Earn BZZ tokens**: Participate in bandwidth incentives by storing and serving data chunks
- **Support decentralization**: Contribute storage and bandwidth to a censorship-resistant network
- **Build dApps**: Provide backend storage for decentralized applications

### Architecture

```
┌─────────────────────────────────────────────┐
│          Swarm Bee Node (v2.6.0)            │
│                                             │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │  HTTP API   │      │  P2P Network    │  │
│  │  Port 1633  │      │  Port 1634      │  │
│  └──────┬──────┘      └────────┬────────┘  │
│         │                      │            │
│         │ Traefik             │ Direct     │
│         │ (HTTPS)             │ Exposure   │
└─────────┼──────────────────────┼────────────┘
          │                      │
          ▼                      ▼
    ${DOMAIN}              Public P2P
   (SSL/HTTPS)             (Port 1634)
          │
          │ Requires External Dependencies:
          ├─ Gnosis Chain RPC (blockchain)
          └─ 30GB SSD Storage (local chunks)
```

**Single-Service Architecture**: Bee is a stateful full node that manages its own chunk storage locally. No database or cache containers needed.

---

## Features

- ✅ **Automatic SSL/TLS**: LetsEncrypt certificates via Traefik
- ✅ **Security Headers**: Comprehensive HSTS, CSP, XSS protection
- ✅ **Health Monitoring**: Built-in health checks with 2-minute startup grace period
- ✅ **Persistent Storage**: 30GB volume for chunk storage and node state
- ✅ **Blockchain Integration**: Connects to Gnosis Chain for BZZ token settlements
- ✅ **P2P Networking**: Direct port exposure for peer connectivity
- ✅ **Production-Ready**: Password-protected API, pinned image version, proper restart policies

---

## Prerequisites

### 1. Gnosis Chain RPC Endpoint

Bee requires a Gnosis Chain RPC endpoint for blockchain operations. You need **one** of the following:

| Provider | Type | RPC Endpoint | Cost | Archival |
|----------|------|--------------|------|----------|
| **FairDataSociety** | Public | `https://xdai.fairdatasociety.org` | Free | ⚠️ No |
| **GetBlock** | Provider | `https://go.getblock.io/...` | Paid | ✅ Yes |
| **Infura** | Provider | `https://gnosis-mainnet.infura.io/v3/...` | Paid | ✅ Yes |
| **Alchemy** | Provider | `https://gnosis-mainnet.g.alchemy.com/v2/...` | Paid | ✅ Yes |
| **Self-Hosted** | Own Node | `http://your-gnosis-node:8545` | Infrastructure | ✅ Yes |

⚠️ **Important**: Use an **archival node** to prevent storage errors. Non-archival nodes may drop historical state needed for chunk validation.

**Free Option**: For testing, use `https://xdai.fairdatasociety.org`. For production, use a paid archival endpoint.

### 2. Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **Storage** | 30GB SSD | 100GB SSD |
| **Memory** | 2GB RAM | 4GB RAM |
| **CPU** | 2 cores | 4 cores |
| **Network** | 10 Mbps | 100 Mbps |
| **Ports** | 1634 (P2P) | 1634 (P2P) |

⚠️ **Port 1634** must be publicly accessible for P2P connectivity. Ensure firewall rules allow inbound TCP traffic.

### 3. Domain Configuration

- Domain pointing to your Dokploy server (e.g., `bee.example.com`)
- DNS A record configured
- Port 443 accessible for HTTPS (via Traefik)

---

## Installation

### Step 1: Deploy via Dokploy

1. Navigate to your Dokploy instance
2. Go to **Templates** → **Import Template**
3. Enter the repository URL:
   ```
   https://raw.githubusercontent.com/your-org/dokploy-templates/main/blueprints/swarm-bee/docker-compose.yml
   ```
4. Configure required variables (see Configuration section below)
5. Click **Deploy**

### Step 2: Obtain Gnosis Chain RPC

**Option A: Free Public Endpoint (Testing)**
```
https://xdai.fairdatasociety.org
```

**Option B: Paid Provider (Production)**
1. Create account at GetBlock/Infura/Alchemy
2. Create Gnosis Chain project
3. Copy RPC endpoint URL
4. Ensure archival mode is enabled

### Step 3: Configure Environment Variables

In Dokploy, set the following required variables:

| Variable | Example | Description |
|----------|---------|-------------|
| `DOMAIN` | `bee.example.com` | Your domain for API access |
| `BEE_PASSWORD` | Auto-generated | Node password (auto-created by Dokploy) |
| `BEE_BLOCKCHAIN_RPC_ENDPOINT` | `https://xdai.fairdatasociety.org` | Gnosis Chain RPC URL |

Optional variables (see Configuration section for full list).

---

## Configuration

### Required Variables

#### 1. Domain Configuration

```toml
DOMAIN = "bee.example.com"
BEE_DOMAIN = "bee.example.com"
```

Your public domain for API access via HTTPS.

#### 2. Authentication

```toml
BEE_PASSWORD = "${bee_password}"  # Auto-generated 32-char password
```

**Auto-generated** by Dokploy. Used for:
- Wallet/key protection
- API authentication
- Transaction signing

⚠️ **Save this password securely** - you'll need it for API operations.

#### 3. Blockchain Connectivity

```toml
BEE_BLOCKCHAIN_RPC_ENDPOINT = "https://xdai.fairdatasociety.org"
```

**Required**: Gnosis Chain RPC endpoint. See Prerequisites for options.

```toml
BEE_SWAP_ENDPOINT = ""  # Optional: Leave blank to use same as blockchain RPC
```

**Optional**: Separate endpoint for BZZ token swaps. If blank, uses `BEE_BLOCKCHAIN_RPC_ENDPOINT`.

---

### Optional Configuration

#### API Configuration

```toml
BEE_API_ADDR = "0.0.0.0:1633"  # Default: Listen on all interfaces for Traefik
```

**Default is correct** for Dokploy. Only change if you need custom binding.

#### P2P Configuration

```toml
BEE_P2P_ADDR = ":1634"    # Default: Listen on all interfaces
P2P_PORT = "1634"          # External port mapping
```

**P2P Port Requirements**:
- Must be publicly accessible for peer connectivity
- Firewall must allow inbound TCP on this port
- Default 1634 is standard for Swarm network

```toml
BEE_NAT_ADDR = ""  # Optional: Public IP/domain for NAT traversal
```

**NAT Address** (optional):
- Format: `domain.com:1634` or `IP:1634`
- Leave blank for auto-detection
- Set manually if behind NAT/firewall

#### Storage Configuration

```toml
BEE_CACHE_CAPACITY = "1000000"  # Default: 1 million chunks (~4GB)
```

**Cache Capacity**: Number of chunks to cache in memory.
- Default: 1,000,000 chunks (~4GB memory usage)
- Increase for better performance (requires more RAM)
- Decrease if memory-constrained

**Disk Storage**: The `bee-data` volume will grow up to your configured limits (30GB minimum recommended).

#### Network Configuration

```toml
BEE_NETWORK_ID = "1"  # 1 = mainnet, 10 = testnet
```

**Network Selection**:
- `1` = **Mainnet** (production, real BZZ tokens)
- `10` = **Testnet** (testing, test tokens)

#### Payment Configuration

```toml
BEE_PAYMENT_THRESHOLD = "13500000"  # BZZ amount threshold
BEE_PAYMENT_TOLERANCE = "25"        # 25% tolerance
BEE_PAYMENT_EARLY = "50"            # Pay 50% early
```

**BZZ Token Payments**:
- **Threshold**: When to settle payments (in PLUR, smallest BZZ unit)
- **Tolerance**: Acceptable deviation from threshold
- **Early Payment**: Percentage to pay before threshold

💡 **Tip**: Default values are optimized for mainnet. Adjust based on your BZZ token strategy.

#### Logging

```toml
BEE_VERBOSITY = "3"  # 0=silent, 1=error, 2=warn, 3=info, 4=debug, 5=trace
```

**Verbosity Levels**:
- `0` = Silent (no logs)
- `1` = Errors only
- `2` = Errors + Warnings
- `3` = **Info** (recommended default)
- `4` = Debug (verbose)
- `5` = Trace (very verbose)

#### Warmup Time

```toml
BEE_WARMUP_TIME = "5"  # Minutes to warmup before accepting requests
```

**Warmup Period**: Time for the node to initialize before serving requests.
- Default: 5 minutes
- First boot may take longer for blockchain sync (health check allows 2 minutes)

---

## Post-Deployment

### 1. Verify Health Status

Check that the Bee node is healthy:

```bash
curl https://bee.example.com/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "2.6.0"
}
```

### 2. Check Node Addresses

Retrieve your node's Ethereum and Swarm addresses:

```bash
curl https://bee.example.com/addresses
```

Response:
```json
{
  "ethereum": "0x...",
  "overlay": "...",
  "pss": "...",
  "publicKey": "..."
}
```

💡 **Save the `ethereum` address** - this is where you'll receive BZZ token earnings.

### 3. Fund Your Node

Bee requires **xDAI** (Gnosis Chain gas) and **BZZ tokens** to operate:

#### 3.1 Get xDAI (Gas for Transactions)

You need ~0.1 xDAI to cover transaction fees:

**Bridge from Ethereum**:
1. Go to [Gnosis Chain Bridge](https://bridge.gnosischain.com/)
2. Bridge DAI from Ethereum → xDAI on Gnosis Chain
3. Send 0.1 xDAI to your node's Ethereum address

**Buy xDAI Directly**:
- Use [Ramp](https://ramp.network/) or [Mt Pelerin](https://www.mtpelerin.com/)
- Send to your node's Ethereum address

#### 3.2 Get BZZ Tokens (Storage Incentives)

You need ~10 BZZ to participate in bandwidth incentives:

1. **Buy BZZ**:
   - [Uniswap](https://app.uniswap.org/) (Ethereum → Bridge to Gnosis)
   - [Honeyswap](https://honeyswap.org/) (native Gnosis DEX)
   - [CoinGecko](https://www.coingecko.com/en/coins/swarm) (CEX options)

2. **Bridge to Gnosis Chain** (if bought on Ethereum):
   - Use [Omni Bridge](https://omni.gnosischain.com/)
   - Send BZZ to your node's Ethereum address

### 4. Monitor Your Node

#### Check Balances

```bash
curl https://bee.example.com/accounting
```

#### Check Peers

```bash
curl https://bee.example.com/peers
```

#### Check Topology

```bash
curl https://bee.example.com/topology
```

---

## API Usage

### Authentication

All API requests require authentication using your `BEE_PASSWORD`:

```bash
curl -H "Authorization: Bearer <BEE_PASSWORD>" \
  https://bee.example.com/...
```

### Upload a File

```bash
curl -X POST \
  -H "Authorization: Bearer <BEE_PASSWORD>" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @file.txt \
  https://bee.example.com/bzz
```

Response:
```json
{
  "reference": "abc123..."  # Swarm hash for retrieval
}
```

### Download a File

```bash
curl https://bee.example.com/bzz/abc123...
```

### API Documentation

Full API reference: https://docs.ethswarm.org/api/

---

## Troubleshooting

### Issue 1: Health Check Failing

**Symptom**: Service not starting, health check timeouts

**Diagnosis**:
```bash
docker logs bee_container_name
```

**Common Causes**:
1. **Blockchain RPC not reachable**
   - Check `BEE_BLOCKCHAIN_RPC_ENDPOINT` is correct
   - Test RPC: `curl -X POST <RPC_URL> -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'`

2. **Insufficient startup time**
   - First boot can take 2-3 minutes for blockchain sync
   - Health check has 120s grace period (`start_period`)

3. **API binding issue**
   - Verify `BEE_API_ADDR=0.0.0.0:1633` (not 127.0.0.1)

**Fix**: Wait for startup, verify RPC endpoint, check logs for errors.

---

### Issue 2: P2P Connectivity Problems

**Symptom**: No peers connecting, isolated node

**Diagnosis**:
```bash
curl https://bee.example.com/peers
# Empty or very few peers
```

**Common Causes**:
1. **Port 1634 not accessible**
   - Check firewall: `sudo ufw allow 1634/tcp`
   - Verify port forwarding if behind NAT
   - Test externally: `nc -zv <YOUR_IP> 1634`

2. **NAT traversal failing**
   - Set `BEE_NAT_ADDR` manually: `domain.com:1634` or `IP:1634`

**Fix**: Open port 1634 in firewall, configure NAT address if needed.

---

### Issue 3: Out of xDAI/BZZ

**Symptom**: Transactions failing, can't upload files

**Diagnosis**:
```bash
curl https://bee.example.com/accounting
# Check "availableBalance"
```

**Common Causes**:
1. **No xDAI for gas**
   - Node needs ~0.1 xDAI for transaction fees

2. **No BZZ for incentives**
   - Node needs ~10 BZZ for storage payments

**Fix**: Send xDAI and BZZ to your node's Ethereum address (see Post-Deployment section).

---

### Issue 4: High Memory Usage

**Symptom**: Container OOM kills, memory warnings

**Diagnosis**:
```bash
docker stats bee_container_name
```

**Common Causes**:
1. **Cache capacity too high**
   - Reduce `BEE_CACHE_CAPACITY` (e.g., from 1000000 to 500000)

2. **No resource limits**
   - Container using all available memory

**Fix**: Reduce cache capacity or add resource limits (see Security Considerations).

---

### Issue 5: Blockchain Sync Errors

**Symptom**: Storage errors, chunk validation failures

**Diagnosis**:
```bash
docker logs bee_container_name | grep -i "error\|sync"
```

**Common Causes**:
1. **Non-archival RPC endpoint**
   - Node tries to access historical state not available on light nodes

2. **RPC rate limiting**
   - Free endpoints may rate-limit requests

**Fix**: Switch to archival RPC endpoint (GetBlock, Infura, Alchemy paid plans).

---

## Security Considerations

### 1. API Password Protection

✅ **Automatically secured**: Dokploy generates a 32-character random password.

**Best Practices**:
- **Save your password** from Dokploy environment variables
- Never commit password to version control
- Rotate password periodically via Dokploy UI

### 2. Optional: Cloudflare Zero Trust Access

For enhanced security, protect the Bee API with Cloudflare Access:

#### Setup Zero Trust

1. **Create Cloudflare Access Application**:
   - Go to Cloudflare Dashboard → Zero Trust → Access → Applications
   - Click "Add an application" → "Self-hosted"
   - Set Application URL: `https://bee.example.com`

2. **Configure Access Policy**:
   - Policy name: "Bee API Access"
   - Action: "Allow"
   - Include: Your email domain or specific users
   - Example: `Emails ending in: @yourcompany.com`

3. **Optional: Add 2FA Requirement**:
   - Require MFA for additional security
   - Configure in Access policies

#### Benefits

- **Multi-factor authentication** for API access
- **IP allowlisting** (optional)
- **Audit logging** of all API requests
- **No changes to docker-compose** - works at DNS level

💡 **Recommended for production** if handling valuable data or BZZ token balances.

### 3. Resource Limits (Production Hardening)

Add resource limits to prevent DoS and OOM kills:

```yaml
# Add to bee service in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
      cpus: "2.0"
    reservations:
      memory: 1G
      cpus: "0.5"
```

**Benefits**:
- Prevents single container from consuming all host resources
- Protects against memory leaks
- Predictable performance under load

### 4. Firewall Configuration

**Required**:
- Port 1634 (P2P): **MUST** be open for inbound TCP
- Port 443 (HTTPS): Managed by Traefik, allow if using Cloudflare proxied

**Optional**:
- Restrict API access (port 1633) to Traefik only (already default in compose)

Example UFW rules:
```bash
sudo ufw allow 1634/tcp comment "Swarm Bee P2P"
sudo ufw allow 443/tcp comment "HTTPS"
```

---

## Performance Tuning

### 1. Storage Optimization

**SSD Recommended**: Bee performs many random I/O operations for chunk storage.

**Disk Space Planning**:
- **Minimum**: 30GB SSD
- **Recommended**: 100GB+ SSD for long-term operation
- Monitor with: `docker exec bee_container df -h /home/bee/.bee`

### 2. Network Bandwidth

**Bandwidth Incentives**: Nodes with higher bandwidth earn more BZZ tokens.

**Optimization**:
- Use servers with **unmetered bandwidth** or high limits
- Monitor with: `docker stats bee_container`
- Adjust `BEE_CACHE_CAPACITY` based on available memory

### 3. Peer Connectivity

**More peers = Better performance**

**Optimization**:
1. Ensure port 1634 is publicly accessible
2. Set `BEE_NAT_ADDR` if behind NAT
3. Monitor peer count: `curl https://bee.example.com/peers | jq length`

**Target**: 50+ connected peers for optimal performance.

---

## Backup and Disaster Recovery

### Critical Data

The `bee-data` volume contains:
- **Node identity** (Ethereum address, private keys)
- **Chunk storage** (uploaded data)
- **Accounting data** (BZZ balances, payment history)

⚠️ **Losing this data means losing**:
- Your node's Ethereum address (and any BZZ earnings)
- All uploaded chunks
- Payment history

### Backup Strategy

#### Option 1: Volume Backup (Recommended)

```bash
# Stop the container
docker stop bee_container_name

# Backup volume
docker run --rm \
  -v swarm-bee_bee-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/bee-data-backup-$(date +%Y%m%d).tar.gz /data

# Restart container
docker start bee_container_name
```

#### Option 2: Export Keys Only

```bash
# Export keys (node must be running)
docker exec bee_container cat /home/bee/.bee/keys/swarm.key > swarm.key.backup
docker exec bee_container cat /home/bee/.bee/keys/libp2p.key > libp2p.key.backup
```

⚠️ **Store backups securely** - they contain private keys for your node's Ethereum address.

### Restore Procedure

```bash
# Stop container
docker stop bee_container_name

# Restore volume
docker run --rm \
  -v swarm-bee_bee-data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar xzf /backup/bee-data-backup-YYYYMMDD.tar.gz --strip 1"

# Start container
docker start bee_container_name
```

---

## Monitoring

### Metrics Endpoints

Bee exposes Prometheus-compatible metrics:

```bash
curl https://bee.example.com/metrics
```

### Key Metrics to Monitor

| Metric | Endpoint | Description |
|--------|----------|-------------|
| **Node health** | `/health` | Overall node status |
| **Peer count** | `/peers` | Number of connected peers |
| **BZZ balance** | `/accounting` | Available BZZ balance |
| **Chunk count** | `/metrics` | `bee_chunk_total_count` |
| **Bandwidth** | `/metrics` | `bee_p2p_sent_bytes_total` |

### Alerting Recommendations

Set up alerts for:
- ❌ Health check failing for >5 minutes
- ⚠️ Peer count <10 for >30 minutes
- ⚠️ BZZ balance <1 token
- ⚠️ Disk usage >80% of 30GB limit

---

## Upgrading

### Bee Version Updates

When a new Bee version is released:

1. **Check Release Notes**: https://github.com/ethersphere/bee/releases
2. **Update Image Tag** in `docker-compose.yml`:
   ```yaml
   image: ethersphere/bee:NEW_VERSION
   ```
3. **Redeploy** via Dokploy UI
4. **Monitor Logs** for migration errors:
   ```bash
   docker logs -f bee_container_name
   ```

⚠️ **Backup before upgrading** - see Backup section.

---

## Additional Resources

### Official Documentation

- **Bee Docs**: https://docs.ethswarm.org/
- **API Reference**: https://docs.ethswarm.org/api/
- **Swarm Network**: https://www.ethswarm.org/
- **GitHub**: https://github.com/ethersphere/bee

### Community

- **Discord**: https://discord.gg/wdghaQsGq5
- **Reddit**: https://reddit.com/r/ethswarm
- **Telegram**: https://t.me/ethswarm

### Economics

- **BZZ Token**: https://www.coingecko.com/en/coins/swarm
- **Bandwidth Incentives**: https://docs.ethswarm.org/docs/learn/technology/incentives

---

## Support

### Template Issues

Report issues with this Dokploy template:
- GitHub: https://github.com/your-org/dokploy-templates/issues

### Bee Node Issues

For Bee-specific problems:
- GitHub Issues: https://github.com/ethersphere/bee/issues
- Discord: https://discord.gg/wdghaQsGq5

---

## License

This Dokploy template is provided as-is under the MIT License.

Swarm Bee is licensed under BSD-3-Clause: https://github.com/ethersphere/bee/blob/master/COPYING

---

**Template Version**: 1.0.0
**Bee Version**: 2.6.0
**Last Updated**: December 27, 2025
