# GoAccess for Nginx Proxy Manager

**Real-time web log analyzer with beautiful dashboard**

GoAccess is an open-source web log analyzer that provides fast, terminal-based (and web-based) analytics for your web server logs. This Dokploy template provides a containerized GoAccess instance specifically configured for Nginx Proxy Manager, with support for Traefik and Caddy logs as well.

---

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Configuration Reference](#-configuration-reference)
- [Log Type Configuration](#-log-type-configuration)
- [Nginx Proxy Manager Integration](#-nginx-proxy-manager-integration)
- [Cloudflare Zero Trust](#-cloudflare-zero-trust-optional)
- [Advanced Configuration](#-advanced-configuration)
- [Troubleshooting](#-troubleshooting)
- [Performance Tuning](#-performance-tuning)
- [Accessing the Dashboard](#-accessing-the-dashboard)

---

## ✨ Features

- **Real-time Analytics**: Live dashboard with WebSocket updates
- **Multi-format Support**: NPM, Traefik, Caddy, NCSA Combined, and custom formats
- **GeoIP Integration**: Built-in GeoLite2 databases for country/city/ASN detection
- **Browser Detection**: Identify browsers, operating systems, and devices
- **Flexible Filtering**: Include/exclude specific proxy hosts or IP addresses
- **Archived Log Support**: Process compressed (.gz) log files
- **Authentication**: Built-in basic auth or Cloudflare Zero Trust integration
- **Multi-language**: Support for 11 languages including English, Spanish, French, Japanese
- **Multiple Endpoints**: Separate dashboards for proxy, redirection, and error logs (when using NPM+ALL)

---

## 📦 Prerequisites

### Required
- **Dokploy Instance**: Fully configured with Traefik
- **Nginx Proxy Manager Logs**: Path to NPM log directory
  - Default NPM location: `/var/lib/docker/volumes/npm_data/_data/logs`
  - Or wherever your NPM container stores logs

### Optional
- **Cloudflare Account**: For Zero Trust authentication (recommended for public exposure)
- **Custom GoAccess Config**: For LOG_TYPE=CUSTOM (advanced users)

---

## 🚀 Quick Start

### 1. Deploy via Dokploy

1. Navigate to your Dokploy instance
2. Go to **Templates** → **Community Templates**
3. Search for "GoAccess for Nginx Proxy Manager"
4. Click **Deploy**

### 2. Configure Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `domain` | Your dashboard domain | `goaccess.example.com` |
| `npm_log_path` | **REQUIRED**: Path to NPM logs on host | `/var/lib/docker/volumes/npm_data/_data/logs` |

**Important**: The `npm_log_path` must point to your Nginx Proxy Manager log directory on the host system where Dokploy is running.

#### Finding Your NPM Log Path

**Option 1: NPM Docker Volume (Most Common)**
```bash
# If NPM is running via Docker
docker volume inspect npm_data | grep Mountpoint
# Output: "Mountpoint": "/var/lib/docker/volumes/npm_data/_data"
# Your log path: /var/lib/docker/volumes/npm_data/_data/logs
```

**Option 2: NPM Compose Deployment**
```bash
# Check your NPM docker-compose.yml for volume mapping
# Look for a line like:
#   - ./data:/data
# If NPM data is in ./data, logs are in ./data/logs
```

**Option 3: Verify Log Files Exist**
```bash
# List files in your suspected log directory
ls -lah /var/lib/docker/volumes/npm_data/_data/logs/
# You should see files like:
#   proxy-host-1_access.log
#   proxy-host-2_access.log
#   redirection_access.log
```

### 3. Deploy and Access

After deployment, access your dashboard at: `https://goaccess.example.com/`

---

## ⚙️ Configuration Reference

### Required Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `domain` | Dashboard domain | - | ✅ |
| `npm_log_path` | Path to NPM logs on host | - | ✅ |

### Log Processing Configuration

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `log_type` | Log format to parse | `NPM` | `NPM`, `NPM+R`, `NPM+ALL`, `TRAEFIK`, `CADDY_V1`, `NCSA_COMBINED`, `CUSTOM` |
| `skip_archived_logs` | Skip .gz compressed logs | `False` | `True`, `False` |
| `exclude_ips` | Comma-separated IPs to filter out | - | `192.168.1.1,10.0.0.1` |
| `include_proxy_hosts` | Specific proxy hosts to monitor | All hosts | `1,5,12` (proxy-host IDs) |
| `log_pattern` | File matching pattern | `*.log` | `*.log`, `access.log`, etc. |

### Authentication Configuration

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `basic_auth` | Enable HTTP basic auth | `False` | Set to `True` to enable |
| `basic_auth_username` | Username for basic auth | - | Required if `basic_auth=True` |
| `basic_auth_password` | Password for basic auth | - | Required if `basic_auth=True` |

**Security Note**: For production deployments, use Cloudflare Zero Trust instead of basic auth for better security.

### Display & Performance

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `html_refresh` | Dashboard auto-refresh interval | Disabled | `60` (seconds) |
| `keep_last` | Retention days in storage | All data | `30` (days) |
| `processing_threads` | Concurrent processing threads | `1` | `4` (for large logs) |
| `enable_browsers` | Enable browser detection list | `False` | `True` |
| `custom_browsers` | Custom browser definitions | - | See [Custom Browsers](#custom-browser-definitions) |

### Localization

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `lang` | Display language | `en_US.UTF-8` | `de_DE`, `es_ES`, `fr_FR`, `it_IT`, `ja_JP`, `ko_KR`, `pt_BR.UTF-8`, `ru_RU`, `sv_SE`, `uk_UA`, `zh_CN` |
| `tz` | Timezone | `UTC` | `America/New_York`, `Europe/London`, etc. |

### System Configuration

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `puid` | User ID for file permissions | `1000` | Match your host user ID |
| `pgid` | Group ID for file permissions | `1000` | Match your host group ID |
| `debug` | Enable verbose logging | `False` | Set to `True` for troubleshooting |

---

## 📊 Log Type Configuration

GoAccess supports multiple log formats. Choose the appropriate `log_type` for your environment:

### NPM (Default)
**Best for**: Standard Nginx Proxy Manager deployments

Parses NPM proxy host access logs:
- `proxy-host-*_access.log`
- `proxy-host-*_access.log.*.gz` (if `skip_archived_logs=False`)

**Dashboard**: `https://goaccess.example.com/`

```toml
log_type = "NPM"
```

### NPM+R (NPM with Redirections)
**Best for**: NPM deployments using redirection hosts

Provides **two dashboards**:
1. Main: `https://goaccess.example.com/` (proxy hosts)
2. Redirection: `https://goaccess.example.com/redirection/` (redirection stats)

```toml
log_type = "NPM+R"
```

### NPM+ALL (Complete NPM Monitoring)
**Best for**: Comprehensive NPM monitoring including errors

Provides **three dashboards**:
1. Main: `https://goaccess.example.com/` (proxy hosts)
2. Redirection: `https://goaccess.example.com/redirection/`
3. Errors: `https://goaccess.example.com/error/`

```toml
log_type = "NPM+ALL"
```

**Note**: Error log parsing requires at least one valid entry per file due to inconsistent NPM error formatting.

### TRAEFIK
**Best for**: Traefik access logs

Parses Traefik common log format:
```toml
log_type = "TRAEFIK"
```

### CADDY_V1
**Best for**: Caddy v1 web server logs

```toml
log_type = "CADDY_V1"
```

### NCSA_COMBINED
**Best for**: Standard NCSA combined format logs

```toml
log_type = "NCSA_COMBINED"
```

### CUSTOM
**Best for**: Custom log formats

Requires mounting custom GoAccess configuration:

```yaml
volumes:
  - /path/to/npm/logs:/opt/log:ro
  - /path/to/custom/config:/opt/custom:ro
```

Place your `goaccess.conf` in `/path/to/custom/config/` on the host.

---

## 🔗 Nginx Proxy Manager Integration

### Automatic Configuration

GoAccess automatically discovers and parses all NPM proxy host logs in the mounted directory.

### Filtering Specific Proxy Hosts

If you have many proxy hosts but only want to monitor specific ones:

```toml
# Monitor only proxy hosts 1, 5, and 12
include_proxy_hosts = "1,5,12"
```

This will only process:
- `proxy-host-1_access.log`
- `proxy-host-5_access.log`
- `proxy-host-12_access.log`

### Excluding Internal IPs

Filter out internal traffic from analytics:

```toml
# Exclude local network and VPN traffic
exclude_ips = "192.168.1.0/24,10.0.0.0/8,172.16.0.0/12"
```

### Processing Archived Logs

By default, GoAccess processes both `.log` and `.log.*.gz` files. To skip compressed archives:

```toml
skip_archived_logs = "True"
```

**Storage Impact**: Processing archived logs increases memory usage and startup time.

---

## 🔒 Cloudflare Zero Trust (Optional)

Protect your GoAccess dashboard with Cloudflare Access instead of basic authentication.

### Prerequisites

1. **Cloudflare Account** with a domain
2. **Cloudflare Zero Trust** enabled (free for up to 50 users)
3. **Dashboard domain** added to Cloudflare

### Configuration Steps

#### 1. Set Cloudflare Team Name

```toml
cf_team_name = "your-team-name"
```

Find your team name at: `https://dash.teams.cloudflare.com/` (e.g., `mycompany`)

#### 2. Update docker-compose.yml

Uncomment the Cloudflare Access middleware in `docker-compose.yml`:

```yaml
# Cloudflare Zero Trust Protection (Optional)
# Uncomment to enable dashboard protection via Cloudflare Access
- traefik.http.middlewares.cf-access-goaccess.plugin.cloudflare-access.team=${cf_team_name}
- traefik.http.routers.goaccess.middlewares=goaccess-ws,cf-access-goaccess
```

#### 3. Create Cloudflare Access Application

1. Go to **Cloudflare Zero Trust** → **Access** → **Applications**
2. Click **Add an application** → **Self-hosted**
3. Configure:
   - **Application name**: GoAccess Dashboard
   - **Application domain**: `goaccess.example.com`
   - **Policy**: Create policy (e.g., "Allow team members" or "Email OTP")
4. Save application

#### 4. Redeploy Service

```bash
# In Dokploy, update the compose deployment
# Or restart the service
docker compose up -d goaccess
```

### Authentication Flow

1. User visits `https://goaccess.example.com/`
2. Cloudflare Access intercepts request
3. User authenticates via configured method (Google OAuth, email OTP, etc.)
4. On success, user is redirected to GoAccess dashboard

**Benefits over Basic Auth**:
- SSO integration (Google, GitHub, Okta, etc.)
- Two-factor authentication
- Audit logs and session management
- Granular access policies

---

## 🛠️ Advanced Configuration

### Custom Browser Definitions

Add custom browser detection rules:

```toml
enable_browsers = "True"
custom_browsers = "MyBot,1.0,Bot|CustomBrowser,2.0,Browser"
```

Format: `Name,Version,Category|Name,Version,Category`

Categories: `Browser`, `Bot`, `Feed`, `Unknown`

### Multi-threading for Large Logs

If you have high-traffic sites with large log files:

```toml
processing_threads = "4"
```

**Note**: More threads = faster processing but higher memory usage.

### Data Retention Policy

Automatically purge old data to save disk space:

```toml
keep_last = "30"  # Keep only last 30 days
```

### Auto-refresh Dashboard

Enable automatic dashboard refresh for real-time monitoring:

```toml
html_refresh = "60"  # Refresh every 60 seconds
```

**Warning**: Frequent refreshes increase server load.

### File Permission Management

If you encounter permission errors reading NPM logs:

```bash
# Find your user/group IDs
id
# Output: uid=1000(username) gid=1000(username)

# Set in template.toml
puid = "1000"
pgid = "1000"
```

---

## 🔍 Troubleshooting

### Dashboard Shows "No Valid Data"

**Cause**: GoAccess cannot find or parse log files

**Solutions**:

1. **Verify log path is correct**:
   ```bash
   ls -lah /var/lib/docker/volumes/npm_data/_data/logs/
   ```

2. **Check log format**:
   ```bash
   # View first few lines of an NPM log
   head -n 5 /var/lib/docker/volumes/npm_data/_data/logs/proxy-host-1_access.log
   ```

   Should look like:
   ```
   192.168.1.100 - - [24/Jan/2026:10:15:30 +0000] "GET / HTTP/1.1" 200 1234 "-" "Mozilla/5.0..."
   ```

3. **Check container logs**:
   ```bash
   docker logs <container-name>
   ```

4. **Verify log_type setting**:
   ```toml
   # For NPM logs, use:
   log_type = "NPM"

   # Not TRAEFIK or CADDY_V1 unless you're actually using those
   ```

### Permission Denied Errors

**Cause**: Container cannot read log files

**Solutions**:

1. **Verify volume mount**:
   ```bash
   docker exec <container-name> ls -lah /opt/log/
   ```

2. **Check host file permissions**:
   ```bash
   ls -lah /var/lib/docker/volumes/npm_data/_data/logs/
   ```

3. **Set correct PUID/PGID**:
   ```toml
   # Match your host user
   puid = "1000"
   pgid = "1000"
   ```

4. **Ensure read-only mount**:
   ```yaml
   volumes:
     - ${npm_log_path}:/opt/log:ro  # :ro is important
   ```

### Dashboard Not Loading / WebSocket Errors

**Cause**: Traefik not passing WebSocket connections

**Solutions**:

1. **Verify WebSocket middleware is applied**:
   ```yaml
   labels:
     - traefik.http.middlewares.goaccess-ws.headers.customrequestheaders.Connection=Upgrade
     - traefik.http.middlewares.goaccess-ws.headers.customrequestheaders.Upgrade=websocket
     - traefik.http.routers.goaccess.middlewares=goaccess-ws
   ```

2. **Check browser console** for WebSocket errors:
   - Open Developer Tools → Console
   - Look for `WebSocket connection failed` errors

3. **Test without proxy**:
   ```bash
   # Temporarily expose port 7880 directly
   # Add to docker-compose.yml:
   ports:
     - "7880:7880"

   # Access via: http://dokploy-host-ip:7880/
   ```

### Slow Dashboard / High Memory Usage

**Cause**: Processing too much data

**Solutions**:

1. **Skip archived logs**:
   ```toml
   skip_archived_logs = "True"
   ```

2. **Limit data retention**:
   ```toml
   keep_last = "30"  # Only keep 30 days
   ```

3. **Filter specific proxy hosts**:
   ```toml
   include_proxy_hosts = "1,5"  # Only monitor critical hosts
   ```

4. **Exclude high-traffic IPs**:
   ```toml
   exclude_ips = "192.168.1.0/24"  # Exclude local network
   ```

5. **Increase processing threads** (if you have CPU headroom):
   ```toml
   processing_threads = "4"
   ```

### Error Logs Not Showing (NPM+ALL)

**Cause**: NPM error logs have inconsistent formatting

**Requirements**:
- At least **one valid log entry** per error log file
- Properly formatted timestamps

**Solutions**:

1. **Check error log format**:
   ```bash
   cat /var/lib/docker/volumes/npm_data/_data/logs/proxy-host-1_error.log
   ```

2. **Verify NPM is logging errors**:
   - Generate an error (e.g., visit non-existent page)
   - Check if error log file updates

3. **Fall back to NPM+R**:
   ```toml
   # If error parsing fails, use:
   log_type = "NPM+R"
   ```

### Debug Mode

Enable verbose logging to diagnose issues:

```toml
debug = "True"
```

Then check container logs:
```bash
docker logs <container-name>
```

---

## ⚡ Performance Tuning

### For Small Deployments (< 10 proxy hosts)

```toml
log_type = "NPM"
skip_archived_logs = "False"
processing_threads = "1"
keep_last = ""  # Keep all data
html_refresh = "60"
```

### For Medium Deployments (10-50 proxy hosts)

```toml
log_type = "NPM+R"
skip_archived_logs = "True"
processing_threads = "2"
keep_last = "90"  # 3 months
html_refresh = "120"
exclude_ips = "192.168.0.0/16,10.0.0.0/8"  # Exclude local IPs
```

### For Large Deployments (50+ proxy hosts)

```toml
log_type = "NPM"
skip_archived_logs = "True"
processing_threads = "4"
keep_last = "30"  # 1 month only
html_refresh = ""  # Disable auto-refresh
exclude_ips = "192.168.0.0/16,10.0.0.0/8,172.16.0.0/12"
include_proxy_hosts = "1,5,12,20"  # Monitor only critical hosts
```

### Memory Considerations

**Estimated memory usage**:
- **Small**: 100-250 MB
- **Medium**: 250-500 MB
- **Large**: 500 MB - 1 GB
- **Very Large**: 1-2 GB (with archived logs and all hosts)

**Optimization Tips**:
1. Skip archived logs if not needed
2. Use `include_proxy_hosts` to filter
3. Set `keep_last` to limit data retention
4. Exclude internal IP ranges

---

## 🌐 Accessing the Dashboard

### Primary Dashboard

All deployments:
```
https://goaccess.example.com/
```

### Additional Endpoints (LOG_TYPE specific)

**NPM+R or NPM+ALL**:
- Redirection stats: `https://goaccess.example.com/redirection/`

**NPM+ALL only**:
- Error logs: `https://goaccess.example.com/error/`

### Dashboard Features

- **Visitors Overview**: Unique visitors, requests, bandwidth
- **Requested Files**: Most accessed URLs and paths
- **Static Requests**: CSS, JS, images, fonts
- **404 Errors**: Not found pages
- **Hosts**: Top visitors by IP/hostname
- **Operating Systems**: OS distribution
- **Browsers**: Browser usage statistics
- **Time Distribution**: Traffic patterns by hour/day
- **Virtual Hosts**: Per-domain statistics (if using multiple domains)
- **Geolocation**: Country, city, and ASN information
- **HTTP Status Codes**: 2xx, 3xx, 4xx, 5xx breakdown

### Real-time Updates

If `html_refresh` is configured, the dashboard auto-refreshes:
```toml
html_refresh = "60"  # Refresh every 60 seconds
```

Alternatively, manually refresh the browser page to see latest data.

---

## 📚 Additional Resources

- **GoAccess Official Site**: https://goaccess.io/
- **Docker Image Repository**: https://github.com/xavier-hernandez/goaccess-for-nginxproxymanager
- **Nginx Proxy Manager**: https://nginxproxymanager.com/
- **Cloudflare Zero Trust**: https://developers.cloudflare.com/cloudflare-one/

---

## 🆘 Support & Community

- **Issues**: Report bugs at https://github.com/xavier-hernandez/goaccess-for-nginxproxymanager/issues
- **Discussions**: Join the community at https://github.com/xavier-hernandez/goaccess-for-nginxproxymanager/discussions
- **Dokploy Community**: https://docs.dokploy.com/

---

## 📄 License

GoAccess is licensed under the MIT License. See the [official repository](https://github.com/allinurl/goaccess) for details.

Docker image and configuration by Xavier Hernandez, available at https://github.com/xavier-hernandez/goaccess-for-nginxproxymanager.
