# Algo Relay - Nostr's First Algorithmic Relay

Algo Relay is a personalized algorithmic relay for the Nostr protocol. Unlike traditional relays that show content chronologically, Algo Relay uses weighted algorithms to surface content that's most relevant to you based on your interactions and engagement patterns.

## Features

- **Personalized Feeds**: Content ranked by your interaction history
- **Weighted Algorithm**: Configurable weights for different engagement types
- **Zap-Weighted**: Bitcoin tips (zaps) carry more weight as quality signals
- **Viral Dampening**: Prevent viral content from dominating your feed
- **Time Decay**: Naturally favor recent content over older posts
- **PostgreSQL Backend**: Reliable, scalable data storage
- **Nostr Native**: Full NIP compatibility with existing clients

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          algo-net (internal)                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                          algo-relay                                 │ │
│  │                            :3334                                    │ │
│  │                                                                     │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │ │
│  │  │  Feed Algorithm  │  │  Event Storage   │  │   Interaction    │ │ │
│  │  │  - Weights       │  │  - Notes         │  │   Tracking       │ │ │
│  │  │  - Decay         │  │  - Reactions     │  │  - Comments      │ │ │
│  │  │  - Viral Filter  │  │  - Zaps          │  │  - Zaps          │ │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         postgres                                    │ │
│  │                          :5432                                      │ │
│  │                                                                     │ │
│  │                    PostgreSQL 16 (Alpine)                          │ │
│  │                    - Relay data storage                            │ │
│  │                    - Interaction history                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │
                 dokploy-network
                               │
                       ┌───────┴───────┐
                       │    traefik    │
                       └───────────────┘
                               │
                               ▼
                wss://algo.example.com
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| Algo Relay | Built from source | 3334 | Algorithmic feed relay |
| PostgreSQL | postgres:16-alpine | 5432 | Data storage |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- ~15 minutes for initial Docker build (Go compilation)

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ALGO_DOMAIN` | Domain for the relay | `algo.example.com` |
| `POSTGRES_PASSWORD` | PostgreSQL password | Auto-generated |

### Relay Identity

| Variable | Default | Description |
|----------|---------|-------------|
| `RELAY_NAME` | `Algo Relay` | Display name shown to clients |
| `RELAY_DESCRIPTION` | - | Description of your relay |
| `RELAY_PUBKEY` | - | Your Nostr public key (npub or hex) |
| `RELAY_ICON` | - | URL to relay icon image |
| `RELAY_CONTACT` | - | Admin contact information |

### Algorithm Weights

These weights control how posts are scored and ranked. Higher values = more influence.

| Variable | Default | Description |
|----------|---------|-------------|
| `WEIGHT_INTERACTIONS_WITH_AUTHOR` | `1.0` | Priority for authors you engage with |
| `WEIGHT_COMMENTS_GLOBAL` | `0.3` | Global comment engagement weight |
| `WEIGHT_REACTIONS_GLOBAL` | `0.2` | Global reaction (like) weight |
| `WEIGHT_ZAPS_GLOBAL` | `0.5` | Global zap (bitcoin tip) weight |
| `WEIGHT_RECENCY` | `1.0` | How much to favor recent content |
| `DECAY_RATE` | `0.1` | Speed of score decay over time |

### Viral Content

| Variable | Default | Description |
|----------|---------|-------------|
| `VIRAL_THRESHOLD` | `100` | Engagement count for "viral" status |
| `VIRAL_POST_DAMPENING` | `0.5` | Reduce viral post prominence (0-1) |

## Deployment

### 1. DNS Configuration

Create a DNS record:
```
algo.example.com → Your Dokploy Server IP
```

### 2. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml, Dockerfile, and template.toml
3. Configure:
   - `ALGO_DOMAIN` - your domain
   - `POSTGRES_PASSWORD` - secure password (auto-generated)
4. Deploy the stack

### 3. Initial Build

The first deployment will take ~15 minutes to:
1. Clone Algo Relay source from GitHub
2. Download Go dependencies
3. Compile the binary
4. Create the runtime container

Subsequent deployments use cached layers and are much faster.

### 4. Configure Your Nostr Client

Add the relay to your Nostr client:
```
wss://algo.example.com
```

## Understanding the Algorithm

### How Posts Are Scored

Each post receives a score based on:

1. **Author Interactions**: Have you commented, reacted, or zapped this author before?
2. **Global Engagement**: How much engagement has this post received network-wide?
3. **Recency**: Newer posts score higher than older ones
4. **Viral Status**: Posts exceeding the viral threshold get dampened

### Tuning Your Feed

**More personal content** (from people you interact with):
- Increase `WEIGHT_INTERACTIONS_WITH_AUTHOR`
- Decrease `WEIGHT_*_GLOBAL` values

**More discovery** (popular content):
- Increase `WEIGHT_*_GLOBAL` values
- Increase `VIRAL_THRESHOLD` to reduce dampening

**Faster refresh** (more recent content):
- Increase `WEIGHT_RECENCY`
- Increase `DECAY_RATE`

**Quality over quantity** (zap-weighted):
- Increase `WEIGHT_ZAPS_GLOBAL`
- Zaps require bitcoin, so they indicate genuine appreciation

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| Algo Relay | 0.5 | 1GB | 1GB |
| PostgreSQL | 0.25 | 512MB | 10GB+ |

Memory is limited in the compose file. Adjust based on expected traffic.

## Troubleshooting

### Build Fails

1. Check Docker has internet access
2. Verify Go modules are accessible
3. Check build logs:
   ```bash
   docker compose logs algo-relay
   ```

### Cannot Connect to Relay

1. Check container is running:
   ```bash
   docker compose ps
   ```

2. Verify WebSocket endpoint:
   ```bash
   curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     https://algo.example.com/
   ```

3. Check relay logs:
   ```bash
   docker compose logs algo-relay
   ```

### Database Connection Issues

1. Check PostgreSQL is healthy:
   ```bash
   docker compose ps postgres
   ```

2. Verify credentials:
   ```bash
   docker compose exec postgres psql -U algo -d algo_relay -c '\dt'
   ```

### Slow Feed Performance

1. Check PostgreSQL performance:
   ```bash
   docker compose exec postgres pg_top
   ```

2. Consider adding indexes for frequently queried fields

3. Increase PostgreSQL memory if needed

## Data Import

To import existing notes from other relays:

```bash
docker compose exec algo-relay /app/algo-relay --import
```

This pulls your historical data to build interaction history.

## Backup & Restore

### Backup Database

```bash
docker compose exec postgres pg_dump -U algo algo_relay > backup.sql
```

### Restore Database

```bash
docker compose exec -T postgres psql -U algo algo_relay < backup.sql
```

## Security Considerations

- **PostgreSQL Internal**: Database only accessible within Docker network
- **HTTPS Only**: All traffic encrypted via LetsEncrypt
- **No Direct Access**: WebSocket traffic proxied through Traefik
- **Rate Limiting**: Consider adding Traefik rate limits for public relays

## Upgrading

To upgrade to a newer version:

1. Update `ALGO_VERSION` in environment
2. Rebuild the container:
   ```bash
   docker compose build --no-cache algo-relay
   docker compose up -d
   ```

## Related Resources

- [Algo Relay GitHub](https://github.com/bitvora/algo-relay)
- [Nostr Protocol](https://nostr.com/)
- [NIPs (Nostr Implementation Possibilities)](https://github.com/nostr-protocol/nips)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
