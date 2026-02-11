---
applyTo: "blueprints/**"
---

# Blueprint Development Instructions

When creating or modifying files in `blueprints/`:

## File Structure
Each blueprint requires:
- `docker-compose.yml` - Container orchestration
- `template.toml` - Dokploy configuration
- `[app-name].svg` - Logo/icon
- `README.md` - Setup and usage instructions

## Docker Compose Rules
- **Version**: 3.8+ only
- **Images**: Pinned tags (query Docker Hub for latest stable version)
  ```yaml
  image: grafana/grafana:10.2.0  # ✅ Good
  image: grafana/grafana:latest  # ❌ Bad
  ```
- **Restart policy**: `unless-stopped` on all services
- **Volumes**: Named volumes only, no bind mounts
- **Ports**: Never expose ports (Traefik handles routing)
- **Networks**: Don't define (Dokploy manages networking)

## template.toml Rules
- **Variables section**: Declare all variables in `[variables]` first
- **serviceName**: MUST match compose service name exactly
- **Helpers**: Use Dokploy helpers for secrets
  - `${password:32}` - 32-byte random password
  - `${domain}` - Auto-generated domain
  - `${uuid}` - RFC4122 UUID
  - `${base64:32}` - 32-byte base64 string
- **Environment variables**: Reference user-provided vars like `${CF_API_TOKEN}`

## Cloudflare Integration
If template uses Cloudflare services:
- Use `${CF_ACCOUNT_ID}`, `${CF_API_TOKEN}`, etc. (never hardcode)
- Add `cloudflare` object to meta.json entry
- Document CF prerequisites in README.md
- Include example worker/D1/R2 configuration files

## meta.json Entry
Append entry with:
```json
{
  "id": "app-name",
  "name": "Application Name",
  "version": "1.0.0",
  "description": "Brief description",
  "logo": "app-name.svg",
  "links": {
    "github": "https://github.com/org/repo",
    "website": "https://example.com",
    "docs": "https://docs.example.com"
  },
  "tags": ["category", "feature"],
  "cloudflare": {
    "supported_services": ["Workers", "D1"],
    "optional": true,
    "documentation": "docs/templates/app-cloudflare.md"
  }
}
```

## Validation (must pass before PR)
```bash
# Syntax check
docker compose -f blueprints/[name]/docker-compose.yml config

# Template validation
npm run validate -- blueprints/[name]

# Full test suite
npm run test:coverage
```

## Security
- Never hardcode credentials
- Use `${password:32}` for generated secrets
- Reference user env vars like `${CF_API_TOKEN}`
- Add sensitive vars to `.env.example` (never `.env.local`)

## Naming Conventions
- **Template directories**: `lowercase-with-hyphens`
- **Docker services**: `lowercase` (matches TOML serviceName)
- **Variables**: `UPPER_CASE_WITH_UNDERSCORES` for env vars
- **TOML variables**: `lowercase_with_underscores`

## Design Patterns
Reference `AGENTS.md` section 3 for:
- Pattern 1: Simple Web Service (single container)
- Pattern 2: App + Database Stack (multi-container)
- Pattern 3: Cloudflare-Enhanced Service (CF integration)
