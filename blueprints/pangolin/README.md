# Pangolin Dokploy Template

> **Zero-trust identity-aware reverse proxy and VPN server for secure remote access**

- 🔐 **Identity-Aware Access**: Enforce authentication before reaching any resource
- 🌐 **WireGuard VPN Tunnels**: Connect remote sites and clients with modern WireGuard
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
    ├── 51820 (UDP) ──► Gerbil (WireGuard) ──► VPN Clients
    │
    └── Dokploy Traefik (443/HTTPS) ──► Pangolin Dashboard (Admin UI)

┌─────────────────────────────────────────────────────┐
│                  Pangolin Stack                     │
│                                                     │
│  ┌────────────┐    ┌─────────┐                      │
│  │  Pangolin  │◄───│ Gerbil  │                      │
│  │  (Control) │    │  (VPN)  │                      │
│  │ Port 3001  │    │UDP 51820│                      │
│  │ Port 3000  │    │         │                      │
│  └────────────┘    └─────────┘                      │
│         │                                           │
│  ┌──────▼──────┐                                    │
│  │  SQLite DB  │ (persisted in pangolin-config volume)│
│  └─────────────┘                                    │
└─────────────────────────────────────────────────────┘
```

**Service Type**: Multi-service stack (Pangolin + Gerbil)  
**Database**: Self-contained SQLite (in `/app/config/db`)  
**VPN**: WireGuard via Gerbil  
**Routing**: Dokploy's Traefik handles HTTPS for the admin dashboard  

---

## Prerequisites

1. **Dokploy** installed and running
2. **DNS configuration**:
   - `pangolin.example.com` → Server IP (admin dashboard, routed via Dokploy Traefik)
   - `*.example.com` → Server IP (optional wildcard for services accessed through WireGuard tunnels)
3. **Firewall rules**: Open port `51820/udp`

---

## Quick Start

### 1. Configure DNS

Before deploying, set up DNS records:

```
# Admin dashboard
pangolin.example.com     A    <your-server-ip>
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
| `base_domain` | Base domain for WireGuard tunnel clients | `example.com` |
| `admin_email` | Initial admin email address | `admin@example.com` |
| `admin_password` | Initial admin password (auto-generated) | *(generated)* |
| `app_secret` | Application secret key (auto-generated) | *(generated)* |
| `resource_access_secret` | Resource token secret (auto-generated) | *(generated)* |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `wireguard_port` | `51820` | WireGuard VPN UDP port |
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
| `51820` | UDP | WireGuard VPN tunnels | Yes |

> **Note**: The admin dashboard HTTPS traffic (port 443) is handled by Dokploy's Traefik instance. Only the WireGuard UDP port needs to be opened in the firewall.

### Firewall Rules

```bash
# Open WireGuard port
ufw allow 51820/udp
```

### DNS Setup

Pangolin needs a domain for the admin dashboard:

```
# Admin dashboard (routed via Dokploy Traefik)
pangolin.example.com     A    <your-server-ip>
```

---

## Security Considerations

### Credential Management

- ✅ Admin password is auto-generated (32 characters)
- ✅ App secrets are auto-generated and stored in Dokploy
- ✅ Change admin password after first login
- ✅ Enable MFA for admin accounts

### Network Security

- ✅ Admin dashboard TLS handled by Dokploy's Traefik (Let's Encrypt)
- ✅ WireGuard provides end-to-end encryption for VPN tunnels
- ✅ Use firewall to restrict WireGuard port access
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

### Services Not Accessible via Tunnel

1. Verify site is connected: Pangolin admin → **Sites** → check status
2. Check resource configuration: correct target URL
3. Review access policies: user has permission to access resource

---

## Backup

### Critical Data

Back up this named volume regularly:

| Volume | Contents |
|--------|----------|
| `pangolin-config` | SQLite database, WireGuard keys, Pangolin application configuration |

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

- [ ] DNS configured: `pangolin.example.com` → server IP
- [ ] Firewall open: port 51820 (UDP)
- [ ] Admin password changed after first login
- [ ] MFA enabled on admin account
- [ ] TLS certificate active (check Dokploy Traefik for domain)
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
- **Architecture**: Multi-service (Pangolin + Gerbil)
- **Storage**: SQLite in persistent volumes
- **Networking**: WireGuard VPN, admin UI via Dokploy Traefik
- **Status**: Production-Ready

---

## License

Pangolin is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0)  
See: https://github.com/fosrl/pangolin/blob/main/LICENSE
