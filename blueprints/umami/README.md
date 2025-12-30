# Umami - Privacy-Focused Web Analytics

**Self-hosted web analytics platform as an alternative to Google Analytics**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/umami-software/umami/blob/master/LICENSE)
[![Version](https://img.shields.io/badge/version-v2.20.2-green.svg)](https://github.com/umami-software/umami/releases/tag/v2.20.2)
[![Docker](https://img.shields.io/badge/docker-compose-blue.svg)](https://docs.docker.com/compose/)

---

## 📖 Overview

Umami is a simple, fast, privacy-focused alternative to Google Analytics. It provides powerful insights into website traffic while respecting visitor privacy—no cookies, GDPR compliant, and fully self-hosted.

**Key Features:**
- 🔒 **Privacy-First**: No cookies, GDPR compliant, visitor privacy respected
- 📊 **Real-Time Analytics**: Live visitor tracking and page views
- 🌐 **Multi-Website Support**: Track multiple websites from one instance
- 📱 **Mobile-Friendly**: Responsive dashboard for on-the-go analytics
- 🎯 **Event Tracking**: Custom event tracking for user interactions
- 🚀 **Fast & Lightweight**: Built with Next.js and PostgreSQL
- 🔐 **Team Access**: Role-based access control for team collaboration

---

## 🚀 Quick Start

### Prerequisites

**Required:**
1. **Dokploy Instance**: Running Dokploy installation
2. **Domain Name**: A domain or subdomain for Umami (e.g., `analytics.example.com`)

**Optional:**
- Websites you want to track analytics for

### ⚙️ Deployment Steps

#### Step 1: Deploy Umami in Dokploy

1. **Create New Service** in Dokploy
2. **Select Template**: Choose "Umami" from templates
3. **Configure Variables**:
   - `Domain`: Your Umami domain (e.g., `analytics.example.com`)
   - Auto-generated: PostgreSQL password and app secret (handled by Dokploy)
4. **Deploy**: Click "Deploy" and wait for services to start

#### Step 2: Configure DNS

Point your domain to your Dokploy server:

```bash
# A Record
analytics.example.com.  IN  A  <your-server-ip>

# Or CNAME
analytics.example.com.  IN  CNAME  your-server.example.com.
```

**Wait for DNS propagation** (usually 1-5 minutes).

#### Step 3: Access Umami Dashboard

1. **Navigate to**: `https://analytics.example.com`
2. **Default Login**:
   - Username: `admin`
   - Password: `umami`
3. **⚠️ IMPORTANT**: Change default password immediately after first login

#### Step 4: Add Your First Website

1. Click **Settings** → **Websites** → **Add Website**
2. Enter website details:
   - **Name**: Your website name
   - **Domain**: e.g., `example.com`
   - **Enable Share URL**: Optional (for public stats)
3. **Get Tracking Code**:
   - Copy the generated tracking script
   - Add to your website's `<head>` section

**Tracking Code Example:**
```html
<script async src="https://analytics.example.com/script.js" data-website-id="your-website-id"></script>
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `UMAMI_DOMAIN` | ✅ Yes | - | Your Umami instance domain (e.g., `analytics.example.com`) |
| `APP_SECRET` | ✅ Yes | Auto-generated | Application secret for session encryption |
| `POSTGRES_PASSWORD` | ✅ Yes | Auto-generated | PostgreSQL database password |
| `POSTGRES_USER` | No | `umami` | PostgreSQL username |
| `POSTGRES_DB` | No | `umami` | PostgreSQL database name |

### Post-Deployment Configuration

#### Change Default Admin Password

1. Login with `admin` / `umami`
2. Go to **Settings** → **Profile**
3. Click **Change Password**
4. Set a strong password

#### Configure Email Notifications (Optional)

Umami supports email notifications for reports (requires SMTP configuration):

1. Set environment variables in Dokploy:
   ```env
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASSWORD=your-smtp-password
   SMTP_FROM=analytics@example.com
   ```
2. Restart Umami service

#### Configure Data Retention

By default, Umami retains all data indefinitely. To configure automatic cleanup:

1. Go to **Settings** → **System**
2. Set **Data Retention** period (e.g., 365 days)
3. Enable automatic cleanup

---

## 📊 Using Umami

### Adding Websites

1. **Settings** → **Websites** → **Add Website**
2. Fill in website details
3. Copy tracking code
4. Add to your website's `<head>` section

### Tracking Custom Events

Track button clicks, form submissions, or any custom interaction:

```javascript
// Track a button click
umami.track('button-click', { button: 'signup' });

// Track form submission
umami.track('form-submit', { form: 'contact' });

// Track custom event with data
umami.track('purchase', {
  product: 'Pro Plan',
  amount: 99.00
});
```

### Creating Team Accounts

1. **Settings** → **Users** → **Add User**
2. Enter user details:
   - Username
   - Password
   - Role (Admin or Viewer)
3. Share credentials with team member

### Generating Reports

1. Navigate to website dashboard
2. Select date range
3. Click **Export** to download CSV

### Public Dashboard (Optional)

Share analytics publicly without login:

1. Go to website settings
2. Enable **Share URL**
3. Copy the public URL
4. Share with stakeholders

---

## 🔧 Advanced Configuration

### Custom Tracking Domain

Use your own domain for tracking script (e.g., `t.example.com` instead of `analytics.example.com`):

1. **Add DNS Record**:
   ```
   t.example.com.  IN  CNAME  analytics.example.com.
   ```

2. **Add Traefik Rule** in Dokploy:
   ```yaml
   labels:
     - "traefik.http.routers.umami-tracking.rule=Host(`t.example.com`)"
     - "traefik.http.routers.umami-tracking.entrypoints=websecure"
     - "traefik.http.routers.umami-tracking.tls.certresolver=letsencrypt"
   ```

3. **Update Tracking Script**:
   ```html
   <script async src="https://t.example.com/script.js" data-website-id="your-id"></script>
   ```

### Database Backups

Backup PostgreSQL data regularly:

```bash
# Manual backup
docker exec umami-postgres pg_dump -U umami umami > umami-backup-$(date +%Y%m%d).sql

# Restore from backup
cat umami-backup-20250129.sql | docker exec -i umami-postgres psql -U umami umami
```

### Upgrading Umami

To upgrade to a newer version:

1. **Check for Updates**: Visit [Umami Releases](https://github.com/umami-software/umami/releases)
2. **Update Image** in docker-compose.yml:
   ```yaml
   image: docker.umami.is/umami-software/umami:postgresql-v2.20.2
   ```
3. **Redeploy** in Dokploy
4. **Backup First**: Always backup database before major version upgrades

**Version Recommendations:**
- **Stable (v2 series)**: `postgresql-v2.20.2` - Mature, well-tested
- **Latest Features (v3 series)**: `postgresql-v3.0.3` - New UI, enhanced features

---

## 🔍 Troubleshooting

### Issue 1: Cannot Access Dashboard

**Symptoms:**
- Browser shows "Connection refused" or timeout
- 502 Bad Gateway error

**Solutions:**
1. **Check service status** in Dokploy → Umami service → Logs
2. **Verify DNS** is pointing to your server: `dig analytics.example.com`
3. **Check Traefik routing**:
   ```bash
   docker logs traefik 2>&1 | grep umami
   ```
4. **Verify SSL certificate** was issued:
   ```bash
   docker logs traefik 2>&1 | grep letsencrypt
   ```

### Issue 2: Default Login Not Working

**Symptoms:**
- `admin` / `umami` credentials rejected
- "Invalid credentials" error

**Solutions:**
1. **Check database** was initialized:
   ```bash
   docker logs umami-umami | grep "Database initialized"
   ```
2. **Reset admin password** via database:
   ```bash
   docker exec -it umami-postgres psql -U umami umami
   # In psql:
   UPDATE account SET password = '$2a$10$BUli0c.muyCW1ErNJc3jL.vFRFtFJWrT8/GcR4A.sUdCznaXiqFXa' WHERE username = 'admin';
   # Default password: umami
   ```
3. **Restart Umami service** in Dokploy

### Issue 3: Tracking Code Not Working

**Symptoms:**
- No data showing in dashboard
- Script loads but no events tracked

**Solutions:**
1. **Verify script tag** is in `<head>` section
2. **Check website ID** matches dashboard:
   ```html
   <script async src="https://analytics.example.com/script.js" data-website-id="CORRECT-ID-HERE"></script>
   ```
3. **Check browser console** for errors
4. **Verify CORS** if tracking cross-domain:
   - Umami domain: `analytics.example.com`
   - Website domain: `example.com`
   - CORS should work automatically
5. **Test with curl**:
   ```bash
   curl https://analytics.example.com/script.js
   # Should return JavaScript code
   ```

### Issue 4: Database Connection Errors

**Symptoms:**
- Umami service keeps restarting
- Logs show "Connection to database failed"

**Solutions:**
1. **Check PostgreSQL is healthy**:
   ```bash
   docker exec umami-postgres pg_isready -U umami -d umami
   ```
2. **Verify DATABASE_URL** in Umami environment (Dokploy UI):
   - Should be: `postgresql://umami:${POSTGRES_PASSWORD}@postgres:5432/umami`
3. **Check network connectivity**:
   ```bash
   docker exec umami-umami ping postgres
   ```
4. **Restart both services** in order: PostgreSQL first, then Umami

### Issue 5: Slow Dashboard Performance

**Symptoms:**
- Dashboard takes long to load
- Queries time out

**Solutions:**
1. **Check database size**:
   ```bash
   docker exec umami-postgres psql -U umami -d umami -c "\dt+"
   ```
2. **Enable data retention** to prune old data:
   - Settings → System → Data Retention → Set to 365 days
3. **Increase PostgreSQL resources** (edit docker-compose.yml):
   ```yaml
   postgres:
     deploy:
       resources:
         limits:
           memory: 2G
           cpus: "2.0"
   ```
4. **Optimize queries** by ensuring indexes exist:
   ```bash
   docker exec umami-postgres psql -U umami -d umami -c "\di"
   ```

### Issue 6: SSL Certificate Not Provisioning

**Symptoms:**
- Browser shows "Connection not secure"
- Traefik logs show ACME errors

**Solutions:**
1. **Verify DNS is propagated**: `dig analytics.example.com`
2. **Check Traefik cert resolver** is configured in Dokploy
3. **Check rate limits**: Let's Encrypt has limits (50 certs/week per domain)
4. **Force cert renewal**:
   ```bash
   # Delete cert and restart Traefik
   docker exec traefik rm /letsencrypt/acme.json
   docker restart traefik
   ```

---

## 🔒 Security Considerations

1. **Change Default Password**: The `admin` / `umami` default credentials MUST be changed
2. **HTTPS Required**: Tracking script requires HTTPS (handled by Traefik)
3. **Database Isolation**: PostgreSQL is on internal network only (not exposed)
4. **Security Headers**: Template includes HSTS, XSS protection, frame denial
5. **Session Security**: App secret is auto-generated with high entropy
6. **Regular Updates**: Monitor [Umami releases](https://github.com/umami-software/umami/releases) for security patches

---

## 📊 Architecture

```
┌─────────────────┐
│   Web Browser   │
│  (JavaScript)   │
└────────┬────────┘
         │ HTTPS
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│    Traefik      │──────│   Umami App     │
│  (SSL + Proxy)  │      │   (Next.js)     │
└─────────────────┘      └────────┬────────┘
         ▲                        │
         │                        ▼
         │               ┌─────────────────┐
         │               │  PostgreSQL DB  │
         │               │ (analytics data)│
         │               └─────────────────┘
         │
┌─────────────────┐
│   Let's Encrypt │
│   (Auto SSL)    │
└─────────────────┘
```

**Components:**
- **Traefik**: Reverse proxy with automatic SSL via Let's Encrypt
- **Umami**: Next.js application serving dashboard and tracking script
- **PostgreSQL**: Database storing analytics data (pageviews, events, users)
- **Let's Encrypt**: Free SSL certificates automatically provisioned

---

## 🔄 Updates & Maintenance

### Checking for Updates

Visit the [Umami Releases page](https://github.com/umami-software/umami/releases) to see new versions.

### Update Process

1. **Backup Database**:
   ```bash
   docker exec umami-postgres pg_dump -U umami umami > backup-$(date +%Y%m%d).sql
   ```

2. **Update Image** in Dokploy or docker-compose.yml:
   ```yaml
   image: docker.umami.is/umami-software/umami:postgresql-v2.20.2
   ```

3. **Redeploy** Service in Dokploy

4. **Verify** dashboard loads and data is intact

### Database Maintenance

**Check Database Size:**
```bash
docker exec umami-postgres psql -U umami -d umami -c "SELECT pg_size_pretty(pg_database_size('umami'));"
```

**Vacuum Database** (monthly recommended):
```bash
docker exec umami-postgres psql -U umami -d umami -c "VACUUM ANALYZE;"
```

---

## 📚 Resources

### Official Documentation
- **Umami Website**: https://umami.is
- **Documentation**: https://umami.is/docs
- **GitHub Repository**: https://github.com/umami-software/umami
- **Releases**: https://github.com/umami-software/umami/releases

### Tracking & Integration
- **Tracking API**: https://umami.is/docs/api
- **Event Tracking**: https://umami.is/docs/track-events
- **WordPress Plugin**: https://wordpress.org/plugins/umami-analytics/
- **React Integration**: https://github.com/mikecao/react-umami

### Community
- **Discord**: https://discord.gg/4dz4zcXYrQ
- **GitHub Discussions**: https://github.com/umami-software/umami/discussions
- **Issues**: https://github.com/umami-software/umami/issues

---

## 📝 License

- **Umami**: MIT License
- **This Template**: MIT License

---

## 🤝 Contributing

Found an issue or have a suggestion? Please open an issue in the [Dokploy Templates repository](https://github.com/your-org/dokploy-templates).

---

**Template Version**: 1.0.0
**Umami Version**: v2.20.2 (or `:postgresql-latest` for newest features)
**Last Updated**: 2025-12-29

---

## Sources

- [GitHub - umami-software/umami](https://github.com/umami-software/umami)
- [Umami Releases](https://github.com/umami-software/umami/releases)
- [Umami Documentation](https://umami.is/docs)
