# OneDev - Git Server with CI/CD, Kanban, and Packages

OneDev is a self-hosted, all-in-one DevOps platform that combines Git repository management, issue tracking, CI/CD pipelines, and package registry into a seamless experience.

## Features

- **Git Repository Management**: Language-aware code search, code navigation, and fast regex-based searching
- **CI/CD Pipelines**: GUI-based job creation, container and Kubernetes execution, parallel builds
- **Issue Tracking**: Customizable workflows, automated Kanban boards, time tracking
- **Code Review**: Discussion threads on any code selection with suggested changes
- **Package Registry**: Built-in binary package management linked to CI/CD jobs
- **Security**: Code protection rules requiring reviews or CI/CD verification

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    onedev-net (internal)                     │
│                                                              │
│  ┌────────────────┐              ┌────────────────────────┐ │
│  │    postgres    │◄─────────────│        onedev          │ │
│  │     :5432      │    JDBC      │    :6610 (HTTP)        │ │
│  │   (internal)   │              │    :6611 (SSH/Git)     │ │
│  └────────────────┘              └───────────┬────────────┘ │
│                                              │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                                 dokploy-network
                                               │
                                       ┌───────┴───────┐
                                       │    traefik    │
                                       └───────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
         https://git.example.com    ssh://git.example.com:6611    (CI/CD Jobs)
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| OneDev | 1dev/server:13.1.5 | 6610, 6611 | Git server, CI/CD, issue tracking |
| PostgreSQL | postgres:16-alpine | 5432 | Database (internal only) |

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- Port 6611 open for SSH Git operations (firewall/router)
- Docker socket access on host (for CI/CD jobs)

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ONEDEV_DOMAIN` | Domain for OneDev | `git.example.com` |
| `ONEDEV_ADMIN_PASSWORD` | Admin password | Auto-generated |
| `ONEDEV_ADMIN_EMAIL` | Admin email | `admin@example.com` |
| `POSTGRES_PASSWORD` | Database password | Auto-generated |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ONEDEV_ADMIN_USER` | `admin` | Admin username |
| `ONEDEV_SSH_PORT` | `6611` | SSH port for Git operations |
| `POSTGRES_DB` | `onedev` | Database name |
| `POSTGRES_USER` | `onedev` | Database user |
| `JAVA_TOOL_OPTIONS` | `-Xmx1g -Xms512m` | JVM memory settings |

### JVM Memory Tuning

Adjust based on available RAM:

| Server RAM | Recommended Settings |
|------------|---------------------|
| 2GB | `-Xmx1g -Xms512m` |
| 4GB | `-Xmx2g -Xms1g` |
| 8GB | `-Xmx4g -Xms2g` |
| 16GB | `-Xmx8g -Xms4g` |

## Deployment

### 1. DNS Configuration

Create DNS records:
```
git.example.com → Your Dokploy Server IP
```

### 2. Firewall Configuration

Open port 6611 for SSH Git access:
```bash
# UFW
ufw allow 6611/tcp

# iptables
iptables -A INPUT -p tcp --dport 6611 -j ACCEPT
```

### 3. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure required variables
4. Deploy the stack

### 4. Initial Access

1. Navigate to `https://git.example.com`
2. Login with admin credentials
3. Complete the setup wizard

## Post-Deployment Setup

### 1. Configure SSH Keys

1. Go to **User Settings → SSH Keys**
2. Add your public SSH key
3. Test with: `ssh -T git@git.example.com -p 6611`

### 2. Create Your First Project

1. Click **+ New Project**
2. Configure project settings
3. Push existing repository:
   ```bash
   git remote add origin ssh://git@git.example.com:6611/your-project
   git push -u origin main
   ```

### 3. Configure CI/CD

OneDev requires Docker socket access for CI/CD:

1. The compose mounts `/var/run/docker.sock`
2. CI/CD jobs run as sibling containers on the host
3. For isolated agents, deploy OneDev agents on separate machines

### 4. Email Configuration (Optional)

1. Go to **Administration → Mail Settings**
2. Configure SMTP server details
3. Test email delivery

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| OneDev | 1.0 | 1-2GB | 10GB+ |
| PostgreSQL | 0.25 | 256MB | 5GB+ |
| **Total** | ~1.25 | ~1.5-2.5GB | ~15GB |

## Security Considerations

### Docker Socket Access

OneDev mounts the Docker socket for CI/CD. This grants container-level access to Docker on the host. For high-security environments:

1. Use remote OneDev agents instead
2. Configure job isolation policies
3. Review pipeline definitions before execution

### Network Isolation

- PostgreSQL is only accessible on the internal `onedev-net`
- Only OneDev web (6610) and SSH (6611) are exposed
- HTTPS enforced via LetsEncrypt

### SSH Git Access

- Port 6611 is exposed directly (not through Traefik)
- SSH keys required for Git operations
- Consider using SSH certificates for team access

## Troubleshooting

### OneDev Not Starting

1. Check PostgreSQL health:
   ```bash
   docker compose logs postgres
   ```

2. Verify database connection:
   ```bash
   docker compose exec postgres pg_isready -U onedev
   ```

3. Check OneDev logs:
   ```bash
   docker compose logs onedev
   ```

### SSH Connection Refused

1. Verify port 6611 is exposed:
   ```bash
   docker compose ps
   netstat -tlnp | grep 6611
   ```

2. Check firewall rules:
   ```bash
   ufw status | grep 6611
   ```

3. Test SSH connection:
   ```bash
   ssh -v -T git@git.example.com -p 6611
   ```

### CI/CD Jobs Failing

1. Verify Docker socket access:
   ```bash
   docker compose exec onedev docker ps
   ```

2. Check OneDev logs for job errors:
   ```bash
   docker compose logs onedev | grep -i error
   ```

### High Memory Usage

1. Reduce JVM memory:
   ```
   JAVA_TOOL_OPTIONS=-Xmx512m -Xms256m
   ```

2. Enable garbage collection logging:
   ```
   JAVA_TOOL_OPTIONS=-Xmx1g -Xms512m -XX:+PrintGCDetails
   ```

## Backup Strategy

### Database Backup

```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U onedev onedev > onedev_backup.sql

# Restore
docker compose exec -T postgres psql -U onedev onedev < onedev_backup.sql
```

### Data Volume Backup

Backup the `onedev-data` volume which contains:
- Git repositories
- Build artifacts
- Attachments
- Configuration

```bash
# Create backup
docker run --rm -v onedev-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/onedev-data.tar.gz -C /data .

# Restore
docker run --rm -v onedev-data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/onedev-data.tar.gz -C /data
```

## Upgrading

1. Check [release notes](https://github.com/theonedev/onedev/releases) for breaking changes
2. Backup database and data volume
3. Update image version in docker-compose.yml
4. Redeploy in Dokploy
5. Verify all services are healthy

## Related Resources

- [OneDev Documentation](https://docs.onedev.io/)
- [OneDev GitHub](https://github.com/theonedev/onedev)
- [OneDev Community](https://code.onedev.io/)
- [CI/CD Examples](https://docs.onedev.io/tutorials/cicd/)

---

**Template Version**: 1.0.0
**Last Updated**: December 2024
