# Blinko - AI-Powered Personal Note-Taking Tool

A self-hosted AI-powered personal note-taking application with RAG (Retrieval-Augmented Generation) for intelligent semantic search and note management.

![Blinko Banner](https://raw.githubusercontent.com/blinkospace/blinko/main/public/og.png)

## Overview

Blinko is a modern, self-hosted note-taking application that combines traditional note management with AI-powered semantic search capabilities. Built with Next.js and PostgreSQL, it provides a fast, private, and intelligent way to capture and retrieve your thoughts.

**Key Features:**
- 🤖 **AI RAG Integration**: Semantic search powered by retrieval-augmented generation
- 📝 **Rich Note Management**: Create, organize, and tag notes with a modern UI
- 🔍 **Intelligent Search**: Find notes by meaning, not just keywords
- 🔐 **Self-Hosted & Private**: Full control over your data
- ⚡ **Fast & Responsive**: Built on Next.js for optimal performance
- 💾 **PostgreSQL Backend**: Reliable database for notes and AI embeddings

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Dokploy Environment                      │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  blinko-net (Internal)                  │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │              Blinko Service                       │  │ │
│  │  │  - Image: blinkospace/blinko:latest              │  │ │
│  │  │  - Port: 1111 (internal)                         │  │ │
│  │  │  - Volume: blinko-data (/app/.blinko)            │  │ │
│  │  │  - Health: HTTP check on localhost:1111          │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                           │                              │ │
│  │                           ▼                              │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │            PostgreSQL 16-Alpine                   │  │ │
│  │  │  - Stores notes and AI embeddings                │  │ │
│  │  │  - Volume: postgres-data (/var/lib/postgresql)   │  │ │
│  │  │  - Health: pg_isready check                      │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  └───────────────────────────┼──────────────────────────────┘ │
│                              │                                │
│  ┌───────────────────────────┼──────────────────────────────┐ │
│  │              dokploy-network (External)                  │ │
│  │                           │                              │ │
│  │                      ┌────▼────┐                         │ │
│  │                      │ Traefik │                         │ │
│  │                      │ Routing │                         │ │
│  │                      │ + SSL   │                         │ │
│  │                      └────┬────┘                         │ │
│  └───────────────────────────┼──────────────────────────────┘ │
└──────────────────────────────┼───────────────────────────────┘
                               │
                        ┌──────▼──────┐
                        │   Internet  │
                        │ (HTTPS/443) │
                        └─────────────┘
```

### Components

| Component | Purpose | Network |
|-----------|---------|---------|
| **Blinko Service** | Next.js web application with AI RAG | blinko-net + dokploy-network |
| **PostgreSQL 16** | Database for notes, metadata, and AI embeddings | blinko-net (internal only) |
| **blinko-data Volume** | Persistent storage for application data | Local volume |
| **postgres-data Volume** | Persistent storage for database | Local volume |
| **Traefik** | Reverse proxy with SSL termination | dokploy-network |

### Security

- ✅ **HTTPS Only**: All traffic encrypted via Let's Encrypt
- ✅ **Security Headers**: HSTS, XSS protection, frame deny, content-type nosniff
- ✅ **Network Isolation**: Database on internal network only
- ✅ **Authentication**: NextAuth for secure user sessions
- ✅ **Secrets Management**: All sensitive data via environment variables

## Prerequisites

- Dokploy instance running
- Domain name pointed to your server
- Docker and Docker Compose installed
- Port 443 available for HTTPS traffic

## Quick Start

### 1. Deploy via Dokploy UI

1. Navigate to your Dokploy instance
2. Go to **Templates** → **Create Template**
3. Select **Blinko** from the template list
4. Configure the required variables (see below)
5. Click **Deploy**

### 2. Configuration Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `domain` | ✅ Yes | - | Domain for accessing Blinko (e.g., `blinko.example.com`) |
| `nextauth_secret` | ✅ Yes | Auto-generated | NextAuth secret key (base64-encoded, 32 chars) |
| `postgres_password` | ✅ Yes | Auto-generated | PostgreSQL database password (32 chars) |
| `postgres_db` | No | `blinko` | PostgreSQL database name |
| `postgres_user` | No | `postgres` | PostgreSQL username |
| `tz` | No | `UTC` | Timezone for the application |

**Note**: The `nextauth_secret` and `postgres_password` are automatically generated by Dokploy during deployment for maximum security.

### 3. Post-Deployment

After deployment completes:

1. **Access your instance**: Navigate to `https://your-domain.com`
2. **Create your account**: Complete the initial user registration
3. **Start taking notes**: Begin capturing your thoughts with AI-powered search

## Configuration

### Environment Variables

The following environment variables are configured automatically via template.toml:

```yaml
# Domain Configuration
BLINKO_DOMAIN: your-domain.com          # Your custom domain
NEXTAUTH_URL: https://your-domain.com   # NextAuth callback URL
NEXT_PUBLIC_BASE_URL: https://your-domain.com  # Public API URL

# Authentication
NEXTAUTH_SECRET: <auto-generated>       # Session encryption key

# Database Connection
DATABASE_URL: postgresql://postgres:<password>@postgres:5432/blinko

# Application Settings
NODE_ENV: production                    # Production mode
TZ: UTC                                 # Timezone
```

### Customizing Settings

To modify optional settings, update the environment variables in Dokploy:

```yaml
# Change timezone
TZ: America/New_York

# Custom database name
POSTGRES_DB: my_notes_db
POSTGRES_USER: blinko_user
```

## Health Checks

Blinko includes optimized health checks for both services:

### Blinko Service
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:1111"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s  # Allows time for Next.js compilation
```

### PostgreSQL Service
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres -d blinko"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

## Security Configuration

### HTTPS & SSL

- **Certificate**: Automatic Let's Encrypt via Traefik
- **Renewal**: Automatic certificate renewal
- **Protocols**: TLS 1.2 and TLS 1.3 only

### Security Headers

The template includes comprehensive security headers via Traefik middleware:

```yaml
# HSTS (HTTP Strict Transport Security)
Strict-Transport-Security: max-age=31536000; includeSubDomains

# XSS Protection
X-XSS-Protection: 1; mode=block

# Clickjacking Protection
X-Frame-Options: DENY

# Content-Type Sniffing Protection
X-Content-Type-Options: nosniff

# Referrer Policy
Referrer-Policy: strict-origin-when-cross-origin
```

### Authentication

Blinko uses NextAuth for secure authentication:
- Session-based authentication with HTTP-only cookies
- CSRF protection enabled
- Secure session encryption via NEXTAUTH_SECRET

## AI Features

### Semantic Search

Blinko's AI-powered semantic search allows you to:
- Find notes by meaning, not just keywords
- Discover related notes automatically
- Search across all your notes with natural language queries

### RAG (Retrieval-Augmented Generation)

The RAG system:
- Stores note embeddings in PostgreSQL
- Enables context-aware search results
- Improves search accuracy over time

## Data Management

### Backup

Regular backups are recommended:

```bash
# Backup PostgreSQL database
docker exec $(docker ps -q -f name=postgres) pg_dump -U postgres blinko > blinko-backup-$(date +%Y%m%d).sql

# Backup application data
docker run --rm -v blinko_blinko-data:/data -v $(pwd):/backup alpine tar czf /backup/blinko-data-$(date +%Y%m%d).tar.gz /data
```

### Restore

To restore from backup:

```bash
# Restore PostgreSQL database
cat blinko-backup-20231225.sql | docker exec -i $(docker ps -q -f name=postgres) psql -U postgres blinko

# Restore application data
docker run --rm -v blinko_blinko-data:/data -v $(pwd):/backup alpine tar xzf /backup/blinko-data-20231225.tar.gz -C /
```

## Troubleshooting

### Issue: Blinko shows blank page after deployment

**Symptoms**: White/blank page after accessing domain

**Solution**:
1. Check if containers are running:
   ```bash
   docker ps | grep blinko
   ```
2. Check Blinko logs:
   ```bash
   docker logs $(docker ps -q -f name=blinko_blinko)
   ```
3. Verify environment variables are set:
   ```bash
   docker exec $(docker ps -q -f name=blinko_blinko) env | grep -E "NEXTAUTH|DATABASE"
   ```

### Issue: Database connection errors

**Symptoms**: "Connection refused" or "database does not exist" errors

**Solution**:
1. Verify PostgreSQL is healthy:
   ```bash
   docker ps | grep postgres
   ```
2. Check PostgreSQL logs:
   ```bash
   docker logs $(docker ps -q -f name=postgres)
   ```
3. Verify health check status:
   ```bash
   docker inspect $(docker ps -q -f name=postgres) | grep -A 10 Health
   ```

### Issue: 502 Bad Gateway

**Symptoms**: Nginx/Traefik returns 502 error

**Solution**:
1. Check if Blinko container is running:
   ```bash
   docker ps | grep blinko
   ```
2. Verify health check status:
   ```bash
   docker inspect $(docker ps -q -f name=blinko_blinko) | grep -A 10 Health
   ```
3. Check container is on both networks:
   ```bash
   docker inspect $(docker ps -q -f name=blinko_blinko) | grep -A 10 Networks
   ```
4. Verify Traefik routing:
   ```bash
   docker logs $(docker ps -q -f name=traefik)
   ```

### Issue: Authentication not working

**Symptoms**: Cannot log in or session expires immediately

**Solution**:
1. Verify NEXTAUTH_SECRET is set:
   ```bash
   docker exec $(docker ps -q -f name=blinko_blinko) env | grep NEXTAUTH_SECRET
   ```
2. Check NEXTAUTH_URL matches your domain:
   ```bash
   docker exec $(docker ps -q -f name=blinko_blinko) env | grep NEXTAUTH_URL
   ```
3. Clear browser cookies and try again

### Issue: AI search not working

**Symptoms**: Semantic search returns no results or errors

**Solution**:
1. Check database connection is working
2. Verify sufficient disk space for embeddings:
   ```bash
   docker exec $(docker ps -q -f name=postgres) df -h /var/lib/postgresql/data
   ```
3. Check application logs for AI-related errors

## Maintenance

### Update Blinko

To update to a newer version:

1. Pull the latest image:
   ```bash
   docker pull blinkospace/blinko:latest
   ```
2. Redeploy via Dokploy UI
3. Verify data persists (stored in volumes)

**Note**: Blinko is in active development. Always backup your data before updating.

### Volume Management

Blinko uses persistent volumes for data:

```bash
# List volumes
docker volume ls | grep blinko

# Inspect volume
docker volume inspect blinko_blinko-data
docker volume inspect blinko_postgres-data

# Backup all volumes
docker run --rm -v blinko_blinko-data:/data -v $(pwd):/backup alpine tar czf /backup/all-volumes.tar.gz /data
```

### Database Maintenance

Periodic database maintenance:

```bash
# Vacuum database
docker exec $(docker ps -q -f name=postgres) psql -U postgres blinko -c "VACUUM ANALYZE;"

# Check database size
docker exec $(docker ps -q -f name=postgres) psql -U postgres blinko -c "SELECT pg_database_size('blinko');"
```

## Resources

### Official Documentation
- **GitHub Repository**: https://github.com/blinkospace/blinko
- **Demo**: (Check official repository for live demos)

### Docker Image
- **Docker Hub**: https://hub.docker.com/r/blinkospace/blinko

### Community
- **GitHub Issues**: https://github.com/blinkospace/blinko/issues
- **GitHub Discussions**: https://github.com/blinkospace/blinko/discussions

### Related Projects
- **Obsidian**: Desktop-first markdown note-taking
- **Notion**: All-in-one workspace
- **Joplin**: Open-source note-taking with sync

## Template Information

- **Template Version**: 1.0.0
- **Blinko Version**: latest (active development)
- **Created**: December 2025
- **Maintainer**: Dokploy Community
- **License**: Check upstream Blinko project for licensing

## Contributing

Found an issue or have a suggestion? Please open an issue or pull request in the Dokploy templates repository.

---

**Happy Note-Taking with AI! 🤖📝**
