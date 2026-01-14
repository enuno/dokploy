# PowerDNS-Admin

Feature-rich web interface for managing PowerDNS zones and records.

## Overview

[PowerDNS-Admin](https://github.com/PowerDNS-Admin/PowerDNS-Admin) is a web-based DNS management interface for PowerDNS. This template deploys PowerDNS-Admin with PostgreSQL backend, connecting to your existing PowerDNS Authoritative server via its API.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     PowerDNS-Admin Stack                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐          │
│  │  powerdns-admin  │─────────────▶│    PostgreSQL    │          │
│  │    (Web UI)      │              │   (database)     │          │
│  └────────┬─────────┘              └──────────────────┘          │
│           │                                                       │
│           │ API calls                                             │
│           ▼                                                       │
│   ┌───────────────────┐                                          │
│   │  External PDNS    │  ◀── Your PowerDNS Authoritative Server  │
│   │  Authoritative    │      (not included in this template)     │
│   └───────────────────┘                                          │
│                                                                   │
│   dokploy-network ──▶ Traefik ──▶ HTTPS                          │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Features

- Forward and reverse zone management
- Zone templating with predefined records
- Role-based user access control
- Activity logging and audit trails
- Multiple authentication methods:
  - Local user accounts
  - LDAP/Active Directory
  - SAML 2.0
  - OAuth (GitHub, Google, Azure AD)
- Two-factor authentication (TOTP)
- REST API for automation
- DynDNS 2 protocol support
- Full IDN/Punycode support

## Prerequisites

**Before deploying this template, you need:**

1. A running PowerDNS Authoritative server with API enabled
2. The PowerDNS API URL (e.g., `http://pdns.example.com:8081`)
3. The PowerDNS API key (configured in `pdns.conf`)

If you don't have a PowerDNS server yet, consider using the `powerdns` template which includes a complete DNS infrastructure stack.

## Quick Start

1. Deploy this template in Dokploy
2. Set your domain (e.g., `dns-admin.example.com`)
3. Access the web UI at `https://your-domain.com`
4. Create an admin account on first login
5. Configure your PowerDNS server connection in Settings

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Your domain (e.g., `dns-admin.example.com`) |
| `POSTGRES_PASSWORD` | Database password (auto-generated) |
| `SECRET_KEY` | Flask session encryption key (auto-generated) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `WARNING` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `POSTGRES_DB` | `pda` | Database name |
| `POSTGRES_USER` | `pda` | Database username |

### Authentication Options

#### LDAP Authentication

| Variable | Description |
|----------|-------------|
| `LDAP_ENABLED` | Set to `True` to enable LDAP |
| `LDAP_URI` | LDAP server URI (e.g., `ldap://ldap.example.com:389`) |
| `LDAP_BASE_DN` | Base DN for searches |
| `LDAP_BIND_USER_DN` | Bind user DN |
| `LDAP_BIND_USER_PASSWORD` | Bind user password |

#### SAML Authentication

| Variable | Description |
|----------|-------------|
| `SAML_ENABLED` | Set to `True` to enable SAML 2.0 |

Configure SAML settings in the web UI after enabling.

#### OAuth Authentication

| Variable | Description |
|----------|-------------|
| `OAUTH_ENABLED` | Set to `True` to enable OAuth |

Configure OAuth providers in the web UI after enabling.

## Post-Deployment Setup

### 1. Access the Web UI

1. Navigate to `https://your-domain.com`
2. Create an admin account on first access
3. Log in with your new credentials

### 2. Configure PowerDNS Server

1. Go to **Settings** → **PDNS**
2. Enter your PowerDNS server details:
   - **PDNS API URL**: `http://your-pdns-server:8081`
   - **PDNS API Key**: Your configured API key
3. Click **Update** and **Test Connection**

### 3. Enable PowerDNS API (on your PDNS server)

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

### 4. Create DNS Zones

1. Go to **Dashboard** → **New Domain**
2. Enter your zone name (e.g., `example.com`)
3. Select zone type:
   - **Native**: Single server, no replication
   - **Master**: Primary for zone transfers
   - **Slave**: Secondary receiving zone transfers
4. Add DNS records (A, AAAA, MX, CNAME, etc.)

## Integration with PowerDNS Template

If you deployed the `powerdns` template from this repository:

1. Configure PowerDNS-Admin to connect to the authoritative server:
   - **API URL**: `http://authoritative:8081` (if on same Docker network)
   - **API Key**: The `PDNS_API_KEY` value from your powerdns template

2. To connect across different Dokploy projects, use the external IP or domain of your PowerDNS server.

## Troubleshooting

### "Connection refused" to PowerDNS API

- Verify PowerDNS API is enabled (`api=yes` in pdns.conf)
- Check webserver is running (`webserver=yes`)
- Verify API URL and port are correct
- Ensure firewall allows connections to API port

### "Unauthorized" when connecting to PowerDNS

- Verify API key matches between PowerDNS-Admin and pdns.conf
- Check `webserver-allow-from` includes your PowerDNS-Admin IP
- Ensure no special characters in API key causing issues

### Database connection errors

- Verify PostgreSQL container is healthy
- Check password matches between services
- Review PostgreSQL logs for authentication issues

### Login issues after first setup

- Clear browser cache and cookies
- Check Flask SECRET_KEY hasn't changed
- Verify PostgreSQL data volume is persistent

### LDAP/SAML authentication not working

- Verify LDAP_ENABLED or SAML_ENABLED is set to `True`
- Check LDAP server is reachable
- Review application logs for authentication errors

## Comparison: PowerDNS-Admin vs PowerDNS Template

| Feature | powerdns-admin | powerdns |
|---------|----------------|----------|
| **Purpose** | Web UI only | Complete DNS stack |
| **DNS Server** | Requires external | Included |
| **Services** | 2 | 6 |
| **Use Case** | Add UI to existing PDNS | Full DNS infrastructure |
| **Image** | powerdnsadmin/pda-legacy | chrisss404/powerdns |

**Choose this template (`powerdns-admin`) if:**
- You already have a PowerDNS server running
- You only need the web management interface
- You want a lightweight deployment

**Choose `powerdns` template if:**
- You need a complete DNS infrastructure
- You're starting from scratch
- You want authoritative + recursor + load balancer

## Resource Requirements

| Component | Memory | CPU |
|-----------|--------|-----|
| powerdns-admin | 256MB | 0.5 cores |
| postgres | 128MB | 0.25 cores |
| **Total** | ~400MB | ~0.75 cores |

## Security Considerations

- Enable HTTPS via Traefik (automatic with this template)
- Use strong passwords (auto-generated secrets)
- Enable two-factor authentication for admin accounts
- Consider LDAP/SAML for enterprise SSO
- Restrict PowerDNS API access via `webserver-allow-from`
- Regularly update to latest image versions

## Links

- [PowerDNS-Admin Documentation](https://github.com/PowerDNS-Admin/PowerDNS-Admin/wiki)
- [PowerDNS Documentation](https://doc.powerdns.com/)
- [Docker Hub](https://hub.docker.com/r/powerdnsadmin/pda-legacy)
- [GitHub Repository](https://github.com/PowerDNS-Admin/PowerDNS-Admin)

## Version

- **Template**: 1.0.0
- **PowerDNS-Admin**: v0.4.2
- **PostgreSQL**: 16-alpine

Sources:
- [PowerDNS-Admin GitHub Repository](https://github.com/PowerDNS-Admin/PowerDNS-Admin)
- [Running PowerDNS with PowerDNS-Admin on Medium](https://medium.com/@fhc.silv/running-powerdns-in-the-local-environment-with-powerdns-admin-d4872c793a9b)
