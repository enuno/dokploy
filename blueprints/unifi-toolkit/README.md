# UniFi Toolkit

A self-hosted web dashboard for monitoring and managing Ubiquiti UniFi network infrastructure. Track network health, monitor devices, detect threats, and analyze performance - all from a beautiful, responsive web interface.

## Features

- **Network Dashboard** - Real-time gateway info, resource utilization, WAN status, and connected client counts
- **Wi-Fi Stalker** - Track specific devices by MAC address across your network with roaming behavior analysis
- **Threat Watch** - Monitor IDS/IPS security events from your UniFi gateway with threat categorization
- **Network Pulse** - Live WebSocket-powered network monitoring with real-time device distribution and AP analytics
- **Production-Grade** - HTTPS via Let's Encrypt, health checks, persistent storage, proper error handling

## Architecture

```
┌─────────────────────────────────────────────────┐
│      Docker Compose Stack                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  unifi-toolkit (Python 3.12, Uvicorn)           │
│  ├─ Port: 8000 (internal)                       │
│  ├─ Storage: SQLite at /app/data                │
│  └─ Health: GET /health endpoint                │
│                                                 │
│  Networks:                                      │
│  ├─ Internal: unifi-net (bridge)                │
│  └─ External: dokploy-network (Traefik)        │
│                                                 │
│  External Access:                               │
│  └─ HTTPS via Traefik + Let's Encrypt          │
│                                                 │
│  External Dependency:                           │
│  └─ UniFi Controller (192.168.x.x on LAN)      │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Docker & Docker Compose v2.x+
- A running UniFi Controller on your local network (UniFi Dream Machine, Cloud Key, or self-hosted)
- Domain name (optional, for internet-facing deployments)
- Traefik reverse proxy running (standard in Dokploy)

### 1. Get UniFi Controller Information

Before deploying, gather these from your UniFi Controller:

**Controller URL:**
- Find your controller's IP address (e.g., `192.168.1.1`, `192.168.1.5`)
- Example: `https://192.168.1.1`

**API Key (Recommended - UniFi OS 3+):**
1. Go to UniFi Controller UI
2. Settings → Admins
3. Create API Key with appropriate permissions
4. Copy the key

**Alternative: Username/Password (Legacy):**
- If using older UniFi controller without API keys
- Use your admin username and password

### 2. Deploy with Dokploy

1. Create new Dokploy template
2. Select "UniFi Toolkit" from available templates
3. Configure variables:
   - **Domain**: Your domain (e.g., `unifi.example.com`)
   - **Encryption Key**: Auto-generated, leave as is
   - **UniFi Controller URL**: Your controller IP (e.g., `https://192.168.1.1`)
   - **UniFi API Key**: Paste from step 1 above

4. Deploy and wait for health checks to pass

### 3. Verify Deployment

```bash
# Check container status
docker compose ps

# View logs
docker compose logs unifi-toolkit

# Test health endpoint (from host)
curl http://localhost:8000/health
```

### 4. Access the Application

- **URL**: `https://your-domain.com` (or internal IP if not internet-facing)
- **First Access**: Dashboard loads automatically
- **Configuration**: Configure UniFi features in the web UI

## Configuration

### Environment Variables

All variables are configured via Dokploy's template interface. Here's what each one controls:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DOMAIN` | Yes | Your application domain | `unifi.example.com` |
| `ENCRYPTION_KEY` | Yes | Data encryption (auto-generated) | Base64 string |
| `UNIFI_CONTROLLER_URL` | Yes | UniFi controller URL | `https://192.168.1.1` |
| `UNIFI_SITE_ID` | No | Site ID (defaults to "default") | `default` |
| `UNIFI_API_KEY` | Yes* | API key from UniFi controller | `abc123...` |
| `UNIFI_USERNAME` | Yes* | Admin username (legacy) | `admin` |
| `UNIFI_PASSWORD` | Yes* | Admin password (legacy) | `password` |
| `LOG_LEVEL` | No | Logging verbosity | `INFO`, `DEBUG` |
| `DEBUG` | No | Enable debug mode | `false` (default) |

*Choose either API Key OR Username/Password, not both

### UniFi Controller Setup

#### For UniFi OS (Cloud Key Gen2, UDM, UDM Pro):

1. **Create API Key:**
   - Log in to UniFi UI
   - Go to Settings (gear icon)
   - Click "Admins"
   - Create new admin account or select existing
   - Generate API Key from admin settings
   - Copy the key to `UNIFI_API_KEY`

2. **Get Controller URL:**
   - Use local IP address: `https://192.168.1.1`
   - Do NOT use cloud access (`unifi.ui.com`) - not supported

#### For Self-Hosted UniFi Controller (Ubuntu/Docker):

1. **Enable Local API Access:**
   - Controller must be accessible on local network
   - Ensure port 8443 (default) is accessible

2. **Legacy Method (Username/Password):**
   - Use admin username and password
   - Set `UNIFI_USERNAME` and `UNIFI_PASSWORD`

3. **Recommended: Create API Key:**
   - Some newer versions support API keys
   - Check UniFi Controller documentation

### Network Configuration

This deployment connects to:

**Internal Network (unifi-net):**
- Only the unifi-toolkit service
- Used for service health checks

**External Network (dokploy-network):**
- Shared with Traefik reverse proxy
- Handles HTTPS termination
- Provides external routing

**External Services:**
- UniFi Controller on your local network
- DNS for domain resolution
- Let's Encrypt for SSL certificates

### Optional: Caddy Reverse Proxy

The template includes an optional Caddy service for alternative HTTPS setup:

```bash
# Enable Caddy (if you want HTTPS without Traefik)
1. Uncomment caddy service in docker-compose.yml
2. Configure Caddyfile with your domain
3. Update ports in Dokploy settings
```

**Note**: Traefik is recommended for Dokploy deployments. Only use Caddy if Traefik is unavailable.

## Post-Deployment

### 1. Initial Access

Open `https://your-domain.com` in your browser. You should see:
- Network Dashboard (if UniFi connection successful)
- Available features based on your controller capabilities

### 2. Connection Troubleshooting

If dashboard shows "No data" or connection errors:

**Check UniFi Controller Accessibility:**
```bash
# From Docker host
ping 192.168.1.1  # Replace with your controller IP
```

**Verify API Key Permissions:**
- Log into UniFi UI
- Check admin account has proper permissions
- Regenerate API key if needed

**Check Docker Logs:**
```bash
docker compose logs unifi-toolkit
```

**Common Issues:**

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Connection refused" | Controller IP wrong | Update `UNIFI_CONTROLLER_URL` |
| "Authentication failed" | Invalid API key | Regenerate key in UniFi settings |
| "SSL certificate error" | Self-signed cert on controller | Add to trusted certificates (if supported) |
| "No data displayed" | Controller unreachable from container | Verify container can ping controller |

### 3. Enable Features

Once connected, configure available monitoring:

**Wi-Fi Stalker:**
- Enter device MAC address to track
- View real-time signal strength and roaming

**Threat Watch:**
- Automatically monitors IDS/IPS events
- Configure sensitivity thresholds

**Network Pulse:**
- View live device connections
- Analyze AP coverage and performance

## Backup & Recovery

### Backup Application Data

UniFi Toolkit stores data in a SQLite database within the `unifi-data` volume:

**Via Dokploy:**
1. Go to template settings
2. Select "Volumes"
3. Click backup icon on `unifi-data`
4. Save snapshot

**Manual Backup:**
```bash
# Create backup of data volume
docker run --rm -v unifi-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/unifi-toolkit-$(date +%Y%m%d).tar.gz -C / data

# Restore from backup
docker run --rm -v unifi-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/unifi-toolkit-*.tar.gz -C /
```

### Database Reset

If you need to reset the application state:

```bash
# WARNING: This deletes all UniFi Toolkit data
docker volume rm unifi-data

# Recreate container to reinitialize
docker compose up -d
```

## Performance Tuning

### For Large Networks (500+ devices)

**Adjust logging level:**
```yaml
LOG_LEVEL: WARN  # Reduce logging overhead
```

**Monitor memory usage:**
```bash
docker stats unifi-toolkit
```

**If memory usage is high:**
1. Reduce polling frequency (in app settings)
2. Limit history retention (in app settings)
3. Increase container memory limit

### For Small/Remote Networks

**Consider network bandwidth:**
- Application uses WebSocket for real-time updates
- Minimal bandwidth on local network
- Monitor bandwidth if accessing remotely via VPN

## Advanced Features

### Cloudflare Integration (Optional)

To add additional security and performance:

1. **Cloudflare DDoS Protection:**
   - Add your domain to Cloudflare
   - Configure as CNAME to your Dokploy domain
   - Enable DDoS protection

2. **Zero Trust Access (Advanced):**
   - Protect with Cloudflare Access
   - Requires additional configuration
   - See Cloudflare documentation

3. **Web Analytics:**
   - Enable Cloudflare Web Analytics
   - Monitor application traffic

### Custom Domain Setup

**For internet-facing deployment:**

1. Configure DNS:
   - Update DNS provider with Traefik IP
   - Point `unifi.example.com` → Your Dokploy host

2. Update environment:
   - Set `DOMAIN` to your domain
   - Redeploy container

3. Verify HTTPS:
   - Open `https://your-domain.com`
   - Check SSL certificate (Let's Encrypt)

## Troubleshooting

### General Issues

**Container won't start:**
```bash
docker compose logs unifi-toolkit
# Check for permission errors, missing variables, port conflicts
```

**Health check failures:**
- Increase `start_period` in docker-compose.yml
- Verify UniFi controller is reachable
- Check network connectivity

**High CPU/Memory usage:**
- Check if large number of connected devices
- Review log output for errors
- Consider limiting monitoring scope

### Network Connectivity

**From within container, test UniFi connectivity:**
```bash
# Exec into container
docker compose exec unifi-toolkit /bin/bash

# Test connectivity
curl -k https://192.168.1.1:443 -v

# Check DNS
nslookup google.com
```

**For VPN/Remote Scenarios:**
- Ensure VPN tunnel is active
- Verify routing table includes controller network
- Test connectivity from Docker host first

### SSL/TLS Issues

**Self-signed certificate errors:**
- If controller uses self-signed cert, application may reject it
- Solution: Controller must have valid certificate or...
- Use API key instead of password authentication

**Let's Encrypt certificate renewal:**
- Traefik handles automatic renewal
- Monitor logs for renewal failures
- Ensure HTTP challenge can reach Traefik

## Production Checklist

Before exposing to the internet:

- [ ] Domain name configured and DNS updated
- [ ] HTTPS working (green lock in browser)
- [ ] UniFi controller firewall allows access
- [ ] Regular backups configured
- [ ] Monitor logs for errors
- [ ] Test from external network (VPN)
- [ ] Verify no sensitive data in browser console

## Maintenance

### Regular Updates

**Check for template updates:**
1. Review Dokploy for updated template
2. Compare new version with your configuration
3. Test in staging environment first

**Update UniFi Toolkit image:**
1. Update image version in template
2. Test connection after update
3. Revert if issues occur

### Security Updates

**Keep Docker updated:**
```bash
# Check for updates
docker --version

# Update Docker (platform-specific)
```

**Monitor UniFi Controller security:**
- Keep UniFi controller software updated
- Use strong API key / password
- Regularly review access logs

## Support & Links

- **GitHub:** https://github.com/Crosstalk-Solutions/unifi-toolkit
- **UniFi Documentation:** https://help.ubnt.com/
- **Dokploy Docs:** https://dokploy.com/
- **Let's Encrypt:** https://letsencrypt.org/

## License

UniFi Toolkit is licensed under the MIT License.

---

**Deployment Date:** Auto-generated by Dokploy
**Template Version:** 1.0.0
**Last Updated:** 2026-03-13
