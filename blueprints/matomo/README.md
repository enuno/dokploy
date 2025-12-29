# Matomo Analytics

Self-hosted web analytics platform - privacy-friendly alternative to Google Analytics.

## Overview

[Matomo](https://matomo.org/) is the leading open-source web analytics platform that gives you 100% data ownership. Track website visitors, campaigns, and user behavior without sharing data with third parties.

This production-ready Dokploy template features:

- **Privacy-First Analytics**: GDPR-compliant, self-hosted solution
- **Production Architecture**: Matomo FPM + Nginx + MariaDB (3-tier)
- **Automatic SSL**: HTTPS via Let's Encrypt
- **Security Hardening**: HSTS, Content-Type protection, XSS filters
- **Health Monitoring**: Full health checks for all services
- **Optimized Performance**: PHP-FPM with configurable memory limits

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Nginx      │────▶│  Matomo FPM  │────▶│   MariaDB    │
│ (web proxy)  │     │ (analytics)  │     │  (database)  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │                    └────────────────────┘
       │                            │
       │                     matomo-net (internal)
       │
       ▼
HTTPS (Traefik + Let's Encrypt)
```

**Services:**
- **Nginx (1.27-alpine)**: FastCGI proxy, serves static assets
- **Matomo (5.6-fpm-alpine)**: PHP-FPM analytics engine
- **MariaDB (11-jammy)**: Database with optimized packet size

**Data Flow:**
1. User visits tracked website → Matomo tracking script loads
2. Tracking request → Nginx → Matomo FPM → MariaDB
3. Admin accesses UI → Nginx → Matomo FPM → MariaDB
4. Reports generated from database analytics data

---

## Requirements

### System Resources

**Minimum (Small Sites <100K pageviews/month):**
- CPU: 2 cores
- RAM: 4GB
- Storage: 50GB SSD

**Recommended (Medium Sites 100K-1M pageviews/month):**
- CPU: 4+ cores
- RAM: 8GB
- Storage: 200GB SSD

**Large Sites (1M+ pageviews/month):**
- CPU: 8+ cores
- RAM: 16GB+
- Storage: 500GB+ SSD
- Consider dedicated database server

### Prerequisites
- Domain name pointing to your server
- Dokploy installed and running
- Ports 80 and 443 available for Traefik

---

## Configuration

### Required Variables

| Variable | Description | Example | Generated |
|----------|-------------|---------|-----------|
| `MATOMO_DOMAIN` | Your Matomo domain | `analytics.example.com` | No |
| `MATOMO_DB_PASSWORD` | Database password | - | Yes (32 chars) |
| `MYSQL_ROOT_PASSWORD` | MariaDB root password | - | Yes (32 chars) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MATOMO_DB_NAME` | `matomo` | Database name |
| `MATOMO_DB_USER` | `matomo` | Database username |
| `PHP_MEMORY_LIMIT` | `512M` | PHP memory limit (increase for large sites) |

---

## Deployment

### Step 1: Deploy via Dokploy

1. Navigate to your Dokploy project
2. Click "Create Service" → "From Template"
3. Select "Matomo Analytics"
4. Configure:
   - **Domain**: Your analytics domain (e.g., `analytics.example.com`)
   - Passwords are auto-generated securely

5. Click "Deploy"

### Step 2: DNS Configuration

Point your domain to your server:

```
Type: A
Name: analytics (or @ for root domain)
Value: [Your Server IP]
TTL: 300
```

Wait for DNS propagation (up to 48 hours, usually faster).

### Step 3: Initial Setup

1. Visit `https://your-domain.com`
2. Matomo installation wizard will start
3. Database configuration (pre-filled by environment variables):
   - **Database Server**: `mariadb`
   - **Login**: Value from `MATOMO_DB_USER`
   - **Password**: Value from `MATOMO_DB_PASSWORD`
   - **Database Name**: Value from `MATOMO_DB_NAME`

4. Click "Next" through the wizard
5. Create your Matomo super user account
6. Add your first website to track

### Step 4: Add Tracking Code

Copy the JavaScript tracking code provided by Matomo and add it to your website's `<head>` section:

```html
<!-- Matomo -->
<script>
  var _paq = window._paq = window._paq || [];
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="https://your-domain.com/";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', '1']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
  })();
</script>
<!-- End Matomo Code -->
```

---

## Post-Deployment Configuration

### Enable Auto-Archiving (Recommended for Production)

Matomo's archiving process generates reports from raw data. For better performance:

1. Access Matomo container:
   ```bash
   docker exec -it matomo bash
   ```

2. Set up cron job for archiving:
   ```bash
   crontab -e
   ```

3. Add this line (runs every hour):
   ```
   0 * * * * /usr/local/bin/php /var/www/html/console core:archive --url=https://your-domain.com > /dev/null 2>&1
   ```

4. Disable browser-triggered archiving:
   - Go to Settings → General Settings
   - Set "Archive reports when viewed from browser" to **No**

### Configure GeoIP (Optional)

For geographic tracking:

1. Download GeoIP database:
   - Settings → System → Geolocation
   - Click "Download DBIP / GeoIP 2 database"

2. Select **DBIP** (free) or **MaxMind GeoIP2** (requires account)

### Enable Privacy Features

Matomo is privacy-focused by default, but you can enhance it:

1. **Anonymize IPs**:
   - Settings → Privacy → Anonymize Visitors' IP addresses
   - Set to anonymize at least last 2 bytes

2. **Respect Do Not Track**:
   - Settings → Privacy → Users opt-out
   - Enable "Do Not Track support"

3. **GDPR Compliance**:
   - Settings → Privacy → GDPR Tools
   - Configure consent management
   - Set data retention policies

---

## Cloudflare Zero Trust Integration (Optional)

Protect your Matomo admin panel with Cloudflare Zero Trust for enterprise-grade access control.

### Benefits
- **SSO Integration**: Google, GitHub, Microsoft, Okta, etc.
- **Multi-Factor Authentication**: Additional security layer
- **Audit Logs**: Track who accessed analytics
- **Session Control**: Fine-grained access policies

### Setup Instructions

#### Step 1: Create Cloudflare Access Application

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Zero Trust → Access → Applications
2. Click "Add an application" → "Self-hosted"
3. Configure application:
   - **Application name**: `Matomo Analytics`
   - **Application domain**: `analytics.your-domain.com`
   - **Protect specific path**: `/index.php` (admin interface)

4. Click "Next"

#### Step 2: Configure Access Policy

1. Create policy:
   - **Policy name**: `Matomo Admins`
   - **Action**: Allow

2. Add include rules (choose one or more):
   - **Emails**: Specific user emails
   - **Email domains**: `@yourcompany.com`
   - **Groups**: From your identity provider
   - **Everyone**: For testing (not recommended for production)

3. Optional - Add require rules:
   - **Country**: Restrict by geographic location
   - **IP ranges**: Allow only from office IPs
   - **Device posture**: Require specific security settings

4. Click "Next" and "Add application"

#### Step 3: Update Dokploy Template (Optional)

If you want to enforce Zero Trust at the Traefik level, add this middleware to `docker-compose.yml`:

```yaml
labels:
  # ... existing labels ...
  - "traefik.http.routers.matomo-admin.rule=Host(`${MATOMO_DOMAIN}`) && PathPrefix(`/index.php`)"
  - "traefik.http.routers.matomo-admin.middlewares=cf-access@docker"
  - "traefik.http.middlewares.cf-access.forwardauth.address=https://your-team.cloudflareaccess.com/cdn-cgi/access/authorized"
  - "traefik.http.middlewares.cf-access.forwardauth.trustForwardHeader=true"
```

**Note**: The default setup works without Traefik middleware - Cloudflare Access protects at the DNS level.

#### Step 4: Test Access

1. Visit `https://analytics.your-domain.com/index.php`
2. You should be redirected to Cloudflare Access login
3. Authenticate with your configured identity provider
4. After successful auth, you'll be redirected to Matomo

---

## Performance Tuning

### PHP Memory Limit

For high-traffic sites, increase PHP memory:

1. Update `PHP_MEMORY_LIMIT` environment variable in Dokploy
2. Recommended values:
   - Small sites (<100K pageviews): `512M` (default)
   - Medium sites (100K-1M): `1024M`
   - Large sites (1M+): `2048M` or more

### Database Optimization

MariaDB is configured with `--max-allowed-packet=64MB` for handling large tracking batches. For very large installations:

1. Add to `docker-compose.yml` MariaDB command:
   ```yaml
   command: >
     --max-allowed-packet=64MB
     --innodb-buffer-pool-size=2G
     --innodb-log-file-size=512M
   ```

2. Adjust based on available RAM

### Archiving Performance

For sites with >1M pageviews/month:

1. Split archiving by website:
   ```bash
   0 * * * * /usr/local/bin/php /var/www/html/console core:archive --url=https://your-domain.com --force-idsites=1 > /dev/null 2>&1
   0 2 * * * /usr/local/bin/php /var/www/html/console core:archive --url=https://your-domain.com --force-idsites=2 > /dev/null 2>&1
   ```

2. Use `--force-periods=day,week` to archive specific periods

---

## Backup & Restore

### Backup Strategy

**What to Backup:**
1. **MariaDB Database**: All analytics data, users, settings
2. **Matomo Files**: Plugins, configuration, GeoIP databases

**Backup Commands:**

```bash
# Backup MariaDB database
docker exec mariadb mysqldump -u root -p${MYSQL_ROOT_PASSWORD} matomo > matomo-backup-$(date +%Y%m%d).sql

# Backup Matomo files
docker run --rm --volumes-from matomo -v $(pwd):/backup alpine tar czf /backup/matomo-files-$(date +%Y%m%d).tar.gz /var/www/html
```

**Automated Backup (Recommended):**

Add to crontab:
```bash
# Daily database backup at 2 AM
0 2 * * * docker exec mariadb mysqldump -u root -p${MYSQL_ROOT_PASSWORD} matomo | gzip > /backups/matomo-$(date +\%Y\%m\%d).sql.gz

# Weekly file backup on Sundays
0 3 * * 0 docker run --rm --volumes-from matomo -v /backups:/backup alpine tar czf /backup/matomo-files-$(date +\%Y\%m\%d).tar.gz /var/www/html
```

### Restore

**Restore Database:**
```bash
# Copy backup to container
docker cp matomo-backup-20250101.sql mariadb:/tmp/

# Restore
docker exec -i mariadb mysql -u root -p${MYSQL_ROOT_PASSWORD} matomo < /tmp/matomo-backup-20250101.sql
```

**Restore Files:**
```bash
docker run --rm --volumes-from matomo -v $(pwd):/backup alpine sh -c "cd /var/www/html && tar xzf /backup/matomo-files-20250101.tar.gz --strip 1"
```

---

## Troubleshooting

### Issue: "Database Connection Error" on First Run

**Symptoms**: Cannot connect to database during installation wizard

**Solution**:
1. Wait 30-60 seconds for MariaDB to fully initialize
2. Check health status: `docker compose ps`
3. Verify MariaDB is healthy before proceeding

### Issue: Slow Report Generation

**Symptoms**: Reports take >10 seconds to load

**Solutions**:
1. Enable auto-archiving (see Post-Deployment Configuration)
2. Increase PHP memory limit
3. Optimize database (run `OPTIMIZE TABLE` on large tables)

### Issue: "Out of Memory" Errors

**Symptoms**: PHP fatal error: allowed memory size exhausted

**Solutions**:
1. Increase `PHP_MEMORY_LIMIT` to 1024M or 2048M
2. Reduce reporting periods (don't load "All time" for large datasets)
3. Archive reports more frequently

### Issue: Tracking Not Working

**Symptoms**: No data appearing in Matomo reports

**Check**:
1. **Tracking code installed**: View source of your website, verify Matomo JS is loading
2. **Domain mismatch**: Check "Trusted Host" settings in Matomo
3. **Ad blockers**: Test in incognito/private mode
4. **Browser console**: Check for JavaScript errors

**Fix Trusted Host**:
```bash
docker exec -it matomo bash
cd /var/www/html
php console config:set --section=General --key=trusted_hosts --value='["your-domain.com"]'
```

### Issue: 502 Bad Gateway

**Symptoms**: Nginx returns 502 error

**Solutions**:
1. Check Matomo FPM is running: `docker compose ps`
2. Increase PHP-FPM timeout in Nginx config (already set to 300s)
3. Check PHP-FPM logs: `docker compose logs matomo`

### Issue: High Database Size

**Symptoms**: MariaDB volume growing rapidly

**Solutions**:
1. **Configure data retention**:
   - Settings → Privacy → Anonymize old visitor logs
   - Delete logs older than 180 days (recommended)

2. **Purge old data**:
   ```bash
   docker exec -it matomo bash
   php console core:purge-old-logs --purge-logs-older-than=180
   ```

3. **Optimize database**:
   ```bash
   docker exec mariadb mysqlcheck -u root -p${MYSQL_ROOT_PASSWORD} --optimize --all-databases
   ```

---

## Security Considerations

### Hardened by Default

This template includes:
- ✅ **HTTPS enforced**: No HTTP access
- ✅ **HSTS enabled**: Browsers always use HTTPS (1 year)
- ✅ **XSS protection**: Browser-level XSS filters enabled
- ✅ **Content-Type protection**: Prevents MIME-sniffing attacks
- ✅ **Referrer policy**: Controlled referrer information leakage
- ✅ **Database isolation**: MariaDB not exposed externally
- ✅ **Read-only Nginx volumes**: Static files served read-only

### Additional Hardening (Optional)

**1. IP Allowlist for Admin Access**

Restrict `/index.php` to specific IP addresses via Traefik:

```yaml
labels:
  - "traefik.http.middlewares.admin-ipallowlist.ipallowlist.sourcerange=203.0.113.0/24,198.51.100.42"
  - "traefik.http.routers.matomo-admin.middlewares=admin-ipallowlist@docker"
```

**2. Rate Limiting**

Prevent brute force attacks:

```yaml
labels:
  - "traefik.http.middlewares.matomo-ratelimit.ratelimit.average=100"
  - "traefik.http.middlewares.matomo-ratelimit.ratelimit.burst=50"
  - "traefik.http.routers.matomo.middlewares=matomo-ratelimit@docker"
```

**3. Two-Factor Authentication**

Enable in Matomo:
1. Install "TwoFactorAuth" plugin (official)
2. Settings → Two-Factor Authentication
3. Require 2FA for all admin users

**4. Regular Security Updates**

Update Matomo regularly:
```bash
# Check for updates
docker exec -it matomo bash
php console core:update

# Or update via web UI: Settings → Updates
```

---

## Scaling Considerations

### Horizontal Scaling (Multiple Matomo Instances)

For very high traffic (10M+ pageviews/month):

1. **Dedicated database server**: Move MariaDB to separate host
2. **Load balancer**: Use Traefik + multiple Matomo instances
3. **Shared storage**: Use NFS or S3 for Matomo files
4. **Separate archiving**: Run archiving on dedicated worker instance

### Vertical Scaling (Single Instance Optimization)

1. **Increase resources**:
   - CPU: 8+ cores for archiving parallelization
   - RAM: 16GB+ for larger buffer pools
   - Storage: SSD/NVMe for faster database queries

2. **Database tuning**:
   - Increase `innodb_buffer_pool_size` to 50-70% of RAM
   - Enable query cache
   - Optimize indexes

3. **Redis caching** (advanced):
   - Add Redis container for session storage
   - Configure Matomo to use Redis for backend cache

---

## Resource Monitoring

Monitor Matomo performance:

```bash
# Container resource usage
docker stats matomo nginx mariadb

# Database size
docker exec mariadb mysql -u root -p${MYSQL_ROOT_PASSWORD} -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.TABLES WHERE table_schema = 'matomo' GROUP BY table_schema;"

# Matomo logs
docker compose logs matomo --tail=100 --follow
```

---

## Support & Resources

### Official Documentation
- **Matomo Docs**: https://matomo.org/docs/
- **Admin Guide**: https://matomo.org/docs/manage/
- **Developer Docs**: https://developer.matomo.org/

### Community
- **Forum**: https://forum.matomo.org/
- **GitHub**: https://github.com/matomo-org/matomo
- **Discord**: https://discord.gg/matomo

### Upgrade Path
- **Matomo Updates**: Auto-update via web UI or CLI
- **Template Updates**: Check Dokploy template repository for newer versions

---

## License

- **Matomo**: GPL v3+ (https://github.com/matomo-org/matomo/blob/5.x-dev/LEGALNOTICE)
- **This Template**: Provided as-is for Dokploy deployment

---

**Template Version**: 1.0.0
**Matomo Version**: 5.6
**Last Updated**: 2025-12-28
