# Nostr-RS-Relay - Rust-based Nostr Relay

A high-performance Nostr protocol relay implementation in Rust with embedded SQLite database and WebSocket support.

## Overview

**nostr-rs-relay** is a Nostr relay server written in Rust that implements the complete Nostr protocol (NIPs 1-42+). It provides:

- **Embedded SQLite Database**: No separate database service required
- **High Performance**: Rust implementation with async I/O
- **WebSocket Protocol**: Real-time event streaming over WSS
- **Rate Limiting**: Built-in DoS protection
- **NIP-05 Verification**: Optional identity verification
- **Pay-to-Relay**: Optional monetization support
- **Authorization**: Optional pubkey whitelisting

This template provides a production-ready Dokploy deployment with automatic HTTPS via Traefik and persistent SQLite storage.

## Architecture

```
┌─────────────────────────────┐
│     nostr-relay             │
│  (Rust WebSocket Server)    │
│  + SQLite (embedded)        │
│                             │
│  Port: 8080 (wss://)        │
│  Database: SQLite file      │
└─────────────────────────────┘
              │
              ▼
      dokploy-network
              │
              ▼
         Traefik HTTPS
              │
              ▼
    wss://relay.example.com/
```

### Service Overview

| Service | Purpose | Storage | Networks |
|---------|---------|---------|----------|
| nostr-relay | Nostr protocol relay server | relay-db (SQLite) | nostr-relay-net, dokploy-network |

### Ports

| Port | Protocol | Purpose | Exposed |
|------|----------|---------|---------|
| 8080 | WebSocket | Nostr relay protocol | Via Traefik (WSS) |

## Prerequisites

- Dokploy instance (https://dokploy.com/)
- Domain name pointing to your Dokploy server
- (Optional) Nostr public key for admin operations

## Quick Start

### 1. Deploy Template

1. Log in to your Dokploy instance
2. Navigate to **Templates**
3. Import this template or create new Compose project
4. Configure required variables (see Configuration section)
5. Deploy

### 2. Access Your Relay

Once deployed, your relay will be available at:
```
wss://your-relay-domain.com/
```

Test the relay with any Nostr client (Damus, Amethyst, Snort, etc.)

### 3. Get Relay Information

```bash
# Using websocat
echo '["REQ","sub1",{"kinds":[0],"limit":1}]' | websocat wss://your-relay-domain.com/

# Using curl (relay metadata)
curl https://your-relay-domain.com/
```

## Configuration

### Required Variables

Configure these in Dokploy before deploying:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `relay_domain` | WebSocket domain for your relay | `relay.example.com` | ✅ Yes |
| `relay_name` | Display name for your relay | `My Nostr Relay` | ⚠️ Recommended |
| `relay_description` | Relay description | `Open relay for the community` | ⚠️ Recommended |
| `relay_pubkey` | Your Nostr pubkey (32-byte hex) | `abc123...` (not npub) | ❌ Optional |
| `relay_contact` | Contact email or Nostr address | `mailto:admin@example.com` | ❌ Optional |

### Optional Configuration

These have sensible defaults but can be customized:

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `relay_port` | Internal WebSocket port | `8080` | Don't change unless needed |
| `messages_per_sec` | Rate limit per client | `100` | Adjust for DoS protection |
| `max_event_bytes` | Maximum event size | `131072` (128KB) | Prevents spam |
| `max_ws_message_bytes` | Max WebSocket message | `131072` | Should match event size |

### Advanced Configuration

The template includes commented sections for advanced features:

#### 1. **Authorization (Pubkey Whitelist)**

Uncomment in `config.toml` to restrict who can publish:

```toml
[authorization]
pubkey_whitelist = [
  "abc123...",  # Your pubkey
  "def456...",  # Trusted user 1
]
nip42_auth = false
nip42_dms = false
```

#### 2. **Pay-to-Relay (Monetization)**

Uncomment to enable paid access via Lightning Network:

```toml
[pay_to_relay]
enabled = true
processor = "LNBits"              # or "ClnRest"
admission_cost = 1000             # Sats for relay access
cost_per_event = 0                # Sats per post (0 = free after admission)
node_url = "https://lnbits.example.com"
api_secret = "your-lnbits-api-key"
sign_ups = true
```

**LNBits Setup:**
1. Install LNBits instance
2. Create API key in LNBits
3. Add `node_url` and `api_secret` to config
4. Set `admission_cost` in satoshis

#### 3. **NIP-05 Verification**

Controls identity verification:

```toml
[verified_users]
mode = "passive"                  # "enabled" | "passive" | "disabled"
verify_expiration = "7 days"
verify_update_frequency = "24 hours"
max_consecutive_failures = 20
```

- `enabled`: Only verified users can post
- `passive`: Verification tracked but not enforced
- `disabled`: No verification

## Storage

### SQLite Database

The relay uses an embedded SQLite database stored in a persistent volume:

- **Volume**: `relay-db`
- **Mount Path**: `/usr/src/app/db`
- **Database File**: `/usr/src/app/db/nostr.db`

### Database Backups

**Manual Backup:**
```bash
# Access container
docker exec -it <container-id> sh

# Copy database out
docker cp <container-id>:/usr/src/app/db/nostr.db ./nostr-backup.db
```

**Automated Backups:**

Use Dokploy's backup features or create a cron job:

```bash
#!/bin/bash
# backup-nostr-relay.sh
CONTAINER=$(docker ps --filter "name=nostr-relay" --format "{{.ID}}")
DATE=$(date +%Y%m%d_%H%M%S)
docker cp $CONTAINER:/usr/src/app/db/nostr.db "/backups/nostr-${DATE}.db"
find /backups -name "nostr-*.db" -mtime +7 -delete  # Keep 7 days
```

## Nostr Client Configuration

### Connect from Clients

Add your relay to Nostr clients:

**Damus (iOS):**
1. Settings → Relays → Add Relay
2. Enter: `wss://your-relay-domain.com/`

**Amethyst (Android):**
1. Settings → Relays → Add Relay
2. Enter: `wss://your-relay-domain.com/`

**Snort (Web):**
1. Settings → Network → Add Relay
2. Enter: `wss://your-relay-domain.com/`

**Nostrudel / Coracle:**
1. Relays → Add
2. Enter: `wss://your-relay-domain.com/`

### Verify Connection

Use `nak` CLI tool:

```bash
# Install nak
go install github.com/fiatjaf/nak@latest

# Test relay
nak req -k 1 --limit 10 wss://your-relay-domain.com/

# Publish event
nak event -c "Hello from my relay!" wss://your-relay-domain.com/
```

## Rate Limiting & Performance

### Default Limits

| Limit | Default | Purpose |
|-------|---------|---------|
| Messages/sec | 100 | Event creation rate per client |
| Subscriptions/min | 60 | Subscription creation rate |
| DB connections | 4 | Per-client database connections |
| Max event size | 128 KB | Prevents oversized events |
| Future event tolerance | 30 min | Rejects far-future timestamps |

### Adjust for Load

For high-traffic relays, edit `template.toml`:

```toml
[variables]
messages_per_sec = "200"          # Increase for power users
max_event_bytes = "262144"        # 256KB for larger events
```

### Database Performance

SQLite connection pool settings in config.toml:

```toml
[database]
min_conn = 4                      # Minimum reader connections
max_conn = 8                      # Maximum reader connections
```

**Recommended scaling:**
- Small relay (< 100 users): `min_conn = 4, max_conn = 8`
- Medium relay (100-1000 users): `min_conn = 8, max_conn = 16`
- Large relay (1000+ users): Consider PostgreSQL migration

## Monitoring

### Health Check

The relay includes HTTP health endpoint on port 8080:

```bash
curl http://localhost:8080/
# Returns relay metadata JSON
```

Dokploy health check:
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080"]
  interval: 30s
```

### Logs

**View relay logs:**
```bash
# Via Dokploy UI
Compose → nostr-relay → Logs

# Via Docker
docker logs -f <container-id>

# Specific log level
docker logs <container-id> 2>&1 | grep WARN
```

**Log files** (inside container):
- Path: `/usr/src/app/logs/`
- Format: `nostr-relay-YYYY-MM-DD.log`
- Rotation: Daily

### Metrics

Monitor relay activity:

**Event counts:**
```bash
# Access database
docker exec -it <container-id> sh
cd /usr/src/app/db

# Query events
sqlite3 nostr.db "SELECT COUNT(*) FROM event;"
sqlite3 nostr.db "SELECT kind, COUNT(*) FROM event GROUP BY kind;"
```

**Active subscriptions:**
Check logs for `[SUB]` entries

## Troubleshooting

### 1. Relay Not Accessible

**Symptoms:**
- Clients can't connect to `wss://relay.example.com/`
- 502 Bad Gateway errors

**Checks:**
```bash
# 1. Verify container is running
docker ps | grep nostr-relay

# 2. Check health status
docker inspect <container-id> | grep Health -A 10

# 3. Test internal port
docker exec <container-id> wget -qO- http://localhost:8080

# 4. Verify Traefik routing
docker logs traefik 2>&1 | grep nostr-relay

# 5. Check DNS
dig your-relay-domain.com
```

**Solutions:**
- Ensure `RELAY_DOMAIN` is set correctly
- Verify DNS points to Dokploy server
- Check Traefik is running: `docker ps | grep traefik`
- Review Traefik logs for routing errors

### 2. Database Locked Errors

**Symptoms:**
```
database is locked
SQLITE_BUSY
```

**Causes:**
- Too many concurrent connections
- Long-running queries

**Solutions:**
```toml
# Increase connection pool in config.toml
[database]
max_conn = 16  # Increase from 8
db_conns_per_client = 2  # Reduce from 4
```

### 3. High CPU Usage

**Symptoms:**
- Container using 100% CPU
- Slow event processing

**Checks:**
```bash
# Monitor container resources
docker stats <container-id>

# Check for spam
docker exec <container-id> tail -100 /usr/src/app/logs/nostr-relay-*.log | grep WARN
```

**Solutions:**
```toml
# Tighten rate limits in config.toml
[limits]
messages_per_sec = 50  # Reduce from 100
subscriptions_per_min = 30  # Reduce from 60
limit_scrapers = true  # Reject imprecise queries
```

### 4. Out of Disk Space

**Symptoms:**
```
no space left on device
database disk image is malformed
```

**Checks:**
```bash
# Check volume size
docker volume inspect nostr-rs-relay_relay-db

# Database size
docker exec <container-id> du -h /usr/src/app/db/nostr.db
```

**Solutions:**

**Option 1: Prune old events**
```bash
# Access database
docker exec -it <container-id> sh
sqlite3 /usr/src/app/db/nostr.db

-- Delete events older than 30 days
DELETE FROM event WHERE created_at < unixepoch() - (30 * 24 * 60 * 60);
VACUUM;
```

**Option 2: Migrate to larger volume**
```bash
# 1. Stop container
docker stop <container-id>

# 2. Backup database
docker cp <container-id>:/usr/src/app/db/nostr.db ./backup.db

# 3. Create new volume
docker volume create nostr-relay-db-large

# 4. Restore to new volume
# ... (update compose with new volume)
```

### 5. WebSocket Connection Drops

**Symptoms:**
- Clients disconnect frequently
- `connection reset by peer` errors

**Checks:**
```bash
# Check ping interval in config
grep ping_interval /path/to/config.toml
```

**Solutions:**
```toml
# Increase ping interval in config.toml
[network]
ping_interval = 600  # 10 minutes (default 300)
```

### 6. Authorization Not Working

**Symptoms:**
- Whitelist pubkeys can't publish
- Events rejected despite being on whitelist

**Checks:**
```bash
# Verify pubkey format (32-byte hex, NOT npub)
# Correct: abc123def456...  (64 characters)
# Wrong:   npub1abc123...    (Bech32 format)
```

**Solutions:**

Convert npub to hex:
```bash
# Using nak
nak decode npub1abc123...

# Using nostr.band
# https://nostr.band/npub1abc123...
```

### 7. Pay-to-Relay Not Working

**Symptoms:**
- Lightning invoices not generated
- Payment verification fails

**Checks:**
```bash
# 1. Verify LNBits is accessible
curl https://your-lnbits-instance.com/api/v1/wallet

# 2. Check API secret
grep api_secret /path/to/config.toml

# 3. Review relay logs
docker logs <container-id> 2>&1 | grep pay_to_relay
```

**Solutions:**
- Ensure `api_secret` is correct LNBits admin key
- Verify `node_url` is accessible from container
- Check LNBits logs for errors

## Security Considerations

### 1. Open vs Private Relay

**Open Relay (Default):**
- Anyone can publish events
- Good for public community relays
- Requires rate limiting

**Private Relay (Recommended for personal use):**
```toml
[authorization]
pubkey_whitelist = ["your-pubkey-here"]
```

### 2. Rate Limiting

Default settings prevent basic DoS attacks:
- 100 messages/sec per client
- 60 subscriptions/min per client
- 128KB max event size

For high-security environments, reduce limits.

### 3. HTTPS/WSS Encryption

- ✅ Automatic via Traefik LetsEncrypt
- ✅ Forces WSS (WebSocket Secure)
- ✅ Modern TLS ciphers

### 4. Spam Prevention

Enable scraper protection:
```toml
[limits]
limit_scrapers = true  # Reject queries without time bounds
```

### 5. Database Security

- SQLite file stored in Docker volume (not bind mount)
- No external database credentials needed
- Automatic backups recommended

## Performance Tuning

### Small Relay (< 100 users)

Default settings are optimal.

### Medium Relay (100-1000 users)

```toml
[database]
min_conn = 8
max_conn = 16

[limits]
messages_per_sec = 200
max_blocking_threads = 32
```

### Large Relay (1000+ users)

Consider migrating to PostgreSQL:

```toml
[database]
engine = "postgres"
connection = "postgresql://user:pass@postgres:5432/nostr"
min_conn = 16
max_conn = 32
```

## Upgrading

### Update Relay Version

1. Check for new releases: https://github.com/scsibug/nostr-rs-relay/releases
2. Update `docker-compose.yml`:
   ```yaml
   image: scsibug/nostr-rs-relay:0.9.0  # New version
   ```
3. Redeploy in Dokploy
4. Monitor logs for migration messages

### Database Migrations

nostr-rs-relay handles schema migrations automatically on startup.

**Manual migration check:**
```bash
docker logs <container-id> 2>&1 | grep migration
```

## Related Resources

### Official Documentation
- [nostr-rs-relay GitHub](https://github.com/scsibug/nostr-rs-relay)
- [Nostr Protocol (NIPs)](https://github.com/nostr-protocol/nips)
- [Nostr.band Relay Statistics](https://nostr.band/relays)

### Nostr Ecosystem
- [Awesome Nostr](https://github.com/aljazceru/awesome-nostr)
- [Nostr Clients](https://github.com/aljazceru/awesome-nostr#clients)
- [NIP-05 Verification Services](https://github.com/aljazceru/awesome-nostr#nip-05-identity-services)

### Tools
- [nak CLI](https://github.com/fiatjaf/nak) - Command-line Nostr client
- [nostream](https://github.com/Cameri/nostream) - Alternative TypeScript relay
- [Relay Tester](https://relay.tools/) - Test relay connectivity

## Support & Community

- **Issues**: [GitHub Issues](https://github.com/scsibug/nostr-rs-relay/issues)
- **Nostr**: Ask on Nostr (tag #asknostr)
- **Relay Operators**: [Relay Operators Telegram](https://t.me/nostr_relay_operators)

## License

- **nostr-rs-relay**: MIT License
- **This Template**: MIT License

---

**Template Version**: 1.0.0  
**Last Updated**: 2025-12-30  
**Maintainer**: Dokploy Community
