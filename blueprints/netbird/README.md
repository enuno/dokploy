# NetBird

WireGuard-based VPN & Zero Trust Network Access platform with a web dashboard and embedded identity provider.

## Overview

NetBird creates a secure private network for your organization using WireGuard. This template deploys the combined NetBird server (v0.65.0+) which bundles management, signal, relay, and STUN services into a single container, plus the web dashboard.

## What's Included

| Service | Image | Description |
|---------|-------|-------------|
| Dashboard | `netbirdio/dashboard:v2.36.0` | Web UI for managing peers, groups, and policies |
| NetBird Server | `netbirdio/netbird-server:0.68.3` | Combined management + signal + relay + STUN |

## Requirements

- **Domain**: A fully-qualified domain name pointing to your Dokploy server
- **UDP Port 3478**: Must be open in your firewall for STUN (used for NAT traversal)
- **Ports 80/443**: Standard HTTP/HTTPS for the dashboard and API

## Post-Deployment Setup

### 1. Access the Dashboard

After deployment, open `https://your-domain` in a browser.

### 2. Create the First Admin User

The embedded IdP (Dex) is pre-configured. On first login:

1. Click **Sign Up** to create your admin account
2. Log in with the created credentials
3. Navigate to **Settings > Account** to configure your organization

### 3. Install NetBird Clients

Download clients for your devices:

- **Linux**: `curl -fsSL https://pkgs.netbird.io/install.sh | sh`
- **macOS**: `brew install netbirdio/tap/netbird`
- **Windows**: Download from [GitHub Releases](https://github.com/netbirdio/netbird/releases)
- **iOS / Android**: Search "NetBird" in the App Store / Play Store

### 4. Connect Peers

After installing the client, connect with:

```bash
netbird up --management-url https://your-domain --setup-key <SETUP_KEY>
```

Or use the interactive login:

```bash
netbird up --management-url https://your-domain
```

Generate setup keys from the dashboard under **Peers > Setup Keys**.

## Architecture

### Traefik Routing

All traffic routes through the same domain with path-based rules:

| Path | Service | Protocol |
|------|---------|----------|
| `/*` | Dashboard | HTTP (catch-all, lowest priority) |
| `/api/*`, `/oauth2/*` | NetBird Server | HTTP |
| `/relay*`, `/ws-proxy/*` | NetBird Server | WebSocket |
| `/signalexchange.SignalExchange/*` | NetBird Server | gRPC (h2c) |
| `/management.ManagementService/*` | NetBird Server | gRPC (h2c) |

### Direct UDP Port

STUN traffic on UDP `3478` is published directly from the container and **cannot** be proxied through Traefik.

## Important Notes

- **Do not change** the `AUTH_CLIENT_ID` or `AUTH_AUDIENCE` values in the dashboard environment variables unless you are using an external IdP
- The embedded IdP stores users in SQLite alongside NetBird's network data
- Backup `/var/lib/netbird` regularly — it contains all peer configurations, policies, and user data
- For high availability or external IdP integration, refer to the [NetBird Self-Hosted Docs](https://docs.netbird.io/selfhosted/selfhosted-guide)

## Reverse Proxy Documentation

- [External Reverse Proxy Setup](https://docs.netbird.io/selfhosted/external-reverse-proxy)
- [NetBird as Reverse Proxy](https://docs.netbird.io/manage/reverse-proxy) (requires additional proxy container — not included in this template)

## Cloudflare Integration (Optional)

If using Cloudflare in front of this deployment:

- Disable **Cloudflare Proxy** (grey cloud) for the domain if you experience gRPC or WebSocket issues
- Alternatively, ensure **gRPC** and **WebSocket** support are enabled in Cloudflare Network settings
- UDP port 3478 must be opened directly on your origin server; Cloudflare does not proxy UDP STUN

## Updating

To update NetBird:

1. Check the latest releases:
   - Server: <https://github.com/netbirdio/netbird/releases>
   - Dashboard: <https://github.com/netbirdio/dashboard/releases>
2. Update the image tags in `docker-compose.yml`
3. Redeploy via Dokploy

## Links

- **GitHub**: <https://github.com/netbirdio/netbird>
- **Documentation**: <https://docs.netbird.io>
- **Website**: <https://netbird.io>
