# IT-Tools

Collection of 45+ handy online tools for developers, with great UX and complete privacy.

## Overview

IT-Tools is a **client-side web application** offering an extensive collection of developer utilities including converters, generators, validators, formatters, and productivity tools. All processing happens entirely in your browser - no data ever leaves your device.

**Key Features:**
- 🛠️ **45+ Developer Tools:** Comprehensive collection for everyday development tasks
- 🔐 **Privacy-First:** All operations happen client-side in your browser
- 🎨 **Great UX:** Clean, intuitive interface with dark mode support
- ⚡ **Fast & Lightweight:** Nginx-served Vue.js SPA for instant loading
- 🌐 **No Setup Required:** Deploy and start using immediately
- 📱 **Responsive Design:** Works on desktop, tablet, and mobile
- 🔍 **Searchable:** Quickly find the tool you need
- 🆓 **Open Source:** GNU GPLv3 licensed

Run your own private instance with this production-ready Dokploy template.

---

## Architecture

```
┌──────────────────────────┐
│       IT-Tools           │
│   (Nginx + Vue.js SPA)   │
│    Client-side only      │
│   Alpine-based Image     │
└──────────────────────────┘
             │
             ▼
     HTTPS (Traefik)
     LetsEncrypt SSL
```

**Simple Architecture:**
- **Single Container:** Nginx serving Vue.js SPA (Alpine-based)
- **Client-Side Processing:** All operations happen in browser
- **No Database:** Stateless application
- **No Backend:** Zero server-side data processing

---

## Tool Categories

### 🔤 Text & String Tools
- **Case Converter:** Convert text between UPPER, lower, Title Case, etc.
- **Regex Tester:** Test regular expressions with syntax highlighting
- **Text Diff:** Compare and visualize differences between two texts
- **Lorem Ipsum Generator:** Generate placeholder text
- **String Obfuscator:** Obfuscate strings for security
- **Markdown to HTML:** Convert Markdown markup to HTML
- **Email Normalizer:** Normalize and validate email addresses

### 🔢 Converters & Encoders
- **Base64 Encode/Decode:** Convert to/from base64 encoding
- **URL Encode/Decode:** Handle special characters in URLs
- **JWT Parser:** Decode and verify JSON Web Tokens
- **Hash Generator:** Generate MD5, SHA1, SHA256, SHA512 hashes
- **UUID Generator:** Create UUIDs (v1, v4, v5)
- **JSON to YAML:** Convert between JSON and YAML formats
- **Roman Numeral Converter:** Convert between Arabic and Roman numerals
- **Number Base Converter:** Convert between binary, octal, decimal, hex

### 📅 Date & Time Tools
- **Date Converter:** Convert between timezones and formats
- **Timestamp Converter:** Unix timestamp conversions
- **Cron Expression Parser:** Validate and explain cron expressions
- **Date Difference Calculator:** Calculate time between dates

### 🎨 Generators
- **QR Code Generator:** Create QR codes from text/URLs
- **Password Generator:** Secure random password generation
- **Hash Generator:** Generate cryptographic hashes
- **Lorem Ipsum Generator:** Generate placeholder content
- **UUID/GUID Generator:** Create unique identifiers

### 🔐 Crypto & Security
- **Password Strength Analyzer:** Test password security
- **Hash Generator:** MD5, SHA family hashes
- **JWT Parser:** Decode JSON Web Tokens
- **Bcrypt Generator:** Generate bcrypt hashes

### 💻 Developer Tools
- **JSON Formatter:** Pretty-print and validate JSON
- **XML Formatter:** Format and validate XML
- **SQL Formatter:** Format SQL queries
- **YAML Validator:** Validate YAML syntax
- **HTML Entities Encoder:** Encode/decode HTML entities
- **CSS Minifier:** Minify CSS code
- **JavaScript Minifier:** Minify JavaScript code

### 🌐 Network & Web Tools
- **URL Parser:** Parse and analyze URLs
- **User Agent Parser:** Parse user agent strings
- **MIME Types:** Look up MIME types
- **IPv4 Address Converter:** Convert IP addresses
- **IPv4 Range Expander:** Expand CIDR notations

### 🖼️ Image & Media Tools
- **Image Converter:** Convert between image formats
- **SVG Placeholder Generator:** Create SVG placeholders
- **Color Converter:** Convert between color formats (HEX, RGB, HSL)

### 📊 Math & Calculations
- **Percentage Calculator:** Calculate percentages
- **Unit Converter:** Convert units (length, weight, temperature, etc.)
- **Roman Numeral Converter:** Convert to/from Roman numerals
- **Math Evaluator:** Evaluate mathematical expressions

---

## Requirements

### System Resources
- **Memory:** 64MB minimum, 128MB recommended
- **CPU:** 0.05 core minimum
- **Storage:** 50MB for image + minimal logs
- **Network:** HTTPS access via domain

### Prerequisites
- Dokploy instance running
- Domain name pointed to your server
- Traefik configured (included with Dokploy)

---

## Configuration Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DOMAIN` | ✅ Yes | - | Domain for accessing IT-Tools (e.g., `tools.example.com`) |

### Variable Details

#### DOMAIN (Required)
The domain where IT-Tools will be accessible. Can be a subdomain or root domain.

**Examples:**
```
tools.example.com
dev-tools.yourdomain.org
it.example.com
```

**Setup:**
1. Create DNS A record pointing to your server IP
2. Wait for DNS propagation (usually 5-15 minutes)
3. Dokploy will automatically provision SSL certificate via LetsEncrypt

---

## Deployment

### Quick Deploy with Dokploy

1. **Add Template in Dokploy:**
   - Navigate to your Dokploy project
   - Click "Create Service" → "From Template"
   - Search for "IT-Tools"

2. **Configure Variables:**
   - `DOMAIN`: Enter your domain (e.g., `tools.example.com`)

3. **Deploy:**
   - Click "Deploy"
   - Wait 30-60 seconds for deployment
   - Service will be available at `https://your-domain.com`

### Manual Deployment

```bash
# Clone repository
git clone https://github.com/yourusername/dokploy-templates
cd dokploy-templates/blueprints/it-tools

# Set environment variable
export DOMAIN=tools.example.com

# Deploy with Docker Compose
docker compose up -d

# Check status
docker compose ps
docker compose logs it-tools
```

---

## Post-Deployment

### 1. Verify Deployment

**Check Container Status:**
```bash
docker compose ps
# Should show it-tools as "healthy"
```

**Check Logs:**
```bash
docker compose logs -f it-tools
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
- Browse tools by category or use search
- No login required
- All tools ready to use immediately

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

## Usage Examples

### Example 1: Generate Secure Password

1. Navigate to `https://your-domain.com`
2. Search for "password" or find "Password Generator"
3. Set length and character requirements
4. Click "Generate"
5. Copy to clipboard

### Example 2: Test Regular Expression

1. Search for "regex" or find "Regex Tester"
2. Enter your pattern in the regex field
3. Paste test string below
4. See matches highlighted in real-time
5. View capture groups and match details

### Example 3: Decode JWT Token

1. Search for "JWT" or find "JWT Parser"
2. Paste your JWT token
3. View decoded header and payload
4. Verify signature (if secret provided)
5. See token expiration and other claims

### Example 4: Format JSON

1. Search for "JSON" or find "JSON Formatter"
2. Paste unformatted JSON
3. Click "Format"
4. View beautifully indented JSON
5. Validate syntax automatically

### Example 5: Convert Base64

1. Search for "base64" or find "Base64 Encode/Decode"
2. Enter text to encode or paste base64 to decode
3. Click convert button
4. Copy result to clipboard
5. Use for API requests, data URIs, etc.

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
docker inspect it-tools | grep traefik

# Check container logs
docker compose logs it-tools

# Verify container is on dokploy-network
docker inspect it-tools | grep dokploy-network
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
docker inspect it-tools --format='{{json .State.Health}}'

# Restart service
docker compose restart it-tools
```

### Issue 3: Tools Not Working

**Symptoms:** Specific tools fail to process input

**Causes:**
- Browser compatibility
- JavaScript errors
- Input validation issues

**Solutions:**
1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for JavaScript errors in Console tab
   - Try in incognito/private mode

2. **Browser Compatibility:**
   - Use modern browser (Chrome 90+, Firefox 88+, Safari 14+)
   - Ensure JavaScript enabled
   - Disable extensions that might interfere

3. **Clear Cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Clear browser cache for your domain

### Issue 4: Slow Loading

**Symptoms:** Application takes long to load

**Causes:**
- Network latency
- Server resources

**Solutions:**
```bash
# Check container resource usage
docker stats it-tools

# Check Nginx logs
docker compose logs it-tools | grep -i error

# Consider using Cloudflare CDN
# Add domain to Cloudflare
# Enable "Proxied" for DNS record (orange cloud)
```

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

### Updating IT-Tools

**Check for Updates:**
```bash
# View current version
docker inspect it-tools | grep Image

# Check latest version
# Visit: https://github.com/CorentinTh/it-tools/releases
```

**Update Process:**
1. **Backup** (optional - stateless app, no data to backup)
2. **Update image version** in `docker-compose.yml`:
   ```yaml
   image: corentinth/it-tools:2024.12.XX-XXXXXXX  # Update version
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
docker compose logs it-tools --tail=100

# Follow logs (real-time)
docker compose logs -f it-tools

# Logs with timestamps
docker compose logs -t it-tools
```

**Log Rotation:**
Nginx logs are minimal (static file serving). Docker handles log rotation automatically with default settings.

### Resource Monitoring

**Check Resource Usage:**
```bash
# Container stats
docker stats it-tools

# Expected usage:
# CPU: < 0.5%
# Memory: 20-40MB
# Network: Minimal (static file serving)
```

---

## Security Considerations

### Client-Side Processing
- **All operations happen in browser** - no data sent to server
- Files and sensitive data never leave your device
- Zero server-side logging of user data
- Complete privacy for sensitive information

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
- Free SSL certificates

### Resource Limits

For shared hosting environments, you can add resource limits:

```yaml
deploy:
  resources:
    limits:
      memory: 128M
      cpus: "0.25"
    reservations:
      memory: 32M
      cpus: "0.05"
```

### Custom Nginx Configuration

If you need to customize Nginx settings (rare), you can mount a custom config:

```yaml
volumes:
  - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

---

## Comparison with Similar Tools

| Feature | IT-Tools | Omni-Tools | CyberChef | Online Services |
|---------|----------|------------|-----------|----------------|
| **Tool Count** | 45+ | 40+ | 300+ | Varies |
| **Focus** | Developer utilities | General utilities | Data analysis | Specific tasks |
| **Privacy** | ✅ Complete (client-side) | ✅ Complete | ✅ Complete | ❌ Data sent to servers |
| **Cost** | ✅ Free (self-hosted) | ✅ Free | ✅ Free | 💰 Often freemium/paid |
| **Setup** | ✅ One-click deploy | ✅ One-click deploy | ✅ One-click deploy | N/A |
| **UX** | ✅ Modern, intuitive | ✅ Modern | ⚠️ Technical | ⚠️ Varies |
| **Search** | ✅ Built-in search | ✅ Category filter | ✅ Search | N/A |
| **Dark Mode** | ✅ Yes | ⚠️ Varies | ✅ Yes | ⚠️ Varies |
| **Mobile Support** | ✅ Responsive | ✅ Responsive | ⚠️ Limited | ✅ Yes |
| **Open Source** | ✅ GPL-3.0 | ✅ MIT | ✅ Apache-2.0 | ❌ Usually proprietary |

---

## FAQ

**Q: Does IT-Tools store my data?**
A: No. All processing happens entirely in your browser. Files and data never touch the server.

**Q: Can I use this offline?**
A: You need internet to load the application initially, but after that, tools work offline until page reload.

**Q: What's the maximum file/data size?**
A: Limited by browser memory. Most tools work well with reasonable data sizes (< 10MB for text, < 100MB for files).

**Q: Can I add custom tools?**
A: Yes, by forking the [GitHub repository](https://github.com/CorentinTh/it-tools) and building a custom image.

**Q: Is it safe to use with sensitive data?**
A: Yes. Client-side processing means data never leaves your device. Your self-hosted instance adds privacy.

**Q: How often are new tools added?**
A: The project is actively maintained. Check the [releases page](https://github.com/CorentinTh/it-tools/releases) for updates.

**Q: Can I customize the appearance?**
A: Built-in dark mode is available. For deeper customization, fork the repository.

**Q: Does it work on mobile browsers?**
A: Yes! Fully responsive design works on tablets and smartphones.

**Q: Can I embed tools on my website?**
A: The application is designed as a standalone tool. Check the license before embedding.

**Q: How does it compare to Omni-Tools?**
A: Both are excellent client-side utility collections. IT-Tools has a developer focus with 45+ tools, while Omni-Tools targets general users with 40+ tools. Choose based on your primary use case.

---

## Resources

- **Official Website:** https://it-tools.tech
- **GitHub Repository:** https://github.com/CorentinTh/it-tools
- **Docker Hub:** https://hub.docker.com/r/corentinth/it-tools
- **Releases:** https://github.com/CorentinTh/it-tools/releases
- **Issues:** https://github.com/CorentinTh/it-tools/issues
- **License:** GNU GPLv3

---

## Contributing

Found a bug or want to suggest a feature?

1. **For template issues:** Open an issue in the Dokploy templates repository
2. **For application issues:** Open an issue at https://github.com/CorentinTh/it-tools/issues
3. **For new tools:** Fork the repository and submit a pull request

---

## License

IT-Tools is released under the GNU General Public License v3.0. See the [original repository](https://github.com/CorentinTh/it-tools) for full license details.

---

**Deployed with ❤️ using Dokploy**
