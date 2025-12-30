# FMD Server - Find My Device Server

**Self-hosted Find My Device server for Android device tracking and control**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://gitlab.com/fmd-foss/fmd-server/-/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-0.5.0-green.svg)](https://gitlab.com/fmd-foss/fmd-server/-/tags/v0.5.0)
[![Docker](https://img.shields.io/badge/docker-compose-blue.svg)](https://docs.docker.com/compose/)

---

## 📖 Overview

FMD Server is a privacy-focused, self-hosted server for the [Find My Device (FMD)](https://gitlab.com/fmd-foss/findmydevice) Android application. It enables you to track, locate, and control your Android devices without relying on third-party services like Google's Find My Device.

**Key Features:**
- 🔒 **Privacy-First**: Your location data stays on your server
- 📱 **Device Tracking**: Real-time location tracking for multiple devices
- 🔔 **Remote Commands**: Lock, ring, or send messages to devices
- 🗺️ **Location History**: Track device movement over time
- 💾 **Embedded Database**: Uses ObjectBox for lightweight, file-based storage
- 🔐 **HTTPS Required**: Secure WebCrypto API for encryption

---

## 🚀 Quick Start

### Prerequisites

**Required:**
1. **Dokploy Instance**: Running Dokploy installation
2. **Domain Name**: A domain or subdomain for FMD Server (e.g., `fmd.example.com`)
3. **Cloudflare Account**: For DNS-01 SSL certificate challenge (HTTPS mandatory)
4. **Traefik Configuration**: Cloudflare cert resolver configured in Traefik

**Optional:**
- FMD Android app installed on devices you want to track

### ⚠️ HTTPS Requirement

FMD Server **REQUIRES HTTPS** because it uses the WebCrypto API, which browsers only expose over secure origins. This template uses Cloudflare DNS-01 challenge for SSL certificates.

---

## 📋 Installation

### Step 1: Configure Traefik with Cloudflare DNS-01

Before deploying this template, ensure Traefik has a Cloudflare cert resolver configured.

**In your Traefik static configuration:**

```yaml
certificatesResolvers:
  cloudflare:
    acme:
      email: your-email@example.com
      storage: /letsencrypt/acme.json
      dnsChallenge:
        provider: cloudflare
        resolvers:
          - "1.1.1.1:53"
          - "1.0.0.1:53"
```

**Set Cloudflare credentials:**

```bash
# In Traefik environment or .env
CF_DNS_API_TOKEN=your_cloudflare_dns_api_token
```

**Get Cloudflare DNS API Token:**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Create Token → Use template "Edit zone DNS"
3. Permissions: `Zone:DNS:Edit` for your target zone
4. Copy the token and add to Traefik configuration

**Verify resolver:**
```bash
# Check Traefik logs for successful ACME registration
docker logs traefik 2>&1 | grep cloudflare
```

### Step 2: Deploy FMD Server in Dokploy

1. **Create New Service** in Dokploy
2. **Select Template**: Choose "FMD Server" from templates
3. **Configure Variables**:
   - `Domain`: Your FMD Server domain (e.g., `fmd.example.com`)
4. **Deploy**: Click "Deploy" and wait for build to complete

### Step 3: Configure DNS

Point your domain to your Dokploy server:

```bash
# A Record
fmd.example.com.  IN  A  <your-server-ip>

# Or CNAME
fmd.example.com.  IN  CNAME  your-server.example.com.
```

**Wait for DNS propagation** (usually 1-5 minutes with Cloudflare).

### Step 4: Verify Deployment

1. **Access FMD Server**: `https://fmd.example.com`
2. **Check SSL**: Browser should show valid HTTPS certificate
3. **Test Health**: `https://fmd.example.com/` should return a response

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FMD_DOMAIN` | ✅ Yes | - | Your FMD Server domain (e.g., `fmd.example.com`) |

### Advanced Configuration (Optional)

FMD Server uses a `config.yml` file for detailed settings. To use custom configuration:

1. **Create `config.yml`** based on the [example](https://gitlab.com/fmd-foss/fmd-server/-/blob/main/config.yml.example):

```yaml
server:
  port: 8080
  host: 0.0.0.0

database:
  # ObjectBox configuration (embedded, no external DB needed)
  path: /fmd/objectbox

logging:
  level: info
  format: json

# Additional settings...
```

2. **Mount config file** in Dokploy:
   - Go to FMD Server service → Mounts
   - Add mount: `./config.yml` → `/fmd/config.yml` (read-only)
   - Redeploy service

---

## 📱 Setting Up FMD Android App

After deploying the server, configure the FMD Android app:

1. **Download FMD App**: [F-Droid](https://f-droid.org/packages/de.nulide.findmydevice/) or [Google Play](https://play.google.com/store/apps/details?id=de.nulide.findmydevice)
2. **Open FMD App** on your Android device
3. **Configure Server**:
   - Server URL: `https://fmd.example.com`
   - Create device account or use existing
4. **Grant Permissions**:
   - Location access (required for tracking)
   - Device admin (for remote lock/wipe)
   - Other permissions as needed
5. **Test Connection**: Send a test command from web interface

---

## 🔧 Troubleshooting

### Issue 1: SSL Certificate Not Provisioning

**Symptoms:**
- Browser shows "Connection not secure"
- Traefik logs show ACME errors

**Solutions:**
1. **Verify Cloudflare DNS API token** is valid and has DNS:Edit permission
2. **Check Traefik resolver** configuration in static config
3. **Ensure DNS is propagated**: `dig fmd.example.com`
4. **Check Traefik logs**: `docker logs traefik 2>&1 | grep acme`

### Issue 2: Build from Source Failing

**Symptoms:**
- Deployment stuck on "Building"
- Container fails to start

**Solutions:**
1. **Check build logs** in Dokploy service → Logs
2. **Verify Git access**: Ensure Dokploy can reach `https://gitlab.com`
3. **Check disk space**: Building from source requires ~500MB
4. **Retry deployment**: Sometimes network issues during git clone

### Issue 3: WebCrypto API Error in Browser

**Symptoms:**
- Browser console shows "crypto is not defined" or similar
- FMD app can't connect

**Solutions:**
1. **Verify HTTPS is working**: URL must start with `https://`
2. **Check certificate validity**: Browser should show padlock icon
3. **Clear browser cache** and reload
4. **Ensure no mixed content**: All resources loaded over HTTPS

### Issue 4: Cannot Access from FMD App

**Symptoms:**
- App shows "Connection failed"
- Server is accessible in browser

**Solutions:**
1. **Check server URL** in app settings (must include `https://`)
2. **Verify firewall rules** allow HTTPS traffic (port 443)
3. **Test from browser** on same device first
4. **Check app permissions**: Location and network access required
5. **Review server logs**: Dokploy → FMD Server → Logs

### Issue 5: Health Check Failing

**Symptoms:**
- Service marked as "unhealthy" in Dokploy
- Frequent restarts

**Solutions:**
1. **Increase start_period** in docker-compose.yml (Go apps usually fast)
2. **Check application logs** for startup errors
3. **Verify port 8080** is accessible inside container
4. **Test manually**: `docker exec fmd-server curl http://localhost:8080/`

---

## 🔒 Security Considerations

1. **HTTPS is Mandatory**: FMD Server requires HTTPS for WebCrypto API
2. **Cloudflare DNS-01**: Uses DNS challenge to avoid exposing server directly
3. **Security Headers**: Template includes HSTS, XSS protection, frame denial
4. **Location Data**: Sensitive - ensure server is properly secured
5. **Regular Updates**: Monitor [FMD Server releases](https://gitlab.com/fmd-foss/fmd-server/-/tags) for security patches

---

## 📊 Architecture

```
┌─────────────────┐
│  FMD Android    │
│     App         │
└────────┬────────┘
         │ HTTPS
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│    Traefik      │──────│  FMD Server     │
│  (SSL + Proxy)  │      │   (Go + Box)    │
└─────────────────┘      └────────┬────────┘
         ▲                        │
         │                        ▼
         │               ┌─────────────────┐
         │               │  ObjectBox DB   │
         │               │ (Embedded File) │
         │               └─────────────────┘
         │
┌─────────────────┐
│   Cloudflare    │
│  DNS-01 ACME    │
└─────────────────┘
```

**Components:**
- **Traefik**: Reverse proxy with automatic SSL via Cloudflare DNS-01
- **FMD Server**: Go application built from official GitLab source (v0.5.0)
- **ObjectBox**: Embedded file-based database (no external DB needed)
- **Cloudflare**: DNS provider for ACME challenge

---

## 🔄 Updates

### Updating FMD Server

To update to a new version:

1. **Check for new releases**: [GitLab Tags](https://gitlab.com/fmd-foss/fmd-server/-/tags)
2. **Update docker-compose.yml**:
   ```yaml
   build:
     context: https://gitlab.com/fmd-foss/fmd-server.git#v0.6.0  # Update version
   ```
3. **Redeploy** in Dokploy
4. **Backup data** before major version updates:
   ```bash
   # Backup ObjectBox data
   docker cp fmd-server:/fmd/objectbox ./objectbox-backup
   ```

---

## 📚 Resources

### Official Documentation
- **FMD Server**: https://gitlab.com/fmd-foss/fmd-server
- **FMD Android App**: https://gitlab.com/fmd-foss/findmydevice
- **Build Instructions**: https://gitlab.com/fmd-foss/fmd-server/-/blob/main/README.md

### Related Projects
- **ObjectBox Go**: https://github.com/objectbox/objectbox-go
- **Traefik ACME**: https://doc.traefik.io/traefik/https/acme/
- **Cloudflare DNS**: https://developers.cloudflare.com/dns/

### Community
- **Issues**: https://gitlab.com/fmd-foss/fmd-server/-/issues
- **Discussions**: https://gitlab.com/fmd-foss/fmd-server/-/merge_requests

---

## 📝 License

- **FMD Server**: Apache License 2.0
- **This Template**: MIT License

---

## 🤝 Contributing

Found an issue or have a suggestion? Please open an issue in the [Dokploy Templates repository](https://github.com/your-org/dokploy-templates).

---

**Template Version**: 1.0.0
**FMD Server Version**: v0.5.0
**Last Updated**: 2025-12-29
