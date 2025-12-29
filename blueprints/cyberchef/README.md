# CyberChef - The Cyber Swiss Army Knife

A simple, intuitive web application for carrying out all manner of "cyber" operations within a browser. Perform encryption, encoding, compression, hashing, and data analysis without specialized knowledge.

## Overview

CyberChef is an open-source tool developed by GCHQ (UK intelligence agency) that enables technical and non-technical users to perform complex data manipulations directly in their browser. This Dokploy template provides a production-ready deployment with HTTPS, health monitoring, and zero server-side data processing.

**Key Features:**
- 🔐 **300+ Operations**: Encryption, encoding, compression, hashing, data analysis
- 🌐 **Client-Side Processing**: All operations run in your browser (zero data sent to server)
- 🔗 **Shareable Recipes**: Save and share operation chains via URL
- 🚀 **Offline Capable**: Works without internet after initial load
- 🎯 **No Dependencies**: Single static container, no database required
- 🔒 **Privacy-First**: No data logging, no tracking, no analytics

## Architecture

```
┌──────────────────────┐
│     CyberChef        │
│  (static web app)    │
│  Port: 80 (internal) │
└──────────────────────┘
           │
           ▼
    Traefik (HTTPS)
           │
           ▼
  https://cyberchef.yourdomain.com
```

**Architecture Highlights:**
- **Single Container**: Minimal footprint (static NGINX serving HTML/JS)
- **No Backend**: All crypto/data operations happen in browser
- **No Storage**: Stateless design, no persistent volumes needed
- **Network Isolation**: Uses dokploy-network for Traefik routing only

## Quick Start

### Prerequisites

- Dokploy instance running
- Domain name pointed to your server
- Port 443 (HTTPS) accessible

### Deployment

1. **Import Template** in Dokploy:
   ```
   Template URL: https://raw.githubusercontent.com/[your-repo]/dokploy/main/blueprints/cyberchef/
   ```

2. **Configure Variables**:
   | Variable | Description | Example |
   |----------|-------------|---------|
   | `CYBERCHEF_DOMAIN` | Your domain for CyberChef | `cyberchef.example.com` |

3. **Deploy**: Click "Deploy" in Dokploy

4. **Access**: Navigate to `https://your-domain.com`

### Manual Deployment

```bash
# Clone repository
git clone [your-repo-url]
cd blueprints/cyberchef

# Set environment variable
export CYBERCHEF_DOMAIN=cyberchef.example.com

# Deploy with Docker Compose
docker compose up -d
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CYBERCHEF_DOMAIN` | ✅ Yes | - | Domain name for accessing CyberChef |

### Network Configuration

- **Internal Network**: `cyberchef-net` (bridge driver)
- **External Network**: `dokploy-network` (Traefik routing)
- **Exposed Port**: 80 (internal) → 443 (HTTPS via Traefik)

### SSL/TLS Configuration

- **Certificate**: Automatic Let's Encrypt via Traefik
- **Renewal**: Automatic (handled by Traefik)
- **Protocol**: HTTPS only (websecure entrypoint)

## Post-Deployment

### 1. Verify Deployment

Check that CyberChef is running:

```bash
# Check container status
docker ps | grep cyberchef

# Check health status
docker inspect cyberchef_cyberchef_1 --format='{{.State.Health.Status}}'
# Expected: healthy
```

### 2. Access CyberChef

Navigate to your configured domain:

```
https://cyberchef.yourdomain.com
```

You should see the CyberChef interface with:
- **Input**: Text area for input data
- **Operations**: Drag-and-drop operation menu
- **Recipe**: Chain of operations to apply
- **Output**: Processed result

### 3. Test Basic Operation

Try a simple operation:

1. Enter text in **Input** pane: `Hello World`
2. Drag **"To Base64"** from Operations menu to Recipe
3. See result in **Output** pane: `SGVsbG8gV29ybGQ=`
4. Click **"Bake!"** to apply recipe

### 4. Save and Share Recipe

To share an operation chain:

1. Build your recipe with multiple operations
2. Click **"Save Recipe"** (floppy disk icon)
3. Copy the generated URL (contains recipe in hash fragment)
4. Share URL with others - recipe loads automatically

Example URL:
```
https://cyberchef.yourdomain.com/#recipe=To_Base64('A-Za-z0-9%2B/%3D')
```

## Common Use Cases

### 1. Data Encoding/Decoding

**Base64 Encode:**
```
Operations: To Base64
Input: Any text or file
Output: Base64-encoded string
```

**URL Encoding:**
```
Operations: URL Encode
Input: Text with special characters
Output: URL-safe string
```

### 2. Hashing

**Generate SHA-256 Hash:**
```
Operations: SHA2 (select SHA-256)
Input: Any text
Output: 64-character hex hash
```

**Compare Hashes:**
```
Operations: SHA2, Compare hashes
Input: File content
Output: Hash match verification
```

### 3. Encryption/Decryption

**AES Encrypt:**
```
Operations: AES Encrypt
Input: Plaintext + Key + IV
Output: Encrypted ciphertext
```

**Password Generation:**
```
Operations: Generate Password
Parameters: Length, character sets
Output: Secure random password
```

### 4. Data Analysis

**Extract URLs from Text:**
```
Operations: Extract URLs
Input: Text containing URLs
Output: List of extracted URLs
```

**JSON Beautify:**
```
Operations: JSON Beautify
Input: Minified JSON
Output: Formatted JSON with indentation
```

### 5. File Operations

**Magic Operation (Auto-detect):**
```
Operations: Magic
Input: Encoded/encrypted data
Output: Automatically decoded result
```

**File Hash Calculation:**
```
1. Drop file into Input pane
2. Add operation: SHA256
3. Output: File hash
```

## Troubleshooting

### Issue 1: Cannot Access CyberChef

**Symptoms:** Domain returns 404 or connection refused

**Diagnosis:**
```bash
# Check container is running
docker ps | grep cyberchef

# Check Traefik routing
docker logs traefik | grep cyberchef

# Check health status
docker inspect cyberchef_cyberchef_1 --format='{{.State.Health.Status}}'
```

**Solutions:**
1. Verify DNS points to your server IP
2. Check domain configured correctly: `echo $CYBERCHEF_DOMAIN`
3. Restart container: `docker compose restart cyberchef`
4. Check Traefik logs for routing errors

### Issue 2: Operations Not Working

**Symptoms:** Operations fail to process data

**Solutions:**
1. **Clear Browser Cache**: CyberChef is cached, force refresh (Ctrl+F5)
2. **Check Browser Console**: Look for JavaScript errors (F12 → Console)
3. **Try Different Browser**: Test in Chrome/Firefox/Edge
4. **Verify Input Format**: Some operations require specific input formats

### Issue 3: Health Check Failing

**Symptoms:** Container marked as unhealthy

**Diagnosis:**
```bash
# Check health check logs
docker inspect cyberchef_cyberchef_1 --format='{{json .State.Health}}' | jq

# Check NGINX is responding
docker exec cyberchef_cyberchef_1 wget -qO- http://localhost:80/
```

**Solutions:**
1. Increase health check start_period if slow startup
2. Verify port 80 is not blocked inside container
3. Check container logs: `docker logs cyberchef_cyberchef_1`

### Issue 4: Recipe URL Not Loading

**Symptoms:** Shared recipe URL doesn't load operations

**Cause:** Recipe is stored in URL hash fragment (after `#`)

**Solutions:**
1. Ensure complete URL is copied (including everything after `#`)
2. Check for URL encoding issues (use "Copy link" button in CyberChef)
3. Verify recipe format is correct in URL

### Issue 5: Slow Performance

**Symptoms:** Operations take long time to complete

**Explanation:** CyberChef runs in your browser, performance depends on:
- Browser performance (CPU/memory)
- Input data size (large files take longer)
- Operation complexity (encryption/hashing is CPU-intensive)

**Solutions:**
1. Use modern browser (Chrome/Firefox latest)
2. Close unnecessary tabs to free memory
3. Split large operations into smaller chunks
4. Use "Disable auto bake" for complex recipes

### Issue 6: SSL Certificate Not Provisioning

**Symptoms:** HTTPS not working, certificate errors

**Diagnosis:**
```bash
# Check Traefik certificate status
docker exec traefik cat /letsencrypt/acme.json | jq '.letsencrypt.Certificates[] | select(.domain.main=="cyberchef.yourdomain.com")'
```

**Solutions:**
1. Verify domain DNS is correctly configured
2. Check domain is accessible on port 80 (Let's Encrypt validation)
3. Wait 5-10 minutes for certificate provisioning
4. Check Traefik logs: `docker logs traefik`

### Issue 7: Container Keeps Restarting

**Diagnosis:**
```bash
# Check container restart count
docker ps -a | grep cyberchef

# Check container logs for errors
docker logs cyberchef_cyberchef_1 --tail 100
```

**Solutions:**
1. Check for port conflicts on port 80
2. Verify image is accessible: `docker pull ghcr.io/gchq/cyberchef:10.19.4`
3. Check Docker daemon logs: `sudo journalctl -u docker --since "10 minutes ago"`

## Security Considerations

### Client-Side Processing Model

**IMPORTANT:** CyberChef performs ALL operations in your browser:

- ✅ **No data sent to server**: Input/output never leaves your browser
- ✅ **No server-side logging**: Server only serves static HTML/JS files
- ✅ **Offline capable**: Works without network after initial page load
- ✅ **Recipe sharing safe**: Recipes in URL contain only operation names, not data

### Network Security

- **HTTPS Enforced**: All traffic encrypted via Let's Encrypt
- **No Database**: No data storage = no data breach risk
- **Minimal Attack Surface**: Static NGINX container, no backend code
- **Network Isolation**: Container isolated on internal bridge network

### Access Control

**Public vs Private Deployment:**

1. **Public Deployment** (default):
   - Accessible to anyone with URL
   - Safe because all processing is client-side
   - No user data stored on server

2. **Private Deployment** (optional):
   - Add Cloudflare Zero Trust for authentication
   - Restrict access to internal network only
   - Use VPN/Tailscale for remote access

**To restrict access**, add authentication layer:

```yaml
# Add to docker-compose.yml labels
labels:
  - "traefik.http.routers.cyberchef.middlewares=auth@file"
```

Then configure basic auth or OAuth in Traefik.

### Data Handling Best Practices

1. **Don't paste secrets into browser**: Even though client-side, browser history/cache may store
2. **Use incognito mode**: For sensitive operations (clears data on close)
3. **Verify HTTPS**: Check padlock icon before using
4. **Clear browser cache**: After sensitive operations
5. **Don't share screenshots**: May contain sensitive data in URL/recipe

## Performance Tuning

### Browser Optimization

CyberChef performance depends on browser capabilities:

1. **Use Chrome/Edge**: Best JavaScript performance
2. **Enable hardware acceleration**: Chrome Settings → Advanced → System
3. **Increase memory**: Close other tabs/applications
4. **Use recent browser version**: Latest versions have performance improvements

### Operation Optimization

1. **Disable Auto Bake**: For complex recipes (toggle in settings)
2. **Use "Step through" mode**: Debug recipes one operation at a time
3. **Limit input size**: Very large files (>100MB) may freeze browser
4. **Chain operations efficiently**: Some operations can be combined

### Container Resource Limits (Optional)

For resource-constrained environments, add limits:

```yaml
# Add to docker-compose.yml service
deploy:
  resources:
    limits:
      memory: 128M
      cpus: "0.5"
```

CyberChef is lightweight - these limits are only needed if running many services.

## Backup and Maintenance

### Backup Strategy

**What to Backup:**
- ❌ **No persistent data**: CyberChef is stateless, nothing to backup
- ✅ **Save recipes**: Export recipes as JSON or bookmark URLs
- ✅ **Document configuration**: Keep copy of template.toml/docker-compose.yml

**Recipe Backup Methods:**

1. **URL Bookmarks**: Save recipe URLs in browser bookmarks
2. **JSON Export**: CyberChef → Save → Download recipe as JSON file
3. **Version Control**: Store recipes in Git repository

### Container Updates

Update to latest CyberChef version:

```bash
# Check current version
docker inspect cyberchef_cyberchef_1 --format='{{.Config.Image}}'

# Update docker-compose.yml with new version
# Example: ghcr.io/gchq/cyberchef:10.20.0

# Pull new image
docker pull ghcr.io/gchq/cyberchef:10.20.0

# Restart with new image
docker compose up -d
```

**Update Frequency:**
- Check for updates monthly: https://github.com/gchq/CyberChef/releases
- Update when security patches released
- Test in staging before production update

### Monitoring

**Health Monitoring:**

```bash
# Check container health
docker inspect cyberchef_cyberchef_1 --format='{{.State.Health.Status}}'

# Monitor resource usage
docker stats cyberchef_cyberchef_1

# Check uptime
docker ps --filter name=cyberchef --format "table {{.Names}}\t{{.Status}}"
```

**Log Monitoring:**

```bash
# View recent logs
docker logs cyberchef_cyberchef_1 --tail 100

# Follow logs in real-time
docker logs -f cyberchef_cyberchef_1

# Check for errors
docker logs cyberchef_cyberchef_1 2>&1 | grep -i error
```

## Advanced Configuration

### Custom NGINX Configuration

To customize NGINX settings (cache, gzip, headers):

1. Create custom NGINX config
2. Mount as volume in docker-compose.yml
3. Restart container

```yaml
# Add to docker-compose.yml
volumes:
  - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

### Content Security Policy

Add stricter CSP headers via Traefik middleware:

```yaml
labels:
  - "traefik.http.middlewares.cyberchef-csp.headers.contentSecurityPolicy=default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  - "traefik.http.routers.cyberchef.middlewares=cyberchef-csp"
```

### Cloudflare Integration

For additional CDN caching and DDoS protection:

1. Add domain to Cloudflare
2. Set DNS to proxied (orange cloud)
3. Configure Page Rules for caching:
   - Cache Level: Standard
   - Browser Cache TTL: 4 hours
   - Edge Cache TTL: 1 day

**Benefits:**
- Faster load times globally (Cloudflare CDN)
- DDoS protection
- Analytics (page views, unique visitors)
- Automatic image optimization

## Resources

### Official Documentation
- **GitHub Repository**: https://github.com/gchq/CyberChef
- **Live Demo**: https://gchq.github.io/CyberChef/
- **Operation Wiki**: https://github.com/gchq/CyberChef/wiki

### Community
- **GitHub Issues**: https://github.com/gchq/CyberChef/issues
- **Discussions**: https://github.com/gchq/CyberChef/discussions
- **Twitter**: @GCHQ (for major announcements)

### Learning Resources
- **CyberChef Tutorial**: https://www.youtube.com/results?search_query=cyberchef+tutorial
- **Recipe Collection**: https://github.com/mattnotmax/cyberchef-recipes
- **CTF Challenges**: Many CTFs use CyberChef for crypto challenges

### Related Tools
- **CybeChef Recipes**: https://github.com/mattnotmax/cyberchef-recipes
- **Cyber Swiss**: Mobile-friendly fork of CyberChef
- **Awesome CyberChef**: https://github.com/topics/cyberchef

## Support

### Getting Help

1. **Check Logs**: `docker logs cyberchef_cyberchef_1`
2. **Review Troubleshooting**: See section above
3. **GitHub Issues**: https://github.com/gchq/CyberChef/issues
4. **Community Discussions**: https://github.com/gchq/CyberChef/discussions

### Reporting Issues

For template-specific issues:
1. Include docker compose logs
2. Include domain configuration
3. Include browser console errors (if UI issue)
4. Specify CyberChef version

For CyberChef application issues:
1. Report directly to GCHQ CyberChef repository
2. Include recipe that causes issue
3. Include browser version and OS

## Version History

### Template v1.0.0 (2025-12-28)

**Initial Release:**
- Docker Image: `ghcr.io/gchq/cyberchef:10.19.4`
- Single-service static deployment
- Automatic HTTPS via Let's Encrypt
- Health monitoring configured
- Production-ready security standards

**Features:**
- ✅ Client-side processing (zero data sent to server)
- ✅ 300+ operations (encryption, encoding, hashing)
- ✅ Shareable recipes via URL
- ✅ Offline capable after initial load
- ✅ No dependencies (no database, no cache)

**Security:**
- ✅ HTTPS enforced (Let's Encrypt)
- ✅ Pinned image version
- ✅ Network isolation
- ✅ Minimal attack surface

## License

- **CyberChef Application**: Apache License 2.0 (GCHQ)
- **Dokploy Template**: MIT License (this repository)

---

**Template Maintained By:** Home Lab Infrastructure Team
**Review Cycle:** Quarterly or upon CyberChef version updates
**Next Review:** March 2025

**Questions or Issues?** Open an issue in this repository.
