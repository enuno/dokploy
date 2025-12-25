# warp-docker - Cloudflare WARP Client in Docker

warp-docker runs the official Cloudflare WARP client inside a Docker container, exposing a SOCKS5/HTTP proxy on port 1080. This allows other containers to route their outbound traffic through Cloudflare's WARP network for privacy, security, and bypassing geo-restrictions.

## Features

- **Official WARP Client**: Uses the real Cloudflare WARP daemon
- **Dual Protocol**: SOCKS5 and HTTP proxy on single port (1080)
- **WARP+ Support**: Optional license key for premium features
- **Auto-Remediation**: Built-in health checks with automatic fixes
- **Persistent Config**: Saves WARP registration across restarts
- **NAT Mode**: Optional L3 traffic routing for advanced setups
- **Simple Setup**: Minimal configuration, works out of the box

## Architecture

```
                                   CLOUDFLARE WARP NETWORK
                                  ┌──────────────────────────┐
                                  │                          │
                                  │  Cloudflare Edge         │
                                  │  (Privacy, Security,     │
                                  │   Geo-bypass)            │
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
│  │            warp                    │◀─────┘                                              │
│  │                                    │                                                     │
│  │  ┌──────────────────────────────┐  │                                                     │
│  │  │      WARP Daemon             │  │                                                     │
│  │  │      (warp-svc)              │  │                                                     │
│  │  └──────────────────────────────┘  │                                                     │
│  │               │                    │                                                     │
│  │  ┌──────────────────────────────┐  │                                                     │
│  │  │      GOST Proxy              │  │                                                     │
│  │  │  SOCKS5/HTTP :1080           │  │                                                     │
│  │  └──────────────────────────────┘  │                                                     │
│  │                                    │                                                     │
│  └────────────────────────────────────┘                                                     │
│                    ▲                                                                        │
│                    │                                                                        │
│      ┌─────────────┼─────────────┬─────────────────────┐                                    │
│      │             │             │                     │                                    │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐          ┌─────────────┐                             │
│ │ Service │  │ Service │  │ Service │          │   Host      │                             │
│ │    A    │  │    B    │  │    C    │    ...   │   Machine   │                             │
│ │         │  │         │  │         │          │   :1080     │                             │
│ └─────────┘  └─────────┘  └─────────┘          └─────────────┘                             │
│                                                                                             │
│  Containers use warp as proxy:                  Host can use exposed port:                 │
│  HTTP_PROXY=http://warp:1080                    curl -x socks5://localhost:1080            │
│  ALL_PROXY=socks5://warp:1080                                                              │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| warp | caomingjun/warp:latest | 1080 | WARP proxy (SOCKS5/HTTP) |

## Prerequisites

- Dokploy installed and running
- Docker with `NET_ADMIN` capability support
- (Optional) WARP+ license key for premium features

## Configuration Variables

### Basic Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `WARP_SLEEP` | `2` | Delay (seconds) before WARP starts |
| `WARP_PORT` | `1080` | Host port for proxy access |
| `GOST_ARGS` | `-L :1080` | GOST proxy arguments |

### Premium Features

| Variable | Default | Description |
|----------|---------|-------------|
| `WARP_LICENSE_KEY` | - | WARP+ license for premium features |

### Advanced Options

| Variable | Default | Description |
|----------|---------|-------------|
| `BETA_FIX_HOST_CONNECTIVITY` | `true` | Auto-fix connectivity issues |
| `REGISTER_WHEN_MDM_EXISTS` | `false` | Force consumer registration with MDM |

## Deployment

### 1. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure variables as needed (defaults work for most cases)
4. Deploy the stack

### 2. Verify WARP Connection

```bash
# Test via container
docker compose exec warp curl -x socks5://127.0.0.1:1080 https://cloudflare.com/cdn-cgi/trace

# Test via host
curl -x socks5://localhost:1080 https://cloudflare.com/cdn-cgi/trace
```

Expected output should contain `warp=on` or `warp=plus`.

### 3. First Run Registration

On first start, WARP automatically:
1. Creates a new account
2. Registers with Cloudflare
3. Saves configuration to the volume

Subsequent starts use the saved registration.

## Using from Other Containers

### Method 1: Environment Variables

```yaml
environment:
  HTTP_PROXY: http://warp:1080
  HTTPS_PROXY: http://warp:1080
  ALL_PROXY: socks5://warp:1080
  NO_PROXY: localhost,127.0.0.1,.local
```

### Method 2: Direct Proxy Configuration

**curl:**
```bash
curl -x socks5://warp:1080 https://example.com
```

**wget:**
```bash
https_proxy=http://warp:1080 wget https://example.com
```

## WARP+ Activation

To use WARP+ premium features:

1. Get your license key from the 1.1.1.1 mobile app or subscription
2. Set `WARP_LICENSE_KEY` environment variable
3. **Important**: Delete the volume to re-register with the new key:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

## warp-docker vs warpod

Both are Cloudflare WARP containers, but differ in approach:

| Feature | warp-docker | warpod |
|---------|-------------|--------|
| Image | caomingjun/warp | ghcr.io/deepwn/warpod |
| Ports | 1080 (single) | 1080, 1081, 1082 (multiple) |
| Protocols | SOCKS5/HTTP on same port | Separate SOCKS5/HTTP/HTTPS |
| Capabilities | NET_ADMIN required | Not required |
| Persistence | Volume for registration | Stateless |
| Zero Trust | Basic support | Full MDM credentials |
| Complexity | Simpler | More configurable |

**Use warp-docker when:**
- You want a simple, just-works solution
- You prefer the official WARP client
- You need persistent registration

**Use warpod when:**
- You need separate protocol ports
- You need full Zero Trust/MDM integration
- You want to avoid privileged containers

## NAT Mode (Advanced)

For routing all container traffic through WARP (L3 mode):

```yaml
environment:
  WARP_ENABLE_NAT: "true"
sysctls:
  - net.ipv4.ip_forward=1
  - net.ipv6.conf.all.forwarding=1
```

This routes Layer 3 traffic, not just proxy traffic.

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| warp | 0.25 | 256MB | ~50MB |

Storage is for persistent WARP registration data.

## Troubleshooting

### WARP Not Connecting

1. Check container logs:
   ```bash
   docker compose logs warp
   ```

2. Verify WARP status:
   ```bash
   docker compose exec warp warp-cli status
   ```

3. Check if registration succeeded:
   ```bash
   docker compose exec warp warp-cli account
   ```

### "warp=off" in Trace

1. WARP may still be connecting (wait 60 seconds)
2. Check for registration errors in logs
3. Try deleting volume and restarting:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

### Connection Refused

1. Ensure container is healthy:
   ```bash
   docker compose ps
   ```

2. Check GOST is listening:
   ```bash
   docker compose exec warp netstat -tlnp | grep 1080
   ```

### Permission Denied

1. Ensure `NET_ADMIN` capability is allowed
2. Check Docker/Podman permissions
3. Verify sysctls are supported on your system

### License Key Not Working

1. Delete volume to force re-registration:
   ```bash
   docker compose down -v
   ```

2. Set license key and restart:
   ```bash
   docker compose up -d
   ```

## Security Considerations

- Container runs with `NET_ADMIN` capability (required for TUN device)
- WARP registration is persisted in volume (contains keys)
- Proxy is unauthenticated by default (protect with network isolation)
- All traffic through WARP is encrypted to Cloudflare edge

## Related Resources

- [warp-docker GitHub](https://github.com/cmj2002/warp-docker)
- [Cloudflare WARP](https://1.1.1.1/)
- [GOST Proxy](https://github.com/ginuerzh/gost)
- [Cloudflare WARP Client](https://developers.cloudflare.com/warp-client/)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
