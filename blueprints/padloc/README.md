# Padloc - Open-Source Password Manager

Padloc is a modern, intuitive, and fully open-source password manager with end-to-end encryption and a zero-knowledge architecture. Built for individuals and teams, it provides secure password storage, autofill capabilities, and cross-platform synchronization while maintaining complete user privacy.

## Features

- **End-to-End Encryption**: All data encrypted client-side with zero-knowledge architecture
- **Cross-Platform**: Web, desktop (Windows, macOS, Linux), and mobile (iOS, Android)
- **Password Generation**: Strong, customizable password generator
- **Secure Sharing**: Share passwords securely with team members
- **Two-Factor Authentication**: Built-in TOTP support for MFA
- **File Attachments**: Securely store files alongside passwords
- **Audit Log**: Track all password access and changes
- **Self-Hosted**: Complete control over your data
- **Open Source**: AGPL-3.0 licensed, auditable codebase

## Architecture

```
                                    INTERNET
                                        │
                                        ▼
                               ┌─────────────────┐
                               │    Traefik      │
                               │   (HTTPS/SSL)   │
                               └────────┬────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         dokploy-network (external)                        │
│                                                                           │
│  ┌─────────────────────────────┐      ┌─────────────────────────────┐   │
│  │      Padloc PWA             │      │    Padloc Server            │   │
│  │    (Web Interface)          │      │    (Backend API)            │   │
│  │                             │      │                             │   │
│  │  padloc/pwa:4.3.0          │      │  padloc/server:4.3.0       │   │
│  │  Port: 8080                │      │  Port: 3000                │   │
│  │                             │      │                             │   │
│  │  Traefik Route: /          │      │  Traefik Route: /api/*     │   │
│  │  (Main interface)          │      │  (API endpoints)            │   │
│  │                             │      │                             │   │
│  │  Volume:                   │      │  Volumes:                   │   │
│  │  - pwa-assets:/assets      │      │  - server-data:/data        │   │
│  │                             │      │  - server-logs:/logs        │   │
│  │                             │      │  - server-attachments:/att  │   │
│  │                             │      │  - server-docs:/docs        │   │
│  └─────────────────────────────┘      └─────────────────────────────┘   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    padloc-net (internal)                         │   │
│  │                    LevelDB File Storage                          │   │
│  │                    (No external database required)               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| padloc-pwa | padloc/pwa:4.3.0 | 8080 | Progressive Web App interface |
| padloc-server | padloc/server:4.3.0 | 3000 | Backend API and authentication |

**Storage**: LevelDB file-based database (no PostgreSQL/MongoDB required)

## Prerequisites

- Dokploy installed and running
- DNS record pointing to your Dokploy server
- **SMTP email service** (Gmail, SendGrid, Mailgun, AWS SES, etc.)
  - Required for password resets and user verification
  - Get credentials from your email provider

## Configuration Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `PADLOC_DOMAIN` | Domain for Padloc instance | `passwords.example.com` |
| `PL_EMAIL_SERVER` | SMTP server hostname | `smtp.gmail.com` |
| `PL_EMAIL_USER` | SMTP username/email | `your-email@gmail.com` |
| `PL_EMAIL_PASSWORD` | SMTP password or app token | `your-app-password` |
| `PL_EMAIL_FROM` | Sender email address | `noreply@example.com` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PL_EMAIL_PORT` | `587` | SMTP port (587 for STARTTLS) |
| `PL_REPORT_ERRORS` | `false` | Send error reports to Padloc developers |
| `PL_MFA_TOTP_ENABLED` | `true` | Enable TOTP-based two-factor authentication |

## Deployment

### 1. Import Template in Dokploy

1. Navigate to Templates → Import
2. Select the docker-compose.yml and template.toml
3. Configure required variables:
   - Set your domain (e.g., `passwords.example.com`)
   - Provide SMTP credentials from your email provider
4. Deploy the stack

### 2. SMTP Configuration

Padloc requires SMTP for user verification, password resets, and team invitations. Choose one of these providers:

#### Gmail (Personal Use)
1. Enable 2-Factor Authentication on your Google account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use these settings:
   ```
   PL_EMAIL_SERVER: smtp.gmail.com
   PL_EMAIL_PORT: 587
   PL_EMAIL_USER: your-email@gmail.com
   PL_EMAIL_PASSWORD: your-16-char-app-password
   PL_EMAIL_FROM: your-email@gmail.com
   ```

#### SendGrid (Recommended for Production)
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key with "Mail Send" permissions
3. Use these settings:
   ```
   PL_EMAIL_SERVER: smtp.sendgrid.net
   PL_EMAIL_PORT: 587
   PL_EMAIL_USER: apikey
   PL_EMAIL_PASSWORD: your-sendgrid-api-key
   PL_EMAIL_FROM: noreply@yourdomain.com
   ```

#### Mailgun
```
PL_EMAIL_SERVER: smtp.mailgun.org
PL_EMAIL_PORT: 587
PL_EMAIL_USER: postmaster@your-domain.mailgun.org
PL_EMAIL_PASSWORD: your-mailgun-password
PL_EMAIL_FROM: noreply@yourdomain.com
```

#### AWS SES
```
PL_EMAIL_SERVER: email-smtp.us-east-1.amazonaws.com
PL_EMAIL_PORT: 587
PL_EMAIL_USER: your-ses-smtp-username
PL_EMAIL_PASSWORD: your-ses-smtp-password
PL_EMAIL_FROM: noreply@yourdomain.com
```

### 3. First Access

1. Navigate to `https://your-domain/`
2. Click **"Get Started"**
3. Create your master account:
   - Enter email address (must match SMTP sender domain or be verified)
   - Create strong master password (this cannot be recovered!)
   - Confirm master password
4. Verify your email address (check inbox for verification link)
5. Complete account setup

**⚠️ CRITICAL**: Your master password cannot be recovered. Write it down and store it securely!

### 4. Verify Installation

```bash
# Check services are running
docker compose ps

# Should show:
# - padloc-pwa (healthy)
# - padloc-server (healthy)

# Check logs
docker compose logs padloc-server
docker compose logs padloc-pwa

# Verify LevelDB database created
docker compose exec padloc-server ls -la /data

# Test SMTP connection (check server logs for email sending)
docker compose logs padloc-server | grep -i "email\|smtp"
```

## Usage

### Creating Vaults

1. Click **"+"** → **"New Vault"**
2. Name your vault (e.g., "Personal", "Work", "Family")
3. Add items to vault:
   - Passwords
   - Credit cards
   - Notes
   - File attachments

### Password Generator

1. When creating new password item
2. Click **"Generate"** button
3. Customize:
   - Length (8-64 characters)
   - Character types (uppercase, lowercase, numbers, symbols)
   - Exclude ambiguous characters
4. Click **"Use Password"**

### Browser Extension / Autofill

1. Install Padloc browser extension:
   - [Chrome/Edge](https://chrome.google.com/webstore)
   - [Firefox](https://addons.mozilla.org/)
2. Configure extension to point to your server:
   - Server URL: `https://your-domain`
3. Log in with master password
4. Autofill credentials on websites

### Sharing with Team Members

1. Click **"+"** → **"Invite Member"**
2. Enter team member's email address
3. Select vault permissions:
   - **View**: Read-only access
   - **Edit**: Can modify items
   - **Manage**: Can invite/remove members
4. Send invitation (via email)
5. Member receives invitation link

### Two-Factor Authentication (TOTP)

1. Go to **Settings** → **Security**
2. Enable **"Two-Factor Authentication"**
3. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
4. Enter 6-digit code to confirm
5. Save backup codes in secure location

## Backup and Recovery

### Critical Data to Backup

1. **Master password** - Cannot be recovered, write it down!
2. **LevelDB database** - Contains all encrypted passwords
3. **File attachments** - Encrypted file uploads
4. **TOTP backup codes** - For account recovery

### Backup Commands

```bash
# Backup entire server data directory (LevelDB database)
docker compose cp padloc-server:/data ./backup-padloc-data

# Backup file attachments
docker compose cp padloc-server:/attach ./backup-padloc-attachments

# Backup via volume (recommended for automation)
docker run --rm \
  -v padloc-server-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/padloc-data-$(date +%Y%m%d).tar.gz /data

# Scheduled backup (add to crontab)
0 2 * * * docker run --rm -v padloc-server-data:/data -v /backups:/backup alpine tar czf /backup/padloc-data-$(date +\%Y\%m\%d).tar.gz /data
```

### Recovery

```bash
# Restore from backup directory
docker compose cp ./backup-padloc-data padloc-server:/data
docker compose restart padloc-server

# Restore from volume backup
docker run --rm \
  -v padloc-server-data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd / && tar xzf /backup/padloc-data-YYYYMMDD.tar.gz"
docker compose restart padloc-server
```

### Export Data (User-Level)

1. **From Web Interface**:
   - Settings → **Import/Export**
   - Click **"Export"**
   - Select format (CSV, JSON, encrypted)
   - Download file
   - Store securely (contains unencrypted passwords if CSV!)

2. **Encrypted Export** (Recommended):
   - Format: **Encrypted (*.pls)**
   - Password-protected with master password
   - Safe to store in cloud backups

## Resource Requirements

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| padloc-pwa | 0.25 | 128MB | ~50MB (static assets) |
| padloc-server | 0.5 | 256MB | ~100MB + database |
| **Total** | **0.75** | **384MB** | **~200MB + data** |

Storage grows with:
- Number of password items stored
- File attachments uploaded
- Audit log history
- Number of user accounts (multi-user setups)

**Estimated Growth**:
- 1,000 passwords: ~10MB
- 100 attachments (1MB each): ~100MB
- 5 users with 500 passwords each: ~50MB

## Troubleshooting

### Padloc Won't Start

1. **Check service status:**
   ```bash
   docker compose ps
   docker compose logs padloc-server
   docker compose logs padloc-pwa
   ```

2. **Verify health checks:**
   ```bash
   docker compose exec padloc-server wget --spider http://localhost:3000
   docker compose exec padloc-pwa wget --spider http://localhost:8080
   ```

3. **Check environment variables:**
   ```bash
   docker compose exec padloc-server env | grep -E '(DOMAIN|EMAIL)'
   ```

4. **Verify volumes:**
   ```bash
   docker compose exec padloc-server ls -la /data
   ```

### Email Not Sending (Password Reset/Verification)

1. **Check SMTP credentials:**
   ```bash
   docker compose logs padloc-server | grep -i "email\|smtp"
   ```

2. **Common issues:**
   - Gmail: Requires [App Password](https://myaccount.google.com/apppasswords), not regular password
   - Port 587: Ensure firewall allows outbound SMTP
   - SendGrid: Verify API key has "Mail Send" permission
   - AWS SES: Check email addresses are verified in SES console

3. **Test SMTP manually:**
   ```bash
   docker compose exec padloc-server sh
   # Install telnet if needed
   apk add busybox-extras
   # Test connection
   telnet smtp.gmail.com 587
   ```

4. **Check sender domain:**
   - Some providers require sender email to match domain
   - Verify `PL_EMAIL_FROM` is authorized by your SMTP provider

### Cannot Access Web Interface

1. **Check Traefik routing:**
   ```bash
   docker compose logs | grep traefik
   ```

2. **Verify domain DNS:**
   ```bash
   dig your-domain.com
   # Should point to Dokploy server IP
   ```

3. **Check SSL certificate:**
   ```bash
   curl -I https://your-domain.com
   # Should return 200 OK
   ```

4. **Verify both services are routing:**
   - PWA: `https://your-domain.com` → Should load web interface
   - API: `https://your-domain.com/api` → Should return JSON response

### "Cannot Connect to Server" Error

1. **Check server is running:**
   ```bash
   docker compose ps padloc-server
   # Should show "healthy"
   ```

2. **Verify API routing:**
   ```bash
   curl https://your-domain.com/api
   # Should return JSON response
   ```

3. **Check PWA configuration:**
   ```bash
   docker compose exec padloc-pwa env | grep PL_SERVER_URL
   # Should be: https://your-domain.com/api
   ```

4. **Review server logs:**
   ```bash
   docker compose logs padloc-server --tail=100
   ```

### Database Corruption / Data Loss

1. **Stop services:**
   ```bash
   docker compose down
   ```

2. **Check LevelDB integrity:**
   ```bash
   docker run --rm \
     -v padloc-server-data:/data \
     alpine ls -la /data
   ```

3. **Restore from backup:**
   ```bash
   # See "Recovery" section above
   docker compose cp ./backup-padloc-data padloc-server:/data
   docker compose up -d
   ```

4. **Rebuild database** (if backups unavailable):
   - LevelDB is self-repairing on next startup
   - Check logs for corruption errors
   - May need to re-create vaults from user exports

### Performance Issues

1. **Check resource usage:**
   ```bash
   docker stats padloc-server padloc-pwa
   ```

2. **Increase resource limits** (if needed):
   ```yaml
   # Add to docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: "1.0"
   ```

3. **Check database size:**
   ```bash
   docker compose exec padloc-server du -sh /data
   ```

4. **Optimize LevelDB** (compact database):
   ```bash
   # No built-in compaction command
   # LevelDB auto-compacts during operation
   # Monitor database size growth
   ```

5. **Browser performance:**
   - Clear browser cache
   - Disable browser extensions
   - Check browser console for JavaScript errors (F12)

## Advanced Configuration

### Custom Email Templates

Padloc uses default email templates for verification, password resets, etc. To customize:

1. Create custom templates in `/docs` directory:
   ```bash
   docker compose exec padloc-server sh
   cd /docs
   # Edit templates (HTML format)
   ```

2. Templates include:
   - `verify-email.html` - Email verification
   - `reset-password.html` - Password reset
   - `invite-member.html` - Team invitations

### HTTPS Proxy Configuration

For running behind additional reverse proxies:

```yaml
environment:
  # Trust proxy headers
  PROXY_TRUST: "true"
  # Set real IP header
  REAL_IP_HEADER: "X-Forwarded-For"
```

### Session Timeout

```yaml
environment:
  # Session timeout in seconds (default: 30 days)
  PL_SESSION_TIMEOUT: "2592000"
```

### Rate Limiting

Traefik middleware for API rate limiting:

```yaml
labels:
  - "traefik.http.middlewares.padloc-ratelimit.ratelimit.average=100"
  - "traefik.http.middlewares.padloc-ratelimit.ratelimit.burst=50"
  - "traefik.http.routers.padloc-server.middlewares=padloc-ratelimit@docker"
```

### Multi-User / Team Setup

1. **Organization Accounts**:
   - First user creates organization
   - Invite members via email
   - Assign roles: Owner, Admin, Member
   - Shared vaults for team passwords

2. **Audit Logging**:
   - Track all password access
   - Monitor member activity
   - Export audit logs (CSV)

3. **Access Control**:
   - Vault-level permissions
   - Read-only vs edit access
   - Time-limited sharing

## Migration from Other Password Managers

### From 1Password

1. Export from 1Password:
   - File → Export → 1Password Interchange Format (1PIF)
2. In Padloc:
   - Settings → Import/Export → Import
   - Select "1Password (1PIF)" format
   - Upload exported file

### From LastPass

1. Export from LastPass:
   - More Options → Advanced → Export
   - Save as CSV
2. In Padloc:
   - Settings → Import/Export → Import
   - Select "LastPass (CSV)" format
   - Upload CSV file

### From Bitwarden

1. Export from Bitwarden:
   - Tools → Export Vault
   - Format: JSON
2. In Padloc:
   - Settings → Import/Export → Import
   - Select "Bitwarden (JSON)" format
   - Upload JSON file

### From KeePass

1. Export from KeePass:
   - File → Export → KeePass XML (2.x)
2. In Padloc:
   - Settings → Import/Export → Import
   - Select "KeePass XML" format
   - Upload XML file

**⚠️ Security Note**: Delete exported files immediately after import!

## Upgrading

### Minor Version Upgrade

```bash
# Update image tag in docker-compose.yml
# Example: v4.3.0 → v4.3.1

# Pull new images
docker compose pull

# Restart services
docker compose up -d

# Verify health
docker compose ps
docker compose logs padloc-server --tail=50
```

### Major Version Upgrade

1. **Backup data** (see Backup section above)
2. Read [Padloc release notes](https://github.com/padloc/padloc/releases)
3. Update image tag in docker-compose.yml
4. Test in staging environment first (if available)
5. Deploy to production:
   ```bash
   docker compose pull
   docker compose up -d
   ```
6. Verify all features work:
   - Login with master password
   - Access vaults
   - Test autofill
   - Verify team sharing

### Rollback

```bash
# Change image tag back to previous version
# Example: image: padloc/server:4.3.0

# Pull old images
docker compose pull

# Restart with old version
docker compose up -d

# Restore from backup if needed (see Recovery section)
```

## Security Considerations

### Master Password Security

- ✅ **Use a strong, unique master password** (16+ characters)
- ✅ **Write it down** and store in a secure physical location
- ✅ **Never share** your master password
- ✅ **Cannot be recovered** - if lost, data is permanently inaccessible

### Encryption Architecture

- **Client-Side Encryption**: All data encrypted before leaving your device
- **Zero-Knowledge**: Server never sees unencrypted data
- **End-to-End**: Even with server access, data remains encrypted
- **AES-256-GCM**: Industry-standard encryption algorithm

### SMTP Security

- ✅ **Use App Passwords** for Gmail (not regular password)
- ✅ **Restrict API keys** to "Mail Send" only (SendGrid, Mailgun)
- ✅ **Use TLS** (port 587, not plain 25)
- ✅ **Rotate credentials** periodically

### Network Security

- ✅ **HTTPS-only** (no HTTP access)
- ✅ **HSTS enabled** (1-year preload)
- ✅ **Security headers** (XSS, content-type nosniff)
- ✅ **LetsEncrypt certificates** (auto-renewed)

### Two-Factor Authentication

- ✅ **Enable TOTP** for all accounts (enabled by default)
- ✅ **Save backup codes** in secure offline location
- ✅ **Use authenticator app** (Google Authenticator, Authy, 1Password)
- ✅ **Never disable** without setting up alternative 2FA

### File Attachments

- **Encrypted at rest**: Files stored in encrypted format
- **Size limits**: Configure via `PL_MAX_ATTACHMENT_SIZE`
- **Types allowed**: All file types (encrypted, no server-side scanning)
- **Storage location**: `/attach` volume (encrypted by Padloc)

## Related Resources

- [Padloc GitHub](https://github.com/padloc/padloc)
- [Padloc Official Website](https://padloc.app/)
- [Padloc Documentation](https://docs.padloc.app/)
- [Community Forum](https://github.com/padloc/padloc/discussions)
- [Security Audit Report](https://padloc.app/security/)
- [Dokploy Documentation](https://docs.dokploy.com/)

## Frequently Asked Questions

**Q: Is Padloc truly zero-knowledge?**
A: Yes, all encryption happens client-side. The server only stores encrypted blobs and never sees your master password or unencrypted data.

**Q: Can I recover my master password?**
A: No, by design. This ensures zero-knowledge architecture. Write it down and store securely.

**Q: How do I migrate from LastPass/1Password?**
A: Use Settings → Import/Export → Import and select your password manager's export format.

**Q: Can I use Padloc with teams?**
A: Yes, Padloc supports multi-user organizations with shared vaults, role-based permissions, and audit logging.

**Q: Does Padloc work offline?**
A: Yes, the desktop and mobile apps support offline access. Changes sync when you reconnect.

**Q: What's the difference between LevelDB and MongoDB backends?**
A: LevelDB is file-based, simpler, and suitable for individual/small team use. MongoDB is for large teams with high concurrency needs.

**Q: How do I backup my passwords?**
A: See "Backup and Recovery" section above. Export encrypted (*.pls) from Settings → Import/Export.

**Q: Is two-factor authentication required?**
A: It's strongly recommended and enabled by default. You can disable it, but this significantly reduces security.

**Q: Can I self-host for free?**
A: Yes, Padloc is open-source (AGPL-3.0) and free to self-host. No licensing fees.

**Q: What happens if I forget my SMTP password?**
A: Regenerate credentials from your email provider and update the `PL_EMAIL_PASSWORD` environment variable.

---

**Template Version**: 1.0.0
**Last Updated**: December 2025
**Padloc Version**: v4.3.0
