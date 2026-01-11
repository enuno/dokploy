# ntfy

Self-hosted HTTP-based pub-sub push notification service.

## Overview

[ntfy](https://ntfy.sh) (pronounced "notify") is a simple HTTP-based pub-sub notification service. It allows you to send notifications to your phone or desktop via scripts from any computer, without having to sign up or pay any fees.

This Dokploy template provides a production-ready ntfy deployment with:

- Secure HTTPS via Traefik with Let's Encrypt
- Built-in authentication with SQLite user database
- Attachment support for files and images
- iOS push notification support via APNS relay
- Persistent message caching
- Rate limiting to prevent abuse
- Security headers for web protection

## Architecture

```
                    ┌─────────────────────────┐
                    │        Internet         │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   Traefik (HTTPS/TLS)   │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │         ntfy            │
                    │    (port 80 internal)   │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │ SQLite DBs      │    │
                    │  │ - cache.db      │    │
                    │  │ - user.db       │    │
                    │  └─────────────────┘    │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │ Attachments     │    │
                    │  │ (file storage)  │    │
                    │  └─────────────────┘    │
                    └─────────────────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │    ntfy.sh (upstream)   │
                    │   (iOS APNS relay)      │
                    └─────────────────────────┘
```

## Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 core | 2 cores |
| Memory | 256 MB | 512 MB |
| Storage | 1 GB | 10 GB (depends on attachment usage) |

## Configuration Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Your ntfy domain | `ntfy.example.com` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NTFY_UID` | User ID for container | `1000` |
| `NTFY_GID` | Group ID for container | `1000` |
| `CACHE_DURATION` | Message retention time | `12h` |
| `ATTACHMENT_SIZE_LIMIT` | Max file size per attachment | `15M` |
| `ATTACHMENT_TOTAL_LIMIT` | Total attachment storage | `5G` |
| `ATTACHMENT_EXPIRY` | Attachment retention time | `3h` |
| `AUTH_DEFAULT_ACCESS` | Default access level | `deny-all` |
| `ENABLE_LOGIN` | Show web login form | `true` |
| `UPSTREAM_BASE_URL` | iOS APNS relay server | `https://ntfy.sh` |
| `RATE_LIMIT_BURST` | Request burst limit | `60` |
| `VISITOR_ATTACHMENT_LIMIT` | Per-visitor attachment quota | `100M` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `TZ` | Timezone | `UTC` |

### Authentication Modes

The `AUTH_DEFAULT_ACCESS` setting controls default permissions:

| Mode | Description | Use Case |
|------|-------------|----------|
| `deny-all` | Only authenticated users can access | Private/personal use |
| `read-write` | Anyone can publish and subscribe | Public notification board |
| `read-only` | Anyone can subscribe, auth required to publish | Public announcements |
| `write-only` | Anyone can publish, auth required to subscribe | Feedback/reporting |

## Deployment

### 1. Create the template in Dokploy

1. Go to your project in Dokploy
2. Add a new Compose service
3. Use the GitHub source: `blueprints/ntfy/docker-compose.yml`
4. Set environment variables (see Configuration above)

### 2. Set volume permissions

Before starting, create the data directory with correct ownership:

```bash
# SSH into your server
mkdir -p /var/lib/dokploy/volumes/ntfy-cache
chown 1000:1000 /var/lib/dokploy/volumes/ntfy-cache
```

Or adjust `NTFY_UID` and `NTFY_GID` to match your host user.

### 3. Deploy and verify

After deployment, verify the health endpoint:

```bash
curl https://your-domain.com/v1/health
# Should return: {"healthy":true}
```

## Post-Deployment Setup

### Create admin user

After deployment, create an admin user via the ntfy CLI:

```bash
# Access the container
docker exec -it <container-name> /bin/sh

# Add admin user
ntfy user add --role=admin admin

# Add regular user
ntfy user add user1

# Set topic permissions
ntfy access user1 mytopic rw
```

### Test notifications

Send a test notification:

```bash
# Simple notification
curl -d "Hello from ntfy!" https://your-domain.com/test-topic

# With title and priority
curl \
  -H "Title: Test Alert" \
  -H "Priority: high" \
  -H "Tags: warning" \
  -d "This is a test notification" \
  https://your-domain.com/test-topic

# With attachment
curl \
  -T /path/to/file.jpg \
  -H "Filename: photo.jpg" \
  https://your-domain.com/test-topic
```

### Subscribe to notifications

**Web browser:** Visit `https://your-domain.com/test-topic`

**Android app:**
1. Install [ntfy from Google Play](https://play.google.com/store/apps/details?id=io.heckel.ntfy) or [F-Droid](https://f-droid.org/packages/io.heckel.ntfy/)
2. Add subscription with your server URL and topic

**iOS app:**
1. Install [ntfy from App Store](https://apps.apple.com/app/ntfy/id1625396347)
2. Add subscription (requires `UPSTREAM_BASE_URL` for instant delivery)

**CLI subscription:**
```bash
ntfy subscribe your-domain.com/test-topic
```

## Integration Examples

### Home Assistant

```yaml
# configuration.yaml
notify:
  - name: ntfy
    platform: rest
    resource: https://ntfy.example.com/homeassistant
    method: POST_JSON
    headers:
      Authorization: Bearer tk_your_token_here
    data:
      topic: homeassistant
    title_param_name: title
    message_param_name: message
```

### Bash script

```bash
#!/bin/bash
# Send notification on script completion
do_something || {
  curl -d "Script failed!" https://ntfy.example.com/alerts
  exit 1
}
curl -d "Script completed successfully" https://ntfy.example.com/alerts
```

### Cron job monitoring

```bash
# In crontab
0 * * * * /path/to/script.sh && curl -d "Hourly job OK" https://ntfy.example.com/cron || curl -d "Hourly job FAILED" -H "Priority: high" https://ntfy.example.com/cron
```

### Docker container alerts

```bash
# Monitor container health
docker events --filter 'event=die' --format '{{.Actor.Attributes.name}}' | \
  while read name; do
    curl -d "Container $name died!" -H "Priority: urgent" https://ntfy.example.com/docker
  done
```

## Troubleshooting

### Permission denied errors

If you see permission errors in logs:

```bash
# Check container logs
docker logs <container-name>

# Fix volume permissions
docker exec -it <container-name> ls -la /var/cache/ntfy/
# Adjust NTFY_UID/NTFY_GID to match or chown the volume
```

### iOS notifications not instant

iOS requires the APNS relay through ntfy.sh:

1. Verify `UPSTREAM_BASE_URL=https://ntfy.sh` is set
2. Check that your server can reach ntfy.sh
3. Ensure your iOS app is configured with your self-hosted server URL

### Authentication issues

```bash
# List users
docker exec -it <container-name> ntfy user list

# Reset user password
docker exec -it <container-name> ntfy user change-pass username

# Check access control
docker exec -it <container-name> ntfy access
```

### Health check failing

If the container restarts due to health check failures:

```bash
# Test health endpoint manually
docker exec -it <container-name> wget -q http://localhost:80/v1/health -O -

# Check if ntfy is listening
docker exec -it <container-name> netstat -tlnp
```

## Resources

- [ntfy Documentation](https://docs.ntfy.sh/)
- [ntfy GitHub Repository](https://github.com/binwiederhier/ntfy)
- [ntfy Android App](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
- [ntfy iOS App](https://apps.apple.com/app/ntfy/id1625396347)
- [API Documentation](https://docs.ntfy.sh/publish/)

## License

ntfy is released under the Apache 2.0 and GPLv2 licenses.
