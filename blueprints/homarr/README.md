# Homarr - Homelab Dashboard

Homarr is a modern, customizable dashboard for your homelab that integrates with over 30+ different services. It provides a centralized interface for managing and monitoring your self-hosted applications with drag-and-drop configuration, beautiful widgets, and Docker integration capabilities.

## Features

- **Customizable Dashboard**: Drag-and-drop interface with customizable widgets and layouts
- **30+ Integrations**: Built-in support for popular services (Plex, Jellyfin, Sonarr, Radarr, etc.)
- **Docker Integration**: Read-only Docker socket access for container stats and management (enabled by default)
- **Real-time Monitoring**: Service status, resource usage, and health monitoring
- **Widgets**: Weather, calendar, RSS feeds, service status, and custom widgets
- **Themes**: Multiple themes with dark mode support
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **File-Based Storage**: SQLite database in persistent volume (no external database required)
- **Zero-Config**: Starts working immediately with sensible defaults

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
│  │                              Homarr                                         ││
│  │                     (Homelab Dashboard)                                    ││
│  │                                                                            ││
│  │  ghcr.io/homarr-labs/homarr:1.47.0                                        ││
│  │  Port: 7575                                                               ││
│  │                                                                            ││
│  │  - Drag-and-drop dashboard builder                                       ││
│  │  - 30+ service integrations                                              ││
│  │  - Real-time monitoring widgets                                          ││
│  │  - Optional Docker integration                                           ││
│  │                                                                            ││
│  │  Volumes:                                                                 ││
│  │  - homarr-data (/appdata)                                                 ││
│  │    └── configs/ (dashboard configuration)                                 ││
│  │    └── database.db (SQLite)                                               ││
│  │    └── icons/ (custom service icons)                                      ││
│  │  - /var/run/docker.sock (read-only, for container stats/management)     ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------

|
| homarr | ghcr.io/homarr-labs/homarr:1.47.0 | 7575 | Homelab dashboard UI |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- Docker socket access enabled (included by default for container stats and management)

## Configuration Variables

### Required

| Variable | Description |
|----------|-------------|
| `HOMARR_DOMAIN` | Domain for Homarr (e.g., `dashboard.example.com`) |
| `SECRET_ENCRYPTION_KEY` | 64-character encryption key for sensitive data (auto-generated) |

### Docker Integration (Enabled by Default)

The template includes read-only Docker socket access for container stats and management features:

```yaml
volumes:
  # Docker integration enabled by default (read-only)
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

**Enabled Features:**
- Real-time container stats (CPU, memory, network)
- Container management (start, stop, restart)
- Docker stats widget in dashboard
- Container health monitoring

**⚠️ Security Note:** The Docker socket is mounted in **read-only mode (`:ro`)** for security. This allows Homarr to view container information and stats but prevents container modifications. To disable Docker integration, comment out the volume mount line in docker-compose.yml.

## Deployment

### 1. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure required variable:
   - Set your domain (e.g., `dashboard.example.com`)
   - Encryption key will be auto-generated
4. Deploy the stack

### 2. First Access

1. Navigate to `https://your-domain/`
2. Complete initial setup wizard:
   - Choose your display name
   - Select preferred theme
   - Configure default dashboard layout
3. Start adding service integrations

### 3. Verify Installation

```bash
# Check service is running
docker compose ps

# Should show:
# - homarr (healthy)

# Check logs
docker compose logs homarr

# Check database and config files
docker compose exec homarr ls -la /appdata
```

## Configuration

### Adding Service Integrations

Homarr integrates with 30+ popular homelab services:

**Media Servers:**
- Plex, Jellyfin, Emby
- Overseerr, Jellyseerr

**Download Clients:**
- qBittorrent, Transmission, Deluge
- SABnzbd, NZBGet

**Media Management:**
- Sonarr, Radarr, Lidarr, Readarr
- Prowlarr, Jackett

**Monitoring:**
- Grafana, Prometheus
- Uptime Kuma

**And many more...**

To add an integration:
1. Click the settings icon (gear) → Integrations
2. Select the service type
3. Enter the service URL and API key (if required)
4. Test connection and save

### Adding Widgets

1. Click "Edit Dashboard" mode
2. Click "+ Add Widget"
3. Choose widget type:
   - Service Status
   - Calendar
   - Weather
   - RSS Feed
   - Docker Stats (requires docker.sock)
   - Custom iFrame
4. Configure widget settings
5. Drag to position and resize
6. Save dashboard

### Dashboard Layouts

Homarr supports multiple dashboard pages:

1. Navigate to Settings → Boards
2. Create new board
3. Configure layout (grid size, column count)
4. Add widgets specific to that board
5. Switch between boards via navigation

### Themes and Customization

1. Go to Settings → Appearance
2. Choose theme:
   - Light mode
   - Dark mode (default)
   - Custom CSS
3. Configure:
   - Primary color
   - Background opacity
   - Widget spacing
   - Font size
4. Save and apply

## Backup and Recovery

### Critical Data to Backup

1. **Configuration files** - Dashboard layouts, widget settings
2. **SQLite database** - User preferences, integration configs
3. **Custom icons** - Uploaded service icons
4. **homarr-data volume** - Contains all above

### Backup Commands

```bash
# Backup entire /appdata directory
docker compose cp homarr:/appdata ./backup-homarr-data

# Backup via volume
docker run --rm \
  -v homarr-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/homarr-data.tar.gz /data

# Backup just the database
docker compose cp homarr:/appdata/database.db ./backup-database.db

# Backup configuration files
docker compose cp homarr:/appdata/configs ./backup-configs
```

### Recovery

```bash
# Restore entire /appdata directory
docker compose cp ./backup-homarr-data homarr:/appdata
docker compose restart homarr

# Restore from volume backup
docker run --rm \
  -v homarr-data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd / && tar xzf /backup/homarr-data.tar.gz"
docker compose restart homarr

# Restore just the database
docker compose cp ./backup-database.db homarr:/appdata/database.db
docker compose restart homarr
```

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------

|
| homarr | 0.5 | 512MB | ~100MB + configs |
| **Total** | **0.5** | **512MB** | **~200MB** |

Storage grows with:
- Dashboard configurations
- Cached service data
- Custom uploaded icons
- Integration history

## Troubleshooting

### Homarr Won't Start

1. **Check service status:**
   ```bash
   docker compose ps
   docker compose logs homarr
   ```

2. **Verify health check:**
   ```bash
   docker compose exec homarr wget --spider http://localhost:7575
   ```

3. **Check volume permissions:**
   ```bash
   docker compose exec homarr ls -la /appdata
   ```

4. **Verify environment variables:**
   ```bash
   docker compose exec homarr env | grep -E '(DOMAIN|SECRET)'
   ```

### Service Integrations Not Working

1. **Check service URL accessibility:**
   ```bash
   docker compose exec homarr wget --spider https://your-service.com/api
   ```

2. **Verify API keys:**
   - Go to Settings → Integrations
   - Click "Test Connection" for each service
   - Regenerate API keys if needed

3. **Check CORS settings:**
   - Some services require CORS configuration
   - Add Homarr domain to allowed origins

### Docker Integration Not Working

1. **Verify docker.sock is mounted:**
   ```bash
   docker compose exec homarr ls -la /var/run/docker.sock
   ```

2. **Check permissions:**
   ```bash
   # Docker socket should be readable
   docker compose exec homarr test -r /var/run/docker.sock && echo "OK" || echo "FAIL"
   ```

3. **Enable Docker integration in Homarr UI:**
   - Go to Settings → Integrations → Docker
   - The integration should auto-detect when socket is available
   - Click "Enable" if not already active

4. **Restart service if needed:**
   ```bash
   docker compose restart homarr
   ```

### Dashboard Configuration Lost

1. **Check config files exist:**
   ```bash
   docker compose exec homarr ls -la /appdata/configs
   ```

2. **Restore from backup:**
   ```bash
   docker compose cp ./backup-configs homarr:/appdata/configs
   docker compose restart homarr
   ```

3. **Check database integrity:**
   ```bash
   docker compose exec homarr sqlite3 /appdata/database.db "PRAGMA integrity_check;"
   ```

### Performance Issues

1. **Reduce widget update frequency:**
   - Settings → Widgets → Adjust refresh intervals
   - Disable real-time updates for static content

2. **Limit service integrations:**
   - Remove unused integrations
   - Disable polling for services you don't monitor

3. **Check browser console:**
   - Open developer tools (F12)
   - Check for JavaScript errors
   - Clear browser cache

## Advanced Configuration

### Custom CSS Theming

1. Go to Settings → Appearance → Custom CSS
2. Add your custom styles:

```css
/* Example: Custom primary color */
:root {
  --primary-color: #00d9ff;
  --background-color: #0b1021;
}

/* Example: Larger widget titles */
.widget-title {
  font-size: 1.5rem;
  font-weight: bold;
}
```

### Docker Integration Features

When Docker socket is enabled:

**Container Stats:**
- CPU usage per container
- Memory usage and limits
- Network I/O
- Uptime and restart count

**Container Controls:**
- Start/stop containers
- Restart containers
- View logs
- Execute commands (read-only)

**Automation:**
- Auto-restart failed containers
- Alert on high resource usage
- Schedule container actions

### API Access

Homarr provides an API for external integrations:

```bash
# Get dashboard configuration
curl https://your-domain/api/configs

# Get service status
curl https://your-domain/api/services

# Requires authentication (use your encryption key)
```

### Multi-User Setup

Homarr supports multiple user accounts:

1. Go to Settings → Users
2. Create new user account
3. Assign permissions:
   - View-only
   - Edit dashboards
   - Manage integrations
   - Admin access
4. Users log in with separate credentials

## Upgrading

### Minor Version Upgrade

```bash
# Update image tag in docker-compose.yml
# Example: v1.47.0 → v1.48.0

# Pull new image
docker compose pull

# Restart services
docker compose up -d

# Verify health
docker compose ps
docker compose logs homarr
```

### Major Version Upgrade

1. Backup configuration and data (see Backup section)
2. Read [Homarr release notes](https://github.com/homarr-labs/homarr/releases)
3. Update image tag in docker-compose.yml
4. Test in staging environment first
5. Deploy and verify all integrations work
6. Check for migration prompts in the UI

### Rollback

```bash
# Change image tag back to previous version
# Example: image: ghcr.io/homarr-labs/homarr:1.47.0

# Pull old image
docker compose pull

# Restart with old version
docker compose up -d

# Restore from backup if needed
docker compose cp ./backup-homarr-data homarr:/appdata
docker compose restart homarr
```

## Related Resources

- [Homarr GitHub](https://github.com/homarr-labs/homarr)
- [Homarr Documentation](https://homarr.dev/docs/)
- [Homarr Discord](https://discord.gg/aCsmEV5RgA)
- [Integration Guides](https://homarr.dev/docs/integrations/)
- [Widget Documentation](https://homarr.dev/docs/widgets/)
- [Dokploy Documentation](https://docs.dokploy.com/)

## Security Considerations

### Encryption Key

- **AUTO-GENERATED**: Dokploy generates a secure 64-character key
- **PURPOSE**: Encrypts sensitive data (API keys, passwords stored in dashboard)
- **STORAGE**: Stored in environment variable, never hardcoded
- **ROTATION**: To rotate, generate new key and restart service (re-enter API keys)

### Docker Socket Access

**⚠️ Security Implications:**
- Read-only access still allows container inspection
- Can view environment variables of other containers
- Can see network configuration and secrets
- Cannot modify containers (read-only mount)

**Best Practices:**
- Only enable if you need Docker stats/management
- Keep commented out by default
- Review Homarr logs for socket access
- Use Docker socket proxy for additional security

### Network Exposure

- Homarr is exposed via Traefik (HTTPS only)
- No direct port exposure (all traffic through reverse proxy)
- Security headers enforced (HSTS, XSS protection, content-type nosniff)
- All integrations communicate over internal network

## Frequently Asked Questions

**Q: Does Homarr require a database?**
A: No, Homarr uses SQLite stored in the `/appdata` volume. No external database needed.

**Q: Can I use Homarr without Docker socket access?**
A: Yes! Simply comment out the `/var/run/docker.sock` volume mount in docker-compose.yml. All other features work without it.

**Q: How do I add my own service icons?**
A: Go to Settings → Icons → Upload custom icon (PNG/SVG). Icons are stored in `/appdata/icons/`.

**Q: Can I share my dashboard configuration?**
A: Yes, export your config from Settings → Export and share the JSON file.

**Q: Does Homarr work on mobile?**
A: Yes, Homarr is fully responsive and works on mobile devices, tablets, and desktops.

**Q: How do I reset my dashboard?**
A: Settings → Danger Zone → Reset Dashboard. Or delete `/appdata/configs/` and restart.

---

**Template Version**: 1.0.0
**Last Updated**: December 2025
**Homarr Version**: v1.47.0
