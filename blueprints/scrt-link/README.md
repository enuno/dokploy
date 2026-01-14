# Scrt.link

End-to-end encrypted ephemeral secret sharing with self-destructing links.

## Overview

[Scrt.link](https://github.com/stophecom/scrt-link-v2) is an open-source platform for sharing sensitive information online securely. Secrets are end-to-end encrypted and automatically expire after being viewed or after a set time period. Built with SvelteKit and PostgreSQL.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    Scrt.link Stack                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│              ┌───────────────────────┐                           │
│              │      scrt-link        │                           │
│              │     (SvelteKit)       │                           │
│              │       :3000           │                           │
│              └───────────┬───────────┘                           │
│                          │                                       │
│          ┌───────────────┼───────────────┐                       │
│          │               │               │                       │
│          ▼               ▼               ▼                       │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│   │  PostgreSQL │ │Cloudflare R2│ │   Resend    │               │
│   │  (database) │ │ (storage)   │ │  (email)    │               │
│   │   :5432     │ │ (external)  │ │ (external)  │               │
│   └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                   │
│   dokploy-network ──▶ Traefik ──▶ HTTPS                          │
│                                                                   │
│   Optional Integrations:                                          │
│   ├── Google OAuth (authentication)                               │
│   ├── Stripe (payments/subscriptions)                             │
│   ├── reCAPTCHA (spam protection)                                 │
│   └── imgix (image CDN)                                           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Features

- **End-to-End Encryption**: Secrets encrypted in browser before transmission
- **Self-Destructing Links**: Secrets deleted after first view or expiration
- **Multiple Secret Types**: Text, redirect URLs, and neogram messages
- **Password Protection**: Optional additional password layer
- **File Attachments**: Upload encrypted files with S3 storage
- **API Access**: Programmatic secret creation
- **User Authentication**: Email/password and Google OAuth
- **Internationalization**: Multi-language support via Paraglide.js
- **White-Label Support**: Custom domains and branding

## Prerequisites

- Domain name with DNS configured
- Docker image (see Building the Image section)
- Cloudflare R2 bucket (for file attachments)
- Resend API key (for email notifications)

## Building the Image

**Important:** No official Docker image is published. You must build it yourself.

### Option 1: Build from Git URL

```bash
# Build directly from GitHub
docker build -t your-registry/scrt-link:latest \
  https://github.com/stophecom/scrt-link-v2.git

# Push to your registry
docker push your-registry/scrt-link:latest
```

### Option 2: Clone and Build

```bash
# Clone repository
git clone https://github.com/stophecom/scrt-link-v2.git
cd scrt-link-v2

# Build image
docker build -t your-registry/scrt-link:latest .

# Push to your registry
docker push your-registry/scrt-link:latest
```

### Option 3: Use Dokploy Git Deployment

Instead of using this compose template, create a new Application in Dokploy:
1. Select "Git" as source
2. Enter repository URL: `https://github.com/stophecom/scrt-link-v2`
3. Dokploy will build from the included Dockerfile

## Quick Start

1. Build and push the Docker image (see above)
2. Deploy this template in Dokploy
3. Set `SCRT_LINK_IMAGE` to your built image
4. Set your domain (e.g., `secrets.example.com`)
5. Configure Cloudflare R2 for file storage
6. Access the service at `https://secrets.example.com`

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `DOMAIN` | Your domain name |
| `SCRT_LINK_IMAGE` | Docker image URL (you must build this) |
| `POSTGRES_PASSWORD` | Database password (auto-generated) |
| `RATE_LIMIT_SECRET` | Rate limiting cookie secret (auto-generated) |
| `CRON_SECRET` | Secret for cleanup cron jobs (auto-generated) |

### Cloudflare R2 Variables (Required for File Attachments)

| Variable | Description |
|----------|-------------|
| `S3_ENDPOINT` | R2 endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `S3_BUCKET` | R2 bucket name for file storage |
| `S3_CDN_BUCKET` | R2 bucket name for CDN (can be same as S3_BUCKET) |
| `S3_ACCESS_KEY` | R2 Access Key ID |
| `S3_SECRET_KEY` | R2 Secret Access Key |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RESEND_API_KEY` | - | Resend API key for email notifications |
| `GOOGLE_CLIENT_ID` | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | - | Google OAuth client secret |
| `RECAPTCHA_CLIENT_KEY` | - | reCAPTCHA v3 site key |
| `RECAPTCHA_SERVER_KEY` | - | reCAPTCHA v3 secret key |
| `STRIPE_PUBLISHABLE_KEY` | - | Stripe publishable key |
| `STRIPE_SECRET_KEY` | - | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | - | Stripe webhook secret |
| `IMGIX_CDN_URL` | - | imgix CDN URL for images |

## Services

| Service | Description | Ports |
|---------|-------------|-------|
| **scrt-link** | Main application (SvelteKit) | 3000 |
| **postgres** | PostgreSQL database | 5432 (internal) |

## Exposed Endpoints

| Subdomain | Service | Description |
|-----------|---------|-------------|
| `${DOMAIN}` | scrt-link | Main web interface |

## Cloudflare R2 Setup

This template uses Cloudflare R2 for S3-compatible object storage.

### 1. Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 → Overview
2. Click "Create bucket"
3. Name your bucket (e.g., `scrt-link-files`)
4. Note the bucket name for configuration

### 2. Create R2 API Token

1. Go to R2 → Overview → Manage R2 API Tokens
2. Click "Create API token"
3. Set permissions: "Object Read & Write"
4. Optionally restrict to specific bucket
5. Copy the Access Key ID and Secret Access Key

### 3. Get Your Account ID

Your Cloudflare Account ID is visible in the URL when viewing R2:
```
https://dash.cloudflare.com/<ACCOUNT_ID>/r2/overview
```

### 4. Configure Environment Variables

```
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_BUCKET=scrt-link-files
S3_CDN_BUCKET=scrt-link-files
S3_ACCESS_KEY=<ACCESS_KEY_ID>
S3_SECRET_KEY=<SECRET_ACCESS_KEY>
```

### 5. Configure CORS (Optional)

If you need direct browser uploads, add CORS policy to your R2 bucket:

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## Email Setup (Resend)

Email is required for user registration and notifications.

### 1. Create Resend Account

1. Go to [Resend](https://resend.com) and create an account
2. Verify your domain for sending emails

### 2. Create API Key

1. Go to Resend Dashboard → API Keys
2. Create a new API key
3. Copy the key for configuration

### 3. Configure

```
RESEND_API_KEY=re_xxxxxxxxx
```

## Google OAuth Setup (Optional)

Enable "Sign in with Google" for user authentication.

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to APIs & Services → Credentials
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `https://${DOMAIN}/login/google/callback`

### 2. Configure

```
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxx
```

## Stripe Setup (Optional)

Enable premium subscriptions and paid API access.

### 1. Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your Publishable key and Secret key

### 2. Create Webhook

1. Go to Developers → Webhooks
2. Add endpoint: `https://${DOMAIN}/api/stripe/webhook`
3. Select events to listen for
4. Copy the Webhook signing secret

### 3. Configure

```
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx
```

## Post-Deployment Setup

### 1. Verify Services

Check that all services are healthy:
- Main app: `https://your-domain.com`
- Health check should return 200 OK

### 2. Initialize Database

The application automatically runs database migrations on startup using Drizzle ORM.

### 3. Set Up Cleanup Cron Job

Scrt.link needs periodic cleanup of expired secrets. Set up a cron job to call:

```bash
# Every hour
curl -X POST https://your-domain.com/api/cron/cleanup \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

Or use an external cron service like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- Cloudflare Workers Cron Triggers

### 4. Test Secret Creation

1. Visit `https://your-domain.com`
2. Create a test secret
3. Open the generated link in a new browser
4. Verify the secret is displayed and then deleted

## Troubleshooting

### Image Not Found

If you see "image not found" errors:
- Ensure you've built and pushed the Docker image
- Verify the `SCRT_LINK_IMAGE` variable is set correctly
- Check your registry credentials if using a private registry

### Database Connection Failed

- Verify PostgreSQL is healthy: check Dokploy logs
- Ensure `POSTGRES_PASSWORD` matches between services
- Check network connectivity between services

### S3/R2 Upload Errors

- Verify R2 credentials are correct
- Check bucket permissions (Object Read & Write)
- Ensure endpoint URL format is correct: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- For CORS errors, add appropriate CORS policy to bucket

### Email Not Sending

- Verify Resend API key is valid
- Check domain verification in Resend dashboard
- Review Resend logs for delivery issues

### OAuth Login Fails

- Verify redirect URI matches exactly: `https://${DOMAIN}/login/google/callback`
- Check Google Cloud Console for error logs
- Ensure OAuth consent screen is configured

## Resource Requirements

| Component | Memory | CPU |
|-----------|--------|-----|
| scrt-link | 256MB | 0.5 cores |
| postgres | 256MB | 0.25 cores |
| **Total** | ~512MB | ~0.75 cores |

**Note**: Resource usage scales with traffic and number of stored secrets.

## Security Considerations

- **End-to-end encryption**: Secrets encrypted client-side before transmission
- **Zero-knowledge server**: Server cannot read secret contents
- **Automatic cleanup**: Expired secrets removed via cron jobs
- **Rate limiting**: Built-in protection against abuse
- **CSRF protection**: Enabled by default in production builds
- **Use strong secrets**: All auto-generated secrets use cryptographically secure randomness
- **Enable reCAPTCHA**: Recommended for public instances
- **Cloudflare R2**: Data encrypted at rest

## Related Templates

| Template | Description |
|----------|-------------|
| `paaster` | End-to-end encrypted pastebin |
| `padloc` | Zero-knowledge password manager |
| `chibisafe` | File upload and sharing platform |

## Links

- [Scrt.link GitHub](https://github.com/stophecom/scrt-link-v2)
- [Live Demo](https://scrt.link)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Resend Documentation](https://resend.com/docs)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)

## Version

- **Template**: 1.0.0
- **Scrt.link**: v2 (build from source)
- **PostgreSQL**: 16-alpine
