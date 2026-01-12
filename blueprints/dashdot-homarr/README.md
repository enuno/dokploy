# dashdot-homarr

Server monitoring dashboard optimized for Homarr's System Health widget integration.

## Overview

This template deploys [dashdot](https://github.com/MauriceNino/dashdot) configured specifically for embedding in [Homarr](https://homarr.dev/). It includes proper CORS headers and frame policies to enable seamless iframe integration.

## Quick Start

1. **Deploy this template** in the same Dokploy project as your Homarr instance
2. **Set the domain** (e.g., `stats.example.com`)
3. **Configure Homarr** to use the dashdot URL

## Homarr Integration Steps

After deploying dashdot-homarr:

1. Open your Homarr dashboard
2. Enter **Edit Mode**
3. Click **Add Item** → **Widgets** → **System Health Monitoring**
4. Click the widget's **three dots menu** → **Edit**
5. Go to **Integrations** tab
6. Click **Create integration** → Select **Dash.**
7. Enter your dashdot URL: `https://your-dashdot-domain.com`
8. Save and exit edit mode

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DASHDOT_DOMAIN` | Domain for dashdot (required) | - |
| `HOMARR_DOMAIN` | Your Homarr domain (optional, for iframe security) | `*` |
| `DASHDOT_WIDGET_LIST` | Widgets to display | `os,cpu,storage,ram,network` |
| `DASHDOT_PAGE_TITLE` | Dashboard title | `Server Stats` |
| `TZ` | Timezone | `UTC` |

## Requirements

- Both Homarr and dashdot must use HTTPS (required for iframe embedding)
- dashdot requires privileged mode for system metrics access
- Host filesystem is mounted read-only at `/mnt/host`

## Troubleshooting

### Widget shows "Mixed Content" error
Ensure both Homarr and dashdot use HTTPS. HTTP content cannot be embedded in HTTPS pages.

### Widget shows blank or "Refused to connect"
Check that the `HOMARR_DOMAIN` environment variable matches your Homarr domain, or leave it unset to allow any origin.

### Metrics not showing
The container requires privileged mode. Verify the deployment has privileged access enabled.

## Links

- [dashdot Documentation](https://getdashdot.com/docs)
- [Homarr Dash. Integration](https://homarr.dev/docs/integrations/dash-dot/)
- [dashdot GitHub](https://github.com/MauriceNino/dashdot)
