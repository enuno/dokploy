# MCP Context Forge

Model Context Protocol (MCP) Gateway & Registry for AI agent infrastructure - enterprise-grade federation, authentication, and observability for LLM applications.

## Overview

[MCP Context Forge](https://github.com/IBM/mcp-context-forge) is an IBM open-source gateway, registry, and proxy that sits in front of any Model Context Protocol (MCP) server, A2A server, or REST API - exposing a unified endpoint for all your AI clients.

## Architecture

```
┌─────────────────┐     ┌─────────────┐     ┌─────────────┐
│  MCP Gateway    │────▶│  MariaDB    │     │    Redis    │
│  (Admin UI)     │     │ (metadata)  │◀────│   (cache)   │
│  Port 4444      │     │             │     │             │
└──────────────

───┘     └─────────────┘     └─────────────┘
       │                       │                   │
       └───────────────────────┴───────────────────┘
                               │
                      mcpgateway-net (internal)
                               │
       ┌───────────────────────┘
       ▼
  dokploy-network (external, Traefik routing)
```

**Service Architecture:**
- **mcpgateway**: MCP Gateway with Admin UI (Python application)
- **mariadb**: Metadata storage for tools, resources, prompts, and user accounts
- **redis**: Cache and session storage for federation

## Features

### Core Capabilities
- ⚡ **Unified MCP Endpoint**: Single gateway for all Model Context Protocol servers
- 🔄 **Protocol Conversion**: REST API → MCP, stdio, SSE, WebSocket support
- 🔐 **Enterprise Authentication**: Email-based auth, multi-provider SSO (GitHub, Google, IBM)
- 👥 **Multi-Tenant Teams**: Three-tier visibility (Private/Team/Public resources)
- 📊 **OpenTelemetry Observability**: Vendor-agnostic tracing (Phoenix, Jaeger, DataDog, etc.)
- 🌐 **Federation**: Multi-cluster deployments with Redis-backed session sharing
- 🛠️ **Admin UI**: Web-based management interface for tools, resources, and teams
- 📦 **MCP Registry**: Central repository for AI tools, prompts, and resources

### Transport Protocols
- HTTP/JSON-RPC
- Server-Sent Events (SSE) with keepalive
- WebSocket
- stdio (for CLI integration)
- Streamable HTTP

### Database Support
- MariaDB 10.6+ (recommended for production)
- PostgreSQL (supported)
- MySQL 8.0+ (supported)
- SQLite (development only)

## Prerequisites

- Dokploy instance running
- Domain name configured in DNS
- Minimum 4GB RAM (Gateway can be memory-intensive)
- Understanding of Model Context Protocol (MCP)

## Quick Start

### 1. Deploy Template

1. Navigate to Dokploy dashboard
2. Go to **Templates** → **Import Template**
3. Select **MCP Context Forge** template
4. Configure required variables:
   - `MCPGATEWAY_DOMAIN`: Your domain (e.g., `mcp.yourdomain.com`)
   - Database passwords will be auto-generated
   - Admin credentials will be auto-generated

### 2. Initial Setup

**Access Admin UI:**
```
https://mcp.yourdomain.com
```

**Default Admin Login:**
- Email: Your configured `PLATFORM_ADMIN_EMAIL`
- Password: Your configured `PLATFORM_ADMIN_PASSWORD`

**⚠️ IMPORTANT:** Change admin password immediately after first login!

### 3. Register MCP Servers

Once logged in:

1. **Navigate to MCP Servers** section
2. **Add New Server**:
   - Name: `my-server`
   - Type: `stdio`, `sse`, or `http`
   - Command/URL: Server connection details

3. **Configure Tools/Resources**:
   - Add tools provided by the MCP server
   - Set visibility (Private/Team/Public)

### 4. Connect AI Clients

Configure your AI client (Claude Desktop, custom apps) to connect to:
```
https://mcp.yourdomain.com
```

Authentication via Admin UI credentials or API tokens.

## Configuration Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCPGATEWAY_DOMAIN` | *required* | Domain for accessing MCP Gateway |
| `MYSQL_DATABASE` | `mcpgateway` | MariaDB database name |
| `MYSQL_USER` | `mcpgateway` | MariaDB username |
| `MYSQL_PASSWORD` | *auto-generated* | MariaDB password (32 chars) |
| `MYSQL_ROOT_PASSWORD` | *auto-generated* | MariaDB root password (32 chars) |
| `JWT_SECRET_KEY` | *auto-generated* | JWT token secret (64-char base64) |
| `BASIC_AUTH_PASSWORD` | *auto-generated* | Basic auth password (24 chars) |
| `PLATFORM_ADMIN_EMAIL` | *required* | Admin account email |
| `PLATFORM_ADMIN_PASSWORD` | *auto-generated* | Admin password (16 chars) |
| `LOG_LEVEL` | `info` | Logging verbosity (`debug`, `info`, `warning`, `error`) |

### Database Pool Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_POOL_SIZE` | `200` | Maximum database connections |
| `DB_MAX_OVERFLOW` | `10` | Connections beyond pool size |
| `DB_POOL_TIMEOUT` | `30` | Connection timeout (seconds) |
| `DB_POOL_RECYCLE` | `3600` | Connection recycle time (seconds) |

### Federation Settings (Multi-Cluster)

| Variable | Default | Description |
|----------|---------|-------------|
| `FEDERATION_ENABLED` | `false` | Enable multi-cluster federation |

**Note**: When enabling federation:
- Redis becomes required for session sharing
- Multiple gateway instances can share state
- Useful for high-availability deployments

## Post-Deployment

### 1. Verify Services

Check all services are healthy:
```bash
# In Dokploy dashboard
- mcpgateway: Healthy (green)
- mariadb: Healthy (green)
- redis: Healthy (green)
```

### 2. Configure Firewall

**Required Port Openings:**
- **443 (TCP)**: HTTPS (Traefik handles SSL termination)

**Internal Ports (No External Access Needed):**
- 4444: MCP Gateway (internal, routed via Traefik)
- 3306: MariaDB (internal network only)
- 6379: Redis (internal network only)

### 3. Test Admin UI

1. Navigate to `https://mcp.yourdomain.com`
2. Log in with admin credentials
3. Verify UI loads correctly

### 4. Create First MCP Server Registration

**Example: Register a Weather MCP Server**

1. **Admin UI** → **MCP Servers** → **Add Server**
2. Configure:
   ```json
   {
     "name": "weather-server",
     "type": "http",
     "url": "https://weather-mcp.example.com",
     "description": "Weather data provider"
   }
   ```

3. **Add Tools** from the server:
   - `get_current_weather`
   - `get_forecast`

4. **Set Visibility**: Team or Public

## MCP Client Integration

### Claude Desktop Configuration

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "context-forge": {
      "url": "https://mcp.yourdomain.com",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN"
      }
    }
  }
}
```

### Python Client Example

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async with stdio_client(
    StdioServerParameters(
        url="https://mcp.yourdomain.com"
    )
) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()

        # List available tools
        tools = await session.list_tools()
        print(tools)

        # Call a tool
        result = await session.call_tool("get_current_weather", {
            "location": "San Francisco"
        })
        print(result)
```

## Advanced Configuration

### Multi-Cluster Federation

For high-availability deployments across multiple clusters:

1. **Enable Federation**:
   ```yaml
   FEDERATION_ENABLED: "true"
   ```

2. **Shared Redis** (all clusters must connect to same Redis):
   ```yaml
   REDIS_URL: redis://shared-redis.example.com:6379/0
   ```

3. **Deploy Multiple Gateway Instances**:
   - Each cluster runs separate gateway
   - All share database and Redis
   - Session state synchronized via Redis

### Custom SSL Certificates

For custom SSL (instead of Let's Encrypt):

1. Update Traefik labels in `docker-compose.yml`:
   ```yaml
   labels:
     - "traefik.http.routers.mcpgateway.tls.certresolver=custom"
   ```

2. Configure custom certificate in Traefik

### Database Migration from SQLite

If migrating from SQLite development setup:

1. **Export Data**:
   ```bash
   docker exec mcpgateway python -m mcp_gateway.cli export --output backup.json
   ```

2. **Switch to MariaDB** (redeploy template)

3. **Import Data**:
   ```bash
   docker exec mcpgateway python -m mcp_gateway.cli import --input backup.json
   ```

## Cloudflare Integration

### Cloudflare Zero Trust Access (Recommended)

Protect the Admin UI with Cloudflare Access:

**1. Create Cloudflare Access Application:**
- Go to Cloudflare Dashboard → Zero Trust → Access → Applications
- Click **Add an Application** → **Self-hosted**
- Application name: `MCP Context Forge Admin`
- Session duration: `24 hours`
- Application domain: `mcp.yourdomain.com`

**2. Configure Access Policy:**
```
Policy name: Admin Access
Action: Allow
Include: Emails ending in @yourdomain.com
```

**3. Update DNS:**
- Ensure `mcp.yourdomain.com` is proxied through Cloudflare (orange cloud)

**4. Test Access:**
- Navigate to `https://mcp.yourdomain.com`
- Should see Cloudflare Access login page
- After authentication, redirects to MCP Gateway

### Cloudflare DNS Challenge (Optional)

For wildcard certificates (if using subdomains per team):

See Traefik documentation for Cloudflare DNS-01 challenge configuration.

## Troubleshooting

### Issue 1: Gateway Not Starting

**Symptoms**: mcpgateway container restarts repeatedly

**Solutions**:
```bash
# Check logs
docker logs mcpgateway --tail 100

# Common causes:
# 1. Database not ready - wait for mariadb health check
# 2. Invalid JWT secret - verify JWT_SECRET_KEY is set
# 3. Missing environment variables - check Dokploy configuration
```

### Issue 2: Cannot Connect to Database

**Symptoms**: Database connection errors in logs

**Solutions**:
```bash
# Verify MariaDB is healthy
docker exec mariadb mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD}

# Check network connectivity
docker exec mcpgateway ping mariadb

# Verify credentials match
# Check MYSQL_PASSWORD in mcpgateway matches mariadb env
```

### Issue 3: Redis Connection Failed

**Symptoms**: Cache errors, session issues

**Solutions**:
```bash
# Test Redis connectivity
docker exec redis redis-cli ping
# Should return: PONG

# Check from gateway
docker exec mcpgateway ping redis

# Verify REDIS_URL format
# Correct: redis://redis:6379/0
```

### Issue 4: Admin UI Login Fails

**Symptoms**: Invalid credentials error

**Solutions**:
```bash
# Reset admin password via environment variable
# Update PLATFORM_ADMIN_PASSWORD in Dokploy

# Verify admin email matches
# Check PLATFORM_ADMIN_EMAIL configuration

# Check JWT secret is set
# Verify JWT_SECRET_KEY is not empty
```

### Issue 5: MCP Clients Cannot Connect

**Symptoms**: Connection timeout or refused

**Solutions**:
```bash
# Verify Traefik routing
curl -I https://mcp.yourdomain.com
# Should return: HTTP/2 200

# Check Traefik labels
docker inspect mcpgateway | grep traefik

# Verify dokploy-network attachment
docker network inspect dokploy-network
```

### Issue 6: High Memory Usage

**Symptoms**: Gateway using >2GB RAM

**Solutions**:
```bash
# Reduce database pool size
DB_POOL_SIZE: "100"  # Default is 200

# Monitor memory usage
docker stats mcpgateway

# Consider adding resource limits (see docker-compose.yml)
```

### Issue 7: Slow Database Queries

**Symptoms**: Admin UI loading slowly

**Solutions**:
```bash
# Check database pool configuration
# Increase pool size for high concurrency:
DB_POOL_SIZE: "300"
DB_MAX_OVERFLOW: "20"

# Monitor active connections
docker exec mariadb mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SHOW STATUS LIKE 'Threads_connected';"

# Consider adding read replicas for federation
```

## Backup and Recovery

### What to Backup

**Critical Data:**
1. **MariaDB Database** - All MCP server configurations, tools, resources, user accounts
2. **Gateway Data Volume** - Application state and cached data
3. **Environment Variables** - Secrets and configuration (store securely!)

### Backup Procedure

```bash
# 1. Backup MariaDB database
docker exec mariadb mysqldump -u root -p${MYSQL_ROOT_PASSWORD} mcpgateway > mcp-backup-$(date +%Y%m%d).sql

# 2. Backup gateway data volume
docker cp mcpgateway:/app/data ./gateway-data-backup-$(date +%Y%m%d)

# 3. Export environment variables (SECURE THIS FILE!)
docker exec mcpgateway env | grep -E "JWT_SECRET|MYSQL_PASSWORD|ADMIN" > env-backup-$(date +%Y%m%d).txt.gpg
```

### Recovery Procedure

```bash
# 1. Stop services
docker stop mcpgateway mariadb redis

# 2. Restore database
docker exec -i mariadb mysql -u root -p${MYSQL_ROOT_PASSWORD} mcpgateway < mcp-backup-YYYYMMDD.sql

# 3. Restore gateway data
docker cp ./gateway-data-backup-YYYYMMDD/. mcpgateway:/app/data/

# 4. Restore environment variables (in Dokploy UI)
# DO NOT commit secrets to version control!

# 5. Start services
docker start mariadb redis mcpgateway

# 6. Verify recovery
curl -f https://mcp.yourdomain.com
```

### Automated Backup (Recommended)

Set up daily backups using cron:

```bash
# Add to crontab (run as root or docker group user)
0 2 * * * /path/to/backup-mcp-gateway.sh

# backup-mcp-gateway.sh
#!/bin/bash
BACKUP_DIR="/backups/mcp-gateway"
DATE=$(date +%Y%m%d)

# Backup database
docker exec mariadb mysqldump -u root -p${MYSQL_ROOT_PASSWORD} mcpgateway > ${BACKUP_DIR}/db-${DATE}.sql

# Backup gateway data
docker cp mcpgateway:/app/data ${BACKUP_DIR}/data-${DATE}

# Keep last 7 days
find ${BACKUP_DIR} -name "db-*" -mtime +7 -delete
find ${BACKUP_DIR} -name "data-*" -mtime +7 -delete
```

## Performance Tuning

### Hardware Recommendations

| Component | Minimum | Recommended | High-Load |
|-----------|---------|-------------|-----------|
| CPU | 2 cores | 4 cores | 8+ cores |
| RAM | 4GB | 8GB | 16GB+ |
| Disk | 20GB SSD | 50GB SSD | 100GB+ NVMe |
| Network | 10 Mbps | 100 Mbps | 1 Gbps |

### Optimization Tips

1. **Database Tuning**:
   ```yaml
   # Increase pool size for high concurrency
   DB_POOL_SIZE: "300"
   DB_MAX_OVERFLOW: "20"
   ```

2. **Redis Caching**:
   ```yaml
   # Always use Redis for production
   CACHE_TYPE: redis
   ```

3. **Gateway Scaling**:
   - Deploy multiple gateway instances
   - Enable federation
   - Use shared Redis for session state

4. **MariaDB Optimization**:
   ```bash
   # Increase max connections (in mariadb container)
   docker exec mariadb mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SET GLOBAL max_connections=500;"
   ```

## Security Considerations

### Production Security Checklist

- ✅ **Change Default Passwords**: Update admin password after first login
- ✅ **Enable Cloudflare Zero Trust**: Protect admin UI with access policies
- ✅ **Rotate JWT Secrets**: Periodically regenerate JWT_SECRET_KEY
- ✅ **Limit Database Access**: MariaDB internal network only
- ✅ **Monitor Logs**: Review authentication and access logs regularly
- ✅ **Backup Regularly**: Automated daily backups with encryption
- ✅ **Update Images**: Monitor for security updates to ghcr.io/ibm/mcp-context-forge

### Secret Management

**Never commit secrets to version control!**

Store secrets in:
1. Dokploy environment variables (preferred)
2. External secret manager (HashiCorp Vault, AWS Secrets Manager)
3. Encrypted configuration files (GPG encrypted)

### Multi-Tenant Isolation

MCP Context Forge supports three-tier visibility:

1. **Private**: Only creator can access
2. **Team**: Team members can access
3. **Public**: All authenticated users can access

**Recommendation**: Default to **Team** visibility for new resources.

## Resources

### Documentation
- [MCP Context Forge GitHub](https://github.com/IBM/mcp-context-forge)
- [Official Documentation](https://ibm.github.io/mcp-context-forge/)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)

### Community
- [MCP Context Forge Issues](https://github.com/IBM/mcp-context-forge/issues)
- [Anthropic MCP Discord](https://discord.gg/modelcontextprotocol)

### Integrations
- [Claude Desktop MCP](https://www.anthropic.com/news/model-context-protocol)
- [MCP Inspector](https://ibm.github.io/mcp-context-forge/using/clients/mcp-inspector/)
- [A2A (Agent-to-Agent) Integration](https://ibm.github.io/mcp-context-forge/using/agents/a2a/)

### Observability
- [Phoenix OpenTelemetry](https://phoenix.arize.com/)
- [Jaeger Tracing](https://www.jaegertracing.io/)
- [DataDog APM](https://www.datadoghq.com/product/apm/)

## Architecture Decisions

### Why MariaDB over PostgreSQL?

- Recommended by IBM in official documentation
- Better documented performance for MCP Gateway workloads
- Production deployments use MariaDB 10.6+

**Alternative**: PostgreSQL is fully supported - uncomment postgres service in docker-compose.yml if preferred.

### Why Redis for Caching?

- Required for multi-cluster federation
- Session state synchronization across gateway instances
- Better performance than in-memory or database cache for distributed deployments

**Alternative**: For single-instance deployments, can use `CACHE_TYPE=memory` or `database`.

### Why 3-Tier Architecture?

- **Separation of Concerns**: Gateway, database, cache are independently scalable
- **Network Isolation**: Databases/caches internal-only for security
- **High Availability**: Each tier can be scaled or replicated independently

---

**Generated with Claude Code** 🤖
