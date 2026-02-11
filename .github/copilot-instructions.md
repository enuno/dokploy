# Dokploy Template Standards

**Project**: Cloudflare-integrated Dokploy templates (enuno/dokploy)  
**Architecture**: Skills-first progressive loading

## Template Triad
- `docker-compose.yml`: v3.8+, pinned image versions, no exposed ports
- `template.toml`: Variable declarations, Traefik routing, env config
- `meta.json`: Registry entry with version, tags, CF integration

## Mandatory Patterns
- **Variables**: `${password:32}`, `${domain}`, `${uuid}` — never hardcode
- **Services**: names MUST match between compose `services:` and TOML `serviceName`
- **Cloudflare**: use `${CF_API_TOKEN}`, never commit credentials
- **Volumes**: named volumes only, no bind mounts
- **Images**: pinned versions (e.g., `grafana:10.2.0`), never `latest`

## Validation
```bash
docker compose -f blueprints/[name]/docker-compose.yml config
npm run validate -- blueprints/[name]
npm run test:coverage  # >80% required
```

## Template Structure
```yaml
# docker-compose.yml
version: "3.8"
services:
  app-name:
    image: org/image:1.0.0
    restart: unless-stopped
    environment:
      - KEY=${VARIABLE_NAME}
    volumes:
      - data:/path
volumes:
  data: {}
```

```toml
# template.toml
[variables]
main_domain = "${domain}"
admin_password = "${password:32}"

[config]
[[config.domains]]
serviceName = "app-name"  # matches compose service
port = 3000
host = "${main_domain}"

[config.env]
ADMIN_PASSWORD = "${admin_password}"
```

## Quality Gates
- [ ] Pinned image version (no `latest`)
- [ ] All variables in `[variables]` section
- [ ] Service names match compose ↔ TOML
- [ ] No hardcoded credentials
- [ ] CF vars use `${CF_*}` pattern
- [ ] Validation passes
- [ ] meta.json entry added
- [ ] README.md created

## Deep Context
- **Skills**: `.claude/skills/dokploy-*` (loaded on demand)
- **Reference**: AGENTS.md sections 2-5
- **Patterns**: AGENTS.md section 5 (Grafana, Pocketbase, CF Workers)
