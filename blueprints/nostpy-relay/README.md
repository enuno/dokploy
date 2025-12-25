# Nostpy Relay - Python-based Nostr Relay

Nostpy Relay is a high-performance Python-based Nostr relay with PostgreSQL storage and Redis caching. It features a distributed architecture with separate WebSocket and Event handlers, Web of Trust filtering, and built-in observability support.

## Features

- **Python-based**: Written in Python with async support
- **PostgreSQL Backend**: Reliable, scalable relational storage
- **Redis Caching**: Fast pub/sub messaging and caching
- **Distributed Architecture**: Separate WebSocket and Event handlers
- **Web of Trust**: Optional WoT filtering for spam prevention
- **OpenTelemetry Ready**: Built-in observability support
- **Read/Write Separation**: Designed for horizontal scaling

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           nostpy-net (internal)                              │
│                                                                              │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │  websocket-handler  │────────▶│   event-handler     │                   │
│  │       :8008         │  HTTP   │       :8009         │                   │
│  │                     │         │                     │                   │
│  │  - Client conns     │         │  - Business logic   │                   │
│  │  - NIP support      │         │  - Event validation │                   │
│  │  - Rate limiting    │         │  - WoT filtering    │                   │
│  └─────────┬───────────┘         └──────────┬──────────┘                   │
│            │                                 │                              │
│            │        ┌────────────────────────┤                              │
│            │        │                        │                              │
│            ▼        ▼                        ▼                              │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │       redis         │         │      postgres       │                   │
│  │       :6379         │         │       :5432         │                   │
│  │                     │         │                     │                   │
│  │  - Pub/Sub          │         │  - Event storage    │                   │
│  │  - Caching          │         │  - User data        │                   │
│  │  - Session state    │         │  - Read/Write ops   │                   │
│  └─────────────────────┘         └─────────────────────┘                   │
│                                                                              │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
                     dokploy-network
                                   │
                           ┌───────┴───────┐
                           │    traefik    │
                           └───────────────┘
                                   │
                                   ▼
                    wss://nostr.example.com
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| WebSocket Handler | nostpy-relay/websocket-handler | 8008 | Client connections |
| Event Handler | nostpy-relay/event-handler | 8009 | Business logic |
| PostgreSQL | postgres:14-alpine | 5432 | Data storage |
| Redis | redis:7-alpine | 6379 | Caching & pub/sub |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- ~5 minutes for initial deployment

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NOSTPY_DOMAIN` | Domain for the relay | `nostr.example.com` |
| `POSTGRES_PASSWORD` | PostgreSQL password | Auto-generated |

### Relay Identity

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_PUBKEY` | - | Admin hex public key |
| `CONTACT` | - | Contact email (NIP-11) |
| `RELAY_ICON` | - | Relay icon URL |

### Feature Toggles

| Variable | Default | Description |
|----------|---------|-------------|
| `WOT_ENABLED` | `True` | Enable Web of Trust filtering |

### Database Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `nostr` | PostgreSQL username |
| `POSTGRES_DB` | `nostr` | Database name |

## Deployment

### 1. DNS Configuration

Create a DNS record:
```
nostr.example.com → Your Dokploy Server IP
```

### 2. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure:
   - `NOSTPY_DOMAIN` - your domain
   - `POSTGRES_PASSWORD` - secure password (auto-generated)
4. Deploy the stack

### 3. First Deployment

The first deployment will:
1. Pull PostgreSQL and Redis images
2. Build WebSocket and Event handler images from GitHub
3. Initialize the database schema
4. Start all services

This may take 5-10 minutes for the initial build.

### 4. Configure Your Nostr Client

Add the relay to your Nostr client:
```
wss://nostr.example.com
```

## Understanding the Architecture

### Why Two Handlers?

Nostpy separates concerns for better scalability:

1. **WebSocket Handler** (port 8008)
   - Manages client connections
   - Handles NIP protocol details
   - Lightweight, scales horizontally

2. **Event Handler** (port 8009)
   - Validates events
   - Manages database operations
   - Applies Web of Trust rules

### Redis Pub/Sub

Redis enables real-time event distribution:
- WebSocket handler publishes new events
- All WebSocket handlers receive events
- Enables horizontal scaling

### PostgreSQL Read/Write

The template uses a single PostgreSQL instance but supports separate read/write connections for future scaling.

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| WebSocket Handler | 0.25 | 512MB | - |
| Event Handler | 0.5 | 1GB | - |
| PostgreSQL | 0.5 | 1GB | 10GB+ |
| Redis | 0.25 | 256MB | 1GB |

**Total**: ~1.5 CPU, ~2.75GB RAM

## Troubleshooting

### Cannot Connect to Relay

1. Check all containers are running:
   ```bash
   docker compose ps
   ```

2. Verify WebSocket endpoint:
   ```bash
   curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     https://nostr.example.com/
   ```

3. Check WebSocket handler logs:
   ```bash
   docker compose logs websocket-handler
   ```

### Database Connection Errors

1. Check PostgreSQL is healthy:
   ```bash
   docker compose ps postgres
   ```

2. Verify database connectivity:
   ```bash
   docker compose exec postgres psql -U nostr -d nostr -c '\dt'
   ```

3. Check Event handler logs:
   ```bash
   docker compose logs event-handler
   ```

### Redis Connection Errors

1. Check Redis is healthy:
   ```bash
   docker compose exec redis redis-cli ping
   ```

2. Check Redis pub/sub:
   ```bash
   docker compose exec redis redis-cli PUBSUB CHANNELS '*'
   ```

### High Memory Usage

1. Check PostgreSQL connections:
   ```bash
   docker compose exec postgres psql -U nostr -c "SELECT count(*) FROM pg_stat_activity"
   ```

2. Clear Redis cache if needed:
   ```bash
   docker compose exec redis redis-cli FLUSHDB
   ```

### Events Not Appearing

1. Check WoT filtering:
   - If `WOT_ENABLED=True`, only trusted accounts can post
   - Set `WOT_ENABLED=False` to disable filtering

2. Check Event handler logs for validation errors:
   ```bash
   docker compose logs event-handler | grep -i error
   ```

## Scaling

### Horizontal Scaling (Future)

Nostpy's architecture supports horizontal scaling:

1. **WebSocket Handlers**: Scale with load balancing
2. **Event Handlers**: Scale with Redis coordination
3. **PostgreSQL**: Add read replicas
4. **Redis**: Use Redis Cluster

### Current Template

This template runs single instances of each service, suitable for:
- Personal relays
- Small communities (<1000 active users)
- Home lab deployments

## Backup & Restore

### Backup PostgreSQL

```bash
docker compose exec postgres pg_dump -U nostr nostr > backup.sql
```

### Backup Redis

```bash
docker compose exec redis redis-cli BGSAVE
docker compose cp redis:/data/dump.rdb ./redis-backup.rdb
```

### Restore PostgreSQL

```bash
docker compose exec -T postgres psql -U nostr nostr < backup.sql
```

## Monitoring

Nostpy includes OpenTelemetry support. To enable:

1. Add OpenTelemetry collector service
2. Configure `DD_API_KEY` for Datadog export
3. Or configure custom OTLP endpoint

## Comparison with Other Relays

| Feature | Nostpy | Haven | Algo Relay | WoT Relay |
|---------|--------|-------|------------|-----------|
| Language | Python | Go | Go | Go |
| Database | PostgreSQL | Embedded | PostgreSQL | Embedded |
| Caching | Redis | - | - | - |
| Scalability | High | Low | Medium | Low |
| Complexity | High | Low | Medium | Low |
| Memory Usage | ~2.75GB | ~2GB | ~1.5GB | ~2GB |

## Related Resources

- [Nostpy Relay GitHub](https://github.com/UTXOnly/nostpy-relay)
- [Nostr Protocol](https://nostr.com/)
- [NIPs (Nostr Implementation Possibilities)](https://github.com/nostr-protocol/nips)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
