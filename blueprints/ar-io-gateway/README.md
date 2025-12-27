# AR.IO Gateway Node

A scalable and **modular** gateway built for the permaweb atop the Arweave permanent data storage network. Run your own AR.IO gateway to serve and index Arweave data, participate in the AR.IO network, and earn rewards.

## Overview

AR.IO Gateway Node is a production-ready gateway implementation that enables you to:

- **Serve Arweave Data**: Act as a gateway for the Arweave permaweb
- **Index Transactions**: Index and cache Arweave transactions for fast retrieval
- **ArNS Resolution**: Resolve Arweave Name System (ArNS) names
- **Network Participation**: Participate in the AR.IO network and earn rewards
- **Data Caching**: Redis-backed caching for improved performance
- **Rate Limiting**: Protect your gateway with Redis-based rate limiting
- **Full Monitoring Stack**: Prometheus, Grafana, Node Exporter, and OpenTelemetry (optional)
- **AO Compute Unit**: Deploy AO computation sidecar for AO network integration (optional)
- **Modular Architecture**: Deploy base gateway only, with monitoring, or full stack with AO

## Deployment Profiles

This template supports **three deployment profiles**:

| Profile | Services | RAM Required | Use Case |
|---------|----------|--------------|----------|
| **Base Gateway** | 4 services | 8 GB | Core gateway functionality |
| **Gateway + Monitoring** | 8 services | 12 GB | Production with observability |
| **Full Stack (with AO CU)** | 9 services | 20+ GB | Full AR.IO + AO capabilities |

**To switch profiles**, simply comment/uncomment sections in `docker-compose.yml` marked with `# OPTIONAL`.

## Architecture

This template deploys a modular AR.IO gateway stack:

```
┌──────────────────────────────────────────────────────────────┐
│                      HTTPS (Traefik)                        │
└───┬───────────┬──────────────┬──────────────┬──────────────┘
    │           │              │              │
    ▼           ▼              ▼              ▼
┌────────┐  ┌────────┐    ┌────────┐     ┌────────┐
│ envoy  │  │grafana │    │prometheus│   │ ao-cu  │ (optional)
│(proxy) │  │(optional)   │(optional)│   │(optional)
└───┬────┘  └────┬───┘    └────┬────┘    └────┬───┘
    │            │             │              │
    ▼            │             ▼              │
┌────────┐       │       ┌──────────┐        │
│  core  │───────┼──────▶│node-exp. │        │
│(gateway)       │       │(optional)│        │
└───┬────┘       │       └──────────┘        │
    │            │                            │
    ├────▶ redis (cache)                     │
    │                                         │
    ├────▶ observer                          │
    │                                         │
    └────▶ opentelemetry-collector ──────────┘
           (optional)
```

### Services

**Base Gateway (Required - 4 services):**

| Service | Purpose | Exposed |
|---------|---------|---------|
| **envoy** | Reverse proxy and external entrypoint | Yes (HTTPS) |
| **core** | Main gateway service (data indexing & serving) | No (internal) |
| **redis** | Caching and rate limiting | No (internal) |
| **observer** | Network monitoring and reporting | No (internal) |

**Monitoring Stack (Optional - 4 services):**

| Service | Purpose | Exposed |
|---------|---------|---------|
| **prometheus** | Time-series metrics database | Optional (configurable) |
| **grafana** | Metrics visualization dashboards | Yes (HTTPS `/grafana`) |
| **node-exporter** | System metrics collector | No (internal) |
| **opentelemetry-collector** | Distributed tracing and telemetry | No (internal) |

**AO Compute (Optional - 1 service):**

| Service | Purpose | Exposed |
|---------|---------|---------|
| **ao-cu** | AO Compute Unit for AO network | Optional (configurable) |

### Data Storage

The template uses **up to 15 persistent volumes** depending on deployment profile:

**Base Gateway Volumes (12):**
- **chunks-data**: Raw Arweave chunk data
- **contiguous-data**: Contiguous data cache
- **headers-data**: Transaction headers
- **sqlite-data**: SQLite database for indexing
- **duckdb-data**: DuckDB analytics database
- **lmdb-data**: LMDB key-value store
- **parquet-data**: Parquet columnar data
- **datasets-data**: Pre-built datasets
- **temp-data**: Temporary processing data
- **cdb64-root-tx-index-data**: Transaction index
- **redis-data**: Redis cache persistence
- **reports-data**: Observer reports

**Monitoring Stack Volumes (2 - if enabled):**
- **prometheus-data**: Prometheus time-series metrics (30-day retention)
- **grafana-data**: Grafana dashboards and configuration

**AO Compute Unit Volumes (1 - if enabled):**
- **ao-cu-data**: AO process memory cache and checkpoints

## Requirements

### Arweave Wallets

You need **two Arweave wallets** to run an AR.IO gateway:

1. **AR.IO Wallet** (`AR_IO_WALLET`)
   - Main gateway wallet for network participation
   - Used for gateway registration and rewards
   - Generate at: https://arweave.app/ or https://fwd.arweave.dev/

2. **Observer Wallet** (`OBSERVER_WALLET`)
   - Used by the observer service for network monitoring
   - Submits gateway health reports to AR.IO network
   - Can be the same as AR.IO wallet or a separate one

3. **AO Wallet** (`AO_WALLET`) - *Optional, only if deploying AO CU*
   - Used by AO Compute Unit for AO network operations
   - Can be the same as AR.IO wallet or a separate one

### Resources

**Base Gateway Profile:**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 500 GB SSD (grows with indexed data)
- Network: Reliable connection with good bandwidth

**Gateway + Monitoring Profile:**
- CPU: 6 cores
- RAM: 12 GB (additional 4 GB for Prometheus/Grafana)
- Storage: 550 GB SSD (50 GB for monitoring data)
- Network: 100+ Mbps symmetric

**Full Stack Profile (with AO CU):**
- CPU: 8+ cores
- RAM: **20+ GB** (16 GB recommended for AO CU alone)
- Storage: 1+ TB NVMe SSD
- Network: 100+ Mbps symmetric

## Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AR_IO_DOMAIN` | Your gateway domain | `gateway.example.com` |
| `AR_IO_WALLET` | AR.IO wallet address | `pNW...abc123` |
| `OBSERVER_WALLET` | Observer wallet address | `pNW...def456` |
| `ADMIN_API_KEY` | Admin API key (auto-generated) | *Auto-generated in Dokploy* |

### Optional Configuration

#### Node Sync Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `START_HEIGHT` | Block height to start syncing from | (current height) |
| `STOP_HEIGHT` | Block height to stop syncing at | (unlimited) |
| `ARNS_ROOT_HOST` | ArNS root domain for name resolution | (empty) |
| `IO_PROCESS_ID` | AR.IO process ID on AO network | (empty) |

#### Trusted Arweave Nodes

| Variable | Description | Default |
|----------|-------------|---------|
| `TRUSTED_NODE_HOST` | Primary Arweave node | `arweave.net` |
| `TRUSTED_NODE_PORT` | Primary node port | `443` |
| `FALLBACK_NODE_HOST` | Fallback Arweave node | `peers.arweave.xyz` |
| `FALLBACK_NODE_PORT` | Fallback node port | `1984` |

#### Logging

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVOY_LOG_LEVEL` | Envoy proxy log level | `info` |
| `CORE_LOG_LEVEL` | Core service log level | `info` |
| `CORE_LOG_FORMAT` | Log format (simple/json) | `simple` |
| `OBSERVER_LOG_LEVEL` | Observer log level | `info` |

#### Performance Tuning

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_MAX_MEMORY` | Redis memory limit | `256mb` |
| `ENABLE_RATE_LIMITER` | Enable request rate limiting | `true` |

#### Observer Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `SUBMIT_CONTRACT_INTERACTIONS` | Submit observations to AR.IO network | `true` |
| `NUM_ARNS_NAMES_TO_OBSERVE_PER_GROUP` | ArNS names to observe | `8` |
| `RUN_OBSERVER` | Enable observer service | `true` |

### Monitoring Stack Configuration (Optional)

To enable the full monitoring stack, ensure the monitoring services are uncommented in `docker-compose.yml`.

#### Grafana Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password | *Auto-generated* |
| `GRAFANA_ADMIN_USER` | Grafana admin username | `admin` |
| `EXPOSE_GRAFANA` | Expose Grafana UI via Traefik | `true` |
| `GF_AUTH_ANONYMOUS` | Allow anonymous access | `false` |
| `GF_AUTH_ANONYMOUS_ROLE` | Anonymous user role | `Viewer` |

**Access Grafana**: `https://your-domain.com/grafana`

#### Prometheus Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PROMETHEUS_RETENTION` | Metrics retention period | `30d` |
| `EXPOSE_PROMETHEUS` | Expose Prometheus UI via Traefik | `false` |

**Access Prometheus** (if exposed): `https://your-domain.com/prometheus`

**Note**: For security, Prometheus UI is disabled by default. Access metrics through Grafana dashboards.

#### OpenTelemetry Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_SERVICE_NAME` | Service name for tracing | `ar-io-core` |
| `OTEL_LOG_LEVEL` | OpenTelemetry log level | `info` |
| `OTEL_BACKEND_ENDPOINT` | External tracing backend (Jaeger/Tempo) | *(empty)* |
| `OTEL_BACKEND_HEADERS` | Headers for external backend | *(empty)* |

**Monitoring Stack Features:**
- **Prometheus**: Collects metrics from all services (15s scrape interval)
- **Grafana**: Pre-configured dashboards for AR.IO gateway metrics
- **Node Exporter**: System-level metrics (CPU, memory, disk, network)
- **OpenTelemetry**: Distributed tracing with tail sampling (10% sampling)

### AO Compute Unit Configuration (Optional)

To enable AO Compute Unit, ensure the `ao-cu` service is uncommented in `docker-compose.yml`.

**⚠️ Important**: AO CU requires **minimum 4 GB RAM** (16 GB recommended for production).

#### AO Node Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `AO_WALLET` | AO wallet address | *(empty)* |
| `AO_NODE_CONFIG_ENV` | Node environment | `production` |
| `EXPOSE_AO_CU` | Expose AO CU API via Traefik | `false` |
| `AO_CU_PORT` | AO CU port | `6363` |

#### AO Access Control

| Variable | Description | Default |
|----------|-------------|---------|
| `AO_ALLOW_PROCESSES` | Allowed process IDs (* for all) | `*` |
| `AO_ALLOW_OWNERS` | Allowed owner addresses (* for all) | `*` |

#### AO Gateway Integration

| Variable | Description | Default |
|----------|-------------|---------|
| `AO_MU_URL` | AO Messaging Unit endpoint | `https://mu.ao-testnet.xyz` |
| `AO_ARWEAVE_URL` | Arweave gateway URL | `https://arweave.net` |
| `AO_GRAPHQL_URL` | Arweave GraphQL endpoint | `https://arweave.net/graphql` |

#### AO WASM Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `AO_WASM_MEMORY_LIMIT` | WASM memory limit (bytes) | `17592186044416` |
| `AO_WASM_COMPUTE_LIMIT` | WASM compute limit (gas) | `9000000000000` |
| `AO_WASM_FORMATS` | Supported WASM formats | `wasm64-unknown-emscripten-draft_2024_02_15` |

#### AO Resource Limits

| Variable | Description | Default |
|----------|-------------|---------|
| `AO_CU_MEMORY_LIMIT` | Docker memory limit | `16G` |
| `AO_CU_MEMORY_RESERVATION` | Docker memory reservation | `4G` |
| `AO_CHECKPOINT_CACHE_SIZE` | Checkpoint cache size | `100` |
| `AO_MEMORY_CACHE_SIZE` | Process memory cache size | `500` |

**AO Compute Unit Features:**
- **Process Execution**: Execute AO processes using WASM
- **State Management**: Checkpoint-based state persistence
- **Gateway Integration**: Direct connection to AR.IO gateway for data
- **Memory Management**: Configurable cache sizes and TTLs
- **Access Control**: Whitelist/blacklist processes and owners

## Deployment

### 1. Deploy Template in Dokploy

1. Navigate to your Dokploy project
2. Click "Create Service" → "Template"
3. Search for "AR.IO Gateway"
4. Click "Deploy"

### 2. Configure Required Variables

During deployment, provide:

- **Domain**: Your gateway domain (e.g., `gateway.example.com`)
- **AR.IO Wallet**: Your gateway wallet address
- **Observer Wallet**: Your observer wallet address

The Admin API key will be auto-generated securely.

### 3. DNS Configuration

Point your domain to your Dokploy server:

```dns
gateway.example.com.  A      123.45.67.89
```

### 4. Initial Sync

The gateway will begin syncing Arweave data. Monitor progress:

```bash
# Check core service logs
docker logs -f <core-container-name>

# Check observer logs
docker logs -f <observer-container-name>
```

**Note**: Initial sync can take several hours to days depending on:
- Your `START_HEIGHT` configuration
- Server resources
- Network bandwidth

### 5. Verify Deployment

**Check Gateway Health:**
```bash
curl https://gateway.example.com/info
```

**Expected Response:**
```json
{
  "name": "ar-io-node",
  "version": "...",
  "release": 63
}
```

**Check ArNS Resolution:**
```bash
curl https://gateway.example.com/ar-io/info
```

## Post-Deployment

### Gateway Registration

To participate in the AR.IO network and earn rewards:

1. Visit the AR.IO Network dashboard: https://network.ar.io/
2. Connect your AR.IO wallet
3. Register your gateway with your domain
4. Stake required AR.IO tokens

**Important**: Gateway registration requires AR.IO token staking. Check current requirements at https://docs.ar.io/

### Monitoring

#### Basic Health Checks

**Health Endpoints:**

- Gateway Info: `https://gateway.example.com/info`
- Observer Health: `https://gateway.example.com/ar-io/healthcheck`
- ArNS Status: `https://gateway.example.com/ar-io/info`
- AO CU Health (if enabled): `http://localhost:6363/` or `https://gateway.example.com/ao-cu`

**Check Logs:**
```bash
# View all service logs
docker compose logs -f

# View specific service
docker compose logs -f core
docker compose logs -f observer
docker compose logs -f envoy

# View monitoring stack logs
docker compose logs -f prometheus
docker compose logs -f grafana
docker compose logs -f opentelemetry-collector

# View AO CU logs (if enabled)
docker compose logs -f ao-cu
```

#### Monitoring Stack (if enabled)

**Access Grafana Dashboard:**
```
URL: https://gateway.example.com/grafana
Username: admin
Password: <auto-generated, check Dokploy environment variables>
```

**Pre-configured Dashboards:**
1. **AR.IO Gateway - Overview**: HTTP requests, latency, cache performance
2. **System Monitoring**: CPU, memory, disk, network metrics from Node Exporter
3. **Redis Cache**: Memory usage, hit/miss ratios, evictions

**Adding Custom Dashboards:**
1. Log into Grafana at `/grafana`
2. Navigate to Dashboards → New Dashboard
3. Add panels querying Prometheus datasource
4. Save to "AR.IO" folder for organization

**Prometheus Queries (useful metrics):**

```promql
# Request rate
rate(http_requests_total{service="ar-io-core"}[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_milliseconds_bucket[5m]))

# Redis memory usage
redis_memory_used_bytes

# CPU usage
100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])))

# Memory usage percentage
100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))
```

**OpenTelemetry Tracing:**

The OpenTelemetry collector receives traces from AR.IO Core and provides:
- **Tail Sampling**: Keeps 100% of error traces, 10% of successful traces
- **Export Options**: Configure `OTEL_BACKEND_ENDPOINT` for Jaeger/Tempo/Honeycomb
- **Health Check**: `http://localhost:13133` (internal only)

**Example Tempo/Jaeger Integration:**

To send traces to external backend, update in `template.toml`:
```yaml
OTEL_BACKEND_ENDPOINT: "https://tempo.example.com:4317"
OTEL_BACKEND_HEADERS: "authorization=Bearer YOUR_TOKEN"
```

#### AO Compute Unit Monitoring (if enabled)

**Health Endpoint:**
```bash
curl http://localhost:6363/
```

**Check AO CU Metrics:**

If you exposed AO CU API (`EXPOSE_AO_CU=true`):
```
https://gateway.example.com/ao-cu
```

**Monitor Resource Usage:**
```bash
# Check memory usage (should stay within limits)
docker stats ao-cu

# Check AO CU logs for process executions
docker compose logs -f ao-cu | grep "process"
```

### Backup Important Data

While most data can be re-synced, consider backing up:

- **sqlite-data**: Transaction index (critical)
- **redis-data**: Cache (optional, improves startup)
- **reports-data**: Observer reports (for historical records)

```bash
# Example backup command
docker run --rm -v ar-io-gateway_sqlite-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/sqlite-backup-$(date +%Y%m%d).tar.gz -C /data .
```

## Troubleshooting

### Gateway Not Syncing

**Symptoms**: No data indexed, `/info` shows old block height

**Solutions:**
1. Check core service logs: `docker logs -f <core-container>`
2. Verify trusted node connectivity:
   ```bash
   curl https://arweave.net/info
   ```
3. Ensure sufficient storage space
4. Check `START_HEIGHT` configuration

### High Memory Usage

**Symptoms**: Redis using more memory than allocated

**Solutions:**
1. Increase `REDIS_MAX_MEMORY` if you have available RAM
2. Monitor with: `docker stats`
3. Consider upgrading server resources for production

### ArNS Names Not Resolving

**Symptoms**: ArNS names return 404

**Solutions:**
1. Ensure `ARNS_ROOT_HOST` is configured correctly
2. Check observer is running: `docker ps | grep observer`
3. Verify observer wallet has sufficient AR tokens for observations
4. Check observer logs for errors

### Rate Limiting Issues

**Symptoms**: 429 Too Many Requests errors

**Solutions:**
1. Adjust rate limiter settings in environment variables
2. Whitelist trusted IPs/CIDRs using `RATE_LIMITER_IPS_AND_CIDRS_ALLOWLIST`
3. Consider disabling: `ENABLE_RATE_LIMITER=false` (not recommended for production)

### Observer Not Reporting

**Symptoms**: Gateway not submitting observations to AR.IO network

**Solutions:**
1. Ensure observer wallet has sufficient AR tokens for transactions
2. Check observer logs: `docker logs -f <observer-container>`
3. Verify `SUBMIT_CONTRACT_INTERACTIONS=true`
4. Check `IO_PROCESS_ID` is set correctly

### Grafana Not Loading / 502 Error

**Symptoms**: Grafana returns 502 Bad Gateway or doesn't load

**Solutions:**
1. Check Grafana container is running: `docker ps | grep grafana`
2. Check Grafana logs: `docker compose logs grafana`
3. Verify Grafana is healthy: `docker compose ps grafana`
4. Ensure `GRAFANA_ADMIN_PASSWORD` is set in environment
5. Check Traefik labels are correct in docker-compose.yml
6. Restart Grafana service: `docker compose restart grafana`

### Prometheus Not Scraping Metrics

**Symptoms**: Grafana dashboards show "No Data" or empty graphs

**Solutions:**
1. Check Prometheus is running: `docker ps | grep prometheus`
2. Verify Prometheus targets are up:
   - Access Prometheus UI (if exposed) at `/prometheus/targets`
   - Or check Prometheus logs: `docker compose logs prometheus`
3. Ensure services expose metrics endpoints:
   ```bash
   # Test AR.IO Core metrics
   curl http://localhost:4000/metrics

   # Test Node Exporter metrics
   curl http://localhost:9100/metrics
   ```
4. Verify prometheus.yml configuration is mounted correctly
5. Check network connectivity between services:
   ```bash
   docker exec -it <prometheus-container> wget -qO- http://core:4000/metrics
   ```

### OpenTelemetry Not Receiving Traces

**Symptoms**: No traces visible in external tracing backend

**Solutions:**
1. Check OpenTelemetry collector is running: `docker ps | grep opentelemetry`
2. Verify collector health: `curl http://localhost:13133`
3. Check collector logs: `docker compose logs opentelemetry-collector`
4. Ensure AR.IO Core is configured to send traces:
   ```bash
   docker exec -it <core-container> env | grep OTEL
   ```
5. Verify `OTEL_BACKEND_ENDPOINT` is correctly configured
6. Test backend connectivity:
   ```bash
   docker exec -it <opentelemetry-container> wget -qO- $OTEL_BACKEND_ENDPOINT
   ```

### AO CU Out of Memory

**Symptoms**: AO CU container crashes or restarts frequently

**Solutions:**
1. Check current memory usage: `docker stats ao-cu`
2. Increase memory limits in environment:
   ```yaml
   AO_CU_MEMORY_LIMIT: 24G          # Increase from default 16G
   AO_CU_MEMORY_RESERVATION: 8G     # Increase from default 4G
   ```
3. Reduce cache sizes if memory is constrained:
   ```yaml
   AO_CHECKPOINT_CACHE_SIZE: 50     # Reduce from default 100
   AO_MEMORY_CACHE_SIZE: 250        # Reduce from default 500
   ```
4. Check for memory leaks in AO CU logs
5. Restart AO CU with increased limits: `docker compose up -d ao-cu`

### AO CU Not Processing Requests

**Symptoms**: AO process executions fail or timeout

**Solutions:**
1. Check AO CU is running and healthy:
   ```bash
   docker ps | grep ao-cu
   curl http://localhost:6363/
   ```
2. Verify AO CU can reach the gateway:
   ```bash
   docker exec -it <ao-cu-container> wget -qO- http://envoy:3000/info
   ```
3. Check AO wallet configuration: `AO_WALLET` must be valid Arweave address
4. Review AO CU logs for errors: `docker compose logs ao-cu`
5. Verify WASM configuration is correct (memory/compute limits)
6. Check process/owner access control settings:
   ```yaml
   AO_ALLOW_PROCESSES: "*"    # Or specific process IDs
   AO_ALLOW_OWNERS: "*"       # Or specific owner addresses
   ```

## Advanced Configuration

### Custom Arweave Node

To use your own Arweave node instead of public nodes:

```yaml
TRUSTED_NODE_HOST: your-arweave-node.example.com
TRUSTED_NODE_PORT: 1984
```

### ArNS Configuration

To enable ArNS name resolution:

```yaml
ARNS_ROOT_HOST: ar-io.dev
IO_PROCESS_ID: <AR.IO_process_id>
```

Get the current AR.IO process ID from: https://docs.ar.io/

### Multiple Gateways

You can run multiple gateway instances with different configurations:

1. Deploy this template multiple times with different domains
2. Use different wallet addresses for each gateway
3. Configure different `START_HEIGHT` values for specialized gateways

## Resources

### Official Documentation

- **AR.IO Docs**: https://docs.ar.io/
- **AR.IO Network**: https://network.ar.io/
- **GitHub Repository**: https://github.com/ar-io/ar-io-node
- **Discord Community**: https://discord.gg/ario

### Arweave Resources

- **Arweave Docs**: https://docs.arweave.org/
- **Arweave Web Wallet**: https://arweave.app/
- **Block Explorer**: https://viewblock.io/arweave

### AR.IO Network

- **Network Dashboard**: https://network.ar.io/
- **Gateway Status**: Check your gateway's network performance
- **Token Information**: AR.IO tokenomics and staking requirements

### AO Resources (if using AO CU)

- **AO Cookbook**: https://cookbook_ao.g8way.io/
- **AO Documentation**: https://ao.arweave.dev/
- **AO Compute Unit Docs**: https://docs.ar.io/build/extensions/compute-unit
- **AO Network Explorer**: https://ao.link/

### Monitoring Resources

- **Prometheus Docs**: https://prometheus.io/docs/
- **Grafana Docs**: https://grafana.com/docs/
- **OpenTelemetry Docs**: https://opentelemetry.io/docs/
- **Node Exporter Metrics**: https://github.com/prometheus/node_exporter#collectors

## Security Considerations

1. **Protect Admin API Key**: Never expose the `ADMIN_API_KEY` publicly
2. **Wallet Security**: Store wallet keyfiles securely, never commit to git
3. **Rate Limiting**: Keep enabled for production to prevent abuse
4. **Firewall**: Only expose ports 80/443, block all others
5. **Updates**: Regularly update to the latest AR.IO release
6. **Grafana Access**: Set strong `GRAFANA_ADMIN_PASSWORD`, disable anonymous access in production
7. **Prometheus Exposure**: Keep `EXPOSE_PROMETHEUS=false` unless needed (access via Grafana instead)
8. **AO Access Control**: Configure `AO_ALLOW_PROCESSES` and `AO_ALLOW_OWNERS` to restrict access
9. **Monitoring Data**: Prometheus and Grafana may contain sensitive performance data - secure access
10. **OpenTelemetry Backend**: Use secure connections (HTTPS) for external trace backends

## License

This Dokploy template configuration is provided as-is. AR.IO Gateway Node is licensed under the AR.IO License. See the [official repository](https://github.com/ar-io/ar-io-node) for details.

## Support

- **Dokploy Issues**: https://github.com/dokploy/dokploy/issues
- **AR.IO Issues**: https://github.com/ar-io/ar-io-node/issues
- **AR.IO Discord**: https://discord.gg/ario

---

**Version**: 2.0.0 (Modular Stack with Monitoring & AO)
**Last Updated**: December 26, 2025
**Maintainer**: Dokploy Community

**Changelog**:
- **v2.0.0**: Added modular deployment profiles (Base, Monitoring, Full Stack)
  - Monitoring stack: Prometheus, Grafana, Node Exporter, OpenTelemetry
  - AO Compute Unit support for AO network integration
  - Enhanced documentation with 3-tier deployment guide
  - Resource requirements for each profile
  - Comprehensive troubleshooting for monitoring and AO
- **v1.0.0**: Initial AR.IO Gateway template release
