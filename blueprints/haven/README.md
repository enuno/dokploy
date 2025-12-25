# Haven - High Availability Vault for Events on Nostr

Haven is the most sovereign personal relay for the Nostr protocol, designed for storing and backing up sensitive notes like eCash, private chats, and drafts. It operates as four distinct relays plus an integrated Blossom media server.

## Features

- **Private Relay**: Auth-protected, owner-only access for drafts and sensitive data
- **Chat Relay**: Encrypted DM relay with web-of-trust spam filtering
- **Inbox Relay**: Aggregates notifications and tagged mentions from other relays
- **Outbox Relay**: Public repository for owner's notes with auto-broadcast
- **Blossom Media Server**: Built-in image/video hosting with owner-only uploads
- **Web of Trust**: Protection from DM and Inbox spam
- **Cloud Backups**: Optional S3/R2 backup support
- **Note Import**: Import old notes from other relays
- **Embedded Database**: BadgerDB or LMDB (no external database needed)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          haven-net (internal)                            │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                            haven                                    │ │
│  │                            :3355                                    │ │
│  │                                                                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │ │
│  │  │   /private   │  │    /chat     │  │   /inbox     │             │ │
│  │  │  (owner-only)│  │ (DMs + WoT)  │  │(notifications)│             │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │ │
│  │                                                                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │ │
│  │  │   /outbox    │  │   /blossom   │  │   BadgerDB   │             │ │
│  │  │(public notes)│  │(media server)│  │  (embedded)  │             │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │ │
│  │                                                                     │ │
│  │                    ┌──────────────────────────────┐                │ │
│  │                    │     Cloudflare R2 Backup     │                │ │
│  │                    │        (optional)            │                │ │
│  │                    └──────────────────────────────┘                │ │
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
              wss://nostr.example.com/[private|chat|inbox|outbox]
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| Haven | ghcr.io/bitvora/haven:v1.1.0 | 3355 | 4 relays + Blossom media server |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- Your Nostr public key (npub format)
- (Optional) Cloudflare R2 bucket for backups

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `HAVEN_DOMAIN` | Domain for Haven relay | `nostr.example.com` |
| `OWNER_NPUB` | Your Nostr public key | `npub1abc123...` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_ENGINE` | `badger` | Database engine (`badger` or `lmdb`) |
| `CHAT_RELAY_WOT_DEPTH` | `3` | Web-of-trust network depth (1-5) |
| `CHAT_RELAY_MINIMUM_FOLLOWERS` | `3` | Min followers to bypass WoT |
| `INBOX_PULL_INTERVAL_SECONDS` | `600` | Notification poll interval |
| `IMPORT_START_DATE` | `2020-01-01` | Start date for note import |
| `TOR_ENABLED` | `0` | Enable Tor hidden service |

### Relay Customization

| Variable | Default | Description |
|----------|---------|-------------|
| `PRIVATE_RELAY_NAME` | `Haven Private` | Private relay name |
| `CHAT_RELAY_NAME` | `Haven Chat` | Chat relay name |
| `INBOX_RELAY_NAME` | `Haven Inbox` | Inbox relay name |
| `OUTBOX_RELAY_NAME` | `Haven Outbox` | Outbox relay name |
| `RELAY_ICON` | - | URL to relay icon |

### Cloudflare R2 Backup

| Variable | Description |
|----------|-------------|
| `BACKUP_PROVIDER` | Set to `aws` for R2 backup |
| `BACKUP_INTERVAL_HOURS` | Backup frequency (default: 24) |
| `S3_ACCESS_KEY` | R2 access key |
| `S3_SECRET_KEY` | R2 secret key |
| `S3_REGION` | `auto` for R2 |
| `S3_BUCKET` | Bucket name |

## Deployment

### 1. DNS Configuration

Create a DNS record:
```
nostr.example.com → Your Dokploy Server IP
```

### 2. Get Your Nostr Public Key

If you don't have one, generate at:
- https://nostrtool.com
- Any Nostr client (Damus, Primal, Amethyst, etc.)

Your npub looks like: `npub1abcdef123456...`

### 3. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure:
   - `HAVEN_DOMAIN` - your domain
   - `OWNER_NPUB` - your public key
4. Deploy the stack

### 4. Configure Your Nostr Client

Add your relay endpoints to your Nostr client:

| Purpose | URL |
|---------|-----|
| Private | `wss://nostr.example.com/private` |
| Chat | `wss://nostr.example.com/chat` |
| Inbox | `wss://nostr.example.com/inbox` |
| Outbox | `wss://nostr.example.com` |

## Relay Endpoints

Haven exposes four distinct relay endpoints:

### `/private` - Private Relay
- Auth-protected (NIP-42)
- Only accessible by owner
- For drafts, eCash, sensitive notes
- Not readable or writable by anyone else

### `/chat` - Chat Relay
- Auth-protected (NIP-42)
- Only accepts encrypted DMs (kind 4, 1059)
- Web-of-trust spam filtering
- Only people in your trust network can message you

### `/inbox` - Inbox Relay
- Receives notifications, mentions, zaps
- Aggregates from other relays
- Rate-limited to prevent spam

### `/` (root) - Outbox Relay
- Public read access
- Owner-only write
- Auto-broadcasts to other relays (blastr)
- Your public notes live here

### Blossom Media Server
- Upload images/videos
- Owner-only uploads
- Public viewing
- Access at `https://nostr.example.com/blossom/`

## Cloudflare R2 Backup Setup

For automatic cloud backups:

### 1. Create R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Create bucket named `haven-backup`
3. Note your Account ID

### 2. Create API Token

1. Go to R2 → Manage R2 API Tokens
2. Create token with read/write permissions
3. Save Access Key ID and Secret Access Key

### 3. Configure Environment

```toml
BACKUP_PROVIDER = "aws"
BACKUP_INTERVAL_HOURS = "24"
S3_ACCESS_KEY = "your-access-key-id"
S3_SECRET_KEY = "your-secret-access-key"
S3_REGION = "auto"
S3_BUCKET = "haven-backup"
```

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| Haven | 0.5 | 2GB | 10GB+ |

Memory is limited to 2GB in the compose file. Adjust based on note volume.

## Troubleshooting

### Cannot Connect to Relay

1. Check container is running:
   ```bash
   docker compose ps
   ```

2. Verify WebSocket is accessible:
   ```bash
   curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     https://nostr.example.com/
   ```

3. Check logs:
   ```bash
   docker compose logs haven
   ```

### Auth Failures on Private/Chat

1. Verify `OWNER_NPUB` is correct
2. Ensure your client supports NIP-42 auth
3. Check you're using the right private key

### Web of Trust Blocking Everyone

1. Increase `CHAT_RELAY_WOT_DEPTH` (default: 3)
2. Lower `CHAT_RELAY_MINIMUM_FOLLOWERS` (default: 3)
3. Wait for WoT cache to refresh

### Database Issues

If upgrading from v1.0.5 or earlier:
1. Back up your data
2. Delete the database directory
3. Restart and re-import notes

### High Memory Usage

1. Switch to LMDB engine:
   ```
   DB_ENGINE=lmdb
   ```

2. Reduce LMDB map size if needed

## Security Considerations

- **Private Relay**: Fully auth-protected, only owner can read/write
- **Chat Relay**: WoT filtering prevents spam
- **No External Database**: All data is embedded
- **Optional R2 Backup**: Encrypted backups to Cloudflare
- **Rate Limiting**: All endpoints have rate limits

## Related Resources

- [Haven GitHub](https://github.com/bitvora/haven)
- [Nostr Protocol](https://nostr.com/)
- [NIP-42 Authentication](https://github.com/nostr-protocol/nips/blob/master/42.md)
- [Blossom Protocol](https://github.com/hzrd149/blossom)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
