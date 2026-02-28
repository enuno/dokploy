# Warpgate Dokploy Template

> **Fully transparent SSH, HTTPS, MySQL & PostgreSQL bastion host that doesn't require a client app**

- 🔐 **Smart Access Gateway**: Transparent routing to targets without jump host configuration
- 📹 **Session Recording**: Capture and replay all sessions through web admin interface
- 🔑 **Native 2FA/SSO**: Built-in TOTP and OpenID Connect support
- 🎯 **Precise Access Control**: Assign users to specific hosts and URLs with role-based authorization
- 🔊 **Command-Level Audit**: Secure recording even when root access is granted
- ⚙️ **Single Binary**: No external dependencies required (uses SQLite)
- 🦀 **Safe Implementation**: Written entirely in safe Rust

**Official Documentation**: https://warpgate.null.page/

---

## Architecture

```
┌──────────────────────────────┐
│    Warpgate Bastion Host     │
│  (SSH/HTTPS/MySQL/PostgreSQL)│
└───┬────────────────────────┬─┘
    │                        │
    ├─── SSH (2222) ────────┤ SSH Access to Target Machines
    ├─── HTTP (8888) ──────►│ Web Admin UI (via Traefik HTTPS)
    ├─── MySQL (33306) ────►│ Database Access Routing
    └─ PostgreSQL (5432) ───┘ Database Access Routing

┌──────────────────────────────┐
│    Data Persistence          │
│ /data Volume (SQLite + Conf) │
└──────────────────────────────┘
```

**Service Type**: Single-service, stateful application
**Database**: Self-contained SQLite (stored in `/data`)
**Authentication**: Built-in user/password + optional SSO/OIDC
**Configuration**: Web-based admin interface

---

## Quick Start

### 1. Deploy Template

In Dokploy:
1. Select "Add New Template"
2. Choose "Warpgate"
3. Configure domain (e.g., `warpgate.example.com`)
4. Set strong admin password
5. Deploy

### 2. Access Admin UI

Navigate to `https://{WARPGATE_DOMAIN}` and login with:
- Username: `admin`
- Password: (the one you set during deployment)

### 3. Configure Targets

In the admin panel:
1. Add SSH targets (VMs, servers)
2. Add MySQL/PostgreSQL targets (databases)
3. Assign users to targets with role-based permissions
4. Generate Warpgate credentials for your team

### 4. Connect Users

Users connect via:
```bash
# SSH through bastion (requires adding Warpgate public key to targets)
ssh username@bastion-server -p 2222
# Then authenticate with Warpgate credentials

# MySQL through bastion
mysql -h bastion-server -P 33306 -u warpgate_user -p
# Then authenticate with Warpgate credentials

# PostgreSQL through bastion
psql -h bastion-server -p 5432 -U warpgate_user
# Then authenticate with Warpgate credentials
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WARPGATE_DOMAIN` | Yes | - | Domain for web admin UI |
| `WARPGATE_ADMIN_PASSWORD` | Yes | - | Initial admin password (change after login) |
| `WARPGATE_LOG_LEVEL` | No | `info` | Logging level: `debug`, `info`, `warn`, `error` |

### Optional: Cloudflare Zero Trust Access

To protect the admin interface with Cloudflare Access:

**Step 1: Enable in docker-compose.yml**

Uncomment these lines in the `labels:` section:
```yaml
# - "traefik.http.routers.warpgate.middlewares=cf-access@docker"
# - "traefik.http.middlewares.cf-access.forwardauth.address=https://${CF_TEAM_NAME}.cloudflareaccess.com/cdn-cgi/access/authorized"
# - "traefik.http.middlewares.cf-access.forwardauth.trustForwardHeader=true"
```

**Step 2: Configure Cloudflare Access**

1. Go to **Cloudflare Dashboard** → **Zero Trust** → **Access** → **Applications**
2. Click **Create Application**
3. Select **Self-hosted**
4. Set Application URL: `https://{WARPGATE_DOMAIN}`
5. Configure identity providers (email, Google, GitHub, etc.)
6. Set policy: Allow users with matching email domain
7. Copy your Cloudflare team name to `CF_TEAM_NAME` environment variable

**Step 3: Redeploy**

After uncommenting and setting `CF_TEAM_NAME`, redeploy for changes to take effect.

---

## How Warpgate Works

### Authentication Flow

1. **User** connects to Warpgate (SSH on 2222, etc.)
2. **Warpgate** authenticates user via its user database (or OIDC)
3. **Warpgate** checks authorization (user has access to this target)
4. **Warpgate** connects to **Target** machine using Warpgate's own SSH key
5. **Warpgate** transparently forwards user ↔ Target

### Key Concept: No Shared Credentials

Instead of sharing private keys across servers:
- Add **Warpgate's public key** to all target machines
- Only Warpgate needs SSH access
- Users authenticate to Warpgate (not targets)
- Warpgate manages all connections transparently

---

## Post-Deployment

### ⚠️ Critical First Steps

1. **Change Admin Password**
   - Log in to web UI: `https://{WARPGATE_DOMAIN}`
   - Go to **Settings** → **Admin Password**
   - Change from initial password

2. **Enable Session Recording** (Optional but Recommended)
   - Admin UI → **Settings** → **Session Recording**
   - Choose recording format (Asciinema)

### Adding SSH Targets

**Preparation on Target Server:**

1. Get Warpgate's public key from admin UI → **Settings** → **SSH**
2. Add to target: `echo "{public_key}" >> ~/.ssh/authorized_keys`
3. Verify SSH access: `ssh -i /path/to/key warpgate@target-server`

**Add in Warpgate Admin UI:**

1. Admin UI → **Targets** → **SSH**
2. Click **Add Target**
3. Configure:
   - **Name**: Internal name (e.g., `prod-db-server`)
   - **Address**: Target hostname/IP
   - **Port**: SSH port (usually 22)
   - **Username**: OS user (usually `root` or service user)
   - **Authentication**: Use Warpgate's SSH key

### Adding Database Targets

**MySQL/MariaDB:**
1. Admin UI → **Targets** → **MySQL**
2. Configure database hostname, port, credentials
3. Assign to users

**PostgreSQL:**
1. Admin UI → **Targets** → **PostgreSQL**
2. Configure database hostname, port, credentials
3. Assign to users

### User Management

1. Admin UI → **Users**
2. Create user account
3. Set password or configure OIDC
4. Assign to specific targets with roles:
   - **View**: Read-only access
   - **Execute**: Can run commands (SSH)
   - **Connect**: Can connect to database

---

## Security Best Practices

### Access Control
- ✅ Use role-based access control for sensitive targets
- ✅ Regularly audit user access in session logs
- ✅ Remove users who no longer need access
- ✅ Enable session recording for compliance

### Network Security
- ✅ Enable optional Cloudflare Zero Trust Access for web admin UI
- ✅ Restrict Warpgate ports (2222, 33306, 5432) to internal networks when possible
- ✅ Keep Warpgate software updated
- ✅ Monitor logs for suspicious activity

### Backup
- ✅ Regular backups of `/data` volume (contains database + config)
- ✅ Document Warpgate's public SSH key separately
- ✅ Backup admin password securely (for recovery)

---

## Troubleshooting

### SSH Connection Fails

**"Permission denied (publickey)"**
- Verify Warpgate's public key is in target's `~/.ssh/authorized_keys`
- Check SSH permissions: `chmod 600 authorized_keys`
- Test manual SSH to target: `ssh -i warpgate_key user@target`

**"Connection refused"**
- Is Warpgate running? Check `docker compose ps`
- Is port 2222 exposed? Check firewall/security groups
- Is target reachable from Warpgate container? Check network

### Web UI Not Loading

**"Connection timeout"**
- Is Warpgate service healthy? Check `docker compose ps`
- Is domain DNS configured? Test: `nslookup warpgate.example.com`
- Check Traefik is running: `docker ps | grep traefik`

**"SSL certificate error"**
- Let's Encrypt certificate generation takes ~1 minute
- Wait 2-3 minutes and try again
- Check Traefik logs: `docker logs traefik`

### Admin Password Not Working

- Initial password set during deployment
- If forgotten: Stop container, remove database, redeploy
- Or see Warpgate docs: https://warpgate.null.page/getting-started-on-docker/

---

## Performance Tuning

### Resource Allocation

Default (Production Safe):
- CPU: 500m - 1000m
- Memory: 128Mi - 256Mi

For High-Volume Bastion (many concurrent sessions):
- CPU: 2000m - 4000m
- Memory: 512Mi - 1Gi
- Increase in Dokploy deployment settings

### Session Recording

Recording adds disk space requirements:
- ~1KB per 100 commands recorded
- Enable selective recording for sensitive sessions only
- Archive old recordings periodically

---

## Advanced: SSO Integration

### OpenID Connect (OIDC)

Configure in admin UI → **Settings** → **Authentication** → **OpenID Connect**:

**Required from OIDC Provider:**
- Authorization URL
- Token URL
- UserInfo URL
- Client ID
- Client Secret

**Tested Providers:**
- Google Workspace
- Okta
- Azure AD
- Keycloak

See official docs: https://warpgate.null.page/guide/user-authentication-and-roles/

---

## Updating

### Image Updates

Warpgate provides security updates periodically.

**To Update:**
1. In Dokploy, edit the template
2. Update image version in docker-compose.yml: `ghcr.io/warp-tech/warpgate:X.X.X`
3. Redeploy

Check latest version: https://github.com/warp-tech/warpgate/releases

**Important**: Always test updates in staging first - session recording state may need migration.

---

## Production Checklist

Before production deployment:

- [ ] Admin password changed from initial default
- [ ] Session recording enabled (if required for compliance)
- [ ] SSH public key added to all target servers
- [ ] Firewall allows ports 2222 (SSH), 33306 (MySQL), 5432 (PostgreSQL) as needed
- [ ] Backup strategy for `/data` volume configured
- [ ] User roles configured with least privilege
- [ ] DNS configured for admin UI domain
- [ ] HTTPS working (Let's Encrypt certificate active)
- [ ] Optional: Cloudflare Zero Trust enabled for admin protection
- [ ] Optional: OIDC SSO configured for user authentication
- [ ] Monitoring/alerting configured for Warpgate service
- [ ] Documentation for team access procedure written

---

## Support & Resources

- **Official Docs**: https://warpgate.null.page/
- **GitHub Issues**: https://github.com/warp-tech/warpgate/issues
- **GitHub Discussions**: https://github.com/warp-tech/warpgate/discussions

---

## Template Metadata

- **Application**: Warpgate v0.20.2
- **Type**: SSH/HTTP/MySQL/PostgreSQL Bastion Gateway
- **Storage**: Self-contained (SQLite in `/data`)
- **Architecture**: Single-service, stateful
- **Networking**: Internal bridges + Traefik routing
- **Status**: Production-Ready
- **Last Updated**: February 28, 2026

---

## License

Warpgate is licensed under the Apache License 2.0
See: https://github.com/warp-tech/warpgate/blob/main/LICENSE

---

**Questions?** Check the official Warpgate documentation or GitHub discussions.
