# dashdot-homarr

Internal server monitoring dashboard for Homarr's System Health widget.

## Overview

This template deploys [dashdot](https://github.com/MauriceNino/dashdot) as an **internal-only service** - not publicly accessible. Homarr connects to it via the Docker network using the internal URL `http://dashdot:3001`.

## Quick Start

1. **Deploy this template** in the same Dokploy project as your Homarr instance
2. **Configure Homarr** with internal URL: `http://dashdot:3001`

## Homarr Configuration

After deploying dashdot-homarr in the same project:

1. Open your Homarr dashboard
2. Enter **Edit Mode**
3. Click **Add Item** → **Widgets** → **System Health Monitoring**
4. Click the widget's menu → **Edit**
5. Go to **Integrations** tab → **Create integration** → **Dash.**
6. Enter URL: `http://dashdot:3001`
7. Save and exit edit mode

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DASHDOT_WIDGET_LIST` | Widgets to display | `os,cpu,storage,ram,network` |
| `DASHDOT_PAGE_TITLE` | Dashboard title | `Server Stats` |
| `TZ` | Timezone | `UTC` |

## Network

- **Internal URL:** `http://dashdot:3001`
- **Network:** `dokploy-network` (shared with Homarr)
- **Public access:** Disabled (traefik.enable=false)

## Requirements

- Must be deployed in the same Dokploy project/network as Homarr
- Requires privileged mode for system metrics access

## Links

- [dashdot Documentation](https://getdashdot.com/docs)
- [Homarr Dash. Integration](https://homarr.dev/docs/integrations/dash-dot/)
