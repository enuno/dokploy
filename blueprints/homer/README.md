# Homer - Static Homepage Dashboard

A very simple static homepage for your server to keep your services on hand, from a simple `yaml` configuration file.

![Homer Dashboard](https://raw.githubusercontent.com/bastienwirtz/homer/main/docs/screenshot.png)

## Overview

Homer is a dead simple static homepage for your server to keep your services on hand. It's built with simplicity and flexibility in mind, featuring:

- **YAML Configuration**: Configure your dashboard with a simple YAML file
- **Responsive Design**: Works on desktop, mobile, and tablets
- **Live Search**: Quick search functionality to find your services
- **Keyboard Shortcuts**: Navigate quickly with keyboard controls
- **Service Status**: Optional ping checks to monitor service availability
- **Themes**: Multiple built-in themes with dark mode support
- **Icons**: Font Awesome and custom icon support
- **Lightweight**: Alpine-based Docker image (~10MB)

## Features

- 🎨 **Customizable Layout**: Organize services into groups and categories
- 🔍 **Search Functionality**: Quickly find services with instant search
- ⌨️ **Keyboard Navigation**: Navigate with keyboard shortcuts
- 🌙 **Dark Mode**: Built-in dark theme support
- 📱 **Mobile Responsive**: Perfect on any device
- 🏷️ **Service Tags**: Tag and filter services
- 📊 **Service Status**: Monitor availability with ping checks
- 🔗 **External Links**: Quick access to documentation and resources
- 🎯 **No Backend Required**: Pure static files served by lighttpd

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Dokploy Environment                      │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    homer-net (Internal)                 │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │              Homer Service                        │  │ │
│  │  │  - Image: b4bz/homer:v24.05.1                    │  │ │
│  │  │  - Port: 8080 (internal)                         │  │ │
│  │  │  - Volume: homer-assets (/www/assets)            │  │ │
│  │  │  - Health: wget localhost:8080                   │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                           │                              │ │
│  └───────────────────────────┼──────────────────────────────┘ │
│                              │                                │
│  ┌───────────────────────────┼──────────────────────────────┐ │
│  │              dokploy-network (External)                  │ │
│  │                           │                              │ │
│  │                      ┌────▼────┐                         │ │
│  │                      │ Traefik │                         │ │
│  │                      │ Routing │                         │ │
│  │                      └────┬────┘                         │ │
│  └───────────────────────────┼──────────────────────────────┘ │
└──────────────────────────────┼───────────────────────────────┘
                               │
                        ┌──────▼──────┐
                        │   Internet  │
                        │ (HTTPS/443) │
                        └─────────────┘
```

### Components

| Component | Purpose | Network |
|-----------|---------|---------|
| **Homer Service** | Static dashboard with YAML config | homer-net + dokploy-network |
| **homer-assets Volume** | Persistent storage for configuration | Local volume |
| **Traefik** | Reverse proxy with SSL termination | dokploy-network |

### Security

- ✅ **HTTPS Only**: All traffic encrypted via Let's Encrypt
- ✅ **Security Headers**: HSTS, XSS protection, clickjacking protection
- ✅ **No Authentication**: Homer doesn't include built-in auth (use Traefik middleware or Cloudflare Zero Trust)
- ✅ **Static Content**: No server-side code execution
- ✅ **Alpine Base**: Minimal attack surface

## Prerequisites

- Dokploy instance running
- Domain name pointed to your server
- Docker and Docker Compose installed
- Port 443 available for HTTPS traffic

## Quick Start

### 1. Deploy via Dokploy UI

1. Navigate to your Dokploy instance
2. Go to **Templates** → **Create Template**
3. Select **Homer** from the template list
4. Configure the required variables (see below)
5. Click **Deploy**

### 2. Configuration Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `domain` | ✅ Yes | - | Domain for accessing Homer (e.g., `homer.example.com`) |
| `init_assets` | No | `1` | Initialize example configuration (1=yes, 0=no) |
| `port` | No | `8080` | Internal container port |

### 3. Post-Deployment

After deployment completes:

1. **Access your instance**: Navigate to `https://your-domain.com`
2. **Configure your dashboard**: Edit `/www/assets/config.yml` inside the container or volume
3. **Customize appearance**: Modify themes, icons, and layout
4. **Add your services**: Update the YAML configuration with your service links

## Configuration

### Environment Variables

The following environment variables are available:

```yaml
# Domain Configuration
HOMER_DOMAIN: your-domain.com          # Domain for web access

# Initialization (first run)
INIT_ASSETS: 1                         # Copy example config (1) or start empty (0)

# Server Configuration
PORT: 8080                             # Internal HTTP port (usually no need to change)
```

### Homer Configuration File

Homer is configured via `/www/assets/config.yml`. Access the volume to customize:

```bash
# View current configuration
docker exec -it homer_homer_1 cat /www/assets/config.yml

# Edit configuration (mount volume or use docker cp)
docker cp homer_homer_1:/www/assets/config.yml ./config.yml
# Edit locally, then copy back:
docker cp ./config.yml homer_homer_1:/www/assets/config.yml
```

### Example Configuration

```yaml
---
# Homepage configuration
title: "My Dashboard"
subtitle: "Homer"
logo: "logo.png"

header: true
footer: '<p>Created with <span class="has-text-danger">❤️</span> with <a href="https://bulma.io/">bulma</a>, <a href="https://vuejs.org/">vuejs</a> & <a href="https://fontawesome.com/">font awesome</a></p>'

# Optional theme
theme: default
colors:
  light:
    highlight-primary: "#3367d6"
    highlight-secondary: "#4285f4"
    highlight-hover: "#5a95f5"
    background: "#f5f5f5"
    card-background: "#ffffff"
    text: "#363636"
    text-header: "#ffffff"
    text-title: "#303030"
    text-subtitle: "#424242"
    card-shadow: rgba(0, 0, 0, 0.1)
    link-hover: "#363636"
  dark:
    highlight-primary: "#3367d6"
    highlight-secondary: "#4285f4"
    highlight-hover: "#5a95f5"
    background: "#131313"
    card-background: "#2b2b2b"
    text: "#eaeaea"
    text-header: "#ffffff"
    text-title: "#fafafa"
    text-subtitle: "#f5f5f5"
    card-shadow: rgba(0, 0, 0, 0.4)
    link-hover: "#ffdd57"

# Services
services:
  - name: "Applications"
    icon: "fas fa-cloud"
    items:
      - name: "Awesome app"
        logo: "assets/tools/sample.png"
        subtitle: "Bookmark example"
        tag: "app"
        url: "https://www.reddit.com/r/selfhosted/"
        target: "_blank"
```

## Health Checks

Homer includes an optimized health check:

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s  # Fast startup for static server
```

**Recent Improvements**: Homer's health check has been optimized to complete in ~1.9 seconds (down from ~30 seconds in earlier versions).

## Security Configuration

### HTTPS & SSL

- **Certificate**: Automatic Let's Encrypt via Traefik
- **Renewal**: Automatic certificate renewal
- **Protocols**: TLS 1.2 and TLS 1.3 only

### Security Headers

The template includes comprehensive security headers:

```yaml
# HSTS (HTTP Strict Transport Security)
Strict-Transport-Security: max-age=31536000; includeSubDomains

# XSS Protection
X-XSS-Protection: 1; mode=block

# Clickjacking Protection
X-Frame-Options: DENY

# Content-Type Sniffing Protection
X-Content-Type-Options: nosniff

# Referrer Policy
Referrer-Policy: strict-origin-when-cross-origin
```

### Authentication

Homer does not include built-in authentication. For access control, consider:

1. **Traefik BasicAuth Middleware**: Add HTTP Basic Authentication
2. **Cloudflare Zero Trust**: Use Cloudflare Access for SSO
3. **Authelia/Authentik**: Self-hosted authentication proxy
4. **VPN Access**: Restrict to VPN network only

Example Traefik BasicAuth (add to labels):
```yaml
- "traefik.http.routers.homer.middlewares=homer-auth@docker"
- "traefik.http.middlewares.homer-auth.basicauth.users=user:$$apr1$$encrypted$$hash"
```

## Customization

### Themes

Homer supports multiple themes out of the box:

- `default` - Light theme (default)
- `sui` - Dark theme inspired by SUI CSS framework

Set theme in `config.yml`:
```yaml
theme: default  # or 'sui'
```

### Icons

Homer supports multiple icon sources:

1. **Font Awesome**: `icon: "fas fa-server"`
2. **Custom Images**: Place in `/www/assets/tools/` and reference: `logo: "assets/tools/myapp.png"`
3. **External URLs**: Use full URL for remote icons

### Service Status Checks

Enable ping checks to monitor service availability:

```yaml
services:
  - name: "Applications"
    items:
      - name: "My Service"
        url: "https://example.com"
        type: "Ping"
        # Service will show online/offline status
```

## Troubleshooting

### Issue: Homer shows blank page

**Symptoms**: White/blank page after deployment

**Solution**:
1. Check if assets were initialized:
   ```bash
   docker exec homer_homer_1 ls -la /www/assets/
   ```
2. Re-initialize if empty:
   ```bash
   docker exec homer_homer_1 sh -c 'cp -r /www/default-assets/* /www/assets/'
   docker restart homer_homer_1
   ```

### Issue: Configuration changes not appearing

**Symptoms**: Modified `config.yml` but changes don't show

**Solution**:
1. Clear browser cache (Homer caches assets)
2. Use hard refresh: `Ctrl+Shift+R` (Chrome/Firefox) or `Cmd+Shift+R` (Mac)
3. Verify file was updated:
   ```bash
   docker exec homer_homer_1 cat /www/assets/config.yml
   ```

### Issue: Icons not loading

**Symptoms**: Broken image icons or missing Font Awesome icons

**Solution**:
1. For custom icons, ensure they're in `/www/assets/tools/` directory
2. For Font Awesome, verify icon name: https://fontawesome.com/search
3. Check browser console for 404 errors
4. Ensure `logo` path uses `assets/tools/` prefix: `logo: "assets/tools/icon.png"`

### Issue: Service status not updating

**Symptoms**: Ping status shows as offline when service is online

**Solution**:
1. Verify service URL is accessible from Homer container:
   ```bash
   docker exec homer_homer_1 wget -qO- https://your-service.com
   ```
2. Check if service requires authentication (ping won't work with auth)
3. Try using direct IP instead of domain name if DNS resolution fails

### Issue: 502 Bad Gateway

**Symptoms**: Nginx/Traefik returns 502 error

**Solution**:
1. Check Homer container is running:
   ```bash
   docker ps | grep homer
   ```
2. Verify health check status:
   ```bash
   docker inspect homer_homer_1 | grep -A 10 Health
   ```
3. Check container logs:
   ```bash
   docker logs homer_homer_1
   ```
4. Ensure container is on both networks (homer-net + dokploy-network)

## Maintenance

### Backup Configuration

Regular backups are recommended:

```bash
# Backup config.yml
docker cp homer_homer_1:/www/assets/config.yml ./homer-config-backup-$(date +%Y%m%d).yml

# Backup all assets (themes, icons, etc.)
docker cp homer_homer_1:/www/assets ./homer-assets-backup-$(date +%Y%m%d)
```

### Update Homer

To update to a newer version:

1. Update image version in template or docker-compose.yml
2. Redeploy via Dokploy UI
3. Verify configuration persists (stored in volume)

### Volume Management

Homer assets are stored in a persistent volume:

```bash
# List volumes
docker volume ls | grep homer

# Inspect volume
docker volume inspect homer_homer-assets

# Backup volume data
docker run --rm -v homer_homer-assets:/data -v $(pwd):/backup alpine tar czf /backup/homer-assets.tar.gz /data
```

## Resources

### Official Documentation
- **Homepage**: https://github.com/bastienwirtz/homer
- **Documentation**: https://github.com/bastienwirtz/homer/blob/main/docs/configuration.md
- **Demo**: https://homer-demo.netlify.app/

### Docker Image
- **Docker Hub**: https://hub.docker.com/r/b4bz/homer
- **GitHub Container Registry**: ghcr.io/bastienwirtz/homer

### Community
- **GitHub Issues**: https://github.com/bastienwirtz/homer/issues
- **GitHub Discussions**: https://github.com/bastienwirtz/homer/discussions

### Related Projects
- **Heimdall**: Alternative dashboard with more features
- **Organizr**: Full-featured dashboard with authentication
- **Homarr**: Modern dashboard with Docker integration

## Template Information

- **Template Version**: 1.0.0
- **Homer Version**: v24.05.1
- **Created**: December 2025
- **Maintainer**: Dokploy Community
- **License**: Apache 2.0 (Homer is MIT licensed)

## Contributing

Found an issue or have a suggestion? Please open an issue or pull request in the Dokploy templates repository.

---

**Happy Dashboarding! 🎯**
