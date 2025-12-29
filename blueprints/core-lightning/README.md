# Core Lightning

Lightning Network implementation focusing on spec compliance and performance, with integrated Bitcoin Core backend.

## Overview

[Core Lightning](https://github.com/ElementsProject/lightning) (CLN) is a lightweight, highly extensible Lightning Network implementation written in C. This template deploys Core Lightning with a Bitcoin Core backend, providing a complete Lightning node infrastructure.

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   lightningd        │────▶│     bitcoind        │
│  (Lightning Node)   │     │  (Bitcoin Backend)  │
│  Port 9835 (RPC)    │     │  Port 8332 (RPC)    │
│  Port 9735 (P2P)    │     │  Pruned Node        │
└──────────┬──────────┘     └─────────────────────┘
           │                           │
           │                           │
   dokploy-network              corelightning-net
   (External API)                  (Internal)
```

**Service Architecture:**
- **lightningd**: Lightning Network daemon exposing RPC/gRPC API
- **bitcoind**: Bitcoin Core providing blockchain data via RPC

## Features

- ⚡ **Lightning Network Node**: Full Lightning implementation with channel management
- 🔗 **Bitcoin Core Backend**: Integrated pruned Bitcoin node (10GB vs 600GB full node)
- 🌐 **RPC/gRPC API**: Exposed via Traefik with SSL/TLS (Let's Encrypt)
- 🔒 **Security Hardening**: Network isolation, security headers, variable-based secrets
- 📊 **Health Monitoring**: Container health checks for both services
- 🎨 **Customizable**: Configurable network (mainnet/testnet/regtest), alias, color

## Prerequisites

- Dokploy instance running
- Domain name configured in DNS
- Minimum 15GB disk space (10GB Bitcoin + 5GB Lightning data)
- Understanding of Lightning Network operations

## Quick Start

### 1. Deploy Template

1. Navigate to Dokploy dashboard
2. Go to **Templates** → **Import Template**
3. Select **Core Lightning** template
4. Configure required variables:
   - `CLN_DOMAIN`: Your domain (e.g., `lightning.yourdomain.com`)
   - Bitcoin RPC password will be auto-generated

### 2. Initial Blockchain Sync

**Important**: Bitcoin Core will sync blockchain on first startup. With pruned mode (default 10GB):
- **Sync time**: 6-12 hours depending on hardware
- **Disk usage**: ~10GB (vs 600GB for full node)
- **Monitor progress**: Check bitcoind logs in Dokploy

```bash
# Check Bitcoin sync status
docker exec -it <bitcoind-container> bitcoin-cli -rpcuser=bitcoin -rpcpassword=<password> getblockchaininfo

# Key fields:
# - "blocks": Current block height
# - "verificationprogress": Percentage complete (0.0 to 1.0)
# - "pruned": true (confirms pruning enabled)
```

### 3. Create Lightning Wallet

Once Bitcoin is synced, initialize Lightning wallet:

```bash
# Connect to lightningd container
docker exec -it <lightningd-container> lightning-cli newaddr

# Fund the wallet by sending Bitcoin to the generated address
# Check balance
docker exec -it <lightningd-container> lightning-cli listfunds
```

### 4. Open Lightning Channels

```bash
# Connect to a peer (example: ACINQ node)
docker exec -it <lightningd-container> lightning-cli connect <node-pubkey>@<node-host>:<port>

# Open channel with funding amount in satoshis
docker exec -it <lightningd-container> lightning-cli fundchannel <node-pubkey> <amount-sats>

# List channels
docker exec -it <lightningd-container> lightning-cli listchannels
```

## Configuration Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLN_DOMAIN` | *required* | Domain for accessing Lightning RPC API |
| `LIGHTNINGD_NETWORK` | `bitcoin` | Network type (`bitcoin`, `testnet`, `regtest`) |
| `LIGHTNINGD_ALIAS` | `MyCoreLightningNode` | Public node alias (visible in network) |
| `LIGHTNINGD_RGB` | `02F3E5` | Node color in hex (for explorers) |
| `BITCOIN_RPC_USER` | `bitcoin` | Bitcoin Core RPC username |
| `BITCOIN_RPC_PASSWORD` | *auto-generated* | Bitcoin Core RPC password (32 chars) |
| `BITCOIN_RPC_PORT` | `8332` | Bitcoin Core RPC port |
| `BITCOIN_PRUNE` | `10000` | Pruning size in MB (0 = full node, ~600GB) |
| `LIGHTNING_P2P_PORT` | `9735` | Lightning P2P network port (for peers) |

### Network Options

- **Mainnet** (`bitcoin`): Real Bitcoin blockchain, requires funding with real BTC
- **Testnet** (`testnet`): Test Bitcoin blockchain, use faucets for test BTC
- **Regtest** (`regtest`): Local development network, instant block generation

### Pruning Configuration

| Mode | BITCOIN_PRUNE | Disk Usage | Use Case |
|------|---------------|------------|----------|
| Pruned (default) | `10000` | ~10GB | Most deployments |
| Pruned (min) | `550` | ~550MB | Resource-constrained |
| Full Node | `0` | ~600GB | Archive node, research |

## Post-Deployment

### 1. Access RPC API

The Lightning RPC API is exposed via Traefik with SSL:

```bash
# Using lightning-cli via domain (requires auth setup)
curl https://${CLN_DOMAIN}:9735/v1/getinfo

# Using lightning-cli in container (recommended)
docker exec -it <lightningd-container> lightning-cli getinfo
```

### 2. Configure Firewall

**Required Port Openings:**
- **9735 (TCP)**: Lightning P2P network (must be publicly accessible for peer connections)
- **9835 (TCP)**: RPC API (secured via Traefik + Let's Encrypt)

```bash
# Example: UFW firewall
sudo ufw allow 9735/tcp comment "Lightning P2P"
sudo ufw allow 443/tcp comment "HTTPS (Traefik)"
```

### 3. Monitor Node Health

```bash
# Check Lightning node status
docker exec -it <lightningd-container> lightning-cli getinfo

# Check Bitcoin sync status
docker exec -it <bitcoind-container> bitcoin-cli -rpcuser=bitcoin -rpcpassword=<password> getblockchaininfo

# View container logs
docker logs <lightningd-container> --follow
docker logs <bitcoind-container> --follow
```

### 4. Verify Services

1. **Bitcoin Core**: Check `getblockchaininfo` shows synced blocks
2. **Lightning Daemon**: Check `lightning-cli getinfo` returns node info
3. **Network Connectivity**: Check `lightning-cli listnodes` shows peers

## Lightning Network Operations

### Opening Channels

```bash
# 1. Fund on-chain wallet
docker exec -it <lightningd-container> lightning-cli newaddr
# Send Bitcoin to generated address

# 2. Wait for confirmations
docker exec -it <lightningd-container> lightning-cli listfunds

# 3. Connect to peer
docker exec -it <lightningd-container> lightning-cli connect <pubkey>@<host>:<port>

# 4. Open channel (amount in satoshis)
docker exec -it <lightningd-container> lightning-cli fundchannel <pubkey> <amount>

# 5. Wait for channel to activate (~3 confirmations)
docker exec -it <lightningd-container> lightning-cli listchannels
```

### Making Payments

```bash
# Decode Lightning invoice
docker exec -it <lightningd-container> lightning-cli decodepay <bolt11-invoice>

# Pay invoice
docker exec -it <lightningd-container> lightning-cli pay <bolt11-invoice>

# Check payment status
docker exec -it <lightningd-container> lightning-cli listpays
```

### Receiving Payments

```bash
# Create invoice (amount in millisatoshis)
docker exec -it <lightningd-container> lightning-cli invoice <amount-msats> <label> <description>

# List invoices
docker exec -it <lightningd-container> lightning-cli listinvoices

# Check invoice status
docker exec -it <lightningd-container> lightning-cli waitinvoice <label>
```

### Closing Channels

```bash
# Cooperative close
docker exec -it <lightningd-container> lightning-cli close <channel-id>

# Force close (if peer unresponsive)
docker exec -it <lightningd-container> lightning-cli close <channel-id> true
```

## Bitcoin Core Configuration

### Switching to Full Node

To run a full Bitcoin node instead of pruned:

1. Update `BITCOIN_PRUNE` in Dokploy environment: `0`
2. Ensure sufficient disk space (~600GB)
3. Restart services
4. **Note**: Re-sync required if switching from pruned to full

### Transaction Indexing

By default, transaction indexing (`-txindex`) is disabled. To enable:

1. Update docker-compose.yml command:
```yaml
command:
  - -printtoconsole
  - -rpcallowip=0.0.0.0/0
  - -rpcbind=0.0.0.0
  - -server=1
  - -txindex=1  # Add this line
  - -prune=0    # Must disable pruning
```

2. Requires full node mode (`BITCOIN_PRUNE=0`)
3. Re-sync blockchain with `-reindex` flag

## Troubleshooting

### Issue 1: Bitcoin Core Not Syncing

**Symptoms**: `getblockchaininfo` shows low block count or stuck

**Solutions**:
```bash
# Check network connectivity
docker exec -it <bitcoind-container> bitcoin-cli -rpcuser=bitcoin -rpcpassword=<password> getnetworkinfo

# Check peer connections
docker exec -it <bitcoind-container> bitcoin-cli -rpcuser=bitcoin -rpcpassword=<password> getpeerinfo

# Restart Bitcoin Core
docker restart <bitcoind-container>
```

### Issue 2: Lightning Daemon Won't Start

**Symptoms**: Container restarts repeatedly

**Solutions**:
```bash
# Check logs
docker logs <lightningd-container> --tail 100

# Common causes:
# 1. Bitcoin Core not synced - wait for blockchain sync
# 2. RPC password mismatch - verify BITCOIN_RPC_PASSWORD matches
# 3. Corrupted Lightning data - restore from backup
```

### Issue 3: Cannot Open Channels

**Symptoms**: `fundchannel` command fails

**Solutions**:
```bash
# Check on-chain balance
docker exec -it <lightningd-container> lightning-cli listfunds

# Check Bitcoin Core connection
docker exec -it <lightningd-container> lightning-cli getinfo
# Verify "blockheight" matches current blockchain height

# Ensure peer connection
docker exec -it <lightningd-container> lightning-cli listpeers
# Peer must be connected before opening channel
```

### Issue 4: RPC Connection Refused

**Symptoms**: `lightning-cli` commands fail with connection error

**Solutions**:
```bash
# Check Lightning daemon is running
docker ps | grep lightningd

# Check health status
docker inspect <lightningd-container> --format='{{json .State.Health}}'

# Verify RPC socket exists
docker exec -it <lightningd-container> ls -la /root/.lightning/bitcoin/
```

### Issue 5: Disk Space Issues

**Symptoms**: Container stops, logs show "no space left"

**Solutions**:
```bash
# Check disk usage
docker exec -it <bitcoind-container> du -sh /home/bitcoin/.bitcoin

# Increase pruning limit (lower value = less disk)
# Update BITCOIN_PRUNE to lower value (minimum 550)

# Clean up old Docker volumes
docker volume prune
```

## Backup and Recovery

### What to Backup

**Critical Data:**
1. **Lightning Wallet**: `/root/.lightning/bitcoin/` directory
   - Contains wallet keys, channel states
   - **Loss = permanent loss of funds**

2. **Bitcoin Wallet** (if using): `/home/bitcoin/.bitcoin/wallet/` directory
   - Contains on-chain wallet keys

### Backup Procedure

```bash
# 1. Stop Lightning daemon (to ensure consistent state)
docker stop <lightningd-container>

# 2. Backup Lightning data
docker cp <lightningd-container>:/root/.lightning ./lightning-backup-$(date +%Y%m%d)

# 3. Backup Bitcoin wallet (optional)
docker cp <bitcoind-container>:/home/bitcoin/.bitcoin/wallet ./bitcoin-wallet-backup-$(date +%Y%m%d)

# 4. Restart services
docker start <lightningd-container>
```

### Recovery Procedure

```bash
# 1. Stop services
docker stop <lightningd-container> <bitcoind-container>

# 2. Restore Lightning data
docker cp ./lightning-backup-YYYYMMDD/. <lightningd-container>:/root/.lightning/

# 3. Restore Bitcoin wallet (if needed)
docker cp ./bitcoin-wallet-backup-YYYYMMDD/. <bitcoind-container>:/home/bitcoin/.bitcoin/wallet/

# 4. Start services
docker start <bitcoind-container> <lightningd-container>

# 5. Verify recovery
docker exec -it <lightningd-container> lightning-cli getinfo
docker exec -it <lightningd-container> lightning-cli listfunds
```

### Automated Backup (Recommended)

Set up daily backups using cron:

```bash
# Add to crontab
0 2 * * * /path/to/backup-lightning.sh

# backup-lightning.sh
#!/bin/bash
BACKUP_DIR="/backups/lightning"
DATE=$(date +%Y%m%d)

docker stop lightningd
docker cp lightningd:/root/.lightning ${BACKUP_DIR}/lightning-${DATE}
docker start lightningd

# Keep last 7 days
find ${BACKUP_DIR} -name "lightning-*" -mtime +7 -delete
```

## Resources

### Documentation
- [Core Lightning Docs](https://docs.corelightning.org/)
- [Bitcoin Core Docs](https://bitcoin.org/en/bitcoin-core/)
- [Lightning Network Specs](https://github.com/lightning/bolts)

### Community
- [Core Lightning GitHub](https://github.com/ElementsProject/lightning)
- [Core Lightning Community Chat](https://discord.gg/lightningcommunity)
- [Bitcoin StackExchange](https://bitcoin.stackexchange.com/)

### Explorers
- [1ML - Lightning Network Explorer](https://1ml.com/)
- [Amboss - Lightning Network Explorer](https://amboss.space/)
- [mempool.space - Bitcoin & Lightning](https://mempool.space/lightning)

### Learning
- [Lightning Network Whitepaper](https://lightning.network/lightning-network-paper.pdf)
- [Mastering the Lightning Network (Book)](https://github.com/lnbook/lnbook)
- [Lightning Labs Builder's Guide](https://docs.lightning.engineering/)

## Security Considerations

1. **Backup Frequently**: Lightning channel states change frequently - backup after each channel update
2. **Secure RPC Access**: RPC API is exposed via HTTPS - use strong passwords and consider IP allowlisting
3. **Monitor Channels**: Inactive channels may be force-closed - monitor regularly
4. **Hot Wallet**: Lightning wallets are hot wallets - only fund with amounts you can afford to lose
5. **Network Exposure**: P2P port 9735 must be publicly accessible - ensure firewall configured correctly

## Performance Tuning

### Hardware Recommendations

| Component | Minimum | Recommended | Optimal |
|-----------|---------|-------------|---------|
| CPU | 2 cores | 4 cores | 8+ cores |
| RAM | 4GB | 8GB | 16GB+ |
| Disk | 15GB SSD | 50GB SSD | 100GB+ NVMe |
| Network | 10 Mbps | 100 Mbps | 1 Gbps |

### Optimization Tips

1. **Use SSD Storage**: Lightning requires fast disk I/O for channel updates
2. **Increase Bitcoin Connections**: Add `-maxconnections=125` to Bitcoin command
3. **Enable Fee Estimation**: Bitcoin Core fee estimates improve with more peers
4. **Monitor Memory**: Lightning daemon memory grows with channels - allocate sufficient RAM

---

**Generated with Claude Code** 🤖
