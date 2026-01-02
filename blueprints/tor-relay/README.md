# Tor Relay

Run a Tor relay to support the Tor network's anonymous routing infrastructure. This template provides a production-ready deployment for middle relays, bridge relays, or exit relays using The Tor Project's official Docker image.

## Overview

The Tor network relies on thousands of volunteers running relays to provide anonymous internet routing. This template makes it easy to contribute bandwidth to the network while maintaining proper configuration and security.

**Features:**
- Official Tor Project Docker image (thetorproject/obfs4-bridge)
- Support for middle relays (default), bridge relays, and exit relays
- Configurable bandwidth limits to control monthly traffic costs
- Traffic accounting for monthly data caps
- Persistent relay identity across restarts
- Production-grade health monitoring
- Optional obfs4 pluggable transport for bridge mode

## Architecture

```
┌─────────────────────────────────────────┐
│           Tor Relay Container           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      Tor Daemon Process         │   │
│  │  - OR Port: 9001 (Tor Protocol) │   │
│  │  - PT Port: 9002 (obfs4, optional)  │
│  │  - Identity: /var/lib/tor/keys  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Volumes:                               │
│  - tor-data: Relay state               │
│  - tor-keys: Cryptographic identity    │
└─────────────────────────────────────────┘
           │
           ├──▶ Public Internet (OR Port 9001)
           └──▶ Public Internet (PT Port 9002, bridge mode)

Network: Internal (tor-net) for future monitoring
Health: TCP socket check on OR port
```

**Note:** Unlike typical Dokploy templates, Tor relay does NOT use Traefik or HTTPS certificates. It operates as a raw TCP network service on public ports.

## Relay Types

### Middle Relay (Default - Recommended)
**What it does:** Routes encrypted traffic between other Tor nodes
**Legal risk:** Very low (no exit traffic, usually no abuse complaints)
**Bandwidth:** Minimum 10 Mbit/s recommended, 16+ Mbit/s ideal
**Resources:** 512MB RAM for relays under 40 Mbit/s, 1GB for faster
**Best for:** Most users, can run from home or VPS

### Bridge Relay (Censorship Circumvention)
**What it does:** Helps users in censored countries access Tor
**Legal risk:** Low (unlisted in public directory, harder to block)
**Bandwidth:** Minimum 1 Mbit/s, more is better
**Resources:** 256MB RAM minimum
**Best for:** Helping users bypass internet censorship
**Configuration:** Set `RELAY_TYPE=bridge` and configure `PT_PORT`

### Exit Relay (Advanced)
**What it does:** Allows traffic to exit the Tor network to internet
**Legal risk:** HIGH (your IP appears as source of all exited traffic)
**Requirements:**
- Must NOT be run from home
- Requires understanding of legal implications
- ISP/hosting provider must be comfortable with exit traffic
- Expect abuse complaints (DMCA, scanning, etc.)
**Best for:** Experienced operators with dedicated infrastructure

**⚠️ WARNING:** Only run an exit relay if you understand the legal and operational implications. This template defaults to middle relay for safety.

## Requirements

### System Resources

**Minimum (Middle Relay, <40 Mbit/s):**
- RAM: 512MB
- Disk: 1GB (for Tor data and logs)
- Network: 10 Mbit/s upload/download

**Recommended (Middle Relay, 40+ Mbit/s):**
- RAM: 1GB
- Disk: 2GB
- Network: 40+ Mbit/s upload/download

**Connection Capacity:**
- Must handle at least 7,000 concurrent connections
- Fast relays (>100 Mbit/s) may handle 100,000+ connections

### Network Requirements

**Firewall Configuration:**
- Open OR_PORT (default: 9001) for inbound TCP traffic
- If running bridge: Open PT_PORT (default: 9002) for obfs4 traffic
- Ensure ports are forwarded through NAT/firewall

**Uptime:**
- No hard requirement, but ideally run 24/7
- Limited usefulness if not running >2 hours per day
- Frequent restarts reduce relay's value to network

**IPv4/IPv6:**
- IPv4 address not required to be static
- But should remain unchanged for at least 3 hours
- IPv6 support recommended but optional

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `RELAY_NICKNAME` | Relay nickname (alphanumeric, max 19 chars) | `MyTorRelay` |
| `CONTACT_EMAIL` | Contact email for relay operator | `you@example.com` |

### Network Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OR_PORT` | `9001` | ORPort for Tor connections (must be open in firewall) |
| `PT_PORT` | `9002` | Pluggable transport port for bridge mode (empty for middle relay) |
| `RELAY_TYPE` | `middle` | Relay type: `middle`, `bridge`, or `exit` |

### Bandwidth Limits

| Variable | Default | Description |
|----------|---------|-------------|
| `RELAY_BANDWIDTH_RATE` | `100` | Sustained bandwidth in KB/s (kilobytes per second) |
| `RELAY_BANDWIDTH_BURST` | `200` | Burst bandwidth in KB/s |

**Bandwidth Examples:**
- `100` KB/s = ~800 Kbps = ~0.78 Mbps
- `1000` KB/s = ~8 Mbps
- `12500` KB/s = ~100 Mbps

### Traffic Accounting (Optional)

Limit monthly bandwidth to avoid unexpected hosting costs:

| Variable | Default | Description |
|----------|---------|-------------|
| `ACCOUNTING_MAX` | ` ` (empty) | Maximum traffic per accounting period (e.g., `500 GB`, `1 TB`) |
| `ACCOUNTING_START` | ` ` (empty) | Start of accounting period (e.g., `month 1 00:00`) |

**Example:** Limit to 500GB per month starting on the 1st:
```
ACCOUNTING_MAX=500 GB
ACCOUNTING_START=month 1 00:00
```

### MyFamily (Optional)

If you run multiple relays, list their fingerprints:

| Variable | Default | Description |
|----------|---------|-------------|
| `MY_FAMILY` | ` ` (empty) | Comma-separated relay fingerprints |

**Example:** `ABC123DEF456,789GHI012JKL`

This prevents the Tor network from using your relays in the same circuit.

### Advanced Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_ADVANCED_CONFIG` | `0` | Set to `1` to enable additional Tor config via `OBFS4V_*` environment variables |

See: https://gitlab.torproject.org/tpo/anti-censorship/docker-obfs4-bridge

## Deployment

### 1. Configure Firewall

**Ensure these ports are open for inbound traffic:**
```bash
# OR Port (required)
sudo ufw allow 9001/tcp

# PT Port (only for bridge relays)
sudo ufw allow 9002/tcp
```

**For NAT/router setups:**
- Forward OR_PORT (9001) to this server
- If bridge mode: Forward PT_PORT (9002) to this server

### 2. Deploy in Dokploy

1. Create new service in Dokploy
2. Select "Template" deployment
3. Choose "Tor Relay" template
4. Configure required variables:
   - `RELAY_NICKNAME`: Choose a memorable name (alphanumeric, max 19 chars)
   - `CONTACT_EMAIL`: Your contact email (required by Tor network)
5. Configure optional variables:
   - Bandwidth limits (default: 100 KB/s sustained, 200 KB/s burst)
   - Traffic accounting (if you want monthly caps)
   - Relay type (default: middle relay)
6. Deploy

### 3. Verify Deployment

**Check container logs:**
```bash
docker logs tor-relay
```

**Expected output:**
```
[notice] Tor v0.4.x.x running on Linux
[notice] Initialized libevent using epoll
[notice] Bootstrapped 100% (done)
[notice] Your Tor server's identity key fingerprint is 'MyTorRelay <FINGERPRINT>'
[notice] Self-testing indicates your ORPort is reachable from the outside
```

**Verify ports are open:**
```bash
# Check OR port
netstat -tulpn | grep 9001

# From external server
nc -zv YOUR_IP 9001
```

### 4. Retrieve Relay Information

**Get your relay fingerprint:**
```bash
docker exec tor-relay cat /var/lib/tor/fingerprint
```

**For bridge relays, get bridge line:**
```bash
docker exec tor-relay get-bridge-line
```

Share this bridge line with users in censored countries.

### 5. Monitor Relay

**Check Relay Search:**
Visit https://metrics.torproject.org/rs.html and search for your relay nickname. It may take several hours to appear.

**View relay statistics:**
```bash
docker exec tor-relay cat /var/lib/tor/stats/dirreq-stats
```

## Post-Deployment

### Relay Lifecycle

1. **Initial startup:** Relay begins bootstrapping to Tor network
2. **First 3 days:** Relay gains trust, limited traffic
3. **After 7 days:** Relay becomes eligible for Guard status
4. **After 60 days:** Relay reaches full trust, maximum traffic

**Be patient:** New relays take time to gain trust and handle significant traffic.

### Upgrading the Relay

**Update to latest Tor version:**
```bash
docker compose pull tor-relay
docker compose up -d tor-relay
```

**Relay identity persists** across updates via the `tor-keys` volume.

### Bandwidth Monitoring

**Check current bandwidth usage:**
```bash
docker exec tor-relay cat /var/lib/tor/stats/bandwidth
```

**Adjust bandwidth limits:**
Edit `RELAY_BANDWIDTH_RATE` and `RELAY_BANDWIDTH_BURST` in Dokploy, then redeploy.

## Troubleshooting

### Issue 1: Relay Not Reachable

**Symptoms:**
```
[warn] Your server has not managed to confirm reachability for its ORPort
```

**Causes:**
- Firewall blocking OR_PORT
- NAT/port forwarding not configured
- ISP blocking Tor traffic

**Solutions:**
1. Verify firewall allows OR_PORT:
   ```bash
   sudo ufw status | grep 9001
   ```

2. Test from external server:
   ```bash
   nc -zv YOUR_PUBLIC_IP 9001
   ```

3. Check router port forwarding configuration

4. Try different OR_PORT if ISP blocks common Tor ports

### Issue 2: Bandwidth Too Low

**Symptoms:** Relay handles very little traffic despite high limits

**Causes:**
- New relay (needs time to gain trust)
- Bandwidth limits too conservative
- Network connectivity issues

**Solutions:**
1. Wait at least 7 days for relay to gain trust
2. Increase `RELAY_BANDWIDTH_RATE` and `RELAY_BANDWIDTH_BURST`
3. Verify network actually provides advertised speeds
4. Check relay status on metrics.torproject.org

### Issue 3: High Memory Usage

**Symptoms:** Container using more RAM than expected

**Causes:**
- Relay handling large traffic volume
- Memory not properly limited

**Solutions:**
1. Increase server RAM if relay is busy (good problem!)
2. Reduce bandwidth limits:
   ```
   RELAY_BANDWIDTH_RATE=50
   RELAY_BANDWIDTH_BURST=100
   ```

3. Add resource limits to docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 1G
   ```

### Issue 4: Relay Flagged as Bad Exit

**Symptoms:** Relay marked as "BadExit" in metrics

**Cause:** Running exit relay misconfigured or with problematic exit policy

**Solutions:**
1. If you didn't intend to run exit relay:
   ```
   RELAY_TYPE=middle
   ```
   Redeploy immediately.

2. If running intentional exit, review exit policy and address reported issues

3. Contact bad-relays@lists.torproject.org with relay fingerprint

### Issue 5: Accounting Limits Reached

**Symptoms:**
```
[notice] Accounting period ends, relay in hibernation
```

**Cause:** Monthly traffic limit reached

**Solutions:**
1. Wait for accounting period to reset (configured in `ACCOUNTING_START`)
2. Increase `ACCOUNTING_MAX` limit
3. Remove accounting limits entirely (set both to empty strings)

### Issue 6: Container Keeps Restarting

**Check logs:**
```bash
docker logs tor-relay --tail 100
```

**Common causes:**
- Invalid torrc configuration
- Port already in use
- Volume permission issues

**Solutions:**
1. Verify OR_PORT and PT_PORT aren't used by other services
2. Check volume permissions:
   ```bash
   docker volume inspect tor-relay_tor-data
   ```

3. Reset volumes if corrupted:
   ```bash
   docker compose down -v
   docker compose up -d
   ```
   ⚠️ **Warning:** This generates a new relay identity

## Security Considerations

### Relay Identity Protection

**The relay's cryptographic identity is stored in `/var/lib/tor/keys`:**
- This identity is crucial for relay reputation
- Losing it means starting from zero trust
- Docker volume `tor-keys` persists this across restarts
- **Backup recommendation:** Export volume periodically

**Backup relay keys:**
```bash
docker run --rm -v tor-relay_tor-keys:/keys -v $(pwd):/backup \
  alpine tar czf /backup/tor-keys-backup-$(date +%F).tar.gz -C /keys .
```

**Restore relay keys:**
```bash
docker run --rm -v tor-relay_tor-keys:/keys -v $(pwd):/backup \
  alpine tar xzf /backup/tor-keys-backup-YYYY-MM-DD.tar.gz -C /keys
```

### Exit Relay Warnings

**If running exit relay (`RELAY_TYPE=exit`):**
- Your IP will appear as source of all exit traffic
- You WILL receive abuse complaints (DMCA, scanning reports, etc.)
- You MAY face legal inquiries depending on jurisdiction
- Your ISP/hosting provider MUST be comfortable with exit traffic
- Recommend getting a dedicated IP and separate abuse contact email
- Consider joining the Tor Relay Operators mailing list

**Default exit policy is restrictive but still allows most traffic. Configure carefully.**

### Network Exposure

- Tor relay is intentionally public and discoverable
- OR_PORT must be open to internet (unlike typical web apps)
- This is normal and required for relay operation
- Relay identity is public on metrics.torproject.org

### Resource Limits

**Prevent runaway resource usage:**
```yaml
# Add to docker-compose.yml services.tor-relay:
deploy:
  resources:
    limits:
      memory: 1G
      cpus: "2.0"
```

## Performance Tuning

### Bandwidth Optimization

**For fast relays (>100 Mbit/s):**
```
RELAY_BANDWIDTH_RATE=12500  # 100 Mbps
RELAY_BANDWIDTH_BURST=25000 # 200 Mbps burst
```

**For moderate relays (10-40 Mbit/s):**
```
RELAY_BANDWIDTH_RATE=1250   # 10 Mbps
RELAY_BANDWIDTH_BURST=5000  # 40 Mbps burst
```

**For constrained relays (<10 Mbit/s):**
Consider running a bridge relay instead:
```
RELAY_TYPE=bridge
RELAY_BANDWIDTH_RATE=125    # 1 Mbps
PT_PORT=9002                # Enable obfs4
```

### System Limits

**For high-capacity relays, increase connection limits:**

Add to `/etc/sysctl.conf`:
```
net.ipv4.tcp_max_syn_backlog = 8192
net.core.somaxconn = 8192
net.ipv4.tcp_fin_timeout = 30
```

Apply:
```bash
sudo sysctl -p
```

## Resources

### Official Documentation
- Tor Relay Guide: https://community.torproject.org/relay/
- Relay Requirements: https://community.torproject.org/relay/relays-requirements/
- Types of Relays: https://community.torproject.org/relay/types-of-relays/

### Docker Image
- Docker Hub: https://hub.docker.com/u/thetorproject/
- GitLab: https://gitlab.torproject.org/tpo/anti-censorship/docker-obfs4-bridge

### Community
- Tor Relay Operators List: https://lists.torproject.org/cgi-bin/mailman/listinfo/tor-relays
- IRC: #tor-relays on OFTC
- Forum: https://forum.torproject.org/

### Monitoring
- Relay Search: https://metrics.torproject.org/rs.html
- Network Statistics: https://metrics.torproject.org/

## Contributing to Tor

Running a relay is one of the most impactful ways to support internet freedom and privacy. Thank you for contributing bandwidth to the Tor network!

**Ways to maximize impact:**
1. Run relay 24/7 (higher uptime = more trust)
2. Use fast, reliable network connection
3. Run for months/years (long-running relays are most valuable)
4. Consider multiple relays (use MyFamily to link them)
5. Join the tor-relays mailing list for operator updates

## License

This template is provided for running official Tor Project software. Tor is free software under a 3-clause BSD license.

- Template: BSD-3-Clause
- Tor Software: BSD-3-Clause
- Official Tor Project: https://www.torproject.org/
