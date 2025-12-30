# Nostpy Relay

**Python-based Nostr relay with PostgreSQL backend and Redis pub/sub**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/UTXOnly/nostpy-relay/blob/main/LICENSE)
[![Docker](https://img.shields.io/badge/docker-compose-blue.svg)](https://docs.docker.com/compose/)
[![Nostr](https://img.shields.io/badge/nostr-relay-purple.svg)](https://github.com/nostr-protocol/nostr)
[![Python](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)

---

## 📖 Overview

Nostpy Relay is a containerized, fully Python-based Nostr relay designed for portability and ease of deployment. It leverages asyncio and websockets to efficiently serve Nostr clients across various environments with PostgreSQL for data persistence and Redis for pub/sub messaging.

**Key Features:**
- 🚀 **High Performance**: Async Python with WebSocket connections
- 💾 **PostgreSQL Backend**: Robust event storage with ACID compliance
- 📡 **Redis Pub/Sub**: Real-time event broadcasting and caching
- 🔐 **Web of Trust (WoT)**: Filter events based on social graph connections
- 📊 **OpenTelemetry Ready**: Built-in monitoring and distributed tracing
- 🌐 **Tor Support**: Optional hidden service integration (manual setup)
- 🐳 **Docker Native**: Complete containerized deployment

**Use Cases:**
- Run a personal Nostr relay for your notes and social graph
- Host a community relay with Web of Trust filtering
- Deploy a high-performance relay for Nostr applications
- Experiment with Nostr protocol implementations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Nostr Clients                            │
│                  (WebSocket Connections)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ WSS/HTTPS
                         │
                         ▼
        ┌────────────────────────────────────┐
        │    WebSocket Handler               │
        │  (Client Connection Manager)       │
        │                                    │
        │  - Accept WebSocket connections    │
        │  - Handle Nostr subscriptions      │
        │  - Broadcast events to clients     │
        │  - Port: 8008 (via Traefik)        │
        └────────────┬───────────────────────┘
                     │
                     │ Internal HTTP (8009)
                     │
                     ▼
        ┌────────────────────────────────────┐
        │      Event Handler                 │
        │   (Business Logic Layer)           │
        │                                    │
        │  - Process incoming events         │
        │  - Validate signatures (NIP-01)    │
        │  - Apply WoT filtering             │
        │  - Query/store events              │
        └──────┬──────────────────┬──────────┘
               │                   │
               │ PostgreSQL        │ Redis
               │ (persistent)      │ (pub/sub)
               │                   │
        ┌──────▼──────┐     ┌─────▼──────┐
        │  PostgreSQL │     │   Redis    │
        │             │     │            │
        │  - Events   │     │  - Pub/Sub │
        │  - Metadata │     │  - Cache   │
        │  - Contacts │     │            │
        └─────────────┘     └────────────┘

Networks:
  nostpy-net (internal):    All services communicate
  dokploy-network (external): WebSocket Handler → Traefik
```

**Network Isolation:**
- `websocket-handler`: Both networks (external WebSocket + internal)
- `event-handler`: Internal network only (processes events)
- `postgres`: Internal network only (secure backend)
- `redis`: Internal network only (pub/sub messaging)

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NOSTPY_DOMAIN` | ✅ Yes | - | Your relay domain (e.g., `relay.example.com`) |
| `POSTGRES_PASSWORD` | ✅ Yes | Auto-generated | PostgreSQL database password |
| `POSTGRES_USER` | No | `nostr` | PostgreSQL username |
| `POSTGRES_DB` | No | `nostr` | PostgreSQL database name |
| `ADMIN_PUBKEY` | No | Empty | Your Nostr public key in HEX format (admin privileges) |
| `CONTACT` | No | Empty | Contact email (shown in NIP-11 relay info) |
| `RELAY_ICON` | No | Empty | URL to relay icon image |
| `WOT_ENABLED` | No | `True` | Enable Web of Trust filtering |
| `VERSION` | No | `v1.2.0` | Docker image version tag |

**Auto-Generated Secrets (template.toml):**
- `postgres_password`: Random secure password

### Nostr Protocol Configuration

**Supported NIPs (Nostr Implementation Possibilities):**
- NIP-01: Basic protocol flow description
- NIP-11: Relay information document
- NIP-42: Authentication of clients to relays (via WoT)

**Web of Trust (WoT) Filtering:**
When `WOT_ENABLED=True`, the relay filters events based on social graph connections. Only events from:
1. Your follows (1st degree)
2. Follows of your follows (2nd degree)
...are accepted and stored.

### Port Configuration

| Port | Protocol | Purpose | Exposure |
|------|----------|---------|----------|
| 8008 | WebSocket | Client connections | External (via Traefik) |
| 8009 | HTTP | Event handler internal API | Internal only |
| 5432 | TCP | PostgreSQL | Internal only |
| 6379 | TCP | Redis | Internal only |

---

## 🚀 Quick Start

### Prerequisites

**Required:**
1. **Dokploy Instance**: Running Dokploy installation
2. **Domain Name**: A domain for the relay (e.g., `relay.example.com`)
3. **Nostr Public Key**: Your Nostr pubkey in HEX format (64 characters)
   - Get from any Nostr client (Settings → Keys)
   - Or generate: `openssl rand -hex 32`
4. **Storage**: Minimum 10 GB free space (grows with event volume)
5. **RAM**: 2 GB minimum (4 GB recommended for active relays)

**Optional:**
- Email address for relay contact info
- Custom relay icon URL

### Deployment Steps

#### Step 1: Get Your Nostr Public Key

**From a Nostr client:**
1. Open any Nostr client (Damus, Amethyst, Primal, etc.)
2. Go to Settings → Keys
3. Copy your public key in **HEX format** (not npub...)
4. Example HEX pubkey: `3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d`

**Generate new key pair (for testing):**
```bash
# Generate private key (32 bytes hex)
openssl rand -hex 32

# Use a Nostr client to derive public key from private key
```

#### Step 2: Deploy in Dokploy

1. **Create New Service** in Dokploy
2. **Select Template**: Choose "Nostpy Relay" from templates
3. **Configure Variables**:
   - `NOSTPY_DOMAIN`: Your domain (e.g., `relay.example.com`)
   - `ADMIN_PUBKEY`: Your Nostr public key in HEX format
   - `CONTACT`: Your email (optional, shown in relay info)
   - `RELAY_ICON`: URL to icon (optional)
   - `POSTGRES_PASSWORD`: Auto-generated (leave default)
4. **Deploy**: Click "Deploy" and wait for services to start

#### Step 3: Configure DNS

Point your domain to your Dokploy server:

```bash
# A Record
relay.example.com.  IN  A  <your-server-ip>

# Or CNAME
relay.example.com.  IN  CNAME  your-server.example.com.
```

**Wait for DNS propagation** (usually 1-5 minutes).

#### Step 4: Verify Relay is Running

1. **Check WebSocket connection**:
   ```bash
   # Test WebSocket endpoint
   curl -i -N -H "Connection: Upgrade" \
        -H "Upgrade: websocket" \
        -H "Host: relay.example.com" \
        -H "Origin: https://relay.example.com" \
        https://relay.example.com
   ```

2. **Check NIP-11 relay info**:
   ```bash
   curl -H "Accept: application/nostr+json" https://relay.example.com

   # Expected response:
   # {
   #   "name": "Nostpy Relay",
   #   "description": "Python-based Nostr relay",
   #   "pubkey": "3bf0c63...",
   #   "contact": "admin@example.com",
   #   "supported_nips": [1, 11, 42],
   #   "software": "https://github.com/UTXOnly/nostpy-relay",
   #   "version": "1.2.0"
   # }
   ```

3. **Test from Nostr client**:
   - Open your Nostr client
   - Go to Relays settings
   - Add: `wss://relay.example.com`
   - Verify connection status shows "Connected"

---

## 🔌 Connecting Nostr Clients

### Adding Relay to Clients

**Damus (iOS):**
1. Settings → Relays
2. Tap "+" to add relay
3. Enter: `wss://relay.example.com`
4. Enable for Read & Write

**Amethyst (Android):**
1. Settings → Relays
2. Add Relay
3. URL: `wss://relay.example.com`
4. Select Read & Write permissions

**Primal (Web/Mobile):**
1. Settings → Network
2. Add Custom Relay
3. Enter: `wss://relay.example.com`

**Gossip (Desktop):**
1. Relays tab
2. Add Relay
3. URL: `wss://relay.example.com`
4. Configure usage flags

### Testing Event Posting

**Using websocat:**
```bash
# Install websocat
cargo install websocat
# or: brew install websocat

# Connect to relay
websocat wss://relay.example.com

# Send a test event (example)
["EVENT",{"id":"abc123...","pubkey":"3bf0c...","created_at":1704067200,"kind":1,"tags":[],"content":"Hello from my relay!","sig":"..."}]

# Subscribe to events
["REQ","test-sub",{"kinds":[1],"limit":10}]

# Expected response:
# ["EVENT","test-sub",{event-data}]
# ["EOSE","test-sub"]
```

---

## 🔧 Advanced Configuration

### Web of Trust (WoT) Setup

The relay uses WoT filtering to prevent spam and only accept events from your social graph.

**How it works:**
1. You set `ADMIN_PUBKEY` to your Nostr public key
2. Relay fetches your follow list (kind 3 events)
3. Only events from your follows (and their follows) are accepted
4. Other events are rejected

**Configure WoT depth:**
```yaml
# In docker-compose.yml, add to event-handler environment:
WOT_DEPTH: "2"  # 1=follows, 2=follows of follows, etc.
```

**Disable WoT (open relay):**
```yaml
# In template.toml or Dokploy environment:
WOT_ENABLED: "False"
```

**⚠️ Warning:** Disabling WoT makes your relay public and may attract spam.

### Database Tuning

**For high-volume relays (>10,000 events/day):**

```yaml
# In docker-compose.yml, postgres service
environment:
  # Increase shared buffers
  POSTGRES_SHARED_BUFFERS: "256MB"
  # Increase work memory
  POSTGRES_WORK_MEM: "16MB"
  # Increase max connections
  POSTGRES_MAX_CONNECTIONS: "200"

# Increase memory limit
deploy:
  resources:
    limits:
      memory: 2G
```

### Redis Caching Configuration

**Adjust cache TTL:**
```yaml
# In docker-compose.yml, redis service
command: >
  redis-server
  --appendonly yes
  --maxmemory 512mb
  --maxmemory-policy allkeys-lru
```

---

## 📊 Monitoring & Maintenance

### Health Checks

All services have automated health checks:

**WebSocket Handler:**
```bash
docker exec <container-name> python -c "import socket; s=socket.socket(); s.connect(('localhost',8008)); s.close()"
```

**Event Handler:**
```bash
docker exec <container-name> python -c "import socket; s=socket.socket(); s.connect(('localhost',8009)); s.close()"
```

**PostgreSQL:**
```bash
docker exec <container-name> pg_isready -U nostr -d nostr
```

**Redis:**
```bash
docker exec <container-name> redis-cli ping
```

### Resource Usage

**Expected resource consumption:**
- **CPU**: Low (5-10% idle, 30-50% under load)
- **RAM**:
  - WebSocket Handler: 256-512 MB
  - Event Handler: 512 MB - 1 GB
  - PostgreSQL: 512 MB - 1 GB (grows with data)
  - Redis: 128-256 MB
  - **Total**: 2-4 GB recommended
- **Storage**:
  - Initial: ~1 GB
  - Growth: ~100 MB/day for personal relay (varies widely)
  - Growth: ~1-5 GB/day for popular relay
- **Network**:
  - Idle: <1 MB/hour
  - Active: 10-100 MB/hour (depends on client connections)

### Database Maintenance

**Check database size:**
```bash
docker exec <postgres-container> psql -U nostr -d nostr -c "\l+"
docker exec <postgres-container> psql -U nostr -d nostr -c "\dt+"
```

**Vacuum database (monthly):**
```bash
docker exec <postgres-container> psql -U nostr -d nostr -c "VACUUM ANALYZE;"
```

**Backup database:**
```bash
# Create backup
docker exec <postgres-container> pg_dump -U nostr nostr > nostpy-backup-$(date +%Y%m%d).sql

# Restore from backup
cat nostpy-backup-20250129.sql | docker exec -i <postgres-container> psql -U nostr nostr
```

### Log Monitoring

**View logs:**
```bash
# WebSocket Handler logs
docker logs <websocket-handler-container> -f

# Event Handler logs
docker logs <event-handler-container> -f

# PostgreSQL logs
docker logs <postgres-container> -f

# Redis logs
docker logs <redis-container> -f
```

**Filter for errors:**
```bash
docker logs <container-name> 2>&1 | grep -i error
docker logs <container-name> 2>&1 | grep -i exception
```

### Relay Statistics

**Check event count:**
```bash
docker exec <postgres-container> psql -U nostr -d nostr -c "SELECT COUNT(*) FROM events;"
```

**Check events by kind:**
```bash
docker exec <postgres-container> psql -U nostr -d nostr -c "SELECT kind, COUNT(*) FROM events GROUP BY kind ORDER BY COUNT DESC;"
```

**Check recent events:**
```bash
docker exec <postgres-container> psql -U nostr -d nostr -c "SELECT id, kind, created_at FROM events ORDER BY created_at DESC LIMIT 10;"
```

---

## 🔍 Troubleshooting

### Issue 1: WebSocket Connection Refused

**Symptoms:**
- Nostr clients can't connect
- "Connection refused" or timeout errors

**Solutions:**
1. **Check service status**:
   ```bash
   docker ps | grep websocket-handler
   # Should show "healthy" status
   ```

2. **Verify DNS**:
   ```bash
   dig relay.example.com
   # Should point to your server IP
   ```

3. **Check Traefik routing**:
   ```bash
   docker logs traefik 2>&1 | grep nostpy
   # Look for routing errors
   ```

4. **Test WebSocket locally**:
   ```bash
   docker exec <websocket-handler-container> python -c "import socket; s=socket.socket(); s.connect(('localhost',8008)); print('OK')"
   ```

5. **Check SSL certificate**:
   ```bash
   curl -I https://relay.example.com
   # Should return 101 Switching Protocols
   ```

### Issue 2: Events Not Being Stored

**Symptoms:**
- Events posted but not appearing in queries
- WoT filtering rejecting all events

**Solutions:**
1. **Check WoT configuration**:
   ```bash
   docker exec <event-handler-container> env | grep WOT
   # Verify WOT_ENABLED and ADMIN_PUBKEY
   ```

2. **Verify admin pubkey format**:
   - Must be HEX format (64 characters)
   - NOT npub... format
   - Example: `3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d`

3. **Check event handler logs**:
   ```bash
   docker logs <event-handler-container> 2>&1 | grep -i "rejected\|wot"
   ```

4. **Temporarily disable WoT for testing**:
   - Set `WOT_ENABLED=False` in environment
   - Redeploy service
   - Test event posting

5. **Verify database connection**:
   ```bash
   docker exec <event-handler-container> env | grep PGPASSWORD
   # Check credentials match postgres service
   ```

### Issue 3: High Memory Usage

**Symptoms:**
- Services consuming excessive RAM
- Out of memory errors
- System becoming unresponsive

**Solutions:**
1. **Check current memory usage**:
   ```bash
   docker stats --no-stream | grep nostpy
   ```

2. **Reduce memory limits** (if needed):
   ```yaml
   # In docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 512M  # Reduce from 1G
   ```

3. **Clear Redis cache**:
   ```bash
   docker exec <redis-container> redis-cli FLUSHDB
   ```

4. **Vacuum PostgreSQL**:
   ```bash
   docker exec <postgres-container> psql -U nostr -d nostr -c "VACUUM FULL;"
   ```

5. **Reduce connection pool**:
   ```yaml
   # In event-handler environment
   POOL_SIZE: "10"  # Reduce from default
   ```

### Issue 4: Database Connection Errors

**Symptoms:**
- Event handler logs show "connection refused"
- PostgreSQL connection failures

**Solutions:**
1. **Check PostgreSQL health**:
   ```bash
   docker ps | grep postgres
   # Should show "healthy" status
   ```

2. **Verify credentials match**:
   ```bash
   docker exec <event-handler-container> env | grep PGPASSWORD
   docker exec <postgres-container> env | grep POSTGRES_PASSWORD
   # Should match
   ```

3. **Check network connectivity**:
   ```bash
   docker exec <event-handler-container> ping postgres
   # Should respond
   ```

4. **Review PostgreSQL logs**:
   ```bash
   docker logs <postgres-container> 2>&1 | grep -i error
   ```

5. **Restart services in order**:
   ```bash
   docker restart <postgres-container>
   # Wait 30 seconds for health check
   docker restart <redis-container>
   docker restart <event-handler-container>
   docker restart <websocket-handler-container>
   ```

### Issue 5: Slow Query Performance

**Symptoms:**
- Clients experience delays loading events
- Database queries taking seconds

**Solutions:**
1. **Check database size**:
   ```bash
   docker exec <postgres-container> psql -U nostr -d nostr -c "\dt+ events"
   # Large tables (>1GB) may need indexing
   ```

2. **Add database indexes** (if not present):
   ```sql
   docker exec <postgres-container> psql -U nostr -d nostr -c "
     CREATE INDEX IF NOT EXISTS idx_events_pubkey ON events(pubkey);
     CREATE INDEX IF NOT EXISTS idx_events_kind ON events(kind);
     CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
   "
   ```

3. **Analyze query performance**:
   ```bash
   docker exec <postgres-container> psql -U nostr -d nostr -c "EXPLAIN ANALYZE SELECT * FROM events WHERE kind=1 LIMIT 10;"
   ```

4. **Increase PostgreSQL resources**:
   ```yaml
   # In docker-compose.yml, postgres service
   deploy:
     resources:
       limits:
         memory: 2G  # Increase from 1G
   ```

### Issue 6: Redis Connection Issues

**Symptoms:**
- Event handler can't connect to Redis
- Pub/sub not working

**Solutions:**
1. **Check Redis health**:
   ```bash
   docker exec <redis-container> redis-cli ping
   # Should return "PONG"
   ```

2. **Verify Redis is accepting connections**:
   ```bash
   docker exec <event-handler-container> nc -zv redis 6379
   # Should show "succeeded"
   ```

3. **Check Redis memory**:
   ```bash
   docker exec <redis-container> redis-cli INFO memory
   ```

4. **Restart Redis**:
   ```bash
   docker restart <redis-container>
   ```

---

## 🔒 Security Considerations

1. **Database Password**: Auto-generated 32-character password (stored in Dokploy secrets)
2. **Network Isolation**: PostgreSQL and Redis accessible only from internal network
3. **WebSocket Only**: Only WebSocket handler exposed externally (port 8008 via Traefik)
4. **HTTPS Required**: Enforced via Traefik with Let's Encrypt certificates
5. **WoT Filtering**: Prevents spam and abusive content (when enabled)

**Security Best Practices:**
- Keep `POSTGRES_PASSWORD` secure (never expose publicly)
- Use Web of Trust filtering for public relays
- Monitor logs for suspicious activity
- Regularly update Docker images (check for new versions)
- Enable rate limiting at Traefik level (optional)
- Use strong admin pubkey (from secure key generation)

**Recommended Traefik Rate Limiting:**
```yaml
# Add to websocket-handler labels
- "traefik.http.middlewares.nostpy-ratelimit.ratelimit.average=100"
- "traefik.http.middlewares.nostpy-ratelimit.ratelimit.burst=50"
- "traefik.http.routers.nostpy.middlewares=nostpy-ratelimit"
```

---

## 🔄 Updates & Maintenance

### Updating Relay Version

To update to a newer nostpy-relay version:

1. **Check current version**:
   ```bash
   docker exec <websocket-handler-container> python -c "import sys; print(sys.version)"
   ```

2. **Update docker-compose.yml** or environment:
   ```yaml
   VERSION: "v1.3.0"  # Change version
   ```

3. **Redeploy** in Dokploy:
   - Click "Redeploy" button
   - Wait for new images to pull and build
   - Verify services restart successfully

4. **Verify** relay is working:
   ```bash
   curl -H "Accept: application/nostr+json" https://relay.example.com
   # Check "version" field
   ```

### Database Migration

When updating between major versions, check for database migrations:

```bash
# Backup before migration
docker exec <postgres-container> pg_dump -U nostr nostr > backup-before-v1.3.0.sql

# Check for migration scripts in repository
# https://github.com/UTXOnly/nostpy-relay/tree/main/migrations

# Apply migrations manually if needed
docker exec <postgres-container> psql -U nostr nostr < migration-v1.2-to-v1.3.sql
```

---

## 📚 Resources

### Official Documentation
- **Nostpy Relay GitHub**: https://github.com/UTXOnly/nostpy-relay
- **Nostr Protocol**: https://github.com/nostr-protocol/nostr
- **NIPs (Nostr Implementation Possibilities)**: https://github.com/nostr-protocol/nips
- **Docker Compose Reference**: https://docs.docker.com/compose/

### Nostr Resources
- **Nostr Dev Resources**: https://nostr.how/
- **Awesome Nostr**: https://github.com/aljazceru/awesome-nostr
- **Nostr Clients**: https://github.com/aljazceru/awesome-nostr#clients
- **Relay Implementations**: https://github.com/aljazceru/awesome-nostr#relays-implementations

### Community & Support
- **Nostr Telegram**: https://t.me/nostr_protocol
- **Nostr Reddit**: https://www.reddit.com/r/nostr/
- **Nostpy Relay Issues**: https://github.com/UTXOnly/nostpy-relay/issues

### Relay Explorers
- **Nostr.watch**: https://nostr.watch/ (Monitor relay status)
- **Nostr.band**: https://nostr.band/relays (Relay statistics)

---

## 📝 License

- **Nostpy Relay**: MIT License
- **This Template**: MIT License

---

## 🤝 Contributing

Found an issue or have a suggestion? Please open an issue in the [Dokploy Templates repository](https://github.com/your-org/dokploy-templates) or the [Nostpy Relay repository](https://github.com/UTXOnly/nostpy-relay/issues).

---

**Template Version**: 1.0.0
**Nostpy Relay Version**: v1.2.0
**Last Updated**: 2025-12-30

---

## Additional Notes

### Nostr Event Kinds

Common event kinds you'll see in your relay:

| Kind | Type | Description |
|------|------|-------------|
| 0 | Metadata | User profile (name, about, picture) |
| 1 | Text Note | Short-form content (tweets) |
| 3 | Contacts | Follow list |
| 4 | Encrypted DM | Private messages |
| 5 | Deletion | Event deletion request |
| 6 | Repost | Share another event |
| 7 | Reaction | Like, emoji reactions |
| 40-44 | Channels | Group chat messages |
| 1063 | File Metadata | Uploaded file info |

### Performance Benchmarks

**Small Personal Relay (1-10 users):**
- Events/day: 100-1,000
- Storage: ~50 MB/week
- RAM: 1-2 GB sufficient
- CPU: <10% average

**Medium Community Relay (10-100 users):**
- Events/day: 1,000-10,000
- Storage: ~500 MB/week
- RAM: 2-4 GB recommended
- CPU: 10-30% average

**Large Public Relay (100+ users):**
- Events/day: 10,000+
- Storage: 1-10 GB/week
- RAM: 4-8 GB recommended
- CPU: 30-60% under load

### Future Enhancements

**Planned features (check repository for updates):**
1. **NIP-05 Verification**: Verify Nostr addresses (name@domain)
2. **NIP-09 Event Deletion**: Honor deletion requests
3. **NIP-40 Expiration Tags**: Auto-delete expired events
4. **Outbox Model (NIP-65)**: Relay recommendations
5. **Paid Relay Features**: Lightning Network payments for access
6. **Search Functionality**: Full-text event search
7. **Admin Dashboard**: Web UI for relay management

### Known Limitations

1. **No Built-in Tor Support**: Requires manual Tor setup (not included in this template)
2. **No Admin Web UI**: Management via command-line only
3. **Single PostgreSQL Instance**: No read replicas in this template
4. **No Automatic Backups**: Manual backup procedures required
5. **Web of Trust Depth**: Limited to 2 degrees (follows of follows)

### Comparison with Other Relays

| Feature | Nostpy Relay | Nostream | strfry | Nostr-rs-relay |
|---------|--------------|----------|--------|----------------|
| Language | Python | TypeScript | C++ | Rust |
| Database | PostgreSQL | PostgreSQL | LMDB | SQLite |
| WoT Filtering | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| Performance | Medium | High | Very High | High |
| Setup Complexity | Low | Medium | Low | Low |
| Monitoring | OpenTelemetry | Custom | None | Prometheus |

**Choose Nostpy Relay when:**
- You want Python-based codebase (easy to customize)
- You need Web of Trust filtering built-in
- You value OpenTelemetry monitoring
- You prefer PostgreSQL for data persistence

---

**Ready to run your own Nostr relay? Deploy now and join the decentralized social network! 🌐**

---

**Sources:**
- [Nostpy Relay GitHub](https://github.com/UTXOnly/nostpy-relay)
- [Nostr Protocol Specification](https://github.com/nostr-protocol/nostr)
- [Nostr.watch Relay Monitor](https://nostr.watch/)
