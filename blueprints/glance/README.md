# Glance

Self-hosted feed dashboard that puts all your content in one place.

## Overview

[Glance](https://github.com/glanceapp/glance) is a lightweight, highly customizable dashboard that displays your feeds in a beautiful, streamlined interface. It aggregates RSS feeds, social media, weather, market data, and more into a single homepage.

This Dokploy template provides a production-ready Glance deployment with:

- Secure HTTPS via Traefik with Let's Encrypt
- Persistent configuration storage
- Security headers for web protection
- Automatic timezone detection

## Features

Glance supports numerous widgets including:

- **RSS/Atom feeds** - Blogs, news, podcasts
- **Reddit** - Subreddit posts
- **YouTube** - Channel videos
- **Twitch** - Live streams
- **GitHub** - Repository releases
- **Hacker News** - Top stories
- **Weather** - Current conditions and forecast
- **Markets** - Stock tickers and crypto prices
- **Calendar** - Upcoming events
- **Clock** - Multiple timezones
- **Bookmarks** - Custom links
- **Docker** - Container status
- **iframe** - Embed external content

## Architecture

```
                    ┌─────────────────────────┐
                    │        Internet         │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   Traefik (HTTPS/TLS)   │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │        Glance           │
                    │    (port 8080 internal) │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │  glance.yml     │    │
                    │  │  (config)       │    │
                    │  └─────────────────┘    │
                    └─────────────────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │    External APIs        │
                    │  (RSS, Reddit, etc.)    │
                    └─────────────────────────┘
```

## Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 0.5 core | 1 core |
| Memory | 64 MB | 128 MB |
| Storage | 10 MB | 50 MB |

Glance is extremely lightweight - single binary under 20MB.

## Configuration Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Your Glance domain | `dash.example.com` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `TZ` | Timezone | `UTC` |

## Deployment

### 1. Create the template in Dokploy

1. Go to your project in Dokploy
2. Add a new Compose service
3. Use the GitHub source: `blueprints/glance/docker-compose.yml`
4. Set the `DOMAIN` environment variable

### 2. Create configuration file

After deployment, create the Glance configuration:

```bash
# Get the container name
docker ps | grep glance

# Create initial config
docker exec <container-name> sh -c 'cat > /app/config/glance.yml << "EOF"
server:
  port: 8080

theme:
  background-color: 225 14 15
  primary-color: 157 47 65
  contrast-multiplier: 1.1

pages:
  - name: Home
    columns:
      - size: small
        widgets:
          - type: clock
            hour-format: 24h
            timezones:
              - timezone: UTC
                label: UTC
              - timezone: America/New_York
                label: New York

          - type: weather
            location: New York, United States
            units: metric

      - size: full
        widgets:
          - type: hacker-news
            limit: 15
            collapse-after: 5

          - type: rss
            title: Tech News
            feeds:
              - url: https://hnrss.org/frontpage
                title: Hacker News
              - url: https://www.theverge.com/rss/index.xml
                title: The Verge

      - size: small
        widgets:
          - type: bookmarks
            groups:
              - title: General
                links:
                  - title: GitHub
                    url: https://github.com
                  - title: Gmail
                    url: https://mail.google.com
EOF'

# Restart container to load config
docker restart <container-name>
```

### 3. Verify deployment

```bash
curl https://your-domain.com/
# Should return HTML dashboard
```

## Configuration Reference

Glance uses YAML configuration. Here's a complete example:

### Basic Structure

```yaml
server:
  port: 8080
  assets-path: /app/assets  # Optional custom assets

theme:
  background-color: 225 14 15      # HSL values
  primary-color: 157 47 65
  positive-color: 115 54 76
  negative-color: 0 70 70
  contrast-multiplier: 1.1
  text-saturation-multiplier: 1.0
  custom-css-file: /app/config/custom.css  # Optional

pages:
  - name: Home
    columns:
      - size: small    # small, full
        widgets: [...]
      - size: full
        widgets: [...]
```

### Widget Examples

#### RSS Feed

```yaml
- type: rss
  title: News
  feeds:
    - url: https://example.com/feed.xml
      title: Example Blog
  limit: 10
  collapse-after: 5
```

#### Weather

```yaml
- type: weather
  location: London, United Kingdom
  units: metric  # metric or imperial
  hour-format: 24h
```

#### Stocks/Crypto

```yaml
- type: markets
  markets:
    - symbol: BTC-USD
      name: Bitcoin
    - symbol: ETH-USD
      name: Ethereum
    - symbol: AAPL
      name: Apple
```

#### YouTube Channel

```yaml
- type: videos
  channels:
    - UCxxxxxx  # Channel ID
  limit: 10
```

#### Reddit

```yaml
- type: reddit
  subreddit: selfhosted
  style: horizontal-cards  # or vertical-list
  limit: 10
```

#### Bookmarks

```yaml
- type: bookmarks
  groups:
    - title: Work
      color: 200 50 50
      links:
        - title: Jira
          url: https://jira.example.com
          icon: si:jira
        - title: Confluence
          url: https://confluence.example.com
```

#### Docker Containers

```yaml
- type: docker-containers
  socket-path: /var/run/docker.sock  # Requires socket mount
```

### Multiple Pages

```yaml
pages:
  - name: Home
    columns: [...]

  - name: Work
    columns: [...]

  - name: Entertainment
    columns: [...]
```

## Customization

### Custom CSS

Create `/app/config/custom.css` and reference in config:

```yaml
theme:
  custom-css-file: /app/config/custom.css
```

### Custom Assets

Mount a directory for custom icons/images:

```yaml
volumes:
  - ./assets:/app/assets
```

Reference in config:
```yaml
server:
  assets-path: /app/assets
```

## Troubleshooting

### Dashboard shows blank page

Check if configuration file exists:

```bash
docker exec <container-name> cat /app/config/glance.yml
```

### Widget shows timeout error

Common causes:
1. **Ad-blocking DNS** (Pi-hole, AdGuard) - Increase rate limit
2. **Network connectivity** - Check container can reach external APIs
3. **Invalid API endpoint** - Verify RSS/API URLs

```bash
# Test connectivity from container
docker exec <container-name> wget -q -O - https://hnrss.org/frontpage | head
```

### YAML parsing errors

YAML is strict about formatting:
- Use spaces, not tabs
- Maintain consistent indentation
- Validate with: https://www.yamllint.com/

### Weather not loading

Location must be recognized by Open-Meteo. Try formats:
- `City, Country`
- `City, State, Country`
- Coordinates: `lat,lon`

## Resources

- [Glance Documentation](https://github.com/glanceapp/glance/blob/main/docs/configuration.md)
- [Glance GitHub](https://github.com/glanceapp/glance)
- [Widget Reference](https://github.com/glanceapp/glance/blob/main/docs/configuration.md#widgets)
- [Theme Customization](https://github.com/glanceapp/glance/blob/main/docs/configuration.md#theme)

## License

Glance is released under the AGPL-3.0 license.
