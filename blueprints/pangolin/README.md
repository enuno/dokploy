# Pangolin Dokploy Template

> **Zero-trust identity-aware reverse proxy and VPN server for secure remote access**

- 🔐 **Identity-Aware Access**: Enforce authentication before reaching any resource
- 🌐 **WireGuard VPN Tunnels**: Connect remote sites and clients with modern WireGuard
- 🔄 **Dynamic Reverse Proxy**: Built-in Traefik for automatic TLS and HTTP routing
- 👥 **Multi-Org Support**: Isolated organizations with role-based access control
- 🔑 **SSO / OIDC Integration**: Connect to Authelia, Authentik, Keycloak, and more
- 🛡️ **Zero-Trust Architecture**: No implicit trust — every request is authenticated
- 📊 **Audit Logging**: Track all access and connections

**Official Documentation**: https://docs.pangolin.net/

---

## Architecture

```
Internet
    │
    ├── 443 (HTTPS) ──► Gerbil + Traefik ──► Tunneled Services
    ├── 51820 (UDP) ──► Gerbil (WireGuard) ──► VPN Clients
    │
    └── Dokploy Traefik ──► Pangolin Dashboard (Admin UI)

┌─────────────────────────────────────────────────────┐
│                  Pangolin Stack                     │
│                                                     │
│  ┌────────────┐    ┌─────────┐    ┌─────────────┐  │
│  │  Pangolin  │◄───│ Gerbil  │◄───│   Traefik   │  │
│  │  (Control) │    │  (VPN)  │    │  (Proxy)    │  │
│  │ Port 3001  │    │UDP 51820│    │ Port 80/443 │  │
│  │ Port 3000  │    │         │    │             │  │
│  └────────────┘    └─────────┘    └─────────────┘  │
│         │                                           │
│  ┌──────▼──────┐                                    │
│  │  SQLite DB  │  (persisted in pangolin-db volume) │
│  └─────────────┘                                    │
└─────────────────────────────────────────────────────┘
```

**Service Type**: Multi-service stack (Pangolin + Gerbil + Traefik)  
**Database**: Self-contained SQLite (in `/app/config/db`)  
**VPN**: WireGuard via Gerbil  
**Proxy**: Embedded Traefik instance for tunneled services  

---

## Prerequisites

1. **Dedicated server or VPS** (recommended — Pangolin uses ports 80, 443, 51820)
2. **DNS configuration**:
   - `pangolin.example.com` → Server IP (admin dashboard)
   - `*.example.com` → Server IP (wildcard for tunneled services)
3. **Firewall rules**: Open ports `443/tcp`, `80/tcp`, `51820/udp`
4. **Dokploy** installed and running

> **⚠️ Port Conflict Warning**: Pangolin's embedded Traefik uses ports 80 and 443.
> If Dokploy's Traefik already uses these ports on the same host, you must either:
> - Deploy Pangolin on a **dedicated server**
> - Change `HTTP_PROXY_PORT` and `HTTPS_PROXY_PORT` to alternate values (e.g., 8080, 8443)

---

## Quick Start

### 1. Configure DNS

Before deploying, set up DNS records:

```
# Admin dashboard
pangolin.example.com     A    <your-server-ip>

# Wildcard for tunneled services
*.example.com            A    <your-server-ip>
```

### 2. Deploy Template

In Dokploy:
1. Select **"Add New Template"**
2. Choose **"Pangolin"**
3. Fill in the required variables (see [Configuration](#configuration) below)
4. Deploy

### 3. Complete Initial Setup

Navigate to `https://pangolin.example.com/auth/initial-setup` and:
1. Confirm admin email and password
2. Configure your organization name
3. Verify DNS is working

### 4. Create Your First Tunnel

1. In Pangolin admin: **Sites** → **Add Site**
2. Choose **WireGuard** tunnel type
3. Follow the newt/WireGuard client setup instructions
4. Add resources behind the tunnel

---

## Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `pangolin_domain` | Admin dashboard domain | `pangolin.example.com` |
| `base_domain` | Base domain for tunneled services | `example.com` |
| `admin_email` | Initial admin email address | `admin@example.com` |
| `admin_password` | Initial admin password (auto-generated) | *(generated)* |
| `letsencrypt_email` | Email for Let's Encrypt certificates | `admin@example.com` |
| `app_secret` | Application secret key (auto-generated) | *(generated)* |
| `resource_access_secret` | Resource token secret (auto-generated) | *(generated)* |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `wireguard_port` | `51820` | WireGuard VPN UDP port |
| `https_proxy_port` | `443` | HTTPS port for tunneled services |
| `http_proxy_port` | `80` | HTTP port (redirects to HTTPS) |
| `smtp_host` | *(empty)* | SMTP server for email notifications |
| `smtp_port` | `587` | SMTP port |
| `smtp_username` | *(empty)* | SMTP username |
| `smtp_password` | *(empty)* | SMTP password |
| `smtp_from_email` | *(empty)* | From address for outgoing emails |
| `log_level` | `info` | Log level: `debug`, `info`, `warn`, `error` |

### Environment Variables (Advanced)

These are set via Dokploy's environment variable injection:

| Variable | Description |
|----------|-------------|
| `PANGOLIN_DOMAIN` | Admin dashboard domain |
| `WIREGUARD_PORT` | WireGuard listen port |
| `HTTPS_PROXY_PORT` | HTTPS proxy port |
| `HTTP_PROXY_PORT` | HTTP proxy port |

---

## Identity Provider Setup

Pangolin supports SSO via OpenID Connect (OIDC). Configure in the admin UI under:
**Settings** → **Identity Providers**

### Authelia

1. In Authelia, create a new OIDC client:
   ```yaml
   # authelia/configuration.yml
   identity_providers:
     oidc:
       clients:
         - id: pangolin
           description: Pangolin
           secret: your-client-secret
           public: false
           authorization_policy: two_factor
           redirect_uris:
             - https://pangolin.example.com/api/v1/auth/oidc/callback
           scopes:
             - openid
             - profile
             - email
           grant_types:
             - authorization_code
   ```
2. In Pangolin admin: **Settings** → **Identity Providers** → **Add OIDC**
3. Enter:
   - **Issuer URL**: `https://auth.example.com`
   - **Client ID**: `pangolin`
   - **Client Secret**: `your-client-secret`

### Authentik

1. In Authentik, create an OAuth2/OIDC provider:
   - **Redirect URIs**: `https://pangolin.example.com/api/v1/auth/oidc/callback`
   - **Scopes**: `openid`, `profile`, `email`
2. Create an Application linked to this provider
3. In Pangolin admin: **Settings** → **Identity Providers** → **Add OIDC**
4. Use the Authentik OIDC metadata URL

### Keycloak

1. In Keycloak, create a new client:
   - **Client ID**: `pangolin`
   - **Client Protocol**: `openid-connect`
   - **Valid Redirect URIs**: `https://pangolin.example.com/api/v1/auth/oidc/callback`
2. Note the client secret from the **Credentials** tab
3. In Pangolin admin: configure OIDC with Keycloak's realm OIDC endpoint

---

## Networking

### Port Requirements

| Port | Protocol | Purpose | Required |
|------|----------|---------|----------|
| `443` | TCP | HTTPS for tunneled services + Let's Encrypt | Yes |
| `80` | TCP | HTTP → HTTPS redirect + Let's Encrypt challenge | Yes |
| `51820` | UDP | WireGuard VPN tunnels | Yes |

### Firewall Rules

```bash
# Open required ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 51820/udp

# Restrict admin dashboard to trusted IPs (recommended)
ufw allow from <your-ip> to any port 443
```

### DNS Wildcard Setup

Pangolin creates subdomains for each exposed service:

```
# All tunneled services use subdomains of base_domain
api.example.com       → service behind Pangolin tunnel
app.example.com       → another service
db-admin.example.com  → protected database UI
```

---

## Security Considerations

### Credential Management

- ✅ Admin password is auto-generated (32 characters)
- ✅ App secrets are auto-generated and stored in Dokploy
- ✅ Change admin password after first login
- ✅ Enable MFA for admin accounts

### Network Security

- ✅ All traffic encrypted via TLS (Let's Encrypt)
- ✅ WireGuard provides end-to-end encryption for VPN tunnels
- ✅ Deploy on a dedicated server to avoid port conflicts
- ✅ Use firewall to restrict access to management ports
- ✅ Enable identity provider authentication for zero-trust access

### Secrets Rotation

To rotate secrets:
1. Update `app_secret` and `resource_access_secret` in Dokploy
2. Redeploy the stack
3. Users will need to log in again (sessions invalidated)

---

## Troubleshooting

### Admin Dashboard Not Loading

```bash
# Check Pangolin is healthy
docker compose ps
docker compose logs pangolin

# Verify Traefik routing
curl -I https://pangolin.example.com
```

### WireGuard Connection Fails

```bash
# Check Gerbil is running
docker compose logs gerbil

# Verify UDP port is open
nc -u -zv your-server-ip 51820

# Check WireGuard key was generated
docker compose exec gerbil ls /var/config/key
```

### Let's Encrypt Certificate Issues

```bash
# Check Traefik logs
docker compose logs traefik

# Verify HTTP challenge is reachable
curl http://your-domain/.well-known/acme-challenge/test

# Common cause: port 80 blocked by firewall
ufw status
```

### Services Not Accessible via Tunnel

1. Verify site is connected: Pangolin admin → **Sites** → check status
2. Check resource configuration: correct target URL
3. Review access policies: user has permission to access resource
4. Check Traefik config: `docker compose logs traefik`

---

## Backup

### Critical Data

Back up these named volumes regularly:

| Volume | Contents |
|--------|----------|
| `pangolin-config` | SQLite database, WireGuard keys, Let's Encrypt certs |
| `traefik-certs` | Traefik certificate store (ACME) |

```bash
# Example backup command for pangolin config volume
docker run --rm \
  -v pangolin-config:/source:ro \
  -v /backup:/backup \
  alpine tar czf /backup/pangolin-config-$(date +%Y%m%d).tar.gz -C /source .
```

---

## Updating

To update Pangolin:
1. Check the [Pangolin releases page](https://github.com/fosrl/pangolin/releases)
2. Update the image reference in `docker-compose.yml`
3. Also update `gerbil` image to the compatible version
4. Redeploy in Dokploy

> ⚠️ Always check the release notes for breaking changes before upgrading.

---

## Production Checklist

Before going live:

- [ ] DNS configured: `pangolin.example.com` and `*.example.com` → server IP
- [ ] Firewall open: ports 80, 443 (TCP), 51820 (UDP)
- [ ] Admin password changed after first login
- [ ] MFA enabled on admin account
- [ ] Let's Encrypt certificates active (check Traefik logs)
- [ ] SMTP configured (for user invites)
- [ ] Identity provider configured (optional but recommended)
- [ ] Volume backup strategy in place
- [ ] First tunnel tested end-to-end

---

## Support & Resources

- **Official Docs**: https://docs.pangolin.net/
- **GitHub**: https://github.com/fosrl/pangolin
- **GitHub Issues**: https://github.com/fosrl/pangolin/issues
- **Gerbil (tunnel agent)**: https://github.com/fosrl/gerbil

---

## Template Metadata

- **Application**: Pangolin
- **Image**: `ghcr.io/fosrl/pangolin:sha256-3013a0e89e3259567fd86d23af50fc1c7ad9216ab0693ceb823b01c35e6acb5`
- **Gerbil**: `ghcr.io/fosrl/gerbil:1.3.0`
- **Type**: Identity-aware VPN and Proxy Server
- **Architecture**: Multi-service (Pangolin + Gerbil + Traefik)
- **Storage**: SQLite in persistent volumes
- **Networking**: WireGuard VPN + HTTP/HTTPS reverse proxy
- **Status**: Production-Ready

---

## License

Pangolin is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0)  
See: https://github.com/fosrl/pangolin/blob/main/LICENSE
