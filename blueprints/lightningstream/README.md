# Lightning Stream

Near real-time LMDB replication for PowerDNS using S3-compatible storage.

## Overview

[Lightning Stream](https://github.com/PowerDNS/lightningstream) is a synchronization tool that enables near real-time replication of LMDB (Lightning Memory-Mapped Database) instances across multiple servers using S3 buckets as an intermediary storage layer. It's designed primarily for PowerDNS Authoritative Server (version 4.8+) to enable distributed DNS infrastructure with synchronized zone data.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   Lightning Stream Stack                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│      ┌──────────────────┐                                        │
│      │  authoritative   │◀─────────────────┐                     │
│      │   (PowerDNS)     │                  │                     │
│      │   [LMDB data]    │                  │ shared volume       │
│      └────────┬─────────┘                  │                     │
│               │                            │                     │
│   DNS :53 TCP/UDP                          │                     │
│   API :8081                                │                     │
│               │                    ┌───────┴───────┐             │
│               │                    │    syncer     │             │
│               │                    │ (Lightning    │             │
│               │                    │   Stream)     │             │
│               │                    │   :8500       │             │
│               │                    └───────┬───────┘             │
│               │                            │                     │
│               │                    snapshot sync                 │
│               │                            │                     │
│               │                    ┌───────▼───────┐             │
│               │                    │     minio     │             │
│               │                    │  (S3 storage) │             │
│               │                    │  :9000 :9001  │             │
│               │                    └───────────────┘             │
│               │                            │                     │
│               │                   (or Cloudflare R2)             │
│               ▼                                                   │
│   dokploy-network ──▶ Traefik ──▶ HTTPS                          │
│                                                                   │
│                   Multi-Instance Sync                             │
│   ┌────────────┐  S3 bucket  ┌────────────┐                      │
│   │ Instance 1 │◀───────────▶│ Instance 2 │                      │
│   │  (syncer)  │  snapshots  │  (syncer)  │                      │
│   └────────────┘             └────────────┘                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## How It Works

Lightning Stream operates through a snapshot-based synchronization mechanism:

1. **Local Changes**: Whenever the local LMDB database is modified, Lightning Stream detects the change
2. **Upload**: A snapshot of the modified data is uploaded to the S3 bucket
3. **Download**: Other instances monitoring the bucket detect the new snapshot
4. **Merge**: Remote snapshots are downloaded and merged into the local LMDB
5. **Conflict Resolution**: Per-record last-modified timestamps ensure eventual consistency (most recent wins)

## Features

- **Near real-time sync** across multiple PowerDNS instances
- **Eventual consistency** with timestamp-based conflict resolution
- **S3-compatible storage** (MinIO included, Cloudflare R2 optional)
- **DNSSEC key synchronization** across nameserver clusters
- **Automatic bucket creation** and management
- **Configurable retention** and cleanup policies
- **HTTP status endpoint** for monitoring

## Prerequisites

- Domain name with DNS configured
- Port 53 available (or configure alternative port)
- S3-compatible storage (MinIO included, or external)

## Quick Start

1. Deploy this template in Dokploy
2. Set your domain (e.g., `dns.example.com`)
3. Access the services:
   - PowerDNS API: `https://api.dns.example.com`
   - Syncer Status: `https://sync.dns.example.com`
   - MinIO Console: `https://s3.dns.example.com`
4. Create DNS zones using PowerDNS API or pdnsutil

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Base domain for all services |
| `PDNS_API_KEY` | PowerDNS API key (auto-generated) |
| `S3_ACCESS_KEY` | S3 access key (auto-generated) |
| `S3_SECRET_KEY` | S3 secret key (auto-generated) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DNS_PORT` | `53` | DNS port (change if 53 is in use) |
| `INSTANCE_ID` | `instance-1` | Unique syncer instance ID |
| `S3_ENDPOINT` | `http://minio:9000` | S3 endpoint URL |
| `S3_BUCKET` | `lightningstream` | S3 bucket name |
| `S3_REGION` | `us-east-1` | S3 region |

## Services

| Service | Description | Ports |
|---------|-------------|-------|
| **authoritative** | PowerDNS Authoritative Server | 53 (DNS), 8081 (API) |
| **syncer** | Lightning Stream synchronizer | 8500 (status) |
| **minio** | S3-compatible object storage | 9000 (API), 9001 (console) |

## Exposed Endpoints

| Subdomain | Service | Description |
|-----------|---------|-------------|
| `api.${DOMAIN}` | authoritative | PowerDNS REST API |
| `sync.${DOMAIN}` | syncer | Lightning Stream status |
| `s3.${DOMAIN}` | minio | MinIO web console |
| `s3-api.${DOMAIN}` | minio | MinIO S3 API |

## Post-Deployment Setup

### 1. Verify Services

Check that all services are healthy:
- PowerDNS API: `https://api.your-domain.com/api/v1/servers/localhost`
- Syncer Status: `https://sync.your-domain.com/`
- MinIO Console: `https://s3.your-domain.com/`

### 2. Create DNS Zones

Using the PowerDNS API:

```bash
# Create a new zone
curl -X POST https://api.your-domain.com/api/v1/servers/localhost/zones \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "example.com.",
    "kind": "Native",
    "nameservers": ["ns1.example.com."]
  }'

# Add records
curl -X PATCH https://api.your-domain.com/api/v1/servers/localhost/zones/example.com. \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rrsets": [{
      "name": "www.example.com.",
      "type": "A",
      "ttl": 3600,
      "changetype": "REPLACE",
      "records": [{"content": "192.0.2.1", "disabled": false}]
    }]
  }'
```

### 3. Multi-Instance Setup

To sync zones across multiple PowerDNS servers:

1. Deploy this template on each server
2. Use **unique** `INSTANCE_ID` for each syncer (e.g., `instance-1`, `instance-2`)
3. Point all syncers to the **same S3 bucket** (shared MinIO or R2)
4. Zones will automatically sync across all instances

## Cloudflare R2 Integration

To use Cloudflare R2 instead of MinIO:

### 1. Create R2 Bucket

1. Go to Cloudflare Dashboard → R2 → Create bucket
2. Name: `lightningstream`
3. Region: Automatic

### 2. Generate R2 API Tokens

1. Go to R2 → Manage R2 API Tokens
2. Create token with Object Read & Write permissions
3. Copy Access Key ID and Secret Access Key

### 3. Update Configuration

In Dokploy environment variables:

```
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<R2_ACCESS_KEY_ID>
S3_SECRET_KEY=<R2_SECRET_ACCESS_KEY>
S3_REGION=auto
S3_BUCKET=lightningstream
```

### 4. Remove MinIO (Optional)

If using R2 exclusively, you can remove the MinIO service from docker-compose.yml to save resources.

## Port 53 Conflicts

If port 53 is already in use (common with systemd-resolved):

### Option 1: Change DNS Port

Set `DNS_PORT=5353` in Dokploy and configure clients accordingly.

### Option 2: Disable systemd-resolved

```bash
sudo systemctl disable systemd-resolved
sudo systemctl stop systemd-resolved
sudo rm /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

### Option 3: Free Port 53 Only

Edit `/etc/systemd/resolved.conf`:
```ini
[Resolve]
DNSStubListener=no
```

Then restart: `sudo systemctl restart systemd-resolved`

## Troubleshooting

### Syncer Not Starting

- Check MinIO is healthy: `https://s3.your-domain.com/`
- Verify S3 credentials are correct
- Check syncer logs in Dokploy

### Zones Not Syncing

- Verify all syncers have unique `INSTANCE_ID`
- Ensure all syncers point to the same S3 bucket
- Check syncer status endpoint for errors

### PowerDNS API Errors

- Verify `PDNS_API_KEY` matches your API requests
- Check PowerDNS logs for detailed errors
- Ensure API is enabled (`PDNS_api=yes`)

### S3 Connection Errors

- Verify endpoint URL format (include protocol)
- Check access key and secret are correct
- For R2: ensure region is set to `auto`

## Resource Requirements

| Component | Memory | CPU |
|-----------|--------|-----|
| authoritative | 128MB | 0.25 cores |
| syncer | 128MB | 0.25 cores |
| minio | 256MB | 0.25 cores |
| **Total** | ~512MB | ~0.75 cores |

**Note**: Resource usage scales with zone count and sync frequency.

## Security Considerations

- Enable HTTPS for all endpoints (automatic with Traefik)
- Use strong, unique S3 credentials
- Restrict PowerDNS API access via API key
- Consider firewall rules for DNS port
- Regularly rotate credentials
- Use Cloudflare R2 for encrypted-at-rest storage

## Related Templates

| Template | Description |
|----------|-------------|
| `powerdns` | Complete DNS infrastructure (no sync) |
| `powerdns-admin` | Web UI for PowerDNS management |
| `pda-next` | Next-gen PowerDNS Admin (beta) |

## Links

- [Lightning Stream GitHub](https://github.com/PowerDNS/lightningstream)
- [PowerDNS Documentation](https://doc.powerdns.com/)
- [PowerDNS LMDB Backend](https://doc.powerdns.com/authoritative/backends/lmdb.html)
- [MinIO Documentation](https://min.io/docs/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)

## Version

- **Template**: 1.0.0
- **Lightning Stream**: 0.5.1
- **PowerDNS Authoritative**: 4.9.3
- **MinIO**: RELEASE.2024-12-18T13-15-44Z
