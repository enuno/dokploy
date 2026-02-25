# Dokploy Templates

Custom application templates for [Dokploy](https://dokploy.com/) - a self-hosted PaaS for deploying applications with Docker.

## Overview

This directory contains custom Dokploy templates for deploying applications in the home lab environment. Templates follow the official [Dokploy templates format](https://github.com/Dokploy/templates) and can be imported directly into your Dokploy instance.

## Available Templates

| Template | Description | Services | Status |
|----------|-------------|----------|--------|
| [agent-zero](/blueprints/agent-zero/) | Autonomous AI agent framework with code execution, browser automation, and persistent memory | 1 (agent-zero) | Ready |
| [algo-relay](/blueprints/algo-relay/) | Nostr's first algorithmic relay with scoring and recommendations | 6 | Ready |
| [anon-relay](/blueprints/anon-relay/) | ANyONe Protocol relay with hidden service support | 1 (anon) | Ready |
| [ar-io-node](/blueprints/ar-io-node/) | Production-ready Arweave gateway with Redis caching, network observation, and Cloudflare R2 archival storage | 4 (envoy, core, redis, observer) | Ready |
| [ar-io-gateway](/blueprints/ar-io-gateway/) | Modular Arweave gateway with monitoring stack (Prometheus, Grafana, OpenTelemetry) and optional AO Compute Unit | 4-9 (base gateway + optional monitoring + AO) | Ready |
| [ar-io-observer](/blueprints/ar-io-observer/) | AR.IO Network observer generating randomized observation reports for gateway nodes | 1 (observer) | Ready |
| [anonupload](/blueprints/anonupload/) | Privacy-focused anonymous file sharing | 1 (php/apache) | Ready |
| [beszel](/blueprints/beszel/) | Lightweight server monitoring hub with agent architecture | 4 | Ready |
| [blinko](/blueprints/blinko/) | AI-powered personal note-taking tool with RAG for semantic search | 2 (blinko, postgres) | Ready |
| [bluesky-pds](/blueprints/bluesky-pds/) | AT Protocol Personal Data Server for Bluesky federation | 1 (pds) | Ready |
| [browserless](/blueprints/browserless/) | Headless Chromium browser automation with Puppeteer and Playwright, optional Cloudflare R2 storage | 1 (browserless) | Ready |
| [borgitory](/blueprints/borgitory/) | Web UI for managing BorgBackup repositories with scheduling and cloud sync | 1 (borgitory) | Ready |
| [btcpayserver](/blueprints/btcpayserver/) | Full-stack Bitcoin payment processor with Lightning Network (LND/CLN/Eclair), optional Bitcoin node (pruned/full), multiple access methods (Traefik/Tor/Tunnel), and R2 encrypted backups | 3-13 (base + optional Bitcoin node, Lightning, Tor, Tunnel, R2 backup) | Ready |
| [chibisafe](/blueprints/chibisafe/) | TypeScript file upload and sharing platform with albums and S3 support | 3 (backend, frontend, caddy) | Ready |
| [cyberchef](/blueprints/cyberchef/) | The Cyber Swiss Army Knife for encryption, encoding, compression, and data analysis | 1 (cyberchef) | Ready |
| [cloudflared](/blueprints/cloudflared/) | Cloudflare Tunnel client for secure ingress without public IPs | 3 | Ready |
| [core-lightning](/blueprints/core-lightning/) | Lightning Network implementation with integrated Bitcoin Core backend | 2 (lightningd, bitcoind) | Ready |
| [dashy](/blueprints/dashy/) | Customizable personal dashboard for organizing homelab services | 1 (dashy) | Ready |
| [dashdot](/blueprints/dashdot/) | Modern glassmorphism server dashboard for monitoring OS, CPU, RAM, storage, network, and GPU metrics | 1 (dashdot) | Ready |
| [dns-collector](/blueprints/dns-collector/) | DNS traffic analysis and monitoring tool with DNStap support, Prometheus metrics, and REST API | 1 (dnscollector) | Ready |
| [docker-registry](/blueprints/docker-registry/) | OCI Distribution implementation for private Docker image hosting | 4 | Ready |
| [firecrawl](/blueprints/firecrawl/) | Web scraping and data extraction API that converts websites into LLM-friendly markdown and structured data | 6 (api, worker, playwright, postgres, redis, rabbitmq) | Ready |
| [fmd-server](/blueprints/fmd-server/) | Find My Device server for Android tracking with embedded ObjectBox database and HTTPS encryption | 1 (fmd-server) | Ready |
| [forgejo](/blueprints/forgejo/) | Self-hosted Git forge (Gitea fork) | 2 (forgejo, postgres) | Ready |
| [gitingest](/blueprints/gitingest/) | Convert Git repositories into LLM-friendly text digests | 3 | Ready |
| [glance](/blueprints/glance/) | Lightweight customizable feed dashboard aggregating RSS, weather, stocks, and more | 1 (glance) | Ready |
| [goaccess-npm](/blueprints/goaccess-npm/) | Real-time web log analyzer with dashboard for Nginx Proxy Manager, Traefik, and Caddy logs | 1 (goaccess) | Ready |
| [grafana-observability](/blueprints/grafana-observability/) | Complete observability stack with metrics, logs, and traces | 17 | Ready |
| [haven](/blueprints/haven/) | High Availability Vault for Events on Nostr with S3 backend | 5 | Ready |
| [homarr](/blueprints/homarr/) | Modern homelab dashboard with 30+ service integrations and Docker management | 1 (homarr) | Ready |
| [homer](/blueprints/homer/) | Simple static homepage dashboard with YAML configuration | 1 (homer) | Ready |
| [hyperbeam](/blueprints/hyperbeam/) | AO Protocol compute node with Actor-Oriented architecture for permaweb applications | 1 (hyperbeam) | Ready |
| [ipfs-gateway-checker](/blueprints/ipfs-gateway-checker/) | Web-based tool for monitoring and checking the status of public IPFS gateways | 1 (nginx) | Ready |
| [ipfs-sw-gateway](/blueprints/ipfs-sw-gateway/) | Browser-based IPFS gateway using Service Workers with wildcard SSL for subdomain content addressing | 1 (gateway) | Ready |
| [it-tools](/blueprints/it-tools/) | Collection of 45+ handy developer utilities with client-side processing and great UX | 1 (it-tools) | Ready |
| [kestra](/blueprints/kestra/) | Event-driven orchestration platform for workflows with 400+ plugins | 2 (kestra, postgres) | Ready |
| [lnd-rtl](/blueprints/lnd-rtl/) | Lightning Network Daemon with Ride The Lightning web UI and Bitcoin Core backend | 3 (rtl, lnd, bitcoind) | Ready |
| [matomo](/blueprints/matomo/) | Self-hosted web analytics platform with privacy-first tracking and GDPR compliance | 3 (matomo, nginx, mariadb) | Ready |
| [matrix-synapse](/blueprints/matrix-synapse/) | Matrix homeserver with Cloudflare R2 media storage and federation support | 3 (synapse, postgres, redis) | Ready |
| [mcp-context-forge](/blueprints/mcp-context-forge/) | Model Context Protocol Gateway & Registry with enterprise auth, multi-tenant teams, and OpenTelemetry observability | 3 (mcpgateway, mariadb, redis) | Ready |
| [mcp-registry](/blueprints/mcp-registry/) | Community-driven MCP server registry with GitHub OAuth namespace ownership and server publishing | 2 (mcp-registry, postgres) | Ready |
| [kubo](/blueprints/kubo/) | Full IPFS node with Gateway (HTTP content access) and RPC API (node management) | 1 (kubo) | Ready |
| [langflow](/blueprints/langflow/) | Visual AI workflow builder for creating LLM-powered applications with PostgreSQL backend | 2 (langflow, postgres) | Ready |
| [lightningstream](/blueprints/lightningstream/) | Near real-time LMDB replication for PowerDNS using S3-compatible storage (MinIO/R2) | 3 (authoritative, syncer, minio) | Ready |
| [lobe-chat](/blueprints/lobe-chat/) | Modern AI chat platform with multi-provider support, knowledge base, and pgvector storage | 2 (lobe-chat, postgres) | Ready |
| [n8n](/blueprints/n8n/) | Workflow automation platform with 400+ integrations and task runners | 3 (n8n, postgres, task-runner) | Ready |
| [nostpy-relay](/blueprints/nostpy-relay/) | Python-based Nostr relay with PostgreSQL backend and Redis pub/sub | 4 (websocket-handler, event-handler, postgres, redis) | Ready |
| [nostr-rs-relay](/blueprints/nostr-rs-relay/) | High-performance Rust-based Nostr relay with embedded SQLite database and WebSocket protocol support | 1 (nostr-relay) | Ready |
| [ntfy](/blueprints/ntfy/) | HTTP-based pub-sub push notification service for phones and desktops | 1 (ntfy) | Ready |
| [onedev](/blueprints/onedev/) | Git server with built-in CI/CD, Kanban boards, and package registry | 6 | Ready |
| [omni-tools](/blueprints/omni-tools/) | Self-hosted collection of 40+ web utilities for media, PDF, text, and data manipulation with client-side processing | 1 (omni-tools) | Ready |
| [onionshare-cli](/blueprints/onionshare-cli/) | Secure anonymous file sharing, receiving, website hosting, and chat over Tor network | 1 (onionshare) | Ready |
| [openclaw](/blueprints/openclaw/) | Personal AI assistant with multi-channel messaging integration and voice capabilities | 1 (openclaw-gateway) | Ready |
| [openrag](/blueprints/openrag/) | Comprehensive RAG platform with Langflow, OpenSearch, and Cloudflare R2 for intelligent document search and AI-powered conversations | 5 (opensearch, langflow, backend, frontend, dashboards) | Ready |
| [opengist](/blueprints/opengist/) | Self-hosted Git-backed pastebin (GitHub Gist alternative) | 2 (opengist, postgres) | Ready |
| [open-notebook](/blueprints/open-notebook/) | Private multi-model AI knowledge management platform with 16+ AI provider support | 1 (all-in-one) | Ready |
| [paaster](/blueprints/paaster/) | Secure end-to-end encrypted pastebin with zero-knowledge server | 5 (paaster, mongodb, + helpers) | Ready |
| [padloc](/blueprints/padloc/) | Open-source password manager with end-to-end encryption and zero-knowledge architecture | 2 (server, pwa) | Ready |
| [personalized-deep-research](/blueprints/personalized-deep-research/) | Intelligent research agent with Nuxt frontend for complex AI-powered research tasks | 1 (deep-research-web) | Ready |
| [signal-cli-rest-api](/blueprints/signal-cli-rest-api/) | REST API wrapper for Signal Messenger enabling programmatic messaging with QR code device linking | 1 (signal-cli-rest-api) | Ready |
| [someguy](/blueprints/someguy/) | HTTP Delegated Routing V1 server for IPFS with Amino DHT proxy | 1 (someguy) | Ready |
| [pihole](/blueprints/pihole/) | Network-wide ad blocking with DNS-over-HTTPS, Cloudflared upstream, and Tailscale VPN | 4 (cloudflared, tailscale, pihole, dnscrypt-proxy) | Ready |
| [powerdns](/blueprints/powerdns/) | Complete DNS infrastructure with authoritative server, recursor, load balancer (dnsdist), and web admin | 6 (admin, admin-db, authoritative, authoritative-db, dnsdist, recursor) | Ready |
| [powerdns-admin](/blueprints/powerdns-admin/) | Web interface for PowerDNS with zone management, LDAP/SAML/OAuth auth, and PostgreSQL backend | 2 (powerdns-admin, postgres) | Ready |
| [pda-next](/blueprints/pda-next/) | Next-generation PowerDNS Admin with React/FastAPI, OAuth, WebAuthn, and API-first architecture (beta) | 5 (web, api, worker, mysql, redis) | Beta |
| [paperless-ngx](/blueprints/paperless-ngx/) | Document management system with OCR | 5 (web, postgres, redis, tika, gotenberg) | Ready |
| [rainbow](/blueprints/rainbow/) | Production-grade IPFS HTTP gateway with Cloudflare DNS-01 wildcard SSL and Zero Trust admin protection | 1 (rainbow) | Ready |
| [scrt-link](/blueprints/scrt-link/) | End-to-end encrypted ephemeral secret sharing with self-destructing links and Cloudflare R2 storage | 2 (scrt-link, postgres) | Ready |
| [swarm-bee](/blueprints/swarm-bee/) | Decentralized storage node for Ethereum Swarm network with BZZ token incentives | 1 (bee) | Ready |
| [tor-relay](/blueprints/tor-relay/) | Tor network relay (middle/bridge/exit) supporting anonymous internet routing infrastructure | 1 (tor-relay) | Ready |
| [uptime-kuma](/blueprints/uptime-kuma/) | Self-hosted monitoring tool for tracking service availability with 90+ notification providers | 1 (uptime-kuma) | Ready |
| [umami](/blueprints/umami/) | Privacy-focused web analytics platform as an alternative to Google Analytics | 2 (umami, postgres) | Ready |
| [usesend](/blueprints/usesend/) | Open-source email sending infrastructure powered by AWS SES with analytics dashboard and OAuth authentication | 3 (usesend, postgres, redis) | Ready |
| [warp-docker](/blueprints/warp-docker/) | Cloudflare WARP client in Docker for WireGuard VPN access | 4 | Ready |
| [warpod](/blueprints/warpod/) | Cloudflare WARP proxy server for network-wide WARP routing | 3 | Ready |
| [wot-relay](/blueprints/wot-relay/) | Web of Trust Nostr relay with trust scoring | 4 | Ready |

## Directory Structure

```
dokploy/
├── README.md                    # This file
├── .gitignore                   # Runtime data exclusions
└── blueprints/                  # Template definitions
    └── <app-name>/
        ├── docker-compose.yml   # Service definitions
        ├── template.toml        # Dokploy configuration
        ├── <app-name>.svg       # Logo for Dokploy UI
        └── README.md            # Template documentation
```

## Using Templates

### Option 1: Import via Dokploy UI

1. Navigate to your Dokploy instance (e.g., `https://dokploy.hashgrid.net`)
2. Go to **Templates** in the sidebar
3. Click **Import Template**
4. Provide the raw GitHub URL to the template's `docker-compose.yml`

### Option 2: Manual Deployment

1. Clone this repository
2. Navigate to the desired template directory
3. Copy the `docker-compose.yml` to your Dokploy compose directory
4. Apply the `template.toml` configuration via Dokploy UI

### Option 3: Git-based Deployment

1. In Dokploy, create a new **Compose** project
2. Select **Git** as the source
3. Point to this repository with path `dokploy/blueprints/<template-name>/`
4. Dokploy will automatically detect and deploy the compose file

## Template Development

### Creating a New Template

1. Create a new directory under `blueprints/` with the application name
2. Add required files:
   - `docker-compose.yml` - Standard Docker Compose format
   - `template.toml` - Dokploy-specific configuration
   - `<app-name>.svg` - Logo (optional but recommended)
   - `README.md` - Documentation

3. Follow Dokploy template conventions:
   - Do NOT include `container_name` in compose files
   - DO include explicit `networks` for multi-service communication
   - Use `${variable}` syntax for configurable values
   - Include health checks for all services

### Template Variables

Dokploy supports automatic variable generation:

| Syntax | Description | Example |
|--------|-------------|---------|
| `${domain}` | User-provided domain | `app.example.com` |
| `${password:N}` | Random password of N chars | `${password:32}` |
| `${base64:N}` | Random base64 string of N chars | `${base64:64}` |
| `${uuid}` | Random UUID | `550e8400-e29b-...` |
| `${jwt:secret}` | JWT secret key | Auto-generated |

### Testing Templates

Before submitting a template:

1. Test locally with `docker-compose up -d`
2. Verify all services start and pass health checks
3. Test the application functionality
4. Deploy to Dokploy staging environment
5. Document any manual post-deployment steps

## Contributing

When adding new templates:

1. Follow existing naming conventions
2. Pin all image versions (no `:latest`)
3. Include comprehensive health checks
4. Document resource requirements
5. Test on actual Dokploy instance
6. Update this README with the new template

## Resources

- [Dokploy Documentation](https://docs.dokploy.com/)
- [Dokploy Templates Repository](https://github.com/Dokploy/templates)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)

## Instance Information

- **Dokploy Instance**: https://dokploy.hashgrid.net
- **Environment**: Home Lab
- **Maintainer**: Elvis
