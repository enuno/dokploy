# Core Lightning (c-lightning)

**Lightning Network implementation with integrated Bitcoin Core backend**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ElementsProject/lightning/blob/master/LICENSE)
[![Docker](https://img.shields.io/badge/docker-compose-blue.svg)](https://docs.docker.com/compose/)
[![Lightning Network](https://img.shields.io/badge/lightning-network-yellow.svg)](https://lightning.network/)

---

## 📖 Overview

Core Lightning (formerly c-lightning) is a lightweight, standards-compliant implementation of the Lightning Network protocol written in C. This Dokploy template deploys a complete Lightning Network node with an integrated Bitcoin Core backend, enabling instant Bitcoin payments with minimal fees.

**Key Features:**
- ⚡ **Lightning Network Node**: Full Lightning protocol implementation (BOLT specs)
- 🔗 **Bitcoin Core Backend**: Integrated pruned Bitcoin node (10GB storage mode)
- 🌐 **P2P Connectivity**: Direct Lightning Network peer connections (port 9735)
- 🔐 **RPC Access**: Bitcoin RPC for blockchain queries (internal only)
- 📊 **ZMQ Pub/Sub**: Real-time blockchain event notifications
- 🚀 **Production Ready**: Health checks, automatic restarts, proper network isolation

**Use Cases:**
- Send/receive Bitcoin via Lightning Network
- Open payment channels with other Lightning nodes
- Route Lightning payments (earn routing fees)
- Build Lightning-enabled applications
- Participate in the Lightning Network economy

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Lightning Network                        │
│                    (Global P2P Network)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ Port 9735 (P2P)
                         │
                         ▼
        ┌────────────────────────────────────┐
        │         lightningd                 │
        │  (elementsproject/lightningd)      │
        │                                    │
        │  - Lightning protocol impl         │
        │  - Channel management              │
        │  - Payment routing                 │
        │  - Peer connections (0.0.0.0:9735) │
        └────────────┬───────────────────────┘
                     │ RPC (8332) + ZMQ (28332/28333)
                     │ Internal network only
                     ▼
        ┌────────────────────────────────────┐
        │          bitcoind                  │
        │   (ruimarinho/bitcoin-core)        │
        │                                    │
        │  - Bitcoin blockchain sync         │
        │  - Pruned mode (10GB storage)      │
        │  - RPC server (8332)               │
        │  - ZMQ block/tx notifications      │
        └────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │      Persistent Storage            │
        │                                    │
        │  - lightning-data: Node data       │
        │  - bitcoin-data: Blockchain (~10GB)│
        └────────────────────────────────────┘

Networks:
  core-lightning-net (internal): lightningd ↔ bitcoind
  dokploy-network (external):    lightningd ↔ Lightning Network
```

**Network Isolation:**
- `bitcoind`: Internal network only (secure backend)
- `lightningd`: Both networks (external P2P + internal RPC)

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BITCOIN_RPC_USER` | No | `bitcoin` | Bitcoin RPC username |
| `BITCOIN_RPC_PASSWORD` | ✅ Yes | Auto-generated | Bitcoin RPC password (32 chars) |
| `BITCOIN_PRUNE` | No | `10000` | Blockchain pruning (MB) - reduces storage to ~10GB |
| `LIGHTNING_NETWORK` | No | `bitcoin` | Network: `bitcoin` (mainnet), `testnet`, `signet` |
| `LIGHTNING_ALIAS` | No | Empty | Your node's public name (max 32 bytes) |
| `LIGHTNING_RGB_COLOR` | No | `3399FF` | Node color in hex (appears in explorers) |
| `LIGHTNING_ANNOUNCE_ADDR` | No | Empty | Public IP/domain for incoming connections |
| `LIGHTNING_P2P_PORT` | No | `9735` | Lightning P2P port (must be open in firewall) |
| `LIGHTNING_LOG_LEVEL` | No | `info` | Log level: `debug`, `info`, `unusual`, `broken` |

**Auto-Generated Secrets (template.toml):**
- `bitcoin_rpc_password`: 32-character random password

### Port Configuration

| Port | Protocol | Purpose | Exposure |
|------|----------|---------|----------|
| 9735 | TCP | Lightning P2P network | External (must be open) |
| 8332 | TCP | Bitcoin RPC | Internal only |
| 28332 | TCP | ZMQ block notifications | Internal only |
| 28333 | TCP | ZMQ transaction notifications | Internal only |

**Firewall Requirements:**
```bash
# Allow Lightning P2P (required for incoming connections)
ufw allow 9735/tcp
```

---

## 🚀 Quick Start

### Prerequisites

**Required:**
1. **Dokploy Instance**: Running Dokploy installation
2. **Public IP**: For Lightning Network peer connections
3. **Firewall**: Port 9735 open for incoming connections
4. **Storage**: Minimum 15-25 GB free space (pruned mode)
5. **RAM**: 1-2 GB minimum

**Optional:**
- Domain name (for `LIGHTNING_ANNOUNCE_ADDR`)
- Static IP or dynamic DNS

### Deployment Steps

#### Step 1: Deploy in Dokploy

1. **Create New Service** in Dokploy
2. **Select Template**: Choose "Core Lightning" from templates
3. **Configure Variables**:
   - `LIGHTNING_ALIAS`: Your node name (e.g., "MyLightningNode")
   - `LIGHTNING_RGB_COLOR`: Node color in hex (e.g., "FF5733")
   - `LIGHTNING_ANNOUNCE_ADDR`: Your public IP or domain
   - `BITCOIN_RPC_PASSWORD`: Auto-generated (leave default)
4. **Deploy**: Click "Deploy" and wait for services to start

#### Step 2: Open Firewall Port

```bash
# Allow Lightning P2P connections
sudo ufw allow 9735/tcp

# Verify port is open
sudo ufw status | grep 9735
```

#### Step 3: Wait for Bitcoin Sync

**Initial sync takes 6-24 hours** depending on network speed:

```bash
# Check Bitcoin sync progress
docker exec <container-name> bitcoin-cli -rpcuser=bitcoin -rpcpassword=<password> getblockchaininfo

# Look for:
# "blocks": current block height
# "headers": target block height
# "verificationprogress": 0.0 to 1.0 (1.0 = synced)
```

**Lightning node will start once Bitcoin is synced.**

#### Step 4: Verify Lightning Node

```bash
# Check Lightning node info
docker exec <container-name> lightning-cli getinfo

# Expected output:
# {
#   "id": "02abc123...",           # Your node public key
#   "alias": "MyLightningNode",
#   "color": "3399ff",
#   "num_peers": 0,                 # Will increase as you connect
#   "blockheight": 825000,          # Current block height
#   "network": "bitcoin"
# }
```

---

## 💰 Using Your Lightning Node

### Connect to Peers

```bash
# Connect to a Lightning node (example)
docker exec <container-name> lightning-cli connect <node_pubkey>@<node_ip>:9735

# Example:
# lightning-cli connect 02abc123...@lightning.example.com:9735
```

### Open a Payment Channel

```bash
# Open channel with 0.001 BTC (100,000 satoshis)
docker exec <container-name> lightning-cli fundchannel <node_pubkey> 100000

# Check channel status
docker exec <container-name> lightning-cli listfunds
```

### Send a Payment

```bash
# Pay a Lightning invoice
docker exec <container-name> lightning-cli pay <bolt11_invoice>

# Example:
# lightning-cli pay lnbc10n1...
```

### Create an Invoice

```bash
# Create invoice for 1000 satoshis
docker exec <container-name> lightning-cli invoice 1000 "payment-label" "Payment description"

# Returns BOLT11 invoice string to share with payer
```

### Check Balance

```bash
# View on-chain and Lightning balances
docker exec <container-name> lightning-cli listfunds

# View channel balances
docker exec <container-name> lightning-cli listchannels
```

---

## 🔍 Troubleshooting

### Issue 1: Bitcoin Sync Taking Too Long

**Symptoms:**
- Bitcoin sync stuck at low percentage
- Lightning node not starting

**Solutions:**
1. **Check network speed**:
   ```bash
   docker logs <bitcoind-container> | tail -50
   # Look for "UpdateTip" messages showing progress
   ```
2. **Increase pruning** (reduce storage, faster sync):
   - Set `BITCOIN_PRUNE=5000` (5GB) in environment variables
   - Redeploy service
3. **Wait patiently**: Initial sync is normal (6-24 hours)
4. **Verify connectivity**:
   ```bash
   docker exec <bitcoind-container> bitcoin-cli getpeerinfo | jq 'length'
   # Should show 8-10 peers
   ```

### Issue 2: Lightning Node Not Connecting to Peers

**Symptoms:**
- `lightning-cli connect` fails with connection timeout
- Zero peers after several hours

**Solutions:**
1. **Verify port 9735 is open**:
   ```bash
   # From external machine
   telnet <your-server-ip> 9735
   # Should connect (Ctrl+C to exit)
   ```
2. **Check firewall rules**:
   ```bash
   sudo ufw status | grep 9735
   # Should show "ALLOW"
   ```
3. **Verify announce address**:
   ```bash
   docker exec <container-name> lightning-cli getinfo
   # "address" should show your public IP
   ```
4. **Try connecting to well-known nodes**:
   ```bash
   # ACINQ node (example)
   lightning-cli connect 03864ef025fde8fb587d989186ce6a4a186895ee44a926bfc370e2c366597a3f8f@3.33.236.230:9735
   ```

### Issue 3: Cannot Access Bitcoin RPC

**Symptoms:**
- Lightning node logs show "Connection refused" to bitcoind
- Health check failing

**Solutions:**
1. **Check bitcoind health**:
   ```bash
   docker ps | grep bitcoind
   # Should show "healthy" status
   ```
2. **Verify RPC credentials**:
   ```bash
   # Check environment variables match
   docker exec <bitcoind-container> env | grep BITCOIN_RPC
   docker exec <lightningd-container> env | grep BITCOIN_RPC
   ```
3. **Check network connectivity**:
   ```bash
   docker exec <lightningd-container> ping bitcoind
   # Should respond
   ```
4. **Review bitcoind logs**:
   ```bash
   docker logs <bitcoind-container> 2>&1 | grep -i error
   ```

### Issue 4: Insufficient Disk Space

**Symptoms:**
- Bitcoin sync stops with "No space left on device"
- Services crashing randomly

**Solutions:**
1. **Check disk usage**:
   ```bash
   df -h
   docker system df
   ```
2. **Increase pruning** (reduce blockchain storage):
   - Set `BITCOIN_PRUNE=5000` (5GB minimum)
   - Restart bitcoind service
3. **Clean up Docker**:
   ```bash
   docker system prune -a --volumes
   # WARNING: Removes unused containers/volumes
   ```

### Issue 5: Lightning Channel Stuck "Opening"

**Symptoms:**
- Channel shows "CHANNELD_AWAITING_LOCKIN" for hours
- Funds locked but channel not active

**Solutions:**
1. **Wait for confirmations** (usually 3-6 blocks):
   ```bash
   lightning-cli listfunds
   # Check "blockheight" of pending channels
   ```
2. **Check Bitcoin mempool**:
   ```bash
   docker exec <bitcoind-container> bitcoin-cli getmempoolinfo
   # High "size" = network congestion (wait longer)
   ```
3. **Verify funding transaction confirmed**:
   ```bash
   lightning-cli listfunds | jq '.channels[] | select(.state=="CHANNELD_AWAITING_LOCKIN")'
   # Get txid, then check on block explorer
   ```

### Issue 6: Lightning CLI Not Found

**Symptoms:**
- `lightning-cli: command not found`

**Solutions:**
1. **Use full path**:
   ```bash
   docker exec <container-name> /usr/bin/lightning-cli getinfo
   ```
2. **Check container is running**:
   ```bash
   docker ps | grep lightning
   ```
3. **Verify image version**:
   ```bash
   docker inspect <container-name> | grep Image
   # Should show elementsproject/lightningd:v25.12
   ```

---

## 📊 Monitoring & Maintenance

### Health Checks

Both services have automated health checks:

**Lightning:**
```bash
# Manual health check
docker exec <container-name> lightning-cli getinfo
# Returns node info if healthy
```

**Bitcoin:**
```bash
# Manual health check
docker exec <container-name> bitcoin-cli -rpcuser=bitcoin -rpcpassword=<password> getblockchaininfo
# Returns blockchain info if healthy
```

### Resource Usage

**Expected resource consumption:**
- **CPU**: Low (1-5% idle, 20-50% during sync)
- **RAM**: 1-2 GB (Lightning + Bitcoin combined)
- **Storage**:
  - Initial: ~15-25 GB (pruned mode)
  - Growth: ~500 MB/month (pruned chain growth)
- **Network**:
  - Sync: 10-50 GB download (initial)
  - Ongoing: 1-5 GB/month

### Backup Recommendations

**Critical data to backup:**
1. **Lightning wallet**: `/root/.lightning/bitcoin/hsm_secret` (CRITICAL - controls your funds)
2. **Bitcoin wallet**: `/home/bitcoin/.bitcoin/wallet.dat` (if using on-chain wallet)
3. **Channel database**: `/root/.lightning/bitcoin/lightningd.sqlite3`

**Backup procedure:**
```bash
# Stop Lightning node first
docker stop <lightningd-container>

# Backup Lightning data
docker cp <lightningd-container>:/root/.lightning/bitcoin/hsm_secret ./backup/
docker cp <lightningd-container>:/root/.lightning/bitcoin/lightningd.sqlite3 ./backup/

# Restart Lightning node
docker start <lightningd-container>
```

**Store backups securely** (encrypted, offline, multiple locations).

### Log Monitoring

```bash
# Lightning logs
docker logs <lightningd-container> -f

# Bitcoin logs
docker logs <bitcoind-container> -f

# Filter for errors
docker logs <lightningd-container> 2>&1 | grep -i error
```

---

## 🔒 Security Considerations

1. **Bitcoin RPC Password**: Auto-generated 32-character password (stored in Dokploy secrets)
2. **Network Isolation**: Bitcoin RPC only accessible from Lightning container
3. **Firewall**: Only port 9735 exposed (Lightning P2P)
4. **No Web UI**: No HTTP endpoints exposed (RPC only)
5. **Pruned Mode**: Reduces attack surface (less data stored)

**Security Best Practices:**
- Keep RPC password secure (never expose publicly)
- Regularly backup `hsm_secret` file (controls your Bitcoin)
- Monitor logs for unusual peer connections
- Use firewall rules to restrict 9735 to known peers (optional)
- Keep Docker images updated (security patches)

---

## 🔄 Updates & Maintenance

### Updating Lightning Node

To update to a newer Core Lightning version:

1. **Check current version**:
   ```bash
   docker exec <container-name> lightningd --version
   ```
2. **Update docker-compose.yml**:
   ```yaml
   image: elementsproject/lightningd:v26.0  # Change version
   ```
3. **Redeploy** in Dokploy
4. **Verify** node restarts successfully:
   ```bash
   docker logs <container-name> | grep "Server started"
   ```

### Updating Bitcoin Core

1. **Check current version**:
   ```bash
   docker exec <container-name> bitcoind --version
   ```
2. **Update docker-compose.yml**:
   ```yaml
   image: ruimarinho/bitcoin-core:28.0  # Change version
   ```
3. **Redeploy** in Dokploy
4. **Verify** sync continues:
   ```bash
   docker logs <container-name> | grep "UpdateTip"
   ```

---

## 📚 Resources

### Official Documentation
- **Core Lightning**: https://docs.corelightning.org/
- **Lightning Network**: https://lightning.network/
- **Bitcoin Core**: https://bitcoin.org/en/bitcoin-core/
- **Docker Image**: https://hub.docker.com/r/elementsproject/lightningd

### Community & Support
- **Core Lightning GitHub**: https://github.com/ElementsProject/lightning
- **Lightning Network Discord**: https://discord.gg/lightningnetwork
- **Bitcoin Stack Exchange**: https://bitcoin.stackexchange.com/

### Learning Resources
- **Lightning Network Whitepaper**: https://lightning.network/lightning-network-paper.pdf
- **BOLT Specifications**: https://github.com/lightning/bolts
- **Mastering Lightning**: https://github.com/lnbook/lnbook

### Network Explorers
- **1ML.com**: https://1ml.com/ (Lightning Network explorer)
- **Amboss.space**: https://amboss.space/ (Node rankings and analytics)
- **Mempool.space**: https://mempool.space/ (Bitcoin blockchain explorer)

---

## 📝 License

- **Core Lightning**: MIT License
- **Bitcoin Core**: MIT License
- **This Template**: MIT License

---

## 🤝 Contributing

Found an issue or have a suggestion? Please open an issue in the [Dokploy Templates repository](https://github.com/your-org/dokploy-templates).

---

**Template Version**: 1.0.0
**Lightning Version**: v25.12
**Bitcoin Core Version**: 27.0
**Last Updated**: 2025-12-29

---

## Additional Notes

### Future Enhancements

**Planned for future versions:**
1. **Ride The Lightning (RTL)**: Web UI for node management
2. **Thunderhub**: Alternative web-based node manager
3. **Lightning Terminal**: Loop/Pool integration for liquidity management
4. **Tor Support**: Hidden service for enhanced privacy
5. **Watchtower**: Channel monitoring for offline nodes

### Known Limitations

1. **No Web UI**: Command-line interface only (RTL coming in future version)
2. **Manual Channel Management**: No automated channel balancing
3. **Pruned Mode Only**: Cannot run full archival node with this template
4. **No Tor**: Clearnet connections only (Tor support planned)

### Performance Tuning

**For high-traffic nodes:**
```yaml
# In docker-compose.yml, add under lightningd command:
- --max-concurrent-htlcs=30        # Default: 30
- --htlc-minimum-msat=1            # Minimum payment size
- --htlc-maximum-msat=4294967295   # Maximum payment size
- --fee-base=1000                  # Base routing fee (msats)
- --fee-per-satoshi=1              # Proportional fee (ppm)
```

**For low-resource servers:**
```yaml
# Reduce Bitcoin memory usage
environment:
  BITCOIN_PRUNE: 5000  # Minimum 5GB
```

---

**Ready to join the Lightning Network? Deploy now and start routing payments! ⚡**
