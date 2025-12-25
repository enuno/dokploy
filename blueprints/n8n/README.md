# n8n - Workflow Automation Platform

n8n is a self-hosted workflow automation platform, similar to Zapier or Make, with 400+ integrations and a visual workflow editor. Build complex automations connecting APIs, databases, and services without vendor lock-in.

## Features

- **Visual Workflow Editor**: Drag-and-drop interface for building automations
- **400+ Integrations**: Connect to popular services (Google, Slack, GitHub, databases, APIs)
- **Self-Hosted**: Full control over your data and workflows
- **Code When Needed**: Add JavaScript/Python code nodes for custom logic
- **Webhooks**: Trigger workflows from external events
- **Scheduling**: Run workflows on cron schedules
- **Error Handling**: Built-in retry logic and error workflows
- **Version Control**: Export/import workflows as JSON

## Architecture

```
                                    INTERNET
                                        │
                                        ▼
                               ┌─────────────────┐
                               │    Traefik      │
                               │   (HTTPS/SSL)   │
                               └────────┬────────┘
                                        │
┌───────────────────────────────────────┼────────────────────────────────────────┐
│                         dokploy-network                                         │
│                                       │                                         │
│  ┌────────────────────────────────────┼───────────────────────────────────────┐│
│  │                             n8n-net│(internal)                             ││
│  │                                    │                                        ││
│  │  ┌─────────────────────────────────▼────────────────────────────────────┐  ││
│  │  │                              n8n                                      │  ││
│  │  │                                                                       │  ││
│  │  │  docker.n8n.io/n8nio/n8n:2.1.4                                       │  ││
│  │  │  Port: 5678                                                          │  ││
│  │  │                                                                       │  ││
│  │  │  Features:                                                           │  ││
│  │  │  - Visual workflow editor                                            │  ││
│  │  │  - Webhook endpoints                                                 │  ││
│  │  │  - Task runners (v1.60+)                                             │  ││
│  │  │  - Built-in user management                                          │  ││
│  │  │                                                                       │  ││
│  │  └────────────────────────────────┬─────────────────────────────────────┘  ││
│  │                                   │                                         ││
│  │                                   │ DB Connection                           ││
│  │                                   │                                         ││
│  │  ┌────────────────────────────────▼─────────────────────────────────────┐  ││
│  │  │                           postgres                                    │  ││
│  │  │                                                                       │  ││
│  │  │  PostgreSQL 16 Alpine                                                │  ││
│  │  │  Port: 5432 (internal only)                                          │  ││
│  │  │                                                                       │  ││
│  │  │  Stores:                                                             │  ││
│  │  │  - Workflow definitions                                              │  ││
│  │  │  - Execution history                                                 │  ││
│  │  │  - User accounts                                                     │  ││
│  │  │  - Credentials (encrypted)                                           │  ││
│  │  │                                                                       │  ││
│  │  └──────────────────────────────────────────────────────────────────────┘  ││
│  │                                                                             ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| n8n | docker.n8n.io/n8nio/n8n:2.1.4 | 5678 | Workflow automation platform |
| n8n-task-runner | n8nio/runners:2.1.4 | - | Isolated execution environment for Code nodes |
| postgres | postgres:16-alpine | 5432 | Database for workflows and credentials |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- (Optional) SMTP server for email notifications

## Configuration Variables

### Required

| Variable | Description |
|----------|-------------|
| `N8N_DOMAIN` | Domain for n8n (e.g., `n8n.example.com`) |
| `POSTGRES_PASSWORD` | PostgreSQL database password |
| `N8N_ENCRYPTION_KEY` | Key for encrypting stored credentials |

### Optional - Database

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `n8n` | PostgreSQL database name |
| `POSTGRES_USER` | `n8n` | PostgreSQL username |

### Optional - Security

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_BASIC_AUTH_ACTIVE` | `false` | Enable HTTP basic auth (use n8n's built-in user system instead) |
| `N8N_BASIC_AUTH_USER` | - | Basic auth username |
| `N8N_BASIC_AUTH_PASSWORD` | - | Basic auth password |

### Optional - Performance

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_RUNNERS_ENABLED` | `true` | Enable task runners (recommended for n8n 1.60+) |
| `EXECUTIONS_DATA_PRUNE` | `true` | Auto-prune old execution data |
| `EXECUTIONS_DATA_MAX_AGE` | `336` | Keep execution data for N hours (14 days) |
| `TZ` | `UTC` | Timezone for scheduling |

### Optional - Email

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_EMAIL_MODE` | `smtp` | Email sending mode |
| `N8N_SMTP_HOST` | - | SMTP server hostname |
| `N8N_SMTP_PORT` | `587` | SMTP server port |
| `N8N_SMTP_USER` | - | SMTP username |
| `N8N_SMTP_PASS` | - | SMTP password |
| `N8N_SMTP_SENDER` | - | Sender email address |
| `N8N_SMTP_SSL` | `true` | Enable SSL/TLS |

### Optional - External Storage (Cloudflare R2)

| Variable | Default | Description |
|----------|---------|-------------|
| `N8N_AVAILABLE_BINARY_DATA_MODES` | `filesystem` | Available storage modes (comma-separated) |
| `N8N_DEFAULT_BINARY_DATA_MODE` | `filesystem` | Default storage mode (`filesystem` or `s3`) |
| `N8N_EXTERNAL_STORAGE_S3_HOST` | - | Cloudflare R2 endpoint URL |
| `N8N_EXTERNAL_STORAGE_S3_BUCKET_NAME` | - | R2 bucket name |
| `N8N_EXTERNAL_STORAGE_S3_BUCKET_REGION` | `auto` | Region (use `auto` for R2) |
| `N8N_EXTERNAL_STORAGE_S3_ACCESS_KEY` | - | R2 Access Key ID |
| `N8N_EXTERNAL_STORAGE_S3_ACCESS_SECRET` | - | R2 Secret Access Key |

## Deployment

### 1. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure required variables (domain, passwords)
4. Deploy the stack

### 2. Create Admin Account

1. Navigate to `https://your-domain/`
2. You'll be prompted to create the first admin account
3. Complete the setup wizard

### 3. Verify Installation

```bash
# Check n8n is responding
curl -I https://your-domain/healthz

# Should return HTTP 200
```

## First-Time Setup

### Creating Your First Workflow

1. Log in to n8n
2. Click "New Workflow"
3. Use the visual editor to add nodes:
   - **Trigger**: Manual, Webhook, Schedule, or Service-specific
   - **Actions**: Connect services, transform data, send notifications
4. Test with "Execute Workflow"
5. Activate for continuous operation

### Common Workflow Patterns

**Webhook to Slack:**
```
[Webhook] → [Slack: Send Message]
```

**Scheduled Report:**
```
[Schedule Trigger] → [Database Query] → [Email: Send]
```

**Multi-Step Automation:**
```
[GitHub: New Issue] → [OpenAI: Analyze] → [Jira: Create Task] → [Slack: Notify]
```

## Backup and Recovery

### Critical Data to Backup

1. **N8N_ENCRYPTION_KEY** - Without this, all stored credentials are unrecoverable
2. **postgres-data volume** - Contains all workflows, credentials, and execution history

### Backup Commands

```bash
# Backup PostgreSQL database
docker compose exec postgres pg_dump -U n8n n8n > n8n_backup.sql

# Backup n8n data directory
docker compose cp n8n:/home/node/.n8n ./n8n-backup

# Export workflows (via API)
curl -u admin:password https://your-domain/api/v1/workflows > workflows.json
```

### Recovery

```bash
# Restore PostgreSQL
cat n8n_backup.sql | docker compose exec -T postgres psql -U n8n n8n

# Restore n8n data
docker compose cp ./n8n-backup/. n8n:/home/node/.n8n
```

## Integrations

### Popular Integrations

- **Communication**: Slack, Discord, Telegram, Email
- **Development**: GitHub, GitLab, Jira, Linear
- **Cloud**: AWS, Google Cloud, Azure
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis
- **AI**: OpenAI, Anthropic Claude, Google AI
- **CRM**: HubSpot, Salesforce, Pipedrive
- **Files**: Google Drive, Dropbox, S3

### Custom Integrations

n8n supports HTTP Request nodes for any REST API:

```
[HTTP Request Node]
- Method: POST
- URL: https://api.example.com/endpoint
- Headers: Authorization: Bearer ${token}
- Body: JSON payload
```

## Cloudflare R2 External Storage

Store workflow binary data (file uploads, images, etc.) in Cloudflare R2 instead of Docker volumes for scalability and reduced storage costs.

### Benefits

- **Scalable Storage**: No Docker volume size limits
- **Cost-Effective**: Cloudflare R2 has no egress fees
- **Backup-Friendly**: R2 buckets are easier to backup than Docker volumes
- **Multi-Instance**: Share storage across multiple n8n instances

### Setup Guide

#### 1. Create Cloudflare R2 Bucket

1. Go to Cloudflare Dashboard → R2
2. Create a new bucket (e.g., `n8n-storage`)
3. Note your Account ID from the R2 overview page

#### 2. Generate R2 API Tokens

1. In R2, click "Manage R2 API Tokens"
2. Create API Token with:
   - **Permissions**: Object Read & Write
   - **Bucket**: Your n8n bucket
3. Save the **Access Key ID** and **Secret Access Key**

#### 3. Configure n8n Environment Variables

Add these variables in Dokploy:

```bash
# Enable S3 storage mode
N8N_AVAILABLE_BINARY_DATA_MODES=filesystem,s3
N8N_DEFAULT_BINARY_DATA_MODE=s3

# R2 Configuration
N8N_EXTERNAL_STORAGE_S3_HOST=https://<your-account-id>.r2.cloudflarestorage.com
N8N_EXTERNAL_STORAGE_S3_BUCKET_NAME=n8n-storage
N8N_EXTERNAL_STORAGE_S3_BUCKET_REGION=auto
N8N_EXTERNAL_STORAGE_S3_ACCESS_KEY=<your-access-key-id>
N8N_EXTERNAL_STORAGE_S3_ACCESS_SECRET=<your-secret-access-key>
```

Replace `<your-account-id>`, `<your-access-key-id>`, and `<your-secret-access-key>` with your actual values.

#### 4. Redeploy n8n

After adding the environment variables, redeploy the n8n service to apply the changes.

### Important Notes

- **Compatibility**: R2 is S3-compatible but not officially supported by n8n
- **Migration**: Existing workflow files won't automatically migrate - new uploads will go to R2
- **Endpoint Format**: Always use `https://<account-id>.r2.cloudflarestorage.com` (not custom domains)
- **Region**: Use `auto` for R2 (doesn't require specific regions)

### Testing R2 Configuration

1. Create a workflow with a file upload
2. Upload a test file
3. Check your R2 bucket - you should see the file stored there

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| n8n | 0.5 | 1GB | 1GB (data) |
| postgres | 0.25 | 512MB | 1GB (database) |
| **Total** | **0.75** | **1.5GB** | **2GB** |

Storage grows with workflow count and execution history.

## Security Considerations

### Encryption Key

The `N8N_ENCRYPTION_KEY` encrypts all stored credentials (API keys, passwords, OAuth tokens). **This key is critical**:

- ✅ Back it up securely (password manager, vault)
- ❌ Never commit it to git
- ❌ If lost, all credentials must be re-entered

### Network Security

- n8n runs behind Traefik with HTTPS/TLS
- PostgreSQL only accessible within Docker network
- Webhook endpoints are public (use with care)

### User Management

n8n has built-in user management:
- Create accounts with email/password
- Assign roles (Owner, Admin, Member)
- Share workflows with specific users

## Troubleshooting

### n8n Won't Start

1. Check database connectivity:
   ```bash
   docker compose logs postgres
   ```

2. Verify environment variables are set:
   ```bash
   docker compose config
   ```

3. Check n8n logs:
   ```bash
   docker compose logs n8n
   ```

### Webhooks Not Receiving

1. Verify webhook URL is correct:
   ```
   https://your-domain/webhook/xxxxx
   ```

2. Check firewall/DNS is configured

3. Ensure workflow is activated (not just saved)

### Credentials Error

1. If you see "Couldn't decrypt credentials":
   - `N8N_ENCRYPTION_KEY` may have changed
   - Restore from backup or re-enter credentials

### Performance Issues

1. Prune old executions:
   ```bash
   docker compose exec postgres psql -U n8n n8n -c "DELETE FROM execution_entity WHERE started_at < NOW() - INTERVAL '7 days';"
   ```

2. Increase memory limit in docker-compose.yml

3. Enable task runners (N8N_RUNNERS_ENABLED=true)

## Upgrading

### Minor Version Upgrade

```bash
# Pull new image
docker compose pull

# Restart services
docker compose up -d

# Verify health
docker compose ps
```

### Major Version Upgrade

1. Backup database and n8n data
2. Read n8n release notes for breaking changes
3. Update image tag in docker-compose.yml
4. Deploy and test

## Related Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community](https://community.n8n.io/)
- [n8n GitHub](https://github.com/n8n-io/n8n)
- [Workflow Templates](https://n8n.io/workflows/)
- [Integration Guides](https://docs.n8n.io/integrations/)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
