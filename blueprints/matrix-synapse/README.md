# Matrix Synapse

Decentralized, real-time communication homeserver for the Matrix protocol.

## Overview

Matrix Synapse is the reference homeserver implementation for the Matrix protocol, enabling secure, decentralized messaging, VoIP, and video calling. This production-ready Dokploy template features:

- **Cloudflare R2 Integration** - Unlimited media storage with zero egress fees
- **PostgreSQL Backend** - Production-grade database with proper encoding (UTF-8, locale C)
- **Redis Support** - Ready for horizontal scaling with worker processes
- **Federation Ready** - Proper port configuration for server-to-server communication (8448)
- **Automatic SSL** - Let's Encrypt certificates via Traefik reverse proxy
- **Optional Zero Trust** - Admin API protection with Cloudflare Access (SSO/2FA)
- **Health Monitoring** - Comprehensive health checks for all services

Run your own Matrix homeserver with this battle-tested template. Perfect for communities, organizations, or personal use.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Traefik Reverse Proxy                  │
│                                                           │
│    ┌──────────────────┐         ┌──────────────────┐    │
│    │   Port 443       │         │   Port 8448      │    │
│    │   (Client API)   │         │   (Federation)   │    │
│    └────────┬─────────┘         └────────┬─────────┘    │
└─────────────┼────────────────────────────┼──────────────┘
              │                            │
              │    HTTPS (Client)          │ Direct (Fed)
              │                            │
        ┌─────▼────────────────────────────▼─────┐
        │         Matrix Synapse v1.145.0        │
        │         (HTTP Port 8008)                │
        └────────────────┬───────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────────┐
  │PostgreSQL│    │  Redis   │    │Cloudflare R2 │
  │16-alpine │    │7-alpine  │    │ (Media Store)│
  │ (Data)   │    │ (Cache)  │    │ (Optional)   │
  └────┬─────┘    └────┬─────┘    └──────────────┘
       │               │
  synapse-net    synapse-net         (External)
   (Internal)     (Internal)
```

**Network Topology:**
- **synapse-net** (bridge): Internal network for database and cache
- **dokploy-network** (external): Traefik routing for client traffic
- **Port 8448**: Direct federation traffic (bypasses Traefik)

---

## Features

### Core Features
- ✅ Decentralized messaging (federate with other Matrix servers)
- ✅ End-to-end encryption (E2EE) for private conversations
- ✅ VoIP and video calling
- ✅ File sharing and media uploads
- ✅ Group chat and communities
- ✅ Bridges to other platforms (Telegram, Discord, Slack)

### Production Features
- ✅ PostgreSQL for reliable data persistence
- ✅ Redis for caching and worker support
- ✅ Cloudflare R2 for unlimited media storage
- ✅ Automatic SSL certificate management
- ✅ Health checks and monitoring
- ✅ Horizontal scaling ready (worker support)

---

## Requirements

### System Requirements
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**:
  - System/Database: 20GB minimum
  - Media Storage: Grows with usage (use R2 for unlimited)
- **Network**: Port 8448 must be accessible for federation

### Prerequisites
- Docker and Docker Compose
- Dokploy deployment platform
- Domain name with DNS control
- (Optional) Cloudflare account for R2 storage

---

## Quick Start

### 1. Deploy Template

Deploy via Dokploy UI and configure required variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `domain` | Your Matrix server domain | `matrix.example.com` |
| `postgres_password` | PostgreSQL password (auto-generated) | `random32chars` |

### 2. Generate Configuration

After first deployment, generate `homeserver.yaml`:

```bash
docker exec -it <synapse-container> generate
```

### 3. Create Admin User

Create your first admin user:

```bash
docker exec -it <synapse-container> register_new_matrix_user \
  http://localhost:8008 \
  -c /data/homeserver.yaml \
  --admin
```

Follow prompts to set username and password.

### 4. Connect Client

Download a Matrix client:
- **Element** (Web/Desktop/Mobile): https://element.io
- **FluffyChat** (Mobile): https://fluffychat.im
- **Nheko** (Desktop): https://nheko-reborn.github.io

Connect using your homeserver URL: `https://matrix.example.com`

### 5. Test Federation

Verify federation is working:

```bash
curl https://federationtester.matrix.org/api/report?server_name=matrix.example.com
```

Should return JSON with `"AllChecksOK": true`.

---

## Cloudflare R2 Media Storage Setup

Matrix generates significant media storage (uploads, avatars, room files). Cloudflare R2 provides **unlimited, cost-effective storage** with **zero egress fees**.

### Why Use R2?

| Feature | R2 | AWS S3 | Local Storage |
|---------|-----|--------|---------------|
| **Storage Cost** | $0.015/GB/month | $0.023/GB/month | Free (limited) |
| **Egress Cost** | **$0 (FREE!)** | $0.09/GB | N/A |
| **Scalability** | Unlimited | Unlimited | Limited by disk |
| **Durability** | 99.999999999% | 99.999999999% | RAID dependent |

**Example Cost Comparison (100GB storage + 1TB egress/month):**
- **Cloudflare R2**: ~$1.50/month
- **AWS S3**: ~$93.50/month ($1.50 storage + $92 egress)
- **Savings**: $1,104/year with R2!

### Automated Setup (Recommended)

Use the provided Wrangler CLI script:

```bash
# Install Wrangler (one-time)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Run automated setup
cd blueprints/matrix-synapse/scripts
./setup-r2.sh matrix-synapse-media
```

This script will:
1. Create R2 bucket
2. Display your Account ID
3. Provide token creation instructions
4. Show endpoint URL

### Manual Setup

#### Step 1: Create R2 Bucket

1. Log in to **Cloudflare Dashboard**
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Bucket name: `matrix-synapse-media` (or your preferred name)
5. Region: **Automatic** (recommended for global distribution)
6. Click **Create bucket**

#### Step 2: Generate R2 API Tokens

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Token name: `synapse-media-storage`
4. Permissions: **Object Read & Write**
5. Bucket scope: **Apply to specific buckets only**
6. Select bucket: `matrix-synapse-media`
7. Click **Create API token**
8. **Copy and save immediately:**
   - Access Key ID
   - Secret Access Key
   ⚠️ Secret key is shown only once!

#### Step 3: Get Cloudflare Account ID

1. In Cloudflare Dashboard, look at the URL
2. Format: `https://dash.cloudflare.com/<ACCOUNT_ID>/...`
3. Copy the Account ID (alphanumeric string)

#### Step 4: Configure in Dokploy

When deploying the template, set these variables:

| Variable | Value | Example |
|----------|-------|---------|
| `cf_account_id` | Your Cloudflare Account ID | `abc123def456...` |
| `r2_bucket_name` | Bucket name from Step 1 | `matrix-synapse-media` |
| `r2_access_key_id` | Access Key from Step 2 | `a1b2c3d4e5f6...` |
| `r2_secret_access_key` | Secret Key from Step 2 | `x9y8z7w6v5u4...` |

#### Step 5: Configure homeserver.yaml

After first deployment, edit `/data/homeserver.yaml` and add:

```yaml
media_storage_providers:
  - module: s3_storage_provider.S3StorageProviderBackend
    store_local: true          # Keep local copy for fast thumbnails
    store_remote: true         # Upload to R2
    store_synchronous: false   # Async upload (recommended)
    config:
      bucket: matrix-synapse-media
      region_name: auto
      endpoint_url: https://<CF_ACCOUNT_ID>.r2.cloudflarestorage.com
      access_key_id: <R2_ACCESS_KEY_ID>
      secret_access_key: <R2_SECRET_ACCESS_KEY>
```

**Or use the provided example:**

```bash
# Copy example config
docker cp blueprints/matrix-synapse/homeserver.yaml.example \
  <synapse-container>:/data/homeserver.yaml

# Edit with your values
docker exec -it <synapse-container> vi /data/homeserver.yaml
```

#### Step 6: Restart Synapse

```bash
docker restart <synapse-container>
```

### Verify R2 Integration

1. Upload a test file in Matrix client (room attachment)
2. Check Synapse logs for S3 upload confirmation
3. Verify file appears in R2 bucket (Cloudflare Dashboard)

---

## Configuration Variables

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `domain` | Your Matrix server domain | - | `matrix.example.com` |
| `postgres_password` | PostgreSQL password | Auto-generated | `random32chars` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `postgres_db` | Database name | `synapse` | `synapse` |
| `postgres_user` | Database user | `synapse` | `synapse` |
| `tz` | Container timezone | `UTC` | `America/New_York` |
| `uid` | User ID for Synapse process | `991` | `991` |
| `gid` | Group ID for Synapse process | `991` | `991` |

### Cloudflare R2 Variables (Optional but Recommended)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `cf_account_id` | Cloudflare Account ID | For R2 | `abc123def456...` |
| `r2_bucket_name` | R2 bucket for media | For R2 | `matrix-synapse-media` |
| `r2_access_key_id` | R2 API Access Key | For R2 | `a1b2c3d4e5f6...` |
| `r2_secret_access_key` | R2 API Secret Key | For R2 | `x9y8z7w6v5u4...` |

### Cloudflare Zero Trust Variables (Optional)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `cf_team_name` | Zero Trust team name | For Access | `my-team` |

### Ports

| Port | Protocol | Purpose | Access |
|------|----------|---------|--------|
| 8008 | HTTP | Internal API (proxied by Traefik) | Internal |
| 8448 | HTTPS | Federation (server-to-server) | **Public** |
| 443 | HTTPS | Client connections (via Traefik) | Public |

**Important:** Port 8448 must be exposed on your firewall for federation to work.

---

## Post-Deployment Setup

### 1. Generate Configuration

On first deployment, generate the Synapse configuration:

```bash
docker exec -it <synapse-container> generate
```

This creates `/data/homeserver.yaml` with your server configuration.

### 2. Configure R2 Storage (Recommended)

If using Cloudflare R2:

1. Edit `/data/homeserver.yaml`
2. Add `media_storage_providers` section (see R2 setup guide above)
3. Restart Synapse: `docker restart <synapse-container>`

### 3. Create Admin User

Create your first admin user:

```bash
docker exec -it <synapse-container> register_new_matrix_user \
  http://localhost:8008 \
  -c /data/homeserver.yaml \
  --admin
```

Follow the prompts:
- Username: Your Matrix username (without @ or domain)
- Password: Secure password
- Make admin: Yes

Your full Matrix ID will be: `@username:matrix.example.com`

### 4. Test Federation

Verify your homeserver is reachable by other Matrix servers:

```bash
curl https://federationtester.matrix.org/api/report?server_name=matrix.example.com
```

Expected output:
```json
{
  "FederationOK": true,
  "AllChecksOK": true,
  ...
}
```

If federation fails, see Troubleshooting section.

### 5. Connect a Client

Download a Matrix client:

**Desktop/Web:**
- **Element**: https://element.io (most popular)
- **Nheko**: https://nheko-reborn.github.io (lightweight)
- **Fractal**: https://gitlab.gnome.org/GNOME/fractal (GNOME)

**Mobile:**
- **Element** (iOS/Android): https://element.io/get-started
- **FluffyChat** (iOS/Android): https://fluffychat.im
- **SchildiChat** (Android): https://schildi.chat

**Configuration:**
1. Open your Matrix client
2. Choose "Sign in"
3. Select "Edit" or "Advanced" for custom homeserver
4. Homeserver URL: `https://matrix.example.com`
5. Enter username and password created in Step 3

### 6. Join Matrix Community

Test federation by joining a public room:

1. In your client, search for: `#matrix:matrix.org`
2. Join the room
3. Send a message to verify federation works

---

## Optional: Cloudflare Zero Trust Access

Protect the Synapse admin API (`/_synapse/admin`) with Cloudflare Access for SSO/2FA protection.

### Benefits
- **SSO Authentication** - Google, GitHub, Okta, etc.
- **Two-Factor Authentication** - Additional security layer
- **Audit Logs** - Track admin access
- **Device Posture** - Enforce security policies
- **No VPN Needed** - Secure remote access

### Setup

#### Step 1: Create Cloudflare Access Application

1. Go to **Cloudflare Dashboard** → **Zero Trust** → **Access** → **Applications**
2. Click **Add an application** → **Self-hosted**
3. Configure application:
   - **Name**: `Matrix Synapse Admin Panel`
   - **Session duration**: `24 hours`
   - **Application domain**: `matrix.example.com`
   - **Path**: `/_synapse/admin`

#### Step 2: Configure Identity Providers

1. In the application settings, add login methods:
   - Google Workspace
   - GitHub
   - Okta
   - One-time PIN (email)
2. Configure allowed users/groups

#### Step 3: Update docker-compose.yml

Uncomment the Zero Trust labels in `docker-compose.yml`:

```yaml
labels:
  # Admin API protection (uncomment these)
  - "traefik.http.routers.synapse-admin.rule=Host(`${DOMAIN}`) && PathPrefix(`/_synapse/admin`)"
  - "traefik.http.routers.synapse-admin.entrypoints=websecure"
  - "traefik.http.routers.synapse-admin.tls.certresolver=letsencrypt"
  - "traefik.http.routers.synapse-admin.middlewares=cf-access@docker,synapse-headers"
  - "traefik.http.middlewares.cf-access.forwardauth.address=https://${CF_TEAM_NAME}.cloudflareaccess.com/cdn-cgi/access/authorized"
  - "traefik.http.middlewares.cf-access.forwardauth.trustForwardHeader=true"
```

#### Step 4: Set CF_TEAM_NAME Variable

1. Find your team name in Zero Trust Dashboard URL:
   - Format: `https://<TEAM_NAME>.cloudflareaccess.com`
2. Set `CF_TEAM_NAME` variable in Dokploy: `my-team`

#### Step 5: Redeploy

Redeploy the template to apply changes.

#### Step 6: Test Access

1. Navigate to: `https://matrix.example.com/_synapse/admin`
2. Should redirect to Cloudflare Access login
3. Authenticate with configured identity provider
4. Should access admin API after authentication

---

## Advanced: Worker Scaling

For high-traffic deployments (1000+ concurrent users), scale Synapse horizontally using workers.

### What are Workers?

Workers are separate processes that handle specific tasks:
- **Client API workers**: Handle `/sync`, `/messages`, `/events`
- **Federation workers**: Handle inbound/outbound federation
- **Media workers**: Handle media uploads/downloads
- **Pusher workers**: Handle push notifications

### Requirements

- **Redis** (already included in template)
- Additional CPU/RAM for worker processes
- Load balancer configuration

### Architecture

```
                    Traefik
                       │
              ┌────────┼────────┐
              │        │        │
         Worker 1  Worker 2  Worker 3
         (Client)  (Client)  (Federation)
              │        │        │
              └────────┼────────┘
                       │
                  Main Process
                  (Background tasks)
                       │
                ┌──────┼──────┐
                │      │      │
           PostgreSQL Redis Synapse
```

### Configuration

1. **Enable Redis in homeserver.yaml:**

```yaml
redis:
  enabled: true
  host: redis
  port: 6379
```

2. **Create worker configuration files** in `/data/workers/`:

```yaml
# worker-client-1.yaml
worker_app: synapse.app.generic_worker
worker_name: client_worker_1

worker_listeners:
  - type: http
    port: 8081
    resources:
      - names: [client]

worker_log_config: /data/workers/client_worker_1.log.config
```

3. **Update docker-compose.yml** to run multiple containers:

```yaml
services:
  synapse-worker-client-1:
    image: matrixdotorg/synapse:v1.145.0
    command: run -c /data/homeserver.yaml -c /data/workers/client_worker_1.yaml
    # ... same volumes, networks as main
```

4. **Configure load balancing in Traefik**

For detailed worker configuration, see:
- [Official Workers Documentation](https://matrix-org.github.io/synapse/latest/workers.html)
- [Worker Example Configs](https://github.com/matrix-org/synapse/tree/develop/docs/workers.md)

---

## Troubleshooting

### Issue: "Federation check failed"

**Symptoms:** Matrix Federation Tester shows errors, other servers can't federate with you

**Common Causes:**
1. Port 8448 not accessible from internet
2. Firewall blocking inbound connections
3. DNS not resolving correctly

**Solutions:**

1. **Check port accessibility:**
   ```bash
   # From external network (not your server)
   telnet matrix.example.com 8448
   ```
   Should connect successfully.

2. **Verify firewall rules:**
   ```bash
   # Allow port 8448 (example for UFW)
   sudo ufw allow 8448/tcp

   # Check status
   sudo ufw status
   ```

3. **Test DNS resolution:**
   ```bash
   dig matrix.example.com
   ```
   Should return your server's public IP.

4. **Check Synapse logs:**
   ```bash
   docker logs <synapse-container> | grep -i federation
   ```

5. **Use Matrix Federation Tester:**
   - https://federationtester.matrix.org
   - Enter: `matrix.example.com`
   - Review detailed error messages

**Advanced:** If port 8448 can't be exposed, use SRV records or `.well-known` delegation. See [official docs](https://matrix-org.github.io/synapse/latest/delegate.html).

### Issue: "Database connection failed"

**Symptoms:** Synapse container fails health check, logs show PostgreSQL errors

**Solutions:**

1. **Check PostgreSQL container is healthy:**
   ```bash
   docker ps
   # Look for postgres container, should show "healthy"
   ```

2. **Verify environment variables match:**
   ```bash
   docker exec <synapse-container> env | grep POSTGRES
   docker exec <postgres-container> env | grep POSTGRES
   ```
   Passwords must match!

3. **Check database encoding:**
   ```bash
   docker exec <postgres-container> psql -U synapse -c "SHOW LC_COLLATE;"
   ```
   Should return `C`. If not, recreate database:
   ```bash
   docker volume rm <postgres-volume>
   docker-compose up -d
   ```

4. **Test database connection manually:**
   ```bash
   docker exec <synapse-container> psql \
     "postgresql://synapse:<password>@postgres:5432/synapse" \
     -c "SELECT version();"
   ```

5. **Restart PostgreSQL:**
   ```bash
   docker restart <postgres-container>
   # Wait 30s for health check
   ```

### Issue: "Media uploads fail"

**Symptoms:** File uploads return errors, media not appearing in rooms

**Common Causes:**
1. R2 credentials incorrect
2. R2 bucket doesn't exist
3. Storage provider not configured in homeserver.yaml

**Solutions:**

1. **Verify R2 credentials in environment:**
   ```bash
   docker exec <synapse-container> env | grep S3
   ```

2. **Check R2 bucket exists:**
   - Cloudflare Dashboard → R2
   - Verify bucket name matches `R2_BUCKET_NAME` variable

3. **Verify homeserver.yaml has media_storage_providers:**
   ```bash
   docker exec <synapse-container> cat /data/homeserver.yaml | grep -A 10 media_storage
   ```
   Should show S3 configuration.

4. **Test R2 connectivity:**
   ```bash
   # Install AWS CLI in container (temporary)
   docker exec <synapse-container> apk add --no-cache aws-cli

   # List bucket (should succeed)
   docker exec <synapse-container> aws s3 ls \
     --endpoint-url https://<account>.r2.cloudflarestorage.com \
     s3://<bucket-name>
   ```

5. **Check Synapse logs for S3 errors:**
   ```bash
   docker logs <synapse-container> | grep -i s3
   ```

6. **Fallback to local storage temporarily:**
   - Comment out `media_storage_providers` in homeserver.yaml
   - Restart Synapse
   - Uploads should work locally
   - Fix R2 configuration, then re-enable

### Issue: "Health check keeps failing"

**Symptoms:** Container restarts repeatedly, Dokploy shows unhealthy

**Solutions:**

1. **Check Synapse logs:**
   ```bash
   docker logs <synapse-container> --tail 100
   ```
   Look for startup errors.

2. **Verify homeserver.yaml exists:**
   ```bash
   docker exec <synapse-container> ls -l /data/homeserver.yaml
   ```
   If missing, run `generate` command.

3. **Test health endpoint manually:**
   ```bash
   docker exec <synapse-container> curl -f http://localhost:8008/health
   ```
   Should return `OK`.

4. **Increase start_period if slow startup:**
   Edit docker-compose.yml:
   ```yaml
   healthcheck:
     start_period: 120s  # Increase from 60s
   ```

5. **Check resource constraints:**
   ```bash
   docker stats <synapse-container>
   ```
   If CPU/RAM maxed, increase resource limits.

### Issue: "R2 storage fills but files not uploading"

**Symptoms:** Local `/data/media_store` grows but R2 bucket stays empty

**Cause:** `store_remote: false` or async upload not configured

**Solution:**

1. **Edit homeserver.yaml:**
   ```yaml
   media_storage_providers:
     - module: s3_storage_provider.S3StorageProviderBackend
       store_remote: true    # ← Must be true
       store_synchronous: false  # ← Async upload
   ```

2. **Restart Synapse:**
   ```bash
   docker restart <synapse-container>
   ```

3. **Check logs for S3 upload confirmation:**
   ```bash
   docker logs <synapse-container> | grep -i "upload"
   ```

4. **Verify files in R2:**
   - Cloudflare Dashboard → R2 → Your bucket
   - Files should appear within minutes

### Issue: "Can't create users"

**Symptoms:** `register_new_matrix_user` command fails

**Solutions:**

1. **Check registration_shared_secret:**
   ```bash
   docker exec <synapse-container> cat /data/homeserver.yaml | grep registration_shared_secret
   ```
   Should be set (generated during first setup).

2. **Use correct command format:**
   ```bash
   docker exec -it <synapse-container> register_new_matrix_user \
     http://localhost:8008 \
     -c /data/homeserver.yaml \
     --admin
   ```

3. **Alternative: Enable public registration temporarily:**
   Edit homeserver.yaml:
   ```yaml
   enable_registration: true
   enable_registration_without_verification: true
   ```
   Restart, create user via client, then disable again.

---

## Getting Help

### Official Resources
- **Matrix Community Room**: `#matrix:matrix.org`
- **Synapse Room**: `#synapse:matrix.org`
- **GitHub Issues**: https://github.com/element-hq/synapse/issues
- **Documentation**: https://matrix-org.github.io/synapse/latest/

### Tools
- **Federation Tester**: https://federationtester.matrix.org
- **Synapse Admin**: https://github.com/Awesome-Technologies/synapse-admin (web UI for admin tasks)

### Community Support
- **Matrix HQ**: `#matrix-hq:matrix.org` (official community)
- **Self-Hosting**: `#selfhosted:matrix.org`
- **Dokploy**: `#dokploy:matrix.org` (if exists, or GitHub discussions)

---

## Security Best Practices

### 1. Firewall Configuration
```bash
# Allow only necessary ports
ufw allow 443/tcp    # HTTPS (client)
ufw allow 8448/tcp   # Federation
ufw enable
```

### 2. Strong Passwords
- Use password manager for PostgreSQL password
- Enable password policy in homeserver.yaml
- Require 2FA for admin accounts (via Zero Trust)

### 3. Regular Updates
```bash
# Update to latest Synapse version
# Edit docker-compose.yml: image: matrixdotorg/synapse:v1.146.0
docker-compose pull
docker-compose up -d
```

### 4. Backup Strategy
- **Database**: Automated PostgreSQL backups to R2
- **Configuration**: Backup `/data/homeserver.yaml` and signing keys
- **Media**: Already stored in R2 (durable, redundant)

### 5. Monitoring
- Enable metrics: `enable_metrics: true` in homeserver.yaml
- Use Prometheus + Grafana for monitoring
- Set up alerts for federation failures

---

## Performance Optimization

### 1. Database Tuning

Edit PostgreSQL configuration for production:

```sql
-- postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
work_mem = 4MB
```

### 2. Connection Pooling

In homeserver.yaml:

```yaml
database:
  args:
    cp_min: 5      # Minimum connections
    cp_max: 20     # Maximum connections
```

### 3. Media Caching

Use R2 with CDN for global media delivery:
- Files cached at Cloudflare edge locations
- Reduced latency for international users
- Lower bandwidth costs (zero egress)

### 4. Worker Scaling

For >1000 users, enable workers (see Advanced section above).

---

## Backup & Disaster Recovery

### Automated Backups (Recommended)

Use provided backup script with Cloudflare R2:

```bash
# Configure backup service
# Set GPG_PASSPHRASE in Dokploy
# Backups run daily at 2 AM UTC

# Manual backup test
docker exec <synapse-container> /usr/local/bin/backup.sh
```

### Manual Backups

#### 1. Database Backup

```bash
# Backup PostgreSQL
docker exec <postgres-container> pg_dump -U synapse synapse > synapse-backup-$(date +%Y%m%d).sql

# Restore
docker exec -i <postgres-container> psql -U synapse synapse < synapse-backup-20260124.sql
```

#### 2. Configuration Backup

```bash
# Backup critical files
docker cp <synapse-container>:/data/homeserver.yaml ./backup/
docker cp <synapse-container>:/data/*.signing.key ./backup/
docker cp <synapse-container>:/data/*.log.config ./backup/
```

#### 3. Media Backup

If using R2, media is already backed up with 11 nines durability. For local-only:

```bash
# Backup media
docker run --rm -v synapse-data:/data alpine tar czf - /data/media_store | \
  aws s3 cp - s3://backup-bucket/synapse-media-$(date +%Y%m%d).tar.gz
```

### Disaster Recovery Plan

1. **Deploy new Synapse instance** with this template
2. **Restore database** from latest backup
3. **Restore configuration** files to `/data`
4. **Update DNS** to point to new server
5. **Verify federation** with tester
6. **Media files** automatically restored from R2

---

## Migration Guide

### From SQLite to PostgreSQL

**Warning:** Not covered in this template (assumes fresh install). For migration:
1. See [official migration guide](https://github.com/matrix-org/synapse/blob/develop/docs/postgres.md)
2. Use `synapse_port_db` script
3. Expect downtime during migration

### From Another Homeserver

1. **Export users and rooms** from old server
2. **Deploy new Synapse** with this template
3. **Import database** using `synapse_port_db`
4. **Update federation keys** in homeserver.yaml
5. **Test federation** before switching DNS

---

## License

Matrix Synapse: Apache License 2.0
This Template: MIT License

---

## Changelog

### v1.0.0 (2026-01-24)
- Initial release
- Matrix Synapse v1.145.0
- PostgreSQL 16, Redis 7
- Cloudflare R2 integration
- Federation ready (port 8448)
- Optional Zero Trust Access
- Automated R2 setup script

---

**Maintained by:** Home Lab Infrastructure Team
**Last Updated:** January 24, 2026
**Template Version:** 1.0.0
