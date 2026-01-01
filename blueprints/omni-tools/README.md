# Omni-Tools

Self-hosted collection of powerful web-based utilities for everyday tasks with zero ads, zero tracking, and complete privacy.

## Overview

Omni-Tools is a **client-side web application** offering 40+ essential utilities for image/video/audio manipulation, PDF processing, text formatting, mathematical operations, and data transformation. All processing happens entirely in your browser - no data ever leaves your device.

**Key Features:**
- 🎨 **Media Tools:** Image compression, video trimming, audio conversion, GIF creation
- 📄 **PDF Utilities:** Merge, split, compress, convert to images
- 🔤 **Text Tools:** Case conversion, word count, diff checker, password generator
- 🧮 **Math/Data:** Calculator, unit converter, JSON/CSV/XML formatter
- 🌍 **Multi-language:** English, Spanish, French, German, Chinese, Japanese, Hindi, Dutch, Portuguese, Russian
- 🔖 **Bookmarking:** Save favorite tools for quick access
- 🎯 **User-friendly:** Role-based filtering (developer vs general user tools)

Run your own private instance with this production-ready Dokploy template.

---

## Architecture

```
┌──────────────────────────┐
│      Omni-Tools          │
│   (Nginx + React SPA)    │
│    Client-side only      │
│      28MB Image          │
└──────────────────────────┘
             │
             ▼
     HTTPS (Traefik)
     LetsEncrypt SSL
```

**Simple Architecture:**
- **Single Container:** Nginx serving React SPA (28MB Alpine image)
- **Client-Side Processing:** All operations happen in browser
- **No Database:** Stateless application
- **No Backend:** Zero server-side data processing

---

## Requirements

### System Resources
- **Memory:** 128MB minimum, 256MB recommended
- **CPU:** 0.1 core minimum
- **Storage:** 100MB for image + minimal logs
- **Network:** HTTPS access via domain

### Prerequisites
- Dokploy instance running
- Domain name pointed to your server
- Traefik configured (included with Dokploy)

---

## Configuration Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DOMAIN` | ✅ Yes | - | Domain for accessing Omni-Tools (e.g., `tools.example.com`) |
| `LOCIZE_API_KEY` | ❌ No | `""` | Optional API key for localization service ([Locize](https://www.locize.com)) |

### Variable Details

#### DOMAIN (Required)
The domain where Omni-Tools will be accessible. Can be a subdomain or root domain.

**Examples:**
```
tools.example.com
omni.yourdomain.org
example.com
```

**Setup:**
1. Create DNS A record pointing to your server IP
2. Wait for DNS propagation (usually 5-15 minutes)
3. Dokploy will automatically provision SSL certificate via LetsEncrypt

#### LOCIZE_API_KEY (Optional)
If you want to manage translations using the Locize platform, provide your API key here.

**When to use:**
- You're adding custom translations
- Managing multi-language support
- Contributing translations upstream

**When to skip:**
- Using default built-in languages
- Don't need translation management

**Get API key:**
1. Sign up at https://www.locize.com
2. Create a project
3. Copy API key from project settings

---

## Deployment

### Quick Deploy with Dokploy

1. **Add Template in Dokploy:**
   - Navigate to your Dokploy project
   - Click "Create Service" → "From Template"
   - Search for "Omni-Tools"

2. **Configure Variables:**
   - `DOMAIN`: Enter your domain (e.g., `tools.example.com`)
   - `LOCIZE_API_KEY`: Leave blank unless using Locize

3. **Deploy:**
   - Click "Deploy"
   - Wait 30-60 seconds for deployment
   - Service will be available at `https://your-domain.com`

### Manual Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/dokploy-templates
cd dokploy-templates/blueprints/omni-tools

# Set environment variables
export DOMAIN=tools.example.com
export LOCIZE_API_KEY=  # Optional

# Deploy with Docker Compose
docker compose up -d

# Check status
docker compose ps
docker compose logs omni-tools
```

---

## Post-Deployment

### 1. Verify Deployment

**Check Container Status:**
```bash
docker compose ps
# Should show omni-tools as "healthy"
```

**Check Logs:**
```bash
docker compose logs -f omni-tools
# Should show Nginx access logs
```

**Test Health Endpoint:**
```bash
curl -f http://localhost:80/
# Should return HTML content
```

### 2. Access the Application

Navigate to your domain: `https://your-domain.com`

**First Visit:**
- Application loads instantly (client-side SPA)
- Browse tools by category
- Click "Bookmark" on frequently used tools
- Switch language in settings (top-right)

### 3. SSL Certificate

LetsEncrypt certificate is automatically provisioned on first access.

**Verify SSL:**
```bash
curl -I https://your-domain.com
# Should return 200 OK with HTTPS
```

**Certificate Renewal:**
- Automatic via Traefik
- Renews 30 days before expiration
- No manual intervention needed

---

## Tool Categories

### 🎨 Media Tools
- **Image:** Compress, resize, convert formats (JPG, PNG, WebP)
- **Video:** Trim, merge, compress, convert to GIF
- **Audio:** Convert formats, trim, adjust volume
- **GIF:** Create from images or video clips

### 📄 PDF Tools
- **Merge:** Combine multiple PDFs
- **Split:** Extract specific pages
- **Compress:** Reduce file size
- **Convert:** PDF to images (PNG/JPG)

### 🔤 Text Tools
- **Case Converter:** UPPER, lower, Title Case
- **Word Counter:** Character/word/line count
- **Password Generator:** Secure random passwords
- **URL Encoder/Decoder:** Handle special characters
- **Diff Checker:** Compare text differences

### 🧮 Math & Data Tools
- **Calculator:** Scientific calculator
- **Unit Converter:** Length, weight, temperature
- **JSON Formatter:** Pretty print and validate
- **CSV to JSON:** Data transformation
- **XML Formatter:** Validate and format

---

## Troubleshooting

### Issue 1: 404 Not Found

**Symptoms:** Domain shows "404 page not found"

**Causes:**
- DNS not configured
- Traefik routing issue

**Solutions:**
```bash
# Check DNS resolution
nslookup your-domain.com

# Verify Traefik labels
docker inspect omni-tools | grep traefik

# Check container logs
docker compose logs omni-tools

# Verify container is on dokploy-network
docker inspect omni-tools | grep dokploy-network
```

### Issue 2: 502 Bad Gateway

**Symptoms:** Traefik returns 502 error

**Causes:**
- Container not healthy
- Port misconfiguration

**Solutions:**
```bash
# Check container health
docker compose ps
# Should show "healthy" status

# Check health check logs
docker inspect omni-tools --format='{{json .State.Health}}'

# Restart service
docker compose restart omni-tools
```

### Issue 3: Tools Not Working

**Symptoms:** Specific tools fail to process files

**Causes:**
- Browser compatibility
- File size limits
- JavaScript errors

**Solutions:**
1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for JavaScript errors in Console tab
   - Try in incognito/private mode

2. **File Size Limits:**
   - Most tools work best with files < 50MB
   - Video processing may require < 100MB
   - Use desktop software for larger files

3. **Browser Compatibility:**
   - Use modern browser (Chrome 90+, Firefox 88+, Safari 14+)
   - Ensure JavaScript enabled
   - Disable ad blockers that might interfere

### Issue 4: Language Not Changing

**Symptoms:** Language selector doesn't change UI language

**Causes:**
- Browser cache
- Localization not loaded

**Solutions:**
1. Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
2. Clear browser cache for your domain
3. Check if `LOCIZE_API_KEY` is needed for custom translations

### Issue 5: SSL Certificate Error

**Symptoms:** Browser shows "Your connection is not private"

**Causes:**
- Certificate not yet provisioned
- DNS not propagated

**Solutions:**
```bash
# Wait 2-3 minutes for initial certificate provisioning

# Check Traefik logs
docker logs $(docker ps -q -f name=traefik) | grep letsencrypt

# Verify DNS propagation
dig your-domain.com +short
# Should return your server IP

# Check certificate status in browser
# Click on padlock icon → Certificate details
```

---

## Maintenance

### Updating Omni-Tools

**Check for Updates:**
```bash
# View current version
docker inspect omni-tools | grep Image

# Check latest version
# Visit: https://github.com/iib0011/omni-tools/releases
```

**Update Process:**
1. **Backup** (optional - stateless app, no data to backup)
2. **Update image version** in `docker-compose.yml`:
   ```yaml
   image: iib0011/omni-tools:0.7.0  # Update version
   ```
3. **Pull and restart:**
   ```bash
   docker compose pull
   docker compose up -d
   ```
4. **Verify:** Visit domain and test tools

### Log Management

**View Logs:**
```bash
# Recent logs
docker compose logs omni-tools --tail=100

# Follow logs (real-time)
docker compose logs -f omni-tools

# Logs with timestamps
docker compose logs -t omni-tools
```

**Log Rotation:**
Nginx logs are minimal (client-side app). Docker handles log rotation automatically with default settings.

### Resource Monitoring

**Check Resource Usage:**
```bash
# Container stats
docker stats omni-tools

# Expected usage:
# CPU: < 1%
# Memory: 30-50MB
# Network: Minimal (static file serving)
```

---

## Security Considerations

### Client-Side Processing
- **All operations happen in browser** - no data sent to server
- Files never leave your device
- Zero server-side logging of user data
- Complete privacy for sensitive documents

### Server Security
- **HTTPS Only:** All traffic encrypted via LetsEncrypt
- **No Database:** Zero data storage on server
- **Minimal Attack Surface:** Single container, no exposed services
- **Regular Updates:** Keep image updated for security patches

### Recommended Practices
1. **Access Control:** Use Cloudflare Zero Trust Access for private deployments
2. **Firewall:** Ensure only port 443 (HTTPS) is publicly accessible
3. **Updates:** Check for new releases monthly
4. **Monitoring:** Monitor Traefik logs for unusual access patterns

---

## Advanced Configuration

### Custom Nginx Configuration

If you need to customize Nginx settings (rare), you can mount a custom config:

```yaml
volumes:
  - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

### Cloudflare Integration

**Using Cloudflare Proxy:**
1. Add domain to Cloudflare
2. Enable "Proxied" for DNS record (orange cloud)
3. Cloudflare handles SSL termination
4. Optional: Add WAF rules for additional security

**Benefits:**
- DDoS protection
- Global CDN for faster access
- Web Application Firewall
- Analytics and logging

### Resource Limits

For shared hosting environments, you can add resource limits:

```yaml
deploy:
  resources:
    limits:
      memory: 256M
      cpus: "0.5"
    reservations:
      memory: 64M
      cpus: "0.1"
```

---

## Comparison with Alternatives

| Feature | Omni-Tools | Online Services | Desktop Software |
|---------|-----------|----------------|------------------|
| **Privacy** | ✅ Complete (client-side) | ❌ Data sent to servers | ✅ Complete |
| **Cost** | ✅ Free (self-hosted) | 💰 Often freemium/paid | 💰 Often paid |
| **Installation** | ✅ One-click deploy | N/A (web-based) | ❌ Per-device install |
| **Internet Required** | ⚠️ Yes (to load app) | ⚠️ Yes (always) | ✅ No |
| **File Size Limits** | ⚠️ Browser memory limits | ⚠️ Service limits | ✅ Disk limits only |
| **Tool Variety** | ✅ 40+ tools | ⚠️ Varies by service | ⚠️ Single-purpose |
| **Updates** | ✅ Automatic (docker) | ✅ Always latest | ⚠️ Manual updates |
| **Ads** | ✅ None | ❌ Usually present | ✅ None |

---

## FAQ

**Q: Does Omni-Tools store my files?**
A: No. All processing happens entirely in your browser. Files never touch the server.

**Q: Can I use this offline?**
A: No. You need internet to load the application initially, but processing happens locally in your browser.

**Q: What's the maximum file size?**
A: Limited by browser memory. Typically works well with files < 50MB. Video processing may handle up to 100MB.

**Q: Can I customize the tools?**
A: Yes, by modifying the source code. Fork the [GitHub repository](https://github.com/iib0011/omni-tools) and build a custom image.

**Q: Is it safe to use with sensitive documents?**
A: Yes. Client-side processing means documents never leave your device. Your self-hosted instance adds an extra privacy layer.

**Q: How do I add more languages?**
A: Use the LOCIZE_API_KEY integration, or fork the repository and add translations to the source code.

**Q: Can I embed tools on my website?**
A: While technically possible, the application is designed as a standalone interface. Check the license before embedding.

**Q: Does it work on mobile browsers?**
A: Yes! Responsive design works on tablets and smartphones. Some tools may have reduced functionality on mobile due to browser capabilities.

---

## Resources

- **Official Website:** https://github.com/iib0011/omni-tools
- **Docker Hub:** https://hub.docker.com/r/iib0011/omni-tools
- **Releases:** https://github.com/iib0011/omni-tools/releases
- **Issues:** https://github.com/iib0011/omni-tools/issues
- **Localization:** https://www.locize.com

---

## License

Omni-Tools is released under the MIT License. See the [original repository](https://github.com/iib0011/omni-tools) for full license details.

---

## Contributing

Found a bug or want to suggest a feature?

1. **For template issues:** Open an issue in the Dokploy templates repository
2. **For application issues:** Open an issue at https://github.com/iib0011/omni-tools/issues
3. **For translations:** Contribute via Locize or submit PRs to the main repository

---

**Deployed with ❤️ using Dokploy**
