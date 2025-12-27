# HyperBEAM - AO Protocol Node

Deploy an [AO Protocol](https://ao.arweave.dev/) computation node using [HyperBEAM](https://github.com/ar-io/HyperBEAM), the Actor-Oriented supercomputer for the permaweb.

## Overview

HyperBEAM is an Erlang-based implementation of an AO compute node that provides:

- **Message-Based Computation**: Actor-oriented architecture for distributed computation
- **25 Preloaded Devices**: Built-in computational capabilities (crypto, sqlite, json, etc.)
- **Arweave Integration**: Direct integration with the Arweave permanent storage network
- **HTTP API**: RESTful interface for message passing and process management
- **Permaweb Native**: Built for decentralized, permanent applications

## Architecture

### Services

| Service | Description | Port | External Access |
|---------|-------------|------|-----------------|
| **hyperbeam** | AO compute node | 10000 | Yes (via Traefik) |

### Network Architecture

```
                    Internet
                       |
                   [Traefik]
                       |
                  HTTPS (443)
                       |
              [dokploy-network]
                       |
                  [hyperbeam]
                    :10000
                       |
              [hyperbeam-net]
```

**Network Design:**
- **hyperbeam-net**: Internal bridge network (isolated)
- **dokploy-network**: External network for Traefik routing

### Storage

| Volume | Purpose | Path |
|--------|---------|------|
| **hyperbeam-data** | Process state and runtime data | `/opt/data` |
| **hyperbeam-config** | Configuration files and wallet | `/opt/config` |

## Configuration Reference

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `domain` | Domain for HyperBEAM API | `hyperbeam.example.com` | ✅ Yes |

### Environment Variables

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `HYPERBEAM_DOMAIN` | Public domain for the node | `${domain}` | Set via Dokploy |
| `HYPERBEAM_PORT` | HTTP API port | `10000` | Standard AO port |
| `PATH_TO_WALLET` | Path to Arweave wallet JWK | `/opt/config/wallet.json` | See setup below |

### Arweave Wallet

HyperBEAM requires an Arweave wallet to interact with the Arweave network and submit computational results.

**How to obtain a wallet:**
1. Visit [Arweave.app](https://arweave.app/) or [ArConnect](https://www.arconnect.io/)
2. Create a new wallet or export an existing one
3. Download the wallet as a JSON file (JWK format)
4. **Important**: Fund the wallet with AR tokens for network transactions

## Deployment Guide

### Prerequisites

- Dokploy instance running
- Domain with DNS configured
- Arweave wallet (JWK JSON file)
- Basic understanding of AO protocol

### Step 1: Deploy Template

1. Navigate to your Dokploy dashboard
2. Go to **Templates** → **Import Template**
3. Select the **HyperBEAM** template
4. Configure required variables:
   - **Domain**: Your public domain (e.g., `hyperbeam.example.com`)

### Step 2: Upload Arweave Wallet

After deployment, you must upload your Arweave wallet to the configuration volume:

```bash
# Option 1: Using docker cp (recommended)
docker cp /path/to/your/wallet.json $(docker ps -qf "name=hyperbeam"):/opt/config/wallet.json

# Option 2: Using Dokploy volume mount
# 1. Go to Dokploy → Services → hyperbeam → Volumes
# 2. Access hyperbeam-config volume
# 3. Upload wallet.json to /opt/config/
```

**Security Notes:**
- The wallet.json file contains private keys - protect it carefully
- Use a dedicated wallet for the compute node (not your main wallet)
- Ensure the wallet has sufficient AR balance for transactions
- Set appropriate file permissions: `chmod 600 wallet.json`

### Step 3: Verify Deployment

Check that HyperBEAM is running correctly:

```bash
# Health check endpoint
curl https://your-domain.com/~meta@1.0/info

# Expected response:
{
  "version": "1.0",
  "devices": [...],
  "status": "ok"
}
```

### Step 4: DNS Configuration

Ensure your domain points to your Dokploy server:

```bash
# Verify DNS resolution
dig your-domain.com

# Should return your server's IP address
```

## API Usage

### Basic Endpoints

```bash
# Node metadata
GET /~meta@1.0/info

# Message passing (process communication)
POST /~process/<process-id>

# Process state query
GET /~process/<process-id>
```

### Example: Send Message to Process

```bash
curl -X POST https://your-domain.com/~process/PROCESS_ID \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, AO!",
    "data": {...}
  }'
```

For complete API documentation, see: [AO Protocol Docs](https://ao.arweave.dev/)

## Advanced Configuration

### Custom config.flat

For advanced users, you can provide custom Erlang configuration via `config.flat`:

1. Create your `config.flat` file following [HyperBEAM documentation](https://github.com/ar-io/HyperBEAM)
2. Upload to the `hyperbeam-config` volume at `/opt/config/config.flat`
3. Restart the service

Example config.flat sections:
- Logger configuration
- Device loading preferences
- Network timeouts
- Process limits

### Resource Requirements

**Minimum:**
- CPU: 1 core
- RAM: 2GB
- Disk: 10GB (for process state)

**Recommended:**
- CPU: 2-4 cores
- RAM: 4-8GB
- Disk: 50GB+ (depends on process count)
- Network: Stable connection with low latency to Arweave gateways

## Monitoring

### Health Checks

The template includes automated health monitoring:

- **Endpoint**: `http://localhost:10000/~meta@1.0/info`
- **Interval**: Every 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3 before marking unhealthy
- **Start Period**: 60 seconds (initial grace period)

### Logs

View HyperBEAM logs via Dokploy:

```bash
# Via Dokploy UI
Dashboard → Services → hyperbeam → Logs

# Via Docker CLI
docker logs -f $(docker ps -qf "name=hyperbeam")
```

**Common log patterns:**
- `[info] Starting HyperBEAM...` - Node startup
- `[info] Wallet loaded` - Arweave wallet successfully loaded
- `[info] Device loaded: X` - Computational devices initialized
- `[error] Wallet not found` - Missing wallet.json (see Step 2)

## Troubleshooting

### Service Won't Start

**Symptom**: Container exits immediately or repeatedly restarts

**Common Causes:**
1. **Missing Wallet**
   ```bash
   # Check if wallet exists
   docker exec $(docker ps -qf "name=hyperbeam") ls -la /opt/config/wallet.json
   ```
   Fix: Upload wallet.json (see Step 2)

2. **Invalid Wallet Format**
   - Ensure wallet is valid JWK JSON format
   - Verify file is not corrupted

3. **Port Conflict**
   ```bash
   # Check if port 10000 is in use
   netstat -tlnp | grep 10000
   ```

### Health Check Failing

**Symptom**: Service marked as unhealthy in Dokploy

**Checks:**
1. Verify service is listening on port 10000:
   ```bash
   docker exec $(docker ps -qf "name=hyperbeam") netstat -tlnp | grep 10000
   ```

2. Test health endpoint directly:
   ```bash
   docker exec $(docker ps -qf "name=hyperbeam") wget -qO- http://localhost:10000/~meta@1.0/info
   ```

3. Check Erlang VM status:
   ```bash
   docker exec $(docker ps -qf "name=hyperbeam") ps aux | grep beam
   ```

### Cannot Access API Externally

**Symptom**: API works internally but not via domain

**Checks:**
1. **DNS Resolution**:
   ```bash
   dig your-domain.com
   ```

2. **Traefik Routing**:
   ```bash
   # Check Traefik logs
   docker logs traefik
   ```

3. **SSL Certificate**:
   - Check Dokploy → Domains → SSL Status
   - Verify Let's Encrypt certificate issued

4. **Firewall**:
   ```bash
   # Ensure port 443 is open
   sudo ufw status | grep 443
   ```

### Wallet Balance Errors

**Symptom**: Transactions failing or not submitted

**Checks:**
1. **Check Wallet Balance**:
   ```bash
   # Use Arweave explorer
   https://viewblock.io/arweave/address/YOUR_WALLET_ADDRESS
   ```

2. **Fund Wallet**:
   - Minimum recommended: 0.1 AR for testing
   - Production: 1+ AR for sustained operation

## Maintenance

### Updating HyperBEAM

To update to a new version:

1. Check [HyperBEAM releases](https://github.com/ar-io/HyperBEAM/pkgs/container/hyperbeam)
2. Update `docker-compose.yml` with new image tag
3. Redeploy via Dokploy
4. Verify health checks pass

### Backup

**Critical data to backup:**
- **Wallet**: `/opt/config/wallet.json` (store securely offline)
- **Config**: `/opt/config/config.flat` (if customized)
- **Process State**: `/opt/data` (optional, can be large)

```bash
# Backup wallet (IMPORTANT!)
docker cp $(docker ps -qf "name=hyperbeam"):/opt/config/wallet.json ./wallet-backup.json

# Backup entire config volume
docker run --rm -v hyperbeam_hyperbeam-config:/data -v $(pwd):/backup alpine tar czf /backup/hyperbeam-config.tar.gz /data
```

## Performance Tuning

### Erlang VM Options

For high-load scenarios, consider tuning Erlang VM parameters by modifying the service command:

```yaml
# In docker-compose.yml (advanced)
command: ["erl", "+P", "1000000", "+Q", "65536", "-s", "hyperbeam"]
```

**Parameters:**
- `+P`: Maximum processes (default: 1M)
- `+Q`: Maximum ports (default: 64K)

### Process Management

Monitor active AO processes:

```bash
# Check process count via API
curl https://your-domain.com/~meta@1.0/stats

# Monitor memory usage
docker stats $(docker ps -qf "name=hyperbeam")
```

## Security Considerations

1. **Wallet Security**
   - Never expose wallet in logs or environment variables
   - Use dedicated wallet for compute node
   - Regularly monitor wallet balance for anomalies

2. **Network Security**
   - HyperBEAM API is public (required for AO network)
   - Use HTTPS (enforced by template)
   - Consider rate limiting for production deployments

3. **Access Control**
   - HyperBEAM does not include built-in authentication
   - For private deployments, add authentication via Traefik middleware

## Resources

### Official Documentation
- [HyperBEAM GitHub](https://github.com/ar-io/HyperBEAM)
- [AO Protocol Docs](https://ao.arweave.dev/)
- [Arweave Documentation](https://docs.arweave.org/)
- [AR.IO Network](https://ar.io/)

### Community
- [AO Discord](https://discord.gg/arweave)
- [Arweave Discord](https://discord.gg/arweave)
- [Permaweb Cookbook](https://cookbook.arweave.dev/)

### Container Registry
- [HyperBEAM Container Images](https://github.com/ar-io/HyperBEAM/pkgs/container/hyperbeam)

### Development
- [HyperBEAM Source Code](https://github.com/ar-io/HyperBEAM)
- [AO SDK](https://github.com/permaweb/ao)

## Contributing

Found an issue or have a suggestion? Please report it on the [Dokploy Templates GitHub](https://github.com/your-org/dokploy-templates/issues).

## License

This template configuration is MIT licensed. HyperBEAM itself is licensed under the [Business Source License](https://github.com/ar-io/HyperBEAM/blob/main/LICENSE).

---

**Note**: HyperBEAM is part of the AO protocol ecosystem. For production deployments, ensure you understand the [AO tokenomics](https://ao.arweave.dev/#/tokenomics) and network participation requirements.
