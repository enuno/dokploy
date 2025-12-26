# Pi-hole - Network-wide Ad Blocking with DNS-over-HTTPS

![Pi-hole](./pihole.svg)

**Complete DNS solution with Cloudflared upstream, DNScrypt DoH server, and Tailscale VPN**

## 📋 Overview

This Dokploy template deploys a production-ready Pi-hole DNS filtering solution with:

- **Pi-hole** - Network-wide ad blocking and DNS filtering
- **Cloudflared** - DNS-over-HTTPS (DoH) upstream resolver using Cloudflare
- **DNScrypt-proxy** - Public DoH server for client access
- **Tailscale** - Private VPN access to Pi-hole web UI and DNS

### Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Public Clients                          │
└────────────┬──────────────────────────────────────────────────┘
             │
             ├─> DoH Requests (HTTPS)
             │   https://pihole.example.com/dns-query
             │
             ▼
      ┌──────────────┐
      │ Host Traefik │ (Dokploy's reverse proxy)
      └──────┬───────┘
             │
             ▼
   ┌───────────────────┐
   │ DNScrypt-proxy    │ (DoH server, port 3000)
   │ (pihole-net +     │
   │  dokploy-network) │
   └─────────┬─────────┘
             │
             ├─> Forwards to Pi-hole
             │
             ▼
    ┌─────────────────────────────────────────────┐
    │  Tailscale Sidecar + Pi-hole (shared net)   │
    │  ┌─────────────┐    ┌──────────────┐       │
    │  │ Tailscale   │◄──▶│   Pi-hole    │       │
    │  │ (VPN)       │    │ (DNS filter) │       │
    │  └─────────────┘    └──────┬───────┘       │
    └──────────────────────────────┼──────────────┘
                                   │
                                   ├─> Upstream DNS (DoH)
                                   │
                                   ▼
                          ┌──────────────┐
                          │ Cloudflared  │ (DoH client, port 5053)
                          │ (pihole-net) │
                          └──────┬───────┘
                                 │
                                 ▼
                          Cloudflare 1.1.1.1
```

### Access Methods

1. **Public DoH Endpoint**: `https://pihole.example.com/dns-query` (encrypted DNS via HTTPS)
2. **Tailscale VPN**: Private access to Pi-hole web UI at `http://<tailscale-ip>/admin`

## ⚡ Quick Start

### 1. Deploy Template

In Dokploy:
1. Navigate to **Templates**
2. Search for **"Pi-hole"**
3. Click **Deploy**

### 2. Configure Required Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `pihole_domain` | ✅ Yes | Domain for DoH endpoint | `pihole.example.com` |
| `pihole_webpassword` | ✅ Yes | Auto-generated (24 chars) | *(auto)* |
| `ts_authkey` | ✅ Yes | Tailscale auth key | `tskey-auth-...` |

### 3. Get Tailscale Auth Key

1. Visit [Tailscale Admin Console](https://login.tailscale.com/admin/settings/keys)
2. Click **Generate auth key**
3. **Recommended settings**:
   - Enable "Reusable"
   - Enable "Ephemeral" (optional)
   - Add tag: `tag:pihole`
4. Copy the key starting with `tskey-auth-`

### 4. Deploy and Wait

Deployment takes ~2-3 minutes. Services start in this order:
1. Cloudflared (DoH upstream)
2. Tailscale (VPN sidecar)
3. Pi-hole (DNS filter)
4. DNScrypt-proxy (DoH server)

## 🔧 Configuration

### Required Configuration

#### Domain Configuration
```toml
pihole_domain = "pihole.example.com"
```

**DNS Setup:**
Point your domain to your Dokploy server IP:
```
A    pihole.example.com    1.2.3.4
```

#### Pi-hole Password
Auto-generated 24-character password. View in Dokploy after deployment.

#### Tailscale Authentication
```toml
ts_authkey = "tskey-auth-..."
```

Get from: https://login.tailscale.com/admin/settings/keys

### Optional Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `tz` | `UTC` | Timezone for Pi-hole logs |
| `ts_extra_args` | `--advertise-tags=tag:pihole --accept-dns=false` | Additional Tailscale flags |
| `pihole_dns_upstream` | `cloudflared#5053` | Upstream DNS server |
| `pihole_dns_listening` | `all` | DNS listening mode |
| `pihole_web_port` | `80` | Pi-hole web UI port |

### Advanced Configuration

#### Custom DNS Upstream

To use a different upstream DNS server:
```toml
pihole_dns_upstream = "1.1.1.1"  # Cloudflare (unencrypted)
pihole_dns_upstream = "8.8.8.8"  # Google DNS
pihole_dns_upstream = "custom-dns#5353"  # Custom service
```

#### Tailscale Tags

Add tags for ACL rules:
```toml
ts_extra_args = "--advertise-tags=tag:pihole,tag:dns --accept-dns=false"
```

## 🌐 Using the DoH Endpoint

### Configure Clients

#### Firefox
1. Settings → Privacy & Security
2. Enable **DNS over HTTPS**
3. Choose **Custom**
4. Enter: `https://pihole.example.com/dns-query`

#### Chrome/Edge
1. Settings → Privacy and security → Security
2. Enable **Use secure DNS**
3. Choose **Custom**
4. Enter: `https://pihole.example.com/dns-query`

#### Android (Private DNS)
1. Settings → Network & internet → Private DNS
2. Choose **Private DNS provider hostname**
3. Enter: `pihole.example.com`
4. **Note**: Android uses DNS-over-TLS (DoT), not DoH. This template provides DoH only.

#### iOS/macOS
Use DNS profile with DoH configuration:
```xml
<dict>
    <key>DNSSettings</key>
    <dict>
        <key>DNSProtocol</key>
        <string>HTTPS</string>
        <key>ServerURL</key>
        <string>https://pihole.example.com/dns-query</string>
    </dict>
</dict>
```

#### Linux systemd-resolved
Edit `/etc/systemd/resolved.conf`:
```ini
[Resolve]
DNS=pihole.example.com
DNSOverTLS=yes
```

## 🔐 Accessing Pi-hole Web UI

Pi-hole web UI is **only accessible via Tailscale VPN** for security.

### Steps:

1. **Install Tailscale** on your device: https://tailscale.com/download

2. **Find Pi-hole IP** in Tailscale network:
   ```bash
   tailscale status | grep pihole
   ```
   Example output: `100.64.0.5    pihole`

3. **Access Web UI**:
   ```
   http://100.64.0.5/admin
   ```

4. **Login** with the auto-generated password (view in Dokploy deployment variables)

### Web UI Features

- **Dashboard**: Query statistics, blocked domains
- **Blocklists**: Manage ad/tracker blocking lists
- **Whitelist/Blacklist**: Custom domain filtering
- **Query Log**: Real-time DNS query monitoring
- **Settings**: Configure DNS, DHCP, API

## 📊 Monitoring

### Service Health

Check service status in Dokploy:
```
✓ cloudflared - DoH upstream healthy
✓ tailscale-pihole - VPN connected
✓ pihole - DNS filtering active
✓ dnscrypt-proxy - DoH server running
```

### Pi-hole Statistics

Via Tailscale web UI (`http://<tailscale-ip>/admin`):
- Total queries
- Queries blocked (%)
- Blocklist size
- Top blocked domains
- Client query distribution

### DNS Testing

Test DoH endpoint:
```bash
curl -H "accept: application/dns-json" \
  "https://pihole.example.com/dns-query?name=example.com&type=A"
```

Expected response:
```json
{
  "Status": 0,
  "TC": false,
  "RD": true,
  "RA": true,
  "AD": false,
  "CD": false,
  "Question": [{"name": "example.com", "type": 1}],
  "Answer": [{"name": "example.com", "type": 1, "TTL": 300, "data": "93.184.216.34"}]
}
```

## 🐛 Troubleshooting

### Issue 1: DoH Endpoint Returns 502 Bad Gateway

**Symptoms**: `https://pihole.example.com/dns-query` returns 502 error

**Causes & Fixes**:
1. **DNScrypt-proxy not healthy**
   ```bash
   docker compose -f blueprints/pihole/docker-compose.yml ps
   ```
   Check if dnscrypt-proxy shows "healthy". If not, check logs:
   ```bash
   docker compose -f blueprints/pihole/docker-compose.yml logs dnscrypt-proxy
   ```

2. **Pi-hole not responding**
   DNScrypt-proxy forwards to Pi-hole. Check Pi-hole health:
   ```bash
   docker compose -f blueprints/pihole/docker-compose.yml logs pihole
   ```

3. **Traefik routing issue**
   Verify dnscrypt-proxy is on `dokploy-network`:
   ```bash
   docker network inspect dokploy-network | grep dnscrypt
   ```

### Issue 2: Cannot Access Pi-hole Web UI via Tailscale

**Symptoms**: `http://<tailscale-ip>/admin` not accessible

**Causes & Fixes**:
1. **Tailscale not connected**
   Check Tailscale status in container:
   ```bash
   docker compose -f blueprints/pihole/docker-compose.yml exec tailscale-pihole tailscale status
   ```

2. **Auth key expired**
   Tailscale auth keys expire. Generate a new reusable key and redeploy:
   ```bash
   # Get new key from: https://login.tailscale.com/admin/settings/keys
   # Update ts_authkey variable in Dokploy
   ```

3. **Firewall blocking**
   Ensure your device is on the Tailscale network:
   ```bash
   tailscale status
   ```

4. **Pi-hole not healthy**
   Check Pi-hole health check:
   ```bash
   docker compose -f blueprints/pihole/docker-compose.yml ps pihole
   ```

### Issue 3: DNS Queries Not Being Blocked

**Symptoms**: Ads still visible, Pi-hole shows 0% blocking

**Causes & Fixes**:
1. **Blocklists not updated**
   Via Tailscale web UI → Tools → Update Gravity

2. **Client not using Pi-hole**
   Verify client DNS configuration points to DoH endpoint

3. **Upstream bypass**
   Some clients may bypass DoH. Check client DNS settings.

### Issue 4: High Memory Usage

**Symptoms**: Pi-hole container using excessive memory

**Causes & Fixes**:
1. **Query log too large**
   Via web UI → Settings → Privacy → Clear query log

2. **Too many blocklists**
   Reduce blocklists via web UI → Group Management → Adlists

3. **Add resource limits**
   Add to docker-compose.yml under pihole service:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
   ```

### Issue 5: Tailscale Connection Refused

**Symptoms**: `tailscale status` fails in container

**Causes & Fixes**:
1. **Capabilities missing**
   Verify `cap_add: [NET_ADMIN, SYS_MODULE]` in docker-compose.yml

2. **Tailscale down**
   Restart tailscale-pihole service:
   ```bash
   docker compose -f blueprints/pihole/docker-compose.yml restart tailscale-pihole
   ```

## 🔒 Security Considerations

### Access Control

- **DoH Endpoint**: Public but encrypted (HTTPS)
- **Web UI**: Private (Tailscale VPN only)
- **DNS Port 53**: Not exposed externally

### Best Practices

1. **Tailscale ACLs**: Configure Tailscale ACL rules to restrict Pi-hole access
   ```json
   {
     "acls": [
       {
         "action": "accept",
         "src": ["group:admins"],
         "dst": ["tag:pihole:*"]
       }
     ]
   }
   ```

2. **Strong Password**: Use the auto-generated 24-character password

3. **Regular Updates**: Keep Docker images updated (check monthly)

4. **Firewall Rules**: Ensure only Dokploy host has public ports 80/443 open

5. **Monitor Logs**: Review Pi-hole query logs for suspicious activity

## 📈 Performance

### Resource Usage

Typical resource consumption (4 services):

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| cloudflared | ~1% | 10 MB | - |
| tailscale-pihole | ~1% | 20 MB | 1 MB |
| pihole | ~5% | 150 MB | 500 MB |
| dnscrypt-proxy | ~1% | 10 MB | 1 MB |
| **Total** | **~8%** | **~190 MB** | **~500 MB** |

### Query Performance

- **DoH Query Latency**: 20-50ms (network dependent)
- **DNS Query Latency**: 1-5ms (cached), 20-100ms (uncached)
- **Throughput**: ~1000 queries/second

### Optimization Tips

1. **Enable Query Caching**: Pi-hole → Settings → DNS → Cache size (10,000 recommended)

2. **Reduce Blocklists**: More lists = slower queries. Use curated lists.

3. **Resource Limits**: Add memory/CPU limits to prevent resource exhaustion

4. **SSD Storage**: Use SSD for faster query log writes

## 🔄 Updates

### Updating Docker Images

1. Edit `blueprints/pihole/docker-compose.yml`
2. Update image tags:
   ```yaml
   image: cloudflare/cloudflared:2025.12.0  # Updated
   image: tailscale/tailscale:stable
   image: pihole/pihole:2025.12.1  # Updated
   image: klutchell/dnscrypt-proxy:v2.1.16  # Updated
   ```
3. Redeploy in Dokploy

### Pi-hole Core Updates

Pi-hole updates automatically within the container. Check via web UI → Tools → Update

### Blocklist Updates

Automatic daily updates at 3:47 AM (configurable in Pi-hole settings).

## 📚 Additional Resources

### Official Documentation

- **Pi-hole**: https://docs.pi-hole.net/
- **Cloudflared**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **DNScrypt**: https://github.com/DNSCrypt/dnscrypt-proxy
- **Tailscale**: https://tailscale.com/kb/

### Community Blocklists

- **OISD**: https://oisd.nl/ (comprehensive, low false positives)
- **Hagezi**: https://github.com/hagezi/dns-blocklists (multi-tier)
- **Developer Dan**: https://www.github.developerdan.com/hosts/

### Tailscale Setup

- **ACL Examples**: https://tailscale.com/kb/1018/acls
- **Auth Keys**: https://tailscale.com/kb/1085/auth-keys

## 🤝 Support

### Getting Help

- **Pi-hole Discourse**: https://discourse.pi-hole.net/
- **Dokploy Discord**: https://discord.gg/dokploy
- **GitHub Issues**: https://github.com/your-repo/issues

### Reporting Bugs

Include:
1. Docker Compose version
2. Dokploy version
3. Service logs (`docker compose logs <service>`)
4. Error messages

## 📄 License

This template follows the licenses of its components:
- **Pi-hole**: EUPL-1.2
- **Cloudflared**: Apache 2.0
- **DNScrypt-proxy**: ISC License
- **Tailscale**: BSD 3-Clause

---

**Maintained by**: Dokploy Community
**Last Updated**: December 25, 2025
**Template Version**: 1.0.0
