# WoT Relay - Web of Trust Nostr Relay

WoT Relay archives every note from accounts within your web of trust. Unlike open relays that accept all content, WoT Relay only stores notes from people you follow (and people they follow, up to a configurable depth). This creates a spam-free, community-curated relay.

## Features

- **Web of Trust Filtering**: Only accepts notes from trusted accounts
- **Automatic Trust Discovery**: Builds trust graph from your follows
- **Spam Prevention**: Minimum follower threshold filters bots
- **Configurable Refresh**: Periodic trust network updates
- **Embedded Database**: BadgerDB - no external database needed
- **Archival Options**: Optionally archive all historical notes
- **Low Resource**: Single container, ~2GB memory limit

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          wot-net (internal)                              │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                          wot-relay                                  │ │
│  │                            :3334                                    │ │
│  │                                                                     │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │ │
│  │  │  Trust Manager   │  │   Note Storage   │  │   Web Interface  │ │ │
│  │  │  - Follow graph  │  │  - BadgerDB      │  │  - Relay info    │ │ │
│  │  │  - Refresh cycle │  │  - Events        │  │  - Stats         │ │ │
│  │  │  - Min followers │  │  - Reactions     │  │  - Static assets │ │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘ │ │
│  │                                                                     │ │
│  │                    Trust Network Visualization                      │ │
│  │         You → Follows → Their Follows → Filtered Content           │ │
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
                wss://wot.example.com
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| WoT Relay | Built from source | 3334 | Trust-filtered Nostr relay |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- Your Nostr public key in **HEX format** (not npub!)
- ~10 minutes for initial Docker build

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `WOT_DOMAIN` | Domain for the relay | `wot.example.com` |
| `RELAY_PUBKEY` | Your hex public key | `a1b2c3d4...` (64 chars) |

### Relay Identity

| Variable | Default | Description |
|----------|---------|-------------|
| `RELAY_NAME` | `WoT Relay` | Display name shown to clients |
| `RELAY_DESCRIPTION` | - | Description of your relay |
| `RELAY_ICON` | - | URL to relay icon image |
| `RELAY_CONTACT` | - | Admin contact information |

### Web of Trust Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `REFRESH_INTERVAL_HOURS` | `24` | How often to refresh trust graph |
| `MINIMUM_FOLLOWERS` | `3` | Min followers to be in WoT |
| `IGNORE_FOLLOWS_LIST` | - | Hex pubkeys to exclude (comma-separated) |

### Archival Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `ARCHIVAL_SYNC` | `FALSE` | Archive all notes (high storage) |
| `ARCHIVE_REACTIONS` | `FALSE` | Archive all reactions |

## Deployment

### 1. DNS Configuration

Create a DNS record:
```
wot.example.com → Your Dokploy Server IP
```

### 2. Convert Your npub to Hex

WoT Relay requires your public key in **hex format**, not npub.

**Option 1:** Use nostrtool.com
1. Go to https://nostrtool.com
2. Paste your npub
3. Copy the hex version (64 character string)

**Option 2:** Use a Nostr client
- Many clients show both formats in settings
- Look for "Public Key (hex)" or similar

**Example:**
```
npub1abc... → a1b2c3d4e5f6... (64 hex characters)
```

### 3. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml, Dockerfile, and template.toml
3. Configure:
   - `WOT_DOMAIN` - your domain
   - `RELAY_PUBKEY` - your **hex** public key
4. Deploy the stack

### 4. Initial Build

The first deployment will take ~10 minutes to:
1. Clone WoT Relay source from GitHub
2. Download Go dependencies
3. Compile the binary
4. Start building the trust graph

### 5. Configure Your Nostr Client

Add the relay to your Nostr client:
```
wss://wot.example.com
```

## Understanding Web of Trust

### How It Works

1. **You follow accounts** → They're in your WoT
2. **They follow accounts** → Those are also in your WoT
3. **Minimum followers** → Filters out bots with few followers
4. **Periodic refresh** → Trust graph updates automatically

### Trust Network Depth

The relay builds trust from:
- Accounts you directly follow (1st degree)
- Accounts they follow (2nd degree)

Accounts with fewer than `MINIMUM_FOLLOWERS` followers are excluded.

### Excluding Accounts

If someone you follow has too many bot followers, add their hex pubkey to `IGNORE_FOLLOWS_LIST`:

```
IGNORE_FOLLOWS_LIST = "abc123hex,def456hex"
```

This prevents their follows from polluting your WoT.

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| WoT Relay | 0.5 | 2GB | 5-50GB* |

*Storage depends on WoT size and archival settings. Without archival, expect 5-10GB. With full archival, plan for 50GB+.

## Troubleshooting

### Cannot Connect to Relay

1. Check container is running:
   ```bash
   docker compose ps
   ```

2. Verify WebSocket endpoint:
   ```bash
   curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     https://wot.example.com/
   ```

3. Check relay logs:
   ```bash
   docker compose logs wot-relay
   ```

### "Invalid pubkey" Error

Your pubkey must be in **hex format**, not npub:
- ❌ `npub1abc123...`
- ✅ `a1b2c3d4e5f6...` (64 hex characters)

### WoT Not Building

1. Verify your pubkey is correct
2. Check you have followers (at least 1)
3. Wait for refresh interval (default 24h)
4. Check logs for trust graph errors

### High Memory Usage

1. Reduce WoT by increasing `MINIMUM_FOLLOWERS`
2. Disable archival options
3. Add high-bot-following accounts to `IGNORE_FOLLOWS_LIST`

### Missing Notes

Notes only appear if:
1. Author is in your WoT
2. Author has `MINIMUM_FOLLOWERS` followers
3. Trust graph has refreshed since they joined

## Archival Mode

By default, WoT Relay only stores recent notes. To archive everything:

```
ARCHIVAL_SYNC = "TRUE"
ARCHIVE_REACTIONS = "TRUE"
```

**Warning:** This significantly increases storage requirements. Only enable if you have:
- Large storage capacity (50GB+)
- Reason to archive historical content
- Resources to handle increased I/O

## Backup & Restore

### Backup Database

```bash
docker compose stop wot-relay
docker run --rm -v wot-relay_wot-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/wot-backup.tar.gz -C /data .
docker compose start wot-relay
```

### Restore Database

```bash
docker compose stop wot-relay
docker run --rm -v wot-relay_wot-data:/data -v $(pwd):/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/wot-backup.tar.gz -C /data"
docker compose start wot-relay
```

## Upgrading

To upgrade to a newer version:

1. Update `WOT_VERSION` in environment
2. Rebuild the container:
   ```bash
   docker compose build --no-cache wot-relay
   docker compose up -d
   ```

## Comparison with Other Bitvora Relays

| Feature | WoT Relay | Haven | Algo Relay |
|---------|-----------|-------|------------|
| Filtering | Trust network | Auth/ownership | Algorithm weights |
| Database | Badger (embedded) | Badger/LMDB | PostgreSQL |
| Use Case | Community relay | Personal vault | Personalized feed |
| Spam Protection | Follower threshold | Auth only | None built-in |

## Related Resources

- [WoT Relay GitHub](https://github.com/bitvora/wot-relay)
- [Nostr Protocol](https://nostr.com/)
- [NIPs (Nostr Implementation Possibilities)](https://github.com/nostr-protocol/nips)
- [Convert npub to hex](https://nostrtool.com)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
