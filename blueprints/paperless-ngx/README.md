# Paperless-ngx Dokploy Template

A production-ready Dokploy template for [Paperless-ngx](https://docs.paperless-ngx.com/) - a document management system that transforms physical documents into a searchable online archive.

## Features

- Full-text OCR search across all documents
- Automatic document classification and tagging
- Office document support (via Tika/Gotenberg)
- PostgreSQL database for reliability
- Redis for task queue management
- Health checks on all services
- Auto-generated secure passwords

## Service Architecture

```
                    +------------------+
                    |    Dokploy       |
                    |  (Reverse Proxy) |
                    +--------+---------+
                             |
                             | :8000
                             v
+----------------+  +--------+---------+  +----------------+
|    Gotenberg   |  |    Paperless     |  |     Tika       |
|   (Office      |<-|    (Web App)     |->|   (Document    |
|   Conversion)  |  |                  |  |    Parsing)    |
+----------------+  +--------+---------+  +----------------+
     :3000                   |                  :9998
                    +--------+--------+
                    |                 |
                    v                 v
           +-------+------+   +------+-------+
           |   PostgreSQL |   |    Redis     |
           |  (Database)  |   | (Task Queue) |
           +--------------+   +--------------+
                :5432              :6379
```

## Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| paperless | `ghcr.io/paperless-ngx/paperless-ngx:2.13` | 8000 | Main web application |
| postgres | `postgres:16-alpine` | 5432 | Document database |
| redis | `redis:7-alpine` | 6379 | Task queue broker |
| gotenberg | `gotenberg/gotenberg:8` | 3000 | Office document conversion |
| tika | `apache/tika:2.9.1.0` | 9998 | Document parsing/extraction |

## Resource Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2 GB | 4 GB |
| CPU | 2 cores | 4 cores |
| Storage | 10 GB | 50+ GB (depends on document volume) |

## Auto-Generated Variables

When deploying via Dokploy, the following are automatically generated:

| Variable | Description |
|----------|-------------|
| `domain` | Your domain (e.g., `paperless.hashgrid.net`) |
| `secret_key` | 64-character base64 secret for Django |
| `admin_password` | 16-character admin password |
| `postgres_password` | 32-character database password |

## Post-Deployment Steps

### 1. Access the Web UI

Navigate to `https://<your-domain>` and log in with:
- **Username**: `admin`
- **Password**: Check Dokploy environment variables for `PAPERLESS_ADMIN_PASSWORD`

### 2. Configure Document Consumption

Documents can be added via:

1. **Web Upload**: Drag and drop in the web interface
2. **Consume Folder**: Copy files to the `paperless-consume` volume
3. **Email** (requires additional configuration)

### 3. Recommended Initial Settings

1. Go to **Settings > General**
   - Set your preferred date format
   - Configure default permissions

2. Go to **Settings > Correspondents/Document Types/Tags**
   - Create document types for your use case
   - Set up correspondents for common senders
   - Create tags for organization

## Volume Mounts

| Volume | Container Path | Purpose |
|--------|----------------|---------|
| `paperless-data` | `/usr/src/paperless/data` | Application data, SQLite (if used), index |
| `paperless-media` | `/usr/src/paperless/media` | Original and archived documents |
| `paperless-consume` | `/usr/src/paperless/consume` | Incoming document staging |
| `paperless-export` | `/usr/src/paperless/export` | Document export destination |
| `postgres-data` | `/var/lib/postgresql/data` | PostgreSQL database files |
| `redis-data` | `/data` | Redis persistence |

## Environment Variables Reference

### Core Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PAPERLESS_URL` | `https://${domain}` | Public URL for the application |
| `PAPERLESS_SECRET_KEY` | Auto-generated | Django secret key |
| `PAPERLESS_ADMIN_USER` | `admin` | Initial admin username |
| `PAPERLESS_ADMIN_PASSWORD` | Auto-generated | Initial admin password |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `PAPERLESS_DBENGINE` | `postgresql` | Database engine |
| `PAPERLESS_DBHOST` | `postgres` | Database hostname |
| `PAPERLESS_DBNAME` | `paperless` | Database name |
| `PAPERLESS_DBUSER` | `paperless` | Database username |
| `PAPERLESS_DBPASS` | Auto-generated | Database password |

### OCR Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `PAPERLESS_OCR_LANGUAGE` | `eng` | Primary OCR language |
| `PAPERLESS_OCR_MODE` | `skip` | `skip` if text present, `redo` always OCR |
| `PAPERLESS_OCR_OUTPUT_TYPE` | `pdfa` | Output format (pdfa, pdf) |

### Performance

| Variable | Default | Description |
|----------|---------|-------------|
| `PAPERLESS_TASK_WORKERS` | `2` | Number of background workers |
| `PAPERLESS_THREADS_PER_WORKER` | `1` | Threads per worker |
| `PAPERLESS_WEBSERVER_WORKERS` | `2` | Gunicorn workers |

## Backup & Restore

### Backup

```bash
# Export documents and metadata
docker exec <paperless-container> document_exporter /usr/src/paperless/export

# Backup PostgreSQL
docker exec <postgres-container> pg_dump -U paperless paperless > backup.sql
```

### Restore

```bash
# Restore PostgreSQL
cat backup.sql | docker exec -i <postgres-container> psql -U paperless paperless

# Import documents
docker exec <paperless-container> document_importer /usr/src/paperless/export
```

## Troubleshooting

### Documents Not Processing

1. Check worker logs: `docker logs <paperless-container>`
2. Verify Redis connection: `docker exec <redis-container> redis-cli ping`
3. Check consume folder permissions

### OCR Not Working

1. Verify Tika is healthy: `curl http://tika:9998/tika`
2. Check Gotenberg: `curl http://gotenberg:3000/health`
3. Review `PAPERLESS_OCR_LANGUAGE` setting

### Database Connection Issues

1. Verify PostgreSQL is healthy: `docker exec <postgres-container> pg_isready`
2. Check `PAPERLESS_DBPASS` matches `POSTGRES_PASSWORD`
3. Review PostgreSQL logs

### High Memory Usage

Reduce workers in template.toml:
```toml
PAPERLESS_TASK_WORKERS = "1"
PAPERLESS_WEBSERVER_WORKERS = "1"
```

## Additional Resources

- [Paperless-ngx Documentation](https://docs.paperless-ngx.com/)
- [Paperless-ngx GitHub](https://github.com/paperless-ngx/paperless-ngx)
- [Docker Compose Reference](https://docs.paperless-ngx.com/setup/#docker_compose)
- [Configuration Reference](https://docs.paperless-ngx.com/configuration/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12 | Initial template with PostgreSQL, Tika, Gotenberg |
