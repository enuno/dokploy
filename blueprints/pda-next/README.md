# PDA-Next

Next-generation PowerDNS Admin with advanced management and monitoring capabilities.

> **WARNING**: This project is not production-ready (per upstream). Use at your own risk.

## Overview

[PDA-Next](https://github.com/PowerDNS-Admin/pda-next) is the next-generation PowerDNS Admin, a complete rewrite featuring a modern React frontend, FastAPI backend, and comprehensive API-first architecture. It connects to your existing PowerDNS servers via API for zone and record management.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       PDA-Next Stack                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐          │
│  │       web        │─────────────▶│       api        │          │
│  │   (React/Vite)   │              │    (FastAPI)     │          │
│  └────────┬─────────┘              └────────┬─────────┘          │
│           │                                  │                    │
│           │                        ┌─────────┴─────────┐          │
│           │                        │      worker       │          │
│           │                        │     (Celery)      │          │
│           │                        └─────────┬─────────┘          │
│           │                                  │                    │
│           │                 ┌────────────────┴────────────────┐   │
│           │                 │                                 │   │
│           │          ┌──────┴──────┐              ┌──────────┴┐   │
│           │          │    mysql    │              │   redis   │   │
│           │          │  (MySQL 8)  │              │  (cache)  │   │
│           │          └─────────────┘              └───────────┘   │
│           │                                                       │
│   dokploy-network ──▶ Traefik ──▶ HTTPS                          │
│                                                                   │
│           │ API calls                                             │
│           ▼                                                       │
│   ┌───────────────────┐                                          │
│   │  External PDNS    │  ◀── Your PowerDNS Authoritative Server  │
│   │  Authoritative    │      (not included in this template)     │
│   └───────────────────┘                                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Features

- **Multi-server management** for PowerDNS authoritative and recursive servers
- **Zone management** with forward, reverse, and catalog zone support
- **Advanced authentication** with OAuth, WebAuthn, TOTP, and OTP
- **Audit logging** for all actions with detailed history
- **Prometheus metrics** and Zabbix monitoring integration
- **DynDNS2 protocol** support for dynamic DNS updates
- **IDN/Punycode** handling for international domains
- **REST API** with OpenAPI/Swagger UI for automation
- **Modern UI** built with React and Vite

## Prerequisites

**Before deploying this template, you need:**

1. A running PowerDNS Authoritative server with API enabled
2. The PowerDNS API URL (e.g., `http://pdns.example.com:8081`)
3. The PowerDNS API key (configured in `pdns.conf`)

If you don't have a PowerDNS server yet, consider using:
- `powerdns` template - Complete DNS infrastructure stack
- `powerdns-admin` template - Simpler, production-ready web UI

## Quick Start

1. Deploy this template in Dokploy
2. Set your domain (e.g., `dns-next.example.com`)
3. Wait for build to complete (builds from source, ~5-10 minutes)
4. Access the web UI at `https://your-domain.com`
5. Create an admin account on first login
6. Configure your PowerDNS server connection in Settings

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Your domain (e.g., `dns-next.example.com`) |
| `MYSQL_ROOT_PASSWORD` | MySQL root password (auto-generated) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MYSQL_DATABASE` | `pda` | Database name |
| `PDA_DEBUG` | `0` | Debug mode (0=off, 1=on) |
| `PDA_ENV` | `prod` | Environment (prod, local) |

## Services

| Service | Description | Internal Port |
|---------|-------------|---------------|
| **web** | React/Vite frontend UI | 8000 |
| **api** | FastAPI backend | 8081 |
| **worker** | Celery background tasks | - |
| **mysql** | MySQL 8.4 database | 3306 |
| **redis** | Redis 8 cache/broker | 6379 |

## Post-Deployment Setup

### 1. Wait for Build

Since pda-next is built from source, the initial deployment takes longer:
- Clones from GitHub
- Builds Python dependencies
- Builds React frontend

Check Dokploy logs for build progress.

### 2. Access the Web UI

1. Navigate to `https://your-domain.com`
2. Create an admin account on first access
3. Log in with your new credentials

### 3. Configure PowerDNS Server

1. Go to **Settings** → **PDNS Settings**
2. Enter your PowerDNS server details:
   - **PDNS API URL**: `http://your-pdns-server:8081`
   - **PDNS API Key**: Your configured API key
3. Test the connection

### 4. Enable PowerDNS API (on your PDNS server)

If the API is not enabled on your PowerDNS server, add these settings to `pdns.conf`:

```ini
# Enable the web server
webserver=yes
webserver-address=0.0.0.0
webserver-port=8081
webserver-allow-from=0.0.0.0/0

# Enable the API
api=yes
api-key=your-secure-api-key-here
```

Restart PowerDNS after configuration changes.

## Comparison: PDA-Next vs PowerDNS-Admin vs PowerDNS

| Feature | pda-next | powerdns-admin | powerdns |
|---------|----------|----------------|----------|
| **Purpose** | Next-gen web UI | Legacy web UI | Complete DNS stack |
| **Production Ready** | No (beta) | Yes | Yes |
| **DNS Server** | Requires external | Requires external | Included |
| **Services** | 5 | 2 | 6 |
| **Database** | MySQL | PostgreSQL | PostgreSQL |
| **Frontend** | React/Vite | Flask/Jinja | Flask/Jinja |
| **API** | FastAPI/OpenAPI | Flask | PowerDNS API |
| **Auth** | OAuth, WebAuthn, TOTP | Local, LDAP, SAML | Basic |
| **Docker Image** | Build from source | Pre-built | Pre-built |
| **Build Time** | ~5-10 min | Instant | Instant |

**Choose pda-next if:**
- You want the latest features and modern UI
- You're comfortable with beta software
- You need advanced authentication (WebAuthn, TOTP)
- You want API-first architecture

**Choose powerdns-admin if:**
- You need production stability
- You want quick deployment (pre-built images)
- You already use PostgreSQL

**Choose powerdns if:**
- You need a complete DNS infrastructure
- You're starting from scratch
- You want authoritative + recursor + load balancer

## Troubleshooting

### Build Fails

- Check Dokploy logs for build errors
- Ensure sufficient disk space for build
- GitHub rate limiting may cause issues (wait and retry)

### "Connection refused" to PowerDNS API

- Verify PowerDNS API is enabled (`api=yes` in pdns.conf)
- Check webserver is running (`webserver=yes`)
- Verify API URL and port are correct
- Ensure firewall allows connections to API port

### Database connection errors

- Verify MySQL container is healthy
- Check password matches between services
- Review MySQL logs for authentication issues

### Slow UI after deployment

- Initial React build may take time
- Check worker service is running
- Verify Redis is healthy

### WebAuthn/TOTP not working

- Ensure HTTPS is properly configured
- Check browser supports WebAuthn
- Verify time synchronization for TOTP

## Resource Requirements

| Component | Memory | CPU |
|-----------|--------|-----|
| web | 512MB | 0.5 cores |
| api | 256MB | 0.5 cores |
| worker | 256MB | 0.25 cores |
| mysql | 256MB | 0.5 cores |
| redis | 64MB | 0.1 cores |
| **Total** | ~1.3GB | ~1.85 cores |

**Note**: Build phase requires additional resources (~2GB RAM).

## Security Considerations

- Enable HTTPS via Traefik (automatic with this template)
- Use strong passwords (auto-generated secrets)
- Enable WebAuthn/TOTP for admin accounts
- Restrict PowerDNS API access via `webserver-allow-from`
- Review audit logs regularly
- Keep images updated (rebuild periodically)

## License

PDA-Next is licensed under **CC BY-NC 4.0** (Attribution-NonCommercial).
Commercial licensing options are planned by the project.

## Links

- [PDA-Next GitHub](https://github.com/PowerDNS-Admin/pda-next)
- [PDA-Next Wiki](https://github.com/PowerDNS-Admin/pda-next/wiki)
- [PowerDNS Documentation](https://doc.powerdns.com/)

## Version

- **Template**: 1.0.0
- **PDA-Next**: main branch (built from source)
- **MySQL**: 8.4
- **Redis**: 8-alpine
