# Chibisafe - File Upload and Sharing Platform

Chibisafe is a self-hosted file upload and sharing platform built with TypeScript. It provides a modern web interface for uploading files, generating shareable links, and managing your uploads with advanced features like albums, authentication, and S3-compatible storage.

## Features

- **Modern Web Interface**: Clean, intuitive UI for file uploads and management
- **File Sharing**: Generate shareable links with optional expiration
- **Albums**: Organize uploads into albums for better management
- **User Authentication**: Built-in user management with admin controls
- **File-Based Database**: SQLite database (no external database required)
- **S3 Storage Support**: Optional Cloudflare R2 for scalable storage
- **API Access**: RESTful API for programmatic file uploads
- **Chunked Uploads**: Support for large file uploads
- **File Preview**: Built-in preview for images and other file types

## Architecture

```
                                    INTERNET
                                        │
                                        ▼
                               ┌─────────────────┐
                               │    Traefik      │
                               │   (HTTPS/SSL)   │
                               └────────┬────────┘
                                        │
┌───────────────────────────────────────┼────────────────────────────────────────┐
│                         dokploy-network                                         │
│                                       │                                         │
│  ┌────────────────────────────────────▼───────────────────────────────────────┐│
│  │                              Caddy                                         ││
│  │                        (Reverse Proxy)                                     ││
│  │                                                                            ││
│  │  caddy:2-alpine                                                           ││
│  │  Port: 80                                                                 ││
│  │                                                                            ││
│  │  Routes:                                                                  ││
│  │  - /api/* → backend:8000                                                  ││
│  │  - /*     → frontend:8001                                                 ││
│  │                                                                            ││
│  └────────────────────────────────────┬───────────────────────────────────────┘│
│                                       │                                         │
│  ┌───────────────────────────────────┴────────────────────────────────────────┐│
│  │                          chibisafe-net (internal)                          ││
│  │                                                                             ││
│  │  ┌────────────────────────────┐      ┌──────────────────────────────────┐ ││
│  │  │       Frontend (UI)        │      │      Backend (API)               │ ││
│  │  │                            │      │                                  │ ││
│  │  │ chibisafe:v6.5.5          │      │ chibisafe-server:v6.5.5         │ ││
│  │  │ Port: 8001                │      │ Port: 8000                       │ ││
│  │  │                            │      │                                  │ ││
│  │  │ - Web UI                  │      │ - RESTful API                    │ ││
│  │  │ - File management         │      │ - File uploads                   │ ││
│  │  │ - Album organization      │      │ - SQLite database                │ ││
│  │  │                            │      │ - User authentication            │ ││
│  │  └────────────────────────────┘      │                                  │ ││
│  │                                      │ Volumes:                         │ ││
│  │                                      │ - database (SQLite)              │ ││
│  │                                      │ - uploads (files)                │ ││
│  │                                      │ - logs                           │ ││
│  │                                      └──────────────────────────────────┘ ││
│  │                                                                             ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------| |
| backend | chibisafe/chibisafe-server:v6.5.5 | 8000 | API server, file handling, database |
| frontend | chibisafe/chibisafe:v6.5.5 | 8001 | Web UI for file management |
| caddy | caddy:2-alpine | 80 | Reverse proxy (merges frontend + backend) |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- (Optional) Cloudflare R2 bucket for scalable storage

## Configuration Variables

### Required

| Variable | Description |
|----------|-------------|
| `CHIBISAFE_DOMAIN` | Domain for Chibisafe (e.g., `files.example.com`) |
| `ADMIN_PASSWORD` | Admin password (auto-generated, CHANGE AFTER FIRST LOGIN!) |

### Optional - Admin User

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_USERNAME` | `admin` | Admin username for first login |

### Optional - Upload Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_FILE_SIZE` | `100MB` | Maximum file upload size |

### Optional - External Storage (Cloudflare R2)

| Variable | Default | Description |
|----------|---------|-------------|
| `S3_ENABLED` | `false` | Enable S3-compatible storage (Cloudflare R2) |
| `S3_ENDPOINT` | - | Cloudflare R2 endpoint URL |
| `S3_BUCKET` | - | R2 bucket name |
| `S3_ACCESS_KEY_ID` | - | R2 Access Key ID |
| `S3_SECRET_ACCESS_KEY` | - | R2 Secret Access Key |
| `S3_REGION` | `auto` | Region (use `auto` for R2) |
| `S3_PATH_STYLE` | `true` | Path style (always `true` for R2) |

## Deployment

### 1. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure required variables:
   - Set your domain (e.g., `files.example.com`)
   - Admin password will be auto-generated
4. Deploy the stack

### 2. First Login

1. Navigate to `https://your-domain/`
2. Log in with default credentials:
   - **Username:** `admin` (or your configured `ADMIN_USERNAME`)
   - **Password:** Check Dokploy environment variables for auto-generated password
3. **IMPORTANT:** Change your password immediately!
   - Go to Settings → Account
   - Update password to a secure value

### 3. Verify Installation

```bash
# Check all services are running
docker compose ps

# Should show:
# - backend (healthy)
# - frontend (healthy)
# - caddy (healthy)
```

## First-Time Setup

### Creating Your First Upload

1. Log in to Chibisafe
2. Click "Upload" or drag-and-drop files
3. Wait for upload to complete
4. Click "Share" to generate a shareable link
5. (Optional) Add to an album for organization

### Managing Users

1. Navigate to Admin Panel
2. Go to "Users" section
3. Create additional user accounts
4. Set user permissions and quotas

### API Access

Chibisafe provides a RESTful API for programmatic uploads:

```bash
# Upload a file via API
curl -X POST https://your-domain/api/upload \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@/path/to/file.jpg"

# Get upload info
curl https://your-domain/api/file/FILE_ID \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Cloudflare R2 External Storage

Store uploaded files in Cloudflare R2 instead of Docker volumes for scalability and reduced storage costs.

### Benefits

- **Scalable Storage**: No Docker volume size limits
- **Cost-Effective**: Cloudflare R2 has no egress fees
- **Backup-Friendly**: R2 buckets are easier to backup than Docker volumes
- **Multi-Instance**: Share storage across multiple Chibisafe instances

### Setup Guide

#### 1. Create Cloudflare R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Create a new bucket (e.g., `chibisafe-uploads`)
3. Note your Account ID from the R2 overview page

#### 2. Generate R2 API Tokens

1. In R2, click "Manage R2 API Tokens"
2. Create API Token with:
   - **Permissions**: Object Read & Write
   - **Bucket**: Your chibisafe bucket
3. Save the **Access Key ID** and **Secret Access Key**

#### 3. Configure Chibisafe Environment Variables

Add these variables in Dokploy:

```bash
# Enable S3 storage mode
S3_ENABLED=true

# R2 Configuration
S3_ENDPOINT=https://<your-account-id>.r2.cloudflarestorage.com
S3_BUCKET=chibisafe-uploads
S3_REGION=auto
S3_ACCESS_KEY_ID=<your-access-key-id>
S3_SECRET_ACCESS_KEY=<your-secret-access-key>
S3_PATH_STYLE=true
```

Replace `<your-account-id>`, `<your-access-key-id>`, and `<your-secret-access-key>` with your actual values.

#### 4. Redeploy Chibisafe

After adding the environment variables, redeploy the service to apply the changes.

### Important Notes

- **Compatibility**: R2 is S3-compatible and works seamlessly with Chibisafe
- **Migration**: Existing uploads won't automatically migrate - new uploads will go to R2
- **Endpoint Format**: Always use `https://<account-id>.r2.cloudflarestorage.com`
- **Region**: Use `auto` for R2 (doesn't require specific regions)
- **Path Style**: Always set to `true` for Cloudflare R2

### Testing R2 Configuration

1. Upload a test file via the web interface
2. Check your R2 bucket - you should see the file stored there
3. Verify file preview and download work correctly

## Backup and Recovery

### Critical Data to Backup

1. **ADMIN_PASSWORD** - Store securely for recovery
2. **chibisafe-database volume** - Contains all metadata, users, and settings
3. **chibisafe-uploads volume** - Contains uploaded files (unless using R2)

### Backup Commands

```bash
# Backup SQLite database
docker compose exec backend sqlite3 /app/database/chibisafe.db ".backup '/tmp/chibisafe-backup.db'"
docker compose cp backend:/tmp/chibisafe-backup.db ./chibisafe-backup.db

# Backup uploads directory (if not using R2)
docker compose cp backend:/app/uploads ./uploads-backup

# Backup via volume
docker run --rm \
  -v chibisafe-database:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/chibisafe-database.tar.gz /data
```

### Recovery

```bash
# Restore database
docker compose cp ./chibisafe-backup.db backend:/app/database/chibisafe.db

# Restore uploads
docker compose cp ./uploads-backup backend:/app/uploads

# Restart services
docker compose restart backend
```

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| backend | 0.25 | 512MB | 1GB (database) + uploads |
| frontend | 0.25 | 256MB | Minimal |
| caddy | 0.1 | 128MB | Minimal |
| **Total** | **0.6** | **896MB** | **Variable (uploads)** |

Storage grows with number of uploads and file sizes.

## Security Considerations

### Admin Password

The `ADMIN_PASSWORD` is auto-generated during deployment. **You must change it immediately after first login:**

- ✅ Change via Settings → Account after first login
- ✅ Use a strong, unique password
- ❌ Never share admin credentials
- ❌ If lost, reset via environment variable and redeploy

### Network Security

- Chibisafe runs behind Traefik with HTTPS/TLS
- Caddy reverse proxy merges frontend and backend
- Backend and frontend only accessible internally
- Security headers middleware enabled (HSTS, XSS protection)

### File Upload Security

- Max file size configurable (default: 100MB)
- File type validation recommended
- Virus scanning not included (consider external solution)
- User quotas configurable in admin panel

### S3/R2 Security

- API keys stored as environment variables (never committed)
- Use dedicated R2 bucket (not shared with other apps)
- Enable R2 bucket versioning for recovery
- Rotate R2 API keys periodically

## Troubleshooting

### Chibisafe Won't Start

1. Check all services are healthy:
   ```bash
   docker compose ps
   ```

2. Check logs for errors:
   ```bash
   docker compose logs backend
   docker compose logs frontend
   docker compose logs caddy
   ```

3. Verify environment variables:
   ```bash
   docker compose config
   ```

### Upload Fails

1. **Check file size limit:**
   - Verify `MAX_FILE_SIZE` is set appropriately
   - Check Caddy has no conflicting limits

2. **Check storage space:**
   ```bash
   docker system df
   ```

3. **If using R2, verify credentials:**
   - Test R2 connection manually
   - Check R2 bucket permissions

### Login Fails

1. **Verify admin password:**
   - Check Dokploy environment variables for auto-generated password
   - Reset if needed by updating `ADMIN_PASSWORD` and redeploying

2. **Check database:**
   ```bash
   docker compose exec backend ls -la /app/database/
   ```

### Caddy Routing Issues

1. **Verify Caddyfile is mounted:**
   ```bash
   docker compose exec caddy cat /etc/caddy/Caddyfile
   ```

2. **Check Caddy logs:**
   ```bash
   docker compose logs caddy
   ```

3. **Verify routing:**
   ```bash
   # Test frontend
   curl -I http://localhost:80/

   # Test backend API
   curl -I http://localhost:80/api/health
   ```

### Performance Issues

1. **Increase memory limits** in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 1G  # Increase as needed
   ```

2. **Enable R2 storage** to reduce local I/O

3. **Check disk I/O:**
   ```bash
   docker stats
   ```

## Upgrading

### Minor Version Upgrade

```bash
# Update image tags in docker-compose.yml
# Example: v6.5.5 → v6.6.0

# Pull new images
docker compose pull

# Restart services
docker compose up -d

# Verify health
docker compose ps
```

### Major Version Upgrade

1. Backup database and uploads
2. Read Chibisafe release notes for breaking changes
3. Update image tags in docker-compose.yml
4. Test in staging environment first
5. Deploy and verify all features work

## Related Resources

- [Chibisafe GitHub](https://github.com/chibisafe/chibisafe)
- [Chibisafe Documentation](https://docs.chibisafe.moe/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [Dokploy Documentation](https://docs.dokploy.com/)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
