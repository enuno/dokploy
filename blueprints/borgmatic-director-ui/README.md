# Borgmatic Director UI

A modern, powerful web interface for Borg Backup and Borgmatic. Create, schedule, and manage backups on Linux servers with an intuitive UI — no YAML editing or cron syntax required.

## Overview

Borgmatic Director UI wraps the battle-tested Borg/Borgmatic backup stack in a visual wizard-driven interface. It supports files, databases, local and remote repositories, and includes a visual archive browser for easy restores.

## What's Included

| Service | Image | Description |
|---------|-------|-------------|
| Borgmatic UI | `ghcr.io/speedbitsinfinitytools/borgmatic-ui:v1.0.33` | Web UI + embedded Borg 1.x/2.x + Borgmatic |

## Requirements

- **Domain**: A fully-qualified domain name pointing to your Dokploy server
- **Storage**: Sufficient disk space for backup repositories
- **Optional**: Docker socket access if you want automatic database discovery

## Post-Deployment Setup

### 1. Access the Dashboard

After deployment, open `https://your-domain` in a browser.

### 2. Create the Admin Account

On first login you will see **Create admin password**:

- **Username**: `admin` (fixed)
- **Password**: Choose a secure password (minimum 10 characters)

Alternatively, set `ADMIN_PASSWORD` in the template variables before first deployment to auto-create the admin.

### 3. Configure SSH Keys

Navigate to **Settings → SSH Keys** and generate or import an SSH key pair. This key is used to authenticate with remote backup repositories.

### 4. Add a Repository

Go to **Repositories → Add New** and choose your storage backend:

- **Local** — Attached disk on the server
- **SSH/SFTP** — Remote server via SSH
- **Hetzner Storage Box** — Native Borg 1.x support
- **S3-compatible** — AWS S3, MinIO, Backblaze B2, etc.
- **Rclone** — 70+ cloud providers

### 5. Create a Backup Job

Go to **Backup Jobs → Create New** and use the step-by-step wizard:

1. **Select sources** — Files, directories, or discovered databases
2. **Select destination** — The repository you added
3. **Set schedule** — Visual time picker (no cron syntax needed)
4. **Configure retention** — How long to keep backups
5. **Review and save**

### 6. Set Up Notifications (Optional)

Navigate to **Settings → Notifications**:

- **ntfy** — Self-hosted push notifications
- **Apprise** — Connect to 100+ services (Slack, Discord, Email, Telegram, etc.)

## Optional Features

### Host Filesystem Backups

To back up the host filesystem, uncomment the host root mount in `docker-compose.yml`:

```yaml
volumes:
  - /:/host:ro
```

Then configure backup sources pointing to `/host/path/on/host`.

### Database Auto-Discovery

To automatically detect running database containers, uncomment the Docker socket mount:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

Supported databases: MariaDB, MySQL, PostgreSQL, MongoDB, SQLite, MSSQL.

## Architecture

- **Port 8000**: Web UI and API
- **Volumes**:
  - `/app/config` — SSH keys, repository configs, schedules, admin settings
  - `/app/data` — Job history, logs, cache
- **Health Check**: `GET /api/health`

## Important Notes

- Backup repositories are stored **outside** this container (on attached storage or remote hosts). The container only stores configuration and metadata.
- The included `borg` binary is Borg 2.x by default. Use `borg1` for repositories requiring Borg 1.x (e.g., Hetzner Storage Boxes).
- For commercial use or Director Mode (centralized multi-server management), visit [speedbits.io](https://speedbits.io).

## Updating

To update Borgmatic Director UI:

1. Check the latest release: <https://github.com/SpeedbitsInfinityTools/borgmatic-ui-community/releases>
2. Update the image tag in `docker-compose.yml`
3. Redeploy via Dokploy

## Links

- **GitHub**: <https://github.com/SpeedbitsInfinityTools/borgmatic-ui-community>
- **Website**: <https://speedbits.io>
