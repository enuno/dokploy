# Opengist - Self-hosted Git-Backed Pastebin

![Opengist](https://raw.githubusercontent.com/thomiceli/opengist/master/public/opengist.svg)

Opengist is a self-hosted pastebin powered by Git, designed as an open-source alternative to GitHub Gist. Create public or private code snippets, gists, and pastes with full Git integration, syntax highlighting for 150+ languages, and a clean web interface.

## Features

- **Git-Powered Storage**: Every gist is a Git repository with full version history
- **Public & Private Gists**: Create public snippets or keep them private
- **Syntax Highlighting**: Support for 150+ programming languages
- **Multiple File Support**: Create gists with multiple files
- **Git Access**: Clone, pull, and push via HTTP(S) and SSH
- **Search & Discovery**: Find gists by content, filename, or author
- **User Management**: Built-in authentication and user system
- **Markdown Support**: Render Markdown files directly in the browser
- **RESTful API**: Programmatic access to gist operations
- **Lightweight**: Minimal resource requirements, fast performance

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet (HTTPS)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Traefik (Dokploy)  │
              │  Let's Encrypt SSL   │
              │  Security Headers    │
              └──────────┬───────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │        Opengist                │
         │   (Git-backed pastebin)        │
         │                                │
         │  • HTTP: Port 6157             │
         │  • SSH Git: Port 2222 (int)    │
         │  • Health: /healthcheck        │
         │  • Storage: /opengist          │
         └───────────┬───────────────────┘
                     │
                     │ Internal Network (opengist-net)
                     │
                     ▼
         ┌───────────────────────────────┐
         │      PostgreSQL 16             │
         │   (Gist Metadata & Users)      │
         │                                │
         │  • Port: 5432 (internal only)  │
         │  • Data: /var/lib/postgresql   │
         └────────────────────────────────┘
```

### Components

| Component | Purpose | Exposed |
|-----------|---------|---------|
| **Opengist** | Web interface, Git server, gist management | Yes (HTTPS via Traefik) |
| **PostgreSQL** | Database backend for metadata, users, sessions | No (internal only) |
| **Traefik** | Reverse proxy with automatic HTTPS | Managed by Dokploy |

### Networks

- **opengist-net**: Internal bridge network for Opengist ↔ PostgreSQL communication
- **dokploy-network**: External network for Traefik routing (HTTPS access)

## Resource Requirements

### Minimum (Light Usage)
- **CPU**: 1 core
- **RAM**: 1 GB total
  - Opengist: 512 MB
  - PostgreSQL: 512 MB
- **Storage**: 5 GB
  - Git repositories (gists): ~2-5 GB
  - PostgreSQL data: ~500 MB - 1 GB

### Recommended (Production)
- **CPU**: 2+ cores
- **RAM**: 2-4 GB total
- **Storage**: 10-20 GB (scales with gist volume and file sizes)

### Disk I/O
- Low-Moderate: Git repository operations (clones, pushes)
- Low: PostgreSQL for metadata storage

## Configuration Variables

### Required Variables

| Variable | Description | Example | Generated |
|----------|-------------|---------|-----------| | `domain` | Public domain for Opengist UI | `gist.example.com` | User provides |
| `postgres_password` | PostgreSQL database password | `aB3kL9mN...` | Auto (32 chars) |
| `og_secret_key` | Secret key for sessions and encryption | `dGhpcyBpcyBh...` | Auto (base64:64) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `og_ssh_enabled` | `true` | Enable SSH Git access (internal network only) |
| `og_log_level` | `warn` | Logging level (debug, info, warn, error, fatal) |

### Security Recommendation

**SSH Git Access**: By default, SSH Git operations are enabled but **NOT exposed externally** for security. SSH works over the internal network. To enable external SSH access, add this to the `opengist` service in `docker-compose.yml`:

```yaml
opengist:
  ports:
    - "${OG_SSH_PORT:-2222}:2222"
```

Then add `OG_SSH_PORT` to `template.toml`:
```toml
[variables]
og_ssh_port = "2222"

[config.env]
OG_SSH_PORT = "${og_ssh_port}"
```

## Post-Deployment Steps

### 1. Access Opengist UI

Navigate to your configured domain (e.g., `https://gist.example.com`). You should see the Opengist welcome page.

### 2. Create Admin Account

On first access, register an admin account:
1. Click **"Register"** in the top-right corner
2. Fill in username, email, and password
3. **Note**: The first user to register becomes the administrator

### 3. Create Your First Gist

1. Click **"New Gist"** after logging in
2. Add filename (e.g., `hello.py`)
3. Write code or paste content
4. Choose visibility (Public or Private)
5. Click **"Create Gist"**

### 4. Clone via Git (HTTP)

```bash
# Clone a gist via HTTPS
git clone https://gist.example.com/username/gist-id.git

# Make changes
cd gist-id
echo "New file" > newfile.txt
git add newfile.txt
git commit -m "Add new file"
git push
```

### 5. Optional: Enable SSH Git Access

If you enabled external SSH (see Security Recommendation above):

```bash
# Add SSH key in Opengist UI (Settings > SSH Keys)
# Then clone via SSH
git clone ssh://git@gist.example.com:2222/username/gist-id.git
```

### 6. Configure Settings

Navigate to **Settings** (click your username > Settings):
- **Profile**: Update display name and bio
- **SSH Keys**: Add public SSH keys for Git access
- **Security**: Enable two-factor authentication (if available)
- **API Tokens**: Generate tokens for programmatic access

## Common Workflows

### Create Multi-File Gist

```
1. Click "New Gist"
2. Add first file: filename.py
3. Click "+ Add File"
4. Add second file: README.md
5. Set visibility and description
6. Click "Create Gist"
```

### Search for Gists

```
1. Use search box in top navigation
2. Enter keywords (searches filenames and content)
3. Filter by:
   - All gists (public + your private)
   - Your gists only
   - Public gists only
```

### Fork a Gist

```
1. View any gist
2. Click "Fork" button
3. Creates a copy under your account
4. Make modifications
5. Original gist remains unchanged
```

### Embed Gist in Webpage

```html
<!-- Use the gist embed URL -->
<script src="https://gist.example.com/username/gist-id.js"></script>
```

## Troubleshooting

### Opengist UI Not Accessible

**Symptoms**: Cannot access `https://gist.example.com`

**Checks**:
1. Verify Traefik is routing correctly:
   ```bash
   docker logs <traefik-container>
   ```
2. Check Opengist container logs:
   ```bash
   docker compose logs opengist
   ```
3. Verify domain DNS is pointing to your Dokploy server
4. Ensure port 443 is open on your firewall

### Database Connection Errors

**Symptoms**: Opengist logs show "Connection refused" or "Connection timeout"

**Solution**:
1. Check PostgreSQL is healthy:
   ```bash
   docker compose ps postgres
   ```
2. Verify PostgreSQL logs:
   ```bash
   docker compose logs postgres
   ```
3. Ensure opengist-net network exists:
   ```bash
   docker network ls | grep opengist
   ```
4. Check database credentials in environment variables

### Git Clone Fails (HTTP)

**Symptoms**: `fatal: repository not found` or `401 Unauthorized`

**Checks**:
1. Verify gist exists and is accessible in UI
2. Check authentication credentials (username/password or token)
3. Ensure HTTP Git access is enabled (default: enabled)
4. Verify URL format: `https://gist.example.com/username/gist-id.git`

### Git Clone Fails (SSH)

**Symptoms**: `Connection refused` on port 2222

**Solution**:
- **If SSH port NOT exposed** (default):
  - SSH Git access works internally only
  - Use HTTP Git access instead: `https://gist.example.com/...`

- **If SSH port IS exposed**:
  1. Verify port mapping in docker-compose.yml
  2. Check firewall allows port 2222
  3. Ensure SSH key is added in Opengist UI (Settings > SSH Keys)
  4. Test connection: `ssh -T -p 2222 git@gist.example.com`

### High Disk Usage

**Symptoms**: Storage filling up rapidly

**Solutions**:
1. Large gist files consume disk space
2. Check largest repositories:
   ```bash
   docker compose exec opengist du -sh /opengist/*
   ```
3. Consider deleting old/unused gists
4. Increase storage allocation if needed

### Syntax Highlighting Not Working

**Symptoms**: Code displays without highlighting

**Solution**:
1. Ensure filename has correct extension (e.g., `.py`, `.js`, `.go`)
2. Check browser JavaScript is enabled
3. Clear browser cache
4. Verify Opengist version supports the language

## Backup and Restore

### Backup PostgreSQL Database

```bash
docker compose exec postgres pg_dump -U opengist opengist > opengist-db-backup-$(date +%Y%m%d).sql
```

### Backup Git Repositories (Gists)

```bash
docker compose cp opengist:/opengist ./opengist-gists-backup-$(date +%Y%m%d)
```

### Restore Database

```bash
docker compose exec -T postgres psql -U opengist opengist < opengist-db-backup-YYYYMMDD.sql
```

### Restore Git Repositories

```bash
docker compose cp ./opengist-gists-backup-YYYYMMDD opengist:/opengist
docker compose restart opengist
```

### Full Backup Script

```bash
#!/bin/bash
# backup-opengist.sh

BACKUP_DIR="./backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup database
docker compose exec postgres pg_dump -U opengist opengist > "$BACKUP_DIR/database.sql"

# Backup gists
docker compose cp opengist:/opengist "$BACKUP_DIR/gists"

echo "Backup complete: $BACKUP_DIR"
```

## Upgrading

### Minor Version Upgrades (e.g., 1.11 → 1.12)

1. Update image version in docker-compose.yml:
   ```yaml
   image: ghcr.io/thomiceli/opengist:1.12  # Change version number
   ```
2. Redeploy via Dokploy UI
3. Verify health after upgrade:
   ```bash
   docker compose ps
   docker compose logs opengist
   ```

### Major Version Upgrades (e.g., 1.x → 2.x)

1. **Backup database and gists** (see above)
2. Review [Opengist release notes](https://github.com/thomiceli/opengist/releases)
3. Update image version in docker-compose.yml
4. Check for breaking changes in configuration
5. Redeploy and monitor logs
6. Test gist creation and Git operations

## Security Considerations

### SSH Git Access

**Default Configuration**: SSH Git access is **enabled internally but NOT exposed externally**.

**Why?**
- Reduces attack surface (no exposed SSH port)
- HTTP(S) Git access is more secure with Traefik SSL
- Internal SSH works for local/docker network access

**Enabling External SSH** (if needed):
1. Add port mapping to docker-compose.yml (see Security Recommendation above)
2. Use strong SSH keys (Ed25519 or RSA 4096-bit)
3. Monitor SSH access logs
4. Consider fail2ban for brute-force protection

### Database Security

- ✅ PostgreSQL isolated on internal network only
- ✅ Auto-generated 32-character password
- ✅ No external database port exposure
- ✅ Encrypted client-server connections

### HTTPS & Headers

The template includes:
- ✅ Automatic HTTPS via Let's Encrypt
- ✅ HTTP Strict Transport Security (HSTS) - 1 year
- ✅ Content-Type sniffing protection
- ✅ Clickjacking protection (frame-deny)
- ✅ XSS filter enabled
- ✅ Referrer policy: strict-origin-when-cross-origin

### Session Security

- ✅ OG_SECRET_KEY auto-generated (base64:64)
- ✅ Secure session cookies (HTTPS only)
- ✅ Session encryption with high-entropy key

## API Access

Opengist provides a RESTful API for programmatic access:

### Generate API Token

1. Login to Opengist UI
2. Go to **Settings** > **API Tokens**
3. Click **"Create New Token"**
4. Copy token (shown only once)

### Example API Usage

```bash
# List your gists
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://gist.example.com/api/gists

# Create a gist
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Gist",
    "files": {
      "hello.py": {
        "content": "print(\"Hello, World!\")"
      }
    },
    "public": true
  }' \
  https://gist.example.com/api/gists
```

## Resources

- **Official Website**: https://github.com/thomiceli/opengist
- **Documentation**: https://opengist.io/docs
- **GitHub**: https://github.com/thomiceli/opengist
- **Release Notes**: https://github.com/thomiceli/opengist/releases
- **Issue Tracker**: https://github.com/thomiceli/opengist/issues

## License

Opengist is open-source software licensed under the AGPL-3.0 License.

## Support

- **GitHub Issues**: https://github.com/thomiceli/opengist/issues
- **Documentation**: https://opengist.io/docs
- **Community**: Check GitHub Discussions for community support

---

**Template Version**: 1.0.0
**Last Updated**: December 2025
**Opengist Version**: 1.11
