# Universal Agent Standards

**Version:** 2.0.0  
**Last Updated:** February 11, 2026  
**Project:** Dokploy Open Source Templates with Cloudflare Services Integration

---

## 1. Quick Reference

### Technology Stack
| Layer | Tech | Version |
|-------|------|---------|
| **Template Engine** | docker-compose.yml + template.toml | TOML 0.5+ |
| **Language** | TypeScript (meta.json generation) | 5.0+ |
| **Container Orchestration** | Docker Compose | 3.8+ |
| **Service Mesh** | Traefik (via Dokploy) | 2.10+ |
| **Edge Services** | Cloudflare Workers/Pages/D1/R2/KV | Latest |
| **Package Manager** | pnpm | 8.0+ |

### Project Structure
```
dokploy/
├── .github/
│   ├── copilot-instructions.md      # Primary Copilot config
│   ├── instructions/                # Path-specific instructions
│   ├── ISSUE_TEMPLATE/              # Issue templates
│   └── workflows/                   # GH Actions + gh-aw
├── .claude/
│   ├── commands/                    # Slash commands
│   └── skills/                      # Dokploy skills
├── blueprints/                      # Templates
│   └── [app-name]/
│       ├── docker-compose.yml
│       ├── template.toml
│       ├── [app].svg
│       └── README.md
├── meta.json                        # Template registry
├── AGENTS.md                        # This file
└── docs/                           # Extended docs
```

---

## 2. Template Anatomy

### Minimal docker-compose.yml
```yaml
version: "3.8"
services:
  app-name:
    image: org/image:1.0.0          # Pinned version
    restart: unless-stopped
    environment:
      - KEY=${VARIABLE_NAME}        # From template.toml
    volumes:
      - data:/path                  # Named volume

volumes:
  data: {}

# ❌ NO: ports, container_name, networks
```

### Minimal template.toml
```toml
[variables]
main_domain = "${domain}"           # Dokploy helper
admin_password = "${password:32}"   # 32-byte random
cf_api_token = "${CF_API_TOKEN}"    # User env var

[config]
[[config.domains]]
serviceName = "app-name"            # MUST match compose
port = 3000
host = "${main_domain}"
path = "/"

[config.env]
ADMIN_PASSWORD = "${admin_password}"
CF_API_TOKEN = "${cf_api_token}"
```

### meta.json Entry Schema
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

---

## 3. Design Patterns

### Pattern 1: Simple Web Service
**Use when:** Single container, minimal dependencies (e.g., Plausible, Grafana)

```yaml
# docker-compose.yml
version: "3.8"
services:
  grafana:
    image: grafana/grafana:10.2.0
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${ADMIN_PASSWORD}
    volumes:
      - grafana-storage:/var/lib/grafana
volumes:
  grafana-storage: {}
```

```toml
# template.toml
[variables]
main_domain = "${domain}"
admin_password = "${password:32}"

[config]
[[config.domains]]
serviceName = "grafana"
port = 3000
host = "${main_domain}"

[config.env]
ADMIN_PASSWORD = "${admin_password}"
```

### Pattern 2: App + Database Stack
**Use when:** Multi-container with persistent database (e.g., Pocketbase + Postgres)

```yaml
# docker-compose.yml
version: "3.8"
services:
  pocketbase:
    image: ghcr.io/pocketbase/pocketbase:latest
    environment:
      - DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
    volumes:
      - pb-data:/pb_data
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  pb-data: {}
  postgres-data: {}
```

### Pattern 3: Cloudflare-Enhanced Service
**Use when:** Integrating CF Workers, D1, R2, or KV

```toml
# template.toml
[variables]
main_domain = "${domain}"
cf_account_id = "${CF_ACCOUNT_ID}"
cf_api_token = "${CF_API_TOKEN}"
cf_d1_db_id = "${CF_D1_DB_ID}"

[config]
[[config.domains]]
serviceName = "api"
port = 3000
host = "${main_domain}"
path = "/api"

[config.env]
CF_ACCOUNT_ID = "${cf_account_id}"
CF_API_TOKEN = "${cf_api_token}"
CF_D1_DB_ID = "${cf_d1_db_id}"

[[config.mounts]]
filePath = "/app/wrangler.toml"
content = """
name = "dokploy-worker"
main = "src/index.js"

[[env.production.d1_databases]]
binding = "D1"
database_id = "${cf_d1_db_id}"
"""
```

---

## 4. CLI Commands

### Template Validation
```bash
# Validate single template
npm run validate -- blueprints/grafana

# Validate all templates
npm run validate:all

# Docker Compose syntax check
docker compose -f blueprints/grafana/docker-compose.yml config

# TOML syntax check
npm run lint:toml blueprints/grafana/template.toml
```

### Testing
```bash
# Run unit tests
npm run test

# Run with coverage (>80% required)
npm run test:coverage

# Test specific template
npm run test -- --grep "grafana"

# Test Cloudflare integration
CF_API_TOKEN=xxx npm run test:cloudflare
```

### Build & Generate
```bash
# Generate/update meta.json
npm run generate:meta

# Build template base64
npm run build:template blueprints/grafana

# Generate template docs
npm run docs:generate blueprints/grafana
```

### Git Workflow
```bash
# Create feature branch
git checkout -b template/new-app-name

# Validate before committing
npm run validate:all && npm run test:coverage

# Commit with proper format
git commit -m "template: feat [app-name]: description"

# Push and open PR
git push origin template/new-app-name
```

---

## 5. Quality Gates

### Pre-Commit Checklist
- [ ] Pinned image version (no `latest`)
- [ ] All variables in `[variables]` section
- [ ] Service names match compose ↔ TOML
- [ ] No hardcoded credentials
- [ ] CF vars use `${CF_*}` pattern
- [ ] Validation passes: `npm run validate:all`
- [ ] Tests pass: `npm run test:coverage`
- [ ] meta.json entry added
- [ ] README.md created with setup instructions
- [ ] Logo SVG added

### Commit Message Format
```
[scope]: [type] [description]

Scope: template, docs, test, chore
Type: feat, fix, docs, test, refactor

Examples:
✅ template: feat grafana: add cloudflare cdn integration
✅ template: fix pocketbase: correct d1 database migration
✅ docs: update cloudflare setup guide
✅ test: add cf api endpoint tests
```

---

## 6. Security Standards

### Never Commit
- `.env.local` (local secrets)
- `*.pem`, `*.key` (SSH keys)
- `CF_API_TOKEN`, `CF_R2_SECRET_KEY` (Cloudflare credentials)
- Database passwords in code
- Any PII or sensitive data

### Variable Patterns
```toml
# ✅ CORRECT
cf_api_token = "${CF_API_TOKEN}"        # References env var
postgres_password = "${password:32}"    # Generated

# ❌ WRONG
cf_api_token = "sk_live_abc123xyz"      # Hardcoded
postgres_password = "password123"       # Insecure
```

---

## 7. API Documentation References

| Service | Documentation |
|---------|--------------|
| **Dokploy** | https://docs.dokploy.com |
| **Cloudflare API** | https://developers.cloudflare.com/api |
| **Cloudflare D1** | https://developers.cloudflare.com/d1 |
| **Cloudflare Workers** | https://developers.cloudflare.com/workers |
| **Cloudflare R2** | https://developers.cloudflare.com/r2 |
| **Docker Compose** | https://docs.docker.com/compose |
| **TOML Spec** | https://toml.io |

---

**Maintained By:** Ryno Crypto Mining Services - ServerDomes Network Engineering  
**Contributors:** See contributors.md
