# useSend - Open Source Email Sending Infrastructure

**Self-hosted email platform as an alternative to Resend, SendGrid, and Postmark**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/usesend/useSend/blob/main/LICENSE)
[![Docker](https://img.shields.io/badge/docker-compose-blue.svg)](https://docs.docker.com/compose/)
[![AWS SES](https://img.shields.io/badge/AWS-SES-orange.svg)](https://aws.amazon.com/ses/)

---

## 📖 Overview

useSend is an open-source email sending infrastructure that leverages Amazon SES for delivery while providing a modern dashboard, API, and management interface. It's designed as a privacy-focused alternative to commercial email platforms.

**Key Features:**
- 📧 **Transactional Emails**: Send emails via REST API or SMTP
- 📊 **Analytics Dashboard**: Track delivery, opens, clicks, and bounces
- 📅 **Email Scheduling**: Schedule emails via API
- 🎯 **Marketing Campaigns**: Manage email marketing campaigns
- 🔐 **OAuth Authentication**: GitHub and Google OAuth support
- 🚀 **REST API**: Modern API for sending emails
- 📨 **SMTP Support**: Legacy SMTP protocol compatibility
- 🔄 **Webhook Support**: Real-time delivery notifications (planned)

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     useSend      │────▶│   PostgreSQL     │     │      Redis       │
│  (Next.js App)   │     │   (Prisma ORM)   │◀────│   (Job Queue)    │
│   Port: 3000     │     │                  │     │                  │
└────────┬─────────┘     └──────────────────┘     └──────────────────┘
         │                        │                        │
         └────────────────────────┴────────────────────────┘
                                  │
                          Internal Network
                                  │
                                  ▼
         ┌────────────────────────────────────────┐
         │           Traefik (HTTPS)              │
         │      Security Headers + SSL            │
         └────────────────────────────────────────┘
                         │
                         ▼
         ┌────────────────────────────────────────┐
         │          AWS SES/SNS                   │
         │    (Email Delivery + Status)           │
         └────────────────────────────────────────┘
```

**Components:**
- **useSend App**: Next.js application with React frontend
- **PostgreSQL**: Primary database (via Prisma ORM)
- **Redis**: Job queue management for async tasks
- **AWS SES**: Email delivery service
- **AWS SNS**: Email status notifications (delivery, bounces, complaints)
- **Traefik**: Reverse proxy with automatic SSL

---

## 🚀 Quick Start

### Prerequisites

**Required:**
1. **Dokploy Instance**: Running Dokploy installation
2. **Domain Name**: A domain for useSend (e.g., `mail.example.com`)
3. **AWS Account**: Active AWS account with SES configured
4. **OAuth Provider**: GitHub OR Google OAuth application

**AWS SES Setup:**
- AWS account moved out of sandbox mode (for production use)
- Verified domain in AWS SES
- IAM user with `AmazonSESFullAccess` and `AmazonSNSFullAccess` policies

---

## 📋 Installation

### Step 1: Configure AWS SES

1. **Create IAM User:**
   ```bash
   # In AWS IAM Console:
   # 1. Create new user with programmatic access
   # 2. Attach policies:
   #    - AmazonSESFullAccess
   #    - AmazonSNSFullAccess
   # 3. Generate Access Key and Secret
   ```

2. **Move Out of Sandbox Mode:**
   - Go to AWS SES Console
   - Request production access
   - Follow AWS verification process
   - **Note**: This may take 24-48 hours

3. **Verify Your Domain:**
   ```bash
   # In AWS SES Console:
   # 1. Go to "Verified identities"
   # 2. Click "Create identity"
   # 3. Select "Domain"
   # 4. Enter your domain (e.g., example.com)
   # 5. Add DNS records provided by AWS
   ```

4. **Configure SNS for Webhooks:**
   - SES automatically creates SNS topics for bounces and complaints
   - useSend will receive these notifications for analytics

### Step 2: Configure OAuth Provider

Choose **at least one** OAuth provider:

#### Option A: GitHub OAuth

1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in details:
   - **Application name**: useSend
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/api/auth/callback/github`
4. Click **Register application**
5. Copy **Client ID** and **Client Secret**

#### Option B: Google OAuth

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project (or select existing)
3. Click **Create Credentials** → **OAuth 2.0 Client ID**
4. Configure OAuth consent screen (if first time)
5. Application type: **Web application**
6. Authorized redirect URIs: `https://your-domain.com/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret**

### Step 3: Deploy useSend in Dokploy

1. **Create New Service** in Dokploy
2. **Select Template**: Choose "useSend" from templates
3. **Configure Variables**:

   **Required:**
   - `Domain`: Your useSend domain (e.g., `mail.example.com`)
   - `AWS Access Key`: From Step 1
   - `AWS Secret Key`: From Step 1
   - `AWS Region`: e.g., `us-east-1` (where your SES is configured)
   - `GitHub ID` + `GitHub Secret`: From Step 2A **OR**
   - `Google Client ID` + `Google Client Secret`: From Step 2B

   **Auto-Generated:**
   - `PostgreSQL Password`: 32-character random password
   - `NextAuth Secret`: 64-character base64 secret

4. **Deploy**: Click "Deploy" and wait for containers to start

### Step 4: Configure DNS

Point your domain to your Dokploy server:

```bash
# A Record
mail.example.com.  IN  A  <your-server-ip>

# Or CNAME
mail.example.com.  IN  CNAME  your-server.example.com.
```

**Wait for DNS propagation** (usually 1-5 minutes).

### Step 5: Access useSend

1. **Navigate to**: `https://mail.example.com`
2. **Sign in** with GitHub or Google OAuth
3. **Configure your first domain** in useSend dashboard
4. **Create API key** for sending emails

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `USESEND_DOMAIN` | ✅ Yes | - | Your useSend domain (e.g., `mail.example.com`) |
| `NEXTAUTH_SECRET` | ✅ Yes | Auto-generated | 64-char base64 secret for NextAuth |
| `POSTGRES_PASSWORD` | ✅ Yes | Auto-generated | PostgreSQL database password |
| `AWS_ACCESS_KEY` | ✅ Yes | - | AWS IAM access key with SES/SNS permissions |
| `AWS_SECRET_KEY` | ✅ Yes | - | AWS IAM secret key |
| `AWS_DEFAULT_REGION` | ✅ Yes | `us-east-1` | AWS region where SES is configured |
| `GITHUB_ID` | ⚠️ One required | - | GitHub OAuth Client ID |
| `GITHUB_SECRET` | ⚠️ One required | - | GitHub OAuth Client Secret |
| `GOOGLE_CLIENT_ID` | ⚠️ One required | - | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ⚠️ One required | - | Google OAuth Client Secret |
| `API_RATE_LIMIT` | No | `100` | API requests per minute |
| `AUTH_EMAIL_RATE_LIMIT` | No | `5` | Auth emails per hour |
| `DISCORD_WEBHOOK_URL` | No | - | Discord webhook for error notifications |

**Note**: You must configure at least one OAuth provider (GitHub OR Google).

### AWS SES Regions

Common AWS regions with SES support:
- `us-east-1` (N. Virginia) - Recommended for best SES features
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)
- `eu-central-1` (Frankfurt)
- `ap-southeast-1` (Singapore)

Check [AWS SES Regions](https://docs.aws.amazon.com/ses/latest/dg/regions.html) for full list.

---

## 📧 Using useSend

### Sending Emails via API

```bash
# Create API key in useSend dashboard first

curl -X POST https://mail.example.com/api/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@example.com",
    "to": "user@example.com",
    "subject": "Welcome to useSend",
    "html": "<h1>Hello!</h1><p>Welcome to our platform.</p>"
  }'
```

### Sending Emails via SMTP

```python
import smtplib
from email.mime.text import MIMEText

# Get SMTP credentials from useSend dashboard

msg = MIMEText("<h1>Hello!</h1>", "html")
msg["Subject"] = "Test Email"
msg["From"] = "noreply@example.com"
msg["To"] = "user@example.com"

with smtplib.SMTP("mail.example.com", 587) as server:
    server.starttls()
    server.login("your-smtp-username", "your-smtp-password")
    server.send_message(msg)
```

### Scheduling Emails

```bash
curl -X POST https://mail.example.com/api/schedule \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "noreply@example.com",
    "to": "user@example.com",
    "subject": "Scheduled Welcome",
    "html": "<p>This email is scheduled</p>",
    "scheduledAt": "2025-01-01T10:00:00Z"
  }'
```

---

## 🔧 Troubleshooting

### Issue 1: OAuth Login Fails

**Symptoms:**
- "OAuth Error" or redirect loop after login
- Cannot authenticate with GitHub/Google

**Solutions:**

1. **Verify OAuth Callback URL:**
   ```
   GitHub: https://your-domain.com/api/auth/callback/github
   Google: https://your-domain.com/api/auth/callback/google
   ```

2. **Check NEXTAUTH_URL:**
   - Ensure it matches your actual domain
   - Must include `https://` protocol

3. **Verify OAuth Credentials:**
   - Check Client ID and Secret are correct
   - Ensure credentials are for the correct OAuth app

4. **Check Browser Console:**
   - Look for CORS errors
   - Verify cookies are being set

### Issue 2: Emails Not Sending (AWS SES)

**Symptoms:**
- API returns success but emails don't arrive
- Dashboard shows failed sends

**Solutions:**

1. **Check SES Sandbox Status:**
   ```bash
   # In AWS SES Console, verify account status
   # If in sandbox, you can only send to verified addresses
   ```

2. **Verify Domain in SES:**
   - Ensure your sending domain is verified in AWS SES
   - Check DNS records (SPF, DKIM, DMARC)

3. **Check IAM Permissions:**
   ```bash
   # Verify IAM user has:
   # - AmazonSESFullAccess
   # - AmazonSNSFullAccess
   ```

4. **Review AWS SES Logs:**
   - Go to AWS CloudWatch Logs
   - Look for SES delivery logs
   - Check for bounce or complaint notifications

5. **Test AWS Credentials:**
   ```bash
   # Use AWS CLI to test
   aws ses send-email \
     --from noreply@example.com \
     --to test@example.com \
     --subject "Test" \
     --text "Test email"
   ```

### Issue 3: Database Connection Errors

**Symptoms:**
- "Database connection failed"
- useSend container keeps restarting

**Solutions:**

1. **Check PostgreSQL Health:**
   ```bash
   # In Dokploy, check postgres container logs
   docker logs usesend-postgres-1
   ```

2. **Verify Database Credentials:**
   - Ensure `POSTGRES_PASSWORD` matches in both services
   - Check `DATABASE_URL` format is correct

3. **Increase PostgreSQL Start Period:**
   - If postgres is slow to start, increase `start_period` in health check

4. **Check Disk Space:**
   ```bash
   # Ensure sufficient disk space for PostgreSQL
   df -h
   ```

### Issue 4: Redis Connection Errors

**Symptoms:**
- "Redis connection refused"
- Job queue not processing

**Solutions:**

1. **Check Redis Health:**
   ```bash
   docker logs usesend-redis-1
   ```

2. **Verify Redis URL:**
   - Ensure `REDIS_URL` is `redis://redis:6379`
   - Check service name matches in docker-compose

3. **Test Redis Connection:**
   ```bash
   docker exec usesend-redis-1 redis-cli ping
   # Should return: PONG
   ```

### Issue 5: SSL Certificate Not Provisioning

**Symptoms:**
- Browser shows "Not Secure"
- Traefik logs show ACME errors

**Solutions:**

1. **Verify DNS Propagation:**
   ```bash
   dig mail.example.com
   # Should point to your server IP
   ```

2. **Check Traefik Logs:**
   ```bash
   docker logs traefik 2>&1 | grep acme
   ```

3. **Ensure Port 80/443 Open:**
   ```bash
   # Check firewall allows HTTP/HTTPS
   sudo ufw status
   ```

4. **Wait for Certificate:**
   - Let's Encrypt can take 1-2 minutes to provision
   - Check Traefik dashboard for certificate status

### Issue 6: High Email Bounce Rate

**Symptoms:**
- Many emails bouncing
- Low delivery rate in dashboard

**Solutions:**

1. **Verify SPF Record:**
   ```bash
   # Add SPF record to your DNS:
   @ IN TXT "v=spf1 include:amazonses.com ~all"
   ```

2. **Configure DKIM:**
   - In AWS SES, enable DKIM for your domain
   - Add DKIM records to DNS

3. **Set up DMARC:**
   ```bash
   # Add DMARC record to DNS:
   _dmarc IN TXT "v=DMARC1; p=none; rua=mailto:dmarc@example.com"
   ```

4. **Check Email Content:**
   - Avoid spam trigger words
   - Include unsubscribe link
   - Use proper HTML formatting

---

## 🔒 Security Considerations

1. **OAuth Security**:
   - Use HTTPS only (enforced by template)
   - Rotate OAuth secrets periodically
   - Limit OAuth app permissions to minimum required

2. **AWS Security**:
   - Use IAM user with minimal permissions (SES + SNS only)
   - Rotate AWS access keys quarterly
   - Enable MFA on AWS account
   - Monitor CloudTrail for unusual SES activity

3. **Database Security**:
   - PostgreSQL is internal only (not exposed externally)
   - Auto-generated strong password
   - Regular backups recommended

4. **API Security**:
   - Rate limiting enabled by default (100 req/min)
   - API keys required for sending emails
   - HTTPS enforced for all API calls

5. **Security Headers**:
   - HSTS enabled (31536000 seconds)
   - XSS protection enabled
   - Content-Type nosniff enabled
   - Frame denial enabled

---

## 📊 Monitoring & Analytics

### Dashboard Metrics

useSend provides built-in analytics:
- **Delivery Rate**: Percentage of emails successfully delivered
- **Open Rate**: Emails opened (requires tracking pixel)
- **Click Rate**: Links clicked in emails
- **Bounce Rate**: Hard and soft bounces
- **Complaint Rate**: Spam reports

### AWS CloudWatch Integration

Monitor SES metrics in AWS CloudWatch:
- Sends
- Bounces
- Complaints
- Reputation metrics

### Optional Discord Notifications

Configure Discord webhook for error notifications:

```yaml
DISCORD_WEBHOOK_URL: https://discord.com/api/webhooks/YOUR_WEBHOOK
```

---

## 🔄 Backup & Maintenance

### Database Backup

```bash
# Backup PostgreSQL database
docker exec usesend-postgres-1 pg_dump -U usesend usesend > usesend-backup.sql

# Restore from backup
docker exec -i usesend-postgres-1 psql -U usesend usesend < usesend-backup.sql
```

### Redis Backup

```bash
# Backup Redis data
docker exec usesend-redis-1 redis-cli SAVE
docker cp usesend-redis-1:/data/dump.rdb ./redis-backup.rdb

# Restore Redis data
docker cp ./redis-backup.rdb usesend-redis-1:/data/dump.rdb
docker restart usesend-redis-1
```

### Update useSend

```bash
# Pull latest image
docker pull usesend/usesend:latest

# Redeploy in Dokploy
# (Dokploy will automatically pull new image and restart)
```

---

## 📚 Resources

### Official Documentation
- **useSend**: https://docs.usesend.com/
- **GitHub Repository**: https://github.com/usesend/useSend
- **Self-Hosting Guide**: https://docs.usesend.com/self-hosting/overview

### AWS Documentation
- **SES Documentation**: https://docs.aws.amazon.com/ses/
- **SNS Documentation**: https://docs.aws.amazon.com/sns/
- **Moving Out of Sandbox**: https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html

### OAuth Setup Guides
- **GitHub OAuth**: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps
- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2

### Email Best Practices
- **Email Deliverability Guide**: https://aws.amazon.com/ses/deliverability-guide/
- **SPF, DKIM, DMARC Setup**: https://www.emailonacid.com/blog/article/email-development/spf-dkim-dmarc/

---

## 🤝 Contributing

Found an issue or have a suggestion? Please open an issue in the [Dokploy Templates repository](https://github.com/your-org/dokploy-templates).

---

## 📝 License

- **useSend**: MIT License
- **This Template**: MIT License

---

**Template Version**: 1.0.0
**useSend Version**: latest
**Last Updated**: 2025-12-29

---

## Sources

- [useSend Documentation](https://docs.usesend.com/self-hosting/overview)
- [useSend GitHub Repository](https://github.com/usesend/useSend)
- [useSend Docker Setup Guide](https://docs.usesend.com/get-started/set-up-docker)
