# Uptime Kuma

**Self-hosted monitoring tool for tracking service availability across multiple protocols**

[![GitHub](https://img.shields.io/badge/GitHub-louislam%2Fuptime--kuma-blue?logo=github)](https://github.com/louislam/uptime-kuma)
[![Docker](https://img.shields.io/badge/Docker-louislam%2Fuptime--kuma%3A2-blue?logo=docker)](https://hub.docker.com/r/louislam/uptime-kuma)

## Overview

Uptime Kuma is an easy-to-use self-hosted monitoring tool that tracks service availability and sends notifications when issues occur. Monitor websites, APIs, databases, and more with a beautiful dashboard.

### Features

- **Multi-Protocol Monitoring**: HTTP(s), TCP, DNS, Ping, MQTT, and more
- **Status Pages**: Public status pages for your services
- **Notifications**: 90+ notification providers (Discord, Slack, Email, etc.)
- **Embedded Database**: SQLite database included - no external database needed
- **Docker-First**: Official Docker image with simple deployment
- **WebSocket Updates**: Real-time status updates
- **Uptime Badges**: Generate uptime badges for README files
- **Multi-Language**: Supports 20+ languages

## Architecture

```
┌─────────────────────────────────────────────┐
│            Uptime Kuma                      │
│    ┌──────────────────────────────┐         │
│    │    Web Dashboard (3001)      │         │
│    │  - Monitor Configuration     │         │
│    │  - Status Visualization      │         │
│    │  - Notification Management   │         │
│    └──────────────┬───────────────┘         │
│                   │                          │
│    ┌──────────────▼───────────────┐         │
│    │   Embedded SQLite Database   │         │
│    │  - Monitor History           │         │
│    │  - User Accounts             │         │
│    │  - Configuration             │         │
│    └──────────────────────────────┘         │
│                                              │
│    Data Volume: /app/data                   │
└──────────────┬───────────────────────────────┘
               │
               ├─── HTTPS (Traefik + Let's Encrypt)
               │
               └─── Optional: Cloudflare Tunnel

Monitoring Targets:
  → HTTP/HTTPS endpoints
  → TCP ports
  → DNS records
  → Ping (ICMP)
  → Databases (PostgreSQL, MySQL, MongoDB, Redis)
  → Docker containers
  → And more...
```

## Requirements

### System Resources

- **Memory**: 256MB minimum, 512MB recommended
- **CPU**: 0.5 cores minimum, 1 core recommended
- **Storage**: 100MB for application + space for monitoring history

### Prerequisites

- Domain name pointing to your Dokploy server
- HTTPS certificate (auto-provisioned via LetsEncrypt)

## Quick Start

### 1. Deploy Template

1. Navigate to Dokploy dashboard
2. Go to **Templates** → **Community Templates**
3. Select **Uptime Kuma**
4. Configure required variables (see Configuration section)
5. Click **Deploy**

### 2. First-Time Setup

After deployment:

1. Access your Uptime Kuma instance at `https://your-domain.com`
2. **Create Admin Account** (first visit)
   - Username: Choose a secure username
   - Password: Use a strong password (minimum 8 characters)
   - Email: Your email address
3. **Set up your first monitor**
   - Click "+ Add New Monitor"
   - Choose monitor type (HTTP(s), TCP, Ping, etc.)
   - Configure check interval and retry settings
   - Add notification channels

### 3. Configure Notifications

1. Go to **Settings** → **Notifications**
2. Add notification providers:
   - Discord Webhook
   - Slack Webhook
   - Email (SMTP)
   - Telegram Bot
   - And 90+ more options

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DOMAIN` | **Yes** | - | Domain for accessing Uptime Kuma (e.g., `uptime.example.com`) |
| `UPTIME_KUMA_PORT` | No | `3001` | Internal HTTP server port |
| `TZ` | No | `UTC` | Timezone for scheduling (e.g., `America/New_York`, `Europe/London`) |
| `UPTIME_KUMA_CLOUDFLARED_TOKEN` | No | - | Cloudflare Tunnel token (see Cloudflare Tunnel section) |
| `UPTIME_KUMA_DISABLE_FRAME_SAMEORIGIN` | No | `false` | Allow embedding in iframes |
| `UPTIME_KUMA_WS_ORIGIN_CHECK` | No | `cors-like` | WebSocket origin validation mode |

### Timezone Configuration

Uptime Kuma uses the `TZ` environment variable for scheduling and logging:

**Common Timezone Values:**
```
UTC
America/New_York
America/Los_Angeles
America/Chicago
Europe/London
Europe/Paris
Europe/Berlin
Asia/Tokyo
Asia/Shanghai
Australia/Sydney
```

Find your timezone: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

## Cloudflare Tunnel Setup (Optional)

Uptime Kuma has **built-in Cloudflare Tunnel support**, allowing you to expose your monitoring dashboard without port forwarding or VPN.

### Why Use Cloudflare Tunnel?

- ✅ No port forwarding needed
- ✅ Zero Trust access control
- ✅ DDoS protection included
- ✅ Automatic HTTPS
- ✅ Works behind CGNAT/double NAT

### Setup Steps

#### 1. Create Cloudflare Tunnel

```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared  # macOS
# or
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb  # Debian/Ubuntu

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create uptime-kuma

# Note the tunnel ID and token
```

#### 2. Configure DNS

In Cloudflare Dashboard:
1. Go to **Zero Trust** → **Networks** → **Tunnels**
2. Select your tunnel → **Public Hostname**
3. Add public hostname:
   - Subdomain: `uptime` (or your choice)
   - Domain: `example.com`
   - Service: `http://uptime-kuma:3001`

#### 3. Get Tunnel Token

1. Cloudflare Dashboard → **Zero Trust** → **Networks** → **Tunnels**
2. Click your tunnel → **Configure**
3. Copy the tunnel token

#### 4. Update Dokploy Configuration

In template.toml or Dokploy UI:
```toml
UPTIME_KUMA_CLOUDFLARED_TOKEN = "your-tunnel-token-here"
```

#### 5. Disable Traefik (Optional)

If using Cloudflare Tunnel exclusively, comment out Traefik labels in docker-compose.yml:

```yaml
# labels:
#   - "traefik.enable=true"
#   ...
```

## Security Best Practices

### Authentication

Uptime Kuma manages authentication via the web UI:

1. **First User = Admin**: The first account created becomes the administrator
2. **Strong Passwords**: Enforce minimum 12 characters with complexity
3. **Multi-User Setup**:
   - Navigate to **Settings** → **Users**
   - Add additional users with role-based access
   - Use separate accounts (avoid sharing credentials)

### Cloudflare Zero Trust Access (Recommended)

Protect your monitoring dashboard with Cloudflare Access:

#### Setup Zero Trust Access

1. **Create Access Application**:
   - Cloudflare Dashboard → **Zero Trust** → **Access** → **Applications**
   - Click **Add an application** → **Self-hosted**

2. **Configure Application**:
   - Application name: `Uptime Kuma Monitoring`
   - Session Duration: `24 hours`
   - Application domain: `uptime.your-domain.com`

3. **Create Access Policy**:
   - Policy name: `Allow Team Members`
   - Action: `Allow`
   - Include:
     - **Emails ending in**: `@yourcompany.com`
     - **OR Specific emails**: Add individual emails
   - **Identity Providers**: Google, GitHub, etc.

4. **Deploy**:
   - Users must authenticate with Cloudflare Access before reaching Uptime Kuma
   - Second layer of authentication (in addition to Uptime Kuma's login)

### Network Security

This template includes security headers middleware:

- **HSTS (HTTP Strict Transport Security)**: Enforces HTTPS for 1 year
- **Content-Type Nosniff**: Prevents MIME type confusion attacks
- **XSS Protection**: Enables browser XSS filter
- **Referrer Policy**: Prevents information leakage

### Data Protection

**Backup Recommendations:**

The `/app/data` volume contains:
- SQLite database (monitor history, configurations)
- User account credentials
- SSL certificates (if generated)

```bash
# Backup volume
docker run --rm \
  -v uptime-kuma-data:/data \
  -v $(pwd):/backup \
  busybox tar czf /backup/uptime-kuma-backup-$(date +%Y%m%d).tar.gz /data

# Restore volume
docker run --rm \
  -v uptime-kuma-data:/data \
  -v $(pwd):/backup \
  busybox tar xzf /backup/uptime-kuma-backup-20250101.tar.gz -C /
```

## Monitor Types

### HTTP(s) Monitoring

Monitor websites and APIs:

```yaml
Monitor Type: HTTP(s)
URL: https://example.com/api/health
Method: GET
Interval: 60 seconds
Headers: Authorization: Bearer token
```

### TCP Port Monitoring

Monitor services on specific ports:

```yaml
Monitor Type: TCP Port
Hostname: database.example.com
Port: 5432
Interval: 30 seconds
```

### Ping Monitoring

Check host reachability via ICMP:

```yaml
Monitor Type: Ping
Hostname: server.example.com
Interval: 60 seconds
Packet Count: 3
```

### DNS Monitoring

Verify DNS resolution:

```yaml
Monitor Type: DNS
Hostname: example.com
Resolver Server: 1.1.1.1
Record Type: A
Expected Value: 93.184.216.34
```

### Database Monitoring

Monitor database availability:

```yaml
Monitor Type: PostgreSQL / MySQL / MongoDB / Redis
Connection String: postgresql://user:pass@host:5432/db
Interval: 120 seconds
```

## Notification Channels

Uptime Kuma supports 90+ notification providers:

### Popular Channels

**Communication:**
- Discord Webhook
- Slack Webhook
- Telegram Bot
- Microsoft Teams

**Email:**
- SMTP
- SendGrid
- Mailgun
- AWS SES

**Incident Management:**
- PagerDuty
- Opsgenie
- VictorOps

**Other:**
- Webhook (Generic)
- Gotify
- Ntfy
- Pushover
- Custom scripts via Webhook

### Setting Up Discord Notifications

1. Create Discord Webhook:
   - Server Settings → Integrations → Webhooks
   - New Webhook → Copy URL

2. Add to Uptime Kuma:
   - Settings → Notifications → Add New Notification
   - Notification Type: Discord
   - Webhook URL: Paste URL
   - Test notification

## Status Pages

Create public status pages for your services:

### Creating a Status Page

1. Navigate to **Status Pages**
2. Click **Add New Status Page**
3. Configure:
   - **Slug**: `status` (URL: `uptime.example.com/status/status`)
   - **Title**: Your Company Status
   - **Description**: Service status dashboard
   - **Theme**: Light / Dark / Auto

4. Add Monitors:
   - Drag monitors from sidebar to status page
   - Organize into groups (e.g., "Core Services", "APIs")

5. Publish:
   - Toggle **Published** to make public
   - Share URL with users

### Custom Domain for Status Page

Point a CNAME record to your Uptime Kuma domain:

```dns
status.example.com → uptime.example.com
```

## Troubleshooting

### 1. Cannot Access Dashboard (404 Error)

**Symptoms**: Accessing `https://your-domain.com` returns 404

**Checks:**
```bash
# Verify service is running
docker ps | grep uptime-kuma

# Check Traefik routing
docker logs dokploy-traefik 2>&1 | grep uptime-kuma

# Verify DNS resolution
dig your-domain.com
```

**Solution:**
- Ensure domain DNS points to your server
- Verify Traefik labels in docker-compose.yml
- Check `DOMAIN` environment variable is set correctly

### 2. Database Locked Error

**Symptoms**: "Database is locked" errors in logs

**Cause**: SQLite database cannot handle concurrent writes with NFS storage

**Solution:**
Uptime Kuma requires **local storage** (do not use NFS):
```yaml
volumes:
  uptime-kuma-data:
    driver: local  # Must be local, not NFS
```

### 3. Monitors Not Checking

**Symptoms**: Monitors show "Pending" or don't update

**Checks:**
```bash
# View container logs
docker logs uptime-kuma

# Check system time
date

# Verify timezone configuration
docker exec uptime-kuma date
```

**Solution:**
- Verify `TZ` environment variable is set correctly
- Restart container: `docker restart uptime-kuma`
- Check monitor interval configuration (not too aggressive)

### 4. Notifications Not Sending

**Symptoms**: Monitors detect downtime but no notifications sent

**Checks:**
- Go to Settings → Notifications
- Click **Test** on notification channel
- Check notification channel logs/webhooks

**Solution:**
- Verify webhook URLs are correct
- Check notification channel rate limits
- Ensure monitor has notification enabled

### 5. High Memory Usage

**Symptoms**: Container using excessive RAM

**Cause**: Large monitoring history, too many monitors

**Solution:**
```yaml
# Add resource limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 128M
```

Reduce history retention:
- Settings → Data Retention
- Set appropriate retention period (e.g., 30 days)

### 6. WebSocket Connection Failed

**Symptoms**: Dashboard shows "Connecting..." or frequent disconnects

**Checks:**
```bash
# Check WebSocket headers
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  https://your-domain.com
```

**Solution:**
- Verify Traefik WebSocket support (enabled by default)
- Check browser console for errors
- Disable `UPTIME_KUMA_WS_ORIGIN_CHECK` if needed:
  ```yaml
  UPTIME_KUMA_WS_ORIGIN_CHECK: "none"
  ```

## Backup and Restore

### Manual Backup

```bash
# Create backup
docker run --rm \
  -v uptime-kuma-data:/source \
  -v $(pwd):/backup \
  alpine tar czf /backup/uptime-kuma-$(date +%Y%m%d-%H%M%S).tar.gz -C /source .

# Verify backup
tar tzf uptime-kuma-20250101-120000.tar.gz | head
```

### Automated Backup Script

```bash
#!/bin/bash
# backup-uptime-kuma.sh

BACKUP_DIR="/backups/uptime-kuma"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

# Create backup
docker run --rm \
  -v uptime-kuma-data:/source \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf "/backup/uptime-kuma-$(date +%Y%m%d-%H%M%S).tar.gz" -C /source .

# Delete old backups
find "$BACKUP_DIR" -name "uptime-kuma-*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $(date)"
```

Add to crontab:
```cron
0 2 * * * /path/to/backup-uptime-kuma.sh >> /var/log/uptime-kuma-backup.log 2>&1
```

### Restore from Backup

```bash
# Stop container
docker stop uptime-kuma

# Restore data
docker run --rm \
  -v uptime-kuma-data:/target \
  -v $(pwd):/backup \
  alpine sh -c "rm -rf /target/* && tar xzf /backup/uptime-kuma-backup.tar.gz -C /target"

# Start container
docker start uptime-kuma
```

## Advanced Configuration

### Custom Notification Scripts

Use webhooks to trigger custom scripts:

```javascript
// webhook-handler.js
const express = require('express');
const app = express();

app.post('/uptime-webhook', express.json(), (req, res) => {
  const { monitorName, status, msg } = req.body;

  if (status === 'down') {
    // Custom logic: restart service, send SMS, etc.
    console.log(`ALERT: ${monitorName} is down: ${msg}`);
  }

  res.json({ success: true });
});

app.listen(3000);
```

### Docker Container Monitoring

Monitor Docker containers from within Uptime Kuma:

**Requirements:**
- Mount Docker socket (security consideration!)

```yaml
# In docker-compose.yml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

**Monitor Configuration:**
```yaml
Monitor Type: Docker Container
Container Name: my-app
Expected Status: running
```

### Prometheus Integration

Export metrics to Prometheus:

1. Enable API in Settings
2. Generate API key
3. Use Prometheus exporter (community project)

## Performance Optimization

### Reduce Check Frequency

For non-critical services:
```yaml
Heartbeat Interval: 300 seconds (5 minutes)
Retries: 3
```

### Disable Unused Features

```yaml
# Disable screenshots (reduces memory)
UPTIME_KUMA_SCREENSHOT_ENABLED: "false"
```

### Database Optimization

```bash
# Vacuum SQLite database (reduces size)
docker exec -it uptime-kuma sh
cd /app/data
sqlite3 kuma.db "VACUUM;"
```

## Upgrading

### Upgrade Process

```bash
# Pull latest image
docker pull louislam/uptime-kuma:2

# Backup data first!
./backup-uptime-kuma.sh

# Recreate container
docker compose up -d uptime-kuma

# Verify upgrade
docker logs -f uptime-kuma
```

### Version Compatibility

- **Major version 2.x**: Current stable release
- **Migration from 1.x**: Automatic database migration on first start
- **Rollback**: Restore backup and recreate container with old image

## Resources

### Official Documentation
- **Website**: https://uptime.kuma.pet/
- **GitHub**: https://github.com/louislam/uptime-kuma
- **Documentation**: https://github.com/louislam/uptime-kuma/wiki
- **Docker Hub**: https://hub.docker.com/r/louislam/uptime-kuma

### Community
- **Discussions**: https://github.com/louislam/uptime-kuma/discussions
- **Discord**: https://discord.gg/uptime-kuma
- **Reddit**: r/UptimeKuma

### Related Projects
- **Kuma Reverse Proxy**: Cloudflare Tunnel alternative
- **Uptime Kuma Status Page**: Standalone status page
- **Third-party exporters**: Prometheus, InfluxDB, etc.

## License

Uptime Kuma is open-source software licensed under the MIT License.

This Dokploy template is provided as-is under the same license.

---

**Support**: For issues with this Dokploy template, open an issue in the [dokploy repository](https://github.com/your-repo/dokploy).

**Uptime Kuma Issues**: For application-specific issues, use the [official repository](https://github.com/louislam/uptime-kuma/issues).
