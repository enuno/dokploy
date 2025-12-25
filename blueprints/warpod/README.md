# Warpod - Cloudflare WARP Proxy Server

Warpod runs the Cloudflare WARP client inside a container and exposes SOCKS5/HTTP/HTTPS proxy interfaces. Other containers can route their outbound traffic through Warpod to access the internet via Cloudflare's WARP network, providing privacy, security, and access to Zero Trust private networks.

## Features

- **Multiple Proxy Protocols**: SOCKS5 (1080), HTTP (1081), HTTPS (1082)
- **Zero Trust Integration**: Connect to Cloudflare Zero Trust private networks
- **Free Mode**: Works without any configuration using free WARP
- **WARP+ Support**: Premium features with license key
- **Proxy Authentication**: Optional username/password protection
- **Container-Native**: Designed for Docker and Kubernetes environments
- **Lightweight**: Based on Ubuntu 22.04 with minimal footprint

## Architecture

```
                                   CLOUDFLARE WARP NETWORK
                                  ┌──────────────────────────┐
                                  │                          │
                                  │  Cloudflare Edge         │
                                  │  (Privacy, Security,     │
                                  │   Zero Trust Access)     │
                                  │                          │
                                  └────────────┬─────────────┘
                                               │
                                    Encrypted WARP Tunnel
                                               │
┌──────────────────────────────────────────────┼──────────────────────────────────────────────┐
│                                              │                                              │
│                       dokploy-network        │                                              │
│                                              │                                              │
│  ┌────────────────────────────────────┐      │                                              │
│  │            warpod                  │◀─────┘                                              │
│  │                                    │                                                     │
│  │  ┌──────────────────────────────┐  │                                                     │
│  │  │      Proxy Interfaces        │  │                                                     │
│  │  │  SOCKS5  :1080               │  │                                                     │
│  │  │  HTTP    :1081               │  │                                                     │
│  │  │  HTTPS   :1082               │  │                                                     │
│  │  └──────────────────────────────┘  │                                                     │
│  │                                    │                                                     │
│  │  ┌──────────────────────────────┐  │                                                     │
│  │  │      WARP Service            │  │                                                     │
│  │  │      (warp-svc :41080)       │  │                                                     │
│  │  └──────────────────────────────┘  │                                                     │
│  └────────────────────────────────────┘                                                     │
│                    ▲                                                                        │
│                    │                                                                        │
│      ┌─────────────┼─────────────┬─────────────────────┐                                    │
│      │             │             │                     │                                    │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐          ┌─────────────┐                             │
│ │ Service │  │ Service │  │ Service │          │   Host      │                             │
│ │    A    │  │    B    │  │    C    │    ...   │   Machine   │                             │
│ │         │  │         │  │         │          │  :1080-1082 │                             │
│ └─────────┘  └─────────┘  └─────────┘          └─────────────┘                             │
│                                                                                             │
│  Containers use warpod as proxy:                Host can use exposed ports:                │
│  HTTP_PROXY=http://warpod:1081                  curl -x socks5://localhost:1080            │
│  ALL_PROXY=socks5://warpod:1080                                                            │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Components

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| warpod | ghcr.io/deepwn/warpod:latest | 1080, 1081, 1082 | WARP proxy server |

## Prerequisites

- Dokploy installed and running
- (Optional) Cloudflare Zero Trust account for MDM mode
- (Optional) WARP+ license for premium features

## Configuration Variables

### Operation Modes

Warpod supports three operation modes:

| Mode | Requirements | Features |
|------|--------------|----------|
| **Free** | None (default) | Basic WARP proxy, auto-registers free account |
| **Zero Trust / MDM** | Org ID + Service Token | Private network access, Zero Trust policies |
| **WARP+** | License key | Premium speeds and features |

### Zero Trust Variables (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `WARP_ORG_ID` | Your Zero Trust organization name | `mycompany` |
| `WARP_AUTH_CLIENT_ID` | Service token client ID | `abc123.access` |
| `WARP_AUTH_CLIENT_SECRET` | Service token secret | `secret456` |

### WARP+ Variables (Optional)

| Variable | Description |
|----------|-------------|
| `WARP_LICENSE` | Your WARP+ license key |

### Proxy Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SOCK_PORT` | `1080` | Internal SOCKS5 port |
| `HTTP_PORT` | `1081` | Internal HTTP proxy port |
| `HTTPS_PORT` | `1082` | Internal HTTPS proxy port |
| `SOCKS_EXPOSE_PORT` | `1080` | Host-exposed SOCKS5 port |
| `HTTP_EXPOSE_PORT` | `1081` | Host-exposed HTTP port |
| `HTTPS_EXPOSE_PORT` | `1082` | Host-exposed HTTPS port |
| `PROXY_AUTH` | - | Proxy authentication (`user:password`) |

## Deployment

### 1. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure variables based on your chosen mode
4. Deploy the stack

### 2. Verify Connection

Check that WARP is connected:

```bash
# Test SOCKS5 proxy
curl -x socks5://localhost:1080 https://cloudflare.com/cdn-cgi/trace

# Test HTTP proxy
curl -x http://localhost:1081 https://cloudflare.com/cdn-cgi/trace

# Should show: warp=on or warp=plus
```

## Using Warpod from Other Containers

### Method 1: Environment Variables

Add these environment variables to containers that should use Warpod:

```yaml
environment:
  HTTP_PROXY: http://warpod:1081
  HTTPS_PROXY: http://warpod:1081
  ALL_PROXY: socks5://warpod:1080
  NO_PROXY: localhost,127.0.0.1,.local
```

### Method 2: Application-Specific Configuration

Configure individual applications to use the proxy:

**curl:**
```bash
curl -x socks5://warpod:1080 https://example.com
```

**wget:**
```bash
https_proxy=http://warpod:1081 wget https://example.com
```

**Python requests:**
```python
import requests
proxies = {
    'http': 'socks5://warpod:1080',
    'https': 'socks5://warpod:1080'
}
requests.get('https://example.com', proxies=proxies)
```

**Node.js:**
```javascript
const HttpsProxyAgent = require('https-proxy-agent');
const agent = new HttpsProxyAgent('http://warpod:1081');
fetch('https://example.com', { agent });
```

### Method 3: Docker Network DNS

Containers on `dokploy-network` can resolve `warpod` by name:

```bash
# From any container on dokploy-network
curl -x socks5://warpod:1080 https://example.com
```

## Zero Trust Setup

To use Warpod with Cloudflare Zero Trust:

### 1. Create Service Token

1. Go to [Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Access** → **Service Auth**
3. Click **Create Service Token**
4. Note the Client ID and Client Secret

### 2. Configure Device Enrollment

1. Go to **Settings** → **WARP Client** → **Device enrollment**
2. Add a rule: `Service Token` matches your token name
3. Save the policy

### 3. Set Proxy Mode (Important!)

1. Go to **Settings** → **WARP Client** → **Device settings**
2. Create or edit a profile
3. Under **Service mode**, select **Proxy**
4. Set **Local proxy port** to `41080`
5. Save changes

### 4. Configure Warpod

Set these environment variables in Dokploy:

```
WARP_ORG_ID=your-org-name
WARP_AUTH_CLIENT_ID=your-client-id.access
WARP_AUTH_CLIENT_SECRET=your-client-secret
```

## Warpod vs Cloudflared

Both are Cloudflare tools but serve different purposes:

| Feature | Warpod | Cloudflared |
|---------|--------|-------------|
| Direction | **Outbound** proxy | **Inbound** tunnel |
| Use case | Route container traffic OUT through WARP | Route external traffic IN to containers |
| Ports | Exposes proxy ports (1080-1082) | No exposed ports |
| Protocol | SOCKS5/HTTP/HTTPS proxy | Cloudflare Tunnel |
| Zero Trust | Private network access | Access policies for inbound |

**Use Warpod when:**
- Containers need to access external resources through WARP
- You need to access Zero Trust private networks
- You want privacy/anonymity for outbound requests

**Use Cloudflared when:**
- You want to expose services to the internet
- You need Zero Trust access policies for inbound traffic
- You don't have a public IP

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| warpod | 0.25 | 256MB | Minimal |

## Troubleshooting

### WARP Not Connecting

1. Check container logs:
   ```bash
   docker compose logs warpod
   ```

2. Verify WARP status:
   ```bash
   docker compose exec warpod warp-cli status
   ```

3. For Zero Trust mode, verify credentials are correct

### Proxy Not Responding

1. Check if ports are listening:
   ```bash
   docker compose exec warpod netstat -tlnp
   ```

2. Verify container is healthy:
   ```bash
   docker compose ps
   ```

3. Test internal connectivity:
   ```bash
   docker compose exec warpod curl -x socks5://127.0.0.1:1080 https://cloudflare.com/cdn-cgi/trace
   ```

### Zero Trust Private Network Not Accessible

1. Verify device enrollment policy allows service tokens
2. Check proxy mode is enabled (port 41080)
3. Verify private network routes are configured in Zero Trust dashboard
4. Check WARP_ORG_ID matches your organization exactly

### Connection Timeouts

1. First startup can take 30-60 seconds
2. Check health status in Docker
3. Verify outbound HTTPS (443) is not blocked

## Security Considerations

- **Credential Security**: Store WARP_AUTH_CLIENT_SECRET securely
- **Proxy Auth**: Enable `PROXY_AUTH` if exposing to untrusted networks
- **Network Isolation**: Only expose ports to containers that need proxy access
- **Zero Trust**: Use device enrollment policies to restrict access

## Related Resources

- [Warpod GitHub](https://github.com/deepwn/warpod)
- [Cloudflare WARP Documentation](https://developers.cloudflare.com/warp-client/)
- [Zero Trust Device Enrollment](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/deployment/device-enrollment/)
- [WARP Modes](https://developers.cloudflare.com/warp-client/warp-modes/)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
