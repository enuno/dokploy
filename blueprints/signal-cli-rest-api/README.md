# Signal CLI REST API

A production-ready REST API wrapper for signal-cli, enabling programmatic access to Signal Messenger for automation, bots, notifications, and integrations.

## Overview

Signal CLI REST API provides a REST interface to Signal Messenger's command-line client (signal-cli), allowing you to send and receive Signal messages programmatically without requiring a dedicated phone or Signal Desktop app.

**Features:**
- Send text messages, attachments, and reactions via REST API
- Receive messages with webhook support
- Group chat management (create, join, leave groups)
- Contact and profile management
- QR code device linking (no SMS verification)
- Three operational modes: normal, native, json-rpc
- Docker-based deployment with persistent device registration

## Architecture

```
┌──────────────────────────────────────────┐
│     Signal CLI REST API Container       │
│                                          │
│  ┌────────────────────────────────┐     │
│  │   REST API Server (Port 8080)  │     │
│  │   - /v1/register               │     │
│  │   - /v2/send                   │     │
│  │   - /v1/receive                │     │
│  │   - /v1/groups                 │     │
│  └────────────────────────────────┘     │
│             │                            │
│             ▼                            │
│  ┌────────────────────────────────┐     │
│  │    signal-cli daemon           │     │
│  │    (embedded)                  │     │
│  └────────────────────────────────┘     │
│             │                            │
│             ▼                            │
│  Volume: /home/.local/share/signal-cli  │
│  - Device registration keys             │
│  - Signal protocol state                │
│  - Message encryption keys              │
└──────────────────────────────────────────┘
              │
              ▼
       dokploy-network
              │
              ▼
    Traefik (HTTPS + Let's Encrypt)
              │
              ▼
      https://${SIGNAL_DOMAIN}
```

**Key Points:**
- Single-service architecture (no database required)
- Persistent volume for device registration (CRITICAL)
- HTTPS access via Traefik with Let's Encrypt
- Security headers middleware (HSTS, XSS protection)

## Requirements

### System Resources

**Minimum:**
- RAM: 256MB
- Disk: 1GB (for Signal data and attachments)
- Network: Stable internet connection

**Recommended:**
- RAM: 512MB
- Disk: 2GB
- Network: Reliable connection for real-time message delivery

### Prerequisites

1. **Signal Account Setup:**
   - A phone number capable of receiving Signal messages (for initial registration)
   - Signal app on your phone (for QR code scanning)
   - **Note**: After linking, the phone can be unlinked

2. **Domain Requirements:**
   - Domain name pointed to your server (for webhooks and HTTPS)
   - DNS A record configured

3. **Dokploy Requirements:**
   - Dokploy installed and running
   - Traefik configured with Let's Encrypt

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SIGNAL_DOMAIN` | Domain for REST API access and webhooks | `signal-api.example.com` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MODE` | `normal` | Operational mode: `normal`, `native`, or `json-rpc` |
| `SIGNAL_CLI_UID` | `1000` | User ID for signal-cli data file ownership |
| `SIGNAL_CLI_GID` | `1000` | Group ID for signal-cli data file ownership |

**Operational Modes:**
- **normal**: REST API + signal-cli daemon (recommended, most compatible)
- **native**: signal-cli native binary (faster, platform-specific, limited OS support)
- **json-rpc**: JSON-RPC protocol interface

## Deployment

### 1. Deploy in Dokploy

1. Navigate to your Dokploy project
2. Click **"Create Service"** → **"Template"**
3. Select **"Signal CLI REST API"** template
4. Configure required variables:
   - **SIGNAL_DOMAIN**: Your domain (e.g., `signal-api.example.com`)
5. Configure optional variables (or leave defaults):
   - **MODE**: `normal` (default)
   - **SIGNAL_CLI_UID**: `1000` (default)
   - **SIGNAL_CLI_GID**: `1000` (default)
6. Click **"Deploy"**

### 2. Device Registration (First-Time Setup)

After deployment, you must link the Signal CLI REST API to your Signal account:

#### Step 1: Generate QR Code Link

```bash
# Get QR code linking URL
curl -X GET https://signal-api.example.com/v1/qrcodelink?device_name=signal-api
```

**Response:**
```json
{
  "tsdevice:/?uuid=...&pub_key=..."
}
```

#### Step 2: Link Device via Signal App

1. Open Signal on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **"+"** (Add New Device)
4. Scan the QR code displayed at the URL from Step 1
5. Approve the linking request

**Alternative: Use Dokploy logs to get QR code**
```bash
# View container logs
docker logs signal-cli-rest-api

# Look for QR code ASCII art in logs during startup
```

#### Step 3: Verify Registration

```bash
# Check registration status
curl -X GET https://signal-api.example.com/v1/about
```

**Success Response:**
```json
{
  "versions": {
    "version": "0.96",
    "signal-cli": "0.13.22"
  }
}
```

### 3. Configure Webhooks (Optional)

To receive incoming messages via webhooks:

```bash
# Register webhook URL
curl -X POST https://signal-api.example.com/v1/receive/+1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": "https://your-app.example.com/signal-webhook"
  }'
```

## Usage Examples

### Send Text Message

```bash
curl -X POST https://signal-api.example.com/v2/send \
  -H "Content-Type: application/json" \
  -d '{
    "number": "+1234567890",
    "recipients": ["+10987654321"],
    "message": "Hello from Signal CLI REST API!"
  }'
```

### Send Message with Attachment

```bash
curl -X POST https://signal-api.example.com/v2/send \
  -F 'number=+1234567890' \
  -F 'recipients[]=+10987654321' \
  -F 'message=Check out this image!' \
  -F 'attachment=@/path/to/image.png'
```

### Create Group

```bash
curl -X POST https://signal-api.example.com/v1/groups/+1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Group",
    "members": ["+10987654321", "+11231231234"]
  }'
```

### Send Group Message

```bash
curl -X POST https://signal-api.example.com/v2/send \
  -H "Content-Type: application/json" \
  -d '{
    "number": "+1234567890",
    "recipients": ["group.abc123..."],
    "message": "Hello everyone!"
  }'
```

### Receive Messages (Polling)

```bash
# Fetch new messages
curl -X GET https://signal-api.example.com/v1/receive/+1234567890
```

**Response:**
```json
[
  {
    "envelope": {
      "source": "+10987654321",
      "sourceDevice": 1,
      "timestamp": 1234567890123
    },
    "dataMessage": {
      "timestamp": 1234567890123,
      "message": "Hello!"
    }
  }
]
```

## API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/about` | Get API version and status |
| `GET` | `/v1/qrcodelink?device_name={name}` | Generate QR code for device linking |
| `POST` | `/v2/send` | Send text message, attachment, or reaction |
| `GET` | `/v1/receive/{number}` | Poll for new messages |
| `POST` | `/v1/receive/{number}` | Configure webhook for incoming messages |
| `POST` | `/v1/groups/{number}` | Create group |
| `GET` | `/v1/groups/{number}` | List groups |
| `GET` | `/v1/profiles/{number}` | Get profile |
| `POST` | `/v1/profiles/{number}` | Update profile |

### Full API Documentation

Complete API documentation: https://bbernhard.github.io/signal-cli-rest-api/

## Post-Deployment

### Verify Deployment

```bash
# Check API health
curl -X GET https://signal-api.example.com/v1/about

# Check container logs
docker logs signal-cli-rest-api

# Verify volume persistence
docker volume inspect signal-cli-rest-api_signal-data
```

### Device Registration Backup

**CRITICAL**: The `signal-data` volume contains your device registration keys. Losing this volume requires re-registration and all message history will be lost.

**Backup Device Registration:**
```bash
docker run --rm -v signal-cli-rest-api_signal-data:/data \
  -v $(pwd):/backup alpine \
  tar czf /backup/signal-backup-$(date +%F).tar.gz -C /data .
```

**Restore Device Registration:**
```bash
docker run --rm -v signal-cli-rest-api_signal-data:/data \
  -v $(pwd):/backup alpine \
  tar xzf /backup/signal-backup-YYYY-MM-DD.tar.gz -C /data
```

**Backup Schedule Recommendation:**
- Automatic daily backups
- Store backups in secure, off-site location
- Test restore procedure periodically

### Unlink Device (Cleanup)

To unlink the API device from your Signal account:

1. Open Signal app on your phone
2. Go to **Settings** → **Linked Devices**
3. Find the linked device (e.g., "signal-api")
4. Tap device → **"Unlink"**

**Note**: After unlinking, you'll need to re-register the device.

## Use Cases

### 1. Notification System
Send server alerts, monitoring notifications, or system events:
```bash
# Server down alert
curl -X POST https://signal-api.example.com/v2/send \
  -H "Content-Type: application/json" \
  -d '{
    "number": "+1234567890",
    "recipients": ["+10987654321"],
    "message": "🚨 ALERT: Production server down!"
  }'
```

### 2. Chatbot
Build a Signal chatbot that responds to commands:
```bash
# Configure webhook
curl -X POST https://signal-api.example.com/v1/receive/+1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": "https://your-bot.example.com/webhook"
  }'

# Your webhook receives messages and can respond
```

### 3. Two-Factor Authentication
Send 2FA codes via Signal instead of SMS:
```bash
# Send 2FA code
curl -X POST https://signal-api.example.com/v2/send \
  -H "Content-Type: application/json" \
  -d '{
    "number": "+1234567890",
    "recipients": ["+10987654321"],
    "message": "Your verification code is: 123456"
  }'
```

### 4. Automated Reporting
Send daily reports, summaries, or analytics:
```bash
# Daily report
curl -X POST https://signal-api.example.com/v2/send \
  -H "Content-Type: application/json" \
  -d '{
    "number": "+1234567890",
    "recipients": ["+10987654321"],
    "message": "📊 Daily Report\n\nUsers: 1,234\nRevenue: $5,678\nUptime: 99.9%"
  }'
```

## Troubleshooting

### Issue 1: QR Code Link Doesn't Work

**Symptoms:**
```
Failed to generate QR code link
```

**Causes:**
- Signal CLI not initialized
- Network connectivity issues
- Signal service unavailable

**Solutions:**
1. Check container logs:
   ```bash
   docker logs signal-cli-rest-api
   ```

2. Restart container:
   ```bash
   docker restart signal-cli-rest-api
   ```

3. Verify network connectivity:
   ```bash
   docker exec signal-cli-rest-api ping -c 3 signal.org
   ```

### Issue 2: Device Not Linked

**Symptoms:**
```
Account not registered: +1234567890
```

**Causes:**
- Device linking not completed
- Registration expired
- Device unlinked from Signal app

**Solutions:**
1. Re-generate QR code and link device again
2. Check Signal app → Linked Devices for device status
3. Verify volume persistence:
   ```bash
   docker volume inspect signal-cli-rest-api_signal-data
   ```

### Issue 3: Messages Not Sending

**Symptoms:**
```
Failed to send message
```

**Causes:**
- Invalid phone number format
- Network issues
- Rate limiting

**Solutions:**
1. Verify phone number format (E.164: +1234567890)
2. Check API response for error details
3. Verify recipient is registered on Signal
4. Check container logs for rate limiting warnings

### Issue 4: Volume Data Lost

**Symptoms:**
```
Device registration not found
```

**Causes:**
- Volume deleted
- Container recreated without volume
- Volume corruption

**Solutions:**
1. Restore from backup:
   ```bash
   docker run --rm -v signal-cli-rest-api_signal-data:/data \
     -v $(pwd):/backup alpine \
     tar xzf /backup/signal-backup-YYYY-MM-DD.tar.gz -C /data
   ```

2. If no backup, re-register device (QR code link process)

### Issue 5: Container Keeps Restarting

**Check logs:**
```bash
docker logs signal-cli-rest-api --tail 100
```

**Common causes:**
- Port 8080 already in use
- Volume permission issues
- Insufficient memory

**Solutions:**
1. Verify no other service uses port 8080
2. Check volume permissions:
   ```bash
   docker exec signal-cli-rest-api ls -la /home/.local/share/signal-cli
   ```

3. Increase container memory if needed

### Issue 6: Webhooks Not Receiving Messages

**Symptoms:**
Webhook URL never receives POST requests

**Solutions:**
1. Verify webhook registration:
   ```bash
   curl -X GET https://signal-api.example.com/v1/receive/+1234567890
   ```

2. Check webhook URL is accessible from container:
   ```bash
   docker exec signal-cli-rest-api curl -I https://your-webhook.example.com
   ```

3. Ensure webhook endpoint accepts POST requests

4. Check webhook logs for incoming requests

## Security Considerations

### API Access Control

**Important**: The REST API has NO built-in authentication. Anyone with access to your domain can send/receive messages.

**Recommendations:**
1. **Cloudflare Zero Trust Access** (Recommended):
   - Configure Cloudflare Access policies
   - Require authentication for API endpoints
   - Use service tokens for automated access

2. **Reverse Proxy Authentication**:
   - Add basic auth via Traefik middleware
   - Use OAuth2 proxy for user authentication

3. **Network Restrictions**:
   - Firewall rules to limit source IPs
   - VPN-only access for sensitive deployments

4. **API Rate Limiting**:
   - Configure Cloudflare rate limiting
   - Prevent abuse and spam

### Device Security

- Device registration keys are stored in the volume
- Treat the volume as highly sensitive (contains encryption keys)
- Regular backups with encryption
- Restrict volume access to container only

### HTTPS Enforcement

- HTTPS is mandatory (enforced by Traefik)
- Security headers enabled (HSTS, XSS protection)
- Let's Encrypt certificates auto-renewed

### Signal Account Security

- Use a dedicated phone number if possible
- Enable Signal registration lock on your phone
- Monitor linked devices regularly in Signal app
- Unlink unused devices immediately

## Performance Tuning

### Message Throughput

Default configuration handles:
- ~100 messages/minute (to avoid Signal rate limits)
- Multiple concurrent API requests
- Webhook delivery within seconds

**For higher throughput:**
- Use message batching where possible
- Implement queue system for outbound messages
- Monitor Signal rate limit responses

### Resource Optimization

**Memory:**
- Default: 256MB (sufficient for most use cases)
- High volume: 512MB recommended

**Disk:**
- Signal data: <100MB typically
- Attachments: Variable (depends on usage)
- Logs: 50-100MB (rotate regularly)

### Operational Mode Performance

| Mode | Speed | Compatibility | Use Case |
|------|-------|---------------|----------|
| normal | Standard | All platforms | Recommended default |
| native | Faster | Linux x64/ARM64 | High-performance needs |
| json-rpc | Standard | All platforms | JSON-RPC integrations |

## Resources

### Official Documentation
- Signal CLI REST API: https://github.com/bbernhard/signal-cli-rest-api
- Signal CLI: https://github.com/AsamK/signal-cli
- API Documentation: https://bbernhard.github.io/signal-cli-rest-api/

### Signal Protocol
- Signal Protocol: https://signal.org/docs/
- Signal Messenger: https://signal.org/

### Docker Image
- Docker Hub: https://hub.docker.com/r/bbernhard/signal-cli-rest-api
- GitHub Container Registry: ghcr.io/bbernhard/signal-cli-rest-api

### Community
- GitHub Issues: https://github.com/bbernhard/signal-cli-rest-api/issues
- GitHub Discussions: https://github.com/bbernhard/signal-cli-rest-api/discussions

## License

This template is provided for deploying the Signal CLI REST API. The underlying software is licensed under:

- Template: MIT License
- signal-cli-rest-api: Apache 2.0 License
- signal-cli: GPLv3 License
- Signal Protocol: GPLv3 License

**Note**: Signal is a registered trademark of the Signal Foundation. This template is not officially affiliated with or endorsed by Signal Messenger or the Signal Foundation.
