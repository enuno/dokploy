<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# How to run cloudflared as a sidecar with Pi Hole in Docker

Yes. The typical pattern is to run a small `cloudflared` container on the same Docker network as Pi-hole, have it listen on `:5053` for plain DNS, and then configure Pi-hole to use `cloudflared` as its upstream over that internal network.[^1][^2][^3]

## Docker compose example (Pi-hole + cloudflared)

```yaml
version: "3.8"

networks:
  dnsnet:
    driver: bridge

services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    command: >
      proxy-dns
      --address 0.0.0.0
      --port 5053
      --upstream https://1.1.1.1/dns-query
      --upstream https://1.0.0.1/dns-query
    restart: unless-stopped
    networks:
      - dnsnet

  pihole:
    image: pihole/pihole:latest
    container_name: pihole
    networks:
      - dnsnet
    environment:
      TZ: America/Denver
      WEBPASSWORD: "changeme"
      DNSMASQ_LISTENING: "all"
      # Tell Pi-hole to use cloudflared on the same Docker network
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
```

- `cloudflared` runs in **proxy-dns** mode, accepting standard DNS on `0.0.0.0:5053` and forwarding over DoH to Cloudflare.[^2][^3]
- Pi-hole uses `FTLCONF_DNS_UPSTREAMS="cloudflared#5053"` so it sends all upstream queries to the `cloudflared` service name on the `dnsnet` network.[^4][^2]

After `docker compose up -d`, you can verify in the Pi-hole UI under **Settings → DNS** that the custom upstream is set to `cloudflared#5053`, and then confirm queries are leaving via DoH by checking cloudflared logs or using Cloudflare’s diagnostic page.[^5][^2]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://visibilityspots.org/dockerized-cloudflared-pi-hole.html

[^2]: https://wendyliga.com/blog/pihole-doh-cloudflare/

[^3]: https://docs.pi-hole.net/guides/dns/cloudflared/

[^4]: https://fullmetalbrackets.com/blog/using-dns-over-https-with-pihole/

[^5]: https://paulsorensen.io/secure-dns-cloudflared-pihole/

[^6]: https://discourse.pi-hole.net/t/docker-pi-hole-cloudflared-in-a-container-possible/14904

[^7]: https://www.reddit.com/r/pihole/comments/i3qyol/guide_setting_up_pihole_and_cloudflared_with/

[^8]: https://github.com/cloudflare/cloudflared/issues/237

[^9]: https://www.youtube.com/watch?v=8EpnaccHajo

[^10]: https://mroach.com/2020/08/pi-hole-and-cloudflared-with-docker/

[^11]: https://github.com/aazam476/pihole-doh

[^12]: https://www.reddit.com/r/pihole/comments/sey0bx/should_i_enable_dnssec_in_pihole_while_using/

[^13]: https://chriskirby.net/highly-available-pi-hole-setup-in-kubernetes-with-secure-dns-over-https-doh/

[^14]: https://www.reddit.com/r/pihole/comments/1b7nv02/cloudflared_doh_on_docker/

[^15]: https://www.reddit.com/r/pihole/comments/89pi1j/how_to_implement_cloudflares_1111_dnsoverhttps_on/

[^16]: https://discourse.pi-hole.net/t/help-for-configure-dns-over-https-with-pi-hole-and-cloudflared-in-docker/37283

[^17]: https://discourse.pi-hole.net/t/docker-pi-hole-using-cloudflared-dns-over-https-doh/46592

[^18]: https://www.reddit.com/r/pihole/comments/1122tpd/can_i_use_pihole_with_google_dnscloudflare/

[^19]: https://www.reddit.com/r/pihole/comments/1mz2jej/pihole_cloudflared_dnsoverhttps_in_docker/

[^20]: https://www.reddit.com/r/pihole/comments/u0e4zn/cloudflare_doh_and_dot_not_working/

