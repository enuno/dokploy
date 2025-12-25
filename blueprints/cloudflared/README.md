# Cloudflared - Cloudflare Tunnel Client

Cloudflared creates secure outbound tunnels to Cloudflare's network, enabling zero-trust access to your services without exposing ports or requiring a public IP. Traffic is routed through Cloudflare's global network with built-in DDoS protection and access controls.

## Features

- **No Exposed Ports**: Outbound-only connections, no inbound firewall rules needed
- **Zero Trust Access**: Integrate with Cloudflare Access for authentication
- **Global Network**: Traffic routed through Cloudflare's 300+ edge locations
- **DDoS Protection**: Cloudflare's enterprise-grade DDoS mitigation
- **Private Networks**: Access internal services without VPN
- **Multi-Service**: Route multiple hostnames through one tunnel
- **Lightweight**: Minimal resource usage (~128MB memory)

## Architecture

```
                                       CLOUDFLARE NETWORK
                                    ┌─────────────────────────┐
                                    │                         │
    Internet ───────────────────────▶   Cloudflare Edge      │
    Users                           │   (DDoS protection,    │
                                    │    Access policies)    │
                                    │                         │
                                    └───────────┬─────────────┘
                                                │
                                    Encrypted Tunnel (outbound)
                                                │
┌───────────────────────────────────────────────┼───────────────────────────────────────────────┐
│                                               │                                               │
│                        dokploy-network        │                                               │
│                                               │                                               │
│  ┌─────────────────────────────────────┐      │                                               │
│  │           cloudflared               │◀─────┘                                               │
│  │                                     │                                                      │
│  │  Connects outbound to Cloudflare    │                                                      │
│  │  Routes traffic to local services   │                                                      │
│  │                                     │                                                      │
│  └─────────────────────────────────────┘                                                      │
│                    │                                                                          │
│      ┌─────────────┼─────────────┬─────────────────────┐                                      │
│      │             │             │                     │                                      │
│      ▼             ▼             ▼                     ▼                                      │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐          ┌─────────────┐                               │
│ │ Service │  │ Service │  │ Service │          │   Other     │                               │
│ │    A    │  │    B    │  │    C    │    ...   │  Dokploy    │                               │
│ │  :8080  │  │  :3000  │  │  :5000  │          │  Services   │                               │
│ └─────────┘  └─────────┘  └─────────┘          └─────────────┘                               │
│                                                                                               │
└───────────────────────────────────────────────────────────────────────────────────────────────┘

Traffic Flow:
1. User requests https://app.example.com
2. Cloudflare Edge receives request, applies Access policies
3. Request sent through encrypted tunnel to cloudflared
4. cloudflared forwards to http://service-a:8080
5. Response returns through same path
```

## Components

| Service | Image | Purpose |
|---------|-------|---------|
| cloudflared | cloudflare/cloudflared:2025.11.1 | Tunnel client |

**Note**: No exposed ports. All connections are outbound to Cloudflare.

## Prerequisites

- Dokploy installed and running
- Cloudflare account with a domain
- Domain DNS managed by Cloudflare
- Zero Trust dashboard access (free tier available)

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TUNNEL_TOKEN` | Token from Cloudflare tunnel setup | `eyJhIjoiMTIzNDU2...` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TZ` | `UTC` | Timezone for logging |

## Deployment

### 1. Create Tunnel in Cloudflare

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Networks** → **Tunnels**
3. Click **Create a tunnel**
4. Select **Cloudflared** as connector
5. Name your tunnel (e.g., `dokploy-tunnel`)
6. Click **Save tunnel**
7. Copy the tunnel token (starts with `ey...`)

### 2. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Set `TUNNEL_TOKEN` to your copied token
4. Deploy the stack

### 3. Configure Public Hostnames

After the tunnel is running:

1. In Cloudflare Zero Trust, go to your tunnel
2. Click **Public Hostname** tab
3. Add hostname mappings:

| Public Hostname | Service | URL |
|-----------------|---------|-----|
| `app.example.com` | HTTP | `http://myapp:8080` |
| `grafana.example.com` | HTTP | `http://grafana:3000` |
| `api.example.com` | HTTP | `http://api-server:3000` |

**Important**: Use the Docker container name, not `localhost`. Services must be on `dokploy-network`.

### 4. Configure Access Policies (Optional)

For protected services:

1. Go to **Access** → **Applications**
2. Create application for each protected hostname
3. Configure authentication (SSO, email, etc.)
4. Apply policies (allow specific users/groups)

## Routing to Dokploy Services

Cloudflared can route to any service on the same Docker network.

### Example: Route to Vaultwarden

1. Deploy Vaultwarden template (ensure it's on `dokploy-network`)
2. In Cloudflare tunnel, add public hostname:
   - **Subdomain**: `vault`
   - **Domain**: `example.com`
   - **Type**: HTTP
   - **URL**: `http://vaultwarden:80`

### Example: Route to Grafana

1. Deploy Grafana (ensure it's on `dokploy-network`)
2. In Cloudflare tunnel, add public hostname:
   - **Subdomain**: `grafana`
   - **Domain**: `example.com`
   - **Type**: HTTP
   - **URL**: `http://grafana:3000`

### Finding Container Names

To find the correct container name:
```bash
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

Or in Dokploy, check the compose service name.

## Cloudflared vs Traefik

This template provides an **alternative** to Traefik for ingress:

| Feature | Cloudflared | Traefik |
|---------|-------------|---------|
| Port exposure | None (outbound tunnel) | Ports 80/443 |
| SSL certificates | Cloudflare-managed | LetsEncrypt |
| DDoS protection | Built-in | Requires upstream |
| Access control | Zero Trust policies | Basic auth/middleware |
| Configuration | Cloudflare dashboard | Docker labels |
| Public IP required | No | Yes |

**Use Cloudflared when:**
- You don't have a public IP or want to hide your server IP
- You want Cloudflare's DDoS protection
- You need Zero Trust access controls
- You prefer dashboard-based routing configuration

**Use Traefik when:**
- You have a public IP and want direct connections
- You want all configuration in code (labels)
- You're already using Traefik for other services
- You need advanced routing features (path-based, etc.)

## Multiple Tunnels

You can run multiple tunnel instances for different purposes:

1. **Production tunnel**: Routes production services
2. **Dev tunnel**: Routes development/staging services
3. **Admin tunnel**: Routes admin services with stricter access

Each tunnel needs its own token and can have different access policies.

## Private Network Access

Cloudflared can also provide private network access (like a VPN):

1. In tunnel settings, enable **Private Network**
2. Add IP/CIDR ranges to route
3. Install WARP client on user devices
4. Users can access internal IPs through the tunnel

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| cloudflared | 0.1 | 128MB | Minimal |

Extremely lightweight - suitable for edge devices and constrained environments.

## Troubleshooting

### Tunnel Not Connecting

1. Verify token is correct:
   ```bash
   docker compose logs cloudflared
   ```

2. Check for connection errors:
   ```bash
   docker compose exec cloudflared cloudflared tunnel info
   ```

3. Ensure outbound HTTPS (443) is not blocked

### Service Not Reachable

1. Verify service is on `dokploy-network`:
   ```bash
   docker network inspect dokploy-network
   ```

2. Check service name matches URL in Cloudflare dashboard

3. Verify service is running and healthy:
   ```bash
   docker compose ps
   ```

4. Test internal connectivity:
   ```bash
   docker compose exec cloudflared wget -q -O- http://service:port/
   ```

### 502 Bad Gateway

1. Service might not be ready yet - check health status
2. Wrong port in Cloudflare dashboard URL
3. Service might be using HTTPS internally (use `https://` in URL)

### Access Denied

1. Check Cloudflare Access policies
2. Verify user is in allowed group
3. Check browser for Access cookies/authentication

## Health Monitoring

The container includes a health check that verifies tunnel connectivity:

```yaml
healthcheck:
  test: ["CMD", "cloudflared", "tunnel", "info"]
  interval: 30s
  timeout: 10s
  retries: 3
```

Monitor tunnel status in Cloudflare Zero Trust dashboard under **Networks** → **Tunnels**.

## Security Considerations

- **Token Security**: Never commit `TUNNEL_TOKEN` to version control
- **Access Policies**: Use Cloudflare Access for sensitive services
- **Network Isolation**: Services should only be on necessary networks
- **Audit Logs**: Cloudflare provides detailed access logs
- **Origin Protection**: Your server IP is never exposed

## Related Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Cloudflare Zero Trust](https://developers.cloudflare.com/cloudflare-one/)
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [cloudflared GitHub](https://github.com/cloudflare/cloudflared)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024

Sources:
- [GitHub - cloudflared docker compose examples](https://github.com/jonas-merkle/container-cloudflare-tunnel)
- [Cloudflare Tunnel Docker Guide](https://neonode.cc/en/blog/cloudflared-tunnel-guide/)
- [Cloudflare Community - Docker Compose](https://community.cloudflare.com/t/can-i-use-cloudflared-in-a-docker-compose-yml/407168)
