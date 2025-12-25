# ANyONe Protocol Relay for Dokploy

Deploy a privacy-focused ANyONe Protocol relay node with hidden service capabilities for exposing Dokploy-hosted applications over the ANyONe network.

## Architecture

```
                                    Internet
                                        |
                                        v
                    +-------------------+-------------------+
                    |                 Firewall              |
                    |     (Forward ports 9001, 9030)        |
                    +-------------------+-------------------+
                                        |
                                        v
+-----------------------------------------------------------------------+
|                           Dokploy Host                                 |
|                                                                        |
|  +------------------------+     +----------------------------------+   |
|  |   ANyONe Relay         |     |    Other Dokploy Services        |   |
|  |   (anon-relay)         |     |                                  |   |
|  |                        |     |  +------------+  +------------+  |   |
|  |  ORPort:9001  <--------+-----+->|  webapp    |  |  api-svc   |  |   |
|  |  DirPort:9030          |     |  |  :8080     |  |  :3000     |  |   |
|  |  ControlPort:9051      |     |  +------------+  +------------+  |   |
|  |                        |     |                                  |   |
|  |  Hidden Services:      |     +----------------------------------+   |
|  |  - webapp.onion:80 ----+---> webapp:8080                           |
|  |  - api.onion:443 ------+---> api-svc:3000                          |
|  +------------------------+                                            |
|                                                                        |
|                    [dokploy-network bridge]                            |
+-----------------------------------------------------------------------+
                                        |
                                        v
                              ANyONe Network
                          (Distributed Relay Network)
```

## Quick Start

### 1. Deploy via Dokploy UI

1. Navigate to **Templates** in Dokploy
2. Search for "ANyONe Protocol Relay"
3. Click **Deploy**
4. Configure the required variables:
   - `relay_nickname`: Your relay's public name (letters/numbers only)
   - `relay_contact`: Contact email (obfuscated recommended)
   - `wallet_address`: (Optional) Ethereum address for rewards

### 2. Configure Firewall

The relay requires external access on these ports:

| Port | Protocol | Purpose |
|------|----------|---------|
| 9001 | TCP | ORPort - Main relay traffic |
| 9030 | TCP | DirPort - Directory mirror |

```bash
# UFW example
sudo ufw allow 9001/tcp comment "ANyONe ORPort"
sudo ufw allow 9030/tcp comment "ANyONe DirPort"

# iptables example
iptables -A INPUT -p tcp --dport 9001 -j ACCEPT
iptables -A INPUT -p tcp --dport 9030 -j ACCEPT
```

### 3. Verify Relay Status

```bash
# Check if relay is running
docker exec -it <container_id> anon --verify-config

# View relay status with nyx (if installed)
docker exec -it <container_id> nyx

# Check circuit establishment
docker exec -it <container_id> sh -c 'echo "GETINFO status/circuit-established" | nc localhost 9051'
```

## Hidden Services

### Adding a Hidden Service

To expose a Dokploy-hosted application as a hidden service:

#### Option 1: Using the Configuration Script

```bash
# From the scripts/anon directory
./configure_hidden_service.sh \
  --service webapp \
  --host webapp-container \
  --internal-port 8080 \
  --external-port 80
```

#### Option 2: Manual Configuration

1. Access the relay container:
   ```bash
   docker exec -it <container_id> sh
   ```

2. Edit the anonrc configuration:
   ```bash
   vi /etc/anon/anonrc
   ```

3. Add hidden service configuration:
   ```
   HiddenServiceDir /var/lib/anon/hidden_service_webapp
   HiddenServicePort 80 webapp-container:8080
   ```

4. Restart the container:
   ```bash
   docker restart <container_id>
   ```

5. Retrieve the .onion address:
   ```bash
   docker exec -it <container_id> cat /var/lib/anon/hidden_service_webapp/hostname
   ```

### Hidden Service Best Practices

- **Key Backup**: Always backup `/var/lib/anon/hidden_service_*/` directories
- **Naming Convention**: Use descriptive directory names (`hidden_service_<appname>`)
- **Network Access**: Ensure target services are on `dokploy-network`
- **Security**: Hidden service keys are sensitive - treat as secrets

## Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANON_NICKNAME` | AnonRelay | Relay name (visible on network) |
| `ANON_CONTACT` | anonymous@example.com | Operator contact email |
| `ANON_WALLET` | (empty) | Ethereum wallet for rewards |
| `ANON_ORPORT` | 9001 | OR port for relay traffic |
| `ANON_DIRPORT` | 9030 | Directory port |
| `ANON_CONTROLPORT` | 9051 | Control port (local only) |
| `ACCEPT_TOS` | 1 | Accept Terms of Service (required) |

### anonrc Configuration Options

The template generates an `anonrc` file with sensible defaults. Key options:

```
# Identity
Nickname YourRelayName
ContactInfo your@email.com

# Network (must match environment variables)
ORPort 9001
DirPort 9030
ControlPort 9051

# Security (non-exit relay by default)
ExitPolicy reject *:*
ExitRelay 0

# Hidden Services
HiddenServiceDir /var/lib/anon/hidden_service_name
HiddenServicePort <external_port> <internal_host:port>

# Performance
RelayBandwidthRate 1024     # KB/s
RelayBandwidthBurst 2048    # KB/s
MaxMemInQueues 256 MB
```

## Rewards Registration

To earn ANyONe tokens for running a relay:

1. Create an Ethereum wallet (MetaMask, etc.)
2. Set the `ANON_WALLET` environment variable to your address
3. Register at [ANyONe Rewards Portal](https://docs.anyone.io/rewards/register)
4. Wait for relay to appear in network consensus

## Monitoring

### Using the Monitoring Script

```bash
# From scripts/anon directory
python3 monitor_relay.py --interval 300

# With webhook alerts
python3 monitor_relay.py --webhook-url https://discord.com/api/webhooks/...
```

### API Endpoints

Query relay status via the ANyONe REST API:

| Endpoint | Description |
|----------|-------------|
| `GET /total-relays-latest` | Active relay counts |
| `GET /total-observed-bandwidth-latest` | Network bandwidth |
| `GET /relays/` | Individual relay lookup |

Base URL: `https://api.ec.anyone.tech`

### Logs

```bash
# View relay logs
docker logs -f <container_id>

# Filter for warnings/errors
docker logs <container_id> 2>&1 | grep -E "(warn|err)"
```

## Troubleshooting

### Relay Not Appearing on Network

1. **Check firewall**: Ensure ports 9001 and 9030 are accessible
2. **Verify configuration**: `docker exec -it <container_id> anon --verify-config`
3. **Check logs**: Look for bootstrap messages
4. **Wait**: Initial network registration can take 1-3 hours

### Control Port Not Responding

```bash
# Verify control port is listening
docker exec -it <container_id> netstat -tlnp | grep 9051

# Test control port authentication
docker exec -it <container_id> sh -c 'echo "AUTHENTICATE" | nc localhost 9051'
```

### Hidden Service Address Not Generated

1. Check directory permissions: `/var/lib/anon/hidden_service_*/` should be mode 700
2. Verify target service is reachable on dokploy-network
3. Check logs for hidden service initialization errors

### Memory Issues

If the relay runs out of memory:

```yaml
# Increase limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
```

## Backup & Recovery

### Critical Data to Backup

| Path | Purpose | Sensitivity |
|------|---------|-------------|
| `/var/lib/anon/keys/` | Relay identity keys | High |
| `/var/lib/anon/hidden_service_*/` | Hidden service keys | Critical |
| `/etc/anon/anonrc` | Configuration | Low |

### Backup Script

```bash
#!/bin/bash
CONTAINER_ID=$(docker ps -qf "name=anon-relay")
BACKUP_DIR="./anon-backup-$(date +%Y%m%d)"

mkdir -p "$BACKUP_DIR"

docker cp "$CONTAINER_ID:/var/lib/anon/keys" "$BACKUP_DIR/"
docker cp "$CONTAINER_ID:/etc/anon/anonrc" "$BACKUP_DIR/"

# Backup all hidden services
for hs in $(docker exec "$CONTAINER_ID" ls /var/lib/anon/ | grep hidden_service); do
  docker cp "$CONTAINER_ID:/var/lib/anon/$hs" "$BACKUP_DIR/"
done

tar -czf "anon-backup-$(date +%Y%m%d).tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"
```

### Recovery

```bash
# Extract backup
tar -xzf anon-backup-YYYYMMDD.tar.gz

# Copy to running container
docker cp ./anon-backup-YYYYMMDD/keys <container_id>:/var/lib/anon/
docker cp ./anon-backup-YYYYMMDD/hidden_service_* <container_id>:/var/lib/anon/

# Restart relay
docker restart <container_id>
```

## Security Considerations

- **Non-Exit by Default**: This template configures a non-exit relay, meaning traffic cannot exit to the regular internet through your relay
- **Control Port**: Only accessible from within the container (localhost)
- **Hidden Service Keys**: Treat as highly sensitive - loss means losing your .onion address
- **Contact Info**: Consider using an obfuscated email (e.g., `admin AT example DOT com`)

## Resources

- [ANyONe Protocol Documentation](https://docs.anyone.io/)
- [Relay Setup Guide](https://docs.anyone.io/relay/start)
- [Hidden Services Tutorial](https://docs.anyone.io/sdk/native-sdk/tutorials/services1)
- [REST API Reference](https://docs.anyone.io/sdk/api/rest)
- [GitHub Repository](https://github.com/anyone-protocol/ator-protocol)
- [Container Registry](https://github.com/anyone-protocol/ator-protocol/pkgs/container/ator-protocol)

## License

This template is provided under the same license as the home-lab repository. ANyONe Protocol is licensed under its own terms - see their repository for details.
