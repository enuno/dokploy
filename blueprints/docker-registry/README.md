# Docker Registry - OCI Distribution Implementation

A self-hosted Docker/OCI container registry implementing the OCI Distribution Specification. Store and distribute container images privately with optional Cloudflare R2 storage backend.

## Features

- **OCI Compliant**: Full OCI Distribution Specification implementation
- **Storage Flexibility**: Local filesystem or S3-compatible storage (Cloudflare R2)
- **Garbage Collection**: Built-in image cleanup and deletion support
- **High Performance**: Used by Docker Hub, GitHub Container Registry, and more
- **Simple API**: Standard Docker registry v2 API
- **Lightweight**: Single container, no database required

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   registry-net (internal)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                      registry                           │ │
│  │                       :5000                             │ │
│  │                                                         │ │
│  │  ┌─────────────────┐      ┌──────────────────────────┐ │ │
│  │  │  OCI API        │      │  Storage Backend         │ │ │
│  │  │  /v2/*          │─────▶│  - Filesystem (local)    │ │ │
│  │  └─────────────────┘      │  - Cloudflare R2 (S3)    │ │ │
│  │                           └──────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │
                 dokploy-network
                               │
                       ┌───────┴───────┐
                       │    traefik    │
                       └───────────────┘
                               │
                               ▼
            https://registry.example.com/v2/
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| Registry | registry:3.0.0 | 5000 | OCI Distribution API |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- (Optional) Cloudflare R2 bucket for image storage

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REGISTRY_DOMAIN` | Domain for the registry | `registry.example.com` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DELETE_ENABLED` | `true` | Enable image deletion |
| `LOG_LEVEL` | `info` | Log level (debug/info/warn/error) |
| `LOG_FORMATTER` | `text` | Log format (text/json) |

### Cloudflare R2 Storage Variables

**Important**: To use S3/R2 storage, add ALL of these variables via Dokploy's Environment UI:

| Variable | Value | Description |
|----------|-------|-------------|
| `REGISTRY_STORAGE` | `s3` | **Required** - switches from filesystem to S3 |
| `REGISTRY_STORAGE_S3_REGIONENDPOINT` | `https://ACCOUNT_ID.r2.cloudflarestorage.com` | R2 endpoint URL |
| `REGISTRY_STORAGE_S3_ACCESSKEY` | Your access key | R2 access key ID |
| `REGISTRY_STORAGE_S3_SECRETKEY` | Your secret key | R2 secret access key |
| `REGISTRY_STORAGE_S3_BUCKET` | `docker-registry` | Bucket name |
| `REGISTRY_STORAGE_S3_REGION` | `auto` | Region (use `auto` for R2) |
| `REGISTRY_STORAGE_S3_ROOTDIRECTORY` | `/` | Root path in bucket |
| `REGISTRY_STORAGE_S3_SECURE` | `true` | Use HTTPS |
| `REGISTRY_STORAGE_S3_V4AUTH` | `true` | Use v4 authentication |
| `REGISTRY_STORAGE_S3_CHUNKSIZE` | `5242880` | Upload chunk size (5MB) |

## Deployment

### 1. DNS Configuration

Create a DNS record:
```
registry.example.com → Your Dokploy Server IP
```

### 2. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure your domain
4. Deploy the stack

### 3. Configure Docker Client

Add the registry to your Docker daemon:

```bash
# For HTTPS (recommended)
docker login registry.example.com

# Push an image
docker tag myapp:latest registry.example.com/myapp:latest
docker push registry.example.com/myapp:latest

# Pull an image
docker pull registry.example.com/myapp:latest
```

## Cloudflare R2 Setup

For production deployments with external storage:

### 1. Create R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Create bucket named `docker-registry`
3. Note your Account ID

### 2. Create API Token

1. Go to R2 → Manage R2 API Tokens
2. Create token with read/write permissions
3. Save Access Key ID and Secret Access Key

### 3. Configure Environment

In Dokploy, go to Environment and add these variables:

```bash
REGISTRY_STORAGE=s3
REGISTRY_STORAGE_S3_REGIONENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
REGISTRY_STORAGE_S3_ACCESSKEY=your-access-key-id
REGISTRY_STORAGE_S3_SECRETKEY=your-secret-access-key
REGISTRY_STORAGE_S3_BUCKET=docker-registry
REGISTRY_STORAGE_S3_REGION=auto
REGISTRY_STORAGE_S3_ROOTDIRECTORY=/
REGISTRY_STORAGE_S3_SECURE=true
REGISTRY_STORAGE_S3_V4AUTH=true
REGISTRY_STORAGE_S3_CHUNKSIZE=5242880
```

### 4. Redeploy

Redeploy the stack to apply changes.

## Authentication Options

### Option 1: Cloudflare Zero Trust (Recommended)

Use Cloudflare Access to protect your registry:

1. Set up Cloudflare Access application
2. Configure authentication (SSO, email, etc.)
3. All registry access goes through Zero Trust

### Option 2: Basic Auth (htpasswd)

For simple username/password authentication:

1. Generate htpasswd file:
   ```bash
   docker run --rm httpd:2 htpasswd -Bbn admin yourpassword > htpasswd
   ```

2. Mount file and configure in docker-compose.yml:
   ```yaml
   volumes:
     - ./htpasswd:/auth/htpasswd:ro
   environment:
     REGISTRY_AUTH: htpasswd
     REGISTRY_AUTH_HTPASSWD_REALM: "Registry Realm"
     REGISTRY_AUTH_HTPASSWD_PATH: /auth/htpasswd
   ```

3. Login with Docker:
   ```bash
   docker login registry.example.com
   ```

## Usage Examples

### Push Image

```bash
# Tag local image
docker tag myapp:latest registry.example.com/myapp:v1.0.0

# Push to registry
docker push registry.example.com/myapp:v1.0.0
```

### Pull Image

```bash
docker pull registry.example.com/myapp:v1.0.0
```

### List Repositories

```bash
curl https://registry.example.com/v2/_catalog
```

### List Tags

```bash
curl https://registry.example.com/v2/myapp/tags/list
```

### Delete Image (if enabled)

```bash
# Get digest
DIGEST=$(curl -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
  -I https://registry.example.com/v2/myapp/manifests/v1.0.0 \
  | grep Docker-Content-Digest | cut -d' ' -f2)

# Delete
curl -X DELETE https://registry.example.com/v2/myapp/manifests/$DIGEST
```

## Garbage Collection

When using filesystem storage, run garbage collection periodically:

```bash
docker compose exec registry registry garbage-collect /etc/docker/registry/config.yml
```

For R2 storage, objects are managed automatically.

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| Registry | 0.25 | 256MB | Varies* |

*Storage depends on number and size of images. With R2, local storage is minimal.

## Troubleshooting

### Push Fails with "unauthorized"

1. Check authentication configuration
2. Verify Docker login: `docker login registry.example.com`
3. Check registry logs: `docker compose logs registry`

### Push Fails with "blob upload unknown"

1. Ensure storage is writable
2. For R2, verify bucket permissions
3. Check S3 credentials are correct

### Cannot Pull Images

1. Verify registry is accessible: `curl https://registry.example.com/v2/`
2. Check DNS resolution
3. Verify Traefik routing

### S3 Storage Not Working

1. Verify `REGISTRY_STORAGE=s3` is set
2. Check endpoint URL format (must include `https://`)
3. Verify R2 credentials and bucket exist
4. Check registry logs for S3 errors:
   ```bash
   docker compose logs registry | grep -i s3
   ```

### "Multiple Storage Drivers" Error

If you see `panic: multiple storage drivers specified`:

1. This means both filesystem AND S3 variables are set
2. For filesystem storage: Remove ALL `REGISTRY_STORAGE_S3_*` variables
3. For S3 storage: Set `REGISTRY_STORAGE=s3` and add all S3 variables
4. Only ONE storage driver should be configured at a time

### High Disk Usage

1. Enable garbage collection
2. Set up regular GC cron job
3. Consider using R2 for unlimited storage

## Security Considerations

- **HTTPS Only**: All traffic encrypted via LetsEncrypt
- **No Anonymous Push**: By default, anyone can push (add auth for production)
- **Network Isolation**: Registry on internal network
- **R2 Security**: Uses v4 auth signatures, encrypted in transit

## Related Resources

- [Distribution GitHub](https://github.com/distribution/distribution)
- [OCI Distribution Spec](https://github.com/opencontainers/distribution-spec)
- [Docker Registry Documentation](https://docs.docker.com/registry/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
