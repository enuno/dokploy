<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# how would I configure pi-hole to provide DNS-over-HTTPS?

Pi-hole itself cannot speak DNS-over-HTTPS directly; you run a local DoH proxy (most commonly `cloudflared`), then point Pi-hole at that proxy as its only upstream DNS server.[^1_1][^1_2]

## Overview

- Pi-hole continues to answer DNS for your LAN on port 53 like normal.[^1_2]
- A local daemon such as **cloudflared** listens on a non-standard port (commonly 5053) and forwards those queries over HTTPS to a public DoH resolver such as Cloudflare or Google.[^1_3][^1_1]
- In Pi-hole, you configure `127.0.0.1#5053` (or the container’s address) as a custom upstream DNS server so all upstream queries are encrypted in transit.[^1_4][^1_1]

Below assumes bare-metal on a Raspberry Pi; a Docker pattern is included at the end.

***

## Step 1: Install cloudflared (DoH proxy)

On Raspberry Pi OS / Debian, you can use the Cloudflare repo or a static binary; either way, you want the `cloudflared` binary in `/usr/local/bin` and a dedicated user.[^1_1][^1_3]

Example (latest docs pattern):

1. Download and install the binary (simplified; adapt per arch):

```bash
sudo mkdir -p /usr/local/bin
sudo curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
sudo useradd -r -s /usr/sbin/nologin cloudflared
```

2. Create default options file telling it to run as a DNS proxy on port 5053 pointing at your DoH provider:[^1_3][^1_1]

```bash
sudo tee /etc/default/cloudflared >/dev/null <<'EOF'
CLOUDFLARED_OPTS="proxy-dns \
  --address 127.0.0.1 \
  --port 5053 \
  --upstream https://1.1.1.1/dns-query \
  --upstream https://1.0.0.1/dns-query \
  --upstream https://9.9.9.9/dns-query"
EOF
```

    - Change `--upstream` lines if you prefer different providers (e.g. Google: `https://dns.google/dns-query`).[^1_5][^1_3]

***

## Step 2: Create systemd service for cloudflared

1. Create a systemd unit:[^1_1]

```bash
sudo tee /etc/systemd/system/cloudflared.service >/dev/null <<'EOF'
[Unit]
Description=cloudflared DNS over HTTPS proxy
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=cloudflared
EnvironmentFile=/etc/default/cloudflared
ExecStart=/usr/local/bin/cloudflared proxy-dns $CLOUDFLARED_OPTS
Restart=on-failure
RestartSec=10
KillMode=process

[Install]
WantedBy=multi-user.target
EOF
```

2. Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cloudflared
```

3. Sanity check:

```bash
systemctl status cloudflared
dig @127.0.0.1 -p 5053 example.com
```

A valid response confirms the local DoH proxy is working.[^1_6][^1_3]

***

## Step 3: Point Pi-hole at the DoH proxy

Using the Pi-hole web UI:[^1_3][^1_1]

1. Go to **Settings → DNS**.
2. Under **Upstream DNS Servers**, uncheck all pre-defined upstreams on the left.[^1_7][^1_1]
3. In the **Custom 1 (IPv4)** field, set:

```
127.0.0.1#5053
```

4. Click **Save**.

Pi-hole will now forward all upstream lookups to the local cloudflared instance, which then sends them as DNS-over-HTTPS to your configured providers.[^1_1][^1_3]

***

## Step 4: Verify DoH is actually used

Useful checks:[^1_6][^1_3]

- From a client using Pi-hole as DNS:

```bash
dig @<pihole-ip> example.com
```

Then on the Pi-hole host:

```bash
sudo lsof -i :5053
journalctl -u cloudflared -f
```

You should see Pi-hole talking to `127.0.0.1:5053` and cloudflared making HTTPS connections to your DoH endpoints (e.g. Cloudflare IPs).
- Cloudflare’s debug page `https://1.1.1.1/help` will show whether your resolver is Cloudflare and if DoH is in use when hitting it via a browser that uses your Pi-hole.[^1_8][^1_5]

***

## Docker-compose variant (Pi-hole + cloudflared)

If you run Pi-hole in Docker, a clean pattern is two containers on one bridge network:[^1_4]

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: >
      proxy-dns
      --address 0.0.0.0
      --port 5053
      --upstream https://1.1.1.1/dns-query
      --upstream https://1.0.0.1/dns-query
    restart: unless-stopped
    networks: [dnsnet]

  pihole:
    image: pihole/pihole:latest
    environment:
      FTLCONF_DNS_UPSTREAMS: "cloudflared#5053"
    volumes:
      - ./pihole/etc-pihole:/etc/pihole
      - ./pihole/etc-dnsmasq.d:/etc/dnsmasq.d
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "80:80/tcp"
    depends_on:
      - cloudflared
    restart: unless-stopped
    networks: [dnsnet]

networks:
  dnsnet:
    driver: bridge
```

Here Pi-hole resolves to `cloudflared#5053` inside the Docker network, and cloudflared handles the DoH transport.[^1_4]

If you want, next step could be integrating Unbound for validating/recursive DNS locally and then sending only the upstream leg over TLS/HTTPS.
<span style="display:none">[^1_10][^1_11][^1_12][^1_13][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_20][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://docs.pi-hole.net/guides/dns/cloudflared/

[^1_2]: https://www.reddit.com/r/pihole/comments/usqtp3/is_dns_over_https_supported/

[^1_3]: https://pimylifeup.com/rapberry-pi-dns-over-https/

[^1_4]: https://wendyliga.com/blog/pihole-doh-cloudflare/

[^1_5]: https://blog.smittytone.net/2022/05/03/how-to-do-dns-over-https-on-a-raspberry-pi/

[^1_6]: https://discourse.pi-hole.net/t/help-implementing-cloudflared/76471

[^1_7]: https://fullmetalbrackets.com/blog/using-dns-over-https-with-pihole/

[^1_8]: https://paulsorensen.io/secure-dns-cloudflared-pihole/

[^1_9]: https://docs.pi-hole.net/guides/dns/dnscrypt-proxy/

[^1_10]: https://www.youtube.com/watch?v=TAvGvxFj9so

[^1_11]: https://discourse.pi-hole.net/t/enabling-https-for-your-pi-hole-web-interface/5771

[^1_12]: https://www.reddit.com/r/pihole/comments/ohf0fv/doh_with_pihole_unbound_is_it_possible/

[^1_13]: https://discourse.pi-hole.net/t/implementing-dns-over-tls/27538

[^1_14]: https://github.com/devzwf/pihole-dot-doh

[^1_15]: https://discourse.pi-hole.net/t/raspberry-pi-dns-over-https-doh-for-pi-hole-is-this-worth-doing/73941

[^1_16]: https://www.reddit.com/r/pihole/comments/16vwcr8/got_cloudflare_doh_working_with_pihole_dns_over/

[^1_17]: https://discourse.pi-hole.net/t/doh-dot-bypass-pi-hole/80956

[^1_18]: https://www.youtube.com/watch?v=OfcuP01JyOE

[^1_19]: https://docs.pi-hole.net/guides/dns/unbound/

[^1_20]: https://discourse.pi-hole.net/t/after-some-time-or-at-reboot-cloudflared-fails-to-reconnect-to-doh-when-no-other-dns-servers-are-availble/76169


---

# I want to configure pihole so that clients can connect to it using DNS-over-HTTPS

Pi-hole cannot natively accept DNS-over-HTTPS from clients, but you can run a DoH server/relay on the same host (for example with dnscrypt-proxy or AdGuard’s `dnsproxy`) that forwards to Pi-hole on port 53, and point your clients at that DoH endpoint instead.[^2_1][^2_2]

## Architecture

- Pi-hole continues to run a normal DNS server on port 53 (UDP/TCP), doing all filtering as usual.[^2_1]
- A separate **DoH server** listens on HTTPS (typically port 443 or 8443) and terminates DoH from clients.[^2_3][^2_4]
- That DoH server forwards plain DNS to `127.0.0.1:53` (Pi-hole), so all queries still pass through your blocklists.[^2_5][^2_3]

Common components for the DoH server piece are **dnscrypt-proxy 2** (can act as a local DoH server) or AdGuard’s **dnsproxy**.[^2_6][^2_5][^2_3]

***

## Option 1: dnscrypt-proxy as local DoH server

dnscrypt-proxy can both speak DoH upstream and expose **its own DoH listener for your LAN clients**, then forward queries to Pi-hole as an upstream resolver.[^2_3][^2_6]

### 1. Install dnscrypt-proxy

On your Pi-hole host (Raspberry Pi OS / Debian):

```bash
sudo apt-get update
sudo apt-get install -y dnscrypt-proxy
```

Or use the preconfigured `dnscrypt-proxy-pihole` package if you want a turnkey setup focused on DoH/DNSCrypt with Pi-hole.[^2_6]

### 2. Configure it to forward to Pi-hole

Edit the main config (paths vary, often `/etc/dnscrypt-proxy/dnscrypt-proxy.toml`):[^2_3][^2_6]

- Set Pi-hole as the **upstream** DNS server:

```toml
# Disable public resolvers if you only want Pi-hole
server_names = []

# Use Pi-hole as the only upstream
fallback_resolvers = []
# or in 'static' section:
[static.'pihole']
stamp = 'sdns://AAcAAAAAAAAACzEyNy4wLjAuMTo1Mw'  # or just use classic forwarding if supported
```

Simpler pattern (if your dnscrypt-proxy build supports plain DNS upstreams) is to use `forwarding_rules` or `forward` option to send everything to `127.0.0.1:53`.[^2_7][^2_5]

Check your installed version’s docs, but conceptually:

- dnscrypt-proxy listen: `0.0.0.0:443` (DoH) and optionally `0.0.0.0:53` if you want.
- dnscrypt-proxy upstream: `127.0.0.1:53` (Pi-hole).


### 3. Enable the local DoH listener

In `dnscrypt-proxy.toml` configure the **local DoH server**:[^2_3]

```toml
[local_doh]
listen_addresses = ['0.0.0.0:443']
path = "/dns-query"
cert_file = "/etc/dnscrypt-proxy/doh-cert.pem"
key_file = "/etc/dnscrypt-proxy/doh-key.pem"
```

- Generate a cert/key (self-signed or via Let’s Encrypt) for the hostname you will use (e.g. `doh.home.example.com`).
- Make sure port 443 is reachable on the Pi-hole host from your LAN (or Internet, if you want roaming use).

Restart dnscrypt-proxy:

```bash
sudo systemctl enable dnscrypt-proxy
sudo systemctl restart dnscrypt-proxy
```

Now the DoH URL for clients is:

```text
https://doh.home.example.com/dns-query
```


***

## Option 2: AdGuard dnsproxy as DoH server to Pi-hole

AdGuard’s `dnsproxy` is a lightweight binary that can:

- Listen for DoH/DoT on configurable ports.
- Forward queries to an arbitrary upstream such as `127.0.0.1:53`.[^2_5]

Example service:

```bash
sudo wget -O /usr/local/bin/dnsproxy https://github.com/AdguardTeam/dnsproxy/releases/latest/download/dnsproxy-linux-arm64
sudo chmod +x /usr/local/bin/dnsproxy
```

Create `/etc/systemd/system/dnsproxy.service`:[^2_5]

```ini
[Unit]
Description=AdGuard dnsproxy - DoH front-end for Pi-hole
After=network.target

[Service]
ExecStart=/usr/local/bin/dnsproxy \
  --listen-doh 0.0.0.0:443 \
  --tls-crt /etc/dnsproxy/fullchain.pem \
  --tls-key /etc/dnsproxy/privkey.pem \
  --upstream 127.0.0.1:53 \
  --all-servers=false
Restart=always

[Install]
WantedBy=multi-user.target
```

- Put your cert/key in `/etc/dnsproxy`.
- Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now dnsproxy
```

Clients can then use:

```text
https://doh.home.example.com/dns-query
```

(dnsproxy defaults to `/dns-query` path for DoH).

Pi-hole stays untouched and just sees all queries as from `127.0.0.1` (or from the dnsproxy IP), which preserves filtering.[^2_8][^2_5]

***

## Client configuration

Examples:[^2_9][^2_4]

- **Firefox**:
    - Settings → Network Settings → Enable DNS over HTTPS → “Custom provider” → set your URL `https://doh.home.example.com/dns-query`.
- **iOS/macOS encrypted DNS profile**:
    - Generate a DoH configuration profile (there are online generators or native tools) pointing to that URL and install it on the device.[^2_9]
- **Android (private DNS)**:
    - For DoT instead of DoH, configure `dnsproxy` with `--listen-tls :853` and use the hostname in Android Private DNS.

This setup gives your clients an encrypted channel (DoH/DoT) to your network, while still letting Pi-hole do all the blocklist and logging work.
<span style="display:none">[^2_10][^2_11][^2_12][^2_13][^2_14][^2_15][^2_16][^2_17][^2_18][^2_19][^2_20]</span>

<div align="center">⁂</div>

[^2_1]: https://discourse.pi-hole.net/t/can-pihole-act-as-a-doh-or-dot-server/56106

[^2_2]: https://www.reddit.com/r/pihole/comments/kp5ouq/does_pihole_support_doh_as_a_local_server_option/

[^2_3]: https://gist.github.com/julienma/829411892b8036a6d92a47ee057f7f1f

[^2_4]: https://scotthelme.co.uk/running-my-own-doh-relay-and-getting-pihole/

[^2_5]: https://discourse.pi-hole.net/t/using-pihole-with-doh-and-dot-dnscrypt/34724

[^2_6]: https://github.com/mapi68/dnscrypt-proxy-pihole

[^2_7]: https://hndrk.blog/tutorial-pi-hole-and-dnscrypt/

[^2_8]: https://nathancatania.com/posts/pihole-dns-doh/

[^2_9]: https://www.reddit.com/r/pihole/comments/m6od0w/connect_to_pihole_via_dot_or_doh_to_use_it_as/

[^2_10]: https://docs.pi-hole.net/guides/dns/cloudflared/

[^2_11]: https://www.reddit.com/r/pihole/comments/1nhp707/a_local_doh_server/

[^2_12]: https://3os.org/automation/guides/pihole-doh/

[^2_13]: https://pimylifeup.com/rapberry-pi-dns-over-https/

[^2_14]: https://www.reddit.com/r/pihole/comments/168zj6x/dns_over_https_for_pihole/

[^2_15]: https://docs.pi-hole.net/guides/dns/dnscrypt-proxy/

[^2_16]: https://www.reddit.com/r/pihole/comments/qg2lyx/pihole_with_dot_doh_or_dnscrypt/

[^2_17]: https://www.youtube.com/watch?v=TAvGvxFj9so

[^2_18]: https://www.reddit.com/r/pihole/comments/1btuchk/how_can_i_add_doh_to_pihole/

[^2_19]: https://www.youtube.com/watch?v=U2t7tFmS-ag

[^2_20]: https://fullmetalbrackets.com/blog/using-dns-over-https-with-pihole/


---

# can I use traefik as a reverse proxy to connect to DNScrypt -> pihole, all running via docker

Yes, you can absolutely front a DoH/DoT–capable dnscrypt-proxy container with Traefik and have dnscrypt-proxy forward plain DNS to Pi-hole, all on Docker. The key is that Traefik only handles HTTPS/TLS (DoH/DoT), while Pi-hole still listens on raw DNS (53) inside the Docker network.[^3_1][^3_2][^3_3][^3_4]

## High-level topology

- **Clients → Traefik**:
    - DoH: `https://doh.example.com/dns-query` (HTTP router on `websecure` entrypoint).
    - Or DoT: `tcp://dot.example.com:853` (TCP router on `dot` entrypoint).
- **Traefik → dnscrypt-proxy**:
    - For DoH: plain HTTP reverse proxy to `dnscrypt-proxy:3000` (its HTTP DoH listener).
    - For DoT: raw TCP forward to `dnscrypt-proxy:853`.
- **dnscrypt-proxy → Pi-hole**:
    - Upstream server `pihole:53` over the Docker network.
- **Pi-hole → upstream resolvers**: as you like (Unbound, DoH, DNSCrypt, etc.).[^3_3][^3_5]

***

## Example docker-compose snippet

Single Docker network for simplicity:

```yaml
version: "3.8"

networks:
  edge:
    driver: bridge

services:
  traefik:
    image: traefik:v3.1
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.websecure.address=:443
      - --entrypoints.dot.address=:853/tcp
      - --certificatesresolvers.le.acme.tlschallenge=true
      - --certificatesresolvers.le.acme.email=you@example.com
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
    ports:
      - "443:443"
      - "853:853"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - edge

  dnscrypt:
    image: klutchell/dnscrypt-proxy:latest
    container_name: dnscrypt
    networks:
      - edge
    # Expose only inside Docker; Traefik will proxy in
    ports:
      - "0.0.0.0:53:53/udp"   # optional if you also want raw DNS from LAN
    volumes:
      - ./dnscrypt/dnscrypt-proxy.toml:/config/dnscrypt-proxy.toml:ro
    labels:
      - "traefik.enable=true"

      # DoH via HTTPS → /dns-query
      - "traefik.http.routers.doh.rule=Host(`doh.example.com`)"
      - "traefik.http.routers.doh.entrypoints=websecure"
      - "traefik.http.routers.doh.tls.certresolver=le"
      - "traefik.http.services.doh.loadbalancer.server.port=3000"

      # DoT via TCP on 853 (if dnscrypt-proxy is listening on 853)
      - "traefik.tcp.routers.dot.rule=HostSNI(`dot.example.com`)"
      - "traefik.tcp.routers.dot.entrypoints=dot"
      - "traefik.tcp.routers.dot.tls.certresolver=le"
      - "traefik.tcp.services.dot.loadbalancer.server.port=853"

  pihole:
    image: pihole/pihole:latest
    container_name: pihole
    networks:
      - edge
    environment:
      TZ: America/Denver
      WEBPASSWORD: "changeme"
      DNSMASQ_LISTENING: "all"
      # Use dnscrypt directly as upstream if you want, or leave defaults
      # FTLCONF_DNS_UPSTREAMS: "dnscrypt#53"
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "8080:80/tcp"  # or use Traefik to front the web UI separately
    volumes:
      - ./pihole/etc-pihole:/etc/pihole
      - ./pihole/etc-dnsmasq.d:/etc/dnsmasq.d
    restart: unless-stopped
```

This shows Traefik only handling HTTPS/TCP ingress; DNS traffic between dnscrypt-proxy and Pi-hole stays on the `edge` bridge network.[^3_6][^3_1]

***

## dnscrypt-proxy configuration (DoH/DoT listener, Pi-hole upstream)

In `dnscrypt-proxy.toml` for the container above:[^3_4][^3_5]

- Listen for DoH on port 3000 (HTTP, Traefik terminates TLS):

```toml
[local_doh]
listen_addresses = ['0.0.0.0:3000']
path = "/dns-query"
cert_file = ""  # not needed; Traefik does TLS
key_file  = ""
```

- Listen for DoT (optional, if you want Traefik to TCP proxy it with TLS):

```toml
listen_addresses = ['0.0.0.0:53', '0.0.0.0:853']
```

- Forward to Pi-hole as upstream:

```toml
forwarding_rules = '/config/forwarding-rules.txt'
```

And in `/config/forwarding-rules.txt`:

```text
. pihole:53
```

The container can resolve `pihole` by name on the `edge` network.[^3_1]

***

## Traefik routing details

Key points specific to this pattern:[^3_7][^3_8]

- **DoH**:
    - TLS terminates at Traefik on `:443`.
    - HTTP router `doh` routes `/dns-query` for `Host(doh.example.com)` to service `doh` on port 3000 (dnscrypt-proxy).
- **DoT**:
    - TCP router `dot` listens on entrypoint `dot` (`:853`).
    - It uses SNI `dot.example.com` and forwards raw TCP to dnscrypt-proxy on `:853`.
- DNS from dnscrypt to Pi-hole is plain UDP/TCP on `:53` inside Docker; you do **not** proxy that through Traefik.

***

## Client-side usage

- DoH URL for clients:

```text
https://doh.example.com/dns-query
```

- Optional DoT endpoint:

```text
dot.example.com:853
```


Both terminate at Traefik, which forwards to dnscrypt-proxy, which in turn forwards to Pi-hole, preserving all Pi-hole filtering and logs.
<span style="display:none">[^3_10][^3_11][^3_12][^3_13][^3_14][^3_15][^3_16][^3_17][^3_18][^3_19][^3_20][^3_21][^3_22][^3_23][^3_9]</span>

<div align="center">⁂</div>

[^3_1]: https://www.reddit.com/r/pihole/comments/d9cn8h/pihole_unbound_in_dockercompose_using_traefik_as/

[^3_2]: https://discourse.pi-hole.net/t/pi-hole-docker-docker-compose-x86-and-traefik-as-reverse-proxy/5321

[^3_3]: https://discourse.pi-hole.net/t/using-pihole-with-doh-and-dot-dnscrypt/34724

[^3_4]: https://gist.github.com/julienma/829411892b8036a6d92a47ee057f7f1f

[^3_5]: https://hndrk.blog/tutorial-pi-hole-and-dnscrypt/

[^3_6]: https://codecaptured.com/blog/self-hosting-pi-hole-with-docker-and-traefik/

[^3_7]: https://www.reddit.com/r/pihole/comments/fy8zmu/pihole_traefik_dnsovertls/

[^3_8]: https://discourse.pi-hole.net/t/traefik-and-pihole-with-docker-forward-client-ip/45088

[^3_9]: https://www.reddit.com/r/pihole/comments/13x959c/pihole_traefik/

[^3_10]: https://www.reddit.com/r/pihole/comments/15cng9p/pihole_as_dns_server_with_traefik/

[^3_11]: https://community.traefik.io/t/pihole-in-docker-behind-traefik-2-and-cloudflare-and-lets-encrypt/7244

[^3_12]: https://github.com/domisjustanumber/docker-traefik-pihole-companion

[^3_13]: https://www.reddit.com/r/selfhosted/comments/1hb2hpv/help_for_setting_pihole_behind_traefik_reverse/

[^3_14]: https://3os.org/automation/guides/pihole-doh/

[^3_15]: https://fullmetalbrackets.com/blog/reverse-proxy-using-nginx-pihole-cloudflare/

[^3_16]: https://community.traefik.io/t/issues-with-traefik-cloudflare-and-pihole/24734

[^3_17]: https://discourse.pi-hole.net/t/traefik-reverse-proxy-and-pihole/17297

[^3_18]: https://github.com/lorenzo95/dockerfile-pi-hole/blob/master/traefik-docker-compose-example.md

[^3_19]: https://www.reddit.com/r/homelab/comments/1ad7oiq/getting_traefik_pihole_docker_containers_running/

[^3_20]: https://www.reddit.com/r/pihole/comments/oelxpk/using_pihole_with_traefikdocker/

[^3_21]: https://www.reddit.com/r/pihole/comments/1j0qwxb/pihole_v6_behind_reverse_proxy/

[^3_22]: https://discourse.pi-hole.net/t/pihole-behind-traefik/22157

[^3_23]: https://community.traefik.io/t/traefik-and-pihole-with-docker-forward-client-ip/9933


---

# Example docker compose for Traefik dnscrypt and Pi Hole

Yes. Below is a minimal but complete `docker-compose.yml` that runs Traefik, dnscrypt-proxy, and Pi-hole together, with Traefik terminating TLS and reverse-proxying DoH to dnscrypt, which then forwards DNS to Pi-hole.

## Docker compose example

```yaml
version: "3.8"

networks:
  edge:
    driver: bridge

services:
  traefik:
    image: traefik:v3.1
    container_name: traefik
    command:
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.websecure.address=:443
      - --entrypoints.dot.address=:853/tcp
      - --certificatesresolvers.le.acme.email=you@example.com
      - --certificatesresolvers.le.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.le.acme.tlschallenge=true
    ports:
      - "443:443"
      - "853:853"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - edge
    restart: unless-stopped

  dnscrypt:
    image: klutchell/dnscrypt-proxy:latest
    container_name: dnscrypt
    networks:
      - edge
    # Optional: raw DNS from LAN
    # ports:
    #   - "53:53/udp"
    volumes:
      - ./dnscrypt/dnscrypt-proxy.toml:/config/dnscrypt-proxy.toml:ro
    labels:
      - "traefik.enable=true"

      # DoH via HTTPS (Traefik terminates TLS)
      - "traefik.http.routers.doh.rule=Host(`doh.example.com`)"
      - "traefik.http.routers.doh.entrypoints=websecure"
      - "traefik.http.routers.doh.tls.certresolver=le"
      - "traefik.http.services.doh.loadbalancer.server.port=3000"

      # DoT via TCP (optional)
      - "traefik.tcp.routers.dot.rule=HostSNI(`dot.example.com`)"
      - "traefik.tcp.routers.dot.entrypoints=dot"
      - "traefik.tcp.routers.dot.tls.certresolver=le"
      - "traefik.tcp.services.dot.loadbalancer.server.port=853"
    restart: unless-stopped

  pihole:
    image: pihole/pihole:latest
    container_name: pihole
    networks:
      - edge
    environment:
      TZ: America/Denver
      WEBPASSWORD: "changeme"
      DNSMASQ_LISTENING: "all"
      # Use dnscrypt as upstream if desired
      # FTLCONF_DNS_UPSTREAMS: "dnscrypt#53"
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "8080:80/tcp"   # or front web via Traefik too
    volumes:
      - ./pihole/etc-pihole:/etc/pihole
      - ./pihole/etc-dnsmasq.d:/etc/dnsmasq.d
    restart: unless-stopped
```

This pattern (Traefik + Pi-hole + a DNS front-end container) follows the same structure as common Pi-hole-behind-Traefik setups, just adding dnscrypt-proxy as the DoH/DoT layer.[^4_1][^4_2][^4_3]

## dnscrypt-proxy config (forward to Pi-hole, listen for DoH)

Example `./dnscrypt/dnscrypt-proxy.toml`:

```toml
# Listen on 53 for DNS, 853 for DoT (inside Docker), 3000 for DoH (HTTP only)
listen_addresses = ['0.0.0.0:53', '0.0.0.0:853']

[local_doh]
listen_addresses = ['0.0.0.0:3000']
path = "/dns-query"
cert_file = ""  # TLS offloaded to Traefik
key_file  = ""

# Forward everything to Pi-hole
forwarding_rules = '/config/forwarding-rules.txt'
```

`./dnscrypt/forwarding-rules.txt`:

```text
. pihole:53
```

Forwarding like this (dnscrypt → Pi-hole) is exactly how documented Pi-hole + dnscrypt Docker setups chain the services together.[^4_2][^4_4]

## How clients use it

- **DoH URL**: `https://doh.example.com/dns-query`
- **Optional DoT**: `dot.example.com:853`

Both hit Traefik, which terminates TLS and forwards to dnscrypt-proxy, which forwards plain DNS to Pi-hole for filtering.
<span style="display:none">[^4_10][^4_11][^4_12][^4_13][^4_14][^4_15][^4_16][^4_17][^4_18][^4_19][^4_20][^4_5][^4_6][^4_7][^4_8][^4_9]</span>

<div align="center">⁂</div>

[^4_1]: https://codecaptured.com/blog/self-hosting-pi-hole-with-docker-and-traefik/

[^4_2]: https://discourse.pi-hole.net/t/how-do-i-configure-dnscrypt-with-a-docker-pi-hole/46608

[^4_3]: https://discourse.pi-hole.net/t/pi-hole-docker-docker-compose-x86-and-traefik-as-reverse-proxy/5321

[^4_4]: https://github.com/BornToBeRoot/docker-compose

[^4_5]: https://community.traefik.io/t/pihole-in-docker-behind-traefik-2-and-cloudflare-and-lets-encrypt/7244

[^4_6]: https://www.reddit.com/r/pihole/comments/13x959c/pihole_traefik/

[^4_7]: https://discourse.pi-hole.net/t/traefik-and-pihole-with-docker-forward-client-ip/45088

[^4_8]: https://github.com/domisjustanumber/docker-traefik-pihole-companion

[^4_9]: https://codecaptured.com/blog/my-ultimate-self-hosting-setup/

[^4_10]: https://docs.vultr.com/how-to-deploy-pi-hole-dns-sinkhole-service

[^4_11]: https://www.reddit.com/r/Traefik/comments/1h3fgpl/reverse_proxy_to_pihole_docker_container_in_host/

[^4_12]: https://www.reddit.com/r/selfhosted/comments/s634au/complete_guide_with_examples_to_selfhosting_using/

[^4_13]: https://community.traefik.io/t/traefik-in-docker-container-pihole-using-bare-metal-rpi3b-lets-encrypt-delivers-cert-to-traefik-dashboard-page-however-page-shows-404-page-not-found/24619

[^4_14]: https://community.traefik.io/t/traefik-and-pihole-in-docker-swarm/6844

[^4_15]: https://stackoverflow.com/questions/73032978/how-to-configure-traefik-for-dns-over-tls

[^4_16]: https://www.youtube.com/watch?v=2-IkRF8HyCc

[^4_17]: https://www.facebook.com/groups/homeserversetups/posts/2994287784206046/

[^4_18]: https://community.traefik.io/t/traefik-and-pihole-with-docker-forward-client-ip/9933

[^4_19]: https://community.traefik.io/t/pihole-tcp-udp-services-for-port-53-behind-traefik/6719

[^4_20]: https://sensepost.com/blog/2020/building-a-hipster-aware-pi-home-server/

