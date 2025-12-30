# IPFS Public Gateway Checker

**Web-based tool for monitoring and checking the status of public IPFS gateways**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ipfs/public-gateway-checker/blob/master/LICENSE)
[![NGINX](https://img.shields.io/badge/nginx-1.27--alpine-green.svg)](https://hub.docker.com/_/nginx)
[![Docker](https://img.shields.io/badge/docker-compose-blue.svg)](https://docs.docker.com/compose/)

---

## 📖 Overview

IPFS Public Gateway Checker is the official web application for monitoring the health, performance, and availability of public IPFS gateways worldwide. This static web application helps users identify the fastest and most reliable IPFS gateways for their needs.

**Key Features:**
- 🌐 **Gateway Status Monitoring**: Real-time checks of 100+ public IPFS gateways
- ⚡ **Latency Testing**: Measure response times for each gateway
- ✅ **Availability Checking**: Verify gateway uptime and accessibility
- 📊 **Performance Metrics**: Compare gateway speeds and reliability
- 🔍 **Content Verification**: Test if gateways can retrieve specific IPFS content
- 🎯 **Gateway Selection**: Find the best gateway for your location

**Note:** This template deploys the static web application from the official IPFS project (https://ipfs.github.io/public-gateway-checker/), not the fooock/ipfs-gateway-checker which is an early-development alternative.

---

## 🚀 Quick Start

### Prerequisites

**Required:**
1. **Dokploy Instance**: Running Dokploy installation
2. **Domain Name**: A domain or subdomain for the gateway checker (e.g., `ipfs-check.example.com`)

### ⚙️ Deployment Steps

#### Step 1: Deploy in Dokploy

1. **Create New Service** in Dokploy
2. **Select Template**: Choose "IPFS Public Gateway Checker" from templates
3. **Configure Variables**:
   - `Domain`: Your domain (e.g., `ipfs-check.example.com`)
4. **Deploy**: Click "Deploy" and wait for service to start

#### Step 2: Configure DNS

Point your domain to your Dokploy server:

```bash
# A Record
ipfs-check.example.com.  IN  A  <your-server-ip>

# Or CNAME
ipfs-check.example.com.  IN  CNAME  your-server.example.com.
```

**Wait for DNS propagation** (usually 1-5 minutes).

#### Step 3: Access Gateway Checker

1. **Navigate to**: `https://ipfs-check.example.com`
2. **Start Checking**: Click "Check Gateways" to begin monitoring
3. **View Results**: See real-time status, latency, and availability

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GATEWAY_CHECKER_DOMAIN` | ✅ Yes | - | Your domain for the gateway checker (e.g., `ipfs-check.example.com`) |

### Post-Deployment Configuration

This is a static web application with no server-side configuration needed. All gateway checking happens client-side in the browser using JavaScript.

### Customizing the Gateway List

The application uses a built-in list of public IPFS gateways. To customize:

1. **Fork** the official repository: https://github.com/ipfs/public-gateway-checker
2. **Modify** `src/gateways.json` with your custom gateway list
3. **Build** the static site
4. **Deploy** your custom build (requires custom container)

---

## 🔧 Using the Gateway Checker

### Checking Gateway Status

1. **Open** the application in your browser
2. **Click** "Check Gateways" button
3. **Wait** for tests to complete (may take 30-60 seconds)
4. **Review** results:
   - ✅ Green: Gateway is online and working
   - ❌ Red: Gateway is offline or failing
   - 🕐 Time: Response latency in milliseconds

### Finding the Fastest Gateway

1. **Run** the gateway check
2. **Sort** results by latency (click column header)
3. **Note** the fastest gateway URL
4. **Use** that gateway for your IPFS content access

**Example:**
```
Fastest gateway: https://cloudflare-ipfs.com
Use: https://cloudflare-ipfs.com/ipfs/QmXo...
```

### Testing Specific Content

The checker automatically tests each gateway with a known IPFS hash to verify content retrieval. You can use the same approach for your own content:

```
Visit: https://[gateway-url]/ipfs/[your-content-hash]
```

---

## 📊 Understanding Results

### Gateway Status Indicators

| Indicator | Meaning | Action |
|-----------|---------|--------|
| ✅ Online | Gateway responding correctly | Safe to use |
| ❌ Offline | Gateway not responding | Avoid using |
| ⚠️ Slow | High latency (>5000ms) | Use for non-critical content |
| 🔒 Writable | Supports content upload | Can add content |

### Latency Benchmarks

| Latency | Classification | Use Case |
|---------|---------------|----------|
| <500ms | Excellent | Real-time applications |
| 500-2000ms | Good | General content delivery |
| 2000-5000ms | Acceptable | Large file transfers |
| >5000ms | Poor | Backup gateway only |

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Web Browser   │
│  (JavaScript)   │
└────────┬────────┘
         │ HTTPS
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│    Traefik      │──────│  NGINX Alpine   │
│  (SSL + Proxy)  │      │  (Static Site)  │
└─────────────────┘      └─────────────────┘
         ▲
         │
┌─────────────────┐
│  Let's Encrypt  │
│   (Auto SSL)    │
└─────────────────┘
```

**Components:**
- **Traefik**: Reverse proxy with automatic SSL via Let's Encrypt
- **NGINX Alpine**: Lightweight web server serving static HTML/JS/CSS
- **Browser**: Client-side JavaScript performs all gateway checks
- **Let's Encrypt**: Free SSL certificates automatically provisioned

---

## 🔍 Troubleshooting

### Issue 1: Gateway Checks Not Running

**Symptoms:**
- Click "Check Gateways" but nothing happens
- No results displayed

**Solutions:**
1. **Check browser console** for JavaScript errors (F12 → Console)
2. **Verify** static files are loading:
   ```bash
   curl https://ipfs-check.example.com/
   # Should return HTML content
   ```
3. **Clear browser cache** and reload
4. **Try different browser** (Chrome, Firefox, Safari)

### Issue 2: All Gateways Show as Offline

**Symptoms:**
- Every gateway test fails
- All results show ❌ red status

**Solutions:**
1. **Check** your internet connection
2. **Verify** browser can access external sites
3. **Disable** ad blockers (may block IPFS requests)
4. **Check** browser console for CORS errors
5. **Try** accessing a known gateway directly:
   ```
   https://cloudflare-ipfs.com/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/wiki/
   ```

### Issue 3: Cannot Access Application

**Symptoms:**
- Browser shows "Connection refused" or timeout
- 502 Bad Gateway error

**Solutions:**
1. **Check service status** in Dokploy → IPFS Gateway Checker → Logs
2. **Verify DNS** propagation:
   ```bash
   dig ipfs-check.example.com
   ```
3. **Check NGINX** is running:
   ```bash
   docker ps | grep ipfs-gateway-checker
   ```
4. **Review Traefik logs**:
   ```bash
   docker logs traefik 2>&1 | grep ipfs-gateway-checker
   ```

### Issue 4: SSL Certificate Not Working

**Symptoms:**
- Browser shows "Connection not secure"
- Certificate errors

**Solutions:**
1. **Wait** for Let's Encrypt provisioning (can take 2-5 minutes)
2. **Verify DNS** is pointing to correct server
3. **Check Traefik** cert resolver is configured
4. **Review** Traefik logs for ACME errors:
   ```bash
   docker logs traefik 2>&1 | grep acme
   ```

### Issue 5: Slow Page Load

**Symptoms:**
- Application takes long time to load
- Timeout errors

**Solutions:**
1. **Check** NGINX container health:
   ```bash
   docker exec ipfs-gateway-checker-ipfs-gateway-checker wget -qO- http://localhost:80/
   ```
2. **Verify** network connectivity to Dokploy server
3. **Check** server resources (CPU, memory)
4. **Review** NGINX logs:
   ```bash
   docker logs ipfs-gateway-checker-ipfs-gateway-checker
   ```

---

## 🔒 Security Considerations

1. **Static Content**: Application is pure client-side JavaScript (no server-side processing)
2. **HTTPS Required**: Enforced via Traefik for secure gateway testing
3. **Security Headers**: Template includes HSTS, XSS protection, frame denial
4. **No Data Storage**: Application doesn't store any user data or test results
5. **Client-Side Testing**: All gateway checks run in user's browser (privacy-friendly)

---

## 🔄 Updates & Maintenance

### Updating NGINX

To update to a newer NGINX version:

1. **Update** docker-compose.yml:
   ```yaml
   image: nginx:1.27-alpine  # Change to nginx:1.28-alpine
   ```
2. **Redeploy** in Dokploy
3. **Verify** application loads correctly

### Updating Static Content

To update to the latest version of the gateway checker application:

1. **Build** new static site from source:
   ```bash
   git clone https://github.com/ipfs/public-gateway-checker
   cd public-gateway-checker
   npm install
   npm run build
   ```
2. **Copy** build output to NGINX volume
3. **Restart** NGINX service

**Note:** Future versions of this template may include automatic builds from the official repository.

---

## 📚 Resources

### Official Documentation
- **IPFS Gateway Checker**: https://ipfs.github.io/public-gateway-checker/
- **Source Code**: https://github.com/ipfs/public-gateway-checker
- **IPFS Documentation**: https://docs.ipfs.tech/
- **IPFS Gateways**: https://ipfs.github.io/public-gateway-checker/

### Related Projects
- **IPFS Kubo**: https://github.com/ipfs/kubo (IPFS implementation)
- **IPFS Desktop**: https://github.com/ipfs/ipfs-desktop (IPFS desktop app)
- **IPFS Cluster**: https://github.com/ipfs-cluster/ipfs-cluster (IPFS clustering)

### Community
- **IPFS Discord**: https://discord.gg/ipfs
- **IPFS Forums**: https://discuss.ipfs.tech/
- **IPFS GitHub**: https://github.com/ipfs

---

## 📝 License

- **IPFS Public Gateway Checker**: MIT License
- **This Template**: MIT License

---

## 🤝 Contributing

Found an issue or have a suggestion? Please open an issue in the [Dokploy Templates repository](https://github.com/your-org/dokploy-templates).

---

**Template Version**: 1.0.0
**NGINX Version**: 1.27-alpine
**Last Updated**: 2025-12-29

---

## Additional Notes

**Why NGINX Alpine?**
- **Lightweight**: Only ~40MB image size
- **Secure**: Minimal attack surface with Alpine Linux
- **Fast**: NGINX efficiently serves static content
- **Reliable**: Production-grade web server

**Why Static Deployment?**
- **Simple**: No database or backend services needed
- **Fast**: Pure client-side execution
- **Scalable**: Can handle high traffic with minimal resources
- **Privacy**: All checks run in user's browser (no server-side tracking)

**Alternative Deployment:**
For the fooock/ipfs-gateway-checker project (Java/Angular version) requiring custom builds, see the custom container workflow in the Dokploy documentation.
