# PowerDNS

Complete DNS infrastructure with authoritative server, recursive resolver, load balancer, and web admin interface.

## Overview

[PowerDNS](https://www.powerdns.com/) is a versatile DNS server software that can operate as an authoritative nameserver, recursive resolver, or DNS load balancer. This template deploys a full-featured DNS infrastructure using the [chrisss404/powerdns](https://github.com/chrisss404/powerdns) Docker images.

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           PowerDNS Stack                │
                    ├─────────────────────────────────────────┤
                    │                                         │
   HTTPS (443)      │  ┌──────────┐     ┌──────────────┐     │
   ─────────────────┼─▶│  admin   │────▶│   admin-db   │     │
   (Web Admin)      │  │ (Web UI) │     │ (PostgreSQL) │     │
                    │  └────┬─────┘     └──────────────┘     │
                    │       │                                 │
                    │       ▼ (API)                          │
                    │  ┌──────────────┐  ┌──────────────┐    │
                    │  │authoritative │──│authoritative │    │
                    │  │  (server)    │  │     -db      │    │
                    │  └──────▲───────┘  │ (PostgreSQL) │    │
                    │         │          └──────────────┘    │
   DNS (53/853)     │  ┌──────┴───────┐                      │
   ─────────────────┼─▶│   dnsdist    │                      │
   (DNS Queries)    │  │(load balancer│                      │
                    │  └──────┬───────┘                      │
                    │         │                               │
                    │         ▼                               │
                    │  ┌──────────────┐                      │
                    │  │   recursor   │                      │
                    │  │  (resolver)  │                      │
                    │  └──────────────┘                      │
                    │                                         │
                    └─────────────────────────────────────────┘
```

## Components

| Service | Description | Port |
|---------|-------------|------|
| **admin** | PowerDNS Admin web interface for zone management | 3031 (HTTPS via Traefik) |
| **admin-db** | PostgreSQL database for admin users/settings | Internal |
| **authoritative** | Authoritative DNS server for your zones | 8081 (API) |
| **authoritative-db** | PostgreSQL database for DNS zones/records | Internal |
| **dnsdist** | DNS load balancer and traffic director | 53 (DNS), 853 (DoT) |
| **recursor** | Recursive DNS resolver for external queries | 8082 (API) |

## Features

- Web-based DNS zone management with PowerDNS Admin
- PostgreSQL backend for reliable zone storage
- DNS load balancing with dnsdist
- Recursive resolution for non-local queries
- Optional DNS-over-TLS (DoT) support
- Optional DNSSEC validation
- API access for automation

## Quick Start

1. Deploy this template in Dokploy
2. Set your admin domain (e.g., `dns.example.com`)
3. Access PowerDNS Admin at `https://dns.example.com`
4. Create your first DNS zone
5. Point your domain registrar to use ports 53/853 for DNS

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Admin UI domain (e.g., `dns.example.com`) |
| `ADMIN_DB_PASSWORD` | Admin database password (auto-generated) |
| `AUTH_DB_PASSWORD` | Authoritative database password (auto-generated) |
| `PDNS_API_KEY` | API key for PowerDNS Admin ↔ Authoritative (auto-generated) |
| `SECRET_KEY` | Flask session secret key (auto-generated) |

### DNS Ports

| Variable | Default | Description |
|----------|---------|-------------|
| `DNS_PORT` | `53` | Standard DNS port (TCP/UDP) |
| `DOT_PORT` | `853` | DNS-over-TLS port |

**Note**: Port 53 typically requires root privileges or special capabilities. If port 53 is already in use (e.g., by systemd-resolved), change `DNS_PORT` to an alternative like `5353`.

### Optional Features

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_DOT` | `no` | Enable DNS-over-TLS on port 853 |
| `ENABLE_DNSSEC` | `off` | Enable DNSSEC validation (`validate`) |
| `WEBSERVER_PASSWORD` | (empty) | Password for web API endpoints |
| `FORWARD_ZONES` | (empty) | Zones to forward to authoritative |

## Post-Deployment Setup

### 1. Access PowerDNS Admin

1. Navigate to `https://your-domain.com`
2. Create an admin account on first access
3. Log in with your new credentials

### 2. Configure API Connection

The template automatically configures the Admin UI to connect to the Authoritative server. Verify the connection:

1. Go to **Settings** → **PDNS Settings**
2. Confirm API URL is `http://authoritative:8081`
3. Test the connection

### 3. Create Your First Zone

1. Go to **Dashboard** → **New Domain**
2. Enter your zone name (e.g., `example.com`)
3. Select zone type (Native for single server)
4. Add DNS records (A, AAAA, MX, etc.)

### 4. Configure DNS Clients

Point your clients or domain registrar to use your PowerDNS server:

```
DNS Server: your-server-ip:53
DNS-over-TLS: your-server-ip:853 (if enabled)
```

## Port 53 Conflicts

If port 53 is already in use (common with systemd-resolved on Ubuntu/Debian):

### Option 1: Disable systemd-resolved

```bash
sudo systemctl disable systemd-resolved
sudo systemctl stop systemd-resolved
sudo rm /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

### Option 2: Use Alternative Port

Change `DNS_PORT` to `5353` and configure clients accordingly.

### Option 3: Configure systemd-resolved

Edit `/etc/systemd/resolved.conf`:
```ini
[Resolve]
DNSStubListener=no
```

Then restart: `sudo systemctl restart systemd-resolved`

## DNS-over-TLS (DoT) Setup

To enable encrypted DNS:

1. Set `ENABLE_DOT=yes` in environment
2. Configure TLS certificates (requires additional setup)
3. Clients connect to port 853

**Note**: DoT requires valid TLS certificates. For production use, consider using a reverse proxy with Let's Encrypt or Cloudflare.

## Troubleshooting

### "Connection refused" on port 53

- Check if another service is using port 53: `sudo lsof -i :53`
- Verify dnsdist container is running: `docker ps | grep dnsdist`
- Check dnsdist logs: `docker logs <dnsdist-container>`

### "API connection failed" in Admin UI

- Verify authoritative server is healthy
- Check API key matches in both services
- Review authoritative logs for errors

### Zones not resolving

- Ensure zone is marked as "Active" in Admin UI
- Verify SOA and NS records are correct
- Check forward zones configuration if using custom forwarding

### Database connection errors

- Verify database containers are healthy
- Check password variables match between app and database
- Review PostgreSQL logs for authentication issues

## Resource Requirements

| Component | Memory | CPU |
|-----------|--------|-----|
| admin | 256MB | 0.5 cores |
| admin-db | 128MB | 0.25 cores |
| authoritative | 128MB | 0.5 cores |
| authoritative-db | 128MB | 0.25 cores |
| dnsdist | 64MB | 0.25 cores |
| recursor | 128MB | 0.5 cores |
| **Total** | ~850MB | ~2.25 cores |

## Security Considerations

- Admin UI is exposed via HTTPS only
- Databases are internal-only (not exposed)
- API keys are auto-generated with high entropy
- Consider firewall rules to restrict DNS port access
- Enable DNSSEC validation for secure resolution

## Links

- [PowerDNS Documentation](https://doc.powerdns.com/)
- [PowerDNS Admin Documentation](https://github.com/PowerDNS-Admin/PowerDNS-Admin)
- [dnsdist Documentation](https://dnsdist.org/)
- [Docker Images Repository](https://github.com/chrisss404/powerdns)
- [Docker Hub](https://hub.docker.com/r/chrisss404/powerdns)

## Version

- **Template**: 1.0.0
- **PowerDNS Authoritative**: 4.9.3
- **PowerDNS Recursor**: 5.1.3
- **dnsdist**: 1.9.8
- **PostgreSQL**: 16-alpine
