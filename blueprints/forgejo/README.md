# Forgejo Dokploy Template

A production-ready Dokploy template for [Forgejo](https://forgejo.org/) - a self-hosted, community-driven Git forge. Forgejo is a soft fork of Gitea, providing a lightweight and powerful Git server.

## Features

- Full Git hosting with web interface
- Pull requests, issues, and project management
- Built-in CI/CD with Forgejo Actions
- Git LFS support enabled
- PostgreSQL database for reliability
- Health checks on all services
- Auto-generated secure secrets

## Service Architecture

```
                    +------------------+
                    |    Dokploy       |
                    |  (Reverse Proxy) |
                    +--------+---------+
                             |
                             | :3000
                             v
                    +--------+---------+
                    |     Forgejo      |
                    |   (Git Server)   |
                    +--------+---------+
                             |
                             v
                    +--------+---------+
                    |   PostgreSQL     |
                    |   (Database)     |
                    +------------------+
                          :5432
```

## Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| forgejo | `codeberg.org/forgejo/forgejo:9` | 3000 | Git web interface and API |
| postgres | `postgres:16-alpine` | 5432 | Repository metadata database |

## Resource Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 512 MB | 1 GB |
| CPU | 1 core | 2 cores |
| Storage | 5 GB | 20+ GB (depends on repo size) |

## Required Environment Variables

Set these in Dokploy before deploying:

| Variable | Example | Description |
|----------|---------|-------------|
| `FORGEJO_DOMAIN` | `git.hashgrid.net` | Your domain for Forgejo |
| `POSTGRES_PASSWORD` | (random 32 chars) | Database password |
| `FORGEJO_SECRET_KEY` | (random 64 chars) | Session encryption key |
| `FORGEJO_INTERNAL_TOKEN` | (random 48 chars) | Internal API token |

### Generate Secrets

```bash
# FORGEJO_SECRET_KEY (64 chars)
openssl rand -base64 48

# FORGEJO_INTERNAL_TOKEN (48 chars)
openssl rand -base64 36

# POSTGRES_PASSWORD (32 chars)
openssl rand -base64 24
```

## Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FORGEJO_DISABLE_REGISTRATION` | `false` | Set `true` to disable signups |
| `FORGEJO_REQUIRE_SIGNIN` | `false` | Set `true` to require login for viewing |
| `FORGEJO_LOG_LEVEL` | `Info` | Trace, Debug, Info, Warn, Error |

## Post-Deployment Steps

### 1. Access the Web UI

Navigate to `https://<your-domain>` (e.g., `https://git.hashgrid.net`)

### 2. Create Admin Account

On first visit, you'll be prompted to create the initial admin account.

**Important:** Create your admin account immediately after deployment. The first registered user becomes the administrator.

### 3. Configure Settings

1. Go to **Site Administration** (gear icon)
2. Configure:
   - **SSH settings** if you need SSH clone URLs
   - **Email notifications** (optional)
   - **OAuth2 providers** for SSO
   - **Actions** for CI/CD runners

### 4. Disable Registration (Recommended)

After creating your account, disable public registration:

Set in Dokploy environment:
```
FORGEJO_DISABLE_REGISTRATION=true
```

Then redeploy.

## Volume Mounts

| Volume | Container Path | Purpose |
|--------|----------------|---------|
| `forgejo-data` | `/data` | Git repositories, avatars, attachments |
| `postgres-data` | `/var/lib/postgresql/data` | Database files |

## SSH Access (Optional)

This template uses HTTPS-only by default. For SSH clone URLs:

1. Expose port 22 (or custom port like 2222) in Dokploy
2. Configure your SSH client:
   ```
   Host git.hashgrid.net
     Port 2222
     User git
   ```

## Git LFS

Git LFS is enabled by default. Large files are stored in `/data/lfs`.

To use:
```bash
git lfs install
git lfs track "*.psd"
git add .gitattributes
git commit -m "Track PSD files with LFS"
```

## Forgejo Actions (CI/CD)

Forgejo Actions is compatible with GitHub Actions. To enable:

1. Go to **Site Administration > Actions**
2. Enable Actions
3. Register a runner or use hosted runners

Example workflow (`.forgejo/workflows/ci.yml`):
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: docker
    steps:
      - uses: actions/checkout@v4
      - run: echo "Hello from Forgejo Actions!"
```

## Backup & Restore

### Backup

```bash
# Backup Forgejo data
docker exec <forgejo-container> forgejo dump -c /data/gitea/conf/app.ini

# Backup PostgreSQL
docker exec <postgres-container> pg_dump -U forgejo forgejo > backup.sql
```

### Restore

```bash
# Restore PostgreSQL
cat backup.sql | docker exec -i <postgres-container> psql -U forgejo forgejo

# Restore Forgejo (extract dump to /data)
```

## Migrating from GitHub/GitLab

Forgejo can import repositories from:
- GitHub
- GitLab
- Gitea
- Gogs
- Bitbucket
- Any Git URL

Go to **+ New Repository > Migrate Repository**

## Troubleshooting

### Cannot Connect to Database

1. Verify PostgreSQL is healthy: `docker logs <postgres-container>`
2. Check `POSTGRES_PASSWORD` matches in both services
3. Ensure both services are on `forgejo-net` network

### 502 Bad Gateway

1. Wait for Forgejo to fully start (~60 seconds)
2. Check logs: `docker logs <forgejo-container>`
3. Verify health check passes: `curl http://localhost:3000/api/healthz`

### Permission Denied on /data

Ensure `USER_UID` and `USER_GID` match your host user or reset volume ownership:
```bash
docker exec <forgejo-container> chown -R 1000:1000 /data
```

### Reset Admin Password

```bash
docker exec -it <forgejo-container> forgejo admin user change-password \
  --username admin --password newpassword
```

## Security Recommendations

1. **Disable registration** after creating your accounts
2. **Enable 2FA** in user settings
3. **Use SSH keys** instead of passwords for Git operations
4. **Regular backups** - automate with cron
5. **Keep updated** - Forgejo releases security patches regularly

## Additional Resources

- [Forgejo Documentation](https://forgejo.org/docs/)
- [Forgejo on Codeberg](https://codeberg.org/forgejo/forgejo)
- [Configuration Cheat Sheet](https://forgejo.org/docs/latest/admin/config-cheat-sheet/)
- [Forgejo Actions](https://forgejo.org/docs/latest/user/actions/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12 | Initial template with PostgreSQL |
