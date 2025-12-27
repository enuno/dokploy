# AR.IO Observer

Production-ready deployment template for AR.IO Observer - a microservice that generates randomized observation reports assessing ar.io gateway nodes against the AR.IO Network's Service Level Agreement (SLA).

## Overview

The AR.IO Observer is part of the AR.IO Network infrastructure, monitoring gateway performance and submitting observation reports to the Arweave blockchain. This template provides:

- **Automated Observation Reports**: Monitor gateway nodes against network SLAs
- **Arweave Integration**: Direct connection to Arweave GraphQL for blockchain data
- **Flexible Report Storage**: Choose between Turbo Credits (free <100KB) or AR tokens
- **Optional Zero Trust Protection**: Secure API endpoints with Cloudflare Access
- **Production-Grade Security**: HSTS, security headers, and encrypted traffic
- **Health Monitoring**: Built-in health checks for reliable operation

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│              AR.IO Observer Service                       │
│                                                            │
│  ┌─────────────┐     ┌──────────────┐                    │
│  │  Express    │────▶│  Observation │                    │
│  │  HTTP API   │     │   Reports    │                    │
│  │   :5050     │     │              │                    │
│  └─────────────┘     └──────────────┘                    │
│         │                     │                           │
│  ┌──────┴──────┐     ┌───────┴──────┐                   │
│  │  Health API │     │   Arweave    │                    │
│  │ /healthcheck│     │   GraphQL    │                    │
│  └─────────────┘     └──────────────┘                    │
└──────────────────────────────────────────────────────────┘
         │                      │
         │                      └────▶ arweave.net:443
         │
         ├────▶ Cloudflare Zero Trust (optional)
         │
         ▼
   Traefik (HTTPS)
```

## Features

### Observer Capabilities
- ✅ **Randomized Observations**: Automated gateway performance testing
- ✅ **SLA Monitoring**: Verify ar.io gateways meet network requirements
- ✅ **Report Submission**: Automatic submission to Arweave blockchain
- ✅ **Hot Wallet Signing**: Cryptographically sign observation reports
- ✅ **Configurable Indexing**: Start from any block height
- ✅ **Flexible Storage**: Turbo Credits or AR tokens for report uploads

### Security & Performance
- 🔒 **Security Headers**: HSTS, XSS protection, referrer policy
- 🔒 **Optional Zero Trust**: Cloudflare Access for API authentication
- ✅ **HTTPS Enforced**: Automatic Let's Encrypt SSL certificates
- ⚡ **Lightweight**: Stateless Node.js microservice
- ⚡ **Health Checks**: Built-in monitoring for service availability
- ⚡ **Production Hardened**: Based on official AR.IO Docker images

## Prerequisites

- **Dokploy**: Self-hosted deployment platform
- **Domain Name**: Pointed to your Dokploy server
- **AR.IO Wallet**: Public wallet address for network participation
- **Observer Hot Wallet**: Separate hot wallet for signing reports (recommended)
- **Cloudflare Account** (Optional): For Zero Trust API protection
- **Resources**:
  - CPU: 0.5-1 cores (lightweight microservice)
  - RAM: 256-512 MB
  - Disk: Minimal (stateless service, no persistent storage)

## Wallet Configuration

### AR.IO Wallet vs Observer Wallet

The template requires **two wallet addresses**:

1. **AR.IO_WALLET** (`AR_IO_WALLET`)
   - Your main AR.IO wallet public address
   - Used for network identity and participation
   - **Security**: Can be a cold wallet (public address only)

2. **Observer Hot Wallet** (`OBSERVER_WALLET`)
   - Dedicated hot wallet for signing observation reports
   - Requires access to private keyfile for signing
   - **Security**: Keep private key secure, use separate wallet from main funds

### Obtaining Wallets

#### Option 1: Create New Wallet (Arconnect)
1. Install [Arconnect browser extension](https://www.arconnect.io/)
2. Create new wallet or import existing
3. Copy public wallet address (e.g., `abc123...xyz789`)
4. For observer wallet: Export keyfile securely

#### Option 2: Use Existing Arweave Wallet
1. Use existing Arweave wallet address for `AR_IO_WALLET`
2. Create separate hot wallet for `OBSERVER_WALLET`
3. Never share private keys - only public addresses needed

### Security Best Practices

⚠️ **CRITICAL**: The observer hot wallet requires access to the private keyfile for signing reports. Follow these security practices:

- Use a **dedicated hot wallet** with minimal AR token balance
- Keep the main AR.IO wallet separate (cold storage recommended)
- Secure the observer wallet private keyfile appropriately
- Consider using environment secrets management for the keyfile path
- Rotate hot wallet periodically if compromised

## Cloudflare Zero Trust (Optional)

Protect observation API endpoints (`/ar-io/observer/*`) with authentication.

### Step 1: Set Up Cloudflare Access

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Zero Trust → Access
2. Click **"Add an Application"** → **"Self-hosted"**
3. Configure application:
   - **Application name**: AR.IO Observer API
   - **Application domain**: `observer.yourdomain.com`
   - **Path**: `/ar-io/observer/*`
4. Configure access policy:
   - **Policy name**: Allow Authorized Users
   - **Action**: Allow
   - **Include**: Emails ending in `@yourdomain.com` (or your requirements)
5. Click **"Add application"**

### Step 2: Get Team Name

1. Go to Zero Trust → Settings → Custom Pages
2. Your team name is in the URL: `https://<TEAM-NAME>.cloudflareaccess.com`
3. Copy the team name (e.g., `mycompany`)

### Step 3: Configure in Dokploy

| Variable | Value | Description |
|----------|-------|-------------|
| `CF_TEAM_NAME` | `mycompany` | Your Zero Trust team name |

**Note**: If you leave `CF_TEAM_NAME` empty, the API will be publicly accessible (not recommended for production).

## Installation

### 1. Deploy in Dokploy

1. Log into your Dokploy dashboard
2. Navigate to **Templates** → **Community Templates**
3. Search for **"AR.IO Observer"** or find it in the Arweave category
4. Click **"Deploy"**

### 2. Configure Required Variables

| Variable | Required? | Default | Description |
|----------|-----------|---------|-------------|
| `DOMAIN` | **Yes** | - | Your observer domain (e.g., `observer.example.com`) |
| `OBSERVER_WALLET` | **Yes** | - | Hot wallet public address for signing reports |
| `AR_IO_WALLET` | **Yes** | - | Your AR.IO wallet public address |
| `RUN_OBSERVER` | No | `true` | Enable/disable observer functionality |
| `GRAPHQL_HOST` | No | `arweave.net` | Arweave GraphQL endpoint host |
| `GRAPHQL_PORT` | No | `443` | Arweave GraphQL endpoint port |
| `START_HEIGHT` | No | `0` | Block height to start indexing (0 = genesis) |
| `REPORT_DATA_SINK` | No | (empty) | Report storage: empty = Turbo Credits, `arweave` = AR tokens |
| `CF_TEAM_NAME` | No | (empty) | Cloudflare Zero Trust team name |

### 3. Report Upload Configuration

The `REPORT_DATA_SINK` variable controls how observation reports are uploaded:

#### Option A: Turbo Credits (Default)
```toml
REPORT_DATA_SINK = ""  # Empty string
```

**Characteristics:**
- Free for reports <100KB
- Fails for larger reports without credits
- Recommended for most observers
- No AR token balance required

#### Option B: AR Tokens
```toml
REPORT_DATA_SINK = "arweave"
```

**Characteristics:**
- Uses AR tokens from observer wallet
- No size limit on reports
- Requires AR balance in observer hot wallet
- Recommended for high-volume observers

### 4. Deploy and Verify

1. Click **"Deploy"** in Dokploy
2. Wait for deployment to complete (~1-2 minutes)
3. Check service health:
   ```bash
   docker ps | grep observer
   ```
4. Verify API is responding:
   ```bash
   curl https://observer.example.com/ar-io/observer/healthcheck
   ```

## Usage

### Access Observer API

#### Health Check
```bash
curl https://observer.example.com/ar-io/observer/healthcheck
```

Expected response:
```json
{
  "uptime": 12345,
  "message": "Welcome to the ar.io observer service!",
  "timestamp": 1703001234567
}
```

#### Current Reports
```bash
curl https://observer.example.com/ar-io/observer/reports/current
```

Returns current observation reports for gateway nodes.

### Monitoring Observer Activity

#### Check Service Logs
```bash
# Docker logs
docker logs observer -f --tail 100

# Via Dokploy dashboard
# Navigate to: Services → AR.IO Observer → Logs
```

#### Verify Report Submissions

Monitor the observer logs for successful report submissions:

```
[INFO] Observation report generated for gateway: xyz123.ar-io.net
[INFO] Report signed with observer wallet: abc...789
[INFO] Report submitted to Arweave via Turbo Credits
[INFO] Transaction ID: tx_abc123...
```

#### Check Arweave Transactions

Verify reports on Arweave blockchain:

```bash
# View transactions for your observer wallet
https://viewblock.io/arweave/address/{OBSERVER_WALLET}
```

## Configuration

### Environment Variables

All configuration is done via environment variables:

#### Observer Behavior
```yaml
RUN_OBSERVER: "true"          # Enable observer (set to "false" to disable)
START_HEIGHT: "0"             # Block height to start from (0 = genesis)
```

#### Arweave Configuration
```yaml
GRAPHQL_HOST: "arweave.net"   # Arweave GraphQL endpoint
GRAPHQL_PORT: "443"           # GraphQL port (443 for HTTPS)
```

#### Report Upload
```yaml
REPORT_DATA_SINK: ""          # Empty = Turbo Credits, "arweave" = AR tokens
```

### Custom Arweave Gateway

To use a custom Arweave gateway instead of public `arweave.net`:

```yaml
GRAPHQL_HOST: "your-gateway.ar-io.net"
GRAPHQL_PORT: "443"
```

### Resource Limits (Optional)

For production deployments, consider adding resource limits in docker-compose.yml:

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: "0.5"
    reservations:
      memory: 128M
      cpus: "0.1"
```

## Troubleshooting

### Issue: Observer Not Generating Reports

**Symptoms**: No report activity in logs

**Diagnosis**:
1. Check observer is enabled:
   ```bash
   docker exec observer env | grep RUN_OBSERVER
   ```
2. Verify wallet configuration:
   ```bash
   docker exec observer env | grep WALLET
   ```
3. Check GraphQL connectivity:
   ```bash
   curl https://arweave.net/graphql
   ```

**Solution**:
- Ensure `RUN_OBSERVER=true`
- Verify wallet addresses are correct (43-character base64url strings)
- Confirm Arweave network is accessible
- Check observer logs for errors:
  ```bash
  docker logs observer --tail 100 | grep ERROR
  ```

### Issue: Report Upload Failures (Turbo Credits)

**Symptoms**: Reports generated but not submitted

**Diagnosis**:
```bash
docker logs observer | grep "upload failed\|turbo"
```

**Solution**:
- **Report size >100KB**: Switch to AR token upload (`REPORT_DATA_SINK=arweave`)
- **No Turbo Credits**: Add credits at https://turbo.ardrive.io/
- **Network issues**: Check internet connectivity and firewall rules

### Issue: Report Upload Failures (AR Tokens)

**Symptoms**: "Insufficient funds" or transaction errors

**Diagnosis**:
```bash
# Check observer wallet balance
https://viewblock.io/arweave/address/{OBSERVER_WALLET}
```

**Solution**:
- Fund observer hot wallet with AR tokens
- Minimum balance: ~0.1 AR for report submissions
- Monitor balance and refill as needed

### Issue: Cloudflare Zero Trust Not Working

**Symptoms**: API accessible without authentication

**Diagnosis**:
1. Check `CF_TEAM_NAME` is set correctly
2. Verify Cloudflare Access application is active
3. Check Traefik middleware configuration:
   ```bash
   docker logs traefik | grep observer-cf-access
   ```

**Solution**:
- Ensure `CF_TEAM_NAME` matches your Zero Trust team name exactly
- Verify Access application path is `/ar-io/observer/*`
- Check Access policy includes your identity provider
- Try accessing in incognito mode to bypass cached auth

### Issue: Health Check Failing

**Symptoms**: Container marked as unhealthy

**Diagnosis**:
```bash
docker inspect observer | jq '.[0].State.Health'
```

**Solution**:
- Increase `start_period` if service takes longer to start
- Check port 5050 is accessible inside container:
  ```bash
  docker exec observer wget -qO- http://localhost:5050/ar-io/observer/healthcheck
  ```
- Review observer startup logs for errors

## Performance Tuning

### For High-Volume Observers

```yaml
# Increase resources
deploy:
  resources:
    limits:
      memory: 1G
      cpus: "1.0"

# Use AR token upload (no size limits)
REPORT_DATA_SINK: "arweave"
```

### For Low-Resource Servers

```yaml
# Minimize resources
deploy:
  resources:
    limits:
      memory: 256M
      cpus: "0.25"

# Use Turbo Credits (free for small reports)
REPORT_DATA_SINK: ""
```

### For Custom Observation Schedules

The AR.IO Observer runs on a predetermined schedule defined by the AR.IO Network. To customize observation behavior:

- Adjust `START_HEIGHT` to focus on recent blocks
- Use custom GraphQL endpoint for private gateway monitoring
- Monitor logs to understand observation frequency

## Security Considerations

### Production Deployment Checklist

- ✅ **Hot Wallet Security**: Use dedicated hot wallet with minimal AR balance
- ✅ **Zero Trust Enabled**: Protect API endpoints with Cloudflare Access
- ✅ **Security Headers**: HSTS, XSS protection enabled by default
- ✅ **HTTPS Only**: All traffic encrypted via Traefik
- ✅ **Wallet Separation**: Keep main AR.IO wallet separate from observer wallet
- ✅ **Regular Updates**: Monitor for new observer image versions

### Recommended Cloudflare Settings

1. **DNS Records**: Use DNS-only mode (grey cloud) for proper SSL handling
2. **Zero Trust**: Enable session duration limits (e.g., 24 hours)
3. **Audit Logs**: Review Cloudflare audit logs monthly
4. **WAF Rules**: Consider rate limiting for API endpoints

### Wallet Security

⚠️ **CRITICAL SECURITY PRACTICES**:

- Never expose private keys in environment variables
- Use secure secret management for observer wallet keyfile
- Maintain separate hot wallet from main AR.IO funds
- Rotate observer hot wallet if compromised
- Monitor wallet transactions regularly
- Keep minimal AR balance in hot wallet

## Upgrading

### Update Observer Version

The AR.IO Observer uses commit SHA-based tags. To update:

1. Check latest version at https://github.com/ar-io/ar-io-observer/pkgs/container/ar-io-observer
2. Note the commit SHA (e.g., `e34a7f01768d505360a4e0877fe40d55230e864a`)
3. Edit `docker-compose.yml`:
   ```yaml
   image: ghcr.io/ar-io/ar-io-observer:{NEW_COMMIT_SHA}
   ```
4. Pull new image and restart:
   ```bash
   docker compose pull observer
   docker compose up -d observer
   ```
5. Verify health:
   ```bash
   docker ps | grep observer
   curl https://observer.example.com/ar-io/observer/healthcheck
   ```

### Backup Before Upgrading

```bash
# Backup configuration
docker compose config > docker-compose.backup.yml

# Backup environment variables
cp .env .env.backup
```

## Additional Resources

- **Official Repository**: https://github.com/ar-io/ar-io-observer
- **AR.IO Network Documentation**: https://docs.ar.io/
- **Arweave Documentation**: https://docs.arweave.org/
- **Cloudflare Zero Trust**: https://developers.cloudflare.com/cloudflare-one/
- **Dokploy Documentation**: https://docs.dokploy.com/

## Support

For issues or questions:
- **Template Issues**: Open an issue in this repository
- **AR.IO Observer Issues**: https://github.com/ar-io/ar-io-observer/issues
- **AR.IO Community**: https://discord.gg/7zUPfN4D6g
- **Dokploy Support**: https://docs.dokploy.com/
