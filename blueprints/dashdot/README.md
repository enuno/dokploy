# dashdot

Modern server dashboard with glassmorphism design for monitoring system metrics.

## Overview

[dashdot](https://github.com/MauriceNino/dashdot) is a minimal, modern server dashboard that displays real-time system information including OS details, CPU usage, RAM consumption, storage capacity, network throughput, and GPU metrics. It features a sleek glassmorphism interface with both dark and light modes.

This Dokploy template provides a production-ready dashdot deployment with:

- Secure HTTPS via Traefik with Let's Encrypt
- Privileged container access for system metrics
- Configurable widget selection
- Security headers for web protection
- Automatic timezone detection

## Features

dashdot monitors and displays:

- **OS** - Operating system details, hostname, uptime
- **CPU** - Processor usage, model, cores, temperature
- **RAM** - Memory usage and capacity
- **Storage** - Disk usage across mounted volumes
- **Network** - Upload/download speeds and throughput
- **GPU** - Graphics card metrics (if available)

## Architecture

```
                    ┌─────────────────────────┐
                    │        Internet         │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   Traefik (HTTPS/TLS)   │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │       dashdot           │
                    │   (port 3001 internal)  │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │  Host Metrics   │    │
                    │  │  /mnt/host (ro) │    │
                    │  └─────────────────┘    │
                    └─────────────────────────┘
```

## Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 0.5 core | 1 core |
| Memory | 64 MB | 128 MB |
| Storage | 50 MB | 100 MB |

**Note:** Requires privileged container access to read host system metrics.

## Configuration Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Your dashdot domain | `dash.example.com` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `DASHDOT_WIDGET_LIST` | Comma-separated widgets to display | `os,cpu,storage,ram,network` |
| `DASHDOT_PAGE_TITLE` | Browser tab title | `dash.` |
| `DASHDOT_USE_IMPERIAL` | Use imperial units (Fahrenheit) | `false` |
| `DASHDOT_ALWAYS_SHOW_PERCENTAGES` | Show percentages on all graphs | `false` |
| `DASHDOT_SHOW_DASH_VERSION` | Version display location | `icon_hover` |
| `DASHDOT_DISABLE_INTEGRATIONS` | Disable API integrations | `false` |
| `TZ` | Timezone | `UTC` |

### Widget Options

Available widgets for `DASHDOT_WIDGET_LIST`:

| Widget | Description |
|--------|-------------|
| `os` | Operating system info and uptime |
| `cpu` | CPU usage, model, temperature |
| `ram` | Memory usage |
| `storage` | Disk usage |
| `network` | Network throughput |
| `gpu` | GPU metrics (requires compatible hardware) |

### Version Display Options

Values for `DASHDOT_SHOW_DASH_VERSION`:

| Value | Description |
|-------|-------------|
| `icon_hover` | Show on logo hover (default) |
| `bottom_right` | Always visible in corner |
| `none` | Hidden |

## Deployment

### 1. Create the template in Dokploy

1. Go to your project in Dokploy
2. Add a new Compose service
3. Use the GitHub source: `blueprints/dashdot/docker-compose.yml`
4. Set the `DOMAIN` environment variable

### 2. Verify deployment

```bash
curl https://your-domain.com/
# Should return HTML dashboard
```

## Security Considerations

### Privileged Mode

dashdot requires `privileged: true` to access host system metrics. This grants the container elevated permissions. Security implications:

- Container has full access to host devices
- Can read all host filesystem data (mounted read-only)
- Required for accurate system monitoring

**Mitigation:** The host filesystem is mounted read-only (`/:/mnt/host:ro`), preventing any modifications.

### Network Exposure

By default, dashdot has no authentication. Anyone with the URL can view server metrics. Consider:

1. **Basic Auth via Traefik** - Add authentication middleware
2. **VPN/Tailscale** - Restrict access to private network
3. **Cloudflare Access** - Use Zero Trust policies

#### Adding Basic Auth

To add basic authentication, modify the docker-compose.yml labels:

```yaml
labels:
  # ... existing labels ...
  - "traefik.http.middlewares.dashdot-auth.basicauth.users=admin:$$apr1$$..."
  - "traefik.http.routers.dashdot.middlewares=dashdot-security@docker,dashdot-auth@docker"
```

Generate password hash:
```bash
htpasswd -nb admin yourpassword
```

## Customization

### Custom Widgets

Enable GPU monitoring:

```yaml
environment:
  DASHDOT_WIDGET_LIST: "os,cpu,storage,ram,network,gpu"
```

### Minimal Dashboard

Show only CPU and RAM:

```yaml
environment:
  DASHDOT_WIDGET_LIST: "cpu,ram"
```

### Custom Page Title

```yaml
environment:
  DASHDOT_PAGE_TITLE: "Server Status"
```

## Troubleshooting

### Dashboard shows incorrect metrics

Verify the host filesystem is mounted:

```bash
docker exec <container-name> ls /mnt/host
# Should show host root filesystem
```

### CPU temperature not showing

Some systems don't expose temperature sensors. Check if sensors are available:

```bash
# On host system
cat /sys/class/thermal/thermal_zone*/temp
```

### GPU widget not working

GPU monitoring requires:
- NVIDIA GPU with nvidia-container-toolkit
- AMD GPU with appropriate drivers
- Compatible integrated graphics

### Container fails to start

Check if privileged mode is allowed in your Docker/container runtime configuration.

```bash
docker logs <container-name>
```

## Resources

- [dashdot Documentation](https://getdashdot.com/docs)
- [dashdot GitHub](https://github.com/MauriceNino/dashdot)
- [Configuration Reference](https://getdashdot.com/docs/configuration/basic)
- [Live Demo](https://dash.mauz.dev)

## License

dashdot is released under the MIT license.
