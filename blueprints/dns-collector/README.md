# DNS-collector

DNS traffic analysis and monitoring tool for capturing, processing, and forwarding DNS data.

## Overview

[DNS-collector](https://github.com/dmachard/DNS-collector) is a lightweight Go-based tool that captures DNS queries and responses from your DNS servers, processes them intelligently, and sends clean data to your monitoring or analytics systems. It's the missing piece between DNS servers and your data stack.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   DNS-collector Stack                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   DNS Servers (External)                                         │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│   │  PowerDNS   │ │    BIND     │ │   Unbound   │               │
│   │ (Recursive  │ │   (Auth/    │ │ (Recursive) │               │
│   │   or Auth)  │ │  Recursive) │ │             │               │
│   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘               │
│          │               │               │                       │
│          └───────────────┴───────────────┘                       │
│                          │                                       │
│                    DNStap :6000                                  │
│                          │                                       │
│                          ▼                                       │
│              ┌───────────────────────┐                           │
│              │    dnscollector       │                           │
│              │  (go-dnscollector)    │                           │
│              │                       │                           │
│              │  ┌─────────────────┐  │                           │
│              │  │ DNStap Listener │  │                           │
│              │  │    :6000/tcp    │  │                           │
│              │  └────────┬────────┘  │                           │
│              │           │           │                           │
│              │  ┌────────▼────────┐  │                           │
│              │  │   Transforms    │  │                           │
│              │  │  - Normalize    │  │                           │
│              │  │  - Filter       │  │                           │
│              │  │  - GeoIP        │  │                           │
│              │  └────────┬────────┘  │                           │
│              │           │           │                           │
│              │  ┌────────▼────────┐  │                           │
│              │  │    Outputs      │  │                           │
│              │  │ - JSON File     │  │                           │
│              │  │ - Prometheus    │  │                           │
│              │  │ - REST API      │  │                           │
│              │  └─────────────────┘  │                           │
│              │                       │                           │
│              │  Prometheus :8080     │                           │
│              │  REST API   :9165     │                           │
│              └───────────┬───────────┘                           │
│                          │                                       │
│   dokploy-network ───▶ Traefik ───▶ HTTPS                       │
│                                                                   │
│   Endpoints:                                                     │
│   - metrics.${DOMAIN} → Prometheus metrics                       │
│   - api.${DOMAIN}     → REST API telemetry                       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## How It Works

DNS-collector operates as a central hub for DNS telemetry:

1. **Data Collection**: DNS servers send query/response data via DNStap protocol to port 6000
2. **Processing**: Data is normalized, filtered, and optionally enriched with GeoIP information
3. **Output**: Clean data is forwarded to multiple destinations:
   - JSON log files for persistent storage
   - Prometheus endpoint for metrics and alerting
   - REST API for real-time telemetry access

## Features

- **DNStap Protocol** support for BIND, PowerDNS, Unbound, and other DNS servers
- **Data Transformation** with normalization, filtering, and GeoIP enrichment
- **Multiple Outputs** including files, Prometheus, Elasticsearch, Loki, and syslog
- **DNS-Native Processing** that understands DNS protocol, EDNS, and query types
- **Edge Processing** that cleans and filters data before storage
- **Low Resource Usage** with efficient Go implementation

## Prerequisites

- Domain name with DNS configured
- DNS server(s) with DNStap support enabled
- Network connectivity between DNS servers and collector (port 6000)

## Quick Start

1. Deploy this template in Dokploy
2. Set your domain (e.g., `dns.example.com`)
3. Configure your DNS servers to send DNStap data to the collector
4. Access the services:
   - Prometheus metrics: `https://metrics.dns.example.com/metrics`
   - REST API: `https://api.dns.example.com/`

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Base domain for all services |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_IDENTITY` | `dns-collector-1` | Unique identifier for this collector |
| `DNSTAP_PORT` | `6000` | Port for DNStap listener |

## Services

| Service | Description | Ports |
|---------|-------------|-------|
| **dnscollector** | DNS traffic collector and processor | 6000 (DNStap), 8080 (Prometheus), 9165 (API) |

## Exposed Endpoints

| Subdomain | Service | Description |
|-----------|---------|-------------|
| `metrics.${DOMAIN}` | dnscollector | Prometheus metrics endpoint |
| `api.${DOMAIN}` | dnscollector | REST API for telemetry |

## DNS Server Integration

### PowerDNS Authoritative

Add to `pdns.conf`:

```ini
dnstap-log=yes
dnstap-socket-path=dnstap
dnstap-frame-stream-server=<collector-ip>:6000
```

### PowerDNS Recursor

Add to `recursor.conf`:

```ini
dnstap=yes
dnstap-log-client-queries=yes
dnstap-log-client-responses=yes
dnstap-socket-path=dnstap
dnstap-frame-stream-server=<collector-ip>:6000
```

### BIND 9

Add to `named.conf`:

```bind
dnstap { (any); };
dnstap-output tcp <collector-ip> port 6000;
```

### Unbound

Add to `unbound.conf`:

```yaml
dnstap:
  dnstap-enable: yes
  dnstap-socket-path: ""
  dnstap-ip: "<collector-ip>@6000"
  dnstap-send-identity: yes
  dnstap-send-version: yes
  dnstap-log-client-query-messages: yes
  dnstap-log-client-response-messages: yes
```

## Post-Deployment Setup

### 1. Verify Services

Check that the collector is healthy:
- Prometheus metrics: `https://metrics.your-domain.com/metrics`
- REST API: `https://api.your-domain.com/`

### 2. Configure DNS Servers

Update your DNS server configuration to send DNStap data to the collector's IP address on port 6000.

### 3. Grafana Integration

Import DNS-collector dashboards for Grafana:

1. Add Prometheus data source pointing to `https://metrics.your-domain.com`
2. Import dashboard from [DNS-collector Grafana examples](https://github.com/dmachard/DNS-collector/tree/main/docs/_examples/grafana)

### 4. Enable GeoIP Enrichment (Optional)

To enable GeoIP enrichment:

1. Download MaxMind GeoLite2 databases (requires free account)
2. Mount database files into the container
3. Update `config.yml` to enable the geoip transform

## Advanced Configuration

### Custom Pipeline Configuration

Edit `config.yml` to customize the processing pipeline:

```yaml
pipelines:
  - name: dnstap-collector
    dnstap:
      listen-ip: 0.0.0.0
      listen-port: 6000
    transforms:
      normalize:
        qname-lowercase: true
      filtering:
        # Drop health check queries
        drop-fqdn-file: /var/dnscollector/drop-fqdn.txt
    routing-policy:
      forward: [json-logger, prometheus-exporter]
```

### Additional Output Destinations

Enable additional outputs by uncommenting sections in `config.yml`:

- **Elasticsearch**: Send to Elasticsearch for full-text search
- **Loki**: Send to Grafana Loki for log aggregation
- **Syslog**: Forward to syslog server for centralized logging

## Troubleshooting

### No Data Received

- Verify DNS server DNStap configuration
- Check network connectivity to port 6000
- Verify firewall rules allow DNStap traffic
- Check collector logs in Dokploy

### High Memory Usage

- Reduce `worker.buffer-size` in config.yml
- Enable filtering to drop unwanted queries
- Increase log rotation frequency

### Prometheus Scrape Errors

- Verify metrics endpoint is accessible
- Check Prometheus target configuration
- Ensure correct port mapping (8080)

## Resource Requirements

| Component | Memory | CPU |
|-----------|--------|-----|
| dnscollector | 128MB | 0.25 cores |

**Note**: Resource usage scales with DNS query volume and enabled transforms.

## Security Considerations

- DNStap traffic is unencrypted by default; consider TLS for production
- Restrict access to metrics and API endpoints via firewall or Cloudflare Access
- Rotate log files to prevent disk exhaustion
- Use filtering to exclude sensitive DNS queries

## Related Templates

| Template | Description |
|----------|-------------|
| `powerdns` | Complete DNS infrastructure with authoritative server |
| `powerdns-admin` | Web UI for PowerDNS management |
| `lightningstream` | LMDB replication for PowerDNS |
| `grafana-observability` | Complete observability stack for metrics |

## Links

- [DNS-collector GitHub](https://github.com/dmachard/DNS-collector)
- [DNS-collector Documentation](https://github.com/dmachard/DNS-collector/tree/main/docs)
- [DNStap Protocol](https://dnstap.info/)
- [Grafana Dashboard Examples](https://github.com/dmachard/DNS-collector/tree/main/docs/_examples/grafana)

## Version

- **Template**: 1.0.0
- **DNS-collector**: 2.0.0
