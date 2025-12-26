# Kestra - Event-Driven Orchestration Platform

![Kestra Logo](https://kestra.io/logo.svg)

Kestra is an open-source, event-driven orchestration platform that makes both scheduled and event-driven workflows easy. Built for Infrastructure as Code principles, Kestra enables you to build reliable workflows directly from the UI in just a few lines of YAML.

## Features

- **Declarative YAML Workflows**: Define complex workflows with simple, version-controlled YAML
- **Event-Driven & Scheduled**: Automate both scheduled and real-time event-driven workflows
- **400+ Plugin Integrations**: Connect to databases, cloud storage, APIs, and multiple programming languages
- **Visual Workflow Editor**: Drag-and-drop interface with syntax highlighting and auto-completion
- **Scalable Architecture**: Handle millions of workflows with high availability and fault tolerance
- **Docker Task Execution**: Run containerized tasks with full Docker support
- **Built-in Monitoring**: Track workflow executions with detailed logs and metrics
- **Git Integration**: Manage workflows as code with version control

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet (HTTPS)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Traefik (Dokploy)  │
              │  Let's Encrypt SSL   │
              └──────────┬───────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │         Kestra                 │
         │   (Workflow Orchestration)     │
         │                                │
         │  • Web UI: Port 8080           │
         │  • Metrics: Port 8081          │
         │  • Docker Socket Access        │
         │  • Workflow Storage: /app/storage │
         └───────────┬───────────────────┘
                     │
                     │ Internal Network (kestra-net)
                     │
                     ▼
         ┌───────────────────────────────┐
         │      PostgreSQL 16             │
         │   (Metadata & Queue Backend)   │
         │                                │
         │  • Port: 5432 (internal only)  │
         │  • Data: /var/lib/postgresql   │
         └────────────────────────────────┘
```

### Components

| Component | Purpose | Exposed |
|-----------|---------|---------|
| **Kestra** | Workflow orchestration server | Yes (HTTPS via Traefik) |
| **PostgreSQL** | Database backend for workflows, executions, metadata | No (internal only) |
| **Traefik** | Reverse proxy with automatic HTTPS | Managed by Dokploy |

### Networks

- **kestra-net**: Internal bridge network for Kestra ↔ PostgreSQL communication
- **dokploy-network**: External network for Traefik routing (HTTPS access)

## Resource Requirements

### Minimum (Light Usage)
- **CPU**: 2 cores
- **RAM**: 3 GB total
  - Kestra: 2 GB
  - PostgreSQL: 512 MB
- **Storage**: 10 GB
  - Workflows, executions, logs: ~5-10 GB
  - PostgreSQL data: ~2-5 GB

### Recommended (Production)
- **CPU**: 4+ cores
- **RAM**: 4-8 GB total
- **Storage**: 20-50 GB (scales with workflow volume)

### Disk I/O
- Moderate: PostgreSQL for metadata storage
- Low-Moderate: Workflow logs and execution data

## Configuration Variables

### Required Variables

| Variable | Description | Example | Generated |
|----------|-------------|---------|-----------|
| `domain` | Public domain for Kestra UI | `kestra.example.com` | User provides |
| `postgres_password` | PostgreSQL database password | `aB3kL9mN...` | Auto (32 chars) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `postgres_db` | `kestra` | PostgreSQL database name |
| `postgres_user` | `kestra` | PostgreSQL username |
| `kestra_basic_auth_enabled` | `false` | Enable basic authentication for UI |
| `kestra_admin_user` | (empty) | Admin username (if basic auth enabled) |
| `kestra_admin_password` | (empty) | Admin password (if basic auth enabled) |

### Security Recommendation

**Enable basic authentication** to restrict access to the Kestra UI:

```toml
# In template.toml, set:
kestra_basic_auth_enabled = "true"
kestra_admin_user = "${username}"
kestra_admin_password = "${password:16}"
```

## Post-Deployment Steps

### 1. Access Kestra UI

Navigate to your configured domain (e.g., `https://kestra.example.com`). You should see the Kestra welcome screen.

### 2. Create Your First Workflow

Click **"Create Flow"** and paste this example:

```yaml
id: hello-world
namespace: dev

tasks:
  - id: hello
    type: io.kestra.plugin.core.log.Log
    message: Hello, Kestra!
```

Click **Save** and then **Execute** to run your first workflow.

### 3. Explore Plugins

Visit **Plugins** in the sidebar to browse 400+ available integrations:
- **Databases**: PostgreSQL, MySQL, MongoDB, ClickHouse
- **Cloud**: AWS, GCP, Azure, Cloudflare
- **Data Processing**: dbt, Apache Spark, Pandas
- **Messaging**: Kafka, RabbitMQ, MQTT
- **And many more...**

### 4. Enable Notifications (Optional)

Configure workflow notifications by setting up webhook or email triggers in your flows.

### 5. Docker Socket Access

Kestra has access to the Docker socket to execute containerized tasks. This is **required** for workflows that use Docker plugins.

**Security Consideration**: Only grant Kestra access to trusted users, as Docker socket access provides elevated privileges.

## Common Workflows

### Scheduled Data Pipeline
```yaml
id: daily-etl
namespace: production

triggers:
  - id: schedule
    type: io.kestra.plugin.core.trigger.Schedule
    cron: "0 2 * * *"  # Daily at 2 AM

tasks:
  - id: extract
    type: io.kestra.plugin.jdbc.postgresql.Query
    url: jdbc:postgresql://source-db:5432/db
    sql: SELECT * FROM events WHERE created_at > NOW() - INTERVAL '1 day'

  - id: transform
    type: io.kestra.plugin.scripts.python.Script
    script: |
      import pandas as pd
      # Transform data...

  - id: load
    type: io.kestra.plugin.jdbc.postgresql.Query
    url: jdbc:postgresql://target-db:5432/warehouse
    sql: INSERT INTO events_daily (...)
```

### Event-Driven Workflow
```yaml
id: webhook-processor
namespace: production

tasks:
  - id: process
    type: io.kestra.plugin.core.log.Log
    message: "Received event: {{ trigger.body }}"

triggers:
  - id: webhook
    type: io.kestra.plugin.core.trigger.Webhook
    key: my-secret-key
```

Trigger via:
```bash
curl -X POST https://kestra.example.com/api/v1/executions/webhook/production/webhook-processor/my-secret-key \
  -H "Content-Type: application/json" \
  -d '{"data": "value"}'
```

## Troubleshooting

### Kestra UI Not Accessible

**Symptoms**: Cannot access `https://kestra.example.com`

**Checks**:
1. Verify Traefik is routing correctly:
   ```bash
   docker logs <traefik-container>
   ```
2. Check Kestra container logs:
   ```bash
   docker compose logs kestra
   ```
3. Verify domain DNS is pointing to your Dokploy server
4. Ensure port 443 is open on your firewall

### Database Connection Errors

**Symptoms**: Kestra logs show "Connection refused" or "Connection timeout"

**Solution**:
1. Check PostgreSQL is healthy:
   ```bash
   docker compose ps postgres
   ```
2. Verify PostgreSQL logs:
   ```bash
   docker compose logs postgres
   ```
3. Ensure kestra-net network exists:
   ```bash
   docker network ls | grep kestra
   ```

### Workflows Fail with "Docker not available"

**Symptoms**: Tasks using Docker plugins fail

**Checks**:
1. Verify Docker socket is mounted:
   ```bash
   docker inspect <kestra-container> | grep docker.sock
   ```
2. Check Docker daemon is running:
   ```bash
   systemctl status docker
   ```
3. Verify socket permissions:
   ```bash
   ls -la /var/run/docker.sock
   ```

### High Memory Usage

**Symptoms**: Kestra container consuming excessive memory

**Solutions**:
1. Reduce memory limit in docker-compose.yml (currently 2GB)
2. Optimize workflow configurations (reduce concurrent executions)
3. Enable execution data pruning (already configured: max 336 hours)

### Execution History Growing Too Large

**Symptoms**: Database size increasing rapidly

**Solution**: Kestra automatically prunes execution data older than 336 hours (14 days). To adjust:

Edit `docker-compose.yml` and add to Kestra environment:
```yaml
KESTRA_CONFIGURATION: |
  kestra:
    queue:
      type: postgres
    repository:
      type: postgres
      retention:
        execution: P14D  # Change to desired period (ISO 8601 duration)
```

## Backup and Restore

### Backup PostgreSQL Database

```bash
docker compose exec postgres pg_dump -U kestra kestra > kestra-backup-$(date +%Y%m%d).sql
```

### Backup Workflow Data

```bash
docker compose cp kestra:/app/storage ./kestra-storage-backup-$(date +%Y%m%d)
```

### Restore Database

```bash
docker compose exec -T postgres psql -U kestra kestra < kestra-backup-YYYYMMDD.sql
```

### Restore Workflow Data

```bash
docker compose cp ./kestra-storage-backup-YYYYMMDD kestra:/app/storage
docker compose restart kestra
```

## Upgrading

### Minor Version Upgrades (e.g., v0.19.14 → v0.19.15)

1. Update image version in docker-compose.yml
2. Redeploy via Dokploy UI
3. Verify health after upgrade

### Major Version Upgrades (e.g., v0.19.x → v1.0.x)

1. **Backup database and storage** (see above)
2. Review [Kestra release notes](https://github.com/kestra-io/kestra/releases)
3. Update image version
4. Redeploy and monitor logs
5. Test critical workflows

## Security Considerations

### Docker Socket Access

Kestra requires Docker socket access to execute containerized tasks. This grants significant privileges:

**Risks**:
- Container can start/stop other containers
- Potential host access if misconfigured

**Mitigations**:
1. ✅ Enable basic authentication (recommended)
2. ✅ Use HTTPS with Let's Encrypt
3. ✅ Restrict network access to trusted users
4. ✅ Security headers middleware enabled
5. Monitor workflow executions regularly

### Database Security

- ✅ PostgreSQL isolated on internal network only
- ✅ Auto-generated 32-character password
- ✅ No external database port exposure

### HTTPS & Headers

The template includes:
- ✅ Automatic HTTPS via Let's Encrypt
- ✅ HTTP Strict Transport Security (HSTS)
- ✅ Content-Type sniffing protection
- ✅ Clickjacking protection (frame-deny)
- ✅ XSS filter enabled
- ✅ Referrer policy configured

## Resources

- **Official Website**: https://kestra.io
- **Documentation**: https://kestra.io/docs
- **GitHub**: https://github.com/kestra-io/kestra
- **Plugins**: https://kestra.io/plugins
- **Community**: https://kestra.io/slack
- **Release Notes**: https://github.com/kestra-io/kestra/releases

## License

Kestra is open-source software licensed under the Apache License 2.0.

## Support

- **Community Slack**: [Join here](https://kestra.io/slack)
- **GitHub Issues**: https://github.com/kestra-io/kestra/issues
- **Documentation**: https://kestra.io/docs

---

**Template Version**: 1.0.0
**Last Updated**: December 2025
**Kestra Version**: v0.19.14
