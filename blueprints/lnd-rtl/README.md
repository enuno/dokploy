# LND + Ride The Lightning

Lightning Network Daemon with full-featured web UI for node management, channel operations, and monitoring.

## Overview

[LND (Lightning Network Daemon)](https://github.com/lightningnetwork/lnd) is Lightning Labs' flagship implementation of the Lightning Network protocol. This template deploys LND with [Ride The Lightning (RTL)](https://github.com/Ride-The-Lightning/RTL), a comprehensive web-based management interface, backed by Bitcoin Core for blockchain data.

## Architecture

```
┌─────────────────────┐
│        RTL          │ ← Web UI (HTTPS via Traefik)
│   (Management UI)   │    Port 3000 → 443 (Traefik)
│   Macaroon Auth     │
└──────────┬──────────┘
           │ REST API (8080)
           ▼
┌─────────────────────┐
│        LND          │ ← Lightning Network Daemon
│  (Lightning Node)   │    - gRPC RPC: 10009
│  Port 9735 (P2P)    │    - REST API: 8080
│  (Public Access)    │    - P2P: 9735 (public)
└──────────┬──────────┘
           │ RPC + ZMQ
           ▼
┌─────────────────────┐
│   Bitcoin Core      │ ← Blockchain Backend
│    (Backend)        │    - RPC: 8332
│  Pruned (10GB)      │    - ZMQ: 28332, 28333
└─────────────────────┘

Network Topology:
─────────────────
RTL:          lnd-net + dokploy-network
LND:          lnd-net + dokploy-network
Bitcoin Core: lnd-net only (internal)
```

**Service Dependencies:**
- **RTL** requires **LND** RPC API (via macaroon authentication)
- **LND** requires **Bitcoin Core** RPC + ZMQ feeds
- **Bitcoin Core** provides blockchain data and mempool updates

## Features

- ⚡ **Lightning Network Node**: Full LND implementation with advanced features
- 🌐 **Web Management UI**: RTL provides comprehensive node control
- 📊 **Real-time Monitoring**: Channel balances, routing stats, node health
- 💰 **Channel Management**: Open, close, rebalance channels via web UI
- 🔐 **Macaroon Authentication**: Secure API access with LND macaroons
- 🔗 **Bitcoin Core Backend**: Integrated pruned Bitcoin node (10GB default)
- 📈 **Analytics**: Routing history, fee statistics, earnings tracking
- 🔒 **Security Hardening**: Network isolation, HTTPS, security headers

## Prerequisites

- Dokploy instance running
- Domain name configured in DNS
- Minimum 15GB disk space (10GB Bitcoin + 5GB LND/RTL data)
- Understanding of Lightning Network operations
- **Important**: Port 9735 must be publicly accessible for P2P connections

## Quick Start

### 1. Deploy Template

1. Navigate to Dokploy dashboard
2. Go to **Templates** → **Import Template**
3. Select **LND + Ride The Lightning** template
4. Configure required variables:
   - `RTL_DOMAIN`: Your domain (e.g., `lightning.yourdomain.com`)
   - Bitcoin RPC password will be auto-generated

### 2. Initial Blockchain Sync

**Important**: Bitcoin Core syncs on first startup (6-12 hours with pruned mode):

```bash
# Check Bitcoin sync progress
docker exec -it <bitcoind-container> bitcoin-cli -rpcuser=bitcoin -rpcpassword=<password> getblockchaininfo

# Key fields:
# - "blocks": Current block height
# - "verificationprogress": 0.0 to 1.0 (percentage)
# - "pruned": true
```

### 3. Wait for LND Initialization

LND creates wallet and macaroons on first start. Wait for healthy status:

```bash
# Check LND status
docker logs <lnd-container> --follow

# Look for: "Wallet unlocked" and "Server listening on 0.0.0.0:9735"
```

### 4. Access RTL Web UI

Once services are healthy:

1. Navigate to `https://${RTL_DOMAIN}`
2. **Default password**: `password`
3. **IMPORTANT**: Change password immediately via Settings → Authentication

### 5. Create LND Wallet (First Time Only)

If wallet doesn't exist, RTL will prompt you to:
1. Generate new seed (24 words)
2. **Write down seed phrase** - required for recovery!
3. Set wallet password
4. Create wallet

## Configuration Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RTL_DOMAIN` | *required* | Domain for accessing RTL web UI |
| `LND_NETWORK` | `mainnet` | Network type (`mainnet`, `testnet`, `regtest`) |
| `LND_ALIAS` | `MyLNDNode` | Public node alias (visible in network) |
| `LND_COLOR` | `#3399FF` | Node color in hex (for explorers) |
| `BITCOIN_RPC_USER` | `bitcoin` | Bitcoin Core RPC username |
| `BITCOIN_RPC_PASSWORD` | *auto-generated* | Bitcoin Core RPC password (32 chars) |
| `BITCOIN_PRUNE` | `10000` | Pruning size in MB (0 = full node) |
| `LND_P2P_PORT` | `9735` | Lightning P2P network port |
| `RTL_SSO` | `0` | RTL SSO integration (0 = disabled) |

### Network Options

- **Mainnet** (`mainnet`): Real Bitcoin, requires funding with real BTC
- **Testnet** (`testnet`): Test Bitcoin, use faucets for test BTC
- **Regtest** (`regtest`): Local development, instant blocks

## Post-Deployment

### 1. Configure Firewall

**Critical**: Port 9735 MUST be publicly accessible for Lightning P2P:

```bash
# Open Lightning P2P port
sudo ufw allow 9735/tcp comment "Lightning Network P2P"

# HTTPS already handled by Traefik
sudo ufw allow 443/tcp comment "HTTPS (Traefik)"
```

**Without public port 9735:**
- Cannot receive inbound channels
- Cannot be found by peers
- Routing capacity severely limited

### 2. Fund On-Chain Wallet

Before opening channels, fund the LND wallet:

1. In RTL, go to **On-chain** → **Receive**
2. Generate new address
3. Send Bitcoin to the address
4. Wait for confirmations (3+ recommended)

### 3. Verify Services

```bash
# Check all services healthy
docker ps | grep -E "(rtl|lnd|bitcoind)"

# Check LND node info via CLI
docker exec -it <lnd-container> lncli --network=mainnet getinfo

# Check RTL web UI accessible
curl -k https://${RTL_DOMAIN}
```

## RTL Web UI Guide

### Dashboard Overview

**Main Dashboard** shows:
- Node status and sync progress
- Total balance (on-chain + Lightning)
- Active channels and capacity
- Recent transactions
- Routing events

### Opening Channels

1. **Navigate**: Channels → Open Channel
2. **Connect to Peer**:
   - Enter node public key
   - Optionally: node@host:port
   - Click "Connect"
3. **Fund Channel**:
   - Set channel capacity (satoshis)
   - Set push amount (optional - sends to peer)
   - Choose fee rate
   - Click "Open Channel"
4. **Wait for Confirmation**: Channel opens after ~3 confirmations

### Making Payments

1. **Navigate**: Transactions → Lightning → Send
2. **Enter Invoice**: Paste Lightning invoice (bolt11)
3. **Review**: Check amount, destination, description
4. **Send**: Click "Send Payment"

### Receiving Payments

1. **Navigate**: Transactions → Lightning → Receive
2. **Create Invoice**:
   - Enter amount (satoshis)
   - Add description
   - Set expiry time
   - Click "Generate Invoice"
3. **Share Invoice**: Copy and send to payer

### Channel Management

**Rebalancing**:
- Navigate: Channels → select channel → "Circular Rebalance"
- Moves funds between your own channels
- Improves routing capacity

**Closing Channels**:
- Cooperative close: Both parties online, fastest
- Force close: Uncooperative peer, takes time (CSV delay)

## Lightning Network Operations

### Opening Your First Channels

**Best Practices**:
1. Start with 2-3 channels (diversify)
2. Choose well-connected nodes (see 1ML, Amboss)
3. Balance channel size: 1-5M sats per channel
4. Consider routing nodes vs merchant nodes

**Recommended Nodes for First Channels**:
- ACINQ (node.acinq.co)
- Lightning Labs (lnd.lightning.community)
- Bitrefill (bitrefill.com)

### Routing Fees

**Set Your Fees** (RTL → Channels → Fee Management):
- **Base Fee**: Fixed sat per HTLC (default: 1 sat)
- **Fee Rate**: Parts per million (default: 1 ppm = 0.0001%)
- **Time Lock Delta**: CLTV blocks (default: 40)

**Example**: Routing 100,000 sats with 100 ppm fee = 10 sats earned

### Autopilot (Not Enabled by Default)

To enable LND autopilot (auto-open channels):
1. Add to LND command in docker-compose.yml:
   ```yaml
   - --autopilot.active
   - --autopilot.maxchannels=5
   - --autopilot.allocation=0.6
   ```
2. Restart LND
3. Autopilot will automatically open channels

## Advanced Configuration

### Enable Tor for Privacy

Add to LND command in docker-compose.yml:
```yaml
- --tor.active
- --tor.v3
- --listen=localhost
```

**Requires**: Tor proxy container (not included in template)

### Watchtower (Monitor Channels)

Protect against channel breaches:
```yaml
# Add to LND command
- --watchtower
- --watchtower.towerdir=/root/.lnd/data/watchtower
```

LND will monitor channels even when node is offline.

### Increase Payment Reliability

```yaml
# Add to LND command
- --routerrpc.minrtprob=0.01        # Lower min route probability
- --routerrpc.attemptcost=10        # Lower attempt cost (sats)
- --routerrpc.maxmchistory=10000    # Increase MC history
```

## Troubleshooting

### Issue 1: RTL Shows "Connecting..." Forever

**Cause**: LND not fully started or macaroon not accessible

**Solutions**:
```bash
# Check LND logs
docker logs <lnd-container> --tail 100

# Verify LND is responding
docker exec -it <lnd-container> lncli --network=mainnet getinfo

# Check macaroon file exists
docker exec -it <lnd-container> ls -la /root/.lnd/data/chain/bitcoin/mainnet/
# Should see: admin.macaroon, readonly.macaroon, invoice.macaroon

# Restart RTL if LND is healthy
docker restart <rtl-container>
```

### Issue 2: Cannot Open Channels - Insufficient Funds

**Cause**: Not enough on-chain balance

**Solutions**:
```bash
# Check on-chain balance
docker exec -it <lnd-container> lncli --network=mainnet walletbalance

# Generate new address
docker exec -it <lnd-container> lncli --network=mainnet newaddress p2wkh

# Send Bitcoin to the address
# Check again after confirmations
```

### Issue 3: Channels Not Routing

**Symptoms**: No routing events, channels unused

**Common Causes**:
1. **Insufficient inbound capacity**: Open inbound channels or rebalance
2. **High fees**: Lower your routing fees
3. **Poor peer selection**: Connect to routing nodes
4. **Not announced**: Wait for channel announcement (~6 confirmations)

**Solutions**:
```bash
# Check channel state
docker exec -it <lnd-container> lncli --network=mainnet listchannels

# Verify channels are announced
docker exec -it <lnd-container> lncli --network=mainnet getchaninfo <channel-id>
# Look for "node1_policy" and "node2_policy"
```

### Issue 4: Bitcoin Not Syncing

**Symptoms**: LND stuck, verificationprogress not increasing

**Solutions**:
```bash
# Check Bitcoin peer connections
docker exec -it <bitcoind-container> bitcoin-cli -rpcuser=bitcoin -rpcpassword=<pass> getnetworkinfo
docker exec -it <bitcoind-container> bitcoin-cli -rpcuser=bitcoin -rpcpassword=<pass> getpeerinfo

# If no peers, check firewall/network
# Bitcoin Core should connect to 8+ peers

# Restart Bitcoin Core if stuck
docker restart <bitcoind-container>
```

### Issue 5: "Channel Breach" Alert

**Critical**: Someone tried to broadcast old channel state (cheat)

**Immediate Actions**:
1. **DO NOT PANIC** - LND likely closed channel automatically
2. Check penalty transaction:
   ```bash
   docker exec -it <lnd-container> lncli --network=mainnet pendingchannels
   # Look for "waiting_close_channels" with type "breach"
   ```
3. Wait for penalty transaction to confirm (~144 blocks)
4. Funds will be returned to your wallet with penalty from cheater

**Prevention**: Keep node online, use watchtowers

## Backup and Recovery

### Critical Data to Backup

**1. LND Data** (CRITICAL - channel state):
```bash
# Backup entire .lnd directory
docker cp <lnd-container>:/root/.lnd ./lnd-backup-$(date +%Y%m%d)

# Most critical files:
# - channel.backup (static channel backup)
# - wallet.db (on-chain wallet)
# - macaroons directory (API access)
```

**2. RTL Database** (optional - UI settings):
```bash
docker cp <rtl-container>:/RTL/database ./rtl-backup-$(date +%Y%m%d)
```

### Static Channel Backup (SCB)

LND automatically maintains `channel.backup`:

```bash
# Download SCB via RTL
# RTL → Backup → Download Static Channel Backup

# Or via CLI
docker exec -it <lnd-container> lncli --network=mainnet exportchanbackup --all --output_file /root/.lnd/channel.backup
docker cp <lnd-container>:/root/.lnd/channel.backup ./scb-backup-$(date +%Y%m%d).backup
```

**Store SCB in multiple locations** (encrypted cloud, USB drive, etc.)

### Disaster Recovery Procedure

**If node fails completely:**

1. **Restore with seed phrase + SCB**:
   ```bash
   # New LND instance will prompt for seed on first start
   # Provide 24-word seed phrase
   # Upload channel.backup file via RTL
   ```

2. **LND will**:
   - Recreate on-chain wallet
   - Force-close all channels
   - Send funds to on-chain wallet

3. **Wait for timelock** (CSV delay, usually 144 blocks = ~24 hours)

4. **Funds returned** to on-chain wallet

**⚠️ WARNING**: SCB does NOT preserve channel states - only force-closes and recovers funds.

### Automated Backup Script

```bash
#!/bin/bash
# backup-lnd.sh - Daily LND backup

BACKUP_DIR="/backups/lnd"
DATE=$(date +%Y%m%d)

# Stop containers (optional for consistency)
# docker stop lnd rtl

# Backup LND data
docker cp lnd:/root/.lnd ${BACKUP_DIR}/lnd-${DATE}

# Backup RTL database
docker cp rtl:/RTL/database ${BACKUP_DIR}/rtl-${DATE}

# Restart containers (if stopped)
# docker start bitcoind lnd rtl

# Encrypt backup (recommended)
tar czf ${BACKUP_DIR}/lnd-${DATE}.tar.gz ${BACKUP_DIR}/lnd-${DATE}
openssl enc -aes-256-cbc -salt -in ${BACKUP_DIR}/lnd-${DATE}.tar.gz -out ${BACKUP_DIR}/lnd-${DATE}.tar.gz.enc
rm -rf ${BACKUP_DIR}/lnd-${DATE} ${BACKUP_DIR}/lnd-${DATE}.tar.gz

# Keep last 7 days
find ${BACKUP_DIR} -name "lnd-*.tar.gz.enc" -mtime +7 -delete

# Upload to remote storage (S3, B2, etc.)
# aws s3 cp ${BACKUP_DIR}/lnd-${DATE}.tar.gz.enc s3://my-backup-bucket/
```

Add to crontab:
```bash
0 3 * * * /path/to/backup-lnd.sh
```

## Resources

### Documentation
- [LND Official Docs](https://docs.lightning.engineering/)
- [RTL Documentation](https://docs.ridethelightning.info/)
- [LND API Reference](https://lightning.engineering/api-docs/)
- [Lightning Network Specs (BOLTs)](https://github.com/lightning/bolts)

### Community
- [LND GitHub](https://github.com/lightningnetwork/lnd)
- [RTL GitHub](https://github.com/Ride-The-Lightning/RTL)
- [Lightning Community Slack](https://lightningcommunity.slack.com/)
- [Bitcoin StackExchange - Lightning Tag](https://bitcoin.stackexchange.com/questions/tagged/lightning-network)

### Explorers & Tools
- [1ML - Lightning Network Explorer](https://1ml.com/)
- [Amboss - Node Stats & Tools](https://amboss.space/)
- [LNRouter - Routing Statistics](https://lnrouter.app/)
- [Terminal by Lightning Labs](https://terminal.lightning.engineering/)

### Learning Resources
- [Lightning Network Whitepaper](https://lightning.network/lightning-network-paper.pdf)
- [Mastering the Lightning Network (Book)](https://github.com/lnbook/lnbook)
- [Lightning Labs Builder's Guide](https://docs.lightning.engineering/the-lightning-network/overview)
- [Lightning Network Routing Guide](https://docs.lightning.engineering/the-lightning-network/multihop-payments)

## Security Considerations

1. **Backup Seed Phrase**: Write down 24 words on paper, store securely offline
2. **SCB Redundancy**: Keep channel.backup in multiple locations
3. **Change RTL Password**: Default password `password` must be changed immediately
4. **Macaroon Security**: Limit read-only macaroon access for monitoring tools
5. **Hot Wallet Risk**: Lightning nodes are hot wallets - only fund with acceptable loss
6. **Public P2P Port**: Port 9735 must be public - ensure proper firewall configuration
7. **Monitor Node**: Check daily for routing events, channel health, blockchain sync

## Performance Tuning

### Hardware Recommendations

| Component | Minimum | Recommended | Optimal |
|-----------|---------|-------------|---------|
| CPU | 2 cores | 4 cores | 8+ cores |
| RAM | 4GB | 8GB | 16GB+ |
| Disk | 20GB SSD | 50GB SSD | 100GB+ NVMe |
| Network | 10 Mbps | 100 Mbps | 1 Gbps |

### Optimization Tips

1. **Use SSD Storage**: Lightning requires fast I/O for channel updates
2. **Increase Max Channels**: Default 1000, can increase to 10,000+
3. **Enable Pathfinding Cache**: Improves routing performance
4. **Monitor Memory**: LND memory grows with channels - allocate sufficient RAM
5. **Regular Rebalancing**: Keep channels balanced for better routing

### LND Performance Flags

Add to docker-compose.yml command section:
```yaml
- --db.bolt.auto-compact=true               # Compact database
- --db.bolt.auto-compact-min-age=168h       # Compact after 7 days
- --maxpendingchannels=10                   # Limit pending opens
- --protocol.wumbo-channels                 # Enable large channels (>0.16 BTC)
```

---

**Generated with Claude Code** 🤖
