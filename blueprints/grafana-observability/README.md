# Grafana Observability Stack

A complete observability platform for home lab infrastructure, featuring Prometheus for metrics collection, Mimir for long-term storage, InfluxDB for high-throughput time series data, Grafana for visualization, and Promtail for log shipping.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         observability-net (internal)                     │
│                                                                          │
│  ┌──────────────┐    scrape     ┌─────────────┐                         │
│  │ node-exporter│◄──────────────│  prometheus │                         │
│  │   :9100      │               │    :9090    │                         │
│  └──────────────┘               └──────┬──────┘                         │
│                                        │                                 │
│                          remote_write  │                                 │
│                    ┌───────────────────┼───────────────────┐            │
│                    ▼                   ▼                   │            │
│            ┌──────────────┐    ┌──────────────┐            │            │
│            │    mimir     │    │   influxdb   │            │            │
│            │ :9009 (TSDB) │    │ :8086 (TSDB) │            │            │
│            └──────┬───────┘    └──────┬───────┘            │            │
│                   │                   │                     │            │
│                   └─────────┬─────────┘                     │            │
│                             ▼                               │            │
│                     ┌──────────────┐                        │            │
│                     │   grafana    │◄───────────────────────┘            │
│                     │    :3000     │                                     │
│                     └──────────────┘                                     │
│                             ▲                                            │
│  ┌──────────────┐           │                                            │
│  │   promtail   │───────────┘  (logs via Grafana Cloud)                 │
│  │    :9080     │                                                        │
│  └──────────────┘                                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ dokploy-network
                              ▼
                      ┌──────────────┐
                      │   traefik    │──► https://grafana.example.com
                      └──────────────┘
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| Grafana | grafana/grafana:11.4.0 | 3000 | Visualization dashboard |
| InfluxDB | influxdb:2.7-alpine | 8086 | High-throughput TSDB |
| Mimir | grafana/mimir:2.14.1 | 9009 | Long-term Prometheus storage |
| Prometheus | prom/prometheus:v2.55.0 | 9090 | Metrics scraper |
| Node Exporter | prom/node-exporter:v1.8.2 | 9100 | System metrics |
| Promtail | grafana/promtail:3.2.0 | 9080 | Log shipper |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- (Optional) Cloudflare R2 bucket for Mimir long-term storage
- (Optional) Grafana Cloud account for log shipping

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GRAFANA_DOMAIN` | Domain for Grafana dashboard | `grafana.example.com` |
| `GRAFANA_ADMIN_PASSWORD` | Admin password | Auto-generated |
| `GRAFANA_SECRET_KEY` | Encryption key | Auto-generated |
| `INFLUXDB_ADMIN_PASSWORD` | InfluxDB admin password | Auto-generated |
| `INFLUXDB_ADMIN_TOKEN` | InfluxDB API token | Auto-generated |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GRAFANA_ADMIN_USER` | `admin` | Grafana admin username |
| `GRAFANA_ANONYMOUS_ENABLED` | `false` | Allow anonymous access |
| `GRAFANA_PLUGINS` | `grafana-clock-panel,...` | Plugins to install |
| `INFLUXDB_ORG` | `homelab` | InfluxDB organization |
| `INFLUXDB_BUCKET` | `metrics` | Default bucket name |
| `INFLUXDB_RETENTION` | `30d` | Data retention period |
| `PROMETHEUS_RETENTION` | `15d` | Prometheus retention |
| `PROMETHEUS_SCRAPE_INTERVAL` | `15s` | Scrape interval |
| `MIMIR_TENANT_ID` | `anonymous` | Multi-tenant ID |

### Cloudflare R2 Storage (Optional)

For long-term Mimir storage using Cloudflare R2:

| Variable | Description |
|----------|-------------|
| `MIMIR_S3_ENDPOINT` | `https://ACCOUNT_ID.r2.cloudflarestorage.com` |
| `MIMIR_S3_ACCESS_KEY_ID` | R2 access key |
| `MIMIR_S3_SECRET_ACCESS_KEY` | R2 secret key |
| `MIMIR_S3_BUCKET` | Bucket name (e.g., `mimir-blocks`) |

### Grafana Cloud Logs (Optional)

For shipping logs to Grafana Cloud Loki:

| Variable | Description |
|----------|-------------|
| `LOKI_URL` | `https://logs-prod-us-central1.grafana.net/loki/api/v1/push` |
| `LOKI_USERNAME` | Your Grafana Cloud user ID |
| `LOKI_API_KEY` | Grafana Cloud API key |

## Deployment

1. **Create DNS Record**
   ```
   grafana.example.com → Your Dokploy Server IP
   ```

2. **Import Template in Dokploy**
   - Navigate to Templates → Import
   - Select the docker-compose.yml and template.toml
   - Configure required variables

3. **Deploy Stack**
   - Click Deploy
   - Wait for all services to become healthy

4. **Access Grafana**
   - Navigate to `https://grafana.example.com`
   - Login with admin credentials

## Post-Deployment Setup

### 1. Add Data Sources

Grafana will have pre-configured environment variables for InfluxDB and Mimir. To add them as data sources:

1. Go to **Configuration → Data Sources**
2. Add **InfluxDB** data source:
   - Query Language: Flux
   - URL: `http://influxdb:8086`
   - Organization: `homelab` (or your INFLUXDB_ORG)
   - Token: Your INFLUXDB_ADMIN_TOKEN
   - Default Bucket: `metrics`

3. Add **Prometheus** (Mimir) data source:
   - URL: `http://mimir:9009/prometheus`
   - Type: Prometheus

### 2. Import Dashboards

Recommended community dashboards:

| Dashboard | ID | Description |
|-----------|-----|-------------|
| Node Exporter Full | 1860 | Comprehensive system metrics |
| Docker Monitoring | 893 | Container metrics |
| Prometheus Stats | 2 | Prometheus self-monitoring |

### 3. Configure Alerts (Optional)

1. Go to **Alerting → Contact Points**
2. Add notification channels (Email, Slack, PagerDuty, etc.)
3. Create alert rules for critical metrics

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| Grafana | 0.25 | 256MB | 1GB |
| InfluxDB | 0.5 | 512MB | 10GB+ |
| Mimir | 0.5 | 512MB | 5GB+ |
| Prometheus | 0.25 | 256MB | 5GB |
| Node Exporter | 0.1 | 64MB | - |
| Promtail | 0.1 | 128MB | 100MB |
| **Total** | ~1.7 | ~1.7GB | ~21GB |

## Troubleshooting

### Grafana Shows "No Data"

1. Check Prometheus is scraping targets:
   - Access `http://prometheus:9090/targets` internally
   - Verify node-exporter target is UP

2. Verify data source configuration:
   - Test connection in Grafana data source settings
   - Check InfluxDB token is correct

### InfluxDB Connection Refused

1. Check InfluxDB is healthy:
   ```bash
   docker compose exec influxdb influx ping
   ```

2. Verify initialization completed:
   ```bash
   docker compose logs influxdb | grep -i setup
   ```

### Mimir Not Receiving Data

1. Check Prometheus remote_write:
   ```bash
   docker compose logs prometheus | grep -i mimir
   ```

2. Verify Mimir is ready:
   ```bash
   curl http://mimir:9009/ready
   ```

### High Memory Usage

1. Reduce InfluxDB cache size:
   ```
   INFLUXDB_CACHE_SIZE=536870912  # 512MB
   ```

2. Reduce Prometheus retention:
   ```
   PROMETHEUS_RETENTION=7d
   ```

## Security Considerations

- **Network Isolation**: All backends (InfluxDB, Mimir, Prometheus) are only accessible on the internal `observability-net`
- **No Exposed Ports**: Only Grafana is exposed via Traefik
- **TLS**: HTTPS enforced via LetsEncrypt
- **Secrets**: All passwords and tokens use Dokploy variable generators
- **Anonymous Access**: Disabled by default

## Backup Strategy

### InfluxDB

```bash
# Backup all data
docker compose exec influxdb influx backup /var/lib/influxdb2/backup/

# Restore
docker compose exec influxdb influx restore /var/lib/influxdb2/backup/
```

### Grafana

Backup the `grafana-data` volume which contains:
- Dashboards
- Data sources
- Users and permissions
- Alert rules

### Mimir

If using Cloudflare R2, data is already backed up externally. For local storage, backup the `mimir-data` volume.

## Upgrading

1. Check release notes for breaking changes
2. Update image versions in docker-compose.yml
3. Redeploy in Dokploy
4. Verify all services are healthy

## Related Resources

- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Mimir Documentation](https://grafana.com/docs/mimir/latest/)
- [InfluxDB Documentation](https://docs.influxdata.com/influxdb/v2/)
- [Promtail Documentation](https://grafana.com/docs/loki/latest/clients/promtail/)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
