# Bluesky PDS (Personal Data Server)

Self-hosted AT Protocol Personal Data Server for decentralized social networking on the Bluesky network.

## Overview

The Bluesky PDS (Personal Data Server) is an AT Protocol implementation that allows you to self-host your social networking identity and data. Running your own PDS gives you full control over your account, posts, and social graph while participating in the federated Bluesky network.

### Features

- **Self-Sovereign Identity**: Own your data and identity
- **AT Protocol Federation**: Connect to the Bluesky network
- **User Handles**: Support for custom user handles on your domain (e.g., `alice.yourdomain.com`)
- **Embedded SQLite**: No separate database needed
- **Blob Storage**: Local storage for media attachments (up to 50MB per file)
- **Email Notifications**: Optional SMTP integration for password resets
- **Production Ready**: Designed for 1-20 users per instance

## Architecture

```
┌─────────────────────────────┐
│      Bluesky PDS            │
│  ┌──────────────────────┐   │
│  │   Web Server         │   │  Port 3000
│  │   (AT Protocol)      │◄──┼─────────────► Traefik
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │   SQLite Database    │   │  Embedded
│  │   (Accounts, DIDs)   │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │   Blob Storage       │   │  /pds/blocks
│  │   (Media Files)      │   │
│  └──────────────────────┘   │
└─────────────────────────────┘
         ↓
    AT Protocol Network
    (plc.directory, api.bsky.app)
```

**Service Count:** 1
**Database:** SQLite (embedded)
**Storage:** 20GB+ recommended

## Resource Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 1 core | 2 cores |
| RAM | 512MB | 2GB |
| Storage | 10GB | 20GB+ |
| Users | 1-5 | 5-20 |

## Configuration Variables

### Required Variables

| Variable | Description | Example | Auto-Generated |
|----------|-------------|---------|----------------|
| `PDS_DOMAIN` | Your PDS domain name | `pds.example.com` | No (user provides) |
| `PDS_JWT_SECRET` | JWT signing secret | - | Yes (base64:32) |
| `PDS_ADMIN_PASSWORD` | Admin account password | - | Yes (password:24) |
| `PDS_PLC_ROTATION_KEY` | DID rotation key (K256 hex) | - | Yes (base64:64) |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PDS_EMAIL_SMTP_URL` | SMTP connection string | `` (disabled) | `smtp://user:pass@smtp.example.com:587` |
| `PDS_EMAIL_FROM_ADDRESS` | Sender email address | `` (disabled) | `noreply@example.com` |
| `PDS_BLOB_UPLOAD_LIMIT` | Max blob size (bytes) | `52428800` (50MB) | `104857600` (100MB) |
| `LOG_ENABLED` | Enable logging | `true` | `true` / `false` |
| `LOG_LEVEL` | Log verbosity | `info` | `debug` / `info` / `warn` / `error` |

### AT Protocol Constants

These variables are **pre-configured** and should not be changed:

| Variable | Value | Purpose |
|----------|-------|---------|
| `PDS_DID_PLC_URL` | `https://plc.directory` | DID resolution service |
| `PDS_BSKY_APP_VIEW_URL` | `https://api.bsky.app` | Bluesky app view API |
| `PDS_BSKY_APP_VIEW_DID` | `did:web:api.bsky.app` | App view DID |
| `PDS_REPORT_SERVICE_URL` | `https://mod.bsky.app` | Moderation service |
| `PDS_REPORT_SERVICE_DID` | `did:plc:ar7c4by46qjdydhdevvrndac` | Moderation DID |
| `PDS_CRAWLERS` | `https://bsky.network` | Federation relay |

## Deployment Instructions

### Prerequisites

1. **Domain Requirements:**
   - A domain you control (e.g., `example.com`)
   - DNS access to create A records and TXT records
   - Subdomain for PDS (e.g., `pds.example.com`)

2. **Cloudflare DNS (Required for Wildcard Certificates):**
   - This template uses wildcard certificates for user handles (`*.pds.example.com`)
   - Traefik will use Cloudflare DNS challenge for Let's Encrypt
   - You need Cloudflare API credentials configured in Dokploy

3. **Email Service (Optional but Recommended):**
   - SMTP server for password reset emails
   - Options: Cloudflare Email Routing, SendGrid, Gmail, etc.

### DNS Configuration

Before deploying, configure DNS:

```
# Main PDS domain
pds.example.com.     A     <your-server-ip>

# Wildcard for user handles
*.pds.example.com.   A     <your-server-ip>
```

### Step 1: Deploy Template

1. In Dokploy, create a new service
2. Select the "Bluesky PDS" template
3. Configure required variables:
   - **Domain:** `pds.example.com`
   - **JWT Secret:** Auto-generated
   - **Admin Password:** Auto-generated (save this!)
   - **PLC Rotation Key:** Auto-generated

### Step 2: Configure Email (Optional)

If you want password reset functionality:

**Option A: Cloudflare Email Routing**
```
PDS_EMAIL_SMTP_URL: smtp://username:password@smtp.cloudflare.com:587
PDS_EMAIL_FROM_ADDRESS: noreply@pds.example.com
```

**Option B: SendGrid**
```
PDS_EMAIL_SMTP_URL: smtp://apikey:YOUR_API_KEY@smtp.sendgrid.net:587
PDS_EMAIL_FROM_ADDRESS: noreply@pds.example.com
```

**Option C: Gmail**
```
PDS_EMAIL_SMTP_URL: smtp://your-email@gmail.com:app-password@smtp.gmail.com:587
PDS_EMAIL_FROM_ADDRESS: your-email@gmail.com
```

### Step 3: Deploy and Verify

1. Click "Deploy"
2. Wait for health check to pass (60 seconds startup time)
3. Verify deployment:
   ```bash
   curl https://pds.example.com/xrpc/_health
   # Should return: {"version":"0.4"}
   ```

### Step 4: Create Admin Account

After deployment, create the admin account:

1. Access the PDS admin interface: `https://pds.example.com`
2. Use the auto-generated admin password from deployment
3. Create your first user account

## Post-Deployment

### Creating User Accounts

Users can be created via the PDS web interface or admin API. Each user gets a handle in the format:

```
username.pds.example.com
```

### Backup Strategy

**Critical Data Locations:**
- **SQLite Database:** `/pds/accounts.sqlite`
- **User Data:** `/pds/blocks/` (blob storage)
- **Configuration:** `/pds/pds.env`

**Backup Command:**
```bash
# Backup entire pds-data volume
docker run --rm \
  -v bluesky-pds_pds-data:/pds:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/pds-backup-$(date +%Y%m%d).tar.gz /pds
```

### Monitoring

**Health Check Endpoint:**
```bash
curl https://pds.example.com/xrpc/_health
```

**Logs:**
```bash
docker compose logs -f pds
```

**Disk Usage:**
```bash
docker exec bluesky-pds_pds du -sh /pds/*
```

## Troubleshooting

### Issue: Wildcard Certificate Not Working

**Symptoms:** SSL errors for user handles (e.g., `alice.pds.example.com`)

**Cause:** DNS challenge not configured in Traefik

**Solution:**
1. Ensure Cloudflare API credentials are configured in Dokploy
2. Verify wildcard DNS record exists: `*.pds.example.com`
3. Check Traefik logs for DNS challenge errors

### Issue: Users Cannot Create Accounts

**Symptoms:** "Federation error" or "PLC directory unavailable"

**Cause:** Cannot reach AT Protocol services

**Solution:**
1. Verify outbound HTTPS connectivity:
   ```bash
   docker exec bluesky-pds_pds curl -I https://plc.directory
   ```
2. Check firewall rules allow outbound 443
3. Verify DNS resolution works inside container

### Issue: Password Reset Emails Not Sending

**Symptoms:** Users don't receive password reset emails

**Cause:** SMTP not configured or credentials invalid

**Solution:**
1. Verify `PDS_EMAIL_SMTP_URL` is set correctly
2. Test SMTP connection:
   ```bash
   docker exec bluesky-pds_pds nc -zv smtp.example.com 587
   ```
3. Check PDS logs for SMTP errors
4. Verify SMTP credentials are valid

### Issue: Blob Upload Failures

**Symptoms:** "Blob too large" errors

**Cause:** File exceeds `PDS_BLOB_UPLOAD_LIMIT`

**Solution:**
1. Increase limit (max 104857600 for 100MB):
   ```
   PDS_BLOB_UPLOAD_LIMIT: 104857600
   ```
2. Restart PDS service
3. Note: Bluesky network currently supports up to 50MB videos

### Issue: High Disk Usage

**Symptoms:** `/pds` volume filling up

**Cause:** Many users or large blob storage

**Solution:**
1. Check storage breakdown:
   ```bash
   docker exec bluesky-pds_pds du -sh /pds/*
   ```
2. Consider increasing storage or limiting users
3. No built-in blob cleanup (manual cleanup required)

## Security Considerations

1. **Admin Password:** Save the auto-generated admin password securely
2. **PLC Rotation Key:** Backup the rotation key (required for DID recovery)
3. **HTTPS Only:** PDS requires HTTPS for federation (enforced by template)
4. **Firewall:** Only ports 80/443 need to be open
5. **Updates:** Monitor for PDS updates at https://github.com/bluesky-social/pds

## Federation

Your PDS automatically federates with the Bluesky network:

- **DIDs registered** at `https://plc.directory`
- **Posts federated** via `https://bsky.network` relay
- **Users visible** in Bluesky app (https://bsky.app)
- **Handles** resolvable via AT Protocol DNS

## Limitations

- **User Scale:** Designed for 1-20 users per instance
- **Storage:** No automatic blob cleanup (manual management required)
- **Moderation:** Uses Bluesky's moderation service
- **Custom Algorithms:** Not included in base PDS

## References

- **Official Documentation:** https://github.com/bluesky-social/pds
- **AT Protocol Docs:** https://atproto.com
- **Bluesky Social:** https://bsky.social
- **Community Support:** https://github.com/bluesky-social/pds/discussions

## Version Information

- **PDS Version:** 0.4
- **Template Version:** 1.0.0
- **Last Updated:** December 2025
