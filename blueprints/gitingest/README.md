# GitIngest - Turn Git Repos into LLM-Friendly Text Digests

GitIngest transforms any Git repository into a structured, LLM-friendly text digest. Simply replace "github" with "ingest" in any GitHub URL, or use your self-hosted instance to convert repositories into prompts perfect for AI assistants.

## Features

- **LLM-Optimized Output**: Structured text digests ideal for Claude, GPT, and other LLMs
- **URL Magic**: Replace `github.com` with your domain in any repo URL
- **Private Repos**: Access private repositories with GitHub token
- **Stats & Insights**: File structure, token counts, and size estimates
- **S3 Caching**: Optional Cloudflare R2 integration for digest caching
- **Stateless Design**: No database required, horizontally scalable

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  gitingest-net (internal)                │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                    gitingest                        │ │
│  │                     :8000                           │ │
│  │                                                     │ │
│  │  ┌─────────────┐        ┌─────────────────────┐    │ │
│  │  │  Git Clone  │───────▶│  Digest Generator   │    │ │
│  │  └─────────────┘        └──────────┬──────────┘    │ │
│  │                                    │               │ │
│  │                         ┌──────────▼──────────┐    │ │
│  │                         │  Cloudflare R2      │    │ │
│  │                         │  (optional cache)   │    │ │
│  │                         └─────────────────────┘    │ │
│  └────────────────────────────────────────────────────┘ │
│                              │                          │
└──────────────────────────────┼──────────────────────────┘
                               │
                 dokploy-network
                               │
                       ┌───────┴───────┐
                       │    traefik    │
                       └───────────────┘
                               │
                               ▼
              https://ingest.example.com/user/repo
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| GitIngest | ghcr.io/coderamp-labs/gitingest:v0.3.1 | 8000 | Web app & digest generator |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- (Optional) GitHub token for private repositories
- (Optional) Cloudflare R2 bucket for digest caching

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GITINGEST_DOMAIN` | Domain for GitIngest | `ingest.example.com` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GITHUB_TOKEN` | - | GitHub PAT for private repos |
| `S3_ENDPOINT` | - | Cloudflare R2 endpoint |
| `S3_ACCESS_KEY` | - | R2 access key |
| `S3_SECRET_KEY` | - | R2 secret key |
| `S3_BUCKET_NAME` | `gitingest` | R2 bucket name |
| `S3_REGION` | `auto` | S3 region |
| `S3_ALIAS_HOST` | - | Public CDN URL for cached digests |
| `METRICS_ENABLED` | `false` | Enable Prometheus metrics |
| `SENTRY_DSN` | - | Sentry error tracking DSN |

## Deployment

### 1. DNS Configuration

Create a DNS record:
```
ingest.example.com → Your Dokploy Server IP
```

### 2. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure your domain
4. Deploy the stack

### 3. Access GitIngest

Navigate to `https://ingest.example.com` and start converting repos!

## Usage

### Web Interface

1. Go to `https://ingest.example.com`
2. Enter a GitHub repository URL
3. Click "Ingest" to generate the digest

### URL Replacement

Replace `github.com` with your domain:

```
Original:  https://github.com/anthropics/claude-code
GitIngest: https://ingest.example.com/anthropics/claude-code
```

### Private Repositories

Set `GITHUB_TOKEN` in your environment to access private repos:

1. Generate a token at https://github.com/settings/tokens
2. Add to Dokploy environment: `GITHUB_TOKEN=ghp_your_token`
3. Redeploy

## Cloudflare R2 Setup (Optional)

For persistent digest caching using Cloudflare R2:

### 1. Create R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Create bucket named `gitingest`
3. Note your Account ID

### 2. Create API Token

1. Go to R2 → Manage R2 API Tokens
2. Create token with read/write permissions
3. Save Access Key ID and Secret Access Key

### 3. Configure Environment

```toml
S3_ENDPOINT = "https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
S3_ACCESS_KEY = "your-access-key-id"
S3_SECRET_KEY = "your-secret-access-key"
S3_BUCKET_NAME = "gitingest"
S3_REGION = "auto"
```

### 4. Optional: Public CDN

If you want cached digests accessible via public URL:

1. Enable public access on your R2 bucket
2. Set custom domain (e.g., `cdn.example.com`)
3. Configure: `S3_ALIAS_HOST = "cdn.example.com"`

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| GitIngest | 0.25 | 256MB | Minimal |

GitIngest is extremely lightweight - a single container with no database dependencies.

## Troubleshooting

### 502 Bad Gateway

1. Check container is running:
   ```bash
   docker compose ps
   ```

2. Check container logs:
   ```bash
   docker compose logs gitingest
   ```

### Private Repo Access Denied

1. Verify GITHUB_TOKEN is set correctly
2. Check token has `repo` scope
3. Ensure token hasn't expired

### S3 Upload Failures

1. Verify R2 credentials are correct
2. Check bucket exists and is accessible
3. Verify endpoint URL format:
   ```
   https://ACCOUNT_ID.r2.cloudflarestorage.com
   ```

### Health Check Failing

The health endpoint is `/health`. If failing:

1. Check container logs for startup errors
2. Verify port 8000 is accessible internally
3. Increase `start_period` if container needs more startup time

## Scaling

GitIngest is stateless by design. To handle more traffic:

1. **Horizontal Scaling**: Deploy multiple instances behind a load balancer
2. **Enable R2 Caching**: Reduces repeated digest generation
3. **Use CDN**: Put Cloudflare in front for edge caching

## Security Considerations

- **No Persistent Storage**: Digests are generated on-demand (unless R2 enabled)
- **GitHub Token**: Store securely, use minimal scopes
- **Network Isolation**: App runs on internal network, only exposed via Traefik
- **HTTPS**: Enforced via LetsEncrypt

## Related Resources

- [GitIngest GitHub](https://github.com/coderamp-labs/gitingest)
- [GitIngest Website](https://gitingest.com/)
- [Chrome Extension](https://chromewebstore.google.com/detail/gitingest-turn-any-git-re/adfjahbijlkjfoicpjkhjicpjpjfaood)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
