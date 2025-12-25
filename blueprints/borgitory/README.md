# Borgitory - BorgBackup Web UI

Self-hosted web interface for managing BorgBackup repositories with scheduling, monitoring, and cloud synchronization.

## Overview

Borgitory is a modern web-based management interface for BorgBackup repositories. It provides an intuitive UI for creating, managing, and monitoring backups with features like scheduling, health monitoring, archive browsing, and cloud sync via Rclone.

### Features

- **Repository Management**: Create and manage multiple BorgBackup repositories
- **Backup Scheduling**: Configure automated backup jobs with cron-like scheduling
- **Archive Browsing**: Mount and browse backup archives using FUSE (Filesystem in Userspace)
- **Health Monitoring**: Dashboard with backup status and repository health
- **Cloud Sync**: Sync repositories to cloud storage via Rclone integration
- **Embedded SQLite**: No separate database required
- **Docker-Native**: Designed for containerized deployments

## Architecture

```
┌─────────────────────────────┐
│      Borgitory              │
│  ┌──────────────────────┐   │  Port 8000
│  │   Web UI             │◄──┼─────────────► Traefik
│  │   (BorgBackup Mgmt)  │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │   SQLite Database    │   │  Embedded
│  │   (Config, Jobs)     │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │   BorgBackup         │   │  Included
│  │   (Backup Engine)    │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │   Rclone             │   │  Included
│  │   (Cloud Sync)       │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │   FUSE Mount         │   │  Archive Browsing
│  │   (/dev/fuse)        │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
```

**Service Count:** 1
**Database:** SQLite (embedded)
**Storage:** 10GB+ recommended (plus backup repositories)

## Resource Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 1 core | 2 cores |
| RAM | 512MB | 2GB |
| Storage | 10GB | 50GB+ (depends on backup size) |
| Repositories | - | User-defined volumes |

## Configuration Variables

### Required Variables

| Variable | Description | Example | Auto-Generated |
|----------|-------------|---------|----------------|
| `BORGITORY_DOMAIN` | Your Borgitory domain name | `backup.example.com` | No (user provides) |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|------------|
| `BORGITORY_DEBUG` | Enable debug logging | `false` | `true` / `false` |
| `TZ` | Timezone for scheduling | `UTC` | `America/New_York`, `Europe/London` |

### Internal Variables (Pre-configured)

These variables are **pre-configured** and should not be changed:

| Variable | Value | Purpose |
|----------|-------|---------|
| `BORGITORY_HOST` | `0.0.0.0` | Listen on all interfaces |
| `BORGITORY_PORT` | `8000` | Internal web server port |
| `BORGITORY_DATA_DIR` | `/app/data` | Application data directory |

## Deployment Instructions

### Prerequisites

1. **Domain Requirements:**
   - A domain you control (e.g., `example.com`)
   - DNS access to create A records
   - Subdomain for Borgitory (e.g., `backup.example.com`)

2. **Docker Requirements:**
   - Docker host with FUSE support
   - Kernel module `fuse` loaded: `lsmod | grep fuse`
   - If not loaded: `modprobe fuse`

3. **Storage Preparation:**
   - Dedicated volume for application data (`borgitory-data`)
   - Optional: Additional volumes for backup sources
   - Optional: Additional volumes for backup repositories

### Step 1: Deploy Template

1. In Dokploy, create a new service
2. Select the "Borgitory" template
3. Configure required variables:
   - **Domain:** `backup.example.com`

### Step 2: Configure Optional Settings

**Debug Mode (Optional):**
```
BORGITORY_DEBUG: true
```

**Timezone (Optional):**
```
TZ: America/New_York
```

### Step 3: Deploy and Verify

1. Click "Deploy"
2. Wait for health check to pass (60 seconds startup time)
3. Verify deployment:
   ```bash
   curl https://backup.example.com/health
   # Should return: HTTP 200 OK
   ```

### Step 4: Initial Configuration

After deployment, access Borgitory:

1. Navigate to `https://backup.example.com`
2. Complete initial setup wizard
3. Create your first BorgBackup repository
4. Configure backup sources (see below)

## Backup Sources Configuration

Borgitory needs access to directories you want to back up. You have two options:

### Option A: Docker Bind Mounts (Recommended for Dokploy)

Add bind mounts to the Borgitory service in Dokploy UI:

**Example:**
```yaml
volumes:
  - borgitory-data:/app/data
  - /path/to/backup/source:/mnt/source1:ro
  - /path/to/another/source:/mnt/source2:ro
```

**Important:** Use `:ro` (read-only) for backup sources to prevent accidental modifications.

### Option B: Docker Volumes

Create named volumes for backup sources:

```bash
docker volume create backup-source-1
docker volume create backup-source-2
```

Add to service:
```yaml
volumes:
  - borgitory-data:/app/data
  - backup-source-1:/mnt/source1:ro
  - backup-source-2:/mnt/source2:ro
```

## Backup Repositories Storage

### Local Repository Storage

By default, repositories are stored in the `borgitory-data` volume at `/app/data/repos`.

**For large repositories, create a dedicated volume:**

```yaml
volumes:
  - borgitory-data:/app/data
  - backup-repos:/app/data/repos
```

### Remote Repository Storage (Rclone)

Borgitory includes Rclone for cloud backup destinations:

**Supported Cloud Providers:**
- Cloudflare R2
- Amazon S3
- Google Cloud Storage
- Microsoft Azure Blob
- Backblaze B2
- Wasabi
- Any S3-compatible storage

**Configuration:**
1. In Borgitory UI, go to **Settings** → **Rclone**
2. Add remote configuration
3. Create repository with remote storage backend
4. Schedule automatic cloud sync

**Example: Cloudflare R2**
```
rclone remote type: s3
Endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
Access Key ID: <R2_ACCESS_KEY_ID>
Secret Access Key: <R2_SECRET_ACCESS_KEY>
Region: auto
```

## Post-Deployment

### Creating Backup Jobs

1. **Create Repository:**
   - Navigate to **Repositories** → **Add New**
   - Choose local or remote storage
   - Initialize with encryption passphrase
   - **Important:** Store passphrase securely (required for restore)

2. **Add Backup Source:**
   - Navigate to **Sources** → **Add New**
   - Select mount point (e.g., `/mnt/source1`)
   - Configure exclusion patterns (optional)

3. **Schedule Backup:**
   - Navigate to **Jobs** → **Add New**
   - Select repository and source
   - Configure schedule (cron expression or presets)
   - Set retention policy (keep last N backups)

### Browsing Archives

Borgitory's FUSE integration allows browsing backup archives:

1. Navigate to **Archives**
2. Select an archive
3. Click **Mount**
4. Browse files in web UI
5. Download individual files or directories
6. Unmount when done

**Note:** FUSE mounting requires `SYS_ADMIN` capability and `/dev/fuse` device (already configured in template).

### Backup Strategy

**Example Daily Backup Job:**
```
Repository: main-repo (Cloudflare R2)
Source: /mnt/source1
Schedule: Daily at 2:00 AM
Retention: Keep last 30 daily, 12 monthly
Encryption: AES-256 (BorgBackup default)
```

**Verification Schedule:**
```
Weekly: Verify backup integrity
Monthly: Test restore of random files
Quarterly: Full restore test to separate location
```

## Monitoring

### Health Check

**Endpoint:**
```bash
curl https://backup.example.com/health
```

**Expected Response:** HTTP 200 OK

### Dashboard Metrics

The Borgitory dashboard shows:
- Repository health status
- Last backup timestamp
- Storage usage (local and remote)
- Failed backup alerts
- Schedule status

### Logs

**View logs:**
```bash
docker compose logs -f borgitory
```

**Enable debug logging:**
```
BORGITORY_DEBUG=true
```

**Log locations:**
- Application logs: Container stdout/stderr
- BorgBackup logs: `/app/data/logs/borg/`
- SQLite database: `/app/data/borgitory.db`

### Disk Usage

**Check application data:**
```bash
docker exec borgitory_borgitory du -sh /app/data/*
```

**Monitor backup repository size:**
- Local: Check in Borgitory dashboard
- Remote: Check cloud provider console

## Troubleshooting

### Issue: FUSE Mount Failed

**Symptoms:** Cannot mount archives, "FUSE not available" error

**Cause:** FUSE kernel module not loaded or device not accessible

**Solution:**
1. Check kernel module:
   ```bash
   lsmod | grep fuse
   ```
2. Load module if missing:
   ```bash
   sudo modprobe fuse
   ```
3. Verify `/dev/fuse` exists:
   ```bash
   ls -l /dev/fuse
   ```
4. Restart Borgitory service

### Issue: Backup Jobs Not Running

**Symptoms:** Scheduled backups don't execute

**Cause:** Incorrect cron expression or timezone mismatch

**Solution:**
1. Verify cron expression in job configuration
2. Check timezone setting:
   ```
   TZ=America/New_York
   ```
3. Review logs for scheduler errors:
   ```bash
   docker compose logs borgitory | grep scheduler
   ```
4. Test job manually from UI

### Issue: Cloud Sync Failing

**Symptoms:** Rclone errors, sync jobs fail

**Cause:** Invalid credentials or network issues

**Solution:**
1. Verify Rclone remote configuration in UI
2. Test connection:
   ```bash
   docker exec borgitory rclone lsd <remote>:
   ```
3. Check network connectivity:
   ```bash
   docker exec borgitory curl -I https://r2.cloudflarestorage.com
   ```
4. Review Rclone logs in Borgitory UI

### Issue: High Disk Usage

**Symptoms:** `/app/data` volume filling up

**Cause:** Repository growth or too many archives

**Solution:**
1. Check storage breakdown:
   ```bash
   docker exec borgitory du -sh /app/data/*
   ```
2. Review retention policies (reduce kept archives)
3. Prune old archives:
   - UI: **Repository** → **Prune Archives**
   - Command: `borg prune --keep-last N`
4. Consider moving repositories to dedicated volume or cloud storage

### Issue: Restore Performance Slow

**Symptoms:** Archive browsing or restore operations are slow

**Cause:** Large archives, network latency (cloud repos), or resource constraints

**Solution:**
1. Use local repository for faster restores
2. Increase container resources (CPU, RAM)
3. For cloud repos: download entire archive first, then extract
4. Consider parallel restore jobs (Borg supports concurrency)

## Security Considerations

1. **Encryption Passphrase:**
   - BorgBackup uses repository-level encryption
   - Store passphrase securely (password manager, vault)
   - **Required for all restore operations**
   - No passphrase recovery (lost passphrase = lost backups)

2. **Access Control:**
   - Borgitory has user authentication
   - Default: No authentication (add via reverse proxy)
   - Consider using Cloudflare Zero Trust or Authelia

3. **Network Security:**
   - HTTPS enforced (Let's Encrypt automatic)
   - Firewall: Only ports 80/443 need to be open
   - Internal SQLite database (no external DB ports)

4. **Container Security:**
   - `SYS_ADMIN` capability required for FUSE
   - `/dev/fuse` device access required
   - Both are necessary for archive mounting feature
   - Consider AppArmor/SELinux profiles for additional isolation

5. **Cloud Credentials:**
   - Store Rclone credentials in Borgitory (encrypted in SQLite)
   - Use least-privilege cloud IAM policies
   - Rotate cloud access keys regularly

6. **Backup Verification:**
   - Enable BorgBackup's built-in integrity checks
   - Schedule regular `borg check` operations
   - Test restores periodically

## Backup & Recovery

### Backing Up Borgitory Configuration

**Critical Data:**
- SQLite database: `/app/data/borgitory.db`
- Rclone configuration: `/app/data/rclone.conf`
- BorgBackup repositories: `/app/data/repos/` (or remote)

**Backup Command:**
```bash
# Backup application data
docker run --rm \
  -v borgitory_borgitory-data:/data:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/borgitory-config-$(date +%Y%m%d).tar.gz /data
```

**Backup Schedule:**
- Daily: Configuration and database
- Weekly: Full backup including local repositories
- Continuous: Cloud sync for remote repositories

### Disaster Recovery

**Restore Borgitory:**
1. Deploy Borgitory template with same domain
2. Stop service: `docker compose stop borgitory`
3. Restore data volume:
   ```bash
   docker run --rm \
     -v borgitory_borgitory-data:/data \
     -v $(pwd):/backup \
     alpine sh -c "cd /data && tar xzf /backup/borgitory-config-YYYYMMDD.tar.gz --strip 1"
   ```
4. Start service: `docker compose start borgitory`
5. Verify repositories are accessible

**Restore from BorgBackup:**
1. Initialize new Borgitory instance
2. Re-add repository with original passphrase
3. Browse archives and select files to restore
4. Extract to destination

## Upgrade Procedure

Borgitory uses `:latest` tag (active development):

**Update Steps:**
1. Backup current configuration (see above)
2. Pull new image:
   ```bash
   docker compose pull borgitory
   ```
3. Recreate container:
   ```bash
   docker compose up -d --force-recreate borgitory
   ```
4. Verify health:
   ```bash
   curl https://backup.example.com/health
   ```
5. Check logs for errors:
   ```bash
   docker compose logs borgitory | tail -100
   ```

**Rollback:**
If upgrade fails, restore from backup:
```bash
docker compose stop borgitory
# Restore data volume (see Disaster Recovery above)
docker compose start borgitory
```

## Performance Optimization

### For Large Repositories

**Increase container resources:**
```yaml
services:
  borgitory:
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"
```

**Use chunker parameters for large files:**
```
borg create --chunker-params 19,23,21,4095 ...
```

### For Many Concurrent Backups

**Adjust BorgBackup lock timeout:**
```
BORG_LOCK_WAIT=600  # 10 minutes
```

**Use separate repositories per source:**
- Reduces lock contention
- Enables parallel backup jobs

### For Cloud Repositories

**Enable Rclone caching:**
```
rclone mount --vfs-cache-mode full ...
```

**Use transfer acceleration:**
- Cloudflare R2: Use Workers for edge caching
- AWS S3: Enable Transfer Acceleration

## Limitations

- **Single Instance:** Not designed for HA/multi-replica deployments
- **User Scale:** Best for individual or small team use (1-10 users)
- **Repository Size:** Performance degrades with very large repositories (>1TB)
- **Concurrent Operations:** Limited by Docker host resources

## References

- **Borgitory Documentation:** https://github.com/mlapaglia/borgitory
- **BorgBackup Docs:** https://borgbackup.readthedocs.io/
- **Rclone Docs:** https://rclone.org/docs/
- **FUSE Documentation:** https://www.kernel.org/doc/html/latest/filesystems/fuse.html

## Version Information

- **Borgitory Version:** Latest (active development)
- **Template Version:** 1.0.0
- **Last Updated:** December 2025
- **Maintainer:** Community (mlapaglia/borgitory)

## Support

- **GitHub Issues:** https://github.com/mlapaglia/borgitory/issues
- **BorgBackup Community:** https://github.com/borgbackup/borg/discussions
- **Docker Community:** https://forums.docker.com/
