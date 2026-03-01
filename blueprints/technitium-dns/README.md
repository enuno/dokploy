# Technitium DNS Server - Production-Ready Dokploy Template

> Authoritative + recursive DNS server with clustering, ad-blocking, and Cloudflare integration for mining operations and edge data centers.

**Official:** https://github.com/TechnitiumSoftware/DnsServer
**Documentation:** https://docs.technitium.com/
**Template:** [View Source](docker-compose.yml)

---

## Overview

Technitium DNS Server is a free, open-source DNS server supporting both recursive (resolver) and authoritative (zone hosting) modes. This production-ready Dokploy template enables three deployment scenarios:

- **Home/Office** — Single instance for local network DNS with ad-blocking (5 min setup)
- **Clustered** — Primary/Secondary across multiple mining sites with R2 backups + Tunnel (10-15 min per node)
- **Cloud/Public DNS** — HA authoritative DNS with DoT/DoH and hourly backups (20-30 min)

### Key Features

✅ **Single docker-compose.yml** — Environment-driven presets (no duplication)
✅ **Primary/Secondary Clustering** — Zone replication via catalog zones (no shared storage SPOF)
✅ **Cloudflare Integration** — R2 backups, Tunnel remote access, DNS-01 SSL
✅ **Ad-Blocking** — Built-in blocklist support for privacy-focused DNS
✅ **DNSSEC** — Full DNSSEC signing + key replication in cluster
✅ **Health Checks** — DNS port 53 + admin console monitoring
✅ **Traefik HTTPS** — Let's Encrypt SSL for admin console (port 5380)

---

## Architecture

### Home/Office Deployment

```
┌─────────────────────────────────────┐
│  Local Network                      │
│                                     │
│  ┌──────────────────────┐           │
│  │   Technitium DNS     │           │
│  │  (Primary)           │           │
│  │  Port 53 (TCP/UDP)   │           │
│  │  Port 5380 (Admin)   │           │
│  └──────────────────────┘           │
│          ▲                          │
│          │                          │
│  DNS queries from clients           │
│                                     │
└─────────────────────────────────────┘
        │
        ▼ (HTTPS via Traefik + Let's Encrypt)
┌─────────────────────────────────────┐
│  Admin Console                      │
│  https://dns.yourdomain.com         │
└─────────────────────────────────────┘
```

### Clustered Deployment (Primary + Secondary)

```
┌─────────────────────────────────────────────────────────┐
│  Mining Site 1                                          │
│                                                         │
│  ┌──────────────────┐         ┌─────────────────────┐  │
│  │ Technitium       │         │ Cloudflare Tunnel   │  │
│  │ Primary Node     │◄────────│ (Remote Mgmt)       │  │
│  │ (Zone Master)    │         │                     │  │
│  └──────────────────┘         └─────────────────────┘  │
│         │                                               │
│         │ DNS Zone Transfers (AXFR/IXFR)              │
│         │ Catalog Zone Auto-Sync                       │
│         │                                               │
│         ▼                                               │
└─────────────────────────────────────────────────────────┘
         │
         │ AXFR/IXFR + DNS NOTIFY
         │
┌─────────────────────────────────────────────────────────┐
│  Mining Site 2 (or failover location)                  │
│                                                         │
│  ┌──────────────────┐         ┌─────────────────────┐  │
│  │ Technitium       │◄────────│ Cloudflare Tunnel   │  │
│  │ Secondary Node   │         │ (Remote Mgmt)       │  │
│  │ (Zone Replica)   │         │                     │  │
│  └──────────────────┘         └─────────────────────┘  │
│         │                                               │
│         │ Serves DNS queries                           │
│         │ Continuous zone sync                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │
         ▼
    ┌──────────────┐
    │   Cloudflare │
    │   R2 Backup  │
    │   (Daily)    │
    └──────────────┘
```

### Cloud/Public DNS Deployment

```
┌──────────────────────────────────────────────────────────┐
│  Authoritative DNS Infrastructure                        │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Technitium  │  │ Technitium  │  │ Technitium  │     │
│  │ Primary (1) │  │ Secondary(2)│  │ Secondary(3)│     │
│  │ DoT/DoH     │  │ DoT/DoH     │  │ DoT/DoH     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│       │                 │                 │              │
│       └─────────────────┼─────────────────┘              │
│                         │                               │
│        Zone Replication via Catalog Zones               │
│                                                          │
└──────────────────────────────────────────────────────────┘
         │
         ├──► Cloudflare Tunnel (Remote Admin Access)
         ├──► Cloudflare R2 (Hourly Backups)
         └──► Traefik + Let's Encrypt (HTTPS Admin)
```

---

## Quick Start by Preset

### Home/Office Setup (5 minutes)

1. **Deploy template:**
   ```bash
   # Select "home-office" preset in Dokploy
   # Set only DOMAIN and TECHNITIUM_ADMIN_PASSWORD
   DOMAIN=dns.local
   TECHNITIUM_ADMIN_PASSWORD=YourSecurePassword123!
   ```

2. **Access admin console:**
   ```
   https://dns.local (if DNS resolution works locally)
   Or: https://<docker-host>:5380 (direct IP)
   ```

3. **Configure forwarders (optional):**
   - Admin Console → Forwarders
   - Add: 1.1.1.1 (Cloudflare) or 8.8.8.8 (Google)

4. **Enable ad-blocking:**
   - Admin Console → Block Lists
   - Add recommended blocklists (Adblock, StevenBlack, etc.)

### Clustered Primary Setup (10-15 minutes)

1. **Create Cloudflare Tunnel token:**
   ```
   Cloudflare Dashboard → Zero Trust → Networks → Tunnels
   → Create tunnel → Copy token
   ```

2. **Create R2 bucket and credentials:**
   ```
   Cloudflare Dashboard → R2 → Create bucket
   → Manage R2 API Tokens → Generate token (Read & Write)
   ```

3. **Deploy primary node with preset:**
   ```bash
   DOMAIN=dns.mining1.com
   TECHNITIUM_ADMIN_PASSWORD=StrongPassword123!
   CF_TUNNEL_TOKEN=eyJhIjoie...          # From step 1
   R2_BUCKET_NAME=technitium-backups
   R2_ACCESS_KEY_ID=abc123def456
   R2_SECRET_ACCESS_KEY=...
   CF_ACCOUNT_ID=1234567890abcdef
   TECHNITIUM_NODE_ROLE=primary
   ```

4. **Initialize cluster (via Admin Console):**
   - Admin Console → Cluster Page
   - Click "Initialize Cluster"
   - Configure catalog zone: `cluster.<dns.mining1.com>`

### Clustered Secondary Setup (10 minutes)

1. **Deploy secondary node with preset:**
   ```bash
   DOMAIN=dns.mining2.com
   TECHNITIUM_ADMIN_PASSWORD=StrongPassword123!
   TECHNITIUM_NODE_ROLE=secondary
   PRIMARY_NODE_IP=<primary-node-internal-ip>
   # (Same R2 and Tunnel credentials as primary)
   ```

2. **Join cluster (via Admin Console):**
   - Admin Console → Cluster Page
   - Click "Join Cluster"
   - Enter: Primary Node Address + Admin Password
   - Wait for zones to sync (1-5 minutes depending on zone count)

### Cloud/Public DNS Setup (20-30 minutes)

1. **Complete steps 1-2 from Clustered Primary**

2. **Deploy with cloud-authoritative preset:**
   ```bash
   DNS_OVER_TLS_ENABLED=true
   DNS_OVER_HTTPS_ENABLED=true
   BACKUP_INTERVAL=3600              # Hourly instead of daily
   # (All other variables same as Clustered Primary)
   ```

3. **Configure public zone (via Admin Console):**
   - Admin Console → Zones → Add Zone
   - Type: Primary (Authoritative)
   - Zone Name: your-public-domain.com
   - Configure NS records pointing to your DNS servers

4. **Verify propagation:**
   ```bash
   # Check NS records
   dig NS your-public-domain.com

   # Test DNS resolution
   dig @<your-dns-server> your-public-domain.com

   # Verify DoT (DNS over TLS)
   kdig -d @<your-dns-server> +tls your-public-domain.com
   ```

---

## Cloudflare Integration Guide

### R2 Backup Configuration

Technitium data is synced to R2 daily (Clustered) or hourly (Cloud). This provides:
- ✅ Versioned backups for disaster recovery
- ✅ Off-site storage without egress costs
- ✅ Easy zone migration between deployments

**Setup Steps:**

1. **Create R2 Bucket:**
   ```
   Cloudflare Dashboard → R2 → Create Bucket
   Name: technitium-backups
   Region: Automatic
   ```

2. **Generate API Credentials:**
   ```
   R2 → Manage R2 API Tokens → Create Token
   Token Name: technitium-backup
   Permissions: Object Read & Write
   TTL: No expiry
   Copy: Access Key ID & Secret Access Key
   ```

3. **Configure in Dokploy:**
   ```
   R2_BUCKET_NAME: technitium-backups
   R2_ACCESS_KEY_ID: [from step 2]
   R2_SECRET_ACCESS_KEY: [from step 2]
   CF_ACCOUNT_ID: [from Cloudflare Dashboard URL: api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}]
   R2_BACKUP_ENABLED: true
   ```

4. **Verify backup:**
   ```bash
   # Check rclone logs
   docker logs technitium-rclone

   # Should show: "Backup completed successfully"
   # Check R2 via dashboard: R2 → technitium-backups → should see /technitium folder
   ```

### Cloudflare Tunnel for Remote Admin Access

Securely access admin console from anywhere without exposing port 5380:

1. **Create Tunnel:**
   ```
   Cloudflare Dashboard → Zero Trust → Networks → Tunnels
   → Create Tunnel (Quick Tunnel) → Copy token
   ```

2. **Configure in Dokploy:**
   ```
   CLOUDFLARE_TUNNEL_ENABLED: true
   CF_TUNNEL_TOKEN: eyJhIjoie... [from step 1]
   ```

3. **Access remotely:**
   ```
   https://dns.yourdomain.com → routes to Tunnel → localhost:5380
   Authentication via Cloudflare + your auth method (password/2FA)
   ```

### DNS-01 Challenge for Wildcard Certificates (Optional)

For wildcard SSL certificates (*.yourdomain.com):

1. **Create DNS API Token:**
   ```
   Cloudflare → Profile → API Tokens → Create Token
   Template: Edit Zone DNS
   Permissions: Zone → DNS → Edit
   Zone Resources: Include → [your-domain.com]
   ```

2. **Configure Traefik (via Dokploy environment or Traefik config):**
   ```
   CF_DNS_API_TOKEN: [from step 1]
   # Traefik will use this for DNS-01 challenge
   ```

---

## Clustering Deep Dive

### How Primary/Secondary Works

Technitium uses **catalog zones** for automatic zone discovery and replication:

1. **Primary Node:**
   - Hosts all DNS zones
   - Creates `cluster.<domain>` catalog zone
   - Responds to zone transfer requests (AXFR/IXFR)
   - Sends DNS NOTIFY when zones change

2. **Secondary Node:**
   - Subscribes to catalog zone
   - Automatically receives list of zones to replicate
   - Performs zone transfers (AXFR/IXFR) on schedule
   - Receives DNSSEC keys automatically
   - Serves DNS queries for all replicated zones

3. **Zone Replication:**
   ```
   Primary (zone master) ──AXFR/IXFR──► Secondary (zone replica)
                         ◄──DNS NOTIFY──
                             (zone updated)
   ```

### Adding a New Secondary to Cluster

1. **Deploy secondary node** (see Quick Start above)
2. **In Secondary Admin Console:**
   - Cluster Page → Join Cluster
   - Primary Address: `<primary-internal-ip>:53`
   - Primary Admin Password: `<primary-admin-password>`
   - Click Join
3. **Verify zones synced:**
   - Wait 1-5 minutes (depends on zone count)
   - Check: Zone List page should show all zones from primary

### Failover Procedure (Primary Down)

If primary node fails:

1. **Promote a secondary to primary:**
   - Secondary Admin Console → Cluster Page
   - Click "Promote to Primary"
   - New primary becomes zone master
   - Restart: Secondary nodes re-sync from new primary

2. **Add replacement secondary:**
   - Deploy new secondary node
   - Join to current primary
   - Zone sync begins automatically

---

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DOMAIN` | Yes | — | Admin console domain (e.g., dns.yourdomain.com) |
| `TECHNITIUM_ADMIN_PASSWORD` | Yes | — | Initial admin password (32+ chars recommended) |
| `TECHNITIUM_NODE_ROLE` | No | primary | `primary` or `secondary` |
| `PRIMARY_NODE_IP` | (if secondary) | — | Primary node IP address (for secondary join) |
| `LOG_LEVEL` | No | info | `debug`, `info`, `warning`, `error` |
| `CLOUDFLARE_TUNNEL_ENABLED` | No | false | Enable Tunnel for remote access |
| `CF_TUNNEL_TOKEN` | (if Tunnel) | — | Cloudflare Tunnel token |
| `R2_BACKUP_ENABLED` | No | false | Enable R2 backups (Clustered/Cloud only) |
| `R2_BUCKET_NAME` | No | technitium-backups | R2 bucket name |
| `R2_ACCESS_KEY_ID` | (if R2) | — | R2 API access key |
| `R2_SECRET_ACCESS_KEY` | (if R2) | — | R2 API secret key |
| `CF_ACCOUNT_ID` | (if R2) | — | Cloudflare account ID |
| `BACKUP_INTERVAL` | No | 86400 | Backup interval in seconds (86400=1d, 3600=1h) |
| `DNS_OVER_TLS_ENABLED` | No | false | Enable DNS-over-TLS (DoT) |
| `DNS_OVER_HTTPS_ENABLED` | No | false | Enable DNS-over-HTTPS (DoH) |

---

## Post-Deployment Checklist

- [ ] **Change admin password** — Set strong password (32+ chars with symbols)
- [ ] **Configure forwarders** — Add upstream DNS servers (1.1.1.1 or 8.8.8.8)
- [ ] **Enable ad-blocking** — Add blocklists (Adblock, StevenBlack, etc.)
- [ ] **Test DNS resolution** — Query the server from local machine
- [ ] **Verify R2 backups** (if enabled) — Check logs: `docker logs technitium-rclone`
- [ ] **Test Tunnel access** (if enabled) — Access admin console remotely
- [ ] **Configure DNSSEC** (if public DNS) — Generate keys: Admin → DNSSEC
- [ ] **Setup monitoring** — Monitor port 53 and admin console health
- [ ] **Test failover** (if clustered) — Stop primary, verify secondaries serve zones
- [ ] **Document configuration** — Keep backup of zones and settings

---

## Troubleshooting

### Zones Not Replicating (Clustered)

**Symptom:** Secondary node doesn't show zones from primary
**Diagnosis:** Check cluster connectivity
```bash
# From secondary console
dig @<primary-ip> cluster.<your-domain> AXFR
# Should return catalog zone entries
```
**Solution:**
- Verify PRIMARY_NODE_IP is correct (internal IP, not hostname)
- Check: Admin Password matches primary
- Firewall: Allow port 53 TCP/UDP from secondary to primary

### R2 Backup Fails

**Symptom:** `docker logs technitium-rclone` shows errors
**Diagnosis:** Check credentials
```bash
# View last backup log
docker exec technitium-rclone tail -20 /logs/backup-*.log
```
**Solution:**
- Verify R2 credentials: Access Key ID, Secret Key
- Verify CF_ACCOUNT_ID in URL: `https://{CF_ACCOUNT_ID}.r2.cloudflarestorage.com`
- Check bucket name exists
- Grant R2 API token object read/write permissions

### Admin Console Not Accessible via HTTPS

**Symptom:** `https://dns.yourdomain.com` shows certificate error
**Diagnosis:** Let's Encrypt certificate not issued
```bash
# Check Traefik logs
docker logs traefik
```
**Solution:**
- Verify DOMAIN resolves to Dokploy host
- Check firewall: Allow 80 (HTTP acme challenge) and 443
- Wait 5-10 minutes for certificate issuance
- Refresh browser cache (Ctrl+Shift+R)

### Secondary Node Won't Join Cluster

**Symptom:** Error joining cluster in admin console
**Diagnosis:** Network or authentication issue
**Solution:**
- Verify primary is reachable: `ping <primary-ip>`
- Verify DNS port: `nc -zv <primary-ip> 53`
- Confirm admin password matches
- Check primary is in ROLE=primary (not secondary)
- Restart secondary container and retry

---

## Advanced: Performance Tuning

### Large Zone Databases (1000+ zones)

- **Increase start_period** in healthcheck (DNS server needs time to load)
- **Allocate more memory** — 2GB minimum, 4GB+ recommended for 10K+ zones
- **Enable zone caching** — Admin Console → Options → Zone Caching

### High Query Rate Optimization

- **Enable UDP query caching** — Admin Console → Options → Query Caching
- **Use ` DoH (DNS-over-HTTPS)` — Reduces per-query overhead
- **Add secondary nodes** — Distribute query load across cluster

### R2 Backup Performance

- **Increase BACKUP_INTERVAL** if backup times exceed 1 hour
- **Monitor rclone logs** — Check transfer rates
- **Use rclone parallel transfers** — Edit rclone.conf for multi-threaded sync

---

## Update Procedures

### Updating to New Technitium Version

1. **Check upstream releases:** https://github.com/TechnitiumSoftware/DnsServer/releases
2. **Update docker-compose.yml image tag** (e.g., `14.3` → `14.4`)
3. **Redeploy:**
   ```bash
   docker compose pull
   docker compose up -d --no-deps --build technitium
   ```
4. **Verify:** Admin Console loads + zones accessible
5. **For clustered setups:** Update secondaries one at a time (maintain availability)

---

## Support & Resources

- **GitHub:** https://github.com/TechnitiumSoftware/DnsServer
- **Official Docs:** https://docs.technitium.com
- **Community:** GitHub Discussions
- **Issues:** Report bugs via GitHub Issues

---

## Production Checklist (15 items)

Before running in production:

- [ ] Backup zones regularly (R2 enabled or manual exports)
- [ ] Configure alerting on DNS query failures (monitoring outside this template)
- [ ] Set strong admin password (32+ chars, symbols, numbers)
- [ ] Enable DNSSEC for all zones (if public DNS)
- [ ] Test zone transfer to secondary nodes (if clustered)
- [ ] Verify failover procedure works (stop primary, check secondaries)
- [ ] Monitor R2 backup logs (hourly for Cloud, daily for Clustered)
- [ ] Set log level to `warning` or `error` (reduce noise in production)
- [ ] Document all configuration changes (for disaster recovery)
- [ ] Schedule regular backups from R2 (download monthly to cold storage)
- [ ] Test zone restoration from R2 backup (monthly procedure)
- [ ] Monitor disk space (zone database growth)
- [ ] Review admin console logs monthly (audit access, changes)
- [ ] Plan failover runbook (documented procedures)
- [ ] Test failover at least quarterly (validates procedures)

---

**Version:** 1.0.0
**Last Updated:** 2026-03-01
**Maintainer:** Dokploy Community
**License:** MIT (Technitium DNS Server © Shreyas Zare)
