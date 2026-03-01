# Technitium DNS Server Dokploy Template - Design Document

**Date:** March 1, 2026
**Status:** APPROVED
**Author:** Brainstorming & Design Phase
**Use Case:** DNS infrastructure for Ryno Crypto Mining + ServerDomes Edge Data Centers

---

## Executive Summary

A production-ready Dokploy template for Technitium DNS Server (v14.3) supporting three deployment scenarios via configuration presets:
- **Home/Office** — Single instance, local network DNS with ad-blocking
- **Clustered** — Primary/Secondary across multiple mining sites with R2 backups + Cloudflare Tunnel
- **Cloud/Public DNS** — High-availability authoritative DNS with full Cloudflare stack integration

**Key Strategic Decisions:**
1. Single `docker-compose.yml` with environment-driven behavior (no duplication)
2. Primary/Secondary clustering via Technitium's native catalog zones (no shared storage SPOF)
3. R2 backups preset-specific (Clustered/Cloud only) to minimize friction for simple deployments
4. Cloudflare Tunnel for secure remote management across geographically distributed mining facilities
5. Traefik reverse proxy for admin console HTTPS in all presets

---

## Design Rationale

### Deployment Scenarios

#### 1. Home/Office Preset
**Target:** Small networks, ad-blocking, privacy-focused DNS

- Single Technitium instance on internal Docker bridge
- Traefik reverse proxy → admin console HTTPS (Let's Encrypt)
- Local persistent volume for config/zones
- No R2 backup (optional manual backup via README guide)
- No Cloudflare Tunnel (admin console only accessible locally)
- **Setup time:** 5 minutes
- **Friction:** Minimal (no external credentials required)

#### 2. Clustered Preset
**Target:** Ryno Crypto Mining operations across multiple facilities

- Primary node: hosts zones, manages catalog zone, controls cluster
- Secondary node(s): replicate zones via AXFR/IXFR with DNS NOTIFY
- Zones sync via Technitium's native catalog zones (no shared storage)
- rclone sidecar syncs `/etc/dns` to R2 daily at 02:00 UTC
- Cloudflare Tunnel for secure remote access to primary's admin console
- Health checks: DNS port 53 + admin UI port 5380
- **Network topology:** Each node independent, synced via DNS protocol
- **Resilience:** Zone data replicated across nodes; if primary fails, secondaries continue serving; R2 provides disaster recovery
- **Setup time:** 10-15 minutes per node

#### 3. Cloud/Public DNS Preset
**Target:** ServerDomes customer-facing authoritative DNS

- Multi-instance primary/secondary HA setup
- DNS-over-TLS, DNS-over-HTTPS, DNS-over-QUIC support
- rclone backup runs hourly (vs daily for Clustered)
- Cloudflare Tunnel for management + optional Workers for API authentication
- Full monitoring runbook + failover procedures
- **Setup time:** 20-30 minutes

### Cloudflare Integration (Option E: A + B + D)

| Service | Purpose | Presets | Why |
|---------|---------|---------|-----|
| **Tunnel (A)** | Encrypted remote access to cluster admin console | Clustered, Cloud | Secure management across mining sites without exposing admin ports |
| **R2 (B)** | Versioned zone/config backups | Clustered, Cloud | Disaster recovery, infrastructure-as-code patterns, zero egress fees |
| **Traefik HTTPS (D)** | Admin console HTTPS via Let's Encrypt | All | Standard reverse proxy, Dokploy-native, no Cloudflare dependency |
| **Workers (C)** | Optional API gateway + auth | Cloud only | For multi-tenant DNS-as-a-Service (skip for internal mining infra) |

**Philosophy:** Privacy-first. No DNS query data transits Cloudflare—only management traffic uses Tunnel. R2 can use encryption-at-rest with customer-managed keys.

### Clustering Strategy: Primary/Secondary + Catalog Zones

**Why not shared storage (NFS)?**
- Shared storage creates a single point of failure (SPOF) and network latency
- Contradicts distributed mining/edge data center philosophy
- Technitium's native clustering already solves this via DNS zone transfers

**Why Primary/Secondary + Catalog Zones?**
- Industry-standard DNS HA pattern (AXFR/IXFR with DNS NOTIFY)
- Technitium's clustering feature builds on catalog zones for automatic provisioning
- Each node runs independently, zones sync via DNS protocol (no shared disk)
- Secondaries automatically discover zones from the catalog zone on primary
- DNSSEC keys replicate automatically with zones

**Implementation:**
- All nodes share only basic config (domain, logging, TZ) via environment variables
- Nodes do NOT share persistent volumes (no `/etc/dns` NFS)
- Primary hosts zones and the `cluster-catalog.<cluster-domain>` zone
- Secondaries subscribe to catalog zone, receive zones + DNSSEC keys automatically
- Zone transfers happen over standard DNS protocol (no custom replication logic)

---

## Architecture

### File Structure

```
blueprints/technitium-dns/
├── docker-compose.yml           # Single compose for all presets (env-driven)
├── template.toml                # 4 presets (Home, Clustered-Primary, Clustered-Secondary, Cloud)
├── rclone.conf.template         # R2 sync config (filled via env vars)
├── healthcheck.sh               # DNS port 53 + admin UI health checks
└── README.md                    # 350+ lines:
    ├── Architecture diagrams (ASCII)
    ├── Preset quick-start (5 min each)
    ├── Cloudflare Tunnel setup (step-by-step)
    ├── R2 backup configuration and verification
    ├── Primary/Secondary cluster configuration guide
    ├── Zone replication via catalog zones
    ├── Migration path (Home → Clustered → Cloud)
    ├── Failover + monitoring runbook
    ├── Performance tuning for large zone databases
    └── Troubleshooting by scenario
```

### docker-compose.yml Behavior

**Preset-Driven:**
- Single `docker-compose.yml` works for all 4 presets
- Environment variables control behavior:
  - `TECHNITIUM_NODE_ROLE` → `primary` or `secondary`
  - `R2_BACKUP_ENABLED` → `true` or `false`
  - `BACKUP_INTERVAL` → `86400` (daily) or `3600` (hourly)
  - `CLOUDFLARE_TUNNEL_ENABLED` → `true` or `false`

**rclone Sidecar:**
- Only created when `R2_BACKUP_ENABLED=true` (Clustered/Cloud presets)
- Mounts Technitium's `/etc/dns` volume read-only
- Runs `rclone sync` on schedule (daily for Clustered, hourly for Cloud)
- Logs to `/logs/backup-YYYY-MM-DD.log`
- Healthcheck verifies no errors in latest log

**Health Checks:**
```yaml
technitium:
  healthcheck:
    test: ["CMD-SHELL", "nc -z localhost 53 || exit 1"]
    interval: 30s
    timeout: 5s
    retries: 3
    start_period: 20s
```

---

## Configuration: template.toml

### Variables Section
```toml
[variables]
domain = "${domain:?Set admin console domain}"
admin_password = "${password:32}"
dns_server_domain = "${dns_server_domain:-ns1.local}"

# Cloudflare Tunnel (if enabled)
cf_tunnel_token = ""

# R2 Backup (if enabled)
r2_account_id = ""
r2_bucket_name = "technitium-backups"
r2_access_key_id = ""
r2_secret_access_key = ""
```

### Presets

**Preset 1: Home/Office** (Default)
```toml
[[presets]]
name = "home-office"
description = "Single DNS server for local network with ad-blocking"
# No R2, no Tunnel
[env]
TECHNITIUM_NODE_ROLE = "primary"
R2_BACKUP_ENABLED = "false"
CLOUDFLARE_TUNNEL_ENABLED = "false"
```

**Preset 2: Clustered - Primary Node**
```toml
[[presets]]
name = "clustered-primary"
description = "Primary node of a Technitium cluster across mining sites"
# R2 daily backups + Tunnel for remote management
[env]
TECHNITIUM_NODE_ROLE = "primary"
R2_BACKUP_ENABLED = "true"
BACKUP_INTERVAL = "86400"
CLOUDFLARE_TUNNEL_ENABLED = "true"
CLOUDFLARE_TUNNEL_TOKEN = "${cf_tunnel_token:?Set Cloudflare Tunnel token}"
```

**Preset 3: Clustered - Secondary Node**
```toml
[[presets]]
name = "clustered-secondary"
description = "Secondary node joining an existing Technitium cluster"
# Same R2 + Tunnel, but ROLE=secondary
[env]
TECHNITIUM_NODE_ROLE = "secondary"
PRIMARY_NODE_IP = "${primary_node_ip:?Set primary node IP}"
R2_BACKUP_ENABLED = "true"
BACKUP_INTERVAL = "86400"
CLOUDFLARE_TUNNEL_ENABLED = "true"
```

**Preset 4: Cloud/Public DNS**
```toml
[[presets]]
name = "cloud-authoritative"
description = "Public authoritative DNS server with HA and monitoring"
# R2 hourly + full Cloudflare stack
[env]
TECHNITIUM_NODE_ROLE = "primary"
R2_BACKUP_ENABLED = "true"
BACKUP_INTERVAL = "3600"
CLOUDFLARE_TUNNEL_ENABLED = "true"
DNS_OVER_TLS_ENABLED = "true"
DNS_OVER_HTTPS_ENABLED = "true"
```

---

## Validation Checklist (Phase 4)

### YAML/TOML Syntax
- ✅ `docker-compose.yml` is valid YAML
- ✅ `template.toml` is valid TOML
- ✅ All preset variables interpolate correctly
- ✅ rclone sidecar condition syntax valid

### Technitium Configuration
- ✅ Image pinned to version 14.3 (no `:latest`)
- ✅ Admin password uses `${password:32}` generator
- ✅ R2 credentials use `${VAR:?error}` syntax
- ✅ Cloudflare Tunnel token required only when enabled

### Security
- ✅ No hardcoded secrets in compose or template files
- ✅ Health checks don't expose sensitive data
- ✅ R2 bucket configured with `acl = private`
- ✅ Tunnel traffic is end-to-end encrypted
- ✅ Admin console requires password (no default)

### Network Topology
- ✅ Two networks: `dns-internal` (bridge) + `dokploy-network` (external)
- ✅ Technitium on both networks (internal for clustering, external for Traefik)
- ✅ DNS port 53 exposed (UDP + TCP)
- ✅ Admin port 5380 only accessible via Traefik (HTTPS)

### Clustering
- ✅ Primary/Secondary distinction via `TECHNITIUM_NODE_ROLE` env var
- ✅ Primary node can initialize cluster via UI (Cluster page)
- ✅ Secondary nodes require `PRIMARY_NODE_IP` to join
- ✅ Catalog zones documented in README

### Backup (R2)
- ✅ rclone sidecar only created when `R2_BACKUP_ENABLED=true`
- ✅ Backup container mounts technitium volume read-only
- ✅ rclone config via environment variables (not hardcoded)
- ✅ Daily schedule for Clustered, hourly for Cloud
- ✅ Health check verifies backup success

### Monitoring
- ✅ Health checks on DNS port 53 (primary health indicator)
- ✅ Health checks on admin UI port 5380 (secondary indicator)
- ✅ rclone sidecar healthcheck verifies backup didn't error
- ✅ Dokploy integration surfaces unhealthy containers

---

## Documentation Plan (Phase 5)

README.md will include:

1. **Overview** — 50 lines
   - What is Technitium DNS
   - Key features (recursive + authoritative, clustering, encrypted DNS)
   - Use cases (mining operations, edge data centers, public DNS)

2. **Architecture Diagrams** — 80 lines (ASCII)
   - Home/Office: single instance + Traefik
   - Clustered: primary + secondary + R2 backup + Tunnel
   - Cloud: HA setup + monitoring

3. **Preset Quick-Start** — 150 lines
   - Home/Office: 5-minute setup
   - Clustered-Primary: 10-minute setup
   - Clustered-Secondary: join existing cluster
   - Cloud: full HA deployment

4. **Cloudflare Integration Guides** — 200 lines
   - Tunnel setup (remote admin access)
   - R2 backup configuration (zone versioning)
   - DNS record setup for public deployments
   - Zero Trust Access (optional for admin panel)

5. **Clustering Guide** — 150 lines
   - How primary/secondary works
   - Creating catalog zones
   - Adding secondaries to cluster
   - Zone replication verification
   - Promoting secondary to primary (failover)

6. **Migration Path** — 80 lines
   - Home → Clustered upgrade path
   - Clustered → Cloud scaling
   - Data migration between deployments

7. **Failover & Monitoring Runbook** — 120 lines
   - Primary failure detection
   - Promoting secondary to primary
   - R2 backup verification
   - DNS query rate monitoring
   - Performance tuning (large zones, many clients)

8. **Troubleshooting** — 150 lines
   - Zones not replicating (catalog zone issues)
   - Secondary not joining cluster
   - Backup failures (R2 credentials)
   - DNS port conflicts
   - Admin console connection issues

9. **Post-Deployment Checklist** — 50 lines
   - Verify admin password changed
   - Configure forwarders (upstream DNS)
   - Enable block lists (ad-blocking)
   - Test failover scenario

---

## Success Metrics

### Quality
- ✅ All validation checks pass (Phase 4)
- ✅ README is >300 lines with examples and diagrams
- ✅ Preset documentation is complete and self-contained
- ✅ Cloudflare Tunnel setup is step-by-step, repeatable

### Completeness
- ✅ 3 deployment scenarios covered (Home, Clustered, Cloud)
- ✅ Primary/Secondary clustering documented
- ✅ R2 backup configuration with verification steps
- ✅ Failover and monitoring runbook included

### Usability
- ✅ Each preset has <10 minute quick-start
- ✅ Migration paths documented (Home → Clustered → Cloud)
- ✅ Troubleshooting covers 90%+ of common issues
- ✅ Cloudflare setup is not a blocker (optional for Home preset)

---

## Next Steps

1. **Phase 3: Generation** — Use 6 progressive Dokploy skills to generate files
2. **Phase 4: Validation** — Run security + convention checks
3. **Phase 5: Documentation** — Write comprehensive README
4. **Phase 6: Index Update** — Add to blueprints/README.md in alphabetical order
5. **Final: Git Commit & PR** — Create feature branch, commit, push, open PR

---

## Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Single `docker-compose.yml` | Simplicity + environment-driven behavior | Separate compose per preset (rejected: duplication) |
| Primary/Secondary clustering | No shared storage SPOF, industry standard DNS pattern | Shared NFS (rejected: single point of failure) |
| Preset-specific R2 backup | Avoid friction for simple deployments | R2 in all presets (rejected: adds cost/complexity for Home users) |
| Cloudflare Tunnel for management | Secure remote access without exposing ports | Basic auth (rejected: less secure); VPN (rejected: complexity) |
| Traefik HTTPS | Dokploy-native, Let's Encrypt built-in | Cloudflare SSL (rejected: unnecessary for admin-only console) |

---

**Design Status:** ✅ **APPROVED**
**Ready for:** Phase 3 Generation (Skills Loading) + Phase 4 Validation
