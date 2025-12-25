# Dashy - Personal Dashboard

Dashy is a highly customizable, self-hosted personal dashboard for organizing your homelab services and web applications. Built with Vue.js, it provides a clean, modern interface for quick access to your most-used tools and services.

## Features

- **Customizable Dashboard**: Drag-and-drop widgets, custom themes, and layouts
- **Service Management**: Quick access to all your homelab services via configured links
- **File-Based Configuration**: Simple YAML configuration file for easy customization
- **Built-in Icons**: Extensive icon library (Font Awesome, Material Design)
- **Status Checking**: Monitor service availability with health checks
- **Search**: Fuzzy search across all configured services
- **Themes**: Multiple pre-built themes plus custom theme support
- **Widgets**: Weather, system stats, RSS feeds, and more
- **Keyboard Shortcuts**: Quick navigation and service launching
- **No Database Required**: Lightweight, file-based storage

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
│  │                              Dashy                                         ││
│  │                     (Personal Dashboard)                                   ││
│  │                                                                            ││
│  │  lissy93/dashy:3.1.1                                                      ││
│  │  Port: 8080                                                               ││
│  │                                                                            ││
│  │  - Service links and bookmarks                                            ││
│  │  - Customizable widgets                                                   ││
│  │  - Themeable interface                                                    ││
│  │                                                                            ││
│  │  Volume:                                                                  ││
│  │  - dashy-config (/app/user-data)                                          ││
│  │    └── conf.yml (configuration file)                                      ││
│  │                                                                            ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| dashy | lissy93/dashy:3.1.1 | 8080 | Personal dashboard UI |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- Services/applications you want to add to your dashboard

## Configuration Variables

### Required

| Variable | Description |
|----------|-------------|
| `DASHY_DOMAIN` | Domain for Dashy (e.g., `dashboard.example.com`) |

### Optional - Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment (do not change) |

## Deployment

### 1. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure required variable:
   - Set your domain (e.g., `dashboard.example.com`)
4. Deploy the stack

### 2. First Access

1. Navigate to `https://your-domain/`
2. You'll see the default Dashy dashboard with example services
3. Click the settings icon (gear) in the top-right
4. Choose "Open Config" to edit the configuration

### 3. Verify Installation

```bash
# Check service is running
docker compose ps

# Should show:
# - dashy (healthy)

# Check logs
docker compose logs dashy
```

## Configuration

### Editing the Dashboard

Dashy can be configured in three ways:

#### Option 1: Web UI (Easiest)
1. Click settings icon → "Open Config"
2. Edit YAML in the built-in editor
3. Click "Save" to apply changes
4. Dashboard reloads automatically

#### Option 2: Direct YAML Editing
1. Access the container:
   ```bash
   docker compose exec dashy sh
   cd /app/user-data
   vi conf.yml
   ```
2. Edit `conf.yml`
3. Restart the container:
   ```bash
   docker compose restart dashy
   ```

#### Option 3: Volume Mount Editing
1. Copy config from volume:
   ```bash
   docker compose cp dashy:/app/user-data/conf.yml ./conf.yml
   ```
2. Edit `conf.yml` locally
3. Copy back:
   ```bash
   docker compose cp ./conf.yml dashy:/app/user-data/conf.yml
   docker compose restart dashy
   ```

### Example Configuration

```yaml
# conf.yml
pageInfo:
  title: My Homelab Dashboard
  description: Quick access to all my services
  navLinks:
    - title: GitHub
      path: https://github.com

appConfig:
  theme: colorful
  layout: auto
  iconSize: medium
  language: en

sections:
  - name: Media
    icon: fas fa-photo-video
    items:
      - title: Plex
        description: Media server
        icon: https://plex.tv/favicon.ico
        url: https://plex.example.com
        statusCheck: true

      - title: Jellyfin
        description: Alternative media server
        icon: https://jellyfin.org/favicon.ico
        url: https://jellyfin.example.com

  - name: Development
    icon: fas fa-code
    items:
      - title: Forgejo
        description: Git repositories
        icon: https://forgejo.org/favicon.ico
        url: https://git.example.com

      - title: GitIngest
        description: Repository digest generator
        icon: hl-gitingest
        url: https://gitingest.example.com

  - name: Monitoring
    icon: fas fa-chart-line
    items:
      - title: Grafana
        description: Metrics dashboards
        icon: https://grafana.com/favicon.ico
        url: https://grafana.example.com

      - title: Dokploy
        description: Deployment platform
        icon: https://dokploy.com/favicon.ico
        url: https://dokploy.example.com
```

### Icon Options

Dashy supports multiple icon sources:

```yaml
# Font Awesome
icon: fas fa-server

# Material Design Icons
icon: mdi-server

# Simple Icons
icon: si-docker

# Favicon from URL
icon: https://example.com/favicon.ico

# Generative icons (based on URL)
icon: generative

# Emoji
icon: 🚀
```

### Status Checking

Enable health checks for services:

```yaml
items:
  - title: Service Name
    url: https://service.example.com
    statusCheck: true
    statusCheckUrl: https://service.example.com/health  # Optional custom endpoint
    statusCheckInterval: 300  # Check every 5 minutes
```

### Themes

Available built-in themes:
- `default` - Light theme
- `colorful` - Vibrant colors
- `minimal-dark` - Dark minimalist
- `minimal-light` - Light minimalist
- `material-dark` - Material design dark
- `material-light` - Material design light
- Custom themes via CSS

## Backup and Recovery

### Critical Data to Backup

1. **Configuration file** - Contains all dashboard settings
2. **dashy-config volume** - Stores conf.yml and custom assets

### Backup Commands

```bash
# Backup configuration file
docker compose cp dashy:/app/user-data/conf.yml ./backup-conf.yml

# Backup entire user-data directory
docker compose cp dashy:/app/user-data ./backup-user-data

# Backup via volume
docker run --rm \
  -v dashy-config:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/dashy-config.tar.gz /data
```

### Recovery

```bash
# Restore configuration
docker compose cp ./backup-conf.yml dashy:/app/user-data/conf.yml
docker compose restart dashy

# Restore entire user-data directory
docker compose cp ./backup-user-data dashy:/app/user-data
docker compose restart dashy

# Restore from volume backup
docker run --rm \
  -v dashy-config:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd / && tar xzf /backup/dashy-config.tar.gz"
docker compose restart dashy
```

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| dashy | 0.25 | 256MB | Minimal (config only) |
| **Total** | **0.25** | **256MB** | **~50MB** |

Storage requirements are minimal as Dashy only stores configuration files.

## Troubleshooting

### Dashy Won't Start

1. **Check service status:**
   ```bash
   docker compose ps
   docker compose logs dashy
   ```

2. **Verify health check:**
   ```bash
   docker compose exec dashy node /app/services/healthcheck
   ```

3. **Check configuration:**
   ```bash
   docker compose exec dashy cat /app/user-data/conf.yml
   ```

### Configuration Changes Not Applying

1. **Restart the service:**
   ```bash
   docker compose restart dashy
   ```

2. **Check for YAML syntax errors:**
   ```bash
   docker compose logs dashy | grep -i error
   ```

3. **Validate conf.yml syntax** (use online YAML validator)

### Icons Not Loading

1. **Check network connectivity:**
   ```bash
   docker compose exec dashy wget -O- https://example.com/favicon.ico
   ```

2. **Use local icons instead** (generative or emoji)

3. **Verify icon syntax in conf.yml**

### Status Checks Failing

1. **Verify service URL is accessible:**
   ```bash
   docker compose exec dashy wget --spider https://service.example.com
   ```

2. **Check CORS settings** (some services block external checks)

3. **Use custom `statusCheckUrl`** if service has dedicated health endpoint

### Performance Issues

1. **Reduce status check frequency:**
   ```yaml
   statusCheckInterval: 600  # Check every 10 minutes
   ```

2. **Disable unused features:**
   ```yaml
   appConfig:
     disableSmartSort: true
     disableConfiguration: false  # Disable if config locked down
   ```

3. **Check browser console** for JavaScript errors

## Advanced Configuration

### Custom CSS Theming

Add custom CSS to your configuration:

```yaml
appConfig:
  customCss: |
    :root {
      --primary: #00d9ff;
      --background: #0b1021;
    }
```

### Authentication

Enable basic authentication (optional):

```yaml
appConfig:
  auth:
    - user: admin
      hash: 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8  # SHA-256 hash of password
```

Generate password hash:
```bash
echo -n 'your-password' | sha256sum
```

### Multi-Page Dashboards

Create multiple pages:

```yaml
pages:
  - name: Home
    path: home.yml
  - name: Work
    path: work.yml
```

## Upgrading

### Minor Version Upgrade

```bash
# Update image tag in docker-compose.yml
# Example: v3.1.1 → v3.1.2

# Pull new image
docker compose pull

# Restart services
docker compose up -d

# Verify health
docker compose ps
```

### Major Version Upgrade

1. Backup configuration and data
2. Read [Dashy release notes](https://github.com/Lissy93/dashy/releases)
3. Update image tag in docker-compose.yml
4. Test in staging environment first
5. Deploy and verify all features work

## Related Resources

- [Dashy GitHub](https://github.com/Lissy93/dashy)
- [Dashy Documentation](https://dashy.to/)
- [Dashy Demo](https://demo.dashy.to/)
- [Configuration Examples](https://github.com/Lissy93/dashy/blob/master/docs/configuring.md)
- [Icon Options](https://github.com/Lissy93/dashy/blob/master/docs/icons.md)
- [Dokploy Documentation](https://docs.dokploy.com/)

---

**Template Version**: 1.0.0
**Last Updated**: December 2025
