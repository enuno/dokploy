# Beszel - Lightweight Server Monitoring Hub

Beszel is a lightweight server monitoring platform with a hub-agent architecture. The hub provides a beautiful web dashboard for viewing and managing metrics from connected systems, while agents run on each monitored server to collect and transmit data.

## Features

- **Lightweight**: Minimal resource usage (~256MB memory)
- **Multi-Server**: Monitor multiple servers from a single dashboard
- **Docker Monitoring**: Track container stats with GPU support
- **Disk Health**: S.M.A.R.T. monitoring with failure alerts
- **Alerts**: Configurable thresholds with quiet hours
- **Multi-User**: Share systems between users with permissions
- **OAuth/OIDC**: Support for external authentication
- **Automatic Backups**: Built-in backup to disk or S3

## Architecture

```
                                    ┌─────────────────────────────────────┐
                                    │         beszel-net (internal)       │
                                    │                                     │
                                    │  ┌───────────────────────────────┐  │
                                    │  │         beszel (hub)          │  │
                                    │  │           :8090               │  │
                                    │  │                               │  │
                                    │  │  ┌─────────────────────────┐  │  │
                                    │  │  │      PocketBase         │  │  │
                                    │  │  │   (embedded SQLite)     │  │  │
                                    │  │  └─────────────────────────┘  │  │
                                    │  │                               │  │
                                    │  │  ┌─────────────────────────┐  │  │
                                    │  │  │    Web Dashboard        │  │  │
                                    │  │  │  - System overview      │  │  │
                                    │  │  │  - Metrics & charts     │  │  │
                                    │  │  │  - Alerts config        │  │  │
                                    │  │  └─────────────────────────┘  │  │
                                    │  └───────────────────────────────┘  │
                                    │                 │                    │
                                    └─────────────────┼────────────────────┘
                                                      │
                                        dokploy-network
                                                      │
                                              ┌───────┴───────┐
                                              │    traefik    │
                                              └───────────────┘
                                                      │
                                                      ▼
                                      https://monitor.example.com
                                                      │
        ┌─────────────────────────────────────────────┼─────────────────────────────────────────────┐
        │                                             │                                             │
        ▼                                             ▼                                             ▼
┌───────────────┐                           ┌───────────────┐                           ┌───────────────┐
│  Server 1     │                           │  Server 2     │                           │  Server N     │
│  (agent)      │                           │  (agent)      │                           │  (agent)      │
│   :45876      │                           │   :45876      │                           │   :45876      │
└───────────────┘                           └───────────────┘                           └───────────────┘
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| Beszel Hub | henrygd/beszel:0.17.0 | 8090 | Web dashboard & API |

**Note**: Agents are installed separately on each monitored server.

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- Servers to monitor (agents installed separately)

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BESZEL_DOMAIN` | Domain for the hub | `monitor.example.com` |

### First Admin User

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_EMAIL` | - | Admin email (or create via UI) |
| `ADMIN_PASSWORD` | - | Admin password |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `DISABLE_PASSWORD_AUTH` | `false` | Use OAuth/OIDC only |
| `MFA_OTP` | `false` | Enable 2FA/OTP |
| `USER_CREATION` | `false` | Auto-create OAuth users |

### Multi-User Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `SHARE_ALL_SYSTEMS` | `false` | All users see all systems |
| `CONTAINER_DETAILS` | `true` | Allow viewing container info |

## Deployment

### 1. DNS Configuration

Create a DNS record:
```
monitor.example.com → Your Dokploy Server IP
```

### 2. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure `BESZEL_DOMAIN`
4. Deploy the stack

### 3. Create Admin Account

After deployment:
1. Visit `https://monitor.example.com/_/`
2. Create your admin account
3. Configure settings as needed

### 4. Install Agents on Servers

For each server you want to monitor:

**Using Docker:**
```bash
docker run -d \
  --name beszel-agent \
  --restart unless-stopped \
  --network host \
  --volume /var/run/docker.sock:/var/run/docker.sock:ro \
  -e KEY="<your-public-key>" \
  -e LISTEN=45876 \
  henrygd/beszel-agent:latest
```

**Using Install Script:**
```bash
curl -sL https://get.beszel.dev -o /tmp/install-agent.sh
chmod +x /tmp/install-agent.sh
/tmp/install-agent.sh
```

### 5. Add Systems to Hub

1. In the hub web UI, click "Add System"
2. Enter the server's hostname/IP
3. Copy the generated KEY to the agent
4. The system will appear in your dashboard

## Agent Configuration

When installing agents, these environment variables are useful:

| Variable | Default | Description |
|----------|---------|-------------|
| `KEY` | - | Public key from hub (required) |
| `LISTEN` | `45876` | Port or socket path |
| `DOCKER_HOST` | auto | Custom Docker socket path |
| `FILESYSTEM` | auto | Root filesystem device |
| `EXTRA_FILESYSTEMS` | - | Additional disks to monitor |
| `EXCLUDE_CONTAINERS` | - | Container patterns to ignore |
| `SKIP_GPU` | `false` | Disable GPU monitoring |

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| Beszel Hub | 0.1 | 256MB | 1GB+ |

Storage grows with monitored systems and retention period.

## Troubleshooting

### Cannot Access Dashboard

1. Check container is running:
   ```bash
   docker compose ps
   ```

2. Verify health check:
   ```bash
   curl -f http://localhost:8090/api/health
   ```

3. Check logs:
   ```bash
   docker compose logs beszel
   ```

### Agent Not Connecting

1. Verify agent is running on the server
2. Check firewall allows port 45876
3. Verify KEY matches between hub and agent
4. Check agent logs for connection errors

### Missing Docker Stats

1. Ensure Docker socket is mounted in agent
2. Verify agent has read access to socket
3. Check DOCKER_HOST if using non-standard location

### High Memory Usage

1. Reduce retention period in settings
2. Decrease number of monitored systems
3. Limit metrics collection frequency

## Backup & Restore

### Backup Data

```bash
docker compose stop beszel
docker run --rm -v beszel_beszel-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/beszel-backup.tar.gz -C /data .
docker compose start beszel
```

### Restore Data

```bash
docker compose stop beszel
docker run --rm -v beszel_beszel-data:/data -v $(pwd):/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/beszel-backup.tar.gz -C /data"
docker compose start beszel
```

## S3 Backup (Built-in)

Beszel supports automatic backups to S3-compatible storage:

1. Go to Settings → Backups in the web UI
2. Configure S3 credentials (works with Cloudflare R2)
3. Set backup schedule

## OAuth/OIDC Setup

To enable external authentication:

1. Configure your OAuth provider (Google, GitHub, etc.)
2. In Beszel settings, add OAuth provider
3. Optionally set `DISABLE_PASSWORD_AUTH=true`
4. Set `USER_CREATION=true` for auto-provisioning

## Related Resources

- [Beszel GitHub](https://github.com/henrygd/beszel)
- [Beszel Documentation](https://beszel.dev)
- [PocketBase Documentation](https://pocketbase.io/docs/)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
